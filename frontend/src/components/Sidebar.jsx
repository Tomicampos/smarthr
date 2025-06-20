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

export default function Sidebar() {
  const navigate = useNavigate();
  
  // Extraemos token y payload
  const token = localStorage.getItem('token');
  const payload = token ? decodePayload(token) : {};

  // Username: preferimos payload.name o payload.nombre, si no el localpart del email
  let nameRaw = '';
  if (payload.name) {
    nameRaw = payload.name;
  } else if (payload.nombre) {
    nameRaw = payload.nombre;
  } else if (payload.email) {
    nameRaw = payload.email.split('@')[0];
  }
  const username = nameRaw ? capitalizeWords(nameRaw.replace(/[\._-]+/g, ' ')) : 'Usuario';

  // Rol dinámico: "Administrador" solo si rol === "admin", sino "Usuario"
  const rawRole = payload.rol || payload.role || '';
  const userRole = rawRole.toLowerCase() === 'admin' ? 'Administrador' : 'Usuario';

  const menuItems = [
    { to: '/home', label: 'Inicio', icon: <AiFillHome /> },
    { to: '/reclutamiento', label: 'Reclutamiento', icon: <AiOutlineUserAdd /> },
    { to: '/empleados', label: 'Usuarios', icon: <FaUsers /> },
    { to: '/notificaciones', label: 'Notificaciones', icon: <FaBell /> },
    { to: '/agenda', label: 'Agenda', icon: <FaCalendarAlt /> },
    { to: '/documentacion', label: 'Documentación', icon: <FaBook /> },
  ];

  const supportItems = [
  //  { action: () => navigate('/configuracion'), label: 'Configuración', icon: <FaCog /> },
  //  { action: () => navigate('/ayuda'), label: 'Ayuda', icon: <FaQuestionCircle /> },
    { action: () => {
        localStorage.removeItem('token');
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
          <div className="avatar">{username.charAt(0)}</div>
          <div className="user-info">
            <div className="user-name">{username}</div>
            <div className="user-role">{userRole}</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
