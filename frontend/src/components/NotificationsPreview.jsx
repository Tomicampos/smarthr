import React, { useEffect, useState } from 'react';
import { FiChevronRight } from 'react-icons/fi';
import API from '../api';
import './NotificationsPreview.css';

export default function NotificationsPreview() {
  const [notifs, setNotifs] = useState([]);

  useEffect(() => {
    API.get('/notificaciones')
      .then(r => setNotifs(r.data.slice(0, 5))) // traemos solo las 5 últimas
      .catch(err => console.error('Error cargando notifs', err));
  }, []);

  return (
    <div className="notif-card">
      <div className="notif-header">
        <h3>Últimas Notificaciones</h3>
        <button
          className="view-all"
          onClick={() => window.location.href = '/notificaciones'}
        >
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
                hour: '2-digit', minute: '2-digit'
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
