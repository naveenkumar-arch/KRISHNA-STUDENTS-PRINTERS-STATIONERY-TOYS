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
      console.error('[SECURITY ALERT] Webhook signature verification failed');
      return NextResponse.json({ success: false, message: 'Invalid webhook signature' }, { status: 400 });
    }

    // 2. Parse payload details
    const eventData = JSON.parse(rawBody);
    const event = eventData.event;
    console.log(`[RAZORPAY WEBHOOK] Event received: ${event}`);

    // 3. Handle specific events
    if (event === 'order.paid' || event === 'payment.captured') {
      const paymentEntity = eventData.payload.payment.entity;
      const razorpayOrderId = paymentEntity.order_id;
      const razorpayPaymentId = paymentEntity.id;

      if (razorpayOrderId) {
        const order = await db.order.findUnique({
          where: { razorpayOrderId },
        });

        if (order && order.paymentStatus !== 'Paid') {
          await db.order.update({
            where: { id: order.id },
            data: {
              paymentStatus: 'Paid',
              status: 'Processing',
              razorpayPaymentId,
            },
          });
          console.log(`[WEBHOOK SUCCESS] Order #${order.id} marked as PAID via webhook.`);
        }
      }
    } else if (event === 'payment.failed') {
      const paymentEntity = eventData.payload.payment.entity;
      const razorpayOrderId = paymentEntity.order_id;
      const razorpayPaymentId = paymentEntity.id;

      if (razorpayOrderId) {
        const order = await db.order.findUnique({
          where: { razorpayOrderId },
        });

        if (order && order.paymentStatus === 'Awaiting Payment') {
          // Cancel order and restore stock levels
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
          console.log(`[WEBHOOK FAILURE] Order #${order.id} marked as FAILED via webhook. Stock restored.`);
        }
      }
    } else if (event === 'refund.processed') {
      const refundEntity = eventData.payload.refund.entity;
      const paymentId = refundEntity.payment_id;

      // Find the order that maps to this payment ID
      if (paymentId) {
        const order = await db.order.findUnique({
          where: { razorpayPaymentId: paymentId },
        });

        if (order && order.paymentStatus !== 'Refunded') {
          await db.order.update({
            where: { id: order.id },
            data: {
              paymentStatus: 'Refunded',
              status: 'Refunded',
            },
          });
          console.log(`[WEBHOOK REFUND] Order #${order.id} marked as REFUNDED via webhook.`);
        }
      }
    }

    return NextResponse.json({ success: true, message: 'Webhook processed' }, { status: 200 });

  } catch (err) {
    console.error('Webhook processing error:', err);
    return NextResponse.json({ success: false, message: 'Internal webhook error' }, { status: 500 });
  }
}
