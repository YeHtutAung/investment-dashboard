const METALS_DEV_API_URL = 'https://api.metals.dev/v1/latest';

export const SUPPORTED_CURRENCIES = ['USD', 'SGD', 'JPY'] as const;
export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number];

type MetalsDevResponse = {
  status: string;
  currency: string;
  unit: string;
  metals: {
    gold: number;
    [key: string]: number;
  };
};

export type GoldPriceResult = {
  pricePerGram: number;
  currency: SupportedCurrency;
  fetchedAt: string;
};

export async function fetchGoldPrice(
  apiKey: string,
  currency: SupportedCurrency = 'USD'
): Promise<GoldPriceResult> {
  const url = new URL(METALS_DEV_API_URL);
  url.searchParams.set('api_key', apiKey);
  url.searchParams.set('currency', currency);
  url.searchParams.set('unit', 'g');

  const response = await fetch(url.toString());

  if (!response.ok) {
    throw new Error(`Metals.dev API error: ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as MetalsDevResponse;

  if (data.status !== 'success' || !data.metals?.gold) {
    throw new Error('Invalid response from Metals.dev API');
  }

  return {
    pricePerGram: data.metals.gold,
    currency,
    fetchedAt: new Date().toISOString(),
  };
}

export async function fetchAllGoldPrices(apiKey: string): Promise<GoldPriceResult[]> {
  const results = await Promise.all(
    SUPPORTED_CURRENCIES.map((currency) => fetchGoldPrice(apiKey, currency))
  );
  return results;
}
