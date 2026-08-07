import React, { useState, useEffect } from 'react';
import { PageHeader } from '../../components/ui';
import { Calendar as CalendarIcon, Plus, Loader2, MapPin, Clock, Image as ImageIcon } from 'lucide-react';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, where } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import { compressImageFile } from '../../lib/imageUtils';
import { Trash2 } from 'lucide-react';

type EventData = {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  createdBy: string;
  creatorName: string;
  photoUrl?: string;
  createdAt: any;
};

export default function Events({ hideHeader }: { hideHeader?: boolean }) {
  const { user } = useAuth();
  const [events, setEvents] = useState<EventData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    location: '',
    photoUrl: ''
  });

  const canAddEvents = user?.role === 'INSTITUTION' || user?.role === 'TEACHER';

  useEffect(() => {
    if (!user?.institutionId && user?.role !== 'SUPER_ADMIN') return;
    
    // For this demo, let's just get all events for the institution
    const constraints: any[] = [];
    if (user?.institutionId) {
      constraints.push(where('institutionId', '==', user.institutionId));
    }
    constraints.push(orderBy('date', 'asc'));
    
    const q = query(collection(db, 'events'), ...constraints);
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: EventData[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as EventData);
      });
      setEvents(list);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching events:", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const base64 = await compressImageFile(file);
      setFormData(prev => ({ ...prev, photoUrl: base64 }));
    } catch (err) {
      console.error("Error compressing image:", err);
      alert("Failed to compress image.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.institutionId || !canAddEvents) return;
    
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'events'), {
        ...formData,
        institutionId: user.institutionId,
        createdBy: user.id,
        creatorName: user.name,
        createdAt: serverTimestamp()
      });
      
      setShowForm(false);
      setFormData({ title: '', description: '', date: '', time: '', location: '', photoUrl: '' });
      alert("Event added successfully.");
    } catch (error) {
      console.error("Error adding event:", error);
      alert("Failed to submit event. Please check console for details.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      {!hideHeader && (
        <PageHeader 
          title="Events & Announcements" 
          description="Stay updated with the latest events"
          action={
            canAddEvents ? (
              <button 
                onClick={() => setShowForm(!showForm)}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
              >
                <Plus className="w-5 h-5" />
                Add Event
              </button>
            ) : undefined
          }
        />
      )}

      {hideHeader && canAddEvents && (
        <div className="flex justify-end mb-6">
          <button 
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
          >
            <Plus className="w-5 h-5" />
            Add Event
          </button>
        </div>
      )}

      {showForm && canAddEvents && (
        <div className="bg-white rounded-2xl p-6 md:p-8 border border-slate-100 shadow-sm mb-8 animate-in slide-in-from-bottom-4 fade-in duration-300">
          <h2 className="text-xl font-bold text-slate-900 mb-6">Create New Event</h2>
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">Event Title</label>
                <input 
                  type="text" 
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all outline-none" 
                  placeholder="e.g. Annual Science Fair" 
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
                <label className="block text-sm font-medium text-slate-700 mb-2">Time</label>
                <input 
                  type="time" 
                  required
                  value={formData.time}
                  onChange={(e) => setFormData({...formData, time: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all outline-none" 
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">Location</label>
                <input 
                  type="text" 
                  required
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all outline-none" 
                  placeholder="e.g. Main Auditorium" 
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
                <textarea 
                  required
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all outline-none resize-none" 
                  placeholder="Event details..." 
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">Photo / Image (Optional)</label>
                <div className="flex gap-3">
                  <div className="flex-1 relative">
                    <label className="flex items-center gap-2 px-4 py-3 rounded-xl border border-dashed border-slate-300 hover:bg-slate-50 cursor-pointer transition w-full">
                      <ImageIcon className="h-5 w-5 text-slate-400" />
                      <span className="text-sm text-slate-600 flex-1 truncate">
                        {formData.photoUrl ? 'Image Selected' : 'Upload an image...'}
                      </span>
                      <input 
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        className="hidden" 
                      />
                    </label>
                  </div>
                  {formData.photoUrl && (
                    <button 
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, photoUrl: '' }))}
                      className="px-3 py-2 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-100 transition"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button type="button" onClick={() => setShowForm(false)} className="px-6 py-2.5 border border-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-50 transition">
                Cancel
              </button>
              <button type="submit" disabled={isSubmitting} className="px-6 py-2.5 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition flex items-center gap-2">
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                Create Event
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full py-12 flex justify-center">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          </div>
        ) : events.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-500 bg-white rounded-2xl border border-slate-100">
            No events upcoming.
          </div>
        ) : events.map((event) => (
          <div key={event.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col h-full">
            <h3 className="text-lg font-bold text-slate-900 mb-2">{event.title}</h3>
            <p className="text-slate-600 text-sm mb-4 flex-1">{event.description}</p>
            {event.photoUrl && (
              <div className="mb-4 rounded-xl overflow-hidden border border-slate-100">
                <img src={event.photoUrl} alt="Event" className="w-full h-48 object-cover" />
              </div>
            )}
            
            <div className="space-y-3 pt-4 border-t border-slate-100">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <CalendarIcon className="w-4 h-4 text-indigo-500" />
                <span>{new Date(event.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Clock className="w-4 h-4 text-indigo-500" />
                <span>{event.time}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <MapPin className="w-4 h-4 text-indigo-500" />
                <span>{event.location}</span>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-slate-50 text-xs text-slate-400">
              Added by {event.creatorName}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
