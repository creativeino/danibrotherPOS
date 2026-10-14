import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { roundToCents } from '@/lib/calculations';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const period = searchParams.get('period') || 'daily'; // 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom'
    const fromParam = searchParams.get('from');
    const toParam = searchParams.get('to');

    const now = new Date();
    let startDate = new Date();
    let endDate = new Date();

    if (period === 'daily') {
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
    } else if (period === 'yesterday') {
      startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      endDate.setHours(23, 59, 59, 999);
    } else if (period === 'weekly') {
      // Last 7 days
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
    } else if (period === 'lastWeek') {
      // Previous 7 days
      startDate = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      endDate.setHours(23, 59, 59, 999);
    } else if (period === 'monthly') {
      // Current month
      startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
    } else if (period === 'lastMonth') {
      // Previous month
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
      endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
    } else if (period === 'yearly') {
      // Current year
      startDate = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
    } else if (period === 'lastYear') {
      // Previous year
      startDate = new Date(now.getFullYear() - 1, 0, 1, 0, 0, 0, 0);
      endDate = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999);
    } else if (period === 'custom') {
      if (fromParam) {
        startDate = new Date(fromParam);
        startDate.setHours(0, 0, 0, 0);
      } else {
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      }
      if (toParam) {
        endDate = new Date(toParam);
        endDate.setHours(23, 59, 59, 999);
      } else {
        endDate.setHours(23, 59, 59, 999);
      }
    }

    const [
      sales,
      saleItems,
      salesReturns,
      purchases,
      purchaseReturns,
      expenses,
    ] = await Promise.all([
      prisma.salesInvoice.findMany({
        where: {
          isVoided: false,
          invoiceDate: { gte: startDate, lte: endDate },
        },
        include: {
          customer: true,
          cashier: true,
        },
        orderBy: { invoiceDate: 'desc' },
      }),
      prisma.salesInvoiceItem.findMany({
        where: {
          salesInvoice: {
            isVoided: false,
            invoiceDate: { gte: startDate, lte: endDate },
          },
        },
        include: { product: true },
      }),
      prisma.salesReturn.findMany({
        where: {
          returnDate: { gte: startDate, lte: endDate },
        },
      }),
      prisma.purchaseInvoice.findMany({
        where: {
          purchaseDate: { gte: startDate, lte: endDate },
        },
        include: { supplier: true },
        orderBy: { purchaseDate: 'desc' },
      }),
      prisma.purchaseReturn.findMany({
        where: {
          returnDate: { gte: startDate, lte: endDate },
        },
      }),
      prisma.expense.findMany({
        where: {
          expenseDate: { gte: startDate, lte: endDate },
        },
        include: { category: true },
        orderBy: { expenseDate: 'desc' },
      }),
    ]);

    // Financial Metrics Calculation
    const totalGrossSales = roundToCents(
      sales.reduce((acc, s) => acc + Number(s.grandTotal), 0)
    );
    const totalSalesReturns = roundToCents(
      salesReturns.reduce((acc, r) => acc + Number(r.refundAmount), 0)
    );
    const netRevenue = roundToCents(Math.max(0, totalGrossSales - totalSalesReturns));

    // COGS
    let totalCogs = 0;
    for (const item of saleItems) {
      totalCogs += item.quantity * Number(item.unitCost || 0);
    }
    totalCogs = roundToCents(totalCogs);

    // Gross Profit
    const grossProfit = roundToCents(netRevenue - totalCogs);

    // Operating Expenses
    const totalExpenses = roundToCents(
      expenses.reduce((acc, e) => acc + Number(e.amount), 0)
    );

    // Net Profit
    const netProfit = roundToCents(grossProfit - totalExpenses);

    // Purchases & Vendor returns
    const totalPurchases = roundToCents(
      purchases.reduce((acc, p) => acc + Number(p.grandTotal), 0)
    );
    const totalPurchaseReturns = roundToCents(
      purchaseReturns.reduce((acc, pr) => acc + Number(pr.totalAmount), 0)
    );

    // Payment methods breakdown
    const paymentMethodsMap: Record<string, number> = {
      CASH: 0,
      CARD: 0,
      BANK_TRANSFER: 0,
      CUSTOMER_CREDIT: 0,
    };
    for (const s of sales) {
      const pm = s.paymentMethod || 'CASH';
      paymentMethodsMap[pm] = roundToCents((paymentMethodsMap[pm] || 0) + Number(s.paymentReceived));
    }

    return NextResponse.json({
      success: true,
      period,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      summary: {
        totalGrossSales,
        totalSalesReturns,
        netRevenue,
        totalCogs,
        grossProfit,
        grossProfitMargin: netRevenue > 0 ? roundToCents((grossProfit / netRevenue) * 100) : 0,
        totalExpenses,
        netProfit,
        totalPurchases,
        totalPurchaseReturns,
        invoicesCount: sales.length,
        purchasesCount: purchases.length,
        expensesCount: expenses.length,
        salesReturnsCount: salesReturns.length,
        purchaseReturnsCount: purchaseReturns.length,
      },
      paymentMethods: paymentMethodsMap,
      recentSales: sales.slice(0, 15).map(s => ({
        id: s.id,
        invoiceNumber: s.invoiceNumber,
        customerName: s.customerName,
        grandTotal: Number(s.grandTotal),
        paymentReceived: Number(s.paymentReceived),
        remainingBalance: Number(s.remainingBalance),
        paymentMethod: s.paymentMethod,
        paymentStatus: s.paymentStatus,
        invoiceDate: s.invoiceDate.toISOString(),
      })),
      recentExpenses: expenses.slice(0, 10).map(e => ({
        id: e.id,
        expenseNumber: e.expenseNumber,
        title: e.title,
        category: e.category.name,
        amount: Number(e.amount),
        expenseDate: e.expenseDate.toISOString(),
      })),
    });
  } catch (error: any) {
    console.error('Financial reports API error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Server error' }, { status: 500 });
  }
}
