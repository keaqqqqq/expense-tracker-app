import React, { useState } from 'react';
import { Search, Menu, Settings, LogOut } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { createPortal } from 'react-dom';

interface TopBarProps {
  name: string | null;
  image: string | null;
  onMenuClick: () => void;
}

const TopBar: React.FC<TopBarProps> = ({ name: initialName, image: initialImage, onMenuClick }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const { userDataObj, logout } = useAuth();
  const router = useRouter();

  const displayName = userDataObj !== null ? userDataObj.name : initialName;
  const displayImage = userDataObj !== null ? userDataObj.image : initialImage;
  const userEmail = userDataObj?.email;

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  const handleLogout = async () => {
    try {
      await logout();
      window.location.href = '/auth';
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const handleSettingsClick = () => {
    router.push('/settings');
    setIsDropdownOpen(false);
  };

  const renderDropdown = () => {
    if (!isDropdownOpen) return null;

    const buttonRect = document.querySelector('.profile-button')?.getBoundingClientRect();
    if (!buttonRect) return null;

    return createPortal(
      <div 
        className="fixed bg-white rounded-md shadow-lg py-1"
        style={{
          top: `${buttonRect.bottom + window.scrollY + 8}px`,
          left: `${buttonRect.right - 192}px`, // 192px is the width of the dropdown (w-48)
          width: '12rem',
          zIndex: 9999
        }}
      >
        <div className="px-4 py-2 text-sm text-gray-700 border-b">
          <div className="font-medium">{displayName}</div>
          <div className="text-gray-500 truncate">{userEmail}</div>
        </div>
        <button
          onClick={handleSettingsClick}
          className="w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
        >
          <Settings size={16} />
          Settings
        </button>
        <button
          onClick={handleLogout}
          className="w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100 flex items-center gap-2"
        >
          <LogOut size={16} />
          Sign out
        </button>
      </div>,
      document.body
    );
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

        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="profile-button flex items-center focus:outline-none"
            aria-expanded={isDropdownOpen}
            aria-haspopup="true"
          >
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
          </button>

          {renderDropdown()}
        </div>
      </div>
    </header>
  );
};

export default TopBar;