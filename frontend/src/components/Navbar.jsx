import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { requirementService } from '../services/api';
import { 
  Sparkles, 
  Cpu, 
  User, 
  LogOut, 
  FolderKanban, 
  AlertCircle,
  CheckCircle2,
  Menu
} from 'lucide-react';

export const Navbar = ({ onToggleSidebar }) => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [aiStatus, setAiStatus] = useState({ available: false, loading: true });

  useEffect(() => {
    let isMounted = true;
    const checkAi = async () => {
      try {
        const status = await requirementService.checkAiStatus();
        if (isMounted) setAiStatus({ ...status, loading: false });
      } catch (err) {
        if (isMounted) setAiStatus({ available: false, loading: false });
      }
    };
    checkAi();
    const interval = setInterval(checkAi, 30000); // Check every 30s
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 text-white shadow-sm">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6">
        {/* Left: Hamburger + Logo */}
        <div className="flex items-center gap-3">
          {isAuthenticated && (
            <button
              onClick={onToggleSidebar}
              className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              aria-label="Toggle navigation"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          <Link to={isAuthenticated ? "/dashboard" : "/"} className="flex items-center gap-2 group">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-blue-600 group-hover:bg-blue-500 transition shadow-md shadow-blue-500/20 text-white font-black text-lg">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
                StoryForge <span className="text-blue-400">AI</span>
              </span>
            </div>
          </Link>
        </div>

        {/* Center / Right info: Ollama Status Badge + Auth Navigation */}
        <div className="flex items-center gap-4">
          {/* Local Ollama Status */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/80 border border-slate-700 text-xs">
            <Cpu className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-slate-300 font-medium">Ollama:</span>
            {aiStatus.loading ? (
              <span className="text-slate-400">Checking...</span>
            ) : aiStatus.available ? (
              <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold">
                <CheckCircle2 className="w-3 h-3" /> Online ({aiStatus.current_model || 'ready'})
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-amber-400 font-medium" title={aiStatus.error || "Ollama offline"}>
                <AlertCircle className="w-3 h-3" /> Offline (localhost:11434)
              </span>
            )}
          </div>

          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <div className="hidden md:flex flex-col text-right">
                <span className="text-sm font-semibold text-white">{user?.full_name || 'Agile Engineer'}</span>
                <span className="text-xs text-slate-400">{user?.email}</span>
              </div>

              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-700 transition"
                title="Sign out"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="px-3.5 py-1.5 rounded-lg text-sm font-semibold text-slate-200 hover:text-white hover:bg-slate-800 transition"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="px-4 py-1.5 rounded-lg text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-sm transition"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
