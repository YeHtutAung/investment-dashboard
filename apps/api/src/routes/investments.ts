import { Hono } from 'hono';
import { createInvestmentSchema, updateInvestmentSchema, errorCodes } from 'shared';
import { generateUserId } from '../lib/session';
import type { AppEnv } from '../types';

const investments = new Hono<AppEnv>();

// GET /investments - List user's investments
investments.get('/', async (c) => {
  const user = c.get('user');

  const results = await c.env.DB.prepare(`
    SELECT id, user_id, gold_type, weight_grams, purchase_price_per_gram,
           total_cost, purchase_date, notes, created_at
    FROM investments
    WHERE user_id = ?
    ORDER BY purchase_date DESC
  `).bind(user.id).all();

  const items = (results.results || []).map(row => ({
    id: row.id,
    userId: row.user_id,
    goldType: row.gold_type,
    weightGrams: row.weight_grams,
    purchasePricePerGram: row.purchase_price_per_gram,
    totalCost: row.total_cost,
    purchaseDate: row.purchase_date,
    notes: row.notes,
    createdAt: row.created_at,
  }));

  return c.json({ success: true, data: { investments: items } });
});

// GET /investments/summary - Portfolio summary
investments.get('/summary', async (c) => {
  const user = c.get('user');

  const result = await c.env.DB.prepare(`
    SELECT
      COUNT(*) as count,
      COALESCE(SUM(weight_grams), 0) as total_weight,
      COALESCE(SUM(total_cost), 0) as total_cost
    FROM investments
    WHERE user_id = ?
  `).bind(user.id).first<{ count: number; total_weight: number; total_cost: number }>();

  // Get latest gold price
  const priceResult = await c.env.DB.prepare(`
    SELECT price_per_gram FROM gold_prices ORDER BY date DESC LIMIT 1
  `).first<{ price_per_gram: number }>();

  const currentPricePerGram = priceResult?.price_per_gram || 0;
  const totalWeight = result?.total_weight || 0;
  const totalCost = result?.total_cost || 0;
  const currentValue = totalWeight * currentPricePerGram;
  const profitLoss = currentValue - totalCost;
  const profitLossPercent = totalCost > 0 ? (profitLoss / totalCost) * 100 : 0;

  return c.json({
    success: true,
    data: {
      summary: {
        totalWeightGrams: totalWeight,
        totalCost,
        currentValue,
        profitLoss,
        profitLossPercent,
        investmentCount: result?.count || 0,
        currentPricePerGram,
      },
    },
  });
});

// GET /investments/:id - Get single investment
investments.get('/:id', async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');

  const row = await c.env.DB.prepare(`
    SELECT id, user_id, gold_type, weight_grams, purchase_price_per_gram,
           total_cost, purchase_date, notes, created_at
    FROM investments
    WHERE id = ? AND user_id = ?
  `).bind(id, user.id).first();

  if (!row) {
    return c.json(
      { success: false, error: { code: errorCodes.NOT_FOUND, message: 'Investment not found' } },
      404
    );
  }

  return c.json({
    success: true,
    data: {
      investment: {
        id: row.id,
        userId: row.user_id,
        goldType: row.gold_type,
        weightGrams: row.weight_grams,
        purchasePricePerGram: row.purchase_price_per_gram,
        totalCost: row.total_cost,
        purchaseDate: row.purchase_date,
        notes: row.notes,
        createdAt: row.created_at,
      },
    },
  });
});

// POST /investments - Create investment
investments.post('/', async (c) => {
  const user = c.get('user');
  const body = await c.req.json();
  const parsed = createInvestmentSchema.safeParse(body);

  if (!parsed.success) {
    return c.json(
      { success: false, error: { code: errorCodes.VALIDATION_ERROR, message: parsed.error.errors[0].message } },
      400
    );
  }

  const { goldType, weightGrams, purchasePricePerGram, purchaseDate, notes } = parsed.data;
  const id = generateUserId();
  const totalCost = weightGrams * purchasePricePerGram;

  await c.env.DB.prepare(`
    INSERT INTO investments (id, user_id, gold_type, weight_grams, purchase_price_per_gram, total_cost, purchase_date, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(id, user.id, goldType, weightGrams, purchasePricePerGram, totalCost, purchaseDate, notes || null).run();

  return c.json({
    success: true,
    data: {
      investment: {
        id,
        userId: user.id,
        goldType,
        weightGrams,
        purchasePricePerGram,
        totalCost,
        purchaseDate,
        notes: notes || null,
      },
    },
  }, 201);
});

// PUT /investments/:id - Update investment
investments.put('/:id', async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');
  const body = await c.req.json();
  const parsed = updateInvestmentSchema.safeParse(body);

  if (!parsed.success) {
    return c.json(
      { success: false, error: { code: errorCodes.VALIDATION_ERROR, message: parsed.error.errors[0].message } },
      400
    );
  }

  // Check ownership
  const existing = await c.env.DB.prepare(
    'SELECT id, weight_grams, purchase_price_per_gram FROM investments WHERE id = ? AND user_id = ?'
  ).bind(id, user.id).first<{ id: string; weight_grams: number; purchase_price_per_gram: number }>();

  if (!existing) {
    return c.json(
      { success: false, error: { code: errorCodes.NOT_FOUND, message: 'Investment not found' } },
      404
    );
  }

  const updates = parsed.data;
  const fields: string[] = [];
  const values: (string | number | null)[] = [];

  if (updates.goldType !== undefined) {
    fields.push('gold_type = ?');
    values.push(updates.goldType);
  }
  if (updates.weightGrams !== undefined) {
    fields.push('weight_grams = ?');
    values.push(updates.weightGrams);
  }
  if (updates.purchasePricePerGram !== undefined) {
    fields.push('purchase_price_per_gram = ?');
    values.push(updates.purchasePricePerGram);
  }
  if (updates.purchaseDate !== undefined) {
    fields.push('purchase_date = ?');
    values.push(updates.purchaseDate);
  }
  if (updates.notes !== undefined) {
    fields.push('notes = ?');
    values.push(updates.notes);
  }

  // Recalculate total_cost if weight or price changed
  const newWeight = updates.weightGrams ?? existing.weight_grams;
  const newPrice = updates.purchasePricePerGram ?? existing.purchase_price_per_gram;
  fields.push('total_cost = ?');
  values.push(newWeight * newPrice);

  if (fields.length > 0) {
    values.push(id, user.id);
    await c.env.DB.prepare(
      `UPDATE investments SET ${fields.join(', ')} WHERE id = ? AND user_id = ?`
    ).bind(...values).run();
  }

  return c.json({ success: true, data: { id } });
});

// DELETE /investments/:id - Delete investment
investments.delete('/:id', async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');

  const result = await c.env.DB.prepare(
    'DELETE FROM investments WHERE id = ? AND user_id = ?'
  ).bind(id, user.id).run();

  if (result.meta.changes === 0) {
    return c.json(
      { success: false, error: { code: errorCodes.NOT_FOUND, message: 'Investment not found' } },
      404
    );
  }

  return c.json({ success: true, data: null });
});

export default investments;
