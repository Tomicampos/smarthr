// src/components/NotificationsPreview.jsx
import React, { useEffect, useState } from 'react';
import { FiChevronRight } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import API from '../api';
import './NotificationsPreview.css';

// Helper para decodificar el payload del JWT
function decodePayload(token) {
  try {
    const base64 = token.split('.')[1];
    const json = atob(base64.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(json);
  } catch {
    return {};
  }
}

export default function NotificationsPreview() {
  const [notifs, setNotifs] = useState([]);
  const navigate = useNavigate();

  // Decodificamos rol una sola vez
  const token = localStorage.getItem('token');
  const payload = token ? decodePayload(token) : {};
  const rawRole = (payload.rol || payload.role || '').toLowerCase();
  const isAdmin = rawRole === 'admin';

  useEffect(() => {
    API.get('/notificaciones')
      .then(r => setNotifs(r.data.slice(0, 5))) // traemos solo las 5 últimas
      .catch(err => console.error('Error cargando notifs', err));
  }, []);

  // Ruta destino según rol
  const handleViewAll = () => {
    if (isAdmin) {
      navigate('/notificaciones');
    } else {
      navigate('/mis-notificaciones');
    }
  };

  return (
    <div className="notif-card">
      <div className="notif-header">
        <h3>Últimas Notificaciones</h3>
        <button className="view-all" onClick={handleViewAll}>
          Ver Todas <FiChevronRight />
        </button>
      </div>
      <ul className="notif-list">
        {notifs.map((n, i) => (
          <li key={i}>
            <span className={`status-dot ${n.read ? 'read' : ''}`}></span>
            <span className="notif-text">{n.asunto}</span>
            <span className="notif-time">
              {new Date(n.creado_en).toLocaleTimeString('es-AR', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </li>
        ))}
        {!notifs.length && (
          <li className="no-data">No hay notificaciones.</li>
        )}
      </ul>
    </div>
  );
}
