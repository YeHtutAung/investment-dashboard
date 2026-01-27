const API_BASE = '/api';

type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: { code: string; message: string } };

async function request<T>(
  endpoint: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    credentials: 'include',
  });
  return res.json();
}

// Types
export type GoldType = 'bar' | 'coin' | 'jewelry' | 'other';

export type Investment = {
  id: string;
  userId: string;
  goldType: GoldType;
  weightGrams: number;
  purchasePricePerGram: number;
  totalCost: number;
  purchaseDate: string;
  notes: string | null;
  createdAt: string;
};

export type PortfolioSummary = {
  totalWeightGrams: number;
  totalCost: number;
  currentValue: number;
  profitLoss: number;
  profitLossPercent: number;
  investmentCount: number;
  currentPricePerGram: number;
};

export type GoldPrice = {
  date: string;
  pricePerGram: number;
  currency: string;
  createdAt?: string;
};

export type CreateInvestmentInput = {
  goldType: GoldType;
  weightGrams: number;
  purchasePricePerGram: number;
  purchaseDate: string;
  notes?: string;
};

export type UpdateInvestmentInput = Partial<CreateInvestmentInput>;

export const api = {
  auth: {
    register: (data: { email: string; password: string; name: string }) =>
      request<{ user: { id: string; email: string; name: string } }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    login: (data: { email: string; password: string }) =>
      request<{ user: { id: string; email: string; name: string } }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    logout: () =>
      request<null>('/auth/logout', { method: 'POST' }),

    me: () =>
      request<{ user: { id: string; email: string; name: string; provider: string } }>('/auth/me'),
  },

  investments: {
    list: () =>
      request<{ investments: Investment[] }>('/investments'),

    get: (id: string) =>
      request<{ investment: Investment }>(`/investments/${id}`),

    create: (data: CreateInvestmentInput) =>
      request<{ investment: Investment }>('/investments', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    update: (id: string, data: UpdateInvestmentInput) =>
      request<{ id: string }>(`/investments/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),

    delete: (id: string) =>
      request<null>(`/investments/${id}`, { method: 'DELETE' }),

    summary: () =>
      request<{ summary: PortfolioSummary }>('/investments/summary'),
  },

  goldPrices: {
    latest: () =>
      request<{ price: GoldPrice | null }>('/gold-prices/latest'),

    list: (limit?: number) =>
      request<{ prices: GoldPrice[] }>(`/gold-prices${limit ? `?limit=${limit}` : ''}`),

    create: (data: { date: string; pricePerGram: number; currency?: string }) =>
      request<{ price: GoldPrice }>('/gold-prices', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },
};
