'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  FileText, Check, AlertCircle, HelpCircle, 
  MapPin, ShieldAlert, CreditCard, ChevronLeft 
} from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore, UserDetails, SavedAddress } from '@/store/authStore';
import toast from 'react-hot-toast';

interface FormErrors {
  name?: string;
  mobile?: string;
  email?: string;
  flat?: string;
  street?: string;
  city?: string;
  state?: string;
  pincode?: string;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { items, getTotals, clearCart } = useCartStore();
  const { user, isAuthenticated, checkSession, updateUser } = useAuthStore();

  // Address Inputs
  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    email: '',
    flat: '',
    street: '',
    landmark: '',
    city: 'Chennai',
    state: 'Tamil Nadu',
    pincode: '600100',
  });

  const [saveAddress, setSaveAddress] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'Razorpay'>('COD');
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [enabledMethods, setEnabledMethods] = useState<string[]>(['cod', 'razorpay']);

  // Load user data if authenticated and fetch settings
  useEffect(() => {
    checkSession();

    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.paymentSettings?.paymentMethods) {
          const methods = data.paymentSettings.paymentMethods.split(',').map((m: string) => m.trim().toLowerCase());
          setEnabledMethods(methods);
          if (!methods.includes('cod') && methods.includes('razorpay')) {
            setPaymentMethod('Razorpay');
          }
        }
      })
      .catch(err => console.error('Error fetching settings for Checkout:', err));
  }, []);

  useEffect(() => {
    if (user) {
      setFormData((prev) => {
        const address = user.savedAddresses?.[0] || {};
        return {
          ...prev,
          name: address.name || user.name || '',
          email: address.email || user.email || '',
          mobile: address.mobile || user.mobileNumber || '',
          flat: address.flat || '',
          street: address.street || '',
          landmark: address.landmark || '',
          city: address.city || 'Chennai',
          state: address.state || 'Tamil Nadu',
          pincode: address.pincode || '600100',
        };
      });
    }
  }, [user]);

  const { subtotal, discount, deliveryFee, total } = getTotals();

  // Enforce Validation Rules
  const validateField = (name: string, value: string): string => {
    let error = '';
    const val = value.trim();

    if (name === 'name') {
      if (!val) error = 'Name is required';
      else if (val.length < 2 || val.length > 50) error = 'Name must be between 2 and 50 characters';
      else if (!/^[a-zA-Z\s]+$/.test(val)) error = 'Name can only contain letters and spaces';
    }

    if (name === 'mobile') {
      if (!val) error = 'Mobile number is required';
      else if (val.length !== 10 || isNaN(Number(val)) || !/^[6-9]\d{9}$/.test(val)) {
        error = 'Mobile must be a 10-digit number starting with 6-9';
      }
    }

    if (name === 'email') {
      if (!val) error = 'Email is required';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) error = 'Invalid email address format';
    }

    if (name === 'flat') {
      if (!val) error = 'Flat/house number is required';
    }

    if (name === 'street') {
      if (!val) error = 'Street/area is required';
      else if (val.length < 5) error = 'Street name must be at least 5 characters';
    }

    if (name === 'city') {
      if (!val) error = 'City is required';
    }

    if (name === 'state') {
      if (!val) error = 'State is required';
    }

    if (name === 'pincode') {
      if (!val) error = 'Pincode is required';
      else if (val.length !== 6 || isNaN(Number(val))) error = 'Pincode must be exactly 6 digits';
    }

    return error;
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const error = validateField(name, value);
    setFormErrors((prev) => ({ ...prev, [name]: error }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear errors on change
    if (formErrors[name as keyof FormErrors]) {
      setFormErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all fields
    const errors: FormErrors = {};
    Object.entries(formData).forEach(([key, value]) => {
      const error = validateField(key, value);
      if (error) {
        errors[key as keyof FormErrors] = error;
      }
    });

    setFormErrors(errors);

    if (Object.values(errors).some((err) => !!err)) {
      toast.error('Please fix the errors in the address form before submitting.');
      return;
    }

    // Trigger confirmation modal
    setShowConfirmModal(true);
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if ((window as any).Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePlaceOrder = async () => {
    setPlacingOrder(true);
    try {
      // 1. If saveAddress is true and user is authenticated, update profile with address
      if (saveAddress && user) {
        const addressObj: SavedAddress = {
          id: `addr-${Date.now()}`,
          name: formData.name,
          mobile: formData.mobile,
          email: formData.email,
          flat: formData.flat,
          street: formData.street,
          landmark: formData.landmark,
          city: formData.city,
          state: formData.state,
          pincode: formData.pincode,
        };

        // Append address if unique
        const exists = user.savedAddresses.some(
          (a) => a.flat.toLowerCase() === addressObj.flat.toLowerCase() && a.pincode === addressObj.pincode
        );

        if (!exists) {
          const updatedAddresses = [addressObj, ...user.savedAddresses];
          const updateRes = await fetch('/api/auth/profile', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ savedAddresses: updatedAddresses }),
          });
          const updateData = await updateRes.json();
          if (updateRes.ok && updateData.success) {
            updateUser(updateData.user);
          }
        }
      }

      // 2. Submit order to create-order endpoint
      const orderRes = await fetch('/api/checkout/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items,
          address: formData,
          paymentMethod,
        }),
      });

      const orderData = await orderRes.json();

      if (!orderRes.ok || !orderData.success) {
        toast.error(orderData.message || 'Failed to place order');
        setPlacingOrder(false);
        return;
      }

      // 3. COD flow — order placed, pay on delivery
      if (paymentMethod === 'COD') {
        toast.success('Order placed successfully (Cash on Delivery)! 📦');
        const orderId = orderData.order.id;
        clearCart();
        setShowConfirmModal(false);
        setPlacingOrder(false);
        router.push(`/orders/${orderId}`);
        return;
      }

      // 4. Razorpay checkout flow
      if (paymentMethod === 'Razorpay') {
        const scriptLoaded = await loadRazorpayScript();
        if (!scriptLoaded) {
          toast.error('Failed to load Razorpay SDK. Please check your connection.');
          setPlacingOrder(false);
          return;
        }

        const options = {
          key: orderData.keyId,
          amount: orderData.amount,
          currency: 'INR',
          name: 'Krishna Stationery',
          description: 'Payment for Order #' + orderData.localOrderId,
          order_id: orderData.orderId,
          prefill: {
            name: formData.name,
            email: formData.email,
            contact: formData.mobile,
          },
          handler: async function (response: any) {
            try {
              toast.loading('Verifying payment signature...', { id: 'payment-verify' });
              const verifyRes = await fetch('/api/checkout/verify-payment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  orderId: orderData.localOrderId,
                }),
              });

              const verifyData = await verifyRes.json();

              if (verifyRes.ok && verifyData.success) {
                toast.success('Payment successful! Order confirmed. 🎉', { id: 'payment-verify' });
                clearCart();
                setShowConfirmModal(false);
                setPlacingOrder(false);
                router.push(`/orders/${orderData.localOrderId}`);
              } else {
                toast.error(verifyData.message || 'Payment verification failed.', { id: 'payment-verify' });
                setPlacingOrder(false);
              }
            } catch (verifyErr) {
              console.error('Signature verification error:', verifyErr);
              toast.error('Network error during signature verification.', { id: 'payment-verify' });
              setPlacingOrder(false);
            }
          },
          modal: {
            ondismiss: function () {
              toast.error('Payment cancelled by user.');
              setPlacingOrder(false);
            }
          },
          theme: {
            color: '#3b82f6',
          }
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.open();
        return;
      }

    } catch (err) {
      console.error('Error placing order:', err);
      toast.error('Network error. Failed to complete checkout.');
      setPlacingOrder(false);
    }
  };

  // Login Gate UI
  if (!isAuthenticated) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center space-y-6 flex flex-col items-center justify-center min-h-[60vh]">
        <div className="p-5 bg-yellow-50 border border-yellow-200 text-yellow-500 rounded-full">
          <ShieldAlert className="h-12 w-12" />
        </div>
        <h2 className="text-2xl font-black text-gray-800">Authentication Required</h2>
        <p className="text-xs text-gray-400 max-w-xs leading-relaxed">
          You must be logged in with a Google account to proceed with shipping address entry and place orders.
        </p>
        <button
          onClick={() => {
            // Trigger login modal inside header by calling navbar click simulation
            // Since our login modal is inside Navbar, we can prompt users nicely or we can direct them.
            // Let's reload and guide them to use the Login button at the top-right
            toast.custom((t) => (
              <div className="bg-sky-500 text-white font-bold text-xs px-4 py-3 rounded-2xl shadow-lg flex items-center space-x-2">
                <span>Please click the <strong>Login</strong> button at the top-right!</span>
              </div>
            ));
          }}
          className="px-6 py-3.5 bg-sky-500 hover:bg-sky-600 text-white font-extrabold text-xs tracking-wider uppercase rounded-full shadow-md transition-all active:scale-95"
        >
          Sign In with Google OAuth
        </button>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-md py-16 text-center space-y-4">
        <h3 className="text-lg font-black text-gray-800">Your Cart is Empty</h3>
        <p className="text-xs text-gray-400">Add notebooks or pens before checking out.</p>
        <Link href="/shop" className="inline-block px-5 py-2.5 bg-sky-500 text-white font-extrabold text-xs rounded-full shadow-md">
          Go to Shop Catalog
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center space-x-4 border-b border-gray-100 pb-3">
        <Link href="/cart" className="p-2 rounded-full hover:bg-sky-50 text-gray-500">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-black text-gray-800 flex items-center gap-1.5">
          <MapPin className="h-6 w-6 text-sky-500" /> Delivery Address & Checkout
        </h1>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* Left Column: Form */}
        <form onSubmit={handleFormSubmit} className="flex-1 bg-white p-6 sm:p-8 rounded-3xl border-2 border-sky-100/50 shadow-sm space-y-6">
          <h2 className="text-base font-black text-gray-800">Shipping Details</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Full Name */}
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Recipient Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`w-full px-4 py-2.5 text-xs font-semibold rounded-xl border-2 focus:outline-none transition-colors ${
                  formErrors.name ? 'border-red-200 focus:border-red-400 bg-red-50/10' : 'border-sky-100 focus:border-sky-400 bg-sky-50/5'
                }`}
                placeholder="e.g. Naveen Kumar"
              />
              {formErrors.name && <p className="text-[9px] font-black text-red-500">{formErrors.name}</p>}
            </div>

            {/* Mobile Number */}
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Mobile Number</label>
              <input
                type="text"
                name="mobile"
                value={formData.mobile}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`w-full px-4 py-2.5 text-xs font-semibold rounded-xl border-2 focus:outline-none transition-colors ${
                  formErrors.mobile ? 'border-red-200 focus:border-red-400 bg-red-50/10' : 'border-sky-100 focus:border-sky-400 bg-sky-50/5'
                }`}
                placeholder="e.g. 9876543210"
              />
              {formErrors.mobile && <p className="text-[9px] font-black text-red-500">{formErrors.mobile}</p>}
            </div>

            {/* Email */}
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Email Address</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`w-full px-4 py-2.5 text-xs font-semibold rounded-xl border-2 focus:outline-none transition-colors ${
                  formErrors.email ? 'border-red-200 focus:border-red-400 bg-red-50/10' : 'border-sky-100 focus:border-sky-400 bg-sky-50/5'
                }`}
                placeholder="e.g. guest@gmail.com"
              />
              {formErrors.email && <p className="text-[9px] font-black text-red-500">{formErrors.email}</p>}
            </div>

            {/* Flat/House No */}
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Flat / House No / Building</label>
              <input
                type="text"
                name="flat"
                value={formData.flat}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`w-full px-4 py-2.5 text-xs font-semibold rounded-xl border-2 focus:outline-none transition-colors ${
                  formErrors.flat ? 'border-red-200 focus:border-red-400 bg-red-50/10' : 'border-sky-100 focus:border-sky-400 bg-sky-50/5'
                }`}
                placeholder="e.g. Flat No. 3B, Sunlight Apts"
              />
              {formErrors.flat && <p className="text-[9px] font-black text-red-500">{formErrors.flat}</p>}
            </div>

            {/* Street Address */}
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Street Name / Area</label>
              <input
                type="text"
                name="street"
                value={formData.street}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`w-full px-4 py-2.5 text-xs font-semibold rounded-xl border-2 focus:outline-none transition-colors ${
                  formErrors.street ? 'border-red-200 focus:border-red-400 bg-red-50/10' : 'border-sky-100 focus:border-sky-400 bg-sky-50/5'
                }`}
                placeholder="e.g. Medavakkam High Road"
              />
              {formErrors.street && <p className="text-[9px] font-black text-red-500">{formErrors.street}</p>}
            </div>

            {/* Landmark */}
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Landmark (Optional)</label>
              <input
                type="text"
                name="landmark"
                value={formData.landmark}
                onChange={handleChange}
                className="w-full px-4 py-2.5 text-xs font-semibold rounded-xl border-2 border-sky-100 focus:outline-none focus:border-sky-400 bg-sky-50/5 text-gray-800"
                placeholder="e.g. Near Vels Global School"
              />
            </div>

            {/* City */}
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">City</label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`w-full px-4 py-2.5 text-xs font-semibold rounded-xl border-2 focus:outline-none transition-colors ${
                  formErrors.city ? 'border-red-200 focus:border-red-400 bg-red-50/10' : 'border-sky-100 focus:border-sky-400 bg-sky-50/5'
                }`}
                placeholder="e.g. Chennai"
              />
              {formErrors.city && <p className="text-[9px] font-black text-red-500">{formErrors.city}</p>}
            </div>

            {/* State */}
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">State</label>
              <input
                type="text"
                name="state"
                value={formData.state}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`w-full px-4 py-2.5 text-xs font-semibold rounded-xl border-2 focus:outline-none transition-colors ${
                  formErrors.state ? 'border-red-200 focus:border-red-400 bg-red-50/10' : 'border-sky-100 focus:border-sky-400 bg-sky-50/5'
                }`}
                placeholder="e.g. Tamil Nadu"
              />
              {formErrors.state && <p className="text-[9px] font-black text-red-500">{formErrors.state}</p>}
            </div>

            {/* Pincode */}
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Pincode</label>
              <input
                type="text"
                name="pincode"
                value={formData.pincode}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`w-full px-4 py-2.5 text-xs font-semibold rounded-xl border-2 focus:outline-none transition-colors ${
                  formErrors.pincode ? 'border-red-200 focus:border-red-400 bg-red-50/10' : 'border-sky-100 focus:border-sky-400 bg-sky-50/5'
                }`}
                placeholder="e.g. 600100"
              />
              {formErrors.pincode && <p className="text-[9px] font-black text-red-500">{formErrors.pincode}</p>}
            </div>
          </div>

          <div className="flex items-center space-x-2 pt-2">
            <input
              type="checkbox"
              id="saveAddress"
              checked={saveAddress}
              onChange={(e) => setSaveAddress(e.target.checked)}
              className="h-4.5 w-4.5 rounded-lg border-sky-200 text-sky-500 focus:ring-sky-300"
            />
            <label htmlFor="saveAddress" className="text-xs font-semibold text-gray-500 select-none cursor-pointer">
              Save this address details to my profile (stored for future checkouts)
            </label>
          </div>

          <button type="submit" className="hidden" id="submitFormBtn" />
        </form>

        {/* Right Column: Payments & Summary */}
        <div className="w-full lg:w-96 space-y-6">
          
          {/* Payment method selector */}
          <div className="bg-white p-5 rounded-3xl border-2 border-sky-100/50 shadow-sm space-y-4">
            <h3 className="text-xs font-black text-gray-800 flex items-center gap-1.5 uppercase tracking-wide">
              <CreditCard className="h-4 w-4 text-sky-500" /> Select Payment Method
            </h3>

            <div className="flex flex-col gap-2.5">
              {enabledMethods.includes('cod') && (
                <button
                  type="button"
                  onClick={() => setPaymentMethod('COD')}
                  className={`w-full p-4 rounded-2xl border-2 text-left flex items-center justify-between transition-all ${
                    paymentMethod === 'COD' ? 'border-sky-500 bg-sky-50/30' : 'border-gray-150 hover:bg-gray-50'
                  }`}
                >
                  <div>
                    <p className="text-xs font-black text-gray-800">📦 Pay on Delivery (COD)</p>
                    <p className="text-[10px] text-gray-400 font-semibold mt-0.5">Pay in cash or UPI when order arrives</p>
                  </div>
                  {paymentMethod === 'COD' && <div className="h-4.5 w-4.5 rounded-full bg-sky-500 border-2 border-white flex items-center justify-center text-white"><Check className="h-3 w-3 stroke-[3]" /></div>}
                </button>
              )}

              {enabledMethods.includes('razorpay') && (
                <button
                  type="button"
                  onClick={() => setPaymentMethod('Razorpay')}
                  className={`w-full p-4 rounded-2xl border-2 text-left flex items-center justify-between transition-all ${
                    paymentMethod === 'Razorpay' ? 'border-sky-500 bg-sky-50/30' : 'border-gray-150 hover:bg-gray-50'
                  }`}
                >
                  <div>
                    <p className="text-xs font-black text-gray-800">💳 Razorpay Online Gateway</p>
                    <p className="text-[10px] text-gray-400 font-semibold mt-0.5">Pay via Cards, Net Banking, UPI, or Wallets</p>
                  </div>
                  {paymentMethod === 'Razorpay' && <div className="h-4.5 w-4.5 rounded-full bg-sky-500 border-2 border-white flex items-center justify-center text-white"><Check className="h-3 w-3 stroke-[3]" /></div>}
                </button>
              )}


            </div>
          </div>

          {/* Order Summary recap */}
          <div className="bg-white p-6 rounded-3xl border-2 border-sky-100/50 shadow-sm space-y-4">
            <h3 className="text-xs font-black text-gray-800 uppercase tracking-wide border-b border-gray-100 pb-2">
              Summary Details
            </h3>

            <div className="space-y-2 text-xs font-semibold text-gray-500">
              <div className="flex justify-between">
                <span>Subtotal Items</span>
                <span className="text-gray-800 font-bold">₹{subtotal}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-green-500">
                  <span>Coupon discount</span>
                  <span>-₹{discount}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Shipping charge</span>
                {deliveryFee === 0 ? <span className="text-green-500 font-bold">FREE</span> : <span className="text-gray-800 font-bold">₹{deliveryFee}</span>}
              </div>
            </div>

            <hr className="border-gray-100" />

            <div className="flex justify-between items-baseline font-black text-gray-800">
              <span className="text-xs">Final Payable:</span>
              <span className="text-xl text-sky-600">₹{total}</span>
            </div>

            <button
              onClick={() => document.getElementById('submitFormBtn')?.click()}
              className="w-full py-4 bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 text-white font-black text-xs tracking-wider uppercase rounded-2xl shadow-md hover:shadow-lg transition-all transform active:scale-98"
            >
              Verify & Place Order
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog Overlay */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/45 backdrop-blur-xs" onClick={() => setShowConfirmModal(false)} />

          <div className="relative w-full max-w-md bg-white rounded-3xl p-6 border-4 border-yellow-300 shadow-2xl animate-scale-up z-10 space-y-4">
            <div className="text-center space-y-1">
              <h3 className="text-lg font-black text-gray-800">Confirm Order Placement</h3>
              <p className="text-xs text-gray-400">Review your final checkout details.</p>
            </div>

            <div className="bg-sky-50/40 p-4 rounded-2xl border border-sky-100 text-xs space-y-2.5 font-semibold text-gray-500">
              <div className="flex justify-between">
                <span>Order Total:</span>
                <span className="text-gray-800 font-black">₹{total}</span>
              </div>
              <div className="flex justify-between">
                <span>Payment Method:</span>
                <span className="text-sky-600 font-black">{paymentMethod}</span>
              </div>
              <div className="border-t border-sky-100 pt-2.5">
                <p className="font-bold text-gray-400 uppercase text-[9px] mb-0.5">Shipping Address</p>
                <p className="text-gray-700 font-bold line-clamp-1">{formData.name} ({formData.mobile})</p>
                <p className="text-[10px] text-gray-400 mt-0.5 leading-relaxed truncate">
                  {formData.flat}, {formData.street}, {formData.city}, {formData.pincode}
                </p>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-3 border-2 border-gray-150 hover:bg-gray-50 font-bold text-xs text-gray-500 rounded-xl"
              >
                Go Back
              </button>
              <button
                onClick={handlePlaceOrder}
                disabled={placingOrder}
                className="flex-1 py-3 bg-sky-500 hover:bg-sky-600 text-white font-extrabold text-xs rounded-xl shadow-md flex items-center justify-center"
              >
                {placingOrder ? 'Processing...' : 'Confirm & Pay'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
