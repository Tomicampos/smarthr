import React, { useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { useToast } from '../components/ToastContext';
import '../styles/PageForm.css';
import './OlvideContrasena.css';

export default function OlvideContrasena() {
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const toast = useToast();
  const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (sending) return;
    setSending(true);
    try {
      await axios.post(`${BASE}/auth/forgot-password`, { email }, { validateStatus: () => true });
      toast.success('Si ese email existe, recibirás un enlace en tu bandeja.');
    } catch {
      toast.error('No se pudo contactar al servidor.');
    } finally {
      setSending(false);
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
          disabled={sending}
        />
        <button type="submit" disabled={sending}>
          {sending ? 'Enviando…' : 'Enviar enlace'}
        </button>
      </form>
      <p style={{ textAlign: 'center', marginTop: '1rem' }}>
        <Link to="/login" style={{ color: '#dc2626', textDecoration: 'none' }}>
          Volver al inicio
        </Link>
      </p>
    </div>
  );
}
