'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { X, Camera } from 'lucide-react';
import toast from 'react-hot-toast';

export default function StoreGalleryPage() {
  const router = useRouter();
  const [gallery, setGallery] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTag, setSelectedTag] = useState('All');
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  useEffect(() => {
    async function fetchGallery() {
      try {
        const res = await fetch('/api/gallery');
        const data = await res.json();
        if (data.success) {
          setGallery(data.gallery);
        }
      } catch (err) {
        console.error('Error fetching gallery items:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchGallery();
  }, []);

  const pills = [
    { label: 'All', value: 'All' },
    { label: 'Storefront', value: 'Store Front' },
    { label: 'Notebooks', value: 'Office Supplies' },
    { label: 'Pens', value: 'Writing Materials' },
    { label: 'Art Supplies', value: 'Art Corner' },
    { label: 'Desk Decor', value: 'Kids Toys' }
  ];

  // Map category matching dynamically
  const filteredGallery = selectedTag === 'All'
    ? gallery
    : gallery.filter((item) => {
        const dbCat = item.category.toLowerCase().trim();
        const tagVal = selectedTag.toLowerCase().trim();
        return dbCat === tagVal || dbCat.includes(tagVal) || tagVal.includes(dbCat);
      });

  const handleNextPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (lightboxIndex === null) return;
    setLightboxIndex((lightboxIndex + 1) % filteredGallery.length);
  };

  const handlePrevPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (lightboxIndex === null) return;
    setLightboxIndex((lightboxIndex - 1 + filteredGallery.length) % filteredGallery.length);
  };

  return (
    <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8 font-sans">
      
      {/* Header Centered */}
      <div className="text-center max-w-xl mx-auto space-y-2">
        <span className="bg-lavender-100 text-lavender-600 rounded-full border border-lavender-200 text-xs font-black px-3 py-1 inline-block animate-pulse">
          👁️ VIRTUAL TOUR
        </span>
        <h1 className="text-3xl font-black text-slate-800">
          Our Pastel <span className="text-lavender-500">Stationery Haven</span> 🏪 ✨
        </h1>
        <p className="text-sm font-bold text-slate-500 leading-relaxed">
          Experience the colourful shelves, notebook stacks, drawing palettes, and high-speed printing hubs of our Chennai boutique.
        </p>
      </div>

      {/* Filter Tabs Row */}
      <div className="flex flex-wrap justify-center gap-2">
        {pills.map((pill) => {
          const isActive = selectedTag === pill.value;
          return (
            <button
              key={pill.label}
              onClick={() => setSelectedTag(pill.value)}
              className={`rounded-full px-4 py-2 text-xs transition-all duration-200 ${
                isActive 
                  ? 'bg-lavender-500 text-white font-black shadow-sm' 
                  : 'bg-white border-2 border-slate-200 text-slate-650 font-bold hover:bg-slate-50'
              }`}
            >
              {pill.label}
            </button>
          );
        })}
      </div>

      {/* Masonry / Grid Display */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="aspect-video bg-slate-50 rounded-2xl border border-slate-100 animate-pulse" />
          ))}
        </div>
      ) : filteredGallery.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border-2 border-dashed border-slate-200 max-w-md mx-auto space-y-2">
          <Camera className="h-8 w-8 text-slate-350 mx-auto" />
          <h3 className="text-sm font-black text-slate-700">No photos in this shelf yet</h3>
          <p className="text-xs text-slate-405 font-bold">Try checking our Storefront or Art Supplies tabs!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGallery.map((item, idx) => (
            <div
              key={item.id}
              onClick={() => setLightboxIndex(idx)}
              className="group relative rounded-2xl overflow-hidden shadow-sm hover:scale-105 hover:shadow-xl transition-all duration-300 cursor-pointer border border-slate-150"
            >
              <img
                src={item.imageUrl}
                alt={item.caption}
                className="w-full aspect-video object-cover"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <span className="text-[9px] uppercase font-black text-sunny-400 tracking-wider">
                  {item.category}
                </span>
                <p className="text-xs font-black leading-snug mt-1">
                  {item.caption}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CTA Banner at bottom */}
      <div className="bg-sunny-50 border-2 border-dashed border-sunny-300 rounded-[2rem] p-6 md:p-8 flex flex-col md:flex-row justify-between items-center gap-6 mt-12 shadow-sm">
        <div className="space-y-1 text-center md:text-left">
          <h3 className="font-black text-lg text-slate-800">
            ✨ Loved what you saw? Shop our catalog!
          </h3>
          <p className="text-xs font-bold text-slate-500 max-w-xl">
            Bring home the colorful notebook packs, pastel writing pens, child-safe watercolor paints, and gifts you saw in the gallery with express Medavakkam delivery.
          </p>
        </div>
        <button
          onClick={() => router.push('/shop')}
          className="bg-sky-500 text-white rounded-full px-6 py-3 font-black hover:bg-sky-600 hover:scale-105 transition-all shadow-md shrink-0"
        >
          Explore Stationery Items 🛍️
        </button>
      </div>

      {/* Lightbox Modal overlay */}
      {lightboxIndex !== null && filteredGallery[lightboxIndex] && (
        <div 
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setLightboxIndex(null)}
        >
          {/* Close button */}
          <button
            onClick={() => setLightboxIndex(null)}
            className="absolute top-6 right-6 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/20 shadow-md"
          >
            <X className="h-6 w-6" />
          </button>

          {/* Chevrons */}
          <button
            onClick={handlePrevPhoto}
            className="absolute left-6 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/25 active:scale-90 transition-all"
          >
            <span className="text-xl">❮</span>
          </button>
          <button
            onClick={handleNextPhoto}
            className="absolute right-6 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/25 active:scale-90 transition-all"
          >
            <span className="text-xl">❯</span>
          </button>

          {/* Photo frame */}
          <div 
            className="max-w-4xl max-h-[80vh] flex flex-col items-center space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={filteredGallery[lightboxIndex].imageUrl}
              alt=""
              className="max-w-full max-h-[70vh] object-contain rounded-2xl shadow-2xl border border-white/10"
            />
            <div className="text-center text-white px-6 max-w-xl">
              <span className="text-[10px] uppercase font-black text-sunny-300 tracking-widest">
                {filteredGallery[lightboxIndex].category}
              </span>
              <p className="text-xs font-semibold leading-relaxed mt-1 text-gray-200">
                {filteredGallery[lightboxIndex].caption}
              </p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
