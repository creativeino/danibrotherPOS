import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { supplierPaymentSchema } from '@/lib/validations';
import { getCurrentUser } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    const userId = user?.id || 'usr-danish';

    const body = await req.json();
    const parsed = supplierPaymentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || 'Invalid payment data' },
        { status: 400 }
      );
    }

    const { supplierId, amount, paymentMethod, reference, notes } = parsed.data;
    const paymentAmount = Number(amount);

    if (paymentAmount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Payment amount must be greater than zero' },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const supplier = await tx.supplier.findUnique({
        where: { id: supplierId },
      });

      if (!supplier) {
        throw new Error('Supplier not found');
      }

      const count = await tx.supplierLedgerEntry.count({
        where: { reference: { startsWith: 'PAY-' } },
      });
      const paymentRef = reference?.trim() || `PAY-${String(count + 1).padStart(5, '0')}`;
      const now = new Date();

      const newBalance = Math.max(0, Number(supplier.outstandingBalance) - paymentAmount);

      const updatedSupplier = await tx.supplier.update({
        where: { id: supplier.id },
        data: {
          outstandingBalance: newBalance,
          updatedAt: now,
        },
      });

      const ledgerEntry = await tx.supplierLedgerEntry.create({
        data: {
          supplierId: supplier.id,
          entryDate: now,
          reference: paymentRef,
          description: `Disbursement Payment to Supplier (${paymentMethod})${notes ? ` - ${notes}` : ''}`,
          debit: paymentAmount,
          credit: 0,
          balanceAfter: newBalance,
        },
      });

      return {
        supplier: {
          ...updatedSupplier,
          openingBalance: Number(updatedSupplier.openingBalance),
          advanceBalance: Number(updatedSupplier.advanceBalance),
          outstandingBalance: Number(updatedSupplier.outstandingBalance),
        },
        payment: {
          reference: paymentRef,
          amount: paymentAmount,
          paymentMethod,
          date: now.toISOString(),
        },
        ledgerEntry: {
          ...ledgerEntry,
          debit: Number(ledgerEntry.debit),
          credit: Number(ledgerEntry.credit),
          balanceAfter: Number(ledgerEntry.balanceAfter),
        },
      };
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Payment processing failed' },
      { status: 400 }
    );
  }
}
