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
import { Users, UserPlus2, LogIn } from 'lucide-react';


interface InvitationData {
    token: string;
    email?: string;
    requesterId?: string;
    type?: 'GROUP_INVITE' | 'FRIEND_INVITE';
    groupId?: string;
}

interface InvitationDetails {
    requesterName: string;
    groupName?: string;
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
    const [invitationDetails, setInvitationDetails] = useState<InvitationDetails | null>(null);
    const [loading, setLoading] = useState(true);
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
            if (!invitationData?.groupId || !invitationData?.requesterId) {
                throw new Error('Missing group ID or requester ID');
            }
    
            const friendshipsRef = collection(db, 'Friendships');
            const existingFriendshipQuery1 = query(
                friendshipsRef,
                where('requester_id', '==', invitationData.requesterId),
                where('addressee_id', '==', currentUserUid),
                where('status', '==', 'ACCEPTED')
            );
            const existingFriendshipQuery2 = query(
                friendshipsRef,
                where('requester_id', '==', currentUserUid),
                where('addressee_id', '==', invitationData.requesterId),
                where('status', '==', 'ACCEPTED')
            );
    
            const [friendship1Snap, friendship2Snap] = await Promise.all([
                getDocs(existingFriendshipQuery1),
                getDocs(existingFriendshipQuery2)
            ]);
    
            if (friendship1Snap.empty && friendship2Snap.empty) {
                const friendshipData = {
                    addressee_id: currentUserUid,
                    requester_id: invitationData.requesterId,
                    created_at: Timestamp.now(),
                    status: 'ACCEPTED'
                };
                await addDoc(collection(db, 'Friendships'), friendshipData);
            }
    
            const groupDoc = await getDoc(doc(db, 'Groups', invitationData.groupId));
            if (!groupDoc.exists()) {
                throw new Error('Group not found');
            }
    
            const groupData = groupDoc.data();
            const isAlreadyMember = groupData.members.some(
                (member: any) => member.id === currentUserUid
            );
    
            if (isAlreadyMember) {
                throw new Error('Already a member of this group');
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
    
            await updateDoc(doc(db, 'Groups', invitationData.groupId), {
                members: arrayUnion(newMember)
            });
    
            return { success: true };
        } catch (error) {
            console.error('Error handling group invite acceptance:', error);
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
        if (!invitationData || !invitationDetails) return null;
        
        if (invitationData.type === 'GROUP_INVITE') {
            return `${invitationDetails.requesterName} has invited you to join "${invitationDetails.groupName}"! 🎉`;
        }
        return `${invitationDetails.requesterName} wants to connect with you on our platform!`;
    };

    useEffect(() => {
        async function fetchInvitationDetails() {
            const storedInvitation = localStorage.getItem('invitationData');
            if (!storedInvitation) {
                setLoading(false);
                return;
            }

            const parsedData = JSON.parse(storedInvitation);
            setInvitationData(parsedData);

            try {
                // Fetch requester details
                const requesterDoc = await getDoc(doc(db, 'Users', parsedData.requesterId));
                const requesterData = requesterDoc.data();
                
                let details: InvitationDetails = {
                    requesterName: requesterData?.name || 'Someone'
                };

                // If it's a group invite, fetch group details
                if (parsedData.type === 'GROUP_INVITE' && parsedData.groupId) {
                    const groupDoc = await getDoc(doc(db, 'Groups', parsedData.groupId));
                    const groupData = groupDoc.data();
                    details.groupName = groupData?.name;
                }

                setInvitationDetails(details);

                if (parsedData.type === 'FRIEND_INVITE') {
                    setEmail(parsedData.email || '');
                    setRequesterId(parsedData.requesterId || '');
                }
                if (parsedData.type === 'GROUP_INVITE') {
                    setRequesterId(parsedData.requesterId || '');
                }
            } catch (error) {
                console.error('Error fetching invitation details:', error);
            }
            setLoading(false);
        }

        fetchInvitationDetails();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin h-8 w-8 border-4 border-indigo-500 rounded-full border-t-transparent mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className='min-h-screen flex flex-col justify-center items-center p-4 bg-gradient-to-b from-white to-indigo-50'>
            <div className='w-full max-w-md bg-white rounded-2xl shadow-xl p-8'>
                {invitationData && invitationDetails && (
                    <div className="mb-8">
                        <div className="bg-indigo-50 rounded-xl p-6 text-center relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 transform translate-x-16 -translate-y-16">
                                <div className="absolute inset-0 bg-indigo-100 rounded-full opacity-50"></div>
                            </div>
                            <div className="relative">
                                {invitationData.type === 'GROUP_INVITE' ? (
                                    <Users className="h-12 w-12 text-indigo-500 mx-auto mb-4" />
                                ) : (
                                    <UserPlus2 className="h-12 w-12 text-indigo-500 mx-auto mb-4" />
                                )}
                                <h4 className="text-xl font-bold text-gray-900 mb-2">
                                    Welcome! 👋
                                </h4>
                                <p className="text-indigo-700 text-lg">
                                    {getInvitationMessage()}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                <div className="text-center mb-8">
                    <h3 className={'text-3xl sm:text-4xl '}>
                        {isRegister ? 'Create Account' : 'Welcome Back'}
                    </h3>
                    <p className="text-gray-600 mt-2">
                        {isRegister ? 'Join our community today' : 'Sign in to continue'}
                    </p>
                </div>

                <div className="space-y-4">
                    <div>
                        <input
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className='w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-colors duration-200 outline-none'
                            placeholder='Email'
                            disabled={invitationData?.type === 'FRIEND_INVITE'}
                        />
                    </div>
                    <div>
                        <input
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className='w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-colors duration-200 outline-none'
                            placeholder='Password'
                            type='password'
                        />
                    </div>
                    <Button 
                        clickHandler={handleSubmit} 
                        text={
                            authenticating ? (
                                <span className="flex justify-center items-center">
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Processing...
                                </span>
                            ) : (
                                <span className="flex justify-center items-center">
                                    <LogIn className="w-5 h-5 mr-2" />
                                    {isRegister ? 'Create Account' : 'Sign In'}
                                </span>
                            )
                        }
                    />
                </div>

                <div className="mt-6 text-center">
                    <p className='text-gray-600'>
                        {isRegister ? 'Already have an account? ' : 'New to our platform? '}
                        <button 
                            onClick={() => setIsRegister(!isRegister)} 
                            className='text-indigo-600 hover:text-indigo-800 font-medium transition-colors'
                        >
                            {isRegister ? 'Sign in' : 'Create account'}
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
}