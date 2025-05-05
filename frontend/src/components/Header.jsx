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

export default function Header() {
  const [username, setUsername] = useState('Usuario');
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const token = localStorage.getItem('smarthr_token');
    if (token) {
      const payload = decodePayload(token);
      const email = payload.email || '';
      setUsername(email.split('@')[0] || 'Usuario');
    }

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
          {formattedDate}, {formattedTime} HS
        </div>
        <button className="bell-btn">
          <FiBell className="icon" />
        </button>
      </div>

      <div className="header-greeting">
        Hola, <strong>{username}</strong> ¡Bienvenido!
      </div>
    </header>
  );
}
