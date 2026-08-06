import React, { useState, useEffect } from 'react';
import { PageHeader, ConfirmModal } from '../../components/ui';
import { Users, Search, Loader2, UserPlus, Trash2, Eye, Award, Phone, Mail, BookOpen, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { collection, query, where, onSnapshot, updateDoc, doc, deleteDoc, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';

export default function TeacherStudents() {
  const { user } = useAuth();
  const [students, setStudents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClassFilter, setSelectedClassFilter] = useState('All');
  const [deleteStudentId, setDeleteStudentId] = useState<string | null>(null);
  const [viewStudent, setViewStudent] = useState<any | null>(null);
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    className: 'Class 10-A',
    rollNumber: '',
    phone: ''
  });

  const teacherAssignedClasses = user?.assignedClasses ? user.assignedClasses.split(',').map((c: string) => c.trim()) : [];

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
      const newDocRef = doc(collection(db, 'users'));
      await setDoc(newDocRef, {
        name: formData.name,
        email: formData.email,
        role: 'STUDENT',
        institutionId: user.institutionId,
        assignedClass: formData.className,
        className: formData.className,
        rollNumber: formData.rollNumber || `ROLL-${Math.floor(1000 + Math.random() * 9000)}`,
        phone: formData.phone || '',
        teacherId: user.id,
        status: 'Active',
        createdAt: new Date().toISOString()
      });
      setShowAddModal(false);
      setFormData({ name: '', email: '', className: 'Class 10-A', rollNumber: '', phone: '' });
      alert('Student added to class successfully.');
    } catch (error) {
      console.error(error);
      alert('Failed to add student to class.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDeleteStudent = async () => {
    if (!deleteStudentId) return;
    const targetId = deleteStudentId;
    setStudents(prev => prev.filter(s => s.id !== targetId));
    setDeleteStudentId(null);
    try {
      await deleteDoc(doc(db, 'users', targetId));
    } catch (error) {
      console.error("Error deleting student:", error);
      alert('Failed to delete student from database.');
    }
  };

  const handleAssignClass = async (studentId: string, className: string) => {
    try {
      await updateDoc(doc(db, 'users', studentId), { assignedClass: className, className });
    } catch (error) {
      console.error(error);
      alert('Failed to update student class.');
    }
  };

  // Extract unique available classes
  const availableClasses = Array.from(new Set(students.map(s => s.assignedClass || s.className || 'Class 10-A'))).filter(Boolean);

  const filteredStudents = students.filter(s => {
    const studentClass = s.assignedClass || s.className || 'Class 10-A';
    const matchesSearch = s.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          s.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          s.rollNumber?.toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesClass = true;
    if (selectedClassFilter === 'MyAssigned' && teacherAssignedClasses.length > 0) {
      matchesClass = teacherAssignedClasses.some(tc => studentClass.toLowerCase().includes(tc.toLowerCase()));
    } else if (selectedClassFilter !== 'All') {
      matchesClass = studentClass === selectedClassFilter;
    }
    return matchesSearch && matchesClass;
  });

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader 
        title="Class Roster & Assigned Students" 
        description="View students assigned by the Principal, manage class rosters, and access student records."
        action={
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-indigo-700 transition shadow-sm"
          >
            <UserPlus className="w-5 h-5" /> Add Student to Class
          </button>
        }
      />

      {/* Teacher Assigned Banner */}
      {teacherAssignedClasses.length > 0 && (
        <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-indigo-950 rounded-2xl p-6 text-white mb-6 shadow-md border border-indigo-700/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-indigo-300 font-semibold text-xs uppercase tracking-wider mb-1">
              <ShieldCheck className="w-4 h-4 text-emerald-400" /> Principal Assigned Teaching Classes & Sections
            </div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              Assigned to You:
            </h3>
            <div className="flex flex-wrap gap-2 mt-2">
              {teacherAssignedClasses.map((cls, idx) => (
                <span key={idx} className="px-3 py-1 bg-white/10 backdrop-blur-sm border border-white/20 text-white rounded-lg text-sm font-semibold flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-indigo-300" /> {cls}
                </span>
              ))}
            </div>
          </div>
          <button 
            onClick={() => setSelectedClassFilter(selectedClassFilter === 'MyAssigned' ? 'All' : 'MyAssigned')}
            className={`px-4 py-2.5 rounded-xl text-sm font-bold transition flex items-center gap-2 shadow-sm ${
              selectedClassFilter === 'MyAssigned' 
                ? 'bg-emerald-500 text-white hover:bg-emerald-600' 
                : 'bg-white text-indigo-900 hover:bg-indigo-50'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" /> 
            {selectedClassFilter === 'MyAssigned' ? 'Showing My Classes Only' : 'Filter My Assigned Classes'}
          </button>
        </div>
      )}

      {/* Add Modal */}
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
                  <label className="block text-sm font-medium text-slate-700 mb-1">Assign Class & Section</label>
                  <input 
                    type="text" 
                    required
                    value={formData.className}
                    onChange={e => setFormData({...formData, className: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-600 outline-none text-sm bg-white"
                    placeholder="e.g. Class 10-A"
                  />
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

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Contact Phone</label>
                <input 
                  type="text" 
                  value={formData.phone}
                  onChange={e => setFormData({...formData, phone: e.target.value})}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-600 outline-none text-sm"
                  placeholder="+1 (555) 000-0000"
                />
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

      {/* View Details Modal */}
      {viewStudent && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-lg w-full shadow-xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-4 mb-6 pb-4 border-b border-slate-100">
              <div className="w-14 h-14 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-2xl font-bold">
                {viewStudent.name?.charAt(0) || 'S'}
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">{viewStudent.name}</h3>
                <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold inline-block mt-1">
                  {viewStudent.status || 'Active Student'}
                </span>
              </div>
            </div>

            <div className="space-y-4 text-sm">
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                <BookOpen className="w-5 h-5 text-indigo-600 shrink-0" />
                <div>
                  <p className="text-xs text-slate-500 font-medium">Class & Section Assigned</p>
                  <p className="font-bold text-slate-900">{viewStudent.assignedClass || viewStudent.className || 'Class 10-A'}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                <Award className="w-5 h-5 text-amber-600 shrink-0" />
                <div>
                  <p className="text-xs text-slate-500 font-medium">Roll Number / Student ID</p>
                  <p className="font-mono font-bold text-slate-900">{viewStudent.rollNumber || viewStudent.id.slice(0, 10)}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                <Mail className="w-5 h-5 text-blue-600 shrink-0" />
                <div>
                  <p className="text-xs text-slate-500 font-medium">Email Address</p>
                  <p className="font-semibold text-slate-900">{viewStudent.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                <Phone className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <p className="text-xs text-slate-500 font-medium">Parent / Contact Phone</p>
                  <p className="font-semibold text-slate-900">{viewStudent.phone || 'N/A'}</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-6 border-t border-slate-100 mt-6">
              <button 
                onClick={() => setViewStudent(null)}
                className="px-6 py-2.5 bg-slate-900 text-white rounded-xl font-medium text-sm hover:bg-slate-800 transition"
              >
                Close Details
              </button>
            </div>
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
              <option value="All">All Classes & Sections</option>
              {teacherAssignedClasses.length > 0 && <option value="MyAssigned">⭐ My Assigned Classes</option>}
              {availableClasses.map((cls, idx) => (
                <option key={idx} value={cls}>{cls}</option>
              ))}
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
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Class & Section</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Email</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Roll No</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.map((student) => {
                  const studentClass = student.assignedClass || student.className || 'Class 10-A';
                  const isTeacherClass = teacherAssignedClasses.some(tc => studentClass.toLowerCase().includes(tc.toLowerCase()));

                  return (
                    <tr key={student.id} className={`hover:bg-slate-50/50 ${isTeacherClass ? 'bg-indigo-50/20' : ''}`}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm">
                            {student.name?.charAt(0) || 'S'}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                              {student.name}
                              {isTeacherClass && (
                                <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-[10px] font-bold rounded-full">Your Class</span>
                              )}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <input
                          type="text"
                          defaultValue={studentClass}
                          onBlur={(e) => handleAssignClass(student.id, e.target.value)}
                          className="px-3 py-1 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-lg text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-600"
                          title="Click to edit student class/section"
                        />
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">{student.email}</td>
                      <td className="px-6 py-4 text-sm font-mono text-slate-500">{student.rollNumber || 'STU-1001'}</td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => setViewStudent(student)}
                            className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors flex items-center gap-1 text-xs font-medium"
                            title="View Student Details"
                          >
                            <Eye className="w-4 h-4" />
                            <span>Details</span>
                          </button>
                          <button 
                            onClick={() => setDeleteStudentId(student.id)}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors flex items-center gap-1 text-xs font-medium"
                            title="Delete Student"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
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

      <ConfirmModal
        isOpen={!!deleteStudentId}
        title="Remove Student"
        message="Are you sure you want to remove/delete this student from the system? This action cannot be undone."
        onConfirm={confirmDeleteStudent}
        onCancel={() => setDeleteStudentId(null)}
      />
    </div>
  );
}

