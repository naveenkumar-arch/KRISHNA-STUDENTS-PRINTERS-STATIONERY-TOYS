'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';

interface PromoSettings {
  enabled: boolean;
  title: string;
  text: string;
  imageUrl: string;
}

export default function AdminPopup() {
  const pathname = usePathname();
  const router = useRouter();
  const [settings, setSettings] = useState<PromoSettings | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // Fetch promo settings once on mount
  useEffect(() => {
    fetch('/api/settings')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.settings) {
          setSettings({
            enabled: data.settings.promoPopupEnabled,
            title: data.settings.promoPopupTitle,
            text: data.settings.promoPopupText,
            imageUrl: data.settings.promoPopupImageUrl,
          });
        }
      })
      .catch((err) => console.error('Error loading popup settings:', err));
  }, []);

  // Re-trigger popup on pathname change
  useEffect(() => {
    if (settings && settings.enabled) {
      setIsOpen(true);
    }
  }, [pathname, settings]);

  if (!isOpen || !settings || !settings.enabled) return null;

  const handleCopyCode = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText('HAPPY15');
    setCopied(true);
    toast.success('Promo code HAPPY15 copied! 📋');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity duration-300"
        onClick={() => setIsOpen(false)} 
      />

      {/* Modal Card */}
      <div className="relative max-w-md w-full bg-white rounded-[2rem] border-4 border-sunny-300 shadow-2xl overflow-hidden animate-scaleUp z-10">
        
        {/* Top Half: Product Image */}
        <div className="relative h-56 bg-slate-100">
          <img 
            src={settings.imageUrl || "https://images.unsplash.com/photo-1544816155-12df9643f363?w=600&auto=format&fit=crop&q=80"} 
            alt="Promo Catalog Launch" 
            className="w-full h-full object-cover"
          />
          
          {/* SPECIAL OFFER Badge */}
          <span className="absolute top-4 left-4 bg-coral-500 text-white rounded-full px-3.5 py-1 text-xs font-black tracking-wider flex items-center gap-1 shadow-md">
            ✨ SPECIAL OFFER
          </span>

          {/* Close Button */}
          <button
            onClick={() => setIsOpen(false)}
            className="absolute top-4 right-4 bg-white rounded-full p-1 shadow-md border-2 border-slate-100 text-slate-500 hover:text-slate-800 hover:scale-110 active:scale-95 transition-all"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Bottom Half: Details */}
        <div className="p-6 space-y-5">
          
          {/* Title */}
          <div className="text-center">
            <h3 className="font-black text-2xl tracking-tight leading-snug">
              <span className="bg-gradient-to-r from-coral-500 via-coral-400 to-sunny-500 bg-clip-text text-transparent">
                🧡 Krishna Students Online Catalog Launch! 🔔
              </span>
            </h3>
            <p className="mt-2 text-sm font-bold text-slate-500 leading-relaxed">
              Welcome! Save 15% on Notebooks, Geometry boxes & Pastel gel pens today. Use code HAPPY15 at checkout! Printing/Xerox pickup orders can be placed online.
            </p>
          </div>

          {/* Promo Code Box */}
          <div className="border-2 border-dashed border-sunny-300 rounded-2xl p-4 flex justify-between items-center bg-sunny-50 shadow-inner">
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                USE PROMO CODE
              </span>
              <span className="text-xl font-black text-slate-800 tracking-tight">
                HAPPY15
              </span>
            </div>
            <button
              onClick={handleCopyCode}
              className="bg-coral-500 hover:bg-coral-600 text-white rounded-xl px-4 py-2 font-black text-sm hover:scale-105 active:scale-95 transition-all shadow-md"
            >
              {copied ? 'Copied! ✅' : 'Copy'}
            </button>
          </div>

          {/* Action Button Rows */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              onClick={() => setIsOpen(false)}
              className="border-2 border-slate-200 hover:bg-slate-50 rounded-2xl text-slate-500 font-black px-4 py-3 text-sm hover:scale-102 active:scale-98 transition-all"
            >
              Maybe Later
            </button>
            <button
              onClick={() => {
                setIsOpen(false);
                router.push('/shop');
              }}
              className="bg-sky-500 hover:bg-sky-600 text-white rounded-2xl font-black px-4 py-3 text-sm hover:scale-102 active:scale-98 transition-all shadow-md"
            >
              Shop Now ✨
            </button>
          </div>

          {/* Footer Note */}
          <p className="text-[10px] text-slate-400 font-bold text-center leading-normal">
            *Offer valid on all items. Free shipping kicks in automatically above ₹499.
          </p>

        </div>

      </div>
    </div>
  );
}
