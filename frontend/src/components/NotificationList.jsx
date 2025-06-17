// src/components/NotificationList.jsx
import React, { useEffect, useState } from 'react';
import API from '../api';
import {
  FiChevronLeft,
  FiChevronRight,
  FiEye,
  FiTrash2
} from 'react-icons/fi';
import { useToast } from '../components/ToastContext';
import ModalGenerico from '../components/ModalGenerico';
import '../pages/Notificaciones.css';

const PAGE_SIZE = 3;

export default function NotificationList() {
  const toast = useToast();
  const [list, setList]           = useState([]);
  const [currentPage, setCurrentPage] = useState(1);

  // para el modal
  const [modalVer, setModalVer]   = useState(false);
  const [detalle, setDetalle]     = useState(null);

  useEffect(() => {
    cargar();
  }, []);

  const cargar = () => {
    API.get('/notificaciones')
      .then(r => {
        setList(r.data);
        setCurrentPage(1);
      })
      .catch(() => toast.error('No se pudieron cargar notificaciones'));
  };

  const handleView = async id => {
    setDetalle(null);
    setModalVer(true);
    try {
      const { data } = await API.get(`/notificaciones/${id}`);
      setDetalle(data);
    } catch {
      toast.error('No se pudo cargar detalle');
      setModalVer(false);
    }
  };

  const handleDelete = async id => {
    if (!window.confirm('¿Eliminar esta notificación?')) return;
    try {
      await API.delete(`/notificaciones/${id}`);
      toast.success('Notificación eliminada');
      cargar();
    } catch {
      toast.error('No se pudo eliminar');
    }
  };

  // Paginación
  const totalPages = Math.ceil(list.length / PAGE_SIZE);
  const start      = (currentPage - 1) * PAGE_SIZE;
  const paged      = list.slice(start, start + PAGE_SIZE);

  return (
    <>
      <div className="notif-card">
        <h3>Histórico de Notificaciones</h3>

        <table className="notif-table">
          <thead>
            <tr>
              <th>Asunto</th>
              <th>Destinatarios</th>
              <th>Enviados</th>
              <th>Fecha</th>
              <th>Acciones</th>
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
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                  })}{' '}
                  {new Date(n.creado_en).toLocaleTimeString('es-AR', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </td>
                <td className="emp-col-actions">
                  <button
                    className="emp-btn-action"
                    title="Ver"
                    onClick={() => handleView(n.id)}
                  >
                    <FiEye />
                  </button>{' '}
                  <button
                    className="emp-btn-action"
                    title="Eliminar"
                    onClick={() => handleDelete(n.id)}
                  >
                    <FiTrash2 />
                  </button>
                </td>
              </tr>
            ))}
            {paged.length === 0 && (
              <tr>
                <td colSpan="5" className="no-data">
                  No hay notificaciones.
                </td>
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

            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i + 1}
                className={currentPage === i + 1 ? 'active' : ''}
                onClick={() => setCurrentPage(i + 1)}
              >
                {i + 1}
              </button>
            ))}

            <button
              onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              Siguiente <FiChevronRight />
            </button>
          </div>
        )}
      </div>

      {/* Modal de detalle */}
      <ModalGenerico
        abierto={modalVer}
        onClose={() => setModalVer(false)}
        titulo="Detalle de Notificación"
      >
        {detalle ? (
          <div className="modal-body">
            <p><b>Asunto:</b> {detalle.info.asunto}</p>
            <p><b>Mensaje:</b></p>
            <div className="notif-body">{detalle.info.cuerpo}</div>
            <p>
              <b>Fecha:</b>{' '}
              {(() => {
                const raw = detalle.info.creado_en;
                const d   = raw ? new Date(raw) : null;
                if (!d || isNaN(d)) return '—';
                return (
                  <>
                    {d.toLocaleDateString('es-AR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric'
                    })}{' '}
                    {d.toLocaleTimeString('es-AR', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </>
                );
              })()}
            </p>
          </div>
        ) : (
          <div className="modal-body">
            <p>Cargando detalles…</p>
          </div>
        )}
      </ModalGenerico>
    </>
  );
}
