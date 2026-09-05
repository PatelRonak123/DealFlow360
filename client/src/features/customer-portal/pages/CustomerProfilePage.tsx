import React, { useState, useEffect } from 'react';
import { useCustomerProfile, useUpdateCustomerProfile } from '../hooks';
import { useAuth } from '@/features/auth';
import { CustomerLoadingState, CustomerErrorState } from '../components';
import { Building2, User, Mail, Phone, MapPin, ShieldCheck, Save, CheckCircle2, Key, Shield } from 'lucide-react';
import { RoleBadge } from '@/components/common/RoleBadge';
import { normalizeRole, ROLES } from '@/lib/accessControl';

export const CustomerProfilePage: React.FC = () => {
  const { user } = useAuth();
  const { data: profile, isLoading, isError, refetch } = useCustomerProfile({
    userEmail: user?.email,
    enabled: Boolean(user?.email),
  });
  const updateMutation = useUpdateCustomerProfile(user?.email);

  const [companyName, setCompanyName] = useState('');
  const [contactName, setContactName] = useState('');
  const [phone, setPhone] = useState('');
  const [taxId, setTaxId] = useState('');
  const [billingAddress, setBillingAddress] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [showSavedToast, setShowSavedToast] = useState(false);

  useEffect(() => {
    if (profile) {
      setCompanyName(profile.companyName || '');
      setContactName(profile.contactName || user?.name || '');
      setPhone(profile.phone || '');
      setTaxId(profile.taxId || '');
      setBillingAddress(profile.billingAddress || '');
      setShippingAddress(profile.shippingAddress || '');
    } else if (user) {
      setContactName(user.name || '');
    }
  }, [profile, user]);

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
        companyName,
        contactName: contactName || user?.name || '',
        email: user?.email || profile.email,
        phone,
        taxId,
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

  const activeRole = normalizeRole(user?.roles?.[0] || user?.activeRole || user?.role || ROLES.CUSTOMER);
  const permissions = user?.permissions && user.permissions.length > 0 ? user.permissions : ['customer:portal', 'quotes:view', 'orders:view', 'invoices:view', 'payments:create'];

  return (
    <div className="mx-auto max-w-4xl space-y-8 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#17213a]">Customer Organization &amp; Profile</h1>
        <p className="mt-1 text-sm text-[#647592]">
          Set up and manage your company organization details, primary contact points, and commercial addresses.
        </p>
      </div>

      {showSavedToast && (
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-bold text-emerald-800 animate-fade-in">
          <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          <span>Organization profile changes saved successfully!</span>
        </div>
      )}

      {/* 1. Company & Organization Master Card */}
      <div className="rounded-3xl border border-[#e7ebf7] bg-white p-8 shadow-[0_4px_24px_rgba(64,86,145,0.06)] space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#f0f3fa] pb-6">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#edf4ff] text-[#3568ed] shadow-inner">
              <Building2 className="h-7 w-7" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#17213a]">
                {companyName || profile.companyName || 'Company Organization'}
              </h2>
              <p className="text-xs text-[#8491aa]">Customer ID: {profile.id}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-1.5 text-xs font-bold text-amber-800">
              <ShieldCheck className="h-4 w-4 text-amber-600" />
              <span>{profile.tierName || 'Standard Tier'}</span>
            </span>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid gap-6 sm:grid-cols-2">
            {/* Company / Organization Name */}
            <div className="sm:col-span-2">
              <label className="text-xs font-bold uppercase tracking-wider text-[#17213a] block mb-2">
                Company / Organization Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Building2 className="absolute left-3.5 top-3 h-4 w-4 text-[#8491aa]" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Acme Technologies Pvt Ltd"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-4 text-xs font-semibold text-[#17213a] focus:border-[#3568ed] focus:ring-1 focus:ring-[#3568ed] focus:outline-none"
                />
              </div>
              <p className="mt-1 text-[11px] text-[#647592]">
                This company name will be used by Sales Representatives to generate quotes and link customer deals.
              </p>
            </div>

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
                  value={user?.email || profile.email || ''}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-xs text-slate-700 font-medium cursor-not-allowed"
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
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-4 text-xs text-[#17213a] focus:border-[#3568ed] focus:outline-none"
                />
              </div>
            </div>

            {/* GSTIN / Tax ID (Editable) */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-[#17213a] block mb-2">
                Statutory Tax ID / GSTIN
              </label>
              <div className="relative">
                <ShieldCheck className="absolute left-3.5 top-3 h-4 w-4 text-[#8491aa]" />
                <input
                  type="text"
                  placeholder="e.g. GSTIN07AAAAA0000A1Z5"
                  value={taxId}
                  onChange={(e) => setTaxId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-4 text-xs text-[#17213a] font-mono focus:border-[#3568ed] focus:outline-none"
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
                placeholder="Enter corporate legal billing address"
                value={billingAddress}
                onChange={(e) => setBillingAddress(e.target.value)}
                className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-4 text-xs text-[#17213a] focus:border-[#3568ed] focus:outline-none"
              />
            </div>
          </div>

          {/* Shipping Address */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-[#17213a] block mb-2">
              Logistics Delivery &amp; Shipping Address
            </label>
            <div className="relative">
              <MapPin className="absolute left-3.5 top-3 h-4 w-4 text-[#8491aa]" />
              <textarea
                rows={2}
                placeholder="Enter warehouse / delivery destination address"
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
              className="inline-flex items-center gap-2 rounded-xl bg-[#3568ed] px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-[#3568ed]/20 hover:bg-[#274fc1] transition disabled:opacity-50 cursor-pointer"
            >
              <Save className="h-4 w-4" />
              <span>{updateMutation.isPending ? 'Saving Organization...' : 'Save Organization Profile'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* 2. Account & Authorization Security Card */}
      <div className="rounded-3xl border border-[#e7ebf7] bg-white p-8 shadow-[0_4px_24px_rgba(64,86,145,0.06)] space-y-6">
        <div className="flex items-center gap-3 border-b border-[#f0f3fa] pb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-[#3568ed]">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#17213a]">Account &amp; Security Credentials</h3>
            <p className="text-xs text-[#8491aa]">Authenticated session metadata and access privileges</p>
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#17213a] block mb-1">
              Active Role Mode
            </span>
            <div className="mt-1">
              <RoleBadge role={activeRole} />
            </div>
          </div>

          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#17213a] block mb-1">
              Authenticated User ID
            </span>
            <div className="flex items-center gap-2 mt-1">
              <Key className="h-4 w-4 text-slate-400" />
              <span className="font-mono text-xs text-slate-700">{user?.id || profile.id}</span>
            </div>
          </div>
        </div>

        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#17213a] block mb-2">
            Active Permissions Matrix
          </span>
          <div className="flex flex-wrap gap-2">
            {permissions.map((perm) => (
              <span
                key={perm}
                className="rounded-lg bg-slate-100 border border-slate-200 px-2.5 py-1 text-[11px] font-mono text-slate-700"
              >
                {perm}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

