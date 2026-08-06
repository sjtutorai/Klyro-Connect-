import React, { useState, useEffect } from 'react';
import { PageHeader, ConfirmModal, Card, Button, Badge } from '../../components/ui';
import { BookOpen, Plus, Search, Loader2, Image as ImageIcon, CheckCircle2, Eye, X, Trash2, Calendar, User, FileText, Award, Send } from 'lucide-react';
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

      list.sort((a, b) => {
        const tA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : (a.createdAt?.seconds ? a.createdAt.seconds * 1000 : 0);
        const tB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : (b.createdAt?.seconds ? b.createdAt.seconds * 1000 : 0);
        return tB - tA;
      });

      setHomeworks(list);

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
    <div className="max-w-7xl mx-auto space-y-8">
      <PageHeader 
        title="Faculty Homework Hub" 
        description="Assign homework assignments, review photo submissions uploaded by students, and evaluate grades."
        badge="Academic Management"
        breadcrumbs={[{ label: 'Faculty' }, { label: 'Homework Assignments' }]}
        action={
          <Button 
            onClick={() => setShowForm(!showForm)}
            icon={<Plus className="w-4 h-4" />}
          >
            {showForm ? 'Cancel Form' : 'Assign Homework'}
          </Button>
        }
      />

      {/* Image Zoom Modal */}
      {zoomedImage && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4" onClick={() => setZoomedImage(null)}>
          <div className="relative max-w-4xl max-h-[90vh] bg-white dark:bg-slate-900 rounded-3xl overflow-hidden p-2 shadow-2xl border border-slate-200 dark:border-slate-800" onClick={e => e.stopPropagation()}>
            <button onClick={() => setZoomedImage(null)} className="absolute top-4 right-4 p-2 bg-slate-950/70 hover:bg-slate-950 text-white rounded-full transition z-10">
              <X className="w-5 h-5" />
            </button>
            <img src={zoomedImage} alt="Homework Submission Full View" className="w-full h-full max-h-[85vh] object-contain rounded-2xl" />
          </div>
        </div>
      )}

      {showForm && (
        <Card className="animate-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-3 pb-4 mb-6 border-b border-slate-100 dark:border-slate-800">
            <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">New Homework Assignment</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Specify instructions, due date, and questions for students</p>
            </div>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="grid md:grid-cols-2 gap-5">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">Assignment Title</label>
                <input required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} type="text" className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:border-indigo-500 text-sm outline-none transition" placeholder="e.g. Mathematics Chapter 4 Written Homework" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">Instructions & Questions</label>
                <textarea required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} rows={3} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:border-indigo-500 text-sm outline-none transition resize-none" placeholder="Provide instructions for students to write down answers on paper and upload a clear photo..."></textarea>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">Submission Due Date</label>
                <input required value={formData.dueDate} onChange={e => setFormData({...formData, dueDate: e.target.value})} type="date" className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:border-indigo-500 text-sm outline-none transition" />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
              <Button type="submit" isLoading={isSubmitting}>
                Create Assignment
              </Button>
            </div>
          </form>
        </Card>
      )}

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Side: Homework List */}
        <div className="lg:col-span-1 space-y-4">
          <div className="flex items-center justify-between pb-2">
            <h3 className="font-bold text-slate-900 dark:text-white text-base">Assignments ({homeworks.length})</h3>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center p-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800">
              <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
            </div>
          ) : homeworks.length === 0 ? (
            <Card className="p-8 text-center text-slate-400">
              <BookOpen className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
              No homework assigned yet. Click "Assign Homework" above.
            </Card>
          ) : homeworks.map(hw => {
            const count = allSubmissionsCount[hw.id] || 0;
            const isActive = activeHomework === hw.id;
            return (
              <Card 
                key={hw.id} 
                onClick={() => setActiveHomework(hw.id)}
                className={`cursor-pointer transition-all relative group border ${
                  isActive 
                    ? 'border-indigo-600 dark:border-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/30 ring-1 ring-indigo-500/20' 
                    : 'hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors pr-6 text-sm">{hw.title}</h4>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteHwId(hw.id);
                    }}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition"
                    title="Delete Assignment"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 line-clamp-2">{hw.description}</p>
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-indigo-500" /> Due: {hw.dueDate ? new Date(hw.dueDate).toLocaleDateString() : 'N/A'}
                  </span>
                  <Badge variant={count > 0 ? 'primary' : 'secondary'}>
                    {count} {count === 1 ? 'Sub' : 'Subs'}
                  </Badge>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Right Side: Submissions Review Panel */}
        <div className="lg:col-span-2">
          {activeHwObject ? (
            <Card className="space-y-6">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-5">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-2">
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">{activeHwObject.title}</h2>
                  <Badge variant="indigo">
                    Due Date: {activeHwObject.dueDate ? new Date(activeHwObject.dueDate).toLocaleDateString() : 'N/A'}
                  </Badge>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{activeHwObject.description}</p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-5">
                  <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
                    Student Submissions ({submissions.length})
                  </h3>
                </div>

                {submissions.length === 0 ? (
                  <div className="p-12 text-center text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                    <ImageIcon className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
                    <p className="font-bold text-slate-700 dark:text-slate-300 text-sm">No submissions received yet.</p>
                    <p className="text-xs text-slate-400 mt-1">Photos submitted by students will appear right here for grading.</p>
                  </div>
                ) : (
                  <div className="space-y-5">
                    {submissions.map(sub => (
                      <div key={sub.id} className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200/60 dark:border-slate-800">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400 font-bold flex items-center justify-center text-sm shrink-0">
                              {sub.studentName ? sub.studentName.charAt(0) : 'S'}
                            </div>
                            <div>
                              <h4 className="font-bold text-slate-900 dark:text-white text-sm">{sub.studentName}</h4>
                              <p className="text-[11px] text-slate-400">Student Submission</p>
                            </div>
                          </div>

                          <Badge variant={sub.status === 'Graded' ? 'emerald' : 'amber'}>
                            {sub.status === 'Graded' ? 'Graded' : 'Pending Review'}
                          </Badge>
                        </div>
                        
                        {/* Submitted Photo */}
                        {sub.photoUrl ? (
                          <div className="space-y-2">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Photo Attachment:</p>
                            <div 
                              onClick={() => setZoomedImage(sub.photoUrl || null)}
                              className="relative group rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 cursor-pointer max-w-md hover:border-indigo-500 transition"
                            >
                              <img 
                                src={sub.photoUrl} 
                                alt="Student Homework" 
                                className="w-full max-h-64 object-contain rounded-xl"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=500&auto=format&fit=crop&q=60';
                                }}
                              />
                              <div className="absolute inset-0 bg-slate-950/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2 text-white font-bold text-xs">
                                <Eye className="w-4 h-4" /> Click to Zoom / Expand Image
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="text-xs text-slate-400 italic">No photo attached.</div>
                        )}

                        {/* Grading Form */}
                        {sub.status === 'Submitted' ? (
                          <form onSubmit={(e) => {
                            e.preventDefault();
                            const target = e.target as typeof e.target & { grade: { value: string }, feedback: { value: string } };
                            handleGrade(sub.id, target.grade.value, target.feedback.value);
                          }} className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                            <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Evaluate Submission</h5>
                            <div className="grid sm:grid-cols-2 gap-3">
                              <div>
                                <input name="grade" placeholder="Grade (e.g. A+, 92/100)" required className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white outline-none text-xs focus:border-indigo-500" />
                              </div>
                              <div className="sm:col-span-2">
                                <textarea name="feedback" placeholder="Constructive feedback for student..." rows={2} required className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white outline-none text-xs resize-none focus:border-indigo-500"></textarea>
                              </div>
                            </div>
                            <div className="flex justify-end">
                              <Button type="submit" size="sm" icon={<Send className="w-3.5 h-3.5" />}>
                                Submit Grade & Feedback
                              </Button>
                            </div>
                          </form>
                        ) : (
                          <div className="bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/60 p-4 rounded-xl text-xs space-y-1">
                            <div className="flex items-center gap-2 text-emerald-900 dark:text-emerald-300 font-bold">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                              <span>Grade Assigned: {sub.grade}</span>
                            </div>
                            <p className="text-emerald-800 dark:text-emerald-300 text-xs"><strong>Teacher Feedback:</strong> {sub.feedback}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          ) : (
            <Card className="p-12 text-center text-slate-400 flex flex-col items-center justify-center min-h-[400px]">
              <BookOpen className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-3" />
              <p className="font-bold text-slate-700 dark:text-slate-300 text-sm">Select an assignment to view submissions</p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm">Select a homework assignment from the roster on the left to grade submitted photos.</p>
            </Card>
          )}
        </div>
      </div>

      <ConfirmModal
        isOpen={!!deleteHwId}
        title="Delete Homework Assignment"
        message="Are you sure you want to delete this assignment? All student submissions for this assignment will also be removed."
        onConfirm={confirmDeleteHomework}
        onCancel={() => setDeleteHwId(null)}
      />
    </div>
  );
}
