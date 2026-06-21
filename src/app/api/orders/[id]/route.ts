import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import db from '@/lib/db';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const order = await db.order.findUnique({
      where: { id },
      include: { items: true }
    });

    if (!order) {
      return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 });
    }

    // Verify access rights
    const isAdmin = ['SUPER_ADMIN', 'ADMIN', 'MANAGER'].includes(session.user.role);
    if (!isAdmin && order.userId !== session.user.id) {
      return NextResponse.json({ success: false, message: 'Forbidden. Access denied.' }, { status: 403 });
    }

    return NextResponse.json({ success: true, order });
  } catch (err) {
    return NextResponse.json({ success: false, message: 'Failed to retrieve order details' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    const hasAdminAccess = session && ['SUPER_ADMIN', 'ADMIN', 'MANAGER'].includes(session.user.role);
    
    if (!hasAdminAccess) {
      return NextResponse.json({ success: false, message: 'Unauthorized. Administrative credentials required.' }, { status: 403 });
    }

    const body = await req.json();
    const { status, paymentStatus } = body;

    const order = await db.order.findUnique({
      where: { id },
      include: { items: true }
    });

    if (!order) {
      return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 });
    }

    const updateData: any = {};

    // 1. Order Status Updates
    if (status) {
      const validStatuses = ['Pending Confirmation', 'Processing', 'Packed', 'Shipped', 'Delivered', 'Cancelled', 'Refunded'];
      if (!validStatuses.includes(status)) {
        return NextResponse.json({ success: false, message: 'Invalid order status transition' }, { status: 400 });
      }
      updateData.status = status;

      // Restoring stock levels if order is cancelled or refunded
      const isCancelledOrRefunded = ['Cancelled', 'Refunded'].includes(status);
      const isPriorStatusActive = !['Cancelled', 'Refunded'].includes(order.status);
      
      if (isCancelledOrRefunded && isPriorStatusActive) {
        for (const item of order.items) {
          if (item.productId) {
            await db.product.update({
              where: { id: item.productId },
              data: { stockQuantity: { increment: item.quantity } }
            });
          }
        }
      }

      // COD order delivery auto-approves payment status to Paid
      if (status === 'Delivered' && order.paymentMethod === 'COD') {
        updateData.paymentStatus = 'Paid';
      }
    }

    // 2. Payment Status Updates (prevent manual confirmation of online orders to Paid)
    if (paymentStatus) {
      const validPaymentStatuses = ['Pending', 'Awaiting Payment', 'Paid', 'Failed', 'Refunded'];
      if (!validPaymentStatuses.includes(paymentStatus)) {
        return NextResponse.json({ success: false, message: 'Invalid payment status' }, { status: 400 });
      }

      // Check online payment restrictions
      if (paymentStatus === 'Paid' && order.paymentMethod !== 'COD' && order.paymentStatus !== 'Paid') {
        return NextResponse.json({ 
          success: false, 
          message: 'Security constraint violation. Online gateway payments cannot be set to Paid manually. They must be verified via Razorpay.' 
        }, { status: 400 });
      }

      updateData.paymentStatus = paymentStatus;
    }

    const updatedOrder = await db.order.update({
      where: { id },
      data: updateData,
      include: { items: true }
    });

    // Notify user of order transitions
    console.warn(`[EMAIL ALERT] To: ${order.userEmail} | Subject: Order Status Update #${order.id} | Info: Your order is now in status: ${updatedOrder.status}. Payment status: ${updatedOrder.paymentStatus}.`);

    return NextResponse.json({ 
      success: true, 
      message: 'Order updated successfully', 
      order: updatedOrder 
    });

  } catch (err) {
    console.error('Order update error:', err);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
