import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Building, MapPin, Phone, User, Users, Shield, BookOpen, 
  Monitor, FileText, CreditCard, Settings, Key, 
  CheckCircle, School, ChevronRight, ChevronLeft, Upload,
  Check, Loader2
} from 'lucide-react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Country, State, City } from 'country-state-city';
import { db } from '../lib/firebase';

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
  { id: 12, title: "Initial Users", icon: Users },
  { id: 13, title: "Review", icon: CheckCircle },
  { id: 14, title: "Complete", icon: School }
];

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
    academicYear: '', classesAvailable: '', studentStrength: '', 
    teacherCount: '', nonTeachingStaffCount: '', numberOfSections: '', 
    languagesOffered: '',
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
      // Structure the data according to what Institutions.tsx expects
      // We store it directly in institutions with status 'Pending'
      await addDoc(collection(db, 'institutions'), {
        name: formData.schoolName,
        code: formData.schoolCode,
        schoolCode: formData.schoolCode,
        udiseCode: formData.udiseCode,
        type: formData.schoolType,
        board: formData.educationBoard,
        yearEstablished: formData.yearEstablished,
        mediumOfInstruction: formData.mediumOfInstruction,
        motto: formData.schoolMotto,
        
        address: `${formData.fullAddress}, ${formData.city}, ${formData.district}, ${formData.state}, ${formData.country} - ${formData.pinCode}`,
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
        password: formData.adminPassword, // Note: In production, password should be hashed, or this should create an auth user via a cloud function
        
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
        studentsCount: 0,
        teachersCount: 0,
        createdAt: serverTimestamp()
      });
      
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
                      <h2 className="text-2xl font-bold tracking-tight text-slate-900">Address Information</h2>
                      <p className="text-slate-500 mt-1">Provide the physical location details of the school.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Country</label>
                        <input name="country" value={formData.country} onChange={handleChange} className={`w-full px-4 py-2.5 rounded-xl border ${formErrors['country'] ? 'border-red-500 focus:ring-red-500/20' : 'border-slate-300 focus:ring-indigo-500/20'} focus:ring-2 focus:border-indigo-500 outline-none transition`} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">State / Province</label>
                        <input name="state" value={formData.state} onChange={handleChange} className={`w-full px-4 py-2.5 rounded-xl border ${formErrors['state'] ? 'border-red-500 focus:ring-red-500/20' : 'border-slate-300 focus:ring-indigo-500/20'} focus:ring-2 focus:border-indigo-500 outline-none transition`} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">District</label>
                        <input name="district" value={formData.district} onChange={handleChange} className={`w-full px-4 py-2.5 rounded-xl border ${formErrors['district'] ? 'border-red-500 focus:ring-red-500/20' : 'border-slate-300 focus:ring-indigo-500/20'} focus:ring-2 focus:border-indigo-500 outline-none transition`} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Taluk / Region</label>
                        <input name="taluk" value={formData.taluk} onChange={handleChange} className={`w-full px-4 py-2.5 rounded-xl border ${formErrors['taluk'] ? 'border-red-500 focus:ring-red-500/20' : 'border-slate-300 focus:ring-indigo-500/20'} focus:ring-2 focus:border-indigo-500 outline-none transition`} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">City</label>
                        <input name="city" value={formData.city} onChange={handleChange} className={`w-full px-4 py-2.5 rounded-xl border ${formErrors['city'] ? 'border-red-500 focus:ring-red-500/20' : 'border-slate-300 focus:ring-indigo-500/20'} focus:ring-2 focus:border-indigo-500 outline-none transition`} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">PIN Code</label>
                        <input name="pinCode" value={formData.pinCode} onChange={handleChange} className={`w-full px-4 py-2.5 rounded-xl border ${formErrors['pinCode'] ? 'border-red-500 focus:ring-red-500/20' : 'border-slate-300 focus:ring-indigo-500/20'} focus:ring-2 focus:border-indigo-500 outline-none transition`} />
                      </div>
                      <div className="col-span-1 md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Village / Area</label>
                        <input name="villageArea" value={formData.villageArea} onChange={handleChange} className={`w-full px-4 py-2.5 rounded-xl border ${formErrors['villageArea'] ? 'border-red-500 focus:ring-red-500/20' : 'border-slate-300 focus:ring-indigo-500/20'} focus:ring-2 focus:border-indigo-500 outline-none transition`} />
                      </div>
                      <div className="col-span-1 md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Full Address</label>
                        <textarea name="fullAddress" value={formData.fullAddress} onChange={handleChange} rows={3} className={`w-full px-4 py-2.5 rounded-xl border ${formErrors['fullAddress'] ? 'border-red-500 focus:ring-red-500/20' : 'border-slate-300 focus:ring-indigo-500/20'} focus:ring-2 focus:border-indigo-500 outline-none transition resize-none`}></textarea>
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
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">School Phone Number</label>
                        <input name="schoolPhone" value={formData.schoolPhone} onChange={handleChange} className={`w-full px-4 py-2.5 rounded-xl border ${formErrors['schoolPhone'] ? 'border-red-500 focus:ring-red-500/20' : 'border-slate-300 focus:ring-indigo-500/20'} focus:ring-2 focus:border-indigo-500 outline-none transition`} placeholder="+1..." />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Alternate Phone</label>
                        <input name="alternatePhone" value={formData.alternatePhone} onChange={handleChange} className={`w-full px-4 py-2.5 rounded-xl border ${formErrors['alternatePhone'] ? 'border-red-500 focus:ring-red-500/20' : 'border-slate-300 focus:ring-indigo-500/20'} focus:ring-2 focus:border-indigo-500 outline-none transition`} placeholder="+1..." />
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
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Mobile Number</label>
                        <input name="principalMobile" value={formData.principalMobile} onChange={handleChange} className={`w-full px-4 py-2.5 rounded-xl border ${formErrors['principalMobile'] ? 'border-red-500 focus:ring-red-500/20' : 'border-slate-300 focus:ring-indigo-500/20'} focus:ring-2 focus:border-indigo-500 outline-none transition`} placeholder="+1..." />
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
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Mobile Number</label>
                        <input name="adminMobile" value={formData.adminMobile} onChange={handleChange} className={`w-full px-4 py-2.5 rounded-xl border ${formErrors['adminMobile'] ? 'border-red-500 focus:ring-red-500/20' : 'border-slate-300 focus:ring-indigo-500/20'} focus:ring-2 focus:border-indigo-500 outline-none transition`} />
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
                      <h2 className="text-2xl font-bold tracking-tight text-slate-900">Academic Information</h2>
                      <p className="text-slate-500 mt-1">Details about the academic structure and capacity.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Academic Year</label>
                        <input name="academicYear" value={formData.academicYear} onChange={handleChange} className={`w-full px-4 py-2.5 rounded-xl border ${formErrors['academicYear'] ? 'border-red-500 focus:ring-red-500/20' : 'border-slate-300 focus:ring-indigo-500/20'} focus:ring-2 focus:border-indigo-500 outline-none transition`} placeholder="e.g. 2024-2025" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Classes Available</label>
                        <input name="classesAvailable" value={formData.classesAvailable} onChange={handleChange} className={`w-full px-4 py-2.5 rounded-xl border ${formErrors['classesAvailable'] ? 'border-red-500 focus:ring-red-500/20' : 'border-slate-300 focus:ring-indigo-500/20'} focus:ring-2 focus:border-indigo-500 outline-none transition`} placeholder="e.g. Pre-K to 12" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Student Strength</label>
                        <input type="number" name="studentStrength" value={formData.studentStrength} onChange={handleChange} className={`w-full px-4 py-2.5 rounded-xl border ${formErrors['studentStrength'] ? 'border-red-500 focus:ring-red-500/20' : 'border-slate-300 focus:ring-indigo-500/20'} focus:ring-2 focus:border-indigo-500 outline-none transition`} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Teacher Count</label>
                        <input type="number" name="teacherCount" value={formData.teacherCount} onChange={handleChange} className={`w-full px-4 py-2.5 rounded-xl border ${formErrors['teacherCount'] ? 'border-red-500 focus:ring-red-500/20' : 'border-slate-300 focus:ring-indigo-500/20'} focus:ring-2 focus:border-indigo-500 outline-none transition`} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Non-Teaching Staff Count</label>
                        <input type="number" name="nonTeachingStaffCount" value={formData.nonTeachingStaffCount} onChange={handleChange} className={`w-full px-4 py-2.5 rounded-xl border ${formErrors['nonTeachingStaffCount'] ? 'border-red-500 focus:ring-red-500/20' : 'border-slate-300 focus:ring-indigo-500/20'} focus:ring-2 focus:border-indigo-500 outline-none transition`} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Number of Sections</label>
                        <input type="number" name="numberOfSections" value={formData.numberOfSections} onChange={handleChange} className={`w-full px-4 py-2.5 rounded-xl border ${formErrors['numberOfSections'] ? 'border-red-500 focus:ring-red-500/20' : 'border-slate-300 focus:ring-indigo-500/20'} focus:ring-2 focus:border-indigo-500 outline-none transition`} />
                      </div>
                      <div className="col-span-1 md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Languages Offered</label>
                        <input name="languagesOffered" value={formData.languagesOffered} onChange={handleChange} className={`w-full px-4 py-2.5 rounded-xl border ${formErrors['languagesOffered'] ? 'border-red-500 focus:ring-red-500/20' : 'border-slate-300 focus:ring-indigo-500/20'} focus:ring-2 focus:border-indigo-500 outline-none transition`} placeholder="e.g. English, Spanish, French" />
                      </div>
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

                {/* Step 12: Review & Submit */}
                {currentStep === 12 && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-2xl font-bold tracking-tight text-slate-900">Initial Users Setup</h2>
                      <p className="text-slate-500 mt-1">Add initial teachers and students. You can add them manually or upload an Excel/PDF file with Name, Email, and Password columns. AI will automatically parse and validate the file.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="p-6 border-2 border-dashed border-slate-300 rounded-2xl flex flex-col items-center justify-center text-center hover:bg-slate-50 transition cursor-pointer group">
                        <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                          <Upload className="w-6 h-6" />
                        </div>
                        <h3 className="text-sm font-bold text-slate-900 mb-1">Upload Teachers File</h3>
                        <p className="text-xs text-slate-500 mb-4">Excel or PDF format</p>
                        <input type="file" onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            alert(`AI parsing ${file.name}... \nValidation successful: Found Name, Email, and Password columns.`);
                          }
                        }} accept=".pdf,.csv,.xlsx,.xls" className="text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" />
                      </div>

                      <div className="p-6 border-2 border-dashed border-slate-300 rounded-2xl flex flex-col items-center justify-center text-center hover:bg-slate-50 transition cursor-pointer group">
                        <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                          <Upload className="w-6 h-6" />
                        </div>
                        <h3 className="text-sm font-bold text-slate-900 mb-1">Upload Students File</h3>
                        <p className="text-xs text-slate-500 mb-4">Excel or PDF format</p>
                        <input type="file" onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            alert(`AI parsing ${file.name}... \nValidation successful: Found Name, Email, and Password columns.`);
                          }
                        }} accept=".pdf,.csv,.xlsx,.xls" className="text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" />
                      </div>
                    </div>

                    <div className="p-4 bg-amber-50 text-amber-800 rounded-xl flex items-start gap-3 border border-amber-200">
                      <Shield className="w-5 h-5 shrink-0 mt-0.5 text-amber-600" />
                      <div className="text-sm">
                        <span className="font-semibold block mb-1">AI Validation</span>
                        Our AI system will automatically extract and validate the users from your uploaded files, checking for required fields: <strong>Name, Email, and Password</strong>. Blank forms will be rejected.
                      </div>
                    </div>
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
