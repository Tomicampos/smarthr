import React, { useState, useEffect } from 'react';
import API from '../api';
import { useToast } from './ToastContext';
import {
  FiChevronLeft,
  FiChevronRight,
  FiEye,
  FiTrash2
} from 'react-icons/fi';
import '../pages/Notificaciones.css';
import ModalGenerico from './ModalGenerico';

const PAGE_SIZE = 5;

export default function NotificationList() {
  const toast = useToast();
  const [list, setList]         = useState([]);
  const [pagina, setPagina]     = useState(1);
  const [modalVer, setModalVer] = useState(false);
  const [detalle, setDetalle]   = useState(null);

  useEffect(() => cargar(), []);
  const cargar = () => {
    API.get('/notificaciones')
      .then(r => {
        setList(r.data);
        setPagina(1);
      })
      .catch(() => toast.error('No se pudieron cargar notificaciones'));
  };

  const ver = async id => {
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

  const eliminar = async id => {
    if (!window.confirm('¿Eliminar esta notificación?')) return;
    try {
      await API.delete(`/notificaciones/${id}`);
      toast.success('Notificación eliminada');
      cargar();
    } catch {
      toast.error('No se pudo eliminar');
    }
  };

  const totalPaginas = Math.ceil(list.length / PAGE_SIZE);
  const start        = (pagina - 1) * PAGE_SIZE;
  const paged        = list.slice(start, start + PAGE_SIZE);

  return (
    <>
      <div className="notif-table-wrapper">
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
                <td className="notif-col-actions">
                  <button title="Ver" onClick={() => ver(n.id)}>
                    <FiEye />
                  </button>
                  <button title="Eliminar" onClick={() => eliminar(n.id)}>
                    <FiTrash2 />
                  </button>
                </td>
              </tr>
            ))}
            {paged.length === 0 && (
              <tr>
                <td colSpan="5" className="empty-row">No hay notificaciones.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPaginas > 1 && (
        <div className="notif-pagination">
          <button disabled={pagina===1} onClick={()=>setPagina(p=>p-1)}><FiChevronLeft/> Anterior</button>
          {[...Array(totalPaginas)].map((_,i)=>(
            <button
              key={i+1}
              className={pagina===i+1?'active':''}
              onClick={()=>setPagina(i+1)}
            >{i+1}</button>
          ))}
          <button disabled={pagina===totalPaginas} onClick={()=>setPagina(p=>p+1)}>Siguiente <FiChevronRight/></button>
        </div>
      )}

      {modalVer && (
        <ModalGenerico abierto={modalVer} onClose={()=>setModalVer(false)} titulo="Detalle de Notificación">
          {detalle ? (
            <div className="modal-body">
              <p><b>Asunto:</b> {detalle.info.asunto}</p>
              <p style={{ display:'flex', alignItems:'flex-start' }}>
                <b style={{ width: '80px' }}>Mensaje:</b>
                <span>{detalle.info.cuerpo}</span>
              </p>
              <p><b>Fecha:</b> {new Date(detalle.info.creado_en).toLocaleString()}</p>
              <p>
                <b>Enviada a:</b>{' '}
                {detalle.destinatarios.length === detalle.info.total_destinatarios
                  ? 'Todos'
                  : detalle.destinatarios.map((u,i)=>(
                      <span key={u.id}>
                        {u.nombre}{i<detalle.destinatarios.length-1?', ':''}
                      </span>
                    ))
                }
              </p>
            </div>
          ) : (
            <div className="modal-body"><p>Cargando detalles…</p></div>
          )}
        </ModalGenerico>
      )}
    </>
  );
}
