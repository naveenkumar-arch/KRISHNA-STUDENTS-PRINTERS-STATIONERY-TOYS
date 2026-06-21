import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import db from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ success: false, message: 'Not authenticated' }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      include: { addresses: true }
    });

    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    if (user.isSuspended) {
      return NextResponse.json({ success: false, message: 'Account is suspended' }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        mobileNumber: user.mobileNumber,
        dob: user.dob,
        gender: user.gender,
        bio: user.bio,
        avatarUrl: user.avatarUrl,
        savedAddresses: user.addresses || [],
        isSuspended: user.isSuspended,
        totpVerified: session.user.totpVerified,
        needsTotpSetup: session.user.needsTotpSetup,
        needsTotpVerify: session.user.needsTotpVerify,
      },
    });
  } catch (err) {
    console.error('Session retrieval error:', err);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
