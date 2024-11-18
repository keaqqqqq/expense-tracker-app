// PayerInfo.tsx
import { useExpense } from '@/context/ExpenseContext';
import React, { useEffect, useState } from 'react';
import DisplayPayer from './DisplayPayer';
import FormInput from '../FormInput';

interface PayerInfoProps {

}

const PayerInfo: React.FC<PayerInfoProps> = ({ }) => {
    const { expense, userData, removePayer, addPayer, setPayPreference, updatePayerAmount } = useExpense();
    const [isAddPayer, setIsAddPayer] = useState(false);
    const onClickChangePayer = () => {
        expense.payer.map((p) => { removePayer(p.id) })
    }
    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setPayPreference(e.target.value);
        if(e.target.value === 'custom'){
            expense.payer.map((p) => {
                updatePayerAmount(p.id, 0)
            })
        }
      };
    useEffect(() => {
        if(expense.payer.length===1){
            setPayPreference('equal');
        }
        if (expense.pay_preference === 'equal') {
            const amount = Number((expense.amount / expense.payer.length).toFixed(2));
            expense.payer.map((p) => {
                updatePayerAmount(p.id, amount)
            })
        }
    }, [expense.pay_preference, expense.payer.length, expense.amount])
    // useEffect(()=>{
    //     if(expense.pay_preference === 'custom'){
    //         expense.payer.map((p) => {
    //             updatePayerAmount(p.id, 0)
    //         })
    //     }
    // },[expense.pay_preference])
    const renderPayer = expense.payer.map((p) => {
        <>
            <div className="flex flex-row w-full justify-start items-center space-x-4 p-1"> {/* Added space-x-4 for spacing */}
                <img
                    src={p.image}
                    alt={p.name}
                    className="w-8 h-8 rounded-full object-cover" // Circle styling
                />
                <div className="flex flex-row w-full justify-between">
                    <p className="my-auto">{p.name}</p>
                    <p className="my-auto">RM {p.amount.toFixed(2)}</p>
                </div>
            </div>
            <button
                className="w-8 border-l py-2 m-0 text-center hover:bg-gray-100"
                onClick={() => removePayer(p.id)} // Trigger the removal when clicked
            >
                x
            </button>
        </>
    })
    return (<>
        {expense.payer.length === 1 && !isAddPayer &&
            (<>
                <div className="px-5 py-2 flex flex-row justify-between font-semibold text-xs text-gray-700 border-b">
                    <div>
                        paid by <b className='font-bold'>{expense.payer[0]?.id === userData?.id ? 'you' : expense.payer[0]?.name}</b>
                    </div>
                    <div>
                        <a
                            className='text-indigo-600 underline cursor-pointer'
                            onClick={onClickChangePayer}
                        >
                            Change payer
                        </a>
                        &nbsp;&mdash;&nbsp;
                        <a
                            className='text-indigo-600 underline cursor-pointer'
                            onClick={() => { setIsAddPayer(true) }}
                        >
                            Add payers
                        </a>
                    </div>
                </div>
            </>)
        }
        {expense.payer.length === 0 && (
            <div className="px-5 py-2 flex flex-row justify-between font-semibold text-xs text-gray-700 border-b">
                <div className='flex flex-row w-full justify-between'>
                    <div className='my-auto'>
                        paid by <b className='font-bold text-red-600'>No One</b>
                    </div>
                    <div className='flex-grow px-3'>
                        <DisplayPayer />
                    </div>
                    <div className='my-auto'>
                        <a
                            className='text-indigo-600 underline cursor-pointer'
                            onClick={() => { userData ? addPayer(userData) : null }}
                        >
                            Only I paid
                        </a>
                    </div>
                </div>
            </div>)}
        {(isAddPayer || expense.payer.length>1) && (
            <div className='p-3 text-xs'>
                <div className='flex flex-row'>
                    <div className='my-auto'>paid</div>
                    <div className='my-auto'>
                        <select
                            onChange={handleChange}
                            value={expense.pay_preference}  // Bind the select value to the state
                            className="px-4 py-2 border border-gray-300 rounded-md mx-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        >
                            <option value="equal">Equally</option>
                            <option value="custom">Custom</option>
                        </select>

                    </div>
                    <div className='my-auto'>by</div>
                    <div className='flex-grow px-3'>
                        <DisplayPayer />
                    </div>
                    <div className='my-auto'>
                        <a
                            className='text-indigo-600 underline cursor-pointer'
                            onClick={() => { onClickChangePayer(); userData ? addPayer(userData) : null; setIsAddPayer(false) }}
                        >
                            Only I paid
                        </a>
                    </div>
                </div>
                <div className=''>
                    {expense.payer.map((p) => {
                        return (  // <-- Add return here
                            <div className='border flex flex-row my-2 rounded justify-between'>
                                <div className='flex flex-row p-2 justify-between text-xs flex-grow' key={p.id}>  {/* Add a key for list rendering */}
                                    <div className='my-auto'>{p.name}</div>
                                   {expense.pay_preference === 'equal' && <div>RM {p.amount}</div>}
                                   {expense.pay_preference === 'custom' && 
                                   <div>RM
                                    <FormInput type='number' value={p.amount} onChange={(e)=>updatePayerAmount(p.id, Number(Number(e.target.value).toFixed(2)))}></FormInput>
                                   </div>
                                   }
                                </div>
                                <button className='border-l px-2 hover:bg-red-100' onClick={() => removePayer(p.id)}>x</button>
                            </div>
                        );
                    })}
                </div>
            </div>
        )}

    </>
    );
};

export default PayerInfo;