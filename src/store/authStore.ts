import { create } from 'zustand';
import { signIn, signOut } from 'next-auth/react';

export interface SavedAddress {
  id: string;
  name: string;
  mobile: string;
  email: string;
  flat: string;
  street: string;
  landmark?: string;
  city: string;
  state: string;
  pincode: string;
}

export interface UserDetails {
  id: string;
  email: string;
  name: string;
  role: string; // CUSTOMER, SUPER_ADMIN, ADMIN, MANAGER
  mobileNumber?: string;
  dob?: string;
  gender?: string;
  bio?: string;
  avatarUrl?: string;
  savedAddresses: SavedAddress[];
  isSuspended: boolean;
  totpVerified?: boolean;
  needsTotpSetup?: boolean;
  needsTotpVerify?: boolean;
}

interface AuthState {
  user: UserDetails | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  initialized: boolean;
  loginCredentials: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  checkSession: () => Promise<void>;
  updateUser: (updatedUser: UserDetails) => void;
  verifyAdmin2FA: (code: string) => Promise<{ success: boolean; error?: string }>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isAdmin: false,
  isLoading: true,
  initialized: false,

  loginCredentials: async (email, password) => {
    set({ isLoading: true });
    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result && !result.error) {
        const meRes = await fetch('/api/auth/me');
        const meData = await meRes.json();

        if (meRes.ok && meData.success) {
          set({
            user: meData.user,
            isAuthenticated: true,
            isAdmin: ['SUPER_ADMIN', 'ADMIN', 'MANAGER'].includes(meData.user.role),
            isLoading: false,
          });
          return { success: true };
        }
      }

      set({ isLoading: false });
      return { success: false, error: result?.error || 'Invalid credentials' };
    } catch (err) {
      set({ isLoading: false });
      return { success: false, error: 'Network error occurred during login' };
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      await signOut({ redirect: false });
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      set({
        user: null,
        isAuthenticated: false,
        isAdmin: false,
        isLoading: false,
      });
    }
  },

  checkSession: async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.user) {
          set({
            user: data.user,
            isAuthenticated: true,
            isAdmin: ['SUPER_ADMIN', 'ADMIN', 'MANAGER'].includes(data.user.role),
            isLoading: false,
            initialized: true,
          });
          return;
        }
      }
    } catch (err) {
      console.error('Check session error:', err);
    }
    set({
      user: null,
      isAuthenticated: false,
      isAdmin: false,
      isLoading: false,
      initialized: true,
    });
  },

  updateUser: (updatedUser) => {
    set({
      user: updatedUser,
      isAuthenticated: true,
      isAdmin: ['SUPER_ADMIN', 'ADMIN', 'MANAGER'].includes(updatedUser.role),
    });
  },

  verifyAdmin2FA: async (code) => {
    try {
      const res = await fetch('/api/auth/totp-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      
      if (res.ok && data.success) {
        // Trigger NextAuth session cookie update for token claims sync
        await fetch('/api/auth/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            trigger: 'update',
            session: { totpVerified: true }
          })
        });

        // Load refreshed session claims
        const meRes = await fetch('/api/auth/me');
        const meData = await meRes.json();

        if (meRes.ok && meData.success) {
          set({
            user: meData.user,
            isAuthenticated: true,
            isAdmin: true,
          });
        }
        return { success: true };
      } else {
        return { success: false, error: data.message || '2FA Verification failed' };
      }
    } catch (err) {
      return { success: false, error: 'Network error occurred during 2FA' };
    }
  },
}));
