// src/pages/MisNotificaciones.jsx
import React, { useEffect, useState } from 'react';
import API from '../api';
import { useToast } from '../components/ToastContext';
import ModalGenerico from '../components/ModalGenerico';
import { FiEye } from 'react-icons/fi';
import '../pages/Notificaciones.css';


export default function MisNotificaciones() {
  const toast = useToast();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  // detalle modal
  const [modalOpen, setModalOpen] = useState(false);
  const [detalle, setDetalle] = useState(null);

  useEffect(() => {
    API.get('/mis-notificaciones')
      .then(({ data }) => setList(data))
      .catch(() => toast.error('No se pudieron cargar tus notificaciones.'))
      .finally(() => setLoading(false));
  }, [toast]);

  const verDetalle = notif => {
    setDetalle(notif);
    setModalOpen(true);
  };

  return (
    <div className="notif-card">
      <h3>Mis Notificaciones</h3>
      {loading ? (
        <p>Cargando…</p>
      ) : (
        <>
          <table className="notif-table">
            <thead>
              <tr>
                <th>Asunto</th>
                <th>Estado</th>
                <th>Fecha</th>
                <th>Ver</th>
              </tr>
            </thead>
            <tbody>
              {list.length === 0 && (
                <tr><td colSpan="4" className="no-data">No tienes notificaciones.</td></tr>
              )}
              {list.map(n => (
                <tr key={n.id}>
                  <td>{n.asunto}</td>
                  <td>{n.estado}</td>
                  <td>
                    {new Date(n.creado_en).toLocaleDateString('es-AR', {
                      day:'2-digit',month:'2-digit',year:'numeric'
                    })}{' '}
                    {new Date(n.creado_en).toLocaleTimeString('es-AR',{
                      hour:'2-digit',minute:'2-digit'
                    })}
                  </td>
                  <td>
                    <button
                      className="btn-icon"
                      title="Ver detalle"
                      onClick={() => verDetalle(n)}
                    >
                      <FiEye />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Paginación si quieres, idéntica a la de reclutamiento */}
        </>
      )}

      {/* Modal detalle */}
      <ModalGenerico
        abierto={modalOpen}
        onClose={() => setModalOpen(false)}
        titulo="Detalle de Notificación"
      >
        {detalle && (
          <div className="modal-body">
            <p><b>Asunto:</b> {detalle.asunto}</p>
            <p><b>Mensaje:</b></p>
            <div className="notif-body">{detalle.cuerpo}</div>
            <p><b>Estado:</b> {detalle.estado}</p>
            <p>
              <b>Fecha:</b>{' '}
              {new Date(detalle.creado_en).toLocaleString('es-AR', {
                day:'2-digit',month:'2-digit',year:'numeric',
                hour:'2-digit',minute:'2-digit'
              })}
            </p>
          </div>
        )}
      </ModalGenerico>
    </div>
  );
}
