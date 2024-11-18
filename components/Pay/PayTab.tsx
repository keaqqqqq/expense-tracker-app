// PayTab.tsx
import React from 'react';
import { useExpense } from '@/context/ExpenseContext';

interface PayTabProps {
//   expense: any;  // You can replace `any` with the actual type of `expense`
  onChangePayer: () => void;
  onAddPayer: () => void;
}

const PayTab: React.FC<PayTabProps> = ({onChangePayer, onAddPayer }) => {
    const {expense} = useExpense();
  return (
    <div className="px-5 py-2 flex flex-row justify-between font-semibold text-xs text-gray-700 border-b">
      <div>paid by <b className="font-bold">{expense.payer.map(p => p.name).join(', ')}</b></div>
      <div>
        <a
          className="text-indigo-600 underline cursor-pointer"
          onClick={onChangePayer}
        >
          Change payer
        </a>
        &nbsp;&mdash;&nbsp;
        <a
          className="text-indigo-600 underline cursor-pointer"
          onClick={onAddPayer}
        >
          Add payers
        </a>
      </div>
    </div>
  );
};

export default PayTab;
