import React, { useState, useEffect } from 'react';
import { PageHeader } from '../../components/ui';
import { Calendar as CalendarIcon, Clock, Plus, Trash2, Edit3, UserCheck, BookOpen, Loader2, RefreshCw, Check, AlertCircle, Sparkles, Wand2, X, CheckCircle2 } from 'lucide-react';
import { collection, query, where, onSnapshot, setDoc, deleteDoc, doc, serverTimestamp, getDocs } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';

type TimetableSlot = {
  id: string;
  institutionId: string;
  className: string; // e.g., "Class 10-A"
  day: string; // "Monday", "Tuesday", etc.
  time: string; // "09:00 AM"
  subject: string;
  teacherName?: string;
  teacherId?: string;
  room?: string;
};

type SavedClass = {
  id: string;
  className: string;
  section: string;
  fullTitle: string;
  subjectTeachers?: { subject: string; teacherId: string }[];
};

const DEFAULT_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const DEFAULT_TIMES = ['09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '01:00 PM', '02:00 PM'];

const INITIAL_SAMPLE_SLOTS = [
  { day: 'Monday', time: '09:00 AM', subject: 'Mathematics', teacherName: 'John Doe', room: 'Room 101' },
  { day: 'Monday', time: '10:00 AM', subject: 'English', teacherName: 'Sarah Connor', room: 'Room 102' },
  { day: 'Monday', time: '11:00 AM', subject: 'Physics', teacherName: 'Dr. Robert', room: 'Physics Lab' },
  { day: 'Monday', time: '12:00 PM', subject: 'Lunch Break', teacherName: '-', room: 'Cafeteria' },
  { day: 'Monday', time: '01:00 PM', subject: 'History', teacherName: 'John Doe', room: 'Room 103' },
  { day: 'Tuesday', time: '09:00 AM', subject: 'Physics', teacherName: 'Dr. Robert', room: 'Physics Lab' },
  { day: 'Tuesday', time: '10:00 AM', subject: 'Mathematics', teacherName: 'John Doe', room: 'Room 101' },
  { day: 'Tuesday', time: '11:00 AM', subject: 'Chemistry', teacherName: 'Sarah Connor', room: 'Chem Lab' },
  { day: 'Tuesday', time: '12:00 PM', subject: 'Lunch Break', teacherName: '-', room: 'Cafeteria' },
  { day: 'Wednesday', time: '09:00 AM', subject: 'Biology', teacherName: 'Sarah Connor', room: 'Bio Lab' },
  { day: 'Wednesday', time: '10:00 AM', subject: 'Computer Science', teacherName: 'Dr. Robert', room: 'CS Lab 2' },
  { day: 'Wednesday', time: '11:00 AM', subject: 'Mathematics', teacherName: 'John Doe', room: 'Room 101' },
  { day: 'Thursday', time: '09:00 AM', subject: 'English', teacherName: 'Sarah Connor', room: 'Room 102' },
  { day: 'Thursday', time: '10:00 AM', subject: 'Chemistry', teacherName: 'Sarah Connor', room: 'Chem Lab' },
  { day: 'Friday', time: '09:00 AM', subject: 'Physical Ed', teacherName: 'John Doe', room: 'Ground' },
  { day: 'Friday', time: '10:00 AM', subject: 'Mathematics', teacherName: 'John Doe', room: 'Room 101' },
];

export default function Timetable() {
  const { user } = useAuth();
  const isPrincipal = user?.role === 'INSTITUTION' || user?.role === 'SUPER_ADMIN';
  const isTeacher = user?.role === 'TEACHER';
  const isStudent = user?.role === 'STUDENT';

  const [selectedClass, setSelectedClass] = useState<string>('Class 10-A');
  const [slots, setSlots] = useState<TimetableSlot[]>([]);
  const [teachersList, setTeachersList] = useState<{ id: string; name: string; subject?: string }[]>([]);
  const [savedClasses, setSavedClasses] = useState<SavedClass[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSeeding, setIsSeeding] = useState(false);
  
  // AI Timetable Generator states
  const [showAiModal, setShowAiModal] = useState(false);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [isApplyingAi, setIsApplyingAi] = useState(false);
  const [aiResponse, setAiResponse] = useState<{ slots: any[]; aiRationale: string } | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  const [showSlotModal, setShowSlotModal] = useState(false);
  const [editingSlot, setEditingSlot] = useState<Partial<TimetableSlot>>({
    day: 'Monday',
    time: '09:00 AM',
    subject: '',
    teacherName: '',
    room: ''
  });

  const institutionId = user?.institutionId || (isPrincipal ? user?.id : null);

  // Fetch registered teachers for Principal selection dropdown
  useEffect(() => {
    if (!institutionId) return;
    const q = query(
      collection(db, 'users'), 
      where('role', '==', 'TEACHER'),
      where('institutionId', '==', institutionId)
    );
    const unsub = onSnapshot(q, snap => {
      const list: { id: string; name: string; subject?: string }[] = [];
      snap.forEach(d => list.push({ id: d.id, name: d.data().name, subject: d.data().subject }));
      setTeachersList(list);
    }, err => handleFirestoreError(err, OperationType.GET, 'users'));
    return () => unsub();
  }, [institutionId]);

  // Fetch saved classes from Firestore to populate dynamic class dropdown & subject-teacher mappings
  useEffect(() => {
    if (!institutionId) return;
    const q = query(
      collection(db, 'classes'),
      where('institutionId', '==', institutionId)
    );
    const unsub = onSnapshot(q, snap => {
      const list: SavedClass[] = [];
      snap.forEach(d => {
        const data = d.data();
        list.push({
          id: d.id,
          className: data.className || '',
          section: data.section || '',
          fullTitle: data.fullTitle || `${data.className || ''} ${data.section || ''}`.trim(),
          subjectTeachers: data.subjectTeachers || []
        });
      });
      setSavedClasses(list);
      if (list.length > 0 && !selectedClass) {
        setSelectedClass(list[0].fullTitle);
      }
    }, err => handleFirestoreError(err, OperationType.GET, 'classes'));
    return () => unsub();
  }, [institutionId]);

  // Set default class based on student/teacher role
  useEffect(() => {
    if (isStudent && user?.assignedClass) {
      setSelectedClass(user.assignedClass);
    } else if (isTeacher && user?.assignedClasses) {
      const firstClass = user.assignedClasses.split(',')[0]?.trim();
      if (firstClass) setSelectedClass(firstClass);
    }
  }, [user, isStudent, isTeacher]);

  // Fetch live timetable slots from Firestore
  useEffect(() => {
    if (!institutionId) return;

    let q = query(
      collection(db, 'timetables'),
      where('institutionId', '==', institutionId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: TimetableSlot[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as TimetableSlot);
      });
      setSlots(list);
      setIsLoading(false);
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, 'timetables');
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [institutionId]);

  // Handle AI Timetable Generation
  const handleGenerateAiTimetable = async () => {
    setIsGeneratingAi(true);
    setAiError(null);
    setAiResponse(null);

    // Get subject-teacher mappings for selected class
    const currentClassObj = savedClasses.find(c => c.fullTitle.toLowerCase() === selectedClass.toLowerCase());
    let subjectTeachers: { subject: string; teacherName: string; teacherId?: string }[] = [];

    if (currentClassObj?.subjectTeachers && currentClassObj.subjectTeachers.length > 0) {
      subjectTeachers = currentClassObj.subjectTeachers.map(st => {
        const teacher = teachersList.find(t => t.id === st.teacherId);
        return {
          subject: st.subject,
          teacherId: st.teacherId,
          teacherName: teacher ? teacher.name : 'Assigned Teacher'
        };
      });
    } else {
      // Fallback mapped subjects if class mapping not established yet
      subjectTeachers = [
        { subject: 'Mathematics', teacherName: teachersList[0]?.name || 'Dr. Math Teacher' },
        { subject: 'Physics', teacherName: teachersList[1]?.name || 'Prof. Physics Teacher' },
        { subject: 'Chemistry', teacherName: teachersList[2]?.name || 'Dr. Chemistry Teacher' },
        { subject: 'English', teacherName: teachersList[3]?.name || 'Prof. English Teacher' },
        { subject: 'Computer Science', teacherName: teachersList[0]?.name || 'Tech Lead Teacher' }
      ];
    }

    try {
      const response = await fetch('/api/ai/generate-timetable', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.id || 'demo-token'}`
        },
        body: JSON.stringify({
          className: selectedClass,
          subjectTeachers,
          days: DEFAULT_DAYS,
          timeSlots: DEFAULT_TIMES,
          teachersList
        })
      });

      if (!response.ok) {
        throw new Error(`AI Service returned status ${response.status}`);
      }

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      setAiResponse(data);
    } catch (err: any) {
      console.error("AI Timetable Generation Error:", err);
      setAiError(err.message || 'Failed to generate AI Timetable. Please try again.');
    } finally {
      setIsGeneratingAi(false);
    }
  };

  // Apply AI Schedule to Firestore
  const handleApplyAiSchedule = async () => {
    if (!aiResponse || !aiResponse.slots || !institutionId) return;
    setIsApplyingAi(true);

    try {
      for (const slot of aiResponse.slots) {
        const slotId = `${selectedClass}_${slot.day}_${slot.time}`.replace(/[\s\/\\]/g, '_');
        const docRef = doc(db, 'timetables', slotId);

        await setDoc(docRef, {
          institutionId,
          className: selectedClass,
          day: slot.day,
          time: slot.time,
          subject: slot.subject,
          teacherName: slot.teacherName || '',
          room: slot.room || 'Classroom',
          updatedAt: serverTimestamp()
        }, { merge: true });
      }

      setShowAiModal(false);
      setAiResponse(null);
      alert(`✨ AI Timetable successfully generated & applied for ${selectedClass}!`);
    } catch (err: any) {
      handleFirestoreError(err, OperationType.WRITE, 'timetables');
      alert('Failed to save AI timetable. Please check permissions.');
    } finally {
      setIsApplyingAi(false);
    }
  };

  // Handle slot creation or update by Principal
  const handleSaveSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!institutionId || !editingSlot.subject) return;

    try {
      const slotId = editingSlot.id || `${selectedClass}_${editingSlot.day}_${editingSlot.time}`.replace(/[\s\/\\]/g, '_');
      const docRef = doc(db, 'timetables', slotId);
      
      await setDoc(docRef, {
        institutionId,
        className: selectedClass,
        day: editingSlot.day || 'Monday',
        time: editingSlot.time || '09:00 AM',
        subject: editingSlot.subject,
        teacherName: editingSlot.teacherName || '',
        room: editingSlot.room || '',
        updatedAt: serverTimestamp()
      }, { merge: true });

      setShowSlotModal(false);
      setEditingSlot({ day: 'Monday', time: '09:00 AM', subject: '', teacherName: '', room: '' });
      alert('Timetable period assigned successfully!');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'timetables');
      alert('Failed to save timetable period.');
    }
  };

  const handleDeleteSlot = async (slotId: string) => {
    try {
      await deleteDoc(doc(db, 'timetables', slotId));
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'timetables');
    }
  };

  const handleSeedSample = async () => {
    if (!institutionId) return;
    setIsSeeding(true);
    try {
      for (const item of INITIAL_SAMPLE_SLOTS) {
        const slotId = `${selectedClass}_${item.day}_${item.time}`.replace(/[\s\/\\]/g, '_');
        await setDoc(doc(db, 'timetables', slotId), {
          institutionId,
          className: selectedClass,
          day: item.day,
          time: item.time,
          subject: item.subject,
          teacherName: item.teacherName,
          room: item.room,
          createdAt: serverTimestamp()
        }, { merge: true });
      }
      alert(`Sample timetable assigned for ${selectedClass}!`);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'timetables');
    } finally {
      setIsSeeding(false);
    }
  };

  // Filter slots for current view
  const currentClassSlots = slots.filter(s => s.className?.toLowerCase() === selectedClass.toLowerCase());

  // Get slot for day & time
  const getSlot = (day: string, time: string) => {
    return currentClassSlots.find(s => s.day === day && s.time === time);
  };

  // Unique list of options for class dropdown
  const classOptions = Array.from(new Set([
    ...savedClasses.map(c => c.fullTitle),
    'Class 10-A', 'Class 10-B', 'Class 9-A', 'Class 9-B', 'Grade 11 Science', 'Grade 12 Math'
  ]));

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader 
        title={isPrincipal ? "Principal Timetable Assignment" : isTeacher ? "Teaching Schedule & Timetable" : "My Class Timetable"} 
        description={isPrincipal ? "Assign and manage timetable schedules for classes, sections, and teachers with Gemini AI." : `Weekly schedule for ${selectedClass}`}
        action={
          isPrincipal ? (
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => {
                  setAiResponse(null);
                  setAiError(null);
                  setShowAiModal(true);
                }}
                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-xl text-sm transition shadow-md shadow-indigo-500/20"
              >
                <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
                AI Timetable Generator
              </button>
              <button
                onClick={handleSeedSample}
                disabled={isSeeding}
                className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium rounded-xl text-sm transition"
              >
                {isSeeding ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                Auto-fill Sample
              </button>
              <button 
                onClick={() => {
                  setEditingSlot({ day: 'Monday', time: '09:00 AM', subject: '', teacherName: '', room: '' });
                  setShowSlotModal(true);
                }}
                className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl text-sm transition shadow-sm"
              >
                <Plus className="w-4 h-4" /> Assign Slot
              </button>
            </div>
          ) : null
        }
      />

      {/* Class Selector Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <BookOpen className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <span className="text-sm font-bold text-slate-700 dark:text-slate-200">Select Class & Section:</span>
          <select 
            value={selectedClass} 
            onChange={e => setSelectedClass(e.target.value)}
            className="px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-bold text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-indigo-600"
          >
            {classOptions.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {isPrincipal && (
          <div className="text-xs text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 px-3 py-1.5 rounded-lg border border-indigo-100 dark:border-indigo-900 font-medium flex items-center gap-1.5">
            <UserCheck className="w-4 h-4" /> Principal Mode: Use AI Generator above or click any grid cell below
          </div>
        )}
      </div>

      {/* AI Timetable Generator Modal */}
      {showAiModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200 my-8 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/30">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    AI Master Timetable Generator
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Generates a balanced, non-conflicting schedule for <span className="font-bold text-indigo-600 dark:text-indigo-400">{selectedClass}</span> using Gemini AI
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowAiModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Target Class Info Card */}
            <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                <span>Mapped Teachers & Subjects for {selectedClass}</span>
                <span className="text-indigo-600 dark:text-indigo-400">
                  {teachersList.length} Teachers Registered
                </span>
              </div>
              
              {savedClasses.find(c => c.fullTitle.toLowerCase() === selectedClass.toLowerCase())?.subjectTeachers?.length ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {savedClasses.find(c => c.fullTitle.toLowerCase() === selectedClass.toLowerCase())?.subjectTeachers?.map((st, i) => {
                    const teacher = teachersList.find(t => t.id === st.teacherId);
                    return (
                      <div key={i} className="flex items-center gap-2 bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-100 dark:border-slate-800">
                        <span className="font-bold text-slate-900 dark:text-white truncate">{st.subject}:</span>
                        <span className="text-indigo-600 dark:text-indigo-400 truncate">{teacher?.name || 'Assigned Teacher'}</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-xs text-slate-500 dark:text-slate-400 bg-amber-50 dark:bg-amber-950/40 p-3 rounded-xl border border-amber-200/60 dark:border-amber-900 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  No custom subject teacher mapping found for this class in Class & Sections. AI will auto-assign from registered faculty list.
                </div>
              )}
            </div>

            {/* Error banner if any */}
            {aiError && (
              <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{aiError}</span>
              </div>
            )}

            {/* AI Result Preview */}
            {aiResponse ? (
              <div className="space-y-4 animate-in fade-in duration-300">
                {/* Rationale Card */}
                <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-900/60">
                  <div className="flex items-center gap-2 font-bold text-xs text-indigo-900 dark:text-indigo-300 mb-1">
                    <Wand2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    Gemini AI Optimization Rationale
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                    {aiResponse.aiRationale}
                  </p>
                </div>

                {/* Slots Count Banner */}
                <div className="flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-400 px-1">
                  <span>Generated Periods: <strong className="text-slate-900 dark:text-white">{aiResponse.slots?.length || 0} Slots</strong></span>
                  <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-bold">
                    <CheckCircle2 className="w-4 h-4" /> Conflict-Free Schedule
                  </span>
                </div>

                {/* Mini Preview Table */}
                <div className="max-h-56 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-2xl divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                  {aiResponse.slots?.slice(0, 10).map((s: any, idx: number) => (
                    <div key={idx} className="p-2.5 flex items-center justify-between bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-950">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-700 dark:text-slate-300">{s.day} {s.time}</span>
                        <span className="font-bold text-slate-900 dark:text-white">{s.subject}</span>
                      </div>
                      <span className="text-indigo-600 dark:text-indigo-400 font-medium">{s.teacherName}</span>
                    </div>
                  ))}
                  {(aiResponse.slots?.length || 0) > 10 && (
                    <div className="p-2 text-center text-[11px] text-slate-400 bg-slate-50 dark:bg-slate-950">
                      + {(aiResponse.slots?.length || 0) - 10} more weekly period slots...
                    </div>
                  )}
                </div>
              </div>
            ) : null}

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowAiModal(false)}
                className="px-5 py-2.5 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-medium text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition"
              >
                Cancel
              </button>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleGenerateAiTimetable}
                  disabled={isGeneratingAi}
                  className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-xl text-sm transition shadow-md shadow-indigo-500/20 flex items-center gap-2 disabled:opacity-50"
                >
                  {isGeneratingAi ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Analyzing & Optimizing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      {aiResponse ? 'Re-Generate AI Timetable' : 'Generate AI Schedule'}
                    </>
                  )}
                </button>

                {aiResponse && (
                  <button
                    type="button"
                    onClick={handleApplyAiSchedule}
                    disabled={isApplyingAi}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm transition shadow-md shadow-emerald-600/20 flex items-center gap-2 disabled:opacity-50"
                  >
                    {isApplyingAi ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        Apply & Save to Timetable
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Slot Modal */}
      {showSlotModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-xl animate-in zoom-in-95 duration-200">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-indigo-600" />
              Assign Timetable Slot ({selectedClass})
            </h2>
            <form onSubmit={handleSaveSlot} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Day</label>
                  <select 
                    value={editingSlot.day} 
                    onChange={e => setEditingSlot({...editingSlot, day: e.target.value})}
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm outline-none text-slate-900 dark:text-white"
                  >
                    {DEFAULT_DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Time Slot</label>
                  <select 
                    value={editingSlot.time} 
                    onChange={e => setEditingSlot({...editingSlot, time: e.target.value})}
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm outline-none text-slate-900 dark:text-white"
                  >
                    {DEFAULT_TIMES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Subject Name</label>
                <input 
                  type="text" 
                  required
                  value={editingSlot.subject || ''}
                  onChange={e => setEditingSlot({...editingSlot, subject: e.target.value})}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-600 outline-none text-sm"
                  placeholder="e.g. Mathematics, Physics, Chemistry"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Assigned Teacher</label>
                {teachersList.length > 0 ? (
                  <select 
                    value={editingSlot.teacherName || ''}
                    onChange={e => setEditingSlot({...editingSlot, teacherName: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-indigo-600 outline-none text-sm bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                  >
                    <option value="">-- Select Teacher --</option>
                    {teachersList.map(t => (
                      <option key={t.id} value={t.name}>{t.name}</option>
                    ))}
                  </select>
                ) : (
                  <input 
                    type="text" 
                    value={editingSlot.teacherName || ''}
                    onChange={e => setEditingSlot({...editingSlot, teacherName: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-600 outline-none text-sm"
                    placeholder="e.g. John Doe"
                  />
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Room / Lab (Optional)</label>
                <input 
                  type="text" 
                  value={editingSlot.room || ''}
                  onChange={e => setEditingSlot({...editingSlot, room: e.target.value})}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-600 outline-none text-sm"
                  placeholder="e.g. Room 101, Science Lab"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button 
                  type="button" 
                  onClick={() => setShowSlotModal(false)}
                  className="px-5 py-2 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-medium text-sm hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-5 py-2 bg-indigo-600 text-white rounded-xl font-medium text-sm hover:bg-indigo-700 flex items-center gap-2"
                >
                  <Check className="w-4 h-4" /> Save Period
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Schedule Table Grid */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CalendarIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="font-bold text-slate-900 dark:text-white">Weekly Schedule - {selectedClass}</h3>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-12 text-center text-slate-500 flex justify-center items-center gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-600" /> Loading timetable...
            </div>
          ) : (
            <table className="w-full text-center border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800">
                  <th className="px-4 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase w-28">Time Slot</th>
                  {DEFAULT_DAYS.map(day => (
                    <th key={day} className="px-4 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase min-w-[140px]">{day}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {DEFAULT_TIMES.map((timeSlot) => (
                  <tr key={timeSlot} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/50 transition-colors">
                    <td className="px-4 py-4 whitespace-nowrap bg-slate-50/30 dark:bg-slate-950/30">
                      <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-300">
                        <Clock className="w-3.5 h-3.5 text-indigo-500" />
                        {timeSlot}
                      </div>
                    </td>

                    {DEFAULT_DAYS.map(day => {
                      const slot = getSlot(day, timeSlot);
                      const isBreak = slot?.subject?.toLowerCase().includes('break');

                      return (
                        <td key={day} className="px-3 py-3 align-top">
                          {slot ? (
                            <div className={`p-3 rounded-xl text-left border relative group transition-all ${
                              isBreak 
                                ? 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300' 
                                : 'bg-indigo-50/70 dark:bg-indigo-950/70 border-indigo-100 dark:border-indigo-900 text-indigo-900 dark:text-indigo-200 shadow-sm hover:shadow'
                            }`}>
                              <p className="font-bold text-sm truncate">{slot.subject}</p>
                              {slot.teacherName && slot.teacherName !== '-' && (
                                <p className="text-xs text-indigo-700 dark:text-indigo-300 font-medium mt-1 truncate flex items-center gap-1">
                                  👤 {slot.teacherName}
                                </p>
                              )}
                              {slot.room && (
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                                  📍 {slot.room}
                                </p>
                              )}

                              {isPrincipal && (
                                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition flex items-center gap-1 bg-white/90 dark:bg-slate-900/90 p-1 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
                                  <button 
                                    onClick={() => {
                                      setEditingSlot(slot);
                                      setShowSlotModal(true);
                                    }}
                                    className="p-1 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950 rounded"
                                    title="Edit Slot"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>
                                  <button 
                                    onClick={() => handleDeleteSlot(slot.id)}
                                    className="p-1 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950 rounded"
                                    title="Remove Slot"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div 
                              onClick={() => {
                                if (!isPrincipal) return;
                                setEditingSlot({ day, time: timeSlot, subject: '', teacherName: '', room: '' });
                                setShowSlotModal(true);
                              }}
                              className={`h-16 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center text-xs text-slate-400 ${
                                isPrincipal ? 'hover:border-indigo-400 hover:bg-indigo-50/30 cursor-pointer transition' : ''
                              }`}
                            >
                              {isPrincipal ? (
                                <span className="flex items-center gap-1 font-medium text-indigo-600 dark:text-indigo-400">
                                  <Plus className="w-3.5 h-3.5" /> Assign
                                </span>
                              ) : (
                                <span>Free Period</span>
                              )}
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

