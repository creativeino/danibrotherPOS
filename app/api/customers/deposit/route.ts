import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { customerDepositSchema } from '@/lib/validations';
import { getCurrentUser } from '@/lib/auth';
import { roundToCents } from '@/lib/calculations';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    const userId = user?.id;
    const body = await req.json();

    const parsed = customerDepositSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || 'Invalid deposit data' },
        { status: 400 }
      );
    }

    const { customerId, amount, paymentMethod, notes } = parsed.data;
    const depositAmount = roundToCents(amount);

    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      return NextResponse.json({ success: false, error: 'Customer not found' }, { status: 404 });
    }

    const count = await prisma.customerDeposit.count();
    const receiptNumber = `DEP-${String(count + 1).padStart(5, '0')}`;

    // Execute deposit & balance update transaction
    const result = await prisma.$transaction(async (tx) => {
      const deposit = await tx.customerDeposit.create({
        data: {
          receiptNumber,
          customerId,
          amount: depositAmount,
          paymentMethod: (paymentMethod as any) || 'CASH',
          notes: notes?.trim() || null,
        },
      });

      const updatedCustomer = await tx.customer.update({
        where: { id: customerId },
        data: {
          depositBalance: {
            increment: depositAmount,
          },
        },
      });

      const newBalance = Number(updatedCustomer.outstandingBalance) - Number(updatedCustomer.depositBalance);

      await tx.customerLedgerEntry.create({
        data: {
          customerId,
          reference: receiptNumber,
          description: `Customer advance deposit received (${paymentMethod || 'CASH'})${notes ? ` - ${notes}` : ''}`,
          debit: 0,
          credit: depositAmount,
          balanceAfter: newBalance,
        },
      });

      try {
        await tx.auditLog.create({
          data: {
            userId: userId || null,
            action: 'CUSTOMER_DEPOSIT',
            entityType: 'CustomerDeposit',
            entityId: deposit.id,
            details: JSON.stringify({ receiptNumber, customerName: customer.name, amount: depositAmount }),
          },
        });
      } catch {
        // ignore
      }

      return deposit;
    });

    return NextResponse.json({ success: true, deposit: result });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Deposit recording failed' },
      { status: 400 }
    );
  }
}
