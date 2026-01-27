import { z } from 'zod';
import {
  userSchema,
  registerSchema,
  loginSchema,
  sessionSchema,
  apiErrorSchema,
  investmentSchema,
  createInvestmentSchema,
  updateInvestmentSchema,
  goldPriceSchema,
  portfolioSummarySchema,
  goldTypeEnum,
} from '../schemas';

// Auth types (inferred from Zod schemas)
export type User = z.infer<typeof userSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type Session = z.infer<typeof sessionSchema>;

// Investment types
export type GoldType = z.infer<typeof goldTypeEnum>;
export type Investment = z.infer<typeof investmentSchema>;
export type CreateInvestmentInput = z.infer<typeof createInvestmentSchema>;
export type UpdateInvestmentInput = z.infer<typeof updateInvestmentSchema>;
export type GoldPrice = z.infer<typeof goldPriceSchema>;
export type PortfolioSummary = z.infer<typeof portfolioSummarySchema>;

// API response types
export type ApiError = z.infer<typeof apiErrorSchema>;
export type ApiSuccess<T> = { success: true; data: T };
export type ApiResponse<T> = ApiSuccess<T> | ApiError;
