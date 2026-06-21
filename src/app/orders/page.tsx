'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  FileText, Calendar, ShoppingBag, ShieldAlert, 
  MapPin, CreditCard, ChevronDown, ChevronUp, Download, Eye 
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';

export default function MyOrdersPage() {
  const router = useRouter();
  const { user, isAuthenticated, checkSession } = useAuthStore();
  
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('All');

  useEffect(() => {
    checkSession();
  }, []);

  // Fetch orders
  useEffect(() => {
    if (!isAuthenticated) return;

    async function fetchOrders() {
      setLoading(true);
      try {
        const url = `/api/orders?status=${statusFilter === 'All' ? '' : encodeURIComponent(statusFilter)}`;
        const res = await fetch(url);
        const data = await res.json();
        if (data.success) {
          setOrders(data.orders);
        }
      } catch (err) {
        console.error('Error fetching customer orders:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchOrders();
  }, [isAuthenticated, statusFilter]);

  const toggleExpand = (id: string) => {
    setExpandedOrderId(prev => (prev === id ? null : id));
  };

  const handleDownloadInvoice = (order: any) => {
    // Simulated invoice file download
    toast.success(`Downloading Invoice for Order #${order.id}... 📄`);
    
    const address = order.addressJson || order.address || {};
    
    // Create text file representing invoice
    const content = `
=========================================
      KRISHNA STUDENTS PRINTERS &
             STATIONERY TOYS
=========================================
Medavakkam-Mambakkam Road, Medavakkam,
Chennai - 600100. Phone: +91 89009 89005
-----------------------------------------
INVOICE REPORT
Order ID: #${order.id}
Date: ${new Date(order.date).toLocaleDateString()}
Payment Method: ${order.paymentMethod}
Payment Status: ${order.paymentStatus}
Order Status: ${order.status}
-----------------------------------------
SHIPPING ADDRESS:
Name: ${address.name || ''}
Mobile: ${address.mobile || ''}
Flat/House: ${address.flat || ''}
Street: ${address.street || ''}
City: ${address.city || ''}, ${address.pincode || ''}
-----------------------------------------
ITEMS SUMMARY:
${order.items.map((item: any) => `${item.name} x${item.quantity} - Rs. ${item.price * item.quantity}`).join('\n')}
-----------------------------------------
Subtotal: Rs. ${order.subtotal}
Delivery Fee: Rs. ${order.deliveryFee}
Total Amount: Rs. ${order.total}
=========================================
Thank you for shopping with us!
=========================================
`;

    const blob = new Blob([content], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Invoice_Krishna_${order.id}.txt`;
    link.click();
  };

  // Login Gate UI
  if (!isAuthenticated) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center space-y-6 flex flex-col items-center justify-center min-h-[60vh]">
        <div className="p-5 bg-yellow-50 border border-yellow-200 text-yellow-500 rounded-full">
          <ShieldAlert className="h-12 w-12" />
        </div>
        <h2 className="text-2xl font-black text-gray-800">Authentication Required</h2>
        <p className="text-xs text-gray-400 max-w-xs leading-relaxed leading-relaxed mx-auto font-medium">
          You must be logged in with a Google account to view your past purchases and order histories.
        </p>
        <button
          onClick={() => {
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

  const statuses = ['All', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];

  return (
    <div className="mx-auto max-w-4xl w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-end border-b border-gray-100 pb-3 gap-4">
        <h1 className="text-2xl font-black text-gray-800 flex items-center gap-1.5">
          <FileText className="h-6 w-6 text-sky-500" /> My Purchases
        </h1>

        {/* Status Filters */}
        <div className="flex flex-wrap gap-1.5">
          {statuses.map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl border text-[10px] font-black tracking-wide transition-colors ${
                statusFilter === st
                  ? 'border-sky-400 bg-sky-50 text-sky-600'
                  : 'border-gray-200 text-gray-400 hover:bg-gray-50'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 bg-gray-50 rounded-2xl border border-gray-100 animate-pulse" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border-2 border-sky-100/30 space-y-4">
          <div className="p-4 bg-sky-50 rounded-full inline-block border border-sky-100 text-sky-500">
            <ShoppingBag className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-black text-gray-800">No orders found</h3>
          <p className="text-xs text-gray-400">You don't have any orders matching the status: {statusFilter}.</p>
          <Link href="/shop" className="inline-block px-5 py-2.5 bg-sky-500 text-white font-extrabold text-xs rounded-full shadow-md">
            Go to Shop Catalog
          </Link>
        </div>
      ) : (
        /* Orders list */
        <div className="space-y-4">
          {orders.map((ord) => {
            const isExpanded = expandedOrderId === ord.id;
            const orderDate = new Date(ord.date).toLocaleDateString(undefined, {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            });
            const address = ord.addressJson || ord.address || {};

            // Status styles
            let statusColor = 'text-blue-500 bg-blue-50 border-blue-100';
            if (ord.status === 'Shipped') statusColor = 'text-yellow-600 bg-yellow-50 border-yellow-100';
            if (ord.status === 'Delivered') statusColor = 'text-green-500 bg-green-50 border-green-100';
            if (ord.status === 'Cancelled') statusColor = 'text-red-500 bg-red-50 border-red-100';

            return (
              <div
                key={ord.id}
                className="bg-white rounded-3xl border-2 border-sky-100/50 shadow-sm overflow-hidden divide-y divide-gray-100 transition-all hover:border-sky-300"
              >
                {/* Summary Row */}
                <div 
                  onClick={() => toggleExpand(ord.id)}
                  className="p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 cursor-pointer hover:bg-sky-50/10 transition-colors"
                >
                  <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs font-semibold">
                    <div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase">Order ID</p>
                      <p className="text-gray-800 font-black">#{ord.id}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase">Placed On</p>
                      <p className="text-gray-600 font-bold flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5 text-sky-400" /> {orderDate}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase">Total Bill</p>
                      <p className="text-sky-600 font-black">₹{ord.total}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                    <span className={`text-[10px] uppercase font-black px-2.5 py-1 rounded-full border ${statusColor}`}>
                      {ord.status}
                    </span>
                    {isExpanded ? <ChevronUp className="h-5 w-5 text-gray-400" /> : <ChevronDown className="h-5 w-5 text-gray-400" />}
                  </div>
                </div>

                {/* Collapsible Details */}
                {isExpanded && (
                  <div className="p-6 bg-sky-50/10 space-y-6">
                    {/* Items Grid */}
                    <div className="space-y-3">
                      <p className="text-xs font-black text-gray-700 uppercase tracking-wide">Ordered Items ({ord.items.length})</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                        {ord.items.map((item: any, idx: number) => (
                          <div key={idx} className="bg-white p-3.5 rounded-2xl border border-sky-100/50 flex items-center gap-3">
                            <img src={item.image} alt={item.name} className="w-12 h-12 object-cover rounded-xl border border-gray-100" />
                            <div className="text-xs">
                              <p className="font-bold text-gray-800 line-clamp-1">{item.name}</p>
                              <p className="text-gray-400 font-semibold mt-0.5">₹{item.price} x {item.quantity}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Shipping Address */}
                      <div className="space-y-2">
                        <p className="text-xs font-black text-gray-700 uppercase tracking-wide flex items-center gap-1">
                          <MapPin className="h-4.5 w-4.5 text-coral-500" /> Delivery Address
                        </p>
                        <div className="bg-white p-4 rounded-2xl border border-sky-100/50 text-xs font-semibold text-gray-500 space-y-1">
                          <p className="text-gray-800 font-bold">{address.name || ''}</p>
                          <p className="text-gray-400 font-bold">Mobile: {address.mobile || ''}</p>
                          <p className="text-gray-400 leading-relaxed pt-1 font-medium">
                            {address.flat || ''}, {address.street || ''}, {address.city || ''}, {address.state || ''} - {address.pincode || ''}
                          </p>
                        </div>
                      </div>

                      {/* Payment summary */}
                      <div className="space-y-2">
                        <p className="text-xs font-black text-gray-700 uppercase tracking-wide flex items-center gap-1">
                          <CreditCard className="h-4.5 w-4.5 text-sky-500" /> Payment & Summary
                        </p>
                        <div className="bg-white p-4 rounded-2xl border border-sky-100/50 text-xs font-semibold text-gray-500 space-y-1">
                          <div className="flex justify-between">
                            <span>Payment Method:</span>
                            <span className="text-gray-700 font-bold">{ord.paymentMethod}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Payment Status:</span>
                            <span className={`font-black ${ord.paymentStatus === 'Paid' ? 'text-green-500' : 'text-orange-500'}`}>
                              {ord.paymentStatus}
                            </span>
                          </div>
                          <div className="flex justify-between border-t border-gray-100 mt-2 pt-2 text-[13px] font-black text-gray-800">
                            <span>Total Billing:</span>
                            <span className="text-sky-600">₹{ord.total}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex justify-end pt-2">
                      <button
                        onClick={() => handleDownloadInvoice(ord)}
                        className="inline-flex items-center px-4 py-2.5 bg-sky-50 hover:bg-sky-100 text-sky-600 font-black text-xs rounded-xl shadow-xs border border-sky-100 transition-colors"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        <span>Download Invoice PDF</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
