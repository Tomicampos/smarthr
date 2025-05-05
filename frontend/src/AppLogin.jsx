// src/AppLogin.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './App.css';

export default function AppLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mensaje, setMensaje] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      const { data } = await axios.post('http://localhost:3001/login', { email, password });
      localStorage.setItem('smarthr_token', data.token);
      navigate('/dashboard');
    } catch (err) {
      setMensaje('Error: ' + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <img src="/emser.png" alt="Emser Logo" />
        <h2>Inicia Sesión en tu cuenta</h2>
        <form onSubmit={handleSubmit}>
          <label htmlFor="email">Correo Electrónico</label>
          <input
            className="login-input"
            id="email"
            type="email"
            placeholder="Correo Electrónico"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
          <label htmlFor="password">Contraseña</label>
          <input
            className="login-input"
            id="password"
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
          <button type="submit" className="btn">Iniciar Sesión</button>
        </form>
        {mensaje && (
          <p className={mensaje.startsWith('Error') ? 'error' : 'success'}>
            {mensaje}
          </p>
        )}
      </div>
    </div>
  );
}
