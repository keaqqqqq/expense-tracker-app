import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

interface BalanceCardProps {
  title: string;
  settledBalance: number;
  unsettledBalance: number;
  directPaymentBalance: number;
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
  directPaymentBalance,
  netBalance,
  image,
  name,
  type,
  onSettle
}: BalanceCardProps) {
    const hasNoBalances = 
    Number(unsettledBalance || 0) === 0 && 
    Number(settledBalance || 0) === 0 && 
    Number(directPaymentBalance || 0) === 0 &&
    Number(netBalance || 0) === 0;

  if (hasNoBalances) return null;
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
                <div className="flex justify-between items-center">
                    <span className="text-xs font-medium">Total Amount Due:</span>
                    <div className={`text-xs px-2 py-1 rounded-full 
                        ${Number(netBalance || 0) >= 1 
                            ? 'text-green-700 bg-green-50'   
                            : Number(netBalance || 0) <= -1 
                                ? 'text-red-700 bg-red-50'     
                                : 'text-green-700 bg-green-50' 
                        }`}
                    >
                        {Number(netBalance || 0) >= 1 
                            ? `Owes you RM ${Math.abs(Number(netBalance || 0)).toFixed(2)}` 
                            : Number(netBalance || 0) <= -1
                                ? `You owe RM ${Math.abs(Number(netBalance || 0)).toFixed(2)}`
                                : 'Settled up'
                        }
                    </div>
                </div>

              <Separator />

              <div className="text-xs text-gray-500 space-y-2">
                  {unsettledBalance > 0 && (
                      <div className="flex justify-between">
                          <span>Unsettled:</span>
                          <span>RM {unsettledBalance.toFixed(2)}</span>
                      </div>
                  )}
                  {settledBalance > 0 && (
                      <div className="flex justify-between">
                          <span>Settled:</span>
                          <span>RM {settledBalance.toFixed(2)}</span>
                      </div>
                  )}
                {Number(directPaymentBalance) !== 0 && (
                      <div className="flex justify-between">
                          <span>Direct payment:</span>
                          <span>
                              {directPaymentBalance > 0 
                                  ? `RM ${Math.abs(directPaymentBalance).toFixed(2)}` 
                                  : `RM ${Math.abs(directPaymentBalance).toFixed(2)}`
                              }
                          </span>
                      </div>
                  )}
              </div>

              {onSettle && unsettledBalance > 0 || directPaymentBalance > 0 && (
                  <Button 
                      variant="outline" 
                      size="sm"
                      onClick={onSettle}
                      className="w-full mt-2 text-xs sm:text-sm"
                  >
                      Settle up
                  </Button>
              )}
          </div>
      </Card>
  );
}