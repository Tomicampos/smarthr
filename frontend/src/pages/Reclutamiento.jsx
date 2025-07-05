// src/pages/Reclutamiento.jsx

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import API from '../api';
import ModalGenerico from '../components/ModalGenerico';
import { useToast } from '../components/ToastContext';
import {
  FiChevronLeft,
  FiChevronRight,
  FiChevronDown,
  FiEye,
  FiTrash2
} from 'react-icons/fi';
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

// ← objeto para resetear formulario de proceso
const DEFAULT_NUEVO_PROC = {
  codigo: '',
  puesto_id: '',
  area_id: '',
  tipo_busqueda: 'Interna',
  estado: 'En curso',
};

export default function Reclutamiento() {
  const toast = useToast();
  const { hash } = useLocation();
  const mounted = useRef(false);
  const hashHandled = useRef(false);

  // ── estados principales ──
  const [procesos, setProcesos] = useState([]);
  const [expandidos, setExpandidos] = useState({});
  const [currentPage, setCurrentPage] = useState(1);

  // ── modales ──
  const [modalProc, setModalProc] = useState(false);
  const [modalPost, setModalPost] = useState(false);
  const [modalVer, setModalVer] = useState(false);
  const [detallePost, setDetallePost] = useState(null);

  // ── selects ──
  const [areas, setAreas] = useState([]);
  const [puestos, setPuestos] = useState([]);

  // ── formularios ──
  const [nuevoProc, setNuevoProc] = useState(DEFAULT_NUEVO_PROC);
  const [nuevoPost, setNuevoPost] = useState({
    proceso_id: '',
    nombre: '',
    email: '',
    telefono: '',
    cv_file: null,
    notas: '',
    linkedin: ''
  });

  // ── filtros ──
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // 1) cargar procesos
  const cargar = useCallback(async () => {
    try {
      const { data } = await API.get('/reclutamiento');
      setProcesos(data);
    } catch {
      toast.error('No se pudo cargar procesos');
    }
  }, [toast]);

  // 2) al montar, ejecutar solo una vez
  useEffect(() => {
    if (mounted.current) return;
    mounted.current = true;
    cargar();
  }, [cargar]);

  // 3) cargar áreas y puestos
  useEffect(() => {
    API.get('/areas')
      .then(r => setAreas(r.data))
      .catch(() => toast.error('No se pudieron cargar áreas'));
    API.get('/puestos')
      .then(r => setPuestos(r.data))
      .catch(() => toast.error('No se pudieron cargar puestos'));
  }, [toast]);

  // ── filtro + paginación ──
  const procesosFiltrados = procesos.filter(p => {
    if (statusFilter && p.estado !== statusFilter) return false;
    const term = searchTerm.toLowerCase();
    return (
      p.codigo.toLowerCase().includes(term) ||
      p.puesto.toLowerCase().includes(term) ||
      p.area.toLowerCase().includes(term)
    );
  });
  const totalPages = Math.ceil(procesosFiltrados.length / PAGE_SIZE);
  const start = (currentPage - 1) * PAGE_SIZE;
  const paged = procesosFiltrados.slice(start, start + PAGE_SIZE);

  // ── ancla por hash ──
  useEffect(() => {
    if (!hash || hashHandled.current || procesos.length === 0) return;
    hashHandled.current = true;
    const id = parseInt(hash.slice(1), 10);
    if (isNaN(id)) return;
    const idx = procesosFiltrados.findIndex(p => p.id === id);
    if (idx < 0) return;
    setCurrentPage(Math.floor(idx / PAGE_SIZE) + 1);
    setTimeout(() => {
      setExpandidos(e => ({ ...e, [id]: true }));
      document.getElementById(`proc-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      window.history.replaceState(null, '', window.location.pathname);
    }, 50);
  }, [hash, procesos, procesosFiltrados]);

  // ── handlers proceso ──
  const abrirModalProc = () => {
    setNuevoProc(DEFAULT_NUEVO_PROC);
    setModalProc(true);
  };
  const cerrarModalProc = () => {
    setModalProc(false);
    setNuevoProc(DEFAULT_NUEVO_PROC);
  };
  const guardarProc = async () => {
    if (!nuevoProc.codigo.trim()) {
      toast.error('El código es obligatorio.');
      return;
    }
    if (!nuevoProc.puesto_id) {
      toast.error('Debes seleccionar un puesto.');
      return;
    }
    if (!nuevoProc.area_id) {
      toast.error('Debes seleccionar un área.');
      return;
    }
    try {
      await API.post('/reclutamiento', {
        codigo: nuevoProc.codigo.trim(),
        puesto_id: nuevoProc.puesto_id,
        area_id: nuevoProc.area_id,
        tipo_busqueda: nuevoProc.tipo_busqueda
      });
      toast.success('Proceso creado');
      cerrarModalProc();
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

  // ── handlers postulante ──
  const guardarPost = async () => {
    if (!nuevoPost.proceso_id) {
      toast.error('Debe seleccionar un proceso');
      return;
    }
    // Validación LinkedIn
    if (nuevoPost.linkedin) {
      const pattern = /^https?:\/\/(www\.)?linkedin\.com\/.+$/i;
      if (!pattern.test(nuevoPost.linkedin.trim())) {
        toast.error('La URL de LinkedIn no es válida.');
        return;
      }
    }
    try {
      const fd = new FormData();
      fd.append('nombre', nuevoPost.nombre);
      fd.append('email', nuevoPost.email);
      fd.append('telefono', nuevoPost.telefono);
      fd.append('notas', nuevoPost.notas);
      fd.append('linkedin', nuevoPost.linkedin.trim());
      if (nuevoPost.cv_file) fd.append('cv', nuevoPost.cv_file);
      await API.post(
        `/reclutamiento/${nuevoPost.proceso_id}/postulantes`,
        fd,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      toast.success('Postulante agregado');
      setModalPost(false);
      setNuevoPost({
        proceso_id: '',
        nombre: '',
        email: '',
        telefono: '',
        cv_file: null,
        notas: '',
        linkedin: ''
      });
      cargar();
    } catch {
      toast.error('No se pudo agregar postulante');
    }
  };

  const verPostulante = async (pid, uid) => {
    setDetallePost(null);
    setModalVer(true);
    try {
      const { data } = await API.get(`/reclutamiento/${pid}/postulantes/${uid}`);
      setDetallePost(data);
    } catch {
      toast.error('No se pudo cargar detalle');
    }
  };

  const viewCv = async (pid, uid) => {
    try {
      const res = await API.get(
        `/reclutamiento/${pid}/postulantes/${uid}/cv/download`,
        { responseType: 'blob' }
      );
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank', 'noopener,noreferrer');
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    } catch {
      toast.error('No se pudo abrir el CV.');
    }
  };

  const avanzarPost = async (pid, uid) => {
    try {
      await API.post(`/reclutamiento/${pid}/postulantes/${uid}/avanzar`);
      await API.post(`/reclutamiento/${pid}/avanzar`);
      toast.success('Candidato y proceso avanzados');
      cargar();
    } catch {
      toast.error('No se pudo avanzar');
    }
  };
  const eliminarPostulante = async (pid, uid) => {
    if (!window.confirm('¿Eliminar este postulante?')) return;
    try {
      await API.delete(`/reclutamiento/${pid}/postulantes/${uid}`);
      toast.success('Postulante eliminado');
      cargar();
    } catch {
      toast.error('No se pudo eliminar postulante');
    }
  };

  return (
    <div className="rec-card">
      <h3 className="rec-title">Reclutamiento y Selección</h3>

      {/* ── Controles ── */}
      <div className="rec-controls">
        <input
          type="text"
          placeholder="Buscar por código, puesto o área..."
          value={searchTerm}
          onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
        />
        <div className="select-wrapper">
          <select
            className="select-filter"
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setCurrentPage(1); }}
          >
            <option value="">Todos los estados</option>
            <option value="En curso">En curso</option>
            <option value="Finalizado">Finalizado</option>
          </select>
          <FiChevronDown className="select-icon" />
        </div>
        <div className="rec-actions">
          <button className="btn-red" onClick={abrirModalProc}>+ Nuevo Proceso</button>
          <button className="btn-red" onClick={() => setModalPost(true)}>+ Nuevo Postulante</button>
        </div>
      </div>

      {/* ── Tabla de procesos ── */}
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
                  <td className="rec-arrow" onClick={() => setExpandidos(e => ({ ...e, [p.id]: !e[p.id] }))}>
                    {expandidos[p.id] ? '▼' : '▶'}
                  </td>
                  <td>{p.codigo}</td>
                  <td>{p.puesto}</td>
                  <td>{p.area}</td>
                  <td>{p.estado}</td>
                  <td>{new Date(p.fecha_inicio).toLocaleDateString()}</td>
                  <td>{p.fecha_fin ? new Date(p.fecha_fin).toLocaleDateString() : '-'}</td>
                  <td className="rec-col-actions">
                    <button title="Eliminar proceso" onClick={() => eliminarProc(p.id)}>
                      <FiTrash2 />
                    </button>
                  </td>
                </tr>
                {expandidos[p.id] && (
                  <tr className="rec-detail-row">
                    <td colSpan="8">
                      <div className="rec-detail">
                        <div className="timeline">
                          {etapasDef.map((et, i) => (
                            <div key={i} className={`step ${i < p.etapa_actual ? 'done' : ''}`}>
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
                          onVer={verPostulante}
                          onAvanzar={avanzarPost}
                          onEliminar={eliminarPostulante}
                        />
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
            {!paged.length && (
              <tr><td colSpan="8" className="no-data">No hay procesos que coincidan.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ── Paginación ── */}
      {totalPages > 1 && (
        <div className="pagination">
          <button onClick={() => setCurrentPage(p => Math.max(p-1, 1))} disabled={currentPage===1}>
            <FiChevronLeft/> Anterior
          </button>
          {[...Array(totalPages)].map((_,i)=>(
            <button key={i+1}
                    className={currentPage===i+1?'active':''}
                    onClick={()=>setCurrentPage(i+1)}>
              {i+1}
            </button>
          ))}
          <button onClick={() => setCurrentPage(p => Math.min(p+1, totalPages))} disabled={currentPage===totalPages}>
            Siguiente <FiChevronRight/>
          </button>
        </div>
      )}

      {/* ── Modal Nuevo Proceso ── */}
      <ModalGenerico abierto={modalProc} onClose={cerrarModalProc} titulo="Nuevo Proceso">
        <label>Código</label>
        <input
          placeholder="Ingrese un Código"
          value={nuevoProc.codigo}
          onChange={e => setNuevoProc(np => ({ ...np, codigo: e.target.value }))}
        />
        <label>Puesto</label>
        <select
          required
          value={nuevoProc.puesto_id}
          onChange={e => setNuevoProc(np => ({ ...np, puesto_id: e.target.value ? Number(e.target.value) : '' }))}
        >
          <option value="">— Selecciona un puesto —</option>
          {puestos.map(pu => <option key={pu.id} value={pu.id}>{pu.nombre}</option>)}
        </select>
        <label>Área</label>
        <select
          required
          value={nuevoProc.area_id}
          onChange={e => setNuevoProc(np => ({ ...np, area_id: e.target.value ? Number(e.target.value) : '' }))}
        >
          <option value="">— Selecciona un área —</option>
          {areas.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
        </select>
        <label>Tipo de búsqueda</label>
        <select
          value={nuevoProc.tipo_busqueda}
          onChange={e => setNuevoProc(np => ({ ...np, tipo_busqueda: e.target.value }))}
        >
          <option>Interna</option><option>Externa</option>
        </select>
        <div className="modal-footer">
          <button className="btn-primary" onClick={guardarProc}>Guardar</button>
        </div>
      </ModalGenerico>

      {/* ── Modal Agregar Postulante ── */}
      <ModalGenerico abierto={modalPost} onClose={() => {
        setModalPost(false);
        setNuevoPost({
          proceso_id: '',
          nombre: '',
          email: '',
          telefono: '',
          cv_file: null,
          notas: '',
          linkedin: ''
        });
      }} titulo="Agregar Postulante">
        <div className="modal-body">
          <label>Proceso</label>
          <select
            value={nuevoPost.proceso_id}
            onChange={e => setNuevoPost(np => ({ ...np, proceso_id: e.target.value }))}
          >
            <option value="">— Selecciona uno —</option>
            {procesos.map(pr => (
              <option key={pr.id} value={pr.id}>{pr.codigo} — {pr.puesto}</option>
            ))}
          </select>
          <label>Nombre</label>
          <input
            placeholder="Ingrese Nombre y Apellido"
            value={nuevoPost.nombre}
            onChange={e => setNuevoPost(np => ({ ...np, nombre: e.target.value }))}
          />
          <label>Email</label>
          <input
            type="email"
            placeholder="Ingrese un correo electrónico"
            value={nuevoPost.email}
            onChange={e => setNuevoPost(np => ({ ...np, email: e.target.value }))}
          />
          <label>Teléfono</label>
          <input
            placeholder="Ingrese un número de teléfono"
            value={nuevoPost.telefono}
            onChange={e => setNuevoPost(np => ({ ...np, telefono: e.target.value }))}
          />
          <label>LinkedIn (URL)</label>
          <input
            type="url"
            placeholder="https://www.linkedin.com/in/usuario"
            value={nuevoPost.linkedin}
            onChange={e => setNuevoPost(np => ({ ...np, linkedin: e.target.value }))}
          />
          <label>CV (PDF)</label>
          <input
            type="file"
            accept="application/pdf"
            onChange={e => setNuevoPost(np => ({ ...np, cv_file: e.target.files[0] }))}
          />
          <div className="modal-footer">
            <button className="btn-red" onClick={guardarPost}>Guardar</button>
          </div>
        </div>
      </ModalGenerico>

      {/* ── Modal Detalle Postulante ── */}
      <ModalGenerico abierto={modalVer} onClose={() => setModalVer(false)} titulo="Detalle Postulante">
        {detallePost ? (
          <div className="modal-body">
            <p><b>Nombre:</b> {detallePost.nombre}</p>
            <p><b>Email:</b>{' '}
              <a href={`mailto:${detallePost.email}`} target="_blank" rel="noopener noreferrer">
                {detallePost.email}
              </a>
            </p>
            {detallePost.telefono && (
              <p><b>Teléfono:</b>{' '}
                <a
                  href={`https://wa.me/+549${detallePost.telefono.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {detallePost.telefono}
                </a>
              </p>
            )}
            {detallePost.linkedin && (
              <p><b>LinkedIn:</b>{' '}
                <a href={detallePost.linkedin} target="_blank" rel="noopener noreferrer">
                  {detallePost.linkedin}
                </a>
              </p>
            )}
            {detallePost.notas && <>
              <b>Notas:</b>
              <p className="detalle-notas">{detallePost.notas}</p>
            </>}
            {detallePost.cv_filename && (
             <p>
               <b>CV:</b>{' '}
               <a
                 href="#"
                 className="link-button"
                 onClick={e => {
                   e.preventDefault();
                   viewCv(detallePost.proceso_id, detallePost.id);
                 }}
               >
                 {detallePost.cv_filename}
               </a>
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

// ── COMPONENTE AUXILIAR PostulantesList ──
function PostulantesList({ procesoId, onVer, onAvanzar, onEliminar }) {
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
        <tr><th>Nombre</th><th>Email</th><th>Etapa</th><th>Acciones</th></tr>
      </thead>
      <tbody>
        {lista.map(u => (
          <tr key={u.id}>
            <td>{u.nombre}</td>
            <td>{u.email}</td>
            <td>{etapasDef[u.etapa_actual - 1]}</td>
            <td className="rec-col-actions">
              <button title="Avanzar etapa" onClick={() => onAvanzar(procesoId, u.id)}
                disabled={u.etapa_actual >= etapasDef.length}>
                <FiChevronRight/>
              </button>
              <button title="Ver detalle" onClick={() => onVer(procesoId, u.id)}>
                <FiEye/>
              </button>
              <button title="Eliminar postulante" onClick={() => onEliminar(procesoId, u.id)}>
                <FiTrash2/>
              </button>
            </td>
          </tr>
        ))}
        {!lista.length && (
          <tr><td colSpan="4" className="no-data">No hay postulantes</td></tr>
        )}
      </tbody>
    </table>
  );
}
