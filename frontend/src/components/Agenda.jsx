import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './Agenda.css';

export default function Agenda() {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    axios.get('http://localhost:3001/api/agenda')
      .then(res => setEvents(res.data))
      .catch(console.error);
  }, []);

  return (
    <div className="agenda-card">
      <h3>Agenda</h3>
      <ul className="agenda-list">
        {events.map((e, i) => (
          <li key={i} className="agenda-item">
            <div className="agenda-time">
              {new Date(e.date).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
            </div>
            <div className="agenda-content">
              <div className="agenda-title">{e.title}</div>
              {e.desc && <div className="agenda-desc">{e.desc}</div>}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
