import React, { useState, useEffect, useRef } from 'react';
import { Search } from 'lucide-react';
import Link from 'next/link';
import { Friend } from '@/types/Friend';
import { Group } from '@/types/Group';
import Image from 'next/image';
interface SearchBarProps {
  initialFriends: Friend[];
  initialGroups: Group[];
}

const SearchBar: React.FC<SearchBarProps> = ({ initialFriends, initialGroups }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [friends, setFriends] = useState<Friend[]>(initialFriends);
  const [groups, setGroups] = useState<Group[]>(initialGroups);
  const searchRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setFriends(initialFriends);
  }, [initialFriends]);

  useEffect(() => {
    setGroups(initialGroups);
  }, [initialGroups]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && event.target instanceof Node && !searchRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleItemClick = () => {
    setIsOpen(false);
    setSearchQuery('');
  };

  const filteredFriends = friends.filter(friend =>
    friend.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredGroups = groups.filter(group =>
    group.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 max-w-5xl relative z-[9999]" ref={searchRef}>
      <div className="relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
          placeholder="Search..."
          className="w-full bg-white text-black px-3 py-2 pl-10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
        />
        <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
        
        {isOpen && (searchQuery || filteredFriends.length > 0 || filteredGroups.length > 0) && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-lg border max-h-96 overflow-y-auto">
            {(filteredFriends.length > 0 || filteredGroups.length > 0) ? (
              <>
                {filteredFriends.length > 0 && (
                  <div className="p-2">
                    <div className="text-sm font-medium text-gray-500 px-3 py-2">Friends</div>
                    {filteredFriends.map((friend: Friend) => (
                      <Link
                        key={friend.id}
                        href={`/friends/${friend.id}`}
                        onClick={handleItemClick}
                        className="flex items-center px-3 py-2 hover:bg-gray-50 rounded-lg"
                      >
                        {friend.image ? (
                          <Image
                            src={friend.image}
                            alt={friend.name}
                            className="w-8 h-8 rounded-full object-cover"
                            onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                              const target = e.currentTarget;
                              target.src = '/default-avatar.jpg';
                            }}
                            unoptimized
                            width={100}
                            height={100}
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                            <span className="text-gray-500 text-sm">
                              {friend.name?.[0] || '?'}
                            </span>
                          </div>
                        )}
                        <span className="ml-3 text-sm text-gray-700">{friend.name}</span>
                      </Link>
                    ))}
                  </div>
                )}

                {filteredGroups.length > 0 && (
                  <div className="p-2 border-t">
                    <div className="text-sm font-medium text-gray-500 px-3 py-2">Groups</div>
                    {filteredGroups.map((group: Group) => (
                      <Link
                        key={group.id}
                        href={`/groups/${group.id}`}
                        onClick={handleItemClick}
                        className="flex items-center px-3 py-2 hover:bg-gray-50 rounded-lg"
                      >
                        {group.image ? (
                          <Image
                            src={group.image}
                            alt={group.name}
                            className="w-8 h-8 rounded-full object-cover"
                            onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                              const target = e.currentTarget;
                              target.src = '/default-group.jpg';
                            }}
                            unoptimized
                            width={100}
                            height={100}
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                            <span className="text-gray-500 text-sm">
                              {group.name?.[0] || '?'}
                            </span>
                          </div>
                        )}
                        <span className="ml-3 text-sm text-gray-700">{group.name}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="p-4 text-center text-sm text-gray-500">
                No results found
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchBar;