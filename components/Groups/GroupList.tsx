'use client';
import { Group } from '@/types/Group';
import Image from 'next/image';
import { Plane, Home, Heart, PartyPopper, Briefcase, MoreHorizontal, CircleUserRound, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useRouter } from 'next/navigation';

interface GroupListProps {
  groups: Group[];
  userEmail?: string;
}

const GroupList: React.FC<GroupListProps> = ({ groups, userEmail }) => {
  const router = useRouter();

  const typeIcons = {
    trip: { icon: Plane, color: 'text-blue-500' },
    house: { icon: Home, color: 'text-green-500' },
    couple: { icon: Heart, color: 'text-pink-500' },
    party: { icon: PartyPopper, color: 'text-purple-500' },
    business: { icon: Briefcase, color: 'text-orange-500' },
    other: { icon: MoreHorizontal, color: 'text-gray-500' }
  };

  const getTypeIcon = (type: string) => {
    const IconComponent = typeIcons[type as keyof typeof typeIcons]?.icon || typeIcons.other.icon;
    const colorClass = typeIcons[type as keyof typeof typeIcons]?.color || typeIcons.other.color;
    return <IconComponent className={`w-5 h-5 ${colorClass}`} />;
  };

  const handleGroupClick = (groupId: string) => {
    router.push(`/groups/${groupId}`);
  };

  const getPendingStatusLabel = (status: string) => {
    switch (status) {
      case 'PENDING_FRIENDSHIP':
        return 'Pending Friend Request';
      case 'PENDING_INVITATION':
        return 'Invitation Sent';
      default:
        return 'Pending';
    }
  };

  return (
    <div className="mt-5 space-y-3 ">
      {groups.map((group) => (
        <Card 
          key={group.id}
          className={`transition-all duration-200 hover:shadow-md cursor-pointer 
            active:scale-[0.99] hover:bg-gray-50`}
          onClick={() => handleGroupClick(group.id)}
        >
          <CardContent className="p-2">
            <div className="flex items-start gap-3">
              <div className="relative w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
                {group.image ? (
                  <Image
                    src={group.image}
                    alt={group.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className={`w-full h-full flex items-center justify-center bg-${group.type}-50`}>
                    {getTypeIcon(group.type)}
                  </div>
                )}
              </div>

              <div className="flex-grow">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-sm font-semibold">{group.name}</h3>
                  <div className="flex items-center gap-1 text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                    {getTypeIcon(group.type)}
                    <span className="capitalize">{group.type}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    {group.members.map((member) => (
                      <div 
                        key={member.email}
                        className={`flex items-center gap-2 px-2 py-1 rounded-full text-sm
                          ${member.email === userEmail ? 'bg-primary/10 text-primary' : 'bg-gray-50'}`}
                      >
                        {member.image ? (
                          <div className="relative w-4 h-4 rounded-full overflow-hidden">
                            <Image
                              src={member.image}
                              alt={member.name || 'User'}
                              fill
                              className="object-cover"
                            />
                          </div>
                        ) : (
                          <CircleUserRound className="w-4 h-4" />
                        )}
                        <span>{member.name || 'User'}</span>
                        {member.email === userEmail && <span className="text-xs">(You)</span>}
                      </div>
                    ))}
                  </div>

                  {group.pending_members && group.pending_members.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2 border-t pt-2">
                      {group.pending_members.map((member) => (
                        <div 
                          key={member.email}
                          className="flex items-center gap-2 px-2 py-1 rounded-full text-sm bg-gray-100/50 text-gray-500"
                        >
                          {member.image ? (
                            <div className="relative w-4 h-4 rounded-full overflow-hidden opacity-60">
                              <Image
                                src={member.image}
                                alt={member.name || 'User'}
                                fill
                                className="object-cover"
                              />
                            </div>
                          ) : (
                            <CircleUserRound className="w-4 h-4 opacity-60" />
                          )}
                          <span>{member.name || member.email}</span>
                          <div className="flex items-center gap-1 text-xs bg-gray-200/70 px-1.5 py-0.5 rounded-full">
                            <Clock className="w-3 h-3" />
                            {getPendingStatusLabel(member.status || 'PENDING')}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {groups.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-2">
            <MoreHorizontal className="w-12 h-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-600">No Groups Yet</h3>
          <p className="text-gray-500 mt-1">Create a group to start tracking shared expenses</p>
        </div>
      )}
    </div>
  );
};

export default GroupList;