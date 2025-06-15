// src/pages/Reclutamiento.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import API from '../api';
import ModalGenerico from '../components/ModalGenerico';
import { useToast } from '../components/ToastContext';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { FiChevronDown } from 'react-icons/fi';
import './Reclutamiento.css';

const etapasDef = [
  'Requerimiento recibido',
  'Publicación de búsqueda',
  'Recepción y filtrado de CVs',
  'Entrevistas virtuales',
  'Desafío técnico',
  'Candidato seleccionado'
];
const PAGE_SIZE = 9;

export default function Reclutamiento() {
  const toast = useToast();
  const { hash } = useLocation();

  // refs para controlar ejecución única
  const mounted = useRef(false);
  const hashHandled = useRef(false);

  // estados
  const [procesos, setProcesos]     = useState([]);
  const [expandidos, setExpandidos] = useState({});
  const [currentPage, setCurrentPage] = useState(1);

  // formularios y modales (omito detalles de formulario)
  const [modalProc, setModalProc] = useState(false);
  const [modalPost, setModalPost] = useState(false);
  const [modalVer, setModalVer]   = useState(false);
  const [detallePost, setDetallePost] = useState(null);
  const [nuevoProc, setNuevoProc] = useState({
    codigo: '', puesto: '', area: '',
    tipo_busqueda: 'Interna', estado: 'En curso'
  });
  const [nuevoPost, setNuevoPost] = useState({
    proceso_id: '', nombre: '', email: '',
    telefono: '', cv_file: null, notas: ''
  });

  // filtros
  const [searchTerm, setSearchTerm]     = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // carga inicial de procesos
  const cargar = useCallback(async () => {
    try {
      const { data } = await API.get('/reclutamiento');
      setProcesos(data);
    } catch {
      toast.error('No se pudo cargar procesos');
    }
  }, [toast]);

  useEffect(() => {
    if (mounted.current) return;
    mounted.current = true;
    cargar();
  }, [cargar]);

  // aplica búsqueda + filtro
  const procesosFiltrados = procesos.filter(p => {
    if (statusFilter && p.estado !== statusFilter) return false;
    const term = searchTerm.toLowerCase();
    return (
      p.codigo.toLowerCase().includes(term) ||
      p.puesto.toLowerCase().includes(term) ||
      p.area.toLowerCase().includes(term)
    );
  });

  // manejar hash **solo una vez** tras montarse y cargar procesos
  useEffect(() => {
    if (!hash || hashHandled.current || procesos.length === 0) return;
    hashHandled.current = true;

    const id = parseInt(hash.slice(1), 10);
    if (isNaN(id)) return;

    const idx = procesosFiltrados.findIndex(p => p.id === id);
    if (idx < 0) return;

    // página donde está
    const page = Math.floor(idx / PAGE_SIZE) + 1;
    setCurrentPage(page);

    // luego expandir y scrollear
    setTimeout(() => {
      setExpandidos(e => ({ ...e, [id]: true }));
      document
        .getElementById(`proc-${id}`)
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      // limpiamos el hash una sola vez
      window.history.replaceState(null, '', window.location.pathname);
    }, 50);
  }, [hash, procesos, procesosFiltrados]);

  // CRUD procesos (simplificado)
  const guardarProc = async () => {
    try {
      await API.post('/reclutamiento', nuevoProc);
      toast.success('Proceso creado');
      setModalProc(false);
      cargar();
    } catch {
      toast.error('No se pudo crear proceso');
    }
  };
  const eliminarProc = async id => {
    if (!window.confirm('¿Eliminar este proceso?')) return;
    try {
      await API.delete(`/reclutamiento/${id}`);
      toast.success('Proceso eliminado');
      cargar();
    } catch {
      toast.error('No se pudo eliminar proceso');
    }
  };

  // CRUD postulantes (omito detalles)
  const guardarPost = async () => { /* ... */ };
  const verPostulante = async (pid, uid) => { /* ... */ };
  const avanzarPost = async (pid, uid) => { /* ... */ };

  // toggle expandir sin tocar el historial otra vez
  const toggle = id => {
    setExpandidos(e => ({ ...e, [id]: !e[id] }));
  };

  // Paginación
  const totalPages = Math.ceil(procesosFiltrados.length / PAGE_SIZE);
  const start      = (currentPage - 1) * PAGE_SIZE;
  const paged      = procesosFiltrados.slice(start, start + PAGE_SIZE);

  return (
    <div className="rec-card">
      <h3 className="rec-title">Reclutamiento y Selección</h3>

      <div className="rec-controls">
        <input
          type="text"
          placeholder="Buscar por código, puesto o área..."
          value={searchTerm}
          onChange={e => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
        />
        <div className="select-wrapper">
          <select
            value={statusFilter}
            onChange={e => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="select-filter"
          >
            <option value="">Todos los estados</option>
            <option value="En curso">En curso</option>
            <option value="Finalizado">Finalizado</option>
          </select>
          <FiChevronDown className="select-icon" />
        </div>
        <div className="rec-actions">
          <button className="btn-red" onClick={() => setModalProc(true)}>
            + Nuevo Proceso
          </button>
          <button className="btn-red" onClick={() => setModalPost(true)}>
            + Nuevo Postulante
          </button>
        </div>
      </div>

      <div className="rec-table-wrapper">
        <table className="rec-table">
          <thead>
            <tr>
              <th></th><th>Código</th><th>Puesto</th><th>Área</th>
              <th>Estado</th><th>Inicio</th><th>Fin</th><th>Acción</th>
            </tr>
          </thead>
          <tbody>
            {paged.map(p => (
              <React.Fragment key={p.id}>
                <tr id={`proc-${p.id}`}>
                  <td className="rec-arrow" onClick={() => toggle(p.id)}>
                    {expandidos[p.id] ? '▼' : '▶'}
                  </td>
                  <td>{p.codigo}</td><td>{p.puesto}</td><td>{p.area}</td>
                  <td>{p.estado}</td>
                  <td>{new Date(p.fecha_inicio).toLocaleDateString()}</td>
                  <td>{p.fecha_fin
                    ? new Date(p.fecha_fin).toLocaleDateString()
                    : '-'}
                  </td>
                  <td>
                    <button
                      className="btn-outline-red"
                      onClick={() => eliminarProc(p.id)}
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
                {expandidos[p.id] && (
                  <tr className="rec-detail-row">
                    <td colSpan="8">
                      <div className="rec-detail">
                        <div className="timeline">
                          {etapasDef.map((et, i) => (
                            <div
                              key={i}
                              className={`step ${i < p.etapa_actual ? 'done' : ''}`}
                            >
                              <div className="circle">{i + 1}</div>
                              <div className="label">{et}</div>
                            </div>
                          ))}
                        </div>
                        <div className="detail-info">
                          <p><b>Tipo:</b> {p.tipo_busqueda}</p>
                          <p><b>Responsable:</b> {p.responsable}</p>
                        </div>
                        <PostulantesList
                          procesoId={p.id}
                          onAvanzar={avanzarPost}
                          onVer={verPostulante}
                        />
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}

            {paged.length === 0 && (
              <tr>
                <td colSpan="8" className="no-data">
                  No hay procesos que coincidan.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

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
              key={i+1}
              className={currentPage === i+1 ? 'active' : ''}
              onClick={() => setCurrentPage(i+1)}
            >
              {i+1}
            </button>
          ))}
          <button
            onClick={() => setCurrentPage(p => Math.min(p+1, totalPages))}
            disabled={currentPage === totalPages}
          >
            Siguiente <FiChevronRight />
          </button>
        </div>
      )}

      {/* --- Modales --- */}
      <ModalGenerico abierto={modalProc} onClose={() => setModalProc(false)} titulo="Nuevo Proceso">
        {/* …formulario… */}
      </ModalGenerico>
      <ModalGenerico abierto={modalPost} onClose={() => setModalPost(false)} titulo="Agregar Postulante">
        {/* …formulario… */}
      </ModalGenerico>
      <ModalGenerico abierto={modalVer} onClose={() => setModalVer(false)} titulo="Detalle Postulante">
        {/* …detallePost… */}
      </ModalGenerico>
    </div>
  );
}

function PostulantesList({ procesoId, onAvanzar, onVer }) {
  const toast = useToast();
  const [lista, setLista] = useState([]);
  useEffect(() => {
    let mounted = true;
    API.get(`/reclutamiento/${procesoId}/postulantes`)
      .then(r => mounted && setLista(r.data))
      .catch(() => toast.error('Error al cargar postulantes'));
    return () => { mounted = false; };
  }, [procesoId, toast]);

  return (
    <table className="post-table">
      <thead>
        <tr>
          <th>Nombre</th><th>Email</th><th>Etapa</th><th>Acción</th><th>Ver</th>
        </tr>
      </thead>
      <tbody>
        {lista.map(u => (
          <tr key={u.id}>
            <td>{u.nombre}</td>
            <td>{u.email}</td>
            <td>{etapasDef[u.etapa_actual - 1]}</td>
            <td>
              <button
                className="btn-outline-red"
                onClick={() => onAvanzar(procesoId, u.id)}
                disabled={u.etapa_actual >= etapasDef.length}
              >
                Avanzar
              </button>
            </td>
            <td>
              <button
                className="btn-outline-red"
                onClick={() => onVer(procesoId, u.id)}
              >
                Ver
              </button>
            </td>
          </tr>
        ))}
        {!lista.length && (
          <tr>
            <td colSpan="5" className="no-data">
              No hay postulantes
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}
