"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import Image from 'next/image';

interface SideBarProps {
    name: string | null; 
    image: string | null; 
}

const Sidebar: React.FC<SideBarProps> = ({ name, image }) => {
    const pathname = usePathname();
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
            default:
                return 'Chu2aExpenseTracker';
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

    return (
        <>
            {/* Mobile Header - Only visible when sidebar is closed */}
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
                                {name?.[0] || '?'}
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
                {/* Sidebar Header with Close Button */}
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

                {/* Sidebar Content */}
                <div className="h-full">
                    <h2 className={`text-xl font-semibold text-black px-4 py-4 ${isMobile ? 'hidden' : 'block'}`}>
                        Chu2aExpenseTracker
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
                    </ul>
                </div>
            </div>

            {/* Overlay for mobile */}
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