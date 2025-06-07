// src/components/EditarDocsModal.jsx
import React, { useState, useEffect } from 'react';
import API from '../api';
import ModalGenérico from './ModalGenerico';     // ← ahora usamos el modal común
import './EditarDocsModal.css'; // Solo estilos internos de la tabla, botones, etc.

/**
 * Props:
 *  - empleado: { id, nombre, email }
 *  - onClose: función para cerrar el modal
 *  - mostrarNotificacion: (tipo, texto) => void
 */
export default function EditarDocsModal({ empleado, onClose, mostrarNotificacion }) {
  const [docs, setDocs] = useState([]);
  const [cargandoDocs, setCargandoDocs] = useState(true);
  const [file, setFile] = useState(null);
  const [subiendo, setSubiendo] = useState(false);

  useEffect(() => {
    fetchDocumentos();
  }, []);

  async function fetchDocumentos() {
    try {
      setCargandoDocs(true);
      const { data } = await API.get(`/empleados/${empleado.id}/documentos`);
      setDocs(data);
    } catch (err) {
      console.error('Error al cargar docs del empleado:', err);
      setDocs([]);
      mostrarNotificacion('error', 'No se pudieron cargar los documentos.');
    } finally {
      setCargandoDocs(false);
    }
  }

  async function handleUpload(e) {
    e.preventDefault();
    if (!file) return;
    setSubiendo(true);
    const form = new FormData();
    form.append('file', file);
    try {
      await API.post(`/empleados/${empleado.id}/documentos`, form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      mostrarNotificacion('success', 'Documento cargado exitosamente.');
      setFile(null);
      fetchDocumentos();
    } catch (err) {
      console.error('Error subiendo documento:', err);
      mostrarNotificacion('error', 'No se pudo subir el documento.');
    } finally {
      setTimeout(() => setSubiendo(false), 500);
    }
  }

  const descargarDocumento = async docId => {
    try {
      const res = await API.get(
        `/empleados/${empleado.id}/documentos/${docId}/download`,
        { responseType: 'blob' }
      );
      const disposition = res.headers['content-disposition'] || '';
      const match = disposition.match(/filename="?(.+)"?/);
      const filename = match ? match[1] : `documento_${docId}`;
      const url = window.URL.createObjectURL(res.data);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error descargando documento:', err);
      mostrarNotificacion('error', 'No se pudo descargar el documento.');
    }
  };

  const eliminarDocumento = async docId => {
    if (!window.confirm('¿Seguro que quieres eliminar este documento?')) return;
    try {
      await API.delete(`/empleados/${empleado.id}/documentos/${docId}`);
      mostrarNotificacion('success', 'Documento eliminado exitosamente.');
      fetchDocumentos();
    } catch (err) {
      console.error('Error eliminando documento:', err);
      mostrarNotificacion('error', 'No se pudo eliminar el documento.');
    }
  };

  return (
    <ModalGenérico abierto={true} onClose={onClose} título={`Documentos de ${empleado.nombre}`}>
      {/* ─── Subir nuevo documento ────────────────────────────────── */}
      <form onSubmit={handleUpload} className="upload-form">
        <input
          type="file"
          accept="application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          onChange={e => setFile(e.target.files[0])}
        />
        <button
          type="submit"
          className="btn-red"
          disabled={subiendo || !file}
        >
          {subiendo ? 'Subiendo...' : 'Subir Archivo'}
        </button>
      </form>

      {/* ─── Lista de documentos existentes ──────────────────────── */}
      <div className="doc-list-wrapper">
        {cargandoDocs ? (
          <p>Cargando documentos...</p>
        ) : docs.length === 0 ? (
          <p className="no-data">No hay documentos.</p>
        ) : (
          <table className="doc-list-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Fecha de Subida</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {docs.map(d => (
                <tr key={d.id}>
                  <td>{d.file_name}</td>
                  <td>{d.fecha_subida}</td>
                  <td>
                    <button
                      className="btn-outline-red"
                      onClick={() => descargarDocumento(d.id)}
                    >
                      Descargar
                    </button>
                    {' '}
                    <button
                      className="btn-outline-red"
                      onClick={() => eliminarDocumento(d.id)}
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </ModalGenérico>
  );
}
