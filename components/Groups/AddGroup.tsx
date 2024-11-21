'use client'

import { Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useState, useRef, useEffect } from 'react';
import { Search, UserCircle, Plane, Home, Heart, PartyPopper, Briefcase, MoreHorizontal } from 'lucide-react';
import { Group, GroupMember, GroupType } from '@/types/Group';
import { Friend } from '@/types/Friend';
import { ToastState } from '@/types/Toast';
import { saveGroup, updateGroup } from '@/lib/actions/user.action';

interface TypeOption {
  value: GroupType;
  label: string;
  icon: React.ReactNode;
  description: string;
}

const typeOptions: TypeOption[] = [
  {
    value: 'trip',
    label: 'Trip',
    icon: <Plane className="w-5 h-5" />,
    description: 'Travel expenses and planning'
  },
  {
    value: 'house',
    label: 'House',
    icon: <Home className="w-5 h-5" />,
    description: 'Shared living costs'
  },
  {
    value: 'couple',
    label: 'Couple',
    icon: <Heart className="w-5 h-5" />,
    description: 'Shared expenses with partner'
  },
  {
    value: 'party',
    label: 'Party',
    icon: <PartyPopper className="w-5 h-5" />,
    description: 'Event and party expenses'
  },
  {
    value: 'business',
    label: 'Business',
    icon: <Briefcase className="w-5 h-5" />,
    description: 'Business related expenses'
  },
  {
    value: 'other',
    label: 'Other',
    icon: <MoreHorizontal className="w-5 h-5" />,
    description: 'Custom group type'
  }
];

interface AddGroupProps {
  isOpen: boolean;
  closeModal: () => void;
  currentUserId: string;
  currentUserImage?: string;
  name?: string;
  friends: Friend[];
  email?: string;
  onSuccess?: () => void;
  isEditing?: boolean;
  editData?: {
    type: string;
    name: string;
    image?: string;
    members: Array<{
      id?: string;
      email?: string;
      name?: string;
      balances?: Array<{
        id: string;
        balance: number;
      }>;
    }>;
  };
  groupId?: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function AddGroup({
  isOpen,
  closeModal,
  currentUserId,
  currentUserImage,
  name,
  friends,
  email,
  onSuccess,
  isEditing,
  editData,
  groupId
}: AddGroupProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [selectedFriends, setSelectedFriends] = useState<Friend[]>([]);
  const [invitedEmails, setInvitedEmails] = useState<string[]>([]);
  const [showFriendsList, setShowFriendsList] = useState(false);
  const [emailError, setEmailError] = useState('');
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewImage, setPreviewImage] = useState<string>('');
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [toast, setToast] = useState<ToastState>({
    show: false,
    message: '',
    type: 'success'
  });

  const [formData, setFormData] = useState<Omit<Group, 'id'>>({
    type: editData?.type || 'trip',
    name: editData?.name || '',
    image: editData?.image || '',
    members: [{
      id: currentUserId,
      email: email || '',
      name: name || '',
      balances: []
    }]
  });

  useEffect(() => {
    if (isEditing && editData) {
      const [creator, ...otherMembers] = editData.members;
  
      setMembers(otherMembers.map(member => ({
        id: member.id,
        name: member.name,
        email: member.email,
        balances: member.balances
      })));
  
      const emailOnlyMembers = otherMembers
        .filter(member => !member.id && member.email)
        .map(member => member.email as string);
  
      setInvitedEmails(emailOnlyMembers);
  
      setFormData(prev => ({
        ...prev,
        type: editData.type,
        name: editData.name,
        image: editData.image || '',
        members: [creator, ...otherMembers] 
      }));
  
      if (editData.image) {
        setPreviewImage(editData.image);
      }} else {
        setFormData(prev => ({
          ...prev,
          members: [{
            id: currentUserId,
            email: email || '',
            name: name || '',
            balances: []
          }]
        }));
    }
  }, [isEditing, editData, currentUserId, email, name]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowFriendsList(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
        setFormData(prev => ({
          ...prev,
          image: reader.result as string
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEmailSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (!emailInput) return;

      if (!EMAIL_REGEX.test(emailInput)) {
        setEmailError('Please enter a valid email address');
        return;
      }

      if (invitedEmails.includes(emailInput)) {
        setEmailError('This email has already been invited');
        return;
      }

      if (emailInput === email) {
        setEmailError('You cannot invite yourself');
        return;
      }

      if (selectedFriends.some(friend => friend.email === emailInput)) {
        setEmailError('This user is already added as a friend');
        return;
      }

      setInvitedEmails(prev => [...prev, emailInput]);
      setFormData(prev => {
        // Preserve existing member balances
        const existingMembers = prev.members.filter(member =>
          member.email !== emailInput
        );
  
        return {
          ...prev,
          members: [
            ...existingMembers,
            {
              email: emailInput,
              balances: []
            }
          ]
        };
      });

      setEmailInput('');
      setEmailError('');
    }
  };

  const handleRemoveEmail = (emailToRemove: string) => {
    setInvitedEmails(prev => prev.filter(e => e !== emailToRemove));
    setFormData(prev => ({
      ...prev,
      members: prev.members.filter(member =>
        member.id === currentUserId || member.email !== emailToRemove
      )
    }));
  };

  const handleChoosePhoto = () => {
    fileInputRef.current?.click();
  };

  const handleFriendSelect = (friend: Friend) => {
    // Check both members array and formData.members array
    if (members.some(member => member.id === friend.id) || 
        formData.members.some(member => member.id === friend.id)) {
      setEmailError('This user is already a member of the group');
      return;
    }
  
    const newMember: GroupMember = {
      id: friend.id,
      name: friend.name,
      email: friend.email,
      image: friend.image,
      balances: []
    };
  
    setMembers(prev => [...prev, newMember]);
    setShowFriendsList(false);
    setSearchTerm('');
  
    setFormData(prev => ({
      ...prev,
      members: [...prev.members, newMember]
    }));
  };
  

  const handleRemoveMember = (memberId?: string, memberEmail?: string) => {
    setMembers(prev => prev.filter(m => 
      (memberId ? m.id !== memberId : m.email !== memberEmail)
    ));
    
    setFormData(prev => ({
      ...prev,
      members: prev.members.filter(m => 
        (memberId ? m.id !== memberId : m.email !== memberEmail)
      )
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // When updating formData, we need to preserve the creator and include all members
      const updatedFormData = {
        ...formData,
        members: [
          formData.members[0], // Keep the creator (first member)
          ...members, // Include all other members
          ...invitedEmails.map(emailAddr => ({ // Include invited emails
            email: emailAddr,
            balances: []
          }))
        ]
      };
  
      if (isEditing && groupId) {
        await updateGroup(groupId, updatedFormData, currentUserId);
        setToast({ show: true, message: 'Group updated successfully', type: 'success' });
      } else {
        await saveGroup(updatedFormData, currentUserId);
        setToast({ show: true, message: 'Group created successfully', type: 'success' });
      }
  
      if (onSuccess) {
        onSuccess();
      } else {
        closeModal();
      }
  
      // Reset form after submission
      setFormData({
        type: 'trip',
        name: '',
        image: '',
        members: [{
          id: currentUserId,
          email: email || '',
          name: name || '',
          balances: []
        }]
      });
      setMembers([]);
      setSelectedFriends([]);
      setInvitedEmails([]);
      setPreviewImage('');
    } catch (error) {
      console.error('Error saving/updating group:', error);
      setToast({ show: true, message: 'Failed to save group changes', type: 'error' });
    }
  };

  if (!isOpen) return null;

  const filteredFriends = friends.filter(friend => 
    // Check if friend's name includes search term
    friend.name.toLowerCase().includes(searchTerm.toLowerCase()) && 
    // Check if friend is not already a member (check both arrays)
    !members.some(member => member.id === friend.id) &&
    !formData.members.some(member => member.id === friend.id) &&
    // Also ensure it's not the current user
    friend.id !== currentUserId
  );

  const creatorMember = editData?.members.find(member => member.id === currentUserId);
  const creatorData = {
    name: creatorMember?.name || name || email,
    image: currentUserImage
  };
    return (
      <Dialog>
        <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto z-[100]">
            <div className="min-h-screen py-8 flex items-center justify-center p-4">
              <div className="relative bg-white rounded-lg p-5 w-full max-w-2xl mx-auto">
              <h2 className="text-sm font-bold mb-4">
              {isEditing ? 'Edit Group' : 'New Group'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-3">
                <h3 className="text-xs font-medium text-gray-700">Type</h3>
                <div className="grid grid-cols-6 gap-2">
                  {typeOptions.map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      className={`flex flex-col items-center p-2 rounded-lg border transition-all text-center
                        ${formData.type === type.value 
                          ? 'border-primary bg-primary/5 text-primary' 
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }
                      `}
                      onClick={() => setFormData(prev => ({ ...prev, type: type.value }))}
                    >
                      <div className={`mb-1 ${formData.type === type.value ? 'text-indigo-500' : 'text-gray-500'}`}>
                        {type.icon}
                      </div>
                      <span className={`font-medium text-xs ${formData.type === type.value ? 'text-indigo-500' : 'text-gray-500'}`}>{type.label}</span>
                      <span className={`text-[10px] text-gray-500 mt-0.5 leading-tight ${formData.type === type.value ? 'text-indigo-500' : 'text-gray-500'}`}>{type.description}</span>
                    </button>
                  ))}
                </div>
              </div>
  
              <div className="grid grid-cols-[3fr_1fr] gap-4">
                <div>
                  <label className="block text-xs font-medium mb-1.5">Name</label>
                  <Input
                    value={formData.name}
                    onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    required
                    placeholder="Enter group name"
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1.5">Photo</label>
                  <div className="flex items-center gap-3">
                    <div className="relative w-20 h-20 mb-2">
                      {previewImage ? (
                        <img 
                          src={previewImage}
                          alt="Group avatar"
                          className="w-20 h-20 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center">
                        </div>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleChoosePhoto}
                      className="h-9"
                    >
                      Choose a photo
                    </Button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImageChange}
                      accept="image/*"
                      className="hidden"
                    />
                  </div>
                </div>
              </div>
  
              <div className="space-y-3">
                <label className="block text-xs font-medium">Members</label>

                <div className="space-y-2">
                  
                {isEditing ? (
                  // For editing: show the creator from editData
                  <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-md">

                    <span className="text-xs">
                      {editData?.members[0].name || editData?.members[0].email}
                      {editData?.members[0].id === currentUserId && " (You)"}
                    </span>
                  </div>
                ) : (
                  // For new group: show current user
                  <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-md">
                    {currentUserImage ? (
                      <img 
                        src={currentUserImage}
                        alt={name || email}
                        className="w-6 h-6 rounded-full object-cover"
                      />
                    ) : (
                      <UserCircle className="w-6 h-6 text-gray-400" />
                    )}
                    <span className="text-xs">
                      {name || email} (You)
                    </span>
                  </div>
                )}

                  {/* Show other members */}
                  {members.map(member => (
                    <div key={member.id || member.email} className="flex items-center justify-between bg-gray-50 p-2 rounded-md">
                      <div className="flex items-center gap-2">
                        {member.image ? (
                          <img 
                            src={member.image} 
                            alt={member.name} 
                            className="w-6 h-6 rounded-full object-cover"
                          />
                        ) : (
                          <UserCircle className="w-6 h-6 text-gray-400" />
                        )}
                        <span className="text-xs">
                          {member.name || member.email}
                          {member.id === currentUserId && " (You)"}
                        </span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveMember(member.id, member.email)}
                        className="text-xs"
                      >
                        Remove
                      </Button>
                    </div>
                  ))}

                {invitedEmails.map(invitedEmail => (
                  <div key={invitedEmail} className="flex items-center justify-between bg-gray-50 p-2 rounded-md">
                    <div className="flex items-center gap-2">
                      <UserCircle className="w-6 h-6 text-gray-400" />
                      <span className="text-xs">{invitedEmail}</span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveEmail(invitedEmail)}
                      className="h-7 px-2 text-xs"
                    >
                      Remove
                    </Button>
                  </div>
                ))}
  
                <div className="relative" ref={searchContainerRef}>
                  <div className="relative">
                    <Input
                      value={searchTerm}
                      onChange={e => {
                        setSearchTerm(e.target.value);
                        setShowFriendsList(true);
                      }}
                      onFocus={() => setShowFriendsList(true)}
                      placeholder="Search existing friends..."
                      className="pr-8 mb-3 text-xs"
                    />
                    <Search className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                  </div>
  
                  {showFriendsList && filteredFriends.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-36 overflow-auto">
                      {filteredFriends.map(friend => (
                        <div
                          key={friend.id}
                          className="flex items-center gap-2 p-2 hover:bg-gray-100 cursor-pointer"
                          onClick={() => handleFriendSelect(friend)}
                        >
                          {friend.image ? (
                            <img 
                              src={friend.image} 
                              alt={friend.name} 
                              className="w-6 h-6 rounded-full object-cover"
                            />
                          ) : (
                            <UserCircle className="w-6 h-6 text-gray-400" />
                          )}
                          <span className="text-xs">{friend.name}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {showFriendsList && filteredFriends.length === 0 && searchTerm && (
                    <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg p-2">
                      <p className="text-xs text-gray-500">No available friends found</p>
                    </div>
                  )}
              </div>

              <div className="space-y-2">
                <div className="relative">
                  <Input
                    value={emailInput}
                    onChange={e => {
                      setEmailInput(e.target.value);
                      setEmailError('');
                    }}
                    onKeyDown={handleEmailSubmit}
                    placeholder="Invite new friends through email (press Enter)"
                    className={`text-xs {emailError ? 'border-red-500' : ''}`}
                  />
                  {emailError && (
                    <p className="text-red-500 text-xs mt-1">{emailError}</p>
                  )}
                </div>
              </div>

                </div>
              </div>
  
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={closeModal}>
                  Cancel
                </Button>
                <Button type="submit" variant="default">
                  {isEditing ? 'Save' : 'Create'}
                </Button>
              </div>
            </form>
          </div>
        </div>
        </div>
      </Dialog>
    );
  }