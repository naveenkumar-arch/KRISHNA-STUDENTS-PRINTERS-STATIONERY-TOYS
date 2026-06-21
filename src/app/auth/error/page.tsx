'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { BookOpen } from 'lucide-react';

function ErrorPageContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  if (error === 'OAuthAccountNotLinked') {
    return (
      <div className="space-y-6 text-center animate-scaleUp">
        <div className="text-5xl text-center">🔗</div>
        <h2 className="text-2xl font-black text-slate-800 tracking-tight">
          Account Already Exists!
        </h2>
        <div className="bg-sunny-50 border-2 border-sunny-200 rounded-2xl p-4 text-sm font-bold text-sunny-700 leading-relaxed text-left">
          ⚠️ This email address is already associated with an email & password account. Please sign in with email & password instead.
        </div>
        <div className="pt-2">
          <a
            href="/auth/login"
            className="bg-coral-500 hover:bg-coral-600 text-white font-black rounded-2xl px-6 py-3.5 hover:scale-105 transition-all duration-200 shadow-md w-full inline-flex justify-center items-center gap-2 text-sm text-center"
          >
            <span>Sign In with Email 👋</span>
          </a>
        </div>
      </div>
    );
  }

  if (error === 'AccessDenied') {
    return (
      <div className="space-y-6 text-center animate-scaleUp">
        <div className="text-5xl text-center">🚫</div>
        <h2 className="text-2xl font-black text-slate-800 tracking-tight">
          Access Denied
        </h2>
        <p className="text-sm font-bold text-slate-500">
          You don't have permission to view this page.
        </p>
        <div className="pt-2">
          <a
            href="/"
            className="bg-coral-500 hover:bg-coral-600 text-white font-black rounded-2xl px-6 py-3.5 hover:scale-105 transition-all duration-200 shadow-md w-full inline-flex justify-center items-center gap-2 text-sm text-center"
          >
            <span>Go Home 🏠</span>
          </a>
        </div>
      </div>
    );
  }

  // Default Fallback Error
  return (
    <div className="space-y-6 text-center animate-scaleUp">
      <div className="text-5xl text-center">😕</div>
      <h2 className="text-2xl font-black text-slate-800 tracking-tight">
        Something Went Wrong
      </h2>
      <p className="text-sm font-bold text-slate-500">
        An error occurred during sign in. Please try again.
      </p>
      <div className="pt-2">
        <a
          href="/auth/login"
          className="bg-coral-500 hover:bg-coral-600 text-white font-black rounded-2xl px-6 py-3.5 hover:scale-105 transition-all duration-200 shadow-md w-full inline-flex justify-center items-center gap-2 text-sm text-center"
        >
          <span>Try Again 🔄</span>
        </a>
      </div>
    </div>
  );
}

export default function ErrorPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-sunny-50 via-lavender-50 to-sky-50 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden font-sans">
      
      {/* Top Banner Strip */}
      <div className="fixed top-0 left-0 right-0 bg-gradient-to-r from-sunny-300 via-coral-300 to-lavender-300 py-1.5 px-4 text-center text-xs font-semibold text-slate-800 tracking-wide animate-pulse z-50 shadow-sm">
        ✨ Free delivery on stationery items for orders above ₹499! Use code HAPPY15 for 15% OFF! 🌈
      </div>

      <div className="max-w-md w-full mx-auto space-y-6 z-10 animate-scaleUp">
        <div className="bg-white rounded-3xl border-2 border-slate-100 shadow-xl p-8 space-y-6 hover:border-sky-300 transition-all duration-300">
          
          {/* Logo Center */}
          <div className="flex items-center justify-center space-x-2">
            <div className="p-2 rounded-xl bg-sunny-100 shadow-inner">
              <BookOpen className="h-6 w-6 text-coral-500" />
            </div>
            <span className="text-xl font-black bg-gradient-to-r from-coral-500 via-sunny-500 to-sky-500 bg-clip-text text-transparent">
              Krishna Students
            </span>
          </div>

          <Suspense
            fallback={
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-coral-500" />
              </div>
            }
          >
            <ErrorPageContent />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
