import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import * as admin from 'firebase-admin';
import * as nodemailer from 'nodemailer';

// Initialize Firebase Admin
admin.initializeApp();

interface InvitationData {
  addressee_email: string;
  invitation_token: string;
  requester_id: string;
  status: string;
}

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

exports.sendInvitationEmail = onDocumentCreated({
  document: 'Invitations/{invitationId}',
  region: 'asia-southeast1'
}, async (event) => {
  try {
    const invitation = event.data?.data() as InvitationData;
    
    if (!invitation) {
      console.error('No invitation data found');
      return;
    }

    // Get requester's information from Users collection
    const requesterSnapshot = await admin.firestore()
      .collection('Users')
      .doc(invitation.requester_id)
      .get();
    
    const requesterName = requesterSnapshot.exists ? 
      requesterSnapshot.data()?.name || 'Someone' : 
      'Someone';

    const mailOptions = {
      from: 'expensetracker@keaqqqqq.com',
      to: invitation.addressee_email,
      subject: 'Invitation to Join Expense Tracker',
      html: `
        <h1>You've Been Invited to Join Expense Tracker!</h1>
        <p>${requesterName} has invited you to join their expense tracking group.</p>
        <p>Click the link below to join:</p>
        <a href="https://Expense Tracker App.vercel.app/invite?token=${invitation.invitation_token}" style="
          background-color: #4CAF50;
          border: none;
          color: white;
          padding: 15px 32px;
          text-align: center;
          text-decoration: none;
          display: inline-block;
          font-size: 16px;
          margin: 4px 2px;
          cursor: pointer;
          border-radius: 4px;">
          Accept Invitation
        </a>
        <p>This invitation link will expire in 7 days.</p>
        <p>If you did not expect this invitation, you can safely ignore this email.</p>
      `
    };

    // Send the email
    await transporter.sendMail(mailOptions);
    console.log('Invitation email sent successfully to:', invitation.addressee_email);

    // Update the invitation document to mark email as sent
    await event.data?.ref.update({
      email_sent: true,
      email_sent_at: admin.firestore.FieldValue.serverTimestamp()
    });

  } catch (error) {
    console.error('Error sending invitation email:', error);
    // You might want to update the document to mark the error
    await event.data?.ref.update({
      email_error: true,
      email_error_message: error instanceof Error ? error.message : 'Unknown error',
      email_error_at: admin.firestore.FieldValue.serverTimestamp()
    });
    throw error;
  }
});