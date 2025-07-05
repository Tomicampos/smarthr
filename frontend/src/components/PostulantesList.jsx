// src/components/PostulantesList.jsx
import React, { useEffect, useState } from 'react';
import API from '../api';

export default function PostulantesList({ procesoId, onVer, onAvanzar, onEliminar }) {
  const [lista, setLista] = useState([]);

  useEffect(() => {
    let mounted = true;
    API.get(`/reclutamiento/${procesoId}/postulantes`)
      .then(r => mounted && setLista(r.data))
      .catch(() => console.error('No se pudieron cargar postulantes'));
    return () => { mounted = false; };
  }, [procesoId]);

  return (
    <table className="post-table">
      <thead>
        <tr>
          <th>Nombre</th><th>Email</th><th>Etapa</th><th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        {lista.map(u => (
          <tr key={u.id}>
            <td>{u.nombre}</td>
            <td>{u.email}</td>
            <td>{u.etapa_actual}</td>
            <td>
              <button onClick={() => onAvanzar(procesoId, u.id)}>Avanzar</button>
              <button onClick={() => onVer(procesoId, u.id)}>Ver</button>
              <button onClick={() => onEliminar(procesoId, u.id)}>Eliminar</button>
            </td>
          </tr>
        ))}
        {!lista.length && (
          <tr><td colSpan="4">No hay postulantes</td></tr>
        )}
      </tbody>
    </table>
  );
}
