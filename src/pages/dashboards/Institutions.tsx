import React, { useState, useEffect, useRef } from 'react';
import { PageHeader, ConfirmModal, Card, Button, Badge } from '../../components/ui';
import { 
  Building2, Plus, Search, MapPin, Mail, Phone, MoreVertical, Loader2, Trash2, Edit, Lock, 
  Upload, FileText, UserCheck, Users, GraduationCap, CheckCircle2, Sparkles, FileSpreadsheet, AlertCircle, X
} from 'lucide-react';
import { collection, query, onSnapshot, deleteDoc, doc, where, getDocs, addDoc, serverTimestamp, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';

type Institution = {
  id: string;
  name: string;
  address: string;
  email: string;
  phone: string;
  code?: string;
  password?: string;
  principalName?: string;
  affiliationCode?: string;
  website?: string;
  status: string;
  studentsCount: number;
  teachersCount: number;
  createdAt: any;
};

type TeacherInput = {
  name: string;
  email: string;
  password: string;
  subject: string;
};

type StudentInput = {
  name: string;
  email: string;
  password: string;
  className: string;
};

export default function Institutions() {
  const { user } = useAuth();
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [deleteInstId, setDeleteInstId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Detailed School Information
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    email: '',
    phone: '',
    password: '',
    principalName: '',
    affiliationCode: '',
    website: ''
  });

  // Dynamic Faculty & Roster States
  const [teachers, setTeachers] = useState<TeacherInput[]>([
    { name: '', email: '', password: 'Teacher123!', subject: 'Mathematics' }
  ]);

  const [students, setStudents] = useState<StudentInput[]>([
    { name: '', email: '', password: 'Student123!', className: 'Class 10 - Section A' }
  ]);

  // File parsing states
  const [isParsingFile, setIsParsingFile] = useState(false);
  const [parseSuccessMsg, setParseSuccessMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const handleClickOutside = () => setActiveDropdown(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'institutions'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: Institution[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const code = data.code || `INST-${docSnap.id.substring(0, 5).toUpperCase()}`;
        list.push({ id: docSnap.id, code, ...data } as Institution);
      });
      list.sort((a, b) => {
        const timeA = a.createdAt?.seconds || 0;
        const timeB = b.createdAt?.seconds || 0;
        return timeB - timeA;
      });
      setInstitutions(list);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching institutions:", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const confirmDelete = async () => {
    if (!deleteInstId) return;
    const targetId = deleteInstId;
    const targetInst = institutions.find(i => i.id === targetId);
    
    // Optimistically update UI
    setInstitutions(prev => prev.filter(i => i.id !== targetId));
    setDeleteInstId(null);

    try {
      // 1. Delete Institution document
      await deleteDoc(doc(db, 'institutions', targetId));

      // 2. Query and delete all user accounts (Institution Admin, Teachers, Students) linked by institutionId
      const qUsersInst = query(collection(db, 'users'), where('institutionId', '==', targetId));
      const snapUsersInst = await getDocs(qUsersInst);
      for (const docSnap of snapUsersInst.docs) {
        await deleteDoc(docSnap.ref);
      }

      // 3. Delete matching institution account by contact email or ID if present in 'users'
      if (targetInst?.email) {
        const qUsersEmail = query(collection(db, 'users'), where('email', '==', targetInst.email));
        const snapUsersEmail = await getDocs(qUsersEmail);
        for (const docSnap of snapUsersEmail.docs) {
          await deleteDoc(docSnap.ref);
        }
      }

      // 4. Cascade delete all linked school data across collections
      const collectionsToWipe = ['classes', 'study_groups', 'notices', 'events', 'timetables', 'homeworks', 'attendance', 'complaints'];
      for (const colName of collectionsToWipe) {
        try {
          const qCol = query(collection(db, colName), where('institutionId', '==', targetId));
          const snapCol = await getDocs(qCol);
          for (const docSnap of snapCol.docs) {
            await deleteDoc(docSnap.ref);
          }
        } catch (colErr) {
          console.warn(`Cascade clean warning for ${colName}:`, colErr);
        }
      }

      alert(`Institution "${targetInst?.name || 'School'}" and all associated emails, passwords, teacher accounts, and student accounts have been completely deleted.`);
    } catch (error: any) {
      console.error("Error deleting institution:", error);
      alert(`Failed to delete institution: ${error.message}`);
    }
  };

  // Helper to read uploaded PDF/Excel/CSV file text or buffer
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsingFile(true);
    setParseSuccessMsg(null);

    try {
      const fileName = file.name;
      const mimeType = file.type;

      // Read file content as text
      const reader = new FileReader();
      reader.onload = async (event) => {
        const content = event.target?.result as string || '';

        // Call backend Gemini AI file parser endpoint
        try {
          const res = await fetch('/api/ai/parse-roster', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${user?.id || 'demo-token'}`
            },
            body: JSON.stringify({
              fileContent: content,
              fileName,
              mimeType
            })
          });

          if (!res.ok) throw new Error(`Parse service returned ${res.status}`);
          const data = await res.json();

          // Auto convert extracted data into manual form rows!
          if (data.students && Array.isArray(data.students) && data.students.length > 0) {
            const validParsedStudents = data.students.map((s: any) => ({
              name: s.name || 'Student Name',
              email: s.email || 'student@school.edu',
              password: s.password || 'Student123!',
              className: s.className || 'Class 10 - Section A'
            }));

            // Filter out empty placeholder row if present
            setStudents(prev => {
              const filteredPrev = prev.filter(st => st.name.trim().length > 0);
              return [...filteredPrev, ...validParsedStudents];
            });
          }

          if (data.teachers && Array.isArray(data.teachers) && data.teachers.length > 0) {
            const validParsedTeachers = data.teachers.map((t: any) => ({
              name: t.name || 'Teacher Name',
              email: t.email || 'teacher@school.edu',
              password: t.password || 'Teacher123!',
              subject: t.subject || 'General Subject'
            }));

            setTeachers(prev => {
              const filteredPrev = prev.filter(tc => tc.name.trim().length > 0);
              return [...filteredPrev, ...validParsedTeachers];
            });
          }

          const studentCount = data.students?.length || 0;
          const teacherCount = data.teachers?.length || 0;
          setParseSuccessMsg(`✨ Successfully converted "${fileName}" into ${studentCount} Student and ${teacherCount} Teacher manual form rows below!`);
        } catch (apiErr) {
          console.error("Error calling parse roster API:", apiErr);

          // Local fallback CSV / text line parsing
          const lines = content.split(/\r?\n/);
          const newStudents: StudentInput[] = [];
          lines.forEach(line => {
            const trimmed = line.trim();
            if (!trimmed || trimmed.toLowerCase().includes('name,')) return;
            const parts = trimmed.split(/[,;\t]+/);
            if (parts.length >= 1 && parts[0].length > 1) {
              newStudents.push({
                name: parts[0].replace(/["']/g, '').trim(),
                email: parts[1] ? parts[1].replace(/["']/g, '').trim() : `${parts[0].toLowerCase().replace(/\s+/g, '.')}@school.edu`,
                password: parts[2] ? parts[2].replace(/["']/g, '').trim() : 'Student123!',
                className: parts[3] ? parts[3].replace(/["']/g, '').trim() : 'Class 10 - Section A'
              });
            }
          });

          if (newStudents.length > 0) {
            setStudents(prev => [...prev.filter(s => s.name.trim().length > 0), ...newStudents]);
            setParseSuccessMsg(`Converted ${newStudents.length} student records from CSV into manual form rows!`);
          } else {
            alert("Could not extract records from file. Please ensure text/CSV formatting or fill manual form rows.");
          }
        } finally {
          setIsParsingFile(false);
          if (fileInputRef.current) fileInputRef.current.value = '';
        }
      };

      reader.readAsText(file);
    } catch (err) {
      console.error("File upload error:", err);
      alert("Failed to read file.");
      setIsParsingFile(false);
    }
  };

  // Submit School Registration with Teachers & Students
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSubmitting(true);
    try {
      if (!formData.email || !formData.password) {
        alert("Official Contact Email and Admin Password are required.");
        setIsSubmitting(false);
        return;
      }
      if (formData.password.length < 6) {
        alert('Password must be at least 6 characters long.');
        setIsSubmitting(false);
        return;
      }

      // Filter valid non-empty teacher and student inputs
      const validTeachers = teachers.filter(t => t.name.trim() && t.email.trim());
      const validStudents = students.filter(s => s.name.trim() && s.email.trim());

      const generatedInstCode = `INST-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
      // Create Institution Firestore document
      const docRef = await addDoc(collection(db, 'institutions'), {
        ...formData,
        code: generatedInstCode,
        status: 'Active',
        studentsCount: validStudents.length,
        teachersCount: validTeachers.length,
        createdBy: user.id,
        createdAt: serverTimestamp()
      });

      const instId = docRef.id;

      // 1. Create Primary School Admin User Document in Firestore
      const mainUserRef = doc(collection(db, 'users'));
      await setDoc(mainUserRef, {
        email: formData.email,
        name: formData.name,
        role: 'INSTITUTION',
        institutionId: instId,
        createdAt: serverTimestamp()
      });

      // 2. Batch Provision Teachers into Firestore 'users' collection
      for (const t of validTeachers) {
        const teacherRef = doc(collection(db, 'users'));
        await setDoc(teacherRef, {
          name: t.name,
          email: t.email,
          role: 'TEACHER',
          subject: t.subject || 'General Subject',
          institutionId: instId,
          institutionName: formData.name,
          createdAt: serverTimestamp()
        });
      }

      // 3. Batch Provision Students into Firestore 'users' collection
      for (const s of validStudents) {
        const studentRef = doc(collection(db, 'users'));
        await setDoc(studentRef, {
          name: s.name,
          email: s.email,
          role: 'STUDENT',
          className: s.className || 'Class 10 - Section A',
          assignedClass: s.className || 'Class 10 - Section A',
          institutionId: instId,
          institutionName: formData.name,
          createdAt: serverTimestamp()
        });
      }

      setShowForm(false);
      setFormData({
        name: '', address: '', email: '', phone: '', password: '',
        principalName: '', affiliationCode: '', website: ''
      });
      setTeachers([{ name: '', email: '', password: 'Teacher123!', subject: 'Mathematics' }]);
      setStudents([{ name: '', email: '', password: 'Student123!', className: 'Class 10 - Section A' }]);
      setParseSuccessMsg(null);

      alert(`🎉 School "${formData.name}" registered successfully!\nProvisioned ${validTeachers.length} Teachers and ${validStudents.length} Students.`);
    } catch (error: any) {
      console.error("Error registering institution:", error);
      alert(`Failed to register school: ${error.message || 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredInstitutions = institutions.filter(i => 
    i.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    i.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    i.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <PageHeader 
        title="Registered Institutions" 
        description="Comprehensive management of registered campus networks, admin accounts, and student/teacher rosters."
        badge="Super Admin"
        breadcrumbs={[{ label: 'Super Admin' }, { label: 'Institutions' }]}
        action={
          <Button 
            onClick={() => setShowForm(!showForm)}
            icon={<Plus className="w-4 h-4" />}
          >
            Register Institution
          </Button>
        }
      />

      {showForm && (
        <Card className="animate-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-3 pb-4 mb-6 border-b border-slate-100 dark:border-slate-800">
            <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Register New School / Institution</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Add detailed school info, faculty accounts, and student data via PDF/Excel upload or manual form</p>
            </div>
          </div>

          <form className="space-y-8" onSubmit={handleSubmit}>
            {/* STEP 1: DETAILED SCHOOL INFORMATION */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
                <Building2 className="w-4 h-4" /> 1. Detailed School Information
              </h3>

              <div className="grid md:grid-cols-2 gap-5">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    School / Institution Name <span className="text-rose-500">*</span>
                  </label>
                  <input 
                    type="text" 
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:border-indigo-500 text-sm outline-none transition font-medium" 
                    placeholder="e.g. St. Xavier International Academy" 
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    Official Contact Email <span className="text-rose-500">*</span>
                  </label>
                  <input 
                    type="email" 
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:border-indigo-500 text-sm outline-none transition" 
                    placeholder="admin@stxavier.edu" 
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    Account Admin Password <span className="text-rose-500">*</span>
                  </label>
                  <input 
                    type="password"
                    minLength={6} 
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:border-indigo-500 text-sm outline-none transition" 
                    placeholder="Min 6 characters password" 
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    Phone Number
                  </label>
                  <input 
                    type="tel" 
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:border-indigo-500 text-sm outline-none transition" 
                    placeholder="+1 (555) 019-2834" 
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    Principal / Headmaster Name
                  </label>
                  <input 
                    type="text" 
                    value={formData.principalName}
                    onChange={(e) => setFormData({...formData, principalName: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:border-indigo-500 text-sm outline-none transition" 
                    placeholder="e.g. Dr. Arthur Pendelton" 
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    Affiliation / Reg Code
                  </label>
                  <input 
                    type="text" 
                    value={formData.affiliationCode}
                    onChange={(e) => setFormData({...formData, affiliationCode: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:border-indigo-500 text-sm outline-none transition" 
                    placeholder="e.g. CBSE-98123-2026" 
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    School Website
                  </label>
                  <input 
                    type="text" 
                    value={formData.website}
                    onChange={(e) => setFormData({...formData, website: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:border-indigo-500 text-sm outline-none transition" 
                    placeholder="https://stxavier.edu" 
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    Campus Address
                  </label>
                  <input 
                    type="text" 
                    required
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:border-indigo-500 text-sm outline-none transition" 
                    placeholder="Full campus street address, city, state..." 
                  />
                </div>
              </div>
            </div>

            {/* STEP 2: TEACHERS INFORMATION */}
            <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
                    <UserCheck className="w-4 h-4" /> 2. Faculty / Teachers Roster
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Add teacher accounts manually for this institution</p>
                </div>
                <button
                  type="button"
                  onClick={() => setTeachers(prev => [...prev, { name: '', email: '', password: 'Teacher123!', subject: 'Mathematics' }])}
                  className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-lg text-xs font-bold hover:bg-indigo-100 transition flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Teacher
                </button>
              </div>

              <div className="space-y-3">
                {teachers.map((tc, idx) => (
                  <div key={idx} className="grid grid-cols-1 sm:grid-cols-4 gap-3 p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200/80 dark:border-slate-800 items-center">
                    <input 
                      type="text"
                      value={tc.name}
                      onChange={e => {
                        const updated = [...teachers];
                        updated[idx].name = e.target.value;
                        setTeachers(updated);
                      }}
                      placeholder="Teacher Name"
                      className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                    <input 
                      type="email"
                      value={tc.email}
                      onChange={e => {
                        const updated = [...teachers];
                        updated[idx].email = e.target.value;
                        setTeachers(updated);
                      }}
                      placeholder="Email"
                      className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                    <input 
                      type="text"
                      value={tc.password}
                      onChange={e => {
                        const updated = [...teachers];
                        updated[idx].password = e.target.value;
                        setTeachers(updated);
                      }}
                      placeholder="Password"
                      className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                    <div className="flex items-center gap-2">
                      <input 
                        type="text"
                        value={tc.subject}
                        onChange={e => {
                          const updated = [...teachers];
                          updated[idx].subject = e.target.value;
                          setTeachers(updated);
                        }}
                        placeholder="Subject"
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                      {teachers.length > 1 && (
                        <button 
                          type="button" 
                          onClick={() => setTeachers(prev => prev.filter((_, i) => i !== idx))}
                          className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* STEP 3: STUDENTS INFORMATION & PDF/EXCEL FILE PARSER */}
            <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
                  <GraduationCap className="w-4 h-4" /> 3. Student Roster (PDF, Excel, CSV or Manual Entry)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Upload a PDF, Excel (.xlsx), or CSV student list to automatically convert it into editable manual form rows!
                </p>
              </div>

              {/* File Upload Banner */}
              <div className="p-4 bg-indigo-50/60 dark:bg-indigo-950/40 border-2 border-dashed border-indigo-200 dark:border-indigo-900 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-white dark:bg-slate-900 rounded-xl text-indigo-600 dark:text-indigo-400 shadow-sm">
                    <FileSpreadsheet className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">Auto-Convert PDF or Excel File into Manual Form</h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Supports .pdf, .xlsx, .csv, or plain text student lists with emails and passwords</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input 
                    type="file" 
                    ref={fileInputRef}
                    accept=".pdf,.xlsx,.xls,.csv,.txt"
                    onChange={handleFileUpload}
                    className="hidden" 
                    id="roster-file-upload"
                  />
                  <label 
                    htmlFor="roster-file-upload"
                    className={`px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold cursor-pointer transition shadow-sm flex items-center gap-2 ${isParsingFile ? 'opacity-50 pointer-events-none' : ''}`}
                  >
                    {isParsingFile ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Converting File...
                      </>
                    ) : (
                      <>
                        <Upload className="w-3.5 h-3.5" />
                        Upload PDF / Excel
                      </>
                    )}
                  </label>
                </div>
              </div>

              {parseSuccessMsg && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
                  <span className="flex items-center gap-2 font-semibold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    {parseSuccessMsg}
                  </span>
                  <button type="button" onClick={() => setParseSuccessMsg(null)} className="p-1 hover:bg-emerald-100 rounded">
                    <X className="w-3.5 h-3.5 text-emerald-700" />
                  </button>
                </div>
              )}

              {/* Editable Student Rows Manual Table */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 px-1">
                  <span>Converted / Manual Student Rows ({students.length})</span>
                  <button
                    type="button"
                    onClick={() => setStudents(prev => [...prev, { name: '', email: '', password: 'Student123!', className: 'Class 10 - Section A' }])}
                    className="text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 font-bold"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Student Row
                  </button>
                </div>

                <div className="max-h-72 overflow-y-auto space-y-2.5 pr-1">
                  {students.map((st, idx) => (
                    <div key={idx} className="grid grid-cols-1 sm:grid-cols-4 gap-3 p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200/80 dark:border-slate-800 items-center">
                      <input 
                        type="text"
                        value={st.name}
                        onChange={e => {
                          const updated = [...students];
                          updated[idx].name = e.target.value;
                          setStudents(updated);
                        }}
                        placeholder="Student Full Name"
                        className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
                      />
                      <input 
                        type="email"
                        value={st.email}
                        onChange={e => {
                          const updated = [...students];
                          updated[idx].email = e.target.value;
                          setStudents(updated);
                        }}
                        placeholder="Email Address"
                        className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                      <input 
                        type="text"
                        value={st.password}
                        onChange={e => {
                          const updated = [...students];
                          updated[idx].password = e.target.value;
                          setStudents(updated);
                        }}
                        placeholder="Initial Password"
                        className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                      <div className="flex items-center gap-2">
                        <input 
                          type="text"
                          value={st.className}
                          onChange={e => {
                            const updated = [...students];
                            updated[idx].className = e.target.value;
                            setStudents(updated);
                          }}
                          placeholder="Class - Section"
                          className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                        {students.length > 1 && (
                          <button 
                            type="button" 
                            onClick={() => setStudents(prev => prev.filter((_, i) => i !== idx))}
                            className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-3 pt-6 border-t border-slate-100 dark:border-slate-800">
              <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
              <Button type="submit" isLoading={isSubmitting}>
                Register School & Provision Accounts
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Institutions Table Card */}
      <Card className="p-0 overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="relative w-full sm:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filter institutions by name, email, location..." 
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-800 rounded-xl text-xs font-medium text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:border-indigo-500 transition"
            />
          </div>
          <Badge variant="neutral">{filteredInstitutions.length} Total Networks</Badge>
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
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Institution</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Contact Info</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Users Roster</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredInstitutions.map((inst) => (
                  <tr key={inst.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-sm shrink-0">
                          {inst.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900 dark:text-white">{inst.name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span 
                              title="Click to copy institution code for student/teacher signup"
                              onClick={() => {
                                navigator.clipboard.writeText(inst.code || '');
                                alert(`Copied Institution Code: ${inst.code}`);
                              }}
                              className="text-[10px] font-mono font-extrabold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950 px-2 py-0.5 rounded border border-indigo-200 dark:border-indigo-800 cursor-pointer hover:bg-indigo-100 transition"
                            >
                              Code: {inst.code}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 mt-1">
                            <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                            <span className="truncate max-w-xs">{inst.address}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1 text-xs text-slate-600 dark:text-slate-300">
                        <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-slate-400" /> {inst.email}</span>
                        <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-slate-400" /> {inst.phone || 'N/A'}</span>
                        <span className="flex items-center gap-1.5 font-mono text-[11px] text-slate-400"><Lock className="w-3 h-3 text-slate-400" /> {inst.password || '******'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col text-xs">
                        <span className="font-bold text-slate-900 dark:text-white">{inst.studentsCount || 0} Students</span>
                        <span className="text-slate-500 dark:text-slate-400">{inst.teachersCount || 0} Teachers</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge 
                        variant={
                          inst.status === 'Active' ? 'success' :
                          inst.status === 'Pending' ? 'warning' : 'danger'
                        }
                        dot
                      >
                        {inst.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium relative">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveDropdown(activeDropdown === inst.id ? null : inst.id);
                        }}
                        className="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                      >
                        <MoreVertical className="w-5 h-5" />
                      </button>
                      
                      {activeDropdown === inst.id && (
                        <div className="absolute right-6 top-12 w-44 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden z-20 space-y-1 p-1">
                          <button 
                            className="w-full px-3.5 py-2 text-left text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl flex items-center gap-2 transition"
                            onClick={async (e) => {
                              e.stopPropagation();
                              setActiveDropdown(null);
                              try {
                                if (inst.status === 'Pending') {
                                  const generatedInstCode = `INST-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
                                  await updateDoc(doc(db, 'institutions', inst.id), {
                                    status: 'Active',
                                    code: inst.code || generatedInstCode
                                  });
                                  alert(`Institution Accepted! Tell them to sign up with Code: ${inst.code || generatedInstCode}`);
                                } else {
                                  await updateDoc(doc(db, 'institutions', inst.id), {
                                    status: inst.status === 'Active' ? 'Suspended' : 'Active'
                                  });
                                }
                              } catch (err) {
                                console.error(err);
                              }
                            }}
                          >
                            <Edit className="w-3.5 h-3.5 text-indigo-500" /> {inst.status === 'Pending' ? 'Accept & Generate Code' : (inst.status === 'Active' ? 'Suspend Access' : 'Activate School')}
                          </button>
                          <button 
                            className="w-full px-3.5 py-2 text-left text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-xl flex items-center gap-2 transition"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveDropdown(null);
                              setDeleteInstId(inst.id);
                            }}
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Delete Institution
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {filteredInstitutions.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400 text-sm">
                      No matching institutions found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </Card>

      <ConfirmModal
        isOpen={!!deleteInstId}
        title="Delete Institution"
        message="Are you sure you want to delete this institution? All linked accounts and data will be permanently removed."
        onConfirm={confirmDelete}
        onCancel={() => setDeleteInstId(null)}
      />
    </div>
  );
}
