import React, { useState, useEffect } from 'react';
import { PageHeader, ConfirmModal, Card, Button, Badge } from '../../components/ui';
import { GraduationCap, Plus, Search, Loader2, Edit, Trash2, BookOpen, Check, Mail, Lock, Phone } from 'lucide-react';
import { collection, query, onSnapshot, setDoc, deleteDoc, doc, where, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';

type Student = {
  id: string;
  name: string;
  email: string;
  assignedClass: string;
  section?: string;
  rollNumber?: string;
  phone?: string;
  password?: string;
  status: string;
  createdAt: any;
};

export default function Students() {
  const { user } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteStudentId, setDeleteStudentId] = useState<string | null>(null);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    assignedClass: '',
    password: '',
    phone: '',
    rollNumber: ''
  });

  const confirmDelete = async () => {
    if (!deleteStudentId) return;
    const targetId = deleteStudentId;
    setStudents(prev => prev.filter(s => s.id !== targetId));
    setDeleteStudentId(null);
    try {
      await deleteDoc(doc(db, 'users', targetId));
    } catch (error) {
      console.error("Error deleting student:", error);
      alert("Failed to delete student from database.");
    }
  };

  const handleUpdateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;
    setIsSubmitting(true);
    try {
      await updateDoc(doc(db, 'users', editingStudent.id), {
        name: editingStudent.name,
        assignedClass: editingStudent.assignedClass,
        phone: editingStudent.phone || '',
        rollNumber: editingStudent.rollNumber || '',
        status: editingStudent.status || 'Active'
      });
      alert("Student details and Class/Section assignment updated!");
      setEditingStudent(null);
    } catch (error) {
      console.error("Error updating student:", error);
      alert("Failed to update student.");
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    
    let q;
    const targetInstId = user.institutionId || (user.role === 'INSTITUTION' ? user.id : null);
    if (user.role === 'SUPER_ADMIN' || !targetInstId) {
      q = query(collection(db, 'users'), where('role', '==', 'STUDENT'));
    } else {
      q = query(collection(db, 'users'), where('role', '==', 'STUDENT'), where('institutionId', '==', targetInstId));
    }
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: Student[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as Student);
      });
      list.sort((a, b) => {
        const timeA = a.createdAt?.seconds || 0;
        const timeB = b.createdAt?.seconds || 0;
        return timeB - timeA;
      });
      setStudents(list);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching students:", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const instId = user?.institutionId || (user?.role === 'INSTITUTION' ? user?.id : null);
    if (!instId) return;
    
    setIsSubmitting(true);
    try {
      if (!formData.email || !formData.password) {
        alert("Email and password are required.");
        setIsSubmitting(false);
        return;
      }
      if (formData.password.length < 6) {
        alert('Password must be at least 6 characters long.');
        setIsSubmitting(false);
        return;
      }
      
      const { initializeApp } = await import('firebase/app');
      const { getAuth, createUserWithEmailAndPassword, signOut } = await import('firebase/auth');
      const { app } = await import('../../lib/firebase');
      
      const secondaryApp = initializeApp(app.options, "SecondaryApp" + Date.now());
      const secondaryAuth = getAuth(secondaryApp);
      
      const userCred = await createUserWithEmailAndPassword(secondaryAuth, formData.email, formData.password);
      
      await setDoc(doc(db, 'users', userCred.user.uid), {
        email: formData.email,
        name: formData.name,
        role: 'STUDENT',
        institutionId: instId,
        assignedClass: formData.assignedClass,
        phone: formData.phone || '',
        rollNumber: formData.rollNumber || '',
        password: formData.password,
        status: 'Active',
        createdAt: serverTimestamp()
      });
      
      await signOut(secondaryAuth);
      
      setShowForm(false);
      setFormData({ name: '', email: '', assignedClass: '', password: '', phone: '', rollNumber: '' });
      alert("Student registered successfully.");
    } catch (error) {
      console.error("Error adding student:", error);
      alert("Failed to submit student. Please check console for details.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredStudents = students.filter(s =>
    s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.assignedClass?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <PageHeader 
        title="Student Roster & Enrollment" 
        description="Enroll students into specific classes/sections to map homework, attendance, and study groups."
        badge="Institution Governance"
        breadcrumbs={[{ label: 'Institution' }, { label: 'Student Directory' }]}
        action={
          <Button 
            onClick={() => setShowForm(!showForm)}
            icon={<Plus className="w-4 h-4" />}
          >
            Enroll New Student
          </Button>
        }
      />

      {showForm && (
        <Card className="animate-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-3 pb-4 mb-6 border-b border-slate-100 dark:border-slate-800">
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Enroll Student Profile</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Assign roll number, class section & credentials</p>
            </div>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="grid md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">Full Name</label>
                <input 
                  type="text" 
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:border-indigo-500 text-sm outline-none transition" 
                  placeholder="e.g. Alex Johnson" 
                />
              </div>
              
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">Assign Class & Section</label>
                <input 
                  type="text" 
                  required
                  value={formData.assignedClass}
                  onChange={(e) => setFormData({...formData, assignedClass: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:border-indigo-500 text-sm outline-none transition" 
                  placeholder="e.g. Grade 10-A" 
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">Email Address</label>
                <input 
                  type="email" 
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:border-indigo-500 text-sm outline-none transition" 
                  placeholder="student@school.com" 
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">Password</label>
                <input 
                  type="password"
                  minLength={6} 
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:border-indigo-500 text-sm outline-none transition" 
                  placeholder="Create a password" 
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">Roll Number / ID</label>
                <input 
                  type="text"
                  value={formData.rollNumber}
                  onChange={(e) => setFormData({...formData, rollNumber: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:border-indigo-500 text-sm outline-none transition" 
                  placeholder="e.g. STU-1002" 
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">Parent / Contact Phone</label>
                <input 
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:border-indigo-500 text-sm outline-none transition" 
                  placeholder="+1 (555) 000-0000" 
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
              <Button type="submit" isLoading={isSubmitting}>
                Add Student
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Edit Modal */}
      {editingStudent && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200 space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Edit Student Profile</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">Update class section and roll details</p>
              </div>
            </div>

            <form onSubmit={handleUpdateStudent} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">Student Name</label>
                <input 
                  type="text" 
                  required
                  value={editingStudent.name}
                  onChange={e => setEditingStudent({...editingStudent, name: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:border-indigo-500 text-sm outline-none transition" 
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">Assigned Class & Section</label>
                <input 
                  type="text" 
                  required
                  value={editingStudent.assignedClass}
                  onChange={e => setEditingStudent({...editingStudent, assignedClass: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:border-indigo-500 text-sm outline-none transition" 
                  placeholder="e.g. Grade 10-A"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">Roll Number / Student ID</label>
                <input 
                  type="text" 
                  value={editingStudent.rollNumber || ''}
                  onChange={e => setEditingStudent({...editingStudent, rollNumber: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:border-indigo-500 text-sm outline-none transition" 
                  placeholder="e.g. STU-1002"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <Button type="button" variant="ghost" onClick={() => setEditingStudent(null)}>
                  Cancel
                </Button>
                <Button type="submit" isLoading={isSubmitting} icon={<Check className="w-4 h-4" />}>
                  Save Changes
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Students Table Card */}
      <Card className="p-0 overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="relative w-full sm:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input 
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search by student name, email, or class..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-800 rounded-xl text-xs font-medium text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:border-indigo-500 transition"
            />
          </div>
          <Badge variant="success">{filteredStudents.length} Enrolled Students</Badge>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Student Profile</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Contact & Credentials</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Class & Section</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-600" />
                    Loading student roster...
                  </td>
                </tr>
              ) : filteredStudents.map((student) => (
                <tr key={student.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold text-sm shrink-0">
                        {student.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">{student.name}</p>
                        <p className="text-[11px] text-slate-400 font-mono">Roll: {student.rollNumber || student.id.slice(0, 8)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col gap-1 text-xs text-slate-600 dark:text-slate-300">
                      <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-slate-400" /> {student.email}</span>
                      <span className="flex items-center gap-1.5 font-mono text-[11px] text-slate-400"><Lock className="w-3 h-3 text-slate-400" /> {student.password || '******'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant="emerald">
                      {student.assignedClass || 'Unassigned'}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant="success" dot>Active</Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setEditingStudent(student)}
                        icon={<Edit className="w-3.5 h-3.5" />}
                      >
                        Edit
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
              ))}
              {!isLoading && filteredStudents.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400 text-sm">
                    No students found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <ConfirmModal
        isOpen={!!deleteStudentId}
        title="Delete Student Account"
        message="Are you sure you want to remove this student? This action cannot be undone."
        onConfirm={confirmDelete}
        onCancel={() => setDeleteStudentId(null)}
      />
    </div>
  );
}
