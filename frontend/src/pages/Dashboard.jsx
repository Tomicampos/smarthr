// src/pages/Dashboard.jsx
import React, { useEffect } from 'react';
import NotificationsPreview from '../components/NotificationsPreview';
import ProgresoPostulantes from '../components/ProgresoPostulantes';
import Cronograma from '../components/Cronograma';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

// Decodificar payload del JWT
function decodePayload(token) {
  try {
    const base64 = token.split('.')[1];
    const json   = atob(base64.replace(/-/g,'+').replace(/_/g,'/'));
    return JSON.parse(json);
  } catch {
    return {};
  }
}

export default function Dashboard() {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'Inicio • SmartHR';
  }, []);

  // Extraer rol del token
  const token   = localStorage.getItem('token');
  const payload = token ? decodePayload(token) : {};
  const isAdmin = (payload.rol || payload.role || '').toLowerCase() === 'admin';

  return (
    <div className="dashboard-container">
      {/* Columna izquierda */}
      <div className="dashboard-left">
        <NotificationsPreview />

        {isAdmin ? (
          <ProgresoPostulantes />
        ) : (
          <div className="empty-state">
            <h3>¿Qué te gustaría hacer hoy?</h3>
            <p>Selecciona una acción rápida:</p>
            <div className="quick-actions">
              <button onClick={() => navigate('/mi-agenda')}>
                Mi Agenda
              </button>
              <button onClick={() => navigate('/mis-documentos')}>
                Mis Documentos
              </button>
              <button onClick={() => navigate('/perfil')}>
                Actualizar perfil
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Columna derecha */}
      <div className="dashboard-right">
        <Cronograma />
      </div>
    </div>
  );
}
