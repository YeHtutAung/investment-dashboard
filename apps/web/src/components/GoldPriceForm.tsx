import { useState } from 'react';
import { api } from '../lib/api';

type Props = {
  currentPrice?: number;
  onUpdate: () => void;
  onClose: () => void;
};

export function GoldPriceForm({ currentPrice, onUpdate, onClose }: Props) {
  const [price, setPrice] = useState(currentPrice?.toString() || '');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const priceNum = parseFloat(price);
    if (!priceNum || priceNum <= 0) {
      setError('Please enter a valid price');
      return;
    }

    setLoading(true);
    const res = await api.goldPrices.create({
      date,
      pricePerGram: priceNum,
      currency: 'USD',
    });
    setLoading(false);

    if (res.success) {
      onUpdate();
      onClose();
    } else {
      setError(res.error.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Update Gold Price
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="price" className="block text-gray-700 font-medium mb-2">
              Price per Gram (USD)
            </label>
            <input
              id="price"
              type="number"
              step="0.01"
              min="0"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-lg"
              placeholder="e.g., 65.50"
              autoFocus
              required
            />
          </div>

          <div>
            <label htmlFor="date" className="block text-gray-700 font-medium mb-2">
              Date
            </label>
            <input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-lg"
              required
            />
          </div>

          <div className="flex gap-4 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg text-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg text-lg disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Price'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
