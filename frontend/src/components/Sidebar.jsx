import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import API from '../api';
import {
  AiFillHome,
  AiOutlineUserAdd
} from 'react-icons/ai';
import {
  FaUsers,
  FaBell,
  FaCalendarAlt,
  FaBook,
  FaSignOutAlt
} from 'react-icons/fa';
import './Sidebar.css';

// Decodifica el payload del JWT
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
  const token    = localStorage.getItem('token');
  const payload  = token ? decodePayload(token) : {};
  const userId   = payload.id;
  const rawRole  = (payload.rol || payload.role || '').toLowerCase();
  const isAdmin  = rawRole === 'admin';
  const userRole = isAdmin ? 'Administrador' : 'Usuario';

  // Formatea el nombre
  let nameRaw = payload.nombre
    || payload.name
    || payload.email?.split('@')[0]
    || 'Usuario';
  nameRaw = nameRaw
    .replace(/[\._-]+/g, ' ')
    .split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');

  // Estado de la URL del avatar
  const [avatarUrl, setAvatarUrl] = useState(null);

   useEffect(() => {
    if (!userId) return;
    API.get(`/users/${userId}`)
      .then(({ data }) => {
        if (data.avatar_url) {
          const origin = API.defaults.baseURL.replace(/\/api\/?$/, '');
          setAvatarUrl(origin + data.avatar_url);
        }
      })
      .catch(() => {});
  }, [userId]);
 

  const menuItems = [
    { to: '/home', label: 'Inicio', icon: <AiFillHome /> },
    isAdmin
      ? { to: '/notificaciones', label: 'Notificaciones', icon: <FaBell /> }
      : { to: '/mis-notificaciones', label: 'Notificaciones', icon: <FaBell /> },
    ...(isAdmin
      ? [
          { to: '/reclutamiento', label: 'Reclutamiento',   icon: <AiOutlineUserAdd /> },
          { to: '/reclutamientos', label: 'Postulantes',   icon: <AiOutlineUserAdd /> },
          { to: '/empleados',     label: 'Usuarios',        icon: <FaUsers /> },
          { to: '/agenda',        label: 'Agenda',          icon: <FaCalendarAlt /> },
          { to: '/documentacion', label: 'Documentación',   icon: <FaBook /> },
        ]
      : [
          { to: '/mi-agenda',      label: 'Agenda',      icon: <FaCalendarAlt /> },
          { to: '/mis-documentos', label: 'Documentos',  icon: <FaBook /> },
          { to: '/perfil',         label: 'Mi Perfil',   icon: <FaUsers /> },
        ]),
  ];

  const supportItems = [
    {
      action: () => {
        localStorage.removeItem('token');
        navigate('/');
      },
      label: 'Cerrar sesión',
      icon: <FaSignOutAlt />,
    },
  ];

  return (
    <aside className="sidebar">
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
          <div className="avatar">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="Avatar"
                className="sidebar-avatar-img"
                onError={() => setAvatarUrl(null)}
              />
            ) : (
              nameRaw.charAt(0)
            )}
          </div>
          <div className="user-info">
            <div className="user-name">{nameRaw}</div>
            <div className="user-role">{userRole}</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
