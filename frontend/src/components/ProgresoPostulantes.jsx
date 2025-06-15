import React, { useEffect, useState } from 'react';
import API from '../api';
import { FiChevronRight } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const { data: procesos } = await API.get('/reclutamiento');
        const enCurso = procesos.filter(p => p.estado === 'En curso');

        const promesas = enCurso.map(async proc => {
          const { data: candidatos } = await API.get(
            `/reclutamiento/${proc.id}/postulantes`
          );
          if (!candidatos.length) return null;

          const top = candidatos.reduce((prev, cur) =>
            cur.etapa_actual > prev.etapa_actual ? cur : prev
          , candidatos[0]);

          return {
            procesoId: proc.id,
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
        <button
          className="view-all"
          onClick={() => navigate('/reclutamiento')}
        >
          Ver Todo <FiChevronRight />
        </button>
      </div>

      <div className="progreso-table-wrapper">
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
              <tr key={p.procesoId}>
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
                <td className="progreso-col-action">
                  <button
                    className="row-icon"
                    onClick={() =>
                      navigate(`/reclutamiento#${p.procesoId}`)
                    }
                    title="Ir al proceso"
                  >
                    <FiChevronRight />
                  </button>
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
    </div>
  );
}
