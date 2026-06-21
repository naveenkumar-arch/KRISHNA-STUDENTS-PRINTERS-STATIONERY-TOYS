import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import db from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');

    const whereClause: any = {};

    // Check roles
    const isAdmin = ['SUPER_ADMIN', 'ADMIN', 'MANAGER'].includes(session.user.role);
    if (!isAdmin) {
      whereClause.userId = session.user.id;
    }

    if (status && status !== 'All') {
      whereClause.status = {
        equals: status
      };
    }

    const orders = await db.order.findMany({
      where: whereClause,
      include: {
        items: true
      },
      orderBy: {
        date: 'desc'
      }
    });

    return NextResponse.json({ success: true, orders });
  } catch (err) {
    console.error('Fetch orders error:', err);
    return NextResponse.json({ success: false, message: 'Failed to retrieve orders' }, { status: 500 });
  }
}
