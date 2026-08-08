import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { auth, db } from '../lib/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDocs, collection, query, where, updateDoc, arrayUnion, serverTimestamp } from 'firebase/firestore';
import { GraduationCap, Mail, Lock, ArrowRight, Loader2, AlertCircle, Shield, Building2, Users, UserCheck, Eye, EyeOff, KeyRound, Sparkles, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';

export default function LoginPage() {
  const [authMode, setAuthMode] = useState<'signIn' | 'signUp'>('signIn');
  
  // Sign In States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Sign Up States
  const [signUpRole, setSignUpRole] = useState<'TEACHER' | 'STUDENT'>('STUDENT');
  const [signUpName, setSignUpName] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpSubject, setSignUpSubject] = useState('');
  const [institutionCode, setInstitutionCode] = useState('');
  const [classCode, setClassCode] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      switch (user.role) {
        case 'SUPER_ADMIN': navigate('/dashboard/super-admin'); break;
        case 'INSTITUTION': navigate('/dashboard/institution'); break;
        case 'TEACHER': navigate('/dashboard/teacher'); break;
        case 'STUDENT': navigate('/dashboard/student'); break;
        default: navigate('/dashboard');
      }
    }
  }, [user, navigate]);

  // Handle Standard Sign In
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
      setIsLoading(false);
    }
  };

  // Handle Teacher / Student Registration with Codes
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccessMsg('');

    if (!signUpName.trim() || !signUpEmail.trim() || !signUpPassword.trim()) {
      setError("Please fill in all required fields.");
      setIsLoading(false);
      return;
    }

    if (signUpPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      setIsLoading(false);
      return;
    }

    const cleanInstCode = institutionCode.trim().toUpperCase();
    const cleanClassCode = classCode.trim().toUpperCase();

    if (!cleanInstCode) {
      setError("Institution Join Code is required for sign-up.");
      setIsLoading(false);
      return;
    }

    if (signUpRole === 'STUDENT' && !cleanClassCode) {
      setError("Class & Section Join Code is required for student sign-up.");
      setIsLoading(false);
      return;
    }

    try {
      const normalize = (s: string) => (s || '').replace(/[^A-Z0-9]/gi, '').toUpperCase();
      const normInstInput = normalize(cleanInstCode);

      // 1. Verify Institution Code in Firestore
      const instsSnap = await getDocs(collection(db, 'institutions'));
      let matchedInst: any = null;
      const availableInstCodes: string[] = [];

      instsSnap.forEach((docSnap) => {
        const data = docSnap.data();
        const idShortCode = `INST-${docSnap.id.substring(0, 5).toUpperCase()}`;
        const idFullCode = `INST-${docSnap.id.toUpperCase()}`;
        const rawCode = data.code || data.schoolCode || data.institutionCode || idShortCode;
        availableInstCodes.push(rawCode);

        // Collect all possible valid code variations for robust matching
        const possibleCodes = [
          data.code,
          data.schoolCode,
          data.institutionCode,
          idShortCode,
          docSnap.id.substring(0, 5).toUpperCase(),
          idFullCode,
          docSnap.id,
          data.affiliationCode
        ].filter(Boolean) as string[];

        const normCodes = possibleCodes.map(c => normalize(c));
        const normCodesStripped = possibleCodes.map(c => normalize(c.replace(/^INST-?/i, '')));
        const normName = normalize(data.name || '');

        const allNorms = Array.from(new Set([...normCodes, ...normCodesStripped]));

        if (
          allNorms.some(n => n && (normInstInput === n || n.includes(normInstInput) || normInstInput.includes(n))) ||
          (normName && normName.length >= 3 && normName.includes(normInstInput))
        ) {
          matchedInst = { id: docSnap.id, ...data, code: rawCode };
        }
      });

      if (!matchedInst) {
        setError(`Invalid Institution Code "${cleanInstCode}". Please request the official code from your school administrator or super admin.`);
        setIsLoading(false);
        return;
      }

      let matchedClass: any = null;

      // 2. If Student, verify Class Code in Firestore
      if (signUpRole === 'STUDENT') {
        const normClassInput = normalize(cleanClassCode);
        const classesSnap = await getDocs(collection(db, 'classes'));
        const availableClassCodes: string[] = [];

        classesSnap.forEach((docSnap) => {
          const data = docSnap.data();
          const rawClassCode = data.code || `CLS-${docSnap.id.substring(0, 5).toUpperCase()}`;
          if (data.institutionId === matchedInst.id || !data.institutionId) {
            availableClassCodes.push(rawClassCode);
          }

          const normClassCode = normalize(rawClassCode);
          const normClassCodeStripped = normalize(rawClassCode.replace(/^CLS-?/i, ''));
          const normClassTitle = normalize(data.fullTitle || data.className || '');
          const normClassId = normalize(docSnap.id);

          if (
            normClassInput === normClassCode ||
            normClassInput === normClassCodeStripped ||
            (normClassTitle && (normClassInput === normClassTitle || normClassTitle.includes(normClassInput))) ||
            (normClassId && (normClassInput === normClassId || normClassId.includes(normClassInput))) ||
            (normClassCode && normClassCode.includes(normClassInput))
          ) {
            matchedClass = { id: docSnap.id, ...data, code: rawClassCode };
          }
        });

        // Fallback: If no class matched or no classes exist for this institution, auto-create a class
        if (!matchedClass) {
          const newClassRef = doc(collection(db, 'classes'));
          const formattedCode = cleanClassCode.startsWith('CLS-') ? cleanClassCode : `CLS-${cleanClassCode}`;
          const newClassData = {
            className: `Section ${cleanClassCode}`,
            section: 'A',
            fullTitle: `Class (${cleanClassCode})`,
            code: formattedCode,
            institutionId: matchedInst.id,
            institutionName: matchedInst.name,
            studentIds: [],
            createdAt: serverTimestamp()
          };
          await setDoc(newClassRef, newClassData);
          matchedClass = { id: newClassRef.id, ...newClassData };
        }
      }

      // 3. Create Firebase Auth Account
      const userCred = await createUserWithEmailAndPassword(auth, signUpEmail, signUpPassword);
      const uid = userCred.user.uid;

      // 4. Save Firestore User Document
      const userPayload: any = {
        name: signUpName.trim(),
        email: signUpEmail.trim(),
        role: signUpRole,
        institutionId: matchedInst.id,
        institutionName: matchedInst.name || 'Campus OS Partner',
        createdAt: serverTimestamp()
      };

      if (signUpRole === 'TEACHER') {
        userPayload.subject = signUpSubject.trim() || 'General Subject';
      } else if (signUpRole === 'STUDENT') {
        userPayload.classId = matchedClass.id;
        userPayload.className = matchedClass.fullTitle || matchedClass.className;
        userPayload.assignedClass = matchedClass.fullTitle || matchedClass.className;

        // Append student to class enrollment
        try {
          await updateDoc(doc(db, 'classes', matchedClass.id), {
            studentIds: arrayUnion(uid)
          });
        } catch (clsErr) {
          console.warn("Class student list update skipped:", clsErr);
        }
      }

      userPayload.status = 'Pending';

      await setDoc(doc(db, 'users', uid), userPayload);

      // Create Registration Request for Institution Approval
      try {
        const reqRef = doc(collection(db, 'registration_requests'));
        await setDoc(reqRef, {
          id: reqRef.id,
          uid: uid,
          name: signUpName.trim(),
          email: signUpEmail.trim(),
          role: signUpRole,
          institutionId: matchedInst.id,
          institutionName: matchedInst.name || 'Campus OS Partner',
          classId: matchedClass?.id || null,
          className: matchedClass?.fullTitle || matchedClass?.className || null,
          subject: signUpRole === 'TEACHER' ? (signUpSubject.trim() || 'General Subject') : null,
          institutionCode: cleanInstCode,
          classCode: cleanClassCode || null,
          status: 'Pending',
          createdAt: serverTimestamp()
        });
      } catch (reqErr) {
        console.warn("Error creating registration_request doc:", reqErr);
      }
      setSuccessMsg(`🎉 Application submitted! A sign-up request has been sent to ${matchedInst.name}. An administrator will review and accept your application shortly.`);
    } catch (err: any) {
      console.error("Sign up error:", err);
      if (err.code === 'auth/email-already-in-use') {
        setError("This email address is already registered. Please sign in instead.");
      } else {
        setError(err.message || "Sign up failed. Please check your network and try again.");
      }
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden selection:bg-indigo-500 selection:text-white">
      
      {/* Background glow effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-indigo-600/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 right-10 w-[400px] h-[300px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center space-y-3">
        <Link to="/" className="inline-flex items-center gap-3">
          <div className="bg-gradient-to-tr from-indigo-600 to-indigo-500 p-3 rounded-2xl shadow-xl shadow-indigo-600/20">
            <GraduationCap className="h-8 w-8 text-white" />
          </div>
          <span className="text-2xl font-black tracking-tight text-white">
            Klyro Connect <span className="text-indigo-400">AI</span>
          </span>
        </Link>
        <h2 className="text-3xl font-extrabold text-white tracking-tight">
          {authMode === 'signIn' ? 'Sign in to Campus OS' : 'Create Your Campus Account'}
        </h2>
        <p className="text-xs text-slate-400">
          {authMode === 'signIn' 
            ? 'Enter your credentials to access your administrative or learning portal' 
            : 'Join your school network using your institution and class sign-up codes'}
        </p>

        {/* Tab Switcher */}
        <div className="mt-4 inline-flex p-1 bg-slate-900 border border-slate-800 rounded-2xl">
          <button
            type="button"
            onClick={() => { setAuthMode('signIn'); setError(''); setSuccessMsg(''); }}
            className={`px-6 py-2 rounded-xl text-xs font-bold transition-all ${
              authMode === 'signIn' 
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setAuthMode('signUp'); setError(''); setSuccessMsg(''); }}
            className={`px-6 py-2 rounded-xl text-xs font-bold transition-all ${
              authMode === 'signUp' 
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Sign Up
          </button>
        </div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mt-6 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4 sm:px-0"
      >
        <div className="bg-slate-900/90 backdrop-blur-xl py-8 px-6 sm:px-10 shadow-2xl rounded-3xl border border-slate-800 space-y-6">
          
          {error && (
            <div className="bg-rose-950/80 border border-rose-800/80 text-rose-300 px-4 py-3 rounded-2xl flex items-center gap-3 text-xs font-semibold">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="bg-emerald-950/80 border border-emerald-800/80 text-emerald-300 px-4 py-3 rounded-2xl flex items-center gap-3 text-xs font-semibold">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* SIGN IN FORM */}
          {authMode === 'signIn' ? (
            <form className="space-y-5" onSubmit={handleSignIn}>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Mail className="h-4 w-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 border border-slate-800 rounded-xl bg-slate-950 text-white placeholder-slate-500 focus:border-indigo-500 text-sm font-medium outline-none transition"
                    placeholder="admin@vaks.ai"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-10 pr-10 py-3 border border-slate-800 rounded-xl bg-slate-950 text-white placeholder-slate-500 focus:border-indigo-500 text-sm font-medium outline-none transition"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs">
                <label className="flex items-center gap-2 cursor-pointer text-slate-400 hover:text-slate-200">
                  <input
                    type="checkbox"
                    className="rounded border-slate-700 bg-slate-950 text-indigo-600 focus:ring-indigo-500"
                  />
                  Remember me
                </label>

                <a href="#" className="font-semibold text-indigo-400 hover:underline">
                  Forgot password?
                </a>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 px-4 rounded-xl shadow-lg shadow-indigo-600/30 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 transition-all flex justify-center items-center gap-2 disabled:opacity-50"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>Sign In to Dashboard <ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            </form>
          ) : (
            /* SIGN UP FORM */
            <form className="space-y-5" onSubmit={handleSignUp}>
              
              {/* STEP 1: SELECT ROLE (TEACHER VS STUDENT) */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                  I am signing up as a:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setSignUpRole('STUDENT')}
                    className={`p-3.5 rounded-2xl border text-left flex items-center gap-3 transition-all ${
                      signUpRole === 'STUDENT'
                        ? 'border-indigo-500 bg-indigo-950/60 text-white shadow-lg shadow-indigo-950/50'
                        : 'border-slate-800 bg-slate-950/50 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                    }`}
                  >
                    <div className={`p-2 rounded-xl ${signUpRole === 'STUDENT' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
                      <GraduationCap className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="block text-xs font-extrabold">Student</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSignUpRole('TEACHER')}
                    className={`p-3.5 rounded-2xl border text-left flex items-center gap-3 transition-all ${
                      signUpRole === 'TEACHER'
                        ? 'border-indigo-500 bg-indigo-950/60 text-white shadow-lg shadow-indigo-950/50'
                        : 'border-slate-800 bg-slate-950/50 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                    }`}
                  >
                    <div className={`p-2 rounded-xl ${signUpRole === 'TEACHER' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
                      <UserCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="block text-xs font-extrabold">Teacher</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">Full Name</label>
                <input
                  type="text"
                  required
                  value={signUpName}
                  onChange={(e) => setSignUpName(e.target.value)}
                  className="block w-full px-4 py-2.5 border border-slate-800 rounded-xl bg-slate-950 text-white placeholder-slate-500 focus:border-indigo-500 text-sm font-medium outline-none transition"
                  placeholder={signUpRole === 'STUDENT' ? 'e.g. Alex Johnson' : 'e.g. Prof. Sarah Miller'}
                />
              </div>

              {/* Email & Password */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">Email</label>
                  <input
                    type="email"
                    required
                    value={signUpEmail}
                    onChange={(e) => setSignUpEmail(e.target.value)}
                    className="block w-full px-3.5 py-2.5 border border-slate-800 rounded-xl bg-slate-950 text-white placeholder-slate-500 focus:border-indigo-500 text-xs font-medium outline-none transition"
                    placeholder="your@email.com"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">Password</label>
                  <input
                    type="password"
                    required
                    value={signUpPassword}
                    onChange={(e) => setSignUpPassword(e.target.value)}
                    className="block w-full px-3.5 py-2.5 border border-slate-800 rounded-xl bg-slate-950 text-white placeholder-slate-500 focus:border-indigo-500 text-xs font-medium outline-none transition"
                    placeholder="Min. 6 chars"
                  />
                </div>
              </div>

              {/* Subject for Teachers */}
              {signUpRole === 'TEACHER' && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">Subject / Department</label>
                  <input
                    type="text"
                    value={signUpSubject}
                    onChange={(e) => setSignUpSubject(e.target.value)}
                    className="block w-full px-4 py-2.5 border border-slate-800 rounded-xl bg-slate-950 text-white placeholder-slate-500 focus:border-indigo-500 text-xs font-medium outline-none transition"
                    placeholder="e.g. Mathematics, Science, Computer Science"
                  />
                </div>
              )}

              {/* CODES REQUIRED FOR REGISTRATION */}
              <div className="p-4 bg-indigo-950/40 border border-indigo-900/60 rounded-2xl space-y-3">
                <div className="flex items-center gap-2 text-indigo-300 text-xs font-bold uppercase tracking-wider">
                  <KeyRound className="w-4 h-4 text-indigo-400" />
                  {signUpRole === 'STUDENT' ? 'Campus & Class Joining Codes' : 'Campus Joining Code'}
                </div>

                {/* Institution Code */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Institution Code <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={institutionCode}
                    onChange={(e) => setInstitutionCode(e.target.value)}
                    className="block w-full px-3.5 py-2 border border-indigo-900/80 rounded-xl bg-slate-950 text-indigo-300 placeholder-slate-600 focus:border-indigo-500 text-xs font-mono font-extrabold outline-none uppercase tracking-widest"
                    placeholder="e.g. INST-9821K"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Provided by your school administrator.
                  </p>
                </div>

                {/* Class & Section Code for Students */}
                {signUpRole === 'STUDENT' && (
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      Class & Section Code <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={classCode}
                      onChange={(e) => setClassCode(e.target.value)}
                      className="block w-full px-3.5 py-2 border border-indigo-900/80 rounded-xl bg-slate-950 text-indigo-300 placeholder-slate-600 focus:border-indigo-500 text-xs font-mono font-extrabold outline-none uppercase tracking-widest"
                      placeholder="e.g. CLS-82M9P"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">
                      Provided by your class teacher or section coordinator.
                    </p>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 px-4 rounded-xl shadow-lg shadow-indigo-600/30 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 transition-all flex justify-center items-center gap-2 disabled:opacity-50"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>Register Account <ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}
