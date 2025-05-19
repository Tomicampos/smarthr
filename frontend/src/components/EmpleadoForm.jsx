// src/components/EmpleadoForm.jsx
import React, { useState, useEffect } from 'react';

export default function EmpleadoForm({ mode, user, onSuccess }) {
  const isView = mode === 'view';
  const [form, setForm] = useState({
    id: '', nombre: '', email: '', password: '', rol: 'empleado'
  });

  useEffect(() => {
    if (user) {
      setForm({
        id: String(user.id),
        nombre: user.nombre || '',
        email: user.email || '',
        password: '',
        rol: user.rol === 'Administrador' ? 'admin' : 'empleado'
      });
    } else {
      setForm({ id: '', nombre: '', email: '', password: '', rol: 'empleado' });
    }
  }, [user]);

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    const base = 'http://localhost:3001/api/users';
    const url = mode === 'create' ? base : `${base}/${form.id}`;
    const method = mode === 'create' ? 'POST' : 'PUT';
    const payload = {
      id: Number(form.id),
      nombre: form.nombre,
      email: form.email,
      rol: form.rol
    };
    if (mode === 'create') payload.password = form.password;

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type':'application/json' },
      body: JSON.stringify(payload)
    });
    if (res.ok) onSuccess();
    else alert('Error al guardar');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium">DNI</label>
        <input
          name="id" value={form.id}
          onChange={handleChange}
          disabled={isView}
          required
          className="mt-1 block w-full border rounded px-2 py-1"
        />
      </div>
      <div>
        <label className="block text-sm font-medium">Nombre</label>
        <input
          name="nombre" value={form.nombre}
          onChange={handleChange}
          disabled={isView} required
          className="mt-1 block w-full border rounded px-2 py-1"
        />
      </div>
      <div>
        <label className="block text-sm font-medium">Email</label>
        <input
          name="email" type="email" value={form.email}
          onChange={handleChange}
          disabled={isView} required
          className="mt-1 block w-full border rounded px-2 py-1"
        />
      </div>
      {mode==='create' && (
        <div>
          <label className="block text-sm font-medium">Password</label>
          <input
            name="password" type="password" value={form.password}
            onChange={handleChange} required
            className="mt-1 block w-full border rounded px-2 py-1"
          />
        </div>
      )}
      <div>
        <label className="block text-sm font-medium">Rol</label>
        <select
          name="rol" value={form.rol}
          onChange={handleChange}
          disabled={isView}
          className="mt-1 block w-full border rounded px-2 py-1"
        >
          <option value="empleado">Usuario</option>
          <option value="admin">Administrador</option>
        </select>
      </div>
      {!isView && (
        <button
          type="submit" 
          className="btn-primary"
        >
          {mode === 'edit' ? 'Actualizar' : 'Crear'}
        </button>
      )}
    </form>
  );
}
