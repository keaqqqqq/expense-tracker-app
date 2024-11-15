'use client';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getFriendships, fetchUserData } from "@/lib/actions/user.action";
import { EnrichedRelationship } from '@/components/Friends/FriendList';
import { useAuth } from '@/context/AuthContext';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { enrichRelationships } from '@/lib/relationship-utils';
interface FriendsContextType {
  enrichedRelationships: EnrichedRelationship[];
  refreshFriends: () => Promise<void>;
}

const FriendsContext = createContext<FriendsContextType | undefined>(undefined);

const CACHE_KEY = 'friends_cache';

interface FriendsProviderProps {
  children: React.ReactNode;
  initialRelationships: EnrichedRelationship[];
}

export function FriendsProvider({ children, initialRelationships }: FriendsProviderProps) {
  // Try to get cached data first, fallback to initial data
  const getCachedData = () => {
    if (typeof window === 'undefined') return initialRelationships;
    
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsedCache = JSON.parse(cached);
        // Check if cache is fresh (less than 5 minutes old)
        if (parsedCache.timestamp > Date.now() - 5 * 60 * 1000) {
          return parsedCache.data;
        }
      }
    } catch (error) {
      console.error('Error reading cache:', error);
    }
    return initialRelationships;
  };

  const [enrichedRelationships, setEnrichedRelationships] = useState<EnrichedRelationship[]>(getCachedData());
  const { currentUser } = useAuth();

  // Update cache whenever relationships change
  useEffect(() => {
    if (enrichedRelationships.length > 0) {
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify({
          data: enrichedRelationships,
          timestamp: Date.now()
        }));
      } catch (error) {
        console.error('Error saving to cache:', error);
      }
    }
  }, [enrichedRelationships]);

  const refreshFriends = useCallback(async () => {
    if (!currentUser) return;

    try {
      const relationships = await getFriendships(currentUser.uid);
      const enriched = await enrichRelationships(relationships, currentUser.uid);
      setEnrichedRelationships(enriched);
    } catch (error) {
      console.error('Error refreshing friends:', error);
    }
  }, [currentUser]);

  // Set up real-time listeners
  useEffect(() => {
    if (!currentUser?.uid) return;
    
    const relationshipsRef = collection(db, 'Friendships');
    
    const requesterQuery = query(
      relationshipsRef,
      where('requester_id', '==', currentUser.uid)
    );

    const addresseeQuery = query(
      relationshipsRef,
      where('addressee_id', '==', currentUser.uid)
    );

    const handleSnapshot = () => {
      refreshFriends();
    };

    const unsubRequester = onSnapshot(requesterQuery, handleSnapshot);
    const unsubAddressee = onSnapshot(addresseeQuery, handleSnapshot);

    return () => {
      unsubRequester();
      unsubAddressee();
    };
  }, [currentUser?.uid, refreshFriends]);

  return (
    <FriendsContext.Provider value={{ 
      enrichedRelationships,
      refreshFriends
    }}>
      {children}
    </FriendsContext.Provider>
  );
}

export function useFriends() {
  const context = useContext(FriendsContext);
  if (context === undefined) {
    throw new Error('useFriends must be used within a FriendsProvider');
  }
  return context;
}