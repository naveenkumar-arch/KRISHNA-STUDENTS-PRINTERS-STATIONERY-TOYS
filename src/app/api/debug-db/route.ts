import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import fs from 'fs';
import path from 'path';

export async function GET(req: NextRequest) {
  try {
    const dbPath = path.join(process.cwd(), 'prisma', 'dev.db');
    const dbExists = fs.existsSync(dbPath);
    
    let dbSize = 0;
    if (dbExists) {
      dbSize = fs.statSync(dbPath).size;
    }

    const testQuery = await db.product.findMany({ take: 1 });

    return NextResponse.json({
      success: true,
      dbExists,
      dbPath,
      dbSize,
      cwd: process.cwd(),
      testQuery
    });
  } catch (err: any) {
    return NextResponse.json({
      success: false,
      message: err.message,
      stack: err.stack,
      cwd: process.cwd(),
      errorKeys: Object.keys(err)
    }, { status: 500 });
  }
}
