// src/pages/Dashboard.jsx
import React, { useEffect } from 'react';
import NotificationsPreview from '../components/NotificationsPreview';
import ProgresoPostulantes from '../components/ProgresoPostulantes';
import Cronograma from '../components/Cronograma';

export default function Dashboard() {
 useEffect(() => {
  document.title = 'Inicio • SmartHR';
}, []);
  return (
    <div
      style={{
        display: 'flex',
        gap: '1.5rem',     // espacio entre columnas
        height: '100%',
      }}
    >
      {/* Columna izquierda */}
      <div style={{
        flex: 3,            // ocupa 75%
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem',      // espacio vertical entre cards
      }}>
        <NotificationsPreview />
        <ProgresoPostulantes />
      </div>

      {/* Columna derecha */}
      <div style={{
        flex: 1,            // ocupa 25%
        display: 'flex',
        flexDirection: 'column',
      }}>
        <Cronograma />
      </div>
    </div>
  );
}
