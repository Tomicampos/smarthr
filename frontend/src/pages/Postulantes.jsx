// src/pages/Postulantes.jsx
import React, { useState, useEffect, useCallback } from 'react';
import API from '../api';
import ModalGenerico from '../components/ModalGenerico';
import { useToast } from '../components/ToastContext';
import { FiEye, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import './Postulantes.css';

const PAGE_SIZE = 9;

export default function Postulantes() {
  const toast = useToast();

  const [procesos, setProcesos]         = useState([]);
  const [postulantes, setPostulantes]   = useState([]);
  const [puestos, setPuestos]           = useState([]);
  const [searchTerm, setSearchTerm]     = useState('');
  const [puestoFilter, setPuestoFilter] = useState('');
  const [detalle, setDetalle]           = useState(null);
  const [modalVer, setModalVer]         = useState(false);

  const [currentPage, setCurrentPage]   = useState(1);

  // 1) Cargar procesos y puestos
  useEffect(() => {
    API.get('/reclutamiento')
      .then(({ data }) => setProcesos(data))
      .catch(() => toast.error('No se pudieron cargar procesos'));

    API.get('/puestos')
      .then(({ data }) => setPuestos(data))
      .catch(() => toast.error('No se pudieron cargar puestos'));
  }, [toast]);

  // 2) Cuando cambien procesos, cargar todos los postulantes
  useEffect(() => {
    (async () => {
      try {
        const all = [];
        await Promise.all(procesos.map(async p => {
          const { data } = await API.get(`/reclutamiento/${p.id}/postulantes`);
          data.forEach(u => all.push({
            ...u,
            puesto: p.puesto,
            proceso_id: p.id
          }));
        }));
        setPostulantes(all);
      } catch {
        toast.error('Error cargando postulantes');
      }
    })();
  }, [procesos, toast]);

  // 3) Abrir modal detalle
  const ver = async (pid, uid) => {
    setDetalle(null);
    setModalVer(true);
    try {
      const { data } = await API.get(`/reclutamiento/${pid}/postulantes/${uid}`);
      setDetalle(data);
    } catch {
      toast.error('No se pudo cargar detalle');
    }
  };

  // 4) Filtrar por texto y puesto
  const filtrados = postulantes.filter(u => {
    const term = searchTerm.toLowerCase();
    if (puestoFilter && u.puesto !== puestoFilter) return false;
    return (
      u.nombre.toLowerCase().includes(term) ||
      u.email.toLowerCase().includes(term) ||
      u.puesto.toLowerCase().includes(term)
    );
  });

  // 5) Paginación
  const totalPages = Math.ceil(filtrados.length / PAGE_SIZE);
  const start      = (currentPage - 1) * PAGE_SIZE;
  const paged      = filtrados.slice(start, start + PAGE_SIZE);

  // Reset a página 1 si cambia filtro/búsqueda
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, puestoFilter]);

  return (
    <div className="card">
      <h3 className="card-title">Base de Postulantes</h3>

      {/* Controles: buscador + filtro por puesto */}
      <div className="card-controls">
        <input
          type="text"
          placeholder="Buscar por nombre, email o puesto..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
        <select
          value={puestoFilter}
          onChange={e => setPuestoFilter(e.target.value)}
        >
          <option value="">Todos los puestos</option>
          {puestos.map(p => (
            <option key={p.id} value={p.nombre}>
              {p.nombre}
            </option>
          ))}
        </select>
      </div>

      {/* Tabla */}
      <div className="table-wrapper">
        <table className="table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Email</th>
              <th>Puesto</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody>
            {paged.map(u => (
              <tr key={`${u.proceso_id}-${u.id}`}>
                <td>{u.nombre}</td>
                <td>{u.email}</td>
                <td>{u.puesto}</td>
                <td className="table-action">
                  <button onClick={() => ver(u.proceso_id, u.id)} title="Ver detalle">
                    <FiEye />
                  </button>
                </td>
              </tr>
            ))}
            {!paged.length && (
              <tr>
                <td colSpan="4" className="no-data">
                  No hay postulantes que coincidan.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
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

      {/* Modal Detalle Postulante (igual que Reclutamiento.jsx) */}
      <ModalGenerico
        abierto={modalVer}
        onClose={() => setModalVer(false)}
        titulo="Detalle Postulante"
      >
        {detalle ? (
          <div className="modal-body-post">
            <p><b>Nombre:</b> {detalle.nombre}</p>
            <p>
              <b>Email:</b>{' '}
              <a href={`mailto:${detalle.email}`}>
                {detalle.email}
              </a>
            </p>
            {detalle.telefono && (
              <p>
                <b>Teléfono:</b>{' '}
                <a
                  href={`https://wa.me/+549${detalle.telefono.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {detalle.telefono}
                </a>
              </p>
            )}
            {detalle.linkedin && (
              <p>
                <b>LinkedIn:</b>{' '}
                <a href={detalle.linkedin} target="_blank" rel="noopener noreferrer">
                  Ver perfil
                </a>
              </p>
            )}
            {detalle.notas && <>
              <b>Notas:</b>
              <p className="detalle-notas">{detalle.notas}</p>
            </>}
            {detalle.cv_filename && (
              <p>
                <b>CV:</b>{' '}
                <button
                  className="link-button"
                  onClick={() => {
                    API.get(
                      `/reclutamiento/${detalle.proceso_id}/postulantes/${detalle.id}/cv/download`,
                      { responseType: 'blob' }
                    )
                      .then(res => {
                        const blob = new Blob([res.data], { type: 'application/pdf' });
                        const url  = URL.createObjectURL(blob);
                        window.open(url, '_blank', 'noopener,noreferrer');
                        setTimeout(() => URL.revokeObjectURL(url), 2000);
                      })
                      .catch(() => toast.error('No se pudo abrir el CV.'));
                  }}
                >
                  {detalle.cv_filename}
                </button>
              </p>
            )}
          </div>
        ) : (
          <div className="modal-body"><p>Cargando detalles…</p></div>
        )}
      </ModalGenerico>
    </div>
  );
}
