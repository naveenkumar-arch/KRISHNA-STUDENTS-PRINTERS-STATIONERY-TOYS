'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Grid, List, Star, AlertCircle } from 'lucide-react';
import ProductCard from '@/components/ProductCard';
import QuickViewModal from '@/components/QuickViewModal';
import { Product } from '@/lib/db';
import { useCartStore } from '@/store/cartStore';
import toast from 'react-hot-toast';

function ShopPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // States
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Filter States
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [priceRange, setPriceRange] = useState(1500);
  const [selectedBrand, setSelectedBrand] = useState('All');
  const [minRating, setMinRating] = useState(0);
  const [excludeOutOfStock, setExcludeOutOfStock] = useState(false);
  const [selectedColor, setSelectedColor] = useState('All');
  const [sortBy, setSortBy] = useState('newest');

  const { addToCart } = useCartStore();

  // Read URL queries
  const queryQ = searchParams.get('q') || '';
  const queryCategory = searchParams.get('category') || '';

  useEffect(() => {
    if (queryCategory) {
      setSelectedCategory(queryCategory);
    }
  }, [queryCategory]);

  // Fetch products
  useEffect(() => {
    async function fetchProducts() {
      setLoading(true);
      try {
        let url = `/api/products?q=${encodeURIComponent(queryQ)}&category=${selectedCategory === 'All' ? '' : encodeURIComponent(selectedCategory)}&maxPrice=${priceRange}&rating=${minRating}&sort=${sortBy}`;
        if (selectedBrand !== 'All') {
          url += `&brand=${encodeURIComponent(selectedBrand)}`;
        }
        
        const res = await fetch(url);
        const data = await res.json();
        if (data.success) {
          let list = data.products;
          
          // Exclude out of stock locally
          if (excludeOutOfStock) {
            list = list.filter((p: Product) => p.stockQuantity > 0);
          }

          // Apply color filter locally by scanning product tags or name descriptions
          if (selectedColor !== 'All') {
            const colorLower = selectedColor.toLowerCase();
            list = list.filter((p: Product) => 
              p.name.toLowerCase().includes(colorLower) || 
              p.description.toLowerCase().includes(colorLower) ||
              (p.tags && p.tags.some(t => t.toLowerCase().includes(colorLower)))
            );
          }

          setProducts(list);
        }
      } catch (err) {
        console.error('Error fetching shop products:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, [queryQ, selectedCategory, priceRange, selectedBrand, minRating, excludeOutOfStock, selectedColor, sortBy]);

  const handleResetFilters = () => {
    setSelectedCategory('All');
    setPriceRange(1500);
    setSelectedBrand('All');
    setMinRating(0);
    setExcludeOutOfStock(false);
    setSelectedColor('All');
    setSortBy('newest');
    router.push('/shop');
  };

  const handleListAddToCart = (e: React.MouseEvent, prod: Product) => {
    e.stopPropagation();
    addToCart({
      productId: prod.id,
      name: prod.name,
      price: prod.price,
      originalPrice: prod.originalPrice,
      image: prod.images[0],
      category: prod.category
    }, 1);
    toast.success(`${prod.name} added to cart! 🛍️`);
  };

  const brandsList = ['All', 'Classmate', 'Reynolds', 'Doms', 'Faber-Castell', 'SoftToys', 'JK Paper'];
  const categoriesList = ['All', 'School Supplies', 'Writing Materials', 'Art & Craft', 'Office Supplies', 'Toys', 'Services'];
  
  const colorsList = [
    { name: 'All', class: 'bg-slate-100 border-slate-350' },
    { name: 'Pastel', class: 'bg-amber-100 border-amber-300' },
    { name: 'Sky Blue', class: 'bg-sky-200 border-sky-400' },
    { name: 'Mint', class: 'bg-emerald-100 border-emerald-300' },
    { name: 'Yellow', class: 'bg-yellow-200 border-yellow-400' },
    { name: 'Pink', class: 'bg-pink-200 border-pink-400' },
    { name: 'Lavender', class: 'bg-purple-200 border-purple-400' },
    { name: 'Coral', class: 'bg-red-200 border-red-400' }
  ];

  return (
    <div className="max-w-7xl mx-auto w-full pb-16 font-sans">
      
      {/* Header section */}
      <div className="bg-sky-50 rounded-3xl p-6 mx-4 mt-4">
        <span className="text-sky-500 font-black text-xs uppercase tracking-widest block">
          STATIONERY CATALOG
        </span>
        <h1 className="text-2xl font-black text-slate-800 mt-1">
          Discover all colourful writing & craft supplies
        </h1>
      </div>

      <div className="flex flex-col md:flex-row gap-8 px-4 mt-6">
        
        {/* Left Sidebar Filter Panel */}
        <aside className="w-full md:w-56 shrink-0 space-y-6 bg-white p-5 rounded-3xl border-2 border-slate-100 shadow-sm self-start">
          
          {/* Header */}
          <div className="flex items-center justify-between border-b-2 border-slate-100 pb-3">
            <h2 className="text-sm font-black text-slate-800 flex items-center gap-1.5">
              Filter Tools
              <span className="bg-sky-500 text-white rounded-full text-[10px] px-2 py-0.5 font-black">
                {products.length}
              </span>
            </h2>
            <button 
              onClick={handleResetFilters}
              className="text-[10px] font-black uppercase text-slate-400 hover:text-sky-500 transition-colors"
            >
              Reset
            </button>
          </div>

          {/* Categories */}
          <div className="space-y-2">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-wide">
              Categories
            </h3>
            <div className="flex flex-col space-y-1">
              {categoriesList.map((cat) => {
                const isActive = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`text-left rounded-xl px-3 py-2 font-bold text-sm transition-all ${
                      isActive 
                        ? 'bg-sky-500 text-white shadow-sm' 
                        : 'text-slate-600 hover:bg-sky-50'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Max Price Range Slider */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs font-black text-slate-400">
              <span className="uppercase tracking-wide">Max Price</span>
              <span className="text-sky-500">₹{priceRange}</span>
            </div>
            <input
              type="range"
              min="50"
              max="1500"
              step="50"
              value={priceRange}
              onChange={(e) => setPriceRange(Number(e.target.value))}
              className="w-full accent-sky-500 cursor-pointer h-1.5 bg-slate-100 rounded-lg appearance-none"
            />
            <div className="flex justify-between text-[10px] font-bold text-slate-400 leading-none">
              <span>₹50</span>
              <span>₹750</span>
              <span>₹1500+</span>
            </div>
          </div>

          {/* Brands Checklist */}
          <div className="space-y-2">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-wide">
              Brands
            </h3>
            <div className="flex flex-col gap-1.5">
              {brandsList.map((br) => {
                const isActive = selectedBrand === br;
                return (
                  <button
                    key={br}
                    onClick={() => setSelectedBrand(br)}
                    className={`text-left rounded-xl px-3 py-1.5 text-xs font-black transition-all border-2 ${
                      isActive 
                        ? 'bg-sky-500 text-white border-sky-500 shadow-sm' 
                        : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {br}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Minimum Rating */}
          <div className="space-y-2">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-wide">
              Minimum Rating
            </h3>
            <div className="flex flex-col space-y-1">
              {[4, 3, 2, 0].map((stars) => {
                const isActive = minRating === stars;
                return (
                  <button
                    key={stars}
                    onClick={() => setMinRating(stars)}
                    className={`flex items-center gap-1.5 px-2 py-1.5 rounded-xl transition-all ${
                      isActive ? 'bg-sky-50 text-sky-500 font-black' : 'hover:bg-slate-50 text-slate-500 font-bold'
                    }`}
                  >
                    <div className="flex text-sunny-400">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`h-3 w-3 ${
                            i < stars ? 'fill-current' : 'text-slate-200'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-[10px]">{stars > 0 ? '& Up' : 'Any'}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Aesthetic Colors Filter */}
          <div className="space-y-2">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-wide">
              Aesthetic Colors
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {colorsList.map((color) => {
                const isActive = selectedColor === color.name;
                return (
                  <button
                    key={color.name}
                    onClick={() => setSelectedColor(color.name)}
                    className={`rounded-full px-3 py-1.5 text-[10px] font-black border-2 transition-all flex items-center gap-1.5 ${
                      isActive 
                        ? 'bg-slate-800 text-white border-slate-800 shadow-sm' 
                        : 'bg-white text-slate-650 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <span className={`w-2.5 h-2.5 rounded-full border border-slate-400/20 ${color.class}`} />
                    <span>{color.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Exclude Out of Stock */}
          <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
            <input
              type="checkbox"
              id="exclude-stock"
              checked={excludeOutOfStock}
              onChange={(e) => setExcludeOutOfStock(e.target.checked)}
              className="w-4 h-4 rounded text-sky-500 focus:ring-sky-400 border-slate-300"
            />
            <label htmlFor="exclude-stock" className="text-xs font-black text-slate-600 select-none cursor-pointer">
              Exclude Out of Stock
            </label>
          </div>

        </aside>

        {/* Right Catalog Grid */}
        <main className="flex-1 space-y-6">
          
          {/* Top Row Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-white p-4 rounded-3xl border-2 border-slate-100 shadow-sm gap-4">
            <p className="text-xs font-bold text-slate-400">
              {loading ? (
                'Loading matching catalog...'
              ) : (
                <>
                  Showing <strong className="text-slate-700">{products.length}</strong> items
                  {queryQ && (
                    <> for "<strong className="text-sky-500">{queryQ}</strong>"</>
                  )}
                </>
              )}
            </p>

            <div className="flex items-center justify-between sm:justify-start gap-4">
              {/* Sort By Dropdown */}
              <div className="flex items-center space-x-1.5 text-xs font-bold">
                <span className="text-slate-400">Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="font-black text-slate-700 bg-transparent border-b-2 border-sky-200 focus:outline-none focus:border-sky-400 pb-0.5 cursor-pointer"
                >
                  <option value="newest">Newest Arrivals</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                  <option value="rating">Customer Rating</option>
                  <option value="popular">Most Popular</option>
                </select>
              </div>

              {/* Grid/List toggles */}
              <div className="flex border-2 border-slate-200 rounded-xl overflow-hidden shadow-xs">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 transition-colors ${
                    viewMode === 'grid' ? 'bg-sky-50 text-sky-500' : 'bg-white text-slate-400 hover:bg-slate-55/40'
                  }`}
                >
                  <Grid className="h-4.5 w-4.5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 transition-colors ${
                    viewMode === 'list' ? 'bg-sky-50 text-sky-500' : 'bg-white text-slate-400 hover:bg-slate-55/40'
                  }`}
                >
                  <List className="h-4.5 w-4.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Product Items Display */}
          {loading ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="aspect-square bg-slate-50 border border-slate-100 rounded-3xl animate-pulse" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 bg-white rounded-3xl border-2 border-dashed border-slate-200 text-center space-y-4 shadow-sm">
              <div className="p-4 bg-amber-50 rounded-full border border-amber-200 text-amber-500">
                <AlertCircle className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-black text-slate-800">No matching products found</h3>
              <p className="text-xs font-bold text-slate-400 max-w-sm">
                We couldn't find any products matching your current filters. Try resetting the criteria.
              </p>
              <button
                onClick={handleResetFilters}
                className="px-5 py-2.5 bg-sky-500 hover:bg-sky-600 text-white font-black text-xs rounded-full shadow-md transition-all hover:scale-105"
              >
                Reset All Filters
              </button>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((prod) => (
                <ProductCard
                  key={prod.id}
                  product={prod}
                  onQuickView={(p) => setSelectedProduct(p)}
                />
              ))}
            </div>
          ) : (
            /* List View */
            <div className="space-y-4">
              {products.map((prod) => {
                const discountPercentage = Math.round(
                  ((prod.originalPrice - prod.price) / prod.originalPrice) * 100
                );
                const isOutOfStock = prod.stockQuantity === 0;
                return (
                  <div
                    key={prod.id}
                    onClick={() => setSelectedProduct(prod)}
                    className="flex flex-col sm:flex-row bg-white rounded-3xl border-2 border-slate-100 hover:border-sky-300 p-4 gap-6 cursor-pointer shadow-sm hover:shadow-md transition-all duration-300"
                  >
                    {/* Image */}
                    <div className="relative w-full sm:w-44 aspect-square bg-slate-50 rounded-2xl overflow-hidden shrink-0 self-center border border-slate-100">
                      <img src={prod.images[0]} alt={prod.name} className="w-full h-full object-cover" />
                      {discountPercentage > 0 && (
                        <span className="absolute top-2.5 left-2.5 bg-pink-500 text-white font-black text-[10px] px-2 py-0.5 rounded-md">
                          -{discountPercentage}%
                        </span>
                      )}
                    </div>

                    {/* Middle details */}
                    <div className="flex-1 flex flex-col justify-between py-1">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-[10px] font-black tracking-wide uppercase">
                          <span className="text-sky-500">{prod.brand}</span>
                          <span className="text-slate-300">•</span>
                          <span className="text-slate-400">{prod.category}</span>
                        </div>
                        <h3 className="text-base font-black text-slate-800 leading-snug group-hover:text-sky-500 transition-colors">
                          {prod.name}
                        </h3>
                        <div className="flex items-center gap-1.5">
                          <div className="flex text-sunny-400">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={`h-3.5 w-3.5 ${
                                  i < Math.round(prod.rating) ? 'fill-current' : 'text-slate-200'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-[10px] font-black text-slate-400">({prod.reviewsCount} reviews)</span>
                        </div>
                        <p className="text-xs font-bold text-slate-450 leading-relaxed line-clamp-2">
                          {prod.description}
                        </p>
                      </div>

                      {/* Stock status */}
                      <div className="mt-3">
                        {isOutOfStock ? (
                          <span className="bg-rose-50 border border-rose-100 text-rose-500 text-[10px] font-black px-2.5 py-1 rounded-full">
                            Out of Stock
                          </span>
                        ) : prod.stockQuantity <= 3 ? (
                          <span className="bg-coral-50 border border-coral-100 text-coral-500 text-[10px] font-black px-2.5 py-1 rounded-full animate-pulse">
                            Only {prod.stockQuantity} items left! 🔥
                          </span>
                        ) : (
                          <span className="bg-mint-50 border border-mint-100 text-mint-500 text-[10px] font-black px-2.5 py-1 rounded-full">
                            In stock
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Right actions */}
                    <div className="w-full sm:w-40 pt-4 sm:pt-0 sm:pl-6 border-t sm:border-t-0 sm:border-l border-slate-100 flex flex-col justify-center shrink-0">
                      <div className="mb-4 text-center sm:text-left">
                        <div className="flex items-baseline justify-center sm:justify-start gap-1">
                          <span className="text-xl font-black text-slate-800">₹{prod.price}</span>
                          {discountPercentage > 0 && (
                            <span className="text-xs font-bold text-slate-400 line-through">₹{prod.originalPrice}</span>
                          )}
                        </div>
                        <p className="text-[10px] font-bold text-slate-400 mt-1">Inclusive of all taxes</p>
                      </div>

                      <div className="flex sm:flex-col gap-2">
                        <button
                          type="button"
                          onClick={(e) => handleListAddToCart(e, prod)}
                          disabled={isOutOfStock}
                          className={`flex-1 py-2.5 rounded-2xl font-black text-xs flex items-center justify-center space-x-2 transition-all transform active:scale-95 ${
                            isOutOfStock
                              ? 'bg-slate-100 text-slate-300 border border-slate-200 cursor-not-allowed'
                              : 'bg-sky-500 hover:bg-sky-600 text-white shadow-md'
                          }`}
                        >
                          <span>Add to Cart</span>
                        </button>
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          )}

          {/* Simple Pagination */}
          <div className="flex justify-center items-center gap-2 pt-6">
            <button className="bg-sky-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-black text-sm shadow-sm">
              1
            </button>
            <button className="bg-white border-2 border-slate-200 hover:border-sky-300 rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm text-slate-600 hover:bg-slate-50 transition-all">
              2
            </button>
          </div>

        </main>

      </div>

      <QuickViewModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
      />

    </div>
  );
}

export default function ShopPage() {
  return (
    <React.Suspense fallback={
      <div className="mx-auto max-w-7xl w-full px-4 py-16 text-center space-y-4 animate-pulse">
        <div className="h-6 w-32 bg-slate-150 rounded mx-auto" />
        <div className="h-10 w-full bg-slate-100 rounded-2xl mx-auto" />
        <p className="text-xs text-slate-400 font-black">Loading shop catalog...</p>
      </div>
    }>
      <ShopPageContent />
    </React.Suspense>
  );
}
