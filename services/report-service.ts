import { dbStore } from '@/lib/db';
import { ensureDatabaseSeeded } from '@/lib/init';
import { roundToCents } from '@/lib/calculations';

ensureDatabaseSeeded();

export class ReportService {
  static getDashboardMetrics() {
    const state = dbStore.getState();

    // Today filter
    const today = new Date().toISOString().slice(0, 10);
    const todaySalesList = state.sales.filter(s => !s.isVoided && s.invoiceDate.startsWith(today));
    const todayPurchasesList = state.purchases.filter(p => p.purchaseDate.startsWith(today));

    const todaySales = roundToCents(todaySalesList.reduce((acc, s) => acc + s.grandTotal, 0));
    const todayPurchases = roundToCents(todayPurchasesList.reduce((acc, p) => acc + p.grandTotal, 0));

    const totalSales = roundToCents(state.sales.filter(s => !s.isVoided).reduce((acc, s) => acc + s.grandTotal, 0));
    const totalPurchases = roundToCents(state.purchases.reduce((acc, p) => acc + p.grandTotal, 0));

    // COGS & Gross Profit calculation (active non-voided sales only)
    const validSaleIds = new Set(state.sales.filter(s => !s.isVoided).map(s => s.id));
    let totalCogs = 0;
    for (const item of state.saleItems) {
      if (validSaleIds.has(item.salesInvoiceId)) {
        totalCogs += item.quantity * (item.unitCost || 0);
      }
    }
    totalCogs = roundToCents(totalCogs);
    const grossProfit = roundToCents(totalSales - totalCogs);

    // Total Receivables & Payables
    const totalCustomerReceivables = roundToCents(
      state.customers.reduce((acc, c) => acc + (c.outstandingBalance || 0), 0)
    );
    const totalCustomerDeposits = roundToCents(
      state.customers.reduce((acc, c) => acc + (c.depositBalance || 0), 0)
    );
    const totalSupplierPayables = roundToCents(
      state.suppliers.reduce((acc, s) => acc + (s.outstandingBalance || 0), 0)
    );

    // Active Register Cash
    const activeRegister = state.registerSessions.find(r => r.status === 'OPEN');
    const cashInDrawer = activeRegister ? activeRegister.expectedClosingCash : 0;

    // Inventory status (Physical goods only, excluding services/labor)
    const physicalProducts = state.products.filter(p => p.active && !p.isService && p.unit !== 'SERVICE');
    const lowStockCount = physicalProducts.filter(p => p.quantityInStock <= p.reorderLevel && p.quantityInStock > 0).length;
    const outOfStockCount = physicalProducts.filter(p => p.quantityInStock <= 0).length;
    const totalInventoryValue = roundToCents(
      physicalProducts.reduce((acc, p) => acc + p.quantityInStock * p.costPrice, 0)
    );

    // Top selling products (active non-voided sales only)
    const productSalesMap = new Map<string, { name: string; qty: number; revenue: number }>();
    for (const item of state.saleItems) {
      if (!validSaleIds.has(item.salesInvoiceId)) continue;
      const existing = productSalesMap.get(item.productId) || { name: item.productName, qty: 0, revenue: 0 };
      existing.qty += item.quantity;
      existing.revenue += item.lineTotal;
      productSalesMap.set(item.productId, existing);
    }
    const topSellingProducts = Array.from(productSalesMap.values())
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);

    return {
      todaySales,
      todayPurchases,
      totalSales,
      totalPurchases,
      totalCogs,
      grossProfit,
      totalCustomerReceivables,
      totalCustomerDeposits,
      totalSupplierPayables,
      cashInDrawer,
      lowStockCount,
      outOfStockCount,
      totalInventoryValue,
      recentSales: state.sales.slice(-5).reverse(),
      recentPurchases: state.purchases.slice(-5).reverse(),
      topSellingProducts,
    };
  }

  static getInventoryValuation() {
    const state = dbStore.getState();
    return state.products
      .filter(p => !p.isService && p.unit !== 'SERVICE')
      .map(p => {
        const costValue = roundToCents(p.quantityInStock * p.costPrice);
        const retailValue = roundToCents(p.quantityInStock * p.sellingPrice);
        const margin = roundToCents(retailValue - costValue);
        return {
          id: p.id,
          name: p.name,
          sku: p.sku,
          barcode: p.barcode,
          quantity: p.quantityInStock,
          unitCost: p.costPrice,
          unitPrice: p.sellingPrice,
          costValue,
          retailValue,
          potentialProfit: margin,
        };
      });
  }
}
