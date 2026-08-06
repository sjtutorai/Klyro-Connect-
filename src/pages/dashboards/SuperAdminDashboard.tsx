import React, { useState, useEffect } from 'react';
import { PageHeader, StatCard } from '../../components/ui';
import { Building2, Users, FileBarChart, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useFirestoreStats } from '../../lib/useFirestoreStats';
import { collection, query, where, onSnapshot, doc, updateDoc, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';

const data = [
  { name: 'Jan', institutions: 40, students: 2400 },
  { name: 'Feb', institutions: 55, students: 3500 },
  { name: 'Mar', institutions: 70, students: 5000 },
  { name: 'Apr', institutions: 90, students: 7800 },
  { name: 'May', institutions: 105, students: 9200 },
  { name: 'Jun', institutions: 124, students: 11000 },
];

export default function SuperAdminDashboard() {
  const { user } = useAuth();
  const stats = useFirestoreStats();
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, 'institutions'), 
      where('status', '==', 'Pending')
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const requests: any[] = [];
      snapshot.forEach((doc) => {
        requests.push({ id: doc.id, ...doc.data() });
      });
      // Sort in memory by createdAt descending
      requests.sort((a, b) => {
        const timeA = a.createdAt?.toMillis() || 0;
        const timeB = b.createdAt?.toMillis() || 0;
        return timeB - timeA;
      });
      
      setPendingRequests(requests);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching pending requests:", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleUpdateStatus = async (req: any, newStatus: string) => {
    try {
      if (newStatus === 'Active') {
        if (!req.email || !req.password) {
           alert('Institution is missing email or password');
           return;
        }
        
        // Use a dynamic import or directly import firebase config to create secondary app
        const { initializeApp } = await import('firebase/app');
        const { getAuth, createUserWithEmailAndPassword, signOut } = await import('firebase/auth');
        const { setDoc } = await import('firebase/firestore');
        const { app } = await import('../../lib/firebase');
        
        // Create secondary app to avoid signing out the current admin
        const secondaryApp = initializeApp(app.options, "SecondaryApp" + Date.now());
        const secondaryAuth = getAuth(secondaryApp);
        
        const userCred = await createUserWithEmailAndPassword(secondaryAuth, req.email, req.password);
        
        // Create user doc
        await setDoc(doc(db, 'users', userCred.user.uid), {
          email: req.email,
          name: req.name,
          role: 'INSTITUTION',
          institutionId: req.id
        });
        
        await signOut(secondaryAuth);
      }
      
      const docRef = doc(db, 'institutions', req.id);
      await updateDoc(docRef, {
        status: newStatus
      });
      alert(`Institution ${newStatus.toLowerCase()} successfully.`);
    } catch (error) {
      console.error(`Error updating institution status to ${newStatus}:`, error);
      alert('Failed to update status. See console for details.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader 
        title={`Welcome back, ${user?.name}`} 
        description="Here is what's happening on your platform today." 
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        <StatCard title="Total Institutions" value={stats.institutions} icon={<Building2 className="w-6 h-6" />} trend={{ value: '12%', positive: true }} />
        <StatCard title="Total Teachers" value={stats.teachers} icon={<Users className="w-6 h-6" />} trend={{ value: '8%', positive: true }} />
        <StatCard title="Total Students" value={stats.students} icon={<Users className="w-6 h-6" />} trend={{ value: '15%', positive: true }} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-6">Platform Growth</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6b7280' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280' }} />
                <Tooltip cursor={{ fill: '#f9fafb' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="students" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                <Bar dataKey="institutions" fill="#e0e7ff" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-6">Pending Approvals</h3>
          <div className="space-y-4 max-h-80 overflow-y-auto pr-2">
            {isLoading ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
              </div>
            ) : pendingRequests.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <p>No pending approvals at this time.</p>
              </div>
            ) : (
              pendingRequests.map((req) => (
                <div key={req.id} className="flex flex-col p-4 rounded-xl border border-slate-50 bg-slate-50 hover:bg-white hover:border-slate-200 transition-colors gap-3">
                  <div>
                    <div className="font-medium text-slate-900">{req.name}</div>
                    <div className="text-sm text-slate-500 truncate">{req.email}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleUpdateStatus(req, 'Active')}
                      className="flex-1 py-1.5 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-1"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Approve
                    </button>
                    <button 
                      onClick={() => handleUpdateStatus(req, 'Rejected')}
                      className="flex-1 py-1.5 bg-rose-100 text-rose-700 hover:bg-rose-200 text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-1"
                    >
                      <XCircle className="w-4 h-4" /> Reject
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
