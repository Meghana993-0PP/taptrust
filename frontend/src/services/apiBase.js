// In development: Vite proxies /api → localhost:5000
// In production: prefer VITE_API_URL, with a Railway fallback if the env var
// is missing in the deployed build.
const FALLBACK_PRODUCTION_API_URL = 'https://taptrust-production.up.railway.app';
const BASE = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? FALLBACK_PRODUCTION_API_URL : '');

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
  const text = await res.text();
  try { return text ? JSON.parse(text) : {}; } catch { return {}; }
}
