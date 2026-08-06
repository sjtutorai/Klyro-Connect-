import React from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, ShieldCheck, Users, BookOpen, UserCircle, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-4 sm:px-8 h-20 bg-white border-b border-slate-200 shrink-0 shadow-sm fixed top-0 w-full z-50">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-800">
            Klyro <span className="text-indigo-600">Connect</span>
          </span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
          <a href="#features" className="hover:text-indigo-600 transition-colors">Features</a>
          <a href="#stats" className="hover:text-indigo-600 transition-colors">Impact</a>
          <div className="flex items-center gap-4">
            <Link to="/login" className="px-5 py-2 bg-slate-100 rounded-full hover:bg-slate-200 text-slate-800 transition-colors">Login</Link>
            <button className="px-5 py-2 bg-indigo-600 rounded-full text-white hover:bg-indigo-700 transition-colors">Request Access</button>
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
            Klyro Connect bridges the gap between institutions, teachers, students, and administrators with one intelligent ecosystem designed for the modern era of education.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link to="/login" className="px-8 py-3 bg-indigo-600 text-white rounded-full font-semibold hover:bg-indigo-700 transition-colors shadow-sm">
              Get Started
            </Link>
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
