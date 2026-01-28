import { fetchAllGoldPrices } from './lib/gold-api';
import type { Bindings } from './types';

type MarketSession = 'open' | 'close';

function getMarketSession(utcHour: number): MarketSession {
  // 11:00 UTC = 6:00 AM ET (market open)
  // 22:00 UTC = 5:00 PM ET (market close)
  if (utcHour === 11) return 'open';
  return 'close';
}

export async function scheduled(
  controller: ScheduledController,
  env: Bindings,
  _ctx: ExecutionContext
): Promise<void> {
  const now = new Date(controller.scheduledTime);
  const utcHour = now.getUTCHours();
  const date = now.toISOString().split('T')[0];
  const datetime = now.toISOString();
  const marketSession = getMarketSession(utcHour);

  console.log(`[scheduled] Starting gold price fetch for ${date} (${marketSession})`);

  if (!env.GOLD_API_KEY) {
    console.error('[scheduled] GOLD_API_KEY not configured');
    return;
  }

  try {
    const results = await fetchAllGoldPrices(env.GOLD_API_KEY);

    console.log(`[scheduled] Fetched prices for ${results.length} currencies`);

    // Batch insert all currency prices
    const stmt = env.DB.prepare(`
      INSERT INTO gold_prices (date, datetime, price_per_gram, currency, source, market_session)
      VALUES (?, ?, ?, ?, 'AUTO', ?)
      ON CONFLICT(date, market_session, currency) DO UPDATE SET
        datetime = excluded.datetime,
        price_per_gram = excluded.price_per_gram
    `);

    await env.DB.batch(
      results.map((result) =>
        stmt.bind(date, datetime, result.pricePerGram, result.currency, marketSession)
      )
    );

    console.log(`[scheduled] Saved prices for ${date} (${marketSession}): ${results.map((r) => `${r.currency}=${r.pricePerGram}`).join(', ')}`);
  } catch (error) {
    console.error('[scheduled] Failed to fetch/save gold prices:', error);
  }
}
