import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import '../styles/PageForm.css';
import './RestablecerContrasena.css'; // si necesitas ajustes extra

export default function RestablecerContrasena() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirm, setConfirm]   = useState('');
  const [estado, setEstado]     = useState(null);

  useEffect(() => {
    if (!token) {
      setEstado('Token inválido o ausente.');
    }
  }, [token]);

  const handleSubmit = async e => {
    e.preventDefault();
    if (password.length < 6) {
      setEstado('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (password !== confirm) {
      setEstado('Las contraseñas no coinciden.');
      return;
    }
    try {
      await axios.post(
        'http://localhost:3001/auth/reset-password',
        { token, password }
      );
      setEstado('¡Contraseña restablecida con éxito!');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setEstado(
        err.response?.data?.message ||
        'Error al restablecer. El enlace puede haber expirado.'
      );
    }
  };

  return (
    <div className="page-form-container">
      <h2>Restablecer contraseña</h2>
      <form className="page-form" onSubmit={handleSubmit}>
        <label htmlFor="password">Nueva contraseña:</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />

        <label htmlFor="confirm">Repetir contraseña:</label>
        <input
          id="confirm"
          type="password"
          value={confirm}
          onChange={e => setConfirm(e.target.value)}
          required
        />

        <button type="submit">Restablecer</button>
      </form>
      {estado && <p className="page-form-status">{estado}</p>}
      <p style={{ textAlign: 'center', marginTop: '1rem' }}>
        <Link to="/login" style={{ color: '#dc2626', textDecoration: 'none' }}>
          Volver al inicio
        </Link>
      </p>
    </div>
  );
}
