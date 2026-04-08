const rawApiBase = import.meta.env.VITE_API_BASE_URL?.trim() || 'http://localhost:5001/api';
export const API_BASE = rawApiBase.endsWith('/') ? rawApiBase.slice(0, -1) : rawApiBase;

export function getAuthToken(): string | null {
  return localStorage.getItem('nx_token');
}

export function setAuthToken(token: string): void {
  localStorage.setItem('nx_token', token);
}

export function removeAuthToken(): void {
  localStorage.removeItem('nx_token');
}

export async function fetchWithAuth(url: string, options: RequestInit = {}, skipAuthRedirect = false): Promise<Response> {
  const token = getAuthToken();
  const headers = new Headers(options.headers || {});
  
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers,
  });

  if (response.status === 401 && !skipAuthRedirect) {
    removeAuthToken();
    window.dispatchEvent(new Event('auth_unauthorized'));
  }

  return response;
}

export const authApi = {
  // Local email/password login
  async login(email: string, password: string) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');
    return data;
  },

  // Local email/password registration
  async register(username: string, email: string, password: string) {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Registration failed');
    return data;
  },

  // Google OAuth login — sends the Google ID token to backend for verification
  async googleLogin(credential: string) {
    const res = await fetch(`${API_BASE}/auth/google-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credential }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Google login failed');
    return data;
  }
};
