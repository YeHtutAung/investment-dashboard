import { useState, useEffect } from 'react';
import { api, type GoldPrice } from '../lib/api';

type Props = {
  onClose: () => void;
};

export function PriceHistory({ onClose }: Props) {
  const [prices, setPrices] = useState<GoldPrice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPrices = async () => {
      const res = await api.goldPrices.list(30);
      if (res.success) {
        setPrices(res.data.prices);
      }
      setLoading(false);
    };
    fetchPrices();
  }, []);

  // Calculate min/max for simple bar visualization
  const priceValues = prices.map((p) => p.pricePerGram);
  const minPrice = Math.min(...priceValues);
  const maxPrice = Math.max(...priceValues);
  const range = maxPrice - minPrice || 1;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[80vh] flex flex-col">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Price History</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
          >
            &times;
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="text-center py-8 text-gray-600">Loading...</div>
          ) : prices.length === 0 ? (
            <div className="text-center py-8 text-gray-600">
              No price history yet. Add your first gold price.
            </div>
          ) : (
            <div className="space-y-2">
              {prices.map((price, index) => {
                const barWidth = ((price.pricePerGram - minPrice) / range) * 100;
                const isLatest = index === 0;
                const prevPrice = prices[index + 1]?.pricePerGram;
                const change = prevPrice ? price.pricePerGram - prevPrice : 0;
                const changePercent = prevPrice ? (change / prevPrice) * 100 : 0;

                return (
                  <div
                    key={price.date}
                    className={`p-3 rounded-lg ${isLatest ? 'bg-amber-50 border border-amber-200' : 'bg-gray-50'}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-500">
                        {formatDate(price.date)}
                        {isLatest && (
                          <span className="ml-2 text-xs bg-amber-200 text-amber-800 px-2 py-0.5 rounded">
                            Latest
                          </span>
                        )}
                      </span>
                      <div className="text-right">
                        <span className="font-semibold text-gray-900">
                          ${price.pricePerGram.toFixed(2)}
                        </span>
                        {prevPrice && (
                          <span
                            className={`ml-2 text-sm ${
                              change >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}
                          >
                            {change >= 0 ? '+' : ''}
                            {changePercent.toFixed(2)}%
                          </span>
                        )}
                      </div>
                    </div>
                    {/* Simple bar chart */}
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-500 rounded-full transition-all"
                        style={{ width: `${Math.max(barWidth, 5)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {prices.length > 0 && (
          <div className="p-4 border-t bg-gray-50 text-sm text-gray-600">
            <div className="flex justify-between">
              <span>Range: ${minPrice.toFixed(2)} - ${maxPrice.toFixed(2)}</span>
              <span>{prices.length} entries</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
