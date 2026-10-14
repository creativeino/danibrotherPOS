'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Save, Loader2, CheckCircle, AlertTriangle } from 'lucide-react';

interface ShopSettings {
  id: string;
  shopName: string;
  logoUrl: string | null;
  address: string;
  phone: string;
  email: string;
  currencySymbol: string;
  currencyCode: string;
  timezone: string;
  invoicePrefix: string;
  purchasePrefix: string;
  receiptSize: string;
  taxEnabled: boolean;
  defaultTaxRate: number;
  allowNegativeStock: boolean;
  invoiceFooter: string;
  warrantyPolicy: string;
  returnPolicy: string;
}

interface Props {
  initialSettings: ShopSettings;
}

export function SettingsForm({ initialSettings }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const [shopName, setShopName] = useState(initialSettings.shopName || '');
  const [phone, setPhone] = useState(initialSettings.phone || '');
  const [email, setEmail] = useState(initialSettings.email || '');
  const [address, setAddress] = useState(initialSettings.address || '');
  const [invoicePrefix, setInvoicePrefix] = useState(initialSettings.invoicePrefix || 'INV-');
  const [purchasePrefix, setPurchasePrefix] = useState(initialSettings.purchasePrefix || 'PUR-');
  const [receiptSize, setReceiptSize] = useState(initialSettings.receiptSize || '80mm');
  const [taxEnabled, setTaxEnabled] = useState(Boolean(initialSettings.taxEnabled));
  const [defaultTaxRate, setDefaultTaxRate] = useState(String(initialSettings.defaultTaxRate || 0));
  const [allowNegativeStock, setAllowNegativeStock] = useState(Boolean(initialSettings.allowNegativeStock));
  const [invoiceFooter, setInvoiceFooter] = useState(initialSettings.invoiceFooter || '');
  const [warrantyPolicy, setWarrantyPolicy] = useState(initialSettings.warrantyPolicy || '');
  const [returnPolicy, setReturnPolicy] = useState(initialSettings.returnPolicy || '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shopName: shopName.trim(),
          phone: phone.trim(),
          email: email.trim(),
          address: address.trim(),
          invoicePrefix: invoicePrefix.trim(),
          purchasePrefix: purchasePrefix.trim(),
          receiptSize,
          taxEnabled,
          defaultTaxRate: Number(defaultTaxRate) || 0,
          allowNegativeStock,
          invoiceFooter: invoiceFooter.trim(),
          warrantyPolicy: warrantyPolicy.trim(),
          returnPolicy: returnPolicy.trim(),
        }),
      });

      const data = await res.json();
      if (!data.success) {
        setErrorMsg(data.error || 'Failed to update preferences');
        return;
      }

      setSuccessMsg('Shop settings updated successfully!');
      router.refresh();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch {
      setErrorMsg('Network error while saving settings.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {errorMsg && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2 font-medium">
          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2 font-medium">
          <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Brand Logo Display */}
      <div className="flex items-center gap-5 p-4 bg-slate-50 border border-slate-200 rounded-xl">
        <div className="p-2 bg-white rounded-lg border border-slate-200 shadow-2xs">
          <img
            src="/logodanibro.svg"
            alt="Danibrothers Logo"
            className="h-12 w-auto max-w-[200px] object-contain"
          />
        </div>
        <div>
          <h3 className="text-xs font-bold text-slate-900">Official Brand Logo Active</h3>
          <p className="text-[11px] text-slate-500 font-medium mt-0.5">
            Loaded from <code className="text-blue-600 font-mono font-bold">/public/logodanibro.svg</code> &bull; Appears across POS, Invoices, Stickers & Sidebars
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        <div>
          <label className="block text-slate-600 font-bold mb-1">Shop Name</label>
          <input
            type="text"
            value={shopName}
            onChange={e => setShopName(e.target.value)}
            required
            className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <div>
          <label className="block text-slate-600 font-bold mb-1">Contact Phone</label>
          <input
            type="text"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <div>
          <label className="block text-slate-600 font-bold mb-1">Email Address</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <div>
          <label className="block text-slate-600 font-bold mb-1">Currency Code & Symbol</label>
          <input
            type="text"
            value={`${initialSettings.currencyCode} (${initialSettings.currencySymbol})`}
            disabled
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-500 font-mono"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-slate-600 font-bold mb-1">Shop Address</label>
          <input
            type="text"
            value={address}
            onChange={e => setAddress(e.target.value)}
            className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <div>
          <label className="block text-slate-600 font-bold mb-1">Sales Invoice Prefix</label>
          <input
            type="text"
            value={invoicePrefix}
            onChange={e => setInvoicePrefix(e.target.value)}
            className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 font-mono focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <div>
          <label className="block text-slate-600 font-bold mb-1">Purchase Invoice Prefix</label>
          <input
            type="text"
            value={purchasePrefix}
            onChange={e => setPurchasePrefix(e.target.value)}
            className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 font-mono focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <div>
          <label className="block text-slate-600 font-bold mb-1">Thermal Receipt Width</label>
          <select
            value={receiptSize}
            onChange={e => setReceiptSize(e.target.value)}
            className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
          >
            <option value="80mm">80mm (Standard POS Thermal)</option>
            <option value="58mm">58mm (Mini Thermal)</option>
            <option value="A4">A4 Full Sheet</option>
          </select>
        </div>

        <div>
          <label className="block text-slate-600 font-bold mb-1">Default Tax Rate (%)</label>
          <input
            type="number"
            min="0"
            step="0.1"
            value={defaultTaxRate}
            onChange={e => setDefaultTaxRate(e.target.value)}
            className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <div className="md:col-span-2 flex items-center gap-6 pt-2">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={taxEnabled}
              onChange={e => setTaxEnabled(e.target.checked)}
              className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500"
            />
            <span className="font-bold text-slate-700">Enable Tax Calculation by Default</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={allowNegativeStock}
              onChange={e => setAllowNegativeStock(e.target.checked)}
              className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500"
            />
            <span className="font-bold text-slate-700">Allow Checkout with Negative Inventory</span>
          </label>
        </div>

        <div className="md:col-span-2">
          <label className="block text-slate-600 font-bold mb-1">Receipt Footer Note</label>
          <input
            type="text"
            value={invoiceFooter}
            onChange={e => setInvoiceFooter(e.target.value)}
            className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 text-xs focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-slate-600 font-bold mb-1">Default Warranty Policy Text</label>
          <textarea
            rows={2}
            value={warrantyPolicy}
            onChange={e => setWarrantyPolicy(e.target.value)}
            className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 text-xs focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-slate-600 font-bold mb-1">Customer Return Policy</label>
          <textarea
            rows={2}
            value={returnPolicy}
            onChange={e => setReturnPolicy(e.target.value)}
            className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 text-xs focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
          />
        </div>
      </div>

      <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <a
          href="/api/backup"
          download
          className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold inline-flex items-center gap-2 transition cursor-pointer"
        >
          <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Export Database Backup (JSON)
        </a>

        <button
          type="submit"
          disabled={loading}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition disabled:opacity-50 cursor-pointer"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Preferences
        </button>
      </div>
    </form>
  );
}
