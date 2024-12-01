'use client';

import React, { useState } from 'react';
import { Copy, Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Toast from '../Toast';
import { getOrCreateGroupInviteLink } from '@/lib/actions/user.action';

interface ManageGroupProps {
  groupId: string;
  groupName: string;
  inviteLink: string;
  groupData: any; // Replace with proper type
  currentUserId: string;
  groupFriends: any[]; // Replace with proper type
  currentUserEmail: string;
  currentUserImage?: string;
  modalStateProps: {
    isEditModalOpen: boolean;
    setIsEditModalOpen: (isOpen: boolean) => void;
    onEditSuccess: () => void;
  };
}

export default function ManageGroup({ 
  groupId, 
  currentUserId,
  modalStateProps: { setIsEditModalOpen },
  ...props 
}: ManageGroupProps) {
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  const handleCopyInviteLink = async () => {
    try {
      const token = await getOrCreateGroupInviteLink(groupId, currentUserId);
      if (!token) throw new Error('Failed to generate invite token');
      
      const inviteLink = `https://keaqqqqq.com/invite?token=${token}`;
      await navigator.clipboard.writeText(inviteLink);
      setToastMessage('Invite link copied to clipboard');
      setToastType('success');
    } catch (error) {
      setToastMessage('Failed to copy invite link');
      setToastType('error');
    }
    setShowToast(true);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-5 xl:ml-8">
      <div className="flex items-center gap-2 mb-5">
        <h3 className="text-base text-sm text-gray-900">Manage Group</h3>
      </div>

      <div className="space-y-2">
        <Button
          onClick={() => setIsEditModalOpen(true)}
          className="w-full h-10 justify-start text-sm font-medium bg-white hover:bg-gray-50 text-gray-700 hover:text-gray-900 border border-gray-200 hover:border-gray-300 transition-colors"
          variant="outline"
        >
          <div className="flex items-center gap-3">
            <Settings2 className="h-2 w-2 text-gray-500" />
            <span className="text-base text-xs">Edit group</span>
          </div>
        </Button>

        <Button
          onClick={handleCopyInviteLink}
          className="w-full h-10 justify-start text-sm font-medium bg-white hover:bg-gray-50 text-gray-700 hover:text-gray-900 border border-gray-200 hover:border-gray-300 transition-colors"
          variant="outline"
        >
          <div className="flex items-center gap-3">
            <Copy className="h-2 w-2 text-gray-500" />
            <span className="text-base text-xs">Copy invite link</span>
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
}