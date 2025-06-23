import React, { useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import '../styles/PageForm.css';
import './OlvideContrasena.css'; // si necesitas ajustes extra

export default function OlvideContrasena() {
  const [email, setEmail] = useState('');
  const [estado, setEstado] = useState(null);

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:3001/auth/forgot-password', { email });
      setEstado('¡Listo! Si ese email existe, recibirás un enlace en tu bandeja.');
    } catch {
      setEstado('Ocurrió un error. Intenta de nuevo más tarde.');
    }
  };

  return (
    <div className="page-form-container">
      <h2>Recuperar contraseña</h2>
      <form className="page-form" onSubmit={handleSubmit}>
        <label htmlFor="email">Email de tu cuenta:</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        <button type="submit">Enviar enlace</button>
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
