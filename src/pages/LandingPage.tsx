import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GraduationCap, ShieldCheck, Users, BookOpen, UserCircle, CheckCircle2, Loader2, X, Building2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

export default function LandingPage() {
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    email: '',
    phone: '',
    password: ''
  });
  
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'institutions'), {
        ...formData,
        status: 'Pending',
        studentsCount: 0,
        teachersCount: 0,
        createdAt: serverTimestamp()
      });
      alert('School registered successfully! An administrator will review your request.');
      setShowRegisterModal(false);
      setFormData({ name: '', address: '', email: '', phone: '', password: '' });
    } catch (error) {
      console.error("Error registering school:", error);
      alert("Failed to register school.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-4 sm:px-8 h-20 bg-white border-b border-slate-200 shrink-0 shadow-sm fixed top-0 w-full z-50">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-800">
            VAKS <span className="text-indigo-600">AI</span>
          </span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
          <a href="#features" className="hover:text-indigo-600 transition-colors">Features</a>
          <a href="#stats" className="hover:text-indigo-600 transition-colors">Impact</a>
          <div className="flex items-center gap-4">
            <Link to="/login" className="px-5 py-2 bg-slate-100 rounded-full hover:bg-slate-200 text-slate-800 transition-colors">Login</Link>
            <button onClick={() => setShowRegisterModal(true)} className="px-5 py-2 bg-indigo-600 rounded-full text-white hover:bg-indigo-700 transition-colors">Register a School</button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center pt-32 pb-24 px-4 sm:px-12">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center max-w-3xl mb-16"
        >
          <span className="px-4 py-1.5 bg-indigo-50 text-indigo-700 text-xs font-bold uppercase tracking-widest rounded-full border border-indigo-100 mb-6 inline-block">
            All-in-One Digital Campus
          </span>
          <h1 className="text-5xl md:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.1] mb-6">
            The Complete Digital <br className="hidden sm:block" />
            <span className="text-indigo-600">Campus Management</span> Platform
          </h1>
          <p className="text-xl text-slate-500 leading-relaxed mb-8">
            VAKS AI bridges the gap between institutions, teachers, students, and administrators with one intelligent ecosystem designed for the modern era of education.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link to="/login" className="px-8 py-3 bg-indigo-600 text-white rounded-full font-semibold hover:bg-indigo-700 transition-colors shadow-sm">
              Get Started
            </Link>
            <button onClick={() => setShowRegisterModal(true)} className="px-8 py-3 bg-white text-indigo-600 border border-indigo-200 rounded-full font-semibold hover:bg-indigo-50 transition-colors shadow-sm">
              Register a School
            </button>
          </div>
        </motion.div>

        {/* Features */}
        <div id="features" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-6xl mt-8">
          <FeatureCard 
            icon={<ShieldCheck className="w-6 h-6" />}
            title="Super Admin"
            color="purple"
            features={['Platform Analytics', 'Institutional Oversight', 'System Security']}
          />
          <FeatureCard 
            icon={<Users className="w-6 h-6" />}
            title="Institution"
            color="blue"
            ring={true}
            features={['Staff Management', 'Events & Notices', 'Performance Reports']}
          />
          <FeatureCard 
            icon={<BookOpen className="w-6 h-6" />}
            title="Teacher"
            color="emerald"
            features={['Attendance Tracking', 'Homework Hub', 'Interactive Timetables']}
          />
          <FeatureCard 
            icon={<UserCircle className="w-6 h-6" />}
            title="Student"
            color="amber"
            features={['Academic Progress', 'Learning Resources', 'Campus Engagement']}
          />
        </div>
      </main>

      {/* Footer / Stats */}
      <footer id="stats" className="bg-slate-900 py-8 md:h-24 md:py-0 flex flex-col md:flex-row items-center justify-between px-4 sm:px-12 shrink-0 gap-8 md:gap-0">
        <div className="flex items-center gap-6 md:gap-12 w-full md:w-auto justify-between md:justify-start">
          <div className="flex flex-col text-center md:text-left">
            <span className="text-indigo-400 text-2xl font-bold leading-none mb-1">150+</span>
            <span className="text-slate-400 text-xs uppercase tracking-widest font-semibold">Institutions</span>
          </div>
          <div className="flex flex-col text-center md:text-left">
            <span className="text-indigo-400 text-2xl font-bold leading-none mb-1">45.2k</span>
            <span className="text-slate-400 text-xs uppercase tracking-widest font-semibold">Active Users</span>
          </div>
          <div className="flex flex-col text-center md:text-left">
            <span className="text-indigo-400 text-2xl font-bold leading-none mb-1">1.2M</span>
            <span className="text-slate-400 text-xs uppercase tracking-widest font-semibold">Homework Sent</span>
          </div>
        </div>
        
        <div className="flex gap-6 text-slate-400 text-sm">
          <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
          <a href="#" className="hover:text-white transition-colors">Support Hub</a>
        </div>
      </footer>

      <AnimatePresence>
        {showRegisterModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
              onClick={() => setShowRegisterModal(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-8 max-w-md w-full relative z-10 shadow-xl"
            >
              <button 
                onClick={() => setShowRegisterModal(false)}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center">
                  <Building2 className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">Register Institution</h2>
              </div>
              
              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Institution Name</label>
                  <input 
                    type="text" 
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none" 
                    placeholder="e.g. Springfield High" 
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
                  <input 
                    type="text" 
                    required
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none" 
                    placeholder="Full street address..." 
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Contact Email</label>
                  <input 
                    type="email" 
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none" 
                    placeholder="admin@school.com" 
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
                  <input 
                    type="tel" 
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none" 
                    placeholder="+1 (555) 000-0000" 
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                  <input 
                    type="password" 
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none" 
                    placeholder="Create a password" 
                  />
                </div>

                <button 
                  type="submit" 
                  disabled={isSubmitting} 
                  className="w-full py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition flex items-center justify-center gap-2 mt-6"
                >
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                  Submit Registration
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

const FeatureCard = ({ icon, title, features, color, ring = false }: { icon: React.ReactNode, title: string, features: string[], color: 'purple' | 'blue' | 'emerald' | 'amber', ring?: boolean }) => {
  const colorMap = {
    purple: { bg: 'bg-purple-100', text: 'text-purple-600', dot: 'bg-purple-400' },
    blue: { bg: 'bg-blue-100', text: 'text-blue-600', dot: 'bg-blue-400' },
    emerald: { bg: 'bg-emerald-100', text: 'text-emerald-600', dot: 'bg-emerald-400' },
    amber: { bg: 'bg-amber-100', text: 'text-amber-600', dot: 'bg-amber-400' },
  };
  
  const c = colorMap[color];

  return (
    <div className={`bg-white p-6 rounded-3xl border border-slate-200 shadow-md flex flex-col gap-4 ${ring ? 'ring-2 ring-indigo-600/10' : ''}`}>
      <div className={`w-12 h-12 ${c.bg} ${c.text} rounded-2xl flex items-center justify-center`}>
        {icon}
      </div>
      <h3 className="font-bold text-lg text-slate-900">{title}</h3>
      <ul className="text-sm text-slate-500 space-y-3">
        {features.map((feature, i) => (
          <li key={i} className="flex items-center gap-2">
            <span className={`w-1.5 h-1.5 ${c.dot} rounded-full`}></span>
            {feature}
          </li>
        ))}
      </ul>
    </div>
  );
};
