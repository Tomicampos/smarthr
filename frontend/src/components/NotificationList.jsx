// src/components/NotificationList.jsx
import React, { useEffect, useState } from 'react';
import API from '../api';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import '../pages/Notificaciones.css';
import { useNavigate } from 'react-router-dom'

const PAGE_SIZE = 3;

export default function NotificationList() {
  const [list, setList] = useState([]);
  const [currentPage, setCurrentPage] = useState();
  const navigate = useNavigate()

  useEffect(() => {
    API.get('/notificaciones')
      .then(r => {
        setList(r.data);
        setCurrentPage(1);
      })
      .catch(err => console.error('Error cargando notificaciones', err));
  }, []);

  // cálculo de paginación
  const totalItems = list.length;
  const totalPages = Math.ceil(totalItems / PAGE_SIZE);
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  const start = (currentPage - 1) * PAGE_SIZE;
  const paged = list.slice(start, start + PAGE_SIZE);

  return (
    <div className="notif-card">
      <h3>Histórico de Notificaciones</h3>
      <table className="notif-table">
        <thead>
          <tr>
            <th>Asunto</th>
            <th>Destinatarios</th>
            <th>Enviados</th>
            <th>Fecha</th>
            <th>Ver</th>
          </tr>
        </thead>
        <tbody>
          {paged.map(n => (
            <tr key={n.id}>
              <td>{n.asunto}</td>
              <td>{n.total_destinatarios}</td>
              <td>{n.enviados}</td>
              <td>
                {new Date(n.creado_en).toLocaleDateString('es-AR', {
                  day: '2-digit', month: '2-digit', year: 'numeric'
                })}{' '}
                {new Date(n.creado_en).toLocaleTimeString('es-AR', {
                  hour: '2-digit', minute: '2-digit'
                })}
              </td>
              <td>
                <button
                  className="btn-outline-red"
                  onClick={() => navigate(`/notificaciones/${n.id}`)}
                >
                  Ver
                </button>
              </td>
            </tr>
          ))}
          {paged.length === 0 && (
            <tr>
              <td colSpan="5" className="no-data">No hay notificaciones.</td>
            </tr>
          )}
        </tbody>
      </table>

      {totalPages > 1 && (
        <div className="pagination">
          <button
            onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
          >
            <FiChevronLeft /> Anterior
          </button>

          <ul>
            {pages.map(p => (
              <li key={p}>
                <button
                  className={p === currentPage ? 'active' : ''}
                  onClick={() => setCurrentPage(p)}
                >
                  {p}
                </button>
              </li>
            ))}
          </ul>

          <button
            onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
            disabled={currentPage === totalPages}
          >
            Siguiente <FiChevronRight />
          </button>
        </div>
      )}
    </div>
);
}
