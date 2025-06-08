// src/pages/Reclutamiento.jsx
import React, { useState, useEffect, useCallback } from 'react';
import API from '../api';
import ModalGenerico from '../components/ModalGenerico';
import { useToast } from '../components/ToastContext';
import './Reclutamiento.css';

const etapasDef = [
  'Requerimiento recibido',
  'Publicación de búsqueda',
  'Recepción y filtrado de CVs',
  'Entrevistas virtuales',
  'Desafío técnico',
  'Candidato seleccionado'
];

export default function Reclutamiento() {
  const toast = useToast();

  // — Estados —
  const [procesos, setProcesos]     = useState([]);
  const [reloadFlag, setReloadFlag] = useState(0);
  const [expandidos, setExpandidos] = useState({});
  const [modalProc, setModalProc]   = useState(false);
  const [modalPost, setModalPost]   = useState(false);
  const [modalVer, setModalVer]     = useState(false);
  const [detallePost, setDetallePost] = useState(null);

  // Formularios
  const [nuevoProc, setNuevoProc] = useState({
    codigo: '', puesto: '', area: '', tipo_busqueda: 'Interna'
  });
  const [nuevoPost, setNuevoPost] = useState({
    proceso_id: '', nombre: '', email: '',
    telefono: '', cv_file: null, notas: ''
  });

  // — Cargar procesos —
  const cargar = useCallback(async () => {
    try {
      const { data } = await API.get('/reclutamiento');
      setProcesos(data);
    } catch {
      toast.error('No se pudo cargar procesos');
    }
  }, [toast]);

  useEffect(() => { cargar(); }, [cargar, reloadFlag]);

  // — CRUD procesos —
  const guardarProc = async () => {
    await API.post('/reclutamiento', nuevoProc);
    setModalProc(false);
    toast.success('Proceso creado');
    setReloadFlag(f => f + 1);
  };
  const eliminarProc = async id => {
    if (!window.confirm('¿Eliminar este proceso?')) return;
    await API.delete(`/reclutamiento/${id}`);
    toast.success('Proceso eliminado');
    setReloadFlag(f => f + 1);
  };

  // — CRUD postulantes —
  const guardarPost = async () => {
    if (!nuevoPost.proceso_id) {
      toast.error('Seleccione un proceso primero');
      return;
    }
    const fd = new FormData();
    ['nombre','email','telefono','notas'].forEach(f => fd.append(f, nuevoPost[f] || ''));
    if (nuevoPost.cv_file) fd.append('cv', nuevoPost.cv_file);
    await API.post(`/reclutamiento/${nuevoPost.proceso_id}/postulantes`, fd, {
      headers: { 'Content-Type':'multipart/form-data' }
    });
    setModalPost(false);
    toast.success('Postulante agregado');
    setReloadFlag(f => f + 1);
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

  const toggle = id => setExpandidos(e => ({ ...e, [id]: !e[id] }));

  return (
    <div className="rec-container">
      {/* Header */}
      <div className="rec-header">
        <h1>Reclutamiento y Selección</h1>
        <div>
          <button className="btn-red" onClick={() => setModalProc(true)}>
            + Nuevo Proceso
          </button>{' '}
          <button className="btn-red" onClick={() => setModalPost(true)}>
            + Nuevo Postulante
          </button>
        </div>
      </div>

      {/* Tabla procesos */}
      <table className="rec-table">
        <thead>
          <tr>
            <th></th><th>Código</th><th>Puesto</th><th>Área</th>
            <th>Estado</th><th>Inicio</th><th>Fin</th><th>Acción</th>
          </tr>
        </thead>
        <tbody>
          {procesos.map(p => (
            <React.Fragment key={p.id}>
              <tr>
                <td className="rec-arrow" onClick={() => toggle(p.id)}>
                  {expandidos[p.id] ? '▼' : '▶'}
                </td>
                <td>{p.codigo}</td>
                <td>{p.puesto}</td>
                <td>{p.area}</td>
                <td>{p.estado}</td>
                <td>{new Date(p.fecha_inicio).toLocaleDateString()}</td>
                <td>{p.fecha_fin ? new Date(p.fecha_fin).toLocaleDateString() : '-'}</td>
                <td>
                  <button
                    className="btn-outline-red"
                    onClick={() => eliminarProc(p.id)}
                  >Eliminar</button>
                </td>
              </tr>

              {expandidos[p.id] && (
                <tr className="rec-detail-row">
                  <td colSpan="8">
                    <div className="rec-detail">
                      {/* Timeline */}
                      <div className="timeline">
                        {etapasDef.map((et, i) => (
                          <div
                            key={i}
                            className={`step ${i < p.etapa_actual ? 'done' : ''}`}
                          >
                            <div className="circle">{i+1}</div>
                            <div className="label">{et}</div>
                          </div>
                        ))}
                      </div>

                      {/* Info extra */}
                      <div className="detail-info">
                        <p><b>Tipo:</b> {p.tipo_busqueda}</p>
                        <p><b>Responsable:</b> {p.responsable}</p>
                      </div>

                      {/* Postulantes */}
                      <PostulantesList
                        procesoId={p.id}
                        onReload={() => setReloadFlag(f => f + 1)}
                        verPostulante={verPostulante}
                      />
                    </div>
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>

      {/* Modal: Nuevo Proceso */}
      <ModalGenerico abierto={modalProc} onClose={()=>setModalProc(false)} titulo="Nuevo Proceso">
        <label>Código</label>
        <input
          value={nuevoProc.codigo}
          onChange={e=>setNuevoProc(np=>({...np,codigo:e.target.value}))}
        />
        <label>Puesto</label>
        <input
          value={nuevoProc.puesto}
          onChange={e=>setNuevoProc(np=>({...np,puesto:e.target.value}))}
        />
        <label>Área</label>
        <input
          value={nuevoProc.area}
          onChange={e=>setNuevoProc(np=>({...np,area:e.target.value}))}
        />
        <label>Tipo de búsqueda</label>
        <select
          value={nuevoProc.tipo_busqueda}
          onChange={e=>setNuevoProc(np=>({...np,tipo_busqueda:e.target.value}))}
        >
          <option>Interna</option><option>Externa</option>
        </select>
        <div className="modal-footer">
          <button className="btn-outline-red" onClick={()=>setModalProc(false)}>Cancelar</button>{' '}
          <button className="btn-primary" onClick={guardarProc}>Guardar</button>
        </div>
      </ModalGenerico>

      {/* Modal: Agregar Postulante */}
      <ModalGenerico abierto={modalPost} onClose={()=>setModalPost(false)} titulo="Agregar Postulante">
        <label>Proceso</label>
        <select
          value={nuevoPost.proceso_id}
          onChange={e=>setNuevoPost(np=>({...np,proceso_id:e.target.value}))}
        >
          <option value="">Seleccionar</option>
          {procesos.filter(p=>p.estado==='En curso').map(p=>(
            <option key={p.id} value={p.id}>
              {p.codigo} – {p.puesto}
            </option>
          ))}
        </select>
        <label>Nombre</label>
        <input
          value={nuevoPost.nombre}
          onChange={e=>setNuevoPost(np=>({...np,nombre:e.target.value}))}
        />
        <label>Email</label>
        <input
          value={nuevoPost.email}
          onChange={e=>setNuevoPost(np=>({...np,email:e.target.value}))}
        />
        <label>Teléfono</label>
        <input
          value={nuevoPost.telefono}
          onChange={e=>setNuevoPost(np=>({...np,telefono:e.target.value}))}
        />
        <label>Cargar CV (.pdf)</label>
        <input
          type="file" accept=".pdf"
          onChange={e=>setNuevoPost(np=>({...np,cv_file:e.target.files[0]}))}
        />
        <label>Notas</label>
        <textarea
          value={nuevoPost.notas}
          onChange={e=>setNuevoPost(np=>({...np,notas:e.target.value}))}
        />
        <div className="modal-footer">
          <button className="btn-outline-red" onClick={()=>setModalPost(false)}>Cancelar</button>{' '}
          <button className="btn-primary" onClick={guardarPost}>Guardar</button>
        </div>
      </ModalGenerico>

      {/* Modal: Detalle Postulante */}
      <ModalGenerico abierto={modalVer} onClose={()=>setModalVer(false)} titulo="Detalle Postulante">
        {detallePost ? (
          <>
            <p><b>Nombre:</b> {detallePost.nombre}</p>
            <p><b>Email:</b> {detallePost.email}</p>
            <p><b>Teléfono:</b> {detallePost.telefono||'—'}</p>
            <p><b>Notas:</b> {detallePost.notas||'—'}</p>
            {detallePost.cv_filename && (
              <a
                href={`http://localhost:3001/api/reclutamiento/${detallePost.proceso_id}/postulantes/${detallePost.id}/cv/download`}
                target="_blank" rel="noreferrer"
              >Descargar CV</a>
            )}
          </>
        ) : <p>Cargando…</p>}
      </ModalGenerico>
    </div>
  );
}

// — Componente PostulantesList —
function PostulantesList({ procesoId, verPostulante, onReload }) {
  const toast = useToast();
  const [lista, setLista] = useState([]);

  useEffect(() => {
    let mounted = true;
    API.get(`/reclutamiento/${procesoId}/postulantes`)
      .then(r => mounted && setLista(r.data))
      .catch(() => toast.error('Error al cargar postulantes'));
    return () => { mounted = false; };
  }, [procesoId, onReload, toast]);

  const avanzar = async uid => {
    try {
      // 1) avanzamos postulante
      await API.post(`/reclutamiento/${procesoId}/postulantes/${uid}/avanzar`);
      // 2) avanzamos proceso
      await API.post(`/reclutamiento/${procesoId}/avanzar`);
      toast.success('Candidato y proceso avanzados');
      // 3) refrescamos todo
      onReload();
    } catch {
      toast.error('No se pudo avanzar');
    }
  };

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
            <td>{etapasDef[u.etapa_actual-1]}</td>
            <td>
              <button
                className="btn-outline-red"
                onClick={()=>avanzar(u.id)}
                disabled={u.etapa_actual>=etapasDef.length}
              >Avanzar</button>
            </td>
            <td>
              <button
                className="btn-outline-red"
                onClick={()=>verPostulante(procesoId,u.id)}
              >Ver</button>
            </td>
          </tr>
        ))}
        {!lista.length && (
          <tr><td colSpan="5" className="no-data">No hay postulantes</td></tr>
        )}
      </tbody>
    </table>
  );
}
