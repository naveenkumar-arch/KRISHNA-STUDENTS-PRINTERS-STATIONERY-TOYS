'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import { Loader2, KeyRound, Copy, Check, ShieldAlert, BookOpen } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';

export default function TotpSetupPage() {
  const router = useRouter();
  const { checkSession, user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [setupData, setSetupData] = useState<{ secret: string; keyuri: string } | null>(null);
  const [code, setCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Fetch setup details
    async function fetchSetup() {
      try {
        const res = await fetch('/api/auth/totp-setup');
        if (!res.ok) {
          const data = await res.json();
          toast.error(data.message || 'Failed to initialize 2FA setup.');
          router.push('/auth/login');
          return;
        }
        const data = await res.json();
        setSetupData({ secret: data.secret, keyuri: data.keyuri });
      } catch (err) {
        toast.error('Network error initializing 2FA setup.');
      } finally {
        setLoading(false);
      }
    }
    fetchSetup();
  }, [router]);

  const handleCopy = () => {
    if (setupData?.secret) {
      navigator.clipboard.writeText(setupData.secret);
      setCopied(true);
      toast.success('Secret key copied! 📋');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6 || isNaN(Number(code))) {
      toast.error('Please enter a valid 6-digit code.');
      return;
    }

    setVerifying(true);
    try {
      const res = await fetch('/api/auth/totp-setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secret: setupData?.secret, code })
      });
      const data = await res.json();

      if (res.ok && data.success) {
        toast.success('2FA Setup completed successfully! 🎉');
        
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
        toast.error(data.message || 'Verification failed. Please check the code.');
      }
    } catch (err) {
      toast.error('Network error during verification.');
    } finally {
      setVerifying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sunny-50 via-lavender-50 to-sky-50 flex justify-center items-center">
        <div className="text-center space-y-4">
          <Loader2 className="animate-spin h-10 w-10 text-coral-500 mx-auto" />
          <p className="text-slate-600 font-bold">Initializing secure 2FA channel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sunny-50 via-lavender-50 to-sky-50 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden font-sans">
      
      {/* Top Banner Strip */}
      <div className="fixed top-0 left-0 right-0 bg-gradient-to-r from-sunny-300 via-coral-300 to-lavender-300 py-1.5 px-4 text-center text-xs font-semibold text-slate-800 tracking-wide z-50 shadow-sm">
        🛡️ Security Portal: Multi-Factor Authentication Setup required for administrative roles 🛡️
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
              🔐 Set Up 2FA
            </h2>
            <p className="text-slate-500 font-bold text-sm">
              Protect your administrative session
            </p>
          </div>

          <div className="space-y-4">
            <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-4 flex gap-3 text-xs font-bold text-amber-800">
              <ShieldAlert className="h-5 w-5 shrink-0 text-amber-500" />
              <div>
                Please install an authenticator app like Google Authenticator or Microsoft Authenticator on your phone to continue.
              </div>
            </div>

            {setupData && (
              <div className="flex flex-col items-center justify-center space-y-4 bg-slate-50 border-2 border-slate-100 rounded-2xl p-6">
                <p className="text-xs font-black text-slate-500 text-center uppercase tracking-wide">
                  Step 1: Scan this QR Code
                </p>
                <div className="bg-white p-4 rounded-xl border-2 border-slate-100 shadow-sm">
                  <QRCodeSVG value={setupData.keyuri} size={180} />
                </div>

                <div className="w-full space-y-1">
                  <p className="text-xs font-black text-slate-500 uppercase tracking-wide text-center">
                    Or enter code manually:
                  </p>
                  <div className="flex items-center gap-2 bg-white border-2 border-slate-200 rounded-xl px-3 py-2 font-mono text-sm font-bold text-slate-700">
                    <span className="truncate flex-1 select-all">{setupData.secret}</span>
                    <button
                      type="button"
                      onClick={handleCopy}
                      className="text-slate-400 hover:text-sky-500 transition-colors p-1"
                    >
                      {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleVerify} className="space-y-4">
              <div className="space-y-1">
                <label htmlFor="code" className="block text-xs font-black text-slate-500 uppercase tracking-wide">
                  Step 2: Enter 6-digit Authenticator Code
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <input
                    id="code"
                    type="text"
                    pattern="\d{6}"
                    maxLength={6}
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                    className="w-full border-2 border-slate-200 rounded-2xl pl-12 pr-4 py-3 font-bold text-center tracking-[0.5em] text-lg text-slate-700 bg-slate-50 focus:outline-none focus:border-sky-400 focus:bg-white transition-all duration-200"
                    placeholder="000000"
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
                  <span>Verify and Enable 🚀</span>
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
