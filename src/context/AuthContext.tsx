import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { getUserByLogin } from '../store';

interface AuthContextType {
  user: User | null;
  login: (loginName: string, password?: string) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const savedUserId = localStorage.getItem('auth_user_id');
    if (savedUserId) {
      // In a real app we'd fetch by ID, but since our store has getUserByLogin we can just fetch all users or adjust
      // Let's just store the login string for simplicity
      const savedLogin = localStorage.getItem('auth_user_login');
      if (savedLogin) {
        const u = getUserByLogin(savedLogin);
        if (u) setUser(u);
      }
    }
  }, []);

  const login = (loginName: string, password?: string) => {
    const u = getUserByLogin(loginName);
    if (u && (!u.password || u.password === password)) {
      setUser(u);
      localStorage.setItem('auth_user_id', u.id);
      localStorage.setItem('auth_user_login', u.login);
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('auth_user_id');
    localStorage.removeItem('auth_user_login');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
