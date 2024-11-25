'use client'
import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';

interface HomeBalanceCardProps {
  friendId: string;
  name: string;
  image?: string;
  directBalance: number;
  groupBalance: number;
  totalBalance: number;
}

export function HomeBalanceCard({ 
  friendId,
  name, 
  image, 
  directBalance,
  groupBalance,
  totalBalance 
}: HomeBalanceCardProps) {
  const formattedDirectAmount = Math.abs(directBalance).toFixed(2);
  const formattedGroupAmount = Math.abs(groupBalance).toFixed(2);
  const formattedTotalAmount = Math.abs(totalBalance).toFixed(2);

  const isPositive = totalBalance > 0;

  return (
    <Link href={`/friends/${friendId}`}>
      <div className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={image || '/default-avatar.jpg'} alt={name} />
              <AvatarFallback>{name[0]}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-base">{name}</h3>
              <div className={`text-xs font-medium px-2 py-1 rounded-full inline-flex items-center mt-1
                ${isPositive 
                    ? 'text-green-700 bg-green-50' 
                    : 'text-red-700 bg-red-50'
                }`}
              >
                {isPositive ? 'owes you' : 'you owe'} RM {formattedTotalAmount}
              </div>
            </div>
          </div>
        </div>
        <div className="space-y-2 text-sm text-gray-600">
          {directBalance !== 0 && (
            <div className="flex items-center">
              <span className="w-5 h-5 flex items-center justify-center mr-2">👤</span>
              1:1 balance: 
              <span className={`ml-1 ${directBalance > 0 ? 'text-green-600' : 'text-red-600'}`}>
                RM {formattedDirectAmount}
              </span>
            </div>
          )}
          {groupBalance !== 0 && (
            <div className="flex items-center">
              <span className="w-5 h-5 flex items-center justify-center mr-2">👥</span>
              Group balances: 
              <span className={`ml-1 ${groupBalance > 0 ? 'text-green-600' : 'text-red-600'}`}>
                RM {formattedGroupAmount}
              </span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}