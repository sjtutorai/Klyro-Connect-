import React from 'react';
import { PageHeader, StatCard } from '../../components/ui';
import { Building2, Users, FileBarChart, MessageSquareWarning } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useFirestoreStats } from '../../lib/useFirestoreStats';

const data = [
  { name: 'Jan', institutions: 40, students: 2400 },
  { name: 'Feb', institutions: 55, students: 3500 },
  { name: 'Mar', institutions: 70, students: 5000 },
  { name: 'Apr', institutions: 90, students: 7800 },
  { name: 'May', institutions: 105, students: 9200 },
  { name: 'Jun', institutions: 124, students: 11000 },
];

export default function SuperAdminDashboard() {
  const { user } = useAuth();
  const stats = useFirestoreStats();

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader 
        title={`Welcome back, ${user?.name}`} 
        description="Here is what's happening on your platform today." 
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard title="Total Institutions" value={stats.institutions} icon={<Building2 className="w-6 h-6" />} trend={{ value: '12%', positive: true }} />
        <StatCard title="Total Teachers" value={stats.teachers} icon={<Users className="w-6 h-6" />} trend={{ value: '8%', positive: true }} />
        <StatCard title="Total Students" value={stats.students} icon={<Users className="w-6 h-6" />} trend={{ value: '15%', positive: true }} />
        <StatCard title="Active Complaints" value={stats.activeComplaints} icon={<MessageSquareWarning className="w-6 h-6" />} trend={{ value: '3%', positive: false }} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-6">Platform Growth</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6b7280' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280' }} />
                <Tooltip cursor={{ fill: '#f9fafb' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="students" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                <Bar dataKey="institutions" fill="#e0e7ff" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-6">Pending Approvals</h3>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between p-4 rounded-xl border border-slate-50 bg-slate-50 hover:bg-white hover:border-slate-200 transition-colors">
                <div>
                  <div className="font-medium text-slate-900">Global Academy</div>
                  <div className="text-sm text-slate-500">contact@global.edu</div>
                </div>
                <button className="px-3 py-1.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700">Review</button>
              </div>
            ))}
            <button className="w-full py-3 text-sm font-medium text-indigo-600 hover:text-indigo-700 bg-indigo-50 rounded-xl hover:bg-indigo-100 transition-colors">
              View All Requests
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
