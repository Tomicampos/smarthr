// src/components/Header.jsx
import React, { useEffect, useState } from 'react';
import { FiSearch, FiBell } from 'react-icons/fi';
import './Header.css';
// Decodifica manualmente el payload de un JWT
function decodePayload(token) {
  try {
    const base64 = token.split('.')[1];
    const json = atob(base64.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(json);
  } catch {
    return {};
  }
}

// Capitaliza la primera letra de cada palabra
function capitalizeWords(str) {
  return str
    .split(' ')
    .filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

export default function Header() {
  const [username, setUsername] = useState('Usuario');
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    // — Leemos el token exacto que guardás en AppLogin —
    const token = localStorage.getItem('token');
    if (token) {
      const payload = decodePayload(token);
      let name = '';

      // 1) Si hay campo "name" en el payload, lo usamos
      if (payload.name) {
        name = payload.name;
      }
      // 2) Si no, si viene "nombre" en el payload
      else if (payload.nombre) {
        name = payload.nombre;
      }
      // 3) Si no, tomamos la parte local del email
      else if (payload.email) {
        name = payload.email.split('@')[0];
      }

      if (name) {
        // Reemplazamos puntos, guiones o guiones bajos por espacios y capitalizamos
        name = name.replace(/[\._-]+/g, ' ');
        setUsername(capitalizeWords(name));
      }
    }

    // Actualizar la hora cada minuto
    const timer = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);

  const formattedDate = now.toLocaleDateString('es-AR', {
    day: '2-digit', month: 'long', year: 'numeric'
  });
  const formattedTime = now.toLocaleTimeString('es-AR', {
    hour: '2-digit', minute: '2-digit'
  });

  return (
    <header className="app-header">
    <div className="header-left">
      <div className="search-box">
        <FiSearch className="icon" />
        <input
          type="text"
          placeholder="Buscar..."
          className="search-input"
      
        />
       </div>
     </div>

      <div className="header-right">
        <div className="datetime">
          {formattedDate}, {formattedTime} Hs
        </div>
        
      </div>

      <div className="header-greeting">
        Hola, <strong>{username}</strong> ¡Bienvenido!
      </div>
    </header>
  );
}
