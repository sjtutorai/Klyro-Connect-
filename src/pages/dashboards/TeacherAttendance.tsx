import React, { useState, useEffect } from 'react';
import { PageHeader } from '../../components/ui';
import { Users, Loader2, Calendar as CalendarIcon, Check, X } from 'lucide-react';
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

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader 
        title="Class Attendance" 
        description="Mark and view student attendance."
      />
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden p-6 md:p-8">
        <div className="mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <CalendarIcon className="w-5 h-5 text-slate-400" />
            <input 
              type="date" 
              value={date} 
              onChange={e => setDate(e.target.value)} 
              className="px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-600"
            />
          </div>
        </div>
        
        {isLoading ? (
          <div className="p-12 flex justify-center text-indigo-600"><Loader2 className="w-8 h-8 animate-spin" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Student Name</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-50/50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs">
                          {student.name?.charAt(0)}
                        </div>
                        <span className="text-sm font-medium text-slate-900">{student.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleMarkAttendance(student.id, 'Present')}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 transition ${attendance[student.id] === 'Present' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                        >
                          <Check className="w-4 h-4" /> Present
                        </button>
                        <button 
                          onClick={() => handleMarkAttendance(student.id, 'Absent')}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 transition ${attendance[student.id] === 'Absent' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                        >
                          <X className="w-4 h-4" /> Absent
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {students.length === 0 && (
                  <tr>
                    <td colSpan={2} className="px-6 py-12 text-center text-slate-500">
                      No students found.
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
