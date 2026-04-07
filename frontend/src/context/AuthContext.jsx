/**
 * Authentication context.
 *
 * Provides:
 *  - user: decoded JWT payload (or null)
 *  - token: raw JWT string (or null)
 *  - login(token): store token and decode user
 *  - logout(): clear token and user
 *  - isAuthenticated: boolean
 *
 * Implemented fully in Task 13.2.
 */

import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // Decode synchronously so user is available on first render
  function decodeToken(jwt) {
    try {
      const payload = JSON.parse(atob(jwt.split('.')[1]));
      if (payload.exp && payload.exp * 1000 < Date.now()) return null;
      return payload;
    } catch {
      return null;
    }
  }

  const storedToken = localStorage.getItem('taptrust_token');
  const initialUser = storedToken ? decodeToken(storedToken) : null;

  // If stored token is expired, clear it immediately
  if (storedToken && !initialUser) {
    localStorage.removeItem('taptrust_token');
  }

  const [token, setToken] = useState(initialUser ? storedToken : null);
  const [user, setUser] = useState(initialUser);

  function login(newToken) {
    localStorage.setItem('taptrust_token', newToken);
    setToken(newToken);
    setUser(decodeToken(newToken)); // set synchronously to avoid flicker
  }

  function logout() {
    localStorage.removeItem('taptrust_token');
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        isAuthenticated: !!token && !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export default AuthContext;
