-- Add new columns to gold_prices table for auto-fetch support

-- Add datetime column (full ISO timestamp)
ALTER TABLE gold_prices ADD COLUMN datetime TEXT;

-- Add source column (AUTO or MANUAL)
ALTER TABLE gold_prices ADD COLUMN source TEXT NOT NULL DEFAULT 'MANUAL' CHECK (source IN ('AUTO', 'MANUAL'));

-- Add market_session column (open, close, or NULL for manual entries)
ALTER TABLE gold_prices ADD COLUMN market_session TEXT CHECK (market_session IS NULL OR market_session IN ('open', 'close'));

-- Update existing entries: set datetime from date
UPDATE gold_prices SET datetime = date || 'T00:00:00.000Z' WHERE datetime IS NULL;

-- Drop the old unique constraint on date and create new one on (date, market_session)
-- SQLite doesn't support DROP CONSTRAINT, so we need to recreate the table

-- Create new table with updated schema
CREATE TABLE gold_prices_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL,
  datetime TEXT,
  price_per_gram REAL NOT NULL CHECK (price_per_gram > 0),
  currency TEXT NOT NULL DEFAULT 'USD',
  source TEXT NOT NULL DEFAULT 'MANUAL' CHECK (source IN ('AUTO', 'MANUAL')),
  market_session TEXT CHECK (market_session IS NULL OR market_session IN ('open', 'close')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Copy data from old table
INSERT INTO gold_prices_new (id, date, datetime, price_per_gram, currency, source, market_session, created_at)
SELECT id, date, datetime, price_per_gram, currency, source, market_session, created_at
FROM gold_prices;

-- Drop old table
DROP TABLE gold_prices;

-- Rename new table
ALTER TABLE gold_prices_new RENAME TO gold_prices;

-- Create indexes
CREATE INDEX idx_gold_prices_date ON gold_prices(date);
CREATE UNIQUE INDEX idx_gold_prices_date_session ON gold_prices(date, market_session);
