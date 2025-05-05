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

app.listen(PORT, () => {
  console.log(`Servidor backend corriendo en http://localhost:${PORT}`);
});
