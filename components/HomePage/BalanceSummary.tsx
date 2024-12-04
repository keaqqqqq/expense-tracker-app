'use client'
import React from 'react';
import { ArrowUpRight, ArrowDownRight, Wallet } from 'lucide-react';
import { useBalance } from '@/context/HomeBalanceContext';

export function BalanceSummary() {
  const { friendBalances } = useBalance();
  
  const calculateBalances = () => {
    let youGet = 0;
    let youOwe = 0;

    friendBalances.forEach(({ totalBalance }) => {
      if (totalBalance > 0) {
        youGet += totalBalance;
      } else {
        youOwe += Math.abs(totalBalance);
      }
    });

    const totalBalance = youGet - youOwe;

    return {
      youGet: youGet.toFixed(2),
      youOwe: youOwe.toFixed(2),
      totalBalance: totalBalance.toFixed(2),
    };
  };

  const { youGet, youOwe, totalBalance } = calculateBalances();
  const isPositive = parseFloat(totalBalance) >= 0;

  return (
    <div className="bg-white rounded-lg shadow mb-6">
      <div className="grid grid-cols-3 divide-x divide-gray-200">
        {/* Total Balance */}
        <div className="p-2 sm:p-6 flex flex-col text-center sm:text-left">
          <div className="flex items-center gap-1 sm:gap-2 text-gray-600 mb-0.5 sm:mb-1">
            <Wallet className="w-3 h-3 sm:w-5 sm:h-5" />
            <span className="text-xs sm:text-sm my-3">BALANCE</span>
          </div>
          <span className={`text-sm sm:text-xl font-medium ${
            isPositive ? 'text-green-600' : 'text-red-600'
          }`}>
            RM {totalBalance}
          </span>
        </div>

        {/* You Get */}
        <div className="p-2 sm:p-6 flex flex-col text-center sm:text-left">
          <div className="flex items-center gap-1 sm:gap-2 text-gray-600 mb-0.5 sm:mb-1">
            <ArrowUpRight className="w-3 h-3 sm:w-5 sm:h-5 text-green-600" />
            <span className="text-xs sm:text-sm my-3">YOU GET</span>
          </div>
          <span className="text-sm sm:text-xl font-medium text-green-600">
            RM {youGet}
          </span>
        </div>

        {/* You Owe */}
        <div className="p-2 sm:p-6 flex flex-col text-center sm:text-left ">
          <div className="flex items-center gap-1 sm:gap-2 text-gray-600 mb-0.5 sm:mb-1">
            <ArrowDownRight className="w-3 h-3 sm:w-5 sm:h-5 text-red-600" />
            <span className="text-xs sm:text-sm my-3">YOU OWE</span>
          </div>
          <span className="text-sm sm:text-xl font-medium text-red-600">
            RM {youOwe}
          </span>
        </div>
      </div>
    </div>
  );
}