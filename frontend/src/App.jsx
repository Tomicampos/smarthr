// src/App.jsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AppLogin from './AppLogin';
import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './components/MainLayout';

// Importa **UNA** vez cada componente de página
import Dashboard from './pages/Dashboard';         // <-- aquí
import Reclutamiento from './pages/Reclutamiento';
import Empleados from './pages/Empleados';
import Notificaciones from './pages/Notificaciones';
import Agenda from './pages/Agenda';
import Documentacion from './pages/Documentacion';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<AppLogin />} />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        {/* Usa Dashboard para /home */}
        <Route path="home"          element={<Dashboard />} />
        <Route path="reclutamiento" element={<Reclutamiento />} />
        <Route path="empleados"     element={<Empleados />} />
        <Route path="notificaciones"element={<Notificaciones />} />
        <Route path="agenda"        element={<Agenda />} />
        <Route path="documentacion" element={<Documentacion />} />

        <Route path="*" element={<Navigate to="/home" replace />} />
      </Route>
    </Routes>
  );
}
