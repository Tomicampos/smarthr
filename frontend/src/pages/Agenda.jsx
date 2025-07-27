import React, { useState, useEffect } from 'react';
import API from '../api';
import './Agenda.css';
import DayView from './DayView';
import WeekView from './WeekView';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const DIAS_SEMANA = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];

export default function Agenda() {
  const hoy = new Date();
  const [mes, setMes]             = useState(hoy.getMonth());
  const [año, setAño]             = useState(hoy.getFullYear());
  const [fechaBase, setFechaBase] = useState(hoy);
  const [vista, setVista]         = useState("mes");
  const [diasMes, setDiasMes]     = useState([]);
  const [blancos, setBlancos]     = useState([]);
  const [eventos, setEventos]     = useState([]);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [evtTitulo, setEvtTitulo] = useState('');
  const [evtDesc, setEvtDesc]     = useState('');
  const [evtInicio, setEvtInicio] = useState('');
  const [evtFin, setEvtFin]       = useState('');

  useEffect(() => {
    const último = new Date(año, mes + 1, 0).getDate();
    const primer = new Date(año, mes, 1).getDay();
    setBlancos(Array(primer).fill(null));
    setDiasMes(Array.from({ length: último }, (_, i) => i + 1));
  }, [mes, año]);

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
            }) : [];

        const respF = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${año}/AR`);
        const feriadosJson = await respF.json();
        const evFeriados = Array.isArray(feriadosJson)
          ? feriadosJson.map(f => ({
              fecha: new Date(f.date),
              titulo: f.localName,
              desc: f.name,
              tema: 'rojo'
            })) : [];

        setEventos([...evAgenda, ...evFeriados]);
      } catch (err) {
        console.error('Error cargando agenda o feriados:', err);
      }
    }
    fetchAll();
  }, [año]);

  const esHoy = (d) => new Date(año, mes, d).toDateString() === new Date().toDateString();

  const abrirModal = () => {
    setEvtTitulo('');
    setEvtDesc('');
    setEvtInicio('');
    setEvtFin('');
    setModalAbierto(true);
  };

  const guardarEvento = async () => {
    try {
      const payload = {
        titulo: evtTitulo,
        descripcion: evtDesc,
        fecha_inicio: evtInicio,
        fecha_fin: evtFin
      };
      const { data } = await API.post('/eventos', payload);
      setEventos([...eventos, {
        fecha: new Date(evtInicio),
        titulo: evtTitulo,
        desc: evtDesc,
        tema: 'verde'
      }]);
      setModalAbierto(false);
    } catch (error) {
      console.error("Error al crear evento:", error);
    }
  };

  const prev = () => {
    const nueva = new Date(fechaBase);
    if (vista === "semana") nueva.setDate(nueva.getDate() - 7);
    else if (vista === "dia") nueva.setDate(nueva.getDate() - 1);
    else {
      if (mes > 0) setMes(m => m - 1);
      else {
        setMes(11);
        setAño(a => a - 1);
      }
      return;
    }
    setFechaBase(nueva);
    setMes(nueva.getMonth());
    setAño(nueva.getFullYear());
  };

  const next = () => {
    const nueva = new Date(fechaBase);
    if (vista === "semana") nueva.setDate(nueva.getDate() + 7);
    else if (vista === "dia") nueva.setDate(nueva.getDate() + 1);
    else {
      if (mes < 11) setMes(m => m + 1);
      else {
        setMes(0);
        setAño(a => a + 1);
      }
      return;
    }
    setFechaBase(nueva);
    setMes(nueva.getMonth());
    setAño(nueva.getFullYear());
  };

  const volverHoy = () => {
    const hoy = new Date();
    setMes(hoy.getMonth());
    setAño(hoy.getFullYear());
    setFechaBase(hoy);
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
            <select className="agenda-select" value={vista} onChange={e => setVista(e.target.value)}>
              <option value="mes">Mes</option>
              <option value="semana">Semana</option>
              <option value="dia">Día</option>
            </select>
            <button className="arrow-btn" onClick={prev}><FiChevronLeft /></button>
            <button className="emp-btn" onClick={volverHoy}>Hoy</button>
            <button className="arrow-btn" onClick={next}><FiChevronRight /></button>
            <button className="add-btn" onClick={abrirModal}>+ Evento</button>
          </div>
        </header>

        {vista === "mes" && (
          <div className="agenda-grid">
            {DIAS_SEMANA.map(d => <div key={d} className="agenda-dia-nombre">{d}</div>)}
            {blancos.map((_, i) => <div key={`b${i}`} className="agenda-celda vacia" />)}
            {diasMes.map(d => {
              const evs = eventos.filter(e =>
                e.fecha.getFullYear() === año &&
                e.fecha.getMonth() === mes &&
                e.fecha.getDate() === d
              );
              return (
                <div key={d} className="agenda-celda">
                  <div className={`agenda-numero ${esHoy(d) ? 'hoy' : ''}`}>{d}</div>
                  <div className="agenda-eventos">
                    {evs.map((e, i) => {
                      const hh = e.fecha.getHours().toString().padStart(2, '0');
                      const mm = e.fecha.getMinutes().toString().padStart(2, '0');
                      const label = `${hh}:${mm} - ${e.titulo}`;
                      return (
                        <div key={i} className="evt-wrapper">
                          <div className={`evt evt-${e.tema}`}>{label}</div>
                          <div className="evt-tooltip">{label}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {vista === "semana" && <WeekView eventos={eventos} fechaBase={fechaBase} />}
        {vista === "dia" && <DayView eventos={eventos} fecha={fechaBase} />}
      </div>

      {modalAbierto && (
        <div className="agenda-modal-backdrop">
          <div className="agenda-modal">
            <h2>Nuevo evento</h2>
            <label>Título</label>
            <input value={evtTitulo} onChange={e => setEvtTitulo(e.target.value)} />
            <label>Descripción</label>
            <textarea value={evtDesc} onChange={e => setEvtDesc(e.target.value)} />
            <label>Inicio</label>
            <input type="datetime-local" value={evtInicio} onChange={e => setEvtInicio(e.target.value)} />
            <label>Fin</label>
            <input type="datetime-local" value={evtFin} onChange={e => setEvtFin(e.target.value)} />
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
