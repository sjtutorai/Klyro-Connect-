import React, { useState, useEffect } from 'react';
import { PageHeader, StatCard, Card, Badge, Button } from '../../components/ui';
import { Users, GraduationCap, Calendar, MessageSquareWarning, Plus, ChevronDown, Bell, Building2, Sparkles, MessagesSquare, ArrowUpRight, BookOpen } from 'lucide-react';
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
    <div className="max-w-7xl mx-auto space-y-8">
      
      {/* Header Banner */}
      <PageHeader 
        title={`${user?.name || 'Institution Hub'}`} 
        description="Comprehensive campus governance, staff rosters, attendance logs, and student communications."
        badge="Main Institution Suite"
        breadcrumbs={[{ label: 'Dashboard' }, { label: 'Campus Governance' }]}
        action={
          <div className="relative">
            <Button 
              onClick={() => setShowQuickAdd(!showQuickAdd)}
              icon={<Plus className="w-4 h-4" />}
            >
              Quick Action <ChevronDown className="w-4 h-4 ml-0.5" />
            </Button>
            
            {showQuickAdd && (
              <div className="absolute right-0 top-full mt-2 w-52 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden z-30 space-y-1 p-1.5 animate-in fade-in slide-in-from-top-2">
                <button 
                  onClick={() => { setShowQuickAdd(false); navigate('/dashboard/institution/classes'); }} 
                  className="w-full text-left px-3.5 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl flex items-center gap-2.5 transition"
                >
                  <BookOpen className="w-4 h-4 text-sky-500" /> Create Class & Section
                </button>
                <button 
                  onClick={() => { setShowQuickAdd(false); navigate('/dashboard/institution/study-groups'); }} 
                  className="w-full text-left px-3.5 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl flex items-center gap-2.5 transition"
                >
                  <MessagesSquare className="w-4 h-4 text-purple-500" /> Create Study Group
                </button>
                <button 
                  onClick={() => { setShowQuickAdd(false); navigate('/dashboard/institution/teachers'); }} 
                  className="w-full text-left px-3.5 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl flex items-center gap-2.5 transition"
                >
                  <Users className="w-4 h-4 text-indigo-500" /> Add Teacher
                </button>
                <button 
                  onClick={() => { setShowQuickAdd(false); navigate('/dashboard/institution/students'); }} 
                  className="w-full text-left px-3.5 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl flex items-center gap-2.5 transition"
                >
                  <GraduationCap className="w-4 h-4 text-emerald-500" /> Enroll Student
                </button>
                <button 
                  onClick={() => { setShowQuickAdd(false); navigate('/dashboard/institution/events'); }} 
                  className="w-full text-left px-3.5 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl flex items-center gap-2.5 transition"
                >
                  <Calendar className="w-4 h-4 text-amber-500" /> Publish Event
                </button>
                <button 
                  onClick={() => { setShowQuickAdd(false); navigate('/dashboard/institution/notices'); }} 
                  className="w-full text-left px-3.5 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl flex items-center gap-2.5 transition"
                >
                  <Bell className="w-4 h-4 text-rose-500" /> Post Campus Notice
                </button>
              </div>
            )}
          </div>
        }
      />

      {/* Primary Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
        <StatCard 
          title="Teachers Roster" 
          value={stats.teachers} 
          icon={<Users className="w-5 h-5" />} 
          trend={{ value: 'Live', positive: true }} 
          gradient="from-indigo-500 to-violet-600"
        />
        <StatCard 
          title="Enrolled Students" 
          value={stats.students} 
          icon={<GraduationCap className="w-5 h-5" />} 
          trend={{ value: 'Live', positive: true }} 
          gradient="from-emerald-500 to-teal-600"
        />
        <StatCard 
          title="Active Campus Events" 
          value={stats.activeEvents} 
          icon={<Calendar className="w-5 h-5" />} 
          gradient="from-amber-500 to-orange-600"
        />
        <StatCard 
          title="Published Notices" 
          value={stats.notices} 
          icon={<Bell className="w-5 h-5" />} 
          gradient="from-sky-500 to-blue-600"
        />
        <StatCard 
          title="Pending Complaints" 
          value={stats.pendingComplaints} 
          icon={<MessageSquareWarning className="w-5 h-5" />} 
          trend={{ value: 'Review Queue', positive: false }} 
          gradient="from-rose-500 to-pink-600"
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        
        {/* Recent Campus Notices */}
        <Card className="flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Bell className="w-5 h-5 text-indigo-500" /> Recent Campus Notices
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Broadcasting updates to students and faculty</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard/institution/notices')} icon={<ArrowUpRight className="w-3.5 h-3.5" />}>
                Manage Notices
              </Button>
            </div>

            <div className="space-y-3">
              {recentNotices.length > 0 ? (
                recentNotices.map((notice, i) => (
                  <div key={i} className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800 transition flex justify-between items-center gap-4">
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white">{notice.title}</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {notice.date ? new Date(notice.date).toLocaleDateString(undefined, { dateStyle: 'medium' }) : 'Recent'}
                      </p>
                    </div>
                    <Badge variant="purple">{notice.type || 'Notice'}</Badge>
                  </div>
                ))
              ) : (
                <div className="text-center py-10 text-slate-400 text-sm">No recent notices created.</div>
              )}
            </div>
          </div>
        </Card>

        {/* Attendance Ring Overview */}
        <Card className="flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-emerald-500" /> Daily Staff Attendance
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Real-time daily presence ratio</p>
              </div>
              <Badge variant="success" dot>Live Sync</Badge>
            </div>

            <div className="flex flex-col items-center justify-center py-6">
              <div className="w-36 h-36 rounded-full border-8 border-emerald-500 dark:border-emerald-500 relative flex items-center justify-center shadow-lg shadow-emerald-500/10">
                <div 
                  className="absolute inset-[-8px] rounded-full border-8 border-rose-500" 
                  style={{ clipPath: `polygon(50% 50%, 100% 0, 100% ${100 - stats.attendance}%, 50% 50%)` }}
                />
                <div className="text-center">
                  <div className="text-3xl font-extrabold text-slate-900 dark:text-white">{stats.attendance}%</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Present</div>
                </div>
              </div>
            </div>

            <div className="flex justify-center gap-8 pt-4 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Present Staff</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-rose-500" />
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Absent / Leave</span>
              </div>
            </div>
          </div>
        </Card>

      </div>
    </div>
  );
}
