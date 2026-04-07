// In development: Vite proxies /api → localhost:5000
// In production: calls VITE_API_URL directly
const BASE = import.meta.env.VITE_API_URL || '';

export function apiUrl(path) {
  return `${BASE}/api/v1${path}`;
}

export async function apiFetch(path, opts = {}) {
  const token = localStorage.getItem('taptrust_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...opts.headers,
  };
  const res = await fetch(apiUrl(path), { ...opts, headers });
  return res.json();
}
