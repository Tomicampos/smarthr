// src/components/EventForm.jsx
import React, { useState, useEffect } from 'react';
import './EventForm.css';

export default function EventForm({ evento, onSave, onCancel }) {
  // evento: { id?, titulo, descripcion, fecha_inicio, fecha_fin }
  const [titulo, setTitulo] = useState(evento?.titulo || '');
  const [desc, setDesc]     = useState(evento?.descripcion || '');
  const [inicio, setInicio] = useState(
    evento?.fecha_inicio?.slice(0,16) || '' // formato "YYYY-MM-DDTHH:mm"
  );
  const [fin, setFin]       = useState(evento?.fecha_fin?.slice(0,16) || '');

  const submit = e => {
    e.preventDefault();
    onSave({
      ...evento,
      titulo,
      descripcion: desc,
      fecha_inicio: inicio,
      fecha_fin: fin || null
    });
  };

  return (
    <form className="event-form" onSubmit={submit}>
      <label>Título</label>
      <input
        required
        value={titulo}
        onChange={e => setTitulo(e.target.value)}
        type="text"
      />

      <label>Descripción</label>
      <textarea
        value={desc}
        onChange={e => setDesc(e.target.value)}
        rows="3"
      />

      <label>Inicio</label>
      <input
        required
        type="datetime-local"
        value={inicio}
        onChange={e => setInicio(e.target.value)}
      />

      <label>Fin</label>
      <input
        type="datetime-local"
        value={fin}
        onChange={e => setFin(e.target.value)}
      />

      <div className="event-form-actions">
        <button type="button" onClick={onCancel}>Cancelar</button>
        <button type="submit">Guardar</button>
      </div>
    </form>
  );
}
