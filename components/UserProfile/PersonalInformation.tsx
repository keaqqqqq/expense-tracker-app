import React, { useState } from 'react';
import { updateUserProfile, handleImageChange } from '@/lib/actions/user.action';
import { useAuth } from '@/context/AuthContext';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Button from './Button';
import { User, Camera } from 'lucide-react';
import Toast from '../Toast'; 

interface PersonalInformationProps {
  onComplete: () => void;
}

export default function PersonalInformation({ onComplete }: PersonalInformationProps) {
  const { currentUser, userDataObj } = useAuth();
  const [name, setName] = useState(userDataObj?.name || '');
  const [image, setImage] = useState(userDataObj?.image || null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', content: '' });
  const [showToast, setShowToast] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !currentUser) return;

    setIsLoading(true);

    try {
      await updateUserProfile(currentUser, name, image);
      setShowToast(true); 
      setTimeout(() => {
        onComplete();
      }, 2000); 
    } catch (error) {
      console.error("Error updating profile:", error);
      setMessage({ type: 'error', content: 'Error updating profile' });
    }
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center">
        <h2 className="text-2xl font-semibold text-gray-900">You must be logged in to access this page.</h2>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <h2 className="text-3xl text-center font-bold text-gray-900 mb-6">Set Up Your Profile</h2>
      <div className="">
        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex justify-center">
              <div className="relative">
                <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
                  {image ? (
                    <img src={image} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-16 h-16 text-gray-400" />
                  )}
                </div>
                <label
                  htmlFor="file-upload"
                  className="absolute bottom-0 right-0 bg-white rounded-full p-2 shadow-md cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <Camera className="w-5 h-5 text-gray-600" />
                  <input
                    id="file-upload"
                    name="file-upload"
                    type="file"
                    className="sr-only"
                    accept="image/*"
                    onChange={(e) => handleImageChange(e, setImage)}
                  />
                </label>
              </div>
            </div>
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Name
              </label>
              <input
                type="text"
                name="name"
                id="name"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <Button 
              type="submit"
              className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
              disabled={isLoading}
              text={
                isLoading ? (
                    <span className="flex justify-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Loading
                    </span>
                ) : (
                    'Complete Profile'
                )
            }
            >
            </Button>
          </form>
          {message.content && (
            <Alert className={`mt-4 ${message.type === 'error' ? 'bg-red-50' : 'bg-green-50'}`}>
              <AlertDescription>
                {message.content}
              </AlertDescription>
            </Alert>
          )}
        </div>
      </div>
      {showToast && (
        <Toast
          message="Profile updated successfully!" 
          onClose={() => setShowToast(false)} 
        />
      )}
    </div>
  );
}
