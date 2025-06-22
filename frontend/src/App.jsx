// src/App.jsx
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
import MisNotificaciones   from './pages/MisNotificaciones';
import MiAgenda            from './pages/MiAgenda';
import MisDocumentos       from './pages/MisDocumentos';
import Perfil              from './pages/Perfil';

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
        {/* TODOS los usuarios logueados pueden ir a Dashboard */}
        <Route path="home" element={<Dashboard />} />

        {/* ——— RUTAS SOLO ADMIN ——— */}
        <Route
          path="reclutamiento"
          element={
            <ProtectedRoute adminOnly>
              <Reclutamiento />
            </ProtectedRoute>
          }
        />
        <Route
          path="empleados"
          element={
            <ProtectedRoute adminOnly>
              <Empleados />
            </ProtectedRoute>
          }
        />
        <Route
          path="notificaciones"
          element={
            <ProtectedRoute adminOnly>
              <Notificaciones />
            </ProtectedRoute>
          }
        />
        <Route
          path="notificaciones/:id"
          element={
            <ProtectedRoute adminOnly>
              <NotificationDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="agenda"
          element={
            <ProtectedRoute adminOnly>
              <Agenda />
            </ProtectedRoute>
          }
        />
        <Route
          path="documentacion"
          element={
            <ProtectedRoute adminOnly>
              <Documentacion />
            </ProtectedRoute>
          }
        />

        {/* ——— RUTAS EMPLEADO ——— */}
        <Route path="mis-notificaciones" element={<MisNotificaciones />} />
        <Route path="mis-notificaciones/:id" element={<NotificationDetail />} />
        <Route path="mi-agenda" element={<MiAgenda />} />
        <Route path="mis-documentos" element={<MisDocumentos />} />
        <Route path="perfil" element={<Perfil />} />

        {/* WILDCARD */}
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Route>
    </Routes>
  );
}
