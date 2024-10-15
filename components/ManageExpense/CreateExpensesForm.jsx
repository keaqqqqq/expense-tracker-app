import FormInput from "../FormInput";

export default function CreateExpenseForm() {
    return (
        <>
            <div className="px-5 py-2 flex flex-col font-semibold text-xs text-gray-700 border-b">
                <div className="flex flex-row">
                    <div className="flex flex-col">
                        Description
                        <FormInput className="ml-0"></FormInput>
                    </div>
                    <div className="flex flex-col">
                        Amount
                        <FormInput className="ml-0"></FormInput>
                    </div>
                </div>
                <div className="flex flex-row">
                    <div className="flex flex-col">
                        Date
                        <FormInput className="ml-0"></FormInput>
                    </div>
                    <div className="flex flex-col">
                        Category
                        <FormInput className="ml-0"></FormInput>
                    </div>
                </div>
            </div>
            <div className="px-5 py-2 flex flex-col font-semibold text-xs text-gray-700 border-b">
                pay by who
            </div>
        </>
    )
}