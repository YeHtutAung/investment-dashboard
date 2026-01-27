import { Hono } from 'hono';
import { errorCodes } from 'shared';
import {
  generateSessionId,
  generateUserId,
  getSessionExpiry,
  createSessionCookie,
} from '../lib/session';

type Bindings = {
  DB: D1Database;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  FRONTEND_URL?: string;
};

const google = new Hono<{ Bindings: Bindings }>();

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v2/userinfo';

function getCallbackUrl(req: Request): string {
  const url = new URL(req.url);
  return `${url.origin}/api/auth/google/callback`;
}

function getFrontendUrl(env: Bindings): string {
  return env.FRONTEND_URL || 'http://localhost:5173';
}

// GET /auth/google - Redirect to Google
google.get('/', (c) => {
  const callbackUrl = getCallbackUrl(c.req.raw);

  const params = new URLSearchParams({
    client_id: c.env.GOOGLE_CLIENT_ID,
    redirect_uri: callbackUrl,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'offline',
    prompt: 'select_account',
  });

  return c.redirect(`${GOOGLE_AUTH_URL}?${params.toString()}`);
});

// GET /auth/google/callback - Handle Google callback
google.get('/callback', async (c) => {
  const frontendUrl = getFrontendUrl(c.env);
  const code = c.req.query('code');
  const error = c.req.query('error');

  if (error || !code) {
    return c.redirect(`${frontendUrl}/login?error=google_auth_failed`);
  }

  const callbackUrl = getCallbackUrl(c.req.raw);

  // Exchange code for tokens
  const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: c.env.GOOGLE_CLIENT_ID,
      client_secret: c.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: callbackUrl,
      grant_type: 'authorization_code',
    }),
  });

  if (!tokenRes.ok) {
    return c.redirect(`${frontendUrl}/login?error=token_exchange_failed`);
  }

  const tokens = await tokenRes.json<{ access_token: string }>();

  // Get user info
  const userRes = await fetch(GOOGLE_USERINFO_URL, {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });

  if (!userRes.ok) {
    return c.redirect(`${frontendUrl}/login?error=userinfo_failed`);
  }

  const googleUser = await userRes.json<{
    id: string;
    email: string;
    name: string;
  }>();

  // Find or create user
  let user = await c.env.DB.prepare(
    'SELECT id, email, name, provider FROM users WHERE email = ?'
  ).bind(googleUser.email).first<{ id: string; email: string; name: string; provider: string }>();

  if (!user) {
    // Create new user
    const userId = generateUserId();
    await c.env.DB.prepare(
      'INSERT INTO users (id, email, name, provider) VALUES (?, ?, ?, ?)'
    ).bind(userId, googleUser.email, googleUser.name, 'google').run();

    user = { id: userId, email: googleUser.email, name: googleUser.name, provider: 'google' };
  }

  // Create session
  const sessionId = generateSessionId();
  const expiresAt = getSessionExpiry();

  await c.env.DB.prepare(
    'INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)'
  ).bind(sessionId, user.id, expiresAt).run();

  // Redirect to frontend with session cookie
  const response = c.redirect(`${frontendUrl}/dashboard`);
  c.header('Set-Cookie', createSessionCookie(sessionId, expiresAt));

  return response;
});

export default google;
