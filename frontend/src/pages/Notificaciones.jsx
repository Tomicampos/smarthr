import React, { useState } from 'react';
import NotificationForm from '../components/NotificationForm';
import NotificationList from '../components/NotificationList';
import './Notificaciones.css';

export default function Notificaciones() {
  const [refresh, setRefresh] = useState(false);

  return (
    <div className="notifs-container">
      <NotificationForm onEnviado={() => setRefresh(r => !r)} />
      <NotificationList key={refresh} />
    </div>
  );
}
