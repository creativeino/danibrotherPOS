"use strict";
// Precision Financial Math Utility for Retail POS
// Avoids IEEE 754 floating-point errors by doing intermediate rounding and minor unit math
Object.defineProperty(exports, "__esModule", { value: true });
exports.roundToCents = roundToCents;
exports.calculateInvoiceTotals = calculateInvoiceTotals;
exports.formatCurrency = formatCurrency;
/**
 * Rounds a number strictly to two decimal places
 */
function roundToCents(amount) {
    return Math.round((amount + Number.EPSILON) * 100) / 100;
}
/**
 * Executes the sequential invoice calculation rules strictly on the server:
 * 1. Calculate each line's (quantity * unitPrice).
 * 2. Subtract applicable line-item discounts.
 * 3. Calculate subtotal after line discounts.
 * 4. Apply invoice-level discount (capped so discount cannot exceed total value).
 * 5. Calculate applicable taxes on the discounted base.
 * 6. Calculate the final payable grand total.
 * 7. Apply eligible customer advance (capped by available deposit & grand total).
 * 8. Net amount due = grand total - advance applied.
 * 9. Calculate change due and remaining balance against payment received.
 */
function calculateInvoiceTotals(input) {
    let subtotalRaw = 0;
    let itemDiscountTotal = 0;
    for (const item of input.items) {
        const qty = Math.max(0, item.quantity);
        const price = Math.max(0, item.unitPrice);
        const lineGross = roundToCents(qty * price);
        const discount = Math.min(lineGross, Math.max(0, item.lineDiscount || 0));
        subtotalRaw += lineGross;
        itemDiscountTotal += discount;
    }
    const subtotal = roundToCents(subtotalRaw);
    itemDiscountTotal = roundToCents(itemDiscountTotal);
    const subtotalAfterItemDiscount = Math.max(0, roundToCents(subtotal - itemDiscountTotal));
    // Apply invoice-level discount, capped by subtotalAfterItemDiscount
    const requestedInvoiceDiscount = Math.max(0, input.invoiceDiscountAmount || 0);
    const invoiceDiscount = roundToCents(Math.min(subtotalAfterItemDiscount, requestedInvoiceDiscount));
    const taxableBase = roundToCents(subtotalAfterItemDiscount - invoiceDiscount);
    const taxRate = Math.max(0, input.taxRatePercent || 0);
    const taxAmount = roundToCents((taxableBase * taxRate) / 100);
    const grandTotal = roundToCents(taxableBase + taxAmount);
    // Customer advance applied: cannot exceed grand total
    const requestedAdvance = Math.max(0, input.customerAdvanceApplied || 0);
    const customerAdvanceApplied = roundToCents(Math.min(grandTotal, requestedAdvance));
    const netAmountDue = roundToCents(grandTotal - customerAdvanceApplied);
    const paymentReceived = roundToCents(Math.max(0, input.paymentReceived || 0));
    let changeDue = 0;
    let remainingBalance = 0;
    if (paymentReceived >= netAmountDue) {
        changeDue = roundToCents(paymentReceived - netAmountDue);
        remainingBalance = 0;
    }
    else {
        changeDue = 0;
        remainingBalance = roundToCents(netAmountDue - paymentReceived);
    }
    let paymentStatus = 'PAID';
    if (remainingBalance > 0 && paymentReceived > 0) {
        paymentStatus = 'PARTIAL';
    }
    else if (remainingBalance > 0 && paymentReceived === 0) {
        paymentStatus = 'UNPAID';
    }
    return {
        subtotal,
        itemDiscountTotal,
        subtotalAfterItemDiscount,
        invoiceDiscount,
        taxAmount,
        grandTotal,
        customerAdvanceApplied,
        netAmountDue,
        paymentReceived,
        remainingBalance,
        changeDue,
        paymentStatus,
    };
}
/**
 * Formats a currency amount into Pakistani Rupee style (Rs. 10,000.00)
 */
function formatCurrency(amount, symbol = 'Rs.') {
    const num = typeof amount === 'number' ? amount : Number(amount) || 0;
    return `${symbol} ${num.toLocaleString('en-PK', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;
}
