import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { expenseSchema } from '@/lib/validations';
import { getCurrentUser } from '@/lib/auth';
import { roundToCents } from '@/lib/calculations';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [expenses, categories] = await Promise.all([
      prisma.expense.findMany({
        include: {
          category: true,
          creator: true,
        },
        orderBy: { expenseDate: 'desc' },
      }),
      prisma.expenseCategory.findMany({
        orderBy: { name: 'asc' },
      }),
    ]);

    const mappedExpenses = expenses.map(e => ({
      id: e.id,
      expenseNumber: e.expenseNumber,
      expenseCategoryId: e.expenseCategoryId,
      categoryName: e.category?.name ?? 'General',
      creatorName: e.creator?.fullName ?? 'Staff',
      title: e.title,
      description: e.description,
      amount: Number(e.amount),
      paymentMethod: e.paymentMethod,
      expenseDate: e.expenseDate.toISOString(),
      receiptRef: e.receiptRef,
      createdAt: e.createdAt.toISOString(),
    }));

    return NextResponse.json({
      success: true,
      expenses: mappedExpenses,
      categories,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    let creatorId = user?.id;

    if (!creatorId) {
      const firstUser = await prisma.user.findFirst({ where: { active: true } });
      creatorId = firstUser?.id;
    }

    if (!creatorId) {
      return NextResponse.json({ success: false, error: 'User authentication required' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = expenseSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || 'Invalid expense data' },
        { status: 400 }
      );
    }

    const amount = roundToCents(parsed.data.amount);

    // Ensure category exists
    let category = await prisma.expenseCategory.findUnique({
      where: { id: parsed.data.expenseCategoryId },
    });
    if (!category) {
      category = await prisma.expenseCategory.findFirst();
      if (!category) {
        category = await prisma.expenseCategory.create({
          data: { name: 'General Utilities', description: 'Default category' },
        });
      }
    }

    const expenseCount = await prisma.expense.count();
    const expenseNumber = `EXP-${String(expenseCount + 1).padStart(5, '0')}`;

    const expense = await prisma.expense.create({
      data: {
        expenseNumber,
        expenseCategoryId: category.id,
        creatorId,
        title: parsed.data.title,
        description: parsed.data.description || null,
        amount,
        paymentMethod: (parsed.data.paymentMethod as any) || 'CASH',
        expenseDate: new Date(),
      },
      include: {
        category: true,
      },
    });

    try {
      await prisma.auditLog.create({
        data: {
          userId: creatorId,
          action: 'EXPENSE_LOGGED',
          entityType: 'Expense',
          entityId: expense.id,
          details: JSON.stringify({ expenseNumber, title: expense.title, amount }),
        },
      });
    } catch {
      // ignore
    }

    return NextResponse.json({
      success: true,
      expense: {
        ...expense,
        amount: Number(expense.amount),
        categoryName: expense.category.name,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Server error' }, { status: 400 });
  }
}
