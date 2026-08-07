import React, { useState, useEffect } from 'react';
import { PageHeader, Card, Button, Badge } from '../../components/ui';
import { BookOpen, Upload, Loader2, CheckCircle2, Image as ImageIcon, Camera, Calendar, Award } from 'lucide-react';
import { collection, query, where, orderBy, onSnapshot, setDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import { compressImageFile } from '../../lib/imageUtils';

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

export default function StudentHomework() {
  const { user } = useAuth();
  const [homeworks, setHomeworks] = useState<Homework[]>([]);
  const [submissions, setSubmissions] = useState<Record<string, Submission>>({});
  const [isLoading, setIsLoading] = useState(true);
  
  const [activeHomework, setActiveHomework] = useState<Homework | null>(null);
  const [photoUrl, setPhotoUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

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

  const startCamera = async () => {
    setShowCamera(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      alert("Could not access camera. Please check permissions.");
      setShowCamera(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
    setShowCamera(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setSelectedFile(dataUrl);
        setPhotoUrl(dataUrl);
        stopCamera();
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
    <div className="max-w-7xl mx-auto space-y-8">
      <PageHeader 
        title="Student Homework Assignments" 
        description="View class assignments, upload photo submissions of written work, and receive feedback."
        badge="Student Portal"
        breadcrumbs={[{ label: 'Student' }, { label: 'Homework' }]}
      />

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-4">
          <h3 className="font-bold text-slate-900 dark:text-white text-base">Assignments ({homeworks.length})</h3>
          {isLoading ? (
            <div className="flex justify-center p-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800">
              <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
            </div>
          ) : homeworks.length === 0 ? (
            <Card className="p-6 text-center text-slate-400">No homework assigned yet.</Card>
          ) : homeworks.map(hw => {
            const sub = submissions[hw.id];
            const isActive = activeHomework?.id === hw.id;
            return (
              <Card 
                key={hw.id} 
                onClick={() => {
                  setActiveHomework(hw);
                  setSelectedFile(null);
                  setPhotoUrl('');
                }}
                className={`cursor-pointer transition-all relative overflow-hidden border ${
                  isActive 
                    ? 'border-indigo-600 dark:border-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/30 ring-1 ring-indigo-500/20' 
                    : 'hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                {sub && (
                  <div className={`absolute top-0 right-0 w-2 h-full ${sub.status === 'Graded' ? 'bg-emerald-500' : 'bg-amber-400'}`}></div>
                )}
                <h4 className="font-bold text-slate-900 dark:text-white mb-1 text-sm">{hw.title}</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 line-clamp-2">{hw.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-indigo-500" /> Due: {new Date(hw.dueDate).toLocaleDateString()}
                  </span>
                  {sub && (
                    <Badge variant={sub.status === 'Graded' ? 'emerald' : 'amber'}>
                      {sub.status}
                    </Badge>
                  )}
                </div>
              </Card>
            );
          })}
        </div>

        <div className="lg:col-span-2">
          {activeHomework ? (
            <Card className="space-y-6">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-5">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{activeHomework.title}</h2>
                <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 mb-4">
                  <Badge variant="indigo">Due Date: {new Date(activeHomework.dueDate).toLocaleDateString()}</Badge>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{activeHomework.description}</p>
              </div>

              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base mb-4">Your Submission</h3>
                
                {submissions[activeHomework.id] ? (
                  <div className="space-y-4">
                    <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800">
                      <div className="flex items-center gap-3 mb-4">
                        <Badge variant={submissions[activeHomework.id].status === 'Graded' ? 'emerald' : 'amber'}>
                          Status: {submissions[activeHomework.id].status}
                        </Badge>
                      </div>
                      
                      {submissions[activeHomework.id].photoUrl && (
                        <div>
                          <p className="text-[10px] uppercase font-bold text-slate-400 mb-2">Submitted Photo of Work:</p>
                          <div className="max-w-md rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2">
                            <img 
                              src={submissions[activeHomework.id].photoUrl} 
                              alt="Submitted Homework" 
                              className="w-full max-h-64 object-contain rounded-xl"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=500&auto=format&fit=crop&q=60';
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {submissions[activeHomework.id].status === 'Graded' && (
                      <div className="bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/60 p-5 rounded-2xl space-y-2">
                        <h4 className="font-bold text-emerald-900 dark:text-emerald-300 text-sm flex items-center gap-2">
                          <Award className="w-4 h-4 text-emerald-600" /> Teacher Evaluation & Grade
                        </h4>
                        <div className="text-lg font-bold text-emerald-700 dark:text-emerald-400">Grade: {submissions[activeHomework.id].grade}</div>
                        <p className="text-emerald-800 dark:text-emerald-300 text-xs"><strong>Teacher Feedback:</strong> {submissions[activeHomework.id].feedback}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-3">Attach Written Work Photo</label>
                      
                      <div className="grid sm:grid-cols-2 gap-4 mb-4">
                        <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer transition">
                          <Upload className="w-6 h-6 text-indigo-600 dark:text-indigo-400 mb-2" />
                          <span className="text-xs font-bold text-slate-900 dark:text-white">Upload Image File</span>
                          <span className="text-[11px] text-slate-400 mt-0.5">PNG, JPG format</span>
                          <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                        </label>
                        
                        <button type="button" onClick={startCamera} className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer transition text-left">
                          <Camera className="w-6 h-6 text-indigo-600 dark:text-indigo-400 mb-2" />
                          <span className="text-xs font-bold text-slate-900 dark:text-white">Take Live Photo</span>
                          <span className="text-[11px] text-slate-400 mt-0.5">Use your device camera</span>
                        </button>
                      </div>

                      {showCamera && (
                        <div className="mb-6 p-4 bg-slate-900 rounded-2xl flex flex-col items-center relative">
                          <video ref={videoRef} className="w-full max-w-md rounded-xl bg-black aspect-video object-cover" playsInline muted></video>
                          <canvas ref={canvasRef} className="hidden"></canvas>
                          <div className="flex items-center gap-3 mt-4">
                            <button type="button" onClick={capturePhoto} className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition">
                              Capture Photo
                            </button>
                            <button type="button" onClick={stopCamera} className="px-6 py-2.5 bg-slate-800 text-white rounded-xl font-bold text-sm hover:bg-slate-700 transition">
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}

                      <div className="flex flex-col justify-center mb-6">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Or enter Image URL</span>
                          <input 
                            type="url" 
                            value={photoUrl}
                            onChange={(e) => {
                              setPhotoUrl(e.target.value);
                              setSelectedFile(null);
                            }}
                            placeholder="https://..." 
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs outline-none focus:border-indigo-500"
                          />
                        </div>

                      {(selectedFile || photoUrl) && (
                        <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/80 dark:border-slate-800">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Preview Selected Image:</p>
                          <img 
                            src={selectedFile || photoUrl} 
                            alt="Preview" 
                            className="max-h-48 rounded-xl object-contain bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
                          />
                        </div>
                      )}
                    </div>
                    
                    <Button type="submit" isLoading={isSubmitting} icon={<Upload className="w-4 h-4" />}>
                      Submit Homework Photo
                    </Button>
                  </form>
                )}
              </div>
            </Card>
          ) : (
            <Card className="p-12 text-center text-slate-400 flex flex-col items-center justify-center min-h-[400px]">
              <BookOpen className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-3" />
              <p className="font-bold text-slate-700 dark:text-slate-300 text-sm">Select an assignment to view details and submit work.</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
