import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { pagesCount, paperSize, colorType, bindingType, copiesCount } = body;

    // Validate inputs
    const pages = Math.max(1, parseInt(pagesCount) || 1);
    const copies = Math.max(1, parseInt(copiesCount) || 1);
    const size = paperSize || 'A4'; // A4, A3, Legal
    const color = colorType || 'BW'; // BW, Color
    const binding = bindingType || 'None'; // None, Spiral, Soft, Hard

    // Pricing grid setup
    let pricePerPage = 1; // Default A4 BW

    if (size === 'A4') {
      pricePerPage = color === 'Color' ? 10 : 1;
    } else if (size === 'A3') {
      pricePerPage = color === 'Color' ? 20 : 3;
    } else if (size === 'Legal') {
      pricePerPage = color === 'Color' ? 15 : 2;
    }

    let bindingCost = 0;
    if (binding === 'Spiral') {
      bindingCost = 50;
    } else if (binding === 'Soft') {
      bindingCost = 100;
    } else if (binding === 'Hard') {
      bindingCost = 200;
    }

    const unitCost = (pages * pricePerPage) + bindingCost;
    const totalCost = unitCost * copies;

    return NextResponse.json({
      success: true,
      unitPrice: unitCost,
      totalPrice: totalCost,
      breakdown: {
        pages,
        pricePerPage,
        bindingCost,
        copies,
        size,
        color,
        binding
      }
    });

  } catch (err) {
    console.error('Print cost calculation error:', err);
    return NextResponse.json({ success: false, message: 'Pricing calculation failed' }, { status: 500 });
  }
}
