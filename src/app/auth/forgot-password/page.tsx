'use client';

import React, { useState, useEffect } from 'react';
import { Mail, Loader2, BookOpen, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [countdown, setCountdown] = useState(0);

  // Countdown timer effect
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const validate = () => {
    if (!email) {
      setEmailError('Email is required.');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError('Invalid email format.');
      return false;
    }
    setEmailError('');
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    try {
      await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.toLowerCase().trim() }),
      });

      setIsSuccess(true);
      setCountdown(60);
      toast.success('Reset link request processed. 📬');
    } catch (err) {
      toast.error('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    setIsLoading(true);
    try {
      await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.toLowerCase().trim() }),
      });
      setCountdown(60);
      toast.success('Reset link resent! 🔄');
    } catch (err) {
      toast.error('Failed to resend reset link.');
    } finally {
      setIsLoading(false);
    }
  };

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

          {!isSuccess ? (
            <>
              <div className="text-center space-y-1">
                <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center justify-center gap-1.5">
                  📧 Forgot Password?
                </h2>
                <p className="text-slate-500 font-bold text-sm">
                  No worries! We'll send you a reset link.
                </p>
              </div>

              <form className="space-y-6" onSubmit={handleSubmit} noValidate>
                <div>
                  <label htmlFor="email" className="block text-sm font-bold text-slate-700 mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <input
                      id="email"
                      name="email"
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (emailError) setEmailError('');
                      }}
                      className="w-full border-2 border-slate-200 rounded-2xl pl-12 pr-4 py-3 font-bold text-slate-700 bg-slate-50 focus:outline-none focus:border-sky-400 focus:bg-white transition-all duration-200 placeholder:text-slate-400"
                      placeholder="your@email.com"
                    />
                  </div>
                  {emailError && (
                    <p className="text-xs font-bold text-coral-500 mt-1">{emailError}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="bg-coral-500 hover:bg-coral-600 text-white font-black rounded-2xl px-6 py-3.5 hover:scale-105 transition-all duration-200 shadow-md w-full flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="animate-spin h-5 w-5 text-white" />
                      <span>Sending...</span>
                    </>
                  ) : (
                    <span>Send Reset Link 📬</span>
                  )}
                </button>
              </form>
            </>
          ) : (
            <div className="space-y-6 text-center animate-scaleUp">
              <div className="text-6xl mb-2 text-center animate-bounce">📬</div>
              <div className="space-y-2">
                <h2 className="text-2xl font-black text-slate-800 tracking-tight">
                  Check Your Inbox!
                </h2>
                <p className="text-sm font-bold text-slate-500 leading-relaxed max-w-sm mx-auto">
                  A reset link was sent to{' '}
                  <span className="text-sky-500 font-black">{email}</span>.
                  It expires in 1 hour. ⏰
                </p>
              </div>

              <div className="pt-2">
                {countdown > 0 ? (
                  <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl px-6 py-3.5 text-sm font-black text-slate-400 text-center w-full">
                    Resend in {countdown}s ⏳
                  </div>
                ) : (
                  <button
                    onClick={handleResend}
                    disabled={isLoading}
                    className="bg-coral-500 hover:bg-coral-600 text-white font-black rounded-2xl px-6 py-3.5 hover:scale-105 transition-all duration-200 shadow-md w-full flex justify-center items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isLoading ? (
                      <Loader2 className="animate-spin h-5 w-5 text-white" />
                    ) : (
                      <>
                        <span>Resend Email 🔄</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="pt-4 border-t-2 border-dashed border-slate-100 flex justify-center">
            <a
              href="/auth/login"
              className="inline-flex items-center space-x-2 text-xs font-bold text-slate-500 hover:text-sky-500 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>&larr; Back to login</span>
            </a>
          </div>

        </div>
      </div>
    </div>
  );
}
