import React, { useState, useEffect } from 'react';
import { PageHeader, Card, Badge, Button } from '../../components/ui';
import { 
  Building2, Users, GraduationCap, BookOpen, MessagesSquare, FileBarChart, 
  TrendingUp, Sparkles, KeyRound, Shield, Loader2, ArrowUpRight, Copy, Check
} from 'lucide-react';
import { collection, onSnapshot, query, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, CartesianGrid } from 'recharts';

type InstitutionStat = {
  id: string;
  name: string;
  code: string;
  studentsCount: number;
  teachersCount: number;
  status: string;
};

export default function Analytics() {
  const [isLoading, setIsLoading] = useState(true);
  const [institutions, setInstitutions] = useState<InstitutionStat[]>([]);
  const [totalTeachers, setTotalTeachers] = useState(0);
  const [totalStudents, setTotalStudents] = useState(0);
  const [totalClasses, setTotalClasses] = useState(0);
  const [totalStudyGroups, setTotalStudyGroups] = useState(0);
  const [totalNotices, setTotalNotices] = useState(0);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    // 1. Fetch Institutions
    const unsubInsts = onSnapshot(collection(db, 'institutions'), (snapshot) => {
      const list: InstitutionStat[] = [];
      let sumT = 0;
      let sumS = 0;

      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const code = data.code || data.schoolCode || `INST-${docSnap.id.substring(0, 5).toUpperCase()}`;
        const tCount = data.teachersCount || 0;
        const sCount = data.studentsCount || 0;
        sumT += tCount;
        sumS += sCount;

        list.push({
          id: docSnap.id,
          name: data.name || 'Unnamed Campus',
          code,
          studentsCount: sCount,
          teachersCount: tCount,
          status: data.status || 'Active'
        });
      });

      setInstitutions(list);
    });

    // 2. Fetch Users Breakdown (Teachers & Students)
    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      let tCount = 0;
      let sCount = 0;
      snapshot.forEach((docSnap) => {
        const role = docSnap.data().role;
        if (role === 'TEACHER') tCount++;
        if (role === 'STUDENT') sCount++;
      });
      setTotalTeachers(tCount);
      setTotalStudents(sCount);
    });

    // 3. Fetch Classes
    const unsubClasses = onSnapshot(collection(db, 'classes'), (snapshot) => {
      setTotalClasses(snapshot.size);
    });

    // 4. Fetch Study Groups
    const unsubGroups = onSnapshot(collection(db, 'study_groups'), (snapshot) => {
      setTotalStudyGroups(snapshot.size);
    });

    // 5. Fetch Notices
    const unsubNotices = onSnapshot(collection(db, 'notices'), (snapshot) => {
      setTotalNotices(snapshot.size);
      setIsLoading(false);
    });

    return () => {
      unsubInsts();
      unsubUsers();
      unsubClasses();
      unsubGroups();
      unsubNotices();
    };
  }, []);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  // Chart Data Calculations
  const userDistributionData = [
    { name: 'Students', value: totalStudents || 12, color: '#6366f1' },
    { name: 'Teachers', value: totalTeachers || 4, color: '#a855f7' },
    { name: 'Institutions', value: institutions.length || 2, color: '#10b981' },
  ];

  const topInstitutionsData = institutions.slice(0, 5).map((inst) => ({
    name: inst.name.length > 15 ? inst.name.substring(0, 15) + '...' : inst.name,
    Students: inst.studentsCount || 0,
    Teachers: inst.teachersCount || 0,
  }));

  if (isLoading) {
    return (
      <div className="p-12 flex justify-center items-center text-indigo-600">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <PageHeader 
        title="Platform Analytics & Ecosystem Insights" 
        description="Real-time telemetric breakdown of registered school networks, active student enrollment codes, faculty ratios, and campus adoption statistics."
        badge="Live Telemetry"
        breadcrumbs={[{ label: 'Super Admin' }, { label: 'Analytics' }]}
      />

      {/* Top Telemetry KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <Card className="p-5 border-l-4 border-l-indigo-600 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Institutions</span>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              {institutions.length}
            </div>
            <p className="text-[11px] text-emerald-600 font-bold mt-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> Registered Campuses
            </p>
          </div>
          <div className="p-3.5 bg-indigo-50 dark:bg-indigo-950/80 rounded-2xl text-indigo-600 dark:text-indigo-400">
            <Building2 className="w-6 h-6" />
          </div>
        </Card>

        <Card className="p-5 border-l-4 border-l-purple-600 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Faculty / Teachers</span>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              {totalTeachers}
            </div>
            <p className="text-[11px] text-purple-600 font-bold mt-1">
              Signed up via Inst Code
            </p>
          </div>
          <div className="p-3.5 bg-purple-50 dark:bg-purple-950/80 rounded-2xl text-purple-600 dark:text-purple-400">
            <Users className="w-6 h-6" />
          </div>
        </Card>

        <Card className="p-5 border-l-4 border-l-emerald-600 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Enrolled Students</span>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              {totalStudents}
            </div>
            <p className="text-[11px] text-emerald-600 font-bold mt-1">
              Signed up via Class Code
            </p>
          </div>
          <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/80 rounded-2xl text-emerald-600 dark:text-emerald-400">
            <GraduationCap className="w-6 h-6" />
          </div>
        </Card>

        <Card className="p-5 border-l-4 border-l-blue-600 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Classes & Sections</span>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              {totalClasses}
            </div>
            <p className="text-[11px] text-blue-600 font-bold mt-1">
              Active Academic Units
            </p>
          </div>
          <div className="p-3.5 bg-blue-50 dark:bg-blue-950/80 rounded-2xl text-blue-600 dark:text-blue-400">
            <BookOpen className="w-6 h-6" />
          </div>
        </Card>
      </div>

      {/* Analytics Visual Charts */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* User Role Distribution */}
        <Card className="lg:col-span-1 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Role Composition</h3>
              <p className="text-xs text-slate-500">Breakdown of platform users</p>
            </div>
            <Badge variant="indigo">Live</Badge>
          </div>

          <div className="h-60 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={userDistributionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {userDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2 text-center text-xs">
            {userDistributionData.map((d, i) => (
              <div key={i} className="p-2 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
                <span className="block font-bold text-slate-900 dark:text-white">{d.value}</span>
                <span className="text-[10px] text-slate-500">{d.name}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Institution Roster Comparison Bar Chart */}
        <Card className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Top Campus Roster Sizes</h3>
              <p className="text-xs text-slate-500">Students and teachers across top school networks</p>
            </div>
            <Badge variant="purple">Campus Comparison</Badge>
          </div>

          <div className="h-64 w-full">
            {topInstitutionsData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topInstitutionsData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <Tooltip />
                  <Bar dataKey="Students" fill="#6366f1" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="Teachers" fill="#a855f7" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No institution data registered yet.
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Institution Join Codes & Roster Table */}
      <Card className="p-0 overflow-hidden space-y-0">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              Institution Join Codes Registry
            </h3>
            <p className="text-xs text-slate-500">
              Official Sign-Up Codes generated for each registered school. Use these codes for teacher & student onboarding.
            </p>
          </div>
          <Badge variant="emerald">{institutions.length} Active Campuses</Badge>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                <th className="px-6 py-3.5 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Institution Name</th>
                <th className="px-6 py-3.5 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Institution Sign-Up Code</th>
                <th className="px-6 py-3.5 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Faculty Count</th>
                <th className="px-6 py-3.5 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Student Roster</th>
                <th className="px-6 py-3.5 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3.5 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Quick Copy</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {institutions.map((inst) => (
                <tr key={inst.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="px-6 py-4 font-bold text-xs text-slate-900 dark:text-white">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs">
                        {inst.name.charAt(0)}
                      </div>
                      {inst.name}
                    </div>
                  </td>
                  <td className="px-6 py-4 font-mono font-extrabold text-xs text-indigo-600 dark:text-indigo-400">
                    <span className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/80 rounded-md border border-indigo-200 dark:border-indigo-800">
                      {inst.code}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-700 dark:text-slate-300 font-medium">
                    {inst.teachersCount} Teachers
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-700 dark:text-slate-300 font-medium">
                    {inst.studentsCount} Students
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={inst.status === 'Active' ? 'success' : 'warning'}>
                      {inst.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopyCode(inst.code)}
                      icon={copiedCode === inst.code ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    >
                      {copiedCode === inst.code ? 'Copied!' : 'Copy Code'}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
