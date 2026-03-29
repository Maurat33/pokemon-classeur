import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

const AuthContext = createContext(null);

// Create a shared axios instance with auto-refresh
const authApi = axios.create({ baseURL: API_URL, withCredentials: true });

let isRefreshing = false;
let refreshQueue = [];

authApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url.includes('/auth/refresh')) {
      originalRequest._retry = true;

      if (!isRefreshing) {
        isRefreshing = true;
        try {
          await axios.post(`${API_URL}/api/auth/refresh`, {}, { withCredentials: true });
          isRefreshing = false;
          // Retry queued requests
          refreshQueue.forEach(cb => cb());
          refreshQueue = [];
          return authApi(originalRequest);
        } catch {
          isRefreshing = false;
          refreshQueue = [];
          return Promise.reject(error);
        }
      } else {
        // Queue this request until refresh completes
        return new Promise((resolve) => {
          refreshQueue.push(() => resolve(authApi(originalRequest)));
        });
      }
    }
    return Promise.reject(error);
  }
);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    try {
      const { data } = await authApi.get('/api/auth/me');
      setUser(data);
    } catch {
      setUser(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = async (email, password) => {
    const { data } = await authApi.post('/api/auth/login', { email, password });
    setUser(data);
    return data;
  };

  const register = async (email, password, name) => {
    const { data } = await authApi.post('/api/auth/register', { email, password, name });
    setUser(data);
    return data;
  };

  const logout = async () => {
    await authApi.post('/api/auth/logout', {});
    setUser(false);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
