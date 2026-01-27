import { useState, useEffect } from 'react';
import { api, type Investment, type CreateInvestmentInput } from '../lib/api';
import { InvestmentForm } from '../components/InvestmentForm';
import { useToast } from '../components/Toast';
import { SkeletonInvestmentList } from '../components/Skeleton';
import { exportInvestmentsToCSV } from '../lib/export';

const GOLD_TYPE_LABELS: Record<string, string> = {
  bar: 'Gold Bar',
  coin: 'Gold Coin',
  jewelry: 'Jewelry',
  other: 'Other',
};

export function Investments() {
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingInvestment, setEditingInvestment] = useState<Investment | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState('');
  const { showToast } = useToast();

  const fetchInvestments = async () => {
    const res = await api.investments.list();
    if (res.success) {
      setInvestments(res.data.investments);
    } else {
      showToast('Failed to load investments', 'error');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchInvestments();
  }, []);

  const handleCreate = async (data: CreateInvestmentInput) => {
    setFormLoading(true);
    setError('');
    const res = await api.investments.create(data);
    setFormLoading(false);

    if (res.success) {
      setShowForm(false);
      showToast('Investment added successfully', 'success');
      fetchInvestments();
    } else {
      setError(res.error.message);
    }
  };

  const handleUpdate = async (data: CreateInvestmentInput) => {
    if (!editingInvestment) return;
    setFormLoading(true);
    setError('');
    const res = await api.investments.update(editingInvestment.id, data);
    setFormLoading(false);

    if (res.success) {
      setEditingInvestment(null);
      showToast('Investment updated successfully', 'success');
      fetchInvestments();
    } else {
      setError(res.error.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this investment?')) return;

    const res = await api.investments.delete(id);
    if (res.success) {
      showToast('Investment deleted', 'info');
      fetchInvestments();
    } else {
      showToast('Failed to delete investment', 'error');
    }
  };

  const handleExport = () => {
    exportInvestmentsToCSV(investments);
    showToast('Investments exported to CSV', 'success');
  };

  if (loading) {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">My Investments</h2>
        </div>
        <SkeletonInvestmentList />
      </div>
    );
  }

  // Show form for create or edit
  if (showForm || editingInvestment) {
    return (
      <div className="max-w-lg mx-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          {editingInvestment ? 'Edit Investment' : 'Add Investment'}
        </h2>
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {error}
          </div>
        )}
        <InvestmentForm
          investment={editingInvestment || undefined}
          onSubmit={editingInvestment ? handleUpdate : handleCreate}
          onCancel={() => {
            setShowForm(false);
            setEditingInvestment(null);
            setError('');
          }}
          loading={formLoading}
        />
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h2 className="text-2xl font-bold text-gray-900">My Investments</h2>
        <div className="flex gap-2">
          {investments.length > 0 && (
            <button
              onClick={handleExport}
              className="px-4 py-3 border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold rounded-lg text-lg"
            >
              Export CSV
            </button>
          )}
          <button
            onClick={() => setShowForm(true)}
            className="px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg text-lg"
          >
            + Add Investment
          </button>
        </div>
      </div>

      {investments.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-md">
          <p className="text-gray-600 text-lg mb-4">No investments yet.</p>
          <button
            onClick={() => setShowForm(true)}
            className="text-amber-600 hover:text-amber-700 font-semibold text-lg"
          >
            Add your first investment
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {investments.map((inv) => (
            <div
              key={inv.id}
              className="bg-white rounded-lg shadow-md p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-lg font-semibold text-gray-900">
                    {GOLD_TYPE_LABELS[inv.goldType] || inv.goldType}
                  </span>
                  <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    {inv.purchaseDate}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-gray-600">
                  <div>
                    <span className="text-sm text-gray-500">Weight</span>
                    <p className="font-medium">{inv.weightGrams}g</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Price/gram</span>
                    <p className="font-medium">${inv.purchasePricePerGram.toFixed(2)}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Total Cost</span>
                    <p className="font-semibold text-amber-700">${inv.totalCost.toFixed(2)}</p>
                  </div>
                </div>
                {inv.notes && (
                  <p className="mt-2 text-sm text-gray-500">{inv.notes}</p>
                )}
              </div>
              <div className="flex gap-2 sm:flex-col">
                <button
                  onClick={() => setEditingInvestment(inv)}
                  className="px-4 py-2 text-amber-600 hover:bg-amber-50 rounded-lg font-medium"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(inv.id)}
                  className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg font-medium"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
