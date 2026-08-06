import React, { useState, useEffect } from 'react';
import { PageHeader } from '../../components/ui';
import { Calendar as CalendarIcon, Clock, Plus, Trash2, Edit3, UserCheck, BookOpen, Loader2, RefreshCw, Check, AlertCircle } from 'lucide-react';
import { collection, query, where, onSnapshot, setDoc, deleteDoc, doc, serverTimestamp, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
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
  const [teachersList, setTeachersList] = useState<{ id: string; name: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSeeding, setIsSeeding] = useState(false);
  
  const [showSlotModal, setShowSlotModal] = useState(false);
  const [editingSlot, setEditingSlot] = useState<Partial<TimetableSlot>>({
    day: 'Monday',
    time: '09:00 AM',
    subject: '',
    teacherName: '',
    room: ''
  });

  const institutionId = user?.institutionId || (isPrincipal ? user?.id : null);

  // Fetch teachers for Principal selection dropdown
  useEffect(() => {
    if (!institutionId) return;
    const q = query(
      collection(db, 'users'), 
      where('role', '==', 'TEACHER'),
      where('institutionId', '==', institutionId)
    );
    const unsub = onSnapshot(q, snap => {
      const list: { id: string; name: string }[] = [];
      snap.forEach(d => list.push({ id: d.id, name: d.data().name }));
      setTeachersList(list);
    });
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
      console.error("Error fetching timetable:", err);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [institutionId]);

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
      console.error("Error saving slot:", err);
      alert('Failed to save timetable period.');
    }
  };

  const handleDeleteSlot = async (slotId: string) => {
    try {
      await deleteDoc(doc(db, 'timetables', slotId));
    } catch (err) {
      console.error("Error deleting slot:", err);
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
      console.error(err);
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

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader 
        title={isPrincipal ? "Principal Timetable Assignment" : isTeacher ? "Teaching Schedule & Timetable" : "My Class Timetable"} 
        description={isPrincipal ? "Assign and manage timetable schedules for classes, sections, and teachers." : `Weekly schedule for ${selectedClass}`}
        action={
          isPrincipal ? (
            <div className="flex items-center gap-3">
              <button
                onClick={handleSeedSample}
                disabled={isSeeding}
                className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl text-sm transition"
              >
                {isSeeding ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                Auto-fill Sample Schedule
              </button>
              <button 
                onClick={() => {
                  setEditingSlot({ day: 'Monday', time: '09:00 AM', subject: '', teacherName: '', room: '' });
                  setShowSlotModal(true);
                }}
                className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl text-sm transition shadow-sm"
              >
                <Plus className="w-4 h-4" /> Assign Schedule Slot
              </button>
            </div>
          ) : null
        }
      />

      {/* Class Selector Bar */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-100 shadow-sm mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <BookOpen className="w-5 h-5 text-indigo-600" />
          <span className="text-sm font-bold text-slate-700">Select Class & Section:</span>
          <select 
            value={selectedClass} 
            onChange={e => setSelectedClass(e.target.value)}
            className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 text-sm outline-none focus:ring-2 focus:ring-indigo-600"
          >
            <option value="Class 10-A">Class 10-A</option>
            <option value="Class 10-B">Class 10-B</option>
            <option value="Class 9-A">Class 9-A</option>
            <option value="Class 9-B">Class 9-B</option>
            <option value="Grade 11 Science">Grade 11 Science</option>
            <option value="Grade 12 Math">Grade 12 Math</option>
          </select>
        </div>

        {isPrincipal && (
          <div className="text-xs text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100 font-medium flex items-center gap-1.5">
            <UserCheck className="w-4 h-4" /> Principal Mode: Click any cell on the schedule grid to assign or edit period
          </div>
        )}
      </div>

      {/* Slot Modal */}
      {showSlotModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-xl animate-in zoom-in-95 duration-200">
            <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-indigo-600" />
              Assign Timetable Slot ({selectedClass})
            </h2>
            <form onSubmit={handleSaveSlot} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Day</label>
                  <select 
                    value={editingSlot.day} 
                    onChange={e => setEditingSlot({...editingSlot, day: e.target.value})}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none"
                  >
                    {DEFAULT_DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Time Slot</label>
                  <select 
                    value={editingSlot.time} 
                    onChange={e => setEditingSlot({...editingSlot, time: e.target.value})}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none"
                  >
                    {DEFAULT_TIMES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Subject Name</label>
                <input 
                  type="text" 
                  required
                  value={editingSlot.subject || ''}
                  onChange={e => setEditingSlot({...editingSlot, subject: e.target.value})}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-600 outline-none text-sm"
                  placeholder="e.g. Mathematics, Physics, Chemistry"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Assigned Teacher</label>
                {teachersList.length > 0 ? (
                  <select 
                    value={editingSlot.teacherName || ''}
                    onChange={e => setEditingSlot({...editingSlot, teacherName: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-600 outline-none text-sm bg-white"
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
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-600 outline-none text-sm"
                    placeholder="e.g. John Doe"
                  />
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Room / Lab (Optional)</label>
                <input 
                  type="text" 
                  value={editingSlot.room || ''}
                  onChange={e => setEditingSlot({...editingSlot, room: e.target.value})}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-600 outline-none text-sm"
                  placeholder="e.g. Room 101, Science Lab"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setShowSlotModal(false)}
                  className="px-5 py-2 border border-slate-200 text-slate-700 rounded-xl font-medium text-sm hover:bg-slate-50"
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
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CalendarIcon className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-slate-900">Weekly Schedule - {selectedClass}</h3>
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
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-4 py-4 text-xs font-bold text-slate-500 uppercase w-28">Time Slot</th>
                  {DEFAULT_DAYS.map(day => (
                    <th key={day} className="px-4 py-4 text-xs font-bold text-slate-500 uppercase min-w-[140px]">{day}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {DEFAULT_TIMES.map((timeSlot) => (
                  <tr key={timeSlot} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-4 whitespace-nowrap bg-slate-50/30">
                      <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-slate-600">
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
                                ? 'bg-slate-100 border-slate-200 text-slate-600' 
                                : 'bg-indigo-50/70 border-indigo-100 text-indigo-900 shadow-sm hover:shadow'
                            }`}>
                              <p className="font-bold text-sm truncate">{slot.subject}</p>
                              {slot.teacherName && slot.teacherName !== '-' && (
                                <p className="text-xs text-indigo-700 font-medium mt-1 truncate flex items-center gap-1">
                                  👤 {slot.teacherName}
                                </p>
                              )}
                              {slot.room && (
                                <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                                  📍 {slot.room}
                                </p>
                              )}

                              {isPrincipal && (
                                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition flex items-center gap-1 bg-white/90 p-1 rounded-lg shadow-sm border border-slate-200">
                                  <button 
                                    onClick={() => {
                                      setEditingSlot(slot);
                                      setShowSlotModal(true);
                                    }}
                                    className="p-1 text-indigo-600 hover:bg-indigo-50 rounded"
                                    title="Edit Slot"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>
                                  <button 
                                    onClick={() => handleDeleteSlot(slot.id)}
                                    className="p-1 text-rose-600 hover:bg-rose-50 rounded"
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
                              className={`h-16 rounded-xl border border-dashed border-slate-200 flex flex-col items-center justify-center text-xs text-slate-400 ${
                                isPrincipal ? 'hover:border-indigo-400 hover:bg-indigo-50/30 cursor-pointer transition' : ''
                              }`}
                            >
                              {isPrincipal ? (
                                <span className="flex items-center gap-1 font-medium text-indigo-600">
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

