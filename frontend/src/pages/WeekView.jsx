import React, { useEffect, useState } from 'react';
import './Agenda.css';
import './WeekView.css';

export default function WeekView({ eventos, fechaBase }) {
  const semanaActual = obtenerSemanaActual(fechaBase);
  const [horaActualTop, setHoraActualTop] = useState(calcularPosicionHoraActual());

  useEffect(() => {
    const intervalo = setInterval(() => {
      setHoraActualTop(calcularPosicionHoraActual());
    }, 60000);
    return () => clearInterval(intervalo);
  }, []);

  return (
    <div className="week-view">
      <div className="week-days-header">
        <div className="hora-columna" />
        {semanaActual.map((dia, i) => (
          <div key={i} className="day-column-header">
            <div>{dia.toLocaleDateString('es-AR', { weekday: 'short' }).toUpperCase()}</div>
            <div>{dia.getDate()}</div>
          </div>
        ))}
      </div>
      <div className="week-grid">
        <div className="hora-columna">
          {Array.from({ length: 24 }).map((_, i) => (
            <div key={i} className="hora-etiqueta">{i}:00</div>
          ))}
        </div>
        {semanaActual.map((dia, i) => {
          const eventosDia = eventos.filter(e =>
            e.fecha.getDate() === dia.getDate() &&
            e.fecha.getMonth() === dia.getMonth() &&
            e.fecha.getFullYear() === dia.getFullYear()
          );

          const esHoy = esMismoDia(dia, new Date());

          return (
            <div key={i} className="dia-columna">
              {esHoy && (
                <div className="linea-roja" style={{ top: `${horaActualTop}px` }} />
              )}
              {eventosDia.map((e, j) => {
                const top = e.fecha.getHours() * 50 + (e.fecha.getMinutes() * 50 / 60);
                return (
                  <div
                    key={j}
                    className="evento-celda"
                    style={{ top }}
                  >
                    {e.titulo}, {e.fecha.getHours()}:{e.fecha.getMinutes().toString().padStart(2, '0')}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function obtenerSemanaActual(fechaReferencia) {
  const inicioSemana = new Date(fechaReferencia);
  inicioSemana.setDate(inicioSemana.getDate() - inicioSemana.getDay());
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(inicioSemana);
    d.setDate(inicioSemana.getDate() + i);
    return d;
  });
}

function calcularPosicionHoraActual() {
  const ahora = new Date();
  const horas = ahora.getHours();
  const minutos = ahora.getMinutes();
  return horas * 50 + (minutos * 50 / 60);
}

function esMismoDia(fecha1, fecha2) {
  return (
    fecha1.getDate() === fecha2.getDate() &&
    fecha1.getMonth() === fecha2.getMonth() &&
    fecha1.getFullYear() === fecha2.getFullYear()
  );
}
