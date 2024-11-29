"use client";

import React, { useState } from 'react';
import { Search, Menu } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface TopBarProps {
  name: string | null;
  image: string | null;
  onMenuClick: () => void;
}

const TopBar: React.FC<TopBarProps> = ({ name: initialName, image: initialImage, onMenuClick }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const { userDataObj } = useAuth();

  const displayName = userDataObj !== null ? userDataObj.name : initialName;
  const displayImage = userDataObj !== null ? userDataObj.image : initialImage;

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  return (
    <header className="sticky top-0 bg-white text-black p-4 shadow-md">
      <div className="flex justify-between items-center gap-2">
        <button
          onClick={onMenuClick}
          className="md:hidden p-2 hover:bg-gray-100 rounded-lg z-50"
          type="button"
          aria-label="Toggle menu"
        >
          <Menu size={24} className="text-gray-700" />
        </button>

        <div className="flex-1 max-w-5xl">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search..."
              className="w-full bg-white text-black px-3 py-2 pl-10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
            />
            <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
          </div>
        </div>

        <div className="flex items-center">
          {displayImage ? (
            <div className="relative w-8 h-8">
              <img
                src={displayImage}
                alt="Profile"
                className="w-full h-full rounded-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = '/default-avatar.jpg';
                }}
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
    </header>
  );
};

export default TopBar;