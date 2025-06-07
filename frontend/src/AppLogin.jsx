// src/AppLogin.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';        
import './App.css';               

export default function AppLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      const { data } = await axios.post('http://localhost:3001/login', { email, password });
      localStorage.setItem('token', data.token);
      navigate('/home');
    } catch (err) {
      console.error('Error en login:', err);
      alert('Usuario o contraseña incorrectos');
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        {/* Si tu logo se llama logo.png y está en public/ */}
        <img src="/emser.png" alt="Logo" />
        <h2>Iniciar Sesión</h2>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label>Email:</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="login-input"
            />
          </div>
          <div className="form-group">
            <label>Contraseña:</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="login-input"
            />
          </div>
          <button type="submit" className="btn">
            Ingresar
          </button>
        </form>

        <div className="footer">
          ¿Olvidaste tu contraseña? <a href="#">Recupérala aquí</a>
        </div>
      </div>
    </div>
  );
}
