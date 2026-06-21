import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import db from '@/lib/db';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      include: { addresses: true }
    });

    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    // Map DB addresses relation to match state expected by client savedAddresses list
    const formattedUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      mobileNumber: user.mobileNumber,
      dob: user.dob,
      gender: user.gender,
      bio: user.bio,
      avatarUrl: user.avatarUrl,
      isSuspended: user.isSuspended,
      totpVerified: session.user.totpVerified, // Carry 2FA verification from session
      savedAddresses: user.addresses || []
    };

    return NextResponse.json({ success: true, user: formattedUser });
  } catch (err) {
    console.error('Fetch profile error:', err);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { name, mobileNumber, dob, gender, bio, avatarUrl, savedAddresses } = body;

    const user = await db.user.findUnique({
      where: { id: session.user.id }
    });

    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    // Backend validations
    if (name) {
      if (name.length < 2 || name.length > 50 || !/^[a-zA-Z\s]+$/.test(name)) {
        return NextResponse.json({ 
          success: false, 
          message: 'Name must be between 2 and 50 characters, containing only letters and spaces.' 
        }, { status: 400 });
      }
    }

    if (mobileNumber) {
      if (mobileNumber.length !== 10 || isNaN(Number(mobileNumber)) || !/^[6-9]\d{9}$/.test(mobileNumber)) {
        return NextResponse.json({ 
          success: false, 
          message: 'Mobile number must be a valid 10-digit Indian number starting with 6-9.' 
        }, { status: 400 });
      }
    }

    // Collect updates
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (mobileNumber !== undefined) updateData.mobileNumber = mobileNumber;
    if (dob !== undefined) updateData.dob = dob;
    if (gender !== undefined) updateData.gender = gender;
    if (bio !== undefined) updateData.bio = bio;
    if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl;

    // Apply updates
    await db.user.update({
      where: { id: session.user.id },
      data: updateData,
    });

    // 2. Handle Addresses Updates
    if (savedAddresses && Array.isArray(savedAddresses)) {
      // Validate array
      for (const addr of savedAddresses) {
        if (!addr.name || addr.name.length < 2) {
          return NextResponse.json({ success: false, message: 'Address recipient name is required' }, { status: 400 });
        }
        if (!addr.flat || !addr.street || !addr.city || !addr.state) {
          return NextResponse.json({ success: false, message: 'Address location details are required' }, { status: 400 });
        }
        if (addr.mobile.length !== 10 || isNaN(Number(addr.mobile))) {
          return NextResponse.json({ success: false, message: 'Address mobile number must be 10 digits' }, { status: 400 });
        }
        if (addr.pincode.length !== 6 || isNaN(Number(addr.pincode))) {
          return NextResponse.json({ success: false, message: 'Address pincode must be 6 digits' }, { status: 400 });
        }
      }

      // Purge old addresses for this user and recreate new snapshots
      await db.address.deleteMany({
        where: { userId: session.user.id }
      });

      for (const addr of savedAddresses) {
        await db.address.create({
          data: {
            userId: session.user.id,
            name: addr.name,
            mobile: addr.mobile,
            email: addr.email || session.user.email!,
            flat: addr.flat,
            street: addr.street,
            landmark: addr.landmark || '',
            city: addr.city,
            state: addr.state,
            pincode: addr.pincode,
            isDefault: addr.isDefault || false,
          }
        });
      }
    }

    // Query refreshed data
    const updatedUser = await db.user.findUnique({
      where: { id: session.user.id },
      include: { addresses: true }
    });

    const formattedUser = {
      id: updatedUser!.id,
      email: updatedUser!.email,
      name: updatedUser!.name,
      role: updatedUser!.role,
      mobileNumber: updatedUser!.mobileNumber,
      dob: updatedUser!.dob,
      gender: updatedUser!.gender,
      bio: updatedUser!.bio,
      avatarUrl: updatedUser!.avatarUrl,
      isSuspended: updatedUser!.isSuspended,
      totpVerified: session.user.totpVerified,
      savedAddresses: updatedUser!.addresses || []
    };

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      user: formattedUser
    });

  } catch (err) {
    console.error('Profile update error:', err);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
