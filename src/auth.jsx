import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api, setToken, hasToken } from './api.js';

const Ctx = createContext(null);
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(hasToken());

  const refresh = useCallback(async () => {
    try { setUser((await api('/auth/me')).user); } catch { setUser(null); } finally { setLoading(false); }
  }, []);

  useEffect(() => { if (hasToken()) refresh(); }, [refresh]);

  const enter = ({ token, user }) => { setToken(token); setUser(user); };
  const login = async (email, password) => enter(await api('/auth/login', { method: 'POST', body: { email, password } }));
  const register = async (form) => enter(await api('/auth/register', { method: 'POST', body: form }));
  const logout = () => { setToken(null); setUser(null); };

  return <Ctx.Provider value={{ user, loading, login, register, logout, refresh, setUser }}>{children}</Ctx.Provider>;
}
