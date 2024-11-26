import React from 'react';
import { ArrowUpRight, ArrowDownRight, Wallet } from 'lucide-react';

interface BalanceSummaryProps {
  friendBalances: Array<{
    totalBalance: number;
  }>;
}

export function BalanceSummary({ friendBalances }: BalanceSummaryProps) {
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
      <div className="grid grid-cols-3">
        {/* Total Balance */}
        <div className="p-6 relative">
          <div className="flex items-center gap-2 text-gray-600 mb-1">
            <Wallet className="w-5 h-5" />
            <span className="text-sm font-medium">YOUR BALANCE</span>
          </div>
          <span className={`text-2xl font-bold ${
            isPositive ? 'text-green-600' : 'text-red-600'
          }`}>
            RM {totalBalance}
          </span>
          <div className="absolute right-0 top-0 bottom-0 w-px bg-gray-200"></div>
        </div>

        {/* You Get */}
        <div className="p-6 relative">
          <div className="flex items-center gap-2 text-gray-600 mb-1">
            <ArrowUpRight className="w-5 h-5 text-green-600" />
            <span className="text-sm font-medium">YOU GET</span>
          </div>
          <span className="text-2xl font-bold text-green-600">
            RM {youGet}
          </span>
          <div className="absolute right-0 top-0 bottom-0 w-px bg-gray-200"></div>
        </div>

        {/* You Owe */}
        <div className="p-6">
          <div className="flex items-center gap-2 text-gray-600 mb-1">
            <ArrowDownRight className="w-5 h-5 text-red-600" />
            <span className="text-sm font-medium">YOU OWE</span>
          </div>
          <span className="text-2xl font-bold text-red-600">
            RM {youOwe}
          </span>
        </div>
      </div>
    </div>
  );
}