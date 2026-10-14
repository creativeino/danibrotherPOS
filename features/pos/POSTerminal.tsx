'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Barcode,
  Trash2,
  Plus,
  Minus,
  CheckCircle2,
  Printer,
  PauseCircle,
  PlayCircle,
  User,
  CreditCard,
  Building,
  RotateCcw,
  Tag,
  AlertCircle,
  Laptop,
  Video,
  Cpu,
  Layers,
  Search,
  Wrench,
  X,
  ShoppingBag,
  Sparkles,
  Receipt,
  Banknote,
  LayoutGrid,
  List,
} from 'lucide-react';
import { ProductItem, CartItem, CustomerData, SalesInvoiceView } from '@/types/pos';
import { formatCurrency, calculateInvoiceTotals } from '@/lib/calculations';
import Link from 'next/link';

interface POSTerminalProps {
  initialProducts: ProductItem[];
  customers: CustomerData[];
  categories?: { id: string; name: string }[];
  defaultTaxRate: number;
  taxEnabled: boolean;
}

export function POSTerminal({
  initialProducts,
  customers,
  categories = [],
  defaultTaxRate,
  taxEnabled,
}: POSTerminalProps) {
  const [products, setProducts] = useState<ProductItem[]>(initialProducts);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'GRID' | 'LIST'>('LIST');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const customerNameInputRef = useRef<HTMLInputElement>(null);

  // Custom Service / Repair modal state
  const [customServiceModalOpen, setCustomServiceModalOpen] = useState(false);
  const [customServiceName, setCustomServiceName] = useState('');
  const [customServicePrice, setCustomServicePrice] = useState<number | string>('');
  const [customServiceNotes, setCustomServiceNotes] = useState('');

  // Checkout inputs
  const [invoiceDiscount, setInvoiceDiscount] = useState<number>(0);
  const [useTax, setUseTax] = useState<boolean>(taxEnabled);
  const [taxRate, setTaxRate] = useState<number>(defaultTaxRate);
  const [applyAdvance, setApplyAdvance] = useState<number>(0);
  const [paymentReceived, setPaymentReceived] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD' | 'BANK_TRANSFER' | 'CUSTOMER_CREDIT'>('CASH');

  // Serial number modal state
  const [serialModalOpen, setSerialModalOpen] = useState(false);
  const [activeSerialProduct, setActiveSerialProduct] = useState<ProductItem | null>(null);
  const [availableSerials, setAvailableSerials] = useState<string[]>([]);
  const [tempSelectedSerials, setTempSelectedSerials] = useState<string[]>([]);

  // Hold / Draft sales
  const [heldTickets, setHeldTickets] = useState<{
    id: string;
    name: string;
    cart: CartItem[];
    customerId: string;
    customerName: string;
    customerPhone: string;
  }[]>([]);

  // Post-checkout success
  const [completedInvoice, setCompletedInvoice] = useState<SalesInvoiceView | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const barcodeInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    barcodeInputRef.current?.focus();
  }, []);

  const selectedCustomer = customers.find(c => c.id === selectedCustomerId) || customers[0];

  const calculation = calculateInvoiceTotals({
    items: cart.map(item => ({
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      lineDiscount: item.discountAmount,
    })),
    invoiceDiscountAmount: invoiceDiscount,
    taxRatePercent: useTax ? taxRate : 0,
    customerAdvanceApplied: applyAdvance,
    paymentReceived: paymentReceived,
  });

  useEffect(() => {
    // Keep amount received in sync with net total due automatically
    setPaymentReceived(calculation.netAmountDue);
  }, [calculation.netAmountDue]);

  const barcodeBufferRef = useRef<string>('');
  const lastKeyTimeRef = useRef<number>(0);

  // Global USB Barcode Scanner Listener:
  // Most retail USB / Bluetooth barcode scanners type rapid keystrokes (< 40ms interval) followed by Enter.
  // This listener ensures that whether the user is clicking somewhere or has focus on another element,
  // scanning any barcode will immediately detect the code, add the product to cart, and clear buffer.
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in a textarea or standard text input other than barcode search
      const target = e.target as HTMLElement | null;
      const isInput = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA');

      if (e.key === 'Enter') {
        const scannedCode = barcodeBufferRef.current.trim();
        if (scannedCode.length >= 3) {
          const matched = products.find(
            p =>
              p.barcode.toLowerCase() === scannedCode.toLowerCase() ||
              p.sku.toLowerCase() === scannedCode.toLowerCase()
          );
          if (matched) {
            e.preventDefault();
            addProductToCart(matched);
            setSearchQuery('');
            barcodeBufferRef.current = '';
            barcodeInputRef.current?.focus();
            return;
          }
        }
        barcodeBufferRef.current = '';
        return;
      }

      if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
        const now = Date.now();
        // Reset buffer if delay between keystrokes is too long (> 100ms indicates slow human typing)
        if (now - lastKeyTimeRef.current > 100) {
          barcodeBufferRef.current = '';
        }
        lastKeyTimeRef.current = now;
        barcodeBufferRef.current += e.key;
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [products]);

  // USB Barcode Scanner Handler via Search input form
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const code = searchQuery.trim();
    if (!code) return;

    const matched = products.find(
      p =>
        p.barcode.toLowerCase() === code.toLowerCase() ||
        p.sku.toLowerCase() === code.toLowerCase()
    );

    if (matched) {
      addProductToCart(matched);
      setSearchQuery('');
      barcodeInputRef.current?.focus();
    } else {
      setErrorMsg(`Unknown barcode/SKU: "${code}". Register product or check barcode.`);
      setTimeout(() => setErrorMsg(''), 4000);
    }
  };

  const addProductToCart = (product: ProductItem) => {
    setErrorMsg('');

    const isServiceItem = product.isService || product.unit === 'SERVICE';

    if (!isServiceItem && product.quantityInStock <= 0) {
      setErrorMsg(`"${product.name}" is OUT OF STOCK.`);
      return;
    }

    if (product.requiresSerial) {
      fetch(`/api/products/${product.id}/serials`)
        .then(r => r.json())
        .then(data => {
          setAvailableSerials(data.serials || []);
          setActiveSerialProduct(product);
          const existing = cart.find(c => c.productId === product.id);
          setTempSelectedSerials(existing ? [...existing.selectedSerials] : []);
          setSerialModalOpen(true);
        })
        .catch(() => {
          setErrorMsg('Failed to load available serial numbers.');
        });
      return;
    }

    setCart(prev => {
      const idx = prev.findIndex(item => item.productId === product.id);
      if (idx !== -1) {
        const item = prev[idx];
        if (!isServiceItem && item.quantity + 1 > product.quantityInStock) {
          setErrorMsg(`Max available stock for "${product.name}" is ${product.quantityInStock}.`);
          return prev;
        }
        const updated = [...prev];
        updated[idx] = { ...item, quantity: item.quantity + 1 };
        return updated;
      }
      return [
        ...prev,
        {
          productId: product.id,
          name: product.name,
          sku: product.sku,
          barcode: product.barcode,
          quantity: 1,
          unitPrice: product.sellingPrice,
          costPrice: product.costPrice,
          unit: product.unit,
          requiresSerial: false,
          warrantyDurationMonths: product.warrantyDurationMonths,
          selectedSerials: [],
          discountAmount: 0,
          taxPercent: 0,
          maxStock: isServiceItem ? 999999 : product.quantityInStock,
          isService: isServiceItem,
          serviceNotes: product.description || null,
        },
      ];
    });
  };

  const handleAddCustomService = (e: React.FormEvent) => {
    e.preventDefault();
    const name = customServiceName.trim();
    const price = Number(customServicePrice);

    if (!name) {
      setErrorMsg('Service / Repair description is required.');
      return;
    }
    if (isNaN(price) || price <= 0) {
      setErrorMsg('Please enter valid service charges in Rs.');
      return;
    }

    const customId = `srv-custom-${Date.now()}`;
    const customServiceItem: CartItem = {
      productId: customId,
      name: name,
      sku: 'SRV-LABOR',
      barcode: `SRV${Date.now().toString().slice(-4)}`,
      quantity: 1,
      unitPrice: price,
      costPrice: 0,
      unit: 'SERVICE',
      requiresSerial: false,
      warrantyDurationMonths: 0,
      selectedSerials: [],
      discountAmount: 0,
      taxPercent: 0,
      maxStock: 999999,
      isService: true,
      serviceNotes: customServiceNotes.trim() || null,
    };

    setCart(prev => [...prev, customServiceItem]);
    setCustomServiceModalOpen(false);
    setCustomServiceName('');
    setCustomServicePrice('');
    setCustomServiceNotes('');
    setErrorMsg('');
  };

  const updateCartQuantity = (productId: string, delta: number) => {
    setCart(prev =>
      prev
        .map(item => {
          if (item.productId === productId) {
            const nextQty = item.quantity + delta;
            if (nextQty <= 0) return null;
            if (nextQty > item.maxStock) {
              setErrorMsg(`Only ${item.maxStock} available for "${item.name}".`);
              return item;
            }
            if (item.requiresSerial) {
              setErrorMsg('For serialized items, manage quantity by selecting serials.');
              return item;
            }
            return { ...item, quantity: nextQty };
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const removeCartItem = (productId: string) => {
    setCart(prev => prev.filter(item => item.productId !== productId));
  };

  const saveSerialAssignment = () => {
    if (!activeSerialProduct) return;
    if (tempSelectedSerials.length === 0) {
      removeCartItem(activeSerialProduct.id);
      setSerialModalOpen(false);
      return;
    }

    setCart(prev => {
      const idx = prev.findIndex(i => i.productId === activeSerialProduct.id);
      const item: CartItem = {
        productId: activeSerialProduct.id,
        name: activeSerialProduct.name,
        sku: activeSerialProduct.sku,
        barcode: activeSerialProduct.barcode,
        quantity: tempSelectedSerials.length,
        unitPrice: activeSerialProduct.sellingPrice,
        costPrice: activeSerialProduct.costPrice,
        unit: activeSerialProduct.unit,
        requiresSerial: true,
        warrantyDurationMonths: activeSerialProduct.warrantyDurationMonths,
        selectedSerials: tempSelectedSerials,
        discountAmount: 0,
        taxPercent: 0,
        maxStock: activeSerialProduct.quantityInStock,
      };

      if (idx !== -1) {
        const copy = [...prev];
        copy[idx] = item;
        return copy;
      }
      return [...prev, item];
    });

    setSerialModalOpen(false);
    setActiveSerialProduct(null);
  };

  const handleHoldTicket = () => {
    if (cart.length === 0) return;
    const ticketId = `TKT-${Date.now().toString().slice(-4)}`;
    setHeldTickets(prev => [
      ...prev,
      {
        id: ticketId,
        name: `Held (${customerName.trim() || selectedCustomer.name})`,
        cart: [...cart],
        customerId: selectedCustomerId,
        customerName: customerName,
        customerPhone: customerPhone,
      },
    ]);
    setCart([]);
    setErrorMsg('Sale ticket on hold.');
    setTimeout(() => setErrorMsg(''), 2500);
  };

  const handleCustomerChange = (customerId: string) => {
    setSelectedCustomerId(customerId);
    setApplyAdvance(0);
    if (customerId) {
      const found = customers.find(c => c.id === customerId);
      if (found) {
        setCustomerName(found.name);
        setCustomerPhone(found.phone || '');
      }
    } else {
      setCustomerName('');
      setCustomerPhone('');
    }
  };

  const handleResumeTicket = (ticketId: string) => {
    const t = heldTickets.find(h => h.id === ticketId);
    if (!t) return;
    setCart(t.cart);
    setSelectedCustomerId(t.customerId);
    setCustomerName(t.customerName || '');
    setCustomerPhone(t.customerPhone || '');
    setHeldTickets(prev => prev.filter(h => h.id !== ticketId));
  };

  const handleCompleteCheckout = async () => {
    setErrorMsg('');
    if (cart.length === 0) {
      setErrorMsg('Cart is empty. Scan items to proceed.');
      return;
    }

    const trimmedCustomerName = customerName.trim();
    if (!trimmedCustomerName) {
      setErrorMsg('Customer Name is mandatory! Please enter the customer name before completing the sale.');
      customerNameInputRef.current?.focus();
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        customerId: selectedCustomerId || null,
        customerName: trimmedCustomerName,
        customerPhone: customerPhone.trim() || undefined,
        items: cart.map(i => ({
          productId: i.productId,
          name: i.name,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          lineDiscount: i.discountAmount,
          selectedSerials: i.selectedSerials,
          isService: i.isService,
          serviceNotes: i.serviceNotes,
        })),
        invoiceDiscountAmount: invoiceDiscount,
        taxRatePercent: useTax ? taxRate : 0,
        customerAdvanceApplied: applyAdvance,
        paymentReceived: paymentReceived,
        paymentMethod: paymentMethod,
      };

      const res = await fetch('/api/pos/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!data.success) {
        setErrorMsg(data.error || 'Checkout failed');
        return;
      }

      setCompletedInvoice(data.invoice);
      setCart([]);
      setInvoiceDiscount(0);
      setApplyAdvance(0);
      setPaymentReceived(0);
      setCustomerName('');
      setCustomerPhone('');
      setSelectedCustomerId('');
    } catch {
      setErrorMsg('Network error while completing sale.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredProducts = products.filter(p => {
    if (selectedCategory !== 'ALL' && p.categoryId !== selectedCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      return (
        p.name.toLowerCase().includes(q) ||
        p.barcode.includes(q) ||
        p.sku.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-[calc(100vh-6.2rem)]">
      {/* Left Area: Product Catalog & Scanner */}
      <div className="flex-1 flex flex-col bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
        {/* Scanner & Quick Search Bar with Live Instant Auto-Add Dropdown */}
        <div className="px-4 py-3 border-b border-slate-100 bg-linear-to-r from-slate-50 via-white to-slate-50 flex items-center gap-3 shrink-0 relative">
          <div className="flex-1 relative">
            <form onSubmit={handleBarcodeSubmit}>
              <Barcode className="w-5 h-5 text-blue-600 absolute left-3.5 top-2.5 transition group-focus-within:text-blue-700 pointer-events-none" />
              <input
                ref={barcodeInputRef}
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Scan Barcode (Laser Scanner) or type name / SKU / specs... (Enter to quick-add)"
                className="w-full bg-white border border-slate-200 focus:border-blue-600 rounded-xl pl-11 pr-4 py-2 text-xs font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-3 focus:ring-blue-100/60 shadow-xs transition"
              />
            </form>

            {/* Live Instant Search Suggestions Popover */}
            {searchQuery.trim().length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden max-h-72 overflow-y-auto divide-y divide-slate-100">
                <div className="p-2 bg-slate-50/80 text-[10px] font-bold text-slate-500 uppercase tracking-wider flex justify-between">
                  <span>Found {filteredProducts.length} matching products</span>
                  <span className="text-blue-600">Click item or press Enter to add</span>
                </div>
                {filteredProducts.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-500 font-medium">
                    No product found for &ldquo;{searchQuery}&rdquo;.
                  </div>
                ) : (
                  filteredProducts.slice(0, 8).map(p => {
                    const isService = p.isService || p.unit === 'SERVICE';
                    const outOfStock = !isService && p.quantityInStock <= 0;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          if (!outOfStock) {
                            addProductToCart(p);
                            setSearchQuery('');
                            barcodeInputRef.current?.focus();
                          }
                        }}
                        disabled={outOfStock}
                        className={`w-full text-left p-2.5 flex items-center justify-between gap-3 hover:bg-blue-50/70 transition cursor-pointer ${
                          outOfStock ? 'opacity-40 bg-slate-50 cursor-not-allowed' : ''
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="font-bold text-slate-900 text-xs truncate flex items-center gap-1.5">
                            {p.name}
                            {p.requiresSerial && (
                              <span className="text-[9px] font-black bg-amber-100 text-amber-900 px-1 py-0.2 rounded border border-amber-200">
                                SN
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                            {p.sku} &bull; {p.brandName || 'Generic'} &bull; {outOfStock ? 'Out of Stock' : `${p.quantityInStock} in stock`}
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <div className="font-mono font-black text-slate-900 text-xs">
                            {formatCurrency(p.sellingPrice)}
                          </div>
                          <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md mt-0.5 inline-block">
                            + Add to Bill
                          </span>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            )}
          </div>

          {heldTickets.length > 0 && (
            <div className="flex items-center gap-1.5 shrink-0">
              {heldTickets.map(ticket => (
                <button
                  key={ticket.id}
                  onClick={() => handleResumeTicket(ticket.id)}
                  className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
                >
                  <PlayCircle className="w-3.5 h-3.5 text-amber-600" /> Resume {ticket.id}
                </button>
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={() => {
              setCustomServiceName('');
              setCustomServicePrice('');
              setCustomServiceNotes('');
              setCustomServiceModalOpen(true);
            }}
            className="px-3 py-2 bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 shadow-2xs cursor-pointer shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-600" /> + Custom Service
          </button>
        </div>

        {/* Categories Bar */}
        <div className="flex items-center gap-1.5 px-4 py-2 border-b border-slate-100 bg-slate-50/70 overflow-x-auto text-xs shrink-0 no-scrollbar">
          <button
            type="button"
            onClick={() => setSelectedCategory('ALL')}
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
              selectedCategory === 'ALL'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white text-slate-700 border border-slate-200/80 hover:bg-slate-100/70 hover:text-slate-900'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" /> All Products
          </button>

          {categories.map(cat => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition flex items-center gap-1.5 cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-slate-700 border border-slate-200/80 hover:bg-slate-100/70 hover:text-slate-900'
              }`}
            >
              {cat.id.includes('laptop') ? (
                <Laptop className="w-3.5 h-3.5 text-slate-500" />
              ) : cat.id.includes('cctv') ? (
                <Video className="w-3.5 h-3.5 text-slate-500" />
              ) : cat.id.includes('component') || cat.id.includes('part') ? (
                <Cpu className="w-3.5 h-3.5 text-slate-500" />
              ) : cat.id.includes('service') ? (
                <Wrench className="w-3.5 h-3.5 text-purple-600" />
              ) : (
                <Layers className="w-3.5 h-3.5 text-slate-500" />
              )}
              {cat.name}
            </button>
          ))}

          <button
            type="button"
            onClick={() => setSelectedCategory('cat-services')}
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition flex items-center gap-1.5 cursor-pointer ${
              selectedCategory === 'cat-services'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-white text-purple-700 border border-purple-200 hover:bg-purple-50'
            }`}
          >
            <Wrench className="w-3.5 h-3.5 text-purple-600" /> Services & Repair
          </button>

          <div className="ml-auto flex items-center gap-1 bg-white p-0.5 rounded-xl border border-slate-200 shrink-0">
            <button
              type="button"
              onClick={() => setViewMode('LIST')}
              title="Compact Retail List View"
              className={`p-1.5 rounded-lg transition cursor-pointer flex items-center gap-1 text-[11px] font-bold ${
                viewMode === 'LIST'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>List</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('GRID')}
              title="Grid Cards View"
              className={`p-1.5 rounded-lg transition cursor-pointer flex items-center gap-1 text-[11px] font-bold ${
                viewMode === 'GRID'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Grid</span>
            </button>
          </div>
        </div>

        {/* Error bar */}
        {errorMsg && (
          <div className="px-4 py-2 bg-rose-50 border-b border-rose-200 text-rose-700 text-xs flex items-center gap-2 font-semibold animate-in fade-in duration-150">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Products Display (Dual Mode: High-Density List vs Aesthetic Grid) */}
        {viewMode === 'LIST' ? (
          <div className="flex-1 overflow-y-auto bg-white">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 border-b border-slate-200 uppercase font-bold text-[10px] tracking-wider sticky top-0 z-10 backdrop-blur-xs">
                <tr>
                  <th className="py-2.5 px-3.5 whitespace-nowrap">Product / Item</th>
                  <th className="py-2.5 px-3 whitespace-nowrap">SKU / Code</th>
                  <th className="py-2.5 px-3 whitespace-nowrap">Category / Brand</th>
                  <th className="py-2.5 px-3 text-right whitespace-nowrap">Available Stock</th>
                  <th className="py-2.5 px-3 text-right whitespace-nowrap">Unit Price</th>
                  <th className="py-2.5 px-3.5 text-center whitespace-nowrap">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredProducts.map(product => {
                  const isServiceItem = product.isService || product.unit === 'SERVICE';
                  const isOutOfStock = !isServiceItem && product.quantityInStock <= 0;
                  const inCart = cart.find(c => c.productId === product.id);

                  return (
                    <tr
                      key={product.id}
                      onClick={() => !isOutOfStock && addProductToCart(product)}
                      className={`transition cursor-pointer group ${
                        isOutOfStock
                          ? 'opacity-40 bg-slate-50 cursor-not-allowed'
                          : inCart
                          ? 'bg-blue-50/40 hover:bg-blue-50/70 font-semibold'
                          : 'hover:bg-slate-50/80'
                      }`}
                    >
                      <td className="py-2.5 px-3.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 group-hover:text-blue-600 transition">
                            {product.name}
                          </span>
                          {product.requiresSerial && (
                            <span className="text-[9px] font-black bg-amber-100 text-amber-900 px-1 py-0.2 rounded border border-amber-200">
                              SN
                            </span>
                          )}
                          {isServiceItem && (
                            <span className="text-[9px] font-bold bg-purple-100 text-purple-800 px-1.5 py-0.2 rounded">
                              Service
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-500 text-[11px] whitespace-nowrap">
                        {product.sku}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap text-slate-500">
                        <span className="px-1.5 py-0.5 rounded bg-slate-100 text-[10px] font-medium text-slate-600">
                          {product.brandName || product.categoryName || 'General'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right whitespace-nowrap">
                        {isServiceItem ? (
                          <span className="text-[10px] font-bold text-purple-700">Labor</span>
                        ) : isOutOfStock ? (
                          <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">0 pcs</span>
                        ) : (
                          <span className={`font-mono font-bold text-[11px] ${
                            product.quantityInStock <= product.reorderLevel ? 'text-amber-600' : 'text-slate-700'
                          }`}>
                            {product.quantityInStock} pcs
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-black text-slate-900 whitespace-nowrap">
                        {formatCurrency(product.sellingPrice)}
                      </td>
                      <td className="py-2.5 px-3.5 text-center whitespace-nowrap">
                        {inCart ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-black bg-blue-600 text-white px-2 py-0.5 rounded-lg shadow-2xs">
                            <CheckCircle2 className="w-2.5 h-2.5" /> {inCart.quantity} in cart
                          </span>
                        ) : (
                          <button
                            type="button"
                            disabled={isOutOfStock}
                            className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-slate-100 group-hover:bg-blue-600 group-hover:text-white text-slate-700 transition"
                          >
                            + Add
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex-1 p-3.5 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 bg-slate-100/40">
            {filteredProducts.map(product => {
              const isServiceItem = product.isService || product.unit === 'SERVICE';
              const isOutOfStock = !isServiceItem && product.quantityInStock <= 0;
              const inCart = cart.find(c => c.productId === product.id);

              return (
                <div
                  key={product.id}
                  onClick={() => !isOutOfStock && addProductToCart(product)}
                  className={`group flex flex-col justify-between p-3.5 rounded-2xl border transition-all duration-200 relative select-none ${
                    isOutOfStock
                      ? 'bg-slate-50 border-slate-200/80 opacity-55 cursor-not-allowed shadow-none'
                      : isServiceItem
                      ? inCart
                        ? 'bg-purple-50/40 border-purple-500 ring-2 ring-purple-100 shadow-md shadow-purple-500/5 cursor-pointer -translate-y-0.5'
                        : 'bg-white border-purple-200/90 hover:border-purple-400 hover:shadow-md hover:shadow-purple-500/5 hover:-translate-y-0.5 cursor-pointer'
                      : inCart
                      ? 'bg-blue-50/30 border-blue-600 ring-2 ring-blue-100 shadow-md shadow-blue-600/5 cursor-pointer -translate-y-0.5'
                      : 'bg-white border-slate-200 hover:border-blue-400 hover:shadow-md hover:shadow-slate-900/5 hover:-translate-y-0.5 cursor-pointer'
                  }`}
                >
                  <div>
                    {/* Top Header: Category / Type & In Cart Counter */}
                    <div className="flex items-center justify-between gap-1">
                      <span
                        className={`text-[9.5px] font-bold px-2 py-0.5 rounded-md tracking-wide uppercase ${
                          isServiceItem
                            ? 'bg-purple-100/80 text-purple-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {isServiceItem ? 'Service' : product.brandName || product.categoryName || 'General'}
                      </span>

                      <div className="flex items-center gap-1 shrink-0">
                        {inCart && (
                          <span className="px-2 py-0.5 rounded-md text-[9.5px] font-black bg-blue-600 text-white shadow-2xs flex items-center gap-1 animate-in zoom-in-75 duration-150">
                            <CheckCircle2 className="w-2.5 h-2.5" />
                            {inCart.quantity} in cart
                          </span>
                        )}
                        {product.requiresSerial && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-amber-100 text-amber-900 border border-amber-200">
                            SN
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Product Title */}
                    <h3 className="text-xs font-bold text-slate-800 mt-2 line-clamp-2 leading-snug group-hover:text-blue-600 transition">
                      {product.name}
                    </h3>

                    {/* SKU & Barcode subtitle */}
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                      {product.sku}
                    </p>
                  </div>

                  {/* Bottom Bar: Price & Stock Badge */}
                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-sm font-black text-slate-900 font-mono tracking-tight">
                      {formatCurrency(product.sellingPrice)}
                    </span>

                    {isServiceItem ? (
                      <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-lg border border-purple-100">
                        Labor
                      </span>
                    ) : isOutOfStock ? (
                      <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-lg border border-rose-200">
                        Out of Stock
                      </span>
                    ) : (
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-lg font-mono transition ${
                          product.quantityInStock <= product.reorderLevel
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-slate-100 text-slate-600 group-hover:bg-blue-50 group-hover:text-blue-700'
                        }`}
                      >
                        {product.quantityInStock} pcs
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Right Column: Checkout Billing Panel */}
      <div className="w-full lg:w-[460px] bg-white border border-slate-200/90 rounded-2xl flex flex-col shadow-xs overflow-hidden shrink-0">
        {/* Customer Header & Details */}
        <div className="p-3 border-b border-slate-100 bg-slate-50/60 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
              <label className="text-[11px] font-black uppercase tracking-wider text-slate-800 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-blue-600" />
                Customer
              </label>
            </div>

            <div className="flex items-center gap-1.5">
              {cart.length > 0 && (
                <button
                  type="button"
                  onClick={() => setCart([])}
                  className="px-2 py-1 text-[10px] font-bold text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                >
                  Clear Cart
                </button>
              )}
              <button
                type="button"
                onClick={handleHoldTicket}
                disabled={cart.length === 0}
                className="px-2.5 py-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1 shadow-2xs transition disabled:opacity-40 cursor-pointer"
              >
                <PauseCircle className="w-3.5 h-3.5 text-amber-600" /> Hold
              </button>
            </div>
          </div>

          {/* Customer Details Input */}
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <input
                ref={customerNameInputRef}
                type="text"
                required
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
                placeholder="Customer Name * (Required)"
                className={`w-full bg-white border rounded-xl pl-3 pr-2 py-1.5 text-xs font-bold text-slate-900 placeholder:font-normal placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-100 transition shadow-2xs ${
                  !customerName.trim()
                    ? 'border-amber-400 bg-amber-50/20'
                    : 'border-slate-200 focus:border-blue-600'
                }`}
              />
            </div>

            <div className="w-36 shrink-0">
              <input
                type="text"
                value={customerPhone}
                onChange={e => setCustomerPhone(e.target.value)}
                placeholder="Phone No. (Optional)"
                className="w-full bg-white border border-slate-200 focus:border-blue-600 rounded-xl px-2.5 py-1.5 text-xs font-mono text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-100 transition shadow-2xs"
              />
            </div>
          </div>
        </div>

        {/* Cart Item Rows */}
        <div className="flex-1 p-2.5 overflow-y-auto space-y-2 bg-slate-50/20">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mb-2 text-slate-400">
                <Barcode className="w-6 h-6 stroke-[1.5]" />
              </div>
              <p className="text-xs font-bold text-slate-700">Scan or Select Items</p>
              <p className="text-[11px] text-slate-400 mt-0.5 max-w-[200px]">
                Items added from scanner or catalog will show here for instant checkout
              </p>
            </div>
          ) : (
            cart.map(item => {
              const lineTotal = item.quantity * item.unitPrice - item.discountAmount;
              return (
                <div
                  key={item.productId}
                  className="p-2.5 bg-white border border-slate-200/90 rounded-xl shadow-2xs flex flex-col gap-1 text-xs hover:border-slate-300 transition"
                >
                  <div className="flex items-start justify-between gap-1.5">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-slate-900 leading-tight truncate">{item.name}</h4>
                      <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                        {item.sku} &bull; {formatCurrency(item.unitPrice)}
                      </p>
                    </div>
                    <button
                      onClick={() => removeCartItem(item.productId)}
                      className="text-slate-400 hover:text-rose-600 p-1 transition cursor-pointer shrink-0"
                      title="Remove item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {item.requiresSerial && (
                    <div className="text-[10px] bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 text-amber-800 font-mono font-medium">
                      SN: {item.selectedSerials.join(', ') || 'No serial selected'}
                    </div>
                  )}

                  {(item.isService || item.unit === 'SERVICE') && (
                    <div className="text-[10px] bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200 text-purple-900 font-medium">
                      <div className="flex items-center gap-1 font-bold text-purple-800">
                        <Wrench className="w-3 h-3 text-purple-600" /> Service & Labor
                      </div>
                      {item.serviceNotes && (
                        <p className="text-[10px] text-purple-700 mt-0.5 italic">
                          Note: {item.serviceNotes}
                        </p>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => updateCartQuantity(item.productId, -1)}
                        className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold transition cursor-pointer"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-7 text-center font-bold text-slate-900 font-mono text-xs">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateCartQuantity(item.productId, 1)}
                        className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold transition cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    <span className="font-black text-slate-900 font-mono text-xs">
                      {formatCurrency(lineTotal)}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Settlement Breakdown */}
        <div className="p-3.5 border-t border-slate-200 bg-linear-to-b from-white to-slate-50 text-xs space-y-2 shrink-0">
          <div className="flex justify-between text-slate-600 font-medium text-[11px]">
            <span>Subtotal ({cart.reduce((a, c) => a + c.quantity, 0)} items)</span>
            <span className="text-slate-900 font-mono font-bold">{formatCurrency(calculation.subtotal)}</span>
          </div>

          <div className="flex items-center justify-between text-slate-600 font-medium text-[11px]">
            <span>Invoice Discount</span>
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-slate-400 font-mono">Rs.</span>
              <input
                type="number"
                min="0"
                value={invoiceDiscount || ''}
                onChange={e => setInvoiceDiscount(Number(e.target.value) || 0)}
                placeholder="0"
                className="w-20 bg-white border border-slate-200 rounded-lg px-2 py-0.5 text-right font-mono text-slate-900 font-bold focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-100"
              />
            </div>
          </div>

          {/* Large Net Due Display */}
          <div className="p-2.5 rounded-xl bg-blue-50/70 border border-blue-200/70 flex justify-between items-center">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-blue-700 block">Total Payable</span>
              <span className="text-[10px] text-blue-600 font-medium">Net Amount Due</span>
            </div>
            <span className="text-blue-700 font-mono text-2xl font-black tracking-tight">
              {formatCurrency(calculation.netAmountDue)}
            </span>
          </div>

          {/* Payment Method Selector */}
          <div className="grid grid-cols-4 gap-1">
            {(['CASH', 'CARD', 'BANK_TRANSFER', 'CUSTOMER_CREDIT'] as const).map(method => (
              <button
                key={method}
                type="button"
                onClick={() => setPaymentMethod(method)}
                className={`py-1.5 rounded-xl text-[10px] font-black border transition cursor-pointer ${
                  paymentMethod === method
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100/70'
                }`}
              >
                {method === 'BANK_TRANSFER' ? 'BANK' : method === 'CUSTOMER_CREDIT' ? 'CREDIT' : method}
              </button>
            ))}
          </div>

          {/* Amount Received Input & Quick Cash Buttons */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-slate-800 font-bold text-xs">
              <span className="flex items-center gap-1">
                <Banknote className="w-3.5 h-3.5 text-emerald-600" />
                Amount Received
              </span>
              <div className="flex items-center gap-1">
                <span className="text-[11px] text-slate-400 font-mono">Rs.</span>
                <input
                  type="number"
                  min="0"
                  value={paymentReceived || ''}
                  onChange={e => setPaymentReceived(Number(e.target.value) || 0)}
                  className="w-28 bg-white border border-slate-300 rounded-lg px-2 py-1 text-right font-mono text-slate-900 font-black text-sm focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>
          </div>

          {/* Change & Balance Due Alerts */}
          {calculation.changeDue > 0 && (
            <div className="flex justify-between text-amber-800 font-bold text-xs bg-amber-50 px-2.5 py-1.5 rounded-xl border border-amber-200">
              <span>Change Return:</span>
              <span className="font-mono text-sm font-black">{formatCurrency(calculation.changeDue)}</span>
            </div>
          )}
          {calculation.remainingBalance > 0 && (
            <div className="flex justify-between text-rose-700 font-bold text-xs bg-rose-50 px-2.5 py-1.5 rounded-xl border border-rose-200">
              <span>Remaining Due:</span>
              <span className="font-mono text-sm font-black">{formatCurrency(calculation.remainingBalance)}</span>
            </div>
          )}

          {/* Error notice above Checkout button */}
          {errorMsg && (
            <div className="p-2 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-1.5 font-semibold">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Complete Button */}
          <button
            onClick={handleCompleteCheckout}
            disabled={cart.length === 0 || isSubmitting}
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition disabled:opacity-40 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            {isSubmitting ? 'Finalizing Invoice...' : `Complete Sale • ${formatCurrency(calculation.netAmountDue)}`}
          </button>
        </div>
      </div>

      {/* Serial Selection Modal */}
      {serialModalOpen && activeSerialProduct && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 text-slate-900 shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Tag className="w-4 h-4 text-blue-600" /> Select Serial Numbers
            </h3>
            <p className="text-xs text-slate-500 mt-1">{activeSerialProduct.name}</p>

            <div className="mt-4 max-h-60 overflow-y-auto space-y-1.5 pr-1">
              {availableSerials.length === 0 ? (
                <p className="text-xs text-rose-600 py-4 text-center font-semibold">
                  No active serials available for this product!
                </p>
              ) : (
                availableSerials.map(sn => {
                  const isChecked = tempSelectedSerials.includes(sn);
                  return (
                    <label
                      key={sn}
                      className={`flex items-center justify-between p-2.5 rounded-lg border text-xs cursor-pointer transition ${
                        isChecked
                          ? 'bg-blue-50 border-blue-500 text-blue-900 font-semibold'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <span className="font-mono">{sn}</span>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {
                          if (isChecked) {
                            setTempSelectedSerials(prev => prev.filter(s => s !== sn));
                          } else {
                            setTempSelectedSerials(prev => [...prev, sn]);
                          }
                        }}
                        className="rounded border-slate-300 text-blue-600 focus:ring-0"
                      />
                    </label>
                  );
                })
              )}
            </div>

            <div className="mt-6 flex justify-end gap-3 pt-3 border-t border-slate-200">
              <button
                onClick={() => setSerialModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={saveSerialAssignment}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-lg transition shadow-xs"
              >
                Confirm ({tempSelectedSerials.length} Selected)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Complete Modal */}
      {completedInvoice && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 text-slate-900 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h3 className="text-base font-bold text-emerald-600 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5" /> Sale Completed Successfully!
                </h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  Invoice #: {completedInvoice.invoiceNumber}
                </p>
              </div>
              <button
                onClick={() => setCompletedInvoice(null)}
                className="text-slate-400 hover:text-slate-600 text-sm"
              >
                ✕
              </button>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 font-mono text-xs space-y-2">
              <div className="flex justify-between text-slate-600">
                <span>SUBTOTAL:</span>
                <span>{formatCurrency(completedInvoice.subtotal)}</span>
              </div>
              {completedInvoice.invoiceDiscount > 0 && (
                <div className="flex justify-between text-amber-700 font-semibold">
                  <span>INVOICE DISCOUNT:</span>
                  <span>- {formatCurrency(completedInvoice.invoiceDiscount)}</span>
                </div>
              )}
              {completedInvoice.customerAdvanceUsed > 0 && (
                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span>ADVANCE APPLIED:</span>
                  <span>- {formatCurrency(completedInvoice.customerAdvanceUsed)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-slate-900 pt-1 border-t border-slate-200">
                <span>NET AMOUNT DUE:</span>
                <span>{formatCurrency(completedInvoice.netAmountDue)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>PAYMENT RECEIVED ({completedInvoice.paymentMethod}):</span>
                <span>{formatCurrency(completedInvoice.paymentReceived)}</span>
              </div>
              <div className="flex justify-between text-rose-700 font-bold">
                <span>REMAINING BALANCE:</span>
                <span>{formatCurrency(completedInvoice.remainingBalance)}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <a
                href={`/invoices/${completedInvoice.id || completedInvoice.invoiceNumber}/print`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
              >
                <Printer className="w-4 h-4" /> Print Thermal Receipt
              </a>
              <button
                onClick={() => setCompletedInvoice(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold transition"
              >
                Done / Next Sale
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Service / Repair Modal */}
      {customServiceModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 text-slate-900 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100 shrink-0">
                  <Wrench className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Add Service / Repair Charge</h3>
                  <p className="text-xs text-slate-500">Non-inventory labor charge (no barcode needed)</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCustomServiceModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddCustomService} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Service / Task Name <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={customServiceName}
                  onChange={e => setCustomServiceName(e.target.value)}
                  placeholder="e.g. Windows 11 Installation, Laptop Servicing, Bios Repair..."
                  className="w-full bg-slate-50 border border-slate-300 focus:border-purple-600 focus:bg-white rounded-xl px-3 py-2 font-bold text-slate-900 focus:outline-hidden transition"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Labor / Service Charges (Rs.) <span className="text-rose-600">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  step="any"
                  required
                  value={customServicePrice}
                  onChange={e => setCustomServicePrice(e.target.value)}
                  placeholder="e.g. 1500"
                  className="w-full bg-slate-50 border border-slate-300 focus:border-purple-600 focus:bg-white rounded-xl px-3 py-2 font-mono font-bold text-slate-900 focus:outline-hidden transition"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Device Details / Service Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  value={customServiceNotes}
                  onChange={e => setCustomServiceNotes(e.target.value)}
                  placeholder="e.g. HP Pavilion Laptop - Format & Fresh Windows 11 + Office Setup"
                  className="w-full bg-slate-50 border border-slate-300 focus:border-purple-600 focus:bg-white rounded-xl px-3 py-2 text-slate-900 focus:outline-hidden transition"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCustomServiceModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Add Service to Sale
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
