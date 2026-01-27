import { useState, useEffect } from 'react';
import { api, type PortfolioSummary } from '../lib/api';
import { Investments } from './Investments';
import { Settings } from './Settings';
import { GoldPriceForm } from '../components/GoldPriceForm';
import { PriceHistory } from '../components/PriceHistory';
import { BottomNav } from '../components/BottomNav';
import { SkeletonDashboard } from '../components/Skeleton';

type User = {
  id: string;
  email: string;
  name: string;
  provider?: string;
};

type Props = {
  user: User;
  onLogout: () => void;
};

type Tab = 'overview' | 'investments' | 'settings';

export function Dashboard({ user, onLogout }: Props) {
  const [tab, setTab] = useState<Tab>('overview');
  const [summary, setSummary] = useState<PortfolioSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPriceForm, setShowPriceForm] = useState(false);
  const [showPriceHistory, setShowPriceHistory] = useState(false);

  const fetchSummary = async () => {
    const res = await api.investments.summary();
    if (res.success) {
      setSummary(res.data.summary);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  // Refresh summary when switching to overview
  useEffect(() => {
    if (tab === 'overview') {
      fetchSummary();
    }
  }, [tab]);

  return (
    <div className="min-h-screen bg-gray-50 pb-20 sm:pb-0">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl sm:text-2xl font-bold text-amber-600">Gold Investment</h1>
          <div className="hidden sm:flex items-center gap-4">
            <span className="text-gray-700">{user.name}</span>
            <button
              onClick={onLogout}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* Desktop Tabs */}
      <div className="bg-white border-b hidden sm:block">
        <div className="max-w-7xl mx-auto px-4">
          <nav className="flex gap-8">
            <button
              onClick={() => setTab('overview')}
              className={`py-4 border-b-2 font-medium text-lg ${
                tab === 'overview'
                  ? 'border-amber-600 text-amber-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setTab('investments')}
              className={`py-4 border-b-2 font-medium text-lg ${
                tab === 'investments'
                  ? 'border-amber-600 text-amber-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Investments
            </button>
            <button
              onClick={() => setTab('settings')}
              className={`py-4 border-b-2 font-medium text-lg ${
                tab === 'settings'
                  ? 'border-amber-600 text-amber-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Settings
            </button>
          </nav>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-6 sm:py-8">
        {tab === 'overview' && (
          <OverviewTab
            summary={summary}
            loading={loading}
            onUpdatePrice={() => setShowPriceForm(true)}
            onViewHistory={() => setShowPriceHistory(true)}
          />
        )}
        {tab === 'investments' && <Investments />}
        {tab === 'settings' && <Settings user={user} onLogout={onLogout} />}
      </main>

      {/* Mobile Bottom Nav */}
      <BottomNav activeTab={tab} onTabChange={setTab} />

      {showPriceForm && (
        <GoldPriceForm
          currentPrice={summary?.currentPricePerGram}
          onUpdate={fetchSummary}
          onClose={() => setShowPriceForm(false)}
        />
      )}

      {showPriceHistory && (
        <PriceHistory onClose={() => setShowPriceHistory(false)} />
      )}
    </div>
  );
}

function OverviewTab({
  summary,
  loading,
  onUpdatePrice,
  onViewHistory,
}: {
  summary: PortfolioSummary | null;
  loading: boolean;
  onUpdatePrice: () => void;
  onViewHistory: () => void;
}) {
  if (loading) {
    return <SkeletonDashboard />;
  }

  if (!summary) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <p className="text-gray-600">Unable to load portfolio summary.</p>
      </div>
    );
  }

  const isProfitable = summary.profitLoss >= 0;

  return (
    <div className="space-y-6">
      {/* Gold Price Banner */}
      <div className="bg-white rounded-lg shadow-md p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-gray-600">Current Gold Price: </span>
          <span className="text-xl font-bold text-amber-600">
            {summary.currentPricePerGram > 0
              ? `$${summary.currentPricePerGram.toFixed(2)}/g`
              : 'Not set'}
          </span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onViewHistory}
            className="px-4 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium rounded-lg"
          >
            View History
          </button>
          <button
            onClick={onUpdatePrice}
            className="px-4 py-2 bg-amber-100 hover:bg-amber-200 text-amber-700 font-medium rounded-lg"
          >
            Update Price
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <SummaryCard
          title="Total Gold"
          value={`${summary.totalWeightGrams.toFixed(2)}g`}
          subtitle={`${summary.investmentCount} investment${summary.investmentCount !== 1 ? 's' : ''}`}
        />
        <SummaryCard
          title="Total Cost"
          value={`$${summary.totalCost.toFixed(2)}`}
          subtitle="Amount invested"
        />
        <SummaryCard
          title="Current Value"
          value={`$${summary.currentValue.toFixed(2)}`}
          subtitle={summary.currentPricePerGram > 0 ? `@ $${summary.currentPricePerGram.toFixed(2)}/g` : 'Set price to calculate'}
        />
        <SummaryCard
          title="Profit / Loss"
          value={summary.currentPricePerGram > 0 ? `${isProfitable ? '+' : ''}$${summary.profitLoss.toFixed(2)}` : '--'}
          subtitle={summary.currentPricePerGram > 0 ? `${isProfitable ? '+' : ''}${summary.profitLossPercent.toFixed(2)}%` : 'Set price to calculate'}
          highlight={summary.currentPricePerGram > 0 ? (isProfitable ? 'green' : 'red') : undefined}
        />
      </div>

      {/* Help Text */}
      {summary.currentPricePerGram === 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <p className="text-amber-800">
            <strong>Tip:</strong> Set the current gold price to see your portfolio's value and profit/loss.
          </p>
        </div>
      )}

      {summary.investmentCount === 0 && (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <p className="text-gray-600 text-lg">
            You haven't added any investments yet. Start tracking your gold purchases!
          </p>
        </div>
      )}
    </div>
  );
}

function SummaryCard({
  title,
  value,
  subtitle,
  highlight,
}: {
  title: string;
  value: string;
  subtitle: string;
  highlight?: 'green' | 'red';
}) {
  const valueColor = highlight
    ? highlight === 'green'
      ? 'text-green-600'
      : 'text-red-600'
    : 'text-gray-900';

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">{title}</h3>
      <p className={`mt-2 text-3xl font-bold ${valueColor}`}>{value}</p>
      <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
    </div>
  );
}
