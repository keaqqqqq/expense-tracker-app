'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { validateInvitation } from '@/lib/actions/user.action';
interface InviteHandlerProps {
  token?: string;
}

export default function InviteHandler({ token }: InviteHandlerProps) {
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => { 
    const handleInvitation = async () => {
      if (!token) {
        console.error('No token provided');
        return;
      }

      try {
        const result = await validateInvitation(token);
        console.log(token)
        if (result.valid && result.data) {
          localStorage.setItem('invitationData', JSON.stringify({
            token,
            email: result.data.email,
            requesterId: result.data.requesterId
          }));
          console.log("User is authenticated");
          
          router.push('https://keaqqqqq.com/auth');
        } else {
          console.error('Invalid invitation:', result.message);
          return;
        }
      } catch (error) {
        console.error('Error processing invitation:', error);
        return;
      } finally {
        setIsProcessing(false);
      }
    };

    handleInvitation();
  }, [token, router]);

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