import React, { useState, useEffect } from 'react';
import { PageHeader, Card, Button, Badge, ConfirmModal } from '../../components/ui';
import { BookOpen, Plus, Search, Loader2, Edit, Trash2, Users, GraduationCap, Check, X, UserCheck, BookMarked, Layers, Sparkles, Lock, Copy } from 'lucide-react';
import { collection, query, onSnapshot, setDoc, deleteDoc, doc, where, serverTimestamp, updateDoc, writeBatch } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';

type TeacherOption = {
  id: string;
  name: string;
  subject?: string;
  email: string;
};

type StudentOption = {
  id: string;
  name: string;
  email: string;
  rollNumber?: string;
  assignedClass?: string;
};

type SubjectTeacherMapping = {
  subject: string;
  teacherId: string;
  teacherName: string;
};

type ClassSection = {
  id: string;
  className: string;
  section: string;
  fullTitle: string;
  code?: string;
  classTeacherId: string;
  classTeacherName: string;
  subjectTeachers: SubjectTeacherMapping[];
  studentIds: string[];
  institutionId: string;
  createdAt: any;
};

export default function ClassesAndSections() {
  const { user } = useAuth();
  const [classes, setClasses] = useState<ClassSection[]>([]);
  const [teachers, setTeachers] = useState<TeacherOption[]>([]);
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassSection | null>(null);
  const [deleteClassId, setDeleteClassId] = useState<string | null>(null);
  const [createdClassSuccess, setCreatedClassSuccess] = useState<{ fullTitle: string; code: string; classId: string } | null>(null);
  const [copiedSuccessCode, setCopiedSuccessCode] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [studentSearch, setStudentSearch] = useState('');

  // Form states
  const [classNameInput, setClassNameInput] = useState('');
  const [sectionInput, setSectionInput] = useState('');
  const [selectedClassTeacherId, setSelectedClassTeacherId] = useState('');
  const [subjectTeacherPairs, setSubjectTeacherPairs] = useState<{ subject: string; teacherId: string }[]>([
    { subject: 'Mathematics', teacherId: '' },
    { subject: 'Science', teacherId: '' },
    { subject: 'English', teacherId: '' }
  ]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);

  const targetInstId = user?.institutionId || (user?.role === 'INSTITUTION' ? user?.id : 'default_institution');

  // Fetch Classes, Teachers, and Students
  useEffect(() => {
    if (!user || !targetInstId) return;

    // 1. Fetch Classes
    const qClasses = query(collection(db, 'classes'), where('institutionId', '==', targetInstId));
    const unsubscribeClasses = onSnapshot(qClasses, (snapshot) => {
      const list: ClassSection[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const code = data.code || data.classCode || `CLS-${docSnap.id.substring(0, 5).toUpperCase()}`;
        list.push({ id: docSnap.id, code, ...data } as ClassSection);

        // Backfill missing code permanently in Firestore
        if (!data.code || !data.classCode) {
          updateDoc(doc(db, 'classes', docSnap.id), {
            code,
            classCode: code
          }).catch(() => {});
        }
      });
      list.sort((a, b) => a.fullTitle?.localeCompare(b.fullTitle || '') || 0);
      setClasses(list);
      setIsLoading(false);
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, 'classes');
      setIsLoading(false);
    });

    // 2. Fetch Teachers
    const qTeachers = query(collection(db, 'users'), where('role', '==', 'TEACHER'), where('institutionId', '==', targetInstId));
    const unsubscribeTeachers = onSnapshot(qTeachers, (snapshot) => {
      const list: TeacherOption[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        list.push({ id: docSnap.id, name: data.name, subject: data.subject, email: data.email });
      });
      setTeachers(list);
    });

    // 3. Fetch Students
    const qStudents = query(collection(db, 'users'), where('role', '==', 'STUDENT'), where('institutionId', '==', targetInstId));
    const unsubscribeStudents = onSnapshot(qStudents, (snapshot) => {
      const list: StudentOption[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        list.push({
          id: docSnap.id,
          name: data.name,
          email: data.email,
          rollNumber: data.rollNumber,
          assignedClass: data.assignedClass
        });
      });
      setStudents(list);
    });

    return () => {
      unsubscribeClasses();
      unsubscribeTeachers();
      unsubscribeStudents();
    };
  }, [user, targetInstId]);

  const openCreateModal = () => {
    setEditingClass(null);
    setClassNameInput('');
    setSectionInput('');
    setSelectedClassTeacherId('');
    setSubjectTeacherPairs([
      { subject: 'Mathematics', teacherId: '' },
      { subject: 'Science', teacherId: '' },
      { subject: 'English', teacherId: '' }
    ]);
    setSelectedStudentIds([]);
    setShowModal(true);
  };

  const openEditModal = (cls: ClassSection) => {
    setEditingClass(cls);
    setClassNameInput(cls.className || '');
    setSectionInput(cls.section || '');
    setSelectedClassTeacherId(cls.classTeacherId || '');
    
    if (cls.subjectTeachers && cls.subjectTeachers.length > 0) {
      setSubjectTeacherPairs(cls.subjectTeachers.map(st => ({ subject: st.subject, teacherId: st.teacherId })));
    } else {
      setSubjectTeacherPairs([{ subject: 'Mathematics', teacherId: '' }]);
    }
    
    setSelectedStudentIds(cls.studentIds || []);
    setShowModal(true);
  };

  const handleAddSubjectPair = () => {
    setSubjectTeacherPairs(prev => [...prev, { subject: '', teacherId: '' }]);
  };

  const handleRemoveSubjectPair = (index: number) => {
    setSubjectTeacherPairs(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubjectPairChange = (index: number, field: 'subject' | 'teacherId', value: string) => {
    setSubjectTeacherPairs(prev => {
      const copy = [...prev];
      copy[index][field] = value;
      return copy;
    });
  };

  const toggleStudentSelection = (studentId: string) => {
    setSelectedStudentIds(prev =>
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const selectAllFilteredStudents = () => {
    const filteredIds = filteredStudentOptions.map(s => s.id);
    const allSelected = filteredIds.every(id => selectedStudentIds.includes(id));
    if (allSelected) {
      setSelectedStudentIds(prev => prev.filter(id => !filteredIds.includes(id)));
    } else {
      const combined = new Set([...selectedStudentIds, ...filteredIds]);
      setSelectedStudentIds(Array.from(combined));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetInstId) {
      alert("No institution ID found. Please refresh and try again.");
      return;
    }
    if (!classNameInput.trim() || !sectionInput.trim()) {
      alert("Please enter Class Name and Section.");
      return;
    }

    setIsSubmitting(true);
    const fullTitle = `${classNameInput.trim()} - Section ${sectionInput.trim()}`;
    const classTeacherObj = teachers.find(t => t.id === selectedClassTeacherId);
    
    // Map subject teachers
    const formattedSubjectTeachers: SubjectTeacherMapping[] = subjectTeacherPairs
      .filter(p => p.subject.trim() !== '')
      .map(p => {
        const found = teachers.find(t => t.id === p.teacherId);
        return {
          subject: p.subject.trim(),
          teacherId: p.teacherId,
          teacherName: found ? found.name : 'Unassigned'
        };
      });

    // Create safe document reference ID without invalid characters
    const classDocRef = editingClass 
      ? doc(db, 'classes', editingClass.id)
      : doc(collection(db, 'classes'));

    try {
      const generatedCode = editingClass?.code || (editingClass as any)?.classCode || `CLS-${Math.floor(10000 + Math.random() * 90000)}`;
      const classData = {
        className: classNameInput.trim() || 'Class',
        section: sectionInput.trim() || 'A',
        fullTitle,
        code: generatedCode,
        classCode: generatedCode,
        classTeacherId: selectedClassTeacherId || '',
        classTeacherName: classTeacherObj ? classTeacherObj.name : 'Unassigned',
        subjectTeachers: formattedSubjectTeachers || [],
        studentIds: selectedStudentIds || [],
        institutionId: targetInstId || 'default_institution',
        updatedAt: new Date().toISOString(),
        createdAt: editingClass?.createdAt || new Date().toISOString()
      };

      await setDoc(classDocRef, classData, { merge: true });

      // Update student profiles assignedClass field safely with setDoc merge
      if (selectedStudentIds.length > 0) {
        await Promise.allSettled(
          selectedStudentIds.map(stId =>
            setDoc(doc(db, 'users', stId), { assignedClass: fullTitle, classId: classDocRef.id }, { merge: true })
          )
        );
      }

      // Also update teachers assigned classes string if teacher assigned
      const involvedTeacherIds = new Set<string>();
      if (selectedClassTeacherId) involvedTeacherIds.add(selectedClassTeacherId);
      formattedSubjectTeachers.forEach(st => {
        if (st.teacherId) involvedTeacherIds.add(st.teacherId);
      });

      for (const tId of involvedTeacherIds) {
        if (!tId) continue;
        const teacherObj = teachers.find(t => t.id === tId);
        if (teacherObj) {
          const tRef = doc(db, 'users', tId);
          await setDoc(tRef, {
            assignedClasses: teacherObj.subject ? `${fullTitle} (${teacherObj.subject})` : fullTitle
          }, { merge: true });
        }
      }

      setShowModal(false);
      if (!editingClass) {
        setCreatedClassSuccess({
          fullTitle,
          code: generatedCode,
          classId: classDocRef.id
        });
      } else {
        alert(`✅ Class & Section "${fullTitle}" successfully updated!`);
      }
    } catch (error: any) {
      handleFirestoreError(error, OperationType.WRITE, 'classes');
      alert(`Failed to save class & section: ${error?.message || "Please check inputs and try again."}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDeleteClass = async () => {
    if (!deleteClassId) return;
    const targetId = deleteClassId;
    setClasses(prev => prev.filter(c => c.id !== targetId));
    setDeleteClassId(null);
    try {
      await deleteDoc(doc(db, 'classes', targetId));
    } catch (error) {
      console.error("Error deleting class:", error);
      alert("Failed to delete class.");
    }
  };

  const filteredClasses = classes.filter(c =>
    c.fullTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.classTeacherName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredStudentOptions = students.filter(s =>
    s.name?.toLowerCase().includes(studentSearch.toLowerCase()) ||
    s.email?.toLowerCase().includes(studentSearch.toLowerCase()) ||
    s.rollNumber?.toLowerCase().includes(studentSearch.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <PageHeader 
        title="Class & Section Governance" 
        description="Register classes, generate permanent student sign-up codes, map faculty, and enroll student rosters."
        badge="Institution Suite"
        breadcrumbs={[{ label: 'Institution' }, { label: 'Classes & Sections' }]}
        action={
          <Button 
            onClick={openCreateModal}
            icon={<Plus className="w-4 h-4" />}
          >
            Create Class & Section
          </Button>
        }
      />

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="flex items-center gap-4 border-l-4 border-l-indigo-500">
          <div className="p-3.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Total Created Classes</p>
            <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-0.5">{classes.length} Sections</h3>
          </div>
        </Card>

        <Card className="flex items-center gap-4 border-l-4 border-l-emerald-500">
          <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Enrolled Students</p>
            <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-0.5">
              {students.length} Registered
            </h3>
          </div>
        </Card>

        <Card className="flex items-center gap-4 border-l-4 border-l-purple-500">
          <div className="p-3.5 rounded-2xl bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Available Faculty</p>
            <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-0.5">
              {teachers.length} Teachers
            </h3>
          </div>
        </Card>
      </div>

      {/* Filter and Class Grid */}
      <Card className="p-0 overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="relative w-full sm:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input 
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search by class name or class teacher..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-800 rounded-xl text-xs font-medium text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:border-indigo-500 transition"
            />
          </div>
          <Badge variant="indigo">{filteredClasses.length} Active Class Sections</Badge>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-600" />
            Loading class roster...
          </div>
        ) : filteredClasses.length > 0 ? (
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredClasses.map((cls) => (
              <div 
                key={cls.id} 
                className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 hover:shadow-xl transition flex flex-col justify-between space-y-5"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-2 py-0.5 rounded-md">
                          {cls.className}
                        </span>
                        {cls.code && (
                          <span 
                            title="Click to copy permanent Class Sign-Up Code"
                            className="text-[10px] font-mono font-extrabold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/80 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800 cursor-pointer hover:bg-emerald-100 dark:hover:bg-emerald-900 transition flex items-center gap-1 shadow-sm"
                            onClick={() => {
                              navigator.clipboard.writeText(cls.code || '');
                              alert(`Copied Permanent Class Code: ${cls.code}\n\nStudents can use this code during Sign Up to register into this class.`);
                            }}
                          >
                            <Lock className="w-2.5 h-2.5 text-emerald-600" />
                            Code: {cls.code}
                            <Copy className="w-2.5 h-2.5 ml-0.5 text-emerald-500" />
                          </span>
                        )}
                      </div>
                      <h3 className="text-lg font-extrabold text-slate-900 dark:text-white mt-1">
                        {cls.fullTitle}
                      </h3>
                    </div>
                    <Badge variant="emerald">{cls.studentIds?.length || 0} Students</Badge>
                  </div>

                  {/* Class Teacher */}
                  <div className="mt-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-1">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      <UserCheck className="w-3.5 h-3.5 text-indigo-500" /> Class Teacher
                    </div>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {cls.classTeacherName || 'Unassigned'}
                    </p>
                  </div>

                  {/* Subject Teachers */}
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      <BookMarked className="w-3.5 h-3.5 text-purple-500" /> Subject Teachers
                    </div>
                    {cls.subjectTeachers && cls.subjectTeachers.length > 0 ? (
                      <div className="space-y-1.5">
                        {cls.subjectTeachers.map((st, i) => (
                          <div key={i} className="flex items-center justify-between text-xs px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                            <span className="font-semibold text-slate-700 dark:text-slate-300">{st.subject}</span>
                            <span className="text-slate-500 dark:text-slate-400 text-[11px]">{st.teacherName}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic">No subject teachers mapped.</p>
                    )}
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 flex-wrap gap-2">
                  <div className="text-[11px] text-slate-400">
                    <GraduationCap className="w-3.5 h-3.5 inline mr-1 text-emerald-500" />
                    {cls.studentIds?.length || 0} enrolled
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => openEditModal(cls)}
                      icon={<Users className="w-3.5 h-3.5 text-indigo-500" />}
                    >
                      Manage Roster
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => openEditModal(cls)}
                      icon={<Edit className="w-3.5 h-3.5" />}
                    >
                      Edit
                    </Button>
                    <Button 
                      variant="danger" 
                      size="sm"
                      onClick={() => setDeleteClassId(cls.id)}
                      icon={<Trash2 className="w-3.5 h-3.5" />}
                    >
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center text-slate-400 text-sm">
            No classes found matching your search. Click "Create Class & Section" to establish a new section.
          </div>
        )}
      </Card>

      {/* Create / Edit Class Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200 space-y-6 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                    {editingClass ? `Edit ${editingClass.fullTitle}` : 'Create New Class & Section'}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Assign Class Teacher, Subject Teachers, and option to add students
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Information Notice */}
            <div className="p-3.5 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/80 border border-indigo-200/80 dark:border-indigo-800 flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
              <div className="text-xs text-indigo-900 dark:text-indigo-200">
                <span className="font-bold block mb-0.5">Students are NOT required during class setup</span>
                A permanent Class Code will be generated automatically upon class creation. Share the code with students so they can sign up directly, or you can add students anytime later.
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Permanent Class Code Display if Editing */}
              {editingClass && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2 flex items-center justify-between">
                    <span>Permanent Class Code</span>
                    <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-md flex items-center gap-1 border border-emerald-200 dark:border-emerald-800">
                      <Lock className="w-3 h-3" /> Locked & Permanent
                    </span>
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input 
                      type="text" 
                      readOnly 
                      disabled 
                      value={editingClass.code || `CLS-${editingClass.id.substring(0, 5).toUpperCase()}`}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900/80 text-slate-700 dark:text-slate-300 text-sm font-mono font-bold cursor-not-allowed outline-none select-all" 
                    />
                  </div>
                </div>
              )}

              {/* Class & Section Names */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">Class / Grade Name</label>
                  <input 
                    type="text"
                    required
                    value={classNameInput}
                    onChange={e => setClassNameInput(e.target.value)}
                    placeholder="e.g. Grade 10"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-sm outline-none focus:border-indigo-500 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">Section</label>
                  <input 
                    type="text"
                    required
                    value={sectionInput}
                    onChange={e => setSectionInput(e.target.value)}
                    placeholder="e.g. A"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-sm outline-none focus:border-indigo-500 transition"
                  />
                </div>
              </div>

              {/* Class Teacher Selection */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">Assign Class Teacher</label>
                <select
                  value={selectedClassTeacherId}
                  onChange={e => setSelectedClassTeacherId(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-sm outline-none focus:border-indigo-500 transition"
                >
                  <option value="">-- Select Class Teacher --</option>
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.name} {t.subject ? `(${t.subject})` : ''} - {t.email}
                    </option>
                  ))}
                </select>
              </div>

              {/* Subject Teachers Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Subject Teachers Mapping</label>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Assigned teachers cannot be reassigned to multiple subjects in this class.</p>
                  </div>
                  <Button type="button" variant="ghost" size="sm" onClick={handleAddSubjectPair} icon={<Plus className="w-3.5 h-3.5" />}>
                    Add Subject
                  </Button>
                </div>

                <div className="space-y-3">
                  {subjectTeacherPairs.map((pair, index) => {
                    const otherAssignedTeacherIds = subjectTeacherPairs
                      .filter((_, idx) => idx !== index)
                      .map(p => p.teacherId)
                      .filter(Boolean);

                    return (
                      <div key={index} className="flex flex-col sm:flex-row items-center gap-3 bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800">
                        <input 
                          type="text"
                          placeholder="Subject Name (e.g. Physics)"
                          value={pair.subject}
                          onChange={e => handleSubjectPairChange(index, 'subject', e.target.value)}
                          className="w-full sm:w-1/3 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-900 dark:text-white outline-none focus:border-indigo-500"
                        />
                        <select
                          value={pair.teacherId}
                          onChange={e => handleSubjectPairChange(index, 'teacherId', e.target.value)}
                          className="w-full sm:w-2/3 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white outline-none focus:border-indigo-500"
                        >
                          <option value="">-- Select Teacher --</option>
                          {teachers.map(t => {
                            const isAssignedElsewhere = otherAssignedTeacherIds.includes(t.id);
                            return (
                              <option 
                                key={t.id} 
                                value={t.id}
                                disabled={isAssignedElsewhere}
                              >
                                {t.name} {t.subject ? `[${t.subject}]` : ''} {isAssignedElsewhere ? '🔒 (Already assigned)' : ''}
                              </option>
                            );
                          })}
                        </select>
                        {subjectTeacherPairs.length > 1 && (
                          <button 
                            type="button" 
                            onClick={() => handleRemoveSubjectPair(index)}
                            className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950 rounded-lg shrink-0"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Student Assignment Section */}
              <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      Assign Students ({selectedStudentIds.length} Selected) <span className="text-slate-400 font-normal lowercase text-[11px]">(optional)</span>
                    </label>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Optional: Check students to enroll now, or leave empty and share the permanent Class Code.
                    </p>
                  </div>
                  <Button type="button" variant="ghost" size="sm" onClick={selectAllFilteredStudents}>
                    Toggle All Filtered
                  </Button>
                </div>

                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input 
                    type="text"
                    value={studentSearch}
                    onChange={e => setStudentSearch(e.target.value)}
                    placeholder="Search student list by name or email..."
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white outline-none"
                  />
                </div>

                <div className="max-h-48 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-xl divide-y divide-slate-100 dark:divide-slate-800 bg-slate-50/50 dark:bg-slate-950/50 p-2 space-y-1">
                  {filteredStudentOptions.length > 0 ? (
                    filteredStudentOptions.map(st => {
                      const isSelected = selectedStudentIds.includes(st.id);
                      return (
                        <div 
                          key={st.id}
                          onClick={() => toggleStudentSelection(st.id)}
                          className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition text-xs ${
                            isSelected 
                              ? 'bg-indigo-50/80 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-800' 
                              : 'hover:bg-white dark:hover:bg-slate-900'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <input 
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}} // handled by parent div onClick
                              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <div>
                              <p className="font-bold text-slate-900 dark:text-white">{st.name}</p>
                              <p className="text-[10px] text-slate-400">{st.email} {st.rollNumber ? `• Roll: ${st.rollNumber}` : ''}</p>
                            </div>
                          </div>
                          {st.assignedClass && (
                            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                              {st.assignedClass}
                            </span>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-6 text-xs text-slate-400">
                      No students found matching "{studentSearch}"
                    </div>
                  )}
                </div>
              </div>

              {/* Submit buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <Button type="button" variant="ghost" onClick={() => setShowModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" isLoading={isSubmitting} icon={<Check className="w-4 h-4" />}>
                  {editingClass ? 'Update Class & Section' : 'Generate Class & Section'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Class Created Success Modal with Permanent Code */}
      {createdClassSuccess && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-200 dark:border-slate-800 text-center space-y-6 animate-in zoom-in-95 duration-200 my-8">
            <div className="w-16 h-16 rounded-3xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto border border-emerald-200 dark:border-emerald-800 shadow-inner">
              <Sparkles className="w-8 h-8" />
            </div>

            <div>
              <Badge variant="emerald" className="mb-2">Class Created Successfully</Badge>
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
                {createdClassSuccess.fullTitle}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                The class section is registered! Here is the permanent sign-up code for students.
              </p>
            </div>

            {/* Permanent Code Box */}
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-amber-500" /> Permanent Class Sign-Up Code
              </div>
              <div className="text-2xl font-mono font-black tracking-widest text-emerald-600 dark:text-emerald-400 py-1 select-all">
                {createdClassSuccess.code}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Provide this permanent code to students. They will enter it during Sign Up to automatically register into this class.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button 
                className="w-full justify-center"
                onClick={() => {
                  navigator.clipboard.writeText(createdClassSuccess.code);
                  setCopiedSuccessCode(true);
                  setTimeout(() => setCopiedSuccessCode(false), 2000);
                }}
                icon={copiedSuccessCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              >
                {copiedSuccessCode ? 'Copied to Clipboard!' : 'Copy Permanent Code'}
              </Button>
              <Button 
                variant="ghost"
                className="w-full justify-center"
                onClick={() => setCreatedClassSuccess(null)}
              >
                Done
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete */}
      <ConfirmModal 
        isOpen={!!deleteClassId}
        title="Delete Class Section"
        message="Are you sure you want to delete this Class & Section? This action will remove the section layout, but student profiles will remain."
        onConfirm={confirmDeleteClass}
        onCancel={() => setDeleteClassId(null)}
      />
    </div>
  );
}
