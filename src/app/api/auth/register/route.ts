import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import db from '@/lib/db';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, isGoogleSignUp } = await req.json();

    const errors: Record<string, string> = {};

    // Validate Name
    if (!name || name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters long.';
    }

    // Validate Email
    if (!email || !EMAIL_REGEX.test(email)) {
      errors.email = 'Please provide a valid email address.';
    }

    // Validate Password strength (skip for Google sign-ups)
    if (!isGoogleSignUp) {
      if (!password) {
        errors.password = 'Password is required.';
      } else {
        const isMinLength = password.length >= 8;
        const hasUppercase = /[A-Z]/.test(password);
        const hasNumber = /\d/.test(password);
        const hasSpecialChar = /[^A-Za-z0-9]/.test(password);

        if (!isMinLength || !hasUppercase || !hasNumber || !hasSpecialChar) {
          errors.password = 'Password must be at least 8 characters long, contain at least 1 uppercase letter, 1 number, and 1 special character.';
        }
      }
    }

    if (Object.keys(errors).length > 0) {
      return NextResponse.json({ success: false, errors }, { status: 400 });
    }

    const emailLower = email.toLowerCase().trim();

    // Block registration if email matches ADMIN_EMAIL
    if (process.env.ADMIN_EMAIL && emailLower === process.env.ADMIN_EMAIL.toLowerCase()) {
      return NextResponse.json(
        { success: false, message: 'This email address is reserved and cannot be registered.' },
        { status: 403 }
      );
    }

    // Check if email exists
    const existingUser = await db.user.findUnique({
      where: { email: emailLower },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, message: 'Email already registered' },
        { status: 409 }
      );
    }

    // Hash password (only for email/password registrations)
    const hashedPassword = password ? await bcrypt.hash(password, 10) : null;

    // Create user
    await db.user.create({
      data: {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        role: 'CUSTOMER',
        isActive: true,
        isSuspended: false,
      },
    });

    return NextResponse.json(
      { success: true, message: 'Account created successfully' },
      { status: 201 }
    );
  } catch (err) {
    console.error('Registration error:', err);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
