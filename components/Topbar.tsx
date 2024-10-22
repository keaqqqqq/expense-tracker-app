"use client"; // Ensure this line is present

import React, { useState } from 'react';

const TopBar: React.FC<{ username: string; onSearch: (query: string) => void }> = ({ username, onSearch }) => {
    const [searchQuery, setSearchQuery] = useState('');

    const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(event.target.value);
        onSearch(event.target.value);
    };

    return (
        <div className="bg-white text-black p-4 shadow-md">
            <div className="flex justify-between items-center">
                <input
                    type="text"
                    value={searchQuery}
                    onChange={handleSearchChange}
                    placeholder="Search..."
                    className="bg-white text-black px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full "
                />
                <div className="ml-4 font-semibold">{username}</div>
            </div>
        </div>
    );
};

export default TopBar;
