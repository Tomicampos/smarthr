import React, { useState, useEffect, useRef } from 'react';
import API from '../api';
import { useToast } from '../components/ToastContext';
import NotificationForm from '../components/NotificationForm';
import NotificationList from '../components/NotificationList';
import { FiChevronDown } from 'react-icons/fi';
import './Notificaciones.css';

export default function Notificaciones() {
  const toast = useToast();

  const [modo, setModo]             = useState('nueva');       
  const [usuarios, setUsuarios]     = useState([]);            
  const [postulantes, setPostulantes] = useState([]);         
  const [destinatarios, setDestinatarios] = useState([]);     
  const [dropdownOpen, setDropdownOpen]   = useState(false);
  const [filtro, setFiltro]         = useState('');            
  const ddRef = useRef();

  // cerrar dropdown clic fuera
  useEffect(() => {
    const onClickOutside = e => {
      if (ddRef.current && !ddRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  // cargar usuarios + postulantes
  useEffect(() => {
    API.get('/users')
      .then(({ data }) => setUsuarios(data))
      .catch(() => toast.error('No se pudieron cargar usuarios'));

    API.get('/postulantes')
      .then(({ data }) => setPostulantes(data))
      .catch(() => toast.error('No se pudieron cargar postulantes'));
  }, [toast]);

  const allRecipients = [
    ...usuarios.map(u => ({ id: u.id, label: u.nombre, type: 'usuario' })),
    ...postulantes.map(p =>
      ({ id: p.id, label: p.nombre, type: 'postulante' }))
  ];

  const toggleOne = key => {
    setDestinatarios(d =>
      d.includes(key) ? d.filter(x => x !== key) : [...d, key]
    );
  };
  const toggleAll = () => {
    if (destinatarios.length === allRecipients.length) {
      setDestinatarios([]);
    } else {
      setDestinatarios(allRecipients.map(r => r.type + '-' + r.id));
    }
  };

  const summary =
    destinatarios.length === 0
      ? 'Seleccionar destinatarios…'
      : destinatarios.length === allRecipients.length
      ? 'Todos'
      : `${destinatarios.length} seleccionado${destinatarios.length > 1 ? 's' : ''}`;

  // filtro interno: busca en label
  const filtered = allRecipients.filter(r =>
    r.label.toLowerCase().includes(filtro.toLowerCase())
  );

  return (
    <div className="notif-main-card">
      {/* HEADER */}
      <div className="notif-card-header">
        <h2>Notificaciones</h2>
        <div className="notif-header-controls">
          <div className="select-wrapper">
            <select
              className="notif-mode-select"
              value={modo}
              onChange={e => {
                setModo(e.target.value);
                setDestinatarios([]);
              }}
            >
              <option value="nueva">Nueva Notificación</option>
              <option value="historico">Histórico</option>
            </select>
            <FiChevronDown className="select-icon" />
          </div>

          {modo === 'nueva' && (
            <div className="notif-recipients-wrapper" ref={ddRef}>
              <button
                type="button"
                className="notif-recipients-button"
                onClick={() => setDropdownOpen(o => !o)}
              >
                {summary} <FiChevronDown />
              </button>
              {dropdownOpen && (
                <div className="notif-recipients-dropdown">
                  <div className="ms-title">Destinatarios</div>
                  <input
                    type="text"
                    placeholder="Buscar…"
                    value={filtro}
                    onChange={e => setFiltro(e.target.value)}
                    className="ms-search"
                  />
                  <div
                    className="ms-option"
                    onClick={e => { e.stopPropagation(); toggleAll(); }}
                  >
                    <input
                      type="checkbox"
                      checked={destinatarios.length === allRecipients.length}
                      readOnly
                    />
                    <span>Todos</span>
                  </div>
                  <hr />
                  {filtered.length ? filtered.map(r => {
                    const key = `${r.type}-${r.id}`;
                    return (
                      <div
                        key={key}
                        className="ms-option"
                        onClick={e => { e.stopPropagation(); toggleOne(key); }}
                      >
                        <input
                          type="checkbox"
                          checked={destinatarios.includes(key)}
                          readOnly
                        />
                        <span>
                          {r.type === 'usuario' ? '👤 ' : '👥 '}
                          {r.label}
                        </span>
                      </div>
                    );
                  }) : (
                    <div className="ms-empty">Sin resultados</div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* SUBHEADER */}
      {modo === 'nueva' && (
        <div className="notif-subheader">
          <h3 className="notif-subtitle">Nueva Notificación</h3>
        </div>
      )}

      {/* CUERPO */}
      <div className="notif-card-body">
        {modo === 'nueva' ? (
          <NotificationForm
            destinatarios={destinatarios}
            setDestinatarios={setDestinatarios}
            onEnviado={() => setModo('historico')}
          />
        ) : (
          <NotificationList />
        )}
      </div>
    </div>
  );
}
