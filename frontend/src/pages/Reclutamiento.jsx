// src/pages/Reclutamiento.jsx

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import API from '../api';
import ModalGenerico from '../components/ModalGenerico';
import { useToast } from '../components/ToastContext'; import {   FiChevronLeft,   FiChevronRight,   FiChevronDown,   FiEye,   FiTrash2 } from 'react-icons/fi';
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
  const mounted = useRef(false);
  const hashHandled = useRef(false);

  const [procesos, setProcesos] = useState([]);
  const [expandidos, setExpandidos] = useState({});
  const [currentPage, setCurrentPage] = useState(1);

  const [modalProc, setModalProc] = useState(false);
  const [modalPost, setModalPost] = useState(false);
  const [modalVer, setModalVer] = useState(false);
  const [detallePost, setDetallePost] = useState(null);
  const [areas, setAreas] = useState([]);


  const [nuevoProc, setNuevoProc] = useState({
  codigo: '',
  puesto: '',
  area_id: '',
  tipo_busqueda: 'Interna',
  estado: 'En curso'
});
  const [nuevoPost, setNuevoPost] = useState({
    proceso_id: '', nombre: '', email: '',
    telefono: '', cv_file: null, notas: ''
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

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

  const procesosFiltrados = procesos.filter(p => {
    if (statusFilter && p.estado !== statusFilter) return false;
    const term = searchTerm.toLowerCase();
    return (
      p.codigo.toLowerCase().includes(term) ||
      p.puesto.toLowerCase().includes(term) ||
      p.area.toLowerCase().includes(term)
    );
  });

  useEffect(() => {
    if (!hash || hashHandled.current || procesos.length === 0) return;
    hashHandled.current = true;

    const id = parseInt(hash.slice(1), 10);
    if (isNaN(id)) return;

    const idx = procesosFiltrados.findIndex(p => p.id === id);
    if (idx < 0) return;

    const page = Math.floor(idx / PAGE_SIZE) + 1;
    setCurrentPage(page);

    setTimeout(() => {
      setExpandidos(e => ({ ...e, [id]: true }));
      document.getElementById(`proc-${id}`)?.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
      window.history.replaceState(null, '', window.location.pathname);
    }, 50);
  }, [hash, procesos, procesosFiltrados]);

   const guardarProc = async () => {
  if (!nuevoProc.area_id) {
    toast.error('Debes seleccionar un área.');
    return;
  }
  try {
    await API.post('/reclutamiento', {
      codigo: nuevoProc.codigo,
      puesto: nuevoProc.puesto,
      area_id: nuevoProc.area_id,
      tipo_busqueda: nuevoProc.tipo_busqueda
    });
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
  
  useEffect(() => {
  cargar();
  API.get('/areas')
    .then(r => setAreas(r.data))
    .catch(() => toast.error('No se pudieron cargar las áreas'));
},

   [cargar, toast]);
  const guardarPost = async () => {
    if (!nuevoPost.proceso_id) {
      toast.error('Debe seleccionar un proceso');
      return;
    }
    try {
      const fd = new FormData();
      fd.append('nombre', nuevoPost.nombre);
      fd.append('email', nuevoPost.email);
      fd.append('telefono', nuevoPost.telefono);
      fd.append('notas', nuevoPost.notas);
      if (nuevoPost.cv_file) fd.append('cv', nuevoPost.cv_file);

      await API.post(
        `/reclutamiento/${nuevoPost.proceso_id}/postulantes`,
        fd,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      toast.success('Postulante agregado');
      setModalPost(false);
      setNuevoPost({ proceso_id: '', nombre: '', email: '', telefono: '', notas: '', cv_file: null });
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
  const avanzarPost = async (pid, uid) => {
  try {
    // 1) Avanza el postulante
    await API.post(`/reclutamiento/${pid}/postulantes/${uid}/avanzar`);
    // 2) Avanza el proceso
    await API.post(`/reclutamiento/${pid}/avanzar`);
    toast.success('Candidato y proceso avanzados');
    // 3) Recarga la lista de procesos para obtener el nuevo etapa_actual
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
    cargar();  // recarga procesos y postulantes
  } catch {
    toast.error('No se pudo eliminar postulante');
  }
};

  const toggle = id => setExpandidos(e => ({ ...e, [id]: !e[id] }));

  const totalPages = Math.ceil(procesosFiltrados.length / PAGE_SIZE);
  const start = (currentPage - 1) * PAGE_SIZE;
  const paged = procesosFiltrados.slice(start, start + PAGE_SIZE);

  return (
    <div className="rec-card">
      <h3 className="rec-title">Reclutamiento y Selección</h3>

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
          <button className="btn-red" onClick={() => setModalProc(true)}>+ Nuevo Proceso</button>
          <button className="btn-red" onClick={() => setModalPost(true)}>+ Nuevo Postulante</button>
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
                          {etapasDef.map((et,i)=>( 
                            <div key={i} className={`step ${i < p.etapa_actual ? 'done':''}`}>
                              <div className="circle">{i+1}</div>
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

      {totalPages > 1 && (
        <div className="pagination">
          <button onClick={()=>setCurrentPage(p=>Math.max(p-1,1))} disabled={currentPage===1}>
            <FiChevronLeft/> Anterior
          </button>
          {[...Array(totalPages)].map((_,i)=>(
            <button key={i+1}
              className={currentPage===i+1?'active':''}
              onClick={()=>setCurrentPage(i+1)}
            >{i+1}</button>
          ))}
          <button onClick={()=>setCurrentPage(p=>Math.min(p+1,totalPages))} disabled={currentPage===totalPages}>
            Siguiente <FiChevronRight/>
          </button>
        </div>
      )}

      
      <ModalGenerico abierto={modalProc} onClose={()=>setModalProc(false)} titulo="Nuevo Proceso">
       <label>Código</label>
       <input
         placeholder="Ingrese un Código"
         value={nuevoProc.codigo}
         onChange={e=>setNuevoProc(np=>({...np,codigo:e.target.value}))}
       />
     
       <label>Puesto</label>
       <input
         placeholder="Ingrese un Puesto"
         value={nuevoProc.puesto}
         onChange={e=>setNuevoProc(np=>({...np,puesto:e.target.value}))}
       />
     
       <label>Área</label>
        <select
        value={nuevoProc.area_id ?? ''}
        onChange={e => {
          const v = e.target.value;
          setNuevoProc(np => ({
            ...np,
            area_id: v === '' ? null : Number(v)
          }));
        }}
     >
         <option value="">— Selecciona un área —</option>
         {areas.map(a => (
           <option key={a.id} value={a.id}>
             {a.nombre}
           </option>
         ))}
       </select>
     
       <label>Tipo de búsqueda</label>
       <select
          value={nuevoProc.tipo_busqueda}
          onChange={e=>setNuevoProc(np=>({...np,tipo_busqueda:e.target.value}))}
        >
          <option>Interna</option>
          <option>Externa</option>
        </select>
      
        <div className="modal-footer">
          <button className="btn-primary" onClick={guardarProc}>Guardar</button>
        </div>
      </ModalGenerico>

      <ModalGenerico abierto={modalPost} onClose={()=>setModalPost(false)} titulo="Agregar Postulante">
        <div className="modal-body">
          <label>Proceso</label>
          <select value={nuevoPost.proceso_id} onChange={e=>setNuevoPost({...nuevoPost, proceso_id:e.target.value})}>
            <option value="">Selecciona uno</option>
            {procesos.map(p=><option key={p.id} value={p.id}>{p.codigo} — {p.puesto}</option>)}
          </select>
          <label>Nombre</label>
          <input placeholder='Ingrese Nombre y Apellido' value={nuevoPost.nombre} onChange={e=>setNuevoPost({...nuevoPost, nombre:e.target.value})}/>
          <label>Email</label>
          <input placeholder='Ingrese un correo electronico' type="email" value={nuevoPost.email} onChange={e=>setNuevoPost({...nuevoPost, email:e.target.value})}/>
          <label>Teléfono</label>
          <input placeholder='Ingrese un numero de teléfono' value={nuevoPost.telefono} onChange={e=>setNuevoPost({...nuevoPost, telefono:e.target.value})}/>
          {/*<label>Notas</label>*/}
          {/*<label value={nuevoPost.notas} onChange={e=>setNuevoPost({...nuevoPost, notas:e.target.value})}/>*/}
          <label>CV (PDF)</label>
          <input type="file" accept="application/pdf" onChange={e=>setNuevoPost({...nuevoPost, cv_file:e.target.files[0]})}/>
          <div className="modal-footer">
            <button className="btn-red" onClick={guardarPost}>Guardar</button>
          </div>
        </div>
      </ModalGenerico>

      <ModalGenerico abierto={modalVer} onClose={()=>setModalVer(false)} titulo="Detalle Postulante">
        {detallePost ? (
          <div className="modal-body">
            <p><b>Nombre:</b> {detallePost.nombre}</p>
            <p><b>Email:</b> {detallePost.email}</p>
            <p><b>Teléfono:</b> {detallePost.telefono}</p>
            {detallePost.notas && <>
              <b>Notas:</b><p className="detalle-notas">{detallePost.notas}</p>
            </>}
            {detallePost.cv_url && (
              <p><b>CV:</b> <a href={detallePost.cv_url} target="_blank" rel="noopener noreferrer">Descargar</a></p>
            )}
          </div>
        ) : (
          <div className="modal-body"><p>Cargando detalles…</p></div>
        )}
      </ModalGenerico>
    </div>
  );
}

function PostulantesList({ procesoId, onAvanzar, onVer, onEliminar }) {
  const toast = useToast();
  const [lista, setLista] = useState([]);

  useEffect(() => {
    let m = true;
    API.get(`/reclutamiento/${procesoId}/postulantes`)
      .then(r => m && setLista(r.data))
      .catch(() => toast.error('Error al cargar postulantes'));
    return () => { m = false };
  }, [procesoId, toast]);

  return (
    <table className="post-table">
      <thead>
        <tr>
          <th>Nombre</th>
          <th>Email</th>
          <th>Etapa</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        {lista.map(u => (
          <tr key={u.id}>
            <td>{u.nombre}</td>
            <td>{u.email}</td>
            <td>{etapasDef[u.etapa_actual - 1]}</td>
            <td className="rec-col-actions">
              {/* Avanzar */}
              <button
                title="Avanzar etapa"
                onClick={() => onAvanzar(procesoId, u.id)}
                disabled={u.etapa_actual >= etapasDef.length}
              >
                <FiChevronRight />
              </button>
              {/* Ver detalle */}
              <button
                title="Ver detalle"
                onClick={() => onVer(procesoId, u.id)}
              >
                <FiEye />
              </button>
              {/* Eliminar postulante */}
              <button
                title="Eliminar postulante"
                onClick={() => onEliminar(procesoId, u.id)}
              >
                <FiTrash2 />
              </button>
            </td>
          </tr>
        ))}
        {!lista.length && (
          <tr>
            <td colSpan="4" className="no-data">
              No hay postulantes
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}