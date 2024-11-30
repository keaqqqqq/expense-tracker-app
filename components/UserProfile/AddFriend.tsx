'use client';
import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext'; 
import { saveFriendship } from '@/lib/actions/user.action';
import { useRouter } from 'next/navigation';
import Toast from '../Toast';
import Button from './Button';
const AddFriend: React.FC = () => {
    const router = useRouter();
    const { currentUser } = useAuth(); 
    const [friendEmails, setFriendEmails] = useState<string[]>(['']);
    const [showToast, setShowToast] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleEmailChange = (index: number, value: string) => {
        const newEmails = [...friendEmails];
        newEmails[index] = value;
        setFriendEmails(newEmails);
    };

    const handleAddFriend = () => {
        setFriendEmails([...friendEmails, '']); 
    };

    const handleInviteFriends = async () => {
        const validEmails = friendEmails.filter(email => email);
        setIsLoading(true);

        if (!currentUser) {
            console.error("User not authenticated");
            return; 
        }

        try {
        
            for (const email of validEmails) {
                await saveFriendship(currentUser.uid, email); 
            }
            
            setShowToast(true); 
            setTimeout(() => {
                router.push('/');
            }, 2000); 
        } catch (error) {
            console.error("Error saving member list:", error);
        } finally {
            setIsLoading(false); 
        }
    };

    return (
        <div className="bg-white p-6 shadow-lg sm:rounded-lg mt-6">
            <h3 className="text-lg font-medium text-gray-900">Add friends</h3>
            <p className='text-sm py-2'>Add your friends to manage expenses together! Collaborating on 
                shared costs makes tracking easier and keeps everyone accountable.</p>
            <form className="mt-4 space-y-4">
                {friendEmails.map((email, index) => (
                    <input
                        key={index}
                        type="email"
                        placeholder="Friend's email"
                        value={email}
                        onChange={(e) => handleEmailChange(index, e.target.value)}
                        className="border border-gray-300 rounded-md p-3 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-150 ease-in-out"
                        required
                    />
                ))}
                <Button 
                    clickHandler={handleAddFriend}
                    className="w-full py-2 px-4 bg-blue-600 text-white rounded-md transition duration-150 ease-in-out hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    Add another friend                
                </Button>
            </form>
            <div className="mt-4 flex flex-row gap-5">
                <Button 
                    clickHandler={() => setFriendEmails([''])} 
                    variant='cancel'
                    redirectPath='/'
                >
                    Skip           
                </Button>
                <Button 
                    clickHandler={handleInviteFriends}
                    className="py-2 px-1 bg-green-600 text-white rounded-md transition duration-150 ease-in-out hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                    text={
                        isLoading ? (
                            <span className="flex justify-center">
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Loading
                            </span>
                        ) : (
                            'Invite & add friends'
                        )
                    }
                >
                    Invite & add friends            
                </Button>
            </div>
            {showToast && (
                <Toast
                message="Friends invited successfully!" 
                onClose={() => setShowToast(false)} 
                />
            )}
        </div>
    );
};

export default AddFriend;