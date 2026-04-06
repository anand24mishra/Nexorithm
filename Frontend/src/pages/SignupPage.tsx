import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../api/authApi';
import {useAuth0} from "@auth0/auth0-react";
export function SignupPage() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();
  const { loginWithRedirect } = useAuth0();
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await authApi.register(username, email, password);
      login(res.token, res.user.username);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-on-surface flex flex-col items-center justify-center font-body">
      <div className="w-full max-w-md p-8 bg-surface-container-low rounded-3xl border border-outline-variant/30 shadow-2xl">
        <h1 className="text-3xl font-black tracking-tight mb-2 text-center text-primary-container">Nexorithm</h1>
        <p className="text-sm text-on-surface-variant text-center mb-8">Create your developer account</p>
        
        {error && (
          <div className="mb-4 text-sm font-medium text-error bg-error/10 p-3 rounded-lg text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant ml-1">Username</span>
            <input 
              type="text" 
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="px-4 py-3 bg-surface-container rounded-xl border border-outline-variant/20 focus:border-primary focus:outline-none transition-all placeholder:text-outline"
              placeholder="algo_master"
              required 
            />
          </label>
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
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
          <button 
            type="button" 
            onClick={() => loginWithRedirect({ authorizationParams: { screen_hint: "signup" } })}
            className="mt-2 w-full py-3.5 rounded-xl bg-secondary-container text-on-secondary-container font-extrabold tracking-wide hover:bg-secondary-fixed-dim transition-all active:scale-[0.98]"
           >
            Sign up with Auth0
          </button>
        </form>
        
        <p className="mt-8 text-center text-sm text-on-surface-variant">
          Already have an account?{' '}
          <Link to="/login" className="text-primary font-bold hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
