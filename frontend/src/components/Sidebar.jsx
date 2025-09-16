// src/components/Sidebar.jsx
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
  const rawRole  = (payload.rol || payload.role || '').toLowerCase();
  const isAdmin  = rawRole === 'admin';
  const userRole = isAdmin ? 'Administrador' : 'Usuario';

  // Para mantener activo y desplegado
  const [activePath, setActivePath] = useState('/home');
  const [openRec, setOpenRec]       = useState(false);

  // Nombre formateado
  let nameRaw = payload.nombre
    || payload.name
    || payload.email?.split('@')[0]
    || 'Usuario';
  nameRaw = nameRaw
    .replace(/[\._-]+/g, ' ')
    .split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');

  // Avatar
  const [avatarUrl, setAvatarUrl] = useState(null);
  useEffect(() => {
    if (!payload.id) return;
    API.get(`/users/${payload.id}`)
      .then(({ data }) => {
        if (data.avatar_url) {
          const origin = API.defaults.baseURL.replace(/\/api\/?$/, '');
          setAvatarUrl(origin + data.avatar_url);
        }
      })
      .catch(() => {});
  }, [payload.id]);

  // Ítems del menú
  const menuItems = [
    { to: '/home',           label: 'Inicio',             icon: <AiFillHome /> },
    { to: isAdmin ? '/notificaciones' : '/mis-notificaciones', label: 'Notificaciones', icon: <FaBell /> },
    ...(isAdmin
      ? [
          {
            to: null,
            label: 'Reclutamiento',
            icon: <AiOutlineUserAdd />,
            children: [
              { to: '/reclutamiento',   label: 'Reclutamiento y Selección' },
              { to: '/postulantes',     label: 'Postulantes' }
            ]
          },
          { to: '/empleados',     label: 'Usuarios',      icon: <FaUsers /> },
          { to: '/agenda',        label: 'Agenda',        icon: <FaCalendarAlt /> },
          { to: '/documentacion', label: 'Documentación', icon: <FaBook /> },
          { to: '/perfil',         label: 'Mi Perfil',   icon: <FaUsers /> },
        ]
      : [
          { to: '/mi-agenda',      label: 'Agenda',      icon: <FaCalendarAlt /> },
          { to: '/mis-documentos', label: 'Documentos',  icon: <FaBook /> },
          { to: '/perfil',         label: 'Mi Perfil',   icon: <FaUsers /> },
        ])
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

  const handleClick = to => {
    setActivePath(to);
    // si clic en reclutamiento o sus hijos, mantenemos abierto
    if (to === '/reclutamiento' || to === '/postulantes') {
      setOpenRec(true);
    } else {
      setOpenRec(false);
    }
    if (to) navigate(to);
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-top">
        <div className="sidebar-header"><h2>SmartHR</h2></div>
        <nav className="sidebar-menu">
          {menuItems.map(item => (
            item.children
              ? (
                <div
                  key="reclutamiento"
                  className={`menu-item has-children${openRec ? ' open' : ''}`}
                  onMouseEnter={() => setOpenRec(true)}
                  onMouseLeave={() => {
                    if (![ '/reclutamiento', '/postulantes' ].includes(activePath)) {
                      setOpenRec(false);
                    }
                  }}
                >
                  <div
                    className={`parent-item${[ '/reclutamiento', '/postulantes' ].includes(activePath) ? ' active' : ''}`}
                    onClick={() => setOpenRec(o => !o)}
                  >
                    <span className="icon">{item.icon}</span>
                    <span className="label">{item.label}</span>
                  </div>
                  <div className="submenu">
                    {item.children.map(child => (
                      <div
                        key={child.to}
                        className={`submenu-item${activePath === child.to ? ' active' : ''}`}
                        onClick={() => handleClick(child.to)}
                      >
                        <span className="icon"><AiOutlineUserAdd/></span>
                        <span className="label">{child.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )
              : (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={`menu-item${activePath === item.to ? ' active' : ''}`}
                  onClick={() => handleClick(item.to)}
                >
                  <span className="icon">{item.icon}</span>
                  <span className="label">{item.label}</span>
                </NavLink>
              )
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
            {avatarUrl
              ? <img src={avatarUrl} alt="Avatar" onError={() => setAvatarUrl(null)} />
              : nameRaw.charAt(0)
            }
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
