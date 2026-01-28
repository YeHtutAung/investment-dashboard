-- Multi-currency support: USD, SGD, JPY
-- Update unique constraint from (date, market_session) to (date, market_session, currency)

-- Create new table with updated schema
CREATE TABLE gold_prices_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL,
  datetime TEXT,
  price_per_gram REAL NOT NULL CHECK (price_per_gram > 0),
  currency TEXT NOT NULL DEFAULT 'USD' CHECK (currency IN ('USD', 'SGD', 'JPY')),
  source TEXT NOT NULL DEFAULT 'MANUAL' CHECK (source IN ('AUTO', 'MANUAL')),
  market_session TEXT CHECK (market_session IS NULL OR market_session IN ('open', 'close')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Copy data from old table (all existing rows are USD)
INSERT INTO gold_prices_new (id, date, datetime, price_per_gram, currency, source, market_session, created_at)
SELECT id, date, datetime, price_per_gram, 'USD', source, market_session, created_at
FROM gold_prices;

-- Drop old table
DROP TABLE gold_prices;

-- Rename new table
ALTER TABLE gold_prices_new RENAME TO gold_prices;

-- Create indexes with new unique constraint including currency
CREATE INDEX idx_gold_prices_date ON gold_prices(date);
CREATE INDEX idx_gold_prices_currency ON gold_prices(currency);
CREATE UNIQUE INDEX idx_gold_prices_date_session_currency ON gold_prices(date, market_session, currency);
