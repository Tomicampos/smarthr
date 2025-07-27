// src/components/EventoModal.jsx
import React, { useState, useEffect } from 'react';
import API from '../api';
import './EventoModal.css';

export default function EventoModal({ abierto, onClose, eventoActual, onSave }) {
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');

  useEffect(() => {
    if (eventoActual) {
      setTitulo(eventoActual.titulo || '');
      setDescripcion(eventoActual.descripcion || '');
      setFechaInicio(eventoActual.fecha_inicio?.slice(0, 16) || '');
      setFechaFin(eventoActual.fecha_fin?.slice(0, 16) || '');
    } else {
      const ahora = new Date();
      const iso = ahora.toISOString().slice(0, 16);
      setTitulo('');
      setDescripcion('');
      setFechaInicio(iso);
      setFechaFin(iso);
    }
  }, [eventoActual]);

  const guardar = async () => {
    const payload = {
      titulo,
      descripcion,
      fecha_inicio: fechaInicio,
      fecha_fin: fechaFin
    };

    try {
      if (eventoActual?.id) {
        await API.put(`/eventos/${eventoActual.id}`, payload);
      } else {
        await API.post('/eventos', payload);
      }
      onSave();
      onClose();
    } catch (err) {
      console.error('Error guardando evento:', err);
    }
  };

  const borrar = async () => {
    try {
      await API.delete(`/eventos/${eventoActual.id}`);
      onSave();
      onClose();
    } catch (err) {
      console.error('Error borrando evento:', err);
    }
  };

  if (!abierto) return null;

  return (
    <div className="evento-modal-backdrop">
      <div className="evento-modal">
        <h2>{eventoActual ? 'Editar evento' : 'Nuevo evento'}</h2>
        <label>Título</label>
        <input value={titulo} onChange={e => setTitulo(e.target.value)} />
        <label>Descripción</label>
        <textarea value={descripcion} onChange={e => setDescripcion(e.target.value)} />
        <label>Fecha inicio</label>
        <input type="datetime-local" value={fechaInicio} onChange={e => setFechaInicio(e.target.value)} />
        <label>Fecha fin</label>
        <input type="datetime-local" value={fechaFin} onChange={e => setFechaFin(e.target.value)} />
        <div className="evento-modal-actions">
          <button onClick={onClose}>Cancelar</button>
          {eventoActual && <button onClick={borrar}>Eliminar</button>}
          <button onClick={guardar}>{eventoActual ? 'Guardar' : 'Crear'}</button>
        </div>
      </div>
    </div>
  );
}
