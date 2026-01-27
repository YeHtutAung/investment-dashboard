# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Multi-user Gold Investment Dashboard with senior-friendly UI, responsive layout, and mobile wrapper (Capacitor) ready.

## Tech Stack

- **Frontend**: Vite + React + TypeScript + Tailwind
- **Backend**: Cloudflare Workers + Hono
- **Database**: Cloudflare D1 (SQLite)
- **Auth**: Email+Password + Google OAuth
- **Sessions**: HttpOnly cookies (7-day expiry)
- **Validation**: Zod (shared between frontend/backend)

## Project Structure

```
apps/
  web/                      # Frontend (React + Vite)
    src/
      components/           # Reusable UI components
      pages/                # Page components (Login, Register, Dashboard, etc.)
      lib/                  # Utilities (api client, export)
  api/                      # Backend (Hono + Cloudflare Workers)
    src/
      routes/               # API route handlers
      middleware/           # Auth middleware
      lib/                  # Utilities (password, session)
    migrations/             # D1 SQL migrations
packages/
  shared/                   # Shared code (Zod schemas, TypeScript types)
    src/
      schemas/              # Zod validation schemas
      types/                # Inferred TypeScript types
```

## Build & Development Commands

```bash
pnpm install              # Install all dependencies

pnpm dev:web              # Frontend dev server (localhost:5173)
pnpm dev:api              # Backend dev server (localhost:8787)

pnpm build:web            # Build frontend
pnpm build:api            # Build backend (dry-run)

pnpm lint                 # Lint all packages
pnpm typecheck            # Type check all packages
```

### Database

```bash
cd apps/api
pnpm db:migrate           # Apply migrations locally
pnpm db:migrate:prod      # Apply migrations to production
```

### Deploy

```bash
cd apps/api && pnpm deploy   # Deploy to Cloudflare Workers
```

### Capacitor (Mobile)

```bash
cd apps/web

# First-time setup (run once)
npx cap add ios              # Add iOS project
npx cap add android          # Add Android project

# Build and sync
pnpm build:ios               # Build web + sync to iOS
pnpm build:android           # Build web + sync to Android

# Open in IDE
pnpm cap:ios                 # Open in Xcode
pnpm cap:android             # Open in Android Studio
```

## API Endpoints

### Auth (Public)
- `POST /api/auth/register` — Create account
- `POST /api/auth/login` — Login with email/password
- `POST /api/auth/logout` — Logout (clears session)
- `GET /api/auth/me` — Get current user
- `GET /api/auth/google` — Start Google OAuth
- `GET /api/auth/google/callback` — Google OAuth callback

### Investments (Protected)
- `GET /api/investments` — List user's investments
- `GET /api/investments/summary` — Portfolio summary with P/L
- `GET /api/investments/:id` — Get single investment
- `POST /api/investments` — Create investment
- `PUT /api/investments/:id` — Update investment
- `DELETE /api/investments/:id` — Delete investment

### Gold Prices
- `GET /api/gold-prices/latest` — Get latest price (public)
- `GET /api/gold-prices` — List price history (public)
- `POST /api/gold-prices` — Add/update price (protected)

## Database Schema

### users
| Column | Type | Notes |
|--------|------|-------|
| id | TEXT | Primary key |
| email | TEXT | Unique |
| name | TEXT | |
| password_hash | TEXT | Nullable (OAuth users) |
| provider | TEXT | 'email' or 'google' |
| created_at | TEXT | ISO datetime |

### sessions
| Column | Type | Notes |
|--------|------|-------|
| id | TEXT | Primary key |
| user_id | TEXT | FK → users |
| expires_at | TEXT | ISO datetime |
| created_at | TEXT | ISO datetime |

### investments
| Column | Type | Notes |
|--------|------|-------|
| id | TEXT | Primary key |
| user_id | TEXT | FK → users |
| gold_type | TEXT | bar/coin/jewelry/other |
| weight_grams | REAL | |
| purchase_price_per_gram | REAL | |
| total_cost | REAL | Auto-calculated |
| purchase_date | TEXT | YYYY-MM-DD |
| notes | TEXT | Nullable |
| created_at | TEXT | ISO datetime |

### gold_prices
| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER | Auto-increment |
| date | TEXT | Unique, YYYY-MM-DD |
| price_per_gram | REAL | |
| currency | TEXT | Default 'USD' |
| created_at | TEXT | ISO datetime |

## Environment Variables

### Backend (apps/api/.dev.vars)
```
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
FRONTEND_URL=http://localhost:5173
```

### Production (Cloudflare Secrets)
```bash
wrangler secret put GOOGLE_CLIENT_ID
wrangler secret put GOOGLE_CLIENT_SECRET
wrangler secret put FRONTEND_URL
```

## Development Rules

- Use chunk-by-chunk development (do NOT generate everything at once)
- Ask before making assumptions
- Keep frontend and backend separated
- Use lightweight tools only - no heavy frameworks or unnecessary libraries
- Design for senior-friendly UI with clear, readable elements
- Ensure responsive layout for mobile compatibility
- All API responses use `{ success: true, data: {...} }` or `{ success: false, error: { code, message } }` format

## Key Patterns

### API Client (Frontend)
```ts
import { api } from '../lib/api';
const res = await api.investments.list();
if (res.success) { /* use res.data */ }
```

### Toast Notifications
```ts
import { useToast } from '../components/Toast';
const { showToast } = useToast();
showToast('Success!', 'success');
```

### Protected Routes (Backend)
```ts
import { authMiddleware } from './middleware/auth';
app.use('/api/protected/*', authMiddleware);
app.get('/api/protected/data', (c) => {
  const user = c.get('user');
  // ...
});
```

### Shared Schemas
```ts
import { createInvestmentSchema, type Investment } from 'shared';
const parsed = createInvestmentSchema.safeParse(data);
```
