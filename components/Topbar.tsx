"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';

interface TopBarProps {
  name: string | null;
  image: string | null;
}

const TopBar: React.FC<TopBarProps> = ({ name: initialName, image: initialImage }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const { userDataObj } = useAuth();

  const displayName = userDataObj !== null ? userDataObj.name : initialName;
  const displayImage = userDataObj !== null ? userDataObj.image : initialImage;

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  return (
    <div className="bg-white text-black p-4 shadow-md">
      <div className="flex justify-between items-center">
        <input
          type="text"
          value={searchQuery}
          onChange={handleSearchChange}
          placeholder="Search..."
          className="bg-white text-black px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
        />
        <div className="ml-4 flex items-center">
          {displayImage ? (
            <div className="relative w-8 h-8">
              <Image
                src={displayImage}
                alt="Profile"
                fill
                className="rounded-full object-cover"
                sizes="32px"
              />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
              <span className="text-gray-500 text-sm">
                {displayName?.[0] || '?'}
              </span>
            </div>
          )}
          <span className="hidden md:block font-semibold truncate ml-2 max-w-[200px]">
            {displayName}
          </span>
        </div>
      </div>
    </div>
  );
};

export default TopBar;