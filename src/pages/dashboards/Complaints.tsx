import React, { useState, useEffect } from 'react';
import { PageHeader } from '../../components/ui';
import { MessageSquareWarning, Plus, Search, Filter, Clock, Loader2, Trash2, Sparkles, UserX, Shield, Globe, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, where, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';

type Complaint = {
  id: string;
  title: string;
  category: string;
  priority: string;
  status: string;
  createdAt: any;
  userId: string;
  userName: string;
  description: string;
  isAnonymous?: boolean;
  visibility?: string;
  institutionId?: string;
};

export default function Complaints() {
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [complaintsList, setComplaintsList] = useState<Complaint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  
  const [isAiCleaning, setIsAiCleaning] = useState(false);
  const [aiResultMsg, setAiResultMsg] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    category: 'Academic',
    priority: 'Low',
    description: '',
    isAnonymous: false,
    visibility: 'Authorities' // Authorities or Public
  });

  useEffect(() => {
    if (!user) return;
    
    const q = query(collection(db, 'complaints'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: Complaint[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as Complaint);
      });
      
      list.sort((a, b) => {
        const tA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : (a.createdAt?.seconds ? a.createdAt.seconds * 1000 : 0);
        const tB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : (b.createdAt?.seconds ? b.createdAt.seconds * 1000 : 0);
        return tB - tA;
      });

      let filtered = list;
      if (user.role === 'TEACHER' || user.role === 'STUDENT') {
        filtered = list.filter(c => 
          c.userId === user.id || 
          c.visibility === 'Public' ||
          !c.institutionId ||
          c.institutionId === user.institutionId ||
          (user.role === 'TEACHER' && c.visibility === 'Authorities')
        );
      }
      setComplaintsList(filtered);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching complaints:", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'complaints'), {
        ...formData,
        status: 'Pending',
        userId: user.id,
        userName: formData.isAnonymous ? 'Anonymous' : user.name,
        userRole: user.role,
        institutionId: user.institutionId || '',
        createdAt: serverTimestamp()
      });
      setShowForm(false);
      setFormData({ title: '', category: 'Academic', priority: 'Low', description: '', isAnonymous: false, visibility: 'Authorities' });
    } catch (error) {
      console.error("Error adding complaint:", error);
      alert("Failed to submit complaint.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this complaint?')) {
      try {
        await deleteDoc(doc(db, 'complaints', id));
      } catch (error) {
        console.error("Error deleting complaint:", error);
        alert("Failed to delete complaint.");
      }
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'complaints', id), { status: newStatus });
    } catch (error) {
      console.error(error);
      alert("Failed to update status.");
    }
  };

  const handleAICleanup = async () => {
    if (complaintsList.length === 0) {
      alert("No complaints available to scan.");
      return;
    }
    setIsAiCleaning(true);
    setAiResultMsg(null);
    try {
      const token = localStorage.getItem('klyro_auth_token');
      const response = await fetch('/api/ai/clean-complaints', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || ''}`
        },
        body: JSON.stringify({ complaints: complaintsList })
      });

      let invalidIds: string[] = [];
      if (response.ok) {
        const data = await response.json();
        invalidIds = data.invalidIds || [];
      } else {
        // Fallback heuristic filter
        invalidIds = complaintsList.filter(c => {
          const t = (c.title || '').trim().toLowerCase();
          const d = (c.description || '').trim().toLowerCase();
          const isUnknown = c.isAnonymous || c.userName === 'Anonymous';
          const isGibberish = t.length < 3 || d.length < 5 || /^([a-z0-9])\1+$/i.test(t) || /asdf|qwerty|1234|test test|xyz|xxx/i.test(t + ' ' + d);
          return isUnknown && isGibberish;
        }).map(c => c.id);
      }

      if (invalidIds.length > 0) {
        for (const id of invalidIds) {
          await deleteDoc(doc(db, 'complaints', id));
        }
        setAiResultMsg(`AI successfully scanned & purged ${invalidIds.length} unknown/spam complaint(s).`);
      } else {
        setAiResultMsg("AI Scan Complete: All complaints are genuine and verified.");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to execute AI cleanup.");
    } finally {
      setIsAiCleaning(false);
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Just now';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'In Progress': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Resolved': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Escalated': return 'bg-rose-50 text-rose-700 border-rose-200';
      default: return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Low': return 'text-emerald-600 bg-emerald-50';
      case 'Medium': return 'text-amber-600 bg-amber-50';
      case 'High': return 'text-orange-600 bg-orange-50';
      case 'Urgent': return 'text-rose-600 bg-rose-50';
      default: return 'text-slate-600 bg-slate-50';
    }
  };

  const filteredComplaints = complaintsList.filter(c => {
    const matchesSearch = c.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          c.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          c.userName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'All' || c.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader 
        title="Complaints & Grievances" 
        description="Submit complaints named or anonymously. Institutions can moderate and auto-clean unknown spam via AI."
        action={
          <div className="flex flex-wrap items-center gap-3">
            {['INSTITUTION', 'SUPER_ADMIN'].includes(user?.role || '') && (
              <button 
                onClick={handleAICleanup}
                disabled={isAiCleaning}
                className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-2.5 rounded-xl font-medium hover:opacity-90 transition shadow-sm"
              >
                {isAiCleaning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                AI Clean Unknown Complaints
              </button>
            )}
            {['STUDENT', 'TEACHER', 'INSTITUTION'].includes(user?.role || '') && (
              <button 
                onClick={() => setShowForm(!showForm)}
                className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-indigo-700 transition shadow-sm"
              >
                {showForm ? 'Cancel' : <><Plus className="w-5 h-5" /> New Complaint</>}
              </button>
            )}
          </div>
        }
      />

      {aiResultMsg && (
        <div className="mb-6 p-4 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-900 flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-indigo-600 shrink-0" />
            <span className="text-sm font-medium">{aiResultMsg}</span>
          </div>
          <button onClick={() => setAiResultMsg(null)} className="text-xs font-bold text-indigo-700 hover:underline">Dismiss</button>
        </div>
      )}

      {showForm ? (
        <div className="bg-white rounded-2xl p-6 md:p-8 border border-slate-100 shadow-sm mb-8 animate-in slide-in-from-bottom-4 fade-in duration-300">
          <h2 className="text-xl font-bold text-slate-900 mb-6">File a Complaint</h2>
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">Title / Subject</label>
                <input 
                  type="text" 
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all outline-none" 
                  placeholder="State the problem clearly..." 
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Category</label>
                <select 
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all outline-none bg-white"
                >
                  <option>Academic</option>
                  <option>Teacher</option>
                  <option>Student</option>
                  <option>Facilities</option>
                  <option>IT Support</option>
                  <option>Transport</option>
                  <option>Fees</option>
                  <option>Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Priority</label>
                <select 
                  value={formData.priority}
                  onChange={(e) => setFormData({...formData, priority: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all outline-none bg-white"
                >
                  <option>Low</option>
                  <option>Medium</option>
                  <option>High</option>
                  <option>Urgent</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Share With</label>
                <select 
                  value={formData.visibility}
                  onChange={(e) => setFormData({...formData, visibility: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all outline-none bg-white"
                >
                  <option value="Authorities">Selected Authorities Only</option>
                  <option value="Public">Public (Visible to All)</option>
                </select>
              </div>

              <div className="flex items-center gap-3 pt-6">
                <input 
                  type="checkbox" 
                  id="isAnonymous"
                  checked={formData.isAnonymous}
                  onChange={(e) => setFormData({...formData, isAnonymous: e.target.checked})}
                  className="w-5 h-5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-600 cursor-pointer"
                />
                <label htmlFor="isAnonymous" className="text-sm font-semibold text-slate-700 cursor-pointer flex items-center gap-1.5">
                  <UserX className="w-4 h-4 text-slate-500" /> Keep Complaint Anonymous (Hide Name)
                </label>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">Detailed Description</label>
                <textarea 
                  required
                  rows={4} 
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all outline-none resize-none" 
                  placeholder="Provide full details regarding the incident or request..."
                ></textarea>
              </div>
            </div>

            <div className="flex justify-end gap-4 pt-4 border-t border-slate-100">
              <button type="button" onClick={() => setShowForm(false)} className="px-6 py-2.5 border border-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-50 transition">
                Cancel
              </button>
              <button type="submit" disabled={isSubmitting} className="px-6 py-2.5 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition flex items-center gap-2">
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                Submit Complaint
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row gap-4 justify-between items-center bg-slate-50/50">
            <div className="relative w-full sm:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input 
                type="text" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search complaints..." 
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-600 outline-none text-sm"
              />
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <select 
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-medium text-sm outline-none"
              >
                <option value="All">All Categories</option>
                <option value="Academic">Academic</option>
                <option value="Teacher">Teacher</option>
                <option value="Student">Student</option>
                <option value="Facilities">Facilities</option>
                <option value="IT Support">IT Support</option>
              </select>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="p-12 flex justify-center text-indigo-600">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-100">
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Details</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Target</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredComplaints.map((complaint) => (
                    <tr key={complaint.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4 min-w-[320px]">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-bold text-slate-900">{complaint.title}</p>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${getPriorityColor(complaint.priority)}`}>
                            {complaint.priority}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mb-2 line-clamp-2">{complaint.description}</p>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {formatDate(complaint.createdAt)}</span>
                          <span className="font-semibold text-indigo-600 flex items-center gap-1">
                            {complaint.isAnonymous ? <><UserX className="w-3.5 h-3.5 text-amber-500" /> Anonymous</> : `By ${complaint.userName}`}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="space-y-1">
                          <span className="text-xs font-medium text-slate-600 block">{complaint.category}</span>
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                            {complaint.visibility === 'Public' ? <><Globe className="w-3 h-3 text-blue-500" /> Public</> : <><Shield className="w-3 h-3 text-purple-500" /> Authorities</>}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {['INSTITUTION', 'SUPER_ADMIN'].includes(user?.role || '') ? (
                          <select 
                            value={complaint.status}
                            onChange={(e) => handleUpdateStatus(complaint.id, e.target.value)}
                            className={`px-3 py-1 text-xs font-bold rounded-full border outline-none cursor-pointer ${getStatusColor(complaint.status)}`}
                          >
                            <option value="Pending">Pending</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Resolved">Resolved</option>
                            <option value="Escalated">Escalated</option>
                          </select>
                        ) : (
                          <span className={`px-3 py-1 text-xs font-bold rounded-full border ${getStatusColor(complaint.status)}`}>
                            {complaint.status}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end items-center gap-3">
                          {['SUPER_ADMIN', 'INSTITUTION'].includes(user?.role || '') && (
                            <button 
                              onClick={() => handleDelete(complaint.id)}
                              className="text-rose-600 hover:text-rose-900 p-1.5 rounded-lg hover:bg-rose-50 transition"
                              title="Delete Complaint"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredComplaints.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                        No complaints found matching your filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
