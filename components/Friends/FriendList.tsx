'use client'
import React, { useState, useMemo, MouseEvent } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from '@/components/ui/card';
import { CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import Toast from '@/components/Toast';
import { Relationship } from '@/types/Friend';
import Image from 'next/image';
import { useFriends } from '@/context/FriendsContext';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
export interface DisplayUserInfo {
  avatar: {
    image?: string;
    fallback: string;
    alt: string;
  };
  displayName: string;
}

export interface EnrichedRelationship extends Relationship {
  displayInfo: DisplayUserInfo;
}

interface FriendListProps {
  relationships: EnrichedRelationship[];
  onAcceptRequest: (relationshipId: string) => Promise<{ success: boolean, message?: string }>;
  balances?: Array<{
    friendId: string;
    totalBalance: number;
  }>;
}

const FriendList = ({ relationships, onAcceptRequest, balances }: FriendListProps) => {
  const [pendingAccepts, setPendingAccepts] = useState<Set<string>>(new Set());
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const { refreshFriends } = useFriends(); 
  const router = useRouter();
  const {currentUser} = useAuth()

  const shouldReplaceExisting = (existing: EnrichedRelationship, new_rel: EnrichedRelationship) => {
    if (new_rel.related_group_id && !existing.related_group_id) return true;
    return new Date(new_rel.created_at || '') > new Date(existing.created_at || '');
  };

  const organizedRelationships = useMemo(() => {
    const uniqueRelationships = new Map<string, EnrichedRelationship>();

    relationships.forEach(rel => {
      const otherUserId = rel.displayInfo.displayName;
      const existingRel = uniqueRelationships.get(otherUserId);

      if (!existingRel || shouldReplaceExisting(existingRel, rel)) {
        uniqueRelationships.set(otherUserId, rel);
      }
    });

    return Array.from(uniqueRelationships.values());
  }, [relationships]); 

  const getAvatarImage = (relationship: EnrichedRelationship) => {
    if (!relationship.displayInfo.avatar.image) return null;

    return (
      <div className="relative h-8 w-8">
        <Image
          src={relationship.displayInfo.avatar.image}
          alt={relationship.displayInfo.avatar.alt}
          fill
          sizes="(max-width: 32px) 100vw, 32px"
          className="rounded-full object-cover"
          priority={false}
          loading="lazy"
          quality={75}
        />
      </div>
    );
  };

  const getRequestStatus = (relationship: EnrichedRelationship) => {
    if (relationship.related_group_id) {
      return {
        buttonText: pendingAccepts.has(relationship.id) ? 'Accepting...' : 'Join Group',
        displayText: `Group Invitation${relationship.related_group_name ? `: ${relationship.related_group_name}` : ''}`
      };
    }
    return {
      buttonText: pendingAccepts.has(relationship.id) ? 'Accepting...' : 'Accept Request',
      displayText: 'Friend Request'
    };
  };

  const handleAcceptRequest = async (event: MouseEvent<HTMLButtonElement>, relationship: EnrichedRelationship) => {    
    event.stopPropagation();
    setPendingAccepts(prev => new Set(prev).add(relationship.id));
    
    try {
      const result = await onAcceptRequest(relationship.id);
      
      if (result.success) {
        await refreshFriends(); 
        
        setToastMessage(result.message || 
          (relationship.related_group_id 
            ? `Successfully joined ${relationship.related_group_name || 'the group'}!`
            : 'Friend request accepted successfully!')
        );
        setShowToast(true);
      }
    } catch (error) {
      console.error('Error in handleAcceptRequest:', error); 
      setToastMessage(
        relationship.related_group_id 
          ? "Failed to join group. Please try again."
          : "Failed to accept request. Please try again."
      );
      setShowToast(true);
    } finally {
      setPendingAccepts(prev => {
        const next = new Set(prev);
        next.delete(relationship.id);
        return next;
      });
    }
  };

  const handleCardClick = (relationship: EnrichedRelationship) => {
    const targetUserId = currentUser?.uid === relationship.requester_id
      ? relationship.addressee_id
      : relationship.requester_id;
      
    router.push(`/friends/${targetUserId}`);
  };
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-w-8xl mx-auto">
        {organizedRelationships.map((relationship) => {
          const status = getRequestStatus(relationship);
          const friendId = currentUser?.uid === relationship.requester_id
            ? relationship.addressee_id
            : relationship.requester_id;
          const balance = balances?.find(b => b.friendId === friendId)?.totalBalance || 0;
          
          return (
            <Card 
              key={relationship.id} 
              className={`w-full border border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors duration-200 bg-white dark:bg-zinc-800/50 ${
                relationship.related_group_id ? 'ring-1 ring-primary/20' : ''} cursor-pointer
              }`}
              onClick={() => handleCardClick(relationship)}
            >
              <CardContent className="flex items-center justify-between py-2 px-4">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-8 w-8 ring-1 ring-zinc-100 dark:ring-zinc-700">
                    {relationship.displayInfo.avatar.image ? (
                      getAvatarImage(relationship)
                    ) : (
                      <AvatarFallback className="bg-zinc-100 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs">
                        {relationship.displayInfo.avatar.fallback}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div className="min-w-0 flex-1 border-l border-zinc-200 dark:border-zinc-700 pl-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs sm:text-sm font-medium truncate text-zinc-900 dark:text-zinc-100 mr-2">
                        {relationship.displayInfo.displayName}
                      </p>
                      {relationship.status === 'ACCEPTED' && (
                        <div className={`text-[10px] sm:text-xs text-center font-medium px-1 py-0.5 rounded-full inline-flex items-center ${
                          balance > 0 
                            ? 'bg-green-100 dark:bg-green-900/20' 
                            : balance < 0 
                              ? 'bg-red-100 dark:bg-red-900/20'
                              : 'bg-zinc-100 dark:bg-zinc-800'
                        }`}>
                          <span className={`${
                            balance > 0 
                              ? 'text-green-700 dark:text-green-400' 
                              : balance < 0 
                                ? 'text-red-700 dark:text-red-400'
                                : 'text-zinc-600 dark:text-zinc-400'
                          }`}>
                            {balance > 0 
                              ? `Owes you RM${balance.toFixed(2)}` 
                              : balance < 0 
                                ? `You owe RM${Math.abs(balance).toFixed(2)}`
                                : 'No balance'
                            }
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-primary/10 text-primary py-0.5 rounded-full">
                        {status.displayText}
                      </span>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        {relationship.status === 'PENDING' ? 'Pending' : 'Accepted'}
                      </p>
                    </div>
                  </div>
                </div>
                
                {relationship.role === 'addressee' && 
                 relationship.status === 'PENDING' && (
                  <Button
                    onClick={(event) => handleAcceptRequest(event, relationship)}
                    disabled={pendingAccepts.has(relationship.id)}
                    className="ml-4 shrink-0 shadow-sm hover:shadow-md transition-shadow duration-200"
                    variant={relationship.related_group_id ? "default" : "secondary"}
                    size="sm"
                  >
                    {status.buttonText}
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
        
        {organizedRelationships.length === 0 && (
          <div className="col-span-1 md:col-span-2 border border-dashed border-zinc-300 dark:border-zinc-600 rounded-lg p-4">
            <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
              No friend requests or invitations
            </p>
          </div>
        )}
      </div>

      {showToast && (
        <Toast 
          message={toastMessage}
          duration={2000}
          onClose={() => setShowToast(false)}
        />
      )}
    </>
  );
};


export default FriendList;