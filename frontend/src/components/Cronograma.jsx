// src/components/Cronograma.jsx
import React from 'react';
import './Cronograma.css';
import { FiChevronRight } from 'react-icons/fi';

// Datos de ejemplo
const events = [
  { date: '20 de Mayo de 2025', items: [
    { time: '10:00', title: 'Reunión', desc: 'Reunión con el equipo', color: 'bg-blue-500' },
    { time: '01:00', title: 'Entrevista', desc: 'Candidato Full Stack Developer', color: 'bg-red-500' }
  ]},
  { date: '21 de Mayo de 2025', items: [
    { time: '09:00', title: 'Reunión de equipo', desc: 'Planificación Q4', color: 'bg-blue-500' }
  ]},
  { date: '22 de Mayo de 2025', items: [
    { time: '09:00', title: 'Entrevista', desc: 'Candidato Junior Backend', color: 'bg-red-500' },
    { time: '12:30', title: 'Entrevista', desc: 'Candidato Full Stack Developer', color: 'bg-red-500' },
    { time: '15:00', title: 'Reunión', desc: 'Reunión de pilotos', color: 'bg-blue-500' },
    { time: '16:30', title: 'After Office', desc: 'Happy hour', color: 'bg-green-500' }
  ]}
];

export default function Cronograma() {
  return (
    <div className="cronograma-card">
      <div className="cronograma-header">
        <h3>Cronograma</h3>
        <button className="view-more">Ver Más <FiChevronRight /></button>
      </div>
      {events.map(section => (
        <div key={section.date} className="cronograma-section">
          <div className="section-date">{section.date}</div>
          {section.items.map((e, idx) => (
            <div key={idx} className="event-item">
              <div className="event-time">{e.time}</div>
              <div className="event-bar" />
              <div className="event-content">
                <div className="event-title">{e.title}</div>
                <div className="event-desc">{e.desc}</div>
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
