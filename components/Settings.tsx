'use client'
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { doc, deleteDoc} from 'firebase/firestore';
import { db } from '@/firebase/config';
import { ref, uploadBytes, getDownloadURL, deleteObject, StorageError} from 'firebase/storage';
import { storage } from '@/firebase/config';
import Toast from './Toast';
import { ToastState } from '@/types/Toast';
import Image from 'next/image';
import { FirebaseError } from 'firebase/app';
interface ProfileSettingsProps {
  userData: UserData | null;
}

interface UserData {
  id?: string;
  name: string;
  email: string;
  image: string | null;
}

const ProfileSettings = ({ userData }: ProfileSettingsProps) => {
  const { currentUser, setUserDataObj, updateUserProfile } = useAuth();  const [showEmailUpdate, setShowEmailUpdate] = useState(false);
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
    } catch (error: unknown) {
      let errorMessage = 'Error uploading photo';
      
      if (error instanceof Error || error instanceof StorageError) {
        errorMessage = error.message;
      }
      setToast({ show: true, message: errorMessage, type: 'error' });
      console.error('Error uploading photo:', error);
    }
  };

  const handleRemovePhoto = async () => {
    if (!currentUser || !profile.image) return;

    try {
      try {
        const storageRef = ref(storage, `profile_images/${currentUser.uid}`);
        await deleteObject(storageRef);
      } catch (error: unknown) {
        if (error instanceof StorageError && error.code !== 'storage/object-not-found') {
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
      }
     } catch (error: unknown) {
        let errorMessage = 'An error occurred while updating profile';
        
        if (error instanceof FirebaseError || error instanceof Error) {
          errorMessage = error.message;
          
          if (error.message.includes('password')) {
            setEmailUpdateError(error.message);
          }
        }
        
        setToast({ 
          show: true, 
          message: errorMessage,
          type: 'error' 
        });
      }
    };
  

    return (
      <div className="mb-8 lg:mb-12">
        {toast.show && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast({ ...toast, show: false })}
          />
        )}
        <div className="flex flex-col lg:flex-row lg:gap-8">
          <div className="w-full lg:w-1/3 mb-4 lg:mb-0">
            <h2 className="text-xl font-semibold mb-2">Profile Information</h2>
            <p className="text-gray-600 text-sm">
              Update your account&apos;s profile information and email address.
            </p>
          </div>
          <div className="w-full lg:w-2/3">
            <Card>
              <CardContent className="p-4 lg:p-6 bg-white border rounded">
                {/* Photo section */}
                <div className="mb-6">
                  <label className="block mb-2">Photo</label>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                      {profile.image ? (
                        <Image
                          src={profile.image}
                          alt="Profile"
                          className="w-full h-full object-cover"
                          unoptimized
                          width={100}
                          height={100}
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-200 rounded-lg" />
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <label className="px-4 py-2 border rounded-md hover:bg-gray-50 cursor-pointer">
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
  
                {/* Form fields */}
                <div className="space-y-4">
                  <div>
                    <label className="block mb-2">Name</label>
                    <input
                      type="text"
                      className="w-full p-2 border rounded-md"
                      value={profile.name}
                      onChange={(e) => setProfile(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
  
                  <div>
                    <label className="block mb-2">Email</label>
                    <input
                      type="email"
                      className="w-full p-2 border rounded-md"
                      value={profile.email}
                      onChange={handleEmailChange}
                    />
                  </div>
  
                  {showEmailUpdate && (
                    <div>
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
  
                  <button
                    className="w-full sm:w-auto px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
                    onClick={handleSave}
                    disabled={showEmailUpdate && !currentPassword}
                  >
                    Save
                  </button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  };

const PasswordSettings = () => {
  const { currentUser, updateUserPassword } = useAuth();
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

        try {
      await updateUserPassword(passwords.current, passwords.new);
      setToast({ show: true, message: 'Password updated successfully', type: 'success' });
      setPasswords({ current: '', new: '', confirm: '' });
      setError('');
    } catch (error) {
      console.error(error);
      setError('Failed to update password. Please check your current password.');
      setToast({ show: true, message: 'Error message', type: 'error' });
    }
  };

  return (
    <div className="mb-8 lg:mb-12">
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ ...toast, show: false })}
        />
      )}
      <div className="flex flex-col lg:flex-row lg:gap-8">
        <div className="w-full lg:w-1/3 mb-4 lg:mb-0">
          <h2 className="text-xl font-semibold mb-2">Update Password</h2>
          <p className="text-gray-600">
            Ensure your account is using a long, random password to stay secure.
          </p>
        </div>
        <div className="w-full lg:w-2/3">
          <Card>
            <CardContent className="bg-white border rounded p-4 lg:p-6">
              {error && (
                <div className="mb-4 p-2 bg-red-100 text-red-600 rounded">
                  {error}
                </div>
              )}
              
              <div className="space-y-4">
                <div>
                  <label className="block mb-2">Current Password</label>
                  <input
                    type="password"
                    className="w-full p-2 border rounded-md"
                    value={passwords.current}
                    onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block mb-2">New Password</label>
                  <input
                    type="password"
                    className="w-full p-2 border rounded-md"
                    value={passwords.new}
                    onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block mb-2">Confirm Password</label>
                  <input
                    type="password"
                    className="w-full p-2 border rounded-md"
                    value={passwords.confirm}
                    onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                  />
                </div>

                <button
                  onClick={handlePasswordChange}
                  className="w-full sm:w-auto px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
                >
                  Save
                </button>
              </div>
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
  const [toast, setToast] = useState<ToastState>({
    show: false,
    message: '',
    type: 'success'
  });
  const handleDelete = async () => {
    if (!currentUser) return;
    
    if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
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
      }
    }
  };

  return (
    <div className="mb-8 lg:mb-12">
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ ...toast, show: false })}
        />
      )}
      <div className="flex flex-col lg:flex-row lg:gap-8">
        <div className="w-full lg:w-1/3 mb-4 lg:mb-0">
          <h2 className="text-xl font-semibold mb-2">Delete Account</h2>
          <p className="text-gray-600">
            Permanently delete your account.
          </p>
        </div>
        <div className="w-full lg:w-2/3">
          <Card>
            <CardContent className="bg-white border rounded p-4 lg:p-6">
              <p className="mb-6">
                Once your account is deleted, all of its resources and data will be permanently deleted. 
                Before deleting your account, please download any data or information that you wish to retain.
              </p>
              <button
                onClick={handleDelete}
                className="w-full sm:w-auto px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                Delete account
              </button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

interface SettingsProps {
  initialUserData: UserData;
}

const Settings = ({ initialUserData }: SettingsProps) => {
  const { currentUser } = useAuth();
  const router = useRouter();
  const [toast, setToast] = useState<ToastState>({
    show: false,
    message: '',
    type: 'success'
  });


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
        <div className="bg-white px-8 py-2 border rounded">
          <h1 className="text-xl font-semibold">Settings</h1>
        </div>
        
        <div className="p-8">
        <ProfileSettings userData={initialUserData} />
        <PasswordSettings />
          <DeleteAccount />
        </div>
      </div>
    </div>
    </>
  );
};

export default Settings;