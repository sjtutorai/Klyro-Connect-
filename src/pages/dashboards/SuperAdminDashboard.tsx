import React, { useState, useEffect } from 'react';
import { PageHeader, StatCard, Card, Badge } from '../../components/ui';
import { Building2, Users, FileBarChart, Loader2, CheckCircle2, XCircle, ShieldCheck, Sparkles, TrendingUp, Layers } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useFirestoreStats } from '../../lib/useFirestoreStats';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
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
      const finalCode = req.code || req.schoolCode || `INST-${Math.floor(10000 + Math.random() * 90000)}`;

      if (newStatus === 'Active') {
        if (!req.email || !req.password) {
           alert('Institution is missing email or password');
           return;
        }
        
        const { initializeApp } = await import('firebase/app');
        const { getAuth, createUserWithEmailAndPassword, signOut } = await import('firebase/auth');
        const { setDoc } = await import('firebase/firestore');
        const { app } = await import('../../lib/firebase');
        
        const secondaryApp = initializeApp(app.options, "SecondaryApp" + Date.now());
        const secondaryAuth = getAuth(secondaryApp);
        
        const userCred = await createUserWithEmailAndPassword(secondaryAuth, req.email, req.password);
        
        await setDoc(doc(db, 'users', userCred.user.uid), {
          email: req.email,
          name: req.name,
          role: 'INSTITUTION',
          institutionId: req.id,
          status: 'Active',
          schoolCode: finalCode,
          institutionCode: finalCode
        });
        
        await signOut(secondaryAuth);
      }
      
      const docRef = doc(db, 'institutions', req.id);
      await updateDoc(docRef, {
        status: newStatus,
        code: finalCode,
        schoolCode: finalCode
      });
      alert(`✅ Institution request ${newStatus.toLowerCase()} successfully. Permanent Institution Code: ${finalCode}`);
    } catch (error) {
      console.error(`Error updating institution status to ${newStatus}:`, error);
      alert('Failed to update status. See console for details.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <PageHeader 
        title={`Welcome back, ${user?.name || 'Administrator'}`} 
        description="Global platform overview, active school networks, and institution onboarding moderation."
        badge="Super Admin Console"
        breadcrumbs={[{ label: 'Platform' }, { label: 'Super Admin Overview' }]}
      />

      {/* Hero Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <StatCard 
          title="Total Onboarded Institutions" 
          value={stats.institutions} 
          icon={<Building2 className="w-6 h-6" />} 
          trend={{ value: '12% MoM', positive: true }} 
          gradient="from-indigo-500 to-indigo-600"
          description="Active registered campus hubs"
        />
        <StatCard 
          title="Registered Faculty Members" 
          value={stats.teachers} 
          icon={<Users className="w-6 h-6" />} 
          trend={{ value: '8% MoM', positive: true }} 
          gradient="from-purple-500 to-purple-600"
          description="Verified teachers & staff"
        />
        <StatCard 
          title="Active Enrolled Students" 
          value={stats.students} 
          icon={<Users className="w-6 h-6" />} 
          trend={{ value: '15% MoM', positive: true }} 
          gradient="from-emerald-500 to-emerald-600"
          description="Enrolled student profiles"
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        
        {/* Growth Analytics Chart */}
        <Card className="lg:col-span-2 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-indigo-500" /> Platform Expansion & Growth
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Monthly student vs institution onboarding growth trend</p>
            </div>
            <Badge variant="primary" dot>Live Metrics</Badge>
          </div>

          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.2)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <Tooltip 
                  cursor={{ fill: 'rgba(99, 102, 241, 0.05)' }} 
                  contentStyle={{ 
                    borderRadius: '16px', 
                    border: '1px solid rgba(148, 163, 184, 0.2)', 
                    backgroundColor: '#0f172a',
                    color: '#fff',
                    boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.3)' 
                  }} 
                />
                <Bar dataKey="students" fill="#6366f1" radius={[6, 6, 0, 0]} name="Students" />
                <Bar dataKey="institutions" fill="#c084fc" radius={[6, 6, 0, 0]} name="Institutions" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Pending Approval Requests Column */}
        <Card className="flex flex-col">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-purple-500" /> Pending Approvals
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">School registration queue</p>
            </div>
            <Badge variant="warning">{pendingRequests.length} Pending</Badge>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto max-h-[380px] pr-1">
            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
              </div>
            ) : pendingRequests.length === 0 ? (
              <div className="text-center py-12 px-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">All Queue Cleared</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">No pending school registration requests.</p>
              </div>
            ) : (
              pendingRequests.map((req) => (
                <div key={req.id} className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 transition-all space-y-3">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">{req.name}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{req.email}</p>
                    {req.address && <p className="text-[11px] text-slate-400 truncate mt-0.5">{req.address}</p>}
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <button 
                      onClick={() => handleUpdateStatus(req, 'Active')}
                      className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-1 shadow-sm"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                    </button>
                    <button 
                      onClick={() => handleUpdateStatus(req, 'Rejected')}
                      className="flex-1 py-2 bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1 border border-rose-200/60 dark:border-rose-800/60"
                    >
                      <XCircle className="w-3.5 h-3.5" /> Reject
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

      </div>
    </div>
  );
}
