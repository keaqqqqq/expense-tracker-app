"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, UserPlus, Users, Plus, CircleUserRound } from 'lucide-react';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import Button from './UserProfile/Button';
import { useRouter } from 'next/navigation';

interface SideBarProps {
    name: string | null;
    image: string | null;
    friends?: Array<{
        id: string;
        name?: string;
        image?: string;
        email: string;
    }>;
    groups?: Array<{
        id: string;
        name: string;
        image?: string;
        type: string;
    }>;
}

const Sidebar: React.FC<SideBarProps> = ({ name, image, friends = [], groups = [] }) => {
    const pathname = usePathname();
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(event.target.value);
    };    

    const getCurrentPageTitle = () => {
        switch (pathname) {
            case '/expense':
                return 'Expense';
            case '/profile':
                return 'Profile';
            case '/friends':
                return 'Friends';
            case '/groups':
                return 'Groups';  
            default:
                return <div className="logo">ExpenseTracker</div>;
        }
    };

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768);
            if (window.innerWidth >= 768) {
                setIsOpen(false);
            }
        };

        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const renderFriendsList = () => (
        <div className="mt-6">
            <div className="flex items-center justify-between px-4 mb-2">
                <h3 className="text-sm font-semibold text-gray-500">Your Friends</h3>
                <button
                    onClick={() => router.push('/friends/add')}
                    className="p-1 hover:bg-gray-100 rounded-lg text-gray-600"
                    title="Add Friend"
                >
                    <UserPlus size={16} />
                </button>
            </div>
            <ul className="space-y-1">
                {friends.slice(0, 5).map((friend) => (
                    <li key={friend.id}>
                        <Link
                            href={`/friends/${friend.id}`}
                            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
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
                <button
                    onClick={() => router.push('/groups/new')}
                    className="p-1 hover:bg-gray-100 rounded-lg text-gray-600"
                    title="New Group"
                >
                    <Plus size={16} />
                </button>
            </div>
            <ul className="space-y-1">
                {groups.slice(0, 5).map((group) => (
                    <li key={group.id}>
                        <Link
                            href={`/groups/${group.id}`}
                            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                            {group.image ? (
                                <div className="relative w-6 h-6 rounded-lg overflow-hidden mr-2">
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
                        </Link>
                    </li>
                ))}
            </ul>
        </div>
    );

    return (
        <>
            <div className={`fixed top-0 left-0 w-full h-16 bg-white border-b md:hidden z-20 flex items-center px-4 transition-transform duration-300 ${isOpen ? '-translate-x-full' : 'translate-x-0'}`}>
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                >
                    <Menu size={24} />
                </button>
                <input
                    type="text"
                    value={searchQuery}
                    onChange={handleSearchChange}
                    placeholder="Search..."
                    className="bg-white text-black px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                />
                <div className="ml-4 flex items-center">
                    {image ? (
                        <div className="relative w-8 h-8 mr-2">
                            <Image
                                src={image}
                                alt="Profile"
                                fill
                                className="rounded-full object-cover"
                                sizes="32px"
                            />
                        </div>
                    ) : (
                        <div className="w-8 h-8 mr-2 rounded-full bg-gray-200 flex items-center justify-center">
                          <span className="text-gray-500 text-sm">
                            {name?.[0] || "?" }
                          </span>
                        </div>
                    )}
                    <span className="font-semibold">
                        {name}
                    </span>
                </div>
            </div>

            {/* Sidebar */}
            <div
                className={`fixed top-0 left-0 h-full bg-white w-64 border-r transform transition-transform duration-300 ease-in-out z-30
                    ${isMobile ? (isOpen ? 'translate-x-0' : '-translate-x-full') : 'translate-x-0'}`}
            >
                {isMobile && (
                    <div className="h-16 border-b flex items-center px-4 justify-between">
                        <h2 className="text-xl font-semibold text-black">
                            {getCurrentPageTitle()}
                        </h2>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="p-2 hover:bg-gray-100 rounded-lg"
                        >
                            <X size={24} />
                        </button>
                    </div>
                )}

                <div className="h-full overflow-y-auto pb-20">
                    <h2 className={`text-xl font-semibold text-black px-4 py-4 logo ${isMobile ? 'hidden' : 'block'}`}>
                        ExpenseTracker
                    </h2>
                    <ul>
                        <li>
                            <Link
                                href="/expense"
                                className={`block py-2 px-4 font-semibold text-gray-800 ${pathname === '/expense' ? 'bg-gray-100 text-indigo-600' : ''}`}
                                onClick={() => isMobile && setIsOpen(false)}
                            >
                                Expense
                            </Link>
                        </li>
                        <li>
                            <Link
                                href="/profile"
                                className={`block py-2 px-4 font-semibold text-gray-800 ${pathname === '/profile' ? 'bg-gray-100 text-indigo-600' : ''}`}
                                onClick={() => isMobile && setIsOpen(false)}
                            >
                                Profile
                            </Link>
                        </li>
                        <li>
                            <Link
                                href="/friends"
                                className={`block py-2 px-4 font-semibold text-gray-800 ${pathname === '/friends' ? 'bg-gray-100 text-indigo-600' : ''}`}
                                onClick={() => isMobile && setIsOpen(false)}
                            >
                                Friends
                            </Link>
                        </li>
                        <li>
                            <Link
                                href="/groups"
                                className={`block py-2 px-4 font-semibold text-gray-800 ${pathname === '/groups' ? 'bg-gray-100 text-indigo-600' : ''}`}
                                onClick={() => isMobile && setIsOpen(false)}
                            >
                                Groups
                            </Link>
                        </li>
                    </ul>

                    {renderFriendsList()}
                    {renderGroupsList()}
                </div>
            </div>

            {isMobile && isOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-20"
                    onClick={() => setIsOpen(false)}
                />
            )}
        </>
    );
};

export default Sidebar;