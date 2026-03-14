// src/App.jsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AppLogin              from './AppLogin';
import OlvideContrasena      from './pages/OlvideContrasena';
import RestablecerContrasena from './pages/RestablecerContrasena';
import ProtectedRoute        from './components/ProtectedRoute';
import MainLayout            from './components/MainLayout';
import { ToastProvider }     from './components/ToastContext';

import Dashboard            from './pages/Dashboard';
import Reclutamiento        from './pages/Reclutamiento';
import Postulantes          from './pages/Postulantes';
import Empleados            from './pages/Empleados';
import Notificaciones       from './pages/Notificaciones';
import NotificationDetail   from './pages/NotificationDetail';
import Agenda               from './pages/Agenda';
import Documentacion        from './pages/Documentacion';
import MisNotificaciones    from './pages/MisNotificaciones';
import MiAgenda             from './pages/MiAgenda';
import MisDocumentos        from './pages/MisDocumentos';
import Perfil               from './pages/Perfil';

export default function App() {
  return (
    <Routes>
      {/* Públicas */}
      <Route path="/"        element={<AppLogin />} />
      <Route path="/login"   element={<AppLogin />} />
      <Route path="/olvide-contraseña" element={<OlvideContrasena />} />
      <Route path="/restablecer-contrasena" element={<RestablecerContrasena />} />

      {/* Protegidas */}
           <Route
       element={
         <ProtectedRoute>
           <MainLayout />
         </ProtectedRoute>
       }
     >
        <Route path="home" element={<Dashboard />} />

        {/* Rutas Admin */}
        <Route path="reclutamiento" element={<ProtectedRoute adminOnly><Reclutamiento/></ProtectedRoute>} />
        <Route path="postulantes" element={<ProtectedRoute adminOnly><Postulantes /></ProtectedRoute>}/>
        <Route path="empleados"     element={<ProtectedRoute adminOnly><Empleados/></ProtectedRoute>} />
        <Route path="notificaciones" element={<ProtectedRoute adminOnly><Notificaciones/></ProtectedRoute>} />
        <Route path="notificaciones/:id" element={<ProtectedRoute adminOnly><NotificationDetail/></ProtectedRoute>} />
        <Route path="agenda"          element={<ProtectedRoute adminOnly><Agenda/></ProtectedRoute>} />
        <Route path="documentacion"   element={<ProtectedRoute adminOnly><Documentacion/></ProtectedRoute>} />

        {/* Rutas Empleado */}
        <Route path="mis-notificaciones" element={<MisNotificaciones />} />
        <Route path="mis-notificaciones/:id" element={<NotificationDetail />} />
        <Route path="mi-agenda"       element={<MiAgenda />} />
        <Route path="mis-documentos"  element={<MisDocumentos />} />
        <Route path="perfil"          element={<Perfil />} />

        {/* Wildcard */}
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Route>
    </Routes>
  );
}
