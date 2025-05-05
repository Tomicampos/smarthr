// src/pages/Dashboard.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function Dashboard() {
  const [msg, setMsg] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('smarthr_token');
    axios.get('http://localhost:3001/api/protected', {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => setMsg(res.data.message))
    .catch(() => setMsg('Error al verificar token'));
  }, []);

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Dashboard</h1>
      <p>{msg}</p>
    </div>
  );
}
