import React, { useState, useEffect, useRef } from 'react';
import API from '../api';
import { useToast } from '../components/ToastContext';
import EditarDocsModal from '../components/EditarDocsModal';
import {
  FiChevronLeft,
  FiChevronDown,
  FiChevronRight,
  FiDownload,
  FiTrash2,
  FiEye,
  FiEdit2
} from 'react-icons/fi';
import './Documentacion.css';

const PAGE_SIZE = 5;

export default function Documentacion() {
  const toast = useToast();

  // datos
  const [recibos, setRecibos]         = useState([]);
  const [empleados, setEmpleados]     = useState([]);
  const [cargandoEmp, setCargandoEmp] = useState(false);

  // modal edición
  const [modalState, setModalState] = useState({ abierto: false, empleado: null });

  // filtros / paginación
  const [searchTerm, setSearchTerm] = useState('');
  const [tipoFilter, setTipoFilter] = useState('Recibo de sueldo');
  const [page, setPage]             = useState(1);

  // upload masivo
  const fileInputRef      = useRef();
  const [selectedFileName, setSelectedFileName] = useState('');

  // 1) fetch inicial
  useEffect(() => {
    (async () => {
      try {
        const { data: rec } = await API.get('/docs');
        setRecibos(rec);
        setSearchTerm('');
        setTipoFilter('Recibo de sueldo');
        setPage(1);
      } catch {
        toast.error('No se pudo cargar recibos.');
      }

      try {
        setCargandoEmp(true);
        const { data: emps } = await API.get('/empleados');
        setEmpleados(emps);
      } catch {
        toast.error('No se pudo cargar empleados.');
      } finally {
        setCargandoEmp(false);
      }
    })();
  }, [toast]);

  // 2) Filtrado y paginación
  let items = [];
  if (tipoFilter === 'Recibo de sueldo') {
    items = recibos.map(r => ({
      id: `R-${r.id}`,
      tipo: 'Recibo de sueldo',
      periodo: `${r.period_month}/${r.period_year}`,
      file_name: r.file_name,
      rawId: r.id,
    })).filter(it =>
      it.file_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      it.periodo.includes(searchTerm)
    );
  } else {
    items = empleados.map(e => ({
      id: `E-${e.id}`,
      tipo: 'Usuario',
      nombre: e.nombre,
      email: e.email,
      rawId: e.id,
    })).filter(it =>
      it.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      it.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }

  const totalPages = Math.ceil(items.length / PAGE_SIZE);
  const start      = (page - 1) * PAGE_SIZE;
  const paged      = items.slice(start, start + PAGE_SIZE);

  // 3) acciones comunes
  const viewFile = async item => {
    try {
      const urlPath = item.tipo === 'Recibo de sueldo'
        ? `/docs/${item.rawId}/download`
        : `/empleados/${item.rawId}/documento/download`;
      const res = await API.get(urlPath, { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url  = URL.createObjectURL(blob);
      window.open(url, '_blank','noopener');
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    } catch {
      toast.error('No se pudo abrir el documento.');
    }
  };
  const downloadFile = async item => {
    try {
      const urlPath = item.tipo === 'Recibo de sueldo'
        ? `/docs/${item.rawId}/download`
        : `/empleados/${item.rawId}/documento/download`;
      const res = await API.get(urlPath, { responseType: 'blob' });
      const cd  = res.headers['content-disposition'] || '';
      const fn  = (cd.match(/filename="?(.+)"?/) || [])[1] || item.file_name;
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      a.download = fn;
      document.body.appendChild(a);
      a.click(); a.remove();
    } catch {
      toast.error('No se pudo descargar el documento.');
    }
  };
  const removeItem = async item => {
    if (!window.confirm(`¿Eliminar este ${item.tipo.toLowerCase()}?`)) return;
    try {
      if (item.tipo === 'Recibo de sueldo') {
        await API.delete(`/docs/${item.rawId}`);
        setRecibos(rs => rs.filter(r => r.id !== item.rawId));
      } else {
        await API.delete(`/empleados/${item.rawId}/documento`);
      }
      toast.success(`${item.tipo} eliminado.`);
    } catch {
      toast.error('Error al eliminar documento.');
    }
  };

  // upload masivo
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
      await API.post('/docs/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('PDF procesado correctamente.');
      // recargar recibos
      const { data } = await API.get('/docs');
      setRecibos(data);
      setSelectedFileName('');
      fileInputRef.current.value = '';
    } catch {
      toast.error('Error al procesar PDF.');
    }
  };

  // modal edición usuario
  const abrirModal = empleadoObj => setModalState({ abierto: true, empleado: empleadoObj });
  const cerrarModal = () => setModalState({ abierto: false, empleado: null });

  return (
    <div className="doc-container">
      <div className="card">
        <h2 className="card-title">Documentos</h2>

        {/* ─── Controles (misma estructura que Reclutamiento) */}
        <div className="rec-controls">
          <input
            type="text"
            placeholder={
              tipoFilter === 'Recibo de sueldo'
                ? 'Buscar por archivo o periodo…'
                : 'Buscar por nombre o email…'
            }
            value={searchTerm}
            onChange={e => { setSearchTerm(e.target.value); setPage(1); }}
          />
          <div className="select-wrapper">
            <select
              className="select-filter"
              value={tipoFilter}
              onChange={e => { setTipoFilter(e.target.value); setPage(1); }}
            >
              <option>Recibo de sueldo</option>
              <option>Usuarios</option>
            </select>
            <FiChevronDown className="select-icon" />
          </div>
          {/* upload masivo sólo en Recibos */}
          {tipoFilter === 'Recibo de sueldo' && (
          <form onSubmit={handleBulkUpload} className="rec-actions" style={{ alignItems: 'center' }}>
            <input
              type="file"
              accept="application/pdf"
              ref={fileInputRef}
              hidden
              onChange={onFileChange}
            />
            {selectedFileName && (
              <span style={{ fontSize: '0.9rem', color: '#374151' }}>
                {selectedFileName}
              </span>
            )}
            {/* Aquí usamos la clase doc-btn-file para mantener el gris */}
            <label
              className="doc-btn-file"
              onClick={() => fileInputRef.current.click()}
            >
              Seleccionar PDF
            </label>
            <button type="submit" className="btn-red">
              Subir PDF masivo
            </button>
          </form>
        )}
        </div>

        {/* ─── Tabla */}
        <div className="doc-table-wrapper">
          <table className="doc-table">
            <thead>
              <tr>
                {tipoFilter === 'Recibo de sueldo' ? (
                  <>
                    <th>Mes/Año</th>
                    <th>Archivo</th>
                    <th>Acciones</th>
                  </>
                ) : (
                  <>
                    <th>Nombre</th>
                    <th>Email</th>
                    <th>Acciones</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {paged.map(item => (
                <tr key={item.id}>
                  {tipoFilter === 'Recibo de sueldo' ? (
                    <>
                      <td>{item.periodo}</td>
                      <td>{item.file_name}</td>
                      <td className="doc-col-actions">
                        <button title="Ver"      onClick={() => viewFile(item)}><FiEye/></button>
                        <button title="Descargar" onClick={() => downloadFile(item)}><FiDownload/></button>
                        <button title="Eliminar"  onClick={() => removeItem(item)}><FiTrash2/></button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td>{item.nombre}</td>
                      <td>{item.email}</td>
                      <td className="doc-col-actions">
                         <button
                           title="Editar documentos"
                           onClick={() => abrirModal({
                             id:     item.rawId,        
                             nombre: item.nombre,       
                             email:  item.email
                           })}
                         >
                         <FiEdit2/>
                       </button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
              {Array.from({ length: PAGE_SIZE - paged.length }).map((_, i) => (
                <tr key={i} className="empty-row">
                  <td colSpan={tipoFilter === 'Recibo de sueldo' ? 3 : 3}>&nbsp;</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ─── Paginación */}
        {totalPages > 1 && (
          <div className="pagination">
            <button onClick={() => setPage(p => Math.max(p - 1, 1))} disabled={page === 1}>
              <FiChevronLeft /> Anterior
            </button>
            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i}
                className={page === i + 1 ? 'active' : ''}
                onClick={() => setPage(i + 1)}
              >
                {i + 1}
              </button>
            ))}
            <button onClick={() => setPage(p => Math.min(p + 1, totalPages))} disabled={page === totalPages}>
              Siguiente <FiChevronRight />
            </button>
          </div>
        )}
      </div>

      {/* ─── Modal Edición documentos de empleado */}
      {modalState.abierto && (
        <EditarDocsModal
          empleado={modalState.empleado}
          onClose={cerrarModal}
        />
      )}
    </div>
  );
}