import { Hono } from 'hono';
import { cors } from 'hono/cors';
import auth from './routes/auth';
import google from './routes/google';
import investments from './routes/investments';
import goldPrices from './routes/gold-prices';
import { authMiddleware } from './middleware/auth';
import { scheduled } from './scheduled';
import type { AppEnv, Bindings } from './types';

const app = new Hono<AppEnv>();

// CORS for frontend
app.use('*', cors({
  origin: ['http://localhost:5173'],
  credentials: true,
}));

// Health check
app.get('/health', (c) => {
  return c.json({ status: 'ok', timestamp: Date.now() });
});

// Public routes
app.route('/api/auth', auth);
app.route('/api/auth/google', google);
app.route('/api/gold-prices', goldPrices);

// Protected routes - apply auth middleware
app.use('/api/investments/*', authMiddleware);
app.use('/api/investments', authMiddleware);
app.route('/api/investments', investments);

// Protect gold price creation (POST only)
app.post('/api/gold-prices', authMiddleware);

// API info
app.get('/api', (c) => {
  return c.json({ message: 'Investment Dashboard API' });
});

export default {
  fetch: app.fetch,
  scheduled,
} satisfies ExportedHandler<Bindings>;
