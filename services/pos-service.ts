import { dbStore } from '@/lib/db';
import { ensureDatabaseSeeded } from '@/lib/init';
import { ProductItem, CartItem, CustomerData, SalesInvoiceView } from '@/types/pos';
import { calculateInvoiceTotals, roundToCents } from '@/lib/calculations';

// Initialize data if fresh
ensureDatabaseSeeded();

export class POSService {
  // POS & Sales Business Engine
  /**
   * Search products by barcode, SKU, name, brand, or model number
   */
  static searchProducts(query: string): ProductItem[] {
    const q = query.trim().toLowerCase();
    const state = dbStore.getState();
    if (!q) return state.products.filter(p => p.active);

    return state.products.filter(p => {
      if (!p.active) return false;
      const matchName = p.name.toLowerCase().includes(q);
      const matchBarcode = p.barcode.toLowerCase() === q || p.barcode.includes(q);
      const matchSku = p.sku.toLowerCase().includes(q);
      const matchModel = p.modelNumber?.toLowerCase().includes(q) || false;
      return matchName || matchBarcode || matchSku || matchModel;
    });
  }

  /**
   * Lookup product specifically by scanned barcode
   */
  static getProductByBarcode(barcode: string): ProductItem | null {
    const b = barcode.trim();
    const state = dbStore.getState();
    return state.products.find(p => p.active && p.barcode === b) || null;
  }

  /**
   * Lookup available serial numbers for a given product
   */
  static getAvailableSerials(productId: string): string[] {
    const state = dbStore.getState();
    return state.serials
      .filter(s => s.productId === productId && s.status === 'AVAILABLE')
      .map(s => s.serialNumber);
  }

  /**
   * Atomically process POS Checkout & Create Sales Invoice
   */
  static processCheckout(input: {
    cashierId: string;
    customerId?: string | null;
    customerName?: string;
    customerPhone?: string | null;
    items: Array<{
      productId: string;
      name?: string;
      quantity: number;
      unitPrice: number;
      lineDiscount?: number;
      selectedSerials?: string[];
      isService?: boolean;
      serviceNotes?: string | null;
    }>;
    invoiceDiscountAmount?: number;
    taxRatePercent?: number;
    customerAdvanceApplied?: number;
    paymentReceived?: number;
    paymentMethod?: 'CASH' | 'CARD' | 'BANK_TRANSFER' | 'CUSTOMER_CREDIT' | 'ADVANCE_DEPOSIT';
    notes?: string | null;
  }): { success: boolean; invoice?: SalesInvoiceView; error?: string } {
    const state = dbStore.getState();
    const nowIso = new Date().toISOString();

    // 1. Validate Items & Stock
    if (!input.items || input.items.length === 0) {
      return { success: false, error: 'Cart cannot be empty' };
    }

    const cashier = state.users.find(u => u.id === input.cashierId) || state.users[0];
    if (!cashier) {
      return { success: false, error: 'No user registered in system' };
    }

    const customer = input.customerId ? state.customers.find(c => c.id === input.customerId) : null;

    // Validate mandatory customer name
    const resolvedCustomerName = (input.customerName || (customer ? customer.name : '')).trim();
    if (!resolvedCustomerName) {
      return {
        success: false,
        error: 'Customer name is mandatory. Please specify the customer name.',
      };
    }

    // Verify stock availability and serial numbers
    for (const item of input.items) {
      let product = state.products.find(p => p.id === item.productId);

      // Register custom repair / dynamic service if created on-the-fly
      if (!product && (item.isService || item.productId.startsWith('srv-custom-'))) {
        product = {
          id: item.productId,
          name: item.name || 'Custom IT Service / Repair',
          sku: `SRV-${Date.now().toString().slice(-6)}`,
          barcode: `SRV${Date.now().toString().slice(-6)}`,
          brandId: null,
          brandName: 'In-House Service',
          categoryId: 'cat-services',
          categoryName: 'IT Services & Repairs',
          modelNumber: null,
          description: item.serviceNotes || 'Custom computer/laptop repair or software labor',
          unit: 'SERVICE',
          costPrice: 0,
          sellingPrice: item.unitPrice,
          wholesalePrice: null,
          minSellingPrice: null,
          quantityInStock: 0,
          reorderLevel: 0,
          requiresSerial: false,
          warrantyDurationMonths: 0,
          taxRatePercent: 0,
          active: true,
          isService: true,
          createdAt: nowIso,
          updatedAt: nowIso,
        };
        state.products.push(product);
      }

      if (!product || !product.active) {
        return { success: false, error: `Product not found or inactive: ${item.productId}` };
      }

      // Services require no physical inventory check and no serial numbers!
      if (product.isService || product.unit === 'SERVICE' || item.isService) {
        continue;
      }

      if (!state.settings.allowNegativeStock && product.quantityInStock < item.quantity) {
        return {
          success: false,
          error: `Insufficient stock for "${product.name}". Available: ${product.quantityInStock}, requested: ${item.quantity}`,
        };
      }

      if (product.requiresSerial) {
        const serials = item.selectedSerials || [];
        if (serials.length !== item.quantity) {
          return {
            success: false,
            error: `Product "${product.name}" requires exactly ${item.quantity} serial number(s). Provided: ${serials.length}`,
          };
        }

        // Validate serials are AVAILABLE
        for (const sn of serials) {
          const serialRecord = state.serials.find(
            s => s.productId === product.id && s.serialNumber === sn && s.status === 'AVAILABLE'
          );
          if (!serialRecord) {
            return {
              success: false,
              error: `Serial number "${sn}" for "${product.name}" is not available or already sold.`,
            };
          }
        }
      }
    }

    // 2. Compute Invoice Totals Server-Side
    const totals = calculateInvoiceTotals({
      items: input.items.map(i => ({
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        lineDiscount: i.lineDiscount,
      })),
      invoiceDiscountAmount: input.invoiceDiscountAmount,
      taxRatePercent: input.taxRatePercent ?? (state.settings.taxEnabled ? state.settings.defaultTaxRate : 0),
      customerAdvanceApplied: input.customerAdvanceApplied,
      paymentReceived: input.paymentReceived,
    });

    // Verify customer advance is actually available on customer balance
    if (totals.customerAdvanceApplied > 0) {
      if (!customer) {
        return { success: false, error: 'Cannot apply customer advance for a walk-in customer' };
      }
      if (customer.depositBalance < totals.customerAdvanceApplied) {
        return {
          success: false,
          error: `Customer advance requested (Rs. ${totals.customerAdvanceApplied}) exceeds available deposit balance (Rs. ${customer.depositBalance})`,
        };
      }
    }

    // Generate atomic sequential invoice number
    const invoiceCount = state.sales.length + 1;
    const invoiceNumber = `${state.settings.invoicePrefix}${String(invoiceCount).padStart(5, '0')}`;
    const invoiceId = `inv-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const createdItems: any[] = [];

    // 3. Deduct Stock & Register Inventory Movements
    for (const item of input.items) {
      const product = state.products.find(p => p.id === item.productId)!;
      const lineGross = roundToCents(item.quantity * item.unitPrice);
      const lineTotal = roundToCents(lineGross - (item.lineDiscount || 0));

      // Services / Repairs: No physical stock deduction or inventory movement
      if (product.isService || product.unit === 'SERVICE' || item.isService) {
        const saleItem = {
          id: `sitem-${Date.now()}-${Math.random()}`,
          salesInvoiceId: invoiceId,
          productId: product.id,
          productName: item.name || product.name,
          sku: product.sku,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          unitCost: product.costPrice || 0,
          lineDiscount: item.lineDiscount || 0,
          lineTotal,
          serialNumbers: item.selectedSerials?.length ? item.selectedSerials.join(', ') : null,
          serviceNotes: item.serviceNotes || null,
          returnedQuantity: 0,
          createdAt: nowIso,
        };

        state.saleItems.push(saleItem);
        createdItems.push(saleItem);
        continue;
      }

      const prevStock = product.quantityInStock;
      product.quantityInStock -= item.quantity;
      product.updatedAt = nowIso;

      // Mark Serials as SOLD
      if (product.requiresSerial && item.selectedSerials) {
        for (const sn of item.selectedSerials) {
          const sRecord = state.serials.find(s => s.productId === product.id && s.serialNumber === sn);
          if (sRecord) {
            sRecord.status = 'SOLD';
            sRecord.salesInvoiceId = invoiceId;
            sRecord.sellingPrice = item.unitPrice;
            sRecord.warrantyStartDate = nowIso;
            if (product.warrantyDurationMonths > 0) {
              const exp = new Date();
              exp.setMonth(exp.getMonth() + product.warrantyDurationMonths);
              sRecord.warrantyEndDate = exp.toISOString();
            }
          }
        }
      }

      // Record Inventory Movement
      state.movements.push({
        id: `mov-${Date.now()}-${Math.random()}`,
        productId: product.id,
        movementType: 'SALE_DEDUCTION',
        quantityChange: -item.quantity,
        previousStock: prevStock,
        newStock: product.quantityInStock,
        unitCost: product.costPrice,
        referenceType: 'SALE',
        referenceId: invoiceNumber,
        reason: `Sold on invoice ${invoiceNumber}`,
        performedById: cashier.id,
        createdAt: nowIso,
      });

      const saleItem = {
        id: `sitem-${Date.now()}-${Math.random()}`,
        salesInvoiceId: invoiceId,
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        unitCost: product.costPrice,
        lineDiscount: item.lineDiscount || 0,
        lineTotal,
        serialNumbers: item.selectedSerials ? item.selectedSerials.join(', ') : null,
        serviceNotes: item.serviceNotes || null,
        returnedQuantity: 0,
        createdAt: nowIso,
      };

      state.saleItems.push(saleItem);
      createdItems.push(saleItem);
    }

    // 4. Update Customer Ledger & Advance Balances
    if (customer) {
      // Deduct advance deposit if applied
      if (totals.customerAdvanceApplied > 0) {
        customer.depositBalance = roundToCents(customer.depositBalance - totals.customerAdvanceApplied);
      }

      // Add remaining unpaid balance to customer's outstanding balance
      if (totals.remainingBalance > 0) {
        customer.outstandingBalance = roundToCents(customer.outstandingBalance + totals.remainingBalance);
      }

      // Record Ledger Entry
      state.customerLedger.push({
        id: `cld-${Date.now()}`,
        customerId: customer.id,
        entryDate: nowIso,
        reference: invoiceNumber,
        description: `Sale Invoice ${invoiceNumber}`,
        debit: totals.grandTotal,
        credit: totals.paymentReceived + totals.customerAdvanceApplied,
        balanceAfter: customer.outstandingBalance,
        createdAt: nowIso,
      });
    }

    // 5. Update Cash Register Drawer if Cash Payment
    const activeRegister = state.registerSessions.find(r => r.status === 'OPEN');
    if (activeRegister && input.paymentMethod === 'CASH' && totals.paymentReceived > 0) {
      activeRegister.cashSalesTotal = roundToCents(activeRegister.cashSalesTotal + totals.paymentReceived);
      activeRegister.expectedClosingCash = roundToCents(
        activeRegister.openingFloat +
        activeRegister.cashSalesTotal +
        activeRegister.cashDepositsTotal -
        activeRegister.cashExpensesTotal -
        activeRegister.cashRefundsTotal
      );
    }

    // 6. Create Sales Invoice Record
    const combinedNotes = [
      input.notes?.trim(),
      input.customerPhone?.trim() ? `Phone: ${input.customerPhone.trim()}` : null,
    ].filter(Boolean).join(' | ') || null;

    const salesInvoice = {
      id: invoiceId,
      invoiceNumber,
      customerId: customer ? customer.id : null,
      customerName: resolvedCustomerName,
      cashierId: cashier.id,
      cashierName: cashier.fullName,
      registerSessionId: activeRegister ? activeRegister.id : null,
      invoiceDate: nowIso,
      subtotal: totals.subtotal,
      itemDiscountTotal: totals.itemDiscountTotal,
      invoiceDiscount: totals.invoiceDiscount,
      taxAmount: totals.taxAmount,
      grandTotal: totals.grandTotal,
      customerAdvanceUsed: totals.customerAdvanceApplied,
      netAmountDue: totals.netAmountDue,
      paymentReceived: totals.paymentReceived,
      remainingBalance: totals.remainingBalance,
      paymentMethod: input.paymentMethod || 'CASH',
      paymentStatus: totals.paymentStatus,
      notes: combinedNotes,
      isVoided: false,
      items: createdItems,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    state.sales.push(salesInvoice);

    // Audit Log
    state.auditLogs.push({
      id: `aud-${Date.now()}`,
      userId: cashier.id,
      action: 'SALE_COMPLETED',
      entityType: 'SalesInvoice',
      entityId: invoiceId,
      details: JSON.stringify({ invoiceNumber, grandTotal: totals.grandTotal, itemsCount: input.items.length }),
      createdAt: nowIso,
    });

    dbStore.save(state);

    return {
      success: true,
      invoice: salesInvoice as SalesInvoiceView,
    };
  }

  /**
   * Get historical invoice by ID or Invoice Number for printing/reprinting
   */
  static getInvoice(idOrNumber: string): SalesInvoiceView | null {
    const state = dbStore.getState();
    if (!state.sales || state.sales.length === 0) return null;

    if (!idOrNumber) {
      // Fallback to latest invoice
      const latest = state.sales[state.sales.length - 1];
      return latest ? this.getInvoice(latest.id) : null;
    }

    const raw = String(idOrNumber).trim();
    let decoded = raw;
    try {
      decoded = decodeURIComponent(raw).trim();
    } catch {
      // fallback to raw
    }

    const lower = decoded.toLowerCase();

    // Support keywords
    if (lower === 'latest' || lower === 'last' || lower === 'print') {
      const latest = state.sales[state.sales.length - 1];
      if (latest && latest.id !== decoded) {
        return this.getInvoice(latest.id);
      }
    }

    const cleanNum = decoded.replace(/^#/, '').trim();
    const cleanLower = cleanNum.toLowerCase();

    // 1. Direct match on id or invoiceNumber
    let inv = state.sales.find(s => s.id === decoded || s.invoiceNumber === decoded);

    // 2. Case-insensitive match on id or invoiceNumber
    if (!inv) {
      inv = state.sales.find(
        s => (s.id && s.id.toLowerCase() === cleanLower) ||
             (s.invoiceNumber && s.invoiceNumber.toLowerCase() === cleanLower)
      );
    }

    // 3. Match pure numbers e.g. "1" or "00001" to "INV-00001"
    if (!inv && /^\d+$/.test(cleanNum)) {
      const targetInt = parseInt(cleanNum, 10);
      inv = state.sales.find(s => {
        const m = s.invoiceNumber?.match(/(\d+)$/);
        return m && parseInt(m[1], 10) === targetInt;
      });
    }

    // 4. Match "inv-1" or "INV-1" to "INV-00001"
    if (!inv && cleanLower.startsWith('inv-')) {
      const digits = cleanLower.replace(/^inv-/, '').trim();
      if (/^\d+$/.test(digits)) {
        const targetInt = parseInt(digits, 10);
        inv = state.sales.find(s => {
          const m = s.invoiceNumber?.match(/(\d+)$/);
          return m && parseInt(m[1], 10) === targetInt;
        });
      }
    }

    if (!inv) return null;

    // Attach items
    let items = (state.saleItems || [])
      .filter(i => i.salesInvoiceId === inv.id || i.salesInvoiceId === inv.invoiceNumber)
      .map(i => {
        const isLegacyServiceNote = typeof i.serialNumbers === 'string' && i.serialNumbers.startsWith('Service Note: ');
        return {
          ...i,
          serviceNotes: i.serviceNotes || (isLegacyServiceNote ? i.serialNumbers.replace('Service Note: ', '') : null),
          serialNumbers: isLegacyServiceNote ? null : i.serialNumbers,
        };
      });

    // Fallback to embedded items if saleItems table has no matching rows
    if (items.length === 0 && Array.isArray((inv as any).items) && (inv as any).items.length > 0) {
      items = (inv as any).items.map((i: any) => ({
        ...i,
        serviceNotes: i.serviceNotes || null,
        serialNumbers: i.serialNumbers || (Array.isArray(i.selectedSerials) ? i.selectedSerials.join(', ') : null),
      }));
    }

    return {
      ...inv,
      items,
    };
  }

  /**
   * Delete / Void an invoice and restore stock & account balances
   */
  static deleteInvoice(id: string): { success: boolean; error?: string } {
    const state = dbStore.getState();
    const invIndex = state.sales.findIndex(s => s.id === id || s.invoiceNumber === id);
    if (invIndex === -1) {
      return { success: false, error: 'Invoice not found' };
    }

    const invoice = state.sales[invIndex];
    const items = state.saleItems.filter(i => i.salesInvoiceId === invoice.id);
    const nowIso = new Date().toISOString();

    // 1. Restore product inventory stock
    for (const item of items) {
      const product = state.products.find(p => p.id === item.productId);
      if (product) {
        if (product.isService || product.unit === 'SERVICE') {
          continue;
        }
        product.quantityInStock += item.quantity;
        product.updatedAt = nowIso;

        // Restore Serials back to AVAILABLE
        if (product.requiresSerial && item.serialNumbers) {
          const serialList = item.serialNumbers.split(',').map((s: string) => s.trim());
          for (const sn of serialList) {
            const sRecord = state.serials.find(s => s.productId === product.id && s.serialNumber === sn);
            if (sRecord) {
              sRecord.status = 'AVAILABLE';
              sRecord.salesInvoiceId = null;
              sRecord.sellingPrice = null;
              sRecord.warrantyStartDate = null;
              sRecord.warrantyEndDate = null;
            }
          }
        }

        // Record stock restock movement
        state.movements.push({
          id: `mov-${Date.now()}-${Math.random()}`,
          productId: product.id,
          movementType: 'SALE_RETURN_RESTOCK',
          quantityChange: item.quantity,
          previousStock: product.quantityInStock - item.quantity,
          newStock: product.quantityInStock,
          unitCost: product.costPrice,
          referenceType: 'INVOICE_DELETE',
          referenceId: invoice.invoiceNumber,
          reason: `Invoice ${invoice.invoiceNumber} deleted/voided`,
          performedById: invoice.cashierId,
          createdAt: nowIso,
        });
      }
    }

    // 2. Adjust customer balance if registered customer
    if (invoice.customerId) {
      const customer = state.customers.find(c => c.id === invoice.customerId);
      if (customer) {
        if (invoice.remainingBalance > 0) {
          customer.outstandingBalance = roundToCents(
            Math.max(0, customer.outstandingBalance - invoice.remainingBalance)
          );
        }
        if (invoice.customerAdvanceUsed > 0) {
          customer.depositBalance = roundToCents(
            customer.depositBalance + invoice.customerAdvanceUsed
          );
        }
      }
    }

    // 3. Adjust cash drawer session if cash sale
    if (invoice.paymentMethod === 'CASH' && invoice.paymentReceived > 0) {
      const activeRegister = state.registerSessions.find(r => r.status === 'OPEN');
      if (activeRegister) {
        activeRegister.cashSalesTotal = roundToCents(
          Math.max(0, activeRegister.cashSalesTotal - invoice.paymentReceived)
        );
        activeRegister.expectedClosingCash = roundToCents(
          activeRegister.openingFloat +
          activeRegister.cashSalesTotal +
          activeRegister.cashDepositsTotal -
          activeRegister.cashExpensesTotal -
          activeRegister.cashRefundsTotal
        );
      }
    }

    // 4. Remove invoice and items
    state.sales.splice(invIndex, 1);
    state.saleItems = state.saleItems.filter(i => i.salesInvoiceId !== invoice.id);

    // Audit Log
    state.auditLogs.push({
      id: `aud-${Date.now()}`,
      userId: invoice.cashierId,
      action: 'INVOICE_DELETED',
      entityType: 'SalesInvoice',
      entityId: invoice.id,
      details: JSON.stringify({ invoiceNumber: invoice.invoiceNumber, grandTotal: invoice.grandTotal }),
      createdAt: nowIso,
    });

    dbStore.save(state);
    return { success: true };
  }

  /**
   * Update an existing invoice (Customer, payment, notes, status)
   */
  static updateInvoice(
    id: string,
    updates: {
      customerName?: string;
      customerId?: string | null;
      paymentMethod?: 'CASH' | 'CARD' | 'BANK_TRANSFER' | 'CUSTOMER_CREDIT' | 'ADVANCE_DEPOSIT';
      paymentStatus?: 'PAID' | 'PARTIAL' | 'UNPAID';
      paymentReceived?: number;
      notes?: string | null;
    }
  ): { success: boolean; invoice?: SalesInvoiceView; error?: string } {
    const state = dbStore.getState();
    const inv = state.sales.find(s => s.id === id || s.invoiceNumber === id);
    if (!inv) return { success: false, error: 'Invoice not found' };

    const nowIso = new Date().toISOString();

    if (updates.customerName !== undefined) {
      inv.customerName = updates.customerName;
    }
    if (updates.customerId !== undefined) {
      inv.customerId = updates.customerId;
    }
    if (updates.paymentMethod !== undefined) {
      inv.paymentMethod = updates.paymentMethod;
    }
    if (updates.notes !== undefined) {
      inv.notes = updates.notes;
    }
    if (updates.paymentReceived !== undefined) {
      const oldRemaining = inv.remainingBalance;
      const newPaid = roundToCents(Number(updates.paymentReceived));
      inv.paymentReceived = newPaid;
      inv.remainingBalance = roundToCents(Math.max(0, inv.netAmountDue - newPaid));
      if (inv.remainingBalance === 0) {
        inv.paymentStatus = 'PAID';
      } else if (newPaid > 0) {
        inv.paymentStatus = 'PARTIAL';
      } else {
        inv.paymentStatus = 'UNPAID';
      }

      // Sync customer balance if registered customer
      if (inv.customerId) {
        const customer = state.customers.find(c => c.id === inv.customerId);
        if (customer) {
          const diff = inv.remainingBalance - oldRemaining;
          customer.outstandingBalance = roundToCents(Math.max(0, customer.outstandingBalance + diff));
        }
      }
    }
    if (updates.paymentStatus !== undefined && updates.paymentReceived === undefined) {
      inv.paymentStatus = updates.paymentStatus;
    }

    inv.updatedAt = nowIso;
    dbStore.save(state);

    return {
      success: true,
      invoice: this.getInvoice(inv.id)!,
    };
  }
}
