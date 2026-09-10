// Same-origin /api in both dev (Vite proxy) and prod (Netlify redirect). Override with VITE_API_URL if you skip the proxy.
const BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '') + '/api';

export const getToken = () => localStorage.getItem('token');
export const setToken = (t) => (t ? localStorage.setItem('token', t) : localStorage.removeItem('token'));

export async function api(path, { method = 'GET', body } = {}) {
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = null;
  try { data = await res.json(); } catch { /* empty */ }
  if (!res.ok) { const e = new Error(data?.error || `Request failed (${res.status})`); e.status = res.status; throw e; }
  return data;
}
export const q = (obj) => Object.entries(obj).filter(([, v]) => v != null && v !== '').map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&');
export const mealNow = () => { const h = new Date().getHours(); return h < 10.5 ? 'breakfast' : h < 16 ? 'lunch' : h < 21 ? 'dinner' : 'snack'; };
export const periodNow = () => { const h = new Date().getHours(); return h < 10.5 ? 'Breakfast' : h < 16 ? 'Lunch' : 'Dinner'; };
export const cap = (s) => s[0].toUpperCase() + s.slice(1);
