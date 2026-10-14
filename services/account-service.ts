import { dbStore } from '@/lib/db';
import { ensureDatabaseSeeded } from '@/lib/init';
import { roundToCents } from '@/lib/calculations';

ensureDatabaseSeeded();

export class AccountService {
  static getCustomers() {
    const state = dbStore.getState();
    return [...state.customers];
  }

  static getSuppliers() {
    const state = dbStore.getState();
    return [...state.suppliers];
  }

  static createSupplier(input: {
    name: string;
    companyName?: string | null;
    phone?: string | null;
    email?: string | null;
    address?: string | null;
    openingBalance?: number;
  }) {
    const state = dbStore.getState();
    const name = input.name.trim();
    if (!name) throw new Error('Supplier name is required');

    const supplierCount = state.suppliers.length + 1;
    const supplierNumber = `SUP-${String(supplierCount).padStart(4, '0')}`;
    const id = `sup-${Date.now()}`;
    const nowIso = new Date().toISOString();
    const opening = roundToCents(Number(input.openingBalance) || 0);

    const newSupplier = {
      id,
      supplierNumber,
      name,
      companyName: input.companyName?.trim() || null,
      phone: input.phone?.trim() || null,
      email: input.email?.trim() || null,
      address: input.address?.trim() || null,
      openingBalance: opening,
      advanceBalance: 0,
      outstandingBalance: opening,
      createdAt: nowIso,
    };

    state.suppliers.push(newSupplier);

    if (opening > 0) {
      state.supplierLedger.push({
        id: `sld-${Date.now()}`,
        supplierId: id,
        entryDate: nowIso,
        reference: 'OPENING',
        description: 'Opening Balance (Payable to Supplier)',
        debit: 0,
        credit: opening,
        balanceAfter: opening,
        createdAt: nowIso,
      });
    }

    dbStore.save(state);
    return newSupplier;
  }

  static createCustomer(input: {
    name: string;
    phone?: string | null;
    email?: string | null;
    address?: string | null;
    openingBalance?: number;
    creditLimit?: number;
  }) {
    const state = dbStore.getState();
    const name = input.name.trim();
    if (!name) throw new Error('Customer name is required');

    const customerCount = state.customers.length + 1;
    const customerNumber = `CUST-${String(customerCount).padStart(4, '0')}`;
    const id = `cust-${Date.now()}`;
    const nowIso = new Date().toISOString();
    const opening = roundToCents(Number(input.openingBalance) || 0);
    const creditLimit = roundToCents(Number(input.creditLimit) || 0);

    const newCustomer = {
      id,
      customerNumber,
      name,
      phone: input.phone?.trim() || null,
      email: input.email?.trim() || null,
      address: input.address?.trim() || null,
      openingBalance: opening,
      creditLimit,
      depositBalance: 0,
      outstandingBalance: opening,
      createdAt: nowIso,
    };

    state.customers.push(newCustomer);

    if (opening > 0) {
      state.customerLedger.push({
        id: `cld-${Date.now()}`,
        customerId: id,
        entryDate: nowIso,
        reference: 'OPENING',
        description: 'Opening Balance (Receivable from Customer)',
        debit: opening,
        credit: 0,
        balanceAfter: opening,
        createdAt: nowIso,
      });
    }

    dbStore.save(state);
    return newCustomer;
  }

  static addCustomerDeposit(input: {
    customerId: string;
    amount: number;
    paymentMethod: 'CASH' | 'CARD' | 'BANK_TRANSFER';
    notes?: string | null;
    userId: string;
  }) {
    const state = dbStore.getState();
    const customer = state.customers.find(c => c.id === input.customerId);
    if (!customer) throw new Error('Customer not found');

    const receiptCount = state.customerDeposits.length + 1;
    const receiptNumber = `DEP-${String(receiptCount).padStart(5, '0')}`;
    const nowIso = new Date().toISOString();

    customer.depositBalance = roundToCents(customer.depositBalance + input.amount);

    const deposit = {
      id: `dep-${Date.now()}`,
      receiptNumber,
      customerId: customer.id,
      customerName: customer.name,
      amount: input.amount,
      paymentMethod: input.paymentMethod,
      notes: input.notes || null,
      createdAt: nowIso,
    };

    state.customerDeposits.push(deposit);

    // Ledger record
    state.customerLedger.push({
      id: `cld-${Date.now()}`,
      customerId: customer.id,
      entryDate: nowIso,
      reference: receiptNumber,
      description: `Advance Deposit Received (${input.paymentMethod})`,
      debit: 0,
      credit: input.amount,
      balanceAfter: customer.outstandingBalance,
      createdAt: nowIso,
    });

    // If Cash, increment active register cashDepositsTotal
    const register = state.registerSessions.find(r => r.status === 'OPEN');
    if (register && input.paymentMethod === 'CASH') {
      register.cashDepositsTotal = roundToCents(register.cashDepositsTotal + input.amount);
      register.expectedClosingCash = roundToCents(
        register.openingFloat +
        register.cashSalesTotal +
        register.cashDepositsTotal -
        register.cashExpensesTotal -
        register.cashRefundsTotal
      );
    }

    dbStore.save(state);
    return deposit;
  }

  static addSupplierAdvance(input: {
    supplierId: string;
    amount: number;
    paymentMethod: 'CASH' | 'CARD' | 'BANK_TRANSFER';
    notes?: string | null;
    userId: string;
  }) {
    const state = dbStore.getState();
    const supplier = state.suppliers.find(s => s.id === input.supplierId);
    if (!supplier) throw new Error('Supplier not found');

    const voucherCount = state.supplierAdvances.length + 1;
    const voucherNumber = `ADV-${String(voucherCount).padStart(5, '0')}`;
    const nowIso = new Date().toISOString();

    supplier.advanceBalance = roundToCents(supplier.advanceBalance + input.amount);

    const advance = {
      id: `adv-${Date.now()}`,
      voucherNumber,
      supplierId: supplier.id,
      supplierName: supplier.name,
      amount: input.amount,
      paymentMethod: input.paymentMethod,
      notes: input.notes || null,
      createdAt: nowIso,
    };

    state.supplierAdvances.push(advance);

    // Ledger record
    state.supplierLedger.push({
      id: `sld-${Date.now()}`,
      supplierId: supplier.id,
      entryDate: nowIso,
      reference: voucherNumber,
      description: `Advance Payment Paid to Supplier (${input.paymentMethod})`,
      debit: input.amount,
      credit: 0,
      balanceAfter: supplier.outstandingBalance,
      createdAt: nowIso,
    });

    dbStore.save(state);
    return advance;
  }

  static paySupplier(input: {
    supplierId: string;
    amount: number;
    paymentMethod: 'CASH' | 'CARD' | 'BANK_TRANSFER' | 'CHEQUE';
    reference?: string | null;
    notes?: string | null;
    userId?: string;
  }) {
    const state = dbStore.getState();
    const supplier = state.suppliers.find(s => s.id === input.supplierId);
    if (!supplier) throw new Error('Supplier not found');

    const paymentAmount = roundToCents(Number(input.amount));
    if (paymentAmount <= 0) throw new Error('Payment amount must be greater than zero');

    const paymentCount = (state.supplierLedger.filter(l => l.reference?.startsWith('PAY-')).length || 0) + 1;
    const paymentRef = input.reference?.trim() || `PAY-${String(paymentCount).padStart(5, '0')}`;
    const nowIso = new Date().toISOString();

    // Deduct payable balance owed to supplier
    supplier.outstandingBalance = roundToCents(Math.max(0, supplier.outstandingBalance - paymentAmount));

    // Ledger record (Debit reduces payable balance)
    state.supplierLedger.push({
      id: `sld-${Date.now()}`,
      supplierId: supplier.id,
      entryDate: nowIso,
      reference: paymentRef,
      description: `Payment to Distributor (${input.paymentMethod})${input.notes ? ` - ${input.notes}` : ''}`,
      debit: paymentAmount,
      credit: 0,
      balanceAfter: supplier.outstandingBalance,
      createdAt: nowIso,
    });

    // If Cash payment, deduct from active register cash drawer
    const register = state.registerSessions.find(r => r.status === 'OPEN');
    if (register && input.paymentMethod === 'CASH') {
      register.cashExpensesTotal = roundToCents(register.cashExpensesTotal + paymentAmount);
      register.expectedClosingCash = roundToCents(
        register.openingFloat +
        register.cashSalesTotal +
        register.cashDepositsTotal -
        register.cashExpensesTotal -
        register.cashRefundsTotal
      );
    }

    dbStore.save(state);
    return { success: true, newBalance: supplier.outstandingBalance };
  }

  static updateSupplier(
    id: string,
    data: {
      name?: string;
      companyName?: string | null;
      phone?: string | null;
      email?: string | null;
      address?: string | null;
      outstandingBalance?: number;
    }
  ) {
    const state = dbStore.getState();
    const supplier = state.suppliers.find(s => s.id === id);
    if (!supplier) throw new Error('Supplier not found');

    if (data.name !== undefined) supplier.name = data.name.trim();
    if (data.companyName !== undefined) supplier.companyName = data.companyName ? data.companyName.trim() : null;
    if (data.phone !== undefined) supplier.phone = data.phone ? data.phone.trim() : null;
    if (data.email !== undefined) supplier.email = data.email ? data.email.trim() : null;
    if (data.address !== undefined) supplier.address = data.address ? data.address.trim() : null;
    if (data.outstandingBalance !== undefined) supplier.outstandingBalance = roundToCents(Number(data.outstandingBalance));

    dbStore.save(state);
    return supplier;
  }

  static deleteSupplier(id: string) {
    const state = dbStore.getState();
    const index = state.suppliers.findIndex(s => s.id === id);
    if (index === -1) throw new Error('Supplier not found');

    // Remove supplier
    state.suppliers.splice(index, 1);
    // Remove supplier ledger entries
    state.supplierLedger = (state.supplierLedger || []).filter(l => l.supplierId !== id);
    // Remove supplier advances
    state.supplierAdvances = (state.supplierAdvances || []).filter(a => a.supplierId !== id);

    dbStore.save(state);
    return { success: true };
  }

  static getCustomerLedger(customerId: string) {
    const state = dbStore.getState();
    return state.customerLedger.filter(l => l.customerId === customerId);
  }

  static getSupplierLedger(supplierId: string) {
    const state = dbStore.getState();
    return state.supplierLedger.filter(l => l.supplierId === supplierId);
  }
}
