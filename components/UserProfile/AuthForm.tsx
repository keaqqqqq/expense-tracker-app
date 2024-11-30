'use client';
import { Fugaz_One } from 'next/font/google';
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation'; 
import Cookies from 'js-cookie'; 
import { addDoc, collection, query, where, getDocs, getDoc, doc, updateDoc, arrayUnion, setDoc } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { Timestamp } from 'firebase/firestore';
import { Users, UserPlus2, LogIn } from 'lucide-react';
import { fetchUserData } from '@/lib/actions/user.action';
import Button from '../ButtonProps';
const fugaz = Fugaz_One({ subsets: ['latin'], weight: ['400'] });

interface InvitationData {
    token: string;
    email?: string;
    requesterId?: string;
    type?: 'GROUP_INVITE' | 'FRIEND_INVITE';
    groupId?: string;
}

interface InvitationDetails {
    requesterName: string;
    requesterImage: string | null;
    groupName?: string;
}

const InvitationHeader: React.FC<{
    type: 'GROUP_INVITE' | 'FRIEND_INVITE',
    details: InvitationDetails
}> = ({ type, details }) => (
    <div className="bg-indigo-50 rounded-xl p-6 text-center relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 transform translate-x-16 -translate-y-16">
            <div className="absolute inset-0 bg-indigo-100 rounded-full opacity-50"></div>
        </div>
        <div className="relative">
            <div className="flex flex-col items-center space-y-3">
                <div className="relative">
                    {details.requesterImage ? (
                        <img 
                            src={details.requesterImage} 
                            alt={details.requesterName}
                            className="w-20 h-20 rounded-full border-4 border-white shadow-lg object-cover"
                            onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = '/default-avatar.jpg'; 
                            }}
                        />
                    ) : (
                        <div className="w-20 h-20 rounded-full bg-indigo-100 flex items-center justify-center">
                            <Users className="h-10 w-10 text-indigo-500" />
                        </div>
                    )}
                    <div className="absolute -bottom-2 -right-2 bg-white rounded-full p-2 shadow-lg">
                        {type === 'GROUP_INVITE' ? (
                            <Users className="h-5 w-5 text-indigo-500" />
                        ) : (
                            <UserPlus2 className="h-5 w-5 text-indigo-500" />
                        )}
                    </div>
                </div>
                
                <div>
                    <h4 className="text-xl font-bold text-gray-900">
                        Welcome! 👋
                    </h4>
                    {type === 'GROUP_INVITE' ? (
                        <div className="mt-2 space-y-1">
                            <div className="flex items-center justify-center space-x-2">
                                <span className="text-indigo-700 text-lg font-medium">
                                    {details.requesterName}
                                </span>
                                <span className="text-gray-600">invited you to join</span>
                            </div>
                            <p className="text-xl font-semibold text-indigo-900">
                                {details.groupName}
                            </p>
                        </div>
                    ) : (
                        <p className="text-indigo-700 text-lg mt-2">
                            {details.requesterName} wants to connect with you!
                        </p>
                    )}
                </div>
            </div>
        </div>
    </div>
);

export default function AuthForm() {
    const [email, setEmail] = useState('');
    const [requesterId, setRequesterId] = useState('');
    const [password, setPassword] = useState('');
    const [isRegister, setIsRegister] = useState(false);
    const [authenticating, setAuthenticating] = useState(false);
    const [invitationData, setInvitationData] = useState<InvitationData | null>(null);
    const [invitationDetails, setInvitationDetails] = useState<InvitationDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const { signup, login, currentUser, signInWithGoogle} = useAuth();
    const [googleLoading, setGoogleLoading] = useState(false);
    const router = useRouter();

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
                const requesterData = await fetchUserData(parsedData.requesterId);
                
                let details: InvitationDetails = {
                    requesterName: requesterData?.name || 'Someone',
                    requesterImage: requesterData?.image || null
                };

                // Check if it's a group invite (either from Invitations or GroupInvites)
                if (parsedData.type === 'GROUP_INVITE' && parsedData.groupId) {
                    const groupDoc = await getDoc(doc(db, 'Groups', parsedData.groupId));
                    const groupData = groupDoc.data();
                    details.groupName = groupData?.name;
                }

                setInvitationDetails(details);

                if (parsedData.type === 'FRIEND_INVITE') {
                    setEmail(parsedData.email || '');
                }
                setRequesterId(parsedData.requesterId || '');
            } catch (error) {
                console.error('Error fetching invitation details:', error);
            }
            setLoading(false);
        }

        fetchInvitationDetails();
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

            if (invitationData?.group_name) {
                const groupsRef = collection(db, 'Groups');
                const groupsSnapshot = await getDocs(groupsRef);

                for (const groupDoc of groupsSnapshot.docs) {
                    const groupData = groupDoc.data();
                    const pendingMember = groupData.pending_members?.find(
                        (member: any) => member.email === email
                    );

                    if (pendingMember) {
                        const userDoc = await getDoc(doc(db, 'Users', currentUserUid));
                        if (!userDoc.exists()) throw new Error('User not found');
                        const userData = userDoc.data();

                        const newMember = {
                            id: currentUserUid,
                            name: userData.name,
                            email: userData.email,
                            image: userData.image || ''
                        };

                        const updatedPendingMembers = (groupData.pending_members || [])
                            .filter((member: any) => member.email !== email);

                        await updateDoc(groupDoc.ref, {
                            members: arrayUnion(newMember),
                            pending_members: updatedPendingMembers
                        });
                        break;
                    }
                }
            }

            await updateDoc(invitationDoc.ref, {
                status: 'ACCEPTED',
                accepted_at: Timestamp.now()
            });

            return { success: true, friendshipId: newFriendshipRef.id };
        } catch (error) {
            console.error('Error in acceptInvitationAndFriendship:', error);
            throw error;
        }
    }

    async function handleGroupInviteAcceptance(currentUserUid: string) {
        try {
            if (!invitationData?.groupId) return;

            const userDoc = await getDoc(doc(db, 'Users', currentUserUid));
            if (!userDoc.exists()) throw new Error('User not found');
            
            const userData = userDoc.data();

            const friendshipData = {
                addressee_id: currentUserUid,
                requester_id: invitationData.requesterId,
                created_at: Timestamp.now(),
                status: 'ACCEPTED'
            };

            await addDoc(collection(db, 'Friendships'), friendshipData);

            const groupRef = doc(db, 'Groups', invitationData.groupId);
            const groupDoc = await getDoc(groupRef);

            if (!groupDoc.exists()) throw new Error('Group not found');

            const newMember = {
                id: currentUserUid,
                name: userData.name,
                email: userData.email,
                image: userData.image || ''
            };

            await updateDoc(groupRef, {
                members: arrayUnion(newMember)
            });

            return { success: true };
        } catch (error) {
            console.error('Error in handleGroupInviteAcceptance:', error);
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

    async function handleGoogleSignIn() {
        setGoogleLoading(true); 
        try {
            const result = await signInWithGoogle();
            if (result.user) {
                Cookies.set("loggedin", String(true));
                Cookies.set("currentUserUid", result.user.uid, { path: '/' });

                if (invitationData) {
                    try {
                        if (invitationData.type === 'FRIEND_INVITE') {
                            await acceptInvitationAndFriendship(result.user.uid);
                        } else if (invitationData.type === 'GROUP_INVITE') {
                            await handleGroupInviteAcceptance(result.user.uid);
                        }
                        localStorage.removeItem('invitationData');
                    } catch (error) {
                        console.error('Error processing invitation:', error);
                    }
                }

                if (invitationData?.type === 'GROUP_INVITE') {
                    router.push(`/groups/${invitationData.groupId}`);
                } else {
                    router.push('/');
                }
            }
        } catch (error) {
            console.error('Google sign-in error:', error);
        }
        setGoogleLoading(false);
    }

    return (
        <div className='min-h-screen flex flex-col justify-center items-center p-4 w-full'>
            {/* Welcome text moved outside */}
            <div className="text-center mb-8">
                <h3 className={'text-3xl sm:text-4xl ' + fugaz.className}>
                    {isRegister ? 'Create Account' : 'Welcome Back'}
                </h3>
                <p className="text-gray-600 mt-2">
                    {isRegister ? 'Join our community today' : 'Sign in to continue'}
                </p>
            </div>
    
            <div className='w-full max-w-md bg-white rounded-2xl shadow-xl p-8'>
                {invitationData && invitationDetails && (
                    <div className="mb-8">
                        <InvitationHeader 
                            type={invitationData.type as 'GROUP_INVITE' | 'FRIEND_INVITE'} 
                            details={invitationDetails}
                        />
                    </div>
                )}
    
                <div className="space-y-4">
                    <div>
                        <input
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className='w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-colors duration-200 outline-none hover:border-indigo-400'
                            placeholder='Email'
                            disabled={invitationData?.type === 'FRIEND_INVITE'}
                        />
                    </div>
                    <div>
                        <input
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className='w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-colors duration-200 outline-none hover:border-indigo-400'
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
    
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-300"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-white text-gray-500">Or continue with</span>
                        </div>
                    </div>
    
                    <Button
                        clickHandler={handleGoogleSignIn}
                        text={
                            googleLoading ? (
                                <span className="flex justify-center items-center">
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Processing...
                                </span>
                            ) : (
                                <span className="flex justify-center items-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" width="18" height="18">
                                        <path
                                            fill="#4285F4"
                                            d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908C16.658 14.2 17.64 11.9 17.64 9.2z"
                                        />
                                        <path
                                            fill="#34A853"
                                            d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"
                                        />
                                        <path
                                            fill="#FBBC05"
                                            d="M3.964 10.71c-.18-.54-.282-1.117-.282-1.71s.102-1.17.282-1.71V4.958H.957C.347 6.173 0 7.548 0 9s.348 2.827.957 4.042l3.007-2.332z"
                                        />
                                        <path
                                            fill="#EA4335"
                                            d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
                                        />
                                    </svg>
                                    &nbsp;&nbsp;Continue with Google
                                </span>
                            )
                        }
                        additionalClasses="bg-slate-950 hover:bg-slate-800 transition-colors duration-200"
                    />
                </div>
            </div>
    
            {/* Account toggle text */}
            <div className="mt-6 text-center">
                <p className='text-gray-600'>
                    {isRegister ? "Already have an account? " : "Don't have an account? "}
                    <button 
                        onClick={() => setIsRegister(!isRegister)} 
                        className='text-indigo-600 hover:text-indigo-800 font-medium transition-colors underline underline-offset-2'
                    >
                        {isRegister ? 'Sign in' : 'Create account'}
                    </button>
                </p>
            </div>
        </div>
    );
}