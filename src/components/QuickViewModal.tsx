'use client';

import React, { useState, useEffect } from 'react';
import { X, Star, ShoppingCart, Info, Award, HelpCircle } from 'lucide-react';
import { Product } from '@/lib/db';
import { useCartStore } from '@/store/cartStore';
import toast from 'react-hot-toast';

interface QuickViewModalProps {
  product: Product | null;
  onClose: () => void;
}

export default function QuickViewModal({ product, onClose }: QuickViewModalProps) {
  const { addToCart } = useCartStore();
  const [activeImage, setActiveImage] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'details' | 'specs'>('details');

  useEffect(() => {
    if (product) {
      setActiveImage(product.images[0]);
      setQuantity(1);
      setActiveTab('details');
    }
  }, [product]);

  if (!product) return null;

  const isOutOfStock = product.stockQuantity === 0;

  const handleAddToCart = () => {
    addToCart({
      productId: product.id,
      name: product.name,
      price: product.price,
      originalPrice: product.originalPrice,
      image: product.images[0],
      category: product.category
    }, quantity);
    toast.success(`${quantity} x ${product.name} added to cart! 🛍️`);
    onClose();
  };

  const discountPercentage = Math.round(
    ((product.originalPrice - product.price) / product.originalPrice) * 100
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/45 backdrop-blur-xs transition-opacity duration-300"
        onClick={onClose} 
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-4xl bg-white rounded-3xl overflow-hidden shadow-2xl border-4 border-sky-300 animate-scale-up z-10 flex flex-col md:flex-row max-h-[90vh] md:max-h-none overflow-y-auto md:overflow-y-visible">
        
        {/* Colorful top border */}
        <div className="absolute top-0 left-0 right-0 h-2.5 bg-gradient-to-r from-sky-400 via-yellow-300 to-coral-400" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full bg-white/90 border border-gray-200 text-gray-500 hover:text-black shadow-sm z-20"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Left Side: Images Section */}
        <div className="w-full md:w-1/2 p-6 flex flex-col items-center border-r border-gray-100 mt-2">
          {/* Main Large Image */}
          <div className="relative w-full aspect-square bg-gray-50 rounded-2xl border border-gray-200 overflow-hidden">
            <img
              src={activeImage}
              alt={product.name}
              className="h-full w-full object-cover"
            />
            {discountPercentage > 0 && (
              <span className="absolute top-3 left-3 bg-coral-500 border border-coral-600 text-white font-extrabold text-xs px-3 py-1 rounded-full shadow-md">
                SAVE ₹{product.originalPrice - product.price} ({discountPercentage}% OFF)
              </span>
            )}
          </div>

          {/* Thumbnails list */}
          {product.images.length > 1 && (
            <div className="flex space-x-2 mt-4 overflow-x-auto w-full py-1">
              {product.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(img)}
                  className={`w-16 h-16 rounded-xl border-2 overflow-hidden shrink-0 transition-all ${
                    activeImage === img ? 'border-sky-500 scale-105' : 'border-gray-200'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Side: Specifications and Add section */}
        <div className="w-full md:w-1/2 p-6 flex flex-col mt-2">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-black tracking-wider text-sky-500 bg-sky-50 border border-sky-100 px-2 py-0.5 rounded-full">
              {product.category}
            </span>
            <h2 className="text-xl font-black text-gray-800 leading-snug mt-1">
              {product.name}
            </h2>
            <p className="text-xs font-semibold text-gray-400">Brand: <span className="text-gray-600 font-bold">{product.brand}</span></p>
          </div>

          {/* Ratings */}
          <div className="flex items-center space-x-1.5 mt-2">
            <div className="flex items-center text-yellow-400">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`h-4.5 w-4.5 ${
                    i < Math.round(product.rating) ? 'fill-current' : 'text-gray-200'
                  }`}
                />
              ))}
            </div>
            <span className="text-xs font-bold text-gray-500">{product.rating} / 5</span>
            <span className="text-xs font-bold text-gray-400">({product.reviewsCount} reviews)</span>
          </div>

          {/* Pricing */}
          <div className="flex items-baseline space-x-2.5 mt-4">
            <span className="text-2xl font-black text-gray-900">₹{product.price}</span>
            {discountPercentage > 0 && (
              <span className="text-sm font-semibold text-gray-400 line-through">
                ₹{product.originalPrice}
              </span>
            )}
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200 mt-5">
            <button
              onClick={() => setActiveTab('details')}
              className={`pb-2 text-xs font-bold uppercase tracking-wider transition-colors mr-6 border-b-2 ${
                activeTab === 'details'
                  ? 'border-sky-500 text-sky-600'
                  : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              Description
            </button>
            <button
              onClick={() => setActiveTab('specs')}
              className={`pb-2 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 ${
                activeTab === 'specs'
                  ? 'border-sky-500 text-sky-600'
                  : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              Specifications
            </button>
          </div>

          {/* Tab Contents */}
          <div className="py-4 text-xs leading-relaxed text-gray-500 font-medium flex-1 overflow-y-auto max-h-[150px]">
            {activeTab === 'details' ? (
              <p>{product.description}</p>
            ) : (
              <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
                {Object.entries(product.specifications || {}).map(([key, val]) => (
                  <div key={key} className="border-b border-gray-100 pb-1.5">
                    <span className="font-bold text-gray-400 uppercase tracking-wide text-[9px] block">{key}</span>
                    <span className="font-black text-gray-700">{val}</span>
                  </div>
                ))}
                {Object.keys(product.specifications || {}).length === 0 && (
                  <p className="text-gray-400 italic">No specifications listed.</p>
                )}
              </div>
            )}
          </div>

          {/* Actions: Quantity & Cart */}
          <div className="mt-auto border-t border-gray-100 pt-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-500">Stock Availability:</span>
              {isOutOfStock ? (
                <span className="text-xs font-black text-red-500">Out of Stock</span>
              ) : (
                <span className="text-xs font-black text-green-500">
                  {product.stockQuantity > 5 ? 'In Stock' : `Only ${product.stockQuantity} items left!`}
                </span>
              )}
            </div>

            {!isOutOfStock && (
              <div className="flex items-center space-x-4">
                {/* Quantity adjust */}
                <div className="flex items-center border-2 border-sky-100 rounded-2xl overflow-hidden bg-sky-50/20">
                  <button
                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    className="px-3.5 py-2 font-black text-gray-600 hover:bg-sky-50 transition-colors text-sm"
                  >
                    -
                  </button>
                  <span className="px-4 font-black text-sm text-gray-800">{quantity}</span>
                  <button
                    onClick={() => setQuantity(q => Math.min(product.stockQuantity, q + 1))}
                    className="px-3.5 py-2 font-black text-gray-600 hover:bg-sky-50 transition-colors text-sm"
                  >
                    +
                  </button>
                </div>

                <button
                  onClick={handleAddToCart}
                  className="flex-1 py-3 bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 text-white font-black text-sm rounded-2xl shadow-md hover:shadow-lg transition-all flex items-center justify-center space-x-2"
                >
                  <ShoppingCart className="h-4.5 w-4.5" />
                  <span>Add to Cart (₹{product.price * quantity})</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
