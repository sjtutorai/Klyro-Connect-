import { useState, useEffect } from 'react';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from './firebase';
import { useAuth } from '../context/AuthContext';

export function useFirestoreStats() {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>({
    institutions: 0,
    teachers: 0,
    students: 0,
    activeComplaints: 0,
    pendingComplaints: 0,
    activeEvents: 0,
    notices: 0,
    attendance: 92, // Mocked for now since attendance collection doesn't exist
    unreadNotices: 0
  });

  useEffect(() => {
    if (!user) return;

    // Listen to users for teachers/students/institutions count
    const unsubscribeUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      let teachers = 0;
      let students = 0;
      let institutions = 0;
      snapshot.forEach(doc => {
        const data = doc.data();
        // If institution logic, we might want to only count for the institution
        if (user.role === 'INSTITUTION' && data.institutionId !== user.institutionId) {
          return;
        }
        if (data.role === 'TEACHER') teachers++;
        if (data.role === 'STUDENT') students++;
        if (data.role === 'INSTITUTION') institutions++;
      });
      setStats(prev => ({ ...prev, teachers, students, institutions }));
    });

    // Listen to complaints
    const unsubscribeComplaints = onSnapshot(collection(db, 'complaints'), (snapshot) => {
      let pendingComplaints = 0;
      snapshot.forEach(doc => {
        const data = doc.data();
        if (user.role === 'INSTITUTION' && data.institutionId !== user.institutionId) return;
        if (data.status === 'Open' || data.status === 'Pending') pendingComplaints++;
      });
      setStats(prev => ({ ...prev, activeComplaints: pendingComplaints, pendingComplaints }));
    });
    
    // Listen to events
    const unsubscribeEvents = onSnapshot(collection(db, 'events'), (snapshot) => {
      let activeEvents = 0;
      snapshot.forEach(doc => {
        const data = doc.data();
        if (user.role === 'INSTITUTION' && data.institutionId !== user.institutionId) return;
        activeEvents++;
      });
      setStats(prev => ({ ...prev, activeEvents }));
    });

    // Listen to notices
    const unsubscribeNotices = onSnapshot(collection(db, 'notices'), (snapshot) => {
      let noticesCount = 0;
      snapshot.forEach(doc => {
        const data = doc.data();
        if (user.role === 'INSTITUTION' && data.institutionId !== user.institutionId) return;
        noticesCount++;
      });
      setStats(prev => ({ ...prev, notices: noticesCount, unreadNotices: noticesCount }));
    });

    return () => {
      unsubscribeUsers();
      unsubscribeComplaints();
      unsubscribeEvents();
      unsubscribeNotices();
    };
  }, [user]);

  return stats;
}
