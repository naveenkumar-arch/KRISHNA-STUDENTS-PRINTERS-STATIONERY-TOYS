import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import db from '@/lib/db';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const product = await db.product.findUnique({
      where: { id, isActive: true },
      include: { reviews: true }
    });

    if (!product) {
      return NextResponse.json({ success: false, message: 'Product not found' }, { status: 404 });
    }

    const formattedProduct = {
      ...product,
      tags: product.tags ? product.tags.split(',') : [],
      images: product.images ? product.images.split(',') : [],
    };

    return NextResponse.json({ success: true, product: formattedProduct });
  } catch (err) {
    return NextResponse.json({ success: false, message: 'Failed to retrieve product details' }, { status: 500 });
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
    const product = await db.product.findUnique({
      where: { id },
    });

    if (!product) {
      return NextResponse.json({ success: false, message: 'Product not found' }, { status: 404 });
    }

    // Process array updates into string format
    const updateData: any = { ...body };
    if (body.price !== undefined) updateData.price = parseFloat(body.price);
    if (body.originalPrice !== undefined) updateData.originalPrice = parseFloat(body.originalPrice);
    if (body.stockQuantity !== undefined) updateData.stockQuantity = parseInt(body.stockQuantity);
    if (Array.isArray(body.images)) updateData.images = body.images.join(',');
    if (Array.isArray(body.tags)) updateData.tags = body.tags.join(',');

    const updatedProduct = await db.product.update({
      where: { id },
      data: updateData,
    });

    const formattedProduct = {
      ...updatedProduct,
      tags: updatedProduct.tags ? updatedProduct.tags.split(',') : [],
      images: updatedProduct.images ? updatedProduct.images.split(',') : [],
    };

    return NextResponse.json({ success: true, message: 'Product updated successfully', product: formattedProduct });
  } catch (err) {
    console.error('Product update error:', err);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    const hasAdminAccess = session && ['SUPER_ADMIN', 'ADMIN', 'MANAGER'].includes(session.user.role);
    
    if (!hasAdminAccess) {
      return NextResponse.json({ success: false, message: 'Unauthorized. Administrative credentials required.' }, { status: 403 });
    }

    const product = await db.product.findUnique({
      where: { id },
    });

    if (!product) {
      return NextResponse.json({ success: false, message: 'Product not found' }, { status: 404 });
    }

    // Soft delete to maintain historical orders integrity
    await db.product.update({
      where: { id },
      data: { isActive: false }
    });

    return NextResponse.json({ success: true, message: 'Product deleted successfully (soft delete)' });
  } catch (err) {
    console.error('Product delete error:', err);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
