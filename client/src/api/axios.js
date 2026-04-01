import axios from 'axios';
import { config } from '../config/config.js';

const api = axios.create({
  baseURL: config.api.baseURL,
  timeout: config.api.timeout,
  withCredentials: true,
});

let isRefreshing = false;
let queue = [];

api.interceptors.response.use(
  res => res,
  async err => {
    const original = err.config;
    const isAuthEndpoint = original.url?.includes('/api/auth/');
    if (err.response?.status === 401 && !original._retry && !isAuthEndpoint) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          queue.push({ resolve, reject });
        }).then(() => api(original)).catch(e => Promise.reject(e));
      }

      original._retry = true;
      isRefreshing = true;

      try {
        await api.post('/api/auth/refresh');
        queue.forEach(p => p.resolve());
        queue = [];
        return api(original);
      } catch (refreshErr) {
        queue.forEach(p => p.reject(refreshErr));
        queue = [];
        window.location.href = '/login';
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(err);
  }
);

export default api;
