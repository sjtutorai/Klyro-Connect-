import React, { useState, useEffect } from 'react';
import { PageHeader, ConfirmModal } from '../../components/ui';
import { BookOpen, Plus, Search, Loader2, Image as ImageIcon, CheckCircle2, Eye, X, Trash2, Calendar, User } from 'lucide-react';
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';

type Homework = {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  createdAt: any;
  teacherId: string;
  institutionId: string;
};

type Submission = {
  id: string;
  homeworkId: string;
  homeworkTitle?: string;
  studentId: string;
  studentName: string;
  photoUrl?: string;
  status: string; // 'Submitted', 'Graded'
  grade?: string;
  feedback?: string;
  createdAt?: any;
};

export default function TeacherHomework() {
  const { user } = useAuth();
  const [homeworks, setHomeworks] = useState<Homework[]>([]);
  const [allSubmissions, setAllSubmissions] = useState<Submission[]>([]);
  const [allSubmissionsCount, setAllSubmissionsCount] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({ title: '', description: '', dueDate: '' });
  const [activeHomework, setActiveHomework] = useState<string | null>(null);

  // Load homeworks for this teacher/institution
  useEffect(() => {
    if (!user) return;
    
    const q = query(collection(db, 'homeworks'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: Homework[] = [];
      snapshot.forEach(doc => {
        const data = doc.data() as Homework;
        const item = { id: doc.id, ...data };
        // Check role/institution matching
        if (user.role === 'SUPER_ADMIN') {
          list.push(item);
        } else if (user.role === 'TEACHER') {
          if (!data.teacherId || data.teacherId === user.id || (user.institutionId && data.institutionId === user.institutionId)) {
            list.push(item);
          }
        } else if (user.institutionId) {
          if (data.institutionId === user.institutionId || data.teacherId === user.id) {
            list.push(item);
          }
        } else {
          list.push(item);
        }
      });

      // Sort client-side
      list.sort((a, b) => {
        const tA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : (a.createdAt?.seconds ? a.createdAt.seconds * 1000 : 0);
        const tB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : (b.createdAt?.seconds ? b.createdAt.seconds * 1000 : 0);
        return tB - tA;
      });

      setHomeworks(list);

      // Auto-set active homework if not set or invalid
      if (list.length > 0) {
        setActiveHomework(prev => {
          if (!prev || !list.some(h => h.id === prev)) {
            return list[0].id;
          }
          return prev;
        });
      } else {
        setActiveHomework(null);
      }

      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching homeworks:", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // Load all submissions across homeworks
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'submissions'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: Submission[] = [];
      const counts: Record<string, number> = {};
      
      snapshot.forEach(doc => {
        const data = doc.data() as Submission;
        const item = { id: doc.id, ...data };
        list.push(item);

        if (data.homeworkId) {
          counts[data.homeworkId] = (counts[data.homeworkId] || 0) + 1;
        }
        if (data.homeworkTitle) {
          const matchedHw = homeworks.find(h => h.title.trim().toLowerCase() === data.homeworkTitle?.trim().toLowerCase());
          if (matchedHw && matchedHw.id !== data.homeworkId) {
            counts[matchedHw.id] = (counts[matchedHw.id] || 0) + 1;
          }
        }
      });

      list.sort((a, b) => {
        const tA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : (a.createdAt?.seconds ? a.createdAt.seconds * 1000 : 0);
        const tB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : (b.createdAt?.seconds ? b.createdAt.seconds * 1000 : 0);
        return tB - tA;
      });

      setAllSubmissions(list);
      setAllSubmissionsCount(counts);
    }, (error) => {
      console.error("Error fetching submissions:", error);
    });

    return () => unsubscribe();
  }, [user, homeworks]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSubmitting(true);
    try {
      const docRef = await addDoc(collection(db, 'homeworks'), {
        ...formData,
        teacherId: user.id,
        teacherName: user.name,
        institutionId: user.institutionId || '',
        createdAt: serverTimestamp()
      });
      setShowForm(false);
      setFormData({ title: '', description: '', dueDate: '' });
      setActiveHomework(docRef.id);
      alert('Homework assignment created and sent to students!');
    } catch (error) {
      console.error(error);
      alert('Failed to add homework.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const [deleteHwId, setDeleteHwId] = useState<string | null>(null);

  const confirmDeleteHomework = async () => {
    if (!deleteHwId) return;
    const targetId = deleteHwId;
    setHomeworks(prev => prev.filter(h => h.id !== targetId));
    if (activeHomework === targetId) {
      const remaining = homeworks.filter(h => h.id !== targetId);
      setActiveHomework(remaining[0]?.id || null);
    }
    setDeleteHwId(null);
    try {
      await deleteDoc(doc(db, 'homeworks', targetId));
    } catch (err) {
      console.error(err);
      alert('Failed to delete homework assignment.');
    }
  };

  const handleGrade = async (subId: string, grade: string, feedback: string) => {
    try {
      await updateDoc(doc(db, 'submissions', subId), {
        status: 'Graded',
        grade,
        feedback,
        gradedAt: serverTimestamp()
      });
      alert('Submission graded successfully!');
    } catch (error) {
      console.error(error);
      alert('Failed to grade submission.');
    }
  };

  const activeHwObject = homeworks.find(h => h.id === activeHomework);

  const submissions = allSubmissions.filter(s => {
    if (!activeHomework) return false;
    if (s.homeworkId === activeHomework) return true;
    if (activeHwObject) {
      if (s.homeworkId === activeHwObject.id) return true;
      if (s.homeworkTitle && activeHwObject.title && s.homeworkTitle.trim().toLowerCase() === activeHwObject.title.trim().toLowerCase()) return true;
      if (s.homeworkId && activeHwObject.title && s.homeworkId.trim().toLowerCase() === activeHwObject.title.trim().toLowerCase()) return true;
    }
    return false;
  });

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader 
        title="Teacher Homework Center" 
        description="Assign written homework, review photos sent by students, and grade submissions."
        action={
          <button 
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-indigo-700 transition shadow-sm"
          >
            {showForm ? 'Cancel' : <><Plus className="w-5 h-5" /> Assign Homework</>}
          </button>
        }
      />

      {/* Image Zoom Modal */}
      {zoomedImage && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setZoomedImage(null)}>
          <div className="relative max-w-4xl max-h-[90vh] bg-white rounded-2xl overflow-hidden p-2 shadow-2xl" onClick={e => e.stopPropagation()}>
            <button onClick={() => setZoomedImage(null)} className="absolute top-4 right-4 p-2 bg-slate-900/60 hover:bg-slate-900 text-white rounded-full transition z-10">
              <X className="w-5 h-5" />
            </button>
            <img src={zoomedImage} alt="Homework Submission Full View" className="w-full h-full max-h-[85vh] object-contain rounded-xl" />
          </div>
        </div>
      )}

      {showForm && (
        <div className="bg-white rounded-2xl p-6 md:p-8 border border-slate-100 shadow-sm mb-8 animate-in slide-in-from-bottom-4 fade-in duration-300">
          <h2 className="text-xl font-bold text-slate-900 mb-6">Assign New Homework to Students</h2>
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">Assignment Title</label>
                <input required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} type="text" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-600 outline-none" placeholder="e.g. Mathematics Chapter 4 Homework" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">Instructions & Questions</label>
                <textarea required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} rows={3} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-600 outline-none resize-none" placeholder="State clear guidelines for students to write down and submit photo of work..."></textarea>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Submission Due Date</label>
                <input required value={formData.dueDate} onChange={e => setFormData({...formData, dueDate: e.target.value})} type="date" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-600 outline-none bg-white" />
              </div>
            </div>
            <div className="flex justify-end gap-4 pt-4 border-t border-slate-100">
              <button type="button" onClick={() => setShowForm(false)} className="px-6 py-2.5 border border-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-50 transition">
                Cancel
              </button>
              <button type="submit" disabled={isSubmitting} className="px-6 py-2.5 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition flex items-center gap-2">
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : null} Create & Send Homework
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Side: Homework Assignments List */}
        <div className="lg:col-span-1 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-lg">Assignments List</h3>
            <span className="text-xs font-semibold bg-slate-100 px-2.5 py-1 rounded-full text-slate-600">{homeworks.length} Total</span>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center p-8 bg-white rounded-2xl border border-slate-100"><Loader2 className="w-6 h-6 text-indigo-600 animate-spin" /></div>
          ) : homeworks.length === 0 ? (
            <div className="p-8 text-center text-slate-500 bg-white rounded-2xl border border-slate-100">
              <BookOpen className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              No homework assigned yet. Click "Assign Homework" above.
            </div>
          ) : homeworks.map(hw => {
            const count = allSubmissionsCount[hw.id] || 0;
            const isActive = activeHomework === hw.id;
            return (
              <div 
                key={hw.id} 
                onClick={() => setActiveHomework(hw.id)}
                className={`p-5 rounded-2xl border cursor-pointer transition-all relative group ${isActive ? 'border-indigo-600 bg-indigo-50/70 shadow-sm ring-1 ring-indigo-600/30' : 'border-slate-100 bg-white hover:border-indigo-300 hover:shadow-sm'}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors pr-6">{hw.title}</h4>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteHwId(hw.id);
                    }}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                    title="Delete Assignment"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs text-slate-500 mb-3 line-clamp-2">{hw.description}</p>
                <div className="flex items-center justify-between pt-2 border-t border-slate-100/60">
                  <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-indigo-500" /> Due: {hw.dueDate ? new Date(hw.dueDate).toLocaleDateString() : 'No date'}
                  </span>
                  <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${count > 0 ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500'}`}>
                    {count} {count === 1 ? 'Submission' : 'Submissions'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Side: Student Submissions Panel */}
        <div className="lg:col-span-2">
          {activeHwObject ? (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden p-6 md:p-8">
              <div className="border-b border-slate-100 pb-6 mb-6">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-2">
                  <h2 className="text-xl font-bold text-slate-900">{activeHwObject.title}</h2>
                  <span className="text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 px-3 py-1 rounded-full">
                    Due Date: {activeHwObject.dueDate ? new Date(activeHwObject.dueDate).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed">{activeHwObject.description}</p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                    Student Submissions ({submissions.length})
                  </h3>
                </div>

                {submissions.length === 0 ? (
                  <div className="p-12 text-center text-slate-500 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    <ImageIcon className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                    <p className="font-semibold text-slate-700">No student submissions received yet.</p>
                    <p className="text-xs text-slate-400 mt-1">When students submit photos of their written homework, they will appear right here.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {submissions.map(sub => (
                      <div key={sub.id} className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-5 md:p-6 space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200/60">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-sm">
                              {sub.studentName ? sub.studentName.charAt(0) : 'S'}
                            </div>
                            <div>
                              <h4 className="font-bold text-slate-900 text-base">{sub.studentName}</h4>
                              <p className="text-xs text-slate-500">Submitted Work</p>
                            </div>
                          </div>

                          <span className={`px-3 py-1 text-xs font-bold rounded-full border ${sub.status === 'Graded' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                            {sub.status === 'Graded' ? '✓ Graded' : '● Pending Review'}
                          </span>
                        </div>
                        
                        {/* Submitted Photo View */}
                        {sub.photoUrl ? (
                          <div>
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Attached Photo of Work:</p>
                            <div 
                              onClick={() => setZoomedImage(sub.photoUrl || null)}
                              className="relative group rounded-xl overflow-hidden border border-slate-200 bg-white p-2 cursor-pointer max-w-lg hover:border-indigo-400 transition"
                            >
                              <img 
                                src={sub.photoUrl} 
                                alt="Student Homework" 
                                className="w-full max-h-72 object-contain rounded-lg"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=500&auto=format&fit=crop&q=60';
                                }}
                              />
                              <div className="absolute inset-0 bg-slate-900/20 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2 text-white font-semibold text-xs">
                                <Eye className="w-4 h-4" /> Click to Zoom / Expand Image
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="text-xs text-slate-400 italic">No photo attached.</div>
                        )}

                        {/* Grading Form or Display */}
                        {sub.status === 'Submitted' ? (
                          <form onSubmit={(e) => {
                            e.preventDefault();
                            const target = e.target as typeof e.target & { grade: { value: string }, feedback: { value: string } };
                            handleGrade(sub.id, target.grade.value, target.feedback.value);
                          }} className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
                            <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Grade & Provide Feedback</h5>
                            <div className="grid sm:grid-cols-2 gap-3">
                              <div>
                                <input name="grade" placeholder="Grade (e.g. A+, 95/100, Outstanding)" required className="w-full px-3.5 py-2 rounded-lg border border-slate-200 outline-none text-sm focus:ring-2 focus:ring-indigo-600" />
                              </div>
                              <div className="sm:col-span-2">
                                <textarea name="feedback" placeholder="Teacher feedback for student..." rows={2} required className="w-full px-3.5 py-2 rounded-lg border border-slate-200 outline-none text-sm resize-none focus:ring-2 focus:ring-indigo-600"></textarea>
                              </div>
                            </div>
                            <div className="flex justify-end">
                              <button type="submit" className="px-5 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition">
                                Submit Grade & Feedback
                              </button>
                            </div>
                          </form>
                        ) : (
                          <div className="bg-emerald-50/80 border border-emerald-200/60 p-4 rounded-xl text-sm">
                            <div className="flex items-center gap-2 text-emerald-900 font-bold mb-1">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                              <span>Grade: {sub.grade}</span>
                            </div>
                            <p className="text-emerald-800 text-xs mt-1"><strong>Feedback:</strong> {sub.feedback}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 rounded-2xl border border-slate-100 p-12 text-center text-slate-500 h-full flex flex-col items-center justify-center min-h-[400px]">
              <BookOpen className="w-12 h-12 text-slate-300 mb-3" />
              <p className="font-semibold text-slate-700">Select an assignment to view submissions</p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm">Choose a homework assignment from the left list to review and grade student submissions.</p>
            </div>
          )}
        </div>
      </div>

      <ConfirmModal
        isOpen={!!deleteHwId}
        title="Delete Homework Assignment"
        message="Are you sure you want to delete this homework assignment? All associated student submissions will be lost."
        onConfirm={confirmDeleteHomework}
        onCancel={() => setDeleteHwId(null)}
      />
    </div>
  );
}
