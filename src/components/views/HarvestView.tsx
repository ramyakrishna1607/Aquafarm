import React, { useMemo, useState } from 'react';
import { Plus, Search, Trash2 } from 'lucide-react';
import { useFarm } from '../../context/FarmContext';
import { HarvestRecord } from '../../types/aquafarm';
import { formatCurrency, formatDateShort, formatNumber } from '../../utils/calculations';
import { ModuleLogo, SpeciesLogo } from '../ui/BrandLogos';
import { Modal, StatTile, StatusLabel } from '../ui/CommonUI';

export const HarvestView: React.FC = () => {
  const { state, canDelete, addHarvestRecord, toggleHarvestPayment, deleteHarvestRecord } =
    useFarm();
  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [speciesFilter, setSpeciesFilter] = useState('All');

  const firstPond = state.ponds[0];
  const [form, setForm] = useState<Omit<HarvestRecord, 'id' | 'totalSales'>>({
    date: '2026-11-18',
    pondId: firstPond?.id ?? 'pond-1',
    species: firstPond?.species ?? 'Nile Tilapia',
    quantityKg: 800,
    avgWeightG: firstPond?.avgWeightGrams ?? 465,
    pricePerKg: 170,
    buyerName: '',
    buyerContact: '',
    paymentStatus: 'Paid',
  });

  const handleSelectPond = (pondId: string) => {
    const p = state.ponds.find((pond) => pond.id === pondId);
    setForm((prev) => ({
      ...prev,
      pondId,
      species: p?.species ?? prev.species,
      avgWeightG: p?.avgWeightGrams ?? prev.avgWeightG,
    }));
  };

  const filtered = useMemo(() => {
    return state.harvestRecords.filter((h) => {
      const pond = state.ponds.find((p) => p.id === h.pondId);
      const matchesSearch =
        h.buyerName.toLowerCase().includes(search.toLowerCase()) ||
        h.species.toLowerCase().includes(search.toLowerCase()) ||
        (pond?.code.toLowerCase().includes(search.toLowerCase()) ?? false);
      const matchesSpecies = speciesFilter === 'All' || h.species === speciesFilter;
      return matchesSearch && matchesSpecies;
    });
  }, [state.harvestRecords, state.ponds, search, speciesFilter]);

  const totalHarvestKg = state.harvestRecords.reduce((acc, h) => acc + h.quantityKg, 0);
  const totalSales = state.harvestRecords.reduce((acc, h) => acc + h.totalSales, 0);
  const pendingReceivables = state.harvestRecords
    .filter((h) => h.paymentStatus === 'Pending')
    .reduce((acc, h) => acc + h.totalSales, 0);
  const avgPricePerKg = totalHarvestKg > 0 ? totalSales / totalHarvestKg : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-start gap-3">
          <ModuleLogo kind="harvest" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Harvest Management</h1>
            <p className="text-xs text-slate-500 mt-1">
              Record pond harvests, wholesale buyer details, selling prices, and track sales settlements.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="px-4 py-2 text-xs font-semibold text-white bg-sky-700 hover:bg-sky-800 rounded-lg inline-flex items-center gap-1.5 whitespace-nowrap"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Record Harvest</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatTile
          label="Total Harvested Volume"
          value={`${formatNumber(totalHarvestKg)} kg`}
          detail={`${state.harvestRecords.length} harvest batches`}
          accent="sky"
        />
        <StatTile
          label="Total Harvest Sales"
          value={formatCurrency(totalSales)}
          detail="Synced with Fish Sales income"
          accent="teal"
        />
        <StatTile
          label="Average Selling Price"
          value={`${formatCurrency(avgPricePerKg)} / kg`}
          detail="Weighted across all species"
          accent="sky"
        />
        <StatTile
          label="Pending Receivables"
          value={formatCurrency(pendingReceivables)}
          detail="Awaiting buyer settlement"
          accent={pendingReceivables > 0 ? 'amber' : 'teal'}
        />
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by buyer, pond, or species..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg"
          />
        </div>
        <select
          value={speciesFilter}
          onChange={(e) => setSpeciesFilter(e.target.value)}
          className="px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg"
        >
          <option value="All">All Species</option>
          {state.speciesProfiles.map((sp) => (
            <option key={sp.id} value={sp.name}>
              {sp.name}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold text-slate-500">
                <th className="py-3 px-4">Harvest Date</th>
                <th className="py-3 px-4">Pond & Species</th>
                <th className="py-3 px-4 text-right">Quantity (kg)</th>
                <th className="py-3 px-4 text-right">Avg Fish Wt</th>
                <th className="py-3 px-4 text-right">Price / kg</th>
                <th className="py-3 px-4 text-right">Total Sales</th>
                <th className="py-3 px-4">Buyer Details</th>
                <th className="py-3 px-4">Payment</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filtered.map((h) => {
                const pond = state.ponds.find((p) => p.id === h.pondId);
                return (
                  <tr key={h.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 tabular-nums text-slate-600">
                      {formatDateShort(h.date)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <SpeciesLogo species={h.species} />
                        <div>
                          <div className="font-semibold text-slate-900">
                            {pond?.code ?? '—'} · {h.species}
                          </div>
                          <div className="text-[11px] text-slate-500">{pond?.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold text-slate-900">
                      {formatNumber(h.quantityKg)} kg
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-600">
                      {h.avgWeightG} g
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-700">
                      {formatCurrency(h.pricePerKg)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums font-bold text-teal-700">
                      {formatCurrency(h.totalSales)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-800">{h.buyerName}</div>
                      <div className="text-[11px] text-slate-500">{h.buyerContact}</div>
                    </td>
                    <td className="py-3 px-4">
                      <button
                        type="button"
                        onClick={() => toggleHarvestPayment(h.id)}
                        title="Click to toggle payment status"
                        className="hover:opacity-80"
                      >
                        <StatusLabel level={h.paymentStatus} />
                      </button>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {canDelete && (
                        <button
                          type="button"
                          onClick={() => deleteHarvestRecord(h.id)}
                          className="p-1 text-slate-400 hover:text-red-600"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Record Fish Harvest"
        subtitle="Automatically logs Fish Sales revenue and deducts harvested fish count from pond stock."
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!form.buyerName.trim()) return;
            addHarvestRecord(form);
            setModalOpen(false);
          }}
          className="space-y-3 text-xs"
        >
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Harvest Date</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Pond</label>
              <select
                value={form.pondId}
                onChange={(e) => handleSelectPond(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white"
              >
                {state.ponds.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.code} — {p.name} ({p.species})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Harvested Qty (kg)</label>
              <input
                type="number"
                min={1}
                value={form.quantityKg}
                onChange={(e) => setForm({ ...form, quantityKg: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Avg Weight (g)</label>
              <input
                type="number"
                min={1}
                value={form.avgWeightG}
                onChange={(e) => setForm({ ...form, avgWeightG: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Price / kg (₹)</label>
              <input
                type="number"
                min={0.1}
                step={0.1}
                value={form.pricePerKg}
                onChange={(e) => setForm({ ...form, pricePerKg: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Buyer Name</label>
              <input
                type="text"
                required
                value={form.buyerName}
                onChange={(e) => setForm({ ...form, buyerName: e.target.value })}
                placeholder="e.g. OceanGate Wholesale"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Buyer Contact</label>
              <input
                type="text"
                value={form.buyerContact}
                onChange={(e) => setForm({ ...form, buyerContact: e.target.value })}
                placeholder="+91 98450 00000"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg"
              />
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg flex items-center justify-between">
            <span className="font-medium text-slate-700">Estimated Total Sales</span>
            <span className="text-base font-bold font-mono text-teal-700">
              {formatCurrency(form.quantityKg * form.pricePerKg)}
            </span>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 bg-slate-100 rounded-lg">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 text-white font-semibold bg-sky-700 rounded-lg">
              Save Harvest
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
