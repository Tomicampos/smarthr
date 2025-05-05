// src/pages/Dashboard.jsx
import React, { useEffect } from 'react';
import NotificationsPreview from '../components/NotificationsPreview';
import ProgresoPostulantes from '../components/ProgresoPostulantes';
import Cronograma from '../components/Cronograma';

export default function Dashboard() {
  // 1. Cambiar el título de la pestaña
  useEffect(() => {
    document.title = 'Inicio';
  }, []);

  return (
    <>
      {/* 2. Contenedor de dos columnas */}
      <div style={{ display: 'flex', gap: '1.5rem', height: '100%' }}>
        {/* Columna izquierda (75%) */}
        <div style={{ flex: 3, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <NotificationsPreview />
          <ProgresoPostulantes />
        </div>

        {/* Columna derecha (25%) */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <Cronograma />
        </div>
      </div>
    </>
  );
}
