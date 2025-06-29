// src/components/EmpleadoForm.jsx
import React, { useState, useEffect } from "react";
import API from "../api";
import { useToast } from "../components/ToastContext";
import "./EmpleadoForm.css";

export default function EmpleadoForm({ mode, user, onSuccess }) {
  const toast = useToast();
  const [id, setId] = useState(user?.id || "");
  const [nombre, setNombre] = useState(user?.nombre || "");
  const [email, setEmail] = useState(user?.email || "");
  const [password, setPassword] = useState("");
  const [rol, setRol] = useState(user?.rol || "empleado");

  useEffect(() => {
    if (mode === "edit" && user) {
      setId(user.id);
      setNombre(user.nombre);
      setEmail(user.email);
      setRol(user.rol);
      setPassword("");
    } else if (mode === "create") {
      setId("");
      setNombre("");
      setEmail("");
      setPassword("");
      setRol("empleado");
    }
  }, [mode, user]);

  const validarCampos = () => {
    if (!nombre.trim()) {
      toast.error("El nombre es obligatorio.");
      return false;
    }
    if (!email.trim()) {
      toast.error("El email es obligatorio.");
      return false;
    }
    if (mode === "create" && !password.trim()) {
      toast.error("La contraseña es obligatoria.");
      return false;
    }
    if (!["empleado", "admin"].includes(rol)) {
      toast.error("El rol no es válido.");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validarCampos()) return;

    try {
      if (mode === "create") {
        await API.post("/users", {
          id: Number(id),
          nombre: nombre.trim(),
          email: email.trim(),
          password,
          rol
        });
      } else { // edit
        await API.put(`/users/${id}`, {
          nombre: nombre.trim(),
          email: email.trim(),
          rol
        });
      }
      // Llamamos a onSuccess(); el padre se encarga de mostrar el toast de éxito
      onSuccess();
    } catch (err) {
      const status = err.response?.status;
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Error desconocido al guardar.";
      if (status === 400 && msg.toLowerCase().includes("ya existe")) {
        toast.error(msg);
      } else {
        toast.error("Error al guardar usuario.");
      }
    }
  };

  return (
    <form className="form-emp" onSubmit={handleSubmit}>
      {mode === "create" && (
        <div className="form-group">
          <label>DNI:</label>
          <input
            type="number"
            value={id}
            onChange={e => setId(e.target.value)}
            required
          />
        </div>
      )}

      <div className="form-group">
        <label>Nombre:</label>
        <input
          type="text"
          value={nombre}
          onChange={e => setNombre(e.target.value)}
          readOnly={mode === "view"}
          required
        />
      </div>

      <div className="form-group">
        <label>Email:</label>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          readOnly={mode === "view"}
          required
        />
      </div>

      {mode === "create" && (
        <div className="form-group">
          <label>Contraseña:</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
        </div>
      )}

      <div className="form-group">
        <label>Rol:</label>
        {mode === "view" ? (
          <input type="text" value={rol} readOnly />
        ) : (
          <select value={rol} onChange={e => setRol(e.target.value)}>
            <option value="empleado">Empleado</option>
            <option value="admin">Administrador</option>
          </select>
        )}
      </div>

      {mode !== "view" && (
        <div className="modal-footer">
          <button type="submit" className="btn-primary">
            {mode === "create" ? "Crear" : "Guardar"}
          </button>
        </div>
      )}
    </form>
  );
}
