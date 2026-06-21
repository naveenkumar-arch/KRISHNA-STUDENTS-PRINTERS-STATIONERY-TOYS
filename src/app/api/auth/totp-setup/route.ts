import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { generateSecret, generateURI } from 'otplib';
import { verifyTOTP } from '@/lib/totp';
import db from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const isAdmin = ['SUPER_ADMIN', 'ADMIN'].includes(session.user.role);
    if (!isAdmin) {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    // Generate secret and keyuri
    const secret = generateSecret();
    const keyuri = generateURI({
      strategy: 'totp',
      label: session.user.email || '',
      issuer: 'Krishna Stationery',
      secret
    });

    return NextResponse.json({
      success: true,
      secret,
      keyuri
    });
  } catch (err) {
    console.error('TOTP setup GET error:', err);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}

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

    const { secret, code } = await req.json();
    if (!secret || !code) {
      return NextResponse.json({ success: false, message: 'Secret and code are required' }, { status: 400 });
    }

    // Verify code against secret using verifyTOTP
    const isValid = verifyTOTP(code, secret);
    if (!isValid) {
      return NextResponse.json({ success: false, message: 'Invalid verification code. Please try scanning the QR code again.' }, { status: 400 });
    }

    // Save secret to database and enable TOTP
    await db.user.update({
      where: { id: session.user.id },
      data: {
        totpSecret: secret,
        totpEnabled: true,
        totpVerified: true
      }
    });

    // Log the successful setup
    await db.loginLog.create({
      data: {
        userId: session.user.id,
        ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1',
        device: req.headers.get('user-agent') || 'Unknown Device',
        status: 'SUCCESS'
      }
    });

    return NextResponse.json({
      success: true,
      message: '2FA setup completed successfully!'
    });
  } catch (err) {
    console.error('TOTP setup POST error:', err);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
