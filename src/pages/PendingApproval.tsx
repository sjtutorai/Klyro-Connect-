import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Clock, ShieldAlert, LogOut, ArrowLeft } from 'lucide-react';
import { motion } from 'motion/react';

export default function PendingApproval() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isRejected = user?.status === 'Rejected';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 text-center shadow-xl shadow-slate-200/20 dark:shadow-black/40"
      >
        <div className="flex justify-center mb-6">
          {isRejected ? (
            <div className="w-20 h-20 bg-rose-50 dark:bg-rose-950/50 rounded-full flex items-center justify-center border-4 border-rose-100 dark:border-rose-900/50">
              <ShieldAlert className="w-10 h-10 text-rose-500" />
            </div>
          ) : (
            <div className="w-20 h-20 bg-amber-50 dark:bg-amber-950/50 rounded-full flex items-center justify-center border-4 border-amber-100 dark:border-amber-900/50">
              <Clock className="w-10 h-10 text-amber-500" />
            </div>
          )}
        </div>

        <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-3">
          {isRejected ? 'Application Declined' : 'Approval Pending'}
        </h1>
        
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
          {isRejected 
            ? 'We are sorry, but your registration request was declined by the institution administrator. Please contact your school for more details.' 
            : 'Your registration request has been submitted successfully and is currently awaiting approval from your institution administrator. You will be able to access the dashboard once approved.'}
        </p>

        <div className="space-y-3">
          <button 
            onClick={() => window.location.reload()}
            className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold transition shadow-md shadow-indigo-600/20"
          >
            Refresh Status
          </button>
          <button 
            onClick={handleLogout}
            className="w-full py-3 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </motion.div>
    </div>
  );
}
