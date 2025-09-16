import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useToast } from '../components/ToastContext';
import '../styles/PageForm.css';
import './RestablecerContrasena.css';

export default function RestablecerContrasena() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const navigate = useNavigate();
  const toast = useToast();
  const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm]   = useState('');
  const [sending, setSending]   = useState(false);

  useEffect(() => {
    if (!token) toast.error('Token inválido o ausente.');
  }, [token, toast]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (sending) return;
    if (password.length < 6) { toast.error('Mínimo 6 caracteres.'); return; }
    if (password !== confirm) { toast.error('Las contraseñas no coinciden.'); return; }
    setSending(true);
    try {
      const res = await axios.post(`${BASE}/auth/reset-password`, { token, password }, { validateStatus: () => true });
      if (res.status >= 200 && res.status < 300) {
        toast.success('Contraseña restablecida.');
        setTimeout(() => navigate('/login'), 1500);
      } else {
        toast.error(res.data?.message || 'Enlace inválido o expirado.');
      }
    } catch {
      toast.error('No se pudo contactar al servidor.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="page-form-container">
      <h2>Restablecer contraseña</h2>
      <form className="page-form" onSubmit={handleSubmit}>
        <label htmlFor="password">Nueva contraseña:</label>
        <input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required disabled={sending}/>
        <label htmlFor="confirm">Repetir contraseña:</label>
        <input id="confirm" type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required disabled={sending}/>
        <button type="submit" disabled={sending}>{sending ? 'Guardando…' : 'Restablecer'}</button>
      </form>
      <p style={{ textAlign: 'center', marginTop: '1rem' }}>
        <Link to="/login" style={{ color: '#dc2626', textDecoration: 'none' }}>
          Volver al inicio
        </Link>
      </p>
    </div>
  );
}
