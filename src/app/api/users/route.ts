import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import db from '@/lib/db';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const hasAdminAccess = session && ['SUPER_ADMIN', 'ADMIN', 'MANAGER'].includes(session.user.role);

    if (!hasAdminAccess) {
      return NextResponse.json({ success: false, message: 'Unauthorized. Administrative credentials required.' }, { status: 403 });
    }

    // Load users (hide passwords and TOTP secrets)
    const usersList = await db.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        mobileNumber: true,
        dob: true,
        gender: true,
        bio: true,
        avatarUrl: true,
        isSuspended: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({ success: true, users: usersList });
  } catch (err) {
    console.error('Users query error:', err);
    return NextResponse.json({ success: false, message: 'Failed to retrieve users' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const hasAdminAccess = session && ['SUPER_ADMIN', 'ADMIN', 'MANAGER'].includes(session.user.role);

    if (!hasAdminAccess) {
      return NextResponse.json({ success: false, message: 'Unauthorized. Administrative credentials required.' }, { status: 403 });
    }

    const body = await req.json();
    const { userId, isSuspended, role } = body;

    if (!userId) {
      return NextResponse.json({ success: false, message: 'User ID is required' }, { status: 400 });
    }

    const user = await db.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    // Protection for primary system administrator from self-suspension or lockouts
    const isPrimaryAdmin = user.email === 'admin@krishna.com';
    if (isPrimaryAdmin && isSuspended === true) {
      return NextResponse.json({ success: false, message: 'Cannot suspend primary system administrator account' }, { status: 400 });
    }

    const updateData: any = {};
    if (isSuspended !== undefined) {
      updateData.isSuspended = isSuspended;
    }

    if (role) {
      const validRoles = ['CUSTOMER', 'SUPER_ADMIN', 'ADMIN', 'MANAGER'];
      if (!validRoles.includes(role)) {
        return NextResponse.json({ success: false, message: 'Invalid role assignment' }, { status: 400 });
      }
      updateData.role = role;
    }

    const updatedUser = await db.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        mobileNumber: true,
        dob: true,
        gender: true,
        bio: true,
        avatarUrl: true,
        isSuspended: true,
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: 'User status updated successfully', 
      user: updatedUser 
    });
  } catch (err) {
    console.error('User update error:', err);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
