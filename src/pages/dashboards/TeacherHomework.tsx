import React, { useState, useEffect, useRef } from 'react';
import { PageHeader, ConfirmModal, Card, Button, Badge } from '../../components/ui';
import { BookOpen, Plus, Search, Loader2, Image as ImageIcon, CheckCircle2, Eye, X, Trash2, Calendar, User, FileText, Award, Send, Sparkles, Upload, Camera, AlertCircle } from 'lucide-react';
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import { compressImageFile } from '../../lib/imageUtils';
import { evaluateHomeworkWithAI } from '../../lib/aiHomework';

type Homework = {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  createdAt: any;
  teacherId: string;
  teacherName?: string;
  institutionId: string;
  attachmentUrl?: string;
  aiCorrectionEnabled?: boolean;
};

type Submission = {
  id: string;
  homeworkId: string;
  homeworkTitle?: string;
  studentId: string;
  studentName: string;
  photoUrl?: string;
  status: 'Completed' | 'In Progress' | 'Not Done' | 'Submitted' | 'Graded' | string;
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
  
  const [formData, setFormData] = useState({ 
    title: '', 
    description: '', 
    dueDate: '',
    attachmentUrl: '',
    aiCorrectionEnabled: true
  });
  const [hwPhotoFile, setHwPhotoFile] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [activeHomework, setActiveHomework] = useState<string | null>(null);
  const [evaluatingSubId, setEvaluatingSubId] = useState<string | null>(null);

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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressedBase64 = await compressImageFile(file);
        setHwPhotoFile(compressedBase64);
      } catch (err) {
        console.error("Error compressing image:", err);
        const reader = new FileReader();
        reader.onloadend = () => {
          setHwPhotoFile(reader.result as string);
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
      alert("Could not access camera. Please check camera permissions.");
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
        setHwPhotoFile(dataUrl);
        stopCamera();
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSubmitting(true);
    try {
      const finalAttachment = hwPhotoFile || formData.attachmentUrl || '';
      const docRef = await addDoc(collection(db, 'homeworks'), {
        title: formData.title,
        description: formData.description,
        dueDate: formData.dueDate,
        attachmentUrl: finalAttachment,
        aiCorrectionEnabled: formData.aiCorrectionEnabled,
        teacherId: user.id,
        teacherName: user.name,
        institutionId: user.institutionId || '',
        createdAt: serverTimestamp()
      });
      setShowForm(false);
      setFormData({ title: '', description: '', dueDate: '', attachmentUrl: '', aiCorrectionEnabled: true });
      setHwPhotoFile(null);
      setActiveHomework(docRef.id);
      alert('Homework assignment created and shared with students!');
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

  const handleGrade = async (subId: string, status: string, grade: string, feedback: string) => {
    try {
      await updateDoc(doc(db, 'submissions', subId), {
        status,
        grade,
        feedback,
        gradedAt: serverTimestamp()
      });
      alert(`Submission marked as "${status}" and graded successfully!`);
    } catch (error) {
      console.error(error);
      alert('Failed to grade submission.');
    }
  };

  const handleAiAutoCorrect = async (sub: Submission) => {
    if (!activeHwObject || !sub.photoUrl) {
      alert("No student submission photo found to analyze.");
      return;
    }

    setEvaluatingSubId(sub.id);
    try {
      const aiResult = await evaluateHomeworkWithAI({
        questionTitle: activeHwObject.title,
        questionDescription: activeHwObject.description,
        questionPhotoUrl: activeHwObject.attachmentUrl,
        studentName: sub.studentName,
        studentPhotoUrl: sub.photoUrl
      });

      await updateDoc(doc(db, 'submissions', sub.id), {
        status: aiResult.status,
        grade: aiResult.grade,
        feedback: aiResult.feedback,
        gradedAt: serverTimestamp(),
        aiEvaluated: true
      });

      alert(`🤖 AI Auto-Correction Complete!\n\nStatus: ${aiResult.status}\nGrade: ${aiResult.grade}\nFeedback: ${aiResult.feedback}`);
    } catch (err: any) {
      console.error("AI Auto-correction error:", err);
      alert(`AI Auto-correction failed: ${err?.message || "Please check submission photo."}`);
    } finally {
      setEvaluatingSubId(null);
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

  const getStatusBadgeVariant = (status: string) => {
    if (status === 'Completed') return 'emerald';
    if (status === 'In Progress') return 'amber';
    if (status === 'Not Done') return 'rose';
    if (status === 'Graded') return 'emerald';
    return 'indigo';
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <PageHeader 
        title="Faculty Homework Hub" 
        description="Assign homework with photo attachments, enable Gemini AI auto-correction, and evaluate student live work."
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
            <img src={zoomedImage} alt="Homework Attachment View" className="w-full h-full max-h-[85vh] object-contain rounded-2xl" />
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
              <p className="text-xs text-slate-500 dark:text-slate-400">Attach question paper photo, set instructions, and enable AI auto-correction</p>
            </div>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="grid md:grid-cols-2 gap-5">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">Assignment Title</label>
                <input required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} type="text" className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:border-indigo-500 text-sm outline-none transition" placeholder="e.g. Mathematics Chapter 4 Homework" />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">Instructions & Questions</label>
                <textarea required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} rows={3} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:border-indigo-500 text-sm outline-none transition resize-none" placeholder="Provide instructions or write down questions for students to solve on paper..."></textarea>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">Submission Due Date</label>
                <input required value={formData.dueDate} onChange={e => setFormData({...formData, dueDate: e.target.value})} type="date" className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:border-indigo-500 text-sm outline-none transition" />
              </div>

              {/* AI Toggle */}
              <div className="flex items-center gap-3 p-4 bg-indigo-50/70 dark:bg-indigo-950/40 rounded-2xl border border-indigo-200/80 dark:border-indigo-800/80">
                <input 
                  type="checkbox"
                  id="aiCorrectionEnabled"
                  checked={formData.aiCorrectionEnabled}
                  onChange={e => setFormData({...formData, aiCorrectionEnabled: e.target.checked})}
                  className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="aiCorrectionEnabled" className="cursor-pointer">
                  <span className="text-xs font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Enable Gemini AI Auto-Correction
                  </span>
                  <span className="text-[11px] text-indigo-700 dark:text-indigo-300 block">
                    AI will analyze student live answer photos against this assignment and mark status as Completed, In Progress, or Not Done.
                  </span>
                </label>
              </div>

              {/* Teacher Homework Photo Attachment */}
              <div className="md:col-span-2 space-y-3 pt-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Attach Homework / Question Paper Photo <span className="text-slate-400 font-normal lowercase text-[11px]">(optional)</span>
                </label>
                
                <div className="grid sm:grid-cols-2 gap-4">
                  <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer transition">
                    <Upload className="w-6 h-6 text-indigo-600 dark:text-indigo-400 mb-2" />
                    <span className="text-xs font-bold text-slate-900 dark:text-white">Upload Question Photo</span>
                    <span className="text-[11px] text-slate-400 mt-0.5">PNG, JPG format</span>
                    <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                  </label>

                  <button type="button" onClick={startCamera} className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer transition text-left">
                    <Camera className="w-6 h-6 text-indigo-600 dark:text-indigo-400 mb-2" />
                    <span className="text-xs font-bold text-slate-900 dark:text-white">Snap Question Photo</span>
                    <span className="text-[11px] text-slate-400 mt-0.5">Use camera to capture paper</span>
                  </button>
                </div>

                {showCamera && (
                  <div className="p-4 bg-slate-900 rounded-2xl flex flex-col items-center relative">
                    <video ref={videoRef} className="w-full max-w-md rounded-xl bg-black aspect-video object-cover" playsInline muted></video>
                    <canvas ref={canvasRef} className="hidden"></canvas>
                    <div className="flex items-center gap-3 mt-4">
                      <button type="button" onClick={capturePhoto} className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition">
                        Capture Question Photo
                      </button>
                      <button type="button" onClick={stopCamera} className="px-6 py-2.5 bg-slate-800 text-white rounded-xl font-bold text-sm hover:bg-slate-700 transition">
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex flex-col justify-center">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Or enter Image URL</span>
                  <input 
                    type="url" 
                    value={formData.attachmentUrl}
                    onChange={(e) => {
                      setFormData({...formData, attachmentUrl: e.target.value});
                      setHwPhotoFile(null);
                    }}
                    placeholder="https://..." 
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs outline-none focus:border-indigo-500"
                  />
                </div>

                {(hwPhotoFile || formData.attachmentUrl) && (
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Attached Homework Photo Preview:</p>
                      <img 
                        src={hwPhotoFile || formData.attachmentUrl} 
                        alt="Question Photo Preview" 
                        className="max-h-36 rounded-xl object-contain bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
                      />
                    </div>
                    <button 
                      type="button" 
                      onClick={() => { setHwPhotoFile(null); setFormData({...formData, attachmentUrl: ''}); }}
                      className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950 rounded-xl text-xs font-bold transition flex items-center gap-1"
                    >
                      <Trash2 className="w-4 h-4" /> Remove
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
              <Button type="submit" isLoading={isSubmitting}>
                Create & Share Assignment
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
                  <div className="pr-4">
                    <h4 className="font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors text-sm flex items-center gap-1.5">
                      {hw.title}
                      {hw.aiCorrectionEnabled && (
                        <Sparkles className="w-3.5 h-3.5 text-indigo-500 shrink-0" title="AI Auto-Correction Enabled" />
                      )}
                    </h4>
                  </div>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteHwId(hw.id);
                    }}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition shrink-0"
                    title="Delete Assignment"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 line-clamp-2">{hw.description}</p>

                {hw.attachmentUrl && (
                  <div className="mb-3 flex items-center gap-1.5 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-2 py-1 rounded-lg w-fit">
                    <ImageIcon className="w-3 h-3" /> Question Photo Attached
                  </div>
                )}

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
              <div className="border-b border-slate-100 dark:border-slate-800 pb-5 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    {activeHwObject.title}
                    {activeHwObject.aiCorrectionEnabled && (
                      <Badge variant="indigo" className="flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> AI Auto-Correct Active
                      </Badge>
                    )}
                  </h2>
                  <Badge variant="indigo">
                    Due Date: {activeHwObject.dueDate ? new Date(activeHwObject.dueDate).toLocaleDateString() : 'N/A'}
                  </Badge>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{activeHwObject.description}</p>

                {/* Display Teacher Homework Photo Attachment */}
                {activeHwObject.attachmentUrl && (
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                      <ImageIcon className="w-3.5 h-3.5 text-indigo-500" /> Teacher's Question / Content Photo (Shared with Students):
                    </p>
                    <div 
                      onClick={() => setZoomedImage(activeHwObject.attachmentUrl || null)}
                      className="relative group rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-2 cursor-pointer max-w-sm hover:border-indigo-500 transition"
                    >
                      <img 
                        src={activeHwObject.attachmentUrl} 
                        alt="Question Paper Attachment" 
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
                <div className="flex items-center justify-between mb-5">
                  <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
                    Student Live Submissions ({submissions.length})
                  </h3>
                </div>

                {submissions.length === 0 ? (
                  <div className="p-12 text-center text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                    <ImageIcon className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
                    <p className="font-bold text-slate-700 dark:text-slate-300 text-sm">No submissions received yet.</p>
                    <p className="text-xs text-slate-400 mt-1">Live camera photos submitted by students will appear right here for grading.</p>
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
                              <p className="text-[11px] text-slate-400">Student Live Camera Submission</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <Badge variant={getStatusBadgeVariant(sub.status)}>
                              Status: {sub.status || 'Pending Review'}
                            </Badge>

                            {/* Run AI Correction Button */}
                            <Button 
                              size="sm"
                              variant="outline"
                              onClick={() => handleAiAutoCorrect(sub)}
                              isLoading={evaluatingSubId === sub.id}
                              icon={<Sparkles className="w-3.5 h-3.5 text-indigo-500" />}
                            >
                              AI Auto-Correct
                            </Button>
                          </div>
                        </div>
                        
                        {/* Student Submitted Live Photo */}
                        {sub.photoUrl ? (
                          <div className="space-y-2">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Student Live Camera Photo:</p>
                            <div 
                              onClick={() => setZoomedImage(sub.photoUrl || null)}
                              className="relative group rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 cursor-pointer max-w-md hover:border-indigo-500 transition"
                            >
                              <img 
                                src={sub.photoUrl} 
                                alt="Student Live Homework Photo" 
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
                          <div className="text-xs text-slate-400 italic">No live photo attached.</div>
                        )}

                        {/* Evaluation & Grading Section */}
                        {sub.grade || sub.feedback ? (
                          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl text-xs space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold">
                                <Award className="w-4 h-4 text-indigo-500" />
                                <span>Grade: {sub.grade || 'Evaluated'}</span>
                              </div>
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                {sub.status}
                              </span>
                            </div>
                            <p className="text-slate-600 dark:text-slate-300 text-xs">
                              <strong>Feedback:</strong> {sub.feedback}
                            </p>
                          </div>
                        ) : null}

                        {/* Manual Grade Form */}
                        <form onSubmit={(e) => {
                          e.preventDefault();
                          const target = e.target as typeof e.target & { status: { value: string }, grade: { value: string }, feedback: { value: string } };
                          handleGrade(sub.id, target.status.value, target.grade.value, target.feedback.value);
                        }} className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                          <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Manual Grade / Update Status</h5>
                          <div className="grid sm:grid-cols-3 gap-3">
                            <div>
                              <select name="status" defaultValue={sub.status || 'Completed'} className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white outline-none text-xs focus:border-indigo-500">
                                <option value="Completed">Completed</option>
                                <option value="In Progress">In Progress</option>
                                <option value="Not Done">Not Done</option>
                              </select>
                            </div>
                            <div className="sm:col-span-2">
                              <input name="grade" defaultValue={sub.grade || ''} placeholder="Grade (e.g. 95/100, A)" required className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white outline-none text-xs focus:border-indigo-500" />
                            </div>
                            <div className="sm:col-span-3">
                              <textarea name="feedback" defaultValue={sub.feedback || ''} placeholder="Feedback for student..." rows={2} required className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white outline-none text-xs resize-none focus:border-indigo-500"></textarea>
                            </div>
                          </div>
                          <div className="flex justify-end">
                            <Button type="submit" size="sm" icon={<Send className="w-3.5 h-3.5" />}>
                              Save Manual Evaluation
                            </Button>
                          </div>
                        </form>
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
              <p className="text-xs text-slate-400 mt-1 max-w-sm">Select a homework assignment from the roster on the left to grade submitted live photos.</p>
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

