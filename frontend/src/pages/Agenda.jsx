import React, { useState, useEffect } from 'react';
import API from '../api';
import './Agenda.css';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';

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

  // recalcular blancos y días en mes/año
  useEffect(() => {
    const último = new Date(año, mes + 1, 0).getDate();
    const primer = new Date(año, mes, 1).getDay();
    setBlancos(Array(primer).fill(null));
    setDiasMes(Array.from({ length: último }, (_, i) => i + 1));
  }, [mes, año]);

  // traer Google Calendar + feriados argentinos
  useEffect(() => {
    async function fetchAll() {
      try {
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

  // navegadores de mes cruzando año
  const prevMonth = () => {
    if (mes > 0) setMes(m => m - 1);
    else {
      setMes(11);
      setAño(a => a - 1);
    }
  };
  const nextMonth = () => {
    if (mes < 11) setMes(m => m + 1);
    else {
      setMes(0);
      setAño(a => a + 1);
    }
  };
  const volverHoy = () => {
    setMes(hoy.getMonth());
    setAño(hoy.getFullYear());
  };

  return (
    <div className="agenda-container">
      <div className="agenda-card">
        <h1 className="agenda-title">Mi Agenda</h1>

        <header className="agenda-header">
          <div className="agenda-header-left">
            <span className="agenda-mes">{MESES[mes]}</span>{' '}
            <span className="agenda-año">{año}</span>
          </div>
          <div className="agenda-header-right">
            <button
              className="arrow-btn"
              onClick={prevMonth}
              title="Mes anterior"
            >
              <FiChevronLeft />
            </button>
            <button
              className="emp-btn"
              onClick={volverHoy}
              title="Hoy"
            >
              Hoy
            </button>
            <button
              className="arrow-btn"
              onClick={nextMonth}
              title="Mes siguiente"
            >
              <FiChevronRight />
            </button>
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
  {evs.map((e, i) => {
    const hh = e.fecha.getHours().toString().padStart(2, '0');
    const mm = e.fecha.getMinutes().toString().padStart(2, '0');
    const label = `${hh}:${mm} - ${e.titulo}`;
    return (
      <div key={i} className="evt-wrapper">
        <div className={`evt evt-${e.tema}`}>
          {label}
        </div>
        <div className="evt-tooltip">
          {label}
        </div>
      </div>
    );
  })}
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
