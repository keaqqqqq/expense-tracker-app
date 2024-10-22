"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const Sidebar: React.FC = () => {
    const pathname = usePathname();

    return (
        <div className="fixed top-0 left-0 h-full bg-white text-white w-64 border-r">
            <div className="">
                <h2 className="text font-semibold text-black px-2 py-4">Chu2aExpenseTracker</h2>
                <ul>
                    <li>
                        <Link href="/expense" className={`block py-2 p-4 font-semibold text-gray-800 ${pathname === '/expense' ? 'bg-gray-100 text-indigo-600 font-semibold' : ''}`}>
                            Expense
                        </Link>
                    </li>
                    <li>
                        <Link href="profile" className={`block py-2 p-4 font-semibold text-gray-800 ${pathname === '/profile' ? 'bg-gray-100 text-indigo-600 ' : ''}`}>
                            Profile
                        </Link>
                    </li>
                </ul>
            </div>
        </div>
    );
};

export default Sidebar;
