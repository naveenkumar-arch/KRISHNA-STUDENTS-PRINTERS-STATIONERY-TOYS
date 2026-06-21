'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  User as UserIcon, MapPin, Mail, Calendar, Phone, 
  Trash2, Plus, Edit3, Save, X, ShieldAlert 
} from 'lucide-react';
import { useAuthStore, UserDetails, SavedAddress } from '@/store/authStore';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, checkSession, updateUser } = useAuthStore();

  // Basic Info States
  const [name, setName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('Other');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  // Address Dialog States
  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [addrForm, setAddrForm] = useState({
    name: '',
    mobile: '',
    flat: '',
    street: '',
    landmark: '',
    city: 'Chennai',
    state: 'Tamil Nadu',
    pincode: '600100',
  });

  useEffect(() => {
    checkSession();
  }, []);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setMobileNumber(user.mobileNumber || '');
      setDob(user.dob || '');
      setGender(user.gender || 'Other');
      setBio(user.bio || '');
      setAvatarUrl(user.avatarUrl || '');
    }
  }, [user]);

  // Handle Avatar Change (Mock FileReader)
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Avatar photo must be under 2MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Submit Profile Changes
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);

    // Front-end validations
    if (name.length < 2 || name.length > 50 || !/^[a-zA-Z\s]+$/.test(name)) {
      toast.error('Name must be between 2 and 50 characters, letters only.');
      setSavingProfile(false);
      return;
    }

    if (mobileNumber && (mobileNumber.length !== 10 || isNaN(Number(mobileNumber)) || !/^[6-9]\d{9}$/.test(mobileNumber))) {
      toast.error('Mobile must be a valid 10-digit number starting with 6-9.');
      setSavingProfile(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          mobileNumber,
          dob,
          gender,
          bio,
          avatarUrl,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        updateUser(data.user);
        toast.success('Profile details saved successfully! ✨');
      } else {
        toast.error(data.message || 'Failed to update profile');
      }
    } catch (err) {
      console.error(err);
      toast.error('Network error updating profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  // Saved Addresses CRUD
  const handleOpenAddressModal = (address: SavedAddress | null = null) => {
    if (address) {
      setEditingAddressId(address.id);
      setAddrForm({
        name: address.name,
        mobile: address.mobile,
        flat: address.flat,
        street: address.street,
        landmark: address.landmark || '',
        city: address.city,
        state: address.state,
        pincode: address.pincode,
      });
    } else {
      setEditingAddressId(null);
      setAddrForm({
        name: user?.name || '',
        mobile: user?.mobileNumber || '',
        flat: '',
        street: '',
        landmark: '',
        city: 'Chennai',
        state: 'Tamil Nadu',
        pincode: '600100',
      });
    }
    setAddressModalOpen(true);
  };

  const handleAddressSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Validate
    if (addrForm.mobile.length !== 10 || isNaN(Number(addrForm.mobile))) {
      toast.error('Address mobile number must be exactly 10 digits');
      return;
    }
    if (addrForm.pincode.length !== 6 || isNaN(Number(addrForm.pincode))) {
      toast.error('Address pincode must be exactly 6 digits');
      return;
    }

    let updatedAddresses = [...user.savedAddresses];

    if (editingAddressId) {
      // Edit
      updatedAddresses = updatedAddresses.map((a) =>
        a.id === editingAddressId ? { ...a, ...addrForm } : a
      );
    } else {
      // Add
      const newAddr: SavedAddress = {
        id: `addr-${Date.now()}`,
        email: user.email,
        ...addrForm,
      };
      updatedAddresses.unshift(newAddr);
    }

    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ savedAddresses: updatedAddresses }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        updateUser(data.user);
        toast.success(editingAddressId ? 'Address updated!' : 'New address saved!');
        setAddressModalOpen(false);
      }
    } catch (err) {
      toast.error('Failed to save address details.');
    }
  };

  const handleAddressDelete = async (id: string) => {
    if (!user) return;
    const confirmDelete = window.confirm('Are you sure you want to delete this address?');
    if (!confirmDelete) return;

    const updatedAddresses = user.savedAddresses.filter((a) => a.id !== id);

    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ savedAddresses: updatedAddresses }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        updateUser(data.user);
        toast.success('Address deleted successfully.');
      }
    } catch (err) {
      toast.error('Failed to remove address.');
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
        <p className="text-xs text-gray-400 max-w-xs leading-relaxed mx-auto font-medium">
          You must be logged in with a Google account to edit profile details and configure delivery addresses.
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

  return (
    <div className="mx-auto max-w-6xl w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="border-b border-gray-100 pb-3">
        <h1 className="text-2xl font-black text-gray-800 flex items-center gap-1.5">
          <UserIcon className="h-6 w-6 text-sky-500" /> Account Management
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Basic Info Form */}
        <div className="lg:col-span-2 bg-white p-6 sm:p-8 rounded-3xl border-2 border-sky-100/50 shadow-sm">
          <h2 className="text-base font-black text-gray-800 mb-6">Profile Settings</h2>

          <form onSubmit={handleSaveProfile} className="space-y-6">
            {/* Avatar Row */}
            <div className="flex flex-col sm:flex-row items-center gap-5 pb-4 border-b border-gray-50">
              <div className="relative h-20 w-20 rounded-full border-2 border-sky-100 overflow-hidden bg-gray-50 flex items-center justify-center shrink-0">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                ) : (
                  <UserIcon className="h-10 w-10 text-sky-300" />
                )}
              </div>
              <div className="text-center sm:text-left">
                <p className="text-xs font-bold text-gray-700">Profile Photo</p>
                <p className="text-[10px] text-gray-400 font-semibold mb-2">JPG, PNG, or WEBP. Max 2MB.</p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="text-xs font-black text-sky-500 hover:text-sky-600 cursor-pointer block w-full file:mr-4 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-sky-50 file:text-sky-600 hover:file:bg-sky-100"
                />
              </div>
            </div>

            {/* Inputs Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Display Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 text-xs font-semibold rounded-xl border-2 border-sky-100 focus:outline-none focus:border-sky-400 text-gray-800"
                  placeholder="Full Name"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Mobile Number</label>
                <input
                  type="text"
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
                  className="w-full px-4 py-2.5 text-xs font-semibold rounded-xl border-2 border-sky-100 focus:outline-none focus:border-sky-400 text-gray-800"
                  placeholder="10-digit number"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Date of Birth</label>
                <input
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="w-full px-4 py-2.5 text-xs font-semibold rounded-xl border-2 border-sky-100 focus:outline-none focus:border-sky-400 text-gray-800"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Gender</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full px-4 py-2.5 text-xs font-semibold rounded-xl border-2 border-sky-100 focus:outline-none focus:border-sky-400 text-gray-800 bg-white cursor-pointer"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other / Decline to state</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">User Biography</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                className="w-full px-4 py-2.5 text-xs font-semibold rounded-xl border-2 border-sky-100 focus:outline-none focus:border-sky-400 text-gray-800"
                placeholder="Share a bit about yourself or stationery preferences..."
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={savingProfile}
                className="px-6 py-3 bg-sky-500 hover:bg-sky-600 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md flex items-center space-x-1.5"
              >
                <Save className="h-4.5 w-4.5" />
                <span>{savingProfile ? 'Saving...' : 'Save Profile Details'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Address Management */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border-2 border-sky-100/50 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b border-gray-150 pb-2.5">
              <h3 className="text-sm font-black text-gray-800 flex items-center gap-1.5">
                <MapPin className="h-4.5 w-4.5 text-sky-500" /> Saved Addresses
              </h3>
              <button
                onClick={() => handleOpenAddressModal(null)}
                className="p-1 bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-500 rounded-xl flex items-center justify-center cursor-pointer shadow-xs active:scale-95 transition-all"
                title="Add address"
              >
                <Plus className="h-4.5 w-4.5" />
              </button>
            </div>

            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
              {user?.savedAddresses && user.savedAddresses.map((addr) => (
                <div 
                  key={addr.id}
                  className="p-4 bg-sky-50/25 border border-sky-100 rounded-2xl text-xs font-semibold text-gray-500 space-y-1 relative"
                >
                  <p className="text-gray-800 font-bold pr-16 truncate">{addr.name}</p>
                  <p className="text-[10px] text-gray-400 font-bold">Mobile: {addr.mobile}</p>
                  <p className="text-[10px] leading-relaxed pt-1 text-gray-400 font-medium line-clamp-2">
                    {addr.flat}, {addr.street}, {addr.city}, {addr.state} - {addr.pincode}
                  </p>
                  
                  {/* Actions overlay absolute */}
                  <div className="absolute top-3.5 right-3 flex items-center space-x-1">
                    <button
                      onClick={() => handleOpenAddressModal(addr)}
                      className="p-1 rounded-lg hover:bg-sky-100 border border-transparent hover:border-sky-200 text-sky-500"
                      title="Edit"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleAddressDelete(addr.id)}
                      className="p-1 rounded-lg hover:bg-red-50 border border-transparent hover:border-red-200 text-red-400 hover:text-red-500"
                      title="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}

              {(!user?.savedAddresses || user.savedAddresses.length === 0) && (
                <p className="text-center py-6 text-gray-400 italic text-xs">No saved delivery addresses found.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add / Edit Address Dialog Modal */}
      {addressModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/45 backdrop-blur-xs" onClick={() => setAddressModalOpen(false)} />

          <form 
            onSubmit={handleAddressSave}
            className="relative w-full max-w-md bg-white rounded-3xl p-6 border-4 border-sky-300 shadow-2xl animate-scale-up z-10 space-y-4"
          >
            <div className="flex justify-between items-center border-b border-gray-100 pb-2">
              <h3 className="text-sm font-black text-gray-800">
                {editingAddressId ? 'Update Delivery Address' : 'Register New Address'}
              </h3>
              <button 
                type="button" 
                onClick={() => setAddressModalOpen(false)} 
                className="p-1 hover:bg-gray-100 text-gray-500 rounded-full"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider">Recipient Name</label>
                <input
                  type="text"
                  value={addrForm.name}
                  onChange={(e) => setAddrForm(p => ({ ...p, name: e.target.value }))}
                  className="w-full px-3 py-2 border-2 border-sky-100 rounded-xl focus:outline-none focus:border-sky-400"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider">Mobile Number</label>
                <input
                  type="text"
                  value={addrForm.mobile}
                  onChange={(e) => setAddrForm(p => ({ ...p, mobile: e.target.value }))}
                  className="w-full px-3 py-2 border-2 border-sky-100 rounded-xl focus:outline-none focus:border-sky-400"
                  placeholder="10-digit mobile"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider">Flat / House Number / Suite</label>
                <input
                  type="text"
                  value={addrForm.flat}
                  onChange={(e) => setAddrForm(p => ({ ...p, flat: e.target.value }))}
                  className="w-full px-3 py-2 border-2 border-sky-100 rounded-xl focus:outline-none focus:border-sky-400"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider">Street / Locality</label>
                <input
                  type="text"
                  value={addrForm.street}
                  onChange={(e) => setAddrForm(p => ({ ...p, street: e.target.value }))}
                  className="w-full px-3 py-2 border-2 border-sky-100 rounded-xl focus:outline-none focus:border-sky-400"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider">City</label>
                  <input
                    type="text"
                    value={addrForm.city}
                    onChange={(e) => setAddrForm(p => ({ ...p, city: e.target.value }))}
                    className="w-full px-3 py-2 border-2 border-sky-100 rounded-xl focus:outline-none"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider">Pincode</label>
                  <input
                    type="text"
                    value={addrForm.pincode}
                    onChange={(e) => setAddrForm(p => ({ ...p, pincode: e.target.value }))}
                    className="w-full px-3 py-2 border-2 border-sky-100 rounded-xl focus:outline-none"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2.5 pt-3">
              <button
                type="button"
                onClick={() => setAddressModalOpen(false)}
                className="flex-1 py-2.5 border border-gray-200 hover:bg-gray-50 text-gray-500 font-bold text-xs rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 bg-sky-500 hover:bg-sky-600 text-white font-extrabold text-xs rounded-xl shadow-xs"
              >
                Save Address
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
