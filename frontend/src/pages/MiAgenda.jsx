// src/pages/MiAgenda.jsx
import React, { useState, useEffect } from 'react';
import API from '../api';
import './Agenda.css';
import DayView from './DayView';
import WeekView from './WeekView';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import ModalGenerico from '../components/ModalGenerico';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { es } from 'date-fns/locale';

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const DIAS_SEMANA = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

export default function MiAgenda() {
  const hoy = new Date();
  const [mes, setMes] = useState(hoy.getMonth());
  const [año, setAño] = useState(hoy.getFullYear());
  const [fechaBase, setFechaBase] = useState(hoy);
  const [vista, setVista] = useState("mes");
  const [diasMes, setDiasMes] = useState([]);
  const [blancos, setBlancos] = useState([]);
  const [eventos, setEventos] = useState([]);
  const [modalNuevoAbierto, setModalNuevoAbierto] = useState(false);
  const [nuevoTitulo, setNuevoTitulo] = useState('');
  const [nuevoInicio, setNuevoInicio] = useState(null);
  const [nuevoFin, setNuevoFin] = useState(null);
  const [nuevoCorreos, setNuevoCorreos] = useState('');

  useEffect(() => {
    const ultimo = new Date(año, mes + 1, 0).getDate();
    const primer = new Date(año, mes, 1).getDay();
    setBlancos(Array(primer).fill(null));
    setDiasMes(Array.from({ length: ultimo }, (_, i) => i + 1));
  }, [mes, año]);

  useEffect(() => {
    fetchEventos();
  }, [año]);

  const fetchEventos = async () => {
    try {
      const { data: agendaData } = await API.get('/agenda');
      const evAgenda = Array.isArray(agendaData) ? agendaData.map(e => {
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
      const evFeriados = Array.isArray(feriadosJson) ? feriadosJson.map(f => ({
        fecha: new Date(f.date),
        titulo: f.localName,
        desc: f.name,
        tema: 'rojo'
      })) : [];

      setEventos([...evAgenda, ...evFeriados]);
    } catch (err) {
      console.error('Error cargando agenda o feriados:', err);
    }
  };

  const esHoy = (d) => {
    const dd = new Date(año, mes, d);
    return dd.toDateString() === new Date().toDateString();
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

  const estiloInputSinBorde = {
    '& label': { color: 'black' },
    '& .MuiOutlinedInput-root': {
      '& fieldset': { borderColor: 'transparent' },
      '&:hover fieldset': { borderColor: 'transparent' },
      '&.Mui-focused fieldset': { borderColor: 'transparent' },
    },
    '& .MuiInputBase-input': { color: 'black' },
  };

  return (
    <div className="agenda-container">
      <div className="agenda-card">
        <h1 className="agenda-title">Mi Agenda</h1>
        <header className="agenda-header">
          <div className="agenda-header-left">
            <span className="agenda-mes">{MESES[mes]}</span>
            <span className="agenda-año">{año}</span>
          </div>
          <div className="agenda-header-right">
            <select className="agenda-select" value={vista} onChange={e => setVista(e.target.value)}>
              <option value="mes">Mes</option>
              <option value="semana">Semana</option>
              <option value="dia">Día</option>
            </select>
            <button className="emp-btn" onClick={volverHoy}>Hoy</button>
            <button className="emp-btn" onClick={() => setModalNuevoAbierto(true)}>+ Evento</button>
            <button className="arrow-btn" onClick={prev}><FiChevronLeft /></button>
            <button className="arrow-btn" onClick={next}><FiChevronRight /></button>
          </div>
        </header>

        {vista === "mes" && (
          <div className="agenda-grid">
            {DIAS_SEMANA.map(d => <div key={d} className="agenda-dia-nombre">{d}</div>)}
            {blancos.map((_, i) => <div key={`b${i}`} className="agenda-celda vacia" />)}
            {diasMes.map(d => {
              const evs = eventos.filter(e => e.fecha.getFullYear() === año && e.fecha.getMonth() === mes && e.fecha.getDate() === d);
              return (
                <div key={d} className="agenda-celda">
                  <div className={`agenda-numero ${esHoy(d) ? 'hoy' : ''}`}>{d}</div>
                  <div className="agenda-eventos">
                    {evs.map((e, i) => {
                      const hh = e.fecha.getHours().toString().padStart(2, '0');
                      const mm = e.fecha.getMinutes().toString().padStart(2, '0');
                      const label = `${hh}:${mm} - ${e.titulo}`;
                      return <div key={i} className={`evt evt-${e.tema}`}>{label}</div>;
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

      <ModalGenerico
        abierto={modalNuevoAbierto}
        onClose={() => setModalNuevoAbierto(false)}
        titulo="Agregar nuevo evento"
      >
        <LocalizationProvider
          dateAdapter={AdapterDateFns}
          adapterLocale={es}
          localeText={{ cancelButtonLabel: 'Cancelar', okButtonLabel: 'Aceptar' }}
        >
          <div className="form-group">
            <label>Título</label>
            <input type="text" value={nuevoTitulo} onChange={e => setNuevoTitulo(e.target.value)} />
          </div>

          <div className="form-group">
            <DateTimePicker
              value={nuevoInicio}
              onChange={(newValue) => setNuevoInicio(newValue)}
              label="Seleccionar fecha y hora"
              ampm={false}
              format="dd/MM/AAAA HH:mm"
              slotProps={{
                textField: {
                  fullWidth: true,
                  variant: 'outlined',
                  InputLabelProps: { shrink: true },
                  sx: estiloInputSinBorde
                },
                popper: { sx: { zIndex: 9999 } }
              }}
            />
          </div>

          <div className="form-group">
            <DateTimePicker
              value={nuevoFin}
              onChange={(newValue) => setNuevoFin(newValue)}
              label="Seleccionar fecha y hora"
              ampm={false}
              format="dd/MM/AAAA HH:mm"
              slotProps={{
                textField: {
                  fullWidth: true,
                  variant: 'outlined',
                  InputLabelProps: { shrink: true },
                  sx: estiloInputSinBorde
                },
                popper: { sx: { zIndex: 9999 } }
              }}
            />
          </div>

          <div className="form-group">
            <label>Invitados (correos separados por coma)</label>
            <input
              type="text"
              value={nuevoCorreos}
              onChange={e => setNuevoCorreos(e.target.value)}
              placeholder="ej: ejemplo1@gmail.com, ejemplo2@gmail.com"
            />
          </div>

          <div style={{ marginTop: '1rem', textAlign: 'right' }}>
            <button
              className="emp-btn"
              onClick={async () => {
                try {
                  await API.post('/eventos', {
                    titulo: nuevoTitulo,
                    descripcion: '',
                    fecha_inicio: nuevoInicio?.toISOString(),
                    fecha_fin: (nuevoFin || nuevoInicio)?.toISOString(),
                    correos: nuevoCorreos.split(',').map(c => c.trim()).filter(c => c)
                  });
                  setModalNuevoAbierto(false);
                  setNuevoTitulo('');
                  setNuevoInicio(null);
                  setNuevoFin(null);
                  setNuevoCorreos('');
                  fetchEventos();
                } catch (err) {
                  console.error('Error creando evento:', err);
                  alert('Hubo un error al crear el evento');
                }
              }}
            >
              Guardar
            </button>
          </div>
        </LocalizationProvider>
      </ModalGenerico>
    </div>
  );
}
