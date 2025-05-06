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
        gap: '1.5rem',
        height: '100%', 
        flex: 1,                 // <— ocupe todo el main
      }}
    >
      {/* Columna izquierda */}
      <div style={{
        flex: 3,
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem',
        height: '100%',
      }}>
        <NotificationsPreview />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <ProgresoPostulantes />
        </div>
      </div>

      {/* Columna derecha */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
      }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <Cronograma />
        </div>
      </div>
    </div>
  );
}
