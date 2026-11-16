import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('storyforge_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('storyforge_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('storyforge_token');
      if (storedToken) {
        try {
          const profile = await authService.getCurrentUser();
          setUser(profile);
          localStorage.setItem('storyforge_user', JSON.stringify(profile));
        } catch (err) {
          console.warn('Session expired or invalid:', err);
          logout();
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = async (email, password) => {
    const data = await authService.login(email, password);
    setToken(data.access_token);
    setUser(data.user);
    localStorage.setItem('storyforge_token', data.access_token);
    localStorage.setItem('storyforge_user', JSON.stringify(data.user));
    return data;
  };

  const register = async (fullName, email, password) => {
    const data = await authService.register(fullName, email, password);
    setToken(data.access_token);
    setUser(data.user);
    localStorage.setItem('storyforge_token', data.access_token);
    localStorage.setItem('storyforge_user', JSON.stringify(data.user));
    return data;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('storyforge_token');
    localStorage.removeItem('storyforge_user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        loading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};
