// src/pages/Agenda.jsx
import React, { useState, useEffect } from 'react';
import API from '../api';
import './Agenda.css';

const MESES = [
  'Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'
];
const DIAS_SEMANA = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];

export default function Agenda() {
  const hoy = new Date();
  const [mes, setMes]       = useState(hoy.getMonth());
  const [año, setAño]       = useState(hoy.getFullYear());
  const [diasMes, setDiasMes]   = useState([]);
  const [blancos, setBlancos]   = useState([]);
  const [eventos, setEventos]   = useState([]);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [evtTitulo, setEvtTitulo]       = useState('');
  const [evtFecha, setEvtFecha]         = useState('');

  // 1) recalcular blancos y días en mes/año
  useEffect(() => {
    const último = new Date(año, mes + 1, 0).getDate();
    const primer = new Date(año, mes, 1).getDay();
    setBlancos(Array(primer).fill(null));
    setDiasMes(Array.from({ length: último }, (_, i) => i + 1));
  }, [mes, año]);

  // 2) traer Google Calendar + feriados argentinos
  useEffect(() => {
    async function fetchAll() {
      try {
        // a) eventos de Google Calendar
        const { data: agendaData } = await API.get('/agenda');
        const evAgenda = Array.isArray(agendaData)
          ? agendaData.map(e => {
              const dt = e.start?.dateTime || e.start?.date;
              return {
                fecha: new Date(dt),
                titulo: e.summary,
                desc: e.description || '',
                tema: 'azul'
              };
            })
          : [];

        // b) feriados argentinos desde Nager API
        //    docs: https://date.nager.at/swagger/index.html
        const respF = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${año}/AR`);
        const feriadosJson = await respF.json();
        const evFeriados = Array.isArray(feriadosJson)
          ? feriadosJson.map(f => ({
              fecha: new Date(f.date),
              titulo: f.localName,
              desc: f.name,
              tema: 'rojo'
            }))
          : [];

        // c) combinamos y guardamos
        setEventos([...evAgenda, ...evFeriados]);
      } catch (err) {
        console.error('Error cargando agenda o feriados:', err);
      }
    }
    fetchAll();
  }, [año]);

  // marca el día de hoy
  function esHoy(d) {
    const dd = new Date(año, mes, d);
    return dd.toDateString() === new Date().toDateString();
  }

  // abre modal para agregar evento local
  function abrirModal(d) {
    setEvtFecha(new Date(año, mes, d).toDateString());
    setModalAbierto(true);
  }

  // guarda evento local (no persiste en backend)
  function guardarEvento() {
    if (!evtTitulo) return;
    setEventos([
      ...eventos,
      { fecha: new Date(evtFecha), titulo: evtTitulo, desc: '', tema: 'verde' }
    ]);
    setEvtTitulo('');
    setModalAbierto(false);
  }

  return (
    <div className="agenda-container">
      <div className="agenda-card">
        <h1 className="agenda-title">Mi Agenda</h1>

        <header className="agenda-header">
          <div>
            <span className="agenda-mes">{MESES[mes]}</span>{' '}
            <span className="agenda-año">{año}</span>
          </div>
          <div className="agenda-nav">
            <button onClick={() => mes > 0 && setMes(m => m - 1)} disabled={mes === 0}>‹</button>
            <button onClick={() => mes < 11 && setMes(m => m + 1)} disabled={mes === 11}>›</button>
          </div>
        </header>

        <div className="agenda-grid">
          {DIAS_SEMANA.map(d => (
            <div key={d} className="agenda-dia-nombre">{d}</div>
          ))}

          {blancos.map((_, i) => (
            <div key={`b${i}`} className="agenda-celda vacia" />
          ))}

          {diasMes.map(d => {
            // filtramos eventos + feriados para este día
            const evs = eventos.filter(e =>
              e.fecha.getFullYear() === año &&
              e.fecha.getMonth()      === mes  &&
              e.fecha.getDate()       === d
            );
            return (
              <div key={d} className="agenda-celda">
                <div
                  className={`agenda-numero ${esHoy(d) ? 'hoy' : ''}`}
                  onClick={() => abrirModal(d)}
                >
                  {d}
                </div>
                <div className="agenda-eventos">
                  {evs.map((e, i) => (
                    <div key={i} className={`evt evt-${e.tema}`}>
                      {e.titulo}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {modalAbierto && (
        <div className="agenda-modal-backdrop">
          <div className="agenda-modal">
            <h2>Agregar evento</h2>
            <label>Título</label>
            <input
              value={evtTitulo}
              onChange={e => setEvtTitulo(e.target.value)}
            />
            <label>Fecha</label>
            <input value={evtFecha} readOnly />
            <div className="agenda-modal-actions">
              <button onClick={() => setModalAbierto(false)}>Cancelar</button>
              <button onClick={guardarEvento}>Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
