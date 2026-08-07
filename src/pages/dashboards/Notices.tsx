import React, { useState, useEffect } from 'react';
import { PageHeader, ConfirmModal } from '../../components/ui';
import { Bell, Plus, Loader2, Tag, Calendar as CalendarIcon, Trash2 } from 'lucide-react';
import { collection, query, onSnapshot, addDoc, serverTimestamp, where, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';

type NoticeData = {
  id: string;
  title: string;
  description: string;
  date: string;
  type: string;
  createdBy: string;
  creatorName: string;
  createdAt: any;
};

export default function Notices({ hideHeader }: { hideHeader?: boolean }) {
  const { user } = useAuth();
  const [notices, setNotices] = useState<NoticeData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteNoticeId, setDeleteNoticeId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    type: 'Academic'
  });

  const canAddNotices = user?.role === 'INSTITUTION' || user?.role === 'TEACHER' || user?.role === 'SUPER_ADMIN';

  useEffect(() => {
    if (!user) return;
    
    let q;
    const targetInstId = user.institutionId || (user.role === 'INSTITUTION' ? user.id : null);
    if (user.role === 'SUPER_ADMIN' || !targetInstId) {
      q = query(collection(db, 'notices'));
    } else {
      q = query(collection(db, 'notices'), where('institutionId', '==', targetInstId));
    }
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: NoticeData[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as NoticeData);
      });
      list.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
      setNotices(list);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching notices:", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canAddNotices) return;
    
    setIsSubmitting(true);
    try {
      const targetInstId = user?.institutionId || user?.id || 'default';
      await addDoc(collection(db, 'notices'), {
        ...formData,
        institutionId: targetInstId,
        createdBy: user?.id,
        creatorName: user?.name || 'Admin',
        createdAt: serverTimestamp()
      });
      
      setShowForm(false);
      setFormData({ title: '', description: '', date: '', type: 'Academic' });
      alert("Notice added successfully.");
    } catch (error) {
      console.error("Error adding notice:", error);
      alert("Failed to submit notice.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDeleteNotice = async () => {
    if (!deleteNoticeId) return;
    const targetId = deleteNoticeId;
    setNotices(prev => prev.filter(n => n.id !== targetId));
    setDeleteNoticeId(null);
    try {
      await deleteDoc(doc(db, 'notices', targetId));
    } catch (error) {
      console.error("Error deleting notice:", error);
      alert("Failed to delete notice.");
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      {!hideHeader && (
        <PageHeader 
          title="Notices & Announcements" 
          description="Stay updated with the latest notices"
          action={
            canAddNotices ? (
              <button 
                onClick={() => setShowForm(!showForm)}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
              >
                <Plus className="w-5 h-5" />
                Add Notice
              </button>
            ) : undefined
          }
        />
      )}

      {hideHeader && canAddNotices && (
        <div className="flex justify-end mb-6">
          <button 
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
          >
            <Plus className="w-5 h-5" />
            Add Notice
          </button>
        </div>
      )}

      {showForm && canAddNotices && (
        <div className="bg-white rounded-2xl p-6 md:p-8 border border-slate-100 shadow-sm mb-8 animate-in slide-in-from-bottom-4 fade-in duration-300">
          <h2 className="text-xl font-bold text-slate-900 mb-6">Create New Notice</h2>
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">Notice Title</label>
                <input 
                  type="text" 
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all outline-none" 
                  placeholder="e.g. End of Term Examinations" 
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Date</label>
                <input 
                  type="date" 
                  required
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all outline-none" 
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Notice Type</label>
                <select 
                  required
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all outline-none" 
                >
                  <option value="Academic">Academic</option>
                  <option value="Event">Event</option>
                  <option value="IT Support">IT Support</option>
                  <option value="General">General</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
                <textarea 
                  required
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all outline-none resize-none" 
                  placeholder="Notice details..." 
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button type="button" onClick={() => setShowForm(false)} className="px-6 py-2.5 border border-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-50 transition">
                Cancel
              </button>
              <button type="submit" disabled={isSubmitting} className="px-6 py-2.5 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition flex items-center gap-2">
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                Create Notice
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-4">
        {isLoading ? (
          <div className="py-12 flex justify-center">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          </div>
        ) : notices.length === 0 ? (
          <div className="py-12 text-center text-slate-500 bg-white rounded-2xl border border-slate-100">
            No notices available.
          </div>
        ) : notices.map((notice) => (
          <div key={notice.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 transition-hover hover:border-indigo-300">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl hidden sm:block">
                <Bell className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="text-lg font-bold text-slate-900">{notice.title}</h3>
                  <span className="px-2.5 py-1 bg-slate-100 text-slate-600 text-xs font-semibold rounded-full border border-slate-200">
                    {notice.type}
                  </span>
                </div>
                <p className="text-slate-600 text-sm mb-3">{notice.description}</p>
                <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <CalendarIcon className="w-3.5 h-3.5" />
                    {new Date(notice.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5" />
                    Posted by {notice.creatorName}
                  </div>
                </div>
              </div>
            </div>
            {canAddNotices && (
              <button 
                onClick={() => setDeleteNoticeId(notice.id)}
                className="text-sm text-rose-600 hover:text-rose-700 font-medium px-3 py-1.5 rounded-lg hover:bg-rose-50 transition-colors flex items-center gap-1 shrink-0"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete</span>
              </button>
            )}
          </div>
        ))}
      </div>

      <ConfirmModal
        isOpen={!!deleteNoticeId}
        title="Delete Notice"
        message="Are you sure you want to delete this notice? This action cannot be undone."
        onConfirm={confirmDeleteNotice}
        onCancel={() => setDeleteNoticeId(null)}
      />
    </div>
  );
}
