import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';

// Set EXPO_PUBLIC_API_URL when running `expo start`, or edit extra.apiUrl in app.json
// to your laptop's LAN IP so the phone can reach the server.
const BASE = (process.env.EXPO_PUBLIC_API_URL || Constants.expoConfig?.extra?.apiUrl || 'http://localhost:4000').replace(/\/$/, '') + '/api';

let token = null;
export async function loadToken() { token = await SecureStore.getItemAsync('token'); return token; }
export async function setToken(t) { token = t; if (t) await SecureStore.setItemAsync('token', t); else await SecureStore.deleteItemAsync('token'); }

export async function api(path, { method = 'GET', body } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = null;
  try { data = await res.json(); } catch { /* empty */ }
  if (!res.ok) {
    const err = new Error(data?.error || `Request failed (${res.status})`);
    err.status = res.status;
    throw err;
  }
  return data;
}

export const q = (obj) => Object.entries(obj).filter(([, v]) => v != null && v !== '').map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&');
