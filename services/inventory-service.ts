import { dbStore } from '@/lib/db';
import { ensureDatabaseSeeded } from '@/lib/init';
import { roundToCents } from '@/lib/calculations';

ensureDatabaseSeeded();

export class InventoryService {
  static getProducts(params?: {
    search?: string;
    categoryId?: string;
    brandId?: string;
    lowStockOnly?: boolean;
    type?: 'ALL' | 'PHYSICAL' | 'SERVICE';
  }) {
    const state = dbStore.getState();
    let list = [...state.products];

    if (params?.type === 'PHYSICAL') {
      list = list.filter(p => !p.isService && p.unit !== 'SERVICE');
    } else if (params?.type === 'SERVICE') {
      list = list.filter(p => p.isService || p.unit === 'SERVICE');
    }

    if (params?.categoryId) {
      list = list.filter(p => p.categoryId === params.categoryId);
    }
    if (params?.brandId) {
      list = list.filter(p => p.brandId === params.brandId);
    }
    if (params?.lowStockOnly) {
      list = list.filter(p => !p.isService && p.unit !== 'SERVICE' && p.quantityInStock <= p.reorderLevel);
    }
    if (params?.search) {
      const q = params.search.toLowerCase().trim();
      list = list.filter(
        p =>
          p.name.toLowerCase().includes(q) ||
          p.barcode.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          (p.modelNumber && p.modelNumber.toLowerCase().includes(q))
      );
    }

    return list.map(p => {
      const cat = state.categories.find(c => c.id === p.categoryId);
      const br = state.brands.find(b => b.id === p.brandId);
      const sup = state.suppliers.find(s => s.id === p.supplierId);
      return {
        ...p,
        categoryName: cat?.name || 'Uncategorized',
        brandName: br?.name || 'Generic',
        supplierName: sup?.name || p.supplierName || null,
      };
    });
  }

  static createProduct(data: any, userId: string) {
    const state = dbStore.getState();

    // Check duplicate barcode or SKU
    if (state.products.some(p => p.barcode === data.barcode)) {
      throw new Error(`A product with barcode "${data.barcode}" already exists.`);
    }
    if (state.products.some(p => p.sku === data.sku)) {
      throw new Error(`A product with SKU "${data.sku}" already exists.`);
    }

    let supplierName: string | null = null;
    if (data.supplierId) {
      const sup = state.suppliers.find(s => s.id === data.supplierId);
      if (sup) {
        supplierName = sup.name;
      }
    }

    const newProduct = {
      id: `prd-${Date.now()}`,
      ...data,
      supplierId: data.supplierId || null,
      supplierName,
      quantityInStock: data.quantityInStock || 0,
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    state.products.push(newProduct);

    // If opening stock provided, log movement
    if (newProduct.quantityInStock > 0) {
      state.movements.push({
        id: `mov-${Date.now()}`,
        productId: newProduct.id,
        movementType: 'OPENING_STOCK',
        quantityChange: newProduct.quantityInStock,
        previousStock: 0,
        newStock: newProduct.quantityInStock,
        unitCost: newProduct.costPrice,
        reason: 'Initial Opening Stock Entry',
        performedById: userId,
        createdAt: new Date().toISOString(),
      });

      // If supplier is linked and has cost price, record purchase bill into supplier ledger & update payable balance
      if (data.supplierId && newProduct.costPrice > 0 && !newProduct.isService) {
        const supplier = state.suppliers.find(s => s.id === data.supplierId);
        if (supplier) {
          const totalCost = roundToCents(newProduct.quantityInStock * newProduct.costPrice);
          supplier.outstandingBalance = roundToCents(supplier.outstandingBalance + totalCost);

          state.supplierLedger.push({
            id: `sld-${Date.now()}`,
            supplierId: supplier.id,
            entryDate: newProduct.createdAt,
            reference: newProduct.sku,
            description: `Stock Purchase: ${newProduct.name} (${newProduct.quantityInStock} ${newProduct.unit} @ Rs. ${newProduct.costPrice})`,
            debit: 0,
            credit: totalCost,
            balanceAfter: supplier.outstandingBalance,
            createdAt: newProduct.createdAt,
          });
        }
      }
    }

    dbStore.save(state);
    return newProduct;
  }

  static updateProduct(id: string, data: any, userId: string) {
    const state = dbStore.getState();
    const index = state.products.findIndex(p => p.id === id);
    if (index === -1) throw new Error('Product not found');

    const existing = state.products[index];

    // Barcode & SKU uniqueness check
    if (data.barcode && data.barcode !== existing.barcode) {
      if (state.products.some(p => p.id !== id && p.barcode === data.barcode)) {
        throw new Error(`Barcode "${data.barcode}" is already taken by another product.`);
      }
    }
    if (data.sku && data.sku !== existing.sku) {
      if (state.products.some(p => p.id !== id && p.sku === data.sku)) {
        throw new Error(`SKU "${data.sku}" is already taken by another product.`);
      }
    }

    state.products[index] = {
      ...existing,
      ...data,
      updatedAt: new Date().toISOString(),
    };

    state.auditLogs.push({
      id: `aud-${Date.now()}`,
      userId,
      action: 'PRODUCT_UPDATED',
      entityType: 'Product',
      entityId: id,
      details: JSON.stringify({ old: existing, new: state.products[index] }),
      createdAt: new Date().toISOString(),
    });

    dbStore.save(state);
    return state.products[index];
  }

  static deleteProduct(id: string, userId: string) {
    const state = dbStore.getState();
    const index = state.products.findIndex(p => p.id === id);
    if (index === -1) throw new Error('Product not found');

    const removed = state.products.splice(index, 1)[0];

    // Remove associated serials if any
    if (state.serials) {
      state.serials = state.serials.filter(s => s.productId !== id);
    }

    state.auditLogs.push({
      id: `aud-${Date.now()}`,
      userId,
      action: 'PRODUCT_DELETED',
      entityType: 'Product',
      entityId: id,
      details: JSON.stringify({ deletedProduct: removed }),
      createdAt: new Date().toISOString(),
    });

    dbStore.save(state);
    return true;
  }

  static manualStockAdjustment(params: {
    productId: string;
    adjustedQuantity: number;
    reason: string;
    userId: string;
  }) {
    const state = dbStore.getState();
    const product = state.products.find(p => p.id === params.productId);
    if (!product) throw new Error('Product not found');

    const prev = product.quantityInStock;
    const diff = params.adjustedQuantity - prev;
    product.quantityInStock = params.adjustedQuantity;
    product.updatedAt = new Date().toISOString();

    state.movements.push({
      id: `mov-${Date.now()}`,
      productId: product.id,
      movementType: 'MANUAL_ADJUSTMENT',
      quantityChange: diff,
      previousStock: prev,
      newStock: product.quantityInStock,
      unitCost: product.costPrice,
      reason: params.reason,
      performedById: params.userId,
      createdAt: new Date().toISOString(),
    });

    dbStore.save(state);
    return product;
  }

  static getMovements(productId?: string) {
    const state = dbStore.getState();
    let list = [...state.movements];
    if (productId) {
      list = list.filter(m => m.productId === productId);
    }
    return list.reverse();
  }
}
