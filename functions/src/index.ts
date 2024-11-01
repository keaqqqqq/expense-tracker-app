import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import * as admin from 'firebase-admin';
import * as nodemailer from 'nodemailer';
import { setTimeout } from 'timers/promises';

admin.initializeApp();

interface InvitationData {
  addressee_email: string;
  invitation_token: string;
  requester_id: string;
  status: string;
}

// Create email transporter with improved configuration
const createTransporter = () => {
  return nodemailer.createTransport({
    host: 'mail.keaqqqqq.com',
    port: 465,
    secure: true,
    auth: {
      user: 'expensetracker@keaqqqqq.com',
      pass: 'expensetracker'
    },
    // Add connection timeout settings
    connectionTimeout: 10000, // 10 seconds
    greetingTimeout: 10000,
    socketTimeout: 15000,
    // Add TLS configuration
    tls: {
      rejectUnauthorized: false, // Only use this in development
      minVersion: 'TLSv1.2'
    },
    // Add pool configuration
    pool: true,
    maxConnections: 5,
    maxMessages: 100,
    rateDelta: 1000,
    rateLimit: 5
  });
};

// Add retry logic for email sending
const sendEmailWithRetry = async (
  transporter: nodemailer.Transporter,
  mailOptions: nodemailer.SendMailOptions,
  maxRetries = 3,
  initialDelay = 1000
) => {
  let lastError: any;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const info = await transporter.sendMail(mailOptions);
      console.log('Email sent successfully on attempt', attempt, 'with messageId:', info.messageId);
      return info;
    } catch (error: any) {
      lastError = error;
      console.warn(`Email sending attempt ${attempt} failed:`, error.message);
      
      if (attempt < maxRetries) {
        const delay = initialDelay * Math.pow(2, attempt - 1); // Exponential backoff
        console.log(`Waiting ${delay}ms before retry...`);
        await setTimeout(delay);
      }
    }
  }
  
  throw new Error(`Failed to send email after ${maxRetries} attempts. Last error: ${lastError.message}`);
};

// Add SMTP connection verification
const verifySmtpConnection = async (transporter: nodemailer.Transporter) => {
  try {
    await transporter.verify();
    console.log('SMTP connection verified successfully');
    return true;
  } catch (error) {
    console.error('SMTP connection verification failed:', error);
    return false;
  }
};

exports.sendInvitationEmail = onDocumentCreated({
  document: 'Invitations/{invitationId}',
  region: 'asia-southeast1',
  timeoutSeconds: 60, // Increase function timeout
}, async (event) => {
  let transporter: nodemailer.Transporter | null = null;
  
  try {
    // Create and verify transporter
    transporter = createTransporter();
    const isSmtpValid = await verifySmtpConnection(transporter);
    
    if (!isSmtpValid) {
      throw new Error('SMTP connection verification failed');
    }

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

    // Send email with retry logic
    await sendEmailWithRetry(transporter, mailOptions);

    // Update document with success status
    await event.data?.ref.update({
      email_sent: true,
      email_sent_at: admin.firestore.FieldValue.serverTimestamp()
    });

  } catch (error) {
    console.error('Error in invitation process:', error);
    
    // Add detailed error logging
    const errorDetails = error instanceof Error ? {
      message: error.message,
      stack: error.stack,
      name: error.name
    } : 'Unknown error';

    await event.data?.ref.update({
      email_error: true,
      email_error_message: errorDetails,
      email_error_at: admin.firestore.FieldValue.serverTimestamp()
    });
    
    throw error;
  } finally {
    if (transporter) {
      await transporter.close();
    }
  }
});