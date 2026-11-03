import { createContext, useContext } from 'react';
export interface AuthState {
  token: string | null;
  isAuthenticated: boolean;
  username: string | null;
  isReady: boolean;
}

export interface AuthContextType extends AuthState {
  login: (token: string, username: string) => void;
  logout: () => void;
  // Handles the Google OAuth credential from GIS callback
  googleLogin: (credential: string) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
