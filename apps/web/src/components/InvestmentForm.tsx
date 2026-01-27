import { useState, useEffect } from 'react';
import type { GoldType, Investment, CreateInvestmentInput } from '../lib/api';

type Props = {
  investment?: Investment;
  onSubmit: (data: CreateInvestmentInput) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
};

const GOLD_TYPES: { value: GoldType; label: string }[] = [
  { value: 'bar', label: 'Gold Bar' },
  { value: 'coin', label: 'Gold Coin' },
  { value: 'jewelry', label: 'Jewelry' },
  { value: 'other', label: 'Other' },
];

export function InvestmentForm({ investment, onSubmit, onCancel, loading }: Props) {
  const [goldType, setGoldType] = useState<GoldType>(investment?.goldType || 'bar');
  const [weightGrams, setWeightGrams] = useState(investment?.weightGrams?.toString() || '');
  const [pricePerGram, setPricePerGram] = useState(investment?.purchasePricePerGram?.toString() || '');
  const [purchaseDate, setPurchaseDate] = useState(investment?.purchaseDate || new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState(investment?.notes || '');
  const [error, setError] = useState('');

  const totalCost = (parseFloat(weightGrams) || 0) * (parseFloat(pricePerGram) || 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const weight = parseFloat(weightGrams);
    const price = parseFloat(pricePerGram);

    if (!weight || weight <= 0) {
      setError('Please enter a valid weight');
      return;
    }
    if (!price || price <= 0) {
      setError('Please enter a valid price');
      return;
    }

    await onSubmit({
      goldType,
      weightGrams: weight,
      purchasePricePerGram: price,
      purchaseDate,
      notes: notes || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="goldType" className="block text-gray-700 font-medium mb-2">
          Gold Type
        </label>
        <select
          id="goldType"
          value={goldType}
          onChange={(e) => setGoldType(e.target.value as GoldType)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-lg"
        >
          {GOLD_TYPES.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="weightGrams" className="block text-gray-700 font-medium mb-2">
          Weight (grams)
        </label>
        <input
          id="weightGrams"
          type="number"
          step="0.01"
          min="0"
          value={weightGrams}
          onChange={(e) => setWeightGrams(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-lg"
          placeholder="e.g., 10.5"
          required
        />
      </div>

      <div>
        <label htmlFor="pricePerGram" className="block text-gray-700 font-medium mb-2">
          Price per Gram ($)
        </label>
        <input
          id="pricePerGram"
          type="number"
          step="0.01"
          min="0"
          value={pricePerGram}
          onChange={(e) => setPricePerGram(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-lg"
          placeholder="e.g., 65.50"
          required
        />
      </div>

      <div className="p-4 bg-amber-50 rounded-lg">
        <span className="text-gray-600">Total Cost: </span>
        <span className="text-xl font-semibold text-amber-700">
          ${totalCost.toFixed(2)}
        </span>
      </div>

      <div>
        <label htmlFor="purchaseDate" className="block text-gray-700 font-medium mb-2">
          Purchase Date
        </label>
        <input
          id="purchaseDate"
          type="date"
          value={purchaseDate}
          onChange={(e) => setPurchaseDate(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-lg"
          required
        />
      </div>

      <div>
        <label htmlFor="notes" className="block text-gray-700 font-medium mb-2">
          Notes (optional)
        </label>
        <textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-lg"
          placeholder="Any additional details..."
        />
      </div>

      <div className="flex gap-4">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg text-lg hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 py-3 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg text-lg disabled:opacity-50"
        >
          {loading ? 'Saving...' : investment ? 'Update' : 'Add Investment'}
        </button>
      </div>
    </form>
  );
}
