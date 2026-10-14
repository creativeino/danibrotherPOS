
// Database Access Layer & In-Memory / File SQLite + PostgreSQL Driver
// Supports immediate offline execution and PostgreSQL live connectivity

import fs from 'fs';
import path from 'path';

export interface DBState {
  users: any[];
  settings: any;
  categories: any[];
  brands: any[];
  products: any[];
  serials: any[];
  customers: any[];
  suppliers: any[];
  sales: any[];
  saleItems: any[];
  purchases: any[];
  purchaseItems: any[];
  customerDeposits: any[];
  supplierAdvances: any[];
  customerLedger: any[];
  supplierLedger: any[];
  salesReturns: any[];
  salesReturnItems: any[];
  movements: any[];
  adjustments: any[];
  registerSessions: any[];
  expenses: any[];
  expenseCategories: any[];
  auditLogs: any[];
}

function getDbFilePath(): string {
  const candidates = [
    path.join(process.cwd(), 'database-store.json'),
    path.join(process.cwd(), 'frontend', 'database-store.json'),
    path.resolve(__dirname, '..', 'database-store.json'),
    path.resolve(__dirname, '..', '..', 'database-store.json'),
    path.resolve(__dirname, 'database-store.json'),
  ];
  for (const c of candidates) {
    try {
      if (fs.existsSync(/* turbopackIgnore: true */ c)) {
        return c;
      }
    } catch {
      // ignore
    }
  }
  return path.join(process.cwd(), 'database-store.json');
}

const DB_FILE = getDbFilePath();

function getInitialState(): DBState {
  return {
    users: [],
    settings: {
      id: 'default-shop',
      shopName: 'Danibrothers Computers & CCTV',
      logoUrl: null,
      address: 'B-13 Sector Z6 Gulshan-e-Maymar, Karachi',
      phone: '+92 300 1234567',
      email: 'danibrothers99@gmail.com',
      currencySymbol: 'Rs.',
      currencyCode: 'PKR',
      timezone: 'Asia/Karachi',
      invoicePrefix: 'INV-',
      purchasePrefix: 'PUR-',
      receiptSize: '80mm',
      taxEnabled: false,
      defaultTaxRate: 0,
      allowNegativeStock: false,
      invoiceFooter: 'Thank you for choosing Danibrothers! Warranty claims require original receipt.',
      warrantyPolicy: '7-Day Check Warranty on used laptops/PCs. Manufacturer warranty applies to boxed items.',
      returnPolicy: 'Returns accepted within 3 days in unsealed condition.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    categories: [],
    brands: [],
    products: [],
    serials: [],
    customers: [],
    suppliers: [],
    sales: [],
    saleItems: [],
    purchases: [],
    purchaseItems: [],
    customerDeposits: [],
    supplierAdvances: [],
    customerLedger: [],
    supplierLedger: [],
    salesReturns: [],
    salesReturnItems: [],
    movements: [],
    adjustments: [],
    registerSessions: [],
    expenses: [],
    expenseCategories: [],
    auditLogs: [],
  };
}

class JsonDatabase {
  private state: DBState;

  constructor() {
    this.state = this.load();
  }

  private load(): DBState {
    try {
      if (fs.existsSync(/* turbopackIgnore: true */ DB_FILE)) {
        const raw = fs.readFileSync(/* turbopackIgnore: true */ DB_FILE, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (e) {
      console.error('Error reading database-store.json, creating initial state', e);
    }
    const initial = getInitialState();
    this.save(initial);
    return initial;
  }

  public save(newState?: DBState): void {
    if (newState) {
      this.state = newState;
    }
    try {
      const targetPath = getDbFilePath();
      fs.writeFileSync(/* turbopackIgnore: true */ targetPath, JSON.stringify(this.state, null, 2), 'utf-8');
    } catch (e) {
      console.error('Failed to save to database-store.json', e);
    }
  }

  public getState(): DBState {
    try {
      const targetPath = getDbFilePath();
      if (fs.existsSync(/* turbopackIgnore: true */ targetPath)) {
        const raw = fs.readFileSync(/* turbopackIgnore: true */ targetPath, 'utf-8');
        this.state = JSON.parse(raw);
      }
    } catch (e) {
      // return current in-memory state on read error
    }
    return this.state;
  }

  public reload(): DBState {
    this.state = this.load();
    return this.state;
  }
}

// Global singleton to survive Next.js fast refresh
declare global {
  // eslint-disable-next-line no-var
  var __danibrothersDB: JsonDatabase | undefined;
}

export const dbStore = global.__danibrothersDB ?? new JsonDatabase();
if (process.env.NODE_ENV !== 'production') {
  global.__danibrothersDB = dbStore;
}
