// Precision Financial Math Utility for Retail POS
// Avoids IEEE 754 floating-point errors by doing intermediate rounding and minor unit math

export interface CalculationInputItem {
  quantity: number;
  unitPrice: number;
  lineDiscount?: number;
}

export interface InvoiceCalculationInput {
  items: CalculationInputItem[];
  invoiceDiscountAmount?: number;
  taxRatePercent?: number;
  customerAdvanceApplied?: number;
  paymentReceived?: number;
}

export interface InvoiceCalculationResult {
  subtotal: number;
  itemDiscountTotal: number;
  subtotalAfterItemDiscount: number;
  invoiceDiscount: number;
  taxAmount: number;
  grandTotal: number;
  customerAdvanceApplied: number;
  netAmountDue: number;
  paymentReceived: number;
  remainingBalance: number;
  changeDue: number;
  paymentStatus: 'PAID' | 'PARTIAL' | 'UNPAID';
}

/**
 * Rounds a number strictly to two decimal places
 */
export function roundToCents(amount: number): number {
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
export function calculateInvoiceTotals(
  input: InvoiceCalculationInput
): InvoiceCalculationResult {
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
  const subtotalAfterItemDiscount = Math.max(
    0,
    roundToCents(subtotal - itemDiscountTotal)
  );

  // Apply invoice-level discount, capped by subtotalAfterItemDiscount
  const requestedInvoiceDiscount = Math.max(
    0,
    input.invoiceDiscountAmount || 0
  );
  const invoiceDiscount = roundToCents(
    Math.min(subtotalAfterItemDiscount, requestedInvoiceDiscount)
  );

  const taxableBase = roundToCents(subtotalAfterItemDiscount - invoiceDiscount);
  const taxRate = Math.max(0, input.taxRatePercent || 0);
  const taxAmount = roundToCents((taxableBase * taxRate) / 100);

  const grandTotal = roundToCents(taxableBase + taxAmount);

  // Customer advance applied: cannot exceed grand total
  const requestedAdvance = Math.max(0, input.customerAdvanceApplied || 0);
  const customerAdvanceApplied = roundToCents(
    Math.min(grandTotal, requestedAdvance)
  );

  const netAmountDue = roundToCents(grandTotal - customerAdvanceApplied);

  const paymentReceived = roundToCents(
    Math.max(0, input.paymentReceived || 0)
  );

  let changeDue = 0;
  let remainingBalance = 0;

  if (paymentReceived >= netAmountDue) {
    changeDue = roundToCents(paymentReceived - netAmountDue);
    remainingBalance = 0;
  } else {
    changeDue = 0;
    remainingBalance = roundToCents(netAmountDue - paymentReceived);
  }

  let paymentStatus: 'PAID' | 'PARTIAL' | 'UNPAID' = 'PAID';
  if (remainingBalance > 0 && paymentReceived > 0) {
    paymentStatus = 'PARTIAL';
  } else if (remainingBalance > 0 && paymentReceived === 0) {
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
export function formatCurrency(
  amount: number | string | undefined | null,
  symbol = 'Rs.'
): string {
  const num = typeof amount === 'number' ? amount : Number(amount) || 0;
  return `${symbol} ${num.toLocaleString('en-PK', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Standard Karachi Timezone (Asia/Karachi - UTC+5) Date and Time Formatter
 */
export function formatDateTimePK(
  dateInput: Date | string | number | null | undefined,
  options?: { includeSeconds?: boolean; dateStyle?: 'short' | 'medium' | 'long' }
): string {
  if (!dateInput) return '-';
  const d = typeof dateInput === 'object' && dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (isNaN(d.getTime())) return '-';

  return d.toLocaleString('en-PK', {
    timeZone: 'Asia/Karachi',
    year: 'numeric',
    month: options?.dateStyle === 'long' ? 'long' : (options?.dateStyle === 'medium' ? 'short' : '2-digit'),
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    ...(options?.includeSeconds ? { second: '2-digit' } : {}),
    hour12: true,
  });
}

/**
 * Karachi Date only formatter (DD/MM/YYYY)
 */
export function formatDatePK(dateInput: Date | string | number | null | undefined): string {
  if (!dateInput) return '-';
  const d = typeof dateInput === 'object' && dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (isNaN(d.getTime())) return '-';

  return d.toLocaleDateString('en-PK', {
    timeZone: 'Asia/Karachi',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

/**
 * Karachi Time only formatter (hh:mm AM/PM)
 */
export function formatTimePK(
  dateInput: Date | string | number | null | undefined,
  includeSeconds = false
): string {
  if (!dateInput) return '-';
  const d = typeof dateInput === 'object' && dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (isNaN(d.getTime())) return '-';

  return d.toLocaleTimeString('en-PK', {
    timeZone: 'Asia/Karachi',
    hour: '2-digit',
    minute: '2-digit',
    ...(includeSeconds ? { second: '2-digit' } : {}),
    hour12: true,
  });
}

