'use client';
import ManageHeader from '../ManageHeader';
import AddFriend from './AddFriend';
import FriendList from './FriendList';
import FriendTabs from './FriendTabs';
import { acceptFriendship } from "@/lib/actions/user.action";
import React, { useState, useCallback } from 'react';
import { useFriends } from '@/context/FriendsContext';

function FriendsContainer() {
  const [isModalOpen, setModalOpen] = useState(false);
  const { enrichedRelationships, refreshFriends } = useFriends();
  
  const openModal = () => {
    setModalOpen(true);
  };

  const handleCloseModal = useCallback(() => {
    setModalOpen(false);
  }, []);

  console.log('Enriched relationships: ' + enrichedRelationships)

  return (
      <div>
        <ManageHeader
          title="Friends"
          buttons={[
            { label: "Add Friend", primary: true, onClick: openModal },
          ]}
        />
        <AddFriend 
          isOpen={isModalOpen} 
          closeModal={handleCloseModal}
          onFriendAdded={refreshFriends} 
        />
        
        <FriendTabs 
          allContent={
            <FriendList 
              relationships={enrichedRelationships}
              onAcceptRequest={async (relationshipId) => {
                const result = await acceptFriendship(relationshipId);
                if (result.success) {
                  await refreshFriends();
                }
                return result;
              }}
            />
          }
          nonZeroContent={
            <FriendList 
              relationships={enrichedRelationships}
              onAcceptRequest={acceptFriendship}
            />
          }
          owesYouContent={
            <FriendList 
              relationships={enrichedRelationships}
              onAcceptRequest={acceptFriendship}
            />
          }
          youOweContent={
            <FriendList 
              relationships={enrichedRelationships}
              onAcceptRequest={acceptFriendship}
            />
          }
          allCount={enrichedRelationships.length}
          nonZeroCount={enrichedRelationships.length}
          owesYouCount={enrichedRelationships.length}
          youOweCount={enrichedRelationships.length}
        />
      </div>
  );
}

export default FriendsContainer;