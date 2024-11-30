'use client'
import React, { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface GroupBalance {
  name: string;
  balance: number;
}

interface HomeBalanceCardProps {
  friendId: string;
  name: string;
  image?: string;
  directBalance: number;
  groupBalances?: GroupBalance[];
  totalBalance: number;
}

export function HomeBalanceCard({ 
  friendId,
  name, 
  image, 
  directBalance,
  groupBalances = [],
  totalBalance
}: HomeBalanceCardProps) {
  const formattedDirectAmount = Math.abs(directBalance).toFixed(2);
  const formattedTotalAmount = Math.abs(totalBalance).toFixed(2);

  const isPositive = totalBalance > 0;
  const isSettledUp = Math.abs(totalBalance) < 0.01;

  if (isSettledUp && directBalance === 0 && groupBalances.every(g => g.balance === 0)) {
    return null;
  }

  const handleCardClick = (e: React.MouseEvent) => {
    // Stop event propagation to prevent the Link from triggering
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <Link href={`/friends/${friendId}`}>
      <div className="bg-white rounded-lg shadow hover:shadow-md transition-shadow w-full h-64">
        {/* Header Section - Fixed Height */}
        <div className="p-4 h-20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={image || '/default-avatar.jpg'} alt={name} />
                <AvatarFallback>{name[0]}</AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold text-base">{name}</h3>
                {!isSettledUp && (
                  <div className={`text-xs font-medium px-2 py-1 rounded-full inline-flex items-center mt-1
                    ${isPositive ? 'text-green-700 bg-green-50' : 'text-red-700 bg-red-50'}`}
                  >
                    {isPositive ? `Owes you RM ${formattedTotalAmount}`
                      : `You owe RM ${formattedTotalAmount}`}
                      
                  </div>
                )}
                {isSettledUp && (
                  <div className={'text-xs font-medium px-2 py-1 rounded-full inline-flex items-center mt-1 text-green-700 bg-green-50'}
                  >
                    Settled Up           
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="h-px bg-gray-200 w-full"></div>

        {/* Balances Section - Scrollable if needed */}
        <div className="p-4 h-28 overflow-y-auto">
          <div className="space-y-2 text-sm text-gray-600">
            {directBalance !== 0 && (
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="w-5 h-5 flex items-center justify-center mr-2 text-indigo-500">👤</span>
                  1:1 
                </div>
                <span className={`ml-1 ${directBalance > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  RM {formattedDirectAmount}
                </span>
              </div>
            )}
            
            {groupBalances.map((group, index) => (
              group.balance !== 0 && (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="w-5 h-5 flex items-center justify-center mr-2">👥</span>
                    {group.name}
                  </div>
                  <span className={`ml-1 ${group.balance > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    RM {Math.abs(group.balance).toFixed(2)}
                  </span>
                </div>
              )
            ))}
          </div>
        </div>

        <div className="h-px bg-gray-200 w-full"></div>

        {/* Footer Section - Now with Dialog */}
        <Dialog>
          <DialogTrigger asChild onClick={handleCardClick}>
            <div className="p-4 h-16 cursor-pointer hover:bg-gray-100 rounded-b-lg">
              <div className="flex">
                <button className="px-2.5 py-1.5 text-sm">
                  Settle up
                </button>
                <div className="py-1 text-xs">
                  <ArrowRight/>
                </div>
              </div>
            </div>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Settle up with {name}</DialogTitle>
            </DialogHeader>
            <div className="p-4">
              <div className="space-y-4">
                <div className="text-lg font-medium">
                  Total to settle: RM {formattedTotalAmount}
                </div>
                {/* Add your settle up form/content here */}
                <div className="space-y-2">
                  {directBalance !== 0 && (
                    <div className="flex justify-between">
                      <span>1:1 Balance</span>
                      <span>RM {formattedDirectAmount}</span>
                    </div>
                  )}
                  {groupBalances.map((group, index) => (
                    group.balance !== 0 && (
                      <div key={index} className="flex justify-between">
                        <span>{group.name}</span>
                        <span>RM {Math.abs(group.balance).toFixed(2)}</span>
                      </div>
                    )
                  ))}
                </div>
                <button 
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Record Settlement
                </button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Link>
  );
}