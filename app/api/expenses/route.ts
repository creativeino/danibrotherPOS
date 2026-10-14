import { NextRequest, NextResponse } from 'next/server';
import { dbStore } from '@/lib/db';
import { expenseSchema } from '@/lib/validations';
import { getCurrentUser } from '@/lib/auth';
import { roundToCents } from '@/lib/calculations';

export async function GET() {
  try {
    const state = dbStore.getState();
    return NextResponse.json({
      success: true,
      expenses: [...state.expenses].reverse(),
      categories: state.expenseCategories,
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

    const parsed = expenseSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || 'Invalid expense data' },
        { status: 400 }
      );
    }

    const state = dbStore.getState();
    const nowIso = new Date().toISOString();
    const expenseCount = state.expenses.length + 1;
    const expenseNumber = `EXP-${String(expenseCount).padStart(5, '0')}`;
    const amount = roundToCents(parsed.data.amount);

    const expense = {
      id: `exp-${Date.now()}`,
      expenseNumber,
      expenseCategoryId: parsed.data.expenseCategoryId,
      title: parsed.data.title,
      description: parsed.data.description || null,
      amount,
      paymentMethod: parsed.data.paymentMethod,
      expenseDate: nowIso,
      createdById: userId,
      createdAt: nowIso,
    };

    state.expenses.push(expense);

    // If Cash, deduct from active cash register session
    const register = state.registerSessions.find(r => r.status === 'OPEN');
    if (register && parsed.data.paymentMethod === 'CASH') {
      register.cashExpensesTotal = roundToCents(register.cashExpensesTotal + amount);
      register.expectedClosingCash = roundToCents(
        register.openingFloat +
        register.cashSalesTotal +
        register.cashDepositsTotal -
        register.cashExpensesTotal -
        register.cashRefundsTotal
      );
    }

    state.auditLogs.push({
      id: `aud-${Date.now()}`,
      userId,
      action: 'EXPENSE_LOGGED',
      entityType: 'Expense',
      entityId: expense.id,
      details: JSON.stringify({ expenseNumber, title: expense.title, amount }),
      createdAt: nowIso,
    });

    dbStore.save(state);

    return NextResponse.json({ success: true, expense });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Server error' }, { status: 400 });
  }
}
