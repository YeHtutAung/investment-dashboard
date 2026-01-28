const METALS_DEV_API_URL = 'https://api.metals.dev/v1/latest';

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
  currency: string;
  fetchedAt: string;
};

export async function fetchGoldPrice(apiKey: string): Promise<GoldPriceResult> {
  const url = new URL(METALS_DEV_API_URL);
  url.searchParams.set('api_key', apiKey);
  url.searchParams.set('currency', 'USD');
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
    currency: data.currency || 'USD',
    fetchedAt: new Date().toISOString(),
  };
}
