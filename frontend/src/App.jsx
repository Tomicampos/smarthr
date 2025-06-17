import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AppLogin from './AppLogin';
import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './components/MainLayout';
import { ToastProvider } from './components/ToastContext';

import Dashboard           from './pages/Dashboard';
import Reclutamiento       from './pages/Reclutamiento';
import Empleados           from './pages/Empleados';
import Notificaciones      from './pages/Notificaciones';
import NotificationDetail  from './pages/NotificationDetail';
import Agenda              from './pages/Agenda';
import Documentacion       from './pages/Documentacion';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<AppLogin />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <ToastProvider>
              <MainLayout />
            </ToastProvider>
          </ProtectedRoute>
        }
      >
        <Route path="home"          element={<Dashboard />} />
        <Route path="reclutamiento" element={<Reclutamiento />} />
        <Route path="empleados"     element={<Empleados />} />
        <Route path="notificaciones" element={<Notificaciones />} />
        <Route path="notificaciones/:id" element={<NotificationDetail />} />
        <Route path="agenda"        element={<Agenda />} />
        <Route path="documentacion" element={<Documentacion />} />
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Route>
    </Routes>
  );
}
