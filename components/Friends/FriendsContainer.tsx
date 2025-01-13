// components/Friends/FriendsContainer.tsx
'use client';
import ManageHeader from '../ManageHeader';
import AddFriend from './AddFriend';
import FriendList from './FriendList';
import FriendTabs from './FriendTabs';
import React, { useState, useCallback, useMemo } from 'react';
import { useFriends } from '@/context/FriendsContext';
import { EnrichedRelationship } from './FriendList';
import { acceptFriendship } from '@/lib/actions/friend.action';
import { fetchAllFriendBalances } from '@/lib/actions/balance';
interface FriendsContainerProps {
  initialBalances: Array<{
    friendId: string;
    totalBalance: number;
  }>;
}

function FriendsContainer({ initialBalances }: FriendsContainerProps) {
  const [isModalOpen, setModalOpen] = useState(false);
  const { enrichedRelationships, refreshFriends } = useFriends();
  const [balances, setBalances] = useState(initialBalances);
  
  // Only fetch new balances when relationships change
  React.useEffect(() => {
    const loadBalances = async () => {
      if (enrichedRelationships.length > 0) {
        const friendBalances = await fetchAllFriendBalances(enrichedRelationships[0].requester_id);
        setBalances(friendBalances);
      }
    };
    // Only fetch if relationships have changed from initial state
    if (enrichedRelationships.length !== initialBalances.length) {
      loadBalances();
    }
  }, [enrichedRelationships, initialBalances.length]);

  const filteredRelationships = useMemo(() => {
    const balanceMap = new Map(balances.map(b => [b.friendId, b.totalBalance]));
    const currentUserId = enrichedRelationships[0]?.requester_id;

    const getFriendId = (relationship: EnrichedRelationship): string | null => {
        if (!currentUserId || !relationship.requester_id || !relationship.addressee_id) {
            return null;
        }
        return relationship.requester_id === currentUserId 
            ? relationship.addressee_id 
            : relationship.requester_id;
    };

    const nonZeroRelationships = enrichedRelationships.filter(rel => {
        const friendId = getFriendId(rel);
        return friendId && balanceMap.get(friendId) !== 0 && balanceMap.get(friendId) !== undefined;
    });

    const owesYouRelationships = enrichedRelationships.filter(rel => {
        const friendId = getFriendId(rel);
        return friendId && (balanceMap.get(friendId) || 0) > 0;
    });

    const youOweRelationships = enrichedRelationships.filter(rel => {
        const friendId = getFriendId(rel);
        return friendId && (balanceMap.get(friendId) || 0) < 0;
    });

    return {
        all: enrichedRelationships,
        nonZero: nonZeroRelationships,
        owesYou: owesYouRelationships,
        youOwe: youOweRelationships
    };
}, [enrichedRelationships, balances]);

  const openModal = () => {
    setModalOpen(true);
  };

  const handleCloseModal = useCallback(() => {
    setModalOpen(false);
  }, []);

  const handleAcceptRequest = async (relationshipId: string) => {
    const result = await acceptFriendship(relationshipId);
    if (result.success) {
      await refreshFriends();
      // Refresh balances after accepting friend request
      if (enrichedRelationships.length > 0) {
        const newBalances = await fetchAllFriendBalances(enrichedRelationships[0].requester_id);
        setBalances(newBalances);
      }
    }
    return result;
  };

  return (
    <div>
      <ManageHeader
        title="Friends"
        buttons={[
          { label: "Add Friend", primary: true, onClick: openModal },
        ]}
        homeType={false}
      />
      <AddFriend 
        isOpen={isModalOpen} 
        closeModal={handleCloseModal}
        onFriendAdded={refreshFriends} 
      />
      
      <FriendTabs 
        allContent={
          <FriendList 
            relationships={filteredRelationships.all}
            onAcceptRequest={handleAcceptRequest}
            balances={balances}
          />
        }
        owesYouContent={
          <FriendList 
            relationships={filteredRelationships.owesYou}
            onAcceptRequest={handleAcceptRequest}
            balances={balances}
          />
        }
        youOweContent={
          <FriendList 
            relationships={filteredRelationships.youOwe}
            onAcceptRequest={handleAcceptRequest}
            balances={balances}
          />
        }
        allCount={filteredRelationships.all.length}
        owesYouCount={filteredRelationships.owesYou.length}
        youOweCount={filteredRelationships.youOwe.length}
      />
    </div>
  );
}

export default FriendsContainer;