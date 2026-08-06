import React, { useState, useEffect } from 'react';
import { PageHeader } from '../../components/ui';
import { Users, Search, Loader2 } from 'lucide-react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';

export default function TeacherStudents() {
  const { user } = useAuth();
  const [students, setStudents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user?.institutionId) return;

    // Fetch students of the same institution
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

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader 
        title="My Students" 
        description="View and manage students in your institution classes."
      />
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search students..." 
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-600 outline-none text-sm"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-12 flex justify-center text-indigo-600">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Student Name</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Email</th>
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
                    <td className="px-6 py-4 text-sm text-slate-600">{student.email}</td>
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
          )}
        </div>
      </div>
    </div>
  );
}
