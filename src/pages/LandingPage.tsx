import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  GraduationCap, ShieldCheck, Users, BookOpen, UserCircle, 
  CheckCircle2, Loader2, X, Building2, Sparkles, ArrowRight,
  Zap, Calendar, Bell, Shield, Layers, Layout
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, addDoc, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../lib/firebase';

export default function LandingPage() {
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'INSTITUTION' | 'TEACHER' | 'STUDENT'>('INSTITUTION');
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    email: '',
    phone: '',
    website: '',
    principalName: '',
    password: ''
  });
  
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // 1. Create Auth user
      const userCred = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const uid = userCred.user.uid;

      // 2. Create Institution Document
      const instRef = await addDoc(collection(db, 'institutions'), {
        name: formData.name,
        address: formData.address,
        email: formData.email,
        phone: formData.phone,
        website: formData.website,
        principalName: formData.principalName,
        adminUid: uid,
        status: 'Pending',
        studentsCount: 0,
        teachersCount: 0,
        createdAt: serverTimestamp()
      });

      // 3. Create User Document
      await setDoc(doc(db, 'users', uid), {
        name: formData.principalName,
        email: formData.email,
        role: 'INSTITUTION',
        institutionId: instRef.id,
        institutionName: formData.name,
        status: 'Pending',
        createdAt: serverTimestamp()
      });

      alert('School registered successfully! An administrator will review your request.');
      setShowRegisterModal(false);
      setFormData({ name: '', address: '', email: '', phone: '', website: '', principalName: '', password: '' });
    } catch (error: any) {
      console.error("Error registering school:", error);
      if (error.code === 'auth/email-already-in-use') {
        alert("This email address is already registered.");
      } else {
        alert("Failed to register school: " + error.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-white font-sans selection:bg-indigo-500 selection:text-white">
      
      {/* Background Mesh Glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-[128px]" />
        <div className="absolute top-1/3 -right-40 w-96 h-96 bg-purple-600/15 rounded-full blur-[128px]" />
        <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-blue-600/15 rounded-full blur-[128px]" />
      </div>

      {/* Navbar */}
      <nav className="flex items-center justify-between px-6 sm:px-12 h-20 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80 fixed top-0 w-full z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-tr from-indigo-600 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-black tracking-tight text-white flex items-center gap-1">
            VAKS <span className="text-indigo-400">AI</span>
          </span>
        </div>

        <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-300">
          <a href="#features" className="hover:text-indigo-400 transition-colors">Platform Capabilities</a>
          <a href="#roles" className="hover:text-indigo-400 transition-colors">Role Suites</a>
          <a href="#stats" className="hover:text-indigo-400 transition-colors">Campus Impact</a>
        </div>

        <div className="flex items-center gap-3">
          <Link 
            to="/login" 
            className="px-5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 text-xs font-bold transition shadow-sm"
          >
            Sign In
          </Link>
          <button 
            onClick={() => setShowRegisterModal(true)} 
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-indigo-600/20 flex items-center gap-2"
          >
            <Building2 className="w-4 h-4" /> Register Institution
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 flex-1 flex flex-col items-center pt-36 pb-24 px-4 sm:px-8 max-w-7xl mx-auto w-full">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-4xl"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-950/80 border border-indigo-800/60 rounded-full text-indigo-300 text-xs font-bold uppercase tracking-widest mb-6 shadow-inner">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> Next-Gen Campus OS & AI Management
          </div>

          <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight leading-[1.08] mb-6">
            Empowering Modern <br className="hidden sm:block" />
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Education Ecosystems
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-400 leading-relaxed mb-10 max-w-2xl mx-auto font-normal">
            VAKS AI connects Main Institutions, Teachers, and Students through automated attendance, photo homework grading, AI cleanup moderation, and study channels.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              to="/login" 
              className="w-full sm:w-auto px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold text-sm transition shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2"
            >
              Sign In to Portal <ArrowRight className="w-4 h-4" />
            </Link>
            <button 
              onClick={() => setShowRegisterModal(true)} 
              className="w-full sm:w-auto px-8 py-4 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 rounded-2xl font-bold text-sm transition flex items-center justify-center gap-2"
            >
              <Building2 className="w-4 h-4 text-indigo-400" /> Register Your Institution
            </button>
          </div>
        </motion.div>

        {/* Dashboard Live Mockup Container */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mt-16 w-full max-w-5xl bg-slate-900/90 border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-2xl shadow-indigo-950/50 backdrop-blur-xl relative overflow-hidden"
        >
          <div className="flex items-center justify-between pb-4 border-b border-slate-800/80 mb-6">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-500/80" />
              <span className="w-3 h-3 rounded-full bg-amber-500/80" />
              <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
              <span className="text-xs font-mono text-slate-500 ml-2">vaks-ai-dashboard-v2.5.app</span>
            </div>

            {/* Role Mockup Tabs */}
            <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
              {(['INSTITUTION', 'TEACHER', 'STUDENT'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    activeTab === tab
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {tab === 'INSTITUTION' ? 'Main Institution' : tab === 'TEACHER' ? 'Faculty Portal' : 'Student Space'}
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Role Mockup View */}
          <div className="bg-slate-950 rounded-2xl p-6 border border-slate-800 min-h-[260px] flex flex-col justify-between">
            {activeTab === 'INSTITUTION' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <Building2 className="w-5 h-5 text-indigo-400" /> Springfield High Central Overview
                    </h3>
                    <p className="text-xs text-slate-400">Institutional Governance & System Metrics</p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-950 text-emerald-400 border border-emerald-800/60">
                    System Active
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-4 pt-2">
                  <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-800">
                    <p className="text-xs text-slate-400 font-medium">Faculty Members</p>
                    <p className="text-2xl font-extrabold text-white mt-1">48 Teachers</p>
                  </div>
                  <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-800">
                    <p className="text-xs text-slate-400 font-medium">Total Students</p>
                    <p className="text-2xl font-extrabold text-white mt-1">1,240 Enrolled</p>
                  </div>
                  <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-800">
                    <p className="text-xs text-slate-400 font-medium">Complaints Moderated</p>
                    <p className="text-2xl font-extrabold text-emerald-400 mt-1">99.2% Resolved</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'TEACHER' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-purple-400" /> Class 10-A Homework & Attendance Hub
                    </h3>
                    <p className="text-xs text-slate-400">Mathematics & Physics Faculty Suite</p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-950 text-indigo-300 border border-indigo-800">
                    4 Homework Pending
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-4 pt-2">
                  <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-800">
                    <p className="text-xs text-slate-400 font-medium">Today's Attendance</p>
                    <p className="text-2xl font-extrabold text-emerald-400 mt-1">96% Present</p>
                  </div>
                  <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-800">
                    <p className="text-xs text-slate-400 font-medium">Submissions Reviewed</p>
                    <p className="text-2xl font-extrabold text-white mt-1">32 / 36 Submitted</p>
                  </div>
                  <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-800">
                    <p className="text-xs text-slate-400 font-medium">Study Groups</p>
                    <p className="text-2xl font-extrabold text-purple-400 mt-1">3 Active Channels</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'STUDENT' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <UserCircle className="w-5 h-5 text-sky-400" /> Alex Morgan — Student Portal
                    </h3>
                    <p className="text-xs text-slate-400">Class 10-A • Roll No. STU-108</p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-sky-950 text-sky-300 border border-sky-800">
                    94.5% Attendance
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-4 pt-2">
                  <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-800">
                    <p className="text-xs text-slate-400 font-medium">Active Homework</p>
                    <p className="text-2xl font-extrabold text-amber-400 mt-1">2 Assignments</p>
                  </div>
                  <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-800">
                    <p className="text-xs text-slate-400 font-medium">Upcoming Timetable</p>
                    <p className="text-2xl font-extrabold text-white mt-1">Maths @ 09:00 AM</p>
                  </div>
                  <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-800">
                    <p className="text-xs text-slate-400 font-medium">Campus Notices</p>
                    <p className="text-2xl font-extrabold text-sky-400 mt-1">1 New Notice</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Features Cards Grid */}
        <div id="features" className="w-full mt-24">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-4">
              Designed for Speed, Security, and Clarity
            </h2>
            <p className="text-slate-400 text-sm">
              Everything your school needs from enrollment governance to photo-submission homework grading and complaints moderation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
            <FeatureCard 
              icon={<ShieldCheck className="w-6 h-6" />}
              title="Super Admin Governance"
              color="purple"
              features={['Institutional Onboarding', 'Global Analytics', 'Platform Security']}
            />
            <FeatureCard 
              icon={<Building2 className="w-6 h-6" />}
              title="Main Institution Portal"
              color="blue"
              features={['Teacher & Student Rosters', 'Study Group Creation', 'AI Complaint Cleanup']}
            />
            <FeatureCard 
              icon={<BookOpen className="w-6 h-6" />}
              title="Faculty Workspace"
              color="emerald"
              features={['Visual Attendance Register', 'Photo Homework Grading', 'Timetable Management']}
            />
            <FeatureCard 
              icon={<UserCircle className="w-6 h-6" />}
              title="Student Dashboard"
              color="amber"
              features={['Submission History', 'Study Group Participation', 'Campus Events & Notices']}
            />
          </div>
        </div>

        {/* Stats Section */}
        <div id="stats" className="w-full mt-24 p-8 sm:p-12 rounded-3xl bg-slate-900/80 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-2 text-center md:text-left">
            <h3 className="text-2xl font-bold text-white">Powering Modern Schools Worldwide</h3>
            <p className="text-sm text-slate-400">Join hundreds of educational institutions transforming their campus operations.</p>
          </div>
          <div className="grid grid-cols-3 gap-8 text-center">
            <div>
              <p className="text-3xl font-extrabold text-indigo-400">150+</p>
              <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mt-1">Institutions</p>
            </div>
            <div>
              <p className="text-3xl font-extrabold text-purple-400">45k+</p>
              <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mt-1">Active Users</p>
            </div>
            <div>
              <p className="text-3xl font-extrabold text-emerald-400">99.9%</p>
              <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mt-1">Uptime</p>
            </div>
          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-slate-800/80 py-8 px-6 sm:px-12 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <GraduationCap className="w-4 h-4 text-indigo-400" />
          <span>© {new Date().getFullYear()} VAKS AI. All rights reserved.</span>
        </div>
        <div className="flex items-center gap-6">
          <a href="#" className="hover:text-slate-300 transition">Privacy Policy</a>
          <a href="#" className="hover:text-slate-300 transition">Terms of Service</a>
          <a href="#" className="hover:text-slate-300 transition">Support Center</a>
        </div>
      </footer>

      {/* School Registration Modal */}
      <AnimatePresence>
        {showRegisterModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
              onClick={() => setShowRegisterModal(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 text-white rounded-3xl p-6 sm:p-8 max-w-md w-full relative z-10 shadow-2xl"
            >
              <button 
                onClick={() => setShowRegisterModal(false)}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-indigo-950 text-indigo-400 rounded-xl flex items-center justify-center border border-indigo-800/60">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Register School</h2>
                  <p className="text-xs text-slate-400">Request institution onboarding access</p>
                </div>
              </div>
              
              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Institution Name</label>
                  <input 
                    type="text" 
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 outline-none text-sm text-white placeholder-slate-500" 
                    placeholder="e.g. Springfield High" 
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Address</label>
                  <input 
                    type="text" 
                    required
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 outline-none text-sm text-white placeholder-slate-500" 
                    placeholder="Street, City, Zip Code..." 
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Contact Email</label>
                  <input 
                    type="email" 
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 outline-none text-sm text-white placeholder-slate-500" 
                    placeholder="admin@school.com" 
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Phone Number</label>
                  <input 
                    type="tel" 
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 outline-none text-sm text-white placeholder-slate-500" 
                    placeholder="+1 (555) 000-0000" 
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Website (Optional)</label>
                  <input 
                    type="url" 
                    value={formData.website}
                    onChange={(e) => setFormData({...formData, website: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 outline-none text-sm text-white placeholder-slate-500" 
                    placeholder="https://www.yourschool.edu" 
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Principal / Admin Name</label>
                  <input 
                    type="text" 
                    required
                    value={formData.principalName}
                    onChange={(e) => setFormData({...formData, principalName: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 outline-none text-sm text-white placeholder-slate-500" 
                    placeholder="Principal's Name" 
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Account Password</label>
                  <input 
                    type="password" 
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 outline-none text-sm text-white placeholder-slate-500" 
                    placeholder="Create admin password" 
                  />
                </div>

                <button 
                  type="submit" 
                  disabled={isSubmitting} 
                  className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition flex items-center justify-center gap-2 mt-6 shadow-lg shadow-indigo-600/30 text-sm"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Submit School Registration
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

const FeatureCard = ({ icon, title, features, color }: { icon: React.ReactNode, title: string, features: string[], color: 'purple' | 'blue' | 'emerald' | 'amber' }) => {
  const colorMap = {
    purple: { bg: 'bg-purple-950/60', text: 'text-purple-400', border: 'border-purple-800/40', dot: 'bg-purple-400' },
    blue: { bg: 'bg-indigo-950/60', text: 'text-indigo-400', border: 'border-indigo-800/40', dot: 'bg-indigo-400' },
    emerald: { bg: 'bg-emerald-950/60', text: 'text-emerald-400', border: 'border-emerald-800/40', dot: 'bg-emerald-400' },
    amber: { bg: 'bg-amber-950/60', text: 'text-amber-400', border: 'border-amber-800/40', dot: 'bg-amber-400' },
  };
  
  const c = colorMap[color];

  return (
    <div className="bg-slate-900/80 p-6 rounded-3xl border border-slate-800 flex flex-col gap-4 hover:border-slate-700 transition">
      <div className={`w-12 h-12 ${c.bg} ${c.text} ${c.border} border rounded-2xl flex items-center justify-center`}>
        {icon}
      </div>
      <h3 className="font-bold text-base text-white">{title}</h3>
      <ul className="text-xs text-slate-400 space-y-2.5">
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
