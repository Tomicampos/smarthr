// src/components/ModalGenerico.jsx
import React from "react";
import "./ModalGenerico.css";

export default function ModalGenerico({ abierto, onClose, titulo, children }) {
  if (!abierto) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-header">
          <h2 className="modal-title">{titulo}</h2>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="modal-body">
          
          {children}
        </div>
      </div>
    </div>
  );
}
