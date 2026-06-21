import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import fs from 'fs';
import path from 'path';
import { v2 as cloudinary } from 'cloudinary';

// Configure local fallback dir
const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Configure Cloudinary if credentials exist
const isCloudinaryConfigured = !!process.env.CLOUDINARY_URL;
if (isCloudinaryConfigured) {
  // Cloudinary parses CLOUDINARY_URL automatically
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ success: false, message: 'Unauthorized. Login required.' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const uploadType = formData.get('type') as string | null; // 'print' or 'admin'

    if (!file) {
      return NextResponse.json({ success: false, message: 'No file uploaded' }, { status: 400 });
    }

    const isAdmin = ['SUPER_ADMIN', 'ADMIN', 'MANAGER'].includes(session.user.role);

    // 1. Validation based on upload type
    const isPrintUpload = uploadType === 'print';

    if (isPrintUpload) {
      const allowedPrintTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'image/jpeg', 'image/png', 'image/webp', 'image/jpg'
      ];
      if (!allowedPrintTypes.includes(file.type)) {
        return NextResponse.json({ success: false, message: 'Invalid format. Allowed: PDF, DOC, DOCX, PPT, PPTX, JPG, PNG, WEBP.' }, { status: 400 });
      }
      if (file.size > 20 * 1024 * 1024) { // Max 20MB for documents
        return NextResponse.json({ success: false, message: 'File is too large. Maximum size is 20MB.' }, { status: 400 });
      }
    } else {
      // Admin asset upload
      if (!isAdmin) {
        return NextResponse.json({ success: false, message: 'Forbidden. Admin privileges required.' }, { status: 403 });
      }
      const allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
      if (!allowedImageTypes.includes(file.type)) {
        return NextResponse.json({ success: false, message: 'Invalid format. Allowed: JPG, PNG, WEBP images only.' }, { status: 400 });
      }
      if (file.size > 10 * 1024 * 1024) { // Max 10MB
        return NextResponse.json({ success: false, message: 'File size exceeds limit (10MB).' }, { status: 400 });
      }
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 2. Cloudinary Upload if configured
    if (isCloudinaryConfigured) {
      try {
        const fileBase64 = `data:${file.type};base64,${buffer.toString('base64')}`;
        const uploadResponse = await cloudinary.uploader.upload(fileBase64, {
          folder: isPrintUpload ? 'krishna_stationery/customer_prints' : 'krishna_stationery/admin_assets',
          resource_type: isPrintUpload ? 'auto' : 'image',
        });
        return NextResponse.json({
          success: true,
          message: 'Uploaded to Cloudinary successfully',
          url: uploadResponse.secure_url,
        });
      } catch (cloudErr) {
        console.error('Cloudinary upload failure, falling back to local storage:', cloudErr);
      }
    }

    // 3. Local Storage Fallback
    const ext = path.extname(file.name) || (isPrintUpload ? '.pdf' : '.png');
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9]/g, '_');
    const filename = `${sanitizedName}_${Date.now()}${ext}`;
    const filePath = path.join(UPLOAD_DIR, filename);

    fs.writeFileSync(filePath, buffer);

    return NextResponse.json({
      success: true,
      message: 'File uploaded locally successfully',
      url: `/uploads/${filename}`,
    });

  } catch (err) {
    console.error('File upload API error:', err);
    return NextResponse.json({ success: false, message: 'Internal server error during upload' }, { status: 500 });
  }
}
