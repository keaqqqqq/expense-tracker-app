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
  const formattedAmount = Math.abs(balance).toFixed(2);
  const isPositive = balance > 0;

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={image || '/default-avatar.jpg'} alt={name} />
            <AvatarFallback>{name[0]}</AvatarFallback>
          </Avatar>
          <div>
            <h3 className="text-sm">{title}/{name}</h3>
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