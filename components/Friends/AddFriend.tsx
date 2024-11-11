'use client';
import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext'; 
import { saveFriendship } from '@/lib/actions/user.action';
import { useRouter } from 'next/navigation';
import Toast from '../Toast';
import Button from '../UserProfile/Button';

interface AddFriendModalProps {
    isOpen: boolean;
    closeModal: () => void;
}

const AddFriend: React.FC<AddFriendModalProps> = ({ isOpen, closeModal }) => {
    const router = useRouter();
    const { currentUser } = useAuth(); 
    const [friendEmails, setFriendEmails] = useState<string[]>(['']);
    const [showToast, setShowToast] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [toastMessage, setToastMessage] = useState('');

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
                const result = await saveFriendship(
                    currentUser.uid, 
                    email,
                );
                
                if (result.type === 'invitation_sent') {
                    setToastMessage('Invitation sent successfully!');
                } else {
                    setToastMessage('Friend request sent successfully!');
                }
            }
            
            setShowToast(true);
            setTimeout(() => {
                closeModal();
                router.push('/');
            }, 2000);
        } catch (error) {
            console.error("Error processing friend invitations:", error);
            setToastMessage('Error sending invitations. Please try again.');
            setShowToast(true);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null; 

    return (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50 overflow-auto p-4">
            <div className="relative bg-white p-6 shadow-lg sm:rounded-lg w-full max-w-[95%] 
                sm:max-w-[85%] md:max-w-[75%] lg:w-6/12 grid grid-rows-[auto_1fr_auto]">
                <div className="pb-4 w-full">
                <h3 className="text-lg font-medium text-gray-900">Add friends</h3>
                <button onClick={closeModal} className="absolute top-2 right-2 text-gray-600 hover:text-gray-800 font-lg">
                    &times; 
                </button>
                <p className='text-sm py-2'>Add your friends to manage expenses together! Collaborating on 
                    shared costs makes tracking easier and keeps everyone accountable.</p>
                <div className="absolute left-0 right-0 border-b border-black-500 mt-4" />
                </div>

                <div className="overflow-y-auto max-h-[45vh] mt-4 px-1">
                    <form className="mt-4 space-y-4">
                        {friendEmails.map((email, index) => (
                            <div key={index} className="w-full">  
                                <input
                                    type="email"
                                    placeholder="Friend's email"
                                    value={email}
                                    onChange={(e) => handleEmailChange(index, e.target.value)}
                                    className="border border-gray-300 rounded-md p-2 w-full 
                                             focus:outline-none focus:ring-2 focus:ring-blue-500 
                                             transition duration-150 ease-in-out
                                             hover:border-gray-400"
                                    required
                                />
                            </div>
                        ))}
                        <Button 
                            clickHandler={handleAddFriend}
                            className="w-full py-2 px-4 bg-blue-600 text-white rounded-md 
                                     transition duration-150 ease-in-out hover:bg-blue-700 
                                     focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            Add another friend                
                        </Button>   
                    </form>
                </div>
    
                <div className="mt-4 pt-4 flex flex-col sm:flex-row gap-3 bg-gray-200 -mx-6 -mb-6 p-6 border-t border-gray-200 rounded-b-lg">                    <Button 
                        clickHandler={() => setFriendEmails([''])} 
                        variant='cancel'
                        redirectPath='/'
                    >
                        Skip           
                    </Button>
                    <Button 
                        clickHandler={handleInviteFriends}
                        className="py-2 px-4 bg-green-600 text-white rounded-md 
                                 transition duration-150 ease-in-out hover:bg-green-700 
                                 focus:outline-none focus:ring-2 focus:ring-green-500"
                        text={
                            isLoading ? (
                                <span className="flex justify-center items-center">
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" 
                                         xmlns="http://www.w3.org/2000/svg" 
                                         fill="none" 
                                         viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" 
                                                stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" 
                                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
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
                    message={toastMessage}
                    onClose={() => setShowToast(false)} 
                    />
                )}
            </div>
        </div>
    );
};

export default AddFriend;
