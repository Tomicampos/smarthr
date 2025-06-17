import React from 'react';
import ModalGenerico from './ModalGenerico';
import './NotificationDetailModal.css';

export default function NotificationDetailModal({ abierto, onClose, notif }) {
  return (
    <ModalGenerico abierto={abierto} onClose={onClose} titulo="Detalle de Notificación">
      {notif ? (
        <div className="notif-detail-body">
          <p><b>Asunto:</b> {notif.asunto}</p>
          <p><b>Mensaje:</b></p>
          <div className="notif-body">{notif.mensaje}</div>
          <p>
            <b>Enviada a:</b> {notif.total_destinatarios} destinatarios<br/>
            <b>Enviados:</b> {notif.enviados}<br/>
            <b>Fecha:</b> {new Date(notif.creado_en).toLocaleString()}
          </p>
        </div>
      ) : (
        <p>Cargando…</p>
      )}
    </ModalGenerico>
  );
}
