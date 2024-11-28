import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

interface BalanceCardProps {
  title: string;
  settledBalance: number;
  unsettledBalance: number;
  netBalance: number;
  image?: string;
  name: string;
  type: 'friend' | 'group';
  onSettle?: () => void;
}

export function BalanceCard({
  title,
  settledBalance,
  unsettledBalance,
  netBalance,
  image,
  name,
  type,
  onSettle
}: BalanceCardProps) {
  if (unsettledBalance === 0 && settledBalance === 0) return null;

  console.log('Net balance: '+ netBalance)
  return (
      <Card className="bg-white p-4">
          <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                      <AvatarImage src={image || '/default-avatar.jpg'} alt={name} />
                      <AvatarFallback>{name[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                      {type === 'friend' && (
                          <h3 className="text-xs">1:1 w/ <span className="font-medium text-sm">{name}</span></h3>
                      )}
                      {type === 'group' && title && (
                          <h3 className="text-xs">In <span className="font-medium text-sm">{title}</span></h3>
                      )}
                      {type === 'group' && !title && (
                          <h3 className="font-medium text-sm">{name}</h3>
                      )}
                  </div>
              </div>
          </div>

          <div className="space-y-3">
                {/* Net Balance - Using "Total Amount Due" to indicate pending status */}
                <div className="flex justify-between items-center">
                    <span className="text-xs font-medium">Total Amount Due:</span>
                    <div className={`text-xs px-2 py-1 rounded-full 
                        ${netBalance > 0 
                            ? 'text-green-700 bg-green-50' 
                            : netBalance < 0 
                                ? 'text-red-700 bg-red-50'
                                : 'text-gray-600 bg-gray-50'
                        }`}
                    >
                        {netBalance > 0 
                            ? `Owes you RM ${Math.abs(netBalance).toFixed(2)}` 
                            : netBalance < 0 
                                ? `You owe RM ${Math.abs(netBalance).toFixed(2)}`
                                : 'No pending amount'
                        }
                    </div>
                </div>

              <Separator />

              {/* Additional Details - Collapsed by default */}
              <div className="text-xs text-gray-500 space-y-2">
                  {unsettledBalance > 0 && (
                      <div className="flex justify-between">
                          <span>Total unsettled:</span>
                          <span>RM {unsettledBalance.toFixed(2)}</span>
                      </div>
                  )}
                  {settledBalance > 0 && (
                      <div className="flex justify-between">
                          <span>Total settled:</span>
                          <span>RM {settledBalance.toFixed(2)}</span>
                      </div>
                  )}
              </div>

              {/* Settle Button */}
              {onSettle && unsettledBalance > 0 && (
                  <Button 
                      variant="outline" 
                      size="sm"
                      onClick={onSettle}
                      className="w-full mt-2"
                  >
                      Settle Up
                  </Button>
              )}
          </div>
      </Card>
  );
}