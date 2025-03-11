'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { validateInvitation } from '@/lib/actions/friend.action';
import { validateGroupInvite } from '@/lib/actions/group.action';
interface InviteHandlerProps {
  token?: string;
}

export default function InviteHandler({ token }: InviteHandlerProps) {
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { 
    const handleInvitation = async () => {
      if (!token) {
        setError('No token provided');
        setIsProcessing(false);
        return;
      }

      try {
        // Try group invite first
        const groupInvite = await validateGroupInvite(token);
        
        if (groupInvite) {
          localStorage.setItem('invitationData', JSON.stringify({
            token,
            type: 'GROUP_INVITE',
            groupId: groupInvite.group_id,
            requesterId: groupInvite.requester_id
          }));
          router.push('/auth');
          return;
        }

        // If not group invite, try friend invite
        const friendResult = await validateInvitation(token);
        if (friendResult.valid && friendResult.data) {
          localStorage.setItem('invitationData', JSON.stringify({
            token,
            email: friendResult.data.email,
            requesterId: friendResult.data.requesterId,
            type: 'FRIEND_INVITE'
          }));
          router.push('/auth');
        } else {
          setError(friendResult.message || 'Invalid invitation');
        }
      } catch (error) {
        console.error('Error processing invitation:', error);
        setError('Failed to process invitation');
      } finally {
        setIsProcessing(false);
      }
    };

    handleInvitation();
  }, [token, router]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
          <div className="text-red-500 mb-4">
            <svg className="h-12 w-12 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Invitation Error</h3>
          <p className="text-gray-600 mb-4">{error}</p>
        </div>
      </div>
    );
  }

  if (isProcessing) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Processing invitation...</p>
        </div>
      </div>
    );
  }

  return null;
}