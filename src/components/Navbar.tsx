'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { 
  ShoppingBag, Search, User as UserIcon, Menu, X, 
  Phone, Mail, Clock, LogOut, ChevronDown, BookOpen, AlertCircle, FileText
} from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { items } = useCartStore();
  const { user, isAuthenticated, logout, checkSession } = useAuthStore();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const suggestionRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const [topBannerText, setTopBannerText] = useState('✨ Free delivery on stationery items for orders above ₹499! Use code HAPPY15 for 15% OFF! ✨');
  const [whatsappNumber, setWhatsappNumber] = useState('8900989005');
  const [adminEmail, setAdminEmail] = useState('admin@krishna.com');
  const [storeTimings, setStoreTimings] = useState('Daily: 7:30 AM – 11:30 PM');

  useEffect(() => {
    checkSession();
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.settings) {
          if (data.settings.topBannerText) setTopBannerText(data.settings.topBannerText);
          if (data.settings.whatsappNumber) setWhatsappNumber(data.settings.whatsappNumber);
          if (data.settings.adminEmail) setAdminEmail(data.settings.adminEmail);
          if (data.settings.storeTimings) setStoreTimings(data.settings.storeTimings);
        }
      })
      .catch(err => console.error('Error fetching settings in Navbar:', err));
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (suggestionRef.current && !suggestionRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Autocomplete Suggestions
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/products?q=${encodeURIComponent(searchQuery)}`);
        const data = await res.json();
        if (data.success) {
          setSuggestions(data.products.slice(0, 5));
        }
      } catch (err) {
        console.error('Error fetching search autocomplete:', err);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/shop?q=${encodeURIComponent(searchQuery.trim())}`);
      setShowSuggestions(false);
    }
  };

  const handleLogoutClick = async () => {
    await logout();
    toast.success('Logged out successfully');
    router.push('/');
  };

  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'Shop', href: '/shop' },
    { name: 'Store Gallery', href: '/gallery' },
    { name: 'Contact Us', href: '/contact' }
  ];

  return (
    <>
      {/* Component 1 — Top Banner */}
      <div className="bg-gradient-to-r from-sunny-300 via-coral-200 to-lavender-300 py-1.5 text-center text-xs font-semibold text-slate-800 animate-pulse sticky top-0 z-50">
        {topBannerText}
      </div>

      {/* Component 2 — Navbar */}
      <header className="sticky top-[30px] z-40 bg-white border-b-4 border-dashed border-sky-200 shadow-md">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          
          {/* Left: Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2 hover:scale-105 transition-all duration-200">
              <div className="p-1.5 bg-sunny-100 rounded-xl">
                <BookOpen className="h-6 w-6 text-coral-500" />
              </div>
              <span className="flex items-center">
                <span className="font-black text-coral-500 text-xl tracking-tight">Krishna</span>
                <span className="font-black text-sky-500 text-xl tracking-tight">Students</span>
              </span>
            </Link>
          </div>

          {/* Center Navigation Links (desktop) */}
          <nav className="hidden lg:flex items-center space-x-2">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`transition-all duration-200 text-sm font-bold ${
                    isActive 
                      ? 'bg-sky-500 text-white rounded-full px-4 py-1.5 shadow-sm' 
                      : 'text-slate-600 hover:text-sky-500 px-3 py-1.5 rounded-full hover:bg-slate-50'
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </nav>

          {/* Center: Search Bar */}
          <div className="relative flex-1 max-w-xs xl:max-w-sm mx-4 hidden md:block" ref={suggestionRef}>
            <form onSubmit={handleSearchSubmit} className="relative flex items-center">
              <input
                type="text"
                placeholder="Search pens, journals, clay, wash..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                className="w-full border-2 border-slate-200 rounded-full focus:outline-none focus:border-sky-400 bg-slate-50 pl-10 pr-12 py-2 text-sm font-semibold text-slate-700 placeholder:text-slate-400 placeholder:font-medium transition-all"
              />
              <Search className="absolute left-3.5 h-4.5 w-4.5 text-slate-400 pointer-events-none" />
              <button 
                type="submit" 
                className="absolute right-1.5 bg-sky-500 rounded-full p-1.5 text-white hover:bg-sky-600 hover:scale-105 transition-all shadow-sm"
              >
                <Search className="h-4.5 w-4.5" />
              </button>
            </form>

            {/* Suggestions dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-slate-100 rounded-2xl shadow-xl z-50 overflow-hidden divide-y divide-slate-100">
                {suggestions.map((prod) => (
                  <div
                    key={prod.id}
                    onClick={() => {
                      router.push(`/product/${prod.id}`);
                      setSearchQuery('');
                      setShowSuggestions(false);
                    }}
                    className="flex items-center px-4 py-3 hover:bg-sky-50/50 cursor-pointer transition-colors"
                  >
                    <img 
                      src={prod.images.split(',')[0]} 
                      alt={prod.name} 
                      className="w-8 h-8 object-cover rounded-lg border border-slate-200 mr-3" 
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-black text-slate-800 truncate">{prod.name}</p>
                      <p className="text-xs font-black text-coral-500">₹{prod.price}</p>
                    </div>
                  </div>
                ))}
                <div 
                  onClick={handleSearchSubmit}
                  className="px-4 py-2 bg-slate-50 text-center text-xs font-black text-sky-500 hover:bg-sky-100/70 cursor-pointer transition-colors"
                >
                  View All Search Results
                </div>
              </div>
            )}
          </div>

          {/* Right Icons */}
          <div className="flex items-center space-x-3">
            
            {/* Phone Icon */}
            <a 
              href={`tel:+91${whatsappNumber}`}
              className="bg-mint-100 rounded-full p-2 text-mint-500 hover:scale-105 transition-all hidden sm:block shadow-sm"
              title="Call us"
            >
              <Phone className="h-5 w-5" />
            </a>

            {/* Mail Icon */}
            <a 
              href={`mailto:${adminEmail}`}
              className="bg-coral-100 rounded-full p-2 text-coral-500 hover:scale-105 transition-all hidden sm:block shadow-sm"
              title="Email us"
            >
              <Mail className="h-5 w-5" />
            </a>

            {/* Clock Icon */}
            <div 
              className="bg-sunny-100 rounded-full p-2 text-sunny-500 hover:scale-105 transition-all hidden sm:block shadow-sm cursor-help relative group"
              title="Store Timings"
            >
              <Clock className="h-5 w-5" />
              <div className="absolute top-full right-0 mt-2 hidden group-hover:block w-48 p-3 bg-slate-800 text-white text-xs font-bold rounded-2xl shadow-xl z-50">
                ⏰ {storeTimings}
              </div>
            </div>

            {/* Cart Icon with badge */}
            <Link 
              href="/cart"
              className="bg-sky-100 rounded-full p-2 text-sky-500 hover:scale-105 transition-all shadow-sm relative block"
            >
              <ShoppingBag className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-coral-500 text-white rounded-full text-[10px] font-black w-5 h-5 flex items-center justify-center border-2 border-white animate-pulse">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* User Profile avatar */}
            <div className="relative" ref={profileRef}>
              {isAuthenticated ? (
                <div>
                  <button
                    onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                    className="rounded-full w-9 h-9 border-2 border-sky-200 flex items-center justify-center bg-sky-50 text-sky-500 hover:bg-sky-100 transition-all font-black text-sm uppercase focus:outline-none overflow-hidden"
                  >
                    {user?.avatarUrl ? (
                      <img 
                        src={user.avatarUrl} 
                        alt={user.name} 
                        className="w-full h-full object-cover" 
                      />
                    ) : (
                      <span>{user?.name.charAt(0)}</span>
                    )}
                  </button>

                  {/* Profile Dropdown Menu */}
                  {profileDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white border-2 border-slate-100 rounded-2xl shadow-xl z-50 overflow-hidden divide-y divide-slate-100 animate-scaleUp">
                      <div className="px-4 py-2.5">
                        <p className="text-xs font-semibold text-slate-400">Signed in as</p>
                        <p className="text-sm font-black text-slate-700 truncate">{user?.name}</p>
                      </div>
                      <div className="py-1">
                        <Link
                          href="/profile"
                          onClick={() => setProfileDropdownOpen(false)}
                          className="flex items-center px-4 py-2 text-sm font-bold text-slate-600 hover:bg-sky-50 hover:text-sky-500 transition-colors"
                        >
                          <UserIcon className="h-4 w-4 mr-2" />
                          My Profile
                        </Link>
                        <Link
                          href="/orders"
                          onClick={() => setProfileDropdownOpen(false)}
                          className="flex items-center px-4 py-2 text-sm font-bold text-slate-600 hover:bg-sky-50 hover:text-sky-500 transition-colors"
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          My Orders
                        </Link>
                        {['SUPER_ADMIN', 'ADMIN', 'MANAGER'].includes(user?.role || '') && (
                          <Link
                            href="/secure-admin-dashboard"
                            onClick={() => setProfileDropdownOpen(false)}
                            className="flex items-center px-4 py-2 text-sm font-black text-purple-600 hover:bg-purple-50 transition-colors"
                          >
                            <AlertCircle className="h-4 w-4 mr-2" />
                            Admin Panel
                          </Link>
                        )}
                      </div>
                      <div className="py-1">
                        <button
                          onClick={() => {
                            setProfileDropdownOpen(false);
                            handleLogoutClick();
                          }}
                          className="flex w-full items-center px-4 py-2 text-sm font-black text-coral-500 hover:bg-coral-50 transition-colors text-left"
                        >
                          <LogOut className="h-4 w-4 mr-2" />
                          Logout
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  href="/auth/login"
                  className="rounded-full w-9 h-9 border-2 border-sky-200 flex items-center justify-center bg-sky-50 text-sky-500 hover:bg-sky-100 hover:scale-105 transition-all shadow-sm"
                  title="Login"
                >
                  <UserIcon className="h-4.5 w-4.5" />
                </Link>
              )}
            </div>

            {/* Mobile Menu Icon */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 rounded-full hover:bg-slate-100 text-slate-500 lg:hidden shadow-sm border border-slate-100 bg-white transition-all"
            >
              <Menu className="h-5 w-5" />
            </button>

          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          {/* Backdrop */}
          <div className="fixed inset-0 bg-black/35 backdrop-blur-xs transition-opacity" onClick={() => setMobileMenuOpen(false)} />
          
          {/* Drawer content */}
          <div className="relative flex w-full max-w-xs flex-col bg-white p-6 shadow-2xl border-r-4 border-sky-400 animate-slideIn">
            <div className="flex items-center justify-between">
              <span className="text-xl font-black text-sky-500 tracking-tight">Menu</span>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-full hover:bg-slate-100 text-slate-500 border border-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Mobile Search input */}
            <div className="mt-6">
              <form onSubmit={handleSearchSubmit} className="relative">
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-sm font-semibold border-2 border-slate-200 rounded-full focus:outline-none focus:border-sky-400 bg-slate-50"
                />
                <Search className="absolute left-3.5 top-2.5 h-4.5 w-4.5 text-slate-400" />
              </form>
            </div>

            <nav className="mt-8 flex flex-col space-y-3">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`text-base font-black px-4 py-2.5 rounded-2xl transition-colors ${
                      isActive 
                        ? 'bg-sky-500 text-white shadow-sm' 
                        : 'text-slate-600 hover:bg-sky-50'
                    }`}
                  >
                    {link.name}
                  </Link>
                );
              })}

              {isAuthenticated && (
                <>
                  <hr className="my-2 border-slate-100 border-2 border-dashed" />
                  <Link
                    href="/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-base font-bold text-slate-600 px-4 py-2 rounded-xl hover:bg-slate-50 flex items-center"
                  >
                    <UserIcon className="h-4.5 w-4.5 mr-2" />
                    My Profile
                  </Link>
                  <Link
                    href="/orders"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-base font-bold text-slate-600 px-4 py-2 rounded-xl hover:bg-slate-50 flex items-center"
                  >
                    <FileText className="h-4.5 w-4.5 mr-2" />
                    My Orders
                  </Link>
                  {['SUPER_ADMIN', 'ADMIN', 'MANAGER'].includes(user?.role || '') && (
                    <Link
                      href="/secure-admin-dashboard"
                      onClick={() => setMobileMenuOpen(false)}
                      className="text-base font-black text-purple-600 px-4 py-2 rounded-xl bg-purple-50 flex items-center"
                    >
                      <AlertCircle className="h-4.5 w-4.5 mr-2" />
                      Admin Panel
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      handleLogoutClick();
                    }}
                    className="text-base font-black text-coral-500 text-left px-4 py-2 rounded-xl hover:bg-coral-50 flex items-center"
                  >
                    <LogOut className="h-4.5 w-4.5 mr-2" />
                    Logout
                  </button>
                </>
              )}
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
