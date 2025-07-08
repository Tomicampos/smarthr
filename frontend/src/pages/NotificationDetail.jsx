// src/pages/NotificationDetail.jsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../api';
import '../pages/Notificaciones.css'; // o tu CSS de notificaciones

export default function NotificationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [notif, setNotif] = useState(null);

  useEffect(() => {
    API.get(`/notificaciones/${id}`)
      .then(res => setNotif(res.data))
      .catch(() => {
        // si falla, volvemos atrás
        navigate(-1);
      });
  }, [id, navigate]);

  if (!notif) return <p>Cargando notificación…</p>;

  return (
    <div className="notif-detail-card">
      <button onClick={() => navigate(-1)} className="btn-outline-red">
        ← Volver
      </button>
      <h2>{notif.asunto}</h2>
      <p><b>Mensaje:</b></p>
      <div className="notif-body">{notif.mensaje}</div>
      <p>
        <b>Enviada a:</b> {notif.total_destinatarios} destinatarios<br/>
        <b>Enviados:</b> {notif.enviados}<br/>
        <b>Fecha:</b> {new Date(notif.creado_en).toLocaleString()}
      </p>
    </div>
  );
}