import React from 'react';
import { PageHeader, StatCard } from '../../components/ui';
import { Users, GraduationCap, Calendar, MessageSquareWarning, Plus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useFirestoreStats } from '../../lib/useFirestoreStats';

export default function InstitutionDashboard() {
  const { user } = useAuth();
  const stats = useFirestoreStats();

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader 
        title={`${user?.name} Dashboard`} 
        description="Manage your institution's daily operations."
        action={
          <button className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl font-medium hover:bg-indigo-700 transition shadow-sm">
            <Plus className="w-5 h-5" /> Quick Add
          </button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard title="Teachers" value={stats.teachers} icon={<Users className="w-6 h-6" />} trend={{ value: '2', positive: true }} />
        <StatCard title="Students" value={stats.students} icon={<GraduationCap className="w-6 h-6" />} trend={{ value: '15', positive: true }} />
        <StatCard title="Upcoming Events" value={stats.activeEvents} icon={<Calendar className="w-6 h-6" />} />
        <StatCard title="Open Complaints" value={stats.pendingComplaints} icon={<MessageSquareWarning className="w-6 h-6" />} trend={{ value: '1', positive: false }} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-slate-900">Recent Notices</h3>
            <button className="text-sm font-medium text-indigo-600 hover:text-indigo-700">View All</button>
          </div>
          <div className="space-y-4">
            {[
              { title: 'End of Term Examinations', date: 'Oct 24, 2023', type: 'Academic' },
              { title: 'Annual Sports Meet', date: 'Oct 15, 2023', type: 'Event' },
              { title: 'System Maintenance', date: 'Oct 10, 2023', type: 'IT Support' },
            ].map((notice, i) => (
              <div key={i} className="p-4 rounded-xl border border-slate-100 hover:border-slate-200 hover:shadow-sm transition-all flex justify-between items-center">
                <div>
                  <h4 className="font-medium text-slate-900">{notice.title}</h4>
                  <p className="text-sm text-slate-500 mt-1">{notice.date}</p>
                </div>
                <span className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-medium rounded-full">
                  {notice.type}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-slate-900">Staff Attendance Today</h3>
            <button className="text-sm font-medium text-indigo-600 hover:text-indigo-700">Full Report</button>
          </div>
          
          <div className="flex flex-col items-center justify-center h-48 mb-4 relative">
             {/* Simple ring chart representation */}
             <div className="w-32 h-32 rounded-full border-8 border-emerald-500 relative flex items-center justify-center">
               <div className="absolute inset-[-8px] rounded-full border-8 border-rose-500" style={{ clipPath: 'polygon(50% 50%, 100% 0, 100% 50%, 50% 50%)' }}></div>
               <div className="text-center">
                 <div className="text-3xl font-bold text-slate-900">92%</div>
                 <div className="text-xs text-slate-500 font-medium uppercase">Present</div>
               </div>
             </div>
          </div>
          
          <div className="flex justify-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
              <span className="text-sm text-slate-600">Present (42)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-rose-500"></div>
              <span className="text-sm text-slate-600">Absent (3)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
