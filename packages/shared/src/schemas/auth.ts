import { z } from 'zod';

// User schema
export const userSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string().min(1),
  provider: z.enum(['email', 'google']),
  createdAt: z.string(),
});

// Registration
export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1, 'Name is required'),
});

// Login
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

// Session (internal, not exposed to client)
export const sessionSchema = z.object({
  id: z.string(),
  userId: z.string(),
  expiresAt: z.string(),
});
