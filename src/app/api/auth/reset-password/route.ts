import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import db from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const { token, email, newPassword } = await req.json();

    if (!token || !email || !newPassword) {
      return NextResponse.json(
        { success: false, message: 'All fields are required.' },
        { status: 400 }
      );
    }

    const trimmedEmail = email.toLowerCase().trim();

    // Validate password strength
    const isMinLength = newPassword.length >= 8;
    const hasUppercase = /[A-Z]/.test(newPassword);
    const hasNumber = /\d/.test(newPassword);
    const hasSpecialChar = /[^A-Za-z0-9]/.test(newPassword);

    if (!isMinLength || !hasUppercase || !hasNumber || !hasSpecialChar) {
      return NextResponse.json(
        {
          success: false,
          message: 'Password must be at least 8 characters long, contain at least 1 uppercase letter, 1 number, and 1 special character.',
        },
        { status: 400 }
      );
    }

    // Hash token to match DB
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find user with valid token and email, and not expired
    const user = await db.user.findFirst({
      where: {
        email: trimmedEmail,
        resetToken: hashedToken,
        resetTokenExpiry: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Link is invalid or expired' },
        { status: 400 }
      );
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user record
    await db.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
        loginAttempts: 0,
        lockUntil: null,
      },
    });

    return NextResponse.json(
      { success: true, message: 'Password updated. Please sign in.' },
      { status: 200 }
    );
  } catch (err) {
    console.error('Reset password error:', err);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
