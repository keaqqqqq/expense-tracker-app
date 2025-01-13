'use client';
import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext'; 
import Toast from '../Toast';
import Button from '../UserProfile/Button';
import { saveFriendship } from '@/lib/actions/friend.action';
interface AddFriendModalProps {
    isOpen: boolean;
    closeModal: () => void;
    onFriendAdded: () => void;
}

interface EmailError {
    hasError: boolean;
    message: string;
}

const AddFriend: React.FC<AddFriendModalProps> = ({ isOpen, closeModal, onFriendAdded }) => {
    const { currentUser } = useAuth(); 
    const [friendEmails, setFriendEmails] = useState<string[]>(['']);
    const [emailErrors, setEmailErrors] = useState<EmailError[]>([{ hasError: false, message: '' }]);
    const [showToast, setShowToast] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [toastType, setToastType] = useState<'success' | 'error'>('success'); 

    const validateEmail = (email: string): EmailError => {
        if (!email) return { hasError: false, message: '' };
        
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return { hasError: true, message: 'Please enter a valid email address' };
        }

        return { hasError: false, message: '' };
    };

    const handleEmailChange = (index: number, value: string) => {
        const newEmails = [...friendEmails];
        newEmails[index] = value;
        setFriendEmails(newEmails);

        const newErrors = [...emailErrors];
        newErrors[index] = validateEmail(value);
        setEmailErrors(newErrors);
    };

    const handleAddFriend = () => {
        setFriendEmails([...friendEmails, '']); 
        setEmailErrors([...emailErrors, { hasError: false, message: '' }]);
    };

    const handleInviteFriends = async () => {
        const nonEmptyEmails = friendEmails.filter(email => email.trim());
        const emailValidations = nonEmptyEmails.map(email => validateEmail(email));

        // Check if there are any format errors
        if (emailValidations.some(error => error.hasError)) {
            setToastType('error');
            setToastMessage('Please fix the invalid email addresses');
            setShowToast(true);
            return;
        }

        setIsLoading(true);
    
        if (!currentUser) {
          console.error("User not authenticated");
          return;
        }
    
        try {
          let hasError = false;
          
          for (const email of nonEmptyEmails) {
            const result = await saveFriendship(
              currentUser.uid, 
              email,
            );
            
            if (!result.success) {
              setToastType('error');
              setToastMessage(result.error || 'Error processing friend request');
              setShowToast(true);
              hasError = true;
              break;
            }
          }
          
          if (!hasError) {
            setToastType('success');
            setToastMessage(
              nonEmptyEmails.length === 1 
                ? 'Friend request sent successfully!' 
                : `Successfully sent ${nonEmptyEmails.length} friend requests!`
            );
            setShowToast(true);
    
            await onFriendAdded();
            
            setTimeout(() => {
              closeModal();
              setFriendEmails(['']);
              setEmailErrors([{ hasError: false, message: '' }]);
            }, 2000);
          }
        } catch (error) {
          console.error('Error in handleInviteFriends:', error); 
          setToastType('error');
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
                        Cancel
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
                        type={toastType}  // Pass the toast type here
                        />
                )}
            </div>
        </div>
    );
};

export default AddFriend;