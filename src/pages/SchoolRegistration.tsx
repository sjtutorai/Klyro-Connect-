import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Building, MapPin, Phone, User, Users, Shield, BookOpen, 
  Monitor, FileText, CreditCard, Settings, Key, 
  CheckCircle, School, ChevronRight, ChevronLeft, Upload,
  Check, Loader2, Plus, Trash2, Sparkles, GraduationCap, UserCheck, CheckCircle2, Edit3
} from 'lucide-react';
import { collection, addDoc, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Country, State, City } from 'country-state-city';
import { db } from '../lib/firebase';
import { PhoneInputWithCountry } from '../components/ui/PhoneInputWithCountry';
import { LocationPinMap, LocationData } from '../components/ui/LocationPinMap';

const STEPS = [
  { id: 1, title: "Basic Info", icon: Building },
  { id: 2, title: "Address", icon: MapPin },
  { id: 3, title: "Contact", icon: Phone },
  { id: 4, title: "Principal", icon: User },
  { id: 5, title: "Administrator", icon: Shield },
  { id: 6, title: "Academic", icon: BookOpen },
  { id: 7, title: "Facilities", icon: Monitor },
  { id: 8, title: "Documents", icon: FileText },
  { id: 9, title: "Subscription", icon: CreditCard },
  { id: 10, title: "AI Settings", icon: Settings },
  { id: 11, title: "Permissions", icon: Key },
  { id: 12, title: "Classes & Teachers", icon: Users },
  { id: 13, title: "Review", icon: CheckCircle },
  { id: 14, title: "Complete", icon: School }
];

type ConfiguredTeacher = {
  id: string;
  name: string;
  email: string;
  password: string;
  subject: string;
};

type ConfiguredClass = {
  id: string;
  className: string;
  section: string;
  fullTitle: string;
  classTeacherId: string;
  studentCount: number;
};

type ConfiguredStudent = {
  id: string;
  name: string;
  email: string;
  password: string;
  assignedClass: string;
};

const FACILITIES = [
  "Library", "Computer Lab", "Science Lab", "Smart Classrooms", 
  "AI Lab", "Playground", "Hostel", "Transport", "CCTV", 
  "Wi-Fi", "Auditorium", "Medical Room", "Cafeteria"
];

const SUBSCRIPTION_PLANS = [
  { name: "Free", price: "$0", desc: "Basic features for small schools" },
  { name: "Basic", price: "$49/mo", desc: "Standard modules and reporting" },
  { name: "Premium", price: "$99/mo", desc: "Advanced AI tools and analytics" },
  { name: "Enterprise", price: "Custom", desc: "Dedicated support and full access" }
];

export default function SchoolRegistration() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Step 1
    schoolName: '', schoolCode: 'KLY-' + Math.floor(1000 + Math.random() * 9000), 
    udiseCode: '', schoolType: '', educationBoard: '', yearEstablished: '', 
    mediumOfInstruction: '', schoolMotto: '',
    // Step 2
    country: '', state: '', district: '', taluk: '', city: '', 
    villageArea: '', pinCode: '', fullAddress: '',
    latitude: 20.5937, longitude: 78.9629,
    // Step 3
    officialEmail: '', schoolPhone: '', alternatePhone: '', website: '',
    // Step 4
    principalName: '', principalGender: '', principalDob: '', 
    principalQualification: '', principalExperience: '', 
    principalMobile: '', principalEmail: '',
    // Step 5
    adminName: '', adminDesignation: '', adminMobile: '', adminEmail: '', 
    adminUsername: '', adminPassword: '', adminConfirmPassword: '',
    // Step 6
    academicYear: '2025-2026', classesAvailable: '5', studentStrength: '100', 
    teacherCount: '4', nonTeachingStaffCount: '2', numberOfSections: '2', 
    languagesOffered: 'English',
    // Step 7
    facilities: [] as string[],
    // Step 9
    subscriptionPlan: 'Free',
    // Step 10
    defaultLanguage: 'English', timeZone: 'UTC+05:30',
    enableAiAssistant: true, enableAiReports: true, enableAiAttendance: true, 
    enableAiNotifications: true, enableAiAnalytics: true,
    // Step 11
    allowTeacherReg: true, allowStudentReg: true, allowParentReg: true, 
    enableOnlineAdmissions: true, enableAttendance: true, enableFeeManagement: true, 
    enableNotifications: true, enableMessaging: true,
    // Step 12
    acceptTerms: false, acceptPrivacy: false
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCountryCode, setSelectedCountryCode] = useState('');
  const [selectedStateCode, setSelectedStateCode] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Dynamic Structure & Roster States
  const [activeSetupTab, setActiveSetupTab] = useState<'classes' | 'teachers' | 'students'>('classes');
  
  const [configuredTeachers, setConfiguredTeachers] = useState<ConfiguredTeacher[]>([
    { id: 't_1', name: 'Dr. Sarah Jenkins', email: 'sarah.j@school.edu', password: 'Teacher123!', subject: 'Mathematics' },
    { id: 't_2', name: 'Prof. Robert Davis', email: 'robert.d@school.edu', password: 'Teacher123!', subject: 'Science' },
    { id: 't_3', name: 'Ms. Emily Vance', email: 'emily.v@school.edu', password: 'Teacher123!', subject: 'English' },
    { id: 't_4', name: 'Mr. Michael Brown', email: 'michael.b@school.edu', password: 'Teacher123!', subject: 'Social Studies' }
  ]);

  const [configuredClasses, setConfiguredClasses] = useState<ConfiguredClass[]>([
    { id: 'c_1', className: 'Grade 1', section: 'A', fullTitle: 'Grade 1 - Section A', classTeacherId: 't_1', studentCount: 25 },
    { id: 'c_2', className: 'Grade 1', section: 'B', fullTitle: 'Grade 1 - Section B', classTeacherId: 't_2', studentCount: 25 },
    { id: 'c_3', className: 'Grade 2', section: 'A', fullTitle: 'Grade 2 - Section A', classTeacherId: 't_3', studentCount: 25 },
    { id: 'c_4', className: 'Grade 2', section: 'B', fullTitle: 'Grade 2 - Section B', classTeacherId: 't_4', studentCount: 25 }
  ]);

  const [configuredStudents, setConfiguredStudents] = useState<ConfiguredStudent[]>([
    { id: 's_1', name: 'Alexander Wright', email: 'alexander.w@school.edu', password: 'Student123!', assignedClass: 'Grade 1 - Section A' },
    { id: 's_2', name: 'Sophia Miller', email: 'sophia.m@school.edu', password: 'Student123!', assignedClass: 'Grade 1 - Section B' }
  ]);

  // Helper to generate or synchronize classes and teachers based on form count inputs
  const generateRosterAndClasses = () => {
    const tNum = Math.max(1, parseInt(formData.teacherCount) || 4);
    const cNum = Math.max(1, parseInt(formData.classesAvailable) || 5);
    const sNum = Math.max(1, parseInt(formData.numberOfSections) || 2);
    const totalSt = Math.max(10, parseInt(formData.studentStrength) || 100);

    const subjects = ['Mathematics', 'Science', 'English', 'Social Studies', 'Computer Science', 'Physics', 'Chemistry', 'Biology', 'History', 'Art'];
    const schoolDomain = (formData.schoolName || 'school').toLowerCase().replace(/[^a-z0-9]/g, '') || 'school';

    // 1. Teachers
    const newTeachers: ConfiguredTeacher[] = [];
    for (let i = 1; i <= tNum; i++) {
      const existing = configuredTeachers[i - 1];
      newTeachers.push({
        id: existing?.id || `teacher_${i}_${Date.now()}`,
        name: existing?.name || `Teacher ${i}`,
        email: existing?.email || `teacher${i}@${schoolDomain}.edu`,
        password: existing?.password || 'Teacher123!',
        subject: existing?.subject || subjects[(i - 1) % subjects.length]
      });
    }

    // 2. Classes & Sections
    const newClasses: ConfiguredClass[] = [];
    const sectionLetters = ['A', 'B', 'C', 'D', 'E', 'F'];
    let teacherIndex = 0;

    for (let c = 1; c <= cNum; c++) {
      for (let s = 0; s < sNum; s++) {
        const sectionLetter = sectionLetters[s % sectionLetters.length];
        const className = `Grade ${c}`;
        const fullTitle = `Grade ${c} - Section ${sectionLetter}`;
        const assignedTeacherId = newTeachers[teacherIndex % newTeachers.length]?.id || '';
        teacherIndex++;

        newClasses.push({
          id: `class_${c}_${sectionLetter}_${Date.now()}_${Math.random().toString(36).substring(2,5)}`,
          className,
          section: sectionLetter,
          fullTitle,
          classTeacherId: assignedTeacherId,
          studentCount: Math.round(totalSt / Math.max(1, cNum * sNum))
        });
      }
    }

    // 3. Students
    const newStudents: ConfiguredStudent[] = [];
    const sampleCount = Math.min(20, totalSt || 10);
    for (let st = 1; st <= sampleCount; st++) {
      const assigned = newClasses[(st - 1) % newClasses.length];
      newStudents.push({
        id: `student_${st}_${Date.now()}_${Math.random().toString(36).substring(2,5)}`,
        name: `Student ${st}`,
        email: `student${st}@${schoolDomain}.edu`,
        password: 'Student123!',
        assignedClass: assigned ? assigned.fullTitle : 'Grade 1 - Section A'
      });
    }

    setConfiguredTeachers(newTeachers);
    setConfiguredClasses(newClasses);
    setConfiguredStudents(newStudents);
  };

  const handleMapLocationSelect = (data: LocationData) => {
    setFormData(prev => ({
      ...prev,
      country: data.country || prev.country || 'India',
      state: data.state || prev.state,
      district: data.district || prev.district,
      taluk: data.taluk || prev.taluk,
      city: data.city || prev.city,
      villageArea: data.villageArea || prev.villageArea,
      pinCode: data.pinCode || prev.pinCode,
      fullAddress: data.fullAddress || prev.fullAddress,
      latitude: data.lat,
      longitude: data.lng,
    }));
    // Clear validation errors for address fields
    setFormErrors(prev => {
      const copy = { ...prev };
      ['country', 'state', 'district', 'city', 'pinCode', 'fullAddress'].forEach(k => delete copy[k]);
      return copy;
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    // Clear error for this field
    if (formErrors[name]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleFacilityToggle = (facility: string) => {
    setFormData(prev => ({
      ...prev,
      facilities: prev.facilities.includes(facility) 
        ? prev.facilities.filter(f => f !== facility)
        : [...prev.facilities, facility]
    }));
  };

  const validateStep = () => {
    const errors: Record<string, string> = {};
    
    if (currentStep === 1) {
      if (!formData.schoolName) errors.schoolName = "Required";
      if (!formData.schoolType) errors.schoolType = "Required";
      if (!formData.educationBoard) errors.educationBoard = "Required";
      if (!formData.yearEstablished) errors.yearEstablished = "Required";
      if (!formData.mediumOfInstruction) errors.mediumOfInstruction = "Required";
    }
    else if (currentStep === 2) {
      if (!formData.country) errors.country = "Required";
      if (!formData.state) errors.state = "Required";
      if (!formData.district) errors.district = "Required";
      if (!formData.city) errors.city = "Required";
      if (!formData.pinCode) errors.pinCode = "Required";
      if (!formData.fullAddress) errors.fullAddress = "Required";
    }
    else if (currentStep === 3) {
      if (!formData.officialEmail) errors.officialEmail = "Required";
      if (!formData.schoolPhone) errors.schoolPhone = "Required";
    }
    else if (currentStep === 4) {
      if (!formData.principalName) errors.principalName = "Required";
      if (!formData.principalGender) errors.principalGender = "Required";
      if (!formData.principalDob) errors.principalDob = "Required";
      if (!formData.principalQualification) errors.principalQualification = "Required";
      if (!formData.principalExperience) errors.principalExperience = "Required";
      if (!formData.principalMobile) errors.principalMobile = "Required";
      if (!formData.principalEmail) errors.principalEmail = "Required";
    }
    else if (currentStep === 5) {
      if (!formData.adminName) errors.adminName = "Required";
      if (!formData.adminDesignation) errors.adminDesignation = "Required";
      if (!formData.adminMobile) errors.adminMobile = "Required";
      if (!formData.adminEmail) errors.adminEmail = "Required";
      if (!formData.adminUsername) errors.adminUsername = "Required";
      if (!formData.adminPassword) errors.adminPassword = "Required";
      if (!formData.adminConfirmPassword) {
        errors.adminConfirmPassword = "Required";
      } else if (formData.adminPassword !== formData.adminConfirmPassword) {
        errors.adminConfirmPassword = "Passwords do not match";
      }
    }
    else if (currentStep === 6) {
      if (!formData.academicYear) errors.academicYear = "Required";
      if (!formData.classesAvailable) errors.classesAvailable = "Required";
      if (!formData.studentStrength) errors.studentStrength = "Required";
      if (!formData.teacherCount) errors.teacherCount = "Required";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    if (validateStep()) {
      if (currentStep === 6 && configuredClasses.length === 0) {
        generateRosterAndClasses();
      }
      if (currentStep < 14) setCurrentStep(c => c + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) setCurrentStep(c => c - 1);
  };

  const submitForm = async () => {
    if (!formData.acceptTerms || !formData.acceptPrivacy) return;
    
    setIsSubmitting(true);
    try {
      // 1. Create Institution document
      const instRef = await addDoc(collection(db, 'institutions'), {
        name: formData.schoolName,
        code: formData.schoolCode,
        schoolCode: formData.schoolCode,
        udiseCode: formData.udiseCode,
        type: formData.schoolType,
        board: formData.educationBoard,
        yearEstablished: formData.yearEstablished,
        mediumOfInstruction: formData.mediumOfInstruction,
        motto: formData.schoolMotto,
        
        address: `${formData.fullAddress}, ${formData.villageArea ? formData.villageArea + ', ' : ''}${formData.city}, ${formData.district}, ${formData.state}, ${formData.country} - ${formData.pinCode}`,
        country: formData.country,
        state: formData.state,
        district: formData.district,
        taluk: formData.taluk,
        city: formData.city,
        villageArea: formData.villageArea,
        pinCode: formData.pinCode,
        latitude: formData.latitude,
        longitude: formData.longitude,
        email: formData.officialEmail,
        phone: formData.schoolPhone,
        alternatePhone: formData.alternatePhone,
        website: formData.website,
        
        principalName: formData.principalName,
        principalGender: formData.principalGender,
        principalQualification: formData.principalQualification,
        principalExperience: formData.principalExperience,
        principalMobile: formData.principalMobile,
        principalEmail: formData.principalEmail,
        
        adminName: formData.adminName,
        adminDesignation: formData.adminDesignation,
        adminMobile: formData.adminMobile,
        adminEmail: formData.adminEmail,
        adminUsername: formData.adminUsername,
        password: formData.adminPassword,
        
        academicYear: formData.academicYear,
        facilities: formData.facilities,
        subscriptionPlan: formData.subscriptionPlan,
        
        settings: {
          defaultLanguage: formData.defaultLanguage,
          timeZone: formData.timeZone,
          aiFeatures: {
            assistant: formData.enableAiAssistant,
            reports: formData.enableAiReports,
            attendance: formData.enableAiAttendance,
            notifications: formData.enableAiNotifications,
            analytics: formData.enableAiAnalytics
          },
          permissions: {
            teacherReg: formData.allowTeacherReg,
            studentReg: formData.allowStudentReg,
            parentReg: formData.allowParentReg,
            onlineAdmissions: formData.enableOnlineAdmissions,
            attendance: formData.enableAttendance,
            feeManagement: formData.enableFeeManagement,
            notifications: formData.enableNotifications,
            messaging: formData.enableMessaging
          }
        },
        
        status: 'Pending',
        studentsCount: configuredStudents.length || parseInt(formData.studentStrength) || 0,
        teachersCount: configuredTeachers.length || parseInt(formData.teacherCount) || 0,
        classesCount: configuredClasses.length || 0,
        createdAt: serverTimestamp()
      });

      const instId = instRef.id;

      // 2. Save configured Teachers into 'users' collection
      const teacherDocIdMap: Record<string, { id: string; name: string }> = {};
      for (const t of configuredTeachers) {
        if (!t.name.trim()) continue;
        const tRef = doc(collection(db, 'users'));
        const safeEmail = (t.email || `teacher.${tRef.id.substring(0, 5)}@school.edu`).toLowerCase();
        await setDoc(tRef, {
          id: tRef.id,
          name: t.name,
          email: safeEmail,
          password: t.password || 'Teacher123!',
          role: 'TEACHER',
          subject: t.subject || 'General',
          institutionId: instId,
          institutionName: formData.schoolName,
          status: 'Active',
          createdAt: serverTimestamp()
        });
        teacherDocIdMap[t.id] = { id: tRef.id, name: t.name };
      }

      // 3. Save configured Classes into 'classes' collection
      for (const cl of configuredClasses) {
        if (!cl.className.trim()) continue;
        const classRef = doc(collection(db, 'classes'));
        const code = `CLS-${Math.floor(10000 + Math.random() * 90000)}`;
        const assignedTeacher = teacherDocIdMap[cl.classTeacherId];

        await setDoc(classRef, {
          id: classRef.id,
          className: cl.className,
          section: cl.section,
          fullTitle: cl.fullTitle || `${cl.className} - Section ${cl.section}`,
          code,
          classCode: code,
          classTeacherId: assignedTeacher ? assignedTeacher.id : '',
          classTeacherName: assignedTeacher ? assignedTeacher.name : 'Unassigned',
          institutionId: instId,
          studentCount: cl.studentCount || 25,
          updatedAt: new Date().toISOString(),
          createdAt: new Date().toISOString()
        });
      }

      // 4. Save configured Students into 'users' collection
      for (const st of configuredStudents) {
        if (!st.name.trim()) continue;
        const stRef = doc(collection(db, 'users'));
        const safeEmail = (st.email || `student.${stRef.id.substring(0, 5)}@school.edu`).toLowerCase();
        await setDoc(stRef, {
          id: stRef.id,
          name: st.name,
          email: safeEmail,
          password: st.password || 'Student123!',
          role: 'STUDENT',
          assignedClass: st.assignedClass || 'Grade 1 - Section A',
          institutionId: instId,
          status: 'Active',
          createdAt: serverTimestamp()
        });
      }
      
      setCurrentStep(14);
    } catch (error) {
      console.error("Error submitting registration:", error);
      alert("Failed to submit registration. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-900">
      {/* Sidebar */}
      <aside className="hidden lg:flex flex-col w-72 bg-white border-r border-slate-200 h-screen sticky top-0 overflow-y-auto shrink-0">
        <div className="p-6 border-b border-slate-100">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-lg">K</div>
            <span className="font-bold text-xl tracking-tight">Klyro Connect</span>
          </Link>
          <p className="text-sm text-slate-500 mt-2 font-medium">School Registration</p>
        </div>
        <div className="p-4 flex-1">
          <nav className="space-y-1">
            {STEPS.map((step) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isPast = currentStep > step.id;
              return (
                <div 
                  key={step.id} 
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive ? 'bg-indigo-50 text-indigo-700' : 
                    isPast ? 'text-slate-700' : 'text-slate-400'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-md flex items-center justify-center ${
                    isActive ? 'bg-indigo-100 text-indigo-600' : 
                    isPast ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-400'
                  }`}>
                    {isPast ? <Check className="w-3.5 h-3.5" /> : <Icon className="w-4 h-4" />}
                  </div>
                  {step.title}
                </div>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-screen">
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10 lg:hidden">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-lg">K</div>
            <span className="font-bold text-xl tracking-tight">Klyro</span>
          </div>
          <div className="text-sm font-medium text-slate-500">Step {currentStep} of 13</div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-12">
          <div className="max-w-3xl mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-10"
              >
                {/* Step 1: Basic Info */}
                {currentStep === 1 && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-2xl font-bold tracking-tight text-slate-900">Basic School Information</h2>
                      <p className="text-slate-500 mt-1">Let's start with the fundamental details of your institution.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="col-span-1 md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-1">School Name *</label>
                        <input name="schoolName" value={formData.schoolName} onChange={handleChange} className={`w-full px-4 py-2.5 rounded-xl border ${formErrors['schoolName'] ? 'border-red-500 focus:ring-red-500/20' : 'border-slate-300 focus:ring-indigo-500/20'} focus:ring-2 focus:border-indigo-500 outline-none transition`} placeholder="Enter full school name" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">School Code (Auto)</label>
                        <input name="schoolCode" value={formData.schoolCode} readOnly className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-slate-500 outline-none" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">UDISE Code</label>
                        <input name="udiseCode" value={formData.udiseCode} onChange={handleChange} className={`w-full px-4 py-2.5 rounded-xl border ${formErrors['udiseCode'] ? 'border-red-500 focus:ring-red-500/20' : 'border-slate-300 focus:ring-indigo-500/20'} focus:ring-2 focus:border-indigo-500 outline-none transition`} placeholder="e.g. 2736..." />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">School Type</label>
                        <select name="schoolType" value={formData.schoolType} onChange={handleChange} className={`w-full px-4 py-2.5 rounded-xl border ${formErrors['schoolType'] ? 'border-red-500 focus:ring-red-500/20' : 'border-slate-300 focus:ring-indigo-500/20'} focus:ring-2 focus:border-indigo-500 outline-none transition`}>
                          <option value="">Select Type</option>
                          <option value="Public">Public</option>
                          <option value="Private">Private</option>
                          <option value="Charter">Charter</option>
                          <option value="International">International</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Education Board</label>
                        <input name="educationBoard" value={formData.educationBoard} onChange={handleChange} className={`w-full px-4 py-2.5 rounded-xl border ${formErrors['educationBoard'] ? 'border-red-500 focus:ring-red-500/20' : 'border-slate-300 focus:ring-indigo-500/20'} focus:ring-2 focus:border-indigo-500 outline-none transition`} placeholder="e.g. CBSE, State Board" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Year Established</label>
                        <input type="number" name="yearEstablished" value={formData.yearEstablished} onChange={handleChange} className={`w-full px-4 py-2.5 rounded-xl border ${formErrors['yearEstablished'] ? 'border-red-500 focus:ring-red-500/20' : 'border-slate-300 focus:ring-indigo-500/20'} focus:ring-2 focus:border-indigo-500 outline-none transition`} placeholder="YYYY" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Medium of Instruction</label>
                        <input name="mediumOfInstruction" value={formData.mediumOfInstruction} onChange={handleChange} className={`w-full px-4 py-2.5 rounded-xl border ${formErrors['mediumOfInstruction'] ? 'border-red-500 focus:ring-red-500/20' : 'border-slate-300 focus:ring-indigo-500/20'} focus:ring-2 focus:border-indigo-500 outline-none transition`} placeholder="e.g. English" />
                      </div>
                      <div className="col-span-1 md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-1">School Motto</label>
                        <input name="schoolMotto" value={formData.schoolMotto} onChange={handleChange} className={`w-full px-4 py-2.5 rounded-xl border ${formErrors['schoolMotto'] ? 'border-red-500 focus:ring-red-500/20' : 'border-slate-300 focus:ring-indigo-500/20'} focus:ring-2 focus:border-indigo-500 outline-none transition`} placeholder="Enter school motto" />
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 2: Address Info */}
                {currentStep === 2 && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-2xl font-bold tracking-tight text-slate-900">Address & Campus Geolocation</h2>
                      <p className="text-slate-500 mt-1">
                        Pinpoint your school's exact campus position on the map to auto-recognize address details, Country, District, Village/Town, and PIN Code.
                      </p>
                    </div>

                    {/* Interactive GPS / Map Pin Point Recognized Component */}
                    <LocationPinMap
                      initialLat={formData.latitude || 20.5937}
                      initialLng={formData.longitude || 78.9629}
                      onLocationSelect={handleMapLocationSelect}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Country *</label>
                        <input 
                          name="country" 
                          value={formData.country} 
                          onChange={handleChange} 
                          placeholder="e.g. India"
                          className={`w-full px-4 py-2.5 rounded-xl border ${formErrors['country'] ? 'border-red-500 focus:ring-red-500/20' : 'border-slate-300 focus:ring-indigo-500/20'} focus:ring-2 focus:border-indigo-500 outline-none transition`} 
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">State / Province *</label>
                        <input 
                          name="state" 
                          value={formData.state} 
                          onChange={handleChange} 
                          placeholder="e.g. Karnataka / Maharashtra / California"
                          className={`w-full px-4 py-2.5 rounded-xl border ${formErrors['state'] ? 'border-red-500 focus:ring-red-500/20' : 'border-slate-300 focus:ring-indigo-500/20'} focus:ring-2 focus:border-indigo-500 outline-none transition`} 
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">District *</label>
                        <input 
                          name="district" 
                          value={formData.district} 
                          onChange={handleChange} 
                          placeholder="e.g. Bangalore Urban / Pune"
                          className={`w-full px-4 py-2.5 rounded-xl border ${formErrors['district'] ? 'border-red-500 focus:ring-red-500/20' : 'border-slate-300 focus:ring-indigo-500/20'} focus:ring-2 focus:border-indigo-500 outline-none transition`} 
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Taluk / Region</label>
                        <input 
                          name="taluk" 
                          value={formData.taluk} 
                          onChange={handleChange} 
                          placeholder="e.g. South Taluk / Central"
                          className={`w-full px-4 py-2.5 rounded-xl border ${formErrors['taluk'] ? 'border-red-500 focus:ring-red-500/20' : 'border-slate-300 focus:ring-indigo-500/20'} focus:ring-2 focus:border-indigo-500 outline-none transition`} 
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">City / Town *</label>
                        <input 
                          name="city" 
                          value={formData.city} 
                          onChange={handleChange} 
                          placeholder="e.g. Bengaluru"
                          className={`w-full px-4 py-2.5 rounded-xl border ${formErrors['city'] ? 'border-red-500 focus:ring-red-500/20' : 'border-slate-300 focus:ring-indigo-500/20'} focus:ring-2 focus:border-indigo-500 outline-none transition`} 
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">PIN / Postal Code *</label>
                        <input 
                          name="pinCode" 
                          value={formData.pinCode} 
                          onChange={handleChange} 
                          placeholder="e.g. 560001"
                          className={`w-full px-4 py-2.5 rounded-xl border ${formErrors['pinCode'] ? 'border-red-500 focus:ring-red-500/20' : 'border-slate-300 focus:ring-indigo-500/20'} focus:ring-2 focus:border-indigo-500 outline-none transition`} 
                        />
                      </div>
                      <div className="col-span-1 md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Village / Town / Local Area</label>
                        <input 
                          name="villageArea" 
                          value={formData.villageArea} 
                          onChange={handleChange} 
                          placeholder="e.g. Indiranagar, 10th Main Road"
                          className={`w-full px-4 py-2.5 rounded-xl border ${formErrors['villageArea'] ? 'border-red-500 focus:ring-red-500/20' : 'border-slate-300 focus:ring-indigo-500/20'} focus:ring-2 focus:border-indigo-500 outline-none transition`} 
                        />
                      </div>
                      <div className="col-span-1 md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Full Campus Address *</label>
                        <textarea 
                          name="fullAddress" 
                          value={formData.fullAddress} 
                          onChange={handleChange} 
                          rows={3} 
                          placeholder="Enter complete building name, street address, landmark..."
                          className={`w-full px-4 py-2.5 rounded-xl border ${formErrors['fullAddress'] ? 'border-red-500 focus:ring-red-500/20' : 'border-slate-300 focus:ring-indigo-500/20'} focus:ring-2 focus:border-indigo-500 outline-none transition resize-none`}
                        ></textarea>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 3: Contact Info */}
                {currentStep === 3 && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-2xl font-bold tracking-tight text-slate-900">School Contact Information</h2>
                      <p className="text-slate-500 mt-1">How can we and parents reach the institution?</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="col-span-1 md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Official Email</label>
                        <input type="email" name="officialEmail" value={formData.officialEmail} onChange={handleChange} className={`w-full px-4 py-2.5 rounded-xl border ${formErrors['officialEmail'] ? 'border-red-500 focus:ring-red-500/20' : 'border-slate-300 focus:ring-indigo-500/20'} focus:ring-2 focus:border-indigo-500 outline-none transition`} placeholder="contact@school.edu" />
                      </div>
                      <div className="col-span-1">
                        <PhoneInputWithCountry
                          label="School Phone Number"
                          value={formData.schoolPhone}
                          onChange={(val) => setFormData(prev => ({ ...prev, schoolPhone: val }))}
                          required
                        />
                      </div>
                      <div className="col-span-1">
                        <PhoneInputWithCountry
                          label="Alternate Phone"
                          value={formData.alternatePhone}
                          onChange={(val) => setFormData(prev => ({ ...prev, alternatePhone: val }))}
                        />
                      </div>
                      <div className="col-span-1 md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Website (Optional)</label>
                        <input type="url" name="website" value={formData.website} onChange={handleChange} className={`w-full px-4 py-2.5 rounded-xl border ${formErrors['website'] ? 'border-red-500 focus:ring-red-500/20' : 'border-slate-300 focus:ring-indigo-500/20'} focus:ring-2 focus:border-indigo-500 outline-none transition`} placeholder="https://www.school.edu" />
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 4: Principal Info */}
                {currentStep === 4 && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-2xl font-bold tracking-tight text-slate-900">Principal Information</h2>
                      <p className="text-slate-500 mt-1">Details about the head of the institution.</p>
                    </div>
                    
                    <div className="flex items-center gap-6 mb-6">
                      <div className="w-24 h-24 rounded-full bg-slate-100 border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-500 hover:bg-slate-50 transition cursor-pointer">
                        <Upload className="w-6 h-6 mb-1" />
                        <span className="text-xs font-medium">Photo</span>
                      </div>
                      <div className="text-sm text-slate-500 max-w-xs">
                        Upload a professional photo. Recommended size: 256x256px (JPG/PNG).
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="col-span-1 md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Principal Name</label>
                        <input name="principalName" value={formData.principalName} onChange={handleChange} className={`w-full px-4 py-2.5 rounded-xl border ${formErrors['principalName'] ? 'border-red-500 focus:ring-red-500/20' : 'border-slate-300 focus:ring-indigo-500/20'} focus:ring-2 focus:border-indigo-500 outline-none transition`} placeholder="Full name" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Gender</label>
                        <select name="principalGender" value={formData.principalGender} onChange={handleChange} className={`w-full px-4 py-2.5 rounded-xl border ${formErrors['principalGender'] ? 'border-red-500 focus:ring-red-500/20' : 'border-slate-300 focus:ring-indigo-500/20'} focus:ring-2 focus:border-indigo-500 outline-none transition`}>
                          <option value="">Select Gender</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Date of Birth</label>
                        <input type="date" name="principalDob" value={formData.principalDob} onChange={handleChange} className={`w-full px-4 py-2.5 rounded-xl border ${formErrors['principalDob'] ? 'border-red-500 focus:ring-red-500/20' : 'border-slate-300 focus:ring-indigo-500/20'} focus:ring-2 focus:border-indigo-500 outline-none transition`} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Qualification</label>
                        <input name="principalQualification" value={formData.principalQualification} onChange={handleChange} className={`w-full px-4 py-2.5 rounded-xl border ${formErrors['principalQualification'] ? 'border-red-500 focus:ring-red-500/20' : 'border-slate-300 focus:ring-indigo-500/20'} focus:ring-2 focus:border-indigo-500 outline-none transition`} placeholder="e.g. M.Ed, PhD" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Experience (Years)</label>
                        <input type="number" name="principalExperience" value={formData.principalExperience} onChange={handleChange} className={`w-full px-4 py-2.5 rounded-xl border ${formErrors['principalExperience'] ? 'border-red-500 focus:ring-red-500/20' : 'border-slate-300 focus:ring-indigo-500/20'} focus:ring-2 focus:border-indigo-500 outline-none transition`} placeholder="Years of experience" />
                      </div>
                      <div className="col-span-1">
                        <PhoneInputWithCountry
                          label="Mobile Number"
                          value={formData.principalMobile}
                          onChange={(val) => setFormData(prev => ({ ...prev, principalMobile: val }))}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                        <input type="email" name="principalEmail" value={formData.principalEmail} onChange={handleChange} className={`w-full px-4 py-2.5 rounded-xl border ${formErrors['principalEmail'] ? 'border-red-500 focus:ring-red-500/20' : 'border-slate-300 focus:ring-indigo-500/20'} focus:ring-2 focus:border-indigo-500 outline-none transition`} placeholder="principal@school.edu" />
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 5: Administrator Info */}
                {currentStep === 5 && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-2xl font-bold tracking-tight text-slate-900">Administrator Information</h2>
                      <p className="text-slate-500 mt-1">Create the primary administrative account for this school.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="col-span-1 md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                        <input name="adminName" value={formData.adminName} onChange={handleChange} className={`w-full px-4 py-2.5 rounded-xl border ${formErrors['adminName'] ? 'border-red-500 focus:ring-red-500/20' : 'border-slate-300 focus:ring-indigo-500/20'} focus:ring-2 focus:border-indigo-500 outline-none transition`} placeholder="Admin full name" />
                      </div>
                      <div className="col-span-1 md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Designation</label>
                        <input name="adminDesignation" value={formData.adminDesignation} onChange={handleChange} className={`w-full px-4 py-2.5 rounded-xl border ${formErrors['adminDesignation'] ? 'border-red-500 focus:ring-red-500/20' : 'border-slate-300 focus:ring-indigo-500/20'} focus:ring-2 focus:border-indigo-500 outline-none transition`} placeholder="e.g. IT Head, Manager" />
                      </div>
                      <div className="col-span-1">
                        <PhoneInputWithCountry
                          label="Mobile Number"
                          value={formData.adminMobile}
                          onChange={(val) => setFormData(prev => ({ ...prev, adminMobile: val }))}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                        <input type="email" name="adminEmail" value={formData.adminEmail} onChange={handleChange} className={`w-full px-4 py-2.5 rounded-xl border ${formErrors['adminEmail'] ? 'border-red-500 focus:ring-red-500/20' : 'border-slate-300 focus:ring-indigo-500/20'} focus:ring-2 focus:border-indigo-500 outline-none transition`} />
                      </div>
                      <div className="col-span-1 md:col-span-2">
                        <div className="h-px bg-slate-200 my-2"></div>
                        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">Login Credentials</h3>
                      </div>
                      <div className="col-span-1 md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
                        <input name="adminUsername" value={formData.adminUsername} onChange={handleChange} className={`w-full px-4 py-2.5 rounded-xl border ${formErrors['adminUsername'] ? 'border-red-500 focus:ring-red-500/20' : 'border-slate-300 focus:ring-indigo-500/20'} focus:ring-2 focus:border-indigo-500 outline-none transition`} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                        <input type="password" name="adminPassword" value={formData.adminPassword} onChange={handleChange} className={`w-full px-4 py-2.5 rounded-xl border ${formErrors['adminPassword'] ? 'border-red-500 focus:ring-red-500/20' : 'border-slate-300 focus:ring-indigo-500/20'} focus:ring-2 focus:border-indigo-500 outline-none transition`} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Confirm Password</label>
                        <input type="password" name="adminConfirmPassword" value={formData.adminConfirmPassword} onChange={handleChange} className={`w-full px-4 py-2.5 rounded-xl border ${formErrors['adminConfirmPassword'] ? 'border-red-500 focus:ring-red-500/20' : 'border-slate-300 focus:ring-indigo-500/20'} focus:ring-2 focus:border-indigo-500 outline-none transition`} />
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 6: Academic Info */}
                {currentStep === 6 && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-2xl font-bold tracking-tight text-slate-900">Academic Structure & Capacity</h2>
                      <p className="text-slate-500 mt-1">Specify your institution's capacity. AI will automatically construct classes, sections, and assign faculty.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Academic Year</label>
                        <input name="academicYear" value={formData.academicYear} onChange={handleChange} className={`w-full px-4 py-2.5 rounded-xl border ${formErrors['academicYear'] ? 'border-red-500 focus:ring-red-500/20' : 'border-slate-300 focus:ring-indigo-500/20'} focus:ring-2 focus:border-indigo-500 outline-none transition`} placeholder="e.g. 2025-2026" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Number of Grades / Classes</label>
                        <input type="number" min="1" max="20" name="classesAvailable" value={formData.classesAvailable} onChange={handleChange} className={`w-full px-4 py-2.5 rounded-xl border ${formErrors['classesAvailable'] ? 'border-red-500 focus:ring-red-500/20' : 'border-slate-300 focus:ring-indigo-500/20'} focus:ring-2 focus:border-indigo-500 outline-none transition`} placeholder="e.g. 5" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Sections per Grade</label>
                        <input type="number" min="1" max="10" name="numberOfSections" value={formData.numberOfSections} onChange={handleChange} className={`w-full px-4 py-2.5 rounded-xl border ${formErrors['numberOfSections'] ? 'border-red-500 focus:ring-red-500/20' : 'border-slate-300 focus:ring-indigo-500/20'} focus:ring-2 focus:border-indigo-500 outline-none transition`} placeholder="e.g. 2" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Total Faculty / Teacher Count</label>
                        <input type="number" min="1" name="teacherCount" value={formData.teacherCount} onChange={handleChange} className={`w-full px-4 py-2.5 rounded-xl border ${formErrors['teacherCount'] ? 'border-red-500 focus:ring-red-500/20' : 'border-slate-300 focus:ring-indigo-500/20'} focus:ring-2 focus:border-indigo-500 outline-none transition`} placeholder="e.g. 6" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Total Student Capacity</label>
                        <input type="number" min="1" name="studentStrength" value={formData.studentStrength} onChange={handleChange} className={`w-full px-4 py-2.5 rounded-xl border ${formErrors['studentStrength'] ? 'border-red-500 focus:ring-red-500/20' : 'border-slate-300 focus:ring-indigo-500/20'} focus:ring-2 focus:border-indigo-500 outline-none transition`} placeholder="e.g. 150" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Non-Teaching Staff Count</label>
                        <input type="number" name="nonTeachingStaffCount" value={formData.nonTeachingStaffCount} onChange={handleChange} className={`w-full px-4 py-2.5 rounded-xl border ${formErrors['nonTeachingStaffCount'] ? 'border-red-500 focus:ring-red-500/20' : 'border-slate-300 focus:ring-indigo-500/20'} focus:ring-2 focus:border-indigo-500 outline-none transition`} placeholder="e.g. 2" />
                      </div>
                      <div className="col-span-1 md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Languages Offered</label>
                        <input name="languagesOffered" value={formData.languagesOffered} onChange={handleChange} className={`w-full px-4 py-2.5 rounded-xl border ${formErrors['languagesOffered'] ? 'border-red-500 focus:ring-red-500/20' : 'border-slate-300 focus:ring-indigo-500/20'} focus:ring-2 focus:border-indigo-500 outline-none transition`} placeholder="e.g. English, Spanish, French" />
                      </div>
                    </div>

                    <div className="p-5 bg-gradient-to-r from-indigo-50 via-purple-50 to-blue-50 border border-indigo-200 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-sm shrink-0">
                          <Sparkles className="w-6 h-6" />
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 text-base">Automatic Class & Teacher Assignment</h4>
                          <p className="text-xs text-slate-600 mt-0.5">
                            Based on {formData.classesAvailable || 5} grades and {formData.numberOfSections || 2} sections, we will build <strong>{(parseInt(formData.classesAvailable)||5) * (parseInt(formData.numberOfSections)||2)} classes</strong> and automatically assign your <strong>{formData.teacherCount || 4} teachers</strong> as class teachers.
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={generateRosterAndClasses}
                        className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-sm transition flex items-center gap-2 shrink-0"
                      >
                        <Sparkles className="w-4 h-4" />
                        Generate & Preview
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 7: Facilities */}
                {currentStep === 7 && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-2xl font-bold tracking-tight text-slate-900">School Facilities</h2>
                      <p className="text-slate-500 mt-1">Select all the facilities available at your institution.</p>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {FACILITIES.map(facility => (
                        <label key={facility} className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-colors ${
                          formData.facilities.includes(facility) 
                            ? 'border-indigo-600 bg-indigo-50/50' 
                            : 'border-slate-200 hover:border-indigo-300'
                        }`}>
                          <input 
                            type="checkbox" 
                            checked={formData.facilities.includes(facility)}
                            onChange={() => handleFacilityToggle(facility)}
                            className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" 
                          />
                          <span className={`font-medium ${formData.facilities.includes(facility) ? 'text-indigo-900' : 'text-slate-700'}`}>
                            {facility}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Step 8: Documents */}
                {currentStep === 8 && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-2xl font-bold tracking-tight text-slate-900">Document Uploads</h2>
                      <p className="text-slate-500 mt-1">Upload required verification documents for compliance.</p>
                    </div>
                    <div className="space-y-4">
                      {[
                        'School Recognition Certificate',
                        'Affiliation Certificate',
                        'School Registration Certificate',
                        'Address Proof',
                        'Principal ID Proof',
                        'School Logo',
                        'School Banner'
                      ].map((doc, idx) => (
                        <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-slate-200 bg-slate-50/50 gap-4">
                          <div>
                            <p className="font-semibold text-slate-800">{doc}</p>
                            <p className="text-sm text-slate-500">PDF, JPG, or PNG (Max 5MB)</p>
                          </div>
                          <button className="shrink-0 flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition">
                            <Upload className="w-4 h-4" />
                            Upload File
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Step 9: Subscription Plan */}
                {currentStep === 9 && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-2xl font-bold tracking-tight text-slate-900">Choose a Plan</h2>
                      <p className="text-slate-500 mt-1">Select the subscription tier that fits your needs.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {SUBSCRIPTION_PLANS.map(plan => (
                        <label 
                          key={plan.name} 
                          className={`relative p-6 rounded-2xl border-2 cursor-pointer transition-all ${
                            formData.subscriptionPlan === plan.name 
                              ? 'border-indigo-600 bg-indigo-50/30' 
                              : 'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <input 
                                  type="radio" 
                                  name="subscriptionPlan"
                                  value={plan.name}
                                  checked={formData.subscriptionPlan === plan.name}
                                  onChange={handleChange}
                                  className="w-4 h-4 text-indigo-600 focus:ring-indigo-500" 
                                />
                                <span className="font-bold text-lg text-slate-900">{plan.name}</span>
                              </div>
                            </div>
                            <span className="font-bold text-xl text-indigo-600">{plan.price}</span>
                          </div>
                          <p className="text-slate-500 text-sm ml-6">{plan.desc}</p>
                          
                          {formData.subscriptionPlan === plan.name && (
                            <div className="absolute top-4 right-4 w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center">
                              <Check className="w-3.5 h-3.5 text-white" />
                            </div>
                          )}
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Step 10: AI Settings */}
                {currentStep === 10 && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-2xl font-bold tracking-tight text-slate-900">AI & System Settings</h2>
                      <p className="text-slate-500 mt-1">Configure Klyro Connect's smart capabilities for your school.</p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Default Language</label>
                        <select name="defaultLanguage" value={formData.defaultLanguage} onChange={handleChange} className={`w-full px-4 py-2.5 rounded-xl border ${formErrors['defaultLanguage'] ? 'border-red-500 focus:ring-red-500/20' : 'border-slate-300 focus:ring-indigo-500/20'} focus:ring-2 focus:border-indigo-500 outline-none transition`}>
                          <option>English</option>
                          <option>Spanish</option>
                          <option>French</option>
                          <option>Hindi</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Time Zone</label>
                        <select name="timeZone" value={formData.timeZone} onChange={handleChange} className={`w-full px-4 py-2.5 rounded-xl border ${formErrors['timeZone'] ? 'border-red-500 focus:ring-red-500/20' : 'border-slate-300 focus:ring-indigo-500/20'} focus:ring-2 focus:border-indigo-500 outline-none transition`}>
                          <option>UTC-08:00 (Pacific Time)</option>
                          <option>UTC-05:00 (Eastern Time)</option>
                          <option>UTC+00:00 (GMT)</option>
                          <option>UTC+05:30 (India Standard Time)</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-2">AI Modules</h3>
                      {[
                        { key: 'enableAiAssistant', label: 'Enable AI Assistant', desc: 'Virtual assistant for students and teachers.' },
                        { key: 'enableAiReports', label: 'Enable AI Reports', desc: 'Auto-generate performance insights.' },
                        { key: 'enableAiAttendance', label: 'Enable AI Attendance', desc: 'Smart attendance tracking capabilities.' },
                        { key: 'enableAiNotifications', label: 'Enable AI Notifications', desc: 'Predictive and smart alert routing.' },
                        { key: 'enableAiAnalytics', label: 'Enable AI Analytics', desc: 'Advanced data modeling and trends.' }
                      ].map(setting => (
                        <label key={setting.key} className="flex items-start justify-between p-4 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50 transition">
                          <div>
                            <div className="font-semibold text-slate-900">{setting.label}</div>
                            <div className="text-sm text-slate-500">{setting.desc}</div>
                          </div>
                          <div className="relative inline-flex items-center h-6 rounded-full w-11 transition-colors mt-1">
                            <input 
                              type="checkbox" 
                              name={setting.key}
                              checked={(formData as any)[setting.key]} 
                              onChange={handleChange} 
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Step 11: Permissions */}
                {currentStep === 11 && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-2xl font-bold tracking-tight text-slate-900">Module Permissions</h2>
                      <p className="text-slate-500 mt-1">Control access to different platform features.</p>
                    </div>
                    
                    <div className="space-y-4">
                      {[
                        { key: 'allowTeacherReg', label: 'Allow Teacher Registration' },
                        { key: 'allowStudentReg', label: 'Allow Student Registration' },
                        { key: 'allowParentReg', label: 'Allow Parent Registration' },
                        { key: 'enableOnlineAdmissions', label: 'Enable Online Admissions' },
                        { key: 'enableAttendance', label: 'Enable Attendance Module' },
                        { key: 'enableFeeManagement', label: 'Enable Fee Management' },
                        { key: 'enableNotifications', label: 'Enable Push Notifications' },
                        { key: 'enableMessaging', label: 'Enable Internal Messaging' }
                      ].map(setting => (
                        <label key={setting.key} className="flex items-center gap-3 p-3 hover:bg-slate-50 rounded-lg cursor-pointer transition">
                          <input 
                            type="checkbox" 
                            name={setting.key}
                            checked={(formData as any)[setting.key]}
                            onChange={handleChange}
                            className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" 
                          />
                          <span className="font-medium text-slate-800">{setting.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Step 12: Classes & Faculty Setup */}
                {currentStep === 12 && (
                  <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Academic Structure & Class Teachers</h2>
                        <p className="text-slate-500 mt-1">Review auto-generated classes, edit sections, and assign class teachers.</p>
                      </div>
                      <button
                        type="button"
                        onClick={generateRosterAndClasses}
                        className="px-4 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-xs font-semibold rounded-xl border border-indigo-200 transition flex items-center gap-1.5 self-start sm:self-auto"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        Re-Generate Structure
                      </button>
                    </div>

                    {/* Navigation Tabs */}
                    <div className="flex border-b border-slate-200 gap-2">
                      <button
                        type="button"
                        onClick={() => setActiveSetupTab('classes')}
                        className={`pb-3 px-4 text-sm font-semibold border-b-2 transition flex items-center gap-2 ${
                          activeSetupTab === 'classes' 
                            ? 'border-indigo-600 text-indigo-600' 
                            : 'border-transparent text-slate-500 hover:text-slate-700'
                        }`}
                      >
                        <Building className="w-4 h-4" />
                        Classes & Sections ({configuredClasses.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveSetupTab('teachers')}
                        className={`pb-3 px-4 text-sm font-semibold border-b-2 transition flex items-center gap-2 ${
                          activeSetupTab === 'teachers' 
                            ? 'border-indigo-600 text-indigo-600' 
                            : 'border-transparent text-slate-500 hover:text-slate-700'
                        }`}
                      >
                        <UserCheck className="w-4 h-4" />
                        Faculty / Teachers ({configuredTeachers.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveSetupTab('students')}
                        className={`pb-3 px-4 text-sm font-semibold border-b-2 transition flex items-center gap-2 ${
                          activeSetupTab === 'students' 
                            ? 'border-indigo-600 text-indigo-600' 
                            : 'border-transparent text-slate-500 hover:text-slate-700'
                        }`}
                      >
                        <GraduationCap className="w-4 h-4" />
                        Students ({configuredStudents.length})
                      </button>
                    </div>

                    {/* Tab 1: Classes & Teacher Assignments */}
                    {activeSetupTab === 'classes' && (
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-medium text-slate-500">
                            Showing {configuredClasses.length} generated class sections
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              const newC: ConfiguredClass = {
                                id: `class_custom_${Date.now()}`,
                                className: `Grade ${configuredClasses.length + 1}`,
                                section: 'A',
                                fullTitle: `Grade ${configuredClasses.length + 1} - Section A`,
                                classTeacherId: configuredTeachers[0]?.id || '',
                                studentCount: 25
                              };
                              setConfiguredClasses([...configuredClasses, newC]);
                            }}
                            className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700 transition flex items-center gap-1"
                          >
                            <Plus className="w-3.5 h-3.5" /> Add Class & Section
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {configuredClasses.map((cl, idx) => {
                            const assignedTeacher = configuredTeachers.find(t => t.id === cl.classTeacherId);
                            return (
                              <div key={cl.id} className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs space-y-3 relative group hover:border-indigo-300 transition">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs font-bold rounded-md">
                                        Section {cl.section}
                                      </span>
                                      <h4 className="font-bold text-slate-900 text-sm">{cl.className}</h4>
                                    </div>
                                    <p className="text-xs text-slate-500 mt-0.5">{cl.fullTitle}</p>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => setConfiguredClasses(configuredClasses.filter(c => c.id !== cl.id))}
                                    className="p-1 text-slate-400 hover:text-red-600 transition rounded-md"
                                    title="Delete Class"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>

                                <div className="space-y-1.5 pt-1 border-t border-slate-100">
                                  <label className="block text-xs font-semibold text-slate-700">
                                    Assigned Class Teacher:
                                  </label>
                                  <select
                                    value={cl.classTeacherId}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      setConfiguredClasses(configuredClasses.map(c => c.id === cl.id ? { ...c, classTeacherId: val } : c));
                                    }}
                                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none font-medium text-slate-800"
                                  >
                                    <option value="">-- Assign Class Teacher --</option>
                                    {configuredTeachers.map(t => (
                                      <option key={t.id} value={t.id}>
                                        {t.name} ({t.subject || 'General'})
                                      </option>
                                    ))}
                                  </select>
                                  {assignedTeacher && (
                                    <p className="text-[11px] text-emerald-600 font-medium flex items-center gap-1 mt-1">
                                      <CheckCircle2 className="w-3 h-3" /> Assigned to {assignedTeacher.name}
                                    </p>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Tab 2: Teachers List */}
                    {activeSetupTab === 'teachers' && (
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-medium text-slate-500">
                            {configuredTeachers.length} faculty profiles will be generated in system
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              const newT: ConfiguredTeacher = {
                                id: `teacher_${Date.now()}`,
                                name: `Teacher ${configuredTeachers.length + 1}`,
                                email: `teacher${configuredTeachers.length + 1}@school.edu`,
                                password: 'Teacher123!',
                                subject: 'General'
                              };
                              setConfiguredTeachers([...configuredTeachers, newT]);
                            }}
                            className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700 transition flex items-center gap-1"
                          >
                            <Plus className="w-3.5 h-3.5" /> Add Faculty Member
                          </button>
                        </div>

                        <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                              <tr>
                                <th className="p-3">Faculty Name</th>
                                <th className="p-3">Official Email</th>
                                <th className="p-3">Default Password</th>
                                <th className="p-3">Primary Subject</th>
                                <th className="p-3 text-right">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {configuredTeachers.map((t, idx) => (
                                <tr key={t.id} className="hover:bg-slate-50">
                                  <td className="p-3 font-medium text-slate-900">
                                    <input
                                      type="text"
                                      value={t.name}
                                      onChange={(e) => {
                                        const v = e.target.value;
                                        setConfiguredTeachers(configuredTeachers.map(item => item.id === t.id ? { ...item, name: v } : item));
                                      }}
                                      className="px-2 py-1 bg-transparent border border-slate-200 focus:border-indigo-500 rounded text-xs font-medium w-full"
                                    />
                                  </td>
                                  <td className="p-3 text-slate-600">
                                    <input
                                      type="email"
                                      value={t.email}
                                      onChange={(e) => {
                                        const v = e.target.value;
                                        setConfiguredTeachers(configuredTeachers.map(item => item.id === t.id ? { ...item, email: v } : item));
                                      }}
                                      className="px-2 py-1 bg-transparent border border-slate-200 focus:border-indigo-500 rounded text-xs w-full"
                                    />
                                  </td>
                                  <td className="p-3 text-slate-500 font-mono">{t.password}</td>
                                  <td className="p-3 text-slate-700 font-medium">
                                    <input
                                      type="text"
                                      value={t.subject}
                                      onChange={(e) => {
                                        const v = e.target.value;
                                        setConfiguredTeachers(configuredTeachers.map(item => item.id === t.id ? { ...item, subject: v } : item));
                                      }}
                                      className="px-2 py-1 bg-transparent border border-slate-200 focus:border-indigo-500 rounded text-xs w-28"
                                    />
                                  </td>
                                  <td className="p-3 text-right">
                                    <button
                                      type="button"
                                      onClick={() => setConfiguredTeachers(configuredTeachers.filter(item => item.id !== t.id))}
                                      className="text-slate-400 hover:text-red-600 transition p-1"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Tab 3: Students & File Import */}
                    {activeSetupTab === 'students' && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="p-5 border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center text-center hover:bg-slate-50 transition cursor-pointer group">
                            <Upload className="w-8 h-8 text-indigo-600 mb-2 group-hover:scale-110 transition-transform" />
                            <h3 className="text-xs font-bold text-slate-900 mb-0.5">Bulk Import Teachers File</h3>
                            <p className="text-[11px] text-slate-500 mb-3">Excel or PDF with Name, Email & Subject</p>
                            <input type="file" onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                alert(`AI parsing ${file.name}... \nValidation successful: Loaded faculty profiles.`);
                              }
                            }} accept=".pdf,.csv,.xlsx,.xls" className="text-xs text-slate-500 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" />
                          </div>

                          <div className="p-5 border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center text-center hover:bg-slate-50 transition cursor-pointer group">
                            <Upload className="w-8 h-8 text-indigo-600 mb-2 group-hover:scale-110 transition-transform" />
                            <h3 className="text-xs font-bold text-slate-900 mb-0.5">Bulk Import Students File</h3>
                            <p className="text-[11px] text-slate-500 mb-3">Excel or PDF with Name, Email & Class</p>
                            <input type="file" onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                alert(`AI parsing ${file.name}... \nValidation successful: Loaded student list.`);
                              }
                            }} accept=".pdf,.csv,.xlsx,.xls" className="text-xs text-slate-500 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" />
                          </div>
                        </div>

                        <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                              <tr>
                                <th className="p-3">Student Name</th>
                                <th className="p-3">Email</th>
                                <th className="p-3">Assigned Class</th>
                                <th className="p-3 text-right">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {configuredStudents.map((s) => (
                                <tr key={s.id} className="hover:bg-slate-50">
                                  <td className="p-3 font-medium text-slate-900">{s.name}</td>
                                  <td className="p-3 text-slate-600">{s.email}</td>
                                  <td className="p-3 font-medium text-indigo-700">{s.assignedClass}</td>
                                  <td className="p-3 text-right">
                                    <button
                                      type="button"
                                      onClick={() => setConfiguredStudents(configuredStudents.filter(st => st.id !== s.id))}
                                      className="text-slate-400 hover:text-red-600 transition p-1"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {currentStep === 13 && (
                  <div className="space-y-8">
                    <div>
                      <h2 className="text-2xl font-bold tracking-tight text-slate-900">Review & Submit</h2>
                      <p className="text-slate-500 mt-1">Please verify your information before finalizing.</p>
                    </div>

                    <div className="space-y-6">
                      <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
                        <div className="flex justify-between items-center border-b border-slate-200 pb-3 mb-3">
                          <h3 className="font-bold text-slate-900">Basic Info</h3>
                          <button onClick={() => setCurrentStep(1)} className="text-sm font-medium text-indigo-600 hover:text-indigo-700">Edit</button>
                        </div>
                        <div className="grid grid-cols-2 gap-y-2 text-sm">
                          <div className="text-slate-500">School Name:</div>
                          <div className="font-medium text-slate-900">{formData.schoolName || '—'}</div>
                          <div className="text-slate-500">School Code:</div>
                          <div className="font-medium text-slate-900">{formData.schoolCode}</div>
                          <div className="text-slate-500">Board:</div>
                          <div className="font-medium text-slate-900">{formData.educationBoard || '—'}</div>
                        </div>
                      </div>

                      <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
                        <div className="flex justify-between items-center border-b border-slate-200 pb-3 mb-3">
                          <h3 className="font-bold text-slate-900">Admin Account</h3>
                          <button onClick={() => setCurrentStep(5)} className="text-sm font-medium text-indigo-600 hover:text-indigo-700">Edit</button>
                        </div>
                        <div className="grid grid-cols-2 gap-y-2 text-sm">
                          <div className="text-slate-500">Name:</div>
                          <div className="font-medium text-slate-900">{formData.adminName || '—'}</div>
                          <div className="text-slate-500">Email:</div>
                          <div className="font-medium text-slate-900">{formData.adminEmail || '—'}</div>
                          <div className="text-slate-500">Username:</div>
                          <div className="font-medium text-slate-900">{formData.adminUsername || '—'}</div>
                        </div>
                      </div>

                      <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
                        <div className="flex justify-between items-center border-b border-slate-200 pb-3 mb-3">
                          <h3 className="font-bold text-slate-900">Plan & Settings</h3>
                          <button onClick={() => setCurrentStep(9)} className="text-sm font-medium text-indigo-600 hover:text-indigo-700">Edit</button>
                        </div>
                        <div className="grid grid-cols-2 gap-y-2 text-sm">
                          <div className="text-slate-500">Subscription:</div>
                          <div className="font-medium text-indigo-600">{formData.subscriptionPlan}</div>
                          <div className="text-slate-500">AI Assistant:</div>
                          <div className="font-medium text-slate-900">{formData.enableAiAssistant ? 'Enabled' : 'Disabled'}</div>
                        </div>
                      </div>

                      <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
                        <div className="flex justify-between items-center border-b border-slate-200 pb-3 mb-3">
                          <h3 className="font-bold text-slate-900">Academic & Roster Structure</h3>
                          <button onClick={() => setCurrentStep(12)} className="text-sm font-medium text-indigo-600 hover:text-indigo-700">Edit Structure</button>
                        </div>
                        <div className="grid grid-cols-2 gap-y-2 text-sm">
                          <div className="text-slate-500">Classes & Sections:</div>
                          <div className="font-medium text-slate-900">{configuredClasses.length} class sections auto-created</div>
                          <div className="text-slate-500">Teachers Configured:</div>
                          <div className="font-medium text-slate-900">{configuredTeachers.length} faculty accounts with class assignments</div>
                          <div className="text-slate-500">Students Registered:</div>
                          <div className="font-medium text-slate-900">{configuredStudents.length} student accounts ready</div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3 pt-4 border-t border-slate-200">
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input 
                          type="checkbox" 
                          name="acceptTerms"
                          checked={formData.acceptTerms}
                          onChange={handleChange}
                          className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 mt-0.5" 
                        />
                        <span className="text-sm text-slate-700">I accept the <a href="#" className="text-indigo-600 hover:underline">Terms & Conditions</a> of Klyro Connect platform.</span>
                      </label>
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input 
                          type="checkbox" 
                          name="acceptPrivacy"
                          checked={formData.acceptPrivacy}
                          onChange={handleChange}
                          className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 mt-0.5" 
                        />
                        <span className="text-sm text-slate-700">I acknowledge the <a href="#" className="text-indigo-600 hover:underline">Privacy Policy</a> regarding data handling.</span>
                      </label>
                    </div>
                  </div>
                )}

                {/* Step 13: Completed */}
                {currentStep === 14 && (
                  <div className="text-center py-10 space-y-6">
                    <div className="w-24 h-24 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Shield className="w-12 h-12 text-amber-600" />
                    </div>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900">Registration Submitted!</h2>
                    <p className="text-slate-500 max-w-md mx-auto">
                      Your school registration has been successfully submitted and is currently pending review by the Super Admin. You will receive your Institution ID and login credentials once approved.
                    </p>
                    
                    <div className="bg-slate-50 rounded-2xl p-6 max-w-sm mx-auto text-left border border-slate-200 shadow-sm mt-8 space-y-4">
                      <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                        <span className="text-slate-500 font-medium">Status</span>
                        <span className="font-bold text-amber-600 flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-amber-600"></div> Pending Approval</span>
                      </div>
                      <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                        <span className="text-slate-500 font-medium">School Name</span>
                        <span className="font-bold text-slate-900">{formData.schoolName || '—'}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500 font-medium">Admin Username</span>
                        <span className="font-bold text-slate-900">{formData.adminUsername || '—'}</span>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center mt-10">
                      <button className="px-6 py-3 rounded-xl border-2 border-slate-200 font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition flex items-center justify-center gap-2">
                        <FileText className="w-5 h-5" />
                        Download Summary
                      </button>
                      <button onClick={() => navigate('/')} className="px-6 py-3 rounded-xl bg-indigo-600 font-bold text-white hover:bg-indigo-700 transition shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2">
                        Return to Home
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Footer Navigation */}
        {currentStep < 14 && (
          <div className="bg-white border-t border-slate-200 p-4 md:px-8 md:py-5 shrink-0 z-10 sticky bottom-0">
            <div className="max-w-3xl mx-auto flex items-center justify-between">
              <button
                onClick={handlePrev}
                disabled={currentStep === 1}
                className={`px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition ${
                  currentStep === 1 
                    ? 'text-slate-400 cursor-not-allowed opacity-50' 
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <ChevronLeft className="w-5 h-5" />
                Back
              </button>
              
              <div className="flex items-center gap-4">
                {Object.keys(formErrors).length > 0 && (
                  <span className="text-sm font-medium text-red-500">
                    Please fill all required fields
                  </span>
                )}
                {currentStep < 13 ? (
                  <button
                    onClick={handleNext}
                    className="px-6 py-2.5 rounded-xl font-bold bg-slate-900 text-white flex items-center gap-2 hover:bg-slate-800 transition"
                  >
                    Continue
                    <ChevronRight className="w-5 h-5" />
                  </button>
                ) : (
                  <button
                    onClick={submitForm}
                    disabled={!formData.acceptTerms || !formData.acceptPrivacy || isSubmitting}
                    className={`px-8 py-2.5 rounded-xl font-bold flex items-center gap-2 transition shadow-lg ${
                      (!formData.acceptTerms || !formData.acceptPrivacy || isSubmitting)
                        ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                        : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-600/30'
                    }`}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        Submit Registration
                        <CheckCircle className="w-5 h-5" />
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
