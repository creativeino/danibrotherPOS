import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    // Fetch all core system data from Prisma for a complete backup
    const [
      settings,
      users,
      categories,
      brands,
      products,
      serials,
      customers,
      suppliers,
      salesInvoices,
      salesItems,
      purchaseInvoices,
      purchaseItems,
      customerDeposits,
      customerLedger,
      supplierLedger,
      expenses,
      expenseCategories,
      auditLogs,
    ] = await Promise.all([
      prisma.shopSettings.findMany(),
      prisma.user.findMany({
        select: {
          id: true,
          username: true,
          fullName: true,
          email: true,
          role: true,
          active: true,
          createdAt: true,
        },
      }),
      prisma.category.findMany(),
      prisma.brand.findMany(),
      prisma.product.findMany(),
      prisma.productSerialNumber.findMany(),
      prisma.customer.findMany(),
      prisma.supplier.findMany(),
      prisma.salesInvoice.findMany(),
      prisma.salesInvoiceItem.findMany(),
      prisma.purchaseInvoice.findMany(),
      prisma.purchaseInvoiceItem.findMany(),
      prisma.customerDeposit.findMany(),
      prisma.customerLedgerEntry.findMany(),
      prisma.supplierLedgerEntry.findMany(),
      prisma.expense.findMany(),
      prisma.expenseCategory.findMany(),
      prisma.auditLog.findMany({ take: 500, orderBy: { createdAt: 'desc' } }),
    ]);

    const backupData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      shop: settings[0]?.shopName || 'Danibrothers POS',
      data: {
        settings,
        users,
        categories,
        brands,
        products,
        serials,
        customers,
        suppliers,
        salesInvoices,
        salesItems,
        purchaseInvoices,
        purchaseItems,
        customerDeposits,
        customerLedger,
        supplierLedger,
        expenses,
        expenseCategories,
        auditLogs,
      },
    };

    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `danibrothers_pos_backup_${dateStr}.json`;

    return new NextResponse(JSON.stringify(backupData, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
