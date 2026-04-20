import React, { createContext, useContext, useState, useEffect } from "react";
import {
  getAuthToken,
  setAuthToken as setTokenStorage,
  removeAuthToken,
  authApi,
} from "../api/authApi";

interface AuthState {
  token: string | null;
  isAuthenticated: boolean;
  username: string | null;
  isReady: boolean;
}

interface AuthContextType extends AuthState {
  login: (token: string, username: string) => void;
  logout: () => void;
  // Handles the Google OAuth credential from GIS callback
  googleLogin: (credential: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  const parts = token.split(".");
  if (parts.length < 2) return null;

  // JWT uses base64url (RFC 7515). Convert to base64 for atob.
  const base64Url = parts[1];
  const base64 = base64Url
    .replace(/-/g, "+")
    .replace(/_/g, "/")
    .padEnd(Math.ceil(base64Url.length / 4) * 4, "=");
  try {
    const payloadStr = atob(base64);
    return JSON.parse(payloadStr);
  } catch {
    return null;
  }
}

function getInitialAuthState(): AuthState {
  const token = getAuthToken();
  if (!token) {
    return {
      token: null,
      isAuthenticated: false,
      username: null,
      isReady: true,
    };
  }

  const payload = decodeJwtPayload(token);
  const username =
    typeof payload?.username === "string" ? payload.username : null;

  // If payload decode fails, don't log the user out here; let the API validate.
  return { token, isAuthenticated: true, username, isReady: true };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>(getInitialAuthState);

  // Listen for 401 unauthorized events from fetchWithAuth
  useEffect(() => {
    const handleUnauthorized = () => {
      removeAuthToken();
      setAuthState({
        token: null,
        isAuthenticated: false,
        username: null,
        isReady: true,
      });
    };
    window.addEventListener("auth_unauthorized", handleUnauthorized);
    return () =>
      window.removeEventListener("auth_unauthorized", handleUnauthorized);
  }, []);

  // Local login — stores token and updates auth state
  const login = (token: string, username: string) => {
    setTokenStorage(token);
    setAuthState({ token, isAuthenticated: true, username, isReady: true });
  };

  // Logout — clears token and auth state
  const logout = () => {
    removeAuthToken();
    setAuthState({
      token: null,
      isAuthenticated: false,
      username: null,
      isReady: true,
    });
  };

  // Google OAuth login — sends credential to backend, then stores token
  const googleLogin = async (credential: string) => {
    const res = await authApi.googleLogin(credential);
    setTokenStorage(res.token);
    setAuthState({
      token: res.token,
      isAuthenticated: true,
      username: res.user.username,
      isReady: true,
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
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
