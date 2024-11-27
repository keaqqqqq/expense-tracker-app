'use client'
import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

interface BalanceCardProps {
  title: string;
  balance: number;
  image?: string;
  name: string;
  type: 'friend' | 'group';
  onSettle?: () => void;
}

export function BalanceCard({ title, balance, image, name, type, onSettle }: BalanceCardProps) {
  if (balance === 0) return null;
  
  const formattedAmount = Math.abs(balance).toFixed(2);
  const isPositive = balance > 0;
  const friendType = type == 'friend';
  const groupType = type == 'group';
  const isTitle = title.length !== 0;
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-1">
          <Avatar className="h-8 w-8">
            <AvatarImage src={image || '/default-avatar.jpg'} alt={name} />
            <AvatarFallback>{name[0]}</AvatarFallback>
          </Avatar>
          <div>
            {
              friendType && (
                <h3 className="text-xs">1:1 w/ <span className='font-medium text-sm'>{name}</span></h3>
              )
            }
            {
              groupType && isTitle &&(
                <h3 className="text-xs">In <span className='font-medium text-sm'>{title}</span></h3>
              )
            }
            {
              groupType && !isTitle && (
                <h3 className="font-medium text-sm">{name}</h3>
              )
            }
          </div>
        </div>
      </div>
      <div className="flex justify-between items-center">
        <div className={`text-xs font-medium px-2 py-1 rounded-full inline-flex items-center
          ${isPositive 
              ? 'text-green-700 bg-green-50' 
              : 'text-red-700 bg-red-50'
          }`}
        >
          {isPositive ? 'Owes you' : 'You owe'} RM {formattedAmount}
        </div>
        {onSettle && (
          <Button 
            variant="outline" 
            size="sm"
            onClick={onSettle}
            className="ml-4"
          >
            Settle
          </Button>
        )}
      </div>
    </div>
  );
}