// src/components/Empleados.jsx (frontend)
import React, { useState, useEffect, useRef } from "react";
import API from "../api";
import EmpleadoForm from "../components/EmpleadoForm.jsx";
import ModalGenerico from "../components/ModalGenerico.jsx";
import { useToast } from "../components/ToastContext";
import { FiChevronLeft, FiChevronRight, FiEye, FiEdit2, FiTrash2 } from "react-icons/fi";
import "./Empleados.css";

const PAGE_SIZE = 10;

export default function Empleados() {
  const toast = useToast();
  const [users, setUsers] = useState([]);
  const [mode, setMode] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const fileInputRef = useRef();
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    cargarUsuarios();
  }, []);

  const cargarUsuarios = async () => {
    try {
      const { data } = await API.get("/users");
      setUsers(data);
      setCurrentPage(1);
    } catch {
      toast.error("No se pudo cargar usuarios.");
    }
  };

  const openForm = (modo, user = null) => {
    setMode(modo);
    setCurrentUser(user);
    setModalOpen(true);
  };
  const closeForm = () => {
    setModalOpen(false);
    setMode(null);
    setCurrentUser(null);
  };
  const onSaved = () => {
    if (mode === "create") toast.success("Empleado creado correctamente");
    else if (mode === "edit") toast.success("Empleado actualizado correctamente");
    closeForm();
    cargarUsuarios();
  };

  const eliminarUsuario = async (user) => {
    if (!window.confirm(`¿Eliminar al empleado "${user.nombre}"?`)) return;
    try {
      await API.delete(`/users/${user.id}`);
      toast.success("Empleado eliminado");
      cargarUsuarios();
    } catch {
      toast.error("No se pudo eliminar el empleado");
    }
  };

  const handleExport = async () => {
    try {
      const response = await API.get("/users/export", { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "usuarios.csv");
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success("CSV exportado");
    } catch {
      toast.error("Error al exportar CSV");
    }
  };

  const handleImportClick = () => fileInputRef.current.click();

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const { data: result } = await API.post("/users/import", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (result.errors && result.errors.length > 0) {
        toast.error(`Hubo ${result.errors.length} errores durante la importación.`);
      } else {
        toast.success("Archivo importado correctamente");
      }

      await cargarUsuarios();
      setCurrentPage(1);
      e.target.value = null;
    } catch {
      toast.error("Error al importar CSV");
    }
  };

  // Paginación
  const totalItems = users.length;
  const totalPages = Math.ceil(totalItems / PAGE_SIZE);
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  const start = (currentPage - 1) * PAGE_SIZE;
  const pagedUsers = users.slice(start, start + PAGE_SIZE);

  return (
    <div className="emp-container">
      <div className="emp-header">
        <h1 className="emp-title">Gestión de Usuarios</h1>
        <div className="emp-actions">
          <button className="emp-btn" onClick={handleExport}>📤 Exportar CSV</button>
          <button className="emp-btn" onClick={handleImportClick}>📥 Importar CSV</button>
          <button className="emp-btn" onClick={() => openForm("create")}>＋ Agregar Usuario</button>
          <input
            type="file"
            accept=".csv"
            ref={fileInputRef}
            style={{ display: "none" }}
            onChange={handleFileChange}
          />
        </div>
      </div>

      <div className="emp-table-wrapper">
        <table className="emp-table">
          <thead>
            <tr>
              <th>DNI</th>
              <th>Nombre y Apellido</th>
              <th>Email</th>
              <th>Rol</th>
              <th className="emp-col-actions">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {pagedUsers.map((u, idx) => (
              <tr key={u.id} className={idx % 2 === 0 ? "emp-row-even" : "emp-row-odd"}>
                <td>{u.id}</td>
                <td>{u.nombre}</td>
                <td>{u.email}</td>
                <td>{u.rol}</td>
                <td className="emp-col-actions">
                  <button className="emp-btn-action" title="Ver" onClick={() => openForm("view", u)}>
                    <FiEye />
                  </button>
                  <button className="emp-btn-action" title="Editar" onClick={() => openForm("edit", u)}>
                    <FiEdit2 />
                  </button>
                  <button className="emp-btn-action" title="Eliminar" onClick={() => eliminarUsuario(u)}>
                    <FiTrash2 />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <button onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1}>
            <FiChevronLeft /> Anterior
          </button>
          <ul>
            {pages.map(p => (
              <li key={p}>
                <button className={p === currentPage ? "active" : ""} onClick={() => setCurrentPage(p)}>
                  {p}
                </button>
              </li>
            ))}
          </ul>
          <button onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages}>
            Siguiente <FiChevronRight />
          </button>
        </div>
      )}

      {modalOpen && (
        <ModalGenerico abierto={modalOpen} onClose={closeForm} titulo={
          mode === "create" ? "Crear empleado" :
          mode === "edit"   ? "Editar empleado" :
                              "Ver empleado"
        }>
          <EmpleadoForm mode={mode} user={currentUser} onSuccess={onSaved} />
        </ModalGenerico>
      )}
    </div>
  );
}
