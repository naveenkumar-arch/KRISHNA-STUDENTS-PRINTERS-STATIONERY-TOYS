import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import bcrypt from 'bcryptjs';
import db from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    // Verify user role
    const userRole = session.user.role;
    const isAdmin = userRole === 'SUPER_ADMIN' || userRole === 'ADMIN';
    if (!isAdmin) {
      return NextResponse.json({ success: false, message: 'Access Denied. Admins only.' }, { status: 403 });
    }

    const { oldPassword, newUsername, newName, newPassword } = await req.json();

    if (!oldPassword) {
      return NextResponse.json({ success: false, message: 'Current password is required to save changes.' }, { status: 400 });
    }

    // Fetch user from DB to compare password
    const user = await db.user.findUnique({
      where: { id: session.user.id }
    });

    if (!user || !user.password) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    // Check old password matches
    const isPasswordCorrect = await bcrypt.compare(oldPassword, user.password);
    if (!isPasswordCorrect) {
      return NextResponse.json({ success: false, message: 'Incorrect current password.' }, { status: 400 });
    }

    const updateData: any = {};

    // Validate and prepare username (email)
    if (newUsername) {
      const emailLower = newUsername.toLowerCase().trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailLower)) {
        return NextResponse.json({ success: false, message: 'Invalid email format.' }, { status: 400 });
      }

      // Check if username is taken
      const existingUser = await db.user.findUnique({
        where: { email: emailLower }
      });
      if (existingUser && existingUser.id !== user.id) {
        return NextResponse.json({ success: false, message: 'Username (email) is already taken.' }, { status: 400 });
      }

      updateData.email = emailLower;
    }

    // Validate and prepare name
    if (newName) {
      const trimmedName = newName.trim();
      if (trimmedName.length < 2 || trimmedName.length > 50) {
        return NextResponse.json({ success: false, message: 'Name must be between 2 and 50 characters.' }, { status: 400 });
      }
      updateData.name = trimmedName;
    }

    // Validate and prepare new password
    if (newPassword) {
      if (newPassword.length < 6) {
        return NextResponse.json({ success: false, message: 'New password must be at least 6 characters long.' }, { status: 400 });
      }
      updateData.password = await bcrypt.hash(newPassword, 12);
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ success: false, message: 'No updates provided.' }, { status: 400 });
    }

    await db.user.update({
      where: { id: user.id },
      data: updateData
    });

    return NextResponse.json({
      success: true,
      message: 'Admin credentials updated successfully!'
    });
  } catch (err) {
    console.error('Admin update credentials error:', err);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
