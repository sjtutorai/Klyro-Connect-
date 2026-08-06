import React, { useState, useEffect } from 'react';
import { PageHeader, Card, Button, Badge } from '../../components/ui';
import { Users, Loader2, Calendar as CalendarIcon, Check, X, CheckCircle2, UserX } from 'lucide-react';
import { collection, query, where, onSnapshot, setDoc, doc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';

export default function TeacherAttendance() {
  const { user } = useAuth();
  const [students, setStudents] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (!user?.institutionId) return;
    const q = query(
      collection(db, 'users'), 
      where('role', '==', 'STUDENT'),
      where('institutionId', '==', user.institutionId)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: any[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() });
      });
      setStudents(list);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  // Load attendance for selected date
  useEffect(() => {
    if (!user?.institutionId) return;
    const q = query(collection(db, 'attendance'), where('date', '==', date), where('institutionId', '==', user.institutionId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const att: Record<string, string> = {};
      snapshot.forEach(doc => {
        const data = doc.data();
        att[data.studentId] = data.status; // 'Present', 'Absent'
      });
      setAttendance(att);
    });
    return () => unsubscribe();
  }, [user, date]);

  const handleMarkAttendance = async (studentId: string, status: string) => {
    try {
      const id = `${date}_${studentId}`;
      await setDoc(doc(db, 'attendance', id), {
        date,
        studentId,
        institutionId: user?.institutionId,
        status
      });
    } catch (error) {
      console.error(error);
      alert('Failed to mark attendance.');
    }
  };

  const totalPresent = Object.values(attendance).filter(s => s === 'Present').length;
  const totalAbsent = Object.values(attendance).filter(s => s === 'Absent').length;

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <PageHeader 
        title="Class Attendance Registry" 
        description="Mark and maintain daily student attendance records across assigned classes."
        badge="Academic Management"
        breadcrumbs={[{ label: 'Faculty' }, { label: 'Attendance' }]}
      />

      <Card className="p-0 overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Attendance Date</label>
              <input 
                type="date" 
                value={date} 
                onChange={e => setDate(e.target.value)} 
                className="px-3 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-800 rounded-xl outline-none focus:border-indigo-500 text-xs font-bold text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Badge variant="emerald" icon={<CheckCircle2 className="w-3.5 h-3.5" />}>
              Present: {totalPresent}
            </Badge>
            <Badge variant="rose" icon={<UserX className="w-3.5 h-3.5" />}>
              Absent: {totalAbsent}
            </Badge>
          </div>
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
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Student Profile</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Class Section</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Mark Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {students.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3.5">
                        <div className="w-9 h-9 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400 font-bold flex items-center justify-center text-xs shrink-0">
                          {student.name?.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900 dark:text-white">{student.name}</p>
                          <p className="text-[11px] text-slate-400 font-mono">Roll: {student.rollNumber || 'N/A'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="secondary">
                        {student.assignedClass || student.className || 'Class 10-A'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button 
                          variant={attendance[student.id] === 'Present' ? 'success' : 'ghost'}
                          size="sm"
                          onClick={() => handleMarkAttendance(student.id, 'Present')}
                          icon={<Check className="w-3.5 h-3.5" />}
                        >
                          Present
                        </Button>
                        <Button 
                          variant={attendance[student.id] === 'Absent' ? 'danger' : 'ghost'}
                          size="sm"
                          onClick={() => handleMarkAttendance(student.id, 'Absent')}
                          icon={<X className="w-3.5 h-3.5" />}
                        >
                          Absent
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {students.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-6 py-12 text-center text-slate-400 text-sm">
                      No students enrolled in this institution.
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
