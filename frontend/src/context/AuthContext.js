import { createContext, useContext, useState, useCallback } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user')) || null; } catch { return null; }
  });

  const login = useCallback((userData) => {
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('user');
    setUser(null);
  }, []);

  const isSuperAdmin = Boolean(user?.isSuperAdmin || user?.role === 'SuperAdmin' || (user?.role === 'Admin' && !user?.companyId));
  const companyId = typeof user?.companyId === 'object' ? user.companyId?._id : user?.companyId;

  return <AuthContext.Provider value={{ user, login, logout, isSuperAdmin, companyId }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
