import React, { useState, useEffect, useRef } from 'react';
import { PageHeader, ConfirmModal, Card, Button, Badge } from '../../components/ui';
import { Users, Plus, Search, Loader2, Edit, Trash2, BookOpen, Check, Mail, Phone, Lock, Sparkles, CheckCircle2, XCircle, Upload, FileSpreadsheet, FileText, UserCheck } from 'lucide-react';
import { collection, query, onSnapshot, setDoc, deleteDoc, doc, where, serverTimestamp, updateDoc, getDocs, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import { PhoneInputWithCountry } from '../../components/ui/PhoneInputWithCountry';

type Teacher = {
  id: string;
  name: string;
  email: string;
  phone: string;
  subject?: string;
  assignedClasses: string;
  password?: string;
  status: string;
  createdAt: any;
};

type ParsedTeacher = {
  name: string;
  email: string;
  password: string;
  subject: string;
  phone?: string;
};

export default function Teachers() {
  const { user } = useAuth();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [addMode, setAddMode] = useState<'manual' | 'excel' | 'pdf'>('manual');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteTeacherId, setDeleteTeacherId] = useState<string | null>(null);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // File parsing states
  const [isParsingFile, setIsParsingFile] = useState(false);
  const [parsedTeachers, setParsedTeachers] = useState<ParsedTeacher[]>([]);
  const [parseMsg, setParseMsg] = useState<string | null>(null);
  const excelInputRef = useRef<HTMLInputElement | null>(null);
  const pdfInputRef = useRef<HTMLInputElement | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    assignedClasses: '',
    password: ''
  });

  const syncInstitutionTeacherCount = async (delta: number) => {
    const instId = user?.institutionId || (user?.role === 'INSTITUTION' ? user?.id : null);
    if (!instId) return;
    try {
      const instRef = doc(db, 'institutions', instId);
      const instSnap = await getDoc(instRef);
      if (instSnap.exists()) {
        const currentCount = instSnap.data().teachersCount || 0;
        await updateDoc(instRef, {
          teachersCount: Math.max(0, currentCount + delta)
        });
      }
    } catch (e) {
      console.warn("Could not sync institution teacher count:", e);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTeacherId) return;
    const targetId = deleteTeacherId;
    setTeachers(prev => prev.filter(t => t.id !== targetId));
    setDeleteTeacherId(null);
    try {
      await deleteDoc(doc(db, 'users', targetId));
      await syncInstitutionTeacherCount(-1);
    } catch (error) {
      console.error("Error deleting teacher:", error);
      alert("Failed to delete teacher from database.");
    }
  };

  const handleUpdateTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTeacher) return;
    setIsSubmitting(true);
    try {
      const updateData: any = {
        name: editingTeacher.name,
        subject: editingTeacher.subject || '',
        assignedClasses: editingTeacher.assignedClasses,
        phone: editingTeacher.phone,
        status: editingTeacher.status || 'Active'
      };

      if (editingTeacher.password) {
        updateData.password = editingTeacher.password;
      }

      await updateDoc(doc(db, 'users', editingTeacher.id), updateData);
      alert('Teacher details and assigned classes updated successfully!');
      setEditingTeacher(null);
    } catch (error) {
      console.error("Error updating teacher:", error);
      alert("Failed to update teacher.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAcceptTeacher = async (teacher: Teacher) => {
    try {
      await updateDoc(doc(db, 'users', teacher.id), { status: 'Active' });
      const q = query(collection(db, 'registration_requests'), where('uid', '==', teacher.id));
      const snap = await getDocs(q);
      snap.forEach(async (d) => {
        await updateDoc(doc(db, 'registration_requests', d.id), { status: 'Approved' });
      });
      alert(`✅ Teacher ${teacher.name} has been accepted and activated!`);
    } catch (err) {
      console.error("Error accepting teacher:", err);
      alert("Failed to accept teacher.");
    }
  };

  const handleDeclineTeacher = async (teacher: Teacher) => {
    if (!confirm(`Decline registration request for teacher ${teacher.name}?`)) return;
    try {
      await updateDoc(doc(db, 'users', teacher.id), { status: 'Rejected' });
      const q = query(collection(db, 'registration_requests'), where('uid', '==', teacher.id));
      const snap = await getDocs(q);
      snap.forEach(async (d) => {
        await updateDoc(doc(db, 'registration_requests', d.id), { status: 'Declined' });
      });
      alert(`❌ Teacher ${teacher.name} registration request was declined.`);
    } catch (err) {
      console.error("Error declining teacher:", err);
      alert("Failed to decline teacher.");
    }
  };

  useEffect(() => {
    if (!user) return;
    
    let q;
    const targetInstId = user.institutionId || (user.role === 'INSTITUTION' ? user.id : null);
    if (user.role === 'SUPER_ADMIN' || !targetInstId) {
      q = query(collection(db, 'users'), where('role', '==', 'TEACHER'));
    } else {
      q = query(collection(db, 'users'), where('role', '==', 'TEACHER'), where('institutionId', '==', targetInstId));
    }
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: Teacher[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as Teacher);
      });
      list.sort((a, b) => {
        const timeA = a.createdAt?.seconds || 0;
        const timeB = b.createdAt?.seconds || 0;
        return timeB - timeA;
      });
      setTeachers(list);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching teachers:", error);
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

      const teacherDoc = {
        email: formData.email.trim(),
        name: formData.name.trim(),
        role: 'TEACHER',
        institutionId: instId,
        phone: formData.phone || '',
        subject: formData.subject || 'General',
        assignedClasses: formData.assignedClasses || 'Unassigned',
        password: formData.password,
        status: 'Active',
        createdAt: serverTimestamp()
      };

      if (newUid) {
        await setDoc(doc(db, 'users', newUid), teacherDoc);
      } else {
        const newRef = doc(collection(db, 'users'));
        await setDoc(newRef, teacherDoc);
      }
      
      await syncInstitutionTeacherCount(1);
      setShowForm(false);
      setFormData({ name: '', email: '', phone: '', subject: '', assignedClasses: '', password: '' });
      alert("Teacher registered successfully.");
    } catch (error: any) {
      console.error("Error adding teacher:", error);
      alert(`Error registering teacher: ${error?.message || "Please try again."}`);
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
          let extracted: ParsedTeacher[] = [];

          if (data.teachers && Array.isArray(data.teachers) && data.teachers.length > 0) {
            extracted = data.teachers.map((t: any) => ({
              name: t.name || 'Faculty Member',
              email: t.email || 'teacher@school.edu',
              password: t.password || 'Teacher123!',
              subject: t.subject || 'General',
              phone: t.phone || ''
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
                  password: parts[2] ? parts[2].replace(/["']/g, '').trim() : 'Teacher123!',
                  subject: parts[3] ? parts[3].replace(/["']/g, '').trim() : 'General',
                  phone: parts[4] ? parts[4].replace(/["']/g, '').trim() : ''
                });
              }
            });
          }

          if (extracted.length > 0) {
            setParsedTeachers(extracted);
            setParseMsg(`✨ AI extracted ${extracted.length} faculty profiles from "${file.name}". Review or edit below before importing!`);
          } else {
            alert(`No faculty records found in ${file.name}. Please ensure your file has Name, Email, Password, and Subject columns.`);
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

  const handleImportParsedTeachers = async () => {
    const instId = user?.institutionId || (user?.role === 'INSTITUTION' ? user?.id : null);
    if (!instId || parsedTeachers.length === 0) return;

    setIsSubmitting(true);
    try {
      let count = 0;
      for (const pt of parsedTeachers) {
        if (!pt.name.trim() || !pt.email.trim()) continue;
        const newRef = doc(collection(db, 'users'));
        await setDoc(newRef, {
          email: pt.email.trim(),
          name: pt.name.trim(),
          role: 'TEACHER',
          institutionId: instId,
          phone: pt.phone || '',
          subject: pt.subject || 'General',
          assignedClasses: 'Unassigned',
          password: pt.password || 'Teacher123!',
          status: 'Active',
          createdAt: serverTimestamp()
        });
        count++;
      }

      await syncInstitutionTeacherCount(count);
      alert(`🎉 Successfully imported ${count} faculty accounts into the institution!`);
      setParsedTeachers([]);
      setParseMsg(null);
      setShowForm(false);
    } catch (err) {
      console.error("Error importing teachers:", err);
      alert("Failed to import teachers.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredTeachers = teachers.filter(t => 
    t.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.assignedClasses?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <PageHeader 
        title="Faculty & Class Assignments" 
        description="Assign classes and sections to teachers to grant them access to student directories."
        badge="Institution Governance"
        breadcrumbs={[{ label: 'Institution' }, { label: 'Faculty Roster' }]}
        action={
          <Button 
            onClick={() => setShowForm(!showForm)}
            icon={<Plus className="w-4 h-4" />}
          >
            Add New Teacher
          </Button>
        }
      />

      {showForm && (
        <Card className="animate-in slide-in-from-top-4 duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 mb-6 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Register Faculty Member</h2>
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
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm' 
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
                    ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm' 
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
                    placeholder="e.g. Dr. Sarah Jenkins" 
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">Subject / Specialty</label>
                  <input 
                    type="text" 
                    required
                    value={formData.subject}
                    onChange={(e) => setFormData({...formData, subject: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:border-indigo-500 text-sm outline-none transition" 
                    placeholder="e.g. Mathematics, Physics, English" 
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
                    placeholder="teacher@school.com" 
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
                
                <div className="md:col-span-2">
                  <PhoneInputWithCountry
                    label="Phone Number"
                    value={formData.phone}
                    onChange={(val) => setFormData(prev => ({ ...prev, phone: val }))}
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
                <Button type="submit" isLoading={isSubmitting}>
                  Add Teacher
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              {/* Dropzone */}
              <div 
                onClick={() => (addMode === 'excel' ? excelInputRef.current?.click() : pdfInputRef.current?.click())}
                className="border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-500 bg-slate-50 dark:bg-slate-950 rounded-2xl p-8 text-center cursor-pointer transition group"
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

                <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition">
                  {addMode === 'excel' ? <FileSpreadsheet className="w-6 h-6" /> : <FileText className="w-6 h-6" />}
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                  Upload {addMode === 'excel' ? 'Excel / CSV Roster Sheet' : 'PDF Faculty Directory'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                  Click to select file or drag & drop. AI will automatically extract faculty names, subjects, and emails.
                </p>

                {isParsingFile && (
                  <div className="mt-4 flex items-center justify-center gap-2 text-xs text-indigo-600 font-semibold animate-pulse">
                    <Loader2 className="w-4 h-4 animate-spin" /> AI parsing faculty data...
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
              {parsedTeachers.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      Extracted Faculty Members ({parsedTeachers.length})
                    </h4>
                    <Button 
                      size="sm" 
                      onClick={handleImportParsedTeachers} 
                      isLoading={isSubmitting}
                      icon={<UserCheck className="w-4 h-4" />}
                    >
                      Import All ({parsedTeachers.length}) Faculty to System
                    </Button>
                  </div>

                  <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 dark:bg-slate-800/60 font-bold text-slate-700 dark:text-slate-300">
                        <tr>
                          <th className="p-3">#</th>
                          <th className="p-3">Full Name</th>
                          <th className="p-3">Email Address</th>
                          <th className="p-3">Subject</th>
                          <th className="p-3">Password</th>
                          <th className="p-3 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {parsedTeachers.map((pt, idx) => (
                          <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                            <td className="p-3 text-slate-400 font-mono">{idx + 1}</td>
                            <td className="p-3">
                              <input 
                                type="text" 
                                value={pt.name} 
                                onChange={e => {
                                  const updated = [...parsedTeachers];
                                  updated[idx].name = e.target.value;
                                  setParsedTeachers(updated);
                                }}
                                className="w-full px-2 py-1 bg-transparent border border-slate-200 dark:border-slate-700 rounded text-xs font-medium" 
                              />
                            </td>
                            <td className="p-3">
                              <input 
                                type="email" 
                                value={pt.email} 
                                onChange={e => {
                                  const updated = [...parsedTeachers];
                                  updated[idx].email = e.target.value;
                                  setParsedTeachers(updated);
                                }}
                                className="w-full px-2 py-1 bg-transparent border border-slate-200 dark:border-slate-700 rounded text-xs font-medium" 
                              />
                            </td>
                            <td className="p-3">
                              <input 
                                type="text" 
                                value={pt.subject} 
                                onChange={e => {
                                  const updated = [...parsedTeachers];
                                  updated[idx].subject = e.target.value;
                                  setParsedTeachers(updated);
                                }}
                                className="w-full px-2 py-1 bg-transparent border border-slate-200 dark:border-slate-700 rounded text-xs font-medium" 
                              />
                            </td>
                            <td className="p-3">
                              <input 
                                type="text" 
                                value={pt.password} 
                                onChange={e => {
                                  const updated = [...parsedTeachers];
                                  updated[idx].password = e.target.value;
                                  setParsedTeachers(updated);
                                }}
                                className="w-full px-2 py-1 bg-transparent border border-slate-200 dark:border-slate-700 rounded text-xs font-mono" 
                              />
                            </td>
                            <td className="p-3 text-right">
                              <button 
                                onClick={() => setParsedTeachers(parsedTeachers.filter((_, i) => i !== idx))}
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
      {editingTeacher && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200 space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Edit Faculty Profile</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">Update assigned classes & phone contact</p>
              </div>
            </div>

            <form onSubmit={handleUpdateTeacher} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">Teacher Name</label>
                <input 
                  type="text" 
                  required
                  value={editingTeacher.name}
                  onChange={e => setEditingTeacher({...editingTeacher, name: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:border-indigo-500 text-sm outline-none transition" 
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">Subject / Specialty</label>
                <input 
                  type="text" 
                  required
                  value={editingTeacher.subject || ''}
                  onChange={e => setEditingTeacher({...editingTeacher, subject: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:border-indigo-500 text-sm outline-none transition" 
                  placeholder="e.g. Mathematics, Science"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">Assigned Classes & Sections</label>
                <input 
                  type="text" 
                  required
                  value={editingTeacher.assignedClasses}
                  onChange={e => setEditingTeacher({...editingTeacher, assignedClasses: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:border-indigo-500 text-sm outline-none transition" 
                  placeholder="e.g. Grade 10-A, Grade 10-B"
                />
                <p className="text-[11px] text-slate-400 mt-1">Teachers only see students matching these assigned classes.</p>
              </div>
              <div>
                <PhoneInputWithCountry
                  label="Phone Number"
                  value={editingTeacher.phone || ''}
                  onChange={(val) => setEditingTeacher(prev => prev ? { ...prev, phone: val } : null)}
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">Password</label>
                <input 
                  type="text" 
                  value={editingTeacher.password || ''}
                  onChange={e => setEditingTeacher({...editingTeacher, password: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:border-indigo-500 text-sm outline-none transition" 
                  placeholder="Update teacher password"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <Button type="button" variant="ghost" onClick={() => setEditingTeacher(null)}>
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

      {/* Teachers Table Card */}
      <Card className="p-0 overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="relative w-full sm:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input 
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search by teacher name, email, or class..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-800 rounded-xl text-xs font-medium text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:border-indigo-500 transition"
            />
          </div>
          <Badge variant="purple">{filteredTeachers.length} Faculty Members</Badge>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Teacher Profile</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Subject / Speciality</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Contact & Credentials</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Assigned Classes</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-600" />
                    Loading faculty directory...
                  </td>
                </tr>
              ) : filteredTeachers.map((teacher) => (
                <tr key={teacher.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400 flex items-center justify-center font-bold text-sm shrink-0">
                        {teacher.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">{teacher.name}</p>
                        <p className="text-[11px] text-slate-400">ID: {teacher.id.slice(0, 8)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant="purple">
                      {teacher.subject || 'General'}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col gap-1 text-xs text-slate-600 dark:text-slate-300">
                      <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-slate-400" /> {teacher.email}</span>
                      <span className="flex items-center gap-1.5 font-mono text-[11px] text-slate-400"><Lock className="w-3 h-3 text-slate-400" /> {teacher.password || '******'}</span>
                      <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-slate-400" /> {teacher.phone}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1.5 max-w-xs">
                      {(teacher.assignedClasses || 'Unassigned').split(',').map((cls, idx) => (
                        <span key={idx} className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/80 dark:border-indigo-800/80 text-indigo-700 dark:text-indigo-300 rounded-lg text-xs font-bold">
                          {cls.trim()}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {teacher.status === 'Pending' ? (
                      <Badge variant="warning">Pending Approval</Badge>
                    ) : teacher.status === 'Rejected' ? (
                      <Badge variant="danger">Declined</Badge>
                    ) : (
                      <Badge variant="success" dot>Active</Badge>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      {teacher.status === 'Pending' && (
                        <>
                          <button
                            onClick={() => handleAcceptTeacher(teacher)}
                            className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition shadow-xs"
                            title="Accept Teacher Application"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" /> Accept
                          </button>
                          <button
                            onClick={() => handleDeclineTeacher(teacher)}
                            className="px-2.5 py-1.5 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 hover:bg-rose-100 rounded-lg text-xs font-bold flex items-center gap-1 transition"
                            title="Decline Teacher Application"
                          >
                            <XCircle className="w-3.5 h-3.5" /> Decline
                          </button>
                        </>
                      )}
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setEditingTeacher(teacher)}
                        icon={<Edit className="w-3.5 h-3.5" />}
                      >
                        Edit
                      </Button>
                      <Button 
                        variant="danger" 
                        size="sm"
                        onClick={() => setDeleteTeacherId(teacher.id)}
                        icon={<Trash2 className="w-3.5 h-3.5" />}
                      >
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {!isLoading && filteredTeachers.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400 text-sm">
                    No faculty members found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <ConfirmModal
        isOpen={!!deleteTeacherId}
        title="Delete Faculty Account"
        message="Are you sure you want to remove this teacher? Their access permissions will be permanently revoked."
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTeacherId(null)}
      />
    </div>
  );
}
