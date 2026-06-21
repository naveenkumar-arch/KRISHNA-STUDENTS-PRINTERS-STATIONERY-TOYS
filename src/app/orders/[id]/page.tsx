'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { 
  ChevronLeft, FileText, CheckCircle, Package, 
  Truck, Gift, Calendar, User, MapPin, CreditCard, 
  AlertCircle, Download, Check, RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';
import { jsPDF } from 'jspdf';

interface OrderItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

interface Order {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  addressJson: any;
  paymentMethod: string;
  paymentStatus: string;
  status: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  date: string;
}

export default function OrderDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [generatingPdf, setGeneratingPdf] = useState(false);

  const orderId = params.id as string;

  useEffect(() => {
    if (sessionStatus === 'unauthenticated') {
      router.push(`/login?callbackUrl=/orders/${orderId}`);
      return;
    }

    if (sessionStatus === 'authenticated') {
      fetchOrder();
    }
  }, [sessionStatus, orderId]);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/orders/${orderId}`);
      const data = await res.json();
      
      if (res.ok && data.success) {
        setOrder(data.order);
      } else {
        toast.error(data.message || 'Failed to retrieve order details.');
      }
    } catch (err) {
      console.error('Fetch order error:', err);
      toast.error('Network error. Failed to retrieve order details.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadInvoice = () => {
    if (!order) return;
    setGeneratingPdf(true);
    try {
      const doc = new jsPDF();
      const address = typeof order.addressJson === 'string' ? JSON.parse(order.addressJson) : order.addressJson;

      // 1. Branding Header
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(18);
      doc.setTextColor(14, 165, 233); // Sky-500
      doc.text('KRISHNA STUDENTS PRINTERS & STATIONERY TOYS', 15, 20);

      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(100, 100, 100);
      doc.text('427/200B Ground Floor, Medavakkam-Mambakkam Road, Medavakkam, Chennai, Tamil Nadu 600100', 15, 26);
      doc.text('Phone: +91 89009 89005 | Email: billing@krishnastationery.com', 15, 31);

      doc.setLineWidth(0.5);
      doc.setDrawColor(226, 232, 240); // slate-200
      doc.line(15, 36, 195, 36);

      // 2. Invoice Meta Details
      doc.setFontSize(9.5);
      doc.setFont('Helvetica', 'bold');
      doc.setTextColor(30, 41, 59); // slate-800
      doc.text(`INVOICE REF: #${order.id}`, 15, 46);
      doc.setFont('Helvetica', 'normal');
      doc.text(`Date: ${new Date(order.date).toLocaleString()}`, 15, 52);
      doc.text(`Payment Type: ${order.paymentMethod}`, 15, 58);
      doc.text(`Payment Status: ${order.paymentStatus.toUpperCase()}`, 15, 64);
      if (order.razorpayPaymentId) {
        doc.text(`Transaction Ref: ${order.razorpayPaymentId}`, 15, 70);
      }

      // 3. Shipping Target
      doc.setFont('Helvetica', 'bold');
      doc.text('SHIPPED TO:', 120, 46);
      doc.setFont('Helvetica', 'normal');
      doc.text(address.name, 120, 52);
      doc.text(`Mobile: ${address.mobile}`, 120, 58);
      doc.text(`${address.flat}, ${address.street}`, 120, 64);
      doc.text(`${address.city}, ${address.state} - ${address.pincode}`, 120, 70);

      doc.line(15, 76, 195, 76);

      // 4. Products Table Headers
      doc.setFont('Helvetica', 'bold');
      doc.text('Item Description', 15, 84);
      doc.text('Qty', 120, 84);
      doc.text('Unit Price', 145, 84);
      doc.text('Total Price', 175, 84);

      doc.line(15, 88, 195, 88);
      doc.setFont('Helvetica', 'normal');

      let y = 96;
      order.items.forEach((item: any) => {
        // Wrap text if name is long
        const itemName = item.name.length > 50 ? item.name.substring(0, 47) + '...' : item.name;
        doc.text(itemName, 15, y);
        doc.text(item.quantity.toString(), 122, y);
        doc.text(`₹${item.price.toFixed(2)}`, 145, y);
        doc.text(`₹ ${(item.price * item.quantity).toFixed(2)}`, 175, y);
        y += 8;
      });

      doc.line(15, y, 195, y);
      y += 10;

      // 5. Invoice Pricing Breakdown Summary
      doc.setFont('Helvetica', 'bold');
      doc.text('Subtotal (Inc. GST):', 120, y);
      doc.setFont('Helvetica', 'normal');
      doc.text(`₹${order.subtotal.toFixed(2)}`, 175, y);
      y += 8;

      doc.setFont('Helvetica', 'bold');
      doc.text('Delivery Charges:', 120, y);
      doc.setFont('Helvetica', 'normal');
      doc.text(`₹${order.deliveryFee.toFixed(2)}`, 175, y);
      y += 8;

      doc.setFont('Helvetica', 'bold');
      doc.setTextColor(14, 165, 233);
      doc.text('Final Payable Bill:', 120, y);
      doc.text(`₹${order.total.toFixed(2)}`, 175, y);

      // 6. Print Footer Note
      y += 20;
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text('Thank you for shopping at Krishna Students Printers & Stationery Toys!', 15, y);
      doc.text('This is an computer-generated invoice receipt. No signature is required.', 15, y + 4);

      doc.save(`Invoice_${order.id}.pdf`);
      toast.success('Invoice exported successfully! 📄');
    } catch (pdfErr) {
      console.error('Pdf render error:', pdfErr);
      toast.error('Failed to export PDF invoice.');
    } finally {
      setGeneratingPdf(false);
    }
  };

  if (loading || sessionStatus === 'loading') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] space-y-4 animate-pulse">
        <div className="h-10 w-10 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Syncing tracking sheet...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="mx-auto max-w-md py-16 text-center space-y-4">
        <AlertCircle className="h-12 w-12 text-red-400 mx-auto" />
        <h3 className="text-lg font-black text-gray-800">Order Sheet Not Found</h3>
        <p className="text-xs text-gray-400">The referenced order ID does not exist or access privileges are restricted.</p>
        <button onClick={() => router.push('/orders')} className="px-5 py-2.5 bg-sky-500 text-white font-black text-xs rounded-full shadow-md">
          Go back to Orders
        </button>
      </div>
    );
  }

  const address = typeof order.addressJson === 'string' ? JSON.parse(order.addressJson) : order.addressJson;

  // Visual tracking stages list
  const steps = [
    { label: 'Order Confirmed', icon: CheckCircle, desc: 'Your order has been received' },
    { label: 'Payment', icon: CreditCard, desc: order.paymentStatus === 'Paid' ? 'Paid / Verified' : 'Cash on Delivery (Pay at door)' },
    { label: 'Packing', icon: Package, desc: 'Items being packed for dispatch' },
    { label: 'Shipped', icon: Truck, desc: 'Out for delivery to your address' },
    { label: 'Delivered', icon: Gift, desc: 'Order delivered & payment collected' }
  ];

  // Map database status string to active step indexes
  let activeStep = 0;
  if (order.paymentStatus === 'Paid') activeStep = 1;
  if (order.status === 'Processing') activeStep = 2;
  if (order.status === 'Packed') activeStep = 2; // fits Preparing block
  if (order.status === 'Shipped') activeStep = 3;
  if (order.status === 'Delivered') activeStep = 4;

  const isCancelled = ['Cancelled', 'Refunded'].includes(order.status);

  return (
    <div className="mx-auto max-w-4xl w-full px-4 py-8 space-y-8 animate-fade-in">
      
      {/* Header breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-150 pb-4">
        <div className="flex items-center space-x-3">
          <Link href="/orders" className="p-2 rounded-full hover:bg-sky-50 text-gray-500 transition-colors">
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-xl font-black text-gray-800">Order Tracking Sheet</h1>
            <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Ref ID: #{order.id} • Placed on {new Date(order.date).toLocaleDateString()}</p>
          </div>
        </div>

        <div className="flex gap-2">
          {order.paymentStatus === 'Paid' && (
            <button
              onClick={handleDownloadInvoice}
              disabled={generatingPdf}
              className="flex items-center space-x-1.5 px-4.5 py-2.5 bg-sky-500 hover:bg-sky-600 text-white font-extrabold text-xs rounded-2xl shadow-sm hover:shadow-md transition-all active:scale-95 disabled:opacity-50"
            >
              {generatingPdf ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Printing Receipt...</span>
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  <span>Download Invoice (PDF)</span>
                </>
              )}
            </button>
          )}

          <button
            onClick={fetchOrder}
            className="p-2.5 border-2 border-sky-100 hover:bg-sky-50 text-sky-500 rounded-2xl transition-colors"
            title="Refresh Tracking Status"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {isCancelled ? (
        /* Cancelled Alert Banner */
        <div className="bg-red-50/50 border-2 border-red-100 p-5 rounded-3xl flex items-center space-x-4">
          <div className="p-3 bg-red-100 text-red-500 rounded-2xl">
            <AlertCircle className="h-6 w-6" />
          </div>
          <div>
            <h4 className="text-sm font-black text-red-800">This order has been {order.status}</h4>
            <p className="text-xs text-red-500 font-medium mt-0.5 leading-relaxed">
              If a payment was captured, the store administrator will initiate your refund within 2-3 business days. If you have questions, click WhatsApp below.
            </p>
          </div>
        </div>
      ) : (
        /* Stepper Visual Component */
        <div className="bg-white p-6 sm:p-8 rounded-3xl border-2 border-sky-100/50 shadow-sm space-y-6">
          <h3 className="text-xs font-black text-gray-400 uppercase tracking-wider">Live Delivery Stepper</h3>
          
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-6 relative">
            {steps.map((st, idx) => {
              const Icon = st.icon;
              const isPassed = idx <= activeStep;
              const isCurrent = idx === activeStep;

              return (
                <div key={idx} className="flex flex-col items-center text-center space-y-2.5 relative">
                  {/* Visual Node */}
                  <div className={`h-11 w-11 rounded-2xl flex items-center justify-center border-2 transition-all ${
                    isPassed 
                      ? 'bg-sky-500 border-sky-500 text-white shadow-md' 
                      : 'bg-white border-sky-100 text-sky-200'
                  }`}>
                    {isPassed && idx < activeStep ? (
                      <Check className="h-5 w-5 stroke-[3]" />
                    ) : (
                      <Icon className={`h-5 w-5 ${isCurrent ? 'animate-bounce' : ''}`} />
                    )}
                  </div>

                  <div>
                    <p className={`text-xs font-black leading-none ${isPassed ? 'text-gray-800' : 'text-gray-300'}`}>
                      {st.label}
                    </p>
                    <p className="text-[9px] text-gray-400 font-medium mt-1 uppercase tracking-tight">
                      {st.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Purchased items list (2 columns wide) */}
        <div className="md:col-span-2 bg-white p-6 rounded-3xl border-2 border-sky-100/50 shadow-sm space-y-4">
          <h3 className="text-xs font-black text-gray-400 uppercase tracking-wider pb-1 border-b border-gray-50 flex items-center gap-1.5">
            <Package className="h-4.5 w-4.5 text-sky-500" /> Items List
          </h3>

          <div className="divide-y divide-gray-100">
            {order.items.map((it, idx) => (
              <div key={idx} className="py-3 flex items-center justify-between gap-3 text-xs font-semibold">
                <div className="flex items-center gap-3">
                  {it.image && (
                    <img src={it.image} alt="" className="w-12 h-12 object-cover rounded-xl border border-gray-150" />
                  )}
                  <div>
                    <p className="font-black text-gray-800 line-clamp-1 max-w-[280px]">{it.name}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">₹{it.price} each</p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-gray-700 font-bold">Qty: x{it.quantity}</p>
                  <p className="text-sky-600 font-black">₹{it.price * it.quantity}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-gray-100 pt-4 space-y-2 text-xs font-semibold text-gray-500 text-right max-w-sm ml-auto">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span className="text-gray-800">₹{order.subtotal}</span>
            </div>
            <div className="flex justify-between">
              <span>Delivery Charges:</span>
              <span className="text-gray-800">₹{order.deliveryFee}</span>
            </div>
            <div className="flex justify-between border-t border-sky-100 pt-2 text-sm">
              <span className="font-black text-sky-500">Payable Bill:</span>
              <span className="font-black text-sky-600">₹{order.total}</span>
            </div>
          </div>
        </div>

        {/* Shipping details (1 column wide) */}
        <div className="space-y-6">
          
          {/* Shipping Address info */}
          <div className="bg-white p-6 rounded-3xl border-2 border-sky-100/50 shadow-sm space-y-4">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-wider pb-1 border-b border-gray-50 flex items-center gap-1.5">
              <MapPin className="h-4.5 w-4.5 text-sky-500" /> Delivery Address
            </h3>

            <div className="text-xs space-y-1.5 font-semibold text-gray-500 leading-normal">
              <div className="flex items-center space-x-1.5 text-gray-800">
                <User className="h-4 w-4 text-sky-400" />
                <span className="font-black">{address.name}</span>
              </div>
              <p className="pl-5">Mobile: {address.mobile}</p>
              <p className="pl-5 text-gray-400">{address.flat}, {address.street}</p>
              <p className="pl-5 text-gray-400">{address.city}, {address.state} - {address.pincode}</p>
            </div>
          </div>

          {/* Payment Status summary */}
          <div className="bg-white p-6 rounded-3xl border-2 border-sky-100/50 shadow-sm space-y-4">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-wider pb-1 border-b border-gray-50 flex items-center gap-1.5">
              <CreditCard className="h-4.5 w-4.5 text-sky-500" /> Payment Summary
            </h3>

            <div className="text-xs space-y-2.5 font-semibold text-gray-500">
              <div className="flex justify-between">
                <span>Method:</span>
                <span className="text-gray-800 font-bold uppercase">{order.paymentMethod}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Payment:</span>
                <span className={`px-2 py-0.5 rounded-full border text-[9px] uppercase font-black ${
                  order.paymentStatus === 'Paid' 
                    ? 'text-green-500 bg-green-50 border-green-150' 
                    : 'text-orange-500 bg-orange-50 border-orange-150'
                }`}>
                  {order.paymentStatus}
                </span>
              </div>
              {order.razorpayPaymentId && (
                <div className="border-t border-gray-50 pt-2 text-[10px] text-gray-400 leading-tight space-y-0.5">
                  <p>Transaction ID:</p>
                  <p className="font-black text-gray-700 select-all">{order.razorpayPaymentId}</p>
                </div>
              )}
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
