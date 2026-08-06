import React, { useState, useEffect } from 'react';
import { PageHeader } from '../../components/ui';
import { BookOpen, Upload, Loader2, CheckCircle2 } from 'lucide-react';
import { collection, query, where, orderBy, onSnapshot, setDoc, doc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';

type Homework = {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  teacherId: string;
};

type Submission = {
  id: string;
  homeworkId: string;
  photoUrl?: string;
  status: string;
  grade?: string;
  feedback?: string;
};

export default function StudentHomework() {
  const { user } = useAuth();
  const [homeworks, setHomeworks] = useState<Homework[]>([]);
  const [submissions, setSubmissions] = useState<Record<string, Submission>>({});
  const [isLoading, setIsLoading] = useState(true);
  
  const [activeHomework, setActiveHomework] = useState<Homework | null>(null);
  const [photoUrl, setPhotoUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!user?.institutionId) return;

    // In a real app we'd map students to specific classes. For now, fetch all institution homework.
    const q = query(
      collection(db, 'homeworks'),
      where('institutionId', '==', user.institutionId),
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
    if (!user) return;
    const q = query(collection(db, 'submissions'), where('studentId', '==', user.id));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const subs: Record<string, Submission> = {};
      snapshot.forEach(doc => {
        const data = doc.data() as Submission;
        subs[data.homeworkId] = { id: doc.id, ...data };
      });
      setSubmissions(subs);
    });
    return () => unsubscribe();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !activeHomework) return;
    setIsSubmitting(true);
    try {
      // Submissions are uniquely identified by homeworkId_studentId
      const subId = `${activeHomework.id}_${user.id}`;
      await setDoc(doc(db, 'submissions', subId), {
        homeworkId: activeHomework.id,
        studentId: user.id,
        studentName: user.name,
        photoUrl: photoUrl,
        status: 'Submitted',
        createdAt: serverTimestamp()
      });
      setPhotoUrl('');
      alert('Homework submitted successfully!');
    } catch (error) {
      console.error(error);
      alert('Failed to submit homework.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader 
        title="My Homework" 
        description="View and submit your assignments."
      />

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <h3 className="font-bold text-slate-900 text-lg">Assignments</h3>
          {isLoading ? (
            <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 text-indigo-600 animate-spin" /></div>
          ) : homeworks.length === 0 ? (
            <div className="p-6 text-center text-slate-500 bg-white rounded-xl border border-slate-100">No homework assigned yet.</div>
          ) : homeworks.map(hw => {
            const sub = submissions[hw.id];
            return (
              <div 
                key={hw.id} 
                onClick={() => setActiveHomework(hw)}
                className={`p-5 rounded-2xl border cursor-pointer transition-all relative overflow-hidden ${activeHomework?.id === hw.id ? 'border-indigo-500 bg-indigo-50' : 'border-slate-100 bg-white hover:border-indigo-300'}`}
              >
                {sub && (
                  <div className={`absolute top-0 right-0 w-2 h-full ${sub.status === 'Graded' ? 'bg-emerald-500' : 'bg-amber-400'}`}></div>
                )}
                <h4 className="font-bold text-slate-900 mb-1">{hw.title}</h4>
                <p className="text-sm text-slate-500 mb-3">{hw.description.substring(0, 40)}...</p>
                <div className="flex items-center justify-between">
                  <div className="text-xs font-medium text-indigo-600 bg-indigo-100/50 inline-block px-2.5 py-1 rounded-md">
                    Due: {new Date(hw.dueDate).toLocaleDateString()}
                  </div>
                  {sub && (
                    <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                      <CheckCircle2 className={`w-3.5 h-3.5 ${sub.status === 'Graded' ? 'text-emerald-500' : 'text-amber-500'}`} />
                      {sub.status}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="lg:col-span-2">
          {activeHomework ? (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden p-6 md:p-8">
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-slate-900 mb-2">{activeHomework.title}</h2>
                <div className="flex items-center gap-4 text-sm text-slate-500 mb-6">
                  <span className="bg-slate-100 px-3 py-1 rounded-full font-medium">Due: {new Date(activeHomework.dueDate).toLocaleDateString()}</span>
                </div>
                <div className="prose prose-slate max-w-none text-slate-600">
                  <p>{activeHomework.description}</p>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-8">
                <h3 className="font-bold text-slate-900 text-lg mb-6">Your Submission</h3>
                
                {submissions[activeHomework.id] ? (
                  <div className="space-y-6">
                    <div className="bg-slate-50 rounded-xl p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <span className={`inline-block px-3 py-1 text-sm font-bold rounded-full ${submissions[activeHomework.id].status === 'Graded' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                          Status: {submissions[activeHomework.id].status}
                        </span>
                      </div>
                      
                      {submissions[activeHomework.id].photoUrl && (
                        <div>
                          <p className="text-sm font-medium text-slate-700 mb-2">Submitted Work:</p>
                          <a href={submissions[activeHomework.id].photoUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-indigo-600 hover:bg-slate-50 transition">
                            <BookOpen className="w-4 h-4" /> View Submitted Photo
                          </a>
                        </div>
                      )}
                    </div>
                    
                    {submissions[activeHomework.id].status === 'Graded' && (
                      <div className="bg-emerald-50 rounded-xl p-6 border border-emerald-100">
                        <h4 className="font-bold text-emerald-900 mb-3">Teacher's Feedback</h4>
                        <div className="flex items-center gap-4 mb-3">
                          <div className="text-3xl font-bold text-emerald-600">{submissions[activeHomework.id].grade}</div>
                        </div>
                        <p className="text-emerald-800 text-sm">{submissions[activeHomework.id].feedback}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Photo URL (Upload Work)</label>
                      <div className="relative">
                        <input 
                          type="url" 
                          required
                          value={photoUrl}
                          onChange={(e) => setPhotoUrl(e.target.value)}
                          placeholder="https://example.com/my-homework-photo.jpg" 
                          className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-600 outline-none"
                        />
                        <Upload className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      </div>
                      <p className="text-xs text-slate-500 mt-2">Provide a link to your homework photo/document.</p>
                    </div>
                    <button type="submit" disabled={isSubmitting} className="px-6 py-2.5 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition flex items-center gap-2">
                      {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : null} Submit Work
                    </button>
                  </form>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 rounded-2xl border border-slate-100 p-12 text-center text-slate-500 h-full flex items-center justify-center min-h-[400px]">
              Select an assignment to view details and submit.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
