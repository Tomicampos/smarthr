import React, { useState } from 'react';
import { useToast } from '../components/ToastContext';
import API from '../api';
import '../pages/Notificaciones.css';

export default function NotificationForm({ onEnviado }) {
  const toast = useToast();
  const [asunto, setAsunto] = useState('');
  const [cuerpo, setCuerpo] = useState('');
  const [todos, setTodos] = useState(true);

  const enviar = async () => {
    try {
      await API.post('/notificaciones', { asunto, cuerpo });
      toast.success('Notificación enviada');
      setAsunto('');
      setCuerpo('');
      onEnviado();
    } catch {
      toast.error('Error al enviar notificación');
    }
  };

  return (
    <div className="notif-card">
      <h3>Nueva Notificación</h3>

      <label>Asunto</label>
      <input
        type="text"
        value={asunto}
        onChange={e => setAsunto(e.target.value)}
      />

      <label>
        Cuerpo 
      </label>
      <textarea
        rows="5"
        value={cuerpo}
        onChange={e => setCuerpo(e.target.value)}
      />

      

      <div className="notif-actions">
        <button className="btn-outline-red" onClick={enviar}>
          Enviar
        </button>
      </div>
    </div>
  );
}
