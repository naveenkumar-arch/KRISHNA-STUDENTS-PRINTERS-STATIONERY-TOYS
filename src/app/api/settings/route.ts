import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import db from '@/lib/db';
import { encryptSettings } from '@/lib/encryption';

export async function GET() {
  try {
    const settings = await db.storeSettings.findUnique({
      where: { id: 'singleton' }
    });
    
    const paymentSettings = await db.paymentSettings.findUnique({
      where: { id: 'singleton' }
    });

    const googleConfigured = !!(
      process.env.GOOGLE_CLIENT_ID &&
      process.env.GOOGLE_CLIENT_ID !== 'dummy-google-client-id' &&
      process.env.GOOGLE_CLIENT_ID !== ''
    );
    const responseData: any = { success: true, settings, googleConfigured };
    
    if (paymentSettings) {
      responseData.paymentSettings = {
        id: paymentSettings.id,
        razorpayKeyId: paymentSettings.razorpayKeyId,
        upiId: paymentSettings.upiId,
        merchantName: paymentSettings.merchantName,
        paymentMethods: paymentSettings.paymentMethods,
        razorpaySecret: paymentSettings.razorpaySecretEncrypted ? '••••••••' : '',
        createdAt: paymentSettings.createdAt,
        updatedAt: paymentSettings.updatedAt,
      };
    } else {
      responseData.paymentSettings = {
        razorpayKeyId: '',
        razorpaySecret: '',
        upiId: '',
        merchantName: '',
        paymentMethods: 'cod,razorpay',
      };
    }

    return NextResponse.json(responseData);
  } catch (err) {
    return NextResponse.json({ success: false, message: 'Failed to read settings' }, { status: 500 });
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

    // Check if body is updating Payment Settings
    if (body.razorpayKeyId !== undefined || body.merchantName !== undefined || body.upiId !== undefined) {
      const existingSettings = await db.paymentSettings.findUnique({
        where: { id: 'singleton' }
      });

      let secretEncrypted = existingSettings?.razorpaySecretEncrypted || '';
      if (body.razorpaySecret && body.razorpaySecret !== '••••••••') {
        secretEncrypted = encryptSettings(body.razorpaySecret);
      }

      const updatedPaymentSettings = await db.paymentSettings.upsert({
        where: { id: 'singleton' },
        create: {
          id: 'singleton',
          razorpayKeyId: body.razorpayKeyId || '',
          razorpaySecretEncrypted: secretEncrypted,
          upiId: body.upiId || '',
          merchantName: body.merchantName || '',
          paymentMethods: body.paymentMethods || 'cod,razorpay',
        },
        update: {
          razorpayKeyId: body.razorpayKeyId,
          razorpaySecretEncrypted: secretEncrypted,
          upiId: body.upiId,
          merchantName: body.merchantName,
          paymentMethods: body.paymentMethods,
        }
      });

      return NextResponse.json({
        success: true,
        message: 'Payment settings updated successfully',
        paymentSettings: {
          id: updatedPaymentSettings.id,
          razorpayKeyId: updatedPaymentSettings.razorpayKeyId,
          upiId: updatedPaymentSettings.upiId,
          merchantName: updatedPaymentSettings.merchantName,
          paymentMethods: updatedPaymentSettings.paymentMethods,
          razorpaySecret: updatedPaymentSettings.razorpaySecretEncrypted ? '••••••••' : '',
        }
      });
    }

    // Otherwise, handle regular StoreSettings updates
    if (body.upiMobileNumber && (body.upiMobileNumber.length !== 10 || isNaN(Number(body.upiMobileNumber)))) {
      return NextResponse.json({ success: false, message: 'UPI mobile number must be exactly 10 digits.' }, { status: 400 });
    }

    if (body.whatsappNumber && (body.whatsappNumber.length !== 10 || isNaN(Number(body.whatsappNumber)))) {
      return NextResponse.json({ success: false, message: 'WhatsApp number must be exactly 10 digits.' }, { status: 400 });
    }

    const updateData: any = { ...body };
    if (body.codMinAmount !== undefined) updateData.codMinAmount = parseFloat(body.codMinAmount);
    if (body.codMaxAmount !== undefined) updateData.codMaxAmount = parseFloat(body.codMaxAmount);

    const updatedSettings = await db.storeSettings.update({
      where: { id: 'singleton' },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      message: 'Store settings updated successfully',
      settings: updatedSettings,
    });

  } catch (err) {
    console.error('Settings update error:', err);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}

