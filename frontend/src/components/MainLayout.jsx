// src/components/MainLayout.jsx
import React, { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

const titles = {
  '/home':          'Inicio',
  '/reclutamiento': 'Reclutamiento',
  '/empleados':     'Empleados',
  '/notificaciones':'Notificaciones',
  '/agenda':        'Agenda',
  '/documentacion': 'Documentación',
};

export default function MainLayout() {
  const { pathname } = useLocation();

  useEffect(() => {
    document.title = titles[pathname] || 'SmartHR';
  }, [pathname]);

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>

        {/* Header se queda fijo */}
        <Header />

        {/* Contenedor principal sin padding */}
        <main
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            // Elimina padding para pegarte al borde
            padding: 0,
            // Fundido de fondo
            background: '#f9fafb',
            // Oculta el overflow del contenedor y deja que el hijo lo maneje
            overflow: 'hidden',
          }}
        >
          {/* Este div introduce el scroll interno */}
          <div
            style={{
              flex: 1,
              // Aquí tus páginas (Calendario, Empleados, etc.) harán scroll
              overflowY: 'auto',
            }}
          >
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
