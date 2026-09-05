import React, { useState, useEffect } from 'react';
import { useCustomerProfile, useUpdateCustomerProfile } from '../hooks';
import { CustomerLoadingState, CustomerErrorState } from '../components';
import { Building2, User, Mail, Phone, MapPin, ShieldCheck, Save, CheckCircle2 } from 'lucide-react';

export const CustomerProfilePage: React.FC = () => {
  const { data: profile, isLoading, isError, refetch } = useCustomerProfile();
  const updateMutation = useUpdateCustomerProfile();

  const [contactName, setContactName] = useState('');
  const [phone, setPhone] = useState('');
  const [billingAddress, setBillingAddress] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [showSavedToast, setShowSavedToast] = useState(false);

  useEffect(() => {
    if (profile) {
      setContactName(profile.contactName || '');
      setPhone(profile.phone || '');
      setBillingAddress(profile.billingAddress || '');
      setShippingAddress(profile.shippingAddress || '');
    }
  }, [profile]);

  if (isLoading) {
    return <CustomerLoadingState message="Loading your customer profile & organization master..." />;
  }

  if (isError || !profile) {
    return <CustomerErrorState onRetry={() => refetch()} />;
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(
      {
        contactName,
        phone,
        billingAddress,
        shippingAddress,
      },
      {
        onSuccess: () => {
          setShowSavedToast(true);
          setTimeout(() => setShowSavedToast(false), 3000);
        },
      }
    );
  };

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#17213a]">Customer Organization Profile</h1>
        <p className="mt-1 text-sm text-[#647592]">
          Manage company contact points, commercial billing credentials, and logistics delivery addresses.
        </p>
      </div>

      {showSavedToast && (
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-bold text-emerald-800 animate-fade-in">
          <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          <span>Profile changes saved successfully!</span>
        </div>
      )}

      {/* Organization Master Card */}
      <div className="rounded-3xl border border-[#e7ebf7] bg-white p-8 shadow-[0_4px_24px_rgba(64,86,145,0.06)] space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#f0f3fa] pb-6">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#edf4ff] text-[#3568ed] shadow-inner">
              <Building2 className="h-7 w-7" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#17213a]">{profile.companyName}</h2>
              <p className="text-xs text-[#8491aa]">Customer ID: {profile.id}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-1.5 text-xs font-bold text-amber-800">
              <ShieldCheck className="h-4 w-4 text-amber-600" />
              <span>{profile.tierName}</span>
            </span>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid gap-6 sm:grid-cols-2">
            {/* Contact Name */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-[#17213a] block mb-2">
                Primary Contact Name
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-3 h-4 w-4 text-[#8491aa]" />
                <input
                  type="text"
                  required
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-4 text-xs text-[#17213a] focus:border-[#3568ed] focus:outline-none"
                />
              </div>
            </div>

            {/* Email (Read only) */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-[#17213a] block mb-2">
                Account Email (Read-Only)
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 h-4 w-4 text-[#8491aa]" />
                <input
                  type="email"
                  disabled
                  value={profile.email}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-xs text-slate-500 cursor-not-allowed"
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-[#17213a] block mb-2">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-3 h-4 w-4 text-[#8491aa]" />
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-4 text-xs text-[#17213a] focus:border-[#3568ed] focus:outline-none"
                />
              </div>
            </div>

            {/* GSTIN / Tax ID (Read-only) */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-[#17213a] block mb-2">
                Statutory Tax ID / GSTIN
              </label>
              <div className="relative">
                <ShieldCheck className="absolute left-3.5 top-3 h-4 w-4 text-[#8491aa]" />
                <input
                  type="text"
                  disabled
                  value={profile.taxId || 'GSTIN07AAAAA0000A1Z5'}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-xs text-slate-500 font-mono cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          {/* Billing Address */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-[#17213a] block mb-2">
              Corporate Billing Address
            </label>
            <div className="relative">
              <MapPin className="absolute left-3.5 top-3 h-4 w-4 text-[#8491aa]" />
              <textarea
                rows={2}
                value={billingAddress}
                onChange={(e) => setBillingAddress(e.target.value)}
                className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-4 text-xs text-[#17213a] focus:border-[#3568ed] focus:outline-none"
              />
            </div>
          </div>

          {/* Shipping Address */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-[#17213a] block mb-2">
              Logistics Delivery & Shipping Address
            </label>
            <div className="relative">
              <MapPin className="absolute left-3.5 top-3 h-4 w-4 text-[#8491aa]" />
              <textarea
                rows={2}
                value={shippingAddress}
                onChange={(e) => setShippingAddress(e.target.value)}
                className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-4 text-xs text-[#17213a] focus:border-[#3568ed] focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end border-t border-[#f0f3fa] pt-4">
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="inline-flex items-center gap-2 rounded-xl bg-[#3568ed] px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-[#3568ed]/20 hover:bg-[#274fc1] transition disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              <span>{updateMutation.isPending ? 'Saving...' : 'Save Profile Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
