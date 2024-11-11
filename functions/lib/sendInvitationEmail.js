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
const https_1 = require("firebase-functions/v2/https");
const nodemailer = __importStar(require("nodemailer"));
const transporter = nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
        user: 'keaqiuynwa@gmail.com',
        pass: 'gzjg cohk hqys srzw'
    }
});
exports.sendInvitationEmail = (0, https_1.onRequest)({
    region: 'asia-southeast1'
}, async (req, res) => {
    if (req.method !== 'POST') {
        res.status(405).send('Method Not Allowed');
        return;
    }
    try {
        const { toEmail, invitationToken, requesterId, requesterName } = req.body;
        if (!toEmail || !invitationToken || !requesterId) {
            res.status(400).send('Missing required fields');
            return;
        }
        const mailOptions = {
            from: 'keaqiuynwa@gmail.com',
            to: toEmail,
            subject: 'Invitation to Join Expense Tracker',
            html: `
        <h1>You've Been Invited to Join Expense Tracker!</h1>
        <p>${requesterName || 'Someone'} has invited you to join their expense tracking group.</p>
        <p>Click the link below to join:</p>
        <a href="https://your-app-url.com/invite?token=${invitationToken}" style="
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
        await transporter.sendMail(mailOptions);
        console.log('Invitation email sent successfully');
        res.status(200).json({ success: true });
    }
    catch (error) {
        console.error('Error sending invitation email:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        res.status(500).json({
            success: false,
            error: `Failed to send invitation email: ${errorMessage}`
        });
    }
});
//# sourceMappingURL=sendInvitationEmail.js.map