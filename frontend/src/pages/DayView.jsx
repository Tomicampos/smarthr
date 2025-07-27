// src/pages/DayView.jsx
import React, { useEffect, useState } from 'react';
import './DayView.css';

export default function DayView({ eventos = [], fecha = new Date() }) {
  const diaActual = new Date(fecha);
  const horas = Array.from({ length: 24 }, (_, i) => i);
  const [lineaPosY, setLineaPosY] = useState(null);

  const eventosDelDia = eventos.filter(e => e.fecha.toDateString() === diaActual.toDateString());

  const eventosPorHora = horas.map(h => {
    return eventosDelDia.filter(e => e.fecha.getHours() === h);
  });

  useEffect(() => {
    const actualizarPosicion = () => {
      const ahora = new Date();
      if (ahora.toDateString() !== diaActual.toDateString()) {
        setLineaPosY(null);
        return;
      }
      const horas = ahora.getHours();
      const minutos = ahora.getMinutes();
      const y = horas * 60 + minutos;
      setLineaPosY(y);
    };

    actualizarPosicion();
    const intervalo = setInterval(actualizarPosicion, 60000);
    return () => clearInterval(intervalo);
  }, [diaActual]);

  return (
    <div className="day-view-container">
      <div className="day-header">
        <h2 className="day-label">Vista diaria - {diaActual.toLocaleDateString()}</h2>
      </div>
      <div className="day-hours">
        {lineaPosY !== null && (
          <div className="day-current-line" style={{ top: `${lineaPosY}px` }} />
        )}

        {horas.map((h, i) => (
          <div className="day-hour" key={i}>
            <div className="day-hour-label">{h.toString().padStart(2, '0')}:00</div>
            {eventosPorHora[i].map((e, j) => (
              <div key={j} className="day-event">
                {e.titulo} ({e.fecha.getHours().toString().padStart(2, '0')}:{e.fecha.getMinutes().toString().padStart(2, '0')})
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}