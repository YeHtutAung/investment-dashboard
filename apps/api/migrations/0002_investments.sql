-- Investments table
CREATE TABLE investments (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  gold_type TEXT NOT NULL CHECK (gold_type IN ('bar', 'coin', 'jewelry', 'other')),
  weight_grams REAL NOT NULL CHECK (weight_grams > 0),
  purchase_price_per_gram REAL NOT NULL CHECK (purchase_price_per_gram > 0),
  total_cost REAL NOT NULL CHECK (total_cost > 0),
  purchase_date TEXT NOT NULL,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_investments_user_id ON investments(user_id);
CREATE INDEX idx_investments_purchase_date ON investments(purchase_date);

-- Gold prices table (for market price history)
CREATE TABLE gold_prices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL UNIQUE,
  price_per_gram REAL NOT NULL CHECK (price_per_gram > 0),
  currency TEXT NOT NULL DEFAULT 'USD',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_gold_prices_date ON gold_prices(date);
