import React, { useState, useEffect } from 'react';
import { PageHeader, Card, Button, Badge } from '../../components/ui';
import { Building2, Mail, Phone, MapPin, Lock, Save, Globe, Shield, Sparkles, CheckCircle2, AlertCircle, Loader2, KeyRound, BellRing } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { updatePassword, updateEmail } from 'firebase/auth';
import { db, auth, handleFirestoreError, OperationType } from '../../lib/firebase';

export default function InstitutionSettings() {
  const { user, updateUserPartial } = useAuth();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Profile Form States
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [website, setWebsite] = useState('');
  const [schoolCode, setSchoolCode] = useState('');
  const [principalName, setPrincipalName] = useState('');

  // Password Update States
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // System Preferences States
  const [academicYear, setAcademicYear] = useState('2026-2027');
  const [attendanceCutoff, setAttendanceCutoff] = useState('09:30 AM');
  const [enableAiFeatures, setEnableAiFeatures] = useState(true);

  // Fetch current institution details on mount
  useEffect(() => {
    async function loadInstitutionData() {
      if (!user) return;
      
      setName(user.name || '');
      setEmail(user.email || '');
      setPhone(user.phone || '');
      setAddress(user.address || '');
      setWebsite(user.website || '');
      setSchoolCode(user.schoolCode || '');

      try {
        if (user.institutionId) {
          const instDoc = await getDoc(doc(db, 'institutions', user.institutionId));
          const fallbackCode = `INST-${user.institutionId.substring(0, 5).toUpperCase()}`;
          if (instDoc.exists()) {
            const data = instDoc.data();
            if (data.name) setName(data.name);
            if (data.email) setEmail(data.email);
            if (data.phone) setPhone(data.phone);
            if (data.address) setAddress(data.address);
            if (data.website) setWebsite(data.website);
            const codeVal = data.code || data.schoolCode || data.institutionCode || fallbackCode;
            setSchoolCode(codeVal);
            if (data.principalName) setPrincipalName(data.principalName);
            if (data.academicYear) setAcademicYear(data.academicYear);
            if (data.attendanceCutoff) setAttendanceCutoff(data.attendanceCutoff);

            // Backfill code and schoolCode on Firestore institution doc if missing
            if (!data.code || !data.schoolCode) {
              await updateDoc(doc(db, 'institutions', user.institutionId), {
                code: codeVal,
                schoolCode: codeVal
              }).catch(() => {});
            }
          } else {
            setSchoolCode(fallbackCode);
          }
        }
      } catch (err) {
        console.error("Error loading institution settings:", err);
      } finally {
        setIsLoading(false);
      }
    }

    loadInstitutionData();
  }, [user]);

  // Handle Profile Save
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSaving(true);
    setSaveSuccess(null);
    setSaveError(null);

    try {
      // 1. Update Firestore user document
      const userRef = doc(db, 'users', user.id);
      const userUpdatePayload: any = {
        name,
        email,
        phone,
        address,
        website,
        institutionName: name,
      };

      await updateDoc(userRef, userUpdatePayload);

      // 2. Update Firestore institution document if institutionId exists
      if (user.institutionId) {
        const instRef = doc(db, 'institutions', user.institutionId);
        const finalCode = schoolCode || `INST-${user.institutionId.substring(0, 5).toUpperCase()}`;
        await setDoc(instRef, {
          name,
          email,
          phone,
          address,
          website,
          code: finalCode,
          schoolCode: finalCode,
          principalName,
          academicYear,
          attendanceCutoff,
          enableAiFeatures
        }, { merge: true });
      }

      // 3. Update Auth email if changed
      if (auth.currentUser && auth.currentUser.email !== email) {
        try {
          await updateEmail(auth.currentUser, email);
        } catch (authErr: any) {
          console.warn("Auth email update requires recent login:", authErr);
        }
      }

      // 4. Update local context state for instant header/sidebar sync
      updateUserPartial({
        name,
        email,
        phone,
        address,
        website,
        institutionName: name
      });

      setSaveSuccess("Institution profile & settings saved successfully!");
      setTimeout(() => setSaveSuccess(null), 4000);
    } catch (err: any) {
      handleFirestoreError(err, OperationType.WRITE, 'users');
      setSaveError(err.message || "Failed to update institution settings.");
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Password Update
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordSuccess(null);
    setPasswordError(null);

    if (!newPassword) {
      setPasswordError("Please enter a new password.");
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match.");
      return;
    }

    setIsUpdatingPassword(true);

    try {
      if (auth.currentUser) {
        await updatePassword(auth.currentUser, newPassword);
      }

      // Also update institution password field in database for institution reference
      if (user?.institutionId) {
        await updateDoc(doc(db, 'institutions', user.institutionId), {
          password: newPassword
        });
      }

      setPasswordSuccess("Account password updated successfully!");
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccess(null), 4000);
    } catch (err: any) {
      console.error("Error updating password:", err);
      setPasswordError(err.message || "Failed to update password. You may need to sign out and sign back in first.");
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto py-12 flex justify-center text-indigo-600">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      <PageHeader 
        title="Institution Settings & Governance" 
        description="Manage school name, contact credentials, admin access passwords, and campus preferences."
        badge="Governance Control"
        breadcrumbs={[{ label: 'Dashboard' }, { label: 'Institution Settings' }]}
      />

      {/* Global Success / Error Banners */}
      {saveSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900 text-xs font-semibold text-emerald-800 dark:text-emerald-200 flex items-center gap-2.5 shadow-sm animate-in fade-in duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{saveSuccess}</span>
        </div>
      )}

      {saveError && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-xs font-semibold text-rose-800 dark:text-rose-200 flex items-center gap-2.5 shadow-sm animate-in fade-in duration-200">
          <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
          <span>{saveError}</span>
        </div>
      )}

      {/* Institution Profile Card */}
      <Card>
        <div className="flex items-center justify-between pb-6 mb-6 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Campus & Institution Profile</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Official identity, contact information, and registration details</p>
            </div>
          </div>
          <Badge variant="purple" dot>Official Registry</Badge>
        </div>

        {/* Institution Join Code Banner */}
        <div className="mb-6 p-4 bg-indigo-50 dark:bg-indigo-950/60 rounded-2xl border border-indigo-200 dark:border-indigo-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span className="text-xs font-bold text-indigo-950 dark:text-indigo-200">Official Institution Sign-Up Code</span>
            </div>
            <p className="text-[11px] text-indigo-700 dark:text-indigo-300 mt-0.5">
              Share this code with your teachers and students. They will use it during Sign Up to join this campus network.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3.5 py-2 bg-white dark:bg-slate-900 border border-indigo-300 dark:border-indigo-700 rounded-xl font-mono font-black text-sm text-indigo-600 dark:text-indigo-400">
              {schoolCode || (user?.institutionId ? `INST-${user.institutionId.substring(0, 5).toUpperCase()}` : 'INST-94821')}
            </span>
            <Button 
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                const codeToCopy = schoolCode || (user?.institutionId ? `INST-${user.institutionId.substring(0, 5).toUpperCase()}` : 'INST-94821');
                navigator.clipboard.writeText(codeToCopy);
                alert(`Copied Institution Code: ${codeToCopy}`);
              }}
            >
              Copy Code
            </Button>
          </div>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            
            <div className="md:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                School / Institution Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input 
                  type="text" 
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:border-indigo-500 text-sm outline-none transition font-semibold" 
                  placeholder="e.g. Springfield High School" 
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                Official Institution Email <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:border-indigo-500 text-sm outline-none transition" 
                  placeholder="admin@school.com" 
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                Contact Phone Number
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input 
                  type="tel" 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:border-indigo-500 text-sm outline-none transition" 
                  placeholder="+1 (555) 000-0000" 
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                Campus Address / Location
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input 
                  type="text" 
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:border-indigo-500 text-sm outline-none transition" 
                  placeholder="123 Education Boulevard, Campus District..." 
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                Official Website URL
              </label>
              <div className="relative">
                <Globe className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input 
                  type="url" 
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:border-indigo-500 text-sm outline-none transition" 
                  placeholder="https://www.springfield.edu" 
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2 flex items-center justify-between">
                <span>Institution Code (Permanent)</span>
                <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-md flex items-center gap-1 border border-amber-200 dark:border-amber-800">
                  <Lock className="w-3 h-3" /> Permanent & Immutable
                </span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input 
                  type="text" 
                  readOnly
                  disabled
                  value={schoolCode || (user?.institutionId ? `INST-${user.institutionId.substring(0, 5).toUpperCase()}` : 'INST-94821')}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 text-sm font-mono font-bold cursor-not-allowed select-all outline-none" 
                />
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                Generated upon acceptance of school registration. Permanent and unchangeable forever.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                Principal / Headmaster Name
              </label>
              <input 
                type="text" 
                value={principalName}
                onChange={(e) => setPrincipalName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:border-indigo-500 text-sm outline-none transition" 
                placeholder="Dr. Eleanor Vance" 
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                Academic Year Session
              </label>
              <select 
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:border-indigo-500 text-sm outline-none transition" 
              >
                <option value="2025-2026">2025 - 2026 Session</option>
                <option value="2026-2027">2026 - 2027 Session</option>
                <option value="2027-2028">2027 - 2028 Session</option>
              </select>
            </div>

          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button type="submit" isLoading={isSaving} icon={<Save className="w-4 h-4" />}>
              Save Profile Changes
            </Button>
          </div>
        </form>
      </Card>

      {/* Password & Security Card */}
      <Card>
        <div className="flex items-center justify-between pb-6 mb-6 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400">
              <KeyRound className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Security & Access Credentials</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Update admin account login password</p>
            </div>
          </div>
        </div>

        {passwordSuccess && (
          <div className="mb-4 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900 text-xs font-semibold text-emerald-800 dark:text-emerald-200 flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{passwordSuccess}</span>
          </div>
        )}

        {passwordError && (
          <div className="mb-4 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-xs font-semibold text-rose-800 dark:text-rose-200 flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{passwordError}</span>
          </div>
        )}

        <form onSubmit={handleUpdatePassword} className="space-y-5">
          <div className="grid md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                New Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input 
                  type="password" 
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:border-indigo-500 text-sm outline-none transition" 
                  placeholder="Enter new password (min 6 chars)" 
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                Confirm New Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input 
                  type="password" 
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:border-indigo-500 text-sm outline-none transition" 
                  placeholder="Re-enter new password" 
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button type="submit" variant="secondary" isLoading={isUpdatingPassword} icon={<KeyRound className="w-4 h-4" />}>
              Update Password
            </Button>
          </div>
        </form>
      </Card>

      {/* AI & System Preferences Card */}
      <Card>
        <div className="flex items-center justify-between pb-6 mb-6 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Gemini AI & System Automation</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Configure AI schedule generators, automated attendance logs, and campus filters</p>
            </div>
          </div>
          <Badge variant="warning">Klyro Connect AI Engine</Badge>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200/80 dark:border-slate-800">
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" /> AI Scheduling & Complaint Analytics
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Enable Gemini 3.6 Flash master scheduling algorithms and automatic spam complaint filtering.
              </p>
            </div>
            <input 
              type="checkbox"
              checked={enableAiFeatures}
              onChange={(e) => setEnableAiFeatures(e.target.checked)}
              className="w-5 h-5 accent-indigo-600 rounded cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200/80 dark:border-slate-800">
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <BellRing className="w-4 h-4 text-indigo-500" /> Daily Staff Attendance Cutoff
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Target daily time limit after which staff are marked late or absent automatically.
              </p>
            </div>
            <select
              value={attendanceCutoff}
              onChange={(e) => setAttendanceCutoff(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white outline-none"
            >
              <option value="08:30 AM">08:30 AM</option>
              <option value="09:00 AM">09:00 AM</option>
              <option value="09:30 AM">09:30 AM</option>
              <option value="10:00 AM">10:00 AM</option>
            </select>
          </div>
        </div>
      </Card>
    </div>
  );
}
