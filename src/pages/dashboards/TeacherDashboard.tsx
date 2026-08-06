import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader, StatCard } from '../../components/ui';
import { Users, BookOpen, CalendarCheck, Clock, CheckCircle2, MessageSquareWarning } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useFirestoreStats } from '../../lib/useFirestoreStats';

export default function TeacherDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const stats = useFirestoreStats();

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader 
        title={`Welcome, ${user?.name}`} 
        description="Here is your schedule and pending tasks for today."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard title="Total Students" value={stats.students} icon={<Users className="w-6 h-6" />} />
        <StatCard title="Classes Today" value={stats.classes} icon={<Clock className="w-6 h-6" />} />
        <StatCard title="Avg. Attendance" value={`${stats.averageAttendance}%`} icon={<CalendarCheck className="w-6 h-6" />} />
        <StatCard title="Pending Homework" value={stats.pendingHomework} icon={<BookOpen className="w-6 h-6" />} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-slate-900">Today's Timetable</h3>
            <button onClick={() => navigate('/dashboard/teacher/timetable')} className="text-sm font-medium text-indigo-600 hover:text-indigo-700">View Full Schedule</button>
          </div>
          <div className="space-y-4">
            {[
              { time: '09:00 AM - 10:00 AM', subject: 'Mathematics', class: 'Grade 10-A', status: 'completed' },
              { time: '10:15 AM - 11:15 AM', subject: 'Physics', class: 'Grade 11-B', status: 'ongoing' },
              { time: '11:30 AM - 12:30 PM', subject: 'Mathematics', class: 'Grade 9-C', status: 'upcoming' },
              { time: '01:30 PM - 02:30 PM', subject: 'Chemistry', class: 'Grade 10-A', status: 'upcoming' },
            ].map((session, i) => (
              <div key={i} className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${session.status === 'ongoing' ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-slate-100'}`}>
                <div className="flex items-center gap-4">
                  <div className={`w-1.5 h-12 rounded-full ${session.status === 'completed' ? 'bg-emerald-500' : session.status === 'ongoing' ? 'bg-indigo-600' : 'bg-slate-200'}`}></div>
                  <div>
                    <h4 className="font-bold text-slate-900">{session.subject}</h4>
                    <p className="text-sm text-slate-500">{session.time}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 sm:flex-col sm:items-end sm:gap-1">
                  <span className="font-medium text-slate-900">{session.class}</span>
                  {session.status === 'ongoing' && (
                    <span className="px-2.5 py-1 bg-indigo-100 text-indigo-700 text-xs font-bold rounded-md animate-pulse">
                      HAPPENING NOW
                    </span>
                  )}
                  {session.status === 'completed' && (
                    <span className="flex items-center gap-1 text-emerald-600 text-xs font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5" /> COMPLETED
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-slate-900">Quick Actions</h3>
          </div>
          <div className="grid grid-cols-2 gap-4 flex-1">
            <button onClick={() => navigate('/dashboard/teacher/attendance')} className="flex flex-col items-center justify-center gap-3 p-4 bg-slate-50 rounded-xl hover:bg-indigo-50 hover:text-indigo-600 transition-colors border border-slate-100 text-slate-700">
              <CalendarCheck className="w-8 h-8" />
              <span className="font-medium text-sm">Mark Attendance</span>
            </button>
            <button onClick={() => navigate('/dashboard/teacher/homework')} className="flex flex-col items-center justify-center gap-3 p-4 bg-slate-50 rounded-xl hover:bg-indigo-50 hover:text-indigo-600 transition-colors border border-slate-100 text-slate-700">
              <BookOpen className="w-8 h-8" />
              <span className="font-medium text-sm">Assign Homework</span>
            </button>
            <button onClick={() => navigate('/dashboard/complaints')} className="flex flex-col items-center justify-center gap-3 p-4 bg-slate-50 rounded-xl hover:bg-indigo-50 hover:text-indigo-600 transition-colors border border-slate-100 text-slate-700">
              <MessageSquareWarning className="w-8 h-8" />
              <span className="font-medium text-sm">View Complaints</span>
            </button>
            <button onClick={() => navigate('/dashboard/teacher/students')} className="flex flex-col items-center justify-center gap-3 p-4 bg-slate-50 rounded-xl hover:bg-indigo-50 hover:text-indigo-600 transition-colors border border-slate-100 text-slate-700">
              <Users className="w-8 h-8" />
              <span className="font-medium text-sm">Student Directory</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
