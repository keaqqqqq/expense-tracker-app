  'use client'
  import { Dialog } from '@/components/ui/dialog';
  import { Input } from '@/components/ui/input';
  import { Button } from '@/components/ui/button';
  import { useState, useRef, useEffect } from 'react';
  import { Group } from '@/types/Group';
  import { Friend } from '@/types/Friend';
  import { saveGroup } from '@/lib/actions/user.action';
  import { Search, UserCircle, Camera, Plane, Home, Heart, PartyPopper, Briefcase, MoreHorizontal } from 'lucide-react';
  import { ToastState } from '@/types/Toast';
  import { updateGroup } from '@/lib/actions/user.action';
  type GroupType = 'trip' | 'house' | 'couple' | 'party' | 'business' | 'other';

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
      icon: <Plane className="w-6 h-6" />,
      description: 'Travel expenses and planning'
    },
    {
      value: 'house',
      label: 'House',
      icon: <Home className="w-6 h-6" />,
      description: 'Shared living costs'
    },
    {
      value: 'couple',
      label: 'Couple',
      icon: <Heart className="w-6 h-6" />,
      description: 'Shared expenses with partner'
    },
    {
      value: 'party',
      label: 'Party',
      icon: <PartyPopper className="w-6 h-6" />,
      description: 'Event and party expenses'
    },
    {
      value: 'business',
      label: 'Business',
      icon: <Briefcase className="w-6 h-6" />,
      description: 'Business related expenses'
    },
    {
      value: 'other',
      label: 'Other',
      icon: <MoreHorizontal className="w-6 h-6" />,
      description: 'Custom group type'
    }
  ];
  
  interface AddGroupProps {
    isOpen: boolean;
    closeModal: () => void;
    currentUserId: string;
    currentUserImage?: string; // Add this prop
    name?: string;
    friends: Friend[];
    email?: string;
    onSuccess?: () => void; 
    isEditing?: boolean;
    editData?: {
      type: string;
      name: string;
      image?: string | '';
      members: Array<{ id?: string; email?: string; name?: string; }>;
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
    const [emailError, setEmailError] = useState('')
    const searchContainerRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    const [formData, setFormData] = useState<Omit<Group, 'id'>>({
      type: editData?.type || 'trip',
      name: editData?.name || '',
      image: editData?.image || '',
      members: editData?.members || [{ }]
    });
    
    const [previewImage, setPreviewImage] = useState<string>('');
    const [toast, setToast] = useState<ToastState>({
      show: false,
      message: '',
      type: 'success'
    });

    useEffect(() => {
      if (isEditing && editData) {

        const memberIds = editData.members
        .filter(member => member.id && member.id !== currentUserId)
        .map(member => member.id) as string[];
      // Filter friends list to get only those who are members
      const initialFriends = friends.filter(friend => 
        memberIds.includes(friend.id)
      );

        const initialEmails = editData.members
          .filter(member => !member.id && member.email && member.email !== email)
          .map(member => member.email as string);
  
        setSelectedFriends(initialFriends);
        setInvitedEmails(initialEmails);

        if (editData.image) {
          setPreviewImage(editData.image);
        }
      }
    }, [isEditing, editData, friends, currentUserId, email]);

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
        setFormData(prev => ({
          ...prev,
          members: [
            { email: email || '' },
            ...prev.members.slice(1),
            { email: emailInput }
          ]
        }));
        
        setEmailInput('');
        setEmailError('');
      }
    };
  
    const handleRemoveEmail = (emailToRemove: string) => {
      setInvitedEmails(prev => prev.filter(e => e !== emailToRemove));
      setFormData(prev => ({
        ...prev,
        members: prev.members.filter(member => member.email !== emailToRemove)
      }));
    };

    const handleChoosePhoto = () => {
      fileInputRef.current?.click();
    };

    if (!isOpen) return null;

    const filteredFriends = friends.filter(friend => 
      friend.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !selectedFriends.some(selected => selected.id === friend.id)
    );

    const handleFriendSelect = (friend: Friend) => {
      setSelectedFriends(prev => [...prev, friend]);
      setShowFriendsList(false);
      setSearchTerm('');
      
      setFormData(prev => ({
        ...prev,
        members: [
          { email: email || '' },
          ...selectedFriends.map(f => ({ email: f.email })),
          { email: friend.email }
        ]
      }));
    };

    const handleRemoveFriend = (friendId: string) => {
      setSelectedFriends(prev => prev.filter(f => f.id !== friendId));
      
      const friendToRemove = selectedFriends.find(f => f.id === friendId);
      setFormData(prev => ({
        ...prev,
        members: [
          { email: name || '' },
          ...prev.members
            .slice(1)
            .filter(member => member.email !== friendToRemove?.email)
        ]
      }));
    };

    const creatorMember = editData?.members.find(member => member.id === currentUserId);
    const creatorData = {
      name: creatorMember?.name || name || email,
      image: currentUserImage
    };

// In AddGroup.tsx where you handle form submission
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  try {
    if (isEditing && groupId) {
      await updateGroup(groupId, formData, currentUserId);
      setToast({ show: true, message: 'Group updated successfully', type: 'success' });

    } else {
      await saveGroup(formData, currentUserId);
      setToast({ show: true, message: 'Group created successfully', type: 'success' });
    }
    
    if (onSuccess) {
      onSuccess();
    } else {
      closeModal();
    }
    
    setFormData({
      type: 'trip',
      name: '',
      image: '',
      members: [{ }]
    });
    setSelectedFriends([]);
    setPreviewImage('');
  } catch (error) {
    console.error('Error saving/updating group:', error);
    setToast({ show: true, message: 'Failed to save group changes', type: 'error' });

  }
};
    return (
      <Dialog>
        <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto z-[100]">
            <div className="min-h-full flex items-center justify-center p-4">
              <div className="relative bg-white rounded-lg p-5 w-full max-w-2xl my-8">
              <h2 className="text-xl font-bold mb-4">
              {isEditing ? 'Edit Group' : 'New Group'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-gray-700">Type</h3>
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
                      <div className={`mb-1 ${formData.type === type.value ? 'text-primary' : 'text-gray-500'}`}>
                        {type.icon}
                      </div>
                      <span className="font-medium text-xs">{type.label}</span>
                      <span className="text-[10px] text-gray-500 mt-0.5 leading-tight">{type.description}</span>
                    </button>
                  ))}
                </div>
              </div>
  
              <div className="grid grid-cols-[3fr_1fr] gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Name</label>
                  <Input
                    value={formData.name}
                    onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    required
                    placeholder="Enter group name"
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5">Photo</label>
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
                <label className="block text-sm font-medium">Members</label>
                
                <div className="mb-2">
                  <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-md">
                    {creatorData.image ? (
                      <img 
                        src={creatorData.image}
                        alt={creatorData.name}
                        className="w-6 h-6 rounded-full object-cover"
                      />
                    ) : (
                      <UserCircle className="w-6 h-6 text-gray-400" />
                    )}
                    <span className="text-sm">{creatorData.name}</span>
                  </div>
                </div>
                <div className="space-y-2 max-h-[120px] overflow-y-auto">
                  {selectedFriends.map(friend => (
                    <div key={friend.id} className="flex items-center justify-between bg-gray-50 p-2 rounded-md">
                      <div className="flex items-center gap-2">
                        {friend.image && (
                          <img 
                            src={friend.image} 
                            alt={friend.name} 
                            className="w-6 h-6 rounded-full object-cover"
                          />
                        )}
                        <span className="text-sm">{friend.name}</span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveFriend(friend.id)}
                        className="h-7 px-2"
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>

                {invitedEmails.map(invitedEmail => (
                  <div key={invitedEmail} className="flex items-center justify-between bg-gray-50 p-2 rounded-md">
                    <div className="flex items-center gap-2">
                      <UserCircle className="w-6 h-6 text-gray-400" />
                      <span className="text-sm">{invitedEmail}</span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveEmail(invitedEmail)}
                      className="h-7 px-2"
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
                      className="pr-8 mb-3"
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
                          {friend.image && (
                            <img 
                              src={friend.image} 
                              alt={friend.name} 
                              className="w-6 h-6 rounded-full object-cover"
                            />
                          )}
                          <span className="text-sm">{friend.name}</span>
                        </div>
                      ))}
                    </div>
                  )}

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
                    className={emailError ? 'border-red-500' : ''}
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