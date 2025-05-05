const express = require('express');
const cors = require('cors');
require('dotenv').config();
const pool = require('./db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors());
app.use(express.json());

// Ruta para probar backend
app.get('/', (req, res) => {
  res.send('Backend funcionando correctamente.');
});

// Ruta para login
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Contraseña incorrecta' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, rol: user.rol },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({ token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// ——— Punto 1: Ruta protegida de prueba ———
app.get('/api/protected', (req, res) => {
  // 1) Leer encabezado Authorization
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ message: 'No se recibió token' });
  }

  // 2) Extraer el token (formato “Bearer <token>”)
  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Formato de token inválido' });
  }

  // 3) Verificar el token
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    // 4) Si es válido, devolvemos un mensaje de éxito
    return res.json({ message: 'Ruta protegida OK', user: payload });
  } catch (err) {
    return res.status(401).json({ message: 'Token inválido o expirado' });
  }
});
// ————————————————————————————————————————

  // backend/index.js, tras tus rutas existentes
app.get('/api/notifications', (req, res) => {
  // Idealmente vendrían de la base de datos; aquí mockeamos:
  res.json([
    { id: 1, text: 'Entrevista con postulantes diseño UX/UI', time: '07:30 AM', read: false },
    { id: 2, text: '[Recordatorio] Cargar nuevos empleados al sistema', time: 'Ayer, 06:00 PM', read: false },
    { id: 3, text: 'Se encuentran cargados todos los recibos de sueldo', time: 'Martes 17/09 17:55 PM', read: true },
    { id: 4, text: 'El área de soporte solicitó una capacitación en SQL', time: 'Jueves 13/09 17:55 PM', read: true },
    { id: 5, text: 'El día está soleado.', time: 'Lunes 10/09 17:55 PM', read: true },
  ]);
});


app.listen(PORT, () => {
  console.log(`Servidor backend corriendo en http://localhost:${PORT}`);
});
