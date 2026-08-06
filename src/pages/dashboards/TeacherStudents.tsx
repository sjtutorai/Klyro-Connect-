import React, { useState, useEffect } from 'react';
import { PageHeader } from '../../components/ui';
import { Users, Search, Loader2, Plus, UserPlus, BookOpen, Check, Trash2 } from 'lucide-react';
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';

export default function TeacherStudents() {
  const { user } = useAuth();
  const [students, setStudents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClassFilter, setSelectedClassFilter] = useState('All');
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    className: 'Class 10-A',
    rollNumber: ''
  });

  const [editingStudent, setEditingStudent] = useState<any | null>(null);

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

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.institutionId) return;
    setIsSubmitting(true);
    try {
      // Create user record in Firestore
      const newDocRef = doc(collection(db, 'users'));
      await setDoc(newDocRef, {
        name: formData.name,
        email: formData.email,
        role: 'STUDENT',
        institutionId: user.institutionId,
        className: formData.className,
        rollNumber: formData.rollNumber || `ROLL-${Math.floor(1000 + Math.random() * 9000)}`,
        teacherId: user.id,
        createdAt: new Date().toISOString()
      });
      setShowAddModal(false);
      setFormData({ name: '', email: '', className: 'Class 10-A', rollNumber: '' });
      alert('Student added to class successfully.');
    } catch (error) {
      console.error(error);
      alert('Failed to add student to class.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteStudent = async (studentId: string) => {
    if (window.confirm('Are you sure you want to remove/delete this student from the system?')) {
      try {
        const { deleteDoc, doc } = await import('firebase/firestore');
        await deleteDoc(doc(db, 'users', studentId));
      } catch (error) {
        console.error("Error deleting student:", error);
        alert('Failed to delete student.');
      }
    }
  };

  const handleAssignClass = async (studentId: string, className: string) => {
    try {
      await updateDoc(doc(db, 'users', studentId), { className });
    } catch (error) {
      console.error(error);
      alert('Failed to update student class.');
    }
  };

  const filteredStudents = students.filter(s => {
    const matchesSearch = s.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          s.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          s.rollNumber?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClass = selectedClassFilter === 'All' || (s.className || 'Class 10-A') === selectedClassFilter;
    return matchesSearch && matchesClass;
  });

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader 
        title="Class Roster & Students" 
        description="View registered students, assign them to classes, and manage student information."
        action={
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-indigo-700 transition shadow-sm"
          >
            <UserPlus className="w-5 h-5" /> Add Student to Class
          </button>
        }
      />

      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-xl animate-in zoom-in-95 duration-200">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Add Student to Class</h2>
            <form onSubmit={handleAddStudent} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                <input 
                  type="text" 
                  required
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-600 outline-none text-sm"
                  placeholder="e.g. Alex Johnson"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Student Email</label>
                <input 
                  type="email" 
                  required
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-600 outline-none text-sm"
                  placeholder="student@school.com"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Assign Class</label>
                  <select 
                    value={formData.className}
                    onChange={e => setFormData({...formData, className: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-600 outline-none text-sm bg-white"
                  >
                    <option value="Class 10-A">Class 10-A</option>
                    <option value="Class 10-B">Class 10-B</option>
                    <option value="Grade 9 Science">Grade 9 Science</option>
                    <option value="Grade 11 Math">Grade 11 Math</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Roll / ID Number</label>
                  <input 
                    type="text" 
                    value={formData.rollNumber}
                    onChange={e => setFormData({...formData, rollNumber: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-600 outline-none text-sm"
                    placeholder="e.g. 10A-04"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setShowAddModal(false)}
                  className="px-5 py-2 border border-slate-200 text-slate-700 rounded-xl font-medium text-sm hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-indigo-600 text-white rounded-xl font-medium text-sm hover:bg-indigo-700 flex items-center gap-2"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Save Student
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/50">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input 
              type="text" 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search students by name, email, or roll no..." 
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-600 outline-none text-sm"
            />
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <select 
              value={selectedClassFilter}
              onChange={e => setSelectedClassFilter(e.target.value)}
              className="px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-medium text-sm outline-none"
            >
              <option value="All">All Classes</option>
              <option value="Class 10-A">Class 10-A</option>
              <option value="Class 10-B">Class 10-B</option>
              <option value="Grade 9 Science">Grade 9 Science</option>
              <option value="Grade 11 Math">Grade 11 Math</option>
            </select>
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
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Class / Section</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Email</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Roll No</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-50/50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm">
                          {student.name?.charAt(0) || 'S'}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">{student.name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <select 
                        value={student.className || 'Class 10-A'}
                        onChange={(e) => handleAssignClass(student.id, e.target.value)}
                        className="px-3 py-1 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-lg text-xs font-bold outline-none cursor-pointer"
                      >
                        <option value="Class 10-A">Class 10-A</option>
                        <option value="Class 10-B">Class 10-B</option>
                        <option value="Grade 9 Science">Grade 9 Science</option>
                        <option value="Grade 11 Math">Grade 11 Math</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{student.email}</td>
                    <td className="px-6 py-4 text-sm font-mono text-slate-500">{student.rollNumber || '10A-01'}</td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-3">
                        <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md">Enrolled</span>
                        <button 
                          onClick={() => handleDeleteStudent(student.id)}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors flex items-center gap-1 text-xs font-medium"
                          title="Delete Student"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span className="hidden sm:inline">Delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredStudents.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                      No students found matching your criteria.
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
