// src/AppLogin.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';        // ← Usaremos axios “a secas” para el login
import './App.css';               // ← Asegúrate de tener este archivo App.css en src/

export default function AppLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      // Llamamos directamente a http://localhost:3001/login (sin /api)
      const { data } = await axios.post('http://localhost:3001/login', {
        email,
        password
      });
      // Guardamos el token en localStorage
      localStorage.setItem('token', data.token);
      // Redirigimos a /home (u otra ruta protegida)
      navigate('/home');
    } catch (err) {
      console.error('Error en login:', err);
      alert('Usuario o contraseña incorrectos');
    }
  };

  return (
    <div className="login-container">
      <h2>Iniciar Sesión</h2>
      <form onSubmit={handleSubmit} className="login-form">
        <div className="form-group">
          <label>Email:</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            className="input-field"
          />
        </div>
        <div className="form-group">
          <label>Contraseña:</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            className="input-field"
          />
        </div>
        <button type="submit" className="btn-login">Ingresar</button>
      </form>
    </div>
  );
}
