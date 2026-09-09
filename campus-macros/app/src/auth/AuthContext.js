import React, { createContext, useContext, useEffect, useState } from 'react';
import { api, loadToken, setToken } from '../api';

const Ctx = createContext(null);

export function AuthProvider({ children }) {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState(null);
  const [needsProfile, setNeedsProfile] = useState(false);

  useEffect(() => {
    (async () => {
      const t = await loadToken();
      if (t) {
        try {
          const { profile } = await api('/profile');
          setUser({});
          setNeedsProfile(!profile);
        } catch { await setToken(null); }
      }
      setReady(true);
    })();
  }, []);

  const finish = async (data) => { await setToken(data.token); setUser(data.user); setNeedsProfile(data.needsProfile); };
  const value = {
    ready, user, needsProfile,
    register: (email, password) => api('/auth/register', { method: 'POST', body: { email, password } }).then(finish),
    login: (email, password) => api('/auth/login', { method: 'POST', body: { email, password } }).then(finish),
    logout: async () => { await setToken(null); setUser(null); },
    profileDone: () => setNeedsProfile(false),
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useAuth = () => useContext(Ctx);
