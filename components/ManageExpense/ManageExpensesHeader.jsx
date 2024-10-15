import Button from "./Button";

export default function ManageExpensesHeader({openModal}) {
    return (
        <div className='border rounded'>
            <div className='flex flex-row justify-between font-semibold content-center px-2'>
                <h2 className='my-auto'>
                    Expenses
                </h2>
                <div className='text-sm'>
                    <Button primary className='mx-1' onClick={openModal}>New expense</Button>
                    <Button secondary>Settle up</Button>
                </div>
            </div>
        </div>
    )
}