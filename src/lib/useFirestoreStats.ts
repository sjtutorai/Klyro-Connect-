import { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from './firebase';

export function useFirestoreStats() {
  const [stats, setStats] = useState<any>({
    institutions: 0,
    teachers: 0,
    students: 0,
    activeComplaints: 0,
    classes: 0,
    averageAttendance: 0,
    pendingHomework: 0,
    activeEvents: 0,
    pendingComplaints: 0,
    courses: 0,
    attendance: 0,
    unreadNotices: 0
  });

  useEffect(() => {
    async function fetchStats() {
      try {
        const usersSnap = await getDocs(collection(db, 'users'));
        let teachers = 0;
        let students = 0;
        let institutions = 0;

        usersSnap.forEach((doc) => {
          const data = doc.data();
          if (data.role === 'TEACHER') teachers++;
          if (data.role === 'STUDENT') students++;
          if (data.role === 'INSTITUTION') institutions++;
        });

        const complaintsSnap = await getDocs(collection(db, 'complaints'));
        const activeComplaints = complaintsSnap.size; // Simplify for demo

        setStats({
          institutions,
          teachers,
          students,
          activeComplaints,
          classes: 4, // Mock remaining for now
          averageAttendance: 92,
          pendingHomework: 5,
          activeEvents: 3,
          pendingComplaints: activeComplaints,
          courses: 6,
          attendance: 95,
          unreadNotices: 3
        });
      } catch (err) {
        console.error('Error fetching stats', err);
      }
    }
    
    fetchStats();
  }, []);

  return stats;
}
