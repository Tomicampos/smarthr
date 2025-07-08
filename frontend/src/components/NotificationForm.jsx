import React, { useState } from 'react';
import { useToast } from './ToastContext';
import API from '../api';
import './NotificationForm.css';

export default function NotificationForm({
  destinatarios,
  setDestinatarios,
  onEnviado
}) {
  const toast = useToast();
  const [asunto, setAsunto] = useState('');
  const [cuerpo, setCuerpo] = useState('');

  const handleSubmit = async e => {
    e.preventDefault();
    if (!asunto.trim() || !cuerpo.trim() || !destinatarios.length) {
      toast.error('Asunto, cuerpo y al menos un destinatario son obligatorios.');
      return;
    }
    // construyo payload usando el key "tipo-id"
    const payload = {
      asunto,
      cuerpo,
      destinatarios: destinatarios.map(key => {
        const [type, id] = key.split('-');
        return { id: Number(id), type };
      })
    };
    try {
      await API.post('/notificaciones', payload);
      toast.success('Notificación enviada');
      setAsunto('');
      setCuerpo('');
      setDestinatarios([]);
      onEnviado();
    } catch {
      toast.error('Error al enviar notificación');
    }
  };

  return (
    <form className="notif-card" onSubmit={handleSubmit}>
      <label>Asunto</label>
      <input
        type="text"
        value={asunto}
        onChange={e => setAsunto(e.target.value)}
        className="notif-input"
      />

      <label>Mensaje</label>
      <textarea
        value={cuerpo}
        onChange={e => setCuerpo(e.target.value)}
        className="notif-textarea"
      />

      <div className="notif-actions">
        <button type="submit">Enviar</button>
      </div>
    </form>
  );
}
