export default function EqualSplit() {

    const users = [
        {name:'chua', amount: '4.60'},
        {name:'isyraf', amount: '4.60'},
        {name:'kiachua', amount: '4.60'},
        {name:'keachu', amount: '4.60'},
    ];

    const renderUsers = users.map((user)=>{
        return (
            <div className="flex flex-row border rounded">
                    <div className="flex flex-row w-full justify-around content-center">
                        <p className="my-auto">{user.name}</p>
                        <p className="my-auto">{user.amount}</p>
                    </div>
                    <p className="w-8 border-l py-2 m-0 text-center hover:bg-gray-100">x</p>
                </div>
        )
    })

    return (
        <div className="my-2">
            <div className="border bg-gray-100 rounded p-1 text-center">
                Select which people owe an equal share
            </div>
            <div className="grid grid-cols-2 gap-2 my-2">
                {renderUsers}
            </div>
        </div>
    )
}