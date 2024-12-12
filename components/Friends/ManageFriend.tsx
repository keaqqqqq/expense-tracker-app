'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { removeFriend } from '@/lib/actions/user.action';
import Toast from '../Toast';
import { useRouter } from 'next/navigation';
interface ManageFriendProps {
  friendId: string;
  friendName: string;
  currentUserId: string;
}

const ManageFriend = ({ friendId, friendName, currentUserId }: ManageFriendProps) => {
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const router = useRouter()
  const handleRemoveFriend = async () => {
    try {
      await removeFriend(currentUserId, friendId);
      setToastMessage(`${friendName} has been removed from your friends`);
      setToastType('success');
      setShowToast(true);
      router.push('/friends');
    } catch (error) {
      console.error('Error in handleRemoveFriend:', error); 
      setToastMessage('Failed to remove friend');
      setToastType('error');
      setShowToast(true);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-5 xl:ml-8">
      <div className="flex items-center gap-2 mb-5">
        <h3 className="text-sm sm:md text-gray-900">Manage Friend</h3>
      </div>

      <div className="space-y-2">
        <Button
          onClick={handleRemoveFriend}
          className="w-full h-10 justify-start text-sm font-medium bg-white hover:bg-red-50 text-gray-700 hover:text-red-600 border border-gray-200 hover:border-red-100 transition-colors"
          variant="outline"
        >
        <div className="flex items-center gap-3">
          <span className="text-xs md:max-w-[100px] md:whitespace-normal">Remove friend</span>
        </div>
        </Button>
      </div>

      {showToast && (
        <Toast
          message={toastMessage}
          type={toastType}
          onClose={() => setShowToast(false)}
          duration={2000}
        />
      )}
    </div>
  );
};

export default ManageFriend;