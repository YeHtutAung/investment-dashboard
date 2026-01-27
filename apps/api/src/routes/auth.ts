import { Hono } from 'hono';
import { registerSchema, loginSchema, errorCodes } from 'shared';
import { hashPassword, verifyPassword } from '../lib/password';
import {
  generateSessionId,
  generateUserId,
  getSessionExpiry,
  createSessionCookie,
  createLogoutCookie,
  getSessionIdFromCookie,
  isSessionExpired,
} from '../lib/session';

type Bindings = {
  DB: D1Database;
};

const auth = new Hono<{ Bindings: Bindings }>();

// POST /auth/register
auth.post('/register', async (c) => {
  const body = await c.req.json();
  const parsed = registerSchema.safeParse(body);

  if (!parsed.success) {
    return c.json(
      { success: false, error: { code: errorCodes.VALIDATION_ERROR, message: parsed.error.errors[0].message } },
      400
    );
  }

  const { email, password, name } = parsed.data;

  // Check if email exists
  const existing = await c.env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(email).first();
  if (existing) {
    return c.json(
      { success: false, error: { code: errorCodes.EMAIL_EXISTS, message: 'Email already registered' } },
      409
    );
  }

  const userId = generateUserId();
  const passwordHash = await hashPassword(password);

  await c.env.DB.prepare(
    'INSERT INTO users (id, email, name, password_hash, provider) VALUES (?, ?, ?, ?, ?)'
  ).bind(userId, email, name, passwordHash, 'email').run();

  // Create session
  const sessionId = generateSessionId();
  const expiresAt = getSessionExpiry();

  await c.env.DB.prepare(
    'INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)'
  ).bind(sessionId, userId, expiresAt).run();

  c.header('Set-Cookie', createSessionCookie(sessionId, expiresAt));

  return c.json({
    success: true,
    data: { user: { id: userId, email, name, provider: 'email' } },
  }, 201);
});

// POST /auth/login
auth.post('/login', async (c) => {
  const body = await c.req.json();
  const parsed = loginSchema.safeParse(body);

  if (!parsed.success) {
    return c.json(
      { success: false, error: { code: errorCodes.VALIDATION_ERROR, message: parsed.error.errors[0].message } },
      400
    );
  }

  const { email, password } = parsed.data;

  const user = await c.env.DB.prepare(
    'SELECT id, email, name, password_hash, provider FROM users WHERE email = ?'
  ).bind(email).first<{ id: string; email: string; name: string; password_hash: string | null; provider: string }>();

  if (!user || !user.password_hash) {
    return c.json(
      { success: false, error: { code: errorCodes.INVALID_CREDENTIALS, message: 'Invalid email or password' } },
      401
    );
  }

  const valid = await verifyPassword(password, user.password_hash);
  if (!valid) {
    return c.json(
      { success: false, error: { code: errorCodes.INVALID_CREDENTIALS, message: 'Invalid email or password' } },
      401
    );
  }

  // Create session
  const sessionId = generateSessionId();
  const expiresAt = getSessionExpiry();

  await c.env.DB.prepare(
    'INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)'
  ).bind(sessionId, user.id, expiresAt).run();

  c.header('Set-Cookie', createSessionCookie(sessionId, expiresAt));

  return c.json({
    success: true,
    data: { user: { id: user.id, email: user.email, name: user.name, provider: user.provider } },
  });
});

// POST /auth/logout
auth.post('/logout', async (c) => {
  const cookie = c.req.header('Cookie');
  const sessionId = getSessionIdFromCookie(cookie);

  if (sessionId) {
    await c.env.DB.prepare('DELETE FROM sessions WHERE id = ?').bind(sessionId).run();
  }

  c.header('Set-Cookie', createLogoutCookie());

  return c.json({ success: true, data: null });
});

// GET /auth/me
auth.get('/me', async (c) => {
  const cookie = c.req.header('Cookie');
  const sessionId = getSessionIdFromCookie(cookie);

  if (!sessionId) {
    return c.json(
      { success: false, error: { code: errorCodes.UNAUTHORIZED, message: 'Not authenticated' } },
      401
    );
  }

  const session = await c.env.DB.prepare(
    'SELECT user_id, expires_at FROM sessions WHERE id = ?'
  ).bind(sessionId).first<{ user_id: string; expires_at: string }>();

  if (!session || isSessionExpired(session.expires_at)) {
    if (session) {
      await c.env.DB.prepare('DELETE FROM sessions WHERE id = ?').bind(sessionId).run();
    }
    c.header('Set-Cookie', createLogoutCookie());
    return c.json(
      { success: false, error: { code: errorCodes.UNAUTHORIZED, message: 'Session expired' } },
      401
    );
  }

  const user = await c.env.DB.prepare(
    'SELECT id, email, name, provider, created_at FROM users WHERE id = ?'
  ).bind(session.user_id).first<{ id: string; email: string; name: string; provider: string; created_at: string }>();

  if (!user) {
    return c.json(
      { success: false, error: { code: errorCodes.UNAUTHORIZED, message: 'User not found' } },
      401
    );
  }

  return c.json({
    success: true,
    data: { user: { id: user.id, email: user.email, name: user.name, provider: user.provider, createdAt: user.created_at } },
  });
});

export default auth;
