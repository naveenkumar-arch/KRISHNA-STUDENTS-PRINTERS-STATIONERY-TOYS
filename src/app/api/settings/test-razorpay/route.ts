import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import Razorpay from 'razorpay';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const hasAdminAccess = session && ['SUPER_ADMIN', 'ADMIN', 'MANAGER'].includes(session.user.role);
    
    if (!hasAdminAccess) {
      return NextResponse.json({ success: false, message: 'Unauthorized.' }, { status: 403 });
    }

    const { keyId, secret } = await req.json();

    if (!keyId || !secret) {
      return NextResponse.json({ success: false, message: 'Key ID and Secret are required' }, { status: 400 });
    }

    // If key secret is masked placeholder, we cannot test dynamic input.
    // However, if the user didn't change it, we can fetch from DB.
    let activeSecret = secret;
    if (secret === '••••••••') {
      const db = require('@/lib/db').default;
      const { decryptSettings } = require('@/lib/encryption');
      const settings = await db.paymentSettings.findUnique({ where: { id: 'singleton' } });
      if (settings?.razorpaySecretEncrypted) {
        activeSecret = decryptSettings(settings.razorpaySecretEncrypted);
      } else {
        return NextResponse.json({ success: false, message: 'No stored credentials found to test.' }, { status: 400 });
      }
    }

    // Instantiation
    const instance = new Razorpay({
      key_id: keyId,
      key_secret: activeSecret,
    });

    // Create a ₹1 test order (100 paise)
    const testOrder = await instance.orders.create({
      amount: 100,
      currency: 'INR',
      receipt: `test-${Date.now().toString().slice(-6)}`,
      notes: {
        test: 'true',
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Connection successful',
      orderId: testOrder.id,
    });

  } catch (err: any) {
    console.error('Razorpay connection test error:', err);
    return NextResponse.json({
      success: false,
      message: err.message || 'Failed to connect to Razorpay.'
    }, { status: 400 });
  }
}
