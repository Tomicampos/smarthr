// src/components/EmpleadoForm.jsx
import React, { useState, useEffect } from "react";
import API from "../api";
import "./ModalGenerico.css";

export default function EmpleadoForm({ mode, user, onSuccess }) {
  /**
   * mode: "create" | "view" | "edit"
   * user: { id, nombre, email, rol }  // cuando es edit o view
   * onSuccess: función que se llama cuando la operación (create/edit) fue exitosa
   */
  // Form state:
  const [id, setId] = useState(user?.id || "");
  const [nombre, setNombre] = useState(user?.nombre || "");
  const [email, setEmail] = useState(user?.email || "");
  const [password, setPassword] = useState("");
  const [rol, setRol] = useState(user?.rol || "empleado");
  const [errorMsg, setErrorMsg] = useState(null);

  // Cuando el prop `user` cambia (por ejemplo al abrir el formulario en "edit"), actualizamos los campos:
  useEffect(() => {
    if (user) {
      setId(user.id);
      setNombre(user.nombre);
      setEmail(user.email);
      setRol(user.rol);
    } else {
      // Si volvemos a modo "create", limpiamos:
      setId("");
      setNombre("");
      setEmail("");
      setPassword("");
      setRol("empleado");
    }
    setErrorMsg(null);
  }, [user, mode]);

  // Validación mínima:
  const validarCampos = () => {
    if (!nombre.trim()) {
      setErrorMsg("El nombre es obligatorio.");
      return false;
    }
    if (!email.trim()) {
      setErrorMsg("El email es obligatorio.");
      return false;
    }
    if (mode === "create" && !password.trim()) {
      setErrorMsg("La contraseña es obligatoria.");
      return false;
    }
    if (!["empleado", "admin"].includes(rol)) {
      setErrorMsg("El rol no es válido.");
      return false;
    }
    setErrorMsg(null);
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validarCampos()) return;

    try {
      if (mode === "create") {
        // Crear nuevo usuario
        const payload = {
          id: Number(id),       // convertir a número
          nombre: nombre.trim(),
          email: email.trim(),
          password: password,
          rol
        };
        await API.post("/users", payload);
      } else if (mode === "edit") {
        // Editar existente (no enviamos password ni id)
        const payload = {
          nombre: nombre.trim(),
          email: email.trim(),
          rol
        };
        await API.put(`/users/${id}`, payload);
      }
      onSuccess();
    } catch (err) {
      console.error("Error al guardar usuario:", err);
      // Si el backend devolvió message
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Error desconocido al guardar.";
      setErrorMsg(msg);
    }
  };

  return (
    <form className="form-emp" onSubmit={handleSubmit}>
      {errorMsg && <div className="form-error">{errorMsg}</div>}

      {/* ID sólo editable en modo "create" */}
      {mode === "create" && (
        <div className="form-group">
          <label>ID:</label>
          <input
            type="number"
            value={id}
            onChange={(e) => setId(e.target.value)}
            required
          />
        </div>
      )}

      <div className="form-group">
        <label>Nombre:</label>
        <input
          type="text"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          readOnly={mode === "view"}
          required
        />
      </div>

      <div className="form-group">
        <label>Email:</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          readOnly={mode === "view"}
          required
        />
      </div>

      {/* En modo "create" pedimos contraseña */}
      {mode === "create" && (
        <div className="form-group">
          <label>Contraseña:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
      )}

      <div className="form-group">
        <label>Rol:</label>
        {mode === "view" ? (
          <input type="text" value={rol} readOnly />
        ) : (
          <select value={rol} onChange={(e) => setRol(e.target.value)}>
            <option value="empleado">Empleado</option>
            <option value="admin">Administrador</option>
          </select>
        )}
      </div>

      <div className="form-buttons">
        {mode !== "view" && (
          <button type="submit" className="btn-submit">
            {mode === "create" ? "Crear" : "Guardar"}
          </button>
        )}
      </div>
    </form>
  );
}
