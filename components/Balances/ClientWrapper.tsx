"use client";

import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, getDoc, doc, getDocs, QuerySnapshot, DocumentData } from 'firebase/firestore';
import { db } from '@/firebase/config';
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/Topbar";
import { getGroups } from '@/lib/actions/user.action';
import { Friend } from '@/types/Friend';
import { Group } from '@/types/Group';
import { UserData } from '@/types/User';

interface ClientWrapperProps {
    children: React.ReactNode;
    userData: {
        uid: string;
        email: string | null;
        name: string | null;
        image: string | null;
    } | null;
    initialFriends: Friend[];
    initialGroups: Group[];
}

export default function ClientWrapper({ 
    children, 
    userData, 
    initialFriends, 
    initialGroups 
}: ClientWrapperProps) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [friends, setFriends] = useState<Friend[]>(initialFriends);
    const [groups, setGroups] = useState<Group[]>(initialGroups);

    useEffect(() => {
        if (!userData?.uid || !userData?.email) return;

        const relationshipsRef = collection(db, 'Friendships');

        // Function to update friends list
        const updateFriendsList = async () => {
            try {
                const requesterSnapshot = await getDocs(query(
                    relationshipsRef,
                    where('status', '==', 'ACCEPTED'),
                    where('requester_id', '==', userData.uid)
                ));

                const addresseeSnapshot = await getDocs(query(
                    relationshipsRef,
                    where('status', '==', 'ACCEPTED'),
                    where('addressee_id', '==', userData.uid)
                ));

                const newFriendsList: Friend[] = [];
                const processedIds = new Set<string>();

                const processSnapshot = async (snapshot: QuerySnapshot<DocumentData>) => {
                    for (const docSnapshot of snapshot.docs) {
                        const friendship = docSnapshot.data();
                        const friendId = friendship.requester_id === userData.uid
                            ? friendship.addressee_id
                            : friendship.requester_id;

                        if (processedIds.has(friendId)) continue;
                        processedIds.add(friendId);

                        const userDoc = await getDoc(doc(db, 'Users', friendId));
                        if (userDoc.exists()) {
                            const userData = userDoc.data() as UserData;
                            newFriendsList.push({
                                id: friendId,
                                name: userData.name || '',  // Provide default empty string
                                image: userData.image || '',
                                email: userData.email || ''
                            });
                        }
                    }
                };

                await Promise.all([
                    processSnapshot(requesterSnapshot),
                    processSnapshot(addresseeSnapshot)
                ]);

                setFriends(newFriendsList);
            } catch (error) {
                console.error('Error updating friends list:', error);
            }
        };

        // Set up real-time listeners
        const unsubscribeRequester = onSnapshot(
            query(relationshipsRef, where('requester_id', '==', userData.uid)),
            (snapshot: QuerySnapshot<DocumentData>) => updateFriendsList()
        );

        const unsubscribeAddressee = onSnapshot(
            query(relationshipsRef, where('addressee_id', '==', userData.uid)),
            (snapshot: QuerySnapshot<DocumentData>) => updateFriendsList()
        );

        // Groups listener
        const groupsRef = collection(db, 'Groups');
        const unsubscribeGroups = onSnapshot(
            groupsRef,
            async (snapshot: QuerySnapshot<DocumentData>) => {
                if(!userData.email){
                    return null;
                }
                try {
                    const fetchedGroups = await getGroups(userData.email);
                    setGroups(fetchedGroups);
                } catch (error) {
                    console.error('Error fetching groups:', error);
                }
            }
        );

        // Initial update
        updateFriendsList();

        // Cleanup
        return () => {
            unsubscribeRequester();
            unsubscribeAddressee();
            unsubscribeGroups();
        };
    }, [userData?.uid, userData?.email]);

    const handleToggleSidebar = () => {
        setIsSidebarOpen(prev => !prev);
    };

    const handleCloseSidebar = () => {
        setIsSidebarOpen(false);
    };

    return (
        <main className="flex h-screen w-full font-inter overflow-hidden">
            <Sidebar
                currentUser={{
                    uid: userData?.uid || '',
                    email: userData?.email || null,
                    name: userData?.name || null,
                    image: userData?.image || null,
                }}
                initialFriends={friends}
                initialGroups={groups}
                className="w-56"
                isOpen={isSidebarOpen}
                onClose={handleCloseSidebar}
            />
            <div className="flex flex-col flex-1 md:ml-56">
                <TopBar 
                    name={userData?.name || null} 
                    image={userData?.image || null}
                    onMenuClick={handleToggleSidebar}
                    friends={friends}  
                    groups={groups}   
                />
                <div className="p-3 flex-1 sm:p-4 overflow-y-auto">
                    {children}
                </div>
            </div>
        </main>
    );
}