'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff, KeyRound, Loader2, BookOpen, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const email = searchParams.get('email');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // States: 'form' | 'success' | 'invalid_params' | 'error'
  const [pageState, setPageState] = useState<'form' | 'success' | 'invalid_params' | 'error'>('form');
  const [errorMessage, setErrorMessage] = useState('');

  const [newPasswordError, setNewPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');

  // Password strength states: 'weak' | 'medium' | 'strong'
  const [strength, setStrength] = useState<'weak' | 'medium' | 'strong'>('weak');

  useEffect(() => {
    if (!token || !email) {
      setPageState('invalid_params');
    }
  }, [token, email]);

  useEffect(() => {
    if (!newPassword) {
      setStrength('weak');
      return;
    }

    let score = 0;
    if (newPassword.length >= 8) score += 1;
    if (/[A-Z]/.test(newPassword)) score += 1;
    if (/\d/.test(newPassword)) score += 1;
    if (/[^A-Za-z0-9]/.test(newPassword)) score += 1;

    if (newPassword.length < 8) {
      setStrength('weak');
    } else if (score <= 2) {
      setStrength('medium');
    } else {
      setStrength('strong');
    }
  }, [newPassword]);

  const validate = () => {
    let valid = true;

    if (!newPassword) {
      setNewPasswordError('Password is required.');
      valid = false;
    } else {
      const isMinLength = newPassword.length >= 8;
      const hasUppercase = /[A-Z]/.test(newPassword);
      const hasNumber = /\d/.test(newPassword);
      const hasSpecial = /[^A-Za-z0-9]/.test(newPassword);

      if (!isMinLength || !hasUppercase || !hasNumber || !hasSpecial) {
        setNewPasswordError('Password must be 8+ characters, with 1 uppercase, 1 number, and 1 special char.');
        valid = false;
      } else {
        setNewPasswordError('');
      }
    }

    if (newPassword !== confirmPassword) {
      setConfirmPasswordError('Passwords do not match.');
      valid = false;
    } else {
      setConfirmPasswordError('');
    }

    return valid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          email,
          newPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.message || 'Verification failed. Link is invalid or expired.');
        setPageState('error');
        return;
      }

      setPageState('success');
      toast.success('Password updated successfully! 🎉');
      
      setTimeout(() => {
        router.push('/auth/login');
      }, 3000);
    } catch (err) {
      toast.error('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (pageState === 'invalid_params' || pageState === 'error') {
    return (
      <div className="space-y-6 text-center animate-scaleUp">
        <div className="text-6xl mb-2 text-center">❌</div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-coral-500 tracking-tight">
            Link Expired!
          </h2>
          <p className="text-sm font-bold text-slate-500 leading-relaxed max-w-xs mx-auto">
            {errorMessage || 'This reset link is invalid, has expired, or has already been used.'}
          </p>
        </div>

        <div className="pt-2">
          <button
            onClick={() => router.push('/auth/forgot-password')}
            className="bg-coral-500 hover:bg-coral-600 text-white font-black rounded-2xl px-6 py-3.5 hover:scale-105 transition-all duration-200 shadow-md w-full flex justify-center items-center gap-2 cursor-pointer"
          >
            <span>Request New Link 📧</span>
          </button>
        </div>
      </div>
    );
  }

  if (pageState === 'success') {
    return (
      <div className="space-y-6 text-center animate-scaleUp">
        <div className="text-6xl mb-2 text-center animate-bounce">✅</div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">
            Password Updated!
          </h2>
          <p className="text-sm font-bold text-slate-500">
            Redirecting you to login in 3 seconds...
          </p>
        </div>

        <div className="bg-mint-50 border-2 border-mint-200 rounded-2xl p-4 text-xs font-bold text-mint-600 text-center animate-fadeIn leading-relaxed">
          🎉 All done! You can now sign in with your new password.
        </div>

        <div className="flex justify-center pt-2">
          <Loader2 className="animate-spin h-6 w-6 text-mint-500" />
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="text-center space-y-1">
        <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center justify-center gap-1.5">
          🔐 Reset Password
        </h2>
        <p className="text-slate-500 font-bold text-sm">
          Create a new strong password below.
        </p>
      </div>

      <form className="space-y-5" onSubmit={handleSubmit} noValidate>
        <div>
          <label htmlFor="newPassword" className="block text-sm font-bold text-slate-700 mb-1">
            New Password
          </label>
          <div className="relative">
            <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              id="newPassword"
              name="newPassword"
              type={showPassword ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value);
                if (newPasswordError) setNewPasswordError('');
              }}
              className="w-full border-2 border-slate-200 rounded-2xl pl-12 pr-12 py-3 font-bold text-slate-700 bg-slate-50 focus:outline-none focus:border-sky-400 focus:bg-white transition-all duration-200 placeholder:text-slate-400"
              placeholder="Create a strong password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>

          {/* Password strength meter */}
          {newPassword && (
            <div className="mt-2.5 space-y-1">
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    strength === 'weak'
                      ? 'w-1/3 bg-coral-400'
                      : strength === 'medium'
                      ? 'w-2/3 bg-sunny-400'
                      : 'w-full bg-mint-400'
                  }`}
                />
              </div>
              <p
                className={`text-xs font-black ${
                  strength === 'weak'
                    ? 'text-coral-500'
                    : strength === 'medium'
                    ? 'text-sunny-500'
                    : 'text-mint-500'
                }`}
              >
                {strength === 'weak'
                  ? '🔴 Weak password'
                  : strength === 'medium'
                  ? '🟡 Getting stronger...'
                  : '🟢 Strong password!'}
              </p>
            </div>
          )}

          {newPasswordError && (
            <p className="text-xs font-bold text-coral-500 mt-1">{newPasswordError}</p>
          )}
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-bold text-slate-700 mb-1">
            Confirm New Password
          </label>
          <div className="relative">
            <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (confirmPasswordError) setConfirmPasswordError('');
              }}
              className="w-full border-2 border-slate-200 rounded-2xl pl-12 pr-12 py-3 font-bold text-slate-700 bg-slate-50 focus:outline-none focus:border-sky-400 focus:bg-white transition-all duration-200 placeholder:text-slate-400"
              placeholder="Repeat your password"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute inset-y-0 right-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
            >
              {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
          {confirmPasswordError && (
            <p className="text-xs font-bold text-coral-500 mt-1">{confirmPasswordError}</p>
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
              <span>Resetting...</span>
            </>
          ) : (
            <span>Reset Password 🔐</span>
          )}
        </button>
      </form>
    </>
  );
}

export default function ResetPasswordPage() {
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
                <Loader2 className="animate-spin h-8 w-8 text-coral-500" />
              </div>
            }
          >
            <ResetPasswordForm />
          </Suspense>

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
