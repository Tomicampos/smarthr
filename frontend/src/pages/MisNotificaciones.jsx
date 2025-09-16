// src/pages/MisNotificaciones.jsx
import React, { useEffect, useState } from 'react';
import API from '../api';
import { useToast } from '../components/ToastContext';
import ModalGenerico from '../components/ModalGenerico';
import { FiEye, FiDownload } from 'react-icons/fi';
import '../pages/Notificaciones.css';

export default function MisNotificaciones() {
  const toast = useToast();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [detalle, setDetalle] = useState(null);
  const [docId, setDocId] = useState(null);

  useEffect(() => {
    API.get('/mis-notificaciones')
      .then(({ data }) => setList(data))
      .catch(() => toast.error('No se pudieron cargar tus notificaciones.'))
      .finally(() => setLoading(false));
  }, [toast]);

  const marcarAbiertaLocal = (id) => {
    setList(prev =>
      prev.map(n =>
        n.id === id
          ? { ...n, abierta: true, leido_en: n.leido_en || new Date().toISOString(), estado: 'abierta' }
          : n
      )
    );
  };

  const resolveReciboDocId = async (notif) => {
    setDocId(null);
    if (notif.doc_id) {
      setDocId(Number(notif.doc_id));
      return;
    }
    const m = (notif.cuerpo || '').match(/(\d{1,2})\/(\d{4})/);
    if (!m) return;
    const mes = Number(m[1]);
    const anio = Number(m[2]);
    try {
      const { data } = await API.get('/docs');
      const rec = data.find(r => Number(r.period_month) === mes && Number(r.period_year) === anio);
      if (rec) setDocId(Number(rec.id));
    } catch {}
  };

  const verDetalle = async (notif) => {
    setDetalle(notif);
    setModalOpen(true);
    try { await API.post(`/mis-notificaciones/${notif.id}/abrir`); } catch {}
    marcarAbiertaLocal(notif.id);
    if ((notif.asunto || '').toLowerCase().includes('recibo')) {
      resolveReciboDocId(notif);
    } else {
      setDocId(null);
    }
  };

  const descargarRecibo = async (id) => {
    try {
      const res = await API.get(`/docs/${id}/download`, { responseType: 'blob' });
      const cd = res.headers['content-disposition'] || '';
      const fn = (cd.match(/filename="?(.+)"?/) || [])[1] || `recibo_${id}.pdf`;
      const url = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url; a.download = fn; document.body.appendChild(a);
      a.click(); a.remove(); URL.revokeObjectURL(url);
    } catch {
      toast.error('No se pudo descargar el recibo.');
    }
  };

  const estadoUI = (n) => {
    if (n.leido_en || n.abierta || n.vista_en) return 'Abierta';
    if (n.estado && n.estado.toLowerCase() !== 'pendiente') return 'Abierta';
    return 'Sin abrir';
  };

  return (
    <div className="notif-card">
      <h2 className="card-title">Mis Notificaciones</h2>

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
                  <td>{estadoUI(n)}</td>
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
                     title="Ver detalle"
                     onClick={() => verDetalle(n)}
                     style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                   >
                     <FiEye />
                   </button>
                 </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      <ModalGenerico
        abierto={modalOpen}
        onClose={() => setModalOpen(false)}
        titulo="Detalle de Notificación"
      >
        {detalle && (
          <div className="modal-body">
            <p><b>Asunto:</b> {detalle.asunto}</p>
            <p><b>Mensaje:</b> {detalle.cuerpo}</p>
            <p>
              <b>Fecha:</b>{' '}
              {new Date(detalle.creado_en).toLocaleString('es-AR', {
                day:'2-digit',month:'2-digit',year:'numeric',
                hour:'2-digit',minute:'2-digit'
              })}
            </p>

            {docId && (
              <div style={{ marginTop: 12, textAlign: 'right' }}>
                <button
                  className="btn-red"
                  onClick={() => descargarRecibo(docId)}
                  title="Descargar recibo"
                >
                  <FiDownload style={{ marginRight: 6 }} />
                  Descargar recibo
                </button>
              </div>
            )}
          </div>
        )}
      </ModalGenerico>
    </div>
  );
}
