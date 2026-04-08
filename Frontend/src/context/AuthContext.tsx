import React, { createContext, useContext, useState, useEffect } from 'react';
import { getAuthToken, setAuthToken as setTokenStorage, removeAuthToken, authApi } from '../api/authApi';

interface AuthState {
  token: string | null;
  isAuthenticated: boolean;
  username: string | null;
}

interface AuthContextType extends AuthState {
  login: (token: string, username: string) => void;
  logout: () => void;
  // Handles the Google OAuth credential from GIS callback
  googleLogin: (credential: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    token: null,
    isAuthenticated: false,
    username: null,
  });

  // On mount, restore session from localStorage token
  useEffect(() => {
    const token = getAuthToken();
    if (token) {
      try {
        const payloadStr = atob(token.split('.')[1]);
        const payload = JSON.parse(payloadStr);
        setAuthState({
          token,
          isAuthenticated: true,
          username: payload.username || 'User',
        });
      } catch {
        removeAuthToken();
      }
    }

    // Listen for 401 unauthorized events from fetchWithAuth
    const handleUnauthorized = () => {
      setAuthState({ token: null, isAuthenticated: false, username: null });
    };
    window.addEventListener('auth_unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth_unauthorized', handleUnauthorized);
  }, []);

  // Local login — stores token and updates auth state
  const login = (token: string, username: string) => {
    setTokenStorage(token);
    setAuthState({ token, isAuthenticated: true, username });
  };

  // Logout — clears token and auth state
  const logout = () => {
    removeAuthToken();
    setAuthState({ token: null, isAuthenticated: false, username: null });
  };

  // Google OAuth login — sends credential to backend, then stores token
  const googleLogin = async (credential: string) => {
    const res = await authApi.googleLogin(credential);
    setTokenStorage(res.token);
    setAuthState({
      token: res.token,
      isAuthenticated: true,
      username: res.user.username,
    });
  };

  return (
    <AuthContext.Provider value={{ ...authState, login, logout, googleLogin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
