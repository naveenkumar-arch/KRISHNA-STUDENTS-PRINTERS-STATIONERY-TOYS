'use client';

import React, { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, KeyRound, Mail, User, BookOpen, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';

const GoogleLogo = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24" width="24" height="24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
);

export default function RegisterPage() {
  const router = useRouter();
  const { checkSession } = useAuthStore();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Field-level error messages
  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');

  // Password strength state
  const [strength, setStrength] = useState<'weak' | 'medium' | 'strong'>('weak');

  // Google Auth
  const [googleConfigured, setGoogleConfigured] = useState(true);
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [googleEmail, setGoogleEmail] = useState('');
  const [googleName, setGoogleName] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    fetch('/api/settings')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.googleConfigured !== undefined) {
          setGoogleConfigured(data.googleConfigured);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!password) {
      setStrength('weak');
      return;
    }

    let score = 0;
    if (password.length >= 8) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/\d/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;

    if (password.length < 8) {
      setStrength('weak');
    } else if (score <= 2) {
      setStrength('medium');
    } else {
      setStrength('strong');
    }
  }, [password]);

  const validate = () => {
    let valid = true;

    if (!name || name.trim().length < 2) {
      setNameError('Name must be at least 2 characters.');
      valid = false;
    } else {
      setNameError('');
    }

    if (!email) {
      setEmailError('Email is required.');
      valid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError('Invalid email format.');
      valid = false;
    } else {
      setEmailError('');
    }

    if (!password) {
      setPasswordError('Password is required.');
      valid = false;
    } else {
      const isMinLength = password.length >= 8;
      const hasUppercase = /[A-Z]/.test(password);
      const hasNumber = /\d/.test(password);
      const hasSpecial = /[^A-Za-z0-9]/.test(password);

      if (!isMinLength || !hasUppercase || !hasNumber || !hasSpecial) {
        setPasswordError('Password must be 8+ characters, with 1 uppercase, 1 number, and 1 special char.');
        valid = false;
      } else {
        setPasswordError('');
      }
    }

    if (password !== confirmPassword) {
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
      const regRes = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.toLowerCase().trim(),
          password,
        }),
      });

      const data = await regRes.json();

      if (!regRes.ok) {
        if (regRes.status === 409) {
          toast.error('Email taken. Sign in instead?');
        } else if (data.errors) {
          if (data.errors.name) setNameError(data.errors.name);
          if (data.errors.email) setEmailError(data.errors.email);
          if (data.errors.password) setPasswordError(data.errors.password);
        } else {
          toast.error(data.message || 'Registration failed');
        }
        return;
      }

      toast.success('Account created successfully! 🌈 Logging in...');

      const signRes = await signIn('credentials', {
        email: email.toLowerCase().trim(),
        password,
        redirect: false,
      });

      if (signRes?.error) {
        toast.error('Auto login failed. Please sign in manually.');
        router.push('/auth/login');
      } else {
        await checkSession();
        router.push('/');
        router.refresh();
      }
    } catch (err) {
      toast.error('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    if (googleConfigured) {
      signIn('google', { callbackUrl: '/' });
    } else {
      setShowGoogleModal(true);
    }
  };

  const handleGoogleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!googleEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(googleEmail)) {
      toast.error('Please enter a valid email address.');
      return;
    }
    setGoogleLoading(true);
    try {
      // First, register the account via API
      const regRes = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: googleName.trim() || googleEmail.split('@')[0],
          email: googleEmail.toLowerCase().trim(),
          password: null, // Google accounts don't need passwords
          isGoogleSignUp: true,
        }),
      });

      const regData = await regRes.json();

      // If registration fails (and it's not because account already exists), show error
      if (!regRes.ok && regRes.status !== 409) {
        toast.error(regData.message || 'Registration failed. Please try again.');
        return;
      }

      // Now sign in via the Google mock flow
      const res = await signIn('credentials', {
        email: googleEmail.toLowerCase().trim(),
        name: googleName.trim() || googleEmail.split('@')[0],
        isGoogleMock: 'true',
        redirect: false,
      });

      if (res?.error) {
        toast.error(res.error);
      } else {
        toast.success(regRes.status === 409 ? 'Signed in with Google! 🚀' : 'Account created with Google! 🚀');
        await checkSession();
        router.push('/');
        router.refresh();
      }
    } catch (err) {
      toast.error('Sign in failed. Please try again.');
    } finally {
      setGoogleLoading(false);
      setShowGoogleModal(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sunny-50 via-lavender-50 to-sky-50 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden font-sans">
      
      {/* Top Banner Strip */}
      <div className="fixed top-0 left-0 right-0 bg-gradient-to-r from-sunny-300 via-coral-300 to-lavender-300 py-1.5 px-4 text-center text-xs font-semibold text-slate-800 tracking-wide animate-pulse z-50 shadow-sm">
        ✨ Free delivery on stationery items for orders above ₹499! Use code HAPPY15 for 15% OFF! 🌈
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
              🌈 Create Account
            </h2>
            <p className="text-slate-500 font-bold text-sm">
              Join us — it's free & fun!
            </p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit} noValidate>
            <div>
              <label htmlFor="name" className="block text-sm font-bold text-slate-700 mb-1">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (nameError) setNameError('');
                  }}
                  className="w-full border-2 border-slate-200 rounded-2xl pl-12 pr-4 py-3 font-bold text-slate-700 bg-slate-50 focus:outline-none focus:border-sky-400 focus:bg-white transition-all duration-200 placeholder:text-slate-400"
                  placeholder="Your full name"
                />
              </div>
              {nameError && (
                <p className="text-xs font-bold text-coral-500 mt-1">{nameError}</p>
              )}
            </div>

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

            <div>
              <label htmlFor="password" className="block text-sm font-bold text-slate-700 mb-1">
                Password
              </label>
              <div className="relative">
                <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (passwordError) setPasswordError('');
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
              {password && (
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

              {passwordError && (
                <p className="text-xs font-bold text-coral-500 mt-1">{passwordError}</p>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-bold text-slate-700 mb-1">
                Confirm Password
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

            <div className="flex flex-col gap-3 pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="bg-coral-500 hover:bg-coral-600 text-white font-black rounded-2xl px-6 py-3.5 hover:scale-105 transition-all duration-200 shadow-md w-full flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="animate-spin h-5 w-5 text-white" />
                    <span>Creating...</span>
                  </>
                ) : (
                  <span>Create Account 🌈</span>
                )}
              </button>

              <div className="relative my-2">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t-2 border-dashed border-slate-200" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-white px-3 font-black text-slate-400 uppercase tracking-wider">
                    or continue with
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleGoogleSignIn}
                className="border-2 border-slate-200 hover:border-sky-300 bg-white hover:bg-sky-50 text-slate-700 font-black rounded-2xl px-6 py-3.5 transition-all duration-200 w-full flex items-center justify-center gap-2 shadow-sm"
              >
                <GoogleLogo />
                <span>Continue with Google</span>
              </button>
            </div>
          </form>

          <div className="pt-4 border-t-2 border-dashed border-slate-100 text-center">
            <p className="text-xs font-bold text-slate-500">
              Already have an account?{' '}
              <button
                onClick={() => router.push('/auth/login')}
                className="font-black text-sky-500 hover:text-sky-600 hover:underline transition-colors cursor-pointer"
              >
                Sign in 👋
              </button>
            </p>
          </div>

        </div>
      </div>

      {/* Google Sign-In Modal */}
      {showGoogleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowGoogleModal(false)} />
          <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl z-10 overflow-hidden">
            {/* Google Header */}
            <div className="p-6 pb-4 text-center border-b border-slate-100">
              <div className="flex justify-center mb-4">
                <svg viewBox="0 0 75 24" width="75" height="24" xmlns="http://www.w3.org/2000/svg">
                  <path fill="#4285F4" d="M10.15 11.25H.52v2.76h5.54c-.24 3.16-2.88 4.5-5.52 4.5C-2.35 18.5-.56 14.73.52 11.5c1.07-3.23 4.26-5.78 7.83-4.26l1.98-2.05C7.67 3.18 4.07 2.82 1.34 4.97-1.38 7.12-1.08 12.18.52 15.03c1.6 2.85 5.06 4.53 8.15 3.62 3.09-.91 4.42-3.72 4.56-6.4.04-.65-.02-1.35-.08-2z" />
                  <path fill="#EA4335" d="M20.6 8.2c-3.1 0-5.34 2.42-5.34 5.35 0 3.19 2.57 5.36 5.34 5.36 2.93 0 5.33-2.26 5.33-5.3 0-3.56-2.82-5.41-5.33-5.41zm0 2.1c1.53 0 2.96 1.24 2.96 3.28 0 2-1.42 3.28-2.97 3.28-1.68 0-2.98-1.35-2.98-3.3 0-1.9 1.28-3.26 2.99-3.26z" />
                  <path fill="#FBBC05" d="M35.4 8.2c-3.1 0-5.34 2.42-5.34 5.35 0 3.19 2.57 5.36 5.34 5.36 2.93 0 5.33-2.26 5.33-5.3 0-3.56-2.82-5.41-5.33-5.41zm0 2.1c1.53 0 2.96 1.24 2.96 3.28 0 2-1.42 3.28-2.97 3.28-1.68 0-2.98-1.35-2.98-3.3 0-1.9 1.28-3.26 2.99-3.26z" />
                  <path fill="#4285F4" d="M49.96 8.2c-2.87 0-5.09 2.52-5.09 5.33 0 3.22 2.59 5.38 5.04 5.38 1.51 0 2.31-.6 2.9-1.29v1.05c0 1.84-1.12 2.94-2.79 2.94-1.62 0-2.43-1.2-2.72-1.88l-2.07.87c.69 1.47 2.09 3.1 4.81 3.1 2.86 0 4.97-1.8 4.97-5.56V8.53h-2.16v.92c-.72-.78-1.7-1.25-2.89-1.25zm.21 2.1c1.41 0 2.82 1.2 2.82 3.28 0 2.11-1.41 3.27-2.85 3.27-1.51 0-2.92-1.23-2.92-3.25 0-2.1 1.47-3.3 2.95-3.3z" />
                  <path fill="#EA4335" d="M67.65 8.2c-2.7 0-4.98 2.15-4.98 5.33 0 3.37 2.54 5.38 5.24 5.38 2.26 0 3.65-1.24 4.47-2.34l-1.84-1.23c-.48.74-1.28 1.48-2.63 1.48-1.51 0-2.2-.83-2.63-1.63l7.24-3-.38-.91c-.7-1.77-2.4-3.08-4.49-3.08zm.09 2.06c.98 0 1.69.52 1.97 1.15l-4.83 2.02c-.2-1.65 1.23-3.17 2.86-3.17z" />
                  <path fill="#34A853" d="M57.8.66h2.35V18.5H57.8z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-800">Sign in with Google</h3>
              <p className="text-sm text-slate-500 mt-1">to continue to Krishna Students</p>
            </div>

            {/* Email Form */}
            <form onSubmit={handleGoogleEmailSubmit} className="p-6 space-y-4">
              <div>
                <input
                  type="email"
                  required
                  autoFocus
                  value={googleEmail}
                  onChange={(e) => setGoogleEmail(e.target.value)}
                  placeholder="Email"
                  className="w-full px-4 py-3 text-sm font-medium rounded-lg border border-slate-300 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-slate-800 placeholder:text-slate-400"
                />
              </div>
              <div>
                <input
                  type="text"
                  value={googleName}
                  onChange={(e) => setGoogleName(e.target.value)}
                  placeholder="Full name (optional)"
                  className="w-full px-4 py-3 text-sm font-medium rounded-lg border border-slate-300 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-slate-800 placeholder:text-slate-400"
                />
              </div>
              <p className="text-xs text-slate-500">
                Sign in to Krishna Students with your Google account email. A new account will be created automatically if one doesn't exist.
              </p>
              <div className="flex justify-between items-center pt-2">
                <button
                  type="button"
                  onClick={() => setShowGoogleModal(false)}
                  className="text-sm font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-4 py-2 rounded-full transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={googleLoading}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm px-6 py-2.5 rounded-full shadow-sm transition-all disabled:opacity-60 flex items-center gap-2"
                >
                  {googleLoading ? (
                    <>
                      <Loader2 className="animate-spin h-4 w-4" />
                      <span>Signing in...</span>
                    </>
                  ) : (
                    <span>Next</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
