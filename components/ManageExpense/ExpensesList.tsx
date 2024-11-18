
import React, { useEffect, useState } from 'react';
import Button from './Button';
import { Edit, Pencil } from 'lucide-react';
import { useExpense } from '@/context/ExpenseContext';

interface ExpenseListProps{
    setIsOpen: (isOpen: boolean) => void;
}
const ExpensesList: React.FC<ExpenseListProps> = ({setIsOpen}) => {
    const {expenses, loading, error, setExpenseById, deleteExpense} = useExpense();
    const [isEdit, setIsEdit] = useState(false);
    const handleEditExpense = (id:string) =>{
        setExpenseById(id);
        setIsOpen(true);
    }

   
    const renderList = expenses.map((expense, index) => {
        // Check if the date is the same as the previous expense
        const showDate = index === 0 || expense.date !== expenses[index - 1].date;
        return (
            <div key={expense.id}>
                {showDate && (
                    <div className={`bg-gray-100 px-2 font-semibold text-gray-600 ${index == 0 ? 'rounded-t-lg' : ''}`}>
                        {`${expense.date}`}
                    </div>
                )}


                <div className={`flex flex-row content-center hover:bg-zinc-50 ` + (showDate || `border-t border-gray-100`)}>
                    <div className='w-full flex flex-row justify-between font-bold content-center px-2 py-3'>
                        <div className='flex flex-row justify-between'>
                            <div className='text-black my-auto '>{expense.description}</div>
                            <div className='rounded-lg py-1 px-1 my-auto mx-2 bg-gray-200 text-xs font-sans text-gray-500'>{expense.category}</div>
                        </div>
                        <div className="flex items-center">
  {/* Map over the payers and display images together */}
  <div className="flex items-center">
    {expense.payer.map((payer, index) => (
      <img 
        key={index} 
        src={payer.image} 
        alt={payer.name} 
        className={"h-5 w-5 rounded-full " + ((expense.payer.length > 1) && "-mr-2")} // Adjust margin between images
      />
    ))}
  </div>

  {/* Display the names together */}
  <div className="text-xs font-medium text-black ml-2">
    {expense.payer.map((payer, index) => (
      <span key={index}>
        {payer.name}{index < expense.payer.length - 1 && ', '}
      </span>
    ))}
    <span className="font-normal text-gray-500"> paid</span> {`RM${expense.amount}`}
  </div>
</div>


                    </div>
                    <button className='rounded-br-lg flex content-center hover:bg-gray-100 py-auto w-10' onClick={() => { handleEditExpense(expense.id) }}>
                        <Pencil className='stroke-1 active:stroke-2 my-auto mx-auto w-5 h-5 font-light text-gray-500'/>
                    </button>
                </div>
            </div>
        );
    });
    if (loading) return <div>Loading...</div>
    if (error) return <div>{error}</div>
    return (
        <div className='border rounded-lg'>
            {renderList}
        </div>
    );
};

export default ExpensesList;

// 'use client'
// import React from 'react';
// import Button from './Button';
// import { Expense } from '@/types/Expense';
// interface ExpensesListProps {
//     expenses: Expense[];
//     loading?: boolean; 
//     error?: string;
// }

// const ExpensesList: React.FC<ExpensesListProps> = ({ expenses, loading, error }) => {
//     const renderList = expenses.map((expense, index) => {
//         const showDate = index === 0 || expense.date !== expenses[index - 1].date;

//         return (
//             <div key={expense.id}>
//                 {showDate && (
//                     <div className={`bg-gray-100 px-2 font-semibold text-gray-600 border ${index == 0 ? 'rounded-t-lg' : ''}`}>
//                         {`${expense.date}`}
//                     </div>
//                 )}
//                 <div className='flex flex-row justify-between font-bold content-center px-2 py-3 border-t'>
//                     <div className='text-black'>{expense.description}</div>
//                     <div className='text-black'>{`RM ${expense.amount}`} <Button primary onClick={() => { console.log(expense.id) }}>Edit</Button></div>
//                 </div>
//             </div>
//         );
//     });

//     if (loading) return <div>Loading...</div>;
//     if (error) return <div>{error}</div>;

//     return (
//         <div className='border rounded-lg'>
//             {renderList}
//         </div>
//     );
// };

// export default ExpensesList;
