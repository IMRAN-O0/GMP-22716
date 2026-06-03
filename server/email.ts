import nodemailer from 'nodemailer';

// Configure this with real credentials in production
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.ethereal.email',
  port: parseInt(process.env.SMTP_PORT || '587'),
  auth: {
    user: process.env.SMTP_USER || 'test@ethereal.email',
    pass: process.env.SMTP_PASS || 'pass123',
  },
});

export const sendNotificationEmail = async (to: string, subject: string, text: string) => {
  try {
    const info = await transporter.sendMail({
      from: '"QForm System" <noreply@qform.local>',
      to,
      subject,
      text,
    });
    console.log('[Email] Message sent: %s', info.messageId);
  } catch (error) {
    console.error('[Email] Error sending email:', error);
  }
};
