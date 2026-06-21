'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ChevronLeft, ChevronRight, BookOpen, PenTool, Palette, 
  Layers, MapPin, Phone, Clock, ArrowRight, Sparkles, Star,
  Upload, Loader2, Minus, Plus, FileCheck, Trash2, MessageSquare
} from 'lucide-react';
import ProductCard from '@/components/ProductCard';
import QuickViewModal from '@/components/QuickViewModal';
import { Product } from '@/lib/db';
import { useCartStore } from '@/store/cartStore';
import toast from 'react-hot-toast';

const HERO_SLIDES = [
  {
    id: 1,
    badge: '🌟 Vels Global School Partner',
    title: '🏫 Your Complete School & College Hub!',
    subtitle: 'Notebooks, textbooks, exam pads, practical record books, and project charts at the best rates in Chennai.',
    buttonText: 'Explore Catalog →',
    link: '/shop',
    bgClass: 'from-sunny-100 via-coral-100 to-pink-100',
    image: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 2,
    badge: '🖨️ Instant Print & Xerox',
    title: '🖨️ Xerox, Spiral Binding & Printing',
    subtitle: 'Upload documents online. High-speed laser black & white or color copies, spiral book binding, and project reports.',
    buttonText: 'Upload Documents →',
    link: '#print-section',
    bgClass: 'from-sky-100 via-lavender-100 to-sky-100',
    image: 'https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 3,
    badge: '🧸 Play & Learn',
    title: '🧸 Kids Educational Toys & Gifts',
    subtitle: 'Huggable pink teddy bears, building bricks, puzzle boards, board games, and delightful birthday gifts.',
    buttonText: 'Shop Toys →',
    link: '/shop?category=Toys',
    bgClass: 'from-lavender-100 via-sky-100 to-mint-100',
    image: 'https://images.unsplash.com/photo-1559251606-c623743a6d76?w=600&auto=format&fit=crop&q=80',
  }
];

export default function HomePage() {
  const router = useRouter();
  const { addToCart } = useCartStore();

  const [activeHeroIndex, setActiveHeroIndex] = useState(0);
  const [products, setProducts] = useState<Product[]>([]);
  const [gallery, setGallery] = useState<any[]>([]);
  const [mapUrl, setMapUrl] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('8900989005');
  const [storeTimings, setStoreTimings] = useState('7:30 AM – 11:30 PM (Daily)');
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Print Section States
  const [file, setFile] = useState<File | null>(null);
  const [fileUrl, setFileUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [pagesCount, setPagesCount] = useState(10);
  const [printMode, setPrintMode] = useState<'BW' | 'Color'>('BW');
  const [bindingStyle, setBindingStyle] = useState<'None' | 'Spiral' | 'Project' | 'Record'>('None');
  const [copiesCount, setCopiesCount] = useState(1);

  // Auto slide hero banner
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveHeroIndex((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 5500);
    return () => clearInterval(timer);
  }, []);

  // Fetch Page Data
  useEffect(() => {
    async function loadData() {
      try {
        const prodRes = await fetch('/api/products');
        const prodData = await prodRes.json();
        
        const settingsRes = await fetch('/api/settings');
        const settingsData = await settingsRes.json();

        const galleryRes = await fetch('/api/gallery');
        const galleryData = await galleryRes.json();

        if (prodData.success) setProducts(prodData.products);
        if (galleryData.success) setGallery(galleryData.gallery);
        if (settingsData.success && settingsData.settings) {
          setMapUrl(settingsData.settings.mapEmbedUrl);
          if (settingsData.settings.whatsappNumber) setWhatsappNumber(settingsData.settings.whatsappNumber);
          if (settingsData.settings.storeTimings) setStoreTimings(settingsData.settings.storeTimings);
        }
      } catch (err) {
        console.error('Error fetching home page resources:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const nextHero = () => {
    setActiveHeroIndex((prev) => (prev + 1) % HERO_SLIDES.length);
  };

  const prevHero = () => {
    setActiveHeroIndex((prev) => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length);
  };

  // Price Calculation Formula
  const pageRate = printMode === 'Color' ? 8 : 2;
  const bindingCost = 
    bindingStyle === 'Spiral' ? 40 : 
    bindingStyle === 'Project' ? 60 : 
    bindingStyle === 'Record' ? 90 : 0;
  const totalPrintCost = ((pagesCount * pageRate) + bindingCost) * copiesCount;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setUploading(true);

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('type', 'print');

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setFileUrl(data.url);
        toast.success('Document uploaded successfully! 📁');
        if (selectedFile.type.startsWith('image/')) {
          setPagesCount(1);
        } else {
          setPagesCount(12); // Default page estimate for documents
        }
      } else {
        toast.error(data.message || 'File upload failed');
        setFile(null);
      }
    } catch (err) {
      toast.error('Network error during file upload.');
      setFile(null);
    } finally {
      setUploading(false);
    }
  };

  const handleAddPrintJobToCart = () => {
    if (uploading) {
      toast.error('Please wait for the file to finish uploading! ⏳');
      return;
    }
    if (!file || !fileUrl) {
      toast.error('Please select and upload a document first! 📁');
      return;
    }

    const cartItem = {
      productId: `print-${Date.now()}`,
      name: `🖨️ Print: ${file.name} (${pagesCount} pgs, ${printMode === 'Color' ? 'Color' : 'B&W'}, ${bindingStyle} Bind)`,
      price: totalPrintCost,
      originalPrice: totalPrintCost + Math.round(totalPrintCost * 0.15),
      image: 'https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?w=500&auto=format&fit=crop&q=80',
      category: 'Services',
    };

    addToCart(cartItem, 1);
    toast.success('Print job added to cart! 🛒');
    router.push('/cart');
  };

  const newArrivals = products.slice(0, 4);
  const bestSellers = products.filter(p => p.rating >= 4.7).slice(0, 4);

  return (
    <div className="w-full space-y-16 pb-16 font-sans">
      
      {/* SECTION A: Hero Slider */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        <div className={`relative rounded-[2rem] overflow-hidden bg-gradient-to-r ${HERO_SLIDES[activeHeroIndex].bgClass} p-8 md:p-12 min-h-[420px] flex flex-col md:flex-row items-center justify-between gap-8 transition-all duration-500 shadow-md`}>
          
          {/* Left Text */}
          <div className="flex-1 space-y-4 text-left z-10">
            <span className="bg-white rounded-full px-3 py-1 text-xs font-black border border-slate-200 shadow-sm mb-4 inline-block">
              {HERO_SLIDES[activeHeroIndex].badge}
            </span>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-800 leading-tight">
              {HERO_SLIDES[activeHeroIndex].title}
            </h1>
            <p className="text-base font-bold text-slate-600 leading-relaxed max-w-lg">
              {HERO_SLIDES[activeHeroIndex].subtitle}
            </p>
            <div className="pt-2">
              <Link 
                href={HERO_SLIDES[activeHeroIndex].link}
                className="bg-coral-500 text-white rounded-full px-6 py-3 font-black inline-flex items-center gap-2 hover:bg-coral-600 hover:scale-105 transition-all shadow-md"
              >
                <span>{HERO_SLIDES[activeHeroIndex].buttonText}</span>
              </Link>
            </div>
          </div>

          {/* Right Image */}
          <div className="w-full md:w-[45%] max-w-md aspect-video md:aspect-[4/3] rounded-3xl overflow-hidden shadow-lg border-4 border-white bg-slate-50 z-10">
            <img 
              src={HERO_SLIDES[activeHeroIndex].image} 
              alt="Carousel Banner" 
              className="w-full h-full object-cover"
            />
          </div>

          {/* Arrows */}
          <button
            onClick={prevHero}
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-white rounded-full p-2.5 shadow-md border border-slate-200 text-slate-600 hover:scale-110 active:scale-95 transition-all z-20"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={nextHero}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-white rounded-full p-2.5 shadow-md border border-slate-200 text-slate-600 hover:scale-110 active:scale-95 transition-all z-20"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          {/* Dots Indicator */}
          <div className="absolute bottom-6 left-12 flex space-x-2 z-20">
            {HERO_SLIDES.map((slide, idx) => (
              <button
                key={slide.id}
                onClick={() => setActiveHeroIndex(idx)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  activeHeroIndex === idx ? 'bg-slate-700 w-6' : 'bg-slate-300 w-2'
                }`}
              />
            ))}
          </div>

        </div>
      </section>

      {/* SECTION B: Print Job Section */}
      <section id="print-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        <div className="border-4 border-dashed border-sky-200 rounded-[2rem] p-6 md:p-8 bg-white grid grid-cols-1 lg:grid-cols-2 gap-8 shadow-sm">
          
          {/* Left Column Description */}
          <div className="space-y-5">
            <span className="text-sky-500 font-black text-xs border border-sky-200 rounded-full px-3 py-1 inline-block uppercase tracking-wider bg-sky-50/50">
              🖨️ INSTANT UPLOAD & PICKUP
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-800 leading-tight">
              School Project & <span className="text-sky-500">Printing Support</span> 🖨️🎓
            </h2>
            <p className="text-base font-bold text-slate-600 leading-relaxed">
              Skip the long queues! Upload your school presentation slides, practical records, thesis drafts, or notes. We print, bind, and pack it ready for delivery or instant boutique pickup at Medavakkam.
            </p>
            
            {/* Price list box */}
            <div className="bg-slate-50 rounded-2xl p-5 space-y-3 border-2 border-slate-100">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Rate Card</h4>
              <div className="space-y-2 text-sm font-bold text-slate-700">
                <p className="flex items-center justify-between">
                  <span>⚡ Black & White Print:</span>
                  <span className="text-slate-900 font-black">₹2.00 / sheet</span>
                </p>
                <p className="flex items-center justify-between">
                  <span>🎨 Full Color Print:</span>
                  <span className="text-sky-500 font-black">₹8.00 / sheet</span>
                </p>
                <p className="flex items-center justify-between">
                  <span>📚 Binding Choices:</span>
                  <span className="text-slate-900 font-black">Spiral(₹40), Project(₹60), Record(₹90)</span>
                </p>
              </div>
            </div>
          </div>

          {/* Right Column Config Panel */}
          <div className="bg-slate-50 rounded-2xl p-6 border-2 border-slate-150 shadow-inner space-y-5">
            <h3 className="font-black text-sm text-slate-700 uppercase tracking-wide">
              Configure Print Job
            </h3>

            {/* File Upload Area */}
            <div className="space-y-1.5">
              <span className="text-xs font-black text-slate-500 uppercase tracking-wide">
                SELECT DOCUMENT (PDF/DOCX/JPG MAX 20MB)
              </span>
              
              {file ? (
                <div className="p-4 bg-white border-2 border-slate-200 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center space-x-3 truncate">
                    <div className="p-2 bg-sky-100 text-sky-500 rounded-xl shrink-0">
                      <FileCheck className="h-6 w-6" />
                    </div>
                    <div className="text-xs truncate">
                      <p className="font-black text-slate-800 truncate">{file.name}</p>
                      <p className="text-slate-400 font-bold mt-0.5">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  </div>
                  <button
                    onClick={() => { setFile(null); setFileUrl(''); }}
                    className="p-1.5 hover:bg-rose-50 text-rose-500 rounded-xl transition-all"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              ) : (
                <div className="group relative border-2 border-dashed border-slate-300 hover:border-sky-400 rounded-2xl p-6 text-center cursor-pointer transition-all bg-white hover:bg-sky-50/20">
                  <input
                    type="file"
                    onChange={handleFileUpload}
                    accept=".pdf,.doc,.docx,.ppt,.pptx,image/*"
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    disabled={uploading}
                  />
                  {uploading ? (
                    <div className="flex flex-col items-center py-2 space-y-2">
                      <Loader2 className="animate-spin h-6 w-6 text-sky-500" />
                      <span className="text-xs font-black text-slate-600">Uploading File...</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center py-2 space-y-1">
                      <Upload className="h-6 w-6 text-sky-500 group-hover:scale-110 transition-transform" />
                      <span className="text-xs font-black text-sky-500">Tap to Choose File</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Mode Select */}
            <div className="space-y-1.5">
              <span className="text-xs font-black text-slate-500 uppercase tracking-wide">
                PRINT MODE
              </span>
              <div className="grid grid-cols-2 gap-3 text-xs font-black">
                <button
                  type="button"
                  onClick={() => setPrintMode('BW')}
                  className={`py-3 rounded-xl border-2 transition-all ${
                    printMode === 'BW'
                      ? 'bg-slate-800 text-white border-slate-800'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  B&W (₹2/pg)
                </button>
                <button
                  type="button"
                  onClick={() => setPrintMode('Color')}
                  className={`py-3 rounded-xl border-2 transition-all ${
                    printMode === 'Color'
                      ? 'bg-slate-800 text-white border-slate-800'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  Color (₹8/pg)
                </button>
              </div>
            </div>

            {/* Pages & Copies Row */}
            <div className="grid grid-cols-2 gap-4">
              {/* Pages */}
              <div className="space-y-1.5">
                <span className="text-xs font-black text-slate-500 uppercase tracking-wide">
                  NUMBER OF PAGES
                </span>
                <div className="flex items-center justify-between bg-white border-2 border-slate-200 rounded-xl px-3 py-1.5">
                  <button
                    type="button"
                    onClick={() => setPagesCount(Math.max(1, pagesCount - 1))}
                    className="p-1 rounded-lg text-slate-500 hover:bg-slate-100"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="text-sm font-black text-slate-800">{pagesCount}</span>
                  <button
                    type="button"
                    onClick={() => setPagesCount(pagesCount + 1)}
                    className="p-1 rounded-lg text-slate-500 hover:bg-slate-100"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Copies */}
              <div className="space-y-1.5">
                <span className="text-xs font-black text-slate-500 uppercase tracking-wide">
                  COPIES
                </span>
                <div className="flex items-center justify-between bg-white border-2 border-slate-200 rounded-xl px-3 py-1.5">
                  <button
                    type="button"
                    onClick={() => setCopiesCount(Math.max(1, copiesCount - 1))}
                    className="p-1 rounded-lg text-slate-500 hover:bg-slate-100"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="text-sm font-black text-slate-800">{copiesCount}</span>
                  <button
                    type="button"
                    onClick={() => setCopiesCount(copiesCount + 1)}
                    className="p-1 rounded-lg text-slate-500 hover:bg-slate-100"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Binding Style */}
            <div className="space-y-1.5">
              <span className="text-xs font-black text-slate-500 uppercase tracking-wide">
                BINDING STYLE SELECTION
              </span>
              <select
                value={bindingStyle}
                onChange={(e: any) => setBindingStyle(e.target.value)}
                className="w-full px-3 py-2.5 text-xs font-bold rounded-2xl border-2 border-slate-200 bg-white focus:outline-none focus:border-sky-400 text-slate-700"
              >
                <option value="None">No Binding (Loose Sheets)</option>
                <option value="Spiral">Spiral Binding (+₹40)</option>
                <option value="Project">Project Bound Cover (+₹60)</option>
                <option value="Record">Record Hard Bound Cover (+₹90)</option>
              </select>
            </div>

            {/* Pricing Cost Display */}
            <div className="pt-4 border-t border-dashed border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wide leading-none">
                  CALCULATED PRINT JOB COST
                </span>
                <p className="text-3xl font-black text-slate-850">
                  ₹{totalPrintCost}
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddPrintJobToCart}
                className="bg-mint-500 hover:bg-mint-600 text-white rounded-2xl font-black px-5 py-3 hover:scale-105 transition-all shadow-sm flex items-center gap-1.5 text-sm"
              >
                Add Print Job to Cart 🛒
              </button>
            </div>

          </div>

        </div>
      </section>

      {/* SECTION C: Shop by Vibrant Categories */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        <div className="space-y-1 text-center">
          <h2 className="text-3xl font-black text-slate-850">
            🎨 Shop by <span className="text-coral-500">Vibrant Categories</span>
          </h2>
          <p className="text-base font-bold text-slate-500 max-w-lg mx-auto">
            Krishna Students store brings you Chennai's largest hub of school records, toys, textbooks, and office crafts.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
          
          {/* Card 1 */}
          <Link href="/shop?category=School Supplies" className="group rounded-3xl border-2 border-dashed border-sky-200 bg-sky-50 p-6 hover:shadow-lg transition-all cursor-pointer">
            <div className="p-3 bg-sky-100 rounded-2xl text-sky-500 w-fit">
              <BookOpen className="h-6 w-6" />
            </div>
            <h3 className="text-sky-600 font-black text-lg mt-4">
              School Supplies
            </h3>
            <p className="text-xs font-bold text-slate-500 leading-normal mt-1">
              Notebooks, practical records, exam pads
            </p>
          </Link>

          {/* Card 2 */}
          <Link href="/shop?category=Writing Materials" className="group rounded-3xl border-2 border-dashed border-lavender-200 bg-lavender-50 p-6 hover:shadow-lg transition-all cursor-pointer">
            <div className="p-3 bg-lavender-100 rounded-2xl text-lavender-550 w-fit">
              <PenTool className="h-6 w-6" />
            </div>
            <h3 className="text-lavender-600 font-black text-lg mt-4">
              Writing Materials
            </h3>
            <p className="text-xs font-bold text-slate-500 leading-normal mt-1">
              Pastel gel pens, fountain pens, pencils
            </p>
          </Link>

          {/* Card 3 */}
          <Link href="/shop?category=Art %26 Craft" className="group rounded-3xl border-2 border-dashed border-coral-200 bg-coral-50 p-6 hover:shadow-lg transition-all cursor-pointer">
            <div className="p-3 bg-pink-100 rounded-2xl text-pink-500 w-fit">
              <Palette className="h-6 w-6" />
            </div>
            <h3 className="text-pink-500 font-black text-lg mt-4">
              Art & Craft
            </h3>
            <p className="text-xs font-bold text-slate-500 leading-normal mt-1">
              Crayons, drawing sheets, watercolors
            </p>
          </Link>

          {/* Card 4 */}
          <Link href="/shop?category=Toys" className="group rounded-3xl border-2 border-dashed border-mint-200 bg-mint-50 p-6 hover:shadow-lg transition-all cursor-pointer">
            <div className="p-3 bg-mint-100 rounded-2xl text-mint-500 w-fit">
              <Layers className="h-6 w-6" />
            </div>
            <h3 className="text-mint-600 font-black text-lg mt-4">
              Toys & Gifts
            </h3>
            <p className="text-xs font-bold text-slate-500 leading-normal mt-1">
              Puzzles, plush teddy bears, greeting cards
            </p>
          </Link>

        </div>
      </section>

      {/* SECTION D: Fresh New Arrivals */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 space-y-6">
        <div className="flex justify-between items-end border-b-2 border-slate-100 pb-3">
          <h2 className="text-2xl font-black text-slate-800">
            ✨ Fresh New <span className="text-sky-500">Arrivals</span>
          </h2>
          <Link href="/shop" className="text-sky-500 font-black text-sm hover:underline flex items-center gap-1">
            View All Shop →
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="aspect-square bg-slate-50 border border-slate-100 rounded-3xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {newArrivals.map((prod) => (
              <ProductCard 
                key={prod.id} 
                product={prod} 
                onQuickView={(p) => setSelectedProduct(p)} 
              />
            ))}
          </div>
        )}
      </section>

      {/* SECTION E: Store Best Sellers */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        <div className="bg-sunny-50 rounded-[2rem] p-6 md:p-8 space-y-6 border border-sunny-200/50 shadow-sm">
          <div className="flex justify-between items-end border-b-2 border-sunny-200/50 pb-3">
            <h2 className="text-2xl font-black text-slate-800">
              🏆 Store <span className="text-coral-500">Best Sellers</span>
            </h2>
            <Link href="/shop" className="text-coral-500 font-black text-sm hover:underline">
              Shop Top Rated →
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="aspect-square bg-white border border-slate-100 rounded-3xl animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {bestSellers.map((prod) => (
                <ProductCard 
                  key={prod.id} 
                  product={prod} 
                  onQuickView={(p) => setSelectedProduct(p)} 
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* SECTION F: Visit Our Store */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        <div className="bg-white rounded-[2rem] border border-slate-100 p-6 md:p-8 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          
          {/* Details */}
          <div className="space-y-5">
            <span className="text-sky-500 font-black text-xs uppercase tracking-widest">
              VISIT OUR MEDAVAKKAM BOUTIQUE
            </span>
            <h2 className="text-3xl font-black text-slate-855 leading-tight">
              Experience Stationery Joy In Person! 🏪 ✨
            </h2>
            <p className="text-sm font-bold text-slate-500 leading-relaxed">
              We are conveniently located directly on the main corridor right near <strong>Vels Global School</strong> in Medavakkam. Come in to check paper formats, touch smooth drawing sheets, or consult for high speed binding assignments.
            </p>

            <div className="space-y-3.5 text-sm font-bold text-slate-600">
              <div className="flex items-start">
                <MapPin className="h-5 w-5 text-coral-500 mr-3 shrink-0 mt-0.5" />
                <span>427/200B, Ground Floor, Medavakkam-Mambakkam Road, Near Vels Global School, Medavakkam, Chennai - 600100</span>
              </div>
              <div className="flex items-center">
                <Clock className="h-5 w-5 text-sunny-500 mr-3 shrink-0" />
                <span>Operating Hours: 7:30 AM – 11:30 PM (Daily)</span>
              </div>
              <div className="flex items-center">
                <MessageSquare className="h-5 w-5 text-mint-500 mr-3 shrink-0" />
                <a href="https://wa.me/918900989005" target="_blank" rel="noreferrer" className="hover:text-sky-500">
                  WhatsApp Support: +91 89009 89005
                </a>
              </div>
            </div>
          </div>

          {/* Map Frame */}
          <div className="w-full h-80 rounded-2xl overflow-hidden border-2 border-slate-100 shadow-inner">
            {mapUrl ? (
              <iframe
                src={mapUrl}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen={false}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            ) : (
              <div className="w-full h-full bg-slate-50 flex items-center justify-center text-xs text-slate-400 italic font-bold">
                Loading Location Map...
              </div>
            )}
          </div>

        </div>
      </section>

      {/* Quick View Modal Overlay */}
      <QuickViewModal 
        product={selectedProduct} 
        onClose={() => setSelectedProduct(null)} 
      />

    </div>
  );
}
