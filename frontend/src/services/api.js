/**
 * Axios API client.
 *
 * Configures a base Axios instance that:
 *  - Points to /api/v1 (proxied to backend in dev via Vite)
 *  - Attaches the JWT Bearer token from localStorage on every request
 *  - Normalises error responses
 */

import axios from 'axios';

const api = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// ── Request interceptor: attach JWT ──────────────────────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('taptrust_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Response interceptor: normalise errors ───────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Attach the server's error message to the thrown error for easy access
    if (error.response?.data?.message) {
      error.message = error.response.data.message;
    }
    return Promise.reject(error);
  }
);

export default api;
