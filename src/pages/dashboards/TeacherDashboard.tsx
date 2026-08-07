import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader, StatCard, Card, Badge, Button } from '../../components/ui';
import { Users, BookOpen, CalendarCheck, Clock, CheckCircle2, MessageSquareWarning, ArrowRight, Sparkles, MessagesSquare } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useFirestoreStats } from '../../lib/useFirestoreStats';

export default function TeacherDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const stats = useFirestoreStats();

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <PageHeader 
        title={`Welcome, ${user?.name || 'Faculty Member'}`} 
        description="Daily teaching schedule, homework review queue, and attendance controls."
        badge="Faculty Workspace"
        breadcrumbs={[{ label: 'Dashboard' }, { label: 'Teacher Overview' }]}
      />

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Assigned Students" 
          value={stats.students} 
          icon={<Users className="w-5 h-5" />} 
          gradient="from-indigo-500 to-indigo-600"
          description="Class directory total"
        />
        <StatCard 
          title="Scheduled Classes" 
          value={stats.classes} 
          icon={<Clock className="w-5 h-5" />} 
          gradient="from-purple-500 to-purple-600"
          description="Today's lecture load"
        />
        <StatCard 
          title="Class Attendance Rate" 
          value={`${stats.averageAttendance}%`} 
          icon={<CalendarCheck className="w-5 h-5" />} 
          trend={{ value: 'Realtime', positive: true }}
          gradient="from-emerald-500 to-teal-600"
          description="Average present ratio"
        />
        <StatCard 
          title="Submissions Pending" 
          value={stats.pendingHomework} 
          icon={<BookOpen className="w-5 h-5" />} 
          gradient="from-amber-500 to-orange-600"
          description="Review & grade queue"
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        
        {/* Today's Schedule */}
        <Card className="lg:col-span-2 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Clock className="w-5 h-5 text-indigo-500" /> Today's Lecture Schedule
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Schedule slots and current session status</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard/teacher/classes')} icon={<ArrowRight className="w-3.5 h-3.5" />}>
                Full Schedule
              </Button>
            </div>

            <div className="space-y-3">
              {[
                { time: '09:00 AM - 10:00 AM', subject: 'Mathematics', class: 'Grade 10-A', status: 'completed' },
                { time: '10:15 AM - 11:15 AM', subject: 'Physics Lab', class: 'Grade 11-B', status: 'ongoing' },
                { time: '11:30 AM - 12:30 PM', subject: 'Algebra II', class: 'Grade 9-C', status: 'upcoming' },
                { time: '01:30 PM - 02:30 PM', subject: 'Chemistry', class: 'Grade 10-A', status: 'upcoming' },
              ].map((session, i) => (
                <div 
                  key={i} 
                  className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    session.status === 'ongoing' 
                      ? 'bg-indigo-50/80 dark:bg-indigo-950/50 border-indigo-200 dark:border-indigo-800/80 shadow-sm' 
                      : 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <div className={`w-2 h-10 rounded-full ${session.status === 'completed' ? 'bg-emerald-500' : session.status === 'ongoing' ? 'bg-indigo-600 animate-pulse' : 'bg-slate-300 dark:bg-slate-700'}`} />
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white">{session.subject}</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{session.time}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-3">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{session.class}</span>
                    {session.status === 'ongoing' && (
                      <Badge variant="primary" dot>HAPPENING NOW</Badge>
                    )}
                    {session.status === 'completed' && (
                      <Badge variant="success">COMPLETED</Badge>
                    )}
                    {session.status === 'upcoming' && (
                      <Badge variant="neutral">UPCOMING</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Quick Actions Panel */}
        <Card className="flex flex-col">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-500" /> Faculty Actions
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Instant shortcuts for daily tasks</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3.5 flex-1">
            <button 
              onClick={() => navigate('/dashboard/teacher/attendance')} 
              className="flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 hover:border-indigo-300 dark:hover:border-indigo-800 border border-slate-200/80 dark:border-slate-800 transition text-center group"
            >
              <CalendarCheck className="w-7 h-7 text-indigo-600 dark:text-indigo-400 mb-2 group-hover:scale-110 transition-transform" />
              <span className="font-bold text-xs text-slate-900 dark:text-white">Mark Attendance</span>
            </button>

            <button 
              onClick={() => navigate('/dashboard/teacher/homework')} 
              className="flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-purple-50 dark:hover:bg-purple-950/50 hover:border-purple-300 dark:hover:border-purple-800 border border-slate-200/80 dark:border-slate-800 transition text-center group"
            >
              <BookOpen className="w-7 h-7 text-purple-600 dark:text-purple-400 mb-2 group-hover:scale-110 transition-transform" />
              <span className="font-bold text-xs text-slate-900 dark:text-white">Assign Homework</span>
            </button>

            <button 
              onClick={() => navigate('/dashboard/teacher/study-groups')} 
              className="flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 hover:border-emerald-300 dark:hover:border-emerald-800 border border-slate-200/80 dark:border-slate-800 transition text-center group"
            >
              <MessagesSquare className="w-7 h-7 text-emerald-600 dark:text-emerald-400 mb-2 group-hover:scale-110 transition-transform" />
              <span className="font-bold text-xs text-slate-900 dark:text-white">Study Channels</span>
            </button>

            <button 
              onClick={() => navigate('/dashboard/teacher/students')} 
              className="flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-sky-50 dark:hover:bg-sky-950/50 hover:border-sky-300 dark:hover:border-sky-800 border border-slate-200/80 dark:border-slate-800 transition text-center group"
            >
              <Users className="w-7 h-7 text-sky-600 dark:text-sky-400 mb-2 group-hover:scale-110 transition-transform" />
              <span className="font-bold text-xs text-slate-900 dark:text-white">Students Roster</span>
            </button>
          </div>
        </Card>

      </div>
    </div>
  );
}
