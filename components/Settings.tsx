'use client'
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { doc, deleteDoc} from 'firebase/firestore';
import { db } from '@/firebase/config';
import { ref, uploadBytes, getDownloadURL, deleteObject} from 'firebase/storage';
import { storage } from '@/firebase/config';
import Toast from './Toast';
interface ProfileSettingsProps {
  userData: UserData | null;
}

interface ToastState {
  show: boolean;
  message: string;
  type: 'success' | 'error';
}
interface UserData {
  id?: string;
  name: string;
  email: string;
  image: string | null;
}

const ProfileSettings = ({ userData }: ProfileSettingsProps) => {
  const { currentUser, setUserDataObj, updateUserProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showEmailUpdate, setShowEmailUpdate] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [emailUpdateError, setEmailUpdateError] = useState('');
  const [toast, setToast] = useState<ToastState>({
    show: false,
    message: '',
    type: 'success'
  });
  const [profile, setProfile] = useState<UserData>({
    name: userData?.name || '',
    email: userData?.email || '',
    image: userData?.image || null,
  });

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEmail = e.target.value;
    setProfile(prev => ({ ...prev, email: newEmail }));
    setShowEmailUpdate(newEmail !== currentUser?.email);
    setEmailUpdateError('');
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !currentUser) return;
    setIsLoading(true);

    try {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('File size must be less than 5MB');
      }
  
      if (!file.type.startsWith('image/')) {
        throw new Error('Only image files are allowed');
      }
  
      const storageRef = ref(storage, `profile_images/${currentUser.uid}`);
      await uploadBytes(storageRef, file);
      const imageUrl = await getDownloadURL(storageRef);
      
      await updateUserProfile({
        currentUser,
        name: profile.name,
        image: imageUrl
      });      
      setProfile(prev => ({ ...prev, image: imageUrl }));
      setToast({ show: true, message: 'Photo uploaded successfully', type: 'success' });
    } catch (error: any) {
      let errorMessage = 'Error uploading photo';
      if (error.message) {
        errorMessage = error.message;
      }
      setToast({ show: true, message: errorMessage, type: 'error' });
      console.error('Error uploading photo:', error);
    }finally{
      setIsLoading(false);
    }
  };

  const handleRemovePhoto = async () => {
    if (!currentUser || !profile.image) return;
    setIsLoading(true);

    try {
      try {
        const storageRef = ref(storage, `profile_images/${currentUser.uid}`);
        await deleteObject(storageRef);
      } catch (error: any) {
        if (error.code !== 'storage/object-not-found') {
          throw error;
        }
      }

      await updateUserProfile({
        currentUser,
        name: profile.name,
        image: null
      });      
      setProfile(prev => ({ ...prev, image: null }));
      
      setUserDataObj(prev => ({
        ...prev,
        image: null
      }));

      setToast({ show: true, message: 'Photo removed successfully', type: 'success' });

    } catch (error) {
      console.error('Error removing photo:', error);
      setToast({ show: true, message: 'Error removing photo', type: 'error' });
    }finally{
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!currentUser) return;
    if (!profile.name.trim()) {
      setToast({ show: true, message: 'Name is required', type: 'error' });
      return;
    }
  
    if (showEmailUpdate) {
      if (!currentPassword) {
        setEmailUpdateError('Password required to update email');
        return;
      }
      if (!profile.email) {
        setEmailUpdateError('Email cannot be empty');
        return;
      }
      if (!/\S+@\S+\.\S+/.test(profile.email)) {
        setEmailUpdateError('Invalid email format');
        return;
      }
    }
  
    setIsLoading(true);
    
    try {
      await updateUserProfile({
        currentUser,
        name: profile.name.trim(),
        image: profile.image,
        ...(showEmailUpdate && profile.email !== currentUser.email ? {
          newEmail: profile.email,
          currentPassword
        } : {})
      });
  
      setToast({ 
        show: true, 
        message: showEmailUpdate ? 
          'Verification email sent. Please check your inbox.' : 
          'Profile updated successfully', 
        type: 'success' 
      });

      if (!showEmailUpdate) {
        setShowEmailUpdate(false);
        setCurrentPassword('');
      } } catch (error: any) {
        setToast({ 
          show: true, 
          message: error.message, 
          type: 'error' 
        });
        if (error.message.includes('password')) {
          setEmailUpdateError(error.message);
        }
      } finally {
        setIsLoading(false);
      }
    };
  

return (
  <div className="mb-12">
    {toast.show && (
      <Toast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ ...toast, show: false })}
      />
    )}
    <div className="flex gap-8">
      <div className="w-1/3">
        <h2 className="text-xl font-semibold mb-2">Profile Information</h2>
        <p className="text-gray-600 text-sm">
          Update your account's profile information and email address.
        </p>
      </div>
      <div className="w-2/3">
        <Card>
          <CardContent className="pt-6">
            {/* Photo section */}
            <div className="mb-6">
              <label className="block mb-2">Photo</label>
              <div className="flex items-center gap-4">
                <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                  {profile.image ? (
                    <img 
                      src={profile.image} 
                      alt="Profile" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 rounded-lg" />
                  )}
                </div>
                <div>
                  <label className="px-4 py-2 border rounded-md hover:bg-gray-50 mr-2 cursor-pointer">
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleImageUpload}
                    />
                    Select a new photo
                  </label>
                  <button
                    className="px-4 py-2 border rounded-md hover:bg-gray-50"
                    onClick={handleRemovePhoto}
                  >
                    Remove photo
                  </button>
                </div>
              </div>
            </div>

            {/* Name section */}
            <div className="mb-4">
              <label className="block mb-2">Name</label>
              <input
                type="text"
                className="w-full p-2 border rounded-md"
                value={profile.name}
                onChange={(e) => setProfile(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>

            {/* Email section */}
            <div className="mb-6">
              <label className="block mb-2">Email</label>
              <input
                type="email"
                className="w-full p-2 border rounded-md"
                value={profile.email}
                onChange={handleEmailChange}
              />
            </div>

            {/* Password section for email update */}
            {showEmailUpdate && (
              <div className="mb-6">
                <label className="block mb-2">Current Password (required to update email)</label>
                <input
                  type="password"
                  className="w-full p-2 border rounded-md"
                  value={currentPassword}
                  onChange={(e) => {
                    setCurrentPassword(e.target.value);
                    setEmailUpdateError('');
                  }}
                  placeholder="Enter password to confirm email change"
                />
                {emailUpdateError && (
                  <p className="mt-1 text-sm text-red-600">{emailUpdateError}</p>
                )}
              </div>
            )}

            {/* Save button */}
            <button
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
              onClick={handleSave}
              disabled={isLoading || (showEmailUpdate && !currentPassword)}
            >
              {isLoading ? 'Saving...' : 'Save'}
            </button>
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
);
};

const PasswordSettings = () => {
  const { currentUser, updateUserPassword } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: ''
  });
  const [toast, setToast] = useState<ToastState>({
    show: false,
    message: '',
    type: 'success'
  });
  const [error, setError] = useState('');

  const handlePasswordChange = async () => {
    if (!currentUser) return;
    if (passwords.new !== passwords.confirm) {
      setError("New passwords don't match");
      return;
    }
    if (passwords.new.length < 6) {
      setError("New password must be at least 6 characters");
      return;
    }

    setIsLoading(true);

        try {
      await updateUserPassword(passwords.current, passwords.new);
      setToast({ show: true, message: 'Password updated successfully', type: 'success' });
      setPasswords({ current: '', new: '', confirm: '' });
      setError('');
    } catch (error) {
      console.error(error);
      setError('Failed to update password. Please check your current password.');
      setToast({ show: true, message: 'Error message', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mb-12">
          {toast.show && (
      <Toast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ ...toast, show: false })}
      />
    )}
      <div className="flex gap-8">
        <div className="w-1/3">
          <h2 className="text-2xl font-semibold mb-2">Update Password</h2>
          <p className="text-gray-600">
            Ensure your account is using a long, random password to stay secure.
          </p>
        </div>
        <div className="w-2/3">
          <Card>
            <CardContent className="pt-6">
              {error && (
                <div className="mb-4 p-2 bg-red-100 text-red-600 rounded">
                  {error}
                </div>
              )}
              
              <div className="mb-4">
                <label className="block mb-2">Current Password</label>
                <input
                  type="password"
                  className="w-full p-2 border rounded-md"
                  value={passwords.current}
                  onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                  disabled={isLoading}
                />
              </div>

              <div className="mb-4">
                <label className="block mb-2">New Password</label>
                <input
                  type="password"
                  className="w-full p-2 border rounded-md"
                  value={passwords.new}
                  onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                  disabled={isLoading}
                />
              </div>

              <div className="mb-6">
                <label className="block mb-2">Confirm Password</label>
                <input
                  type="password"
                  className="w-full p-2 border rounded-md"
                  value={passwords.confirm}
                  onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                  disabled={isLoading}
                />
              </div>

              <button
                onClick={handlePasswordChange}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
                disabled={isLoading}
              >
                {isLoading ? 'Saving...' : 'Save'}
              </button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

const DeleteAccount = () => {
  const { currentUser, logout } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<ToastState>({
    show: false,
    message: '',
    type: 'success'
  });
  const handleDelete = async () => {
    if (!currentUser) return;
    
    if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      setIsLoading(true);
      try {
        // Delete user data from Firestore
        await deleteDoc(doc(db, 'Users', currentUser.uid));
        
        // Delete profile image if exists
        if (currentUser.photoURL) {
          const storageRef = ref(storage, `profile_images/${currentUser.uid}`);
          await deleteObject(storageRef);
        }
        
        // Delete user account
        await currentUser.delete();
        
        // Sign out and redirect
        await logout();
        router.push('/auth');
        setToast({ show: true, message: 'Success message', type: 'success' });
      } catch (error) {
        console.error(error);
        setToast({ show: true, message: 'Error message', type: 'error' });
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="mb-12">
    {toast.show && (
      <Toast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ ...toast, show: false })}
      />
    )}
      <div className="flex gap-8">
        <div className="w-1/3">
          <h2 className="text-2xl font-semibold mb-2">Delete Account</h2>
          <p className="text-gray-600">
            Permanently delete your account.
          </p>
        </div>
        <div className="w-2/3">
          <Card>
            <CardContent className="pt-6">
              <p className="mb-6">
                Once your account is deleted, all of its resources and data will be permanently deleted. 
                Before deleting your account, please download any data or information that you wish to retain.
              </p>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                disabled={isLoading}
              >
                {isLoading ? 'Deleting...' : 'Delete Account'}
              </button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

const Settings = () => {
  const { currentUser, loading: authLoading, userDataObj } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false); 
  const [toast, setToast] = useState<ToastState>({
    show: false,
    message: '',
    type: 'success'
  });

  const typedUserData: UserData | null = userDataObj ? {
    id: currentUser?.uid,
    name: userDataObj.name || '',
    email: userDataObj.email || '',
    image: userDataObj.image || null
  } : null;

  useEffect(() => {
    if (authLoading) return;

    if (!currentUser) {
      router.push('/auth');
      return;
    }
  }, [currentUser, router, authLoading, userDataObj]);

  // Show loading state while auth state is being determined
  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!currentUser) {
    return null;
  }

  return (
    <>
    <div className="min-h-screen">
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ ...toast, show: false })}
        />
      )}
      <div className="max-w-6xl mx-auto">
        <div className="bg-white-50 px-8 py-2 border-solid border-gray-200 border-2 rounded-md">
          <h1 className="text-xl font-semibold">Settings</h1>
        </div>
        
        <div className="p-8">
        <ProfileSettings userData={typedUserData} />
        <PasswordSettings />
          <DeleteAccount />
        </div>
      </div>
    </div>
    </>
  );
};

export default Settings;