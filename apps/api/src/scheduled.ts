import { fetchGoldPrice } from './lib/gold-api';
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
    const result = await fetchGoldPrice(env.GOLD_API_KEY);

    console.log(`[scheduled] Fetched price: $${result.pricePerGram}/gram`);

    // Insert or update price for this date + session
    await env.DB.prepare(`
      INSERT INTO gold_prices (date, datetime, price_per_gram, currency, source, market_session)
      VALUES (?, ?, ?, ?, 'AUTO', ?)
      ON CONFLICT(date, market_session) DO UPDATE SET
        datetime = excluded.datetime,
        price_per_gram = excluded.price_per_gram,
        currency = excluded.currency
    `).bind(date, datetime, result.pricePerGram, result.currency, marketSession).run();

    console.log(`[scheduled] Saved price for ${date} (${marketSession})`);
  } catch (error) {
    console.error('[scheduled] Failed to fetch/save gold price:', error);
  }
}
