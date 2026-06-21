'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Mail, Phone, MapPin, Clock } from 'lucide-react';

export default function Footer() {
  const [whatsappNumber, setWhatsappNumber] = useState('8900989005');
  const [adminEmail, setAdminEmail] = useState('admin@krishna.com');
  const [storeTimings, setStoreTimings] = useState('7:30 AM – 11:30 PM (IST)');

  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.settings) {
          if (data.settings.whatsappNumber) setWhatsappNumber(data.settings.whatsappNumber);
          if (data.settings.adminEmail) setAdminEmail(data.settings.adminEmail);
          if (data.settings.storeTimings) setStoreTimings(data.settings.storeTimings);
        }
      })
      .catch(err => console.error('Error fetching settings in Footer:', err));
  }, []);
  return (
    <footer className="w-full bg-white border-t-8 border-dashed border-sunny-300 pt-12 pb-6 mt-auto">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* 4 Columns Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          
          {/* Col 1: Logo & Description */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-xl font-black text-coral-500">Krishna</span>
              <span className="text-xl font-black text-sky-500">Students</span>
            </div>
            <p className="text-sm font-bold text-slate-500 leading-relaxed">
              Your one-stop boutique destination for premium stationery supplies, textbooks, custom print work, spiral binding record projects, educational toys, and birthday gifts.
            </p>
            <div className="flex space-x-3 pt-2">
              <a
                href="https://www.instagram.com/krishnastudentsstationery"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-pink-100 rounded-full p-2 text-pink-500 hover:scale-110 hover:bg-pink-200 transition-all shadow-sm"
                title="Instagram"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                </svg>
              </a>
              <a
                href="https://www.facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-blue-100 rounded-full p-2 text-blue-500 hover:scale-110 hover:bg-blue-200 transition-all shadow-sm"
                title="Facebook"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                </svg>
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-sky-100 rounded-full p-2 text-sky-500 hover:scale-110 hover:bg-sky-200 transition-all shadow-sm"
                title="Twitter"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Col 2: Quick Links */}
          <div>
            <h4 className="text-sm font-black text-slate-800 tracking-wider mb-4 flex items-center gap-1.5">
              <span className="text-sky-400">●</span> QUICK LINKS
            </h4>
            <ul className="space-y-2 text-sm font-bold text-slate-600">
              <li>
                <Link href="/" className="hover:text-sky-500 transition-colors">🏠 Store Home</Link>
              </li>
              <li>
                <Link href="/shop" className="hover:text-sky-500 transition-colors">📦 Products Catalog</Link>
              </li>
              <li>
                <Link href="/gallery" className="hover:text-sky-500 transition-colors">🖼️ Store Gallery</Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-sky-500 transition-colors">📞 Contact & Address</Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Get In Touch */}
          <div>
            <h4 className="text-sm font-black text-slate-800 tracking-wider mb-4 flex items-center gap-1.5">
              <span className="text-coral-400">●</span> GET IN TOUCH
            </h4>
            <ul className="space-y-3 text-sm font-bold text-slate-600">
              <li className="flex items-start">
                <MapPin className="h-5 w-5 text-coral-500 mr-2 shrink-0 mt-0.5" />
                <span>427/200B, Ground Floor, Medavakkam-Mambakkam Road, Chennai, 600100</span>
              </li>
              <li className="flex items-center">
                <Phone className="h-5 w-5 text-mint-500 mr-2 shrink-0" />
                <a href={`tel:+91${whatsappNumber}`} className="hover:text-sky-500">+91 {whatsappNumber.slice(0, 5)} {whatsappNumber.slice(5)}</a>
              </li>
              <li className="flex items-center">
                <Mail className="h-5 w-5 text-sky-500 mr-2 shrink-0" />
                <a href={`mailto:${adminEmail}`} className="hover:text-sky-500">{adminEmail}</a>
              </li>
            </ul>
          </div>

          {/* Col 4: Store Hours */}
          <div>
            <h4 className="text-sm font-black text-slate-800 tracking-wider mb-4 flex items-center gap-1.5">
              <span className="text-sunny-400">●</span> STORE HOURS
            </h4>
            <ul className="space-y-3 text-sm font-bold text-slate-600">
              <li className="flex items-start">
                <Clock className="h-5 w-5 text-sunny-500 mr-2 shrink-0 mt-0.5" />
                <div>
                  <p className="text-slate-800">🗓️ Daily Operating Hours</p>
                  <p className="text-xs text-slate-500 font-medium">{storeTimings}</p>
                </div>
              </li>
              <li className="flex items-start">
                <Clock className="h-5 w-5 text-sunny-500 mr-2 shrink-0 mt-0.5" />
                <div>
                  <p className="text-slate-800">📅 Sundays & Holidays</p>
                  <p className="text-xs text-slate-500 font-medium">Open (All Exams & Projects!)</p>
                </div>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom copyright bar */}
        <div className="border-t border-slate-100 pt-6 mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs font-bold text-slate-500">
            © 2026 Rainbow Stationery Store. All rights reserved.
          </p>
          <div className="bg-sunny-50 border border-sunny-200 rounded-full px-4 py-2 text-xs font-bold text-slate-700 shadow-sm flex items-center gap-1 animate-pulse">
            <span>Made with</span>
            <span className="text-coral-500">❤️</span>
            <span>for stationery and journaling lovers</span>
          </div>
        </div>

      </div>
    </footer>
  );
}
