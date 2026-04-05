import React, { createContext, useContext, useState, useEffect } from 'react';
import { getAuthToken, setAuthToken as setTokenStorage, removeAuthToken } from '../api/authApi';

interface AuthState {
  token: string | null;
  isAuthenticated: boolean;
  username: string | null;
}

interface AuthContextType extends AuthState {
  login: (token: string, username: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    token: null,
    isAuthenticated: false,
    username: null,
  });

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

    const handleUnauthorized = () => {
      setAuthState({ token: null, isAuthenticated: false, username: null });
    };
    window.addEventListener('auth_unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth_unauthorized', handleUnauthorized);
  }, []);

  const login = (token: string, username: string) => {
    setTokenStorage(token);
    setAuthState({ token, isAuthenticated: true, username });
  };

  const logout = () => {
    removeAuthToken();
    setAuthState({ token: null, isAuthenticated: false, username: null });
  };

  return (
    <AuthContext.Provider value={{ ...authState, login, logout }}>
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
