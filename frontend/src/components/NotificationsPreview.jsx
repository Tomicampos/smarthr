import React, { useState, useEffect } from 'react';
import API from '../api';

export default function NotificationsPreview() {
  const [notifs, setNotifs] = useState([]);

  useEffect(() => {
    API.get('/notifications')
      .then(res => setNotifs(res.data))
      .catch(err => console.error('Error cargando notifs', err));
  }, []);

  return (
    <ul>
      {notifs.map(n => (
        <li key={n.id} className={n.read ? 'read' : ''}>
          {n.text} – <small>{n.time}</small>
        </li>
      ))}
    </ul>
  );
}
