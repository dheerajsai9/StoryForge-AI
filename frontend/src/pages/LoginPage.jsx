import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Sparkles, ArrowRight, AlertCircle, Lock, Mail } from 'lucide-react';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid email or password. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-flex items-center gap-2">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-500/30">
            <Sparkles className="w-6 h-6" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-white">
            StoryForge <span className="text-blue-400">AI</span>
          </span>
        </Link>
        <h2 className="mt-6 text-center text-2xl font-bold tracking-tight text-white">
          Sign in to your account
        </h2>
        <p className="mt-2 text-center text-sm text-slate-400">
          Or{' '}
          <Link to="/register" className="font-medium text-blue-400 hover:text-blue-300">
            create a new account for free
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-slate-950 py-8 px-6 shadow-2xl rounded-2xl sm:px-10 border border-slate-800">
          {error && (
            <div className="mb-6 rounded-lg bg-rose-500/10 border border-rose-500/30 p-3.5 flex items-center gap-2.5 text-xs text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="scrum_master@company.com"
                  className="w-full rounded-lg bg-slate-900 border border-slate-700 py-2.5 pl-10 pr-3 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                />
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-lg bg-slate-900 border border-slate-700 py-2.5 pl-10 pr-3 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                />
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-md shadow-blue-500/20 transition disabled:opacity-50"
            >
              <span>{submitting ? 'Authenticating...' : 'Sign In'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Credentials Help */}
          <div className="mt-6 pt-5 border-t border-slate-800 text-center">
            <span className="text-xs text-slate-500">
              New here? You can register with any email & password immediately!
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
