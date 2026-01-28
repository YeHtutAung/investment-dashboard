import { z } from 'zod';

// Gold types
export const goldTypeEnum = z.enum(['bar', 'coin', 'jewelry', 'other']);

// Price source (AUTO = fetched from API, MANUAL = user entered)
export const priceSourceEnum = z.enum(['AUTO', 'MANUAL']);

// Market session (open = market open, close = market close)
export const marketSessionEnum = z.enum(['open', 'close']);

// Investment record (from DB)
export const investmentSchema = z.object({
  id: z.string(),
  userId: z.string(),
  goldType: goldTypeEnum,
  weightGrams: z.number().positive(),
  purchasePricePerGram: z.number().positive(),
  totalCost: z.number().positive(),
  purchaseDate: z.string(),
  notes: z.string().nullable(),
  createdAt: z.string(),
});

// Create investment input
export const createInvestmentSchema = z.object({
  goldType: goldTypeEnum,
  weightGrams: z.number().positive('Weight must be greater than 0'),
  purchasePricePerGram: z.number().positive('Price must be greater than 0'),
  purchaseDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  notes: z.string().optional(),
});

// Update investment input
export const updateInvestmentSchema = z.object({
  goldType: goldTypeEnum.optional(),
  weightGrams: z.number().positive('Weight must be greater than 0').optional(),
  purchasePricePerGram: z.number().positive('Price must be greater than 0').optional(),
  purchaseDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD').optional(),
  notes: z.string().nullable().optional(),
});

// Gold price record (for tracking market prices)
export const goldPriceSchema = z.object({
  date: z.string(),
  datetime: z.string().nullable(),
  pricePerGram: z.number().positive(),
  currency: z.string().default('USD'),
  source: priceSourceEnum,
  marketSession: marketSessionEnum.nullable(),
});

// Portfolio summary
export const portfolioSummarySchema = z.object({
  totalWeightGrams: z.number(),
  totalCost: z.number(),
  currentValue: z.number(),
  profitLoss: z.number(),
  profitLossPercent: z.number(),
  investmentCount: z.number(),
});
