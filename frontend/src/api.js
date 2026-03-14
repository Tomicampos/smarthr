// src/api.js
import axios from 'axios';

const API = axios.create({
  // En producción (Docker) usamos ruta relativa '/api' para que Nginx haga el proxy.
  // En desarrollo local (Vite) seguimos usando localhost:3001.
  baseURL: import.meta.env.PROD ? '/api' : 'http://localhost:3001/api'
});

API.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default API;
