import React, { useState, useEffect } from 'react';
import API from '../api';
import { useToast } from './ToastContext';
import './PostulantesMetrics.css';

export default function PostulantesMetrics() {
  const toast = useToast();
  const [metrics, setMetrics] = useState(null);

  useEffect(() => {
    API.get('/metrics/postulantes')
      .then(({ data }) => setMetrics(data))
      .catch(() => toast.error('No se pudieron cargar métricas'));
  }, [toast]);

  if (!metrics) {
    return (
      <div className="metrics-card">
        <p className="metrics-loading">Cargando métricas…</p>
      </div>
    );
  }

  return (
    <div className="metrics-card">
      <h4 className="metrics-title">Métricas de Postulantes</h4>
      <div className="metrics-grid">
        <div className="metric-item">
          <span className="metric-label">Total</span>
          <span className="metric-value">{metrics.total}</span>
        </div>
        <div className="metric-item">
          <span className="metric-label">En proceso</span>
          <span className="metric-value">{metrics.en_proceso}</span>
        </div>
        <div className="metric-item">
          <span className="metric-label">Finalizados</span>
          <span className="metric-value">{metrics.finalizados}</span>
        </div>
        <div className="metric-item">
          <span className="metric-label">Promedio días</span>
          <span className="metric-value">{metrics.promedio_dias}</span>
        </div>
        <div className="metric-item">
          <span className="metric-label">Tasa conversión</span>
          <span className="metric-value">{metrics.tasa}%</span>
        </div>
      </div>
    </div>
  );
}
