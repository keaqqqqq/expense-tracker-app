"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const firestore_1 = require("firebase-functions/v2/firestore");
const admin = __importStar(require("firebase-admin"));
const nodemailer = __importStar(require("nodemailer"));
admin.initializeApp();
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
exports.sendInvitationEmail = (0, firestore_1.onDocumentCreated)({
    document: 'Invitations/{invitationId}',
    region: 'asia-southeast1'
}, async (event) => {
    var _a, _b, _c, _d;
    const transporter = createTransporter();
    try {
        const invitation = (_a = event.data) === null || _a === void 0 ? void 0 : _a.data();
        if (!invitation) {
            throw new Error('No invitation data found');
        }
        const requesterSnapshot = await admin.firestore()
            .collection('Users')
            .doc(invitation.requester_id)
            .get();
        const requesterName = requesterSnapshot.exists ?
            ((_b = requesterSnapshot.data()) === null || _b === void 0 ? void 0 : _b.name) || 'Someone' :
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
        };
        await transporter.sendMail(mailOptions);
        console.log('Invitation email sent successfully to:', invitation.addressee_email);
        await ((_c = event.data) === null || _c === void 0 ? void 0 : _c.ref.update({
            email_sent: true,
            email_sent_at: admin.firestore.FieldValue.serverTimestamp()
        }));
    }
    catch (error) {
        console.error('Error in invitation process:', error);
        await ((_d = event.data) === null || _d === void 0 ? void 0 : _d.ref.update({
            email_error: true,
            email_error_message: error instanceof Error ? error.message : 'Unknown error',
            email_error_at: admin.firestore.FieldValue.serverTimestamp()
        }));
        throw error;
    }
    finally {
        transporter.close();
    }
});
//# sourceMappingURL=index.js.map