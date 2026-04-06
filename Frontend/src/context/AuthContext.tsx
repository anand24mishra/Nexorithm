import React, { createContext, useContext, useState, useEffect } from 'react';
import { getAuthToken, setAuthToken as setTokenStorage, removeAuthToken, authApi } from '../api/authApi';
import { useAuth0 } from '@auth0/auth0-react';

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

  const { isAuthenticated: isAuth0Authenticated, user: auth0User, isLoading: isAuth0Loading, logout: auth0Logout } = useAuth0();

  useEffect(() => {
    const syncAuth0 = async () => {
      // If Auth0 is authenticated but our local backend auth is NOT yet authenticated, we trigger backend login!
      if (!isAuth0Loading && isAuth0Authenticated && auth0User && auth0User.email && !authState.isAuthenticated) {
        try {
          const res = await authApi.auth0Login(
            auth0User.email,
            auth0User.name || '',
            auth0User.sub || ''
          );
          setTokenStorage(res.token);
          setAuthState({ token: res.token, isAuthenticated: true, username: res.user.username });
        } catch (err) {
          console.error('Failed to sync Auth0 login with backend:', err);
        }
      }
    };
    syncAuth0();
  }, [isAuth0Authenticated, auth0User, authState.isAuthenticated, isAuth0Loading, auth0Logout]);

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
    if (isAuth0Authenticated) {
      auth0Logout({ logoutParams: { returnTo: window.location.origin } });
    }
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
