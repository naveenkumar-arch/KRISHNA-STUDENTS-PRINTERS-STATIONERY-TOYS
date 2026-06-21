import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import db from '@/lib/db';
import { sendMail, getResetPasswordTemplate } from '@/lib/mailer';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ success: true, message: 'If this email is registered, you will receive a reset link.' });
    }

    const trimmedEmail = email.toLowerCase().trim();

    // Find user silently
    const user = await db.user.findUnique({
      where: { email: trimmedEmail },
    });

    // If not found or OAuth-only user (no password set)
    if (!user || !user.password) {
      return NextResponse.json({ success: true, message: 'If this email is registered, you will receive a reset link.' });
    }

    // Cooldown check (60 seconds)
    const now = new Date();
    if (user.lastResetRequest) {
      const diffMs = now.getTime() - new Date(user.lastResetRequest).getTime();
      const diffSec = diffMs / 1000;
      if (diffSec < 60) {
        // Enforce cooldown silently to prevent spam
        return NextResponse.json({ success: true, message: 'If this email is registered, you will receive a reset link.' });
      }
    }

    // Generate secure token
    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
    const tokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour validity

    // Update user record
    await db.user.update({
      where: { id: user.id },
      data: {
        resetToken: hashedToken,
        resetTokenExpiry: tokenExpiry,
        lastResetRequest: now,
      },
    });

    // Build absolute URL for reset password page
    const origin = req.nextUrl.origin;
    const resetUrl = `${origin}/auth/reset-password?token=${rawToken}&email=${encodeURIComponent(trimmedEmail)}`;

    // Dispatch email
    const emailBody = getResetPasswordTemplate(resetUrl);
    await sendMail({
      to: trimmedEmail,
      subject: 'Reset Your Password - Krishna Stationery',
      html: emailBody,
    });

    return NextResponse.json({ success: true, message: 'If this email is registered, you will receive a reset link.' });
  } catch (err) {
    // Log the error internally but do not expose it
    console.error('Forgot password processing error:', err);
    return NextResponse.json({ success: true, message: 'If this email is registered, you will receive a reset link.' });
  }
}
