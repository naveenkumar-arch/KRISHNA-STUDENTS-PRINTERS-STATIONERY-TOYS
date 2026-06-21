'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Star, ShoppingCart, CreditCard, ChevronRight, 
  ArrowLeft, CheckCircle, AlertCircle, Info, Sparkles 
} from 'lucide-react';
import ProductCard from '@/components/ProductCard';
import { Product } from '@/lib/db';
import { useCartStore } from '@/store/cartStore';
import toast from 'react-hot-toast';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'desc' | 'specs' | 'reviews'>('desc');

  const { addToCart } = useCartStore();

  useEffect(() => {
    async function loadProductData() {
      setLoading(true);
      try {
        const res = await fetch(`/api/products/${id}`);
        const data = await res.json();
        
        if (data.success) {
          setProduct(data.product);
          setActiveImage(data.product.images[0]);
          
          // Fetch related products of the same category
          const allRes = await fetch(`/api/products?category=${encodeURIComponent(data.product.category)}`);
          const allData = await allRes.json();
          if (allData.success) {
            // Filter out current product
            const filtered = allData.products.filter((p: Product) => p.id !== data.product.id);
            setRelatedProducts(filtered.slice(0, 4));
          }
        } else {
          toast.error('Product not found');
        }
      } catch (err) {
        console.error('Error fetching product details:', err);
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      loadProductData();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl w-full px-4 py-16 space-y-8 animate-pulse">
        <div className="h-6 w-32 bg-gray-100 rounded-lg" />
        <div className="flex flex-col md:flex-row gap-8">
          <div className="w-full md:w-1/2 aspect-square bg-gray-50 rounded-3xl" />
          <div className="w-full md:w-1/2 space-y-4">
            <div className="h-8 w-3/4 bg-gray-100 rounded-lg" />
            <div className="h-5 w-1/3 bg-gray-100 rounded-lg" />
            <div className="h-24 w-full bg-gray-50 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="mx-auto max-w-7xl w-full px-4 py-16 text-center space-y-4">
        <div className="p-4 bg-red-50 rounded-full inline-block border border-red-200 text-red-500">
          <AlertCircle className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-black text-gray-800">Product Not Found</h2>
        <p className="text-xs text-gray-500">The product you are trying to view does not exist or has been removed.</p>
        <Link href="/shop" className="inline-block px-5 py-2.5 bg-sky-500 text-white font-extrabold text-xs rounded-full shadow-md">
          Back to Shop Catalog
        </Link>
      </div>
    );
  }

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
  };

  const handleBuyNow = () => {
    addToCart({
      productId: product.id,
      name: product.name,
      price: product.price,
      originalPrice: product.originalPrice,
      image: product.images[0],
      category: product.category
    }, quantity);
    router.push('/checkout');
  };

  const discountPercentage = Math.round(
    ((product.originalPrice - product.price) / product.originalPrice) * 100
  );
  
  const savings = product.originalPrice - product.price;
  const isOutOfStock = product.stockQuantity === 0;
  const isLowStock = product.stockQuantity > 0 && product.stockQuantity <= 5;

  // Star Rating Breakdown mock math
  const totalReviews = product.reviewsCount || 12; // fallback for display
  const ratingDistribution = [
    { star: 5, pct: 75, count: Math.round(totalReviews * 0.75) },
    { star: 4, pct: 15, count: Math.round(totalReviews * 0.15) },
    { star: 3, pct: 8, count: Math.round(totalReviews * 0.08) },
    { star: 2, pct: 2, count: Math.round(totalReviews * 0.02) },
    { star: 1, pct: 0, count: 0 }
  ];

  return (
    <div className="mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      {/* Breadcrumbs */}
      <nav className="flex items-center space-x-1.5 text-[10px] uppercase font-black tracking-wider text-gray-400">
        <Link href="/" className="hover:text-sky-500 transition-colors">Home</Link>
        <ChevronRight className="h-3 w-3" />
        <Link href="/shop" className="hover:text-sky-500 transition-colors">Shop</Link>
        <ChevronRight className="h-3 w-3" />
        <Link href={`/shop?category=${encodeURIComponent(product.category)}`} className="hover:text-sky-500 transition-colors">{product.category}</Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-gray-600 truncate">{product.name}</span>
      </nav>

      {/* Product Summary layout */}
      <div className="flex flex-col md:flex-row gap-10 bg-white p-6 sm:p-8 rounded-3xl border-2 border-sky-100/50 shadow-sm bg-gradient-to-b from-white to-sky-50/5">
        
        {/* Left Column: Image Selection */}
        <div className="w-full md:w-1/2 flex flex-col items-center">
          {/* Main Display Image */}
          <div className="relative w-full aspect-square bg-gray-50 rounded-2xl border-2 border-gray-150 overflow-hidden group">
            <img 
              src={activeImage} 
              alt={product.name} 
              className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-115 cursor-zoom-in"
            />
            {discountPercentage > 0 && (
              <span className="absolute top-4 left-4 bg-coral-500 border border-coral-600 text-white font-extrabold text-xs px-3 py-1.5 rounded-full shadow-md">
                SAVE ₹{savings} ({discountPercentage}% OFF)
              </span>
            )}
          </div>

          {/* Thumbnails row */}
          {product.images.length > 1 && (
            <div className="flex space-x-3 mt-4 overflow-x-auto w-full py-1">
              {product.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(img)}
                  className={`w-16 h-16 rounded-xl border-2 overflow-hidden shrink-0 transition-all ${
                    activeImage === img ? 'border-sky-500 scale-105 shadow-md' : 'border-gray-200'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Information & Actions */}
        <div className="w-full md:w-1/2 flex flex-col space-y-6">
          <div className="space-y-2">
            <span className="text-[10px] uppercase font-black text-sky-500 bg-sky-50 border border-sky-100 px-3 py-1 rounded-full">
              {product.category}
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-800 leading-snug">
              {product.name}
            </h1>
            
            <div className="flex items-center space-x-4 text-xs font-semibold text-gray-400">
              <p>Brand: <strong className="text-gray-600">{product.brand}</strong></p>
              <p>•</p>
              <div className="flex items-center text-yellow-400">
                <div className="flex mr-1.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${
                        i < Math.round(product.rating) ? 'fill-current' : 'text-gray-200'
                      }`}
                    />
                  ))}
                </div>
                <span className="font-bold text-gray-600">{product.rating}</span>
                <span className="text-gray-400 ml-1">({product.reviewsCount} reviews)</span>
              </div>
            </div>
          </div>

          {/* Pricing & Stock Details */}
          <div className="p-4 bg-sky-50/40 rounded-2xl border border-sky-100/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <div className="flex items-baseline space-x-2.5">
                <span className="text-3xl font-black text-gray-900">₹{product.price}</span>
                {discountPercentage > 0 && (
                  <span className="text-sm font-semibold text-gray-400 line-through">
                    ₹{product.originalPrice}
                  </span>
                )}
              </div>
              <p className="text-[10px] text-gray-400 font-bold mt-0.5">Inclusive of all local taxes</p>
            </div>

            <div>
              {isOutOfStock ? (
                <span className="bg-red-50 border border-red-200 text-red-500 text-xs font-extrabold px-3 py-1.5 rounded-xl flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" /> Out of Stock
                </span>
              ) : isLowStock ? (
                <span className="bg-orange-50 border border-orange-200 text-orange-500 text-xs font-extrabold px-3 py-1.5 rounded-xl flex items-center gap-1 animate-pulse">
                  <AlertCircle className="h-4 w-4" /> Only {product.stockQuantity} Left!
                </span>
              ) : (
                <span className="bg-green-50 border border-green-200 text-green-500 text-xs font-extrabold px-3 py-1.5 rounded-xl flex items-center gap-1">
                  <CheckCircle className="h-4 w-4" /> In Stock & Ready
                </span>
              )}
            </div>
          </div>

          {/* Quantity selector */}
          {!isOutOfStock && (
            <div className="flex items-center space-x-4">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Quantity:</span>
              <div className="flex items-center border-2 border-sky-100 rounded-2xl overflow-hidden bg-sky-50/20">
                <button
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  className="px-4 py-2 font-black text-gray-600 hover:bg-sky-50 transition-colors text-sm"
                >
                  -
                </button>
                <span className="px-5 font-black text-sm text-gray-800">{quantity}</span>
                <button
                  onClick={() => setQuantity(q => Math.min(product.stockQuantity, q + 1))}
                  className="px-4 py-2 font-black text-gray-600 hover:bg-sky-50 transition-colors text-sm"
                >
                  +
                </button>
              </div>
            </div>
          )}

          {/* Core Action triggers */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={handleAddToCart}
              disabled={isOutOfStock}
              className={`flex-1 py-4 font-black rounded-2xl shadow-sm border border-sky-100 flex items-center justify-center space-x-2 transition-all transform active:scale-98 ${
                isOutOfStock
                  ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
                  : 'bg-sky-50 hover:bg-sky-100 text-sky-600 shadow-md'
              }`}
            >
              <ShoppingCart className="h-5 w-5" />
              <span>Add to Cart</span>
            </button>

            <button
              onClick={handleBuyNow}
              disabled={isOutOfStock}
              className={`flex-1 py-4 font-black rounded-2xl shadow-md flex items-center justify-center space-x-2 transition-all transform active:scale-98 ${
                isOutOfStock
                  ? 'bg-gray-150 text-gray-300 cursor-not-allowed'
                  : 'bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 text-white hover:shadow-lg'
              }`}
            >
              <CreditCard className="h-5 w-5" />
              <span>Buy Now</span>
            </button>
          </div>
        </div>
      </div>

      {/* Description tabs & ratings breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Cols: Tabs detail panels */}
        <div className="lg:col-span-2 bg-white p-6 sm:p-8 rounded-3xl border-2 border-sky-100/50 shadow-sm">
          <div className="flex border-b border-gray-100 pb-3">
            <button
              onClick={() => setActiveTab('desc')}
              className={`pb-2.5 text-xs font-black uppercase tracking-wider transition-colors mr-6 border-b-2 ${
                activeTab === 'desc' ? 'border-sky-500 text-sky-600' : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              Description
            </button>
            <button
              onClick={() => setActiveTab('specs')}
              className={`pb-2.5 text-xs font-black uppercase tracking-wider transition-colors mr-6 border-b-2 ${
                activeTab === 'specs' ? 'border-sky-500 text-sky-600' : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              Specifications
            </button>
            <button
              onClick={() => setActiveTab('reviews')}
              className={`pb-2.5 text-xs font-black uppercase tracking-wider transition-colors border-b-2 ${
                activeTab === 'reviews' ? 'border-sky-500 text-sky-600' : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              Reviews ({product.reviewsCount})
            </button>
          </div>

          <div className="py-6 text-xs leading-relaxed text-gray-500 font-semibold">
            {activeTab === 'desc' && (
              <p className="whitespace-pre-line">{product.description}</p>
            )}

            {activeTab === 'specs' && (
              <table className="w-full text-left border-collapse">
                <tbody>
                  {Object.entries(product.specifications || {}).map(([key, val]) => (
                    <tr key={key} className="border-b border-gray-100">
                      <td className="py-3 pr-4 font-bold text-gray-400 uppercase tracking-wide w-1/3">{key}</td>
                      <td className="py-3 font-black text-gray-700">{val}</td>
                    </tr>
                  ))}
                  {Object.keys(product.specifications || {}).length === 0 && (
                    <tr>
                      <td className="py-3 text-gray-400 italic">No specifications listed.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}

            {activeTab === 'reviews' && (
              <div className="space-y-6">
                {product.reviews && product.reviews.map((rev) => (
                  <div key={rev.id} className="border-b border-gray-150 pb-4 last:border-b-0 last:pb-0 space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="font-black text-gray-700">{rev.userName}</span>
                      <span className="text-[10px] text-gray-400 font-bold">{new Date(rev.date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex text-yellow-400">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`h-3.5 w-3.5 ${i < rev.rating ? 'fill-current' : 'text-gray-200'}`}
                        />
                      ))}
                    </div>
                    <p className="text-gray-500">{rev.comment}</p>
                  </div>
                ))}

                {(!product.reviews || product.reviews.length === 0) && (
                  <div className="text-center py-6 text-gray-400 italic">
                    No reviews for this product yet. Be the first to write one!
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Rating Breakdown bar chart */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border-2 border-sky-100/50 shadow-sm self-start space-y-5">
          <h3 className="text-base font-black text-gray-800">Customer Reviews</h3>
          
          <div className="flex items-center space-x-2">
            <span className="text-3xl font-black text-gray-800">{product.rating}</span>
            <div>
              <div className="flex text-yellow-400">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4.5 w-4.5 ${i < Math.round(product.rating) ? 'fill-current' : 'text-gray-200'}`}
                  />
                ))}
              </div>
              <p className="text-[10px] text-gray-400 font-bold mt-0.5">{totalReviews} global ratings</p>
            </div>
          </div>

          <hr className="border-gray-100" />

          {/* Bar Chart Breakdown */}
          <div className="space-y-3">
            {ratingDistribution.map((dist) => (
              <div key={dist.star} className="flex items-center text-xs font-semibold text-gray-500">
                <span className="w-12 hover:underline cursor-pointer">{dist.star} star</span>
                {/* Bar */}
                <div className="flex-1 h-3 bg-sky-50 border border-sky-100 rounded-full mx-3 overflow-hidden">
                  <div 
                    className="h-full bg-yellow-400 rounded-full transition-all duration-500" 
                    style={{ width: `${dist.pct}%` }}
                  />
                </div>
                <span className="w-8 text-right font-bold text-gray-400">{dist.pct}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Related Products Carousel */}
      {relatedProducts.length > 0 && (
        <section className="space-y-6">
          <div className="border-b border-gray-100 pb-3">
            <h2 className="text-lg font-black text-gray-800 flex items-center gap-1.5">
              <Sparkles className="h-5 w-5 text-sky-500 animate-pulse" /> Related Products
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {relatedProducts.map((prod) => (
              <ProductCard 
                key={prod.id} 
                product={prod} 
                onQuickView={() => router.push(`/product/${prod.id}`)} 
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
