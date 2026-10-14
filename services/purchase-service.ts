import { dbStore } from '@/lib/db';
import { ensureDatabaseSeeded } from '@/lib/init';
import { roundToCents } from '@/lib/calculations';

ensureDatabaseSeeded();

export class PurchaseService {
  static getPurchases() {
    const state = dbStore.getState();
    return [...state.purchases].reverse();
  }

  static createPurchase(input: {
    supplierId: string;
    supplierInvoiceRef?: string | null;
    items: Array<{
      productId: string;
      quantity: number;
      unitCost: number;
      lineDiscount?: number;
      serialNumbers?: string[];
    }>;
    discountTotal?: number;
    taxAmount?: number;
    shippingCost?: number;
    supplierAdvanceUsed?: number;
    amountPaid?: number;
    notes?: string | null;
    creatorId: string;
  }) {
    const state = dbStore.getState();
    const supplier = state.suppliers.find(s => s.id === input.supplierId);
    if (!supplier) throw new Error('Supplier not found');

    const nowIso = new Date().toISOString();
    const purchaseCount = state.purchases.length + 1;
    const purchaseNumber = `${state.settings.purchasePrefix || 'PUR-'}${String(purchaseCount).padStart(5, '0')}`;
    const purchaseId = `pur-${Date.now()}`;

    let subtotal = 0;
    const createdItems: any[] = [];

    // Process line items & add stock
    for (const item of input.items) {
      const product = state.products.find(p => p.id === item.productId);
      if (!product) throw new Error(`Product not found: ${item.productId}`);

      const gross = roundToCents(item.quantity * item.unitCost);
      const discount = item.lineDiscount || 0;
      const lineTotal = roundToCents(gross - discount);
      subtotal += lineTotal;

      const prevStock = product.quantityInStock;
      product.quantityInStock += item.quantity;
      product.costPrice = item.unitCost; // Update current replacement cost
      product.updatedAt = nowIso;

      // Register serial numbers if provided
      if (item.serialNumbers && item.serialNumbers.length > 0) {
        for (const sn of item.serialNumbers) {
          state.serials.push({
            id: `ser-${Date.now()}-${Math.random()}`,
            productId: product.id,
            serialNumber: sn,
            status: 'AVAILABLE',
            costPrice: item.unitCost,
            sellingPrice: product.sellingPrice,
            warrantyMonths: product.warrantyDurationMonths || 12,
            purchaseInvoiceId: purchaseId,
          });
        }
      }

      // Record Inventory Movement
      state.movements.push({
        id: `mov-${Date.now()}-${Math.random()}`,
        productId: product.id,
        movementType: 'PURCHASE_RECEIPT',
        quantityChange: item.quantity,
        previousStock: prevStock,
        newStock: product.quantityInStock,
        unitCost: item.unitCost,
        referenceType: 'PURCHASE',
        referenceId: purchaseNumber,
        reason: `Received on purchase invoice ${purchaseNumber}`,
        performedById: input.creatorId,
        createdAt: nowIso,
      });

      const pItem = {
        id: `pitem-${Date.now()}-${Math.random()}`,
        purchaseInvoiceId: purchaseId,
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        quantity: item.quantity,
        unitCost: item.unitCost,
        lineDiscount: discount,
        lineTotal,
        serialNumbers: item.serialNumbers?.join(', ') || null,
        createdAt: nowIso,
      };

      state.purchaseItems.push(pItem);
      createdItems.push(pItem);
    }

    subtotal = roundToCents(subtotal);
    const overallDiscount = roundToCents(input.discountTotal || 0);
    const tax = roundToCents(input.taxAmount || 0);
    const shipping = roundToCents(input.shippingCost || 0);
    const grandTotal = roundToCents(subtotal - overallDiscount + tax + shipping);

    const advanceUsed = roundToCents(Math.min(grandTotal, input.supplierAdvanceUsed || 0));
    const netDue = roundToCents(grandTotal - advanceUsed);
    const amountPaid = roundToCents(input.amountPaid || 0);
    const remainingBalance = roundToCents(Math.max(0, netDue - amountPaid));

    let paymentStatus: 'PAID' | 'PARTIAL' | 'UNPAID' = 'PAID';
    if (remainingBalance > 0 && amountPaid > 0) paymentStatus = 'PARTIAL';
    else if (remainingBalance > 0 && amountPaid === 0) paymentStatus = 'UNPAID';

    // Update Supplier Advance & Payables
    if (advanceUsed > 0) {
      supplier.advanceBalance = roundToCents(Math.max(0, supplier.advanceBalance - advanceUsed));
    }
    if (remainingBalance > 0) {
      supplier.outstandingBalance = roundToCents(supplier.outstandingBalance + remainingBalance);
    }

    // Post to Supplier Ledger
    state.supplierLedger.push({
      id: `sld-${Date.now()}`,
      supplierId: supplier.id,
      entryDate: nowIso,
      reference: purchaseNumber,
      description: `Purchase Bill ${purchaseNumber}`,
      debit: amountPaid + advanceUsed, // Disbursed / advance adjusted
      credit: grandTotal, // Total purchase bill liability
      balanceAfter: supplier.outstandingBalance,
      createdAt: nowIso,
    });

    const purchase = {
      id: purchaseId,
      purchaseNumber,
      supplierId: supplier.id,
      supplierName: supplier.name,
      supplierInvoiceRef: input.supplierInvoiceRef || null,
      creatorId: input.creatorId,
      purchaseDate: nowIso,
      subtotal,
      discountTotal: overallDiscount,
      taxAmount: tax,
      shippingCost: shipping,
      grandTotal,
      supplierAdvanceUsed: advanceUsed,
      netAmountDue: netDue,
      amountPaid,
      remainingBalance,
      paymentStatus,
      notes: input.notes || null,
      items: createdItems,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    state.purchases.push(purchase);
    dbStore.save(state);
    return purchase;
  }
}
