import React, { useState, useEffect } from 'react';
import { PageHeader, Card, Button, Badge } from '../../components/ui';
import { UserCheck, CheckCircle2, XCircle, Clock, Search, Filter, Mail, Users, GraduationCap, Building2, Shield, Loader2, Sparkles, AlertCircle } from 'lucide-react';
import { collection, query, where, onSnapshot, doc, updateDoc, serverTimestamp, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';

type RegistrationRequest = {
  id: string;
  uid: string;
  name: string;
  email: string;
  role: 'TEACHER' | 'STUDENT';
  institutionId: string;
  institutionName: string;
  classId?: string;
  className?: string;
  subject?: string;
  institutionCode?: string;
  classCode?: string;
  status: 'Pending' | 'Approved' | 'Declined';
  createdAt?: any;
};

export default function RegistrationRequests() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<RegistrationRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'All' | 'Pending' | 'Approved' | 'Declined'>('Pending');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'TEACHER' | 'STUDENT'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    let q;
    const targetInstId = user.institutionId || (user.role === 'INSTITUTION' ? user.id : null);

    if (user.role === 'SUPER_ADMIN' || !targetInstId) {
      q = query(collection(db, 'registration_requests'));
    } else {
      q = query(collection(db, 'registration_requests'), where('institutionId', '==', targetInstId));
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: RegistrationRequest[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() } as RegistrationRequest);
      });

      // Sort newest first
      list.sort((a, b) => {
        const timeA = a.createdAt?.seconds || 0;
        const timeB = b.createdAt?.seconds || 0;
        return timeB - timeA;
      });

      setRequests(list);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching registration requests:", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // Handle Accept
  const handleAccept = async (req: RegistrationRequest) => {
    setProcessingId(req.id);
    try {
      // 1. Update Request Doc
      await updateDoc(doc(db, 'registration_requests', req.id), {
        status: 'Approved',
        processedAt: serverTimestamp(),
        processedBy: user?.name || 'Institution Admin'
      });

      // 2. Update User Account Doc
      if (req.uid) {
        await updateDoc(doc(db, 'users', req.uid), {
          status: 'Active'
        });
      } else {
        // Fallback: search user by email
        const userQ = query(collection(db, 'users'), where('email', '==', req.email));
        const userSnap = await getDocs(userQ);
        userSnap.forEach(async (uDoc) => {
          await updateDoc(doc(db, 'users', uDoc.id), { status: 'Active' });
        });
      }

      alert(`✅ Application accepted! ${req.name} (${req.role}) is now approved and active on Campus.`);
    } catch (error: any) {
      console.error("Error accepting request:", error);
      alert("Failed to accept application. Please try again.");
    } finally {
      setProcessingId(null);
    }
  };

  // Handle Decline
  const handleDecline = async (req: RegistrationRequest) => {
    if (!confirm(`Are you sure you want to decline the sign-up request for ${req.name}?`)) return;

    setProcessingId(req.id);
    try {
      // 1. Update Request Doc
      await updateDoc(doc(db, 'registration_requests', req.id), {
        status: 'Declined',
        processedAt: serverTimestamp(),
        processedBy: user?.name || 'Institution Admin'
      });

      // 2. Update User Account Doc
      if (req.uid) {
        await updateDoc(doc(db, 'users', req.uid), {
          status: 'Rejected'
        });
      } else {
        const userQ = query(collection(db, 'users'), where('email', '==', req.email));
        const userSnap = await getDocs(userQ);
        userSnap.forEach(async (uDoc) => {
          await updateDoc(doc(db, 'users', uDoc.id), { status: 'Rejected' });
        });
      }

      alert(`❌ Application for ${req.name} has been declined.`);
    } catch (error: any) {
      console.error("Error declining request:", error);
      alert("Failed to decline application. Please try again.");
    } finally {
      setProcessingId(null);
    }
  };

  const pendingCount = requests.filter(r => r.status === 'Pending').length;
  const approvedCount = requests.filter(r => r.status === 'Approved').length;
  const declinedCount = requests.filter(r => r.status === 'Declined').length;

  const filteredRequests = requests.filter(r => {
    const matchesTab = activeTab === 'All' || r.status === activeTab;
    const matchesRole = roleFilter === 'ALL' || r.role === roleFilter;
    const matchesSearch = searchTerm === '' || 
      r.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      r.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.className && r.className.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (r.subject && r.subject.toLowerCase().includes(searchTerm.toLowerCase()));

    return matchesTab && matchesRole && matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <PageHeader
        title="Registration Applications"
        description="Review, verify, and accept or decline incoming teacher and student sign-up requests for your institution."
        badge="Governance Portal"
        breadcrumbs={[{ label: 'Institution' }, { label: 'Applications & Approvals' }]}
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-5">
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Total Applications</span>
            <div className="p-2 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <UserCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">{requests.length}</div>
        </div>

        <div className="bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">Pending Review</span>
            <div className="p-2 bg-amber-500 text-white rounded-xl shadow-sm">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-950 dark:text-amber-200 mt-2">{pendingCount}</div>
        </div>

        <div className="bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">Accepted & Active</span>
            <div className="p-2 bg-emerald-500 text-white rounded-xl shadow-sm">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-950 dark:text-emerald-200 mt-2">{approvedCount}</div>
        </div>

        <div className="bg-rose-50/80 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400">Declined</span>
            <div className="p-2 bg-rose-500 text-white rounded-xl shadow-sm">
              <XCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-rose-950 dark:text-rose-200 mt-2">{declinedCount}</div>
        </div>
      </div>

      {/* Filters & Control Bar */}
      <Card className="space-y-4">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-xl w-full md:w-auto">
            {(['All', 'Pending', 'Approved', 'Declined'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  activeTab === tab
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {tab}
                {tab === 'Pending' && pendingCount > 0 && (
                  <span className="ml-1.5 px-1.5 py-0.5 text-[10px] bg-amber-500 text-white rounded-full font-bold">
                    {pendingCount}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            {/* Role filter */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              <button
                onClick={() => setRoleFilter('ALL')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${roleFilter === 'ALL' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400'}`}
              >
                All Roles
              </button>
              <button
                onClick={() => setRoleFilter('TEACHER')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${roleFilter === 'TEACHER' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400'}`}
              >
                Teachers
              </button>
              <button
                onClick={() => setRoleFilter('STUDENT')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${roleFilter === 'STUDENT' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400'}`}
              >
                Students
              </button>
            </div>

            {/* Search */}
            <div className="relative flex-1 md:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search name, email, class..."
                className="w-full pl-9 pr-4 py-2 bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-indigo-500 rounded-xl text-xs font-medium text-slate-900 dark:text-white outline-none"
              />
            </div>
          </div>
        </div>

        {/* Requests Roster List */}
        {isLoading ? (
          <div className="py-16 text-center text-slate-400 flex flex-col items-center gap-3">
            <Loader2 className="w-7 h-7 animate-spin text-indigo-500" />
            <p className="text-xs font-semibold">Loading registration applications...</p>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
              <UserCheck className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">No applications match filter</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {activeTab === 'Pending' 
                ? 'Great news! There are currently no pending registration requests waiting for approval.' 
                : 'No registration requests were found under this category.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredRequests.map((req) => {
              const isPending = req.status === 'Pending';
              const isApproved = req.status === 'Approved';
              const isDeclined = req.status === 'Declined';
              const isBusy = processingId === req.id;

              return (
                <div
                  key={req.id}
                  className="p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-300 dark:hover:border-indigo-700 transition flex flex-col md:flex-row md:items-center justify-between gap-5 shadow-xs"
                >
                  {/* Left: Applicant details */}
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-base shrink-0 shadow-xs ${
                      req.role === 'TEACHER' 
                        ? 'bg-gradient-to-tr from-purple-600 to-indigo-600 text-white' 
                        : 'bg-gradient-to-tr from-emerald-600 to-teal-600 text-white'
                    }`}>
                      {req.role === 'TEACHER' ? <Users className="w-6 h-6" /> : <GraduationCap className="w-6 h-6" />}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-base font-extrabold text-slate-900 dark:text-white">{req.name}</h4>
                        <Badge variant={req.role === 'TEACHER' ? 'purple' : 'success'}>
                          {req.role === 'TEACHER' ? 'Teacher Application' : 'Student Application'}
                        </Badge>
                        {isPending && <Badge variant="warning">Pending Approval</Badge>}
                        {isApproved && <Badge variant="success">Accepted</Badge>}
                        {isDeclined && <Badge variant="danger">Declined</Badge>}
                      </div>

                      <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
                        <span className="flex items-center gap-1.5 font-medium">
                          <Mail className="w-3.5 h-3.5 text-slate-400" /> {req.email}
                        </span>
                        {req.role === 'TEACHER' && req.subject && (
                          <span className="font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-md">
                            Subject: {req.subject}
                          </span>
                        )}
                        {req.role === 'STUDENT' && req.className && (
                          <span className="font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md">
                            Class: {req.className}
                          </span>
                        )}
                        {req.createdAt && (
                          <span className="text-[11px] text-slate-400">
                            Submitted: {new Date(req.createdAt?.seconds ? req.createdAt.seconds * 1000 : Date.now()).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Accept and Decline Action Buttons */}
                  <div className="flex items-center gap-3 self-end md:self-center shrink-0">
                    {isPending ? (
                      <>
                        <button
                          onClick={() => handleAccept(req)}
                          disabled={isBusy}
                          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-emerald-600/20 active:scale-95 transition disabled:opacity-50"
                        >
                          {isBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                          Accept
                        </button>

                        <button
                          onClick={() => handleDecline(req)}
                          disabled={isBusy}
                          className="px-4 py-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-xs font-bold flex items-center gap-2 active:scale-95 transition disabled:opacity-50"
                        >
                          <XCircle className="w-4 h-4" />
                          Decline
                        </button>
                      </>
                    ) : (
                      <div className="text-right">
                        <span className={`text-xs font-bold px-3 py-1.5 rounded-xl border flex items-center gap-1.5 ${
                          isApproved 
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300' 
                            : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300'
                        }`}>
                          {isApproved ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <XCircle className="w-4 h-4 text-rose-500" />}
                          {isApproved ? 'Approved & Active' : 'Application Declined'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
