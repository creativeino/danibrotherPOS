'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ProductItem } from '@/types/pos';
import { formatCurrency } from '@/lib/calculations';
import { Printer, Search, Sliders, Check, ChevronDown, RefreshCw, X, Tag } from 'lucide-react';
import JsBarcode from 'jsbarcode';

interface Props {
  products: ProductItem[];
}

type StickerSize = 'mini' | 'small' | 'standard';

function BarcodeSvgItem({
  value,
  height,
  width = 1.0,
  fontSize = 9,
}: {
  value: string;
  height: number;
  width?: number;
  fontSize?: number;
}) {
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (svgRef.current && value) {
      try {
        JsBarcode(svgRef.current, value, {
          format: 'CODE128',
          width,
          height,
          displayValue: true,
          fontSize,
          textMargin: 2,
          margin: 0,
          marginLeft: 4,
          marginRight: 4,
          marginTop: 2,
          marginBottom: 2,
          background: '#ffffff',
          lineColor: '#000000',
          font: 'monospace',
          fontOptions: 'bold',
        });
      } catch (err) {
        console.warn('JsBarcode rendering error:', err);
      }
    }
  }, [value, height, width, fontSize]);

  return <svg ref={svgRef} className="max-w-full block mx-auto" style={{ shapeRendering: 'crispEdges' }} />;
}

export function BarcodeLabelGrid({ products }: Props) {
  const [size, setSize] = useState<StickerSize>('small');
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [copies, setCopies] = useState<number>(1);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter products by search input
  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return products;
    const q = searchQuery.toLowerCase();
    return products.filter(
      p =>
        p.name.toLowerCase().includes(q) ||
        p.barcode.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q)
    );
  }, [products, searchQuery]);

  // Current selected product object
  const activeProduct = useMemo(() => {
    return products.find(p => p.id === selectedProductId) || null;
  }, [products, selectedProductId]);

  // Size configurations
  const sizeConfig = {
    mini: {
      label: 'Mini (30×20mm)',
      containerClass: 'w-[155px] p-2 min-h-[105px]',
      barcodeHeight: 22,
      barcodeWidth: 1.0,
      fontSize: 8,
      logoClass: 'h-4.5 max-w-[95px]',
      titleClass: 'text-[8.5px]',
      skuClass: 'text-[7.5px]',
      priceClass: 'text-[10px]',
    },
    small: {
      label: 'Small (38×25mm)',
      containerClass: 'w-[190px] p-2.5 min-h-[125px]',
      barcodeHeight: 26,
      barcodeWidth: 1.1,
      fontSize: 8.5,
      logoClass: 'h-6 max-w-[125px]',
      titleClass: 'text-[9.5px]',
      skuClass: 'text-[8px]',
      priceClass: 'text-xs',
    },
    standard: {
      label: 'Standard (50×30mm)',
      containerClass: 'w-[230px] p-3 min-h-[145px]',
      barcodeHeight: 32,
      barcodeWidth: 1.25,
      fontSize: 9.5,
      logoClass: 'h-7.5 max-w-[155px]',
      titleClass: 'text-[11px]',
      skuClass: 'text-[9px]',
      priceClass: 'text-sm',
    },
  }[size];

  // Array of labels to print
  const printableList = useMemo(() => {
    if (!activeProduct) return [];
    return Array.from({ length: Math.max(1, copies) }, () => activeProduct);
  }, [activeProduct, copies]);

  return (
    <div className="space-y-6">
      {/* Search & Selector Card (Hidden during print) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs print:hidden space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            Select Product to Generate Barcode
          </label>

          {/* Searchable Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <div
              onClick={() => setDropdownOpen(prev => !prev)}
              className="w-full bg-slate-50 border border-slate-200 hover:border-blue-400 rounded-xl px-3.5 py-2.5 text-xs flex items-center justify-between cursor-pointer transition shadow-2xs"
            >
              <div className="flex items-center gap-2.5 truncate">
                <Tag className="w-4 h-4 text-blue-600 shrink-0" />
                {activeProduct ? (
                  <div className="truncate text-left">
                    <span className="font-bold text-slate-900">{activeProduct.name}</span>
                    <span className="text-slate-400 ml-2 font-mono text-[11px]">
                      (Barcode: {activeProduct.barcode} | SKU: {activeProduct.sku})
                    </span>
                  </div>
                ) : (
                  <span className="text-slate-400 font-medium">Click to search or pick a product...</span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {activeProduct && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedProductId('');
                    }}
                    className="p-1 hover:bg-slate-200 rounded-md text-slate-400 hover:text-slate-700"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
                <ChevronDown className="w-4 h-4 text-slate-400 ml-1 shrink-0" />
              </div>
            </div>

            {/* Dropdown Menu with Search input */}
            {dropdownOpen && (
              <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden max-h-80 flex flex-col animate-in fade-in zoom-in-95 duration-100">
                <div className="p-2 border-b border-slate-100 bg-slate-50 sticky top-0 z-10">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      autoFocus
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      placeholder="Type product name, barcode or SKU..."
                      className="w-full bg-white border border-slate-200 pl-8 pr-3 py-1.5 text-xs rounded-lg text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="overflow-y-auto divide-y divide-slate-50">
                  {filteredOptions.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-400 font-medium">
                      No matching products found.
                    </div>
                  ) : (
                    filteredOptions.map(prod => {
                      const isSelected = prod.id === selectedProductId;
                      return (
                        <div
                          key={prod.id}
                          onClick={() => {
                            setSelectedProductId(prod.id);
                            setDropdownOpen(false);
                            setSearchQuery('');
                          }}
                          className={`p-2.5 px-3.5 text-xs flex items-center justify-between cursor-pointer hover:bg-blue-50/70 transition ${
                            isSelected ? 'bg-blue-50/90 font-bold text-blue-700' : 'text-slate-700'
                          }`}
                        >
                          <div className="truncate pr-2">
                            <p className="font-semibold text-slate-900 truncate">{prod.name}</p>
                            <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                              Barcode: <span className="font-bold text-slate-700">{prod.barcode}</span> • SKU: {prod.sku} • Stock: {prod.quantityInStock}
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="font-bold text-slate-900 font-mono">
                              {formatCurrency(prod.sellingPrice)}
                            </span>
                            {isSelected && <Check className="w-3.5 h-3.5 text-blue-600 ml-2 inline-block" />}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Options Toolbar: Size, Copies, Print */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
          {/* Sticker Size */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-blue-600" /> Size:
            </span>
            <div className="inline-flex rounded-xl p-1 bg-slate-100 border border-slate-200 text-xs">
              {(['mini', 'small', 'standard'] as StickerSize[]).map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSize(s)}
                  className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                    size === s
                      ? 'bg-white text-blue-600 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {s === 'mini' && 'Mini (30×20mm)'}
                  {s === 'small' && 'Small (38×25mm) ★'}
                  {s === 'standard' && 'Standard (50×30mm)'}
                </button>
              ))}
            </div>
          </div>

          {/* Number of Copies & Print Action */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
              <span>Copies:</span>
              <input
                type="number"
                min={1}
                max={100}
                value={copies}
                onChange={e => setCopies(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-16 bg-white border border-slate-200 text-slate-800 text-xs font-bold rounded-lg px-2.5 py-1 text-center outline-hidden"
              />
            </div>

            <button
              onClick={() => window.print()}
              disabled={!activeProduct}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition cursor-pointer"
            >
              <Printer className="w-4 h-4" /> Print Barcode Label ({printableList.length})
            </button>
          </div>
        </div>
      </div>

      {/* Barcode Output Preview Area */}
      {!activeProduct ? (
        <div className="p-16 text-center bg-white border border-slate-200 rounded-2xl text-slate-400 text-xs font-medium space-y-2 print:hidden">
          <Tag className="w-8 h-8 mx-auto text-slate-300 stroke-1" />
          <p className="font-semibold text-slate-600">Koi product select nahi ki gayi</p>
          <p>Upar diye gaye search box ya dropdown se product select karein, uska barcode label yahan display ho jayega aur print nikal sakenge.</p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium px-1 print:hidden">
            <span>
              Preview for: <strong className="text-slate-900">{activeProduct.name}</strong> ({copies} {copies === 1 ? 'copy' : 'copies'})
            </span>
            <span className="font-mono text-[11px] text-slate-400">
              Barcode: {activeProduct.barcode}
            </span>
          </div>

          <div className="flex flex-wrap gap-3 items-start justify-start print:gap-1.5 print:block">
            {printableList.map((p, idx) => (
              <div
                key={`${p.id}-${idx}`}
                className={`bg-white text-black rounded-lg border border-slate-300 shadow-2xs hover:border-blue-500 transition flex flex-col justify-between text-center relative print:border-black print:shadow-none print:inline-block print:m-1 print:break-inside-avoid ${sizeConfig.containerClass}`}
              >
                {/* Header: Shop Brand & Name */}
                <div className="border-b border-slate-200 pb-1 print:border-black flex flex-col items-center">
                  <img
                    src="/logodanibro.svg"
                    alt="Danibrothers"
                    className={`w-auto object-contain my-0.5 block ${sizeConfig.logoClass}`}
                  />
                  <p
                    className={`font-bold text-slate-900 leading-tight truncate px-1 mt-0.5 w-full ${sizeConfig.titleClass}`}
                    title={p.name}
                  >
                    {p.name}
                  </p>
                </div>

                {/* Barcode Graphic */}
                <div className="py-1 flex flex-col items-center justify-center overflow-hidden">
                  <BarcodeSvgItem
                    value={p.barcode}
                    height={sizeConfig.barcodeHeight}
                    width={sizeConfig.barcodeWidth}
                    fontSize={sizeConfig.fontSize}
                  />
                </div>

                {/* Footer: SKU and Retail Price */}
                <div className="flex items-center justify-between border-t border-slate-200 pt-0.5 px-0.5 font-mono print:border-black">
                  <span className={`text-slate-600 font-medium truncate max-w-[50%] text-left ${sizeConfig.skuClass}`}>
                    {p.sku}
                  </span>
                  <span className={`font-black text-slate-950 text-right ${sizeConfig.priceClass}`}>
                    {formatCurrency(p.sellingPrice)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Print Specific CSS */}
      <style jsx global>{`
        @media print {
          body {
            background: white !important;
            color: black !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          header,
          aside,
          nav,
          .print\\:hidden {
            display: none !important;
          }
          @page {
            margin: 4mm;
          }
        }
      `}</style>
    </div>
  );
}
