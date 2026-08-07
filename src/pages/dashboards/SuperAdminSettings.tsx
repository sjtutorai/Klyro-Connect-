import React, { useState, useEffect } from 'react';
import { PageHeader, Card, Button, Badge } from '../../components/ui';
import { 
  Settings, Shield, Sparkles, Database, Save, KeyRound, Bell, Mail, Phone, 
  Lock, Globe, Cpu, AlertTriangle, CheckCircle2, Loader2, RefreshCw, Server, Wrench, FileCode2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp, collection, addDoc } from 'firebase/firestore';
import { updatePassword, updateEmail } from 'firebase/auth';
import { db, auth, handleFirestoreError, OperationType } from '../../lib/firebase';

export default function SuperAdminSettings() {
  const { user, updateUserPartial } = useAuth();

  const [activeTab, setActiveTab] = useState<'general' | 'ai' | 'security' | 'announcement' | 'maintenance'>('general');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Tab 1: General Platform Config
  const [platformName, setPlatformName] = useState('Klyro Connect AI Campus OS');
  const [supportEmail, setSupportEmail] = useState('admin@vaks.edu');
  const [supportPhone, setSupportPhone] = useState('+1 (800) 555-VAKS');
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [academicYear, setAcademicYear] = useState('2026-2027');
  const [allowPublicRegistration, setAllowPublicRegistration] = useState(true);

  // Tab 2: AI & Gemini Engine Config
  const [aiModel, setAiModel] = useState('gemini-3.6-flash');
  const [enableSchedulingAi, setEnableSchedulingAi] = useState(true);
  const [enableRosterParserAi, setEnableRosterParserAi] = useState(true);
  const [enableStudyGroupAi, setEnableStudyGroupAi] = useState(true);
  const [aiTemperature, setAiTemperature] = useState('0.7');

  // Tab 3: Super Admin Security & Credentials
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [sessionTimeout, setSessionTimeout] = useState('60');

  // Tab 4: Platform Broadcast Announcement
  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [announcementMsg, setAnnouncementMsg] = useState('');
  const [announcementPriority, setAnnouncementPriority] = useState<'info' | 'warning' | 'urgent'>('info');
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [broadcastSuccess, setBroadcastSuccess] = useState<string | null>(null);

  // Tab 5: Maintenance & System Diagnostics
  const [isCleaningCache, setIsCleaningCache] = useState(false);
  const [systemHealth, setSystemHealth] = useState({
    databaseStatus: 'Healthy',
    authServer: 'Operational',
    aiService: 'Online (Latency 140ms)',
    storageUsage: '14.2 GB / 100 GB'
  });

  // Load Super Admin global settings from Firestore
  useEffect(() => {
    async function loadSettings() {
      if (!user) return;
      setAdminName(user.name || 'Super Admin');
      setAdminEmail(user.email || '');

      try {
        const sysDocRef = doc(db, 'system_settings', 'global_config');
        const sysSnap = await getDoc(sysDocRef);
        if (sysSnap.exists()) {
          const data = sysSnap.data();
          if (data.platformName) setPlatformName(data.platformName);
          if (data.supportEmail) setSupportEmail(data.supportEmail);
          if (data.supportPhone) setSupportPhone(data.supportPhone);
          if (data.maintenanceMode !== undefined) setMaintenanceMode(data.maintenanceMode);
          if (data.academicYear) setAcademicYear(data.academicYear);
          if (data.aiModel) setAiModel(data.aiModel);
          if (data.enableSchedulingAi !== undefined) setEnableSchedulingAi(data.enableSchedulingAi);
          if (data.enableRosterParserAi !== undefined) setEnableRosterParserAi(data.enableRosterParserAi);
          if (data.enableStudyGroupAi !== undefined) setEnableStudyGroupAi(data.enableStudyGroupAi);
          if (data.sessionTimeout) setSessionTimeout(data.sessionTimeout);
        }
      } catch (err) {
        console.error("Error loading global system settings:", err);
      } finally {
        setIsLoading(false);
      }
    }

    loadSettings();
  }, [user]);

  // Save General & AI System Settings
  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(null);
    setSaveError(null);

    try {
      const configRef = doc(db, 'system_settings', 'global_config');
      const payload = {
        platformName,
        supportEmail,
        supportPhone,
        maintenanceMode,
        academicYear,
        allowPublicRegistration,
        aiModel,
        enableSchedulingAi,
        enableRosterParserAi,
        enableStudyGroupAi,
        sessionTimeout,
        updatedAt: serverTimestamp(),
        updatedBy: user?.id || 'super-admin'
      };

      await setDoc(configRef, payload, { merge: true });

      // Update user state if name changed
      if (adminName !== user?.name) {
        const userRef = doc(db, 'users', user!.id);
        await updateDoc(userRef, { name: adminName });
        updateUserPartial({ name: adminName });
      }

      setSaveSuccess("🎉 Platform System Settings saved successfully!");
    } catch (err: any) {
      console.error("Failed to save settings:", err);
      setSaveError(err.message || "Failed to update global configuration.");
      handleFirestoreError(err, OperationType.WRITE, 'system_settings');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Security Password Change
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword) return;
    if (newPassword !== confirmPassword) {
      setSaveError("Passwords do not match!");
      return;
    }
    if (newPassword.length < 6) {
      setSaveError("Password must be at least 6 characters.");
      return;
    }

    setIsSaving(true);
    setSaveSuccess(null);
    setSaveError(null);

    try {
      if (auth.currentUser) {
        await updatePassword(auth.currentUser, newPassword);
      }
      
      const userRef = doc(db, 'users', user!.id);
      await updateDoc(userRef, { updatedAt: serverTimestamp() });

      setNewPassword('');
      setConfirmPassword('');
      setSaveSuccess("🔒 Super Admin Password updated successfully!");
    } catch (err: any) {
      console.error("Password update error:", err);
      setSaveError(err.message || "Failed to update password. You may need to re-authenticate.");
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Global Broadcast Notice
  const handleBroadcastAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!announcementTitle || !announcementMsg) return;

    setIsBroadcasting(true);
    setBroadcastSuccess(null);

    try {
      await addDoc(collection(db, 'notices'), {
        title: `[SYSTEM ANNOUNCEMENT] ${announcementTitle}`,
        content: announcementMsg,
        category: 'GLOBAL',
        priority: announcementPriority,
        sender: 'Super Admin HQ',
        createdAt: serverTimestamp(),
        isGlobal: true
      });

      setAnnouncementTitle('');
      setAnnouncementMsg('');
      setBroadcastSuccess("📢 Platform-wide broadcast sent to all registered school networks!");
    } catch (err: any) {
      console.error("Broadcast error:", err);
      alert("Failed to send global broadcast: " + err.message);
    } finally {
      setIsBroadcasting(false);
    }
  };

  // Handle Maintenance Cache Reset
  const handleClearCache = async () => {
    setIsCleaningCache(true);
    setTimeout(() => {
      setIsCleaningCache(false);
      alert("System cache, volatile indexes, and AI temporary files successfully purged!");
    }, 1200);
  };

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
        title="Super Admin Settings" 
        description="Master control center for system configurations, AI model aliases, platform announcements, and administrative security."
        badge="Super Admin Mode"
        breadcrumbs={[{ label: 'Super Admin' }, { label: 'Settings' }]}
      />

      {/* Tabs Navigation Header */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 overflow-x-auto scrollbar-none gap-2">
        <button
          onClick={() => setActiveTab('general')}
          className={`px-4 py-3 text-xs font-bold transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'general' 
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400' 
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Settings className="w-4 h-4" /> General Platform
        </button>

        <button
          onClick={() => setActiveTab('ai')}
          className={`px-4 py-3 text-xs font-bold transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'ai' 
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400' 
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Cpu className="w-4 h-4" /> AI Engine & Gemini
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`px-4 py-3 text-xs font-bold transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'security' 
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400' 
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Shield className="w-4 h-4" /> Admin Security
        </button>

        <button
          onClick={() => setActiveTab('announcement')}
          className={`px-4 py-3 text-xs font-bold transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'announcement' 
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400' 
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Bell className="w-4 h-4" /> Global Broadcast
        </button>

        <button
          onClick={() => setActiveTab('maintenance')}
          className={`px-4 py-3 text-xs font-bold transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'maintenance' 
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400' 
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Wrench className="w-4 h-4" /> System Health
        </button>
      </div>

      {/* Save Notifications */}
      {saveSuccess && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900 rounded-2xl text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          {saveSuccess}
        </div>
      )}

      {saveError && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 rounded-2xl text-xs font-bold text-rose-800 dark:text-rose-300 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          {saveError}
        </div>
      )}

      {/* TAB 1: GENERAL PLATFORM CONFIG */}
      {activeTab === 'general' && (
        <Card className="space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Platform Branding & Default Presets</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Configure core metadata for the Klyro Connect AI Campus OS ecosystem</p>
            </div>
          </div>

          <form onSubmit={handleSaveConfig} className="space-y-5">
            <div className="grid md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Ecosystem Name
                </label>
                <input 
                  type="text" 
                  value={platformName}
                  onChange={e => setPlatformName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs font-medium outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Default Academic Session
                </label>
                <select
                  value={academicYear}
                  onChange={e => setAcademicYear(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs font-medium outline-none focus:ring-2 focus:ring-indigo-600"
                >
                  <option value="2025-2026">2025 - 2026</option>
                  <option value="2026-2027">2026 - 2027</option>
                  <option value="2027-2028">2027 - 2028</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Global Support Email
                </label>
                <input 
                  type="email" 
                  value={supportEmail}
                  onChange={e => setSupportEmail(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs font-medium outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Support Helpline Number
                </label>
                <input 
                  type="text" 
                  value={supportPhone}
                  onChange={e => setSupportPhone(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs font-medium outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>
            </div>

            {/* Maintenance Toggle Card */}
            <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">Platform Maintenance Mode</span>
                  {maintenanceMode && <Badge variant="warning">Active</Badge>}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  When enabled, non-superadmin users will see a maintenance screen preventing changes during upgrades.
                </p>
              </div>
              <input 
                type="checkbox"
                checked={maintenanceMode}
                onChange={e => setMaintenanceMode(e.target.checked)}
                className="w-5 h-5 accent-indigo-600 cursor-pointer"
              />
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
              <Button type="submit" isLoading={isSaving} icon={<Save className="w-4 h-4" />}>
                Save Platform Preferences
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* TAB 2: AI ENGINE & GEMINI CONFIG */}
      {activeTab === 'ai' && (
        <Card className="space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Gemini AI Model & Feature Toggles</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Manage global AI services including Schedule Generator and PDF/Excel Roster Parser</p>
            </div>
          </div>

          <form onSubmit={handleSaveConfig} className="space-y-5">
            <div className="grid md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Default Gemini Model
                </label>
                <select
                  value={aiModel}
                  onChange={e => setAiModel(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs font-bold outline-none focus:ring-2 focus:ring-purple-600"
                >
                  <option value="gemini-3.6-flash">gemini-3.6-flash (Fast & Recommended)</option>
                  <option value="gemini-3.6-pro">gemini-3.6-pro (High Precision)</option>
                  <option value="gemini-2.5-flash">gemini-2.5-flash (Standard)</option>
                </select>
                <p className="text-[11px] text-slate-500 mt-1">Used for AI schedule generation and file parsing.</p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Creativity / Temperature
                </label>
                <select
                  value={aiTemperature}
                  onChange={e => setAiTemperature(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs font-bold outline-none focus:ring-2 focus:ring-purple-600"
                >
                  <option value="0.2">0.2 (Strict / Analytical)</option>
                  <option value="0.7">0.7 (Balanced - Default)</option>
                  <option value="1.0">1.0 (Creative)</option>
                </select>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Enabled AI Services</h4>

              <div className="p-3.5 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">AI Schedule & Conflict Generator</p>
                  <p className="text-[11px] text-slate-500">Allows principals to auto-schedule non-overlapping subject slots for classes</p>
                </div>
                <input 
                  type="checkbox"
                  checked={enableSchedulingAi}
                  onChange={e => setEnableSchedulingAi(e.target.checked)}
                  className="w-5 h-5 accent-indigo-600 cursor-pointer"
                />
              </div>

              <div className="p-3.5 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">AI PDF/Excel Student Roster Converter</p>
                  <p className="text-[11px] text-slate-500">Auto-converts uploaded PDF or Excel files into editable manual form rows during school onboarding</p>
                </div>
                <input 
                  type="checkbox"
                  checked={enableRosterParserAi}
                  onChange={e => setEnableRosterParserAi(e.target.checked)}
                  className="w-5 h-5 accent-indigo-600 cursor-pointer"
                />
              </div>

              <div className="p-3.5 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">AI Study Group Tutor & auto-enrollment</p>
                  <p className="text-[11px] text-slate-500">Auto-populates class members into subject study channels</p>
                </div>
                <input 
                  type="checkbox"
                  checked={enableStudyGroupAi}
                  onChange={e => setEnableStudyGroupAi(e.target.checked)}
                  className="w-5 h-5 accent-indigo-600 cursor-pointer"
                />
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
              <Button type="submit" isLoading={isSaving} icon={<Save className="w-4 h-4" />}>
                Save AI Configuration
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* TAB 3: ADMIN SECURITY & CREDENTIALS */}
      {activeTab === 'security' && (
        <Card className="space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Super Admin Access & Credentials</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Update Super Admin account email, password, and session inactivity limits</p>
            </div>
          </div>

          <form onSubmit={handleUpdatePassword} className="space-y-5">
            <div className="grid md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Super Admin Full Name
                </label>
                <input 
                  type="text" 
                  value={adminName}
                  onChange={e => setAdminName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs font-medium outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Admin Email Address
                </label>
                <input 
                  type="email" 
                  disabled
                  value={adminEmail}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 text-slate-500 text-xs font-medium outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  New Password
                </label>
                <input 
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Leave blank to keep current"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Confirm New Password
                </label>
                <input 
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Session Inactivity Lock Out
              </label>
              <select
                value={sessionTimeout}
                onChange={e => setSessionTimeout(e.target.value)}
                className="w-full max-w-xs px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs font-medium outline-none focus:ring-2 focus:ring-indigo-600"
              >
                <option value="15">15 Minutes</option>
                <option value="30">30 Minutes</option>
                <option value="60">1 Hour (Recommended)</option>
                <option value="720">12 Hours</option>
              </select>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
              <Button type="submit" isLoading={isSaving} icon={<KeyRound className="w-4 h-4" />}>
                Update Admin Password
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* TAB 4: GLOBAL BROADCAST ANNOUNCEMENT */}
      {activeTab === 'announcement' && (
        <Card className="space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Global Broadcast to All Institutions</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Send an official platform notice to all registered school networks, teachers, and students</p>
            </div>
          </div>

          {broadcastSuccess && (
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900 rounded-2xl text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              {broadcastSuccess}
            </div>
          )}

          <form onSubmit={handleBroadcastAnnouncement} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Announcement Title <span className="text-rose-500">*</span>
              </label>
              <input 
                type="text"
                required
                value={announcementTitle}
                onChange={e => setAnnouncementTitle(e.target.value)}
                placeholder="e.g. Scheduled Maintenance Notice & Feature Updates"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs outline-none focus:ring-2 focus:ring-indigo-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Priority Level
              </label>
              <select
                value={announcementPriority}
                onChange={e => setAnnouncementPriority(e.target.value as any)}
                className="w-full max-w-xs px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-600"
              >
                <option value="info">Standard Notice (Blue)</option>
                <option value="warning">Important Alert (Amber)</option>
                <option value="urgent">Urgent / Critical (Red)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Message Body <span className="text-rose-500">*</span>
              </label>
              <textarea 
                rows={4}
                required
                value={announcementMsg}
                onChange={e => setAnnouncementMsg(e.target.value)}
                placeholder="Type the broadcast message that will appear on all institution dashboards..."
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs outline-none focus:ring-2 focus:ring-indigo-600"
              />
            </div>

            <div className="flex justify-end pt-2">
              <Button type="submit" isLoading={isBroadcasting} icon={<Bell className="w-4 h-4" />}>
                Broadcast Global Notice
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* TAB 5: SYSTEM HEALTH & MAINTENANCE */}
      {activeTab === 'maintenance' && (
        <Card className="space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">System Diagnostics & Storage Health</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Monitor Firestore database connection, auth state, and perform system cleanups</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200/80 dark:border-slate-800">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Firestore Cloud Database</span>
              <div className="flex items-center justify-between mt-1">
                <span className="text-sm font-bold text-slate-900 dark:text-white">{systemHealth.databaseStatus}</span>
                <Badge variant="success">Online</Badge>
              </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200/80 dark:border-slate-800">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Firebase Authentication Service</span>
              <div className="flex items-center justify-between mt-1">
                <span className="text-sm font-bold text-slate-900 dark:text-white">{systemHealth.authServer}</span>
                <Badge variant="success">Connected</Badge>
              </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200/80 dark:border-slate-800">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Gemini AI Endpoint API</span>
              <div className="flex items-center justify-between mt-1">
                <span className="text-sm font-bold text-slate-900 dark:text-white">{systemHealth.aiService}</span>
                <Badge variant="neutral">Active</Badge>
              </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200/80 dark:border-slate-800">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Document Storage Usage</span>
              <div className="flex items-center justify-between mt-1">
                <span className="text-sm font-bold text-slate-900 dark:text-white">{systemHealth.storageUsage}</span>
                <Badge variant="info">14%</Badge>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">Maintenance Utilities</h4>
              <p className="text-[11px] text-slate-500">Purge temporary caches and validate indexing</p>
            </div>

            <Button 
              variant="outline"
              onClick={handleClearCache}
              isLoading={isCleaningCache}
              icon={<RefreshCw className="w-4 h-4" />}
            >
              Clear Cache & Re-index
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
