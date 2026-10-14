import { z } from 'zod';

export const loginSchema = z.object({
  username: z.string().min(2, 'Username is required'),
  password: z.string().min(4, 'Password must be at least 4 characters'),
});

export const productSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, 'Product name is required'),
  sku: z.string().min(2, 'SKU is required'),
  barcode: z.string().min(2, 'Barcode is required'),
  brandId: z.string().nullable().optional(),
  categoryId: z.string().nullable().optional(),
  supplierId: z.string().nullable().optional(),
  modelNumber: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  unit: z.enum(['PIECE', 'BOX', 'PACK', 'METER', 'SET']).default('PIECE'),
  costPrice: z.number().min(0, 'Cost price cannot be negative'),
  sellingPrice: z.number().min(0, 'Selling price cannot be negative'),
  wholesalePrice: z.number().nullable().optional(),
  minSellingPrice: z.number().nullable().optional(),
  quantityInStock: z.number().int().default(0),
  reorderLevel: z.number().int().default(5),
  requiresSerial: z.boolean().default(false),
  warrantyDurationMonths: z.number().int().min(0).default(0),
  taxRatePercent: z.number().min(0).default(0),
  active: z.boolean().default(true),
});

export const supplierPaymentSchema = z.object({
  supplierId: z.string().min(1, 'Supplier is required'),
  amount: z.number().positive('Payment amount must be greater than zero'),
  paymentMethod: z.enum(['CASH', 'CARD', 'BANK_TRANSFER', 'CHEQUE']).default('CASH'),
  reference: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export const checkoutItemSchema = z.object({
  productId: z.string(),
  name: z.string().optional(),
  quantity: z.number().int().positive('Quantity must be greater than zero'),
  unitPrice: z.number().min(0),
  lineDiscount: z.number().min(0).default(0),
  selectedSerials: z.array(z.string()).default([]),
  isService: z.boolean().optional(),
  serviceNotes: z.string().nullable().optional(),
});

export const checkoutSchema = z.object({
  customerId: z.string().nullable().optional(),
  customerName: z
    .string()
    .trim()
    .min(2, 'Customer name is required and must be at least 2 characters')
    .refine(
      name => {
        const lower = name.toLowerCase().trim();
        return lower !== 'walk-in customer' && lower !== 'walk in customer';
      },
      { message: 'Please enter actual customer name (generic "Walk-in Customer" is not allowed)' }
    ),
  customerPhone: z.string().nullable().optional(),
  items: z.array(checkoutItemSchema).min(1, 'Cart cannot be empty'),
  invoiceDiscountAmount: z.number().min(0).default(0),
  taxRatePercent: z.number().min(0).default(0),
  customerAdvanceApplied: z.number().min(0).default(0),
  paymentReceived: z.number().min(0).default(0),
  paymentMethod: z.enum(['CASH', 'CARD', 'BANK_TRANSFER', 'CUSTOMER_CREDIT', 'ADVANCE_DEPOSIT']).default('CASH'),
  notes: z.string().nullable().optional(),
});

export const customerSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, 'Customer name is required'),
  phone: z.string().nullable().optional(),
  email: z.string().email('Invalid email').nullable().optional().or(z.literal('')),
  address: z.string().nullable().optional(),
  openingBalance: z.number().default(0),
  creditLimit: z.number().default(0),
});

export const supplierSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, 'Supplier name is required'),
  companyName: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  email: z.string().email('Invalid email').nullable().optional().or(z.literal('')),
  address: z.string().nullable().optional(),
  openingBalance: z.number().default(0),
});

export const purchaseItemSchema = z.object({
  productId: z.string(),
  quantity: z.number().int().positive(),
  unitCost: z.number().min(0),
  lineDiscount: z.number().min(0).default(0),
  serialNumbers: z.array(z.string()).default([]),
});

export const purchaseSchema = z.object({
  supplierId: z.string(),
  supplierInvoiceRef: z.string().nullable().optional(),
  items: z.array(purchaseItemSchema).min(1, 'Purchase items required'),
  discountTotal: z.number().min(0).default(0),
  taxAmount: z.number().min(0).default(0),
  shippingCost: z.number().min(0).default(0),
  supplierAdvanceUsed: z.number().min(0).default(0),
  amountPaid: z.number().min(0).default(0),
  notes: z.string().nullable().optional(),
});

export const customerDepositSchema = z.object({
  customerId: z.string(),
  amount: z.number().positive('Deposit amount must be greater than zero'),
  paymentMethod: z.enum(['CASH', 'CARD', 'BANK_TRANSFER']).default('CASH'),
  notes: z.string().nullable().optional(),
});

export const supplierAdvanceSchema = z.object({
  supplierId: z.string(),
  amount: z.number().positive('Advance amount must be greater than zero'),
  paymentMethod: z.enum(['CASH', 'CARD', 'BANK_TRANSFER']).default('CASH'),
  notes: z.string().nullable().optional(),
});

export const salesReturnSchema = z.object({
  salesInvoiceId: z.string(),
  refundMethod: z.enum(['CASH', 'CARD', 'BANK_TRANSFER', 'CUSTOMER_CREDIT']).default('CASH'),
  reason: z.string().min(2, 'Return reason is required'),
  items: z.array(z.object({
    salesInvoiceItemId: z.string(),
    productId: z.string(),
    quantity: z.number().int().positive(),
    condition: z.enum(['RESTOCKABLE', 'DAMAGED_OR_DEFECTIVE']).default('RESTOCKABLE'),
    serialNumber: z.string().nullable().optional(),
  })).min(1, 'Return items required'),
});

export const expenseSchema = z.object({
  expenseCategoryId: z.string(),
  amount: z.number().positive('Amount must be positive'),
  paymentMethod: z.enum(['CASH', 'CARD', 'BANK_TRANSFER']).default('CASH'),
  title: z.string().min(2, 'Expense title is required'),
  description: z.string().nullable().optional(),
  receiptRef: z.string().nullable().optional(),
});
