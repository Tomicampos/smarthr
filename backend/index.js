// index.js
require('dotenv').config();
const express        = require('express');
const cors           = require('cors');
const pool           = require('./db');
const bcrypt         = require('bcryptjs');
const jwt            = require('jsonwebtoken');
const { google }     = require('googleapis');
const multer         = require('multer');
const fs             = require('fs');
const pdfParse       = require('pdf-parse');
const { PDFDocument }= require('pdf-lib');
const csvParser      = require('csv-parser');
const fastCsv        = require('fast-csv');

const JWT_SECRET = process.env.JWT_SECRET;
const app        = express();
const PORT       = process.env.PORT || 3001;

// ── Ajuste: exponer Content-Disposition para que el frontend lo lea ──
app.use(
  cors({
    exposedHeaders: ['Content-Disposition']
  })
);
// ───────────────────────────────────────────────────────────────────
app.use(express.json());
// ── Multer (carpetas temporales) ───────────────────────────
const uploadUsers       = multer({ dest: 'tmp_users/' });
const uploadDocs        = multer({ dest: 'tmp_docs/' });
const uploadEmpleadoDoc = multer({ dest: 'tmp_emp_docs/' });

app.use(cors());
app.use(express.json());

// ─── AUTH MIDDLEWARE ────────────────────────────────────────
function authMiddleware(req, res, next) {
  const auth  = req.headers.authorization || '';
  const token = auth.replace(/^Bearer\s+/i, '');
  jwt.verify(token, JWT_SECRET, (err, payload) => {
    if (err) return res.status(401).json({ message: 'Token inválido' });
    req.user = payload;
    next();
  });
}

// ─── RUTAS PÚBLICAS ──────────────────────────────────────────

// Ruta de prueba
app.get('/', (req, res) => {
  res.send('Backend funcionando correctamente.');
});

// Login y generación de JWT
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const [rows] = await pool.query(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );
    if (!rows.length) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    const u = rows[0];
    const ok = await bcrypt.compare(password, u.password);
    if (!ok) {
      return res.status(400).json({ message: 'Contraseña incorrecta' });
    }
    const token = jwt.sign(
      { id: u.id, email: u.email, rol: u.rol },
      JWT_SECRET,
      { expiresIn: '2h' }
    );
    res.json({ token });
  } catch (err) {
    console.error('Error en /login:', err);
    res.status(500).json({ message: 'Error interno' });
  }
});

// ─── PROTEGEMOS TODO /api ─────────────────────────────────────
app.use('/api', authMiddleware);

// ─── CRUD DE USUARIOS ──────────────────────────────────────────

// Listar usuarios
app.get('/api/users', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, nombre, email, rol FROM users'
    );
    res.json(rows);
  } catch (err) {
    console.error('Error listando users:', err);
    res.status(500).json({ error: 'Error listando users' });
  }
});

// Crear usuario
app.post('/api/users', async (req, res) => {
  const { id, nombre, email, password, rol } = req.body;
  if (!['empleado','admin'].includes(rol)) {
    return res.status(400).json({ message: 'Rol inválido' });
  }
  try {
    const hash = await bcrypt.hash(password, 10);
    await pool.query(
      'INSERT INTO users (id,nombre,email,password,rol) VALUES (?,?,?,?,?)',
      [Number(id), nombre, email, hash, rol]
    );
    res.status(201).json({ id, nombre, email, rol });
  } catch (err) {
    console.error('Error creando usuario:', err);
    res.status(500).json({ error: 'Error interno al crear usuario' });
  }
});

// Actualizar usuario
app.put('/api/users/:id', async (req, res) => {
  const { nombre, email, rol } = req.body;
  if (!['empleado','admin'].includes(rol)) {
    return res.status(400).json({ message: 'Rol inválido' });
  }
  try {
    await pool.query(
      'UPDATE users SET nombre=?,email=?,rol=? WHERE id=?',
      [nombre, email, rol, Number(req.params.id)]
    );
    res.json({ id: Number(req.params.id), nombre, email, rol });
  } catch (err) {
    console.error('Error actualizando usuario:', err);
    res.status(500).json({ error: 'Error actualizando user' });
  }
});

// Borrar usuario
app.delete('/api/users/:id', async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM users WHERE id=?',
      [Number(req.params.id)]
    );
    res.status(204).end();
  } catch (err) {
    console.error('Error borrando user:', err);
    res.status(500).json({ error: 'Error borrando user' });
  }
});

// ─── EXPORTAR / IMPORTAR CSV ───────────────────────────────────

// Exportar CSV de usuarios
app.get('/api/users/export', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, nombre AS name, email, rol FROM users'
    );
    res.setHeader('Content-Type','text/csv');
    res.setHeader('Content-Disposition','attachment; filename="usuarios.csv"');
    const csvStream = fastCsv.format({ headers: true });
    csvStream.pipe(res);
    rows.forEach(r => csvStream.write(r));
    csvStream.end();
  } catch (err) {
    console.error('Error generando CSV:', err);
    res.status(500).json({ error: 'Error generando CSV' });
  }
});

// Importar CSV de usuarios
app.post('/api/users/import', uploadUsers.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No se subió archivo' });
  const filePath = req.file.path;
  const inserted = [];
  const errors   = [];

  fs.createReadStream(filePath)
    .pipe(csvParser())
    .on('data', async row => {
      try {
        const hash  = await bcrypt.hash(row.password || 'changeme', 10);
        const sql   = row.id
          ? 'INSERT INTO users (id,nombre,email,password,rol) VALUES (?,?,?,?,?)'
          : 'INSERT INTO users (nombre,email,password,rol) VALUES (?,?,?,?)';
        const params = row.id
          ? [Number(row.id), row.name, row.email, hash, row.rol]
          : [row.name, row.email, hash, row.rol];
        await pool.query(sql, params);
        inserted.push(row.email);
      } catch (e) {
        errors.push({ row, error: e.message });
      }
    })
    .on('end', () => {
      fs.unlinkSync(filePath);
      res.json({ inserted, errors });
    })
    .on('error', err => {
      fs.unlinkSync(filePath);
      console.error('Error procesando CSV:', err);
      res.status(500).json({ error: 'Error procesando CSV' });
    });
});

// ──────────────────────────────────────────────────────────────────────────
// 1) RUTAS DE “RECIBOS MASIVOS”
// ──────────────────────────────────────────────────────────────────────────

// Carga masiva de recibos (PDF)
app.post('/api/docs/upload', uploadDocs.single('file'), async (req, res) => {
  console.log('>>> /api/docs/upload llamado por usuario', req.user.id);
  try {
    const buffer         = fs.readFileSync(req.file.path);
    const data           = await pdfParse(buffer);
    const pdf            = await PDFDocument.load(buffer);
    const total          = pdf.getPageCount();
    const paginas        = data.text.split('\f');
    const originalBuffer = Buffer.from(buffer);

    for (let i = 0; i < total; i++) {
      const texto = paginas[i] || '';
      const dniM  = texto.match(/DNI[:\s]+(\d{6,10})/);
      const dtM   = texto.match(/(\d{1,2})\/(\d{4})/);
      if (!dniM || !dtM) continue;

      const dni   = dniM[1];
      const mes   = Number(dtM[1]);
      const anio  = Number(dtM[2]);

      const [[usuario]] = await pool.query(
        'SELECT id FROM users WHERE id = ?',
        [dni]
      );
      if (!usuario) continue;

      const nuevoPdf      = await PDFDocument.create();
      const [copiaPagina] = await nuevoPdf.copyPages(pdf, [i]);
      nuevoPdf.addPage(copiaPagina);
      const byteArray     = await nuevoPdf.save();
      const pdfBuffer     = Buffer.from(byteArray);

      await pool.query(
        `INSERT INTO recibos_sueldo 
           (subido_por, empleado_id, anio_periodo, mes_periodo, nombre_archivo, datos_pdf, datos_pdf_original)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          req.user.id,
          usuario.id,
          anio,
          mes,
          req.file.originalname,
          pdfBuffer,
          originalBuffer
        ]
      );
    }

    fs.unlinkSync(req.file.path);
    res.json({ ok: true });
  } catch (e) {
    console.error('Error en /api/docs/upload:', e);
    if (req.file?.path) fs.unlinkSync(req.file.path);
    res.status(500).json({ error: 'Error interno al procesar el PDF' });
  }
});

// Listar recibos masivos
app.get('/api/docs', async (req, res) => {
  try {
    let filas;
    if (req.user.rol === 'admin') {
      [filas] = await pool.query(
        `SELECT 
           id,
           mes_periodo   AS period_month,
           anio_periodo  AS period_year,
           nombre_archivo AS file_name
         FROM recibos_sueldo
         ORDER BY anio_periodo DESC, mes_periodo DESC`
      );
    } else {
      [filas] = await pool.query(
        `SELECT 
           id,
           mes_periodo   AS period_month,
           anio_periodo  AS period_year,
           nombre_archivo AS file_name
         FROM recibos_sueldo
         WHERE empleado_id = ?
         ORDER BY anio_periodo DESC, mes_periodo DESC`,
        [req.user.id]
      );
    }
    res.json(filas);
  } catch (e) {
    console.error('Error listando recibos:', e);
    res.status(500).json({ error: 'Error interno al listar recibos' });
  }
});

// Descargar recibo masivo
app.get('/api/docs/:id/download', async (req, res) => {
  const idRecibo = Number(req.params.id);
  console.log(`→ petición descarga recibo, id = ${idRecibo}`);
  try {
    const [[fila]] = await pool.query(
      `SELECT empleado_id, nombre_archivo, datos_pdf, datos_pdf_original
         FROM recibos_sueldo
        WHERE id = ?`,
      [idRecibo]
    );
    console.log('→ fila encontrada:', fila);

    if (!fila) {
      return res.status(404).json({ error: 'Recibo no encontrado' });
    }
    if (req.user.rol !== 'admin' && fila.empleado_id !== req.user.id) {
      return res.status(403).json({ error: 'Sin permiso para descargar' });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${fila.nombre_archivo}"`
    );
    res.send(fila.datos_pdf_original || fila.datos_pdf);
  } catch (err) {
    console.error('Error descargando recibo:', err);
    return res.status(500).json({ error: 'Error interno al descargar recibo' });
  }
});

// Borrar recibo masivo
app.delete('/api/docs/:id', async (req, res) => {
  const idRecibo = Number(req.params.id);
  try {
    const [[r]] = await pool.query(
      'SELECT empleado_id FROM recibos_sueldo WHERE id = ?',
      [idRecibo]
    );
    if (!r) {
      return res.status(404).json({ error: 'Recibo no encontrado' });
    }
    if (req.user.rol !== 'admin' && r.empleado_id !== req.user.id) {
      return res.status(403).json({ error: 'Sin permiso para eliminar' });
    }
    const [resBorrado] = await pool.query(
      'DELETE FROM recibos_sueldo WHERE id = ?',
      [idRecibo]
    );
    if (resBorrado.affectedRows === 0) {
      return res.status(404).json({ error: 'No se pudo eliminar' });
    }
    return res.status(204).end();
  } catch (e) {
    console.error('Error eliminando recibo:', e);
    return res.status(500).json({ error: 'Error interno al eliminar recibo' });
  }
});

// ──────────────────────────────────────────────────────────────────────────
// 2) RUTAS DE “DOCUMENTACIÓN DE EMPLEADOS”
// ──────────────────────────────────────────────────────────────────────────

// 2.1) Lista de empleados
app.get('/api/empleados', async (req, res) => {
  try {
    let filas;
    if (req.user.rol === 'admin') {
      [filas] = await pool.query(
        `SELECT id, nombre, email
           FROM users
          ORDER BY nombre`
      );
    } else {
      [filas] = await pool.query(
        `SELECT id, nombre, email
           FROM users
          WHERE id = ?
          ORDER BY nombre`,
        [req.user.id]
      );
    }
    res.json(filas);
  } catch (err) {
    console.error('Error en /api/empleados:', err);
    res.status(500).json({ error: 'No pude listar empleados' });
  }
});

// 2.2) Documentos de un empleado
app.get('/api/empleados/:id/documentos', async (req, res) => {
  const empleadoId = Number(req.params.id);
  try {
    if (req.user.rol !== 'admin' && req.user.id !== empleadoId) {
      return res.status(403).json({ error: 'Sin permiso para ver estos documentos' });
    }
    const [docs] = await pool.query(
      `SELECT 
         id, 
         nombre_archivo AS file_name,
         DATE_FORMAT(fecha_subida, '%Y-%m-%d %H:%i:%s') AS fecha_subida
       FROM empleado_documentos
       WHERE empleado_id = ?
       ORDER BY fecha_subida DESC`,
      [empleadoId]
    );
    res.json(docs);
  } catch (err) {
    console.error('Error en /api/empleados/:id/documentos:', err);
    res.status(500).json({ error: 'No pude listar documentos del empleado' });
  }
});

// 2.3) Subir documento individual de empleado
app.post(
  '/api/empleados/:id/documentos',
  uploadEmpleadoDoc.single('file'),
  async (req, res) => {
    const empleadoId = Number(req.params.id);
    try {
      if (req.user.rol !== 'admin' && req.user.id !== empleadoId) {
        if (req.file?.path) fs.unlinkSync(req.file.path);
        return res.status(403).json({ error: 'Sin permiso para subir documentos' });
      }
      const buffer = fs.readFileSync(req.file.path);
      const nombre = req.file.originalname;

      await pool.query(
        `INSERT INTO empleado_documentos
           (empleado_id, nombre_archivo, datos_blob)
         VALUES (?,           ?,              ?)`,
        [empleadoId, nombre, Buffer.from(buffer)]
      );

      fs.unlinkSync(req.file.path);
      return res.json({ ok: true });
    } catch (err) {
      console.error('Error en POST /api/empleados/:id/documentos:', err);
      if (req.file?.path) fs.unlinkSync(req.file.path);
      return res.status(500).json({ error: 'No pude subir el documento' });
    }
  }
);

// 2.4) Descargar documento individual de empleado
app.get('/api/empleados/:id/documentos/:docId/download', async (req, res) => {
  const empleadoId = Number(req.params.id);
  const docId       = Number(req.params.docId);
  try {
    if (req.user.rol !== 'admin' && req.user.id !== empleadoId) {
      return res.status(403).json({ error: 'Sin permiso para descargar este documento' });
    }
    const [[doc]] = await pool.query(
      `SELECT nombre_archivo, datos_blob
         FROM empleado_documentos
        WHERE id = ? AND empleado_id = ?`,
      [docId, empleadoId]
    );
    if (!doc) {
      return res.status(404).json({ error: 'Documento no encontrado' });
    }
    res.setHeader('Content-Type','application/octet-stream');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${doc.nombre_archivo}"`
    );
    res.send(doc.datos_blob);
  } catch (err) {
    console.error('Error en GET /api/empleados/:id/documentos/:docId/download:', err);
    res.status(500).json({ error: 'Error interno al descargar documento' });
  }
});

// 2.5) Eliminar documento individual de empleado
app.delete('/api/empleados/:id/documentos/:docId', async (req, res) => {
  const empleadoId = Number(req.params.id);
  const docId       = Number(req.params.docId);
  try {
    if (req.user.rol !== 'admin' && req.user.id !== empleadoId) {
      return res.status(403).json({ error: 'Sin permiso para borrar este documento' });
    }
    const [result] = await pool.query(
      `DELETE FROM empleado_documentos
        WHERE id = ? AND empleado_id = ?`,
      [docId, empleadoId]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Documento no encontrado o no se pudo eliminar' });
    }
    res.status(204).end();
  } catch (err) {
    console.error('Error en DELETE /api/empleados/:id/documentos/:docId:', err);
    res.status(500).json({ error: 'Error interno al eliminar documento' });
  }
});

// ─── NOTIFICACIONES (placeholder) ─────────────────────────────────
app.get('/api/notifications', (req, res) => {
  res.json([]);
});

// ─── GOOGLE CALENDAR (ya configurado) ──────────────────────────────
const oAuth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  process.env.REDIRECT_URI
);
app.get('/auth', (req, res) => {
  const url = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/calendar.readonly']
  });
  res.redirect(url);
});
app.get('/oauth2callback', async (req, res) => {
  try {
    const { code } = req.query;
    const { tokens } = await oAuth2Client.getToken(code);
    console.log('REFRESH_TOKEN:', tokens.refresh_token);
    res.send('Autorizado! Copia el REFRESH_TOKEN de la consola y pégalo en tu .env');
  } catch (err) {
    console.error('Error en /oauth2callback:', err);
    res.status(500).send('Error en la autorización');
  }
});
app.get('/api/agenda', async (req, res) => {
  if (!process.env.REFRESH_TOKEN) {
    return res.status(500).json({ error: 'REFRESH_TOKEN no configurado' });
  }
  try {
    oAuth2Client.setCredentials({ refresh_token: process.env.REFRESH_TOKEN });
    const calendar = google.calendar({ version: 'v3', auth: oAuth2Client });
    const resp = await calendar.events.list({
      calendarId:   process.env.CALENDAR_ID || 'primary',
      timeMin:      new Date().toISOString(),
      maxResults:   50,
      singleEvents: true,
      orderBy:      'startTime',
    });
    res.json(resp.data.items || []);
  } catch (err) {
    console.error('Error en /api/agenda:', err);
    res.status(500).json({ error: `No pude leer el calendario: ${err.message}` });
  }
});

// ─── LEVANTO SERVIDOR ──────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 Backend escuchando en http://localhost:${PORT}`);
  console.log(`→ http://localhost:3001/auth generar nuevo REFRESH_TOKEN`);
  console.log(`→ /api/users/export  GET`);
  console.log(`→ /api/users/import  POST`);
  console.log(`→ /api/users         CRUD`);
});
