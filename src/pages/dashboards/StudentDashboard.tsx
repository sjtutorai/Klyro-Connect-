import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader, StatCard, Card, Badge, Button } from '../../components/ui';
import { BookOpen, CalendarCheck, Clock, Bell, ArrowRight, Sparkles, MessagesSquare } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useFirestoreStats } from '../../lib/useFirestoreStats';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';

const attendanceData = [
  { name: 'Mon', present: 100 },
  { name: 'Tue', present: 100 },
  { name: 'Wed', present: 100 },
  { name: 'Thu', present: 0 },
  { name: 'Fri', present: 100 },
];

export default function StudentDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const stats = useFirestoreStats();
  
  const [homeworks, setHomeworks] = useState<any[]>([]);
  const [notices, setNotices] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    const hwQuery = query(collection(db, 'homeworks'));
    const unsubHw = onSnapshot(hwQuery, snapshot => {
      const list: any[] = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        if (!user.institutionId || !data.institutionId || data.institutionId === user.institutionId) {
          list.push({ id: doc.id, ...data });
        }
      });
      list.sort((a, b) => b.createdAt?.toMillis?.() - a.createdAt?.toMillis?.() || 0);
      setHomeworks(list.slice(0, 3));
    });

    const notQuery = query(collection(db, 'notices'));
    const unsubNot = onSnapshot(notQuery, snapshot => {
      const list: any[] = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        if (!user.institutionId || !data.institutionId || data.institutionId === user.institutionId) {
          list.push({ id: doc.id, ...data });
        }
      });
      list.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
      setNotices(list.slice(0, 3));
    });

    return () => { unsubHw(); unsubNot(); };
  }, [user]);

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <PageHeader 
        title={`Hello, ${user?.name || 'Student'}`} 
        description="Your academic assignments, daily schedule, and study group activities."
        badge="Student Portal"
        breadcrumbs={[{ label: 'Dashboard' }, { label: 'Student Space' }]}
      />

      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Enrolled Subjects" 
          value={stats.courses} 
          icon={<BookOpen className="w-5 h-5" />} 
          gradient="from-indigo-500 to-indigo-600"
          description="Active subject modules"
        />
        <StatCard 
          title="Pending Homework" 
          value={stats.pendingHomework} 
          icon={<Clock className="w-5 h-5" />} 
          trend={{ value: '2 Due Soon', positive: false }} 
          gradient="from-amber-500 to-orange-600"
          description="Submission deadline queue"
        />
        <StatCard 
          title="My Attendance Rate" 
          value={`${stats.attendance}%`} 
          icon={<CalendarCheck className="w-5 h-5" />} 
          gradient="from-emerald-500 to-teal-600"
          description="Semester present record"
        />
        <StatCard 
          title="Campus Notices" 
          value={stats.unreadNotices} 
          icon={<Bell className="w-5 h-5" />} 
          gradient="from-purple-500 to-pink-600"
          description="Unread announcements"
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        
        {/* Left Column: Homework & Attendance */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Pending Homework Card */}
          <Card className="flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Clock className="w-5 h-5 text-indigo-500" /> Pending Assignments
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Upload your work with photos before deadline</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard/student/homework')} icon={<ArrowRight className="w-3.5 h-3.5" />}>
                  View All Homework
                </Button>
              </div>

              <div className="space-y-3">
                {homeworks.length === 0 ? (
                  <div className="p-4 text-center text-slate-500 text-sm">
                    <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-20" />
                    No homework assigned yet.
                  </div>
                ) : homeworks.map((hw, i) => (
                  <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800 transition gap-4">
                    <div className="flex items-start gap-3.5">
                      <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5">
                        <BookOpen className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white">{hw.title}</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-1">
                          <Clock className="w-3.5 h-3.5" /> Due: {hw.dueDate}
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => navigate('/dashboard/student/homework')} icon={<ArrowRight className="w-3.5 h-3.5" />}>
                      Submit Work
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* Attendance Chart Card */}
          <Card>
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <CalendarCheck className="w-5 h-5 text-emerald-500" /> Weekly Presence
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Class presence breakdown for this week</p>
              </div>
              <Badge variant="success">92% Average</Badge>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={attendanceData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.2)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dy={10} />
                  <YAxis hide />
                  <Tooltip 
                    cursor={{ fill: 'rgba(16, 185, 129, 0.05)' }} 
                    contentStyle={{ borderRadius: '14px', border: 'none', backgroundColor: '#0f172a', color: '#fff' }} 
                  />
                  <Bar dataKey="present" fill="#10b981" radius={[6, 6, 6, 6]} barSize={36} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

        </div>

        {/* Right Column: Recent Notices & Study Groups */}
        <div className="space-y-8">
          
          <Card className="flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Bell className="w-5 h-5 text-purple-500" /> Campus Notices
                </h3>
              </div>

              <div className="space-y-3">
                {notices.length === 0 ? (
                  <div className="p-4 text-center text-slate-500 text-sm">
                    No recent notices.
                  </div>
                ) : notices.map((notice, i) => (
                  <div key={i} className={`p-3.5 rounded-2xl border ${notice.type === 'Event' || notice.type === 'Emergency' ? 'bg-rose-50/80 dark:bg-rose-950/40 border-rose-200/80 dark:border-rose-800/60' : 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-800'}`}>
                    <div className="flex items-start gap-3">
                      <div className={`mt-0.5 p-1.5 rounded-lg ${notice.type === 'Event' || notice.type === 'Emergency' ? 'text-rose-600 bg-rose-100 dark:bg-rose-900/60' : 'text-slate-400 bg-slate-200 dark:bg-slate-700'}`}>
                        <Bell className="w-4 h-4" />
                      </div>
                      <div>
                        <p className={`text-xs font-bold ${notice.type === 'Event' || notice.type === 'Emergency' ? 'text-rose-900 dark:text-rose-200' : 'text-slate-900 dark:text-white'}`}>{notice.title}</p>
                        <p className={`text-[10px] mt-1 ${notice.type === 'Event' || notice.type === 'Emergency' ? 'text-rose-600 dark:text-rose-400' : 'text-slate-500 dark:text-slate-400'}`}>{notice.date}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Button 
              variant="outline" 
              className="w-full mt-6" 
              onClick={() => navigate('/dashboard/student/notices')}
              icon={<ArrowRight className="w-4 h-4" />}
            >
              View All Notices
            </Button>
          </Card>

          <Card className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white border-indigo-800/60 p-6 space-y-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
              <MessagesSquare className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-base font-bold">Official Study Groups</h4>
              <p className="text-xs text-indigo-200/80 mt-1">Join study channels moderated by your Main Institution & Faculty.</p>
            </div>
            <Button 
              className="w-full bg-white text-indigo-950 hover:bg-slate-100" 
              onClick={() => navigate('/dashboard/student/study-groups')}
            >
              Open Discussion Channels
            </Button>
          </Card>

        </div>

      </div>
    </div>
  );
}
