// index.js (backend)
require('dotenv').config();
const express                = require('express');
const cors                   = require('cors');
const pool                   = require('./db');
const bcrypt                 = require('bcryptjs');
const jwt                    = require('jsonwebtoken');
const { google }             = require('googleapis');
const multer                 = require('multer');
const fs                     = require('fs');
const path                   = require('path');
const crypto                 = require('crypto');
const { enviarNotificacion } = require('./src/mailer.js');
const csvParser              = require('csv-parser');
const pdfParse               = require('pdf-parse');
const fastCsv                = require('fast-csv');
const { PDFDocument }        = require('pdf-lib')
const oAuth2Client           = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  process.env.REDIRECT_URI
);

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET;

// CORS y body parsers
app.use(cors({ exposedHeaders: ['Content-Disposition'] }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static para avatares (opción A no la usa, pero te la dejo por si acaso)
app.use('/uploads/avatars', express.static('uploads/avatars'));


// Multer: genérico y específicos (¡NO los elimines!)
const upload = multer({ storage: multer.memoryStorage() });          
const uploadUsers       = multer({ dest: 'tmp_users/' });
const uploadDocs        = multer({ dest: 'tmp_docs/' });
const uploadEmpleadoDoc = multer({ dest: 'tmp_emp_docs/' });
const uploadPost        = multer();

// ─── RUTAS PÚBLICAS ────────────────────────────────────────────
app.get('/', (req, res) => res.send('Backend funcionando correctamente.'));

// LOGIN
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (!rows.length) return res.status(404).json({ message: 'Usuario no encontrado' });
    const u = rows[0];
    const ok = await bcrypt.compare(password, u.password);
    if (!ok) return res.status(400).json({ message: 'Contraseña incorrecta' });

    const token = jwt.sign(
      { id: u.id, email: u.email, rol: u.rol, nombre: u.nombre },
      JWT_SECRET,
      { expiresIn: '2h' }
    );
    res.json({ token });
  } catch (err) {
    console.error('Error en /login:', err);
    res.status(500).json({ message: 'Error interno' });
  }
});

// OLVIDÉ CONTRASEÑA
app.post('/auth/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Falta el email' });

  try {
    const [rows] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (!rows.length) {
      // respondemos igual para no revelar existencia
      return res.status(200).json({ message: 'Si el email existe, recibirás un link.' });
    }
    const userId = rows[0].id;

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // +1 hora

    await pool.query(
      'INSERT INTO password_resets (user_id, token, expires_at) VALUES (?,?,?)',
      [userId, token, expiresAt]
    );

    const frontUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetLink = `${frontUrl}/restablecer-contrasena?token=${token}`;

    await enviarNotificacion({
      to: email,
      asunto: 'Recuperación de contraseña • SmartHR',
      nombre: '',
      cuerpoHtml: `
        <p>Has solicitado restablecer tu contraseña.</p>
        <p><a href="${resetLink}">Haz clic aquí</a> para elegir una nueva contraseña.</p>
        <p>Este enlace expirará en 1 hora.</p>
      `
    });

    res.status(200).json({ message: 'Si el email existe, recibirás un link.' });
  } catch (err) {
    console.error('Error en forgot-password:', err);
    res.status(500).json({ message: 'Error interno' });
  }
});

// RESTABLECER CONTRASEÑA
app.post('/auth/reset-password', async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password) {
    return res.status(400).json({ message: 'Faltan datos' });
  }

  try {
    const [[row]] = await pool.query(
      'SELECT user_id FROM password_resets WHERE token = ? AND expires_at > NOW()',
      [token]
    );
    if (!row) {
      return res.status(400).json({ message: 'Token inválido o expirado' });
    }

    const hash = await bcrypt.hash(password, 10);
    await pool.query('UPDATE users SET password = ? WHERE id = ?', [hash, row.user_id]);
    await pool.query('DELETE FROM password_resets WHERE token = ?', [token]);

    res.json({ message: 'Contraseña actualizada correctamente' });
  } catch (err) {
    console.error('Error en reset-password:', err);
    res.status(500).json({ message: 'Error interno' });
  }
});

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


// ─── RUTAS DE USUARIO / AVATAR 
app.get('/api/users/:id/avatar', async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query(
      'SELECT avatar, avatar_mimetype FROM users WHERE id = ?', 
      [id]
    );
    if (!rows[0] || !rows[0].avatar) {
      return res.status(204).end(); // sin avatar
    }
    res.setHeader('Content-Type', rows[0].avatar_mimetype);
    res.send(rows[0].avatar);
  } catch (err) {
    console.error('Error obteniendo avatar:', err);
    res.status(500).json({ error: 'Error al obtener avatar' });
  }
});

// GET datos de perfil (sin devolver BLOB)
app.get('/api/users/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: 'ID inválido' });

  try {
    const [[user]] = await pool.query(
      `SELECT 
         id, nombre, email, rol, linkedin,
         avatar IS NOT NULL             AS has_avatar,
         CONCAT('/api/users/', id, '/avatar') AS avatar_url
       FROM users
       WHERE id = ?`,
      [id]
    );
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json(user);
  } catch (err) {
    console.error('Error al buscar usuario:', err);
    res.status(500).json({ error: 'Error de servidor' });
  }
});

// GET avatar (sirve el BLOB)
app.get('/api/users/:id/avatar', async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) return res.status(400).end();

  try {
    const [[row]] = await pool.query(
      `SELECT avatar, avatar_mimetype FROM users WHERE id = ?`,
      [id]
    );
    if (!row || !row.avatar) return res.status(404).end();

    res.set('Content-Type', row.avatar_mimetype || 'image/jpeg');
    res.send(row.avatar);
  } catch (err) {
    console.error('Error al servir avatar:', err);
    res.status(500).end();
  }
});

// POST avatar (recibe multipart/form-data y guarda buffer en BLOB)
app.post(
  '/api/users/:id/avatar',
  upload.single('avatar'),
  async (req, res) => {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: 'ID inválido' });
    if (!req.file) return res.status(400).json({ message: 'No se subió archivo' });

    try {
      await pool.query(
        `UPDATE users
           SET avatar = ?, avatar_mimetype = ?
         WHERE id = ?`,
        [req.file.buffer, req.file.mimetype, id]
      );

      res.json({
        message: 'Avatar guardado',
        avatar_url: `/api/users/${id}/avatar`
      });
    } catch (err) {
      console.error('Error guardando avatar:', err);
      res.status(500).json({ error: 'Error guardando avatar' });
    }
  }
);

// -------------------------------------------------------------------
// RECUPERAR CONTRASEÑA
// -------------------------------------------------------------------

// POST /api/auth/forgot-password
app.post('/api/auth/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Falta el email' });

  try {
    // 1) Verificar usuario
    const [rows] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (!rows.length) {
      // para no delatar, respondemos igual aunque no exista
      return res.status(200).json({ message: 'Si el email existe, recibirás un link.' });
    }
    const userId = rows[0].id;

    // 2) Generar token y expiración (1 hora)
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // +1h

    // 3) Guardar en BD
    await pool.query(
      'INSERT INTO password_resets (user_id, token, expires_at) VALUES (?,?,?)',
      [userId, token, expiresAt]
    );

    // 4) Enviar email con link
    const frontUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const resetLink = `${frontUrl}/restablecer-contraseña?token=${token}`;
    await enviarNotificacion({
      to: email,
      asunto: 'Recuperación de contraseña • SmartHR',
      nombre: '', // no es personalizado
      cuerpoHtml: `
        <p>Has solicitado restablecer tu contraseña.</p>
        <p>Haz clic <a href="${resetLink}">aquí</a> para elegir una nueva contraseña.</p>
        <p>Este enlace expirará en 1 hora.</p>
      `
    });

    return res.status(200).json({ message: 'Si el email existe, recibirás un link.' });
  } catch (err) {
    console.error('Error en forgot-password:', err);
    return res.status(500).json({ message: 'Error interno' });
  }
});

// POST /api/auth/reset-password
app.post('/api/auth/reset-password', async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password) {
    return res.status(400).json({ message: 'Faltan datos' });
  }

  try {
    // 1) Buscar token válido y no expirado
    const [[row]] = await pool.query(
      'SELECT user_id FROM password_resets WHERE token = ? AND expires_at > NOW()',
      [token]
    );
    if (!row) {
      return res.status(400).json({ message: 'Token inválido o expirado' });
    }

    // 2) Hashear y actualizar contraseña
    const hash = await bcrypt.hash(password, 10);
    await pool.query('UPDATE users SET password = ? WHERE id = ?', [hash, row.user_id]);

    // 3) Eliminar token usado
    await pool.query('DELETE FROM password_resets WHERE token = ?', [token]);

    return res.json({ message: 'Contraseña actualizada correctamente' });
  } catch (err) {
    console.error('Error en reset-password:', err);
    return res.status(500).json({ message: 'Error interno' });
  }
});


// ─── RUTAS PROTEGIDAS /api ────────────────────────────────────────

function authMiddleware(req, res, next) {
  const auth  = req.headers.authorization || '';
  const token = auth.replace(/^Bearer\s+/i, '');
  jwt.verify(token, JWT_SECRET, (err, payload) => {
    if (err) return res.status(401).json({ message: 'Token inválido' });
    req.user = payload;
    next();
  });
}

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
  const { id, nombre, email, password, rol, linkedin } = req.body;

  // Validaciones
  if (!id || isNaN(Number(id))) {
    return res.status(400).json({ message: 'Debés enviar un DNI válido en el campo id' });
  }
  if (!['empleado','admin'].includes(rol)) {
    return res.status(400).json({ message: 'Rol inválido' });
  }

  try {
    // Hashear contraseña
    const hash = await bcrypt.hash(password, 10);

    // Insertar incluyendo el id (DNI)
    await pool.query(
      `INSERT INTO users (id, nombre, email, password, rol, linkedin)
       VALUES (?,  ?,      ?,     ?,        ?)`,
      [Number(id), nombre, email, hash, rol, linkedin]
    );

    res.status(201).json({ id, nombre, email, rol });
  } catch (err) {
    console.error('Error creando usuario:', err);
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Ya existe un usuario con ese DNI' });
    }
    res.status(500).json({ error: 'Error interno al crear usuario' });
  }
});

// Actualizar usuario (admin o perfil propio)
// PUT /api/users/:id  → actualizar nombre, email, opcionalmente password y rol
app.put('/api/users/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) {
    return res.status(400).json({ message: 'ID inválido' });
  }

  const { nombre, email, password, rol, linkedin } = req.body;
  if (!nombre || !email) {
    return res.status(400).json({ message: 'Faltan campos: nombre y/o email' });
  }

  // Construimos dinámicamente los campos a actualizar
  const fields = ['nombre = ?', 'email = ?'];
  const params = [nombre, email];

  // Si mandan nueva contraseña, la hasheamos antes de guardarla
  if (password) {
    try {
      const hash = await bcrypt.hash(password, 10);
      fields.push('password = ?');
      params.push(hash);
    } catch (err) {
      console.error('Error hasheando contraseña:', err);
      return res.status(500).json({ message: 'Error procesando contraseña' });
    }
  }

  // Si mandan rol (solo admins lo deberían poder), lo validamos
  if (rol !== undefined) {
    if (!['empleado', 'admin'].includes(rol)) {
      return res.status(400).json({ message: 'Rol inválido' });
    }
    fields.push('rol = ?');
    params.push(rol);
  }

  // Finalmente el id en el WHERE
  params.push(id);

  try {
    await pool.query(
      `UPDATE users
         SET ${fields.join(', ')}
       WHERE id = ?`,
      params
    );
    return res.json({ message: 'Usuario actualizado' });
  } catch (err) {
    console.error('Error actualizando usuario:', err);
    return res.status(500).json({ error: 'Error actualizando usuario' });
  }
});

// Borrar usuario
app.delete('/api/users/:id', async (req, res) => {
  const uid = Number(req.params.id);
  try {
    // 1) Eliminar destinatarios de notificaciones
    await pool.query(
      'DELETE FROM notificaciones_destinatarios WHERE empleado_id = ?',
      [uid]
    );
    // 2) (Opcional) Si tienes otras tablas con FK a users, borrarlas también aquí
    //    await pool.query('DELETE FROM otra_tabla WHERE user_id = ?', [uid]);

    // 3) Finalmente, borrar el usuario
    const [result] = await pool.query(
      'DELETE FROM users WHERE id = ?',
      [uid]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    res.status(204).end();
  } catch (err) {
    console.error('Error borrando user y sus dependencias:', err);
    res.status(500).json({ error: 'No se pudo eliminar usuario' });
  }
});
// ---------------------------------------------------------------
// RUTAS DE USUARIO / MI PERFIL
// ---------------------------------------------------------------

// GET datos de usuario (incluye URL dinámica de avatar)
app.get('/api/users/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: 'ID inválido' });
  try {
    const [[user]] = await pool.query(
      `SELECT 
         id,
         nombre,
         email,
         rol,
         avatar IS NOT NULL AS has_avatar,
         CONCAT('/api/users/', id, '/avatar') AS avatar_url
       FROM users
       WHERE id = ?`,
      [id]
    );
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json(user);
  } catch (err) {
    console.error('Error al buscar usuario:', err);
    res.status(500).json({ error: 'Error de servidor' });
  }
});

// POST avatar → guardamos blob + MIME-type
app.post(
  '/api/users/:id/avatar',
  upload.single('avatar'),
  async (req, res) => {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: 'ID inválido' });
    if (!req.file) return res.status(400).json({ message: 'No se subió archivo' });
    try {
      await pool.query(
        `UPDATE users
           SET avatar          = ?,
               avatar_mimetype = ?
         WHERE id = ?`,
        [req.file.buffer, req.file.mimetype, id]
      );
      // devolvemos la URL que construimos en el GET
      res.json({ message: 'Avatar guardado', avatar_url: `/api/users/${id}/avatar` });
    } catch (err) {
      console.error('Error guardando avatar:', err);
      res.status(500).json({ error: 'Error guardando avatar' });
    }
  }
);

// PUT datos básicos (sólo nombre/email/password)
//   app.put('/api/users/:id', async (req, res) => {
//    const id = Number(req.params.id);
//    if (isNaN(id)) return res.status(400).json({ message: 'ID inválido' });
//    const { nombre, email, password } = req.body;
//    if (!nombre || !email) {
//      return res.status(400).json({ message: 'Faltan campos: nombre y/o email' });
//    }
//    try {
//      const fields = ['nombre = ?', 'email = ?'];
//      const params = [nombre, email];
//      if (password) {
//        fields.push('password = ?');
//        params.push(password);
//      }
//      params.push(id);
//      await pool.query(
//        `UPDATE users SET ${fields.join(', ')} WHERE id = ?`,
//        params
//      );
//      res.json({ message: 'Datos básicos actualizados' });
//    } catch (err) {
//      console.error('Error actualizando usuario:', err);
//      res.status(500).json({ error: 'Error actualizando usuario' });
//    }
//   });
// ─── EXPORTAR / IMPORTAR CSV ───────────────────────────────────




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

// ─── RUTAS DE RECLUTAMIENTO ──────────────────────────────────────
const etapasDef = [
  'Requerimiento recibido',
  'Publicación de búsqueda',
  'Recepción y filtrado de CVs',
  'Entrevistas virtuales',
  'Desafío técnico',
  'Candidato seleccionado'
];

// Lista todos los puestos
app.get('/api/puestos', authMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, nombre FROM puestos ORDER BY nombre'
    );
    res.json(rows);
  } catch (err) {
    console.error('Error listando puestos:', err);
    res.status(500).json({ error: 'No se pudieron cargar los puestos' });
  }
});
// 1 devuelve lista de puestos
app.get('/api/puestos', authMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, nombre FROM puestos ORDER BY nombre'
    );
    res.json(rows);
  } catch (err) {
    console.error('Error listando puestos:', err);
    res.status(500).json({ error: 'No se pudieron cargar los puestos' });
  }
});

// 1.0.1 devuelve todas las áreas
app.get('/api/areas', authMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, nombre FROM areas ORDER BY nombre'
    );
    res.json(rows);
  } catch (err) {
    console.error('Error listando áreas:', err);
    res.status(500).json({ error: 'No se pudieron cargar las áreas' });
  }
});
// 1.1) Listar procesos
app.get('/api/reclutamiento', authMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT 
         r.id,
         r.codigo,
         r.puesto_id,
         p.nombre AS puesto,
         r.area_id,
         a.nombre AS area,
         r.tipo_busqueda,
         r.estado,
         r.etapa_actual,
         r.fecha_inicio,
         r.fecha_fin,
         u.nombre AS responsable
       FROM reclutamiento r
       JOIN puestos p     ON p.id = r.puesto_id 
       JOIN areas a       ON a.id = r.area_id
       JOIN users u       ON u.id = r.creado_por
       ORDER BY r.fecha_inicio DESC`
    );
    res.json(rows);
  } catch (err) {
    console.error('Error listando procesos:', err);
    res.status(500).json({ error: 'No se pudieron cargar los procesos' });
  }
});

// 2) Crear proceso
app.post('/api/reclutamiento', authMiddleware, async (req, res) => {
  const {
    codigo,
    puesto_id,   
    area_id,      
    tipo_busqueda
  } = req.body;

  try {
    await pool.query(
      `INSERT INTO reclutamiento
         (codigo, puesto_id, area_id, tipo_busqueda, creado_por)
       VALUES (?,      ?,         ?,       ?,            ?)`,
      [codigo, puesto_id, area_id, tipo_busqueda, req.user.id]
    );
    res.status(201).json({ ok: true });
  } catch (err) {
    console.error('Error creando proceso:', err);
    res.status(500).json({ error: 'No se pudo crear el proceso' });
  }
});

// 3) Eliminar proceso + postulantes
app.delete('/api/reclutamiento/:id', async (req, res) => {
  const id = Number(req.params.id);
  await pool.query('DELETE FROM postulantes WHERE proceso_id = ?', [id]);
  await pool.query('DELETE FROM reclutamiento WHERE id = ?', [id]);
  res.status(204).end();
});

// 4) Avanzar etapa proceso
app.post('/api/reclutamiento/:id/avanzar', async (req, res) => {
  const id = Number(req.params.id);
  const [[r]] = await pool.query('SELECT etapa_actual FROM reclutamiento WHERE id = ?', [id]);
  if (!r) return res.status(404).end();
  let nueva = r.etapa_actual + 1;
  if (nueva > etapasDef.length) nueva = etapasDef.length;
  const estado = (nueva === etapasDef.length) ? 'Finalizado' : 'En curso';
  const fecha_fin_clause = (estado === 'Finalizado')
    ? ', fecha_fin = COALESCE(fecha_fin, NOW())'
    : '';
  await pool.query(
    `UPDATE reclutamiento
       SET etapa_actual = ?, estado = ? ${fecha_fin_clause}
     WHERE id = ?`,
    [nueva, estado, id]
  );
  res.json({ ok: true });
});

// 5) Listar postulantes
app.get('/api/reclutamiento/:id/postulantes', async (req, res) => {
  const proc = Number(req.params.id);
  const [rows] = await pool.query(
    `SELECT * FROM postulantes WHERE proceso_id = ? ORDER BY fecha_creacion`,
    [proc]
  );
  res.json(rows);
});

// 6) Crear postulante (multipart/form-data)
app.post(
  '/api/reclutamiento/:id/postulantes',
  uploadPost.single('cv'),
  async (req, res) => {
    try {
      const proc = +req.params.id;
      const { nombre, email, telefono, notas, linkedin } = req.body;

      // ▷ aquí el handling seguro de cv_blob
      let cvBlob = null;
      let cvName = null;
      if (req.file) {
        cvName = req.file.originalname;
        if (req.file.buffer) {
          // multer.memoryStorage()
          cvBlob = req.file.buffer;
        } else if (req.file.path) {
          // multer.diskStorage()
          cvBlob = fs.readFileSync(req.file.path);
          // opcionalmente limpia:
          fs.unlinkSync(req.file.path);
        }
      }

      await pool.query(
        `INSERT INTO postulantes 
           (proceso_id, nombre, email, telefono, notas, cv_blob, cv_filename, linkedin)
         VALUES (?,?,?,?,?,?,?,?)`,
        [
          proc,
          nombre,
          email,
          telefono || null,
          notas    || null,
          cvBlob,
          cvName,
          linkedin || null
        ]
      );

      return res.status(201).json({ ok: true });
    } catch (err) {
      console.error('Error al crear postulante:', err);
      return res.status(500).json({ error: err.message });
    }
  }
);



// 7) Avanzar etapa postulante
// 7) Avanzar etapa postulante
app.post(
  '/api/reclutamiento/:pid/postulantes/:uid/avanzar',
  async (req, res) => {
    const { pid, uid } = req.params;
    const [[p]] = await pool.query(
      `SELECT etapa_actual FROM postulantes WHERE id = ? AND proceso_id = ?`,
      [uid, pid]
    );
    if (!p) return res.status(404).end();

    const TOTAL_ETAPAS = 6;          // Ajusta según tu definición real
    let nueva = p.etapa_actual + 1;
    if (nueva > TOTAL_ETAPAS) nueva = TOTAL_ETAPAS;

    // Si llega a la última etapa, fijamos fecha_final
    const fechaFinalClause = nueva === TOTAL_ETAPAS
      ? ', fecha_final = NOW()'
      : '';

    await pool.query(
      `UPDATE postulantes
         SET etapa_actual = ?${fechaFinalClause}
       WHERE id = ?`,
      [nueva, uid]
    );

    res.json({ ok: true });
  }
);


// 8) Eliminar postulante
app.delete(
  '/api/reclutamiento/:pid/postulantes/:uid',
  async (req, res) => {
    const pid = Number(req.params.pid);
    const uid = Number(req.params.uid);

    try {
      // 1) Borra el postulante
      await pool.query(
        'DELETE FROM postulantes WHERE id = ? AND proceso_id = ?',
        [uid, pid]
      );

      // 2) Recalcula el máximo etapa_actual de los postulantes restantes
      const [[{ maxEtapa }]] = await pool.query(
        `SELECT COALESCE(MAX(etapa_actual), 0) AS maxEtapa
           FROM postulantes
          WHERE proceso_id = ?`,
        [pid]
      );

      // 3) Decide la nueva etapa y estado del proceso
      // Número de etapas definidas:
      const TOTAL_ETAPAS = 6;

      let nuevaEtapa = maxEtapa < 1 ? 1 : maxEtapa;
      let nuevoEstado = 'En curso';
      let fechaFinClause = '';

      if (maxEtapa === TOTAL_ETAPAS) {
        nuevoEstado = 'Finalizado';
        // solo fijar fecha_fin si aún no existe
        fechaFinClause = ', fecha_fin = COALESCE(fecha_fin, NOW())';
      }

      // 4) Actualiza el proceso
      await pool.query(
        `UPDATE reclutamiento
            SET etapa_actual = ?, estado = ?${fechaFinClause}
          WHERE id = ?`,
        [nuevaEtapa, nuevoEstado, pid]
      );

      return res.sendStatus(204);
    } catch (err) {
      console.error('Error eliminando postulante:', err);
      return res.status(500).json({ error: 'Error interno al eliminar postulante' });
    }
  }
);




app.post(
  '/api/reclutamiento/:id/postulantes',
  uploadPost.single('cv'),
  async (req, res) => {
    const proc = +req.params.id;
    const { nombre, email, telefono, notas, linkedin } = req.body;
    const cvBlob = req.file ? fs.readFileSync(req.file.path) : null;
    const cvName = req.file ? req.file.originalname : null;
    await pool.query(
      `INSERT INTO postulantes
        (proceso_id,nombre,email,telefono,notas,cv_blob,cv_filename, linkedin)
       VALUES (?,?,?,?,?,?,?,?)`,
      [proc,nombre,email,telefono||null,notas||null,cvBlob,cvName]
    );
    if (req.file?.path) fs.unlinkSync(req.file.path);
    res.status(201).end();
  }
);

// 2) Para traer el detalle:
app.get('/api/reclutamiento/:pid/postulantes/:uid', async (req, res) => {
  const pid = +req.params.pid, uid = +req.params.uid;
  const [[u]] = await pool.query(
    `SELECT
        id,
        proceso_id,
        nombre,
        email,
        telefono,
        notas,
        linkedin,
        cv_filename
     FROM postulantes
     WHERE id=? AND proceso_id=?`,
    [uid, pid]
  );
  if (!u) return res.status(404).end();
  res.json(u);
});

// 3) Para descargar el CV:
app.get('/api/reclutamiento/:pid/postulantes/:uid/cv/download', async (req, res) => {
  const pid = +req.params.pid, uid = +req.params.uid;
  const [[u]] = await pool.query(
    `SELECT cv_blob, cv_filename
     FROM postulantes
     WHERE id=? AND proceso_id=?`,
    [uid, pid]
  );
  if (!u || !u.cv_blob) return res.status(404).end();
  res.setHeader('Content-Type','application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${u.cv_filename}"`);
  res.send(u.cv_blob);
});


// ————————————————
// RUTA HISTÓRICO
// ————————————————
app.get('/api/notificaciones', async (req, res) => {
  const [rows] = await pool.query(
    `SELECT n.id, n.asunto, n.creado_por, n.creado_en,
            COUNT(d.id) AS total_destinatarios,
            SUM(d.estado='enviado') AS enviados
     FROM notificaciones n
     LEFT JOIN notificaciones_destinatarios d
       ON d.notificacion_id = n.id
     GROUP BY n.id
     ORDER BY n.creado_en DESC`
  );
  res.json(rows);
});

// ————————————————
// RUTA DETALLE
// ————————————————
app.get('/api/notificaciones/:id', async (req, res) => {
  const id = Number(req.params.id);
  const [[info]] = await pool.query(
    `SELECT id, asunto, cuerpo, creado_por, creado_en
     FROM notificaciones
     WHERE id = ?`, [id]
  );
  const [dest] = await pool.query(
    `SELECT d.empleado_id AS id, u.nombre, u.email, d.estado, d.enviado_en
     FROM notificaciones_destinatarios d
     JOIN users u ON u.id = d.empleado_id
     WHERE d.notificacion_id = ?
     ORDER BY d.id`, [id]
  );
  res.json({ info, destinatarios: dest });
});

// ————————————————
// CREAR + ENVIAR (con historial y plantillas)
// ————————————————

// backend/index.js (reemplaza tu actual POST /api/notificaciones por esto)

app.post('/api/notificaciones', async (req, res) => {
  const { asunto, cuerpo, destinatarios } = req.body;
  const usuarioId = req.user.id;

  // 1) Insertar cabecera
  const [{ insertId }] = await pool.query(
    `INSERT INTO notificaciones (asunto, cuerpo, creado_por)
     VALUES (?, ?, ?)`,
    [asunto, cuerpo, usuarioId]
  );

  // 2) Tomar sólo los IDs que llegó del frontend
  //    destinatarios es un array [{ id, type }, …]
  const empIds = destinatarios.map(d => d.id);
  // Validamos que existan esos usuarios
  const [empleados] = await pool.query(
    `SELECT id, nombre, email
     FROM users
     WHERE id IN (?)`,
    [empIds]
  );

  // 3) Insertar únicamente esos destinatarios
  if (empleados.length) {
    const valores = empleados.map(e => [insertId, e.id]);
    await pool.query(
      `INSERT INTO notificaciones_destinatarios
         (notificacion_id, empleado_id)
       VALUES ?`,
      [valores]
    );
  }

  // 4) Envío de emails a sólo los seleccionados
  try {
    for (let emp of empleados) {
      if (!emp.email?.includes('@')) continue;
      await enviarNotificacion({
        to: emp.email,
        asunto,
        nombre: emp.nombre,
        cuerpoHtml: cuerpo
          .replace(/{{nombre}}/g, emp.nombre)
          .replace(/{{fecha}}/g, new Date().toLocaleDateString())
      });
      await pool.query(
        `UPDATE notificaciones_destinatarios
           SET estado='enviado', enviado_en=NOW()
         WHERE notificacion_id=? AND empleado_id=?`,
        [insertId, emp.id]
      );
    }
    res.status(201).json({ id: insertId });
  } catch (err) {
    console.error('Error enviando notificaciones:', err);
    res.status(500).json({ error: 'Error enviando notificaciones' });
  }
});


// ─── Ruta para eliminar una notificación ────────────────────────
app.delete('/api/notificaciones/:id', async (req, res) => {
  const id = Number(req.params.id);

  try {
    // 1) Borra primero los destinatarios (por la FK)
    await pool.query(
      'DELETE FROM notificaciones_destinatarios WHERE notificacion_id = ?',
      [id]
    );
    // 2) Borra la notificación
    const [result] = await pool.query(
      'DELETE FROM notificaciones WHERE id = ?',
      [id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Notificación no encontrada' });
    }
    // 3) Devuelve 204 No Content
    res.status(204).end();
  } catch (err) {
    console.error('Error borrando notificación:', err);
    res.status(500).json({ error: 'Error interno al eliminar notificación' });
  }
});


// ------------------------------------------------------------------
// API Postulantes
// ------------------------------------------------------------------
// GET /api/postulantes — devuelve id, nombre y email
app.get('/api/postulantes', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, nombre, email
       FROM postulantes
       ORDER BY nombre`
    );
    res.json(rows);
  } catch (err) {
    console.error('Error al cargar postulantes:', err);
    res.status(500).json({ error: 'Error interno' });
  }
});

// GET /api/metrics/postulantes
app.get('/api/metrics/postulantes', async (req, res) => {
  try {
    const TOTAL_ETAPAS = 6
    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total FROM postulantes`
    );

    const [[{ en_proceso }]] = await pool.query(
      `SELECT COUNT(*) AS en_proceso
       FROM postulantes
       WHERE etapa_actual >= 1
         AND etapa_actual < ?`,
      [TOTAL_ETAPAS]
    );

    const [[{ finalizados }]] = await pool.query(
      `SELECT COUNT(*) AS finalizados
       FROM postulantes
       WHERE etapa_actual = ?`,
      [TOTAL_ETAPAS]
    );

    // Promedio de días entre creación y fecha_final
    const [[{ promedio_dias }]] = await pool.query(
      `SELECT AVG(DATEDIFF(fecha_final, fecha_creacion)) AS promedio_dias
       FROM postulantes
       WHERE fecha_final IS NOT NULL`
    );

    const tasa = total > 0
      ? +((finalizados / total) * 100).toFixed(1)
      : 0;

    res.json({ total, en_proceso, finalizados, promedio_dias, tasa });
  } catch (err) {
    console.error('Error calculando métricas de postulantes:', err);
    res.status(500).json({ error: 'Error interno' });
  }
});



// ──────────────────────────────────────────────────────────────
// GET /api/metrics/postulantes
// ──────────────────────────────────────────────────────────────

app.get('/api/metrics/postulantes', authMiddleware, async (req, res) => {
  try {
    // Define aquí cuántas etapas totales tienes en tu flujo
    const TOTAL_ETAPAS = 6;

    // 1) total de postulantes
    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total FROM postulantes`
    );

    // 2) en proceso: etapa_actual >= 1 y < TOTAL_ETAPAS
    const [[{ en_proceso }]] = await pool.query(
      `SELECT COUNT(*) AS en_proceso
       FROM postulantes
       WHERE etapa_actual >= 1
         AND etapa_actual < ?`,
      [TOTAL_ETAPAS]
    );

    // 3) finalizados: etapa_actual == TOTAL_ETAPAS
    const [[{ finalizados }]] = await pool.query(
      `SELECT COUNT(*) AS finalizados
       FROM postulantes
       WHERE etapa_actual = ?`,
      [TOTAL_ETAPAS]
    );

    // 4) promedio de días desde la creación hasta que llegan a la etapa final
    //    (a falta de un campo fecha_final, usamos NOW() para aproximar el tiempo transcurrido)
    const [[{ promedio_dias }]] = await pool.query(
      `SELECT AVG(DATEDIFF(NOW(), fecha_creacion)) AS promedio_dias
       FROM postulantes
       WHERE etapa_actual = ?`,
      [TOTAL_ETAPAS]
    );

    // 5) tasa de conversión
    const tasa = total > 0
      ? +((finalizados / total) * 100).toFixed(1)
      : 0;

    res.json({ total, en_proceso, finalizados, promedio_dias, tasa });
  } catch (err) {
    console.error('Error al cargar métricas postulantes:', err);
    res.status(500).json({ error: 'No se pudieron cargar métricas' });
  }
});


// ------------------------------------------------------------------
//  NOTIFICACIONES ROL EMPLEADO
// ------------------------------------------------------------------
// backend/src/index.js (o equivalente)
app.get('/api/mis-notificaciones', async (req, res) => {
  const empleadoId = req.user.id;                // viene del middleware de auth
  const [rows] = await pool.query(
    `SELECT 
       n.id,
       n.asunto,
       n.cuerpo,
       d.estado,
       n.creado_en
     FROM notificaciones_destinatarios d
     JOIN notificaciones n ON n.id = d.notificacion_id
     WHERE d.empleado_id = ?
     ORDER BY n.creado_en DESC`,
    [empleadoId]
  );
  res.json(rows);
});





// ─── GOOGLE CALENDAR (ya configurado) ──────────────────────────────
app.get('/auth', (req, res) => {
  const url = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: [
      'https://www.googleapis.com/auth/calendar.readonly',
      'https://www.googleapis.com/auth/calendar.events'   // éste te da permiso para crear/editar/borrar
    ]
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

// ──────────────────────────────────────────────────────────────
// CRUD Eventos (BD + Google Calendar)
// ─────────────────────────────────────────────────────────────-

// ─── LISTAR todos los eventos propios ───────────────────────────────
app.get('/api/eventos', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const [rows] = await pool.query(
      `SELECT id, gcal_id, titulo, descripcion, fecha_inicio, fecha_fin, tipo
       FROM eventos
       WHERE creado_por = ?
       ORDER BY fecha_inicio`,
      [userId]
    );
    res.json(rows);
  } catch (err) {
    console.error('Error listando eventos:', err);
    res.status(500).json({ error: 'No se pudieron cargar los eventos' });
  }
});

// ─── CREAR un evento propio + replicar en Google Calendar ─────────
app.post('/api/eventos', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { titulo, descripcion, fecha_inicio, fecha_fin, correos } = req.body;

    // Función para convertir a formato MySQL
    function toMySQLDatetime(isoString) {
      const date = new Date(isoString);
      const pad = (n) => String(n).padStart(2, '0');
      return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
    }

    const fechaInicioSQL = toMySQLDatetime(fecha_inicio);
    const fechaFinSQL    = toMySQLDatetime(fecha_fin || fecha_inicio);

    // 1) Insertar en tu BD
    const [result] = await pool.query(
      `INSERT INTO eventos 
         (titulo, descripcion, fecha_inicio, fecha_fin, tipo, creado_por)
       VALUES (?, ?, ?, ?, 'propio', ?)`,
      [titulo, descripcion || null, fechaInicioSQL, fechaFinSQL, userId]
    );
    const nuevoId = result.insertId;

    // 2) Replicar en Google Calendar
    oAuth2Client.setCredentials({ refresh_token: process.env.REFRESH_TOKEN });
    const calendar = google.calendar({ version: 'v3', auth: oAuth2Client });

    const gEvent = {
      summary:     titulo,
      description: descripcion || '',
      start: {
        dateTime: new Date(fecha_inicio).toISOString(),
        timeZone: process.env.TIMEZONE || 'America/Argentina/Buenos_Aires'
      },
      end: {
        dateTime: new Date(fecha_fin || fecha_inicio).toISOString(),
        timeZone: process.env.TIMEZONE || 'America/Argentina/Buenos_Aires'
      },
      attendees: Array.isArray(correos) && correos.length > 0
        ? correos.map(email => ({ email }))
        : [],
      conferenceData: {
        createRequest: {
          requestId: 'evento-' + Date.now()
        }
      }
    };

    const gResp = await calendar.events.insert({
      calendarId: process.env.CALENDAR_ID || 'primary',
      resource:   gEvent,
      sendUpdates: 'all',
      conferenceDataVersion: 1 // 👈 Obligatorio para Google Meet
    });

    // 3) Responder al cliente
    res.status(201).json({
      id: nuevoId,
      googleId: gResp.data.id,
      hangoutLink: gResp.data.hangoutLink // 👈 Lo podés usar en el frontend si querés
    });

  } catch (err) {
    console.error('Error creando evento + Google:', err);
    res.status(500).json({
      error: 'No se pudo crear el evento',
      details: err.response?.data?.error || err.message
    });
  }
});



// ─── BORRAR un evento propio + Google Calendar ───────────────────────
app.delete('/api/eventos/:id', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const evId    = Number(req.params.id);

    // 1) Recupero gcal_id
    const [[row]] = await pool.query(
      `SELECT gcal_id FROM eventos WHERE id = ? AND creado_por = ?`,
      [evId, userId]
    );
    if (!row) return res.status(404).json({ error: 'Evento no encontrado' });

    // 2) Borro de mi BD
    const [del] = await pool.query(
      `DELETE FROM eventos WHERE id = ? AND creado_por = ?`,
      [evId, userId]
    );
    if (del.affectedRows === 0) {
      return res.status(404).json({ error: 'Evento no encontrado' });
    }

    // 3) Borro de Google Calendar
    if (row.gcal_id) {
      oAuth2Client.setCredentials({ refresh_token: process.env.REFRESH_TOKEN });
      const calendar = google.calendar({ version: 'v3', auth: oAuth2Client });
      await calendar.events.delete({
        calendarId: process.env.CALENDAR_ID || 'primary',
        eventId:    row.gcal_id
      });
    }

    res.status(204).end();
  } catch (err) {
    console.error('Error borrando evento + Google:', err);
    res.status(500).json({ error: 'No se pudo eliminar el evento' });
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
