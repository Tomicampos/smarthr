import React, { useEffect, useState } from 'react';
import api from '../api';            // ← tu instancia
import './NotificationsPreview.css';
import { FiChevronRight } from 'react-icons/fi';

export default function NotificationsPreview() {
  const [notifs, setNotifs] = useState([]);

  useEffect(() => {
    api.get('/notifications')
       .then(res => {
         console.log('NOTIFS:', res.data);
         setNotifs(res.data);
       })
       .catch(err => {
         console.error('Error cargando notifs', err);
       });
  }, []);

  return (
    <div className="notif-card">
      <div className="notif-header">
        <h3>Últimas Notificaciones</h3>
        <button className="view-all">Ver Todo <FiChevronRight/></button>
      </div>
      <ul className="notif-list">
        {notifs.map(n => (
          <li key={n.id} className="notif-item">
            {!n.read && <span className="dot" />}
            <span className="notif-text">{n.text}</span>
            <span className="notif-time">{n.time}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
