import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export type User = {
  id: string;
  email: string;
  name: string;
  role: 'SUPER_ADMIN' | 'INSTITUTION' | 'TEACHER' | 'STUDENT';
  institutionId?: string | null;
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            setUser({ id: firebaseUser.uid, ...userDoc.data() } as User);
          } else {
            // Auto-create admin if it's the specific email
            if (firebaseUser.email === 'krishay5712@gmail.com') {
              const adminUser: Omit<User, 'id'> = {
                email: firebaseUser.email,
                name: 'Super Admin',
                role: 'SUPER_ADMIN',
                institutionId: null
              };
              await setDoc(doc(db, 'users', firebaseUser.uid), adminUser);
              setUser({ id: firebaseUser.uid, ...adminUser } as User);
            } else {
              // Default to student if no role found
              const defaultUser: Omit<User, 'id'> = {
                email: firebaseUser.email || '',
                name: firebaseUser.displayName || 'User',
                role: 'STUDENT',
                institutionId: null
              };
              await setDoc(doc(db, 'users', firebaseUser.uid), defaultUser);
              setUser({ id: firebaseUser.uid, ...defaultUser } as User);
            }
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

