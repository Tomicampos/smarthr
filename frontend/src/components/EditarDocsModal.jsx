import React, { useState, useEffect, useRef } from 'react';
import API from '../api';
import ModalGenerico from './ModalGenerico';
import { FiDownload, FiTrash2, FiEye } from 'react-icons/fi';
import { useToast } from './ToastContext';
import './EditarDocsModal.css';

export default function EditarDocsModal({ empleado, onClose }) {
  const toast = useToast();
  const [docs, setDocs] = useState([]);
  const [cargandoDocs, setCargandoDocs] = useState(true);
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef();
  const [subiendo, setSubiendo] = useState(false);

  useEffect(() => {
    fetchDocumentos();
  }, []);

  async function fetchDocumentos() {
    try {
      setCargandoDocs(true);
      const { data } = await API.get(`/empleados/${empleado.id}/documentos`);
      setDocs(data);
    } catch {
      toast.error('No se pudieron cargar los documentos.');
      setDocs([]);
    } finally {
      setCargandoDocs(false);
    }
  }

  const handleFileSelect = e => {
    setSelectedFile(e.target.files[0] || null);
  };

  async function handleUpload(e) {
    e.preventDefault();
    if (!selectedFile) return;
    setSubiendo(true);
    const form = new FormData();
    form.append('file', selectedFile);
    try {
      await API.post(
        `/empleados/${empleado.id}/documentos`,
        form,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      toast.success('Documento cargado exitosamente.');
      setSelectedFile(null);
      fetchDocumentos();
    } catch {
      toast.error('No se pudo subir el documento.');
    } finally {
      setTimeout(() => setSubiendo(false), 300);
    }
  }

  const descargarDocumento = async id => {
    try {
      const res = await API.get(
        `/empleados/${empleado.id}/documentos/${id}/download`,
        { responseType: 'blob' }
      );
      const cd = res.headers['content-disposition'] || '';
      const fn = (cd.match(/filename="?(.+)"?/) || [])[1] || `documento_${id}`;
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fn;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('No se pudo descargar el documento.');
    }
  };

  // Abrir PDF en una nueva pestaña
const visualizarDocumento = async id => {
  try {
    // 1) Bajamos el blob (Axios lleva el token)
    const res = await API.get(
      `/empleados/${empleado.id}/documentos/${id}/download`,
      { responseType: 'blob' }
    );
    // 2) Nombre real con extensión
    const cd = res.headers['content-disposition'] || '';
    const fn = (cd.match(/filename="?(.+)"?/) || [])[1] || `documento_${id}.pdf`;

    // 3) Creamos el PDF-URL
    const pdfBlob = new Blob([res.data], { type: 'application/pdf' });
    const pdfUrl  = URL.createObjectURL(pdfBlob);

    // 4) Construimos el HTML wrapper
    const html = `
      <!DOCTYPE html>
      <html lang="es">
        <head>
          <meta charset="UTF-8"/>
          <title>${fn}</title>
          <style>body,html{margin:0;height:100%}</style>
        </head>
        <body>
          <iframe
            src="${pdfUrl}"
            width="100%"
            height="100%"
            style="border:none"
          ></iframe>
        </body>
      </html>
    `;
    const htmlBlob = new Blob([html], { type: 'text/html' });
    const htmlUrl  = URL.createObjectURL(htmlBlob);

    // 5) Abrimos la pestaña con el título correcto
    window.open(htmlUrl, '_blank', 'noopener,noreferrer');

    // 6) Revocamos URLs tras un delay
    setTimeout(() => {
      URL.revokeObjectURL(pdfUrl);
      URL.revokeObjectURL(htmlUrl);
    }, 2000);

  } catch (err) {
    console.error(err);
    toast.error('No se pudo abrir el PDF en nueva pestaña.');
  }
};


  const eliminarDocumento = async id => {
    if (!window.confirm('¿Eliminar este documento?')) return;
    try {
      await API.delete(`/empleados/${empleado.id}/documentos/${id}`);
      toast.success('Documento eliminado exitosamente.');
      fetchDocumentos();
    } catch {
      toast.error('No se pudo eliminar el documento.');
    }
  };

  return (
    <ModalGenerico
      abierto={true}
      onClose={onClose}
      titulo={`Documentos de ${empleado.nombre}`}
    >
      <form onSubmit={handleUpload} className="upload-form">
        <div className="upload-left">
          <input
            type="file"
            accept=".pdf, .doc, .docx"
            ref={fileInputRef}
            hidden
            onChange={handleFileSelect}
          />
          <label
            className="doc-btn-file"
            onClick={() => fileInputRef.current.click()}
          >
            Seleccionar Archivo
          </label>
          {selectedFile && (
            <span className="doc-file-name">{selectedFile.name}</span>
          )}
        </div>
        <button
          type="submit"
          className="btn-red"
          disabled={!selectedFile || subiendo}
        >
          {subiendo ? 'Subiendo...' : 'Subir Archivo'}
        </button>
      </form>

      <div className="doc-list-wrapper">
        {cargandoDocs ? (
          <p>Cargando documentos…</p>
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
                  <td>{new Date(d.fecha_subida).toLocaleDateString()}</td>
                  <td className="doc-col-actions">
                    <button title="Ver" onClick={() => visualizarDocumento(d.id)}>
                      <FiEye />
                    </button>
                    <button title="Descargar" onClick={() => descargarDocumento(d.id)}>
                      <FiDownload />
                    </button>
                    <button title="Eliminar" onClick={() => eliminarDocumento(d.id)}>
                      <FiTrash2 />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </ModalGenerico>
  );
}