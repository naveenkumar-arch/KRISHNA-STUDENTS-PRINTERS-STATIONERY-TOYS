'use client';

import React from 'react';
import { ShoppingBag, Star } from 'lucide-react';
import { Product } from '@/lib/db';
import { useCartStore } from '@/store/cartStore';
import toast from 'react-hot-toast';

interface ProductCardProps {
  product: Product;
  onQuickView?: (product: Product) => void;
}

export default function ProductCard({ product, onQuickView }: ProductCardProps) {
  const { addToCart } = useCartStore();

  const discountPercentage = Math.round(
    ((product.originalPrice - product.price) / product.originalPrice) * 100
  );

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToCart({
      productId: product.id,
      name: product.name,
      price: product.price,
      originalPrice: product.originalPrice,
      image: product.images[0],
      category: product.category
    }, 1);
    toast.success(`${product.name} added to cart! 🛍️`);
  };

  const isOutOfStock = product.stockQuantity === 0;
  const isLowStock = product.stockQuantity > 0 && product.stockQuantity <= 3;

  return (
    <div
      onClick={() => onQuickView && onQuickView(product)}
      className="group relative bg-white rounded-3xl border-2 border-slate-100 hover:border-sky-300 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1.5 cursor-pointer flex flex-col justify-between"
    >
      
      {/* Image Area */}
      <div className="relative aspect-square rounded-t-3xl overflow-hidden bg-slate-50">
        <img
          src={product.images[0]}
          alt={product.name}
          className="h-full w-full object-cover group-hover:scale-105 transition duration-500"
        />

        {/* Absolute Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 pointer-events-none">
          {product.isFeatured && (
            <span className="bg-sunny-400 text-slate-800 rounded-full text-[10px] font-black px-2.5 py-1 shadow-sm">
              ⭐ BEST VALUE
            </span>
          )}
          {isOutOfStock ? (
            <span className="bg-rose-500 text-white rounded-full text-[10px] font-black px-2.5 py-1 shadow-sm">
              OUT OF STOCK
            </span>
          ) : isLowStock ? (
            <span className="bg-coral-500 text-white rounded-full text-[10px] font-black px-2.5 py-1 shadow-sm animate-pulse">
              ONLY {product.stockQuantity} LEFT! 🔥
            </span>
          ) : null}
        </div>

        {discountPercentage > 0 && (
          <span className="absolute top-3 right-3 bg-pink-500 text-white rounded-lg text-xs font-black px-2 py-1 pointer-events-none shadow-sm animate-bounce">
            -{discountPercentage}%
          </span>
        )}
      </div>

      {/* Info Area */}
      <div className="p-4 flex flex-col flex-1 justify-between relative">
        <div className="space-y-1">
          {/* Brand + Category */}
          <div className="flex items-center gap-1.5 text-[10px] font-black tracking-wider uppercase">
            <span className="text-sky-500">{product.brand}</span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-400">{product.category}</span>
          </div>

          {/* Name */}
          <h3 className="text-sm font-black text-slate-800 line-clamp-2 leading-snug group-hover:text-sky-500 transition-colors">
            {product.name}
          </h3>

          {/* Rating */}
          <div className="flex items-center gap-1">
            <div className="flex text-sunny-400">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`h-3 w-3 ${
                    i < Math.round(product.rating) ? 'fill-current' : 'text-slate-200'
                  }`}
                />
              ))}
            </div>
            <span className="text-xs font-bold text-slate-400">
              {product.rating.toFixed(1)} ({product.reviewsCount})
            </span>
          </div>
        </div>

        {/* Pricing & Cart Button */}
        <div className="pt-4 flex items-end justify-between mt-auto">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-base font-black text-slate-800">
                ₹{product.price}
              </span>
              {discountPercentage > 0 && (
                <span className="text-xs font-bold text-slate-400 line-through">
                  ₹{product.originalPrice}
                </span>
              )}
            </div>
            <p className="text-[10px] font-bold text-slate-400 leading-none mt-0.5">
              Inclusive of all taxes
            </p>
          </div>

          <button
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            className={`rounded-full p-2.5 shadow-md hover:scale-110 transition-all ${
              isOutOfStock 
                ? 'bg-slate-100 text-slate-300 cursor-not-allowed'
                : 'bg-sunny-400 hover:bg-sunny-500 text-slate-800'
            }`}
          >
            <ShoppingBag className="h-4.5 w-4.5" />
          </button>
        </div>

      </div>

    </div>
  );
}
