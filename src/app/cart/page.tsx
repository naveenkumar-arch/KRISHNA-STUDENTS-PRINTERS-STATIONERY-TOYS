'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ShoppingBag, Trash2, ArrowRight, Sparkles, Gift, 
  ChevronLeft, Info, HelpCircle, Check 
} from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';

export default function CartPage() {
  const router = useRouter();
  const { items, updateQuantity, removeFromCart, getTotals, applyCoupon, coupon, discountPercentage } = useCartStore();
  const { isAuthenticated } = useAuthStore();
  const [couponInput, setCouponInput] = useState('');

  useEffect(() => {
    if (coupon) {
      setCouponInput(coupon);
    }
  }, [coupon]);

  const { subtotal, discount, deliveryFee, total } = getTotals();

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput.trim()) {
      toast.error('Please enter a coupon code');
      return;
    }
    const success = applyCoupon(couponInput);
    if (success) {
      toast.success('Coupon applied successfully! 🎉');
    } else {
      toast.error('Invalid coupon code. Try SCHOOLDAYS or WELCOME10.');
    }
  };

  const handleProceedToCheckout = () => {
    if (!isAuthenticated) {
      toast.error('Please login to proceed to checkout!');
      // Open login modal by clicking the navbar login button or redirecting
      // For this app, if they click proceed and aren't logged in, we will redirect them to a login-gate or explain they need to login.
      // Let's redirect to checkout, which itself holds the login gate as requested: "redirect to login if not authenticated"
    }
    router.push('/checkout');
  };

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center space-y-6 flex flex-col items-center justify-center min-h-[60vh]">
        <div className="p-6 bg-sky-50 rounded-full border border-sky-100 text-sky-500 animate-bounce">
          <ShoppingBag className="h-12 w-12" />
        </div>
        <h2 className="text-2xl font-black text-gray-800">Your Shopping Cart is Empty</h2>
        <p className="text-xs text-gray-400 max-w-sm leading-relaxed">
          Looks like you haven't added anything to your cart yet. Check out our high-quality notebooks, coloring kits, and toys!
        </p>
        <Link 
          href="/shop" 
          className="inline-flex items-center px-6 py-3.5 bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 text-white font-extrabold text-xs tracking-wider uppercase rounded-full shadow-md hover:shadow-lg transition-all"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          <span>Explore Stationery Shop</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="border-b border-gray-100 pb-3">
        <h1 className="text-2xl font-black text-gray-800 flex items-center gap-1.5">
          <ShoppingBag className="h-6 w-6 text-sky-500" /> Shopping Cart
        </h1>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* Left Panel: Items List */}
        <div className="flex-1 space-y-4">
          <div className="bg-white rounded-3xl border-2 border-sky-100/50 shadow-sm overflow-hidden divide-y divide-gray-100">
            {items.map((item) => (
              <div 
                key={item.productId}
                className="p-5 flex flex-col sm:flex-row items-center gap-5 hover:bg-sky-50/10 transition-colors"
              >
                {/* Product Image */}
                <Link 
                  href={`/product/${item.productId}`}
                  className="w-20 h-20 rounded-xl overflow-hidden border border-gray-100 bg-gray-50 shrink-0"
                >
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                </Link>

                {/* Info */}
                <div className="flex-1 text-center sm:text-left space-y-1">
                  <span className="text-[9px] uppercase font-black text-sky-500 bg-sky-50 px-2 py-0.5 rounded-full border border-sky-100">
                    {item.category}
                  </span>
                  <Link 
                    href={`/product/${item.productId}`}
                    className="block text-sm font-bold text-gray-800 hover:text-sky-500 transition-colors line-clamp-1"
                  >
                    {item.name}
                  </Link>
                  <p className="text-xs font-semibold text-gray-400">
                    Price per item: <strong className="text-gray-600">₹{item.price}</strong>
                  </p>
                </div>

                {/* Qty Controls */}
                <div className="flex items-center border-2 border-sky-100 rounded-2xl overflow-hidden bg-sky-50/20">
                  <button
                    onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                    className="px-3 py-1 font-black text-gray-600 hover:bg-sky-50 transition-colors"
                  >
                    -
                  </button>
                  <span className="px-3 text-xs font-black text-gray-800">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                    className="px-3 py-1 font-black text-gray-600 hover:bg-sky-50 transition-colors"
                  >
                    +
                  </button>
                </div>

                {/* Subtotal & Delete */}
                <div className="w-full sm:w-28 flex sm:flex-col items-center justify-between sm:justify-center sm:items-end gap-2 shrink-0">
                  <span className="text-sm font-black text-gray-800">
                    ₹{item.price * item.quantity}
                  </span>
                  <button
                    onClick={() => {
                      removeFromCart(item.productId);
                      toast.success(`${item.name} removed from cart`);
                    }}
                    className="p-1.5 rounded-xl hover:bg-red-50 text-red-400 hover:text-red-500 border border-transparent hover:border-red-100 transition-all active:scale-95"
                    title="Remove item"
                  >
                    <Trash2 className="h-4.5 w-4.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center bg-yellow-50/50 p-4 rounded-2xl border border-yellow-200/50">
            <span className="text-xs font-bold text-yellow-700 flex items-center gap-1.5">
              <Info className="h-4 w-4 shrink-0" /> Free Shipping on orders above ₹500
            </span>
            <Link 
              href="/shop" 
              className="text-xs font-black text-sky-500 hover:text-sky-600 flex items-center"
            >
              Continue Shopping <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        {/* Right Panel: Checkout Summary & Promo */}
        <div className="w-full lg:w-80 shrink-0 space-y-6">
          {/* Coupon input */}
          <div className="bg-white p-5 rounded-3xl border-2 border-sky-100/50 shadow-sm space-y-3">
            <h3 className="text-xs font-black text-gray-800 flex items-center gap-1.5 uppercase tracking-wide">
              <Gift className="h-4 w-4 text-sky-500" /> Apply Promo Code
            </h3>
            
            <form onSubmit={handleApplyCoupon} className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. SCHOOLDAYS"
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value)}
                className="flex-1 px-3 py-2 text-xs font-semibold border-2 border-sky-100 rounded-xl focus:outline-none focus:border-sky-400 uppercase"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white font-extrabold text-xs rounded-xl shadow-xs"
              >
                Apply
              </button>
            </form>

            {discountPercentage > 0 && (
              <div className="flex items-center space-x-1.5 text-[10px] font-black text-green-500 bg-green-50 border border-green-100 px-3 py-1.5 rounded-xl">
                <Check className="h-3.5 w-3.5" />
                <span>Code {coupon} Applied! ({discountPercentage}% OFF)</span>
              </div>
            )}
          </div>

          {/* Order Summary Recap */}
          <div className="bg-white p-6 rounded-3xl border-2 border-sky-100/50 shadow-sm space-y-4 bg-gradient-to-b from-white to-sky-50/10">
            <h3 className="text-sm font-black text-gray-800 uppercase tracking-wide border-b border-gray-100 pb-2.5">
              Order Summary
            </h3>

            <div className="space-y-2.5 text-xs font-semibold text-gray-500">
              <div className="flex justify-between">
                <span>Subtotal ({items.length} items)</span>
                <span className="text-gray-800 font-bold">₹{subtotal}</span>
              </div>

              {discount > 0 && (
                <div className="flex justify-between text-green-500">
                  <span className="flex items-center gap-1">Discount ({discountPercentage}%)</span>
                  <span>-₹{discount}</span>
                </div>
              )}

              <div className="flex justify-between">
                <span>Delivery Charge</span>
                {deliveryFee === 0 ? (
                  <span className="text-green-500 font-bold">FREE</span>
                ) : (
                  <span className="text-gray-800 font-bold">₹{deliveryFee}</span>
                )}
              </div>
            </div>

            <hr className="border-gray-100" />

            <div className="flex justify-between items-baseline font-black text-gray-800">
              <span className="text-sm">Total Amount:</span>
              <span className="text-2xl text-sky-600">₹{total}</span>
            </div>

            <button
              onClick={handleProceedToCheckout}
              className="w-full py-4 bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 text-white font-black text-xs tracking-wider uppercase rounded-2xl shadow-md hover:shadow-lg transition-all transform active:scale-98 flex items-center justify-center space-x-2"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="h-4.5 w-4.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
