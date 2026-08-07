import { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from './firebase';
import { useAuth } from '../context/AuthContext';

export function useFirestoreStats() {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>({
    institutions: 0,
    teachers: 0,
    students: 0,
    courses: 6,
    activeComplaints: 0,
    pendingComplaints: 0,
    activeEvents: 0,
    notices: 0,
    attendance: 100,
    averageAttendance: 100,
    presentRecords: 0,
    absentRecords: 0,
    totalAttendanceRecords: 0,
    pendingHomework: 0,
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

    // Listen to homeworks
    const unsubscribeHomeworks = onSnapshot(collection(db, 'homeworks'), (snapshot) => {
      let pendingHw = 0;
      snapshot.forEach(doc => {
        const data = doc.data();
        if (user.role === 'INSTITUTION' && data.institutionId !== user.institutionId) return;
        pendingHw++;
      });
      setStats(prev => ({ ...prev, pendingHomework: pendingHw }));
    });

    // Real-time listener for attendance collection
    const unsubscribeAttendance = onSnapshot(collection(db, 'attendance'), (snapshot) => {
      let presentRecords = 0;
      let absentRecords = 0;
      let totalAttendanceRecords = 0;

      snapshot.forEach(doc => {
        const data = doc.data();
        // Filter by institution if user has an institutionId
        if (user.institutionId && data.institutionId && data.institutionId !== user.institutionId) {
          return;
        }
        if (user.role === 'STUDENT' && data.studentId !== user.id) {
          return;
        }

        totalAttendanceRecords++;
        if (data.status === 'Present') presentRecords++;
        if (data.status === 'Absent') absentRecords++;
      });

      const attendancePercentage = totalAttendanceRecords > 0 
        ? Math.round((presentRecords / totalAttendanceRecords) * 100) 
        : 100;

      setStats(prev => ({ 
        ...prev, 
        attendance: attendancePercentage,
        averageAttendance: attendancePercentage,
        presentRecords,
        absentRecords,
        totalAttendanceRecords
      }));
    });

    return () => {
      unsubscribeUsers();
      unsubscribeComplaints();
      unsubscribeEvents();
      unsubscribeNotices();
      unsubscribeHomeworks();
      unsubscribeAttendance();
    };
  }, [user]);

  return stats;
}

