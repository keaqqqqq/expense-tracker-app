import type { NextApiRequest, NextApiResponse } from 'next';
import * as nodemailer from 'nodemailer';
import admin from 'firebase-admin';

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
    databaseURL: process.env.FIREBASE_DATABASE_URL,
  });
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
  

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { invitationId } = req.body;

    // Get invitation data
    const invitationDoc = await admin.firestore()
      .collection('Invitations')
      .doc(invitationId)
      .get();

    if (!invitationDoc.exists) {
      return res.status(404).json({ error: 'Invitation not found' });
    }

    const invitation = invitationDoc.data() as {
      addressee_email: string;
      invitation_token: string;
      requester_id: string;
      status: string;
    };

    // Get requester info
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
        <a href="https://expense-tracker-app-480d4.web.app/invite?token=${invitation.invitation_token}" style="
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

    // Send email
    await transporter.sendMail(mailOptions);

    // Update invitation status
    await invitationDoc.ref.update({
      email_sent: true,
      email_sent_at: admin.firestore.FieldValue.serverTimestamp()
    });

    res.status(200).json({ message: 'Invitation email sent successfully' });
  } catch (error) {
    console.error('Error sending invitation email:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    res.status(500).json({ error: 'Failed to send invitation email', details: errorMessage });
  }
}