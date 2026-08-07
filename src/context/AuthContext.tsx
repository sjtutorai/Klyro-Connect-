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
  institutionName?: string;
  phone?: string;
  address?: string;
  website?: string;
  schoolCode?: string;
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateUserPartial: (fields: Partial<User>) => void;
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
            if (firebaseUser.email === 'sjtutorai@gmail.com') {
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
        } catch (error: any) {
          console.error("Error fetching user data:", error);
          // Fallback to basic user info if Firestore is unreachable
          const fallbackUser: Omit<User, 'id'> = {
            email: firebaseUser.email || '',
            name: firebaseUser.displayName || 'User',
            role: firebaseUser.email === 'sjtutorai@gmail.com' ? 'SUPER_ADMIN' : 'STUDENT',
            institutionId: null
          };
          setUser({ id: firebaseUser.uid, ...fallbackUser } as User);
        }
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const refreshUser = async () => {
    if (!auth.currentUser) return;
    try {
      const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
      if (userDoc.exists()) {
        setUser({ id: auth.currentUser.uid, ...userDoc.data() } as User);
      }
    } catch (err) {
      console.error("Error refreshing user:", err);
    }
  };

  const updateUserPartial = (fields: Partial<User>) => {
    setUser(prev => prev ? { ...prev, ...fields } : null);
  };

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, logout, refreshUser, updateUserPartial }}>
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

