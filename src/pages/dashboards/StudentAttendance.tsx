import React, { useState, useEffect } from 'react';
import { PageHeader, StatCard } from '../../components/ui';
import { Calendar as CalendarIcon, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';

export default function StudentAttendance() {
  const { user } = useAuth();
  const [attendance, setAttendance] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    
    // Sort client-side because of compound queries on 'date' not having an index by default maybe
    const q = query(
      collection(db, 'attendance'),
      where('studentId', '==', user.id)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: any[] = [];
      snapshot.forEach(doc => list.push({ id: doc.id, ...doc.data() }));
      list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setAttendance(list);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const presentCount = attendance.filter(a => a.status === 'Present').length;
  const totalCount = attendance.length;
  const percentage = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader 
        title="My Attendance" 
        description="View your attendance history."
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        <StatCard title="Total Classes" value={totalCount} icon={<CalendarIcon className="w-6 h-6" />} />
        <StatCard title="Classes Attended" value={presentCount} icon={<CheckCircle2 className="w-6 h-6" />} />
        <StatCard title="Attendance Rate" value={`${percentage}%`} icon={<CheckCircle2 className="w-6 h-6 text-emerald-500" />} />
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden p-6 md:p-8">
        <h3 className="font-bold text-slate-900 text-lg mb-6">Attendance History</h3>
        {isLoading ? (
          <div className="p-12 flex justify-center text-indigo-600"><Loader2 className="w-8 h-8 animate-spin" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Date</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {attendance.map((record) => (
                  <tr key={record.id} className="hover:bg-slate-50/50">
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">
                      {new Date(record.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </td>
                    <td className="px-6 py-4">
                      {record.status === 'Present' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-100 text-emerald-700">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Present
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-rose-100 text-rose-700">
                          <XCircle className="w-3.5 h-3.5" /> Absent
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
                {attendance.length === 0 && (
                  <tr>
                    <td colSpan={2} className="px-6 py-12 text-center text-slate-500">
                      No attendance records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
