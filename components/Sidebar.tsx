"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { X, Users, Settings, CircleUserRound } from 'lucide-react';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Group } from '@/types/Group';

interface Friend {
    id: string;
    name?: string;
    image?: string;
    email: string;
}

interface SideBarProps {
    currentUser: {
        uid: string;
        email: string | null;
        name: string | null;
        image: string | null;
    };
    initialFriends: Friend[]; 
    initialGroups: Group[];
    className?: string;
    isOpen: boolean;
    onClose: () => void;
}   

const Sidebar: React.FC<SideBarProps> = ({ 
    currentUser, 
    initialFriends, 
    initialGroups, 
    className,
    isOpen,
    onClose 
}) => {
    const pathname = usePathname();
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768);
            if (window.innerWidth >= 768) {
                onClose();
            }
        };

        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [onClose]);

    const renderFriendsList = () => (
        <div className="mt-6">
            <div className="flex items-center justify-between px-4 mb-2">
                <h3 className="text-sm font-semibold text-gray-500">Your Friends</h3>
            </div>
            <ul className="space-y-1">
                {initialFriends.slice(0, 5).map((friend) => (
                    <li key={friend.id}>
                        <Link
                            href={`/friends/${friend.id}`}
                            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            onClick={() => isMobile && onClose()}
                        >
                            {friend.image ? (
                                <div className="relative w-6 h-6 rounded-full overflow-hidden mr-2">
                                    <Image
                                        src={friend.image}
                                        alt={friend.name || 'Friend'}
                                        fill
                                        className="object-cover"
                                    />
                                </div>
                            ) : (
                                <CircleUserRound className="w-6 h-6 mr-2 text-gray-400" />
                            )}
                            <span>{friend.name || friend.email}</span>
                        </Link>
                    </li>
                ))}
            </ul>
        </div>
    );

    const renderGroupsList = () => (
        <div className="mt-6">
            <div className="flex items-center justify-between px-4 mb-2">
                <h3 className="text-sm font-semibold text-gray-500">Your Groups</h3>
            </div>
            <ul className="space-y-1">
                {initialGroups.slice(0, 5).map((group) => (
                    <li key={group.id}>
                        <Link
                            href={`/groups/${group.id}`}
                            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            onClick={() => isMobile && onClose()}
                        >
                            {group.image ? (
                                <div className="relative w-6 h-6 rounded-full overflow-hidden mr-2">
                                    <Image
                                        src={group.image}
                                        alt={group.name}
                                        fill
                                        className="object-cover"
                                    />
                                </div>
                            ) : (
                                <Users className="w-6 h-6 mr-2 text-gray-400" />
                            )}
                            <span>{group.name}</span>
                            {group.pending_members && group.pending_members.length > 0 && (
                                <span className="ml-2 text-xs bg-gray-100 px-2 py-1 rounded-full">
                                    {group.pending_members.length} pending
                                </span>
                            )}
                        </Link>
                    </li>
                ))}
            </ul>
        </div>
    );

    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div 
                    className="fixed inset-0 bg-black bg-opacity-30 md:hidden z-30"
                    onClick={onClose}
                    aria-hidden="true"
                />
            )}

            {/* Sidebar */}
            <aside 
                className={`${className} fixed inset-y-0 left-0 z-40 transform transition-transform duration-300 ease-in-out
                    ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}
            >
                <nav className="h-full bg-white border-r">
                    {/* Close Button for Mobile */}
                    {isMobile && (
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-lg z-50"
                            aria-label="Close sidebar"
                        >
                            <X size={24} />
                        </button>
                    )}

                    <div className="h-full flex flex-col overflow-y-auto pt-16 md:pt-0">
                        <div className="flex-1">
                            <Link href="/" onClick={() => isMobile && onClose()}>
                                <h2 className="text-xl font-semibold text-black px-4 py-4 mb-5 cursor-pointer hover:text-indigo-600">
                                    ExpenseTracker
                                </h2>
                            </Link>

                            <nav>
                                <ul>
                                    <li>
                                        <Link
                                            href="/"
                                            className={`block py-2 px-4 font-semibold text-gray-800 text-md mb-2 ${pathname === '/' ? 'bg-gray-100 text-indigo-600' : ''}`}
                                            onClick={() => isMobile && onClose()}
                                        >
                                            🏠 Home
                                        </Link>
                                    </li>
                                    <li>
                                        <Link
                                            href="/expense"
                                            className={`block py-2 px-4 font-semibold text-gray-800 text-md mb-2 ${pathname === '/expense' ? 'bg-gray-100 text-indigo-600' : ''}`}
                                            onClick={() => isMobile && onClose()}
                                        >
                                            💰 Expense
                                        </Link>
                                    </li>
                                    <li>
                                        <Link
                                            href="/friends"
                                            className={`block py-2 px-4 font-semibold text-gray-800 text-md mb-2 ${pathname === '/friends' ? 'bg-gray-100 text-indigo-600' : ''}`}
                                            onClick={() => isMobile && onClose()}
                                        >
                                            👤 Friends
                                        </Link>
                                    </li>
                                    <li>
                                        <Link
                                            href="/groups"
                                            className={`block py-2 px-4 font-semibold text-gray-800 text-md mb-2 ${pathname === '/groups' ? 'bg-gray-100 text-indigo-600' : ''}`}
                                            onClick={() => isMobile && onClose()}
                                        >
                                            👥 Groups
                                        </Link>
                                    </li>
                                </ul>
                            </nav>

                            {renderFriendsList()}
                            {renderGroupsList()}
                        </div>

                        <div className="mt-auto">
                            <Link
                                href="/settings"
                                className={`flex items-center px-4 py-3 text-gray-800 hover:bg-gray-100 ${pathname === '/settings' ? 'bg-gray-100 text-indigo-600' : ''}`}
                                onClick={() => isMobile && onClose()}
                            >
                                <span className="font-semibold flex items-center">
                                    <Settings className="mr-2" /> Settings
                                </span>
                            </Link>
                        </div>
                    </div>
                </nav>
            </aside>
        </>
    );
};

export default Sidebar;