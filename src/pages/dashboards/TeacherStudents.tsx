import React, { useState, useEffect } from 'react';
import { PageHeader, ConfirmModal, Card, Button, Badge } from '../../components/ui';
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
    <div className="max-w-7xl mx-auto space-y-8">
      <PageHeader 
        title="Class Roster & Assigned Students" 
        description="Students assigned by Principal according to your timetable and class section schedule."
        badge="Faculty Portal"
        breadcrumbs={[{ label: 'Faculty' }, { label: 'Class Roster' }]}
        action={
          <Button 
            onClick={() => setShowAddModal(true)}
            icon={<UserPlus className="w-4 h-4" />}
          >
            Add Student to Class
          </Button>
        }
      />

      {/* Teacher Assigned Banner */}
      {teacherAssignedClasses.length > 0 && (
        <div className="bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-950 rounded-3xl p-6 text-white shadow-xl border border-indigo-800/60 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-indigo-300 font-bold text-xs uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4 text-emerald-400" /> Principal Assigned Teaching Load
            </div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              Classes & Sections Managed By You:
            </h3>
            <div className="flex flex-wrap gap-2 pt-1">
              {teacherAssignedClasses.map((cls, idx) => (
                <span key={idx} className="px-3 py-1 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-xl text-xs font-bold flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-indigo-300" /> {cls}
                </span>
              ))}
            </div>
          </div>
          <Button 
            variant={selectedClassFilter === 'MyAssigned' ? 'success' : 'secondary'}
            onClick={() => setSelectedClassFilter(selectedClassFilter === 'MyAssigned' ? 'All' : 'MyAssigned')}
            icon={<CheckCircle2 className="w-4 h-4" />}
          >
            {selectedClassFilter === 'MyAssigned' ? 'Filter Active (My Classes Only)' : 'Show Only My Assigned Classes'}
          </Button>
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200 space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                <UserPlus className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Add Student to Class Roster</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">Assign roll number and class section</p>
              </div>
            </div>

            <form onSubmit={handleAddStudent} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">Full Name</label>
                <input 
                  type="text" 
                  required
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:border-indigo-500 text-sm outline-none transition" 
                  placeholder="e.g. Alex Johnson"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">Student Email</label>
                <input 
                  type="email" 
                  required
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:border-indigo-500 text-sm outline-none transition" 
                  placeholder="student@school.com"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">Class Section</label>
                  <input 
                    type="text" 
                    required
                    value={formData.className}
                    onChange={e => setFormData({...formData, className: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:border-indigo-500 text-sm outline-none transition" 
                    placeholder="Class 10-A"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">Roll Number</label>
                  <input 
                    type="text" 
                    value={formData.rollNumber}
                    onChange={e => setFormData({...formData, rollNumber: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:border-indigo-500 text-sm outline-none transition" 
                    placeholder="10A-04"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">Contact Phone</label>
                <input 
                  type="text" 
                  value={formData.phone}
                  onChange={e => setFormData({...formData, phone: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:border-indigo-500 text-sm outline-none transition" 
                  placeholder="+1 (555) 000-0000"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <Button type="button" variant="ghost" onClick={() => setShowAddModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" isLoading={isSubmitting}>
                  Save Student
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      {viewStudent && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200 space-y-6">
            <div className="flex items-center gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400 flex items-center justify-center text-xl font-bold">
                {viewStudent.name?.charAt(0) || 'S'}
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">{viewStudent.name}</h3>
                <Badge variant="success" dot className="mt-1">
                  {viewStudent.status || 'Active Student'}
                </Badge>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl">
                <BookOpen className="w-4 h-4 text-indigo-500 shrink-0" />
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400">Class & Section Assigned</p>
                  <p className="font-bold text-slate-900 dark:text-white text-sm">{viewStudent.assignedClass || viewStudent.className || 'Class 10-A'}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl">
                <Award className="w-4 h-4 text-amber-500 shrink-0" />
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400">Roll Number / ID</p>
                  <p className="font-mono font-bold text-slate-900 dark:text-white text-sm">{viewStudent.rollNumber || viewStudent.id.slice(0, 10)}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl">
                <Mail className="w-4 h-4 text-blue-500 shrink-0" />
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400">Email Address</p>
                  <p className="font-bold text-slate-900 dark:text-white text-sm">{viewStudent.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl">
                <Phone className="w-4 h-4 text-emerald-500 shrink-0" />
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400">Parent / Contact Phone</p>
                  <p className="font-bold text-slate-900 dark:text-white text-sm">{viewStudent.phone || 'N/A'}</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
              <Button onClick={() => setViewStudent(null)}>
                Close Details
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Main Roster Card */}
      <Card className="p-0 overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Filter students by name, email, or roll no..." 
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-800 rounded-xl text-xs font-medium text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:border-indigo-500 transition"
            />
          </div>
          
          <select 
            value={selectedClassFilter}
            onChange={e => setSelectedClassFilter(e.target.value)}
            className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl text-xs font-bold outline-none cursor-pointer"
          >
            <option value="All">All Classes & Sections</option>
            {teacherAssignedClasses.length > 0 && <option value="MyAssigned">⭐ My Assigned Classes Only</option>}
            {availableClasses.map((cls, idx) => (
              <option key={idx} value={cls}>{cls}</option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-12 flex justify-center text-indigo-600">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Student Name</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Class & Section</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Roll No</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredStudents.map((student) => {
                  const studentClass = student.assignedClass || student.className || 'Class 10-A';
                  const isTeacherClass = teacherAssignedClasses.some(tc => studentClass.toLowerCase().includes(tc.toLowerCase()));

                  return (
                    <tr key={student.id} className={`hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors ${isTeacherClass ? 'bg-indigo-50/20 dark:bg-indigo-950/20' : ''}`}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3.5">
                          <div className="w-9 h-9 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400 flex items-center justify-center font-bold text-xs shrink-0">
                            {student.name?.charAt(0) || 'S'}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                              {student.name}
                              {isTeacherClass && (
                                <Badge variant="primary">Your Class</Badge>
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
                          className="px-3 py-1 bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200/80 dark:border-indigo-800/80 text-indigo-700 dark:text-indigo-300 rounded-lg text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                          title="Click to edit student class/section"
                        />
                      </td>
                      <td className="px-6 py-4 text-xs font-medium text-slate-600 dark:text-slate-300">{student.email}</td>
                      <td className="px-6 py-4 text-xs font-mono text-slate-500 dark:text-slate-400">{student.rollNumber || 'STU-1001'}</td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => setViewStudent(student)}
                            icon={<Eye className="w-3.5 h-3.5" />}
                          >
                            Details
                          </Button>
                          <Button 
                            variant="danger" 
                            size="sm"
                            onClick={() => setDeleteStudentId(student.id)}
                            icon={<Trash2 className="w-3.5 h-3.5" />}
                          >
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredStudents.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400 text-sm">
                      No students found matching your criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </Card>

      <ConfirmModal
        isOpen={!!deleteStudentId}
        title="Remove Student from Roster"
        message="Are you sure you want to remove this student account from your class system?"
        onConfirm={confirmDeleteStudent}
        onCancel={() => setDeleteStudentId(null)}
      />
    </div>
  );
}
