import { Context, Next } from 'hono';
import { errorCodes } from 'shared';
import {
  getSessionIdFromCookie,
  isSessionExpired,
  createLogoutCookie,
} from '../lib/session';
import type { AppEnv, User } from '../types';

export async function authMiddleware(c: Context<AppEnv>, next: Next) {
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
    'SELECT id, email, name, provider FROM users WHERE id = ?'
  ).bind(session.user_id).first<User>();

  if (!user) {
    return c.json(
      { success: false, error: { code: errorCodes.UNAUTHORIZED, message: 'User not found' } },
      401
    );
  }

  c.set('user', user);
  await next();
}
