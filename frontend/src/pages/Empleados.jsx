// src/pages/Empleados.jsx
import React, { useState, useEffect, useRef } from "react";
import EmpleadoForm from "../components/EmpleadoForm.jsx";
import Modal from "../components/Modal.jsx";
import "./Empleados.css";

export default function Empleados() {
  const [users, setUsers] = useState([]);
  const [mode, setMode] = useState(null);           // 'create'|'view'|'edit'
  const [currentUser, setCurrentUser] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [notification, setNotification] = useState(null);
  const fileInputRef = useRef();

  // Función centralizada para cargar usuarios
  const cargarUsuarios = async () => {
    try {
      const res = await fetch("http://localhost:3001/api/users");
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : data.data || []);
    } catch (err) {
      console.error("Error cargando usuarios:", err);
      setNotification({ type: "error", text: "No se pudieron cargar los usuarios." });
      setTimeout(() => setNotification(null), 5000);
    }
  };

  // Carga inicial
  useEffect(() => {
    cargarUsuarios();
  }, []);

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

  // Export CSV
  const handleExport = () => {
    window.location.href = "http://localhost:3001/api/users/export";
  };

  // Import CSV
  const handleImportClick = () => fileInputRef.current.click();
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("http://localhost:3001/api/users/import", {
        method: "POST",
        body: formData,
      });
      const result = await res.json();

      // Mostrar notificación bonita
      const { inserted = [], errors = [] } = result;
      const isError = errors.length > 0;
      setNotification({
        type: isError ? "error" : "success",
        text: `Insertados: ${inserted.length}. Errores: ${errors.length}.`,
      });
      setTimeout(() => setNotification(null), 5000);

      cargarUsuarios();
    } catch (err) {
      console.error("Error importando:", err);
      setNotification({ type: "error", text: "Error al importar CSV." });
      setTimeout(() => setNotification(null), 5000);
    }
  };

  // Título dinámico del modal
  const modalTitle = {
    create: "Crear empleado",
    view:   "Ver empleado",
    edit:   "Editar empleado",
  }[mode];

  return (
    <>
      {/* Banner de notificación */}
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
              {users.map((u, i) => (
                <tr
                  key={u.id}
                  className={i % 2 === 0 ? "emp-row-even" : "emp-row-odd"}
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

        {modalOpen && (
          <Modal title={modalTitle} onClose={closeForm}>
            <EmpleadoForm mode={mode} user={currentUser} onSuccess={onSaved} />
          </Modal>
        )}
      </div>
    </>
  );
}
