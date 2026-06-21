'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, KeyRound, ShieldAlert, BookOpen } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';

export default function TotpVerifyPage() {
  const router = useRouter();
  const { checkSession } = useAuthStore();
  const [code, setCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Autofocus input
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleVerify = async (val: string) => {
    setVerifying(true);
    try {
      const res = await fetch('/api/auth/totp-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: val })
      });
      const data = await res.json();

      if (res.ok && data.success) {
        toast.success('2FA Verification successful! 🚀');

        // Trigger session claims update
        await fetch('/api/auth/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            trigger: 'update',
            session: { totpVerified: true }
          })
        });

        await checkSession();
        router.push('/secure-admin-dashboard');
        router.refresh();
      } else {
        toast.error(data.message || 'Invalid verification code. Please try again.');
        setCode('');
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }
    } catch (err) {
      toast.error('Network error during verification.');
    } finally {
      setVerifying(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '');
    setCode(val);

    // Auto-submit when exactly 6 digits are typed
    if (val.length === 6) {
      handleVerify(val);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length === 6) {
      handleVerify(code);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sunny-50 via-lavender-50 to-sky-50 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden font-sans">
      
      {/* Top Banner Strip */}
      <div className="fixed top-0 left-0 right-0 bg-gradient-to-r from-sunny-300 via-coral-300 to-lavender-300 py-1.5 px-4 text-center text-xs font-semibold text-slate-800 tracking-wide z-50 shadow-sm">
        🛡️ Security Portal: Administrative session requires 2-Factor Authentication verification 🛡️
      </div>

      <div className="max-w-md w-full mx-auto space-y-6 z-10">
        <div className="bg-white rounded-3xl border-2 border-slate-100 shadow-xl p-8 space-y-6 hover:border-sky-300 transition-all duration-300 animate-scaleUp">
          
          {/* Logo Center */}
          <div className="flex items-center justify-center space-x-2">
            <div className="p-2 rounded-xl bg-sunny-100 shadow-inner">
              <BookOpen className="h-6 w-6 text-coral-500" />
            </div>
            <span className="text-xl font-black bg-gradient-to-r from-coral-500 via-sunny-500 to-sky-500 bg-clip-text text-transparent">
              Krishna Students
            </span>
          </div>

          <div className="text-center space-y-1">
            <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center justify-center gap-1.5">
              🔑 Verify 2FA
            </h2>
            <p className="text-slate-500 font-bold text-sm">
              Enter the 6-digit code from your authenticator app
            </p>
          </div>

          <div className="space-y-4">
            <div className="bg-sky-50 border-2 border-sky-200 rounded-2xl p-4 flex gap-3 text-xs font-bold text-sky-800">
              <ShieldAlert className="h-5 w-5 shrink-0 text-sky-500" />
              <div>
                Security Warning: Admin features are strictly locked behind standard 2FA protocol. Please do not share this token.
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label htmlFor="code" className="block text-xs font-black text-slate-500 uppercase tracking-wide text-center">
                  6-digit Authenticator Code
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <input
                    id="code"
                    ref={inputRef}
                    type="text"
                    pattern="\d{6}"
                    maxLength={6}
                    value={code}
                    onChange={handleInputChange}
                    className="w-full border-2 border-slate-200 rounded-2xl pl-12 pr-4 py-3 font-bold text-center tracking-[0.5em] text-lg text-slate-700 bg-slate-50 focus:outline-none focus:border-sky-400 focus:bg-white transition-all duration-200"
                    placeholder="000000"
                    disabled={verifying}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={verifying || code.length !== 6}
                className="bg-coral-500 hover:bg-coral-600 text-white font-black rounded-2xl px-6 py-3.5 hover:scale-105 transition-all duration-200 shadow-md w-full flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {verifying ? (
                  <>
                    <Loader2 className="animate-spin h-5 w-5 text-white" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <span>Verify Token 🚀</span>
                )}
              </button>
            </form>
          </div>

          <div className="pt-4 border-t-2 border-dashed border-slate-100 text-center">
            <button
              onClick={async () => {
                const { logout } = useAuthStore.getState();
                await logout();
                router.push('/auth/login');
              }}
              className="font-black text-slate-500 hover:text-slate-700 text-xs transition-colors"
            >
              Sign out and go back
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
