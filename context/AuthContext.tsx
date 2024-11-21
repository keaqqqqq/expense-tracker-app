'use client';
import { User, createUserWithEmailAndPassword, onAuthStateChanged, signInWithEmailAndPassword, signOut, updateProfile, EmailAuthProvider, reauthenticateWithCredential, updatePassword, verifyBeforeUpdateEmail } from 'firebase/auth';
import { DocumentData, doc, getDoc, setDoc} from 'firebase/firestore';
import React, { useContext, useState, useEffect, ReactNode } from 'react';
import { auth , db} from '../firebase/config';
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
  updateUserPassword: (currentPassword: string, newPassword: string) => Promise<void>;
  updateUserProfile: (params: UpdateProfileParams) => Promise<DocumentData>;
}

interface UpdateProfileParams {
  currentUser: User;
  name: string;
  image: string | null;
  newEmail?: string;
  currentPassword?: string;
}


const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

const handleEmailVerificationComplete = async (user: User) => {
  try {
    const userRef = doc(db, 'Users', user.uid);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      if (userData.pendingEmail && user.email === userData.pendingEmail) {
        // Update Firestore with the new verified email
        await setDoc(userRef, {
          ...userData,
          email: user.email,
          pendingEmail: null // Clear the pending email
        });
      }
    }
  } catch (error) {
    console.error("Error updating email in Firestore:", error);
    throw error;
  }
};

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userDataObj, setUserDataObj] = useState<DocumentData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isProfileComplete, setIsProfileComplete] = useState<boolean>(false);

  const signup = (email: string, password: string) => {
    return createUserWithEmailAndPassword(auth, email, password);
  };

  const login = (email: string, password: string) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  const logout = async (): Promise<void> => {
    setUserDataObj(null);
    setCurrentUser(null);
    await signOut(auth);
  };

  const updateUserPassword = async (currentPassword: string, newPassword: string): Promise<void> => {
    if (!currentUser || !currentUser.email) {
      throw new Error('No user is currently logged in');
    }

    try {
      const credential = EmailAuthProvider.credential(
        currentUser.email,
        currentPassword
      );
      await reauthenticateWithCredential(currentUser, credential);
      await updatePassword(currentUser, newPassword);
    } catch (error) {
      console.error('Error updating password:', error);
      throw error;
    }
  };

  const updateUserProfile = async ({
    currentUser,
    name,
    image,
    newEmail,
    currentPassword
  }: UpdateProfileParams) => {
    if (!currentUser) throw new Error("User not authenticated");

    try {
      if (newEmail && currentPassword && newEmail !== currentUser.email) {
        const credential = EmailAuthProvider.credential(
          currentUser.email!,
          currentPassword
        );
        await reauthenticateWithCredential(currentUser, credential);
        await verifyBeforeUpdateEmail(currentUser, newEmail);

        const userData = {
          name,
          image,
          email: currentUser.email,
          pendingEmail: newEmail
        };
        await setDoc(doc(db, 'Users', currentUser.uid), userData);
        setUserDataObj(userData);
        throw new Error("VERIFICATION_SENT");
      }

      const userData = {
        name,
        image,
        email: currentUser.email
      };

      await setDoc(doc(db, 'Users', currentUser.uid), userData);
      setUserDataObj(userData);
      return userData;
    } catch (error: any) {
      if (error.message === "VERIFICATION_SENT") {
        throw error;
      }
      console.error("Profile update error:", error);
      throw error;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user: User | null) => {
      setLoading(true);
      setCurrentUser(user);

      if (!user) {
        setLoading(false);
        return;
      }

      try {
        // Check if email was recently verified
        if (user.emailVerified) {
          await handleEmailVerificationComplete(user);
        }

        const docRef = doc(db, 'Users', user.uid);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const firebaseData = docSnap.data();
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
    setIsProfileComplete, 
    updateUserPassword,
    updateUserProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
