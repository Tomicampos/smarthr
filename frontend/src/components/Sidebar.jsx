// src/components/Sidebar.jsx
import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  AiFillHome, AiOutlineUserAdd 
} from 'react-icons/ai';
import { 
  FaUsers, FaBell, FaCalendarAlt, FaBook, FaCog, FaQuestionCircle, FaSignOutAlt 
} from 'react-icons/fa';
import './Sidebar.css';

function decodePayload(token) {
  try {
    const base64 = token.split('.')[1];
    const json = atob(base64.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(json);
  } catch {
    return {};
  }
}

export default function Sidebar() {
  const navigate = useNavigate();

  // Obtener username
  let username = 'Usuario';
  const token = localStorage.getItem('smarthr_token');
  if (token) {
    const payload = decodePayload(token);
    const email = payload.email || '';
    username = email.split('@')[0] || 'Usuario';
  }

  const menuItems = [
    { to: '/home', label: 'Inicio', icon: <AiFillHome /> },
    { to: '/reclutamiento', label: 'Reclutamiento', icon: <AiOutlineUserAdd /> },
    { to: '/empleados', label: 'Empleados', icon: <FaUsers /> },
    { to: '/notificaciones', label: 'Notificaciones', icon: <FaBell /> },
    { to: '/agenda', label: 'Agenda', icon: <FaCalendarAlt /> },
    { to: '/documentacion', label: 'Documentación', icon: <FaBook /> },
  ];

  const supportItems = [
    { action: () => navigate('/configuracion'), label: 'Configuración', icon: <FaCog /> },
    { action: () => navigate('/ayuda'), label: 'Ayuda', icon: <FaQuestionCircle /> },
    { action: () => {
        localStorage.removeItem('smarthr_token');
        navigate('/');
      }, label: 'Cerrar sesión', icon: <FaSignOutAlt /> },
  ];

  return (
    <aside className="sidebar">
      {/* Bloque superior: logo + menú */}
      <div className="sidebar-top">
        <div className="sidebar-header">
          <h2>SmartHR</h2>
        </div>
        <nav className="sidebar-menu">
          {menuItems.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                isActive ? 'menu-item active' : 'menu-item'
              }
            >
              <span className="icon">{icon}</span>
              <span className="label">{label}</span>
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Bloque inferior fijo al pie */}
      <div className="sidebar-footer">
        <div className="sidebar-separator" />
        <div className="sidebar-support">
          {supportItems.map(({ action, label, icon }, idx) => (
            <button key={idx} className="support-item" onClick={action}>
              <span className="icon">{icon}</span>
              <span className="label">{label}</span>
            </button>
          ))}
        </div>
        <div className="sidebar-user">
          <div className="avatar">{username.charAt(0).toUpperCase()}</div>
          <div className="user-info">
            <div className="user-name">{username}</div>
            <div className="user-role">Administrador</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
