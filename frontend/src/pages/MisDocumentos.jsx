import React, { useState, useEffect, useRef } from 'react';
import API from '../api';
import { useToast } from '../components/ToastContext';
import { FiDownload, FiTrash2, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import './Documentacion.css'; // reutilizamos estilos de Documentación

const PAGE_SIZE = 5;

export default function MisDocumentos() {
  const toast = useToast();
  const [docs, setDocs] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const fileInputRef = useRef();
  const [selectedFileName, setSelectedFileName] = useState('');

  // extraer userId del token
  function getUserId() {
    const token = localStorage.getItem('token');
    if (!token) return null;
    try {
      const b = token.split('.')[1];
      const payload = JSON.parse(atob(b.replace(/-/g,'+').replace(/_/g,'/')));
      return payload.id;
    } catch { return null; }
  }

  const userId = getUserId();

  // carga documentos propios
  const fetchDocs = async () => {
    try {
      const { data } = await API.get(`/empleados/${userId}/documentos`);
      setDocs(data);
      setCurrentPage(1);
    } catch {
      toast.error('No se pudieron cargar tus documentos.');
    }
  };

  useEffect(() => { fetchDocs(); }, []);

  // subir nuevo documento
  const handleUpload = async (e) => {
    e.preventDefault();
    const file = fileInputRef.current.files[0];
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
      e.target.reset();
      fetchDocs();
    } catch {
      toast.error('Error al subir el documento.');
    }
  };

  const downloadDoc = async (docId) => {
    try {
      const res = await API.get(
        `/empleados/${userId}/documentos/${docId}/download`,
        { responseType: 'blob' }
      );
      const cd = res.headers['content-disposition'] || '';
      const fn = (cd.match(/filename="?(.+)"?/) || [])[1] || `doc_${docId}`;
      const url = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url; a.download = fn; document.body.appendChild(a);
      a.click(); a.remove(); URL.revokeObjectURL(url);
    } catch {
      toast.error('No se pudo descargar.');
    }
  };

  const deleteDoc = async (docId) => {
    if (!window.confirm('¿Eliminar este documento?')) return;
    try {
      await API.delete(`/empleados/${userId}/documentos/${docId}`);
      toast.success('Documento eliminado.');
      fetchDocs();
    } catch {
      toast.error('Error al eliminar.');
    }
  };

  // paginación
  const totalPages = Math.ceil(docs.length / PAGE_SIZE);
  const start = (currentPage - 1) * PAGE_SIZE;
  const paged = docs.slice(start, start + PAGE_SIZE);

  return (
    <div className="doc-container">
      <div className="card recibos-card">
        <h2 className="card-title">Mis Documentos</h2>

        <form className="doc-upload-form" onSubmit={handleUpload}>
          <div className="doc-upload-left">
            <input
              type="file"
              accept=".pdf,.doc,.docx"
              ref={fileInputRef}
              hidden
              onChange={e => setSelectedFileName(e.target.files[0]?.name || '')}
            />
            <label
              className="doc-btn-file"
              onClick={() => fileInputRef.current.click()}
            >
              Seleccionar archivo
            </label>
            {selectedFileName && (
              <span className="doc-file-name">{selectedFileName}</span>
            )}
          </div>
          <button type="submit" className="btn-red">
            Subir Documento
          </button>
        </form>

        <div className="doc-table-wrapper">
          <table className="doc-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Fecha de Subida</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {paged.map(d => (
                <tr key={d.id}>
                  <td>{d.file_name}</td>
                  <td>
                    {new Date(d.fecha_subida).toLocaleDateString('es-AR', {
                      day: '2-digit', month: '2-digit', year: 'numeric'
                    })}
                  </td>
                  <td className="doc-col-actions">
                    <button title="Descargar" onClick={() => downloadDoc(d.id)}>
                      <FiDownload />
                    </button>
                    <button title="Eliminar" onClick={() => deleteDoc(d.id)}>
                      <FiTrash2 />
                    </button>
                  </td>
                </tr>
              ))}
              {paged.length === 0 && (
                <tr>
                  <td colSpan="3" className="no-data">No hay documentos.</td>
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
              onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              Siguiente <FiChevronRight />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
