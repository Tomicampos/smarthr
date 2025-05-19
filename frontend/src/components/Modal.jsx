// src/components/Modal.jsx
import React from "react";
import "./Modal.css";

export default function Modal({ children, onClose, title }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={e => e.stopPropagation()}>
        <header className="modal-header">
          <h2 className="modal-title">{title}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </header>
        <div className="modal-body">
          {children}
        </div>
      </div>
    </div>
  );
}
