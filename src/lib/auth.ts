import { createHmac, timingSafeEqual } from 'node:crypto';
import { getCollection } from 'astro:content';
import type { AstroCookies } from 'astro';

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: 'editor' | 'contributor';
}

export const COOKIE = 'fb_session';
const SECRET = process.env.SESSION_SECRET ?? 'dev-only-secret-change-me';
const sign = (v: string) => createHmac('sha256', SECRET).update(v).digest('base64url');

function publicUser(data: SessionUser & { password: string }): SessionUser {
  return { id: data.id, name: data.name, email: data.email, role: data.role };
}

export async function listUsers(): Promise<SessionUser[]> {
  const rows = await getCollection('users');
  return rows.map(({ data }) => publicUser(data));
}

export async function authenticate(email: string, password: string): Promise<SessionUser | null> {
  const rows = await getCollection('users');
  const hit = rows.find((r) => r.data.email.toLowerCase() === email.trim().toLowerCase() && r.data.password === password);
  if (!hit) return null;
  return publicUser(hit.data);
}

export function startSession(cookies: AstroCookies, userId: string) {
  const payload = `${userId}.${Date.now() + 7 * 864e5}`;
  cookies.set(COOKIE, `${payload}.${sign(payload)}`, {
    httpOnly: true, sameSite: 'lax', path: '/', maxAge: 7 * 86400,
  });
}

export async function readSession(cookies: AstroCookies): Promise<SessionUser | null> {
  const raw = cookies.get(COOKIE)?.value;
  if (!raw) return null;
  const i = raw.lastIndexOf('.');
  const payload = raw.slice(0, i);
  const sig = raw.slice(i + 1);
  const a = Buffer.from(sig), b = Buffer.from(sign(payload));
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  const [userId, exp] = payload.split('.');
  if (Number(exp) < Date.now()) return null;
  return (await listUsers()).find((u) => u.id === userId) ?? null;
}

export const endSession = (cookies: AstroCookies) => cookies.delete(COOKIE, { path: '/' });
