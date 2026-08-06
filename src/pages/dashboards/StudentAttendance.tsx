import React, { useState, useEffect } from 'react';
import { PageHeader, StatCard, Card, Badge } from '../../components/ui';
import { Calendar as CalendarIcon, Loader2, CheckCircle2, XCircle, Award, Percent } from 'lucide-react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';

export default function StudentAttendance() {
  const { user } = useAuth();
  const [attendance, setAttendance] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    
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
    <div className="max-w-7xl mx-auto space-y-8">
      <PageHeader 
        title="Personal Attendance History" 
        description="Monitor your attendance rate, present days, and recorded absences."
        badge="Student Portal"
        breadcrumbs={[{ label: 'Student' }, { label: 'Attendance' }]}
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <StatCard title="Total Classes Recorded" value={totalCount} icon={<CalendarIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />} />
        <StatCard title="Classes Attended" value={presentCount} icon={<CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />} />
        <StatCard title="Attendance Rate" value={`${percentage}%`} icon={<Percent className="w-5 h-5 text-blue-600 dark:text-blue-400" />} />
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 dark:text-white text-base">Recorded Sessions</h3>
          <Badge variant={percentage >= 75 ? 'emerald' : 'rose'}>
            {percentage >= 75 ? 'Satisfactory Attendance' : 'Low Attendance Alert'}
          </Badge>
        </div>

        {isLoading ? (
          <div className="p-12 flex justify-center text-indigo-600">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {attendance.map((record) => (
                  <tr key={record.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-6 py-4 text-xs font-bold text-slate-900 dark:text-white">
                      {new Date(record.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {record.status === 'Present' ? (
                        <Badge variant="emerald" icon={<CheckCircle2 className="w-3.5 h-3.5" />}>
                          Present
                        </Badge>
                      ) : (
                        <Badge variant="rose" icon={<XCircle className="w-3.5 h-3.5" />}>
                          Absent
                        </Badge>
                      )}
                    </td>
                  </tr>
                ))}
                {attendance.length === 0 && (
                  <tr>
                    <td colSpan={2} className="px-6 py-12 text-center text-slate-400 text-sm">
                      No attendance records found yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
