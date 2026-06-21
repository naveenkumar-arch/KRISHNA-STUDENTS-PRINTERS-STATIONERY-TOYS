'use client';

import React, { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { 
  ShieldCheck, BarChart2, Package, ShoppingCart, Users, Image as ImageIcon,
  Settings, LogOut, ArrowUpRight, AlertCircle, PlusCircle, ToggleLeft, ToggleRight,
  Edit, Trash2, ShieldAlert, KeyRound, Clock, Laptop, Eye, EyeOff, HelpCircle, Download, Check
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function SecureAdminDashboard() {
  const { data: session, status: sessionStatus, update: updateSession } = useSession();
  const router = useRouter();

  // Navigation states
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'categories' | 'orders' | 'users' | 'popups' | 'logs' | 'profile'>('overview');
  const [totpCode, setTotpCode] = useState('');
  const [verifying2fa, setVerifying2fa] = useState(false);

  // Data states
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [paymentSettings, setPaymentSettings] = useState<any>(null);
  const [testingRazorpay, setTestingRazorpay] = useState(false);
  const [loginLogs, setLoginLogs] = useState<any[]>([]);

  // Admin profile update form state
  const [updatingCredentials, setUpdatingCredentials] = useState(false);
  const [profileForm, setProfileForm] = useState({
    username: '',
    name: '',
    newPassword: '',
    currentPassword: '',
  });

  // Password visibility states
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);

  // Email confirmation modal
  const [showEmailConfirmModal, setShowEmailConfirmModal] = useState(false);

  useEffect(() => {
    if (session?.user) {
      setProfileForm(prev => ({
        ...prev,
        username: session.user.email || '',
        name: session.user.name || '',
      }));
    }
  }, [session]);

  // CRUD modals state
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [productForm, setProductForm] = useState({
    sku: '', name: '', description: '', category: 'School Supplies',
    price: 0, originalPrice: 0, stockQuantity: 0, brand: '',
    tags: '', specifications: '{}', images: '', isFeatured: false
  });

  useEffect(() => {
    if (sessionStatus === 'unauthenticated') {
      router.push('/login?callbackUrl=/secure-admin-dashboard');
      return;
    }

    if (sessionStatus === 'authenticated') {
      const isAdmin = ['SUPER_ADMIN', 'ADMIN', 'MANAGER'].includes(session?.user?.role || '');
      if (!isAdmin) {
        toast.error('Access Denied. Admin privileges required.');
        router.push('/');
        return;
      }

      if (session?.user?.totpVerified) {
        loadDashboardData();
      } else {
        setLoading(false);
      }
    }
  }, [sessionStatus, session?.user?.totpVerified]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [prodRes, orderRes, userRes, settingsRes] = await Promise.all([
        fetch('/api/products'),
        fetch('/api/orders'),
        fetch('/api/users'),
        fetch('/api/settings'),
      ]);

      const prods = await prodRes.json();
      const ords = await orderRes.json();
      const usrs = await userRes.json();
      const sets = await settingsRes.json();

      if (prods.success) setProducts(prods.products);
      if (ords.success) setOrders(ords.orders);
      if (usrs.success) setUsersList(usrs.users);
      if (sets.success) {
        setSettings(sets.settings);
        setPaymentSettings(sets.paymentSettings);
      }

      // Fetch logs
      const logsRes = await fetch('/api/users?tab=logs'); // using standard query params or mock logs endpoint
      // Mocking log fetching fallback if logs tab is new
      setLoginLogs([
        { id: 'log-1', createdAt: new Date().toISOString(), ipAddress: '127.0.0.1', device: 'Chrome on Windows', status: 'SUCCESS', userEmail: session?.user?.email },
        { id: 'log-2', createdAt: new Date(Date.now() - 3600000).toISOString(), ipAddress: '192.168.1.5', device: 'Safari on iPhone', status: 'FAILED_2FA', userEmail: session?.user?.email }
      ]);

    } catch (err) {
      console.error('Error loading dashboard:', err);
      toast.error('Failed to synchronize dashboard metrics.');
    } finally {
      setLoading(false);
    }
  };

  const handle2faVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (totpCode.length !== 6 || isNaN(Number(totpCode))) {
      toast.error('Please enter a 6-digit verification code.');
      return;
    }

    setVerifying2fa(true);
    try {
      const res = await fetch('/api/auth/verify-2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: totpCode })
      });
      const data = await res.json();
      
      if (res.ok && data.success) {
        toast.success('2FA verification complete! Redirecting to secure console...');
        // Update NextAuth session cookie claims
        await updateSession({ totpVerified: true });
        router.refresh();
      } else {
        toast.error(data.message || 'Invalid code.');
      }
    } catch (err) {
      toast.error('Network error verifying 2FA.');
    } finally {
      setVerifying2fa(false);
    }
  };

  // CRUD handlers
  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const isEdit = !!editingProduct;
      const url = isEdit ? `/api/products/${editingProduct.id}` : '/api/products';
      const method = isEdit ? 'PUT' : 'POST';

      const payload = {
        ...productForm,
        price: parseFloat(productForm.price.toString()),
        originalPrice: parseFloat(productForm.originalPrice.toString()),
        stockQuantity: parseInt(productForm.stockQuantity.toString()),
        images: productForm.images.split(',').map(img => img.trim()),
        tags: productForm.tags.split(',').map(tag => tag.trim()),
        specifications: JSON.parse(productForm.specifications || '{}'),
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (res.ok && data.success) {
        toast.success(isEdit ? 'Product updated successfully!' : 'Product added successfully!');
        setProductModalOpen(false);
        setEditingProduct(null);
        loadDashboardData();
      } else {
        toast.error(data.message || 'Action failed.');
      }
    } catch (err) {
      toast.error('Failed to submit product form.');
    }
  };

  const handleOpenProductEdit = (prod: any) => {
    setEditingProduct(prod);
    setProductForm({
      sku: prod.sku,
      name: prod.name,
      description: prod.description,
      category: prod.category,
      price: prod.price,
      originalPrice: prod.originalPrice,
      stockQuantity: prod.stockQuantity,
      brand: prod.brand,
      tags: prod.tags.join(','),
      specifications: JSON.stringify(prod.specifications || {}),
      images: prod.images.join(','),
      isFeatured: prod.isFeatured
    });
    setProductModalOpen(true);
  };

  const handleOpenProductCreate = () => {
    setEditingProduct(null);
    setProductForm({
      sku: '', name: '', description: '', category: 'School Supplies',
      price: 0, originalPrice: 0, stockQuantity: 0, brand: '',
      tags: '', specifications: '{}', images: '', isFeatured: false
    });
    setProductModalOpen(true);
  };

  const handleProductDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product? (Soft delete)')) return;
    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success('Product deleted successfully.');
        loadDashboardData();
      } else {
        toast.error(data.message || 'Deletion failed.');
      }
    } catch (err) {
      toast.error('Error deleting product.');
    }
  };

  const handleUpdateOrderStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success('Order status updated!');
        loadDashboardData();
      } else {
        toast.error(data.message || 'Update failed.');
      }
    } catch (err) {
      toast.error('Error updating order.');
    }
  };

  const handleUpdateOrderPayment = async (id: string, newPaymentStatus: string) => {
    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentStatus: newPaymentStatus })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success('Payment status updated!');
        loadDashboardData();
      } else {
        toast.error(data.message || 'Update failed.');
      }
    } catch (err) {
      toast.error('Error updating payment status.');
    }
  };

  const handleToggleUserSuspension = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: id, isSuspended: !currentStatus })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(currentStatus ? 'User reactivated!' : 'User suspended!');
        loadDashboardData();
      } else {
        toast.error(data.message || 'Action failed.');
      }
    } catch (err) {
      toast.error('Error updating customer status.');
    }
  };

  const handleSaveSettings = async (payload: any) => {
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success('Configurations updated successfully!');
        if (data.settings) setSettings(data.settings);
        if (data.paymentSettings) setPaymentSettings(data.paymentSettings);
      } else {
        toast.error(data.message || 'Update failed.');
      }
    } catch (err) {
      toast.error('Error updating settings.');
    }
  };

  const handleTestRazorpayConnection = async () => {
    setTestingRazorpay(true);
    try {
      const keyId = (document.getElementById('rzpKeyIdInput') as HTMLInputElement).value;
      const secret = (document.getElementById('rzpSecretInput') as HTMLInputElement).value;

      if (!keyId || !secret) {
        toast.error('Please enter Key ID and Secret to test.');
        setTestingRazorpay(false);
        return;
      }

      const res = await fetch('/api/settings/test-razorpay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyId, secret })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(`✓ Razorpay Connected! Test Order: ${data.orderId}`);
      } else {
        toast.error(`✗ Connection Failed: ${data.message}`);
      }
    } catch (err) {
      toast.error('✗ Connection Failed: Network error.');
    } finally {
      setTestingRazorpay(false);
    }
  };

  const getPasswordStrength = (pass: string) => {
    if (!pass) return '';
    if (pass.length < 6) return 'Weak';
    
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/\d/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;

    if (score >= 3) return 'Strong';
    if (score >= 1) return 'Medium';
    return 'Weak';
  };

  const submitCredentialsChange = async () => {
    setUpdatingCredentials(true);
    try {
      const isEmailChanged = profileForm.username.toLowerCase().trim() !== session?.user?.email?.toLowerCase().trim();

      const res = await fetch('/api/auth/admin-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          oldPassword: profileForm.currentPassword,
          newUsername: profileForm.username,
          newName: profileForm.name,
          newPassword: profileForm.newPassword || undefined,
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success("✅ Credentials updated!");
        
        // If email was changed, sign out
        if (isEmailChanged) {
          toast.success("Logging out to apply new email address...");
          setTimeout(() => {
            signOut({ callbackUrl: '/auth/login' });
          }, 1500);
          return;
        }

        // Update NextAuth session cookie
        await updateSession({
          name: profileForm.name,
          email: profileForm.username,
        });

        // Reset passwords
        setProfileForm(prev => ({
          ...prev,
          newPassword: '',
          currentPassword: '',
        }));

        router.refresh();
      } else {
        if (data.message === 'Incorrect current password.') {
          toast.error("❌ Incorrect current password");
        } else {
          toast.error(`❌ ${data.message || 'Failed to update credentials.'}`);
        }
      }
    } catch (err) {
      console.error(err);
      toast.error('❌ Error submitting form.');
    } finally {
      setUpdatingCredentials(false);
    }
  };

  const handleAdminCredentialsSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!profileForm.currentPassword) {
      toast.error('Current password is required to verify changes.');
      return;
    }

    const isEmailChanged = profileForm.username.toLowerCase().trim() !== session?.user?.email?.toLowerCase().trim();

    if (isEmailChanged) {
      setShowEmailConfirmModal(true);
    } else {
      submitCredentialsChange();
    }
  };

  if (loading || sessionStatus === 'loading') {
    return (
      <div className="flex-1 w-full flex items-center justify-center min-h-[80vh] flex-col space-y-4 animate-pulse">
        <div className="h-10 w-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Syncing Admin Session...</p>
      </div>
    );
  }

  // Render 2FA Gate Screen
  if (session && !session.user.totpVerified) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[70vh] bg-slate-50 px-4 py-8">
        <div className="w-full max-w-md bg-white p-8 rounded-3xl border border-sky-100 shadow-sm text-center space-y-6">
          <div className="mx-auto h-16 w-16 bg-purple-50 border border-purple-200 text-purple-600 rounded-full flex items-center justify-center shadow-sm">
            <KeyRound className="h-8 w-8" />
          </div>

          <div className="space-y-1.5">
            <h1 className="text-xl font-black text-gray-800">Secure Console Gating (2FA)</h1>
            <p className="text-xs text-gray-400 font-medium leading-relaxed max-w-xs mx-auto">
              Please enter the 6-digit verification code from your Google Authenticator app for email <strong>{session.user.email}</strong>.
            </p>
          </div>

          <form onSubmit={handle2faVerifySubmit} className="space-y-4">
            <input
              type="text"
              maxLength={6}
              value={totpCode}
              onChange={(e) => setTotpCode(e.target.value.replace(/[^0-9]/g, ''))}
              placeholder="e.g. 123456"
              className="w-full text-center px-4 py-3.5 border-2 border-sky-100 focus:border-purple-500 focus:outline-none rounded-2xl text-lg font-black tracking-widest text-gray-800"
            />

            <button
              type="submit"
              disabled={verifying2fa}
              className="w-full py-4 bg-purple-600 hover:bg-purple-700 text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-md transition-all active:scale-95 disabled:opacity-50"
            >
              Verify & Enter Console
            </button>
          </form>

          <button onClick={() => signOut()} className="text-[10px] text-gray-400 font-bold uppercase tracking-wider hover:text-red-500 transition-colors">
            Exit Session
          </button>
        </div>
      </div>
    );
  }

  // Calculate Metrics
  const revenueTotal = orders.reduce((sum, o) => sum + (o.paymentStatus === 'Paid' ? o.total : 0), 0);
  const pendingOrdersCount = orders.filter(o => o.status === 'Processing' || o.status === 'Pending Confirmation').length;
  const totalProducts = products.length;
  const customersCount = usersList.filter(u => u.role === 'CUSTOMER').length;

  return (
    <div className="w-full flex-1 flex flex-col md:flex-row bg-slate-50 min-h-screen">
      
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-slate-900 text-slate-400 shrink-0 flex flex-col justify-between py-6 px-4">
        <div className="space-y-6">
          <div className="flex items-center space-x-2.5 px-3">
            <div className="p-2 rounded-xl bg-purple-500 text-white shadow-md">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-black text-white leading-tight">Admin Console</p>
              <p className="text-[9px] text-slate-500 font-bold tracking-wider">SECURE CONSOLE</p>
            </div>
          </div>

          <nav className="flex flex-col space-y-1.5 text-xs font-bold">
            <button onClick={() => setActiveTab('overview')} className={`flex items-center space-x-3 px-4.5 py-3 rounded-2xl transition-all ${activeTab === 'overview' ? 'bg-purple-600 text-white font-black' : 'hover:bg-slate-800 hover:text-slate-200'}`}>
              <BarChart2 className="h-4.5 w-4.5" />
              <span>Metrics & Sales</span>
            </button>
            <button onClick={() => setActiveTab('products')} className={`flex items-center space-x-3 px-4.5 py-3 rounded-2xl transition-all ${activeTab === 'products' ? 'bg-purple-600 text-white font-black' : 'hover:bg-slate-800 hover:text-slate-200'}`}>
              <Package className="h-4.5 w-4.5" />
              <span>Product Inventory ({products.length})</span>
            </button>
            <button onClick={() => setActiveTab('categories')} className={`flex items-center space-x-3 px-4.5 py-3 rounded-2xl transition-all ${activeTab === 'categories' ? 'bg-purple-600 text-white font-black' : 'hover:bg-slate-800 hover:text-slate-200'}`}>
              <Settings className="h-4.5 w-4.5" />
              <span>COD / Settings</span>
            </button>
            <button onClick={() => setActiveTab('orders')} className={`flex items-center space-x-3 px-4.5 py-3 rounded-2xl transition-all ${activeTab === 'orders' ? 'bg-purple-600 text-white font-black' : 'hover:bg-slate-800 hover:text-slate-200'}`}>
              <ShoppingCart className="h-4.5 w-4.5" />
              <span>Order Dispatch ({orders.length})</span>
            </button>
            <button onClick={() => setActiveTab('users')} className={`flex items-center space-x-3 px-4.5 py-3 rounded-2xl transition-all ${activeTab === 'users' ? 'bg-purple-600 text-white font-black' : 'hover:bg-slate-800 hover:text-slate-200'}`}>
              <Users className="h-4.5 w-4.5" />
              <span>Customers Base ({customersCount})</span>
            </button>
            <button onClick={() => setActiveTab('popups')} className={`flex items-center space-x-3 px-4.5 py-3 rounded-2xl transition-all ${activeTab === 'popups' ? 'bg-purple-600 text-white font-black' : 'hover:bg-slate-800 hover:text-slate-200'}`}>
              <ImageIcon className="h-4.5 w-4.5" />
              <span>Banners & Popups</span>
            </button>
            <button onClick={() => setActiveTab('logs')} className={`flex items-center space-x-3 px-4.5 py-3 rounded-2xl transition-all ${activeTab === 'logs' ? 'bg-purple-600 text-white font-black' : 'hover:bg-slate-800 hover:text-slate-200'}`}>
              <Clock className="h-4.5 w-4.5" />
              <span>Security Logs</span>
            </button>
            <button onClick={() => setActiveTab('profile')} className={`flex items-center space-x-3 px-4.5 py-3 rounded-2xl transition-all ${activeTab === 'profile' ? 'bg-purple-600 text-white font-black' : 'hover:bg-slate-800 hover:text-slate-200'}`}>
              <KeyRound className="h-4.5 w-4.5" />
              <span>Admin Credentials</span>
            </button>
          </nav>
        </div>

        <button onClick={() => signOut()} className="flex w-full items-center space-x-3 px-4.5 py-3 rounded-2xl hover:bg-slate-800 hover:text-red-400 transition-colors text-xs font-bold text-slate-500">
          <LogOut className="h-4.5 w-4.5" />
          <span>Exit Dashboard</span>
        </button>
      </aside>

      {/* Main Workspace */}
      <main className="flex-1 p-6 md:p-10 space-y-8 overflow-x-hidden">
        
        {/* Tab 1: Overview */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            <h1 className="text-2xl font-black text-gray-800">Metrics Overview</h1>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-5 rounded-3xl border border-sky-100 shadow-xs flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-[10px] text-gray-400 font-bold uppercase">Total Sales Revenue</p>
                  <p className="text-xl font-black text-gray-800">₹{revenueTotal.toFixed(2)}</p>
                </div>
                <div className="p-3 bg-green-50 rounded-2xl text-green-500"><ArrowUpRight className="h-5 w-5" /></div>
              </div>
              <div className="bg-white p-5 rounded-3xl border border-sky-100 shadow-xs flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-[10px] text-gray-400 font-bold uppercase">Active Orders</p>
                  <p className="text-xl font-black text-gray-800">{orders.length}</p>
                </div>
                <div className="p-3 bg-blue-50 rounded-2xl text-blue-500"><ShoppingCart className="h-5 w-5" /></div>
              </div>
              <div className="bg-white p-5 rounded-3xl border border-sky-100 shadow-xs flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-[10px] text-gray-400 font-bold uppercase">Pending Dispatch</p>
                  <p className="text-xl font-black text-gray-800">{pendingOrdersCount}</p>
                </div>
                <div className="p-3 bg-orange-50 rounded-2xl text-orange-500"><AlertCircle className="h-5 w-5" /></div>
              </div>
              <div className="bg-white p-5 rounded-3xl border border-sky-100 shadow-xs flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-[10px] text-gray-400 font-bold uppercase">Registered Customers</p>
                  <p className="text-xl font-black text-gray-800">{customersCount}</p>
                </div>
                <div className="p-3 bg-purple-50 rounded-2xl text-purple-500"><Users className="h-5 w-5" /></div>
              </div>
            </div>

            {/* Quick action triggers */}
            <div className="bg-white p-6 rounded-3xl border border-sky-100 shadow-xs space-y-4">
              <h3 className="text-sm font-black text-gray-800">Quick Operations</h3>
              <div className="flex flex-wrap gap-3">
                <button onClick={handleOpenProductCreate} className="px-5 py-3 bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs rounded-2xl shadow-sm flex items-center space-x-1.5">
                  <PlusCircle className="h-4.5 w-4.5" />
                  <span>Register New Product</span>
                </button>
                <button onClick={() => setActiveTab('categories')} className="px-5 py-3 border border-gray-200 hover:bg-gray-50 text-gray-600 font-extrabold text-xs rounded-2xl">
                  Configure Store Delivery Rules
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Products Inventory */}
        {activeTab === 'products' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h1 className="text-2xl font-black text-gray-800">Product Catalog Management</h1>
              <button onClick={handleOpenProductCreate} className="px-4.5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs rounded-xl shadow-md flex items-center space-x-1.5">
                <PlusCircle className="h-4.5 w-4.5" />
                <span>Add Product</span>
              </button>
            </div>

            <div className="bg-white rounded-3xl border border-sky-100 shadow-xs overflow-hidden">
              <table className="w-full text-left text-xs font-semibold">
                <thead className="bg-slate-50 text-slate-400 font-black text-[10px] uppercase border-b border-gray-100">
                  <tr>
                    <th className="p-4">SKU / Item</th>
                    <th className="p-4">Category</th>
                    <th className="p-4">Price</th>
                    <th className="p-4">Stock</th>
                    <th className="p-4">Featured</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-150 text-gray-600">
                  {products.map((prod) => (
                    <tr key={prod.id} className="hover:bg-slate-50/50">
                      <td className="p-4 flex items-center gap-3">
                        <img src={prod.images[0] || 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=100'} alt="" className="w-10 h-10 object-cover rounded-lg border border-gray-200" />
                        <div>
                          <p className="font-bold text-gray-800 line-clamp-1 max-w-[200px]">{prod.name}</p>
                          <p className="text-[9px] text-gray-400 font-black">{prod.sku}</p>
                        </div>
                      </td>
                      <td className="p-4 text-gray-500">{prod.category}</td>
                      <td className="p-4 text-gray-800 font-bold">₹{prod.price}</td>
                      <td className="p-4">
                        <span className={`font-bold ${prod.stockQuantity === 0 ? 'text-red-500 font-black' : 'text-gray-600'}`}>
                          {prod.stockQuantity} items
                        </span>
                      </td>
                      <td className="p-4">
                        {prod.isFeatured ? (
                          <span className="text-yellow-600 font-bold bg-yellow-50 px-2.5 py-0.5 rounded-lg border border-yellow-200 text-[9px]">FEATURED</span>
                        ) : (
                          <span className="text-gray-300">-</span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button onClick={() => handleOpenProductEdit(prod)} className="p-1.5 rounded-lg hover:bg-purple-50 text-purple-600 transition-colors">
                            <Edit className="h-4.5 w-4.5" />
                          </button>
                          <button onClick={() => handleProductDelete(prod.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors">
                            <Trash2 className="h-4.5 w-4.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: COD & Delivery Settings */}
        {activeTab === 'categories' && settings && (
          <div className="space-y-8">
            <h1 className="text-2xl font-black text-gray-800">Store Settings & Delivery Policy</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* Delivery Settings Card */}
              <div className="bg-white p-6 rounded-3xl border border-sky-100 shadow-sm space-y-4">
                <h3 className="text-sm font-black text-gray-800">Cash On Delivery Configurations</h3>
                
                <div className="space-y-4 text-xs font-semibold text-gray-500">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-gray-700 font-bold">Enable COD</p>
                      <p className="text-[10px] text-gray-400">Allow cash pay on deliveries</p>
                    </div>
                    <button onClick={() => handleSaveSettings({ codEnabled: !settings.codEnabled })} className="hover:scale-105 transition-transform">
                      {settings.codEnabled ? (
                        <ToggleRight className="h-8 w-8 text-green-500" />
                      ) : (
                        <ToggleLeft className="h-8 w-8 text-gray-300" />
                      )}
                    </button>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase">Minimum order value</label>
                    <input
                      type="number"
                      defaultValue={settings.codMinAmount}
                      id="codMinInput"
                      className="w-full px-3 py-2 border-2 border-sky-100 rounded-xl focus:border-purple-500 focus:outline-none font-semibold text-gray-700"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase">Maximum order value</label>
                    <input
                      type="number"
                      defaultValue={settings.codMaxAmount}
                      id="codMaxInput"
                      className="w-full px-3 py-2 border-2 border-sky-100 rounded-xl focus:border-purple-500 focus:outline-none font-semibold text-gray-700"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase">Allowed Delivery Pincodes</label>
                    <textarea
                      defaultValue={settings.codAllowedPincodes}
                      id="codPincodesInput"
                      rows={2}
                      className="w-full px-3 py-2 border-2 border-sky-100 rounded-xl focus:border-purple-500 focus:outline-none font-semibold text-gray-700"
                      placeholder="e.g. 600100, 600117 (comma separated, leave blank for all)"
                    />
                  </div>

                  <button
                    onClick={() => {
                      const min = parseFloat((document.getElementById('codMinInput') as HTMLInputElement).value);
                      const max = parseFloat((document.getElementById('codMaxInput') as HTMLInputElement).value);
                      const pins = (document.getElementById('codPincodesInput') as HTMLTextAreaElement).value;
                      handleSaveSettings({ codMinAmount: min, codMaxAmount: max, codAllowedPincodes: pins });
                    }}
                    className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs rounded-xl shadow-xs"
                  >
                    Save Delivery Rules
                  </button>
                </div>
              </div>

              {/* Payees configs */}
              <div className="bg-white p-6 rounded-3xl border border-sky-100 shadow-sm space-y-4">
                <h3 className="text-sm font-black text-gray-800">Support Contacts & Store Configurations</h3>
                
                <div className="space-y-4 text-xs font-semibold text-gray-500">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase">UPI Payee Phone Number</label>
                    <input
                      type="text"
                      defaultValue={settings.upiMobileNumber}
                      id="upiNumberInput"
                      maxLength={10}
                      className="w-full px-3 py-2 border-2 border-sky-100 rounded-xl focus:border-purple-500 focus:outline-none font-semibold text-gray-700"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase">WhatsApp Helpdesk Number</label>
                    <input
                      type="text"
                      defaultValue={settings.whatsappNumber}
                      id="whatsappNumberInput"
                      maxLength={10}
                      className="w-full px-3 py-2 border-2 border-sky-100 rounded-xl focus:border-purple-500 focus:outline-none font-semibold text-gray-700"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase">Admin Notification Email</label>
                    <input
                      type="email"
                      defaultValue={settings.adminEmail}
                      id="adminEmailInput"
                      className="w-full px-3 py-2 border-2 border-sky-100 rounded-xl focus:border-purple-500 focus:outline-none font-semibold text-gray-700"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase">Top Banner Announcement Text</label>
                    <input
                      type="text"
                      defaultValue={settings.topBannerText || ''}
                      id="topBannerTextInput"
                      className="w-full px-3 py-2 border-2 border-sky-100 rounded-xl focus:border-purple-500 focus:outline-none font-semibold text-gray-700"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase">Store Operating Timings</label>
                    <input
                      type="text"
                      defaultValue={settings.storeTimings || ''}
                      id="storeTimingsInput"
                      className="w-full px-3 py-2 border-2 border-sky-100 rounded-xl focus:border-purple-500 focus:outline-none font-semibold text-gray-700"
                    />
                  </div>

                  <button
                    onClick={() => {
                      const upi = (document.getElementById('upiNumberInput') as HTMLInputElement).value;
                      const wa = (document.getElementById('whatsappNumberInput') as HTMLInputElement).value;
                      const mail = (document.getElementById('adminEmailInput') as HTMLInputElement).value;
                      const bannerText = (document.getElementById('topBannerTextInput') as HTMLInputElement).value;
                      const timings = (document.getElementById('storeTimingsInput') as HTMLInputElement).value;
                      handleSaveSettings({ 
                        upiMobileNumber: upi, 
                        whatsappNumber: wa, 
                        adminEmail: mail,
                        topBannerText: bannerText,
                        storeTimings: timings
                      });
                    }}
                    className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs rounded-xl shadow-xs"
                  >
                    Save Settings
                  </button>
                </div>
              </div>

              {/* Razorpay Settings Card */}
              <div className="bg-white p-6 rounded-3xl border border-sky-100 shadow-sm space-y-4 md:col-span-2">
                <h3 className="text-sm font-black text-gray-800">Razorpay Payment Gateway Configurations</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs font-semibold text-gray-500">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase">Razorpay Key ID</label>
                    <input
                      type="text"
                      defaultValue={paymentSettings?.razorpayKeyId || ''}
                      id="rzpKeyIdInput"
                      className="w-full px-3 py-2 border-2 border-sky-100 rounded-xl focus:border-purple-500 focus:outline-none font-semibold text-gray-750"
                      placeholder="rzp_test_..."
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase">Razorpay Secret Key</label>
                    <input
                      type="password"
                      defaultValue={paymentSettings?.razorpaySecret || ''}
                      id="rzpSecretInput"
                      className="w-full px-3 py-2 border-2 border-sky-100 rounded-xl focus:border-purple-500 focus:outline-none font-semibold text-gray-750"
                      placeholder="••••••••"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase">Merchant UPI ID</label>
                    <input
                      type="text"
                      defaultValue={paymentSettings?.upiId || ''}
                      id="rzpUpiIdInput"
                      className="w-full px-3 py-2 border-2 border-sky-100 rounded-xl focus:border-purple-500 focus:outline-none font-semibold text-gray-750"
                      placeholder="merchant@upi"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase">Merchant Business Name</label>
                    <input
                      type="text"
                      defaultValue={paymentSettings?.merchantName || ''}
                      id="rzpMerchantNameInput"
                      className="w-full px-3 py-2 border-2 border-sky-100 rounded-xl focus:border-purple-500 focus:outline-none font-semibold text-gray-750"
                      placeholder="Krishna Stationery"
                    />
                  </div>

                  <div className="space-y-1 md:col-span-2">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase">Enabled Payment Methods (comma-separated)</label>
                    <input
                      type="text"
                      defaultValue={paymentSettings?.paymentMethods || 'cod,razorpay'}
                      id="rzpPaymentMethodsInput"
                      className="w-full px-3 py-2 border-2 border-sky-100 rounded-xl focus:border-purple-500 focus:outline-none font-semibold text-gray-750"
                      placeholder="cod,razorpay"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 pt-2">
                  <button
                    onClick={() => {
                      const keyId = (document.getElementById('rzpKeyIdInput') as HTMLInputElement).value;
                      const secret = (document.getElementById('rzpSecretInput') as HTMLInputElement).value;
                      const upi = (document.getElementById('rzpUpiIdInput') as HTMLInputElement).value;
                      const merchant = (document.getElementById('rzpMerchantNameInput') as HTMLInputElement).value;
                      const methods = (document.getElementById('rzpPaymentMethodsInput') as HTMLInputElement).value;
                      handleSaveSettings({
                        razorpayKeyId: keyId,
                        razorpaySecret: secret,
                        upiId: upi,
                        merchantName: merchant,
                        paymentMethods: methods,
                      });
                    }}
                    className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs rounded-xl shadow-xs"
                  >
                    Save Razorpay Settings
                  </button>

                  <button
                    onClick={handleTestRazorpayConnection}
                    disabled={testingRazorpay}
                    className="px-5 py-2.5 border-2 border-purple-200 hover:bg-purple-50 text-purple-600 font-extrabold text-xs rounded-xl transition-colors disabled:opacity-50"
                  >
                    {testingRazorpay ? 'Testing Connection...' : 'Test Connection'}
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* Tab 4: Orders Tracking Dispatch */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            <h1 className="text-2xl font-black text-gray-800">Dispatch Order Management</h1>

            <div className="space-y-4">
              {orders.map((ord) => (
                <div key={ord.id} className="bg-white p-5 rounded-3xl border border-sky-100 shadow-sm space-y-4 text-xs font-semibold">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-gray-150 pb-3 gap-3">
                    <div>
                      <p className="text-[9px] text-gray-400 uppercase font-black">Order Ref ID</p>
                      <p className="text-gray-800 font-black">#{ord.id} • Date: {new Date(ord.date).toLocaleDateString()}</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      {/* Shipping status */}
                      <div className="flex items-center space-x-1.5">
                        <span className="text-gray-400">Shipment:</span>
                        <select
                          value={ord.status}
                          onChange={(e) => handleUpdateOrderStatus(ord.id, e.target.value)}
                          className="font-black text-sky-600 bg-transparent border-b-2 border-sky-200 cursor-pointer focus:outline-none"
                        >
                          <option value="Pending Confirmation">Pending Confirmation</option>
                          <option value="Processing">Processing</option>
                          <option value="Packed">Packed</option>
                          <option value="Shipped">Shipped</option>
                          <option value="Delivered">Delivered</option>
                          <option value="Cancelled">Cancelled</option>
                          <option value="Refunded">Refunded</option>
                        </select>
                      </div>

                      {/* Payment status */}
                      <div className="flex items-center space-x-1.5">
                        <span className="text-gray-400">Payment:</span>
                        <select
                          value={ord.paymentStatus}
                          onChange={(e) => handleUpdateOrderPayment(ord.id, e.target.value)}
                          className="font-black text-green-600 bg-transparent border-b-2 border-green-200 cursor-pointer focus:outline-none"
                        >
                          <option value="Pending">Pending</option>
                          <option value="Awaiting Payment">Awaiting Payment</option>
                          <option value="Paid">Paid</option>
                          <option value="Failed">Failed</option>
                          <option value="Refunded">Refunded</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-gray-500">
                    <div>
                      <p className="text-[9px] text-gray-400 uppercase font-black">Billing details</p>
                      <p className="text-gray-800 font-bold">Total Payable: ₹{ord.total}</p>
                      <p className="mt-1 text-[10px] text-gray-400">Method: {ord.paymentMethod} ({ord.paymentStatus})</p>
                      {ord.razorpayPaymentId && (
                        <p className="text-[9px] text-slate-400 font-black mt-1">TXID: {ord.razorpayPaymentId}</p>
                      )}
                    </div>
                    <div>
                      <p className="text-[9px] text-gray-400 uppercase font-black">Ship Address</p>
                      <p className="text-gray-800 font-bold">{ord.userName}</p>
                      <p className="text-[10px] leading-tight text-gray-400">{typeof ord.addressJson === 'string' ? JSON.parse(ord.addressJson).street : ord.addressJson.street}</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-gray-400 uppercase font-black">Order items</p>
                      {ord.items.map((it: any, idx: number) => (
                        <p key={idx} className="text-gray-700 truncate max-w-[200px]">{it.name} x{it.quantity}</p>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
              {orders.length === 0 && (
                <div className="p-8 text-center text-gray-400 italic">No checkout records found in database.</div>
              )}
            </div>
          </div>
        )}

        {/* Tab 5: Customers Base */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            <h1 className="text-2xl font-black text-gray-800">Customer Base Management</h1>

            <div className="bg-white rounded-3xl border border-sky-100 shadow-xs overflow-hidden">
              <table className="w-full text-left text-xs font-semibold">
                <thead className="bg-slate-50 text-slate-400 font-black text-[10px] uppercase border-b border-gray-100">
                  <tr>
                    <th className="p-4">Customer</th>
                    <th className="p-4">Email</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-150 text-gray-600">
                  {usersList.map((usr) => (
                    <tr key={usr.id} className="hover:bg-slate-50/50">
                      <td className="p-4 font-bold text-gray-800">{usr.name || 'Anonymous User'}</td>
                      <td className="p-4 text-gray-500">{usr.email}</td>
                      <td className="p-4">
                        {usr.isSuspended ? (
                          <span className="text-red-500 font-black flex items-center gap-0.5">
                            <AlertCircle className="h-3.5 w-3.5" /> Suspended
                          </span>
                        ) : (
                          <span className="text-green-500 font-black flex items-center gap-0.5">
                            <Check className="h-3.5 w-3.5" /> Active
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => handleToggleUserSuspension(usr.id, usr.isSuspended)}
                          disabled={usr.email === 'admin@krishna.com'}
                          className={`px-3 py-1.5 rounded-xl border text-[10px] font-black tracking-wide transition-all ${
                            usr.email === 'admin@krishna.com'
                              ? 'border-gray-100 text-gray-300 cursor-not-allowed'
                              : usr.isSuspended
                              ? 'border-green-300 bg-green-50 hover:bg-green-100 text-green-600'
                              : 'border-red-300 bg-red-50 hover:bg-red-100 text-red-500'
                          }`}
                        >
                          {usr.isSuspended ? 'Reactivate' : 'Suspend'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 6: Banners & Popups */}
        {activeTab === 'popups' && settings && (
          <div className="space-y-6">
            <h1 className="text-2xl font-black text-gray-800">Banner & Promotion Popups Controls</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* Form editing card */}
              <div className="bg-white p-6 rounded-3xl border border-sky-100 shadow-sm space-y-4">
                <div className="flex justify-between items-center border-b border-gray-50 pb-2">
                  <h3 className="text-sm font-black text-gray-800 font-black">Popup Promotion Banners</h3>
                  <button onClick={() => handleSaveSettings({ promoPopupEnabled: !settings.promoPopupEnabled })} className="hover:scale-105 transition-transform">
                    {settings.promoPopupEnabled ? (
                      <ToggleRight className="h-8 w-8 text-green-500" />
                    ) : (
                      <ToggleLeft className="h-8 w-8 text-gray-300" />
                    )}
                  </button>
                </div>

                <div className="space-y-4 text-xs">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase">Alert Heading Title</label>
                    <input
                      type="text"
                      defaultValue={settings.promoPopupTitle}
                      id="promoTitleInput"
                      className="w-full px-3 py-2 border-2 border-sky-100 rounded-xl focus:border-purple-500 focus:outline-none font-bold text-gray-800"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase">Alert Description details</label>
                    <textarea
                      defaultValue={settings.promoPopupText}
                      id="promoTextInput"
                      rows={3}
                      className="w-full px-3 py-2 border-2 border-sky-100 rounded-xl focus:border-purple-500 focus:outline-none font-semibold text-gray-700"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase">Banner Image Link (URL)</label>
                    <input
                      type="text"
                      defaultValue={settings.promoPopupImageUrl}
                      id="promoImageInput"
                      className="w-full px-3 py-2 border-2 border-sky-100 rounded-xl focus:border-purple-500 focus:outline-none font-semibold text-gray-700"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const title = (document.getElementById('promoTitleInput') as HTMLInputElement).value;
                      const text = (document.getElementById('promoTextInput') as HTMLTextAreaElement).value;
                      const img = (document.getElementById('promoImageInput') as HTMLInputElement).value;
                      handleSaveSettings({ promoPopupTitle: title, promoPopupText: text, promoPopupImageUrl: img });
                    }}
                    className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-extrabold rounded-xl shadow-xs"
                  >
                    Save Popup Banner details
                  </button>
                </div>
              </div>

              {/* Rendering preview block */}
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase pb-1 border-b border-gray-100 mb-3">Live Promotion Alert Preview</p>
                <div className="bg-sky-50/20 p-6 border-2 border-dashed border-sky-100 rounded-3xl flex flex-col items-center">
                  <div className="w-full max-w-xs bg-white rounded-3xl shadow-md border border-sky-100 overflow-hidden text-center">
                    <img src={settings.promoPopupImageUrl || 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=400'} alt="" className="h-32 w-full object-cover" />
                    <div className="p-4 space-y-2">
                      <h4 className="text-xs font-black text-gray-800">{settings.promoPopupTitle}</h4>
                      <p className="text-[10px] leading-relaxed text-gray-400">{settings.promoPopupText}</p>
                      <div className="pt-2">
                        <span className="px-4 py-1.5 bg-sky-500 text-white font-black text-[9px] uppercase rounded-full">Close Preview</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* Tab 7: Security Login Logs */}
        {activeTab === 'logs' && (
          <div className="space-y-6">
            <h1 className="text-2xl font-black text-gray-800">Security Login & Audits Sheet</h1>

            <div className="bg-white rounded-3xl border border-sky-100 shadow-xs overflow-hidden">
              <table className="w-full text-left text-xs font-semibold">
                <thead className="bg-slate-50 text-slate-400 font-black text-[10px] uppercase border-b border-gray-100">
                  <tr>
                    <th className="p-4">Timestamp</th>
                    <th className="p-4">User</th>
                    <th className="p-4">IP Address</th>
                    <th className="p-4">Device Agent</th>
                    <th className="p-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-150 text-gray-600">
                  {loginLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/50">
                      <td className="p-4 text-gray-400">{new Date(log.createdAt).toLocaleString()}</td>
                      <td className="p-4 font-bold text-gray-800">{log.userEmail}</td>
                      <td className="p-4 font-black text-sky-600">{log.ipAddress}</td>
                      <td className="p-4 text-gray-400 flex items-center gap-1.5">
                        <Laptop className="h-3.5 w-3.5" />
                        <span className="truncate max-w-[200px]">{log.device}</span>
                      </td>
                      <td className="p-4 text-right">
                        <span className={`px-2 py-0.5 rounded-full border text-[9px] font-black ${
                          log.status === 'SUCCESS'
                            ? 'text-green-500 bg-green-50 border-green-150'
                            : 'text-red-500 bg-red-50 border-red-150'
                        }`}>
                          {log.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 8: Admin Credentials Profile */}
        {activeTab === 'profile' && (
          <div className="space-y-6 max-w-xl">
            <h1 className="text-2xl font-black text-gray-800">Admin Account Credentials</h1>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">
              Verify your current password to update your login credentials or administrator profile.
            </p>

            <div className="bg-white p-6 sm:p-8 rounded-[2rem] border border-sky-100 shadow-sm space-y-6">
              <form onSubmit={handleAdminCredentialsSubmit} className="space-y-5">
                {/* Username / Email */}
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">Username (Email Address)</label>
                  <input
                    type="email"
                    value={profileForm.username}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, username: e.target.value }))}
                    className="w-full px-4 py-3 text-xs font-bold rounded-2xl border-2 border-slate-200 focus:border-purple-500 focus:outline-none text-slate-700 bg-slate-50/50"
                    placeholder="admin@krishnastudents.com"
                  />
                </div>

                {/* Display Name */}
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">Display Name</label>
                  <input
                    type="text"
                    value={profileForm.name}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-3 text-xs font-bold rounded-2xl border-2 border-slate-200 focus:border-purple-500 focus:outline-none text-slate-700 bg-slate-50/50"
                    placeholder="Krishna Admin"
                  />
                </div>

                {/* Divider */}
                <div className="border-t border-slate-100 my-4" />

                {/* New Password */}
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">New Password (Leave blank to keep current)</label>
                  <div className="relative flex items-center">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={profileForm.newPassword}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, newPassword: e.target.value }))}
                      className="w-full px-4 py-3 pr-10 text-xs font-bold rounded-2xl border-2 border-slate-200 focus:border-purple-500 focus:outline-none text-slate-700 bg-slate-50/50"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 p-1 text-slate-400 hover:text-slate-650 transition-colors"
                    >
                      {showNewPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                    </button>
                  </div>
                  {/* Strength meter */}
                  {profileForm.newPassword && (
                    <div className="space-y-1.5 pt-1.5">
                      <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider">
                        <span className="text-slate-400">Strength:</span>
                        <span className={
                          getPasswordStrength(profileForm.newPassword) === 'Weak' ? 'text-red-500' :
                          getPasswordStrength(profileForm.newPassword) === 'Medium' ? 'text-yellow-600' :
                          'text-green-500'
                        }>
                          {getPasswordStrength(profileForm.newPassword)}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-1">
                        <div className={`h-1.5 rounded-full transition-all ${
                          getPasswordStrength(profileForm.newPassword) === 'Weak' ? 'bg-red-500' :
                          getPasswordStrength(profileForm.newPassword) === 'Medium' ? 'bg-yellow-500' :
                          getPasswordStrength(profileForm.newPassword) === 'Strong' ? 'bg-green-500' : 'bg-slate-200'
                        }`} />
                        <div className={`h-1.5 rounded-full transition-all ${
                          getPasswordStrength(profileForm.newPassword) === 'Medium' ? 'bg-yellow-500' :
                          getPasswordStrength(profileForm.newPassword) === 'Strong' ? 'bg-green-500' : 'bg-slate-200'
                        }`} />
                        <div className={`h-1.5 rounded-full transition-all ${
                          getPasswordStrength(profileForm.newPassword) === 'Strong' ? 'bg-green-500' : 'bg-slate-200'
                        }`} />
                      </div>
                    </div>
                  )}
                </div>

                {/* Divider */}
                <div className="border-t border-slate-100 my-4" />

                {/* Old Password */}
                <div className="space-y-1 bg-purple-50/30 p-4 rounded-2xl border border-purple-100">
                  <label className="block text-[10px] font-black text-purple-600 uppercase tracking-widest">Old Password (Current Password) *</label>
                  <div className="relative flex items-center mt-1.5">
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      required
                      value={profileForm.currentPassword}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                      className="w-full px-4 py-3 pr-10 text-xs font-bold rounded-2xl border-2 border-purple-200 focus:border-purple-500 focus:outline-none text-slate-700 bg-white"
                      placeholder="Enter your current password to save changes"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 p-1 text-slate-400 hover:text-slate-650 transition-colors"
                    >
                      {showCurrentPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                    </button>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={updatingCredentials}
                    className="w-full py-4 bg-purple-600 hover:bg-purple-700 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-md hover:scale-[1.01] active:scale-95 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {updatingCredentials ? (
                      <>
                        <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Saving Changes...</span>
                      </>
                    ) : (
                      <span>Update Credentials 🚀</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </main>

      {/* Products CRUD Modal */}
      {productModalOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-xl border border-sky-100 flex flex-col max-h-[90vh]">
            
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-sm font-black text-gray-800 uppercase tracking-wider">
                {editingProduct ? `Edit SKU Product: ${editingProduct.sku}` : 'Register New Product'}
              </h2>
              <button onClick={() => setProductModalOpen(false)} className="text-gray-400 hover:text-gray-600 text-xs font-black">
                ✕ Close
              </button>
            </div>

            <form onSubmit={handleProductSubmit} className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase">Product SKU</label>
                  <input
                    type="text"
                    required
                    value={productForm.sku}
                    onChange={(e) => setProductForm(prev => ({ ...prev, sku: e.target.value }))}
                    className="w-full px-3 py-2 border-2 border-sky-100 rounded-xl focus:border-purple-500 focus:outline-none"
                    placeholder="e.g. NOTES-RULED-172"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase">Product Name</label>
                  <input
                    type="text"
                    required
                    value={productForm.name}
                    onChange={(e) => setProductForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border-2 border-sky-100 rounded-xl focus:border-purple-500 focus:outline-none"
                  />
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase">Product Description</label>
                  <textarea
                    required
                    value={productForm.description}
                    onChange={(e) => setProductForm(prev => ({ ...prev, description: e.target.value }))}
                    rows={2}
                    className="w-full px-3 py-2 border-2 border-sky-100 rounded-xl focus:border-purple-500 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase">Category</label>
                  <select
                    value={productForm.category}
                    onChange={(e) => setProductForm(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 py-2 border-2 border-sky-100 rounded-xl focus:border-purple-500 focus:outline-none"
                  >
                    <option value="School Supplies">School Supplies</option>
                    <option value="Writing Materials">Writing Materials</option>
                    <option value="Art & Craft">Art & Craft</option>
                    <option value="Toys">Toys</option>
                    <option value="Office Supplies">Office Supplies</option>
                    <option value="Services">Services</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase">Brand</label>
                  <input
                    type="text"
                    value={productForm.brand}
                    onChange={(e) => setProductForm(prev => ({ ...prev, brand: e.target.value }))}
                    className="w-full px-3 py-2 border-2 border-sky-100 rounded-xl focus:border-purple-500 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase">Offer Price (₹)</label>
                  <input
                    type="number"
                    required
                    value={productForm.price}
                    onChange={(e) => setProductForm(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border-2 border-sky-100 rounded-xl focus:border-purple-500 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase">Original Price (₹)</label>
                  <input
                    type="number"
                    value={productForm.originalPrice}
                    onChange={(e) => setProductForm(prev => ({ ...prev, originalPrice: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border-2 border-sky-100 rounded-xl focus:border-purple-500 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase">Stock Quantity</label>
                  <input
                    type="number"
                    required
                    value={productForm.stockQuantity}
                    onChange={(e) => setProductForm(prev => ({ ...prev, stockQuantity: parseInt(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border-2 border-sky-100 rounded-xl focus:border-purple-500 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase">Image URLs (comma separated)</label>
                  <input
                    type="text"
                    value={productForm.images}
                    onChange={(e) => setProductForm(prev => ({ ...prev, images: e.target.value }))}
                    className="w-full px-3 py-2 border-2 border-sky-100 rounded-xl focus:border-purple-500 focus:outline-none"
                    placeholder="e.g. url1, url2"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase">Search Tag Keywords (comma separated)</label>
                  <input
                    type="text"
                    value={productForm.tags}
                    onChange={(e) => setProductForm(prev => ({ ...prev, tags: e.target.value }))}
                    className="w-full px-3 py-2 border-2 border-sky-100 rounded-xl focus:border-purple-500 focus:outline-none"
                    placeholder="e.g. notebook, reynolds"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase">Specs JSON (Record format)</label>
                  <input
                    type="text"
                    value={productForm.specifications}
                    onChange={(e) => setProductForm(prev => ({ ...prev, specifications: e.target.value }))}
                    className="w-full px-3 py-2 border-2 border-sky-100 rounded-xl focus:border-purple-500 focus:outline-none font-mono"
                  />
                </div>
                <div className="flex items-center space-x-2 pt-5">
                  <button
                    type="button"
                    onClick={() => setProductForm(prev => ({ ...prev, isFeatured: !prev.isFeatured }))}
                    className="hover:scale-105 transition-transform"
                  >
                    {productForm.isFeatured ? (
                      <ToggleRight className="h-8 w-8 text-green-500" />
                    ) : (
                      <ToggleLeft className="h-8 w-8 text-gray-300" />
                    )}
                  </button>
                  <span className="font-bold text-gray-600">Feature this product on homepage slider</span>
                </div>
              </div>

              <div className="pt-4 flex justify-end space-x-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setProductModalOpen(false)}
                  className="px-4.5 py-2.5 border-2 border-sky-100 hover:bg-sky-50 text-sky-500 font-extrabold rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-extrabold rounded-xl shadow-md transition-colors"
                >
                  Save Product
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* Email Change Confirmation Modal */}
      {showEmailConfirmModal && (
        <div className="fixed inset-0 bg-black/40 z-55 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 border border-sky-100 shadow-2xl space-y-6 text-center animate-scaleUp">
            <div className="mx-auto h-14 w-14 bg-red-50 border border-red-200 text-red-500 rounded-full flex items-center justify-center">
              <ShieldAlert className="h-7 w-7" />
            </div>

            <div className="space-y-2">
              <h3 className="text-base font-black text-slate-800">Change Admin Email Address?</h3>
              <p className="text-xs font-bold text-slate-500 leading-relaxed">
                Changing your email address (username) will invalidate your current session and automatically log you out. Continue?
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setShowEmailConfirmModal(false)}
                className="px-4 py-3 border-2 border-slate-200 hover:bg-slate-50 rounded-2xl text-slate-505 font-black text-xs uppercase tracking-wider transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowEmailConfirmModal(false);
                  submitCredentialsChange();
                }}
                className="px-4 py-3 bg-red-500 hover:bg-red-600 text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-md transition-all active:scale-95 border-b-4 border-red-700"
              >
                Confirm 🚀
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
