import React, { useMemo, useState } from 'react';
import { Download, Lock, Plus, Trash2 } from 'lucide-react';
import { useFarm } from '../../context/FarmContext';
import { FinanceCategory, FinancialEntry } from '../../types/aquafarm';
import { downloadCSV, formatCurrency, formatDateShort } from '../../utils/calculations';
import { DonutBreakdown, GroupedBarChart } from '../charts/FarmCharts';
import { Modal, StatTile } from '../ui/CommonUI';

const EXPENSE_CATEGORIES: FinanceCategory[] = [
  'Feed',
  'Fingerlings',
  'Medicine',
  'Labour',
  'Electricity & Maintenance',
  'Other',
];

const CATEGORY_COLORS: Record<string, string> = {
  Feed: '#0369a1',
  Fingerlings: '#0d9488',
  Labour: '#0284c7',
  'Electricity & Maintenance': '#475569',
  Medicine: '#d97706',
  Other: '#94a3b8',
};

export const FinanceView: React.FC = () => {
  const { state, canAccessFinance, canDelete, addFinancialEntry, deleteFinancialEntry } =
    useFarm();
  const [period, setPeriod] = useState<'all' | '2026-11' | '2026-10' | '2026'>('all');
  const [typeFilter, setTypeFilter] = useState<'All' | 'Income' | 'Expense'>('All');
  const [catFilter, setCatFilter] = useState<string>('All');
  const [modalOpen, setModalOpen] = useState(false);

  const [form, setForm] = useState<Omit<FinancialEntry, 'id'>>({
    date: '2026-11-18',
    type: 'Expense',
    category: 'Electricity & Maintenance',
    description: '',
    amount: 3500,
    pondId: '',
  });

  if (!canAccessFinance) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-10 text-center max-w-lg mx-auto mt-10">
        <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center mx-auto mb-3">
          <Lock className="w-5 h-5" />
        </div>
        <h2 className="text-base font-semibold text-slate-900">Financial Ledger Restricted</h2>
        <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
          Accounting records, profit margins, and payroll disbursements are accessible only to Farm Managers and Admins. Switch your active role in the sidebar to inspect Financials.
        </p>
      </div>
    );
  }

  const periodEntries = useMemo(() => {
    return state.financialEntries.filter((e) => {
      if (period === 'all') return true;
      return e.date.startsWith(period);
    });
  }, [state.financialEntries, period]);

  const filteredEntries = useMemo(() => {
    return periodEntries.filter((e) => {
      const matchType = typeFilter === 'All' || e.type === typeFilter;
      const matchCat = catFilter === 'All' || e.category === catFilter;
      return matchType && matchCat;
    });
  }, [periodEntries, typeFilter, catFilter]);

  const totals = useMemo(() => {
    const income = periodEntries
      .filter((e) => e.type === 'Income')
      .reduce((acc, e) => acc + e.amount, 0);
    const expense = periodEntries
      .filter((e) => e.type === 'Expense')
      .reduce((acc, e) => acc + e.amount, 0);
    const net = income - expense;
    const margin = income > 0 ? Math.round((net / income) * 1000) / 10 : 0;
    return { income, expense, net, margin };
  }, [periodEntries]);

  const expenseSlices = useMemo(() => {
    const map = new Map<string, number>();
    periodEntries
      .filter((e) => e.type === 'Expense')
      .forEach((e) => {
        map.set(e.category, (map.get(e.category) ?? 0) + e.amount);
      });
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([label, value]) => ({
        label,
        value,
        color: CATEGORY_COLORS[label] ?? '#64748b',
      }));
  }, [periodEntries]);

  const monthlyComparison = useMemo(() => {
    const map = new Map<string, { income: number; expense: number }>();
    state.financialEntries.forEach((e) => {
      const m = e.date.slice(0, 7);
      const cur = map.get(m) ?? { income: 0, expense: 0 };
      if (e.type === 'Income') cur.income += e.amount;
      else cur.expense += e.amount;
      map.set(m, cur);
    });
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, v]) => ({
        label: month,
        primary: Math.round(v.income),
        secondary: Math.round(v.expense),
      }));
  }, [state.financialEntries]);

  const handleExportCSV = () => {
    downloadCSV(
      `aquafarm-financial-ledger-${period}.csv`,
      ['Date', 'Type', 'Category', 'Description', 'Amount (₹)'],
      filteredEntries.map((e) => [e.date, e.type, e.category, e.description, e.amount])
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Financial Management & Accounting
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Monitor fish sales income, operating expenditures, monthly profit & loss, and category cost breakdowns.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleExportCSV}
            className="px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg inline-flex items-center gap-1.5 whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="px-4 py-2 text-xs font-semibold text-white bg-sky-700 hover:bg-sky-800 rounded-lg inline-flex items-center gap-1.5 whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Entry</span>
          </button>
        </div>
      </div>

      {/* Period Filter */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
          {(
            [
              ['all', 'All Records'],
              ['2026-11', 'Nov 2026'],
              ['2026-10', 'Oct 2026'],
              ['2026', 'Year 2026'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setPeriod(id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                period === id
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatTile label="Fish Sales Income" value={formatCurrency(totals.income)} detail="Harvest & market sales" accent="sky" />
        <StatTile label="Total Expenditure" value={formatCurrency(totals.expense)} detail="All operating cost categories" accent="slate" />
        <StatTile
          label="Net Profit / Loss"
          value={formatCurrency(totals.net)}
          detail={totals.net >= 0 ? 'Operating surplus' : 'Operating deficit'}
          accent={totals.net >= 0 ? 'teal' : 'red'}
        />
        <StatTile
          label="Net Profit Margin"
          value={`${totals.margin}%`}
          detail="Return on harvest revenue"
          accent={totals.margin >= 0 ? 'teal' : 'red'}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DonutBreakdown
          title="Expenditure by Category"
          subtitle="Feed, fingerlings, labour, medicine, utilities"
          slices={expenseSlices}
          unitPrefix="₹"
        />
        <GroupedBarChart
          title="Monthly Income vs Expenses"
          subtitle="Full-year monthly cashflow trajectory"
          data={monthlyComparison}
          primaryLabel="Income"
          secondaryLabel="Expenses"
          unitPrefix="₹"
          primaryColor="#0369a1"
          secondaryColor="#64748b"
        />
      </div>

      {/* Ledger Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="text-xs font-semibold text-slate-900">
          Transaction Ledger ({filteredEntries.length} entries)
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as 'All' | 'Income' | 'Expense')}
            className="px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg"
          >
            <option value="All">All Types</option>
            <option value="Income">Income Only</option>
            <option value="Expense">Expenses Only</option>
          </select>
          <select
            value={catFilter}
            onChange={(e) => setCatFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg"
          >
            <option value="All">All Categories</option>
            <option value="Fish Sales">Fish Sales</option>
            {EXPENSE_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold text-slate-500">
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4 text-right">Amount</th>
                {canDelete && <th className="py-3 px-4 text-right">Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredEntries.map((entry) => (
                <tr key={entry.id} className="hover:bg-slate-50/70">
                  <td className="py-3 px-4 tabular-nums text-slate-600">
                    {formatDateShort(entry.date)}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`font-semibold ${
                        entry.type === 'Income' ? 'text-teal-700' : 'text-slate-700'
                      }`}
                    >
                      {entry.type}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-800">{entry.category}</td>
                  <td className="py-3 px-4 text-slate-600">{entry.description}</td>
                  <td
                    className={`py-3 px-4 text-right font-mono tabular-nums font-semibold ${
                      entry.type === 'Income' ? 'text-teal-700' : 'text-slate-900'
                    }`}
                  >
                    {entry.type === 'Income' ? '+' : '-'}
                    {formatCurrency(entry.amount)}
                  </td>
                  {canDelete && (
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => deleteFinancialEntry(entry.id)}
                        className="p-1 text-slate-400 hover:text-red-600"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Add Financial Entry"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!form.description.trim()) return;
            addFinancialEntry({
              ...form,
              pondId: form.pondId || undefined,
            });
            setModalOpen(false);
          }}
          className="space-y-3 text-xs"
        >
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Date</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Type</label>
              <select
                value={form.type}
                onChange={(e) => {
                  const nextType = e.target.value as 'Income' | 'Expense';
                  setForm({
                    ...form,
                    type: nextType,
                    category: nextType === 'Income' ? 'Fish Sales' : 'Feed',
                  });
                }}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white"
              >
                <option value="Expense">Expense</option>
                <option value="Income">Income</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Category</label>
              <select
                value={form.category}
                onChange={(e) =>
                  setForm({ ...form, category: e.target.value as FinanceCategory })
                }
                className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white"
              >
                {form.type === 'Income' ? (
                  <>
                    <option value="Fish Sales">Fish Sales</option>
                    <option value="Other">Other</option>
                  </>
                ) : (
                  EXPENSE_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))
                )}
              </select>
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Amount (₹)</label>
              <input
                type="number"
                min={1}
                step={0.01}
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Description</label>
            <input
              type="text"
              required
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="e.g. Monthly aerator electricity bill"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 bg-slate-100 rounded-lg">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 text-white font-semibold bg-sky-700 rounded-lg">
              Save Entry
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
