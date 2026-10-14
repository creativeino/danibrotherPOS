// Automated Calculation and Integrity Test Suite for Danibrothers POS
import { calculateInvoiceTotals, roundToCents } from './lib/calculations';

function runTests() {
  console.log('--- RUNNING DANIBROTHERS POS VERIFICATION SUITE ---');
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, desc: string) {
    if (condition) {
      console.log(`[PASS] ${desc}`);
      passed++;
    } else {
      console.error(`[FAIL] ${desc}`);
      failed++;
    }
  }

  // TEST 1: Standard line total calculation without discounts
  {
    const res = calculateInvoiceTotals({
      items: [
        { quantity: 2, unitPrice: 4800 }, // 9,600
        { quantity: 1, unitPrice: 3600 }, // 3,600
      ],
      invoiceDiscountAmount: 0,
      taxRatePercent: 0,
      paymentReceived: 13200,
    });
    assert(res.subtotal === 13200, 'Subtotal correctly equals 13,200');
    assert(res.grandTotal === 13200, 'Grand total correctly equals 13,200');
    assert(res.netAmountDue === 13200, 'Net amount due equals 13,200');
    assert(res.paymentStatus === 'PAID', 'Payment status is PAID');
    assert(res.remainingBalance === 0, 'Remaining balance is 0');
  }

  // TEST 2: Line discount & Invoice-level discount sequence
  {
    const res = calculateInvoiceTotals({
      items: [
        { quantity: 1, unitPrice: 100000, lineDiscount: 2000 }, // line total: 98,000
      ],
      invoiceDiscountAmount: 1000, // invoice discount: 1,000
      taxRatePercent: 0,
      customerAdvanceApplied: 10000, // advance: 10,000
      paymentReceived: 50000, // payment: 50,000
    });
    // Expected: Subtotal 100,000; Item Disc: 2,000; Subtotal after item disc: 98,000;
    // Invoice Disc: 1,000; Grand Total: 97,000; Advance Applied: 10,000;
    // Net Due: 87,000; Payment: 50,000; Remaining: 37,000
    assert(res.subtotal === 100000, 'Test 2 Subtotal matches Rs. 100,000');
    assert(res.itemDiscountTotal === 2000, 'Test 2 Item discount is Rs. 2,000');
    assert(res.invoiceDiscount === 1000, 'Test 2 Invoice discount is Rs. 1,000');
    assert(res.grandTotal === 97000, 'Test 2 Grand total matches Rs. 97,000');
    assert(res.customerAdvanceApplied === 10000, 'Test 2 Customer advance applied matches Rs. 10,000');
    assert(res.netAmountDue === 87000, 'Test 2 Net amount due matches Rs. 87,000');
    assert(res.paymentReceived === 50000, 'Test 2 Payment received matches Rs. 50,000');
    assert(res.remainingBalance === 37000, 'Test 2 Remaining balance matches Rs. 37,000');
    assert(res.paymentStatus === 'PARTIAL', 'Test 2 Payment status is PARTIAL');
  }

  // TEST 3: Preventing discount from exceeding total value
  {
    const res = calculateInvoiceTotals({
      items: [{ quantity: 1, unitPrice: 5000 }],
      invoiceDiscountAmount: 90000, // Excessive discount attempt
      taxRatePercent: 0,
      paymentReceived: 0,
    });
    assert(res.invoiceDiscount === 5000, 'Excessive discount capped to available subtotal');
    assert(res.grandTotal === 0, 'Grand total gracefully floors at 0');
    assert(res.netAmountDue === 0, 'Net amount due is 0');
  }

  // TEST 4: Advance cannot exceed grand total
  {
    const res = calculateInvoiceTotals({
      items: [{ quantity: 1, unitPrice: 20000 }],
      customerAdvanceApplied: 35000, // Customer has 35,000 on account but bill is only 20,000
      paymentReceived: 0,
    });
    assert(res.customerAdvanceApplied === 20000, 'Advance application capped to grand total');
    assert(res.netAmountDue === 0, 'Net amount due is 0 when fully covered by deposit');
    assert(res.paymentStatus === 'PAID', 'Status is PAID via deposit');
  }

  console.log(`--- TEST COMPLETE: ${passed} passed, ${failed} failed ---`);
  if (failed > 0) process.exit(1);
}

runTests();
