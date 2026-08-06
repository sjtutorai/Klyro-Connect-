import React, { useState, useEffect } from 'react';
import { PageHeader } from '../../components/ui';
import { BookOpen, Plus, Search, Loader2 } from 'lucide-react';
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, updateDoc, doc } from 'firebase/firestore';
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
  studentId: string;
  studentName: string;
  photoUrl?: string; // we'll just mock a photoUrl string or just use text for simplicity if photo upload isn't setup
  status: string; // 'Submitted', 'Graded'
  grade?: string;
  feedback?: string;
};

export default function TeacherHomework() {
  const { user } = useAuth();
  const [homeworks, setHomeworks] = useState<Homework[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({ title: '', description: '', dueDate: '' });
  const [activeHomework, setActiveHomework] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    
    const q = query(
      collection(db, 'homeworks'),
      where('teacherId', '==', user.id),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: Homework[] = [];
      snapshot.forEach(doc => list.push({ id: doc.id, ...doc.data() } as Homework));
      setHomeworks(list);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!activeHomework) return;
    const q = query(collection(db, 'submissions'), where('homeworkId', '==', activeHomework));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: Submission[] = [];
      snapshot.forEach(doc => list.push({ id: doc.id, ...doc.data() } as Submission));
      setSubmissions(list);
    });
    return () => unsubscribe();
  }, [activeHomework]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'homeworks'), {
        ...formData,
        teacherId: user.id,
        institutionId: user.institutionId || '',
        createdAt: serverTimestamp()
      });
      setShowForm(false);
      setFormData({ title: '', description: '', dueDate: '' });
    } catch (error) {
      console.error(error);
      alert('Failed to add homework.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGrade = async (subId: string, grade: string, feedback: string) => {
    try {
      await updateDoc(doc(db, 'submissions', subId), {
        status: 'Graded',
        grade,
        feedback
      });
    } catch (error) {
      console.error(error);
      alert('Failed to grade submission.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader 
        title="Homework Assignments" 
        description="Create homework and track student progress."
        action={
          <button 
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-indigo-700 transition"
          >
            {showForm ? 'Cancel' : <><Plus className="w-5 h-5" /> Assign Homework</>}
          </button>
        }
      />

      {showForm && (
        <div className="bg-white rounded-2xl p-6 md:p-8 border border-slate-100 shadow-sm mb-8 animate-in slide-in-from-bottom-4 fade-in duration-300">
          <h2 className="text-xl font-bold text-slate-900 mb-6">Assign New Homework</h2>
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">Title</label>
                <input required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} type="text" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-600 outline-none" placeholder="e.g. Chapter 5 Math Exercises" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
                <textarea required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} rows={3} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-600 outline-none resize-none" placeholder="Details..."></textarea>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Due Date</label>
                <input required value={formData.dueDate} onChange={e => setFormData({...formData, dueDate: e.target.value})} type="date" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-600 outline-none" />
              </div>
            </div>
            <div className="flex justify-end gap-4 pt-4 border-t border-slate-100">
              <button type="submit" disabled={isSubmitting} className="px-6 py-2.5 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition flex items-center gap-2">
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : null} Assign
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <h3 className="font-bold text-slate-900 text-lg">Assignments</h3>
          {isLoading ? (
            <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 text-indigo-600 animate-spin" /></div>
          ) : homeworks.length === 0 ? (
            <div className="p-6 text-center text-slate-500 bg-white rounded-xl border border-slate-100">No homework assigned yet.</div>
          ) : homeworks.map(hw => (
            <div 
              key={hw.id} 
              onClick={() => setActiveHomework(hw.id)}
              className={`p-5 rounded-2xl border cursor-pointer transition-all ${activeHomework === hw.id ? 'border-indigo-500 bg-indigo-50' : 'border-slate-100 bg-white hover:border-indigo-300'}`}
            >
              <h4 className="font-bold text-slate-900 mb-1">{hw.title}</h4>
              <p className="text-sm text-slate-500 mb-3">{hw.description.substring(0, 40)}...</p>
              <div className="text-xs font-medium text-indigo-600 bg-indigo-100/50 inline-block px-2.5 py-1 rounded-md">
                Due: {new Date(hw.dueDate).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>

        <div className="lg:col-span-2">
          <h3 className="font-bold text-slate-900 text-lg mb-4">Submissions</h3>
          {activeHomework ? (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              {submissions.length === 0 ? (
                <div className="p-12 text-center text-slate-500">No submissions yet for this assignment.</div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {submissions.map(sub => (
                    <div key={sub.id} className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h4 className="font-bold text-slate-900">{sub.studentName}</h4>
                          <span className={`inline-block px-2.5 py-1 mt-1 text-xs font-bold rounded-full ${sub.status === 'Graded' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                            {sub.status}
                          </span>
                        </div>
                        {sub.photoUrl && (
                          <a href={sub.photoUrl} target="_blank" rel="noreferrer" className="text-sm font-medium text-indigo-600 hover:underline">View Attached Photo</a>
                        )}
                      </div>
                      
                      {sub.status === 'Submitted' ? (
                        <form onSubmit={(e) => {
                          e.preventDefault();
                          const target = e.target as typeof e.target & { grade: { value: string }, feedback: { value: string } };
                          handleGrade(sub.id, target.grade.value, target.feedback.value);
                        }} className="bg-slate-50 p-4 rounded-xl space-y-3">
                          <div>
                            <input name="grade" placeholder="Grade (e.g. A, B, 95/100)" required className="w-full px-3 py-2 rounded-lg border border-slate-200 outline-none text-sm" />
                          </div>
                          <div>
                            <textarea name="feedback" placeholder="Feedback..." rows={2} required className="w-full px-3 py-2 rounded-lg border border-slate-200 outline-none text-sm resize-none"></textarea>
                          </div>
                          <button type="submit" className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700">Submit Grade</button>
                        </form>
                      ) : (
                        <div className="bg-emerald-50/50 p-4 rounded-xl text-sm">
                          <p><strong className="text-emerald-800">Grade:</strong> {sub.grade}</p>
                          <p className="mt-1"><strong className="text-emerald-800">Feedback:</strong> {sub.feedback}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-slate-50 rounded-2xl border border-slate-100 p-12 text-center text-slate-500">
              Select an assignment to view submissions.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
