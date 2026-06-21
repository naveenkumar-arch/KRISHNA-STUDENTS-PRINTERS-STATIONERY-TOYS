import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { decryptSettings } from '@/lib/encryption';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !orderId) {
      return NextResponse.json({ success: false, message: 'Missing transaction attributes' }, { status: 400 });
    }

    // 1. Retrieve PaymentSettings from database
    const settings = await db.paymentSettings.findUnique({
      where: { id: 'singleton' }
    });

    const encryptedSecret = settings?.razorpaySecretEncrypted || '';
    let secret = process.env.RAZORPAY_KEY_SECRET || '';

    if (encryptedSecret) {
      secret = decryptSettings(encryptedSecret);
    }

    if (!secret) {
      return NextResponse.json({ success: false, message: 'Payment gateway configuration is missing.' }, { status: 500 });
    }

    // 2. Compute signature
    const text = razorpay_order_id + '|' + razorpay_payment_id;
    const generatedSignature = crypto
      .createHmac('sha256', secret)
      .update(text)
      .digest('hex');

    // 3. Compare signatures
    if (generatedSignature !== razorpay_signature) {
      console.error(`[SECURITY ALERT] Signature mismatch on local order ${orderId}`);
      return NextResponse.json({ success: false, message: 'Invalid payment signature. Verification failed.' }, { status: 400 });
    }

    // 4. Update order payment status
    const updatedOrder = await db.order.update({
      where: { id: orderId },
      data: {
        paymentStatus: 'Paid',
        status: 'Processing',
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
      }
    });

    console.log(`[PAYMENT VERIFIED] Order #${orderId} has been successfully paid.`);

    return NextResponse.json({
      success: true,
      message: 'Payment verified successfully',
      order: updatedOrder,
    });

  } catch (err) {
    console.error('Payment verification error:', err);
    return NextResponse.json({ success: false, message: 'Internal server error during verification' }, { status: 500 });
  }
}
