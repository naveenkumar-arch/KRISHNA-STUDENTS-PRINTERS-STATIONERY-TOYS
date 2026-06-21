import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import db from '@/lib/db';

export async function GET() {
  try {
    const gallery = await db.galleryItem.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json({ success: true, gallery });
  } catch (err) {
    return NextResponse.json({ success: false, message: 'Failed to fetch gallery' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const hasAdminAccess = session && ['SUPER_ADMIN', 'ADMIN', 'MANAGER'].includes(session.user.role);
    
    if (!hasAdminAccess) {
      return NextResponse.json({ success: false, message: 'Unauthorized. Administrative credentials required.' }, { status: 403 });
    }

    const body = await req.json();
    const { imageUrl, category, caption } = body;

    if (!imageUrl || !category) {
      return NextResponse.json({ success: false, message: 'Image URL and category are required' }, { status: 400 });
    }

    const newItem = await db.galleryItem.create({
      data: {
        imageUrl,
        category,
        caption: caption || ''
      }
    });

    return NextResponse.json({ success: true, message: 'Gallery image added successfully', item: newItem });
  } catch (err) {
    console.error('Gallery add error:', err);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const hasAdminAccess = session && ['SUPER_ADMIN', 'ADMIN', 'MANAGER'].includes(session.user.role);
    
    if (!hasAdminAccess) {
      return NextResponse.json({ success: false, message: 'Unauthorized. Administrative credentials required.' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, message: 'Image ID is required' }, { status: 400 });
    }

    const item = await db.galleryItem.findUnique({
      where: { id }
    });

    if (!item) {
      return NextResponse.json({ success: false, message: 'Gallery item not found' }, { status: 404 });
    }

    await db.galleryItem.delete({
      where: { id }
    });

    return NextResponse.json({ success: true, message: 'Gallery image deleted successfully' });
  } catch (err) {
    console.error('Gallery delete error:', err);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
