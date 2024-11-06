'use client'
import { Friend } from '@/types/Friend';
import AddGroup from './AddGroup';
import { useState } from 'react';
import ManageHeader from '../ManageHeader';

interface GroupsContainerProps {
  currentUserId: string;
  name?: string;
  friends: Friend[];
  email?: string;
}

export default function GroupsContainer({ currentUserId, name, friends, email }: GroupsContainerProps) {
  const [isModalOpen, setModalOpen] = useState(false);

  return (
    <div className="p-6">
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
      />
    </div>
  );
}