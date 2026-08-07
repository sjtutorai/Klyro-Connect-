import { collection, getDocs, setDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

export async function seedDefaultInstitutions() {
  try {
    const instSnap = await getDocs(collection(db, 'institutions'));
    
    // Default institutions list to ensure Firestore is pre-populated
    const defaultInstitutions = [
      {
        id: 'inst_830130',
        name: 'VAKS AI Global Academy',
        code: '830130',
        address: '742 Evergreen Terrace, Innovation Park',
        email: 'info@vaks.edu',
        phone: '+1 (800) 555-8301',
        principalName: 'Dr. Eleanor Vance',
        affiliationCode: 'CBSE-830130',
        status: 'Active',
        studentsCount: 340,
        teachersCount: 28,
        createdAt: serverTimestamp()
      },
      {
        id: 'inst_1001',
        name: 'St. Xavier Science & Tech Campus',
        code: 'INST-1001',
        address: '104 Academic Avenue, Tech District',
        email: 'admin@stxtech.edu',
        phone: '+1 (800) 555-1001',
        principalName: 'Prof. Robert Thorne',
        affiliationCode: 'ICSE-1001',
        status: 'Active',
        studentsCount: 520,
        teachersCount: 42,
        createdAt: serverTimestamp()
      },
      {
        id: 'inst_1002',
        name: 'Cambridge International High',
        code: 'INST-1002',
        address: '12 University Square, Cambridge',
        email: 'contact@cambridgehigh.org',
        phone: '+1 (800) 555-1002',
        principalName: 'Dr. Arthur Pendelton',
        affiliationCode: 'IB-1002',
        status: 'Active',
        studentsCount: 280,
        teachersCount: 22,
        createdAt: serverTimestamp()
      }
    ];

    // Check if inst_830130 exists, if not, write defaults
    const has830130 = instSnap.docs.some(d => d.id === 'inst_830130' || d.data().code === '830130' || d.data().code === 'INST-830130');
    
    if (instSnap.empty || !has830130) {
      for (const inst of defaultInstitutions) {
        const docRef = doc(db, 'institutions', inst.id);
        await setDoc(docRef, inst, { merge: true });
      }

      // Seed default classes for inst_830130
      const defaultClasses = [
        {
          id: 'cls_830130_a',
          className: 'Class 10',
          section: 'Section A',
          fullTitle: 'Class 10 - Section A',
          code: 'CLS-830130',
          institutionId: 'inst_830130',
          institutionName: 'VAKS AI Global Academy',
          classTeacherName: 'Prof. Sarah Miller',
          studentIds: [],
          createdAt: serverTimestamp()
        },
        {
          id: 'cls_1001_a',
          className: 'Class 12',
          section: 'Science A',
          fullTitle: 'Class 12 - Science A',
          code: 'CLS-10A',
          institutionId: 'inst_1001',
          institutionName: 'St. Xavier Science & Tech Campus',
          classTeacherName: 'Dr. Alan Grant',
          studentIds: [],
          createdAt: serverTimestamp()
        }
      ];

      for (const cls of defaultClasses) {
        await setDoc(doc(db, 'classes', cls.id), cls, { merge: true });
      }

      console.log('Successfully seeded default Institutions & Codes into Firestore!');
    }
  } catch (err) {
    console.error('Error seeding institutions:', err);
  }
}
