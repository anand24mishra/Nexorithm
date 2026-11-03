import { AuthContext } from './authState';
import type { AuthState } from './authState';
import React, { useState, useEffect, useCallback } from "react";
import {
  getAuthToken,
  setAuthToken as setTokenStorage,
  removeAuthToken,
  authApi,
} from "../api/authApi";

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
  const login = useCallback((token: string, username: string) => {
    setTokenStorage(token);
    setAuthState({ token, isAuthenticated: true, username, isReady: true });
  }, []);

  const logout = useCallback(() => {
    removeAuthToken();
    setAuthState({
      token: null,
      isAuthenticated: false,
      username: null,
      isReady: true,
    });
  }, []);

  const googleLogin = useCallback(async (credential: string) => {
    const res = await authApi.googleLogin(credential);
    setTokenStorage(res.token);
    setAuthState({
      token: res.token,
      isAuthenticated: true,
      username: res.user.username,
      isReady: true,
    });
  }, []);

  return (
    <AuthContext.Provider value={{ ...authState, login, logout, googleLogin }}>
      {children}
    </AuthContext.Provider>
  );
}
