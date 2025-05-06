// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const pool = require('./db');                // tu configuración de MySQL/MariaDB
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { google } = require('googleapis');

const app = express();
const PORT = process.env.PORT || 3001;

// ─── Middlewares ──────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json()); // parsea JSON bodies en todas las rutas

// ─── RUTA DE PRUEBA ────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.send('Backend funcionando correctamente.');
});

// ─── LOGIN / AUTENTICACIÓN ─────────────────────────────────────────────────────
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    // 1) Buscamos el usuario en BD
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    const user = rows[0];

    // 2) Comparamos password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Contraseña incorrecta' });
    }

    // 3) Firmamos un JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, rol: user.rol },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // 4) Retornamos el token
    res.json({ token });

  } catch (error) {
    console.error('Error en /login:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// ─── RUTA PROTEGIDA DE EJEMPLO ─────────────────────────────────────────────────
app.get('/api/protected', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ message: 'No se recibió token' });
  }
  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Formato de token inválido' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    res.json({ message: 'Ruta protegida OK', user: payload });
  } catch (err) {
    res.status(401).json({ message: 'Token inválido o expirado' });
  }
});

// ─── NOTIFICACIONES (mock) ────────────────────────────────────────────────────
app.get('/api/notifications', (req, res) => {
  res.json([
    { id: 1, text: 'Entrevista con postulantes diseño UX/UI', time: '07:30 AM', read: false },
    { id: 2, text: '[Recordatorio] Cargar nuevos empleados al sistema', time: 'Ayer, 06:00 PM', read: false },
    { id: 3, text: 'Se encuentran cargados todos los recibos de sueldo', time: 'Martes 17/09 17:55 PM', read: true },
    { id: 4, text: 'El área de soporte solicitó una capacitación en SQL', time: 'Jueves 13/09 17:55 PM', read: true },
    { id: 5, text: 'El día está soleado.', time: 'Lunes 10/09 17:55 PM', read: true },
  ]);
});

// ─── GOOGLE CALENDAR OAUTH2 ────────────────────────────────────────────────────
// 1) Configuro el OAuth2Client
const oAuth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  process.env.REDIRECT_URI
);

// 2) /auth → inicia flujo Google
app.get('/auth', (req, res) => {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/calendar.readonly']
  });
  res.redirect(authUrl);
});

// 3) /oauth2callback → recibe code y logea refresh_token
app.get('/oauth2callback', async (req, res) => {
  try {
    const { code } = req.query;
    const { tokens } = await oAuth2Client.getToken(code);
    console.log('REFRESH_TOKEN:', tokens.refresh_token);
    res.send('Autorizado! Copiá el REFRESH_TOKEN de la consola y pégalo en tu .env');
  } catch (err) {
    console.error('Error intercambiando código por tokens', err);
    res.status(500).send('Error en la autorización');
  }
});

// 4) /api/agenda → expone los eventos del Google Calendar
app.get('/api/agenda', async (req, res) => {
  try {
    oAuth2Client.setCredentials({ refresh_token: process.env.REFRESH_TOKEN });
    const calendar = google.calendar({ version: 'v3', auth: oAuth2Client });
    const resp = await calendar.events.list({
      calendarId:   process.env.CALENDAR_ID,      // p.ej. 'primary'
      timeMin:      (new Date()).toISOString(),
      maxResults:   10,
      singleEvents: true,
      orderBy:      'startTime'
    });
    res.json(resp.data.items);
  } catch (err) {
    console.error('Error al leer calendario:', err);
    res.status(500).json({ error: 'No pude leer tu calendario' });
  }
});

// ─── LEVANTO EL SERVIDOR ───────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 Backend escuchando en http://localhost:${PORT}`);
  console.log(`→ Visita http://localhost:${PORT}/auth para autorizar Google`);
});
