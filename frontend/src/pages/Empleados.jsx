// src/pages/Empleados.jsx
import React, { useState, useEffect, useRef } from "react";
import API from "../api";
import EmpleadoForm from "../components/EmpleadoForm.jsx";
import ModalGenérico from "../components/ModalGenerico.jsx";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import "./Empleados.css";

const PAGE_SIZE = 10;

export default function Empleados() {
  const [users, setUsers] = useState([]);
  const [mode, setMode] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [notification, setNotification] = useState(null);
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
    } catch (err) {
      console.error(err);
      setNotification({ type: "error", text: "No se pudo cargar usuarios." });
      setTimeout(() => setNotification(null), 5000);
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
    closeForm();
    cargarUsuarios();
  };

  const handleExport = async () => {
    try {
      const response = await API.get("/users/export", {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "usuarios.csv");
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error exportando CSV:", err);
      setNotification({ type: "error", text: "Error al exportar CSV" });
      setTimeout(() => setNotification(null), 5000);
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
      setNotification({
        type: result.errors.length ? "error" : "success",
        text: result.errors.length
          ? `Errores: ${result.errors.length}`
          : `Importados: ${result.inserted.length}`,
      });
      setTimeout(() => setNotification(null), 5000);
      cargarUsuarios();
    } catch (err) {
      console.error("Error importando:", err);
      setNotification({ type: "error", text: "Error al importar CSV" });
      setTimeout(() => setNotification(null), 5000);
    }
  };

  // Paginación
  const totalItems = users.length;
  const totalPages = Math.ceil(totalItems / PAGE_SIZE);
  const pages = [];
  for (let i = 1; i <= totalPages; i++) pages.push(i);

  const start = (currentPage - 1) * PAGE_SIZE;
  const pagedUsers = users.slice(start, start + PAGE_SIZE);

  return (
    <>
      {notification && (
        <div className={`emp-notif ${notification.type}`} role="alert">
          {notification.text}
        </div>
      )}

      <div className="emp-container">
        <div className="emp-header">
          <h1 className="emp-title">Gestión de Empleados</h1>
          <div className="emp-actions">
            <button className="emp-btn-export" onClick={handleExport}>
              📥 Exportar CSV
            </button>
            <button className="emp-btn-import" onClick={handleImportClick}>
              📤 Importar CSV
            </button>
            <button className="emp-btn-new" onClick={() => openForm("create")}>
              + Nuevo empleado
            </button>
          </div>
          <input
            type="file"
            accept=".csv"
            ref={fileInputRef}
            style={{ display: "none" }}
            onChange={handleFileChange}
          />
        </div>

        <div className="emp-table-wrapper">
          <table className="emp-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Email</th>
                <th>Rol</th>
                <th className="emp-col-actions"></th>
              </tr>
            </thead>
            <tbody>
              {pagedUsers.map((u, idx) => (
                <tr
                  key={u.id}
                  className={idx % 2 === 0 ? "emp-row-even" : "emp-row-odd"}
                >
                  <td>{u.id}</td>
                  <td>{u.nombre}</td>
                  <td>{u.email}</td>
                  <td>{u.rol}</td>
                  <td className="emp-col-actions">
                    <button
                      className="emp-btn-view"
                      onClick={() => openForm("view", u)}
                    >
                      Ver
                    </button>
                    <button
                      className="emp-btn-edit"
                      onClick={() => openForm("edit", u)}
                    >
                      Editar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="pagination">
            <button
              onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
            >
              <FiChevronLeft /> Anterior
            </button>
            <ul>
              {pages.map((p) => (
                <li key={p}>
                  <button
                    className={p === currentPage ? "active" : ""}
                    onClick={() => setCurrentPage(p)}
                  >
                    {p}
                  </button>
                </li>
              ))}
            </ul>
            <button
              onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              Siguiente <FiChevronRight />
            </button>
          </div>
        )}

        {modalOpen && (
          <ModalGenérico abierto onClose={closeForm} título={mode === "create" ? "Crear empleado" : mode === "edit" ? "Editar empleado" : "Ver empleado"}>
            <EmpleadoForm mode={mode} user={currentUser} onSuccess={onSaved} />
          </ModalGenérico>
        )}
      </div>
    </>
  );
}
