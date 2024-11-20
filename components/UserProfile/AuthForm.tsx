'use client';
import { Fugaz_One } from 'next/font/google';
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation'; 
import Button from './Button';
import Cookies from 'js-cookie'; 
import { addDoc, collection, query, where, getDocs, getDoc, doc, updateDoc, arrayUnion, setDoc } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { Timestamp } from 'firebase/firestore';
const fugaz = Fugaz_One({ subsets: ['latin'], weight: ['400'] });

interface InvitationData {
    token: string;
    email?: string;
    requesterId?: string;
    type?: 'GROUP_INVITE' | 'FRIEND_INVITE';
    groupId?: string;
}

export default function AuthForm() {
    const [email, setEmail] = useState('');
    const [requesterId, setRequesterId] = useState('');
    const [password, setPassword] = useState('');
    const [isRegister, setIsRegister] = useState(false);
    const [authenticating, setAuthenticating] = useState(false);
    const [invitationData, setInvitationData] = useState<InvitationData | null>(null);
    const { signup, login, currentUser} = useAuth();
    const router = useRouter(); 
    
    useEffect(() => {
        const storedInvitation = localStorage.getItem('invitationData');
        if (storedInvitation) {
            const parsedData = JSON.parse(storedInvitation);
            setInvitationData(parsedData);
            if (parsedData.type === 'FRIEND_INVITE') {
                setEmail(parsedData.email || '');
                setRequesterId(parsedData.requesterId || '');
            }
            if (parsedData.type === 'GROUP_INVITE') {
                setRequesterId(parsedData.requesterId || '');
            }
        }
    }, []);
    
    async function acceptInvitationAndFriendship(currentUserUid: string) {
        try {
            console.log('Starting acceptInvitationAndFriendship for:', { email, currentUserUid });
            
            const invitationsRef = collection(db, 'Invitations');
            const invitationQuery = query(
                invitationsRef,
                where('addressee_email', '==', email),
                where('status', '==', 'PENDING')
            );
            
            const invitationSnapshot = await getDocs(invitationQuery);
            const invitationDoc = invitationSnapshot.docs[0];
            const invitationData = invitationDoc?.data();
            
            const friendshipData = {
                addressee_id: currentUserUid, 
                requester_id: requesterId,
                created_at: Timestamp.now(),
                status: 'ACCEPTED'
            };
    
            const newFriendshipRef = await addDoc(collection(db, 'Friendships'), friendshipData);

            await updateDoc(invitationDoc.ref, {
                status: 'ACCEPTED',
                accepted_at: Timestamp.now()
            });

            return {
                success: true,
                friendshipId: newFriendshipRef.id
            };
        } catch (error) {
            console.error('Error in acceptInvitationAndFriendship:', error);
            throw error;
        }
    }

    async function handleGroupInviteAcceptance(currentUserUid: string) {
        try {
            if (!invitationData?.groupId) {
                throw new Error('No group ID found');
            }

            const userDoc = await getDoc(doc(db, 'Users', currentUserUid));
            if (!userDoc.exists()) {
                throw new Error('User not found');
            }
            
            const userData = userDoc.data();
            const newMember = {
                id: currentUserUid,
                name: userData.name,
                email: userData.email,
                image: userData.image || ''
            };

            const groupRef = doc(db, 'Groups', invitationData.groupId);
            await updateDoc(groupRef, {
                members: arrayUnion(newMember)
            });

            const groupInviteQuery = query(
                collection(db, 'GroupInvites'),
                where('invitation_token', '==', invitationData.token),
                where('status', '==', 'PENDING')
            );

            const snapshot = await getDocs(groupInviteQuery);
            if (!snapshot.empty) {
                await updateDoc(snapshot.docs[0].ref, {
                    status: 'ACCEPTED',
                    accepted_at: Timestamp.now()
                });
            }

            return { success: true };
        } catch (error) {
            console.error('Error accepting group invite:', error);
            throw error;
        }
    }

    async function handleSubmit() {
        if (!email || !password || password.length < 6) {
            return;
        }
        setAuthenticating(true);
        try {
            if (isRegister) {
                const userCredential = await signup(email, password);
                await setDoc(doc(db, 'Users', userCredential.user.uid), {
                    name: email.split('@')[0], 
                    email: email,
                    image: null
                });
                Cookies.set("loggedin", String(true));
                Cookies.set("currentUserUid", userCredential.user.uid, { path: '/' });
                
                if (invitationData) {
                    try {
                        if (invitationData.type === 'FRIEND_INVITE') {
                            await acceptInvitationAndFriendship(userCredential.user.uid);
                        } else if (invitationData.type === 'GROUP_INVITE') {
                            await handleGroupInviteAcceptance(userCredential.user.uid);
                        }
                        localStorage.removeItem('invitationData');
                    } catch (error) {
                        console.error('Error processing invitation:', error);
                    }
                }
                
                router.push('/profile'); 
            } else {
                const userCredential = await login(email, password);
                if (userCredential.user) { 
                    Cookies.set("loggedin", String(true));
                    Cookies.set("currentUserUid", userCredential.user.uid, { path: '/' }); 
                    
                    if (invitationData?.type === 'GROUP_INVITE') {
                        await handleGroupInviteAcceptance(userCredential.user.uid);
                        localStorage.removeItem('invitationData');
                        router.push(`/groups/${invitationData.groupId}`);
                    } else {
                        router.push('/');
                    }
                }
            }
        } catch (err) {
            console.error('Auth error:', err);
        }
        setAuthenticating(false);
    }

    const getInvitationMessage = () => {
        if (!invitationData) return null;
        return invitationData.type === 'GROUP_INVITE' 
            ? "You've been invited to join a group! 🎉"
            : "Complete your registration to connect with your friend on our platform.";
    };

    return (
        <div className='flex flex-col flex-1 justify-center items-center gap-4'>
            {invitationData && (
                <div className="text-center mb-6 max-w-[400px]">
                    <div className="bg-blue-50 p-4 rounded-lg mb-4">
                        <h4 className="text-blue-800 font-semibold mb-2">
                            You've Been Invited! 🎉
                        </h4>
                        <p className="text-blue-600">
                            {getInvitationMessage()}
                        </p>
                    </div>
                </div>
            )}
            
            <h3 className={'text-4xl sm:text-5xl md:text-6xl ' + fugaz.className}>
                {isRegister ? 'Register' : 'Log In'}
            </h3>
            <p>You&#39;re one step away!</p>
            <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className='w-full max-w-[400px] mx-auto px-3 duration-200 hover:border-indigo-600 focus:border-indigo-600 py-2 sm:py-3 border border-solid border-indigo-400 rounded-full outline-none'
                placeholder='Email'
                disabled={invitationData?.type === 'FRIEND_INVITE'}
            />
            <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className='w-full max-w-[400px] mx-auto px-3 duration-200 hover:border-indigo-600 focus:border-indigo-600 py-2 sm:py-3 border border-solid border-indigo-400 rounded-full outline-none'
                placeholder='Password'
                type='password'
            />
            <div className='max-w-[400px] w-full mx-auto'>
                <Button 
                    clickHandler={handleSubmit} 
                    text={
                        authenticating ? (
                            <span className="flex justify-center">
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Loading
                            </span>
                        ) : (
                            invitationData ? 'Complete Registration' : 'Submit'
                        )
                    }
                />
            </div>
            <p className='text-center'>
                {isRegister ? 'Already have an account? ' : 'Don\'t have an account? '}
                <button onClick={() => setIsRegister(!isRegister)} className='text-indigo-600'>
                    {isRegister ? 'Sign in' : 'Sign up'}
                </button>
            </p>
        </div>
    );
}