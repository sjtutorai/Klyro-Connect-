import React, { useState, useEffect, useRef } from 'react';
import { PageHeader, ConfirmModal, Card, Button, Badge } from '../../components/ui';
import { GraduationCap, Plus, Search, Loader2, Edit, Trash2, BookOpen, Check, Mail, Lock, Phone, CheckCircle2, XCircle, FileSpreadsheet, FileText, Upload, Sparkles, UserCheck, Users } from 'lucide-react';
import { collection, query, onSnapshot, setDoc, deleteDoc, doc, where, serverTimestamp, updateDoc, getDocs, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import { PhoneInputWithCountry } from '../../components/ui/PhoneInputWithCountry';

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

type ParsedStudent = {
  name: string;
  email: string;
  password: string;
  assignedClass: string;
  rollNumber?: string;
};

export default function Students() {
  const { user } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [addMode, setAddMode] = useState<'manual' | 'excel' | 'pdf'>('manual');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteStudentId, setDeleteStudentId] = useState<string | null>(null);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // File parsing states
  const [isParsingFile, setIsParsingFile] = useState(false);
  const [parsedStudents, setParsedStudents] = useState<ParsedStudent[]>([]);
  const [parseMsg, setParseMsg] = useState<string | null>(null);
  const excelInputRef = useRef<HTMLInputElement | null>(null);
  const pdfInputRef = useRef<HTMLInputElement | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    assignedClass: '',
    password: '',
    phone: '',
    rollNumber: ''
  });

  const syncInstitutionStudentCount = async (delta: number) => {
    const instId = user?.institutionId || (user?.role === 'INSTITUTION' ? user?.id : null);
    if (!instId) return;
    try {
      const instRef = doc(db, 'institutions', instId);
      const instSnap = await getDoc(instRef);
      if (instSnap.exists()) {
        const currentCount = instSnap.data().studentsCount || 0;
        await updateDoc(instRef, {
          studentsCount: Math.max(0, currentCount + delta)
        });
      }
    } catch (e) {
      console.warn("Could not sync institution student count:", e);
    }
  };

  const confirmDelete = async () => {
    if (!deleteStudentId) return;
    const targetId = deleteStudentId;
    setStudents(prev => prev.filter(s => s.id !== targetId));
    setDeleteStudentId(null);
    try {
      await deleteDoc(doc(db, 'users', targetId));
      await syncInstitutionStudentCount(-1);
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
      const updateData: any = {
        name: editingStudent.name,
        assignedClass: editingStudent.assignedClass,
        phone: editingStudent.phone || '',
        rollNumber: editingStudent.rollNumber || '',
        status: editingStudent.status || 'Active'
      };
      
      if (editingStudent.password) {
        updateData.password = editingStudent.password;
      }

      await updateDoc(doc(db, 'users', editingStudent.id), updateData);
      alert("Student details updated!");
      setEditingStudent(null);
    } catch (error) {
      console.error("Error updating student:", error);
      alert("Failed to update student.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAcceptStudent = async (student: Student) => {
    try {
      await updateDoc(doc(db, 'users', student.id), { status: 'Active' });
      const q = query(collection(db, 'registration_requests'), where('uid', '==', student.id));
      const snap = await getDocs(q);
      snap.forEach(async (d) => {
        await updateDoc(doc(db, 'registration_requests', d.id), { status: 'Approved' });
      });
      alert(`✅ Student ${student.name} has been accepted and activated!`);
    } catch (err) {
      console.error("Error accepting student:", err);
      alert("Failed to accept student.");
    }
  };

  const handleDeclineStudent = async (student: Student) => {
    if (!confirm(`Decline registration request for student ${student.name}?`)) return;
    try {
      await updateDoc(doc(db, 'users', student.id), { status: 'Rejected' });
      const q = query(collection(db, 'registration_requests'), where('uid', '==', student.id));
      const snap = await getDocs(q);
      snap.forEach(async (d) => {
        await updateDoc(doc(db, 'registration_requests', d.id), { status: 'Declined' });
      });
      alert(`❌ Student ${student.name} registration request was declined.`);
    } catch (err) {
      console.error("Error declining student:", err);
      alert("Failed to decline student.");
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

      // Auto-generate student roll number/ID if blank
      const finalRollNumber = formData.rollNumber.trim() || `STU-${Math.floor(1000 + Math.random() * 9000)}`;

      let newUid = '';
      try {
        const { initializeApp } = await import('firebase/app');
        const { getAuth, createUserWithEmailAndPassword, signOut } = await import('firebase/auth');
        const { app } = await import('../../lib/firebase');
        
        const secondaryApp = initializeApp(app.options, "SecondaryApp" + Date.now());
        const secondaryAuth = getAuth(secondaryApp);
        
        const userCred = await createUserWithEmailAndPassword(secondaryAuth, formData.email, formData.password);
        newUid = userCred.user.uid;
        await signOut(secondaryAuth);
      } catch (authErr: any) {
        console.warn("Secondary auth user creation warning, proceeding with Firestore creation:", authErr);
      }

      const studentDoc = {
        email: formData.email.trim(),
        name: formData.name.trim(),
        role: 'STUDENT',
        institutionId: instId,
        assignedClass: formData.assignedClass || 'Unassigned',
        phone: formData.phone || '',
        rollNumber: finalRollNumber,
        password: formData.password,
        status: 'Active',
        createdAt: serverTimestamp()
      };

      if (newUid) {
        await setDoc(doc(db, 'users', newUid), studentDoc);
      } else {
        const newRef = doc(collection(db, 'users'));
        await setDoc(newRef, studentDoc);
      }
      
      await syncInstitutionStudentCount(1);
      setShowForm(false);
      setFormData({ name: '', email: '', assignedClass: '', password: '', phone: '', rollNumber: '' });
      alert(`Student profile created successfully! Student ID: ${finalRollNumber}`);
    } catch (error: any) {
      console.error("Error adding student:", error);
      alert(`Error creating student profile: ${error?.message || "Please check details and try again."}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileUploadAndParse = async (file: File) => {
    if (!file) return;
    setIsParsingFile(true);
    setParseMsg(null);

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const content = e.target?.result as string;
        try {
          const res = await fetch('/api/ai/parse-roster', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${user?.id || 'demo-token'}`
            },
            body: JSON.stringify({
              fileContent: content,
              fileName: file.name,
              mimeType: file.type || 'text/plain'
            })
          });

          if (!res.ok) throw new Error('API parse failed');
          const data = await res.json();
          let extracted: ParsedStudent[] = [];

          if (data.students && Array.isArray(data.students) && data.students.length > 0) {
            extracted = data.students.map((s: any) => ({
              name: s.name || 'Student Name',
              email: s.email || 'student@school.edu',
              password: s.password || 'Student123!',
              assignedClass: s.className || s.assignedClass || 'Class 10 - Section A',
              rollNumber: s.rollNumber || `STU-${Math.floor(1000 + Math.random() * 9000)}`
            }));
          } else {
            // Local fallback text/csv line parsing
            const lines = content.split(/\r?\n/);
            lines.forEach((line) => {
              const trimmed = line.trim();
              if (!trimmed || trimmed.toLowerCase().includes('email')) return;
              const parts = trimmed.split(/[,;\t]+/);
              if (parts.length >= 1 && parts[0].length > 2) {
                extracted.push({
                  name: parts[0].replace(/["']/g, '').trim(),
                  email: parts[1] ? parts[1].replace(/["']/g, '').trim() : `${parts[0].toLowerCase().replace(/\s+/g, '.')}@school.edu`,
                  password: parts[2] ? parts[2].replace(/["']/g, '').trim() : 'Student123!',
                  assignedClass: parts[3] ? parts[3].replace(/["']/g, '').trim() : 'Class 10 - Section A',
                  rollNumber: parts[4] ? parts[4].replace(/["']/g, '').trim() : `STU-${Math.floor(1000 + Math.random() * 9000)}`
                });
              }
            });
          }

          if (extracted.length > 0) {
            setParsedStudents(extracted);
            setParseMsg(`✨ AI extracted ${extracted.length} student records from "${file.name}". Review or modify below before importing!`);
          } else {
            alert(`No student records found in ${file.name}. Please ensure your file has Name, Email, Password, and Class columns.`);
          }
        } catch (err) {
          console.error(err);
          alert(`Error processing ${file.name}. Please ensure file content is valid.`);
        } finally {
          setIsParsingFile(false);
        }
      };
      reader.readAsText(file);
    } catch (err) {
      console.error(err);
      setIsParsingFile(false);
    }
  };

  const handleImportParsedStudents = async () => {
    const instId = user?.institutionId || (user?.role === 'INSTITUTION' ? user?.id : null);
    if (!instId || parsedStudents.length === 0) return;

    setIsSubmitting(true);
    try {
      let count = 0;
      for (const ps of parsedStudents) {
        if (!ps.name.trim() || !ps.email.trim()) continue;
        const newRef = doc(collection(db, 'users'));
        const rollNum = ps.rollNumber || `STU-${Math.floor(1000 + Math.random() * 9000)}`;
        await setDoc(newRef, {
          email: ps.email.trim(),
          name: ps.name.trim(),
          role: 'STUDENT',
          institutionId: instId,
          assignedClass: ps.assignedClass || 'Class 10 - Section A',
          rollNumber: rollNum,
          password: ps.password || 'Student123!',
          status: 'Active',
          createdAt: serverTimestamp()
        });
        count++;
      }

      await syncInstitutionStudentCount(count);
      alert(`🎉 Successfully imported ${count} student accounts into the institution!`);
      setParsedStudents([]);
      setParseMsg(null);
      setShowForm(false);
    } catch (err) {
      console.error("Error importing students:", err);
      alert("Failed to import students.");
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 mb-6 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Enroll Student Profile</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">Add manually or bulk import via Excel / PDF form</p>
              </div>
            </div>

            {/* Mode selection tabs */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => setAddMode('manual')}
                className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                  addMode === 'manual' 
                    ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm' 
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Edit className="w-3.5 h-3.5" /> Manually
              </button>
              <button
                type="button"
                onClick={() => setAddMode('excel')}
                className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                  addMode === 'excel' 
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm' 
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5" /> Excel Form
              </button>
              <button
                type="button"
                onClick={() => setAddMode('pdf')}
                className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                  addMode === 'pdf' 
                    ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-sm' 
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <FileText className="w-3.5 h-3.5" /> PDF Form
              </button>
            </div>
          </div>

          {addMode === 'manual' ? (
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
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">Student ID / Roll Number</label>
                  <input 
                    type="text"
                    value={formData.rollNumber}
                    onChange={(e) => setFormData({...formData, rollNumber: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:border-indigo-500 text-sm outline-none transition" 
                    placeholder="e.g. STU-1002 (Optional: Leave blank to auto-generate)" 
                  />
                  <p className="text-[11px] text-slate-400 mt-1">Leave blank to auto-generate a unique Student ID.</p>
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
                  <PhoneInputWithCountry
                    label="Parent / Contact Phone"
                    value={formData.phone}
                    onChange={(val) => setFormData(prev => ({ ...prev, phone: val }))}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">Assigned Class & Section</label>
                  <input 
                    type="text"
                    required
                    value={formData.assignedClass}
                    onChange={(e) => setFormData({...formData, assignedClass: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:border-indigo-500 text-sm outline-none transition" 
                    placeholder="e.g. Class 10 - Section A" 
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
                <Button type="submit" isLoading={isSubmitting}>
                  Enroll Student
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              {/* Dropzone */}
              <div 
                onClick={() => (addMode === 'excel' ? excelInputRef.current?.click() : pdfInputRef.current?.click())}
                className="border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 bg-slate-50 dark:bg-slate-950 rounded-2xl p-8 text-center cursor-pointer transition group"
              >
                <input 
                  type="file" 
                  ref={excelInputRef} 
                  onChange={(e) => e.target.files?.[0] && handleFileUploadAndParse(e.target.files[0])}
                  accept=".csv,.xlsx,.xls,.txt" 
                  className="hidden" 
                />
                <input 
                  type="file" 
                  ref={pdfInputRef} 
                  onChange={(e) => e.target.files?.[0] && handleFileUploadAndParse(e.target.files[0])}
                  accept=".pdf" 
                  className="hidden" 
                />

                <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition">
                  {addMode === 'excel' ? <FileSpreadsheet className="w-6 h-6" /> : <FileText className="w-6 h-6" />}
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                  Upload {addMode === 'excel' ? 'Excel / CSV Student Roster' : 'PDF Student Directory'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                  Click to select file or drag & drop. AI will automatically extract student names, emails, and assigned classes.
                </p>

                {isParsingFile && (
                  <div className="mt-4 flex items-center justify-center gap-2 text-xs text-emerald-600 font-semibold animate-pulse">
                    <Loader2 className="w-4 h-4 animate-spin" /> AI parsing student roster...
                  </div>
                )}
              </div>

              {parseMsg && (
                <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs font-medium text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 shrink-0 text-emerald-600" />
                  {parseMsg}
                </div>
              )}

              {/* Parsed List Table */}
              {parsedStudents.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      Extracted Student Records ({parsedStudents.length})
                    </h4>
                    <Button 
                      size="sm" 
                      onClick={handleImportParsedStudents} 
                      isLoading={isSubmitting}
                      icon={<UserCheck className="w-4 h-4" />}
                    >
                      Import All ({parsedStudents.length}) Students to System
                    </Button>
                  </div>

                  <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 dark:bg-slate-800/60 font-bold text-slate-700 dark:text-slate-300">
                        <tr>
                          <th className="p-3">#</th>
                          <th className="p-3">Full Name</th>
                          <th className="p-3">Email Address</th>
                          <th className="p-3">Assigned Class</th>
                          <th className="p-3">Roll / ID</th>
                          <th className="p-3 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {parsedStudents.map((ps, idx) => (
                          <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                            <td className="p-3 text-slate-400 font-mono">{idx + 1}</td>
                            <td className="p-3">
                              <input 
                                type="text" 
                                value={ps.name} 
                                onChange={e => {
                                  const updated = [...parsedStudents];
                                  updated[idx].name = e.target.value;
                                  setParsedStudents(updated);
                                }}
                                className="w-full px-2 py-1 bg-transparent border border-slate-200 dark:border-slate-700 rounded text-xs font-medium" 
                              />
                            </td>
                            <td className="p-3">
                              <input 
                                type="email" 
                                value={ps.email} 
                                onChange={e => {
                                  const updated = [...parsedStudents];
                                  updated[idx].email = e.target.value;
                                  setParsedStudents(updated);
                                }}
                                className="w-full px-2 py-1 bg-transparent border border-slate-200 dark:border-slate-700 rounded text-xs font-medium" 
                              />
                            </td>
                            <td className="p-3">
                              <input 
                                type="text" 
                                value={ps.assignedClass} 
                                onChange={e => {
                                  const updated = [...parsedStudents];
                                  updated[idx].assignedClass = e.target.value;
                                  setParsedStudents(updated);
                                }}
                                className="w-full px-2 py-1 bg-transparent border border-slate-200 dark:border-slate-700 rounded text-xs font-medium" 
                              />
                            </td>
                            <td className="p-3">
                              <input 
                                type="text" 
                                value={ps.rollNumber || ''} 
                                onChange={e => {
                                  const updated = [...parsedStudents];
                                  updated[idx].rollNumber = e.target.value;
                                  setParsedStudents(updated);
                                }}
                                className="w-full px-2 py-1 bg-transparent border border-slate-200 dark:border-slate-700 rounded text-xs font-mono" 
                              />
                            </td>
                            <td className="p-3 text-right">
                              <button 
                                onClick={() => setParsedStudents(parsedStudents.filter((_, i) => i !== idx))}
                                className="p-1 text-slate-400 hover:text-rose-600 transition"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
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
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">Password</label>
                <input 
                  type="text" 
                  value={editingStudent.password || ''}
                  onChange={e => setEditingStudent({...editingStudent, password: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:border-indigo-500 text-sm outline-none transition" 
                  placeholder="Update student password"
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
                    {student.status === 'Pending' ? (
                      <Badge variant="warning">Pending Approval</Badge>
                    ) : student.status === 'Rejected' ? (
                      <Badge variant="danger">Declined</Badge>
                    ) : (
                      <Badge variant="success" dot>Active</Badge>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      {student.status === 'Pending' && (
                        <>
                          <button
                            onClick={() => handleAcceptStudent(student)}
                            className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition shadow-xs"
                            title="Accept Student Application"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" /> Accept
                          </button>
                          <button
                            onClick={() => handleDeclineStudent(student)}
                            className="px-2.5 py-1.5 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 hover:bg-rose-100 rounded-lg text-xs font-bold flex items-center gap-1 transition"
                            title="Decline Student Application"
                          >
                            <XCircle className="w-3.5 h-3.5" /> Decline
                          </button>
                        </>
                      )}
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
