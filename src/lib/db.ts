import { PrismaClient } from '@prisma/client';
import path from 'path';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

const dbPath = path.join(process.cwd(), 'prisma', 'dev.db');
const dbUrl = `file:${dbPath}`;

export const db = globalForPrisma.prisma || new PrismaClient({
  datasources: {
    db: {
      url: dbUrl,
    },
  },
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;

export default db;

export interface Review {
  id: string;
  productId: string;
  userName: string;
  rating: number;
  comment: string;
  date: string | Date;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  description: string;
  price: number;
  originalPrice: number;
  stockQuantity: number;
  category: string;
  brand: string;
  tags: string[];
  specifications: Record<string, string>;
  images: string[];
  isFeatured: boolean;
  isActive: boolean;
  rating: number;
  reviewsCount: number;
  reviews?: Review[];
  createdAt?: string | Date;
  updatedAt?: string | Date;
}
