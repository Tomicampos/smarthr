// src/AppLogin.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import { useToast } from './components/ToastContext'; // ← agregado
import './App.css';

export default function AppLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const toast = useToast(); // ← agregado

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      const { data } = await axios.post('http://localhost:3001/login', { email, password });
      localStorage.setItem('token', data.token);
      navigate('/home');
    } catch (err) {
      console.error('Error en login:', err);
      toast.error('Usuario o contraseña incorrectos'); // ← reemplaza alert
    }
  };
  return (
    <div className="login-container">
      <div className="login-card">
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
            <div className="password-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="login-input"
              />
              <span
                className="toggle-password"
                onClick={() => setShowPassword(v => !v)}
              >
                {showPassword ? <FiEyeOff title='Ocultar contraseña' /> : <FiEye title='Mostrar contraseña'/>}
              </span>
            </div>
          </div>

          <button type="submit" className="btn">
            Ingresar
          </button>
        </form>

        <div className="footer">
          <Link to="/olvide-contraseña" className="forgot-link">
            ¿Olvidaste tu contraseña?
          </Link>
        </div>
      </div>
    </div>
  );
}
