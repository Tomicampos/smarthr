// src/pages/Documentacion.jsx
import React, { useState, useEffect, useRef } from 'react';
import API from '../api';
import { useToast } from '../components/ToastContext';
import EditarDocsModal from '../components/EditarDocsModal';
import {
  FiChevronLeft,
  FiChevronRight,
  FiDownload,
  FiTrash2,
  FiEye,
  FiEdit2
} from 'react-icons/fi';
import './Documentacion.css';

const RECIBOS_PAGE_SIZE = 2;
const EMP_PAGE_SIZE    = 5;

export default function Documentacion() {
  const toast = useToast();
  const [list, setList]           = useState([]);
  const [empleados, setEmpleados] = useState([]);
  const [cargando, setCargando]   = useState(false);
  const [modalState, setModalState] = useState({ abierto: false, empleado: null });

  // Nombre del archivo seleccionado
  const [selectedFileName, setSelectedFileName] = useState('');

  // Paginación recibos
  const [recPage, setRecPage] = useState(1);
  const recPages = Math.ceil(list.length / RECIBOS_PAGE_SIZE);
  const recStart = (recPage - 1) * RECIBOS_PAGE_SIZE;
  const pagedRec = list.slice(recStart, recStart + RECIBOS_PAGE_SIZE);

  // Paginación empleados
  const [empPage, setEmpPage] = useState(1);
  const empPages  = Math.ceil(empleados.length / EMP_PAGE_SIZE);
  const empStart  = (empPage - 1) * EMP_PAGE_SIZE;
  const pagedEmp  = empleados.slice(empStart, empStart + EMP_PAGE_SIZE);

  const fileInputRef = useRef();

  useEffect(() => {
    fetchRecibos();
    fetchEmpleados();
  }, []);

  async function fetchRecibos() {
    try {
      const { data } = await API.get('/docs');
      setList(data);
      setRecPage(1);
    } catch {
      toast.error('No se pudo cargar recibos.');
    }
  }

  async function fetchEmpleados() {
    try {
      setCargando(true);
      const { data } = await API.get('/empleados');
      setEmpleados(data);
      setEmpPage(1);
    } catch {
      toast.error('No se pudo cargar empleados.');
    } finally {
      setCargando(false);
    }
  }

  const onFileChange = () => {
    const f = fileInputRef.current.files[0];
    setSelectedFileName(f ? f.name : '');
  };

  const handleBulkUpload = async e => {
    e.preventDefault();
    const file = fileInputRef.current.files[0];
    if (!file) {
      toast.error('Seleccioná un PDF antes de subir.');
      return;
    }
    const fd = new FormData();
    fd.append('file', file);
    try {
      await API.post('/docs/upload', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('PDF procesado correctamente.');
      fetchRecibos();
      e.target.reset();
      setSelectedFileName('');
    } catch {
      toast.error('Error al procesar PDF.');
    }
  };

  const downloadRecibo = async id => {
    try {
      const res = await API.get(`/docs/${id}/download`, { responseType: 'blob' });
      const cd = res.headers['content-disposition'] || '';
      const fn = (cd.match(/filename="?(.+)"?/) || [])[1] || `recibo_${id}.pdf`;
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url; a.download = fn; document.body.appendChild(a);
      a.click(); a.remove(); URL.revokeObjectURL(url);
    } catch {
      toast.error('No se pudo descargar el recibo.');
    }
  };

  const viewRecibo = async id => {
    try {
      const res = await API.get(`/docs/${id}/download`, { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url  = URL.createObjectURL(blob);
      window.open(url, '_blank', 'noopener,noreferrer');
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    } catch {
      toast.error('No se pudo abrir el recibo.');
    }
  };

  const removeRecibo = async id => {
    if (!window.confirm('¿Eliminar este recibo?')) return;
    try {
      await API.delete(`/docs/${id}`);
      toast.success('Recibo eliminado.');
      fetchRecibos();
    } catch {
      toast.error('Error al eliminar recibo.');
    }
  };

  const abrirModal = empleado => {
    setModalState({ abierto: true, empleado });
  };
  const cerrarModal = () => {
    setModalState({ abierto: false, empleado: null });
  };

  return (
    <div className="doc-container">
      {/* ────── Recibos de Sueldo ────── */}
      <div className="card recibos-card">
        <h2 className="card-title">Recibos de Sueldo</h2>

        <form onSubmit={handleBulkUpload} className="doc-upload-form">
          <div className="doc-upload-left">
            <input
              type="file"
              accept="application/pdf"
              ref={fileInputRef}
              hidden
              onChange={onFileChange}
            />
            <label
              className="doc-btn-file"
              onClick={() => fileInputRef.current.click()}
            >
              Seleccionar PDF
            </label>
            {selectedFileName && (
              <span className="doc-file-name">
                {selectedFileName}
              </span>
            )}
          </div>

          <button type="submit" className="btn-red">
            Subir PDF masivo
          </button>
        </form>

        <div className="doc-table-wrapper">
          <table className="doc-table">
            <thead>
              <tr>
                <th>Mes/Año</th>
                <th>Archivo</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {pagedRec.map(r => (
                <tr key={r.id}>
                  <td>{`${r.period_month}/${r.period_year}`}</td>
                  <td>{r.file_name}</td>
                  <td className="doc-col-actions">
                    <button title="Ver" onClick={() => viewRecibo(r.id)}>
                      <FiEye />
                    </button>
                    <button title="Descargar" onClick={() => downloadRecibo(r.id)}>
                      <FiDownload />
                    </button>
                    <button title="Eliminar" onClick={() => removeRecibo(r.id)}>
                      <FiTrash2 />
                    </button>
                  </td>
                </tr>
              ))}
              {Array.from({ length: RECIBOS_PAGE_SIZE - pagedRec.length }).map((_, i) => (
                <tr key={i} className="empty-row">
                  <td colSpan="3">&nbsp;</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {recPages > 1 && (
          <div className="pagination">
            <button onClick={() => setRecPage(p => Math.max(p - 1, 1))} disabled={recPage === 1}>
              <FiChevronLeft /> Anterior
            </button>
            {[...Array(recPages)].map((_, i) => (
              <button
                key={i}
                className={recPage === i + 1 ? 'active' : ''}
                onClick={() => setRecPage(i + 1)}
              >
                {i + 1}
              </button>
            ))}
            <button onClick={() => setRecPage(p => Math.min(p + 1, recPages))} disabled={recPage === recPages}>
              Siguiente <FiChevronRight />
            </button>
          </div>
        )}
      </div>

      {/* ────── Documentación de Empleados ────── */}
      <div className="card empleados-card">
        <h2 className="card-title">Documentación de Empleados</h2>
        {cargando ? (
          <p>Cargando empleados…</p>
        ) : (
          <>
            <div className="doc-table-wrapper">
              <table className="doc-table">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Email</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedEmp.map(emp => (
                    <tr key={emp.id}>
                      <td>{emp.nombre}</td>
                      <td>{emp.email}</td>
                      <td className="doc-col-actions">
                        <button title="Editar Documentos" onClick={() => abrirModal(emp)}>
                          <FiEdit2 />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {Array.from({ length: EMP_PAGE_SIZE - pagedEmp.length }).map((_, i) => (
                    <tr key={i} className="empty-row">
                      <td colSpan="3">&nbsp;</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {empPages > 1 && (
              <div className="pagination">
                <button onClick={() => setEmpPage(p => Math.max(p - 1, 1))} disabled={empPage === 1}>
                  <FiChevronLeft /> Anterior
                </button>
                {[...Array(empPages)].map((_, i) => (
                  <button
                    key={i}
                    className={empPage === i + 1 ? 'active' : ''}
                    onClick={() => setEmpPage(i + 1)}
                  >
                    {i + 1}
                  </button>
                ))}
                <button onClick={() => setEmpPage(p => Math.min(p + 1, empPages))} disabled={empPage === empPages}>
                  Siguiente <FiChevronRight />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {modalState.abierto && (
        <EditarDocsModal
          empleado={modalState.empleado}
          onClose={cerrarModal}
        />
      )}
    </div>
  );
}
