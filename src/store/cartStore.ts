import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  originalPrice: number;
  quantity: number;
  image: string;
  category: string;
}

interface CartState {
  items: CartItem[];
  coupon: string;
  discountPercentage: number;
  addToCart: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  removeInvalidItems: (validIds: string[]) => number; // returns count removed
  updateQuantity: (productId: string, quantity: number) => void;
  applyCoupon: (code: string) => boolean;
  clearCart: () => void;
  getTotals: () => {
    subtotal: number;
    discount: number;
    deliveryFee: number;
    total: number;
  };
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      coupon: '',
      discountPercentage: 0,

      addToCart: (newItem, quantity = 1) => {
        set((state) => {
          const existingIndex = state.items.findIndex((item) => item.productId === newItem.productId);
          let updatedItems = [...state.items];

          if (existingIndex >= 0) {
            updatedItems[existingIndex].quantity += quantity;
          } else {
            updatedItems.push({ ...newItem, quantity });
          }

          return { items: updatedItems };
        });
      },

      removeFromCart: (productId) => {
        set((state) => ({
          items: state.items.filter((item) => item.productId !== productId),
        }));
      },

      // Removes any cart items whose productId is NOT in the validIds array.
      // Service items (print-xxx, service-xxx) are always kept.
      // Returns the number of items removed.
      removeInvalidItems: (validIds) => {
        const state = get();
        const before = state.items.length;
        const validSet = new Set(validIds);
        const kept = state.items.filter(
          (item) =>
            item.productId.startsWith('print-') ||
            item.productId.startsWith('service-') ||
            validSet.has(item.productId)
        );
        set({ items: kept });
        return before - kept.length;
      },

      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeFromCart(productId);
          return;
        }
        set((state) => ({
          items: state.items.map((item) =>
            item.productId === productId ? { ...item, quantity } : item
          ),
        }));
      },

      applyCoupon: (code) => {
        const uppercaseCode = code.trim().toUpperCase();
        if (uppercaseCode === 'SCHOOLDAYS' || uppercaseCode === 'WELCOME10') {
          const discount = uppercaseCode === 'SCHOOLDAYS' ? 20 : 10;
          set({ coupon: uppercaseCode, discountPercentage: discount });
          return true;
        }
        return false;
      },

      clearCart: () => {
        set({ items: [], coupon: '', discountPercentage: 0 });
      },

      getTotals: () => {
        const { items, discountPercentage } = get();
        const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
        const discount = Math.round(subtotal * (discountPercentage / 100));
        
        // Shipping is free if subtotal after discount is > 500 Rs, else 40 Rs
        const activeSubtotal = subtotal - discount;
        const deliveryFee = activeSubtotal > 0 && activeSubtotal < 500 ? 40 : 0;
        const total = activeSubtotal + deliveryFee;

        return {
          subtotal,
          discount,
          deliveryFee,
          total,
        };
      },
    }),
    {
      name: 'krishna-cart-storage', // local storage key
    }
  )
);
