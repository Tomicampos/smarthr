// src/App.jsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AppLogin from './AppLogin';
import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './components/MainLayout';

// Importa el ToastProvider
import { ToastProvider } from './components/ToastContext';

// Importa **UNA** vez cada componente de página
import Dashboard      from './pages/Dashboard';
import Reclutamiento  from './pages/Reclutamiento';
import Empleados      from './pages/Empleados';
import Notificaciones from './pages/Notificaciones';
import Agenda         from './pages/Agenda';
import Documentacion  from './pages/Documentacion';

export default function App() {
  return (
    <Routes>
      {/* Ruta pública de login */}
      <Route path="/" element={<AppLogin />} />

      {/* Rutas protegidas */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            {/* Envuelve con ToastProvider */}
            <ToastProvider>
              <MainLayout />
            </ToastProvider>
          </ProtectedRoute>
        }
      >
        <Route path="home"           element={<Dashboard />} />
        <Route path="reclutamiento"  element={<Reclutamiento />} />
        <Route path="empleados"      element={<Empleados />} />
        <Route path="notificaciones" element={<Notificaciones />} />
        <Route path="agenda"         element={<Agenda />} />
        <Route path="documentacion"  element={<Documentacion />} />

        {/* Redirige todo lo demás a /home */}
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Route>
    </Routes>
  );
}
