import { Hono } from 'hono';
import { z } from 'zod';
import { errorCodes } from 'shared';
import type { AppEnv } from '../types';

const goldPrices = new Hono<AppEnv>();

const createPriceSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  pricePerGram: z.number().positive('Price must be greater than 0'),
  currency: z.string().default('USD'),
});

// GET /gold-prices/latest - Get latest gold price
goldPrices.get('/latest', async (c) => {
  const row = await c.env.DB.prepare(`
    SELECT date, price_per_gram, currency, created_at
    FROM gold_prices
    ORDER BY date DESC
    LIMIT 1
  `).first<{ date: string; price_per_gram: number; currency: string; created_at: string }>();

  if (!row) {
    return c.json({
      success: true,
      data: { price: null },
    });
  }

  return c.json({
    success: true,
    data: {
      price: {
        date: row.date,
        pricePerGram: row.price_per_gram,
        currency: row.currency,
        createdAt: row.created_at,
      },
    },
  });
});

// GET /gold-prices - List recent prices
goldPrices.get('/', async (c) => {
  const limit = parseInt(c.req.query('limit') || '30');

  const results = await c.env.DB.prepare(`
    SELECT date, price_per_gram, currency, created_at
    FROM gold_prices
    ORDER BY date DESC
    LIMIT ?
  `).bind(Math.min(limit, 365)).all();

  const prices = (results.results || []).map(row => ({
    date: row.date,
    pricePerGram: row.price_per_gram,
    currency: row.currency,
    createdAt: row.created_at,
  }));

  return c.json({ success: true, data: { prices } });
});

// POST /gold-prices - Add new price (upsert by date)
goldPrices.post('/', async (c) => {
  const body = await c.req.json();
  const parsed = createPriceSchema.safeParse(body);

  if (!parsed.success) {
    return c.json(
      { success: false, error: { code: errorCodes.VALIDATION_ERROR, message: parsed.error.errors[0].message } },
      400
    );
  }

  const { date, pricePerGram, currency } = parsed.data;

  // Upsert: insert or update if date exists
  await c.env.DB.prepare(`
    INSERT INTO gold_prices (date, price_per_gram, currency)
    VALUES (?, ?, ?)
    ON CONFLICT(date) DO UPDATE SET
      price_per_gram = excluded.price_per_gram,
      currency = excluded.currency
  `).bind(date, pricePerGram, currency).run();

  return c.json({
    success: true,
    data: {
      price: { date, pricePerGram, currency },
    },
  }, 201);
});

export default goldPrices;
