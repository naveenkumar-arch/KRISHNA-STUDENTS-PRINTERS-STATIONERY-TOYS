import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { verifyTOTP } from '@/lib/totp';
import db from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const isAdmin = ['SUPER_ADMIN', 'ADMIN'].includes(session.user.role);
    if (!isAdmin) {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    const { code } = await req.json();
    if (!code || code.length !== 6 || isNaN(Number(code))) {
      return NextResponse.json({ success: false, message: 'Invalid code format. Must be 6 digits.' }, { status: 400 });
    }

    const dbUser = await db.user.findUnique({
      where: { id: session.user.id }
    });

    if (!dbUser || !dbUser.totpSecret) {
      return NextResponse.json({ success: false, message: 'TOTP setup not found for this user.' }, { status: 404 });
    }

    const isValid = verifyTOTP(code, dbUser.totpSecret);
    if (!isValid) {
      // Log login failure
      await db.loginLog.create({
        data: {
          userId: dbUser.id,
          ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1',
          device: req.headers.get('user-agent') || 'Unknown Device',
          status: 'FAILED_2FA'
        }
      });
      return NextResponse.json({ success: false, message: 'Invalid 2FA verification code' }, { status: 400 });
    }

    // Set totpVerified = true in database
    await db.user.update({
      where: { id: dbUser.id },
      data: { totpVerified: true }
    });

    // Save success log
    await db.loginLog.create({
      data: {
        userId: dbUser.id,
        ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1',
        device: req.headers.get('user-agent') || 'Unknown Device',
        status: 'SUCCESS'
      }
    });

    return NextResponse.json({
      success: true,
      message: 'TOTP verified successfully!'
    });
  } catch (err) {
    console.error('TOTP verify error:', err);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
