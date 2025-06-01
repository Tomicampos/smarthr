// src/components/ProgresoPostulantes.jsx
import React, { useEffect, useState } from 'react';
import api from '../api';
import { FiChevronRight } from 'react-icons/fi';
import './ProgresoPostulantes.css';

// Datos de ejemplo - reemplazar con llamado real
const ejemploPostulantes = [
  { id: 1, nombre: 'Tomas Campos', puesto: 'Manager Developer', etapa: 'Entrevista al usuario', read: true },
  { id: 2, nombre: 'Renzito', puesto: 'Marketing', etapa: 'Entrevista de RRHH', read: true },
  { id: 3, nombre: 'Chilli Parker', puesto: 'Developer', etapa: 'En revisión', read: true },
  { id: 4, nombre: 'Homero Simpson', puesto: 'Devops', etapa: 'Cancelado', read: false },
  { id: 5, nombre: 'Duki', puesto: 'Mobile Dev', etapa: 'Entrevista al usuario', read: true }
];

export default function ProgresoPostulantes() {
  const [postulantes, setPostulantes] = useState([]);

  useEffect(() => {
    // Reemplazar con API real: api.get('/api/applicants')...
    setPostulantes(ejemploPostulantes);
  }, []);

  return (
    <div className="progreso-card">
      <div className="progreso-header">
        <h3>Progreso De Postulantes</h3>
        <button className="view-all">
          Ver Todo <FiChevronRight />
        </button>
      </div>
      <table className="progreso-table">
        <thead>
          <tr>
            <th>Nombre completo</th>
            <th>Puesto</th>
            <th>Etapa</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {postulantes.map(p => (
            <tr key={p.id}>
              <td>{p.nombre}</td>
              <td>{p.puesto}</td>
              <td>
                <span className={p.etapa === 'Cancelado' ? 'status canceled' : p.etapa.includes('Entrevista') ? 'status blue' : 'status'} />
                {p.etapa}
              </td>
              <td>
                <FiChevronRight className="row-icon" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
