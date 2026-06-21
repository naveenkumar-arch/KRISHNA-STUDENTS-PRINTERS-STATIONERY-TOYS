import nodemailer from 'nodemailer';

interface SendMailParams {
  to: string;
  subject: string;
  html: string;
}

export async function sendMail({ to, subject, html }: SendMailParams) {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || '"Krishna Stationery" <noreply@krishnastationery.com>';

  // Fallback to console in development if SMTP vars are missing
  if (!host || !port || !user || !pass) {
    console.log('\n==================================================');
    console.log('📧 SMTP configuration missing. Logging email to console:');
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log('--------------------------------------------------');
    console.log('HTML Body:');
    console.log(html);
    console.log('==================================================\n');
    return { messageId: 'dev-mode-logged-to-console' };
  }

  const transporter = nodemailer.createTransport({
    host,
    port: parseInt(port),
    secure: parseInt(port) === 465, // true for 465, false for other ports
    auth: {
      user,
      pass,
    },
  });

  const info = await transporter.sendMail({
    from,
    to,
    subject,
    html,
  });

  return info;
}

export function getResetPasswordTemplate(resetUrl: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Reset Your Password</title>
      </head>
      <body style="font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 40px 0; -webkit-font-smoothing: antialiased;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 20px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 10px 15px -3px rgba(0, 0, 0, 0.1); overflow: hidden; border: 1px solid #e2e8f0;">
          
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%); padding: 32px; text-align: center;">
            <div style="display: inline-block; background-color: rgba(255, 255, 255, 0.15); padding: 12px; border-radius: 16px; margin-bottom: 12px;">
              <span style="font-size: 28px;">🔑</span>
            </div>
            <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.025em;">Krishna Stationery</h1>
          </div>

          <!-- Body -->
          <div style="padding: 40px 32px;">
            <h2 style="color: #1e293b; margin-top: 0; margin-bottom: 16px; font-size: 20px; font-weight: 700;">Reset your password</h2>
            <p style="color: #475569; font-size: 16px; line-height: 1.625; margin-bottom: 24px;">
              We received a request to reset the password for your account. Click the button below to choose a new password. This link is only valid for <strong>1 hour</strong>.
            </p>
            
            <!-- Button -->
            <div style="text-align: center; margin: 32px 0;">
              <a href="${resetUrl}" style="display: inline-block; background-color: #7c3aed; color: #ffffff; padding: 14px 30px; font-size: 16px; font-weight: 700; text-decoration: none; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(124, 58, 237, 0.3), 0 2px 4px -1px rgba(124, 58, 237, 0.1); transition: all 0.2s ease;">
                Reset Password
              </a>
            </div>

            <p style="color: #94a3b8; font-size: 14px; line-height: 1.5; margin-bottom: 0;">
              If the button doesn't work, copy and paste this link into your web browser:
            </p>
            <p style="word-break: break-all; margin-top: 8px; margin-bottom: 0;">
              <a href="${resetUrl}" style="color: #7c3aed; font-size: 14px; text-decoration: underline;">${resetUrl}</a>
            </p>
          </div>

          <!-- Footer -->
          <div style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 24px 32px; text-align: center;">
            <p style="color: #64748b; font-size: 14px; margin: 0 0 8px 0; font-weight: 500;">
              Didn't request this? You can safely ignore this email.
            </p>
            <p style="color: #94a3b8; font-size: 12px; margin: 0;">
              &copy; 2026 Krishna Stationery. All rights reserved.
            </p>
          </div>

        </div>
      </body>
    </html>
  `;
}
