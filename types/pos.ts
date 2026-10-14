// Shared TypeScript types for Danibrothers POS & Inventory System

export type Role = 'ADMIN' | 'MANAGER' | 'CASHIER' | 'INVENTORY_STAFF';

export type ProductUnit = 'PIECE' | 'BOX' | 'PACK' | 'METER' | 'SET' | 'SERVICE';

export type SerialStatus =
  | 'AVAILABLE'
  | 'SOLD'
  | 'RETURNED_CUSTOMER'
  | 'RMA_SUPPLIER'
  | 'DEFECTIVE'
  | 'WRITTEN_OFF';

export type PaymentMethod =
  | 'CASH'
  | 'CARD'
  | 'BANK_TRANSFER'
  | 'CUSTOMER_CREDIT'
  | 'ADVANCE_DEPOSIT';

export type PaymentStatus = 'PAID' | 'PARTIAL' | 'UNPAID';

export type MovementType =
  | 'PURCHASE_RECEIPT'
  | 'SALE_DEDUCTION'
  | 'PURCHASE_RETURN'
  | 'SALE_RETURN'
  | 'MANUAL_ADJUSTMENT'
  | 'DAMAGED_WRITE_OFF'
  | 'OPENING_STOCK'
  | 'TRANSFER';

export type ReturnCondition = 'RESTOCKABLE' | 'DAMAGED_OR_DEFECTIVE';

export type ShiftStatus = 'OPEN' | 'CLOSED';

export interface UserSession {
  id: string;
  username: string;
  fullName: string;
  role: Role;
  email?: string | null;
}

export interface ShopSettingsData {
  id: string;
  shopName: string;
  logoUrl?: string | null;
  address: string;
  phone: string;
  email: string;
  currencySymbol: string;
  currencyCode: string;
  timezone: string;
  invoicePrefix: string;
  purchasePrefix: string;
  receiptSize: '58mm' | '80mm' | 'A4';
  taxEnabled: boolean;
  defaultTaxRate: number;
  allowNegativeStock: boolean;
  invoiceFooter: string;
  warrantyPolicy: string;
  returnPolicy: string;
}

export interface ProductItem {
  id: string;
  name: string;
  sku: string;
  barcode: string;
  brandId?: string | null;
  brandName?: string | null;
  categoryId?: string | null;
  categoryName?: string | null;
  modelNumber?: string | null;
  description?: string | null;
  unit: ProductUnit;
  costPrice: number;
  sellingPrice: number;
  wholesalePrice?: number | null;
  minSellingPrice?: number | null;
  quantityInStock: number;
  reorderLevel: number;
  requiresSerial: boolean;
  warrantyDurationMonths: number;
  taxRatePercent: number;
  active: boolean;
  isService?: boolean;
  supplierId?: string | null;
  supplierName?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProductSerialNumberItem {
  id: string;
  productId: string;
  serialNumber: string;
  status: SerialStatus;
  costPrice: number;
  sellingPrice?: number | null;
  warrantyMonths: number;
  warrantyStartDate?: string | null;
  warrantyEndDate?: string | null;
  purchaseInvoiceId?: string | null;
  salesInvoiceId?: string | null;
}

export interface CartItem {
  productId: string;
  name: string;
  sku: string;
  barcode: string;
  quantity: number;
  unitPrice: number;
  costPrice: number;
  unit: ProductUnit;
  requiresSerial: boolean;
  warrantyDurationMonths: number;
  selectedSerials: string[];
  discountAmount: number; // line discount
  taxPercent: number;
  maxStock: number;
  isService?: boolean;
  serviceNotes?: string | null;
}

export interface CustomerData {
  id: string;
  customerNumber: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  openingBalance: number;
  creditLimit: number;
  depositBalance: number;
  outstandingBalance: number;
  createdAt: string;
}

export interface SupplierData {
  id: string;
  supplierNumber: string;
  name: string;
  companyName?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  openingBalance: number;
  advanceBalance: number;
  outstandingBalance: number;
  createdAt: string;
}

export interface SalesInvoiceView {
  id: string;
  invoiceNumber: string;
  customerId?: string | null;
  customerName?: string | null;
  cashierId: string;
  cashierName: string;
  invoiceDate: string;
  subtotal: number;
  itemDiscountTotal: number;
  invoiceDiscount: number;
  taxAmount: number;
  grandTotal: number;
  customerAdvanceUsed: number;
  netAmountDue: number;
  paymentReceived: number;
  remainingBalance: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  notes?: string | null;
  isVoided: boolean;
  items: Array<{
    id: string;
    productId: string;
    productName: string;
    sku: string;
    quantity: number;
    unitPrice: number;
    unitCost: number;
    lineDiscount: number;
    lineTotal: number;
    serialNumbers?: string | null;
    serviceNotes?: string | null;
    returnedQuantity: number;
  }>;
}
