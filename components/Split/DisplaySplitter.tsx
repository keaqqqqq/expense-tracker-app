import { SplitFriend } from '@/types/SplitFriend';
import React from 'react';
import Image from 'next/image';
// Define the type for the props
interface DisplaySplitterProps {
    friend: SplitFriend & {amount:number};
    handleRemoveFriend: (id: string) => void;
}

const DisplaySplitter: React.FC<DisplaySplitterProps> = ({ friend, handleRemoveFriend }) => {
    return (<>
        <div className="flex flex-row w-full justify-start items-center space-x-4 p-1"> {/* Added space-x-4 for spacing */}
        <Image
            src={friend.image}
            alt={friend.name}
            className="w-8 h-8 rounded-full object-cover" // Circle styling
            unoptimized
            width={100}
            height={100}
        />
        <div className="flex flex-row w-full justify-between">
            <p className="my-auto">{friend.name}</p>
            <p className="my-auto">RM {friend.amount.toFixed(2)}</p>
        </div>
    </div>
    <button
        className="w-8 border-l py-2 m-0 text-center hover:bg-gray-100"
        onClick={() => handleRemoveFriend(friend.id)} // Trigger the removal when clicked
    >
        x
    </button>
    </>
    );
};

export default DisplaySplitter;
