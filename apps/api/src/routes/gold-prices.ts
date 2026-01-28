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

type GoldPriceRow = {
  date: string;
  datetime: string | null;
  price_per_gram: number;
  currency: string;
  source: string;
  market_session: string | null;
  created_at: string;
};

// GET /gold-prices/latest - Get latest gold price
goldPrices.get('/latest', async (c) => {
  const row = await c.env.DB.prepare(`
    SELECT date, datetime, price_per_gram, currency, source, market_session, created_at
    FROM gold_prices
    ORDER BY datetime DESC, date DESC
    LIMIT 1
  `).first<GoldPriceRow>();

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
        datetime: row.datetime,
        pricePerGram: row.price_per_gram,
        currency: row.currency,
        source: row.source,
        marketSession: row.market_session,
        createdAt: row.created_at,
      },
    },
  });
});

// GET /gold-prices - List recent prices
goldPrices.get('/', async (c) => {
  const limit = parseInt(c.req.query('limit') || '30');

  const results = await c.env.DB.prepare(`
    SELECT date, datetime, price_per_gram, currency, source, market_session, created_at
    FROM gold_prices
    ORDER BY datetime DESC, date DESC
    LIMIT ?
  `).bind(Math.min(limit, 365)).all<GoldPriceRow>();

  const prices = (results.results || []).map(row => ({
    date: row.date,
    datetime: row.datetime,
    pricePerGram: row.price_per_gram,
    currency: row.currency,
    source: row.source,
    marketSession: row.market_session,
    createdAt: row.created_at,
  }));

  return c.json({ success: true, data: { prices } });
});

// POST /gold-prices - Add new price (manual entry, upsert by date + NULL session)
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
  const datetime = new Date().toISOString();

  // Upsert: insert or update if date + NULL session exists
  await c.env.DB.prepare(`
    INSERT INTO gold_prices (date, datetime, price_per_gram, currency, source, market_session)
    VALUES (?, ?, ?, ?, 'MANUAL', NULL)
    ON CONFLICT(date, market_session) DO UPDATE SET
      datetime = excluded.datetime,
      price_per_gram = excluded.price_per_gram,
      currency = excluded.currency
  `).bind(date, datetime, pricePerGram, currency).run();

  return c.json({
    success: true,
    data: {
      price: { date, datetime, pricePerGram, currency, source: 'MANUAL', marketSession: null },
    },
  }, 201);
});

export default goldPrices;
