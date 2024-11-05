'use client'
import React from 'react';
import { Button } from "@/components/ui/button";
import type { Relationship } from '@/lib/actions/user.action';
import { Card } from '@/components/ui/card';
import { CardContent } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

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
  onAcceptRequest: (relationshipId: string) => void;
}

const FriendList = ({ relationships, onAcceptRequest }: FriendListProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-w-6xl mx-auto">
      {relationships.map((relationship) => (
        <Card 
          key={relationship.id} 
          className="w-full border border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors duration-200 bg-white dark:bg-zinc-800/50"
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
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {relationship.status === 'PENDING' 
                    ? 'Pending'
                    : 'Accepted'
                  }
                </p>
              </div>
            </div>
            
            {relationship.role === 'addressee' && 
             relationship.status === 'PENDING' && (
              <Button
                onClick={() => onAcceptRequest(relationship.id)}
                className="ml-4 shrink-0 shadow-sm hover:shadow-md transition-shadow duration-200"
                variant="secondary"
                size="sm"
              >
                Accept Request
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
  );
};

export default FriendList;