'use client'
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from '@/components/ui/card';
import { CardContent } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import Toast from '@/components/Toast';
import { Relationship } from '@/types/Friend';
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
}

const FriendList = ({ relationships: initialRelationships, onAcceptRequest }: FriendListProps) => {
  const [relationships, setRelationships] = useState(initialRelationships);
  const [pendingAccepts, setPendingAccepts] = useState<Set<string>>(new Set());
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const getAcceptButtonText = (relationship: EnrichedRelationship) => {
    if (pendingAccepts.has(relationship.id)) {
      return 'Accepting...';
    }

    if (relationship.related_group_id) {
      return 'Join Group';
    }

    return 'Accept Request';
  };

  const getSuccessMessage = (relationship: EnrichedRelationship) => {
    if (relationship.related_group_id) {
      return `Successfully accepted friend request and joined ${relationship.related_group_name || 'the group'}!`;
    }
    return 'Friend request accepted successfully!';
  };

  const handleAcceptRequest = async (relationship: EnrichedRelationship) => {
    setPendingAccepts(prev => new Set(prev).add(relationship.id));
    
    try {
      const result = await onAcceptRequest(relationship.id);
      
      if (result.success) {
        setRelationships(prev =>
          prev.map(r =>
            r.id === relationship.id
              ? { ...r, status: 'ACCEPTED' }
              : r
          )
        );
        
        setToastMessage(result.message || getSuccessMessage(relationship));
        setShowToast(true);
      }
    } catch (error) {
      setToastMessage(
        relationship.related_group_id 
          ? "Failed to accept request and join group. Please try again."
          : "Failed to accept friend request. Please try again."
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

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-w-6xl mx-auto">
        {relationships.map((relationship) => (
          <Card 
            key={relationship.id} 
            className={`w-full border border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors duration-200 bg-white dark:bg-zinc-800/50 ${
              relationship.related_group_id ? 'ring-1 ring-primary/20' : ''
            }`}
          >
            <CardContent className="flex items-center justify-between py-2 px-4">
              <div className="flex items-center space-x-3">
                <Avatar className="h-8 w-8 ring-1 ring-zinc-100 dark:ring-zinc-700">
                  <AvatarImage 
                    src={relationship.displayInfo.avatar.image} 
                    alt={relationship.displayInfo.avatar.alt} 
                  />
                  <AvatarFallback className="bg-zinc-100 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs">
                    {relationship.displayInfo.avatar.fallback}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1 border-l border-zinc-200 dark:border-zinc-700 pl-3">
                  <p className="text-sm font-medium truncate text-zinc-900 dark:text-zinc-100">
                    {relationship.role === 'addressee' 
                      ? `Request from: ${relationship.displayInfo.displayName}`
                      : relationship.type === 'invitation'
                        ? `Invited: ${relationship.displayInfo.displayName}`
                        : `Request to: ${relationship.displayInfo.displayName}`
                    }
                  </p>
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      {relationship.status === 'PENDING' 
                        ? 'Pending'
                        : 'Accepted'
                      }
                    </p>
                    {relationship.related_group_id && (
                      <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                        Group Invitation
                      </span>
                    )}
                    {relationship.related_group_name && (
                      <span className="text-xs text-zinc-500">
                        for {relationship.related_group_name}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              {relationship.role === 'addressee' && 
               relationship.status === 'PENDING' && (
                <Button
                  onClick={() => handleAcceptRequest(relationship)}
                  disabled={pendingAccepts.has(relationship.id)}
                  className={`ml-4 shrink-0 shadow-sm hover:shadow-md transition-shadow duration-200`}
                  variant={relationship.related_group_id ? "default" : "secondary"}
                  size="sm"
                >
                  {getAcceptButtonText(relationship)}
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
        
        {relationships.length === 0 && (
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