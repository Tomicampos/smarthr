import React, { useState, useEffect, useRef } from 'react';
import API from '../api';
import { useToast } from '../components/ToastContext';
import { FiEdit2 } from 'react-icons/fi';
import './Perfil.css';

export default function MiPerfil() {
  const toast = useToast();
  const [user, setUser]         = useState(null);
  const [nombre, setNombre]     = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [file, setFile]         = useState(null);
  const fileInputRef            = useRef();

  // sacar ID del JWT
  const token = localStorage.getItem('token');
  const userId = token
    ? JSON.parse(
        atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))
      ).id
    : null;

  // carga inicial
  useEffect(() => {
    if (!userId) return;
    API.get(`/users/${userId}`)
      .then(({ data }) => {
        setUser(data);
        setNombre(data.nombre);
        setEmail(data.email);
        if (data.avatar_url) {
          const origin = API.defaults.baseURL.replace(/\/api\/?$/, '');
          setAvatarUrl(origin + data.avatar_url);
        }
      })
      .catch(() => toast.error('No se pudo cargar perfil.'));
  }, [userId, toast]);

  const handleSave = async e => {
    e.preventDefault();
    try {
      // 1) datos básicos
      await API.put(`/users/${userId}`, {
        nombre,
        email,
        ...(password ? { password } : {}),
      });

      // 2) subir avatar si hay
      if (file) {
        const fd = new FormData();
        fd.append('avatar', file);
        const { data: postData } = await API.post(
          `/users/${userId}/avatar`,
          fd,
          { headers: { 'Content-Type': 'multipart/form-data' } }
        );
        const origin = API.defaults.baseURL.replace(/\/api\/?$/, '');
        setAvatarUrl(origin + postData.avatar_url);
      }

      toast.success('Perfil actualizado');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al guardar.');
    }
  };

  if (!user) return <p>Cargando…</p>;

  // mostrar inicial
  const initial = user.nombre.charAt(0).toUpperCase();

  return (
    <div className="perfil-container">
      <h2 className="perfil-title">Mi Perfil</h2>
      <form className="perfil-form" onSubmit={handleSave}>
        <div className="perfil-avatar-section">
          <div className="perfil-avatar-wrapper">
            {avatarUrl
              ? <img
                  src={avatarUrl}
                  alt="Avatar"
                  className="perfil-avatar-img"
                />
              : <span className="perfil-avatar-initial">{initial}</span>
            }
          </div>
          <div>
            <button
              type="button"
              className="perfil-btn-file"
              onClick={() => fileInputRef.current.click()}
            >
              Cambiar foto
            </button>
            {file && (
              <span className="perfil-file-name">{file.name}</span>
            )}
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              hidden
              onChange={e => setFile(e.target.files[0])}
            />
          </div>
        </div>

        <div className="perfil-field">
          <label>Nombre</label>
          <input
            type="text"
            value={nombre}
            onChange={e => setNombre(e.target.value)}
            required
          />
        </div>

        <div className="perfil-field">
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="perfil-field">
          <label>Contraseña (dejar vacío para no cambiar)</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
        </div>

        <div className="perfil-actions">
          <button type="submit" className="btn-red">
            <FiEdit2 /> Guardar cambios
          </button>
        </div>
      </form>
    </div>
  );
}
