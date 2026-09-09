import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { loginApi, setAuthToken, getAuthToken, getMeApi } from '../services/api';
import { syncWithServer, clearStoreOnLogout } from '../store';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (loginName: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('auth_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  });
  const [loading, setLoading] = useState(true);

  const logout = () => {
    setUser(null);
    setAuthToken(null);
    localStorage.removeItem('auth_user');
    localStorage.removeItem('auth_user_id');
    localStorage.removeItem('auth_user_login');
    clearStoreOnLogout();
  };

  useEffect(() => {
    const token = getAuthToken();
    if (token) {
      getMeApi()
        .then(res => {
          if (res && res.user) {
            setUser(res.user);
            localStorage.setItem('auth_user', JSON.stringify(res.user));
            localStorage.setItem('auth_user_id', res.user.id);
            localStorage.setItem('auth_user_login', res.user.login);
            syncWithServer().catch(() => {});
          } else {
            logout();
          }
        })
        .catch(() => {
          logout();
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }

    const handleUnauthorized = () => {
      logout();
    };
    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, []);

  const login = async (loginName: string, password?: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await loginApi(loginName, password);
      if (res.success && res.user) {
        setUser(res.user);
        localStorage.setItem('auth_user', JSON.stringify(res.user));
        localStorage.setItem('auth_user_id', res.user.id);
        localStorage.setItem('auth_user_login', res.user.login);
        if (res.token) {
          setAuthToken(res.token);
        }
        await syncWithServer().catch(() => {});
        return { success: true };
      }
      return { success: false, error: 'Неверный логин или пароль' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Ошибка авторизации' };
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
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
