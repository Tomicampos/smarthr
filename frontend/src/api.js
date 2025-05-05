import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3001'
});

// Inyecta el header Authorization si existe token
api.interceptors.request.use(config => {
  const token = localStorage.getItem('smarthr_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
