'use client';
import { Friend } from '@/types/Friend';
import AddGroup from './AddGroup';
import { useState, useEffect } from 'react';
import ManageHeader from '../ManageHeader';
import GroupList from '@/components/Groups/GroupList';
import { Group } from '@/types/Group';
import { getGroups } from '@/lib/actions/user.action';
import Toast from '@/components/Toast';

interface GroupsContainerProps {
  currentUserId: string;
  name?: string;
  friends: Friend[];
  email?: string;
  initialGroups?: Group[];
}

export default function GroupsContainer({ 
  currentUserId, 
  name, 
  friends, 
  email,
  initialGroups = [] 
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

  return (
    <div>
      <ManageHeader 
        title="Groups"
        buttons={[
          { label: "Add Group", primary: true, onClick: () => setModalOpen(true) },
        ]}
      />
      <AddGroup 
        isOpen={isModalOpen} 
        closeModal={() => setModalOpen(false)} 
        currentUserId={currentUserId}
        name={name}
        friends={friends}
        email={email}
        onSuccess={handleGroupCreated}
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