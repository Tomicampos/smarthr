// frontend/src/pages/MisDocumentos.jsx
import React, { useState, useEffect, useRef } from 'react';
import API from '../api';
import { useToast } from '../components/ToastContext';
import { FiDownload, FiTrash2, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import './MisDocumentos.css';

const PAGE_SIZE = 5;

export default function MisDocumentos() {
  const toast = useToast();
  const [docs, setDocs] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const fileInputRef = useRef(null);
  const [selectedFileName, setSelectedFileName] = useState('');

  function getUserId() {
    const token = localStorage.getItem('token');
    if (!token) return null;
    try {
      const b = token.split('.')[1];
      const payload = JSON.parse(atob(b.replace(/-/g, '+').replace(/_/g, '/')));
      return payload.id;
    } catch {
      return null;
    }
  }
  const userId = getUserId();

  const fetchPersonales = async () => {
    const { data } = await API.get(`/empleados/${userId}/documentos`);
    return data.map(d => ({
      id: `P-${d.id}`,
      rawId: d.id,
      origen: 'personal',
      tipo: 'Documento',
      file_name: d.file_name,
      fecha_subida: d.fecha_subida || null,
      period_month: null,
      period_year: null
    }));
  };

  const fetchRecibos = async () => {
    const { data } = await API.get('/docs');
    return data.map(r => ({
      id: `R-${r.id}`,
      rawId: r.id,
      origen: 'recibo',
      tipo: 'Recibo de sueldo',
      file_name: r.file_name,
      fecha_subida: null,
      period_month: r.period_month,
      period_year: r.period_year
    }));
  };

  const fetchDocs = async () => {
    try {
      const [pers, recs] = await Promise.all([fetchPersonales(), fetchRecibos()]);
      const byRecibo = (a, b) => {
        const ay = a.period_year || 0;
        const by = b.period_year || 0;
        if (by !== ay) return by - ay;
        const am = a.period_month || 0;
        const bm = b.period_month || 0;
        return bm - am;
      };
      const byFecha = (a, b) => {
        const ta = a.fecha_subida ? new Date(a.fecha_subida).getTime() : 0;
        const tb = b.fecha_subida ? new Date(b.fecha_subida).getTime() : 0;
        return tb - ta;
      };
      const mixed = [...recs.sort(byRecibo), ...pers.sort(byFecha)];
      setDocs(mixed);
      setCurrentPage(1);
    } catch {
      toast.error('No se pudieron cargar tus documentos.');
    }
  };

  useEffect(() => {
    fetchDocs();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleUpload = async (e) => {
    e.preventDefault();
    const file = fileInputRef.current ? fileInputRef.current.files[0] : null;
    if (!file) {
      toast.error('Seleccioná un archivo antes de subir.');
      return;
    }
    const fd = new FormData();
    fd.append('file', file);
    try {
      await API.post(`/empleados/${userId}/documentos`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Documento subido correctamente.');
      setSelectedFileName('');
      if (e.target && typeof e.target.reset === 'function') e.target.reset();
      fetchDocs();
    } catch {
      toast.error('Error al subir el documento.');
    }
  };

  const downloadDoc = async (item) => {
    try {
      if (item.origen === 'recibo') {
        const res = await API.get(`/docs/${item.rawId}/download`, { responseType: 'blob' });
        const cd = res.headers['content-disposition'] || '';
        const fn = (cd.match(/filename="?(.+)"?/) || [])[1] || `recibo_${item.rawId}.pdf`;
        const url = URL.createObjectURL(new Blob([res.data]));
        const a = document.createElement('a');
        a.href = url;
        a.download = fn;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      } else {
        const res = await API.get(`/empleados/${userId}/documentos/${item.rawId}/download`, { responseType: 'blob' });
        const cd = res.headers['content-disposition'] || '';
        const fn = (cd.match(/filename="?(.+)"?/) || [])[1] || `doc_${item.rawId}`;
        const url = URL.createObjectURL(new Blob([res.data]));
        const a = document.createElement('a');
        a.href = url;
        a.download = fn;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      }
    } catch {
      toast.error('No se pudo descargar.');
    }
  };

  const deleteDoc = async (item) => {
    if (!window.confirm('¿Eliminar este documento?')) return;
    try {
      if (item.origen === 'recibo') {
        await API.delete(`/docs/${item.rawId}`);
      } else {
        await API.delete(`/empleados/${userId}/documentos/${item.rawId}`);
      }
      toast.success('Documento eliminado.');
      fetchDocs();
    } catch {
      toast.error('Error al eliminar.');
    }
  };

  const totalPages = Math.ceil(docs.length / PAGE_SIZE);
  const start = (currentPage - 1) * PAGE_SIZE;
  const paged = docs.slice(start, start + PAGE_SIZE);

  const fmtPeriodo = (m, y) => {
    if (!m || !y) return '-';
    const mm = String(m).padStart(2, '0');
    return `${mm}/${y}`;
  };

  return (
    <div className="doc-container">
      <div className="card">
        <h2 className="card-title">Mis Documentos</h2>

        <div className="rec-controls">
          <div style={{ flex: '1 1 200px', maxWidth: 240 }}></div>
          <div className="select-wrapper" style={{ display: 'none' }}></div>
          <form className="rec-actions" onSubmit={handleUpload}>
            <input
              type="file"
              accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
              ref={fileInputRef}
              hidden
              onChange={(e) => setSelectedFileName(e.target.files && e.target.files[0] ? e.target.files[0].name : '')}
            />
            {selectedFileName ? (
              <span style={{ fontSize: '0.9rem', color: '#374151' }}>{selectedFileName}</span>
            ) : null}
            <label className="doc-btn-file" onClick={() => fileInputRef.current && fileInputRef.current.click()}>
              Seleccionar archivo
            </label>
            <button type="submit" className="btn-red">Subir Documento</button>
          </form>
        </div>

        <div className="doc-table-wrapper">
          <table className="doc-table">
            <thead>
              <tr>
                <th>Tipo</th>
                <th>Nombre</th>
                <th>Período / Fecha</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {paged.map(item => (
                <tr key={item.id}>
                  <td>{item.tipo}</td>
                  <td>{item.file_name}</td>
                  <td>
                    {item.origen === 'recibo'
                      ? fmtPeriodo(item.period_month, item.period_year)
                      : (item.fecha_subida
                          ? new Date(item.fecha_subida).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
                          : '-')}
                  </td>
                  <td className="doc-col-actions">
                    <button title="Descargar" onClick={() => downloadDoc(item)}>
                      <FiDownload />
                    </button>
                    <button title="Eliminar" onClick={() => deleteDoc(item)}>
                      <FiTrash2 />
                    </button>
                  </td>
                </tr>
              ))}
              {paged.length === 0 ? (
                <tr>
                  <td colSpan="4" className="no-data">No hay documentos.</td>
                </tr>
              ) : null}
              {Array.from({ length: Math.max(0, PAGE_SIZE - paged.length) }).map((_, i) => (
                <tr key={`empty-${i}`} className="empty-row">
                  <td colSpan={4}>&nbsp;</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 ? (
          <div className="pagination">
            <button onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1}>
              <FiChevronLeft /> Anterior
            </button>
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={`p-${i + 1}`}
                className={currentPage === i + 1 ? 'active' : ''}
                onClick={() => setCurrentPage(i + 1)}
              >
                {i + 1}
              </button>
            ))}
            <button onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages}>
              Siguiente <FiChevronRight />
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
