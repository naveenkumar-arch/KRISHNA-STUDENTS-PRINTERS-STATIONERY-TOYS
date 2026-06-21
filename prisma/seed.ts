import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Clean old records
  await prisma.loginLog.deleteMany({});
  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.review.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.galleryItem.deleteMany({});
  await prisma.storeSettings.deleteMany({});
  await prisma.paymentSettings.deleteMany({});
  await prisma.address.deleteMany({});
  await prisma.user.deleteMany({});

  // 1. Create Users
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@krishnastudents.com';
  const adminRawPassword = process.env.ADMIN_PASSWORD || 'admin123';
  const adminPassword = await bcrypt.hash(adminRawPassword, 12);
  const customerPassword = await bcrypt.hash('customer123', 10);

  const admin = await prisma.user.create({
    data: {
      email: adminEmail,
      password: adminPassword,
      name: 'Krishna Admin',
      role: 'SUPER_ADMIN',
      mobileNumber: '8900989005',
      totpEnabled: false,
      totpVerified: false,
      isActive: true,
    },
  });

  const customer = await prisma.user.create({
    data: {
      email: 'customer@gmail.com',
      password: customerPassword,
      name: 'Naveen Kumar',
      role: 'CUSTOMER',
      mobileNumber: '9876543210',
      dob: '1998-05-15',
      gender: 'Male',
      bio: 'Avid writer, planner collector, and school supply enthusiast.',
      addresses: {
        create: [
          {
            name: 'Naveen Kumar',
            mobile: '9876543210',
            email: 'customer@gmail.com',
            flat: 'Flat No. 3B, Sunshine Apartments',
            street: 'Medavakkam High Road',
            landmark: 'Near Vels Global School',
            city: 'Chennai',
            state: 'Tamil Nadu',
            pincode: '600100',
            isDefault: true,
          },
        ],
      },
    },
  });

  console.log(`Admin seeded: ${admin.email}`);
  console.log('Users seeded successfully:', { admin: admin.email, customer: customer.email });

  const testEmails = [
    'kupendrankupendran391@gmail.com',
    'k.naveenkumarnaveenkumar22@gmail.com',
    'nv01110612@gmail.com'
  ];

  for (const email of testEmails) {
    await prisma.user.create({
      data: {
        email,
        password: customerPassword,
        name: 'Test User',
        role: 'CUSTOMER',
        mobileNumber: '9876543210',
        dob: '1998-05-15',
        gender: 'Male',
        bio: 'Test user account.',
        addresses: {
          create: [
            {
              name: 'Test User',
              mobile: '9876543210',
              email,
              flat: 'Flat No. 3B, Sunshine Apartments',
              street: 'Medavakkam High Road',
              landmark: 'Near Vels Global School',
              city: 'Chennai',
              state: 'Tamil Nadu',
              pincode: '600100',
              isDefault: true,
            },
          ],
        },
      },
    });
  }
  console.log('Test emails seeded successfully.');

  // 2. Create Products
  const products = [
    {
      sku: 'CLASSMATE-NOTEBOOK-PACK6',
      name: 'Classmate Long Notebook (Ruled, 172 Pages) - Pack of 6',
      description: 'High-quality ruled notebooks perfect for school exercises, project notes, and general writing. Made with eco-friendly elemental chlorine-free paper.',
      category: 'School Supplies',
      price: 280,
      originalPrice: 360,
      stockQuantity: 45,
      brand: 'Classmate',
      tags: ['notebook', 'ruled', 'student', 'school'],
      specifications: {
        'Pages': '172 Pages per book',
        'Ruling Type': 'Single Line Ruled',
        'Dimensions': '24cm x 18cm',
        'Paper Quality': '58 GSM'
      },
      images: [
        'https://images.unsplash.com/photo-1544816155-12df9643f363?w=500&auto=format&fit=crop&q=60',
        'https://images.unsplash.com/photo-1531346878377-a5be20888e57?w=500&auto=format&fit=crop&q=60'
      ],
      isFeatured: true,
      isActive: true,
      rating: 4.8,
      reviewsCount: 2,
    },
    {
      sku: 'REYNOLDS-TRIMAX-BLUE3',
      name: 'Reynolds Trimax Gold Liquid Gel Pen (Blue, Pack of 3)',
      description: 'Enjoy feather-light writing with the Reynolds Trimax Liquid Gel Pen. Special fluid ink system guarantees skip-free writing and waterproof longevity.',
      category: 'Writing Materials',
      price: 150,
      originalPrice: 180,
      stockQuantity: 120,
      brand: 'Reynolds',
      tags: ['pen', 'gel pen', 'trimax', 'writing', 'blue ink'],
      specifications: {
        'Ink Color': 'Blue',
        'Tip Size': '0.5 mm',
        'Features': 'Waterproof Ink, Refillable',
        'Body Material': 'Plastic with Gold accents'
      },
      images: [
        'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=500&auto=format&fit=crop&q=60',
        'https://images.unsplash.com/photo-1569003339405-ea396a5a8a90?w=500&auto=format&fit=crop&q=60'
      ],
      isFeatured: true,
      isActive: true,
      rating: 4.9,
      reviewsCount: 1,
    },
    {
      sku: 'DOMS-AQUA-SKETCH24',
      name: 'Doms Aqua Non-Toxic Water Color Pens (24 Shades)',
      description: 'Bright and vibrant watercolor sketch pens with high-grade food color inks. Perfect for drawing, sketching, and coloring activities. Child-safe and non-toxic.',
      category: 'Art & Craft',
      price: 120,
      originalPrice: 150,
      stockQuantity: 30,
      brand: 'Doms',
      tags: ['color pens', 'sketch pens', 'art supplies', 'kids coloring'],
      specifications: {
        'Shades': '24 Assorted Shades',
        'Ink Type': 'Water-based, non-toxic',
        'Safety Certification': 'EN-71 Certified'
      },
      images: [
        'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=500&auto=format&fit=crop&q=60'
      ],
      isFeatured: false,
      isActive: true,
      rating: 4.5,
      reviewsCount: 0,
    },
    {
      sku: 'FABER-PASTELS-36',
      name: 'Faber-Castell Creative Studio Oil Pastels (36 Colors)',
      description: 'Vibrant, thick pastels that offer smooth laydown and easy blending. Perfect for building secondary colors, scraping techniques, and multi-color overlay.',
      category: 'Art & Craft',
      price: 250,
      originalPrice: 320,
      stockQuantity: 25,
      brand: 'Faber-Castell',
      tags: ['pastels', 'oil pastels', 'crayons', 'drawing', 'blending'],
      specifications: {
        'Colors': '36 rich color sticks',
        'Includes': 'Scraping tool & blending guide',
        'Material': 'Wax-based organic colors'
      },
      images: [
        'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=500&auto=format&fit=crop&q=60'
      ],
      isFeatured: true,
      isActive: true,
      rating: 4.7,
      reviewsCount: 0,
    },
    {
      sku: 'TEDDY-PINK-40CM',
      name: 'Premium Plush Teddy Bear (Pink, 40 cm)',
      description: 'Super soft, huggable pink teddy bear with a beautiful satin ribbon. High-quality stuffing ensures shape retention. Made with child-friendly non-allergenic fabrics.',
      category: 'Toys',
      price: 499,
      originalPrice: 799,
      stockQuantity: 15,
      brand: 'SoftToys',
      tags: ['teddy bear', 'plush toy', 'gifts', 'soft toys', 'kids'],
      specifications: {
        'Color': 'Soft Pink',
        'Height': '40 cm',
        'Material': 'Polyester fiber plush'
      },
      images: [
        'https://images.unsplash.com/photo-1559251606-c623743a6d76?w=500&auto=format&fit=crop&q=60'
      ],
      isFeatured: true,
      isActive: true,
      rating: 4.6,
      reviewsCount: 0,
    },
    {
      sku: 'EDU-BLOCKS-120PC',
      name: 'Educational Construction Blocks Set (120 Pieces)',
      description: 'Develop motor skills, logic, and creativity in children. Assorted colors and shapes of locking blocks. Includes simple builder guide manual.',
      category: 'Toys',
      price: 350,
      originalPrice: 450,
      stockQuantity: 20,
      brand: 'BuildIt',
      tags: ['blocks', 'educational', 'creative toys', 'puzzle', 'legos'],
      specifications: {
        'Piece Count': '120 pieces',
        'Age Recommendation': '3+ years',
        'Material': 'BPA-free ABS plastic'
      },
      images: [
        'https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=500&auto=format&fit=crop&q=60'
      ],
      isFeatured: false,
      isActive: true,
      rating: 4.4,
      reviewsCount: 0,
    },
    {
      sku: 'JK-A4-75GSM-500',
      name: 'JK Easy Copier A4 Paper Bundle (75 GSM, 500 Sheets)',
      description: 'Excellent brightness and high-opacity office copier papers. Ideal for double-sided photocopy, color printing, and general printer runs without paper jams.',
      category: 'Office Supplies',
      price: 330,
      originalPrice: 380,
      stockQuantity: 60,
      brand: 'JK Paper',
      tags: ['copier', 'a4 paper', 'office paper', 'printing bundle'],
      specifications: {
        'Size': 'A4 (210mm x 297mm)',
        'GSM': '75 GSM',
        'Sheets': '500 sheets pack'
      },
      images: [
        'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=500&auto=format&fit=crop&q=60'
      ],
      isFeatured: false,
      isActive: true,
      rating: 4.9,
      reviewsCount: 0,
    },
    {
      sku: 'DIGITAL-COLOR-PRINT',
      name: 'Digital Color Laser Printing (Per Page)',
      description: 'Crystal-clear color laser prints on premium 75 GSM paper. Suitable for certificates, school projects, documentation, and graphical charts.',
      category: 'Services',
      price: 10,
      originalPrice: 15,
      stockQuantity: 9999,
      brand: 'Krishna Digital',
      tags: ['color printing', 'laser print', 'xerox service', 'school project'],
      specifications: {
        'Print Speed': 'Instant / Next day bulk',
        'Printer Quality': '1200 DPI Laser Color',
        'Paper Weight': '75 GSM (Default)'
      },
      images: [
        'https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?w=500&auto=format&fit=crop&q=60'
      ],
      isFeatured: true,
      isActive: true,
      rating: 4.9,
      reviewsCount: 1,
    },
    {
      sku: 'SPIRAL-BINDING-SRV',
      name: 'Professional Spiral Binding Service',
      description: 'Durable plastic spiral rings with thick clear protective front sheets and heavy cardboard backing. Perfect for binding school project notes, practical record sheets, and corporate proposals.',
      category: 'Services',
      price: 50,
      originalPrice: 70,
      stockQuantity: 9999,
      brand: 'Krishna Binding',
      tags: ['spiral binding', 'project work', 'records', 'school supplies'],
      specifications: {
        'Capacity': 'Up to 250 sheets',
        'Cover Sheet': 'Transparent PVC sheet',
        'Spine material': 'Flexible Plastic Coil'
      },
      images: [
        'https://images.unsplash.com/photo-1544816155-12df9643f363?w=500&auto=format&fit=crop&q=60'
      ],
      isFeatured: false,
      isActive: true,
      rating: 4.8,
      reviewsCount: 0,
    }
  ];

  for (const prod of products) {
    const createdProduct = await prisma.product.create({
      data: {
        sku: prod.sku,
        name: prod.name,
        description: prod.description,
        category: prod.category,
        price: prod.price,
        originalPrice: prod.originalPrice,
        stockQuantity: prod.stockQuantity,
        brand: prod.brand,
        tags: prod.tags.join(','),
        specifications: prod.specifications as any,
        images: prod.images.join(','),
        isFeatured: prod.isFeatured,
        isActive: prod.isActive,
        rating: prod.rating,
        reviewsCount: prod.reviewsCount,
      },
    });

    // Add some default reviews
    if (prod.sku === 'CLASSMATE-NOTEBOOK-PACK6') {
      await prisma.review.createMany({
        data: [
          { productId: createdProduct.id, userName: 'Arun M.', rating: 5, comment: 'Excellent page quality, perfect for daily homework.' },
          { productId: createdProduct.id, userName: 'Sneha R.', rating: 4, comment: 'Value pack is very cheap and notebook bindings are strong.' }
        ]
      });
    } else if (prod.sku === 'REYNOLDS-TRIMAX-BLUE3') {
      await prisma.review.create({
        data: { productId: createdProduct.id, userName: 'Vijay K.', rating: 5, comment: 'Write smoothly and ink lasts really long. Highly recommend!' }
      });
    } else if (prod.sku === 'DIGITAL-COLOR-PRINT') {
      await prisma.review.create({
        data: { productId: createdProduct.id, userName: 'Karthik S.', rating: 5, comment: 'Best printing price in Medavakkam. Fast binding services too!' }
      });
    }
  }

  console.log('Products seeded successfully');

  // 3. Create Store Settings
  await prisma.storeSettings.create({
    data: {
      upiMobileNumber: '8900989005',
      adminEmail: 'admin@krishna.com',
      whatsappNumber: '8900989005',
      storeAddress: '427/200B, Ground Floor, Medavakkam-Mambakkam Road, Near Vels Global School, Medavakkam, Chennai, Tamil Nadu 600100, India',
      mapEmbedUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3889.378906950293!2d80.19047911482103!3d12.915509790892706!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3a525ddc67b2d56d%3A0x2c89be1f6057a6e2!2sKrishna%20Students%20Printers%20%26%20Stationery%20Toys!5e0!3m2!1sen!2sin!4v1687258900000!5m2!1sen!2sin',
      promoPopupEnabled: true,
      promoPopupTitle: '📚 Back to School Mega Sale! 🎒',
      promoPopupText: 'Get flat 20% discount on all Notebooks packs, crayons, geometry sets, and premium gel writing pens! Use code SCHOOLDAYS at checkout.',
      promoPopupImageUrl: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=600&auto=format&fit=crop&q=80',
      codEnabled: true,
      codMinAmount: 100,
      codMaxAmount: 3000,
      codAllowedPincodes: '600100,600117,600073,600048', // Medavakkam and surroundings
      topBannerText: '✨ Free delivery on stationery items for orders above ₹499! Use code HAPPY15 for 15% OFF! ✨',
      storeTimings: 'Daily: 7:30 AM – 11:30 PM',
    },
  });

  // Create default PaymentSettings
  await prisma.paymentSettings.create({
    data: {
      id: 'singleton',
      razorpayKeyId: 'rzp_test_5WjSg78Hk9mPlq',
      razorpaySecretEncrypted: '',
      upiId: '8900989005@paytm',
      merchantName: 'Krishna Stationery',
      paymentMethods: 'cod,razorpay',
    }
  });

  console.log('Store configurations seeded successfully');

  // 4. Create Gallery Items
  const gallery = [
    {
      imageUrl: 'https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?w=800&auto=format&fit=crop&q=60',
      category: 'Store Front',
      caption: 'Welcome to Krishna Students Printers & Stationery. Step inside to explore books, art tools, and toys.'
    },
    {
      imageUrl: 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=800&auto=format&fit=crop&q=60',
      category: 'Office Supplies',
      caption: 'Fully stocked shelves with printer paper bundles, organizers, tapes, files, and binding supplies.'
    },
    {
      imageUrl: 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=800&auto=format&fit=crop&q=60',
      category: 'Art Corner',
      caption: 'A rainbow of oil pastels, acrylic palettes, fine sketch liners, drawing boards, and canvas boards.'
    },
    {
      imageUrl: 'https://images.unsplash.com/photo-1566577134770-3d85bb3a9cc4?w=800&auto=format&fit=crop&q=60',
      category: 'Kids Toys',
      caption: 'Explore soft teddy bears, building bricks, board puzzles, and delightful gifts for every age.'
    },
    {
      imageUrl: 'https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?w=800&auto=format&fit=crop&q=60',
      category: 'Printing & Xerox Hub',
      caption: 'High-speed heavy xerox and color digital printing machines, spiral binding stations for records.'
    }
  ];

  for (const item of gallery) {
    await prisma.galleryItem.create({
      data: {
        imageUrl: item.imageUrl,
        category: item.category,
        caption: item.caption,
      },
    });
  }

  console.log('Gallery seeded successfully');
  console.log('Seeding finished successfully! 🎉');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
