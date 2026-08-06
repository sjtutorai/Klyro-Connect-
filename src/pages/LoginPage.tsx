import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { auth } from '../lib/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { GraduationCap, Mail, Lock, ArrowRight, Loader2, AlertCircle, Shield, Building2, Users, UserCircle, Eye, EyeOff } from 'lucide-react';
import { motion } from 'motion/react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      switch (user.role) {
        case 'SUPER_ADMIN': navigate('/dashboard/super-admin'); break;
        case 'INSTITUTION': navigate('/dashboard/institution'); break;
        case 'TEACHER': navigate('/dashboard/teacher'); break;
        case 'STUDENT': navigate('/dashboard/student'); break;
        default: navigate('/dashboard');
      }
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
      setIsLoading(false);
    }
  };

  const handleQuickLogin = (roleEmail: string) => {
    setEmail(roleEmail);
    setPassword('password123');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden selection:bg-indigo-500 selection:text-white">
      
      {/* Background glow effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-indigo-600/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 right-10 w-[400px] h-[300px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center space-y-3">
        <Link to="/" className="inline-flex items-center gap-3">
          <div className="bg-gradient-to-tr from-indigo-600 to-indigo-500 p-3 rounded-2xl shadow-xl shadow-indigo-600/20">
            <GraduationCap className="h-8 w-8 text-white" />
          </div>
          <span className="text-2xl font-black tracking-tight text-white">
            VAKS <span className="text-indigo-400">AI</span>
          </span>
        </Link>
        <h2 className="text-3xl font-extrabold text-white tracking-tight">
          Sign in to Campus OS
        </h2>
        <p className="text-xs text-slate-400">
          Enter your credentials or click a quick-demo account below
        </p>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4 sm:px-0"
      >
        <div className="bg-slate-900/90 backdrop-blur-xl py-8 px-6 sm:px-10 shadow-2xl rounded-3xl border border-slate-800">
          
          {error && (
            <div className="mb-6 bg-rose-950/80 border border-rose-800/80 text-rose-300 px-4 py-3 rounded-2xl flex items-center gap-3 text-xs font-semibold">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-slate-800 rounded-xl bg-slate-950 text-white placeholder-slate-500 focus:border-indigo-500 text-sm font-medium outline-none transition"
                  placeholder="admin@vaks.ai"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-10 py-3 border border-slate-800 rounded-xl bg-slate-950 text-white placeholder-slate-500 focus:border-indigo-500 text-sm font-medium outline-none transition"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 cursor-pointer text-slate-400 hover:text-slate-200">
                <input
                  type="checkbox"
                  className="rounded border-slate-700 bg-slate-950 text-indigo-600 focus:ring-indigo-500"
                />
                Remember me
              </label>

              <a href="#" className="font-semibold text-indigo-400 hover:underline">
                Forgot password?
              </a>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 px-4 rounded-xl shadow-lg shadow-indigo-600/30 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 transition-all flex justify-center items-center gap-2 disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>Sign In to Dashboard <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>

          {/* Quick Demo Login Chips */}
          <div className="mt-8 pt-6 border-t border-slate-800/80 space-y-3">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 text-center">
              Quick 1-Click Role Login Shortcuts
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('superadmin@vaks.ai')}
                className="p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-left transition flex items-center gap-2"
              >
                <Shield className="w-4 h-4 text-purple-400 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white truncate">Super Admin</p>
                  <p className="text-[10px] text-slate-500 truncate">Platform Control</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('institution@vaks.ai')}
                className="p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-left transition flex items-center gap-2"
              >
                <Building2 className="w-4 h-4 text-indigo-400 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white truncate">Institution</p>
                  <p className="text-[10px] text-slate-500 truncate">School Management</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('teacher@vaks.ai')}
                className="p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-left transition flex items-center gap-2"
              >
                <Users className="w-4 h-4 text-emerald-400 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white truncate">Faculty / Teacher</p>
                  <p className="text-[10px] text-slate-500 truncate">Classes & Grading</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('student@vaks.ai')}
                className="p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-left transition flex items-center gap-2"
              >
                <UserCircle className="w-4 h-4 text-sky-400 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white truncate">Student</p>
                  <p className="text-[10px] text-slate-500 truncate">Homework & Events</p>
                </div>
              </button>
            </div>
          </div>

        </div>
      </motion.div>
    </div>
  );
}
