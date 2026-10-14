import { NextRequest, NextResponse } from 'next/server';
import { dbStore } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { roundToCents } from '@/lib/calculations';
import { salesReturnSchema } from '@/lib/validations';

export async function GET() {
  try {
    const state = dbStore.getState();
    return NextResponse.json({
      success: true,
      returns: [...state.salesReturns].reverse(),
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    const userId = user?.id || 'usr-danish';
    const body = await req.json();

    const parsed = salesReturnSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || 'Invalid return data' },
        { status: 400 }
      );
    }

    const state = dbStore.getState();
    const invoice = state.sales.find(
      s => s.id === parsed.data.salesInvoiceId || s.invoiceNumber === parsed.data.salesInvoiceId
    );
    if (!invoice) {
      return NextResponse.json({ success: false, error: 'Original sales invoice not found' }, { status: 404 });
    }

    const nowIso = new Date().toISOString();
    const returnCount = state.salesReturns.length + 1;
    const returnNumber = `RET-${String(returnCount).padStart(5, '0')}`;

    let totalRefundAmount = 0;
    const processedItems: any[] = [];

    for (const retItem of parsed.data.items) {
      const saleItem = state.saleItems.find(
        si => si.salesInvoiceId === invoice.id && (si.id === retItem.salesInvoiceItemId || si.productId === retItem.productId)
      );

      if (!saleItem) {
        return NextResponse.json(
          { success: false, error: `Item not found on invoice: ${retItem.productId}` },
          { status: 400 }
        );
      }

      if (retItem.quantity > (saleItem.quantity - (saleItem.returnedQuantity || 0))) {
        return NextResponse.json(
          { success: false, error: `Return quantity (${retItem.quantity}) exceeds remaining returnable quantity for "${saleItem.productName}"` },
          { status: 400 }
        );
      }

      const itemUnitPrice = saleItem.unitPrice;
      const itemRefund = roundToCents(retItem.quantity * itemUnitPrice);
      totalRefundAmount = roundToCents(totalRefundAmount + itemRefund);

      saleItem.returnedQuantity = (saleItem.returnedQuantity || 0) + retItem.quantity;

      const product = state.products.find(p => p.id === retItem.productId);
      if (product) {
        // Restock physical inventory if restockable
        if (retItem.condition === 'RESTOCKABLE' && !product.isService && product.unit !== 'SERVICE') {
          const prevStock = product.quantityInStock;
          product.quantityInStock += retItem.quantity;
          product.updatedAt = nowIso;

          state.movements.push({
            id: `mov-${Date.now()}-${Math.random()}`,
            productId: product.id,
            movementType: 'SALE_RETURN_RESTOCK',
            quantityChange: retItem.quantity,
            previousStock: prevStock,
            newStock: product.quantityInStock,
            unitCost: product.costPrice,
            referenceType: 'RETURN',
            referenceId: returnNumber,
            reason: `Restocked via Sales Return ${returnNumber} from Invoice ${invoice.invoiceNumber}`,
            performedById: userId,
            createdAt: nowIso,
          });

          // If serialized, mark serial AVAILABLE again
          if (retItem.serialNumber) {
            const sRecord = state.serials.find(
              s => s.productId === product.id && s.serialNumber === retItem.serialNumber
            );
            if (sRecord) {
              sRecord.status = 'AVAILABLE';
              sRecord.salesInvoiceId = null;
              sRecord.sellingPrice = null;
            }
          }
        }
      }

      processedItems.push({
        id: `ritem-${Date.now()}-${Math.random()}`,
        salesReturnId: `ret-${Date.now()}`,
        productId: retItem.productId,
        quantity: retItem.quantity,
        refundAmount: itemRefund,
        condition: retItem.condition,
        serialNumber: retItem.serialNumber || null,
      });
    }

    // Process refund disbursement
    if (parsed.data.refundMethod === 'CASH') {
      const activeRegister = state.registerSessions.find(r => r.status === 'OPEN');
      if (activeRegister) {
        activeRegister.cashRefundsTotal = roundToCents(activeRegister.cashRefundsTotal + totalRefundAmount);
        activeRegister.expectedClosingCash = roundToCents(
          activeRegister.openingFloat +
          activeRegister.cashSalesTotal +
          activeRegister.cashDepositsTotal -
          activeRegister.cashExpensesTotal -
          activeRegister.cashRefundsTotal
        );
      }
    } else if (parsed.data.refundMethod === 'CUSTOMER_CREDIT' && invoice.customerId) {
      const customer = state.customers.find(c => c.id === invoice.customerId);
      if (customer) {
        customer.depositBalance = roundToCents(customer.depositBalance + totalRefundAmount);
        state.customerLedger.push({
          id: `cld-${Date.now()}`,
          customerId: customer.id,
          entryDate: nowIso,
          reference: returnNumber,
          description: `Sales Return Refund Credit (${invoice.invoiceNumber})`,
          debit: 0,
          credit: totalRefundAmount,
          balanceAfter: customer.outstandingBalance,
          createdAt: nowIso,
        });
      }
    }

    const salesReturnRecord = {
      id: `ret-${Date.now()}`,
      returnNumber,
      salesInvoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      customerId: invoice.customerId,
      customerName: invoice.customerName,
      refundAmount: totalRefundAmount,
      refundMethod: parsed.data.refundMethod,
      reason: parsed.data.reason,
      processedById: userId,
      returnDate: nowIso,
      items: processedItems,
      createdAt: nowIso,
    };

    state.salesReturns.push(salesReturnRecord);

    state.auditLogs.push({
      id: `aud-${Date.now()}`,
      userId,
      action: 'SALE_RETURN_PROCESSED',
      entityType: 'SalesReturn',
      entityId: salesReturnRecord.id,
      details: JSON.stringify({
        returnNumber,
        invoiceNumber: invoice.invoiceNumber,
        refundAmount: totalRefundAmount,
        refundMethod: parsed.data.refundMethod,
      }),
      createdAt: nowIso,
    });

    dbStore.save(state);

    return NextResponse.json({ success: true, returnRecord: salesReturnRecord });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Server error' }, { status: 400 });
  }
}
