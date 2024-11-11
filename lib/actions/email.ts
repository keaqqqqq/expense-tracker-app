import { getFunctions, httpsCallable } from 'firebase/functions';
import type { Functions, HttpsCallableResult } from 'firebase/functions';

interface InvitationData {
  toEmail: string;
  invitationToken: string;
  requesterId: string;
  requesterName: string;
}

interface InvitationResponse {
  success: boolean;
  error?: string;
}

export const sendEmailInvitation = async (
  toEmail: string,
  invitationToken: string,
  requesterId: string,
  requesterName: string
): Promise<void> => {
  const functions: Functions = getFunctions();
  const sendInvitationEmail = httpsCallable<InvitationData, InvitationResponse>(
    functions, 
    'sendInvitationEmail'
  );
  
  try {
    const result: HttpsCallableResult<InvitationResponse> = await sendInvitationEmail({
      toEmail,
      invitationToken,
      requesterId,
      requesterName
    });

    if (!result.data.success) {
      throw new Error(result.data.error || 'Failed to send invitation email');
    }
  } catch (error) {
    console.error('Error sending invitation email:', error);
    throw error;
  }
};