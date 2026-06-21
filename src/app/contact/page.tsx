'use client';

import React, { useState, useEffect } from 'react';
import { 
  Phone, Mail, MapPin, Clock, MessageSquare, 
  Send, Sparkles, AlertCircle, CheckCircle, Share2 
} from 'lucide-react';
import toast from 'react-hot-toast';

interface FormErrors {
  name?: string;
  email?: string;
  phone?: string;
  message?: string;
}

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
  });

  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [whatsappNumber, setWhatsappNumber] = useState('8900989005');
  const [adminEmail, setAdminEmail] = useState('admin@krishna.com');
  const [storeTimings, setStoreTimings] = useState('Daily: 7:30 AM – 11:30 PM');
  const [mapEmbedUrl, setMapEmbedUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Fetch store contact details
  useEffect(() => {
    fetch('/api/settings')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.settings) {
          if (data.settings.whatsappNumber) setWhatsappNumber(data.settings.whatsappNumber);
          if (data.settings.mapEmbedUrl) setMapEmbedUrl(data.settings.mapEmbedUrl);
          if (data.settings.adminEmail) setAdminEmail(data.settings.adminEmail);
          if (data.settings.storeTimings) setStoreTimings(data.settings.storeTimings);
        }
      })
      .catch((err) => console.error('Error fetching settings for contact page:', err));
  }, []);

  const validateField = (name: string, value: string): string => {
    let error = '';
    const val = value.trim();

    if (name === 'name') {
      if (!val) error = 'Name is required';
      else if (val.length < 2 || val.length > 50) error = 'Name must be between 2 and 50 characters';
      else if (!/^[a-zA-Z\s]+$/.test(val)) error = 'Name can only contain letters and spaces';
    }

    if (name === 'email') {
      if (!val) error = 'Email is required';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) error = 'Invalid email format';
    }

    if (name === 'phone') {
      if (!val) error = 'Phone is required';
      else if (val.length !== 10 || isNaN(Number(val)) || !/^[6-9]\d{9}$/.test(val)) {
        error = 'Phone must be a valid 10-digit number starting with 6-9';
      }
    }

    if (name === 'message') {
      if (!val) error = 'Message is required';
      else if (val.length < 10) error = 'Message must be at least 10 characters long';
    }

    return error;
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const error = validateField(name, value);
    setFormErrors((prev) => ({ ...prev, [name]: error }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name as keyof FormErrors]) {
      setFormErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
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
      toast.error('Please resolve validation errors in the form.');
      return;
    }

    setSubmitting(true);

    // Simulate submission
    setTimeout(() => {
      setSubmitting(false);
      toast.success('Thank you for contacting us! We will reply shortly. 📞');
      setFormData({
        name: '',
        email: '',
        phone: '',
        message: '',
      });
    }, 1200);
  };

  return (
    <div className="mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-10 space-y-12 font-sans">
      {/* Header with badge */}
      <div className="text-center space-y-3">
        <span className="bg-coral-100 text-coral-600 rounded-full border-2 border-coral-200 text-xs font-black px-4 py-1.5 inline-flex items-center gap-1.5 tracking-wider uppercase animate-pulse">
          <span>💬</span> Talk to Us
        </span>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-800">
          We'd Love to <span className="text-coral-500 underline decoration-wavy decoration-sunny-400">Hear From You</span> 📞 ✨
        </h1>
        <p className="text-sm font-bold text-slate-500 max-w-2xl mx-auto leading-relaxed">
          Have questions about specific textbook stock, custom spiral notebook batch prints, or bulk pencil orders? Drop us a note or call us directly!
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        
        {/* Left Side: Contact Form Card */}
        <div className="bg-white p-6 sm:p-10 rounded-[2.5rem] border-4 border-dashed border-coral-200 shadow-md space-y-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-coral-100 rounded-bl-[4rem] opacity-30 pointer-events-none" />
          
          <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
            <Mail className="h-5 w-5 text-coral-500" /> Write Us a Note ✍️
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name */}
            <div className="space-y-1">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Your Full Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`w-full px-4 py-3 text-xs font-bold rounded-2xl border-2 focus:outline-none focus:ring-4 transition-all ${
                  formErrors.name 
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-100 bg-red-50/20' 
                    : 'border-slate-200 focus:border-coral-400 focus:ring-coral-100 bg-slate-50/50'
                }`}
                placeholder="e.g. Naveen Kumar"
              />
              {formErrors.name && (
                <p className="text-[10px] font-black text-red-500 flex items-center gap-1 mt-1">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  <span>{formErrors.name}</span>
                </p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-1">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Email Address</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`w-full px-4 py-3 text-xs font-bold rounded-2xl border-2 focus:outline-none focus:ring-4 transition-all ${
                  formErrors.email 
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-100 bg-red-50/20' 
                    : 'border-slate-200 focus:border-coral-400 focus:ring-coral-100 bg-slate-50/50'
                }`}
                placeholder="e.g. customer@gmail.com"
              />
              {formErrors.email && (
                <p className="text-[10px] font-black text-red-500 flex items-center gap-1 mt-1">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  <span>{formErrors.email}</span>
                </p>
              )}
            </div>

            {/* Phone */}
            <div className="space-y-1">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Phone Number (10-digits)</label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`w-full px-4 py-3 text-xs font-bold rounded-2xl border-2 focus:outline-none focus:ring-4 transition-all ${
                  formErrors.phone 
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-100 bg-red-50/20' 
                    : 'border-slate-200 focus:border-coral-400 focus:ring-coral-100 bg-slate-50/50'
                }`}
                placeholder="e.g. 9876543210"
              />
              {formErrors.phone && (
                <p className="text-[10px] font-black text-red-500 flex items-center gap-1 mt-1">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  <span>{formErrors.phone}</span>
                </p>
              )}
            </div>

            {/* Message */}
            <div className="space-y-1">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Your Inquiry / Message</label>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleChange}
                onBlur={handleBlur}
                rows={4}
                className={`w-full px-4 py-3 text-xs font-bold rounded-2xl border-2 focus:outline-none focus:ring-4 transition-all ${
                  formErrors.message 
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-100 bg-red-50/20' 
                    : 'border-slate-200 focus:border-coral-400 focus:ring-coral-100 bg-slate-50/50'
                }`}
                placeholder="Let us know what files you need printed or stationery products you'd like reserved..."
              />
              {formErrors.message && (
                <p className="text-[10px] font-black text-red-500 flex items-center gap-1 mt-1">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  <span>{formErrors.message}</span>
                </p>
              )}
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-4 bg-coral-500 hover:bg-coral-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-md hover:shadow-lg active:scale-95 transition-all flex items-center justify-center space-x-2 border-b-4 border-coral-700 disabled:opacity-60"
              >
                <Send className="h-4.5 w-4.5" />
                <span>{submitting ? 'Sending Message...' : 'Send Message'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right Side: Details, WhatsApp, Map */}
        <div className="space-y-6 flex flex-col justify-between">
          
          {/* WhatsApp Card */}
          <div className="bg-mint-50 border-4 border-dashed border-mint-300 rounded-[2.5rem] p-6 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center sm:text-left">
              <span className="bg-mint-100 text-mint-600 rounded-full border border-mint-200 text-[10px] font-black px-2.5 py-0.5 inline-block uppercase">
                ⚡ INSTANT CHAT
              </span>
              <h3 className="font-black text-lg text-slate-800">
                Need immediate help?
              </h3>
              <p className="text-xs font-bold text-slate-500">
                Chat with Naveen directly on WhatsApp for printing services or quick shop updates.
              </p>
            </div>
            <a
              href={`https://wa.me/91${whatsappNumber}?text=Hi,%20I%20want%20to%20enquire%20about%20your%20stationery%20store`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-6 py-3 bg-mint-500 hover:bg-mint-600 text-white font-black text-xs rounded-2xl shadow-md hover:scale-105 active:scale-95 transition-all space-x-2 shrink-0 border-b-4 border-mint-700"
            >
              <MessageSquare className="h-4.5 w-4.5" />
              <span>Chat on WhatsApp</span>
            </a>
          </div>

          {/* Boutique Details Card */}
          <div className="bg-sunny-50 border-4 border-dashed border-sunny-300 rounded-[2.5rem] p-8 shadow-sm space-y-5">
            <h2 className="text-base font-black text-slate-800 border-b border-sunny-200 pb-3 flex items-center gap-2">
              <span className="text-lg">🏪</span> Store Location & Timings
            </h2>

            <div className="space-y-4 text-xs font-bold text-slate-650">
              <div className="flex items-start">
                <MapPin className="h-5 w-5 text-coral-500 mr-3 shrink-0 mt-0.5" />
                <p className="leading-relaxed text-slate-700">
                  Krishna Students Printers & Stationery Toys,<br />
                  427/200B, Ground Floor, Medavakkam-Mambakkam Road,<br />
                  Near Vels Global School, Medavakkam, Chennai - 600100
                </p>
              </div>

              <div className="flex items-center">
                <Clock className="h-5 w-5 text-yellow-500 mr-3 shrink-0" />
                <p className="text-slate-750">
                  Daily Open Hours: <strong className="text-slate-900 font-extrabold bg-sunny-100 px-2 py-0.5 rounded-lg border border-sunny-200">{storeTimings}</strong>
                </p>
              </div>

              <div className="flex items-center">
                <Phone className="h-5 w-5 text-mint-500 mr-3 shrink-0" />
                <p className="text-slate-750">
                  Mobile Hotline: <strong className="text-slate-900 font-extrabold">+91 {whatsappNumber}</strong>
                </p>
              </div>

              <div className="flex items-center">
                <Mail className="h-5 w-5 text-sky-500 mr-3 shrink-0" />
                <p className="text-slate-750">
                  Email Support: <a href={`mailto:${adminEmail}`} className="text-sky-500 hover:underline">{adminEmail}</a>
                </p>
              </div>
            </div>
          </div>

          {/* Embedded Google Map */}
          <div className="flex-1 min-h-[250px] rounded-[2.5rem] overflow-hidden border-4 border-sky-300 shadow-md relative">
            {mapEmbedUrl ? (
              <iframe
                src={mapEmbedUrl}
                width="100%"
                height="100%"
                style={{ border: 0, minHeight: '250px' }}
                allowFullScreen={false}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            ) : (
              <div className="w-full h-full bg-slate-50 flex items-center justify-center text-xs font-bold text-slate-400 italic">
                🔄 Loading Boutique Location Map...
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

