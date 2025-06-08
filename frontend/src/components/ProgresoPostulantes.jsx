// src/components/ProgresoPostulantes.jsx
import React, { useEffect, useState } from 'react';
import API from '../api';
import { FiChevronRight } from 'react-icons/fi';
import './ProgresoPostulantes.css';

const etapasDef = [
  'Requerimiento recibido',
  'Publicación de búsqueda',
  'Recepción y filtrado de CVs',
  'Entrevistas virtuales',
  'Desafío técnico',
  'Candidato seleccionado'
];

export default function ProgresoPostulantes() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        // 1) Traemos todos los procesos en curso
        const { data: procesos } = await API.get('/reclutamiento');
        const enCurso = procesos.filter(p => p.estado === 'En curso');

        // 2) Por cada proceso, buscamos el postulante con mayor etapa_actual
        const promesas = enCurso.map(async proc => {
          const { data: candidatos } = await API.get(
            `/reclutamiento/${proc.id}/postulantes`
          );
          if (!candidatos.length) return null;

          // 3) Elegimos el de mayor etapa_actual
          const top = candidatos.reduce((prev, cur) =>
            cur.etapa_actual > prev.etapa_actual ? cur : prev
          , candidatos[0]);

          return {
            id: proc.id,
            nombre: top.nombre,
            puesto: proc.puesto,
            etapa: etapasDef[top.etapa_actual - 1] || 'Desconocido',
            read: top.etapa_actual === etapasDef.length
          };
        });

        const resultados = (await Promise.all(promesas)).filter(Boolean);
        setItems(resultados);
      } catch (err) {
        console.error('Error cargando progreso de postulantes', err);
      }
    })();
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
          {items.map(p => (
            <tr key={p.id}>
              <td>{p.nombre}</td>
              <td>{p.puesto}</td>
              <td>
                <span
                  className={
                    p.etapa === 'Cancelado'
                      ? 'status canceled'
                      : p.etapa.includes('Entrevista')
                      ? 'status blue'
                      : 'status'
                  }
                />
                {p.etapa}
              </td>
              <td>
                <FiChevronRight className="row-icon" />
              </td>
            </tr>
          ))}
          {!items.length && (
            <tr>
              <td colSpan="4" className="no-data">
                No hay procesos en curso
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
