import React from 'react';
import { AccountService } from '@/services/account-service';
import { NewSupplierModal } from '@/components/NewSupplierModal';
import { PaySupplierModal } from '@/components/PaySupplierModal';
import { SuppliersManagerTable } from '@/components/SuppliersManagerTable';

export const dynamic = 'force-dynamic';

export default async function SuppliersPage() {
  const suppliers = AccountService.getSuppliers();

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Suppliers & Distributors</h1>
          <p className="text-xs text-slate-500 font-medium">
            Manage product suppliers, distributor bills, edit details, and payable balances
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <PaySupplierModal
            allSuppliers={suppliers.map(s => ({ id: s.id, name: s.name, outstandingBalance: s.outstandingBalance }))}
            buttonLabel="Pay Supplier Bill"
          />
          <NewSupplierModal />
        </div>
      </div>

      <SuppliersManagerTable initialSuppliers={suppliers} />
    </div>
  );
}

