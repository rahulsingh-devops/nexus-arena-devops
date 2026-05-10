import React, { useState, FormEvent } from 'react';

interface LoginProps {
  onLogin: (user: { id: string; username: string; token: string }) => void;
}

const API_URL = import.meta.env.VITE_BACKEND_URL || '';

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';
      const res = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      onLogin({ id: data.id, username: data.username, token: data.token });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full h-full flex items-center justify-center bg-arena-darker bg-grid relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-nexus-600/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-arena-accent/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="relative z-10 w-full max-w-md px-4 animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-10">
          <h1 className="font-display text-5xl font-black tracking-wider text-white glow-text mb-2">
            NEXUS
          </h1>
          <h2 className="font-display text-2xl font-bold tracking-[0.3em] text-nexus-400">
            ARENA
          </h2>
          <p className="mt-4 text-gray-400 text-sm tracking-wide">
            MULTIPLAYER ARENA SHOOTER
          </p>
        </div>

        {/* Form */}
        <div className="glass-panel-strong p-8">
          <h3 className="text-xl font-semibold text-white mb-6 text-center">
            {isRegister ? 'Create Account' : 'Sign In'}
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="login-username" className="block text-sm font-medium text-gray-400 mb-1.5">
                Username
              </label>
              <input
                id="login-username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="input-field"
                placeholder="Enter your callsign"
                required
                minLength={3}
                maxLength={20}
                autoComplete="username"
              />
            </div>

            <div>
              <label htmlFor="login-password" className="block text-sm font-medium text-gray-400 mb-1.5">
                Password
              </label>
              <input
                id="login-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                placeholder="••••••••"
                required
                minLength={6}
                autoComplete={isRegister ? 'new-password' : 'current-password'}
              />
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm animate-slide-up">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>{isRegister ? 'CREATE ACCOUNT' : 'ENTER ARENA'}</span>
                  <span className="text-lg">→</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => { setIsRegister(!isRegister); setError(''); }}
              className="text-sm text-gray-400 hover:text-nexus-400 transition-colors"
            >
              {isRegister ? 'Already have an account? Sign in' : "Don't have an account? Register"}
            </button>
          </div>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-gray-600">
          NEXUS ARENA v1.0 — 2026
        </p>
      </div>
    </div>
  );
};

export default Login;
