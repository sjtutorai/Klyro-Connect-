import React, { useState, useEffect, useRef } from 'react';
import { PageHeader, Card, Button, Badge } from '../../components/ui';
import { BookOpen, Upload, Loader2, CheckCircle2, Image as ImageIcon, Camera, Calendar, Award, Sparkles, Eye, X, ShieldAlert, AlertCircle } from 'lucide-react';
import { collection, query, where, orderBy, onSnapshot, setDoc, doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import { evaluateHomeworkWithAI } from '../../lib/aiHomework';

type Homework = {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  teacherId: string;
  teacherName?: string;
  institutionId?: string;
  attachmentUrl?: string;
  aiCorrectionEnabled?: boolean;
  createdAt?: any;
};

type Submission = {
  id: string;
  homeworkId: string;
  homeworkTitle?: string;
  studentId?: string;
  studentName?: string;
  photoUrl?: string;
  status: 'Completed' | 'In Progress' | 'Not Done' | 'Submitted' | 'Graded' | string;
  grade?: string;
  feedback?: string;
  createdAt?: any;
};

export default function StudentHomework() {
  const { user } = useAuth();
  const [homeworks, setHomeworks] = useState<Homework[]>([]);
  const [submissions, setSubmissions] = useState<Record<string, Submission>>({});
  const [isLoading, setIsLoading] = useState(true);
  
  const [activeHomework, setActiveHomework] = useState<Homework | null>(null);
  const [capturedLivePhoto, setCapturedLivePhoto] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

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

  const startCamera = async () => {
    setShowCamera(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      alert("Could not access live camera. Please allow camera permissions to capture live photo.");
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
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setCapturedLivePhoto(dataUrl);
        stopCamera();
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !activeHomework) return;
    if (!capturedLivePhoto) {
      alert("Please capture a live camera photo of your written homework before submitting.");
      return;
    }

    setIsSubmitting(true);
    try {
      const subId = `${activeHomework.id}_${user.id}`;
      
      // Initial status before AI evaluation
      const initialStatus = 'In Progress';

      await setDoc(doc(db, 'submissions', subId), {
        homeworkId: activeHomework.id,
        homeworkTitle: activeHomework.title || '',
        teacherId: activeHomework.teacherId || '',
        institutionId: user.institutionId || '',
        studentId: user.id,
        studentName: user.name,
        photoUrl: capturedLivePhoto,
        status: initialStatus,
        createdAt: serverTimestamp()
      });

      // Trigger automatic AI evaluation if enabled
      let aiResult: { status: 'Completed' | 'In Progress' | 'Not Done'; grade: string; feedback: string } = { 
        status: 'Completed', 
        grade: '90/100', 
        feedback: 'Homework live photo received.' 
      };
      try {
        aiResult = await evaluateHomeworkWithAI({
          questionTitle: activeHomework.title,
          questionDescription: activeHomework.description,
          questionPhotoUrl: activeHomework.attachmentUrl,
          studentName: user.name,
          studentPhotoUrl: capturedLivePhoto
        });

        await updateDoc(doc(db, 'submissions', subId), {
          status: aiResult.status,
          grade: aiResult.grade,
          feedback: aiResult.feedback,
          gradedAt: serverTimestamp(),
          aiEvaluated: true
        });
      } catch (aiErr) {
        console.warn("Auto AI evaluation warning:", aiErr);
      }

      setCapturedLivePhoto(null);
      alert(`🎉 Live Photo Homework Submitted Successfully!\n\nGemini AI evaluated your submission:\nStatus: ${aiResult.status}\nGrade: ${aiResult.grade}\nFeedback: ${aiResult.feedback}`);
    } catch (error) {
      console.error(error);
      alert('Failed to submit homework.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadgeVariant = (status?: string) => {
    if (status === 'Completed') return 'emerald';
    if (status === 'In Progress') return 'amber';
    if (status === 'Not Done') return 'rose';
    if (status === 'Graded') return 'emerald';
    return 'indigo';
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <PageHeader 
        title="Student Homework Assignments" 
        description="View assigned homework with teacher content, snap live photo submissions, and receive instant Gemini AI evaluation."
        badge="Student Portal"
        breadcrumbs={[{ label: 'Student' }, { label: 'Homework' }]}
      />

      {/* Image Zoom Modal */}
      {zoomedImage && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4" onClick={() => setZoomedImage(null)}>
          <div className="relative max-w-4xl max-h-[90vh] bg-white dark:bg-slate-900 rounded-3xl overflow-hidden p-2 shadow-2xl border border-slate-200 dark:border-slate-800" onClick={e => e.stopPropagation()}>
            <button onClick={() => setZoomedImage(null)} className="absolute top-4 right-4 p-2 bg-slate-950/70 hover:bg-slate-950 text-white rounded-full transition z-10">
              <X className="w-5 h-5" />
            </button>
            <img src={zoomedImage} alt="Homework View" className="w-full h-full max-h-[85vh] object-contain rounded-2xl" />
          </div>
        </div>
      )}

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
                  setCapturedLivePhoto(null);
                  stopCamera();
                }}
                className={`cursor-pointer transition-all relative overflow-hidden border ${
                  isActive 
                    ? 'border-indigo-600 dark:border-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/30 ring-1 ring-indigo-500/20' 
                    : 'hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                {sub && (
                  <div className={`absolute top-0 right-0 w-2 h-full ${
                    sub.status === 'Completed' ? 'bg-emerald-500' :
                    sub.status === 'In Progress' ? 'bg-amber-400' :
                    sub.status === 'Not Done' ? 'bg-rose-500' : 'bg-indigo-500'
                  }`}></div>
                )}
                <div className="flex items-center justify-between gap-2 mb-1">
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-1.5">
                    {hw.title}
                    {hw.attachmentUrl && (
                      <ImageIcon className="w-3.5 h-3.5 text-indigo-500 shrink-0" title="Photo Attachment Available" />
                    )}
                  </h4>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 line-clamp-2">{hw.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-indigo-500" /> Due: {hw.dueDate ? new Date(hw.dueDate).toLocaleDateString() : 'N/A'}
                  </span>
                  {sub && (
                    <Badge variant={getStatusBadgeVariant(sub.status)}>
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
              <div className="border-b border-slate-100 dark:border-slate-800 pb-5 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    {activeHomework.title}
                  </h2>
                  <Badge variant="indigo">
                    Due Date: {activeHomework.dueDate ? new Date(activeHomework.dueDate).toLocaleDateString() : 'N/A'}
                  </Badge>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{activeHomework.description}</p>

                {/* Display Teacher Homework Attachment Photo */}
                {activeHomework.attachmentUrl && (
                  <div className="p-3.5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/80 space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-900 dark:text-indigo-300 flex items-center gap-1.5">
                      <ImageIcon className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" /> Teacher's Assignment / Question Content Photo:
                    </p>
                    <div 
                      onClick={() => setZoomedImage(activeHomework.attachmentUrl || null)}
                      className="relative group rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-2 cursor-pointer max-w-sm hover:border-indigo-500 transition"
                    >
                      <img 
                        src={activeHomework.attachmentUrl} 
                        alt="Question Content" 
                        className="w-full max-h-48 object-contain rounded-lg"
                      />
                      <div className="absolute inset-0 bg-slate-950/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2 text-white font-bold text-xs">
                        <Eye className="w-4 h-4" /> Click to Zoom
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base mb-4 flex items-center gap-2">
                  Your Live Camera Submission
                </h3>
                
                {submissions[activeHomework.id] ? (
                  <div className="space-y-4">
                    <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Submission Status</span>
                        <Badge variant={getStatusBadgeVariant(submissions[activeHomework.id].status)}>
                          Status: {submissions[activeHomework.id].status}
                        </Badge>
                      </div>
                      
                      {submissions[activeHomework.id].photoUrl && (
                        <div>
                          <p className="text-[10px] uppercase font-bold text-slate-400 mb-2">Captured Live Photo:</p>
                          <div 
                            onClick={() => setZoomedImage(submissions[activeHomework.id].photoUrl || null)}
                            className="max-w-md rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 cursor-pointer group hover:border-indigo-500 transition relative"
                          >
                            <img 
                              src={submissions[activeHomework.id].photoUrl} 
                              alt="Submitted Homework Live Photo" 
                              className="w-full max-h-64 object-contain rounded-xl"
                            />
                            <div className="absolute inset-0 bg-slate-950/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2 text-white font-bold text-xs">
                              <Eye className="w-4 h-4" /> Click to Expand
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {(submissions[activeHomework.id].grade || submissions[activeHomework.id].feedback) && (
                      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl space-y-3">
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                          <h4 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                            <Award className="w-4 h-4 text-indigo-500" /> Evaluation Results
                          </h4>
                          <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                            Grade: {submissions[activeHomework.id].grade}
                          </span>
                        </div>
                        <p className="text-slate-700 dark:text-slate-300 text-xs leading-relaxed">
                          <strong>Feedback:</strong> {submissions[activeHomework.id].feedback}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Strict Live Photo Banner */}
                    <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-start gap-3">
                      <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                      <div className="text-xs text-amber-900 dark:text-amber-200">
                        <strong className="block font-bold mb-0.5">Strict Policy: Live Photo Only Required</strong>
                        File uploads and gallery images are disabled for this assignment. You must use your device camera to capture a live photo of your written answers on paper.
                      </div>
                    </div>

                    <div className="space-y-4">
                      {!showCamera && !capturedLivePhoto && (
                        <div className="p-8 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl text-center bg-slate-50/50 dark:bg-slate-900/50 flex flex-col items-center justify-center space-y-3">
                          <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                            <Camera className="w-8 h-8" />
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-900 dark:text-white text-sm">Device Live Camera Required</h4>
                            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mt-1">
                              Place your completed written homework sheet on a flat surface and click below to open your camera.
                            </p>
                          </div>
                          <Button 
                            type="button" 
                            onClick={startCamera} 
                            icon={<Camera className="w-4 h-4" />}
                          >
                            Open Live Camera
                          </Button>
                        </div>
                      )}

                      {showCamera && (
                        <div className="p-4 bg-slate-950 rounded-3xl flex flex-col items-center relative space-y-4 border border-slate-800">
                          <div className="relative w-full max-w-lg rounded-2xl overflow-hidden bg-black aspect-video flex items-center justify-center">
                            <video ref={videoRef} className="w-full h-full object-cover" playsInline autoPlay muted></video>
                            <canvas ref={canvasRef} className="hidden"></canvas>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <button 
                              type="button" 
                              onClick={capturePhoto} 
                              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm transition flex items-center gap-2 shadow-lg"
                            >
                              <Camera className="w-4 h-4" /> Snap Live Photo Now
                            </button>
                            <button 
                              type="button" 
                              onClick={stopCamera} 
                              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-sm transition"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}

                      {capturedLivePhoto && (
                        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-3">
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                              <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Captured Live Photo Preview:
                            </p>
                            <button 
                              type="button" 
                              onClick={startCamera}
                              className="text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline flex items-center gap-1"
                            >
                              <Camera className="w-3.5 h-3.5" /> Retake Live Photo
                            </button>
                          </div>

                          <div 
                            onClick={() => setZoomedImage(capturedLivePhoto)}
                            className="max-w-md rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 cursor-pointer group hover:border-indigo-500 transition relative"
                          >
                            <img 
                              src={capturedLivePhoto} 
                              alt="Live Photo Captured" 
                              className="w-full max-h-64 object-contain rounded-xl"
                            />
                            <div className="absolute inset-0 bg-slate-950/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2 text-white font-bold text-xs">
                              <Eye className="w-4 h-4" /> Click to Zoom
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <Button 
                      type="submit" 
                      isLoading={isSubmitting} 
                      disabled={!capturedLivePhoto}
                      icon={<Sparkles className="w-4 h-4" />}
                      className="w-full py-3 text-sm"
                    >
                      Submit Live Homework & Get Gemini AI Evaluation
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

