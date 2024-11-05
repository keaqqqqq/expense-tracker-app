// components/Friends/FriendList.tsx
'use client'
import React from 'react';
import { Button } from "@/components/ui/button";
import type { Relationship } from '@/lib/actions/user.action';
import { Card } from '@/components/ui/card';
import { CardContent } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

export interface UserData {
  id: string;
  image?: string;
  email: string;
  name?: string;
}

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
    <div className="space-y-4">
      {relationships.map((relationship) => (
        <Card key={relationship.id} className="w-full">
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center space-x-4">
              <Avatar className="h-8 w-8">
                <AvatarImage 
                  src={relationship.displayInfo.avatar.image} 
                  alt={relationship.displayInfo.avatar.alt} 
                />
                <AvatarFallback>
                  {relationship.displayInfo.avatar.fallback}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">
                  {relationship.role === 'addressee' 
                    ? `Request from: ${relationship.displayInfo.displayName}`
                    : relationship.type === 'invitation'
                      ? `Invited: ${relationship.displayInfo.displayName}`
                      : `Request to: ${relationship.displayInfo.displayName}`
                  }
                </p>
                <p className="text-sm text-gray-500">
                  {relationship.status === 'PENDING' ? 'Pending' : 'Accepted'}
                </p>
              </div>
            </div>
            
            {relationship.role === 'addressee' && 
             relationship.status === 'PENDING' && (
              <Button
                onClick={() => onAcceptRequest(relationship.id)}
                className="ml-4"
              >
                Accept Request
              </Button>
            )}
          </CardContent>
        </Card>
      ))}
      
      {relationships.length === 0 && (
        <p className="text-center text-gray-500">No friend requests or invitations</p>
      )}
    </div>
  );
};

export default FriendList;