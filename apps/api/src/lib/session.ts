const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export function generateSessionId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

export function generateUserId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

export function getSessionExpiry(): string {
  return new Date(Date.now() + SESSION_DURATION_MS).toISOString();
}

export function isSessionExpired(expiresAt: string): boolean {
  return new Date(expiresAt) < new Date();
}

export function createSessionCookie(sessionId: string, expiresAt: string): string {
  const expires = new Date(expiresAt).toUTCString();
  return `session=${sessionId}; Path=/; HttpOnly; SameSite=Lax; Expires=${expires}`;
}

export function createLogoutCookie(): string {
  return 'session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0';
}

export function getSessionIdFromCookie(cookie: string | null): string | null {
  if (!cookie) return null;
  const match = cookie.match(/session=([^;]+)/);
  return match ? match[1] : null;
}
