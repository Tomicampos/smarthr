// src/pages/Documentacion.jsx
import React, { useState, useEffect } from 'react';
import API from '../api';
import './Documentacion.css';
import EditarDocsModal from '../components/EditarDocsModal';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';

const RECIBOS_PAGE_SIZE = 2;
const EMP_PAGE_SIZE = 5;

export default function Documentacion() {
  const [file, setFile] = useState(null);
  const [list, setList] = useState([]);
  const [notif, setNotif] = useState(null);
  const [empleados, setEmpleados] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [modalState, setModalState] = useState({ abierto: false, empleadoSeleccionado: null });

  // Paginación recibos
  const [recPage, setRecPage] = useState(1);
  const recTotal  = list.length;
  const recPages  = Math.ceil(recTotal / RECIBOS_PAGE_SIZE);
  const recStart  = (recPage - 1) * RECIBOS_PAGE_SIZE;
  const pagedRecibos = list.slice(recStart, recStart + RECIBOS_PAGE_SIZE);

  // Paginación empleados
  const [empPage, setEmpPage] = useState(1);
  const empTotal  = empleados.length;
  const empPages  = Math.ceil(empTotal / EMP_PAGE_SIZE);
  const empStart  = (empPage - 1) * EMP_PAGE_SIZE;
  const pagedEmps = empleados.slice(empStart, empStart + EMP_PAGE_SIZE);

  useEffect(() => {
    fetchList();
    fetchEmpleados();
  }, []);

  async function fetchList() {
    try {
      const { data } = await API.get('/docs');
      setList(data);
      setRecPage(1);
    } catch {
      setList([]);
    }
  }

  async function fetchEmpleados() {
    try {
      setCargando(true);
      const { data } = await API.get('/empleados');
      setEmpleados(data);
      setEmpPage(1);
    } catch {
      setEmpleados([]);
      setNotif({ type: 'error', title: 'No se pudo cargar empleados.' });
      setTimeout(() => setNotif(null), 5000);
    } finally {
      setCargando(false);
    }
  }

  const handleUpload = async e => {
    e.preventDefault();
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file);
    try {
      await API.post('/docs/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setNotif({ type: 'success', title: 'PDF procesado correctamente.' });
      fetchList();
    } catch {
      setNotif({ type: 'error', title: 'Error al procesar PDF.' });
    }
    setTimeout(() => setNotif(null), 5000);
  };

  const download = async id => {
    try {
      const res = await API.get(`/docs/${id}/download`, { responseType: 'blob' });
      const cd = res.headers['content-disposition'] || '';
      const fn = (cd.match(/filename="?(.+)"?/) || [])[1] || `recibo_${id}.pdf`;
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url; a.download = fn; document.body.appendChild(a);
      a.click(); a.remove(); window.URL.revokeObjectURL(url);
    } catch {
      setNotif({ type: 'error', title: 'No se pudo descargar el recibo' });
      setTimeout(() => setNotif(null), 5000);
    }
  };

  const remove = async id => {
    if (!window.confirm('¿Eliminar este recibo?')) return;
    try {
      await API.delete(`/docs/${id}`);
      setNotif({ type: 'success', title: 'Recibo eliminado.' });
      fetchList();
    } catch {
      setNotif({ type: 'error', title: 'Error al eliminar recibo.' });
    }
    setTimeout(() => setNotif(null), 5000);
  };

  const abrirModal = emp => setModalState({ abierto: true, empleadoSeleccionado: emp });
  const cerrarModal = () => setModalState({ abierto: false, empleadoSeleccionado: null });

  return (
    <div className="doc-container">
      {notif && (
        <div className={`alert alert-${notif.type}`}>
          <div className="alert-content">
            <h4 className="alert-title">{notif.title}</h4>
          </div>
        </div>
      )}

      {/* ────── Recibos de Sueldo ────── */}
      <div className="card recibos-card">
        <h2 className="card-title">Recibos de Sueldo</h2>
        <form onSubmit={handleUpload} className="doc-upload-form">
          <input type="file" accept="application/pdf" onChange={e => setFile(e.target.files[0])} />
          <button type="submit" className="btn-red">Subir PDF masivo</button>
        </form>
        <div className="doc-table-wrapper">
          <table className="doc-table">
            <thead>
              <tr>
                <th>Mes/Año</th><th>Archivo</th><th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {pagedRecibos.map(r => (
                <tr key={r.id}>
                  <td>{`${r.period_month}/${r.period_year}`}</td>
                  <td>{r.file_name}</td>
                  <td>
                    <button className="btn-outline-red" onClick={() => download(r.id)}>Descargar</button>
                    <button className="btn-outline-red" onClick={() => remove(r.id)}>Eliminar</button>
                  </td>
                </tr>
              ))}
              {/* filas vacías */}
              {Array.from({ length: RECIBOS_PAGE_SIZE - pagedRecibos.length })
                .map((_, i) => <tr key={i} className="empty-row"><td colSpan="3">&nbsp;</td></tr>)
              }
            </tbody>
          </table>
        </div>
        {/* Paginación */}
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
              >{i + 1}</button>
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
                    <th>Nombre</th><th>Email</th><th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedEmps.map(emp => (
                    <tr key={emp.id}>
                      <td>{emp.nombre}</td>
                      <td>{emp.email}</td>
                      <td>
                        <button className="btn-outline-red" onClick={() => abrirModal(emp)}>
                          Editar Documentos
                        </button>
                      </td>
                    </tr>
                  ))}
                  {/* filas vacías */}
                  {Array.from({ length: EMP_PAGE_SIZE - pagedEmps.length }).map((_, i) => (
                    <tr key={i} className="empty-row"><td colSpan="3">&nbsp;</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Paginación */}
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
                  >{i + 1}</button>
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
          empleado={modalState.empleadoSeleccionado}
          onClose={cerrarModal}
          mostrarNotificacion={(tipo, texto) => {
            setNotif({ type: tipo, title: texto });
            setTimeout(() => setNotif(null), 5000);
          }}
        />
      )}
    </div>
  );
}
