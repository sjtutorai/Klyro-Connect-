import React, { useState, useEffect, useRef } from 'react';
import { PageHeader, ConfirmModal } from '../../components/ui';
import { 
  MessagesSquare, Plus, Search, Loader2, Send, Image as ImageIcon, 
  Users, Shield, ShieldAlert, Lock, Unlock, Trash2, UserPlus, X, 
  CheckCircle2, Info, Settings, MoreVertical, UserCheck, UserX, ChevronDown, Sparkles 
} from 'lucide-react';
import { 
  collection, query, where, orderBy, onSnapshot, addDoc, 
  serverTimestamp, updateDoc, doc, deleteDoc, arrayUnion, arrayRemove, getDocs 
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import { compressImageFile } from '../../lib/imageUtils';

type StudyGroup = {
  id: string;
  name: string;
  description: string;
  subject?: string;
  className?: string;
  institutionId: string;
  institutionName?: string;
  createdBy: string;
  createdByName: string;
  createdByRole: string;
  admins: string[]; // List of user IDs with group admin privileges
  members: string[]; // List of all member user IDs (institution, teachers, students)
  allowStudentChat: boolean; // Controls whether students can text
  createdAt: any;
};

type GroupMessage = {
  id: string;
  text: string;
  photoUrl?: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  createdAt: any;
};

type UserProfile = {
  id: string;
  name: string;
  email: string;
  role: string;
  className?: string;
  institutionId?: string;
};

type ClassSectionOption = {
  id: string;
  className: string;
  section: string;
  fullTitle: string;
  classTeacherId?: string;
  classTeacherName?: string;
  subjectTeachers?: { subject: string; teacherId: string; teacherName: string }[];
  studentIds?: string[];
  institutionId: string;
};

export default function StudyGroups() {
  const { user } = useAuth();
  const [groups, setGroups] = useState<StudyGroup[]>([]);
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [classList, setClassList] = useState<ClassSectionOption[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Chat state
  const [messageText, setMessageText] = useState('');
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  // Group creation state
  const [newGroupData, setNewGroupData] = useState({
    name: '',
    description: '',
    subject: 'General Study',
    className: '',
    selectedClassId: '',
    allowStudentChat: true
  });

  // Search/Filter in modals
  const [memberSearchTerm, setMemberSearchTerm] = useState('');
  const [groupSearchTerm, setGroupSearchTerm] = useState('');
  const [showScrollBottom, setShowScrollBottom] = useState(false);

  const chatContainerRef = useRef<HTMLDivElement>(null);

  const handleChatScroll = () => {
    if (!chatContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
    if (scrollHeight - scrollTop - clientHeight > 120) {
      setShowScrollBottom(true);
    } else {
      setShowScrollBottom(false);
    }
  };

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior
      });
    }
  };

  // Active Group object
  const activeGroup = groups.find(g => g.id === activeGroupId);

  // Fetch study groups
  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, 'study_groups'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: StudyGroup[] = [];
      snapshot.forEach(docSnap => {
        const data = docSnap.data() as StudyGroup;
        const item = { id: docSnap.id, ...data };
        
        // Filter by institution or user membership
        const userInstitution = user.institutionId || (user.role === 'INSTITUTION' ? user.id : '');
        const isMember = item.members?.includes(user.id) || item.admins?.includes(user.id) || item.createdBy === user.id;
        
        if (user.role === 'SUPER_ADMIN') {
          list.push(item);
        } else if (user.role === 'INSTITUTION') {
          // Main Institution sees all study groups created under their campus
          if (item.institutionId === userInstitution || item.createdBy === user.id) {
            list.push(item);
          }
        } else {
          // TEACHERS and STUDENTS: Only display the group if explicitly added as a member by the Institution
          if (isMember) {
            list.push(item);
          }
        }
      });

      // Sort by creation time
      list.sort((a, b) => {
        const tA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : (a.createdAt?.seconds ? a.createdAt.seconds * 1000 : 0);
        const tB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : (b.createdAt?.seconds ? b.createdAt.seconds * 1000 : 0);
        return tB - tA;
      });

      setGroups(list);

      if (list.length > 0) {
        setActiveGroupId(prev => {
          if (!prev || !list.some(g => g.id === prev)) {
            return list[0].id;
          }
          return prev;
        });
      } else {
        setActiveGroupId(null);
      }

      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching study groups:", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // Fetch all institution users (for adding members)
  useEffect(() => {
    if (!user) return;
    const targetInst = user.institutionId || (user.role === 'INSTITUTION' ? user.id : '');
    
    const q = query(collection(db, 'users'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const uList: UserProfile[] = [];
      snapshot.forEach(docSnap => {
        const data = docSnap.data() as UserProfile;
        const uItem = { id: docSnap.id, ...data };
        if (user.role === 'SUPER_ADMIN' || !targetInst || data.institutionId === targetInst || docSnap.id === targetInst) {
          uList.push(uItem);
        }
      });
      setAllUsers(uList);
    });

    return () => unsubscribe();
  }, [user]);

  // Fetch created classes and sections
  useEffect(() => {
    if (!user) return;
    const targetInst = user.institutionId || (user.role === 'INSTITUTION' ? user.id : '');
    if (!targetInst) return;

    const qClasses = query(collection(db, 'classes'), where('institutionId', '==', targetInst));
    const unsubscribe = onSnapshot(qClasses, (snapshot) => {
      const cList: ClassSectionOption[] = [];
      snapshot.forEach(docSnap => {
        cList.push({ id: docSnap.id, ...docSnap.data() } as ClassSectionOption);
      });
      cList.sort((a, b) => a.fullTitle?.localeCompare(b.fullTitle || '') || 0);
      setClassList(cList);
    }, (err) => {
      console.error("Error fetching classes for study groups:", err);
    });

    return () => unsubscribe();
  }, [user]);

  // Fetch messages for active group
  useEffect(() => {
    if (!activeGroupId) {
      setMessages([]);
      return;
    }

    const q = query(
      collection(db, 'study_groups', activeGroupId, 'messages'),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgList: GroupMessage[] = [];
      snapshot.forEach(docSnap => {
        msgList.push({ id: docSnap.id, ...docSnap.data() } as GroupMessage);
      });
      setMessages(msgList);
    }, (error) => {
      console.error("Error fetching messages:", error);
    });

    return () => unsubscribe();
  }, [activeGroupId]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (!chatContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 250;
    if (isNearBottom || messages.length <= 1) {
      scrollToBottom(messages.length <= 1 ? 'auto' : 'smooth');
    }
  }, [messages]);

  useEffect(() => {
    setShowScrollBottom(false);
  }, [activeGroupId]);

  // Create new group
  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (user.role !== 'INSTITUTION' && user.role !== 'SUPER_ADMIN') {
      alert('Only the Main Institution can create Study Groups.');
      return;
    }
    setIsSubmitting(true);

    const instId = user.institutionId || (user.role === 'INSTITUTION' ? user.id : '');
    
    // Member list must include creator AND the institution compulsory
    const initialMembersSet = new Set<string>([user.id, instId]);
    const initialAdminsSet = new Set<string>([user.id, instId]);

    // If a created class is selected, automatically add all teachers & students assigned to that class
    if (newGroupData.selectedClassId && newGroupData.selectedClassId !== 'custom') {
      const targetClass = classList.find(c => c.id === newGroupData.selectedClassId);
      if (targetClass) {
        // Add class teacher
        if (targetClass.classTeacherId) {
          initialMembersSet.add(targetClass.classTeacherId);
          initialAdminsSet.add(targetClass.classTeacherId);
        }
        // Add subject teachers
        if (targetClass.subjectTeachers) {
          targetClass.subjectTeachers.forEach(st => {
            if (st.teacherId) {
              initialMembersSet.add(st.teacherId);
              initialAdminsSet.add(st.teacherId);
            }
          });
        }
        // Add assigned student IDs from class record
        if (targetClass.studentIds && Array.isArray(targetClass.studentIds)) {
          targetClass.studentIds.forEach(sId => initialMembersSet.add(sId));
        }
        // Add any users in allUsers matching this class name or title
        allUsers.forEach(u => {
          if (
            u.className === targetClass.fullTitle || 
            u.className === targetClass.className ||
            u.className === `${targetClass.className} - ${targetClass.section}`
          ) {
            initialMembersSet.add(u.id);
          }
        });
      }
    }

    const initialMembers = Array.from(initialMembersSet).filter(Boolean);
    const initialAdmins = Array.from(initialAdminsSet).filter(Boolean);

    try {
      const docRef = await addDoc(collection(db, 'study_groups'), {
        name: newGroupData.name,
        description: newGroupData.description,
        subject: newGroupData.subject,
        className: newGroupData.className || 'General Class',
        classId: newGroupData.selectedClassId || null,
        institutionId: instId,
        institutionName: user.role === 'INSTITUTION' ? user.name : 'Institution',
        createdBy: user.id,
        createdByName: user.name,
        createdByRole: user.role,
        admins: initialAdmins,
        members: initialMembers,
        allowStudentChat: newGroupData.allowStudentChat,
        createdAt: serverTimestamp()
      });

      // Send initial welcome message
      await addDoc(collection(db, 'study_groups', docRef.id, 'messages'), {
        text: `Welcome to ${newGroupData.name}! This group has been officially created.`,
        senderId: 'system',
        senderName: 'System Announcement',
        senderRole: 'SYSTEM',
        createdAt: serverTimestamp()
      });

      setShowCreateModal(false);
      setNewGroupData({
        name: '',
        description: '',
        subject: 'General Study',
        className: '',
        selectedClassId: '',
        allowStudentChat: true
      });
      setActiveGroupId(docRef.id);
      alert('Study Group created successfully and members auto-assigned!');
    } catch (err) {
      console.error("Error creating group:", err);
      alert('Failed to create study group.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle student chat permission in active group
  const handleToggleStudentChat = async () => {
    if (!activeGroup) return;
    const nextState = !activeGroup.allowStudentChat;
    try {
      await updateDoc(doc(db, 'study_groups', activeGroup.id), {
        allowStudentChat: nextState
      });

      // Post an announcement message in the group chat
      await addDoc(collection(db, 'study_groups', activeGroup.id, 'messages'), {
        text: nextState 
          ? '📢 Student Chat Status Updated: Students can now send messages in this group.' 
          : '🔒 Student Chat Status Updated: Student messaging has been paused by the admin.',
        senderId: 'system',
        senderName: 'Group Admin',
        senderRole: 'SYSTEM',
        createdAt: serverTimestamp()
      });
    } catch (err) {
      console.error(err);
      alert('Failed to update student chat permissions.');
    }
  };

  // Handle Photo selection & compression
  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressedBase64 = await compressImageFile(file);
        setSelectedPhoto(compressedBase64);
      } catch (err) {
        console.error("Error compressing photo:", err);
        const reader = new FileReader();
        reader.onloadend = () => setSelectedPhoto(reader.result as string);
        reader.readAsDataURL(file);
      }
    }
  };

  // Send message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !activeGroup || (!messageText.trim() && !selectedPhoto)) return;

    // Check student chat restriction
    if (user.role === 'STUDENT' && !activeGroup.allowStudentChat) {
      alert('Student messaging is currently disabled for this group.');
      return;
    }

    setIsSendingMessage(true);
    try {
      await addDoc(collection(db, 'study_groups', activeGroup.id, 'messages'), {
        text: messageText.trim(),
        photoUrl: selectedPhoto || null,
        senderId: user.id,
        senderName: user.name,
        senderRole: user.role,
        createdAt: serverTimestamp()
      });

      setMessageText('');
      setSelectedPhoto(null);
    } catch (err) {
      console.error("Error sending message:", err);
      alert('Failed to send message.');
    } finally {
      setIsSendingMessage(false);
    }
  };

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  // Delete message
  const handleDeleteMessage = async (msgId: string) => {
    if (!activeGroupId) return;
    setMessages(prev => prev.filter(m => m.id !== msgId));
    try {
      await deleteDoc(doc(db, 'study_groups', activeGroupId, 'messages', msgId));
    } catch (err) {
      console.error(err);
    }
  };

  // Add member to active group
  const handleAddMember = async (userId: string) => {
    if (!activeGroup) return;
    try {
      await updateDoc(doc(db, 'study_groups', activeGroup.id), {
        members: arrayUnion(userId)
      });
    } catch (err) {
      console.error(err);
      alert('Failed to add member.');
    }
  };

  // Remove member from active group
  const handleRemoveMember = async (userId: string) => {
    if (!activeGroup) return;
    setConfirmModal({
      isOpen: true,
      title: 'Remove Member',
      message: 'Are you sure you want to remove this user from the study group?',
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        try {
          await updateDoc(doc(db, 'study_groups', activeGroup.id), {
            members: arrayRemove(userId),
            admins: arrayRemove(userId)
          });
        } catch (err) {
          console.error(err);
          alert('Failed to remove member.');
        }
      }
    });
  };

  // Toggle Teacher Admin Status (Main Admin feature)
  const handleToggleTeacherAdmin = async (userId: string, isCurrentlyAdmin: boolean) => {
    if (!activeGroup) return;
    try {
      await updateDoc(doc(db, 'study_groups', activeGroup.id), {
        admins: isCurrentlyAdmin ? arrayRemove(userId) : arrayUnion(userId)
      });
    } catch (err) {
      console.error(err);
      alert('Failed to change admin permissions.');
    }
  };

  // Delete entire study group
  const handleDeleteGroup = (groupId: string) => {
    const targetGroup = groups.find(g => g.id === groupId) || activeGroup;
    setConfirmModal({
      isOpen: true,
      title: 'Delete Study Group',
      message: `Are you sure you want to permanently delete "${targetGroup?.name || 'this group'}"? All chat history will be removed.`,
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        setGroups(prev => prev.filter(g => g.id !== groupId));
        if (activeGroupId === groupId) {
          const remaining = groups.filter(g => g.id !== groupId);
          setActiveGroupId(remaining[0]?.id || null);
        }
        try {
          await deleteDoc(doc(db, 'study_groups', groupId));
        } catch (err) {
          console.error(err);
          alert('Failed to delete group.');
        }
      }
    });
  };

  // Role Checks
  const isInstitutionAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'INSTITUTION' || (activeGroup && activeGroup.institutionId === user?.id);
  const isGroupAdmin = isInstitutionAdmin || (activeGroup && activeGroup.admins?.includes(user?.id || '')) || (activeGroup && activeGroup.createdBy === user?.id);
  const isTeacher = user?.role === 'TEACHER';
  const isStudent = user?.role === 'STUDENT';
  
  // Can current user manage members (Institution & Teachers)
  const canManageMembers = isInstitutionAdmin || isTeacher || isGroupAdmin;
  // Can current user toggle student chat (Institution & Teachers/Group Admins)
  const canToggleChatPermission = isInstitutionAdmin || isTeacher || isGroupAdmin;

  // Student chat allowed state
  const isStudentChatAllowed = activeGroup ? activeGroup.allowStudentChat : true;
  const canUserPostMessage = !isStudent || isStudentChatAllowed;

  // Filtered groups for left panel
  const filteredGroups = groups.filter(g => 
    g.name.toLowerCase().includes(groupSearchTerm.toLowerCase()) ||
    g.subject?.toLowerCase().includes(groupSearchTerm.toLowerCase()) ||
    g.className?.toLowerCase().includes(groupSearchTerm.toLowerCase())
  );

  return (
    <div className="w-full flex-1 flex flex-col min-h-[calc(100vh-10rem)]">
      <PageHeader 
        title="Study Groups & Discussion Hub" 
        description="Official study channels created exclusively by Main Institutions for Teachers and Students."
        action={
          (user?.role === 'INSTITUTION' || user?.role === 'SUPER_ADMIN') ? (
            <button 
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-indigo-700 transition shadow-sm shrink-0"
            >
              <Plus className="w-5 h-5" />
              <span>Create Study Group</span>
            </button>
          ) : undefined
        }
      />

      {/* Expanded Image Modal */}
      {zoomedImage && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setZoomedImage(null)}>
          <div className="relative max-w-4xl max-h-[90vh] bg-white rounded-2xl overflow-hidden p-2 shadow-2xl" onClick={e => e.stopPropagation()}>
            <button onClick={() => setZoomedImage(null)} className="absolute top-4 right-4 p-2 bg-slate-900/60 hover:bg-slate-900 text-white rounded-full transition z-10">
              <X className="w-5 h-5" />
            </button>
            <img src={zoomedImage} alt="Attachment Full View" className="w-full h-full max-h-[85vh] object-contain rounded-xl" />
          </div>
        </div>
      )}

      {/* Main Container */}
      <div className="flex-1 bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden grid lg:grid-cols-12 min-h-[620px] h-[calc(100vh-13.5rem)]">
        
        {/* Left Sidebar: Groups List */}
        <div className="lg:col-span-4 border-r border-slate-200/80 flex flex-col h-full bg-slate-50/50">
          <div className="p-4 border-b border-slate-200/80 space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input 
                type="text"
                value={groupSearchTerm}
                onChange={e => setGroupSearchTerm(e.target.value)}
                placeholder="Search groups or subjects..." 
                className="w-full pl-10 pr-4 py-2 bg-white rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-indigo-600 transition"
              />
            </div>
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 px-1">
              <span>Your Channels ({filteredGroups.length})</span>
              <span className="text-indigo-600 font-bold">{user?.role} Mode</span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {isLoading ? (
              <div className="p-8 text-center"><Loader2 className="w-6 h-6 text-indigo-600 animate-spin mx-auto" /></div>
            ) : filteredGroups.length === 0 ? (
              <div className="p-8 text-center text-slate-500 space-y-2">
                <MessagesSquare className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="font-semibold text-slate-700 text-sm">No Study Groups found</p>
                <p className="text-xs text-slate-400">
                  {user?.role === 'TEACHER' || user?.role === 'STUDENT'
                    ? 'You will see study groups here once your Institution adds you as a group member.' 
                    : 'Click "Create Study Group" to start a new discussion room.'}
                </p>
              </div>
            ) : (
              filteredGroups.map(group => {
                const isActive = group.id === activeGroupId;
                return (
                  <div
                    key={group.id}
                    onClick={() => setActiveGroupId(group.id)}
                    className={`p-4 rounded-xl cursor-pointer transition-all border ${isActive ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'bg-white hover:bg-slate-100/80 border-slate-200/60 text-slate-800'}`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h4 className="font-bold text-sm leading-snug truncate">{group.name}</h4>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${isActive ? 'bg-indigo-500 text-white' : 'bg-indigo-50 text-indigo-700'}`}>
                        {group.subject || 'General'}
                      </span>
                    </div>
                    <p className={`text-xs line-clamp-1 mb-2 ${isActive ? 'text-indigo-100' : 'text-slate-500'}`}>
                      {group.description || 'Class Discussion & Questions'}
                    </p>
                    <div className="flex items-center justify-between text-[11px] pt-2 border-t border-current/10">
                      <span className={`flex items-center gap-1 font-medium ${isActive ? 'text-indigo-100' : 'text-slate-500'}`}>
                        <Users className="w-3.5 h-3.5" /> {group.members?.length || 1} Members
                      </span>
                      <span className={`flex items-center gap-1 font-semibold ${group.allowStudentChat ? (isActive ? 'text-emerald-200' : 'text-emerald-600') : (isActive ? 'text-amber-200' : 'text-amber-600')}`}>
                        {group.allowStudentChat ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                        {group.allowStudentChat ? 'Students Chat Allowed' : 'View Only'}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side: Active Group Chat Area */}
        <div className="lg:col-span-8 flex flex-col h-full bg-white min-w-0 relative">
          {activeGroup ? (
            <>
              {/* Chat Header */}
              <div className="p-4 sm:p-5 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-3 bg-white shrink-0">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="font-bold text-slate-900 text-lg truncate">{activeGroup.name}</h3>
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                      {activeGroup.className || 'All Classes'}
                    </span>
                    <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 border ${activeGroup.allowStudentChat ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                      {activeGroup.allowStudentChat ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                      {activeGroup.allowStudentChat ? 'Student Chat Allowed' : 'Students View-Only'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 truncate">{activeGroup.description || 'Official class discussion and study channel'}</p>
                </div>

                <div className="flex items-center gap-2">
                  {/* Student Chat Toggle Button (Institution & Teachers) */}
                  {canToggleChatPermission && (
                    <button
                      onClick={handleToggleStudentChat}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 border ${activeGroup.allowStudentChat ? 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100' : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'}`}
                      title={activeGroup.allowStudentChat ? "Click to lock student messaging" : "Click to allow students to text"}
                    >
                      {activeGroup.allowStudentChat ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                      <span>{activeGroup.allowStudentChat ? 'Disable Student Chat' : 'Enable Student Chat'}</span>
                    </button>
                  )}

                  {/* Members & Settings Button */}
                  {canManageMembers && (
                    <button 
                      onClick={() => setShowMembersModal(true)}
                      className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold transition flex items-center gap-1.5"
                    >
                      <Users className="w-4 h-4 text-slate-600" />
                      <span>Members ({activeGroup.members?.length || 1})</span>
                    </button>
                  )}

                  {/* Delete Group */}
                  {isGroupAdmin && (
                    <button 
                      onClick={() => handleDeleteGroup(activeGroup.id)}
                      className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-xs font-semibold transition flex items-center gap-1"
                      title="Delete Study Group"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span className="hidden sm:inline">Delete</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Messages Feed */}
              <div ref={chatContainerRef} onScroll={handleChatScroll} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-50/30 scroll-smooth">
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400">
                    <MessagesSquare className="w-12 h-12 text-slate-300 mb-3" />
                    <p className="font-semibold text-slate-600">No messages yet in this study group</p>
                    <p className="text-xs text-slate-400 max-w-sm mt-1">Start the conversation by asking a question or sharing learning resources.</p>
                  </div>
                ) : (
                  messages.map(msg => {
                    const isSystem = msg.senderRole === 'SYSTEM' || msg.senderId === 'system';
                    const isMe = msg.senderId === user?.id;

                    if (isSystem) {
                      return (
                        <div key={msg.id} className="flex justify-center my-3">
                          <span className="text-xs font-medium text-slate-600 bg-slate-100 border border-slate-200 px-3.5 py-1 rounded-full text-center max-w-md">
                            {msg.text}
                          </span>
                        </div>
                      );
                    }

                    return (
                      <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} group`}>
                        <div className="flex items-center gap-2 mb-1 px-1">
                          <span className="text-xs font-bold text-slate-700">{msg.senderName}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.2 rounded-full ${
                            msg.senderRole === 'INSTITUTION' ? 'bg-purple-100 text-purple-700' :
                            msg.senderRole === 'TEACHER' ? 'bg-indigo-100 text-indigo-700' :
                            'bg-slate-100 text-slate-600'
                          }`}>
                            {msg.senderRole === 'INSTITUTION' ? 'Institution Admin' : msg.senderRole === 'TEACHER' ? 'Teacher' : 'Student'}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {msg.createdAt?.toDate ? msg.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                          </span>
                        </div>

                        <div className={`relative max-w-lg rounded-2xl p-3.5 text-sm shadow-sm ${
                          isMe 
                            ? 'bg-indigo-600 text-white rounded-tr-none' 
                            : 'bg-white text-slate-800 border border-slate-200/80 rounded-tl-none'
                        }`}>
                          {msg.photoUrl && (
                            <div className="mb-2 rounded-xl overflow-hidden border border-black/10 bg-black/5">
                              <img 
                                src={msg.photoUrl} 
                                alt="Attachment" 
                                className="w-full max-h-60 object-contain cursor-pointer hover:opacity-95 transition"
                                onClick={() => setZoomedImage(msg.photoUrl || null)}
                              />
                            </div>
                          )}
                          <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>

                          {/* Delete option for message owner or group admins */}
                          {(isMe || isGroupAdmin) && (
                            <button 
                              onClick={() => handleDeleteMessage(msg.id)}
                              className={`absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 rounded transition ${isMe ? 'text-indigo-200 hover:text-white hover:bg-indigo-700' : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'}`}
                              title="Delete Message"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Floating Scroll to Bottom Button */}
              {showScrollBottom && (
                <button
                  onClick={() => scrollToBottom('smooth')}
                  className="absolute bottom-24 right-6 z-20 bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-2 rounded-full shadow-lg border border-indigo-500/30 flex items-center gap-2 text-xs font-semibold transition-all hover:scale-105 active:scale-95 shadow-indigo-500/20"
                  title="Scroll to latest messages"
                >
                  <ChevronDown className="w-4 h-4 animate-bounce" />
                  <span>Scroll to Latest</span>
                </button>
              )}

              {/* Message Composer Area */}
              <div className="p-4 border-t border-slate-200/80 bg-white shrink-0">
                {!canUserPostMessage ? (
                  <div className="p-3.5 bg-amber-50/90 border border-amber-200 text-amber-900 rounded-xl text-xs font-semibold text-center flex items-center justify-center gap-2">
                    <Lock className="w-4 h-4 text-amber-600" />
                    <span>Student chat is disabled by teachers/institution in this group. You can read all posted updates.</span>
                  </div>
                ) : (
                  <form onSubmit={handleSendMessage} className="space-y-3">
                    {selectedPhoto && (
                      <div className="relative inline-block border border-slate-200 rounded-xl overflow-hidden p-1 bg-slate-50">
                        <img src={selectedPhoto} alt="Selected" className="h-20 w-auto rounded-lg object-contain" />
                        <button 
                          type="button" 
                          onClick={() => setSelectedPhoto(null)} 
                          className="absolute -top-1 -right-1 bg-rose-600 text-white rounded-full p-1 shadow hover:bg-rose-700 transition"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <label className="p-2.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl cursor-pointer transition">
                        <ImageIcon className="w-5 h-5" />
                        <input type="file" accept="image/*" className="hidden" onChange={handlePhotoSelect} />
                      </label>

                      <input 
                        type="text" 
                        value={messageText}
                        onChange={e => setMessageText(e.target.value)}
                        placeholder="Type your message or ask a question..."
                        className="flex-1 px-4 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white transition"
                      />

                      <button 
                        type="submit" 
                        disabled={isSendingMessage || (!messageText.trim() && !selectedPhoto)}
                        className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 disabled:opacity-50 transition flex items-center gap-2 shadow-sm"
                      >
                        {isSendingMessage ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        <span className="hidden sm:inline">Send</span>
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400 bg-slate-50/50">
              <MessagesSquare className="w-16 h-16 text-slate-300 mb-3" />
              <h3 className="font-bold text-slate-700 text-lg">Select a Study Group</h3>
              <p className="text-xs text-slate-400 max-w-sm mt-1">Choose a group from the left channel list to join discussions or manage group settings.</p>
            </div>
          )}
        </div>
      </div>

      {/* Create Group Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Create New Study Group</h3>
                <p className="text-xs text-slate-500 mt-0.5">Institution member will be compulsory admin of this group.</p>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateGroup} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Select Created Class & Section <span className="text-indigo-600">*</span>
                </label>
                <select 
                  value={newGroupData.selectedClassId}
                  onChange={e => {
                    const selectedId = e.target.value;
                    const targetClass = classList.find(c => c.id === selectedId);
                    if (targetClass) {
                      const fullTitle = targetClass.fullTitle || `${targetClass.className} - Section ${targetClass.section}`;
                      setNewGroupData(prev => ({
                        ...prev,
                        selectedClassId: selectedId,
                        className: fullTitle,
                        name: prev.name ? prev.name : `${fullTitle} Study Group`
                      }));
                    } else {
                      setNewGroupData(prev => ({
                        ...prev,
                        selectedClassId: selectedId,
                        className: selectedId === 'custom' ? prev.className : ''
                      }));
                    }
                  }}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none text-sm focus:ring-2 focus:ring-indigo-600 bg-slate-50 font-semibold"
                >
                  <option value="">-- Select Created Class & Section --</option>
                  {classList.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.fullTitle || `${c.className} - Section ${c.section}`}
                    </option>
                  ))}
                  <option value="custom">Other / Custom Class Batch</option>
                </select>
                {classList.length === 0 && (
                  <p className="text-[11px] text-amber-600 mt-1">
                    No created classes found. You can add classes in "Classes & Sections" menu or enter custom class.
                  </p>
                )}
              </div>

              {newGroupData.selectedClassId && newGroupData.selectedClassId !== 'custom' && (
                <div className="p-3.5 bg-indigo-50/80 border border-indigo-200/90 rounded-xl text-xs text-indigo-900 flex items-start gap-2.5">
                  <Sparkles className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-indigo-950">Auto-Enroll Class Members</p>
                    <p className="text-[11px] text-indigo-700/90 mt-0.5 leading-snug">
                      All assigned teachers & students in this Class & Section will be automatically enrolled into this Study Group so it appears on their dashboards!
                    </p>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Group Title</label>
                <input 
                  type="text" 
                  required 
                  value={newGroupData.name} 
                  onChange={e => setNewGroupData({...newGroupData, name: e.target.value})} 
                  placeholder="e.g. Grade 10 Science & Mathematics Group" 
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none text-sm focus:ring-2 focus:ring-indigo-600" 
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Subject</label>
                  <input 
                    type="text" 
                    required 
                    value={newGroupData.subject} 
                    onChange={e => setNewGroupData({...newGroupData, subject: e.target.value})} 
                    placeholder="e.g. Physics / General" 
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none text-sm focus:ring-2 focus:ring-indigo-600" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Class Name / Title</label>
                  <input 
                    type="text" 
                    required 
                    value={newGroupData.className} 
                    onChange={e => setNewGroupData({...newGroupData, className: e.target.value})} 
                    placeholder="e.g. Class 10 - Section A" 
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none text-sm focus:ring-2 focus:ring-indigo-600" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Description</label>
                <textarea 
                  rows={2} 
                  value={newGroupData.description} 
                  onChange={e => setNewGroupData({...newGroupData, description: e.target.value})} 
                  placeholder="Brief summary of group purpose..." 
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none text-sm resize-none focus:ring-2 focus:ring-indigo-600"
                ></textarea>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">Student Messaging Rights</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={newGroupData.allowStudentChat} 
                      onChange={e => setNewGroupData({...newGroupData, allowStudentChat: e.target.checked})} 
                      className="sr-only peer" 
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>
                <p className="text-[11px] text-slate-500">
                  {newGroupData.allowStudentChat 
                    ? 'Students can text and post questions in the chat.' 
                    : 'Students can only read updates sent by Teachers and Institution.'}
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button type="button" onClick={() => setShowCreateModal(false)} className="px-5 py-2 border border-slate-200 rounded-xl text-slate-700 text-sm font-semibold hover:bg-slate-50 transition">
                  Cancel
                </button>
                <button type="submit" disabled={isSubmitting} className="px-5 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition flex items-center gap-2">
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  <span>Create Group</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Members & Permissions Modal */}
      {showMembersModal && activeGroup && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 shrink-0">
              <div>
                <h3 className="text-xl font-bold text-slate-900">{activeGroup.name} — Members</h3>
                <p className="text-xs text-slate-500 mt-0.5">Manage teachers, students, and admin privileges.</p>
              </div>
              <button onClick={() => setShowMembersModal(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Student Chat Permission Control Box */}
            {canToggleChatPermission && (
              <div className="p-4 bg-indigo-50/70 border border-indigo-200/80 rounded-2xl flex flex-wrap items-center justify-between gap-3 shrink-0">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">Student Messaging Setting</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${activeGroup.allowStudentChat ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                      {activeGroup.allowStudentChat ? 'Allowed' : 'Locked'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5">Control whether student members can send messages in group chat.</p>
                </div>

                <button 
                  onClick={handleToggleStudentChat}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm ${activeGroup.allowStudentChat ? 'bg-amber-600 text-white hover:bg-amber-700' : 'bg-emerald-600 text-white hover:bg-emerald-700'}`}
                >
                  {activeGroup.allowStudentChat ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                  <span>{activeGroup.allowStudentChat ? 'Keep Students View Only' : 'Allow Students to Text'}</span>
                </button>
              </div>
            )}

            {/* Member Search */}
            <div className="relative shrink-0">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input 
                type="text" 
                value={memberSearchTerm}
                onChange={e => setMemberSearchTerm(e.target.value)}
                placeholder="Search teachers or students to add/manage..." 
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-indigo-600"
              />
            </div>

            {/* Members List */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Institution Members & Students</h4>
              
              {allUsers
                .filter(u => u.name.toLowerCase().includes(memberSearchTerm.toLowerCase()) || u.role.toLowerCase().includes(memberSearchTerm.toLowerCase()))
                .map(u => {
                  const isMember = activeGroup.members?.includes(u.id);
                  const isGroupAdminUser = activeGroup.admins?.includes(u.id);
                  const isMainInstitution = u.role === 'INSTITUTION' || u.id === activeGroup.institutionId;

                  return (
                    <div key={u.id} className="p-3.5 bg-slate-50/70 border border-slate-200/80 rounded-xl flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                          u.role === 'INSTITUTION' ? 'bg-purple-100 text-purple-700' :
                          u.role === 'TEACHER' ? 'bg-indigo-100 text-indigo-700' :
                          'bg-slate-200 text-slate-700'
                        }`}>
                          {u.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-slate-900 text-sm truncate">{u.name}</p>
                            <span className={`text-[10px] font-bold px-2 py-0.2 rounded-full ${
                              u.role === 'INSTITUTION' ? 'bg-purple-100 text-purple-700' :
                              u.role === 'TEACHER' ? 'bg-indigo-100 text-indigo-700' :
                              'bg-slate-100 text-slate-600'
                            }`}>
                              {u.role === 'INSTITUTION' ? 'Institution Main Admin' : u.role === 'TEACHER' ? 'Teacher' : 'Student'}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 truncate">{u.email}</p>
                        </div>
                      </div>

                      {/* Member Action Controls */}
                      <div className="flex items-center gap-2 shrink-0">
                        {isMember ? (
                          <>
                            {/* Make Admin Toggle for Teachers (Main Institution Admin privilege) */}
                            {isInstitutionAdmin && u.role === 'TEACHER' && !isMainInstitution && (
                              <button
                                onClick={() => handleToggleTeacherAdmin(u.id, !!isGroupAdminUser)}
                                className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition flex items-center gap-1 ${isGroupAdminUser ? 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100' : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'}`}
                                title={isGroupAdminUser ? "Revoke Admin Status" : "Grant Teacher Admin Status"}
                              >
                                <Shield className="w-3.5 h-3.5 text-indigo-600" />
                                <span>{isGroupAdminUser ? 'Group Admin ✓' : 'Make Admin'}</span>
                              </button>
                            )}

                            {/* Enrolled Status Badge or Remove Button */}
                            {isMainInstitution ? (
                              <span className="text-xs font-bold px-2.5 py-1 bg-purple-100 text-purple-800 rounded-lg">Compulsory Admin</span>
                            ) : (
                              <button 
                                onClick={() => handleRemoveMember(u.id)}
                                className="px-3 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-semibold transition flex items-center gap-1"
                              >
                                <UserX className="w-3.5 h-3.5" />
                                <span>Remove</span>
                              </button>
                            )}
                          </>
                        ) : (
                          <button 
                            onClick={() => handleAddMember(u.id)}
                            className="px-3.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition flex items-center gap-1"
                          >
                            <UserPlus className="w-3.5 h-3.5" />
                            <span>Add to Group</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100 shrink-0">
              <button onClick={() => setShowMembersModal(false)} className="px-5 py-2 bg-slate-900 text-white text-xs font-semibold rounded-xl hover:bg-slate-800 transition">
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
