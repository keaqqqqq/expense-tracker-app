'use client';

import React, { useState } from 'react';
import { Star, UserMinus, Settings2 } from 'lucide-react';
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
      setToastMessage('Failed to remove friend');
      setToastType('error');
      setShowToast(true);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-5">
      <div className="flex items-center gap-2 mb-5">
        <div className="h-8 w-8 rounded-full bg-indigo-50 flex items-center justify-center">
          <Settings2 className="h-4 w-4 text-indigo-600" />
        </div>
        <h3 className="text-base text-md text-gray-900">Manage Friend</h3>
      </div>

      <div className="space-y-3">
        <Button
          onClick={handleRemoveFriend}
          className="w-full h-10 justify-start text-sm font-medium bg-white hover:bg-red-50 text-gray-700 hover:text-red-600 border border-gray-200 hover:border-red-100 transition-colors"
          variant="outline"
        >
          <div className="flex items-center gap-3">
            <div className="h-7 w-7 rounded-full bg-red-50 flex items-center justify-center">
              <UserMinus className="h-3.5 w-3.5 text-red-500" />
            </div>
            <span className='text-sm'>Remove friend</span>
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