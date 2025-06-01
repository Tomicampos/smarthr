// src/pages/Documentacion.jsx
import React, { useState, useEffect } from 'react';
import API from '../api';
import './Documentacion.css';
import EditarDocsModal from '../components/EditarDocsModal';

export default function Documentacion() {
  const [file, setFile] = useState(null);
  const [list, setList] = useState([]);
  const [notif, setNotif] = useState(null);
  const [empleados, setEmpleados] = useState([]);
  const [cargando, setCargando] = useState(false);

  // Estado para controlar el modal
  const [modalState, setModalState] = useState({ abierto: false, empleadoSeleccionado: null });

  useEffect(() => {
    fetchList();
    fetchEmpleados();
  }, []);

  // ─── Recibos de sueldo ─────────────────────────────────────────────
  async function fetchList() {
    try {
      const { data } = await API.get('/docs');
      setList(data);
    } catch (err) {
      console.error('Error al cargar docs:', err);
      setList([]);
    }
  }

  const handleUpload = async e => {
    e.preventDefault();
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    try {
      await API.post('/docs/upload', formData, {
        headers: { 'Content-Type':'multipart/form-data' }
      });
      setNotif({
        type: 'success',
        title: 'Archivo cargado exitosamente.',
        message: 'El PDF se procesó correctamente.'
      });
      fetchList();
    } catch (err) {
      console.error('Error al procesar PDF:', err);
      setNotif({
        type: 'error',
        title: 'Error al procesar el PDF',
        message: ''
      });
    }
    setTimeout(() => setNotif(null), 5000);
  };

  const download = async id => {
    try {
      const res = await API.get(`/docs/${id}/download`, { responseType: 'blob' });
      const disposition = res.headers['content-disposition'] || '';
      const match = disposition.match(/filename="?(.+)"?/);
      const filename = match ? match[1] : `recibo_${id}.pdf`;
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error descargando recibo:', err);
      setNotif({
        type: 'error',
        title: 'No se pudo descargar el recibo',
        message: ''
      });
      setTimeout(() => setNotif(null), 5000);
    }
  };

  const remove = async id => {
    if (!window.confirm('¿Seguro que quieres eliminar este recibo?')) return;
    try {
      await API.delete(`/docs/${id}`);
      setNotif({
        type: 'success',
        title: 'Archivo eliminado exitosamente.',
        message: ''
      });
      fetchList();
    } catch (err) {
      console.error('Error eliminando recibo:', err);
      setNotif({
        type: 'error',
        title: 'No se pudo eliminar el recibo',
        message: ''
      });
    }
    setTimeout(() => setNotif(null), 5000);
  };

  // ─── Empleados / Modal de Documentos ─────────────────────────────────────────
  async function fetchEmpleados() {
    try {
      setCargando(true);
      const { data } = await API.get('/empleados');
      setEmpleados(data);
    } catch (err) {
      console.error('Error al listar empleados:', err);
      setEmpleados([]);
      setNotif({
        type: 'error',
        title: 'No se pudo cargar la lista de empleados.',
        message: ''
      });
      setTimeout(() => setNotif(null), 5000);
    } finally {
      setCargando(false);
    }
  }

  const abrirModal = empleado => {
    setModalState({ abierto: true, empleadoSeleccionado: empleado });
  };

  const cerrarModal = () => {
    setModalState({ abierto: false, empleadoSeleccionado: null });
  };

  return (
    <div className="doc-container">
      {/* ─── Notificación flotante ───────────────────────────────────────── */}
      {notif && (
        <div className={`alert alert-${notif.type}`} role="alert">
          <div className="alert-icon">
            {notif.type === 'success' ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <circle cx="12" cy="12" r="10" strokeWidth="2" />
                <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <circle cx="12" cy="12" r="10" strokeWidth="2" />
                <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M15 9l-6 6m0-6l6 6" />
              </svg>
            )}
          </div>
          <div className="alert-content">
            <h4 className="alert-title">{notif.title}</h4>
            {notif.message && <p className="alert-message">{notif.message}</p>}
          </div>
        </div>
      )}

      {/* ─── Recibos de Sueldo ────────────────────────────────────────────────── */}
      <h1 className="doc-title">Recibos de Sueldo</h1>
      <form onSubmit={handleUpload} className="doc-upload-form">
        <input
          type="file"
          accept="application/pdf"
          onChange={e => setFile(e.target.files[0])}
        />
        <button type="submit" className="btn-red">Subir PDF masivo</button>
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
            {list.length > 0 ? list.map(r => (
              <tr key={r.id}>
                <td>{`${r.period_month}/${r.period_year}`}</td>
                <td>{r.file_name}</td>
                <td>
                  <button className="btn-outline-red" onClick={() => download(r.id)}>
                    Descargar
                  </button>
                  {' '}
                  <button className="btn-outline-red" onClick={() => remove(r.id)}>
                    Eliminar
                  </button>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan="3" className="no-data">No hay documentos cargados.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ─── Documentación de Empleados ───────────────────────────────────────── */}
      <h1 className="doc-title" style={{ marginTop: '2rem' }}>Documentación de Empleados</h1>
      {cargando ? (
        <p>Cargando empleados...</p>
      ) : (
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
              {empleados.length > 0 ? (
                empleados.map(emp => (
                  <tr key={emp.id}>
                    <td>{emp.nombre}</td>
                    <td>{emp.email}</td>
                    <td>
                      <button
                        className="btn-outline-red"
                        onClick={() => abrirModal(emp)}
                      >
                        Editar Documentos
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3" className="no-data">
                    No hay empleados disponibles.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ─── Modal de edición de documentos ─────────────────────────────── */}
      {modalState.abierto && (
        <EditarDocsModal
          empleado={modalState.empleadoSeleccionado}
          onClose={cerrarModal}
          mostrarNotificacion={(tipo, texto) => {
            setNotif({ type: tipo, title: texto, message: '' });
            setTimeout(() => setNotif(null), 5000);
          }}
        />
      )}
    </div>
  );
}
