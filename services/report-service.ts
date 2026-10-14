import { prisma } from '@/lib/prisma';
import { roundToCents } from '@/lib/calculations';

export class ReportService {
  static async getDashboardMetrics() {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [
      sales,
      saleItems,
      purchases,
      customers,
      suppliers,
      products,
    ] = await Promise.all([
      prisma.salesInvoice.findMany({
        where: { isVoided: false },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.salesInvoiceItem.findMany({
        where: { salesInvoice: { isVoided: false } },
        include: { product: true },
      }),
      prisma.purchaseInvoice.findMany({
        orderBy: { createdAt: 'desc' },
        include: { supplier: true },
      }),
      prisma.customer.findMany(),
      prisma.supplier.findMany(),
      prisma.product.findMany({
        where: { active: true },
      }),
    ]);

    // Today's Sales & Purchases
    const todaySalesList = sales.filter(s => new Date(s.invoiceDate) >= todayStart);
    const todayPurchasesList = purchases.filter(p => new Date(p.purchaseDate) >= todayStart);

    const todaySales = roundToCents(todaySalesList.reduce((acc, s) => acc + Number(s.grandTotal), 0));
    const todayPurchases = roundToCents(todayPurchasesList.reduce((acc, p) => acc + Number(p.grandTotal), 0));

    const totalSales = roundToCents(sales.reduce((acc, s) => acc + Number(s.grandTotal), 0));
    const totalPurchases = roundToCents(purchases.reduce((acc, p) => acc + Number(p.grandTotal), 0));

    // COGS & Gross Profit
    let totalCogs = 0;
    for (const item of saleItems) {
      totalCogs += item.quantity * Number(item.unitCost || 0);
    }
    totalCogs = roundToCents(totalCogs);
    const grossProfit = roundToCents(totalSales - totalCogs);

    // Customer & Supplier Balances
    const totalCustomerReceivables = roundToCents(
      customers.reduce((acc, c) => acc + Number(c.outstandingBalance || 0), 0)
    );
    const totalCustomerDeposits = roundToCents(
      customers.reduce((acc, c) => acc + Number(c.depositBalance || 0), 0)
    );
    const totalSupplierPayables = roundToCents(
      suppliers.reduce((acc, s) => acc + Number(s.outstandingBalance || 0), 0)
    );

    // Inventory status (exclude service items)
    const physicalProducts = products.filter(p => !p.sku.startsWith('SRV'));
    const lowStockCount = physicalProducts.filter(p => p.quantityInStock <= p.reorderLevel && p.quantityInStock > 0).length;
    const outOfStockCount = physicalProducts.filter(p => p.quantityInStock <= 0).length;
    const totalInventoryValue = roundToCents(
      physicalProducts.reduce((acc, p) => acc + p.quantityInStock * Number(p.costPrice), 0)
    );

    // Top selling products
    const productSalesMap = new Map<string, { name: string; qty: number; revenue: number }>();
    for (const item of saleItems) {
      const existing = productSalesMap.get(item.productId) || {
        name: item.product?.name ?? item.serviceNotes ?? 'Product',
        qty: 0,
        revenue: 0,
      };
      existing.qty += item.quantity;
      existing.revenue += Number(item.lineTotal);
      productSalesMap.set(item.productId, existing);
    }

    const topSellingProducts = Array.from(productSalesMap.values())
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);

    const recentSales = sales.slice(0, 5).map(s => ({
      id: s.id,
      invoiceNumber: s.invoiceNumber,
      customerName: s.customerName,
      grandTotal: Number(s.grandTotal),
      paymentStatus: s.paymentStatus,
      invoiceDate: s.invoiceDate.toISOString(),
    }));

    const recentPurchases = purchases.slice(0, 5).map(p => ({
      id: p.id,
      purchaseNumber: p.purchaseNumber,
      supplierName: p.supplier.name,
      grandTotal: Number(p.grandTotal),
      paymentStatus: p.paymentStatus,
      purchaseDate: p.purchaseDate.toISOString(),
    }));

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
      cashInDrawer: 0,
      lowStockCount,
      outOfStockCount,
      totalInventoryValue,
      recentSales,
      recentPurchases,
      topSellingProducts,
    };
  }

  static async getInventoryValuation() {
    const products = await prisma.product.findMany({
      where: { active: true },
      orderBy: { name: 'asc' },
    });

    return products
      .filter(p => !p.sku.startsWith('SRV'))
      .map(p => {
        const costPrice = Number(p.costPrice);
        const sellingPrice = Number(p.sellingPrice);
        const costValue = roundToCents(p.quantityInStock * costPrice);
        const retailValue = roundToCents(p.quantityInStock * sellingPrice);
        const margin = roundToCents(retailValue - costValue);

        return {
          id: p.id,
          name: p.name,
          sku: p.sku,
          barcode: p.barcode,
          quantity: p.quantityInStock,
          unitCost: costPrice,
          unitPrice: sellingPrice,
          costValue,
          retailValue,
          potentialProfit: margin,
        };
      });
  }
}
