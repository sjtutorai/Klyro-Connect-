import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader, StatCard } from '../../components/ui';
import { BookOpen, CalendarCheck, Clock, Bell, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useFirestoreStats } from '../../lib/useFirestoreStats';

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

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader 
        title={`Hello, ${user?.name}`} 
        description="Ready for your classes today?"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard title="Courses" value={stats.courses} icon={<BookOpen className="w-6 h-6" />} />
        <StatCard title="Pending Homework" value={stats.pendingHomework} icon={<Clock className="w-6 h-6" />} trend={{ value: '2 Due Soon', positive: false }} />
        <StatCard title="Attendance Rate" value={`${stats.attendance}%`} icon={<CalendarCheck className="w-6 h-6" />} />
        <StatCard title="Unread Notices" value={stats.unreadNotices} icon={<Bell className="w-6 h-6" />} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-slate-900">Pending Homework</h3>
              <button onClick={() => navigate('/dashboard/student/homework')} className="text-sm font-medium text-indigo-600 hover:text-indigo-700">View All</button>
            </div>
            <div className="space-y-4">
              {[
                { subject: 'Mathematics', title: 'Algebra Equations Exercise 4.2', due: 'Tomorrow, 10:00 AM', status: 'pending' },
                { subject: 'Physics', title: 'Newton\'s Laws Lab Report', due: 'Friday, 11:59 PM', status: 'pending' },
              ].map((hw, i) => (
                <div key={i} className="flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:border-slate-200 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className="bg-indigo-50 p-2.5 rounded-lg text-indigo-600 mt-1">
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900">{hw.title}</h4>
                      <p className="text-sm font-medium text-indigo-600 mb-1">{hw.subject}</p>
                      <p className="text-xs text-slate-500 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> Due: {hw.due}
                      </p>
                    </div>
                  </div>
                  <button className="hidden sm:flex items-center gap-2 px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 text-sm font-medium rounded-lg transition-colors border border-slate-200">
                    Submit <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-slate-900">Attendance This Week</h3>
              <button onClick={() => navigate('/dashboard/student/attendance')} className="text-sm font-medium text-indigo-600 hover:text-indigo-700">View Details</button>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={attendanceData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6b7280' }} dy={10} />
                  <YAxis hide />
                  <Tooltip cursor={{ fill: '#f9fafb' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Bar dataKey="present" fill="#10b981" radius={[4, 4, 4, 4]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-slate-900">Recent Notices</h3>
          </div>
          <div className="space-y-4">
            {[
              { title: 'School Closed on Friday due to heavy rain alert.', date: 'Today, 08:30 AM', important: true },
              { title: 'New library books added for Grade 10.', date: 'Yesterday, 14:00 PM', important: false },
              { title: 'Submit sports day participation forms.', date: 'Oct 20, 10:00 AM', important: false },
            ].map((notice, i) => (
              <div key={i} className={`p-4 rounded-xl border ${notice.important ? 'bg-rose-50 border-rose-100' : 'bg-slate-50 border-slate-100'}`}>
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 ${notice.important ? 'text-rose-500' : 'text-slate-400'}`}>
                    <Bell className="w-5 h-5" />
                  </div>
                  <div>
                    <p className={`text-sm font-medium ${notice.important ? 'text-rose-900' : 'text-slate-900'}`}>{notice.title}</p>
                    <p className={`text-xs mt-1.5 ${notice.important ? 'text-rose-600' : 'text-slate-500'}`}>{notice.date}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <button onClick={() => navigate('/dashboard/notices')} className="w-full mt-6 py-3 text-sm font-medium text-indigo-600 hover:text-indigo-700 bg-indigo-50 rounded-xl hover:bg-indigo-100 transition-colors">
            View All Notices
          </button>
        </div>
      </div>
    </div>
  );
}
