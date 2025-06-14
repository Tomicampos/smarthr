// src/components/Cronograma.jsx
import React, { useEffect, useState } from 'react';
import { FiChevronRight } from 'react-icons/fi';
import API from '../api';
import './Cronograma.css';
import { useNavigate } from 'react-router-dom';

const MAX_EVENTOS = 7;

export default function Cronograma() {
  const [sections, setSections] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        // 1) Traemos todos los procesos de agenda
        const res = await API.get('/agenda');
        const eventos = Array.isArray(res.data) ? res.data : [];

        // 2) Convertimos a lista plana con fecha y hora
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

        // 3) Tomamos solo los primeros MAX_EVENTOS
        const top = planos.slice(0, MAX_EVENTOS);

        // 4) Reagrupamos por fecha
        const grouped = top.reduce((acc, e) => {
          if (!acc[e.date]) acc[e.date] = [];
          acc[e.date].push({
            time: e.time,
            title: e.title,
            desc: e.desc
          });
          return acc;
        }, {});

        // 5) Pasamos a array de secciones
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
          onClick={() => navigate('/agenda')}
        >
          Ver Más <FiChevronRight />
        </button>
      </div>
    </div>
  );
}
