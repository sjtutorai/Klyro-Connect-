import React, { useState, useEffect } from 'react';
import { PageHeader } from '../../components/ui';
import { BookOpen, Upload, Loader2, CheckCircle2, Image as ImageIcon, Camera } from 'lucide-react';
import { collection, query, where, orderBy, onSnapshot, setDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';

type Homework = {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  teacherId: string;
  institutionId?: string;
  createdAt?: any;
};

type Submission = {
  id: string;
  homeworkId: string;
  homeworkTitle?: string;
  studentId?: string;
  photoUrl?: string;
  status: string;
  grade?: string;
  feedback?: string;
};

const compressImageFile = (file: File, maxWidth = 1200, maxHeight = 1200, quality = 0.7): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = (event) => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          if (width / height > maxWidth / maxHeight) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(event.target?.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
};

export default function StudentHomework() {
  const { user } = useAuth();
  const [homeworks, setHomeworks] = useState<Homework[]>([]);
  const [submissions, setSubmissions] = useState<Record<string, Submission>>({});
  const [isLoading, setIsLoading] = useState(true);
  
  const [activeHomework, setActiveHomework] = useState<Homework | null>(null);
  const [photoUrl, setPhotoUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, 'homeworks'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: Homework[] = [];
      snapshot.forEach(doc => {
        const data = doc.data() as Homework;
        const item = { id: doc.id, ...data };
        if (!user.institutionId || !data.institutionId || data.institutionId === user.institutionId) {
          list.push(item);
        } else {
          list.push(item); // Fallback to ensure students can see homeworks
        }
      });

      list.sort((a, b) => {
        const tA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : (a.createdAt?.seconds ? a.createdAt.seconds * 1000 : 0);
        const tB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : (b.createdAt?.seconds ? b.createdAt.seconds * 1000 : 0);
        return tB - tA;
      });

      setHomeworks(list);
      
      setActiveHomework(prev => {
        if (!prev || !list.some(h => h.id === prev.id)) {
          return list[0] || null;
        }
        return prev;
      });

      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching homeworks:", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'submissions'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const subs: Record<string, Submission> = {};
      snapshot.forEach(doc => {
        const data = doc.data() as Submission;
        if (data.studentId === user.id || !data.studentId) {
          if (data.homeworkId) {
            subs[data.homeworkId] = { id: doc.id, ...data };
          }
          if (data.homeworkTitle) {
            const matchedHw = homeworks.find(h => h.title.trim().toLowerCase() === data.homeworkTitle?.trim().toLowerCase());
            if (matchedHw) {
              subs[matchedHw.id] = { id: doc.id, ...data };
            }
          }
        }
      });
      setSubmissions(subs);
    });
    return () => unsubscribe();
  }, [user, homeworks]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressedBase64 = await compressImageFile(file);
        setSelectedFile(compressedBase64);
        setPhotoUrl(compressedBase64);
      } catch (err) {
        console.error("Error compressing image:", err);
        const reader = new FileReader();
        reader.onloadend = () => {
          setSelectedFile(reader.result as string);
          setPhotoUrl(reader.result as string);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !activeHomework) return;
    const finalPhoto = selectedFile || photoUrl;
    if (!finalPhoto) {
      alert("Please upload or provide a photo of your written homework.");
      return;
    }

    setIsSubmitting(true);
    try {
      const subId = `${activeHomework.id}_${user.id}`;
      await setDoc(doc(db, 'submissions', subId), {
        homeworkId: activeHomework.id,
        homeworkTitle: activeHomework.title || '',
        teacherId: activeHomework.teacherId || '',
        institutionId: user.institutionId || '',
        studentId: user.id,
        studentName: user.name,
        photoUrl: finalPhoto,
        status: 'Submitted',
        createdAt: serverTimestamp()
      });
      setPhotoUrl('');
      setSelectedFile(null);
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
        description="View assignments and submit photos of your completed written work."
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
                onClick={() => {
                  setActiveHomework(hw);
                  setSelectedFile(null);
                  setPhotoUrl('');
                }}
                className={`p-5 rounded-2xl border cursor-pointer transition-all relative overflow-hidden ${activeHomework?.id === hw.id ? 'border-indigo-500 bg-indigo-50' : 'border-slate-100 bg-white hover:border-indigo-300'}`}
              >
                {sub && (
                  <div className={`absolute top-0 right-0 w-2 h-full ${sub.status === 'Graded' ? 'bg-emerald-500' : 'bg-amber-400'}`}></div>
                )}
                <h4 className="font-bold text-slate-900 mb-1">{hw.title}</h4>
                <p className="text-sm text-slate-500 mb-3 line-clamp-2">{hw.description}</p>
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
                  <span className="bg-slate-100 px-3 py-1 rounded-full font-medium text-xs">Due: {new Date(activeHomework.dueDate).toLocaleDateString()}</span>
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
                        <span className={`inline-block px-3 py-1 text-xs font-bold rounded-full ${submissions[activeHomework.id].status === 'Graded' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                          Status: {submissions[activeHomework.id].status}
                        </span>
                      </div>
                      
                      {submissions[activeHomework.id].photoUrl && (
                        <div>
                          <p className="text-sm font-medium text-slate-700 mb-2">Submitted Photo of Work:</p>
                          <div className="max-w-md rounded-xl overflow-hidden border border-slate-200 mb-3 bg-white p-2">
                            <img 
                              src={submissions[activeHomework.id].photoUrl} 
                              alt="Submitted Homework" 
                              className="w-full max-h-64 object-contain rounded-lg"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=500&auto=format&fit=crop&q=60';
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {submissions[activeHomework.id].status === 'Graded' && (
                      <div className="bg-emerald-50 rounded-xl p-6 border border-emerald-100">
                        <h4 className="font-bold text-emerald-900 mb-2">Teacher Grade & Feedback</h4>
                        <div className="flex items-center gap-4 mb-2">
                          <div className="text-2xl font-bold text-emerald-700">Grade: {submissions[activeHomework.id].grade}</div>
                        </div>
                        <p className="text-emerald-800 text-sm">{submissions[activeHomework.id].feedback}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Attach Photo of Homework</label>
                      
                      <div className="grid sm:grid-cols-2 gap-4 mb-4">
                        <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer transition">
                          <Camera className="w-8 h-8 text-indigo-600 mb-2" />
                          <span className="text-sm font-semibold text-slate-700">Choose Image File</span>
                          <span className="text-xs text-slate-400 mt-1">PNG, JPG, or Mobile Photo</span>
                          <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                        </label>

                        <div className="flex flex-col justify-center">
                          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Or enter Image URL</span>
                          <input 
                            type="url" 
                            value={photoUrl}
                            onChange={(e) => {
                              setPhotoUrl(e.target.value);
                              setSelectedFile(null);
                            }}
                            placeholder="https://..." 
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-600 outline-none text-sm"
                          />
                        </div>
                      </div>

                      {(selectedFile || photoUrl) && (
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                          <p className="text-xs font-semibold text-slate-500 mb-2">Photo Preview:</p>
                          <img 
                            src={selectedFile || photoUrl} 
                            alt="Preview" 
                            className="max-h-48 rounded-lg object-contain bg-white border"
                          />
                        </div>
                      )}
                    </div>
                    
                    <button type="submit" disabled={isSubmitting} className="px-6 py-2.5 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition flex items-center gap-2">
                      {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />} Submit Homework Photo
                    </button>
                  </form>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 rounded-2xl border border-slate-100 p-12 text-center text-slate-500 h-full flex items-center justify-center min-h-[400px]">
              Select an assignment to view details and submit your work.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
