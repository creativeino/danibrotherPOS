import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPassword, createSessionToken, setSessionCookie } from '@/lib/auth';
import { loginSchema } from '@/lib/validations';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.issues[0]?.message }, { status: 400 });
    }

    const inputUser = parsed.data.username.toLowerCase().trim();

    // Find user in PostgreSQL
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username: { equals: inputUser, mode: 'insensitive' } },
          // Fallback: if username is 'admin', try 'danish'
          ...(inputUser === 'admin' ? [{ id: 'usr-danish' }] : []),
        ],
        active: true,
      },
    });

    if (!user) {
      return NextResponse.json({ success: false, error: 'Invalid username or password' }, { status: 401 });
    }

    const valid = await verifyPassword(parsed.data.password, user.passwordHash);
    if (!valid) {
      return NextResponse.json({ success: false, error: 'Invalid username or password' }, { status: 401 });
    }

    const token = await createSessionToken({
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      role: user.role as any,
      email: user.email ?? undefined,
    });

    await setSessionCookie(token);

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        role: user.role,
      },
    });
  } catch (e: any) {
    console.error('Login error:', e);
    return NextResponse.json({ success: false, error: e.message || 'Authentication error' }, { status: 500 });
  }
}
