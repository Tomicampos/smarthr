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
    // Si la ruta está en nuestro map, la usamos; si no, fallback
    document.title = titles[pathname] || 'SmartHR';
  }, [pathname]);

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
        <Header />
        <main
         style={{
           flex: 1,
           display: 'flex',         /* <— aquí */
           flexDirection: 'column', /* <— y aquí */
           height: '100%',           
           padding: '2rem',
           background: '#f9fafb'
         }}
       >
          <Outlet />
        </main>
      </div>
    </div>
  );
}
