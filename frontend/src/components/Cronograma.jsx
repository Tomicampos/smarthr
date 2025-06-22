// src/components/Cronograma.jsx
import React, { useEffect, useState } from 'react';
import { FiChevronRight } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import API from '../api';
import './Cronograma.css';

const MAX_EVENTOS = 7;

// Helper para extraer rol del JWT
function getUserRole() {
  const token = localStorage.getItem('token');
  if (!token) return null;
  try {
    const b = token.split('.')[1];
    const payload = JSON.parse(atob(b.replace(/-/g,'+').replace(/_/g,'/')));
    return (payload.rol || payload.role || '').toLowerCase();
  } catch {
    return null;
  }
}

export default function Cronograma() {
  const [sections, setSections] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const res = await API.get('/agenda');
        const eventos = Array.isArray(res.data) ? res.data : [];

        const planos = eventos.map(evt => {
          const start = new Date(evt.start.dateTime || evt.start.date);
          const dateKey = start.toLocaleDateString('es-AR', {
            day: '2-digit', month: 'long', year: 'numeric'
          });
          const timeLabel = start.toLocaleTimeString('es-AR', {
            hour: '2-digit', minute: '2-digit', hour12: false
          });
          return {
            date: dateKey,
            time: timeLabel,
            title: evt.summary,
            desc: evt.description
          };
        });

        const top = planos.slice(0, MAX_EVENTOS);

        const grouped = top.reduce((acc, e) => {
          if (!acc[e.date]) acc[e.date] = [];
          acc[e.date].push({
            time: e.time,
            title: e.title,
            desc: e.desc
          });
          return acc;
        }, {});

        const secs = Object.entries(grouped).map(([date, items]) => ({
          date, items
        }));

        setSections(secs);
      } catch (err) {
        console.error('Error cargando cronograma:', err);
        setSections([]);
      }
    })();
  }, []);

  const handleVerMas = () => {
    const role = getUserRole();
    if (role === 'admin') {
      navigate('/agenda');
    } else {
      navigate('/mi-agenda');
    }
  };

  return (
    <div className="cronograma-card">
      <div className="cronograma-header">
        <h3>Cronograma</h3>
        <span className="dot" />
      </div>
      <div className="cronograma-body">
        {sections.map(section => (
          <div key={section.date} className="cronograma-section">
            <div className="section-date">{section.date}</div>
            {section.items.map((e, i) => (
              <div key={i} className="event-item">
                <div className="event-time">{e.time}</div>
                <div className="event-bar" />
                <div className="event-content">
                  <div className="event-title">{e.title}</div>
                  {e.desc && <div className="event-desc">{e.desc}</div>}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
      <div className="cronograma-footer">
        <button
          className="view-more"
          onClick={handleVerMas}
        >
          Ver Más <FiChevronRight />
        </button>
      </div>
    </div>
  );
}
