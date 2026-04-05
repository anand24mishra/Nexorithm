import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../api/authApi';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await authApi.login(email, password);
      // res contains { token, user: { username } }
      login(res.token, res.user.username);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-on-surface flex flex-col items-center justify-center font-body">
      <div className="w-full max-w-md p-8 bg-surface-container-low rounded-3xl border border-outline-variant/30 shadow-2xl">
        <h1 className="text-3xl font-black tracking-tight mb-2 text-center text-primary-container">Nexorithm</h1>
        <p className="text-sm text-on-surface-variant text-center mb-8">Sign in to your account</p>
        
        {error && (
          <div className="mb-4 text-sm font-medium text-error bg-error/10 p-3 rounded-lg text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant ml-1">Email</span>
            <input 
              type="email" 
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="px-4 py-3 bg-surface-container rounded-xl border border-outline-variant/20 focus:border-primary focus:outline-none transition-all placeholder:text-outline"
              placeholder="you@example.com"
              required 
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant ml-1">Password</span>
            <input 
              type="password" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="px-4 py-3 bg-surface-container rounded-xl border border-outline-variant/20 focus:border-primary focus:outline-none transition-all placeholder:text-outline"
              placeholder="••••••••"
              required 
            />
          </label>
          <button 
            type="submit" 
            disabled={loading}
            className="mt-4 w-full py-3.5 rounded-xl bg-primary-container text-on-primary-container font-extrabold tracking-wide hover:bg-primary-fixed-dim transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        
        <p className="mt-8 text-center text-sm text-on-surface-variant">
          Don't have an account?{' '}
          <Link to="/signup" className="text-primary font-bold hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
