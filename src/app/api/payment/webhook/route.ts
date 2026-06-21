import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-razorpay-signature');

    if (!signature) {
      return NextResponse.json({ success: false, message: 'Missing webhook signature header' }, { status: 400 });
    }

    // 1. Authenticate webhook signature
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET || 'dummyWebhookSecret123';
    const generatedSignature = crypto
      .createHmac('sha256', secret)
      .update(rawBody)
      .digest('hex');

    if (generatedSignature !== signature) {
      console.error('[SECURITY ALERT] Unauthorized Razorpay Webhook Call - Signature Mismatch');
      return NextResponse.json({ success: false, message: 'Invalid webhook signature' }, { status: 400 });
    }

    // 2. Parse payload details
    const eventData = JSON.parse(rawBody);
    console.log(`[RAZORPAY WEBHOOK] Event received: ${eventData.event}`);

    // Handle order paid or payment captured event
    if (eventData.event === 'order.paid' || eventData.event === 'payment.captured') {
      const paymentEntity = eventData.payload.payment.entity;
      const razorpayOrderId = paymentEntity.order_id;
      const razorpayPaymentId = paymentEntity.id;

      if (razorpayOrderId) {
        // Find order in DB
        const order = await db.order.findUnique({
          where: { razorpayOrderId },
        });

        if (order && order.paymentStatus !== 'Paid') {
          // Update status to Paid
          await db.order.update({
            where: { id: order.id },
            data: {
              paymentStatus: 'Paid',
              status: 'Processing',
              razorpayPaymentId,
            },
          });

          // Trigger logs/notifications
          const settings = await db.storeSettings.findUnique({ where: { id: 'singleton' } });
          if (settings) {
            console.warn(`[WEBHOOK EMAIL] To: ${settings.adminEmail} | Subject: Webhook Payment Captures #${order.id} | Amount: ₹${order.total}`);
            console.warn(`[WEBHOOK EMAIL] To: ${order.userEmail} | Subject: Payment Confirmed #${order.id} | Status: Processing`);
          }
        }
      }
    } else if (eventData.event === 'payment.failed') {
      const paymentEntity = eventData.payload.payment.entity;
      const razorpayOrderId = paymentEntity.order_id;
      const razorpayPaymentId = paymentEntity.id;

      if (razorpayOrderId) {
        const order = await db.order.findUnique({
          where: { razorpayOrderId },
        });

        if (order && order.paymentStatus === 'Pending') {
          // Mark payment failed, cancel order and restore stock levels
          await db.order.update({
            where: { id: order.id },
            data: {
              paymentStatus: 'Failed',
              status: 'Cancelled',
              razorpayPaymentId,
            },
          });

          // Restore stock
          const orderItems = await db.orderItem.findMany({ where: { orderId: order.id } });
          for (const item of orderItems) {
            if (item.productId && !item.productId.startsWith('print-') && !item.productId.startsWith('service-')) {
              await db.product.update({
                where: { id: item.productId },
                data: { stockQuantity: { increment: item.quantity } }
              });
            }
          }

          console.warn(`[WEBHOOK EMAIL ALERT] To: ${order.userEmail} | Subject: Order Payment Failed #${order.id} | Info: Payment failed. Stock restored.`);
        }
      }
    }

    return NextResponse.json({ status: 'success' }, { status: 200 });

  } catch (err) {
    console.error('Razorpay webhook handler error:', err);
    return NextResponse.json({ success: false, message: 'Webhook processing error' }, { status: 500 });
  }
}
