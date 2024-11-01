import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import * as admin from 'firebase-admin';
import * as nodemailer from 'nodemailer';

admin.initializeApp();

interface InvitationData {
  addressee_email: string;
  invitation_token: string;
  requester_id: string;
  status: string;
}

// Create email transporter with secure configuration
const createTransporter = () => {

  return nodemailer.createTransport({
    host: 'mail.keaqqqqq.com',
    port: 465,
    secure: true,
    auth: {
      user: 'expensetracker@keaqqqqq.com',
      pass: 'expensetracker'
    }
  });
};

exports.sendInvitationEmail = onDocumentCreated({
  document: 'Invitations/{invitationId}',
  region: 'asia-southeast1'
}, async (event) => {
  const transporter = createTransporter();
  
  try {
    const invitation = event.data?.data() as InvitationData;
    
    if (!invitation) {
      throw new Error('No invitation data found');
    }

    const requesterSnapshot = await admin.firestore()
      .collection('Users')
      .doc(invitation.requester_id)
      .get();
    
    const requesterName = requesterSnapshot.exists ? 
      requesterSnapshot.data()?.name || 'Someone' : 
      'Someone';

    const inviteUrl = `https://keaqqqqq.com/invite?token=${invitation.invitation_token}`;

    // Type-safe mail options
    const mailOptions = {
      from: {
        name: 'Expense Tracker',
        address: 'expensetracker@keaqqqqq.com'
      },
      to: invitation.addressee_email,
      subject: 'Invitation to Join Expense Tracker',
      html: `
        <h1>You've Been Invited to Join Expense Tracker!</h1>
        <p>${requesterName} has invited you to join their expense tracking group.</p>
        <p>Click the link below to join:</p>
        <a href="${inviteUrl}" 
           style="background-color: #4CAF50; border: none; color: white; padding: 15px 32px; 
                  text-align: center; text-decoration: none; display: inline-block; 
                  font-size: 16px; margin: 4px 2px; cursor: pointer; border-radius: 4px;">
          Accept Invitation
        </a>
        <p>This invitation link will expire in 7 days.</p>
        <p>If you did not expect this invitation, you can safely ignore this email.</p>
      `,
      text: `
        You've Been Invited to Join Expense Tracker!
        
        ${requesterName} has invited you to join their expense tracking group.
        
        Click this link to join: ${inviteUrl}
        
        This invitation link will expire in 7 days.
        
        If you did not expect this invitation, you can safely ignore this email.
      `
    } as nodemailer.SendMailOptions;

    await transporter.sendMail(mailOptions);
    console.log('Invitation email sent successfully to:', invitation.addressee_email);

    await event.data?.ref.update({
      email_sent: true,
      email_sent_at: admin.firestore.FieldValue.serverTimestamp()
    });

  } catch (error) {
    console.error('Error in invitation process:', error);
    await event.data?.ref.update({
      email_error: true,
      email_error_message: error instanceof Error ? error.message : 'Unknown error',
      email_error_at: admin.firestore.FieldValue.serverTimestamp()
    });
    throw error;
  } finally {
    transporter.close();
  }
});