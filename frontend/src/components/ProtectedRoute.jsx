// src/components/ProtectedRoute.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';

export default function ProtectedRoute({ children, adminOnly = false }) {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/" replace />;

  // decodificamos rol
  let payload = {};
  try {
    const b = token.split('.')[1];
    payload = JSON.parse(atob(b.replace(/-/g,'+').replace(/_/g,'/')));
  } catch {}
  const role = (payload.rol || payload.role || '').toLowerCase();

  if (adminOnly && role !== 'admin') {
    // no es admin y la ruta requiere admin
    return <Navigate to="/home" replace />;
  }

  return children;
}
