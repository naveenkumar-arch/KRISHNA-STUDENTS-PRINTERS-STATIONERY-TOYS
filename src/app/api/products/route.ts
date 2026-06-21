import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import db from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    
    const q = searchParams.get('q')?.toLowerCase();
    const category = searchParams.get('category');
    const brand = searchParams.get('brand');
    const minPrice = parseFloat(searchParams.get('minPrice') || '0');
    const maxPrice = parseFloat(searchParams.get('maxPrice') || '999999');
    const rating = parseFloat(searchParams.get('rating') || '0');
    const stock = searchParams.get('stock'); // 'in' or 'out'
    const sort = searchParams.get('sort');

    // Build Prisma query condition
    const whereClause: any = {
      isActive: true,
      price: {
        gte: minPrice,
        lte: maxPrice
      },
      rating: {
        gte: rating
      }
    };

    if (category && category !== 'All') {
      whereClause.category = {
        equals: category,
      };
    }

    if (brand) {
      whereClause.brand = {
        equals: brand,
      };
    }

    if (stock === 'in') {
      whereClause.stockQuantity = {
        gt: 0
      };
    } else if (stock === 'out') {
      whereClause.stockQuantity = {
        equals: 0
      };
    }

    // Search query
    if (q) {
      whereClause.OR = [
        { name: { contains: q } },
        { brand: { contains: q } },
        { description: { contains: q } },
        { category: { contains: q } },
        { tags: { contains: q } }
      ];
    }

    // Sort order definition
    let orderBy: any = { createdAt: 'desc' }; // default: newest
    if (sort === 'price_asc') {
      orderBy = { price: 'asc' };
    } else if (sort === 'price_desc') {
      orderBy = { price: 'desc' };
    } else if (sort === 'rating') {
      orderBy = { rating: 'desc' };
    } else if (sort === 'popular') {
      orderBy = { reviewsCount: 'desc' };
    }

    const productsList = await db.product.findMany({
      where: whereClause,
      orderBy,
      include: {
        reviews: true
      }
    });

    // Adapt sqlite schema to frontend compatibility (split tags/images lists)
    const formattedProducts = productsList.map(p => ({
      ...p,
      tags: p.tags ? p.tags.split(',') : [],
      images: p.images ? p.images.split(',') : [],
    }));

    return NextResponse.json({ success: true, products: formattedProducts });

  } catch (err) {
    console.error('Products fetch error:', err);
    return NextResponse.json({ success: false, message: 'Failed to retrieve products' }, { status: 500 });
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
    const { name, description, category, price, originalPrice, stockQuantity, images, brand, tags, specifications, sku } = body;

    // Validation
    if (!name || name.length < 2) {
      return NextResponse.json({ success: false, message: 'Name must be at least 2 characters' }, { status: 400 });
    }
    if (!category || !description) {
      return NextResponse.json({ success: false, message: 'Category and description are required' }, { status: 400 });
    }
    if (isNaN(Number(price)) || price <= 0) {
      return NextResponse.json({ success: false, message: 'Price must be a positive number' }, { status: 400 });
    }
    if (isNaN(Number(stockQuantity)) || stockQuantity < 0) {
      return NextResponse.json({ success: false, message: 'Stock must be a non-negative integer' }, { status: 400 });
    }

    // SKU generation if missing
    const finalSku = sku || `${category.slice(0, 3).toUpperCase()}-${Date.now().toString().slice(-6)}`;

    // Create DB item
    const createdProduct = await db.product.create({
      data: {
        sku: finalSku,
        name,
        description,
        category,
        price: parseFloat(price),
        originalPrice: parseFloat(originalPrice || price),
        stockQuantity: parseInt(stockQuantity),
        images: Array.isArray(images) && images.length > 0 ? images.join(',') : 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=500&auto=format&fit=crop&q=60',
        brand: brand || 'Generic',
        tags: Array.isArray(tags) ? tags.join(',') : '',
        specifications: specifications || {},
        isFeatured: body.isFeatured || false,
        isActive: true,
        rating: 5.0,
        reviewsCount: 0
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Product created successfully', 
      product: {
        ...createdProduct,
        tags: createdProduct.tags ? createdProduct.tags.split(',') : [],
        images: createdProduct.images ? createdProduct.images.split(',') : [],
      }
    });

  } catch (err: any) {
    console.error('Product create error:', err);
    if (err.code === 'P2002') {
      return NextResponse.json({ success: false, message: 'A product with this SKU already exists.' }, { status: 400 });
    }
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
