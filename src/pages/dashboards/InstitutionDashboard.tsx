import React, { useState, useEffect } from 'react';
import { PageHeader, StatCard } from '../../components/ui';
import { Users, GraduationCap, Calendar, MessageSquareWarning, Plus, ChevronDown, Bell } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useFirestoreStats } from '../../lib/useFirestoreStats';
import { collection, query, orderBy, limit, onSnapshot, where } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useNavigate } from 'react-router-dom';

export default function InstitutionDashboard() {
  const { user } = useAuth();
  const stats = useFirestoreStats();
  const navigate = useNavigate();
  const [recentNotices, setRecentNotices] = useState<any[]>([]);
  const [showQuickAdd, setShowQuickAdd] = useState(false);

  useEffect(() => {
    if (!user?.institutionId) return;
    
    const q = query(
      collection(db, 'notices'), 
      where('institutionId', '==', user.institutionId),
      orderBy('date', 'desc'),
      limit(4)
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: any[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() });
      });
      setRecentNotices(list);
    });

    return () => unsubscribe();
  }, [user]);

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader 
        title={`${user?.name} Dashboard`} 
        description="Manage your institution's daily operations."
        action={
          <div className="relative">
            <button 
              onClick={() => setShowQuickAdd(!showQuickAdd)}
              className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl font-medium hover:bg-indigo-700 transition shadow-sm"
            >
              <Plus className="w-5 h-5" /> Quick Add <ChevronDown className="w-4 h-4 ml-1" />
            </button>
            
            {showQuickAdd && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-100 overflow-hidden z-10 animate-in fade-in slide-in-from-top-2">
                <button onClick={() => navigate('/dashboard/institution/teachers')} className="w-full text-left px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-500" /> Add Teacher
                </button>
                <button onClick={() => navigate('/dashboard/institution/students')} className="w-full text-left px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2 border-t border-slate-50">
                  <GraduationCap className="w-4 h-4 text-emerald-500" /> Add Student
                </button>
                <button onClick={() => navigate('/dashboard/institution/events')} className="w-full text-left px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2 border-t border-slate-50">
                  <Calendar className="w-4 h-4 text-amber-500" /> Add Event
                </button>
                <button onClick={() => navigate('/dashboard/institution/notices')} className="w-full text-left px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2 border-t border-slate-50">
                  <Bell className="w-4 h-4 text-rose-500" /> Add Notice
                </button>
              </div>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <StatCard title="Teachers" value={stats.teachers} icon={<Users className="w-6 h-6" />} trend={{ value: 'Realtime', positive: true }} />
        <StatCard title="Students" value={stats.students} icon={<GraduationCap className="w-6 h-6" />} trend={{ value: 'Realtime', positive: true }} />
        <StatCard title="Active Events" value={stats.activeEvents} icon={<Calendar className="w-6 h-6" />} />
        <StatCard title="Notices" value={stats.notices} icon={<Bell className="w-6 h-6" />} />
        <StatCard title="Complaints" value={stats.pendingComplaints} icon={<MessageSquareWarning className="w-6 h-6" />} trend={{ value: 'Open', positive: false }} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-slate-900">Recent Notices</h3>
            <button onClick={() => navigate('/dashboard/institution/notices')} className="text-sm font-medium text-indigo-600 hover:text-indigo-700">View All</button>
          </div>
          <div className="space-y-4">
            {recentNotices.length > 0 ? recentNotices.map((notice, i) => (
              <div key={i} className="p-4 rounded-xl border border-slate-100 hover:border-slate-200 hover:shadow-sm transition-all flex justify-between items-center">
                <div>
                  <h4 className="font-medium text-slate-900">{notice.title}</h4>
                  <p className="text-sm text-slate-500 mt-1">{new Date(notice.date).toLocaleDateString()}</p>
                </div>
                <span className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-medium rounded-full border border-slate-200">
                  {notice.type}
                </span>
              </div>
            )) : (
              <div className="text-center py-8 text-slate-500">No recent notices.</div>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-slate-900">Staff Attendance Today</h3>
            <button className="text-sm font-medium text-indigo-600 hover:text-indigo-700">Full Report</button>
          </div>
          
          <div className="flex flex-col items-center justify-center h-48 mb-4 relative">
             <div className="w-32 h-32 rounded-full border-8 border-emerald-500 relative flex items-center justify-center">
               <div className="absolute inset-[-8px] rounded-full border-8 border-rose-500" style={{ clipPath: `polygon(50% 50%, 100% 0, 100% ${100 - stats.attendance}%, 50% 50%)` }}></div>
               <div className="text-center">
                 <div className="text-3xl font-bold text-slate-900">{stats.attendance}%</div>
                 <div className="text-xs text-slate-500 font-medium uppercase">Present</div>
               </div>
             </div>
          </div>
          
          <div className="flex justify-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
              <span className="text-sm text-slate-600">Present</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-rose-500"></div>
              <span className="text-sm text-slate-600">Absent</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
