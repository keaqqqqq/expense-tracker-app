'use client'
import { auth, db } from '@/firebase/config';
import { User, createUserWithEmailAndPassword, onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { DocumentData, doc, getDoc } from 'firebase/firestore';
import React, { useContext, useState, useEffect, ReactNode } from 'react';

interface AuthContextType {
  currentUser: User | null;
  userDataObj: DocumentData | null;
  setUserDataObj: React.Dispatch<React.SetStateAction<DocumentData | null>>;
  signup: (email: string, password: string) => Promise<any>;
  logout: () => Promise<void>;
  login: (email: string, password: string) => Promise<any>;
  loading: boolean;
  isProfileComplete: boolean; 
  setIsProfileComplete: React.Dispatch<React.SetStateAction<boolean>>;
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userDataObj, setUserDataObj] = useState<DocumentData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isProfileComplete, setIsProfileComplete] = useState<boolean>(false); 

  // AUTH HANDLERS
  const signup = (email: string, password: string) => {
    return createUserWithEmailAndPassword(auth, email, password);
  };

  const login = (email: string, password: string) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  const logout = async (): Promise<void> => {
    setUserDataObj(null);
    setCurrentUser(null);
    return signOut(auth);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user: User | null) => {
      try {
        setLoading(true);
        setCurrentUser(user);
        if (!user) {
          console.log('No User Found');
          return;
        }

        // Fetch data from Firestore
        console.log('Fetching User Data');
        const docRef = doc(db, 'Users', user.uid);
        const docSnap = await getDoc(docRef);
        let firebaseData: DocumentData = {};
        if (docSnap.exists()) {
          console.log('Found User Data');
          firebaseData = docSnap.data();
          setUserDataObj(firebaseData);
          setIsProfileComplete(!!firebaseData.name && !!firebaseData.image); 
        }
      } catch (err) {
        console.error((err as Error).message);
      } finally {
        setLoading(false);
      }
    });
    return unsubscribe;
  }, []);

  const value: AuthContextType = {
    currentUser,
    userDataObj,
    setUserDataObj,
    signup,
    logout,
    login,
    loading,
    isProfileComplete,
    setIsProfileComplete
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
