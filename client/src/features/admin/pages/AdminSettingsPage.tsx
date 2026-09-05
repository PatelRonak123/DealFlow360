import React, { useState, useEffect } from 'react';
import {
  Settings,
  Building2,
  Mail,
  Phone,
  Percent,
  Clock,
  Save,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useAdminSettings, adminKeys } from '../hooks/useAdmin';
import { adminApi } from '../api/adminApi';
import { useQueryClient } from '@tanstack/react-query';

export const AdminSettingsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { data: settings, isLoading, refetch } = useAdminSettings();

  const [formData, setFormData] = useState({
    companyName: '',
    supportEmail: '',
    supportPhone: '',
    defaultCurrency: 'INR',
    defaultTaxRate: '18.00',
    quoteExpirationDays: '30',
    approvalThresholdPercent: '10.00',
    companyAddress: '',
  });

  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (settings) {
      setFormData({
        companyName: settings.companyName || '',
        supportEmail: settings.supportEmail || '',
        supportPhone: settings.supportPhone || '',
        defaultCurrency: settings.defaultCurrency || 'INR',
        defaultTaxRate: settings.defaultTaxRate || '18.00',
        quoteExpirationDays: settings.quoteExpirationDays || '30',
        approvalThresholdPercent: settings.approvalThresholdPercent || '10.00',
        companyAddress: settings.companyAddress || '',
      });
    }
  }, [settings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError(null);
    setSaveSuccess(false);

    try {
      setIsSaving(true);
      await adminApi.updateSystemSettings({
        companyName: formData.companyName.trim(),
        supportEmail: formData.supportEmail.trim(),
        supportPhone: formData.supportPhone?.trim() || null,
        defaultCurrency: formData.defaultCurrency.trim().toUpperCase(),
        defaultTaxRate: parseFloat(formData.defaultTaxRate).toFixed(2),
        quoteExpirationDays: formData.quoteExpirationDays.trim(),
        approvalThresholdPercent: parseFloat(formData.approvalThresholdPercent).toFixed(2),
        companyAddress: formData.companyAddress?.trim() || null,
      });

      await queryClient.invalidateQueries({ queryKey: adminKeys.settings() });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err: any) {
      setSaveError(err.response?.data?.error?.message || err.message || 'Failed to update system settings');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#e7ebf7] pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
              <Settings className="h-4 w-4" />
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-[#17213a]">
              System &amp; Platform Configuration
            </h1>
          </div>
          <p className="mt-1 text-sm text-[#59657d]">
            Manage platform business parameters, commercial defaults, tax rates, and corporate metadata.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
            onClick={() => refetch()}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Notifications */}
      {saveSuccess && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span className="font-semibold">Platform settings successfully updated and synchronized.</span>
        </div>
      )}

      {saveError && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
          <span>{saveError}</span>
        </div>
      )}

      {/* Settings Form */}
      {isLoading ? (
        <Card className="p-8 text-center text-xs text-gray-400">Loading system settings...</Card>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Corporate Profile Card */}
            <Card className="p-6 space-y-4">
              <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
                <Building2 className="h-4.5 w-4.5 text-[#3568ed]" />
                <h3 className="font-bold text-[#17213a] text-sm">Corporate Legal Entity</h3>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Company Legal Name</label>
                <input
                  type="text"
                  required
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  className="w-full text-xs border border-gray-200 rounded-xl px-3 py-2 bg-transparent focus:outline-none focus:border-[#3568ed]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Support &amp; Operations Email</label>
                <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-2">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <input
                    type="email"
                    required
                    value={formData.supportEmail}
                    onChange={(e) => setFormData({ ...formData, supportEmail: e.target.value })}
                    className="w-full text-xs bg-transparent focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Support Hotline Phone</label>
                <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-2">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={formData.supportPhone}
                    onChange={(e) => setFormData({ ...formData, supportPhone: e.target.value })}
                    className="w-full text-xs bg-transparent focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Corporate Headquarters Address</label>
                <textarea
                  rows={2}
                  value={formData.companyAddress}
                  onChange={(e) => setFormData({ ...formData, companyAddress: e.target.value })}
                  className="w-full text-xs border border-gray-200 rounded-xl px-3 py-2 bg-transparent focus:outline-none focus:border-[#3568ed]"
                />
              </div>
            </Card>

            {/* Commercial Parameters Card */}
            <Card className="p-6 space-y-4">
              <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
                <Percent className="h-4.5 w-4.5 text-purple-600" />
                <h3 className="font-bold text-[#17213a] text-sm">Commercial Defaults &amp; Policy</h3>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Default Base Currency</label>
                <input
                  type="text"
                  required
                  value={formData.defaultCurrency}
                  onChange={(e) => setFormData({ ...formData, defaultCurrency: e.target.value.toUpperCase() })}
                  className="w-full text-xs border border-gray-200 rounded-xl px-3 py-2 bg-transparent focus:outline-none focus:border-[#3568ed]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Default Tax / GST Rate (%)</label>
                <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-2">
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="100"
                    required
                    value={formData.defaultTaxRate}
                    onChange={(e) => setFormData({ ...formData, defaultTaxRate: e.target.value })}
                    className="w-full text-xs bg-transparent focus:outline-none"
                  />
                  <span className="text-gray-400 font-bold text-xs">%</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Quotation Expiration Validity</label>
                <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-2">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <input
                    type="number"
                    min="1"
                    max="365"
                    required
                    value={formData.quoteExpirationDays}
                    onChange={(e) => setFormData({ ...formData, quoteExpirationDays: e.target.value })}
                    className="w-full text-xs bg-transparent focus:outline-none"
                  />
                  <span className="text-gray-400 text-xs">Days</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Manager Approval Ceiling Trigger (%)
                </label>
                <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-2">
                  <ShieldCheck className="h-4 w-4 text-purple-600" />
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="100"
                    required
                    value={formData.approvalThresholdPercent}
                    onChange={(e) => setFormData({ ...formData, approvalThresholdPercent: e.target.value })}
                    className="w-full text-xs bg-transparent focus:outline-none"
                  />
                  <span className="text-gray-400 font-bold text-xs">%</span>
                </div>
              </div>
            </Card>
          </div>

          <div className="flex justify-end">
            <Button
              type="submit"
              variant="primary"
              leftIcon={<Save className="h-4 w-4" />}
              isLoading={isSaving}
            >
              Save System Settings
            </Button>
          </div>
        </form>
      )}
    </div>
  );
};
