import React, { useState, useEffect } from 'react';
import { PageHeader, ConfirmModal, Card, Button, Badge } from '../../components/ui';
import { Building2, Plus, Search, MapPin, Mail, Phone, MoreVertical, Loader2, Trash2, Edit, Lock, ShieldCheck } from 'lucide-react';
import { collection, query, onSnapshot, deleteDoc, doc, where, getDocs, addDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';

type Institution = {
  id: string;
  name: string;
  address: string;
  email: string;
  phone: string;
  password?: string;
  status: string;
  studentsCount: number;
  teachersCount: number;
  createdAt: any;
};

export default function Institutions() {
  const { user } = useAuth();
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [deleteInstId, setDeleteInstId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    email: '',
    phone: '',
    password: ''
  });

  useEffect(() => {
    const handleClickOutside = () => setActiveDropdown(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const confirmDelete = async () => {
    if (!deleteInstId) return;
    const targetId = deleteInstId;
    setInstitutions(prev => prev.filter(i => i.id !== targetId));
    setDeleteInstId(null);
    try {
      await deleteDoc(doc(db, 'institutions', targetId));
      const q = query(collection(db, 'users'), where('institutionId', '==', targetId));
      const snapshot = await getDocs(q);
      snapshot.forEach(async (docSnap) => {
        await deleteDoc(docSnap.ref);
      });
    } catch (error: any) {
      console.error("Error deleting institution:", error);
      alert(`Failed to delete institution: ${error.message}`);
    }
  };

  useEffect(() => {
    const q = query(collection(db, 'institutions'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: Institution[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as Institution);
      });
      list.sort((a, b) => {
        const timeA = a.createdAt?.seconds || 0;
        const timeB = b.createdAt?.seconds || 0;
        return timeB - timeA;
      });
      setInstitutions(list);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching institutions:", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setIsSubmitting(true);
    try {
      if (!formData.email || !formData.password) {
        alert("Email and password are required.");
        setIsSubmitting(false);
        return;
      }
      if (formData.password.length < 6) {
        alert('Password must be at least 6 characters long.');
        setIsSubmitting(false);
        return;
      }
      
      const { initializeApp } = await import('firebase/app');
      const { getAuth, createUserWithEmailAndPassword, signOut } = await import('firebase/auth');
      const { setDoc } = await import('firebase/firestore');
      const { app } = await import('../../lib/firebase');
      
      const secondaryApp = initializeApp(app.options, "SecondaryApp" + Date.now());
      const secondaryAuth = getAuth(secondaryApp);
      
      const userCred = await createUserWithEmailAndPassword(secondaryAuth, formData.email, formData.password);
      
      const docRef = await addDoc(collection(db, 'institutions'), {
        ...formData,
        status: 'Active',
        studentsCount: 0,
        teachersCount: 0,
        createdBy: user.id,
        createdAt: serverTimestamp()
      });
      
      await setDoc(doc(db, 'users', userCred.user.uid), {
        email: formData.email,
        name: formData.name,
        role: 'INSTITUTION',
        institutionId: docRef.id
      });
      
      await signOut(secondaryAuth);
      
      setShowForm(false);
      setFormData({ name: '', address: '', email: '', phone: '', password: '' });
      alert("Institution registered successfully.");
    } catch (error) {
      console.error("Error adding institution:", error);
      alert("Failed to submit institution. Please check console for details.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredInstitutions = institutions.filter(i => 
    i.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    i.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    i.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <PageHeader 
        title="Registered Institutions" 
        description="Comprehensive management of registered campus networks, admin accounts, and status controls."
        badge="Super Admin"
        breadcrumbs={[{ label: 'Super Admin' }, { label: 'Institutions' }]}
        action={
          <Button 
            onClick={() => setShowForm(!showForm)}
            icon={<Plus className="w-4 h-4" />}
          >
            Register Institution
          </Button>
        }
      />

      {showForm && (
        <Card className="animate-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-3 pb-4 mb-6 border-b border-slate-100 dark:border-slate-800">
            <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Register New Institution</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Provision admin credentials and campus profile</p>
            </div>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="grid md:grid-cols-2 gap-5">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">Institution Name</label>
                <input 
                  type="text" 
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:border-indigo-500 text-sm outline-none transition" 
                  placeholder="e.g. Springfield High School" 
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">Address</label>
                <input 
                  type="text" 
                  required
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:border-indigo-500 text-sm outline-none transition" 
                  placeholder="Full street address..." 
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">Contact Email</label>
                <input 
                  type="email" 
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:border-indigo-500 text-sm outline-none transition" 
                  placeholder="admin@school.com" 
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">Phone Number</label>
                <input 
                  type="tel" 
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:border-indigo-500 text-sm outline-none transition" 
                  placeholder="+1 (555) 000-0000" 
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">Account Password</label>
                <input 
                  type="password"
                  minLength={6} 
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:border-indigo-500 text-sm outline-none transition" 
                  placeholder="Create a password (min 6 chars)" 
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
              <Button type="submit" isLoading={isSubmitting}>
                Submit Registration
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Institutions Table Card */}
      <Card className="p-0 overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="relative w-full sm:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filter institutions by name, email, location..." 
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-800 rounded-xl text-xs font-medium text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:border-indigo-500 transition"
            />
          </div>
          <Badge variant="neutral">{filteredInstitutions.length} Total Networks</Badge>
        </div>

        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-12 flex justify-center text-indigo-600">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Institution</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Contact Info</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Users Roster</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredInstitutions.map((inst) => (
                  <tr key={inst.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-sm shrink-0">
                          {inst.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900 dark:text-white">{inst.name}</p>
                          <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                            <span className="truncate max-w-xs">{inst.address}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1 text-xs text-slate-600 dark:text-slate-300">
                        <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-slate-400" /> {inst.email}</span>
                        <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-slate-400" /> {inst.phone}</span>
                        <span className="flex items-center gap-1.5 font-mono text-[11px] text-slate-400"><Lock className="w-3 h-3 text-slate-400" /> {inst.password || '******'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col text-xs">
                        <span className="font-bold text-slate-900 dark:text-white">{inst.studentsCount || 0} Students</span>
                        <span className="text-slate-500 dark:text-slate-400">{inst.teachersCount || 0} Teachers</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge 
                        variant={
                          inst.status === 'Active' ? 'success' :
                          inst.status === 'Pending' ? 'warning' : 'danger'
                        }
                        dot
                      >
                        {inst.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium relative">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveDropdown(activeDropdown === inst.id ? null : inst.id);
                        }}
                        className="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                      >
                        <MoreVertical className="w-5 h-5" />
                      </button>
                      
                      {activeDropdown === inst.id && (
                        <div className="absolute right-6 top-12 w-44 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden z-20 space-y-1 p-1">
                          <button 
                            className="w-full px-3.5 py-2 text-left text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl flex items-center gap-2 transition"
                            onClick={async (e) => {
                              e.stopPropagation();
                              setActiveDropdown(null);
                              try {
                                await updateDoc(doc(db, 'institutions', inst.id), {
                                  status: inst.status === 'Active' ? 'Suspended' : 'Active'
                                });
                              } catch (err) {
                                console.error(err);
                              }
                            }}
                          >
                            <Edit className="w-3.5 h-3.5 text-indigo-500" /> {inst.status === 'Active' ? 'Suspend Access' : 'Activate School'}
                          </button>
                          <button 
                            className="w-full px-3.5 py-2 text-left text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-xl flex items-center gap-2 transition"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveDropdown(null);
                              setDeleteInstId(inst.id);
                            }}
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Delete Institution
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {filteredInstitutions.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400 text-sm">
                      No matching institutions found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </Card>

      <ConfirmModal
        isOpen={!!deleteInstId}
        title="Delete Institution"
        message="Are you sure you want to delete this institution? All linked accounts and data will be permanently removed."
        onConfirm={confirmDelete}
        onCancel={() => setDeleteInstId(null)}
      />
    </div>
  );
}
