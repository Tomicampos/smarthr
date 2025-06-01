// src/components/ProtectedRoute.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';

export default function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token');
  if (!token) {
    // Si no hay token, redirige al login
    return <Navigate to="/" replace />;
  }
  return children;
}
