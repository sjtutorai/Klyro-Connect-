import React, { useState, useEffect } from 'react';
import { PageHeader } from '../../components/ui';
import { MessageSquareWarning, Plus, Search, Filter, AlertCircle, Clock, CheckCircle2, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, where } from 'firebase/firestore';
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
};

export default function Complaints() {
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [complaintsList, setComplaintsList] = useState<Complaint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    category: 'Academic',
    priority: 'Low',
    description: ''
  });

  useEffect(() => {
    if (!user) return;

    let q = query(collection(db, 'complaints'), orderBy('createdAt', 'desc'));
    
    // If student or teacher, only show their own complaints
    if (['STUDENT', 'TEACHER'].includes(user.role)) {
      q = query(collection(db, 'complaints'), where('userId', '==', user.id), orderBy('createdAt', 'desc'));
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: Complaint[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as Complaint);
      });
      setComplaintsList(list);
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
        userName: user.name,
        createdAt: serverTimestamp()
      });
      setShowForm(false);
      setFormData({ title: '', category: 'Academic', priority: 'Low', description: '' });
    } catch (error) {
      console.error("Error adding complaint:", error);
      alert("Failed to submit complaint.");
    } finally {
      setIsSubmitting(false);
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

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader 
        title="Complaints & Requests" 
        description="Manage, track, and resolve campus issues."
        action={
          ['STUDENT', 'TEACHER'].includes(user?.role || '') && (
            <button 
              onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-indigo-700 transition shadow-sm"
            >
              {showForm ? 'Cancel' : <><Plus className="w-5 h-5" /> New Complaint</>}
            </button>
          )
        }
      />

      {showForm ? (
        <div className="bg-white rounded-2xl p-6 md:p-8 border border-slate-100 shadow-sm mb-8 animate-in slide-in-from-bottom-4 fade-in duration-300">
          <h2 className="text-xl font-bold text-slate-900 mb-6">Submit a New Complaint</h2>
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">Title</label>
                <input 
                  type="text" 
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all outline-none" 
                  placeholder="Briefly describe the issue..." 
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

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
                <textarea 
                  required
                  rows={4} 
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all outline-none resize-none" 
                  placeholder="Provide more details..."
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
                placeholder="Search complaints..." 
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-600 outline-none text-sm"
              />
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-medium text-sm hover:bg-slate-50 w-full sm:w-auto">
                <Filter className="w-4 h-4" /> Filter
              </button>
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
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">ID</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Details</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Category</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {complaintsList.map((complaint) => (
                    <tr key={complaint.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-slate-900">{complaint.id.slice(0,6)}...</span>
                      </td>
                      <td className="px-6 py-4 min-w-[300px]">
                        <p className="text-sm font-bold text-slate-900 mb-1">{complaint.title}</p>
                        <div className="flex items-center gap-3 text-xs text-slate-500">
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {formatDate(complaint.createdAt)}</span>
                          <span className={`px-2 py-0.5 rounded-md font-semibold ${getPriorityColor(complaint.priority)}`}>
                            {complaint.priority}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-slate-600">{complaint.category}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 text-xs font-bold rounded-full border ${getStatusColor(complaint.status)}`}>
                          {complaint.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button className="text-indigo-600 hover:text-indigo-900">View</button>
                      </td>
                    </tr>
                  ))}
                  {complaintsList.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                        No complaints found.
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
