'use client';
import { Friend } from '@/types/Friend';
import AddGroup from './AddGroup';
import { useState, useEffect } from 'react';
import ManageHeader from '../ManageHeader';
import GroupList from '@/components/Groups/GroupList';
import { Group } from '@/types/Group';
import Toast from '@/components/Toast';
import { getGroups } from '@/lib/actions/group.action';
interface GroupsContainerProps {
  currentUserId: string;
  name?: string;
  friends: Friend[];
  email?: string;
  initialGroups?: Group[];
  currentUserImage?: string;
}

export default function GroupsContainer({ 
  currentUserId, 
  name, 
  friends, 
  email,
  initialGroups = [],
  currentUserImage
}: GroupsContainerProps) {
  const [isModalOpen, setModalOpen] = useState(false);
  const [groups, setGroups] = useState<Group[]>(initialGroups);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const refreshGroups = async () => {
    try {
      if (email) {
        const updatedGroups = await getGroups(email);
        setGroups(updatedGroups);
      }
    } catch (error) {
      console.error('Error refreshing groups:', error);
    }
  };

  useEffect(() => {
    if (!initialGroups?.length && email) {
      refreshGroups();
    }
  }, [email, initialGroups]);

  const handleGroupCreated = async () => {
    setModalOpen(false);
    setToastMessage('Group created successfully!');
    setShowToast(true);
    await refreshGroups();
  };

  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isModalOpen]);

  return (
    <div>
      <ManageHeader 
        title="Groups"
        buttons={[
          { label: "Add Group", primary: true, onClick: () => setModalOpen(true) },
        ]}
        homeType={false}
      />
      <AddGroup 
        isOpen={isModalOpen} 
        closeModal={() => setModalOpen(false)} 
        currentUserId={currentUserId}
        name={name}
        friends={friends}
        email={email}
        onSuccess={handleGroupCreated}
        currentUserImage={currentUserImage}
      />
      <GroupList 
        groups={groups} 
        userEmail={email}
      />
      {showToast && (
        <Toast 
          message={toastMessage}
          duration={2000}
          onClose={() => setShowToast(false)}
        />
      )}
    </div>
  );
}