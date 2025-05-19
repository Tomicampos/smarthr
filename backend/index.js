// index.js
// ATENCIÓN: En MySQL debes quitar AUTO_INCREMENT de `id`:
//   ALTER TABLE users MODIFY id INT NOT NULL;
// y mantenerlo PRIMARY KEY.

require('dotenv').config();
const express   = require('express');
const cors      = require('cors');
const pool      = require('./db');
const bcrypt    = require('bcryptjs');
const jwt       = require('jsonwebtoken');
const { google }= require('googleapis');
const multer    = require('multer');
const csvParser = require('csv-parser');
const fs        = require('fs');
const fastCsv   = require('fast-csv');

const app = express();
const PORT = process.env.PORT || 3001;
const upload = multer({ dest: 'tmp/' });

app.use(cors());
app.use(express.json());

// ─── RUTA DE PRUEBA ───────────────────────────────────────────────
app.get('/', (req, res) => {
  res.send('Backend funcionando correctamente.');
});

// ─── LOGIN / AUTENTICACIÓN ───────────────────────────────────────
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (!rows.length) return res.status(404).json({ message: 'Usuario no encontrado' });
    const user = rows[0];
    if (!await bcrypt.compare(password, user.password)) {
      return res.status(400).json({ message: 'Contraseña incorrecta' });
    }
    const token = jwt.sign(
      { id: user.id, email: user.email, rol: user.rol },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    res.json({ token });
  } catch (err) {
    console.error('Error en /login:', err);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// ─── RUTA PROTEGIDA EJEMPLO ───────────────────────────────────────
app.get('/api/protected', (req, res) => {
  const h = req.headers.authorization;
  if (!h) return res.status(401).json({ message: 'No se recibió token' });
  const token = h.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Formato de token inválido' });
  try {
    const pl = jwt.verify(token, process.env.JWT_SECRET);
    res.json({ message: 'Ruta protegida OK', user: pl });
  } catch {
    res.status(401).json({ message: 'Token inválido o expirado' });
  }
});

// ─── MOCK NOTIFICATIONS ─────────────────────────────────────────
app.get('/api/notifications', (req, res) => {
  res.json([
    { id: 1, text: 'Entrevista UX/UI', time: '07:30 AM', read: false },
    { id: 2, text: 'Recordatorio SQL', time: 'Ayer, 06:00 PM', read: false },
    // ...
  ]);
});

// ─── GOOGLE CALENDAR OAUTH2 ──────────────────────────────────────
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
  // 1) Validación previa
  if (!process.env.REFRESH_TOKEN) {
    console.error('REFRESH_TOKEN no definido en .env');
    return res
      .status(500)
      .json({ error: 'REFRESH_TOKEN no configurado en el servidor' });
  }

  try {
    // 2) Inyectamos credenciales y llamamos a la API
    oAuth2Client.setCredentials({ refresh_token: process.env.REFRESH_TOKEN });
    const calendar = google.calendar({ version: 'v3', auth: oAuth2Client });

    const resp = await calendar.events.list({
      calendarId:   process.env.CALENDAR_ID || 'primary',
      timeMin:      new Date().toISOString(),
      maxResults:   50,
      singleEvents: true,
      orderBy:      'startTime',
    });

    // 3) Si no hay items, devolvemos array vacío
    const items = resp.data.items || [];
    return res.json(items);

  } catch (err) {
    // 4) Log simplificado y respuesta JSON
    console.error('Error en /api/agenda:', err.message);
    return res
      .status(500)
      .json({ error: `No pude leer el calendario: ${err.message}` });
  }
});


// ─── EXPORTAR A CSV ──────────────────────────────────────────────
app.get('/api/users/export', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, nombre AS name, email, rol FROM users');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="usuarios.csv"');
    const csvStream = fastCsv.format({ headers: true });
    csvStream.pipe(res);
    rows.forEach(r => csvStream.write(r));
    csvStream.end();
  } catch (err) {
    console.error('Error exportando usuarios:', err);
    res.status(500).json({ error: 'No pude generar el CSV' });
  }
});

// ─── IMPORTAR DESDE CSV ───────────────────────────────────────────
app.post('/api/users/import', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No se subió ningún archivo' });
  const filePath = req.file.path;
  const inserted = [], errors = [];
  fs.createReadStream(filePath)
    .pipe(csvParser())
    .on('data', async row => {
      try {
        const hash = await bcrypt.hash(row.password || 'changeme', 10);
        const params = row.id
          ? [Number(row.id), row.name, row.email, hash, row.rol]
          : [row.name, row.email, hash, row.rol];
        const sql = row.id
          ? 'INSERT INTO users (id,nombre,email,password,rol) VALUES (?,?,?,?,?)'
          : 'INSERT INTO users (nombre,email,password,rol) VALUES (?,?,?,?)';
        await pool.query(sql, params);
        inserted.push({ email: row.email });
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
      console.error('Error CSV:', err);
      res.status(500).json({ error: 'Error procesando el CSV' });
    });
});

// ─── CRUD BÁSICO USUARIOS ────────────────────────────────────────
// Listar
app.get('/api/users', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, nombre, email, rol FROM users');
    res.json(rows);
  } catch (err) {
    console.error('Error en /api/users:', err);
    res.status(500).json({ error: 'No pude leer la tabla users' });
  }
});

// Detalle
app.get('/api/users/:id', async (req, res) => {
  try {
    const [[user]] = await pool.query(
      'SELECT id, nombre, email, rol FROM users WHERE id = ?', 
      [req.params.id]
    );
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json(user);
  } catch (err) {
    console.error('Error detalle usuario:', err);
    res.status(500).json({ error: 'Error interno' });
  }
});

// Crear
app.post('/api/users', async (req, res) => {
  let { id, nombre, email, password, rol } = req.body;
// añades validación opcional:
    if (!['empleado','admin'].includes(rol)) {
    return res.status(400).json({ error:'Rol inválido' });
}
  try {
    const hash = await bcrypt.hash(password, 10);
    await pool.query(
      'INSERT INTO users (id,nombre,email,password,rol) VALUES (?,?,?,?,?)',
      [Number(id), nombre, email, hash, rol]  // ¡rol en 'user' o 'admin' directamente!
    );
    res.status(201).json({ id: Number(id), nombre, email, rol });
  } catch (err) {
    console.error('Error creando usuario:', err);
    res.status(500).json({ error: 'Error interno' });
  }
});

// Actualizar usuario
app.put('/api/users/:id', async (req, res) => {
  const { nombre, email, rol } = req.body;
  if (!['user','admin'].includes(rol)) {
    return res.status(400).json({ error: 'Rol inválido' });
  }
  try {
    await pool.query(
      'UPDATE users SET nombre=?, email=?, rol=? WHERE id=?',
      [nombre, email, rol, Number(req.params.id)]
    );
    res.json({ id: Number(req.params.id), nombre, email, rol });
  } catch (err) {
    console.error('Error actualizando usuario:', err);
    res.status(500).json({ error: 'Error interno' });
  }
});
// Borrar
app.delete('/api/users/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM users WHERE id = ?', [Number(req.params.id)]);
    res.status(204).end();
  } catch (err) {
    console.error('Error borrando usuario:', err);
    res.status(500).json({ error: 'Error interno' });
  }
});

// ─── LEVANTO SERVIDOR ─────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 Backend escuchando en http://localhost:${PORT}`);
  console.log(`→ /api/users/export  GET`);
  console.log(`→ /api/users/import  POST`);
  console.log(`→ /api/users         CRUD`);
});
