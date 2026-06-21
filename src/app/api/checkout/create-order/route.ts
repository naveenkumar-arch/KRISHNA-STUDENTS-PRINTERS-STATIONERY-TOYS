import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import db from '@/lib/db';
import { decryptSettings } from '@/lib/encryption';
import Razorpay from 'razorpay';

export async function POST(req: NextRequest) {
  try {
    // 1. Session verification
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ success: false, message: 'Unauthorized. Login required.' }, { status: 401 });
    }

    const body = await req.json();
    const { items, address, paymentMethod } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ success: false, message: 'Cart items are required' }, { status: 400 });
    }

    if (!address || !address.name || !address.mobile || !address.flat || !address.street || !address.city || !address.state || !address.pincode) {
      return NextResponse.json({ success: false, message: 'Full shipping address is required' }, { status: 400 });
    }

    // 2. Compute pricing and verify stock
    let subtotal = 0;
    const orderItemsData = [];
    const stockDeductions: { id: string; quantity: number }[] = [];

    for (const item of items) {
      const isServiceItem = item.productId.startsWith('print-') || item.productId.startsWith('service-');
      
      if (isServiceItem) {
        orderItemsData.push({
          productId: item.productId,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          image: item.image || '',
        });
        subtotal += item.price * item.quantity;
      } else {
        let dbProduct = await db.product.findUnique({ where: { id: item.productId } });
        if (!dbProduct) {
          dbProduct = await db.product.findFirst({ where: { name: item.name } });
        }
        if (!dbProduct) {
          return NextResponse.json({ success: false, message: `Product "${item.name}" not found.` }, { status: 404 });
        }

        if (dbProduct.stockQuantity < item.quantity) {
          return NextResponse.json({ 
            success: false, 
            message: `Insufficient stock for ${dbProduct.name}. Available: ${dbProduct.stockQuantity}` 
          }, { status: 400 });
        }

        orderItemsData.push({
          productId: dbProduct.id,
          name: dbProduct.name,
          price: dbProduct.price,
          quantity: item.quantity,
          image: dbProduct.images.split(',')[0] || '',
        });

        stockDeductions.push({
          id: dbProduct.id,
          quantity: item.quantity,
        });

        subtotal += dbProduct.price * item.quantity;
      }
    }

    const deliveryFee = subtotal > 500 ? 0 : 40;
    const total = subtotal + deliveryFee;

    const orderId = `ord-${Date.now().toString().slice(-6)}`;

    // 3. Deduct stock levels immediately to reserve items
    for (const deduction of stockDeductions) {
      await db.product.update({
        where: { id: deduction.id },
        data: { stockQuantity: { decrement: deduction.quantity } }
      });
    }

    // 4. Create the local order in database
    const localOrder = await db.order.create({
      data: {
        id: orderId,
        userId: session.user.id,
        userName: address.name,
        userEmail: session.user.email!,
        subtotal,
        deliveryFee,
        total,
        addressJson: address,
        paymentMethod,
        paymentStatus: paymentMethod === 'COD' ? 'Pending' : 'Awaiting Payment',
        status: 'Pending Confirmation',
        items: {
          create: orderItemsData,
        }
      },
      include: { items: true }
    });

    // 5. COD flow: return local order details directly
    if (paymentMethod === 'COD') {
      return NextResponse.json({
        success: true,
        message: 'Order created successfully (COD)',
        order: localOrder,
      });
    }

    // 6. Razorpay payment integration flow
    // Retrieve PaymentSettings from database
    const settings = await db.paymentSettings.findUnique({
      where: { id: 'singleton' }
    });

    // Use environment variables as fallback if db settings are not found
    const keyId = settings?.razorpayKeyId || process.env.RAZORPAY_KEY_ID || '';
    const encryptedSecret = settings?.razorpaySecretEncrypted || '';
    let secret = process.env.RAZORPAY_KEY_SECRET || '';

    if (encryptedSecret) {
      secret = decryptSettings(encryptedSecret);
    }

    if (!keyId || !secret) {
      return NextResponse.json({
        success: false,
        message: 'Razorpay keys are not configured. Please contact support.'
      }, { status: 500 });
    }

    const instance = new Razorpay({
      key_id: keyId,
      key_secret: secret,
    });

    const amountInPaise = Math.round(total * 100);

    const razorpayOrder = await instance.orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt: orderId,
    });

    // Update local order with Razorpay Order ID
    const updatedOrder = await db.order.update({
      where: { id: orderId },
      data: {
        razorpayOrderId: razorpayOrder.id,
      }
    });

    return NextResponse.json({
      success: true,
      orderId: razorpayOrder.id,
      keyId: keyId,
      amount: amountInPaise,
      localOrderId: orderId,
      order: updatedOrder,
    });

  } catch (err) {
    console.error('Create payment order error:', err);
    return NextResponse.json({ success: false, message: 'Failed to create payment gateway order' }, { status: 500 });
  }
}
