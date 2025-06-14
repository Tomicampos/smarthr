// src/components/MainLayout.jsx
import React, { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import './MainLayout.css';

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
    <div className="main-layout">
      <Sidebar />

      <div className="main-wrapper">
        <Header />

        <main className="main-content">
          <div className="content-scroll">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
