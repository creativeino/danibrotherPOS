import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { dbStore } from './db';
import { UserSession, Role } from '@/types/pos';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'danibrothers_pos_ultra_secure_jwt_secret_key_2026_super_safe'
);

const SESSION_COOKIE = 'danibrothers_session';

export async function hashPassword(plain: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(plain, salt);
}

export async function verifyPassword(plain: string, hashed: string): Promise<boolean> {
  return bcrypt.compare(plain, hashed);
}

export async function createSessionToken(user: UserSession): Promise<string> {
  return new SignJWT({
    id: user.id,
    username: user.username,
    fullName: user.fullName,
    role: user.role,
    email: user.email,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1d')
    .sign(JWT_SECRET);
}

export async function verifySessionToken(token: string): Promise<UserSession | null> {
  try {
    const verified = await jwtVerify(token, JWT_SECRET);
    const payload = verified.payload as unknown as UserSession;
    return payload;
  } catch {
    return null;
  }
}

export async function getCurrentUser(): Promise<UserSession | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE)?.value;
    if (!token) return null;
    const session = await verifySessionToken(token);
    return session;
  } catch {
    return null;
  }
}

export async function setSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

/**
 * Server-side role permission guard
 */
export async function requireUserWithRoles(allowedRoles: Role[]): Promise<UserSession> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('UNAUTHORIZED: You must be signed in to perform this operation.');
  }
  if (!allowedRoles.includes(user.role)) {
    throw new Error(`FORBIDDEN: Operation requires one of the following roles: ${allowedRoles.join(', ')}`);
  }
  return user;
}
