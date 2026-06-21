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

    // Accessible only to SUPER_ADMIN
    if (session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ success: false, message: 'Forbidden. Super Admin access required.' }, { status: 403 });
    }

    const { code, targetUserId } = await req.json();
    if (!code) {
      return NextResponse.json({ success: false, message: 'Verification code is required.' }, { status: 400 });
    }

    // First verify the SUPER_ADMIN's own code to authorize the disabling action
    const dbAdmin = await db.user.findUnique({
      where: { id: session.user.id }
    });

    if (!dbAdmin || !dbAdmin.totpSecret) {
      return NextResponse.json({ success: false, message: 'Super Admin 2FA is not set up.' }, { status: 400 });
    }

    const isValid = verifyTOTP(code, dbAdmin.totpSecret);
    if (!isValid) {
      return NextResponse.json({ success: false, message: 'Invalid Super Admin verification code' }, { status: 400 });
    }

    // If targetUserId is provided, disable 2FA for another user. Otherwise disable for self.
    const userIdToDisable = targetUserId || session.user.id;

    // Reset TOTP settings in DB
    await db.user.update({
      where: { id: userIdToDisable },
      data: {
        totpEnabled: false,
        totpSecret: null,
        totpVerified: false
      }
    });

    return NextResponse.json({
      success: true,
      message: '2FA disabled successfully.'
    });
  } catch (err) {
    console.error('TOTP disable error:', err);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
