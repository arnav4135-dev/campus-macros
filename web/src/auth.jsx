import React, { createContext, useContext, useEffect, useState } from 'react';
import { api, getToken, setToken } from './api';

const Ctx = createContext(null);
export function AuthProvider({ children }) {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState(null);
  const [needsProfile, setNeedsProfile] = useState(false);
  const [campus, setCampus] = useState(null);

  useEffect(() => {
    (async () => {
      if (getToken()) {
        try { const { profile, campus } = await api('/profile'); setUser({}); setNeedsProfile(!profile); setCampus(campus); }
        catch { setToken(null); }
      }
      setReady(true);
    })();
  }, []);

  const finish = async (d) => { setToken(d.token); setUser(d.user); setNeedsProfile(d.needsProfile); if (!d.needsProfile) setCampus((await api('/profile')).campus); };
  const value = {
    ready, user, needsProfile, campus, setCampus,
    register: (email, password) => api('/auth/register', { method: 'POST', body: { email, password } }).then(finish),
    login: (email, password) => api('/auth/login', { method: 'POST', body: { email, password } }).then(finish),
    logout: () => { setToken(null); setUser(null); },
    profileDone: async () => { setNeedsProfile(false); setCampus((await api('/profile')).campus); },
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
export const useAuth = () => useContext(Ctx);
