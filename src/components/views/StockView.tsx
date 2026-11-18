import React, { useMemo, useState } from 'react';
import { Fish, Plus, TrendingUp } from 'lucide-react';
import { useFarm } from '../../context/FarmContext';
import {
  calculateMortalityRatePct,
  calculatePondBiomassKg,
  calculateSurvivalRatePct,
  formatCurrency,
  formatDateShort,
  formatNumber,
} from '../../utils/calculations';
import { InteractiveAreaChart } from '../charts/FarmCharts';
import { Modal, StatTile } from '../ui/CommonUI';

type StockTab = 'overview' | 'fingerlings' | 'mortality' | 'growth' | 'species';

export const StockView: React.FC = () => {
  const {
    state,
    addFingerlingBatch,
    addMortalityRecord,
    addGrowthSample,
    addSpeciesProfile,
  } = useFarm();
  const [tab, setTab] = useState<StockTab>('overview');
  const [selectedGrowthPond, setSelectedGrowthPond] = useState<string>(
    state.ponds[0]?.id ?? 'pond-1'
  );

  // Modals
  const [fingerlingModal, setFingerlingModal] = useState(false);
  const [mortalityModal, setMortalityModal] = useState(false);
  const [growthModal, setGrowthModal] = useState(false);
  const [speciesModal, setSpeciesModal] = useState(false);

  // Form states
  const [fbForm, setFbForm] = useState({
    date: '2026-11-18',
    pondId: state.ponds[0]?.id ?? 'pond-1',
    species: 'Nile Tilapia',
    supplier: 'BlueWater Hatcheries Ltd.',
    quantity: 5000,
    unitCost: 4.5,
    avgWeightG: 8,
  });

  const [mortForm, setMortForm] = useState({
    date: '2026-11-18',
    pondId: state.ponds[0]?.id ?? 'pond-1',
    count: 15,
    cause: 'Handling stress',
    notes: '',
  });

  const [grForm, setGrForm] = useState({
    date: '2026-11-18',
    pondId: state.ponds[0]?.id ?? 'pond-1',
    sampleSize: 100,
    avgWeightG: 480,
    avgLengthCm: 28.5,
    notes: '',
  });

  const [spForm, setSpForm] = useState({
    name: '',
    scientificName: '',
    optimalTempMin: 24,
    optimalTempMax: 30,
    optimalPhMin: 6.8,
    optimalPhMax: 8.2,
    minDO: 4.5,
    maxAmmonia: 0.05,
    minTransparencyCm: 30,
    targetHarvestWeightG: 500,
    defaultFeedRatioPct: 3.0,
    recommendedPerSqM: 5,
  });

  const totalCurrentFish = state.ponds.reduce((acc, p) => acc + p.currentStock, 0);
  const totalInitialFish = state.ponds.reduce((acc, p) => acc + p.initialStock, 0);
  const totalMortalities = state.mortalityRecords.reduce((acc, m) => acc + m.count, 0);
  const avgSurvival =
    totalInitialFish > 0
      ? Math.round((totalCurrentFish / totalInitialFish) * 1000) / 10
      : 100;

  const growthSeries = useMemo(() => {
    return state.growthSamples
      .filter((g) => g.pondId === selectedGrowthPond)
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((g) => ({
        label: g.date.slice(5),
        value: g.avgWeightG,
      }));
  }, [state.growthSamples, selectedGrowthPond]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Fish Stock & Growth Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Track species profiles, fingerling purchases, mortality logs, survival rates, and average fish weight growth.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setMortalityModal(true)}
            className="px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg whitespace-nowrap"
          >
            Log Mortality
          </button>
          <button
            type="button"
            onClick={() => setGrowthModal(true)}
            className="px-3.5 py-2 text-xs font-medium text-teal-800 bg-teal-50 border border-teal-200 hover:bg-teal-100 rounded-lg whitespace-nowrap"
          >
            Record Growth Sample
          </button>
          <button
            type="button"
            onClick={() => setFingerlingModal(true)}
            className="px-4 py-2 text-xs font-semibold text-white bg-sky-700 hover:bg-sky-800 rounded-lg inline-flex items-center gap-1.5 whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Fingerlings</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatTile
          label="Estimated Population"
          value={formatNumber(totalCurrentFish)}
          detail={`Across ${state.ponds.length} stocked ponds`}
          accent="sky"
        />
        <StatTile
          label="Overall Survival Rate"
          value={`${avgSurvival}%`}
          detail={`${formatNumber(totalInitialFish)} initially stocked`}
          accent="teal"
        />
        <StatTile
          label="Recorded Mortalities"
          value={formatNumber(totalMortalities)}
          detail={`${state.mortalityRecords.length} logged incidents`}
          accent="amber"
        />
        <StatTile
          label="Cultured Species"
          value={`${state.speciesProfiles.length}`}
          detail="Configured growth & water profiles"
          accent="sky"
        />
      </div>

      {/* Segmented Tabs */}
      <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-lg w-fit">
        {(
          [
            ['overview', 'Current Stock & Biomass'],
            ['fingerlings', 'Fingerling Purchases'],
            ['mortality', 'Mortality Records'],
            ['growth', 'Growth Tracking'],
            ['species', 'Species Directory'],
          ] as [StockTab, string][]
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              tab === id
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {tab === 'overview' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold text-slate-500">
                  <th className="py-3 px-4">Pond</th>
                  <th className="py-3 px-4">Species</th>
                  <th className="py-3 px-4 text-right">Initial Stock</th>
                  <th className="py-3 px-4 text-right">Est. Population</th>
                  <th className="py-3 px-4 text-right">Survival / Mortality</th>
                  <th className="py-3 px-4 text-right">Avg Weight</th>
                  <th className="py-3 px-4 text-right">Target Weight</th>
                  <th className="py-3 px-4 text-right">Standing Biomass</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {state.ponds.map((pond) => {
                  const profile = state.speciesProfiles.find((s) => s.name === pond.species);
                  const targetW = profile?.targetHarvestWeightG ?? 500;
                  const pctTarget = Math.min(
                    100,
                    Math.round((pond.avgWeightGrams / targetW) * 100)
                  );
                  return (
                    <tr key={pond.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        {pond.code} · <span className="font-normal text-slate-600">{pond.name}</span>
                      </td>
                      <td className="py-3 px-4 text-slate-700">{pond.species}</td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-600">
                        {formatNumber(pond.initialStock)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold text-slate-900">
                        {formatNumber(pond.currentStock)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums">
                        <span className="text-teal-700 font-medium">
                          {calculateSurvivalRatePct(pond)}%
                        </span>
                        <span className="text-slate-400"> / </span>
                        <span className="text-amber-700">
                          {calculateMortalityRatePct(pond)}%
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-800">
                        {pond.avgWeightGrams} g
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-600">
                        {targetW} g ({pctTarget}%)
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold text-sky-800">
                        {formatNumber(calculatePondBiomassKg(pond), 1)} kg
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'fingerlings' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold text-slate-500">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Pond</th>
                  <th className="py-3 px-4">Species</th>
                  <th className="py-3 px-4">Hatchery Supplier</th>
                  <th className="py-3 px-4 text-right">Quantity</th>
                  <th className="py-3 px-4 text-right">Avg Weight</th>
                  <th className="py-3 px-4 text-right">Unit Cost</th>
                  <th className="py-3 px-4 text-right">Total Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {state.fingerlingBatches.map((batch) => {
                  const pond = state.ponds.find((p) => p.id === batch.pondId);
                  return (
                    <tr key={batch.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4 tabular-nums text-slate-600">
                        {formatDateShort(batch.date)}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        {pond?.code ?? '—'}
                      </td>
                      <td className="py-3 px-4 text-slate-700">{batch.species}</td>
                      <td className="py-3 px-4 text-slate-600">{batch.supplier}</td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-900">
                        {formatNumber(batch.quantity)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-600">
                        {batch.avgWeightG} g
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-600">
                        {formatCurrency(batch.unitCost)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold text-sky-800">
                        {formatCurrency(batch.totalCost)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'mortality' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold text-slate-500">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Pond</th>
                  <th className="py-3 px-4 text-right">Mortality Count</th>
                  <th className="py-3 px-4">Identified Cause</th>
                  <th className="py-3 px-4">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {state.mortalityRecords.map((m) => {
                  const pond = state.ponds.find((p) => p.id === m.pondId);
                  return (
                    <tr key={m.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4 tabular-nums text-slate-600">
                        {formatDateShort(m.date)}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        {pond ? `${pond.code} — ${pond.name}` : '—'}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold text-red-700">
                        {formatNumber(m.count)}
                      </td>
                      <td className="py-3 px-4 text-slate-800">{m.cause}</td>
                      <td className="py-3 px-4 text-slate-500">{m.notes ?? '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'growth' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-slate-200 rounded-xl p-4">
            <div className="flex items-center gap-2 text-xs">
              <TrendingUp className="w-4 h-4 text-teal-600" />
              <span className="font-semibold text-slate-900">Inspect Pond Growth Curve:</span>
            </div>
            <select
              value={selectedGrowthPond}
              onChange={(e) => setSelectedGrowthPond(e.target.value)}
              className="px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg"
            >
              {state.ponds.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.code} — {p.name} ({p.species})
                </option>
              ))}
            </select>
          </div>

          <InteractiveAreaChart
            title="Average Fish Weight Progression"
            subtitle="Based on periodic biometric sampling (grams)"
            data={growthSeries}
            unit="g"
            primaryLabel="Avg Fish Weight"
            primaryColor="#0d9488"
          />

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold text-slate-500">
                    <th className="py-3 px-4">Sample Date</th>
                    <th className="py-3 px-4">Pond</th>
                    <th className="py-3 px-4 text-right">Sample Size</th>
                    <th className="py-3 px-4 text-right">Avg Weight (g)</th>
                    <th className="py-3 px-4 text-right">Avg Length (cm)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {state.growthSamples.map((g) => {
                    const pond = state.ponds.find((p) => p.id === g.pondId);
                    return (
                      <tr key={g.id} className="hover:bg-slate-50/70">
                        <td className="py-3 px-4 tabular-nums text-slate-600">
                          {formatDateShort(g.date)}
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-900">
                          {pond ? `${pond.code} · ${pond.species}` : '—'}
                        </td>
                        <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-600">
                          {g.sampleSize} fish
                        </td>
                        <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold text-teal-700">
                          {g.avgWeightG} g
                        </td>
                        <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-700">
                          {g.avgLengthCm} cm
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === 'species' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setSpeciesModal(true)}
              className="px-3.5 py-2 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg inline-flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Species Profile</span>
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {state.speciesProfiles.map((sp) => (
              <div key={sp.id} className="bg-white border border-slate-200 rounded-xl p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{sp.name}</h3>
                    <div className="text-xs italic text-slate-500">{sp.scientificName}</div>
                  </div>
                  <Fish className="w-4 h-4 text-sky-700" />
                </div>
                <div className="mt-4 space-y-1.5 text-xs border-t border-slate-100 pt-3 tabular-nums">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Optimal Temp</span>
                    <span className="font-mono font-medium text-slate-800">
                      {sp.optimalTempMin}–{sp.optimalTempMax} °C
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Safe pH Range</span>
                    <span className="font-mono font-medium text-slate-800">
                      {sp.optimalPhMin}–{sp.optimalPhMax}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Min Dissolved O₂</span>
                    <span className="font-mono font-medium text-slate-800">{sp.minDO} mg/L</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Max Ammonia (NH₃)</span>
                    <span className="font-mono font-medium text-slate-800">
                      {sp.maxAmmonia} mg/L
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Target Harvest Weight</span>
                    <span className="font-mono font-semibold text-teal-700">
                      {sp.targetHarvestWeightG} g
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Safe Growing Density</span>
                    <span className="font-mono font-semibold text-sky-800">
                      {sp.recommendedPerSqM} fish / m²
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Fingerling Purchase Modal */}
      <Modal
        open={fingerlingModal}
        onClose={() => setFingerlingModal(false)}
        title="Record Fingerling Purchase"
        subtitle="Automatically increases pond stock and records a Fingerlings expense entry."
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            addFingerlingBatch(fbForm);
            setFingerlingModal(false);
          }}
          className="space-y-3 text-xs"
        >
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Date</label>
              <input
                type="date"
                value={fbForm.date}
                onChange={(e) => setFbForm({ ...fbForm, date: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Target Pond</label>
              <select
                value={fbForm.pondId}
                onChange={(e) => setFbForm({ ...fbForm, pondId: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white"
              >
                {state.ponds.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.code} — {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Species</label>
              <select
                value={fbForm.species}
                onChange={(e) => setFbForm({ ...fbForm, species: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white"
              >
                {state.speciesProfiles.map((sp) => (
                  <option key={sp.id} value={sp.name}>
                    {sp.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Supplier</label>
              <input
                type="text"
                required
                value={fbForm.supplier}
                onChange={(e) => setFbForm({ ...fbForm, supplier: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg"
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Quantity</label>
              <input
                type="number"
                min={1}
                value={fbForm.quantity}
                onChange={(e) => setFbForm({ ...fbForm, quantity: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Unit Cost (₹)</label>
              <input
                type="number"
                step={0.01}
                min={0.01}
                value={fbForm.unitCost}
                onChange={(e) => setFbForm({ ...fbForm, unitCost: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Avg Weight (g)</label>
              <input
                type="number"
                step={0.1}
                min={0.1}
                value={fbForm.avgWeightG}
                onChange={(e) => setFbForm({ ...fbForm, avgWeightG: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
              />
            </div>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg flex justify-between font-medium">
            <span>Calculated Total Cost</span>
            <span className="font-mono font-bold text-sky-800">
              {formatCurrency(fbForm.quantity * fbForm.unitCost)}
            </span>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setFingerlingModal(false)}
              className="px-4 py-2 bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-white font-semibold bg-sky-700 hover:bg-sky-800 rounded-lg"
            >
              Save Purchase
            </button>
          </div>
        </form>
      </Modal>

      {/* Mortality Modal */}
      <Modal
        open={mortalityModal}
        onClose={() => setMortalityModal(false)}
        title="Log Fish Mortality"
        subtitle="Deducts lost fish count from estimated pond population."
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            addMortalityRecord(mortForm);
            setMortalityModal(false);
          }}
          className="space-y-3 text-xs"
        >
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Date</label>
              <input
                type="date"
                value={mortForm.date}
                onChange={(e) => setMortForm({ ...mortForm, date: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Pond</label>
              <select
                value={mortForm.pondId}
                onChange={(e) => setMortForm({ ...mortForm, pondId: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white"
              >
                {state.ponds.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.code} — {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Mortality Count</label>
              <input
                type="number"
                min={1}
                value={mortForm.count}
                onChange={(e) => setMortForm({ ...mortForm, count: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Cause</label>
              <input
                type="text"
                required
                value={mortForm.cause}
                onChange={(e) => setMortForm({ ...mortForm, cause: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg"
              />
            </div>
          </div>
          <div>
            <label className="block font-medium text-slate-700 mb-1">Notes</label>
            <textarea
              rows={2}
              value={mortForm.notes}
              onChange={(e) => setMortForm({ ...mortForm, notes: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setMortalityModal(false)}
              className="px-4 py-2 bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-white font-semibold bg-sky-700 hover:bg-sky-800 rounded-lg"
            >
              Record Mortality
            </button>
          </div>
        </form>
      </Modal>

      {/* Growth Sample Modal */}
      <Modal
        open={growthModal}
        onClose={() => setGrowthModal(false)}
        title="Record Growth Sampling"
        subtitle="Updates pond average fish weight and appends to growth chart."
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            addGrowthSample(grForm);
            setGrowthModal(false);
          }}
          className="space-y-3 text-xs"
        >
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Sample Date</label>
              <input
                type="date"
                value={grForm.date}
                onChange={(e) => setGrForm({ ...grForm, date: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Pond</label>
              <select
                value={grForm.pondId}
                onChange={(e) => setGrForm({ ...grForm, pondId: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white"
              >
                {state.ponds.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.code} — {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Sample Size</label>
              <input
                type="number"
                min={1}
                value={grForm.sampleSize}
                onChange={(e) => setGrForm({ ...grForm, sampleSize: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Avg Weight (g)</label>
              <input
                type="number"
                step={0.1}
                min={0.1}
                value={grForm.avgWeightG}
                onChange={(e) => setGrForm({ ...grForm, avgWeightG: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Avg Length (cm)</label>
              <input
                type="number"
                step={0.1}
                min={0.1}
                value={grForm.avgLengthCm}
                onChange={(e) => setGrForm({ ...grForm, avgLengthCm: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setGrowthModal(false)}
              className="px-4 py-2 bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-white font-semibold bg-teal-700 hover:bg-teal-800 rounded-lg"
            >
              Save Sample
            </button>
          </div>
        </form>
      </Modal>

      {/* Add Species Modal */}
      <Modal
        open={speciesModal}
        onClose={() => setSpeciesModal(false)}
        title="Add Fish Species Profile"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!spForm.name.trim()) return;
            addSpeciesProfile(spForm);
            setSpeciesModal(false);
          }}
          className="space-y-3 text-xs"
        >
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Common Name</label>
              <input
                type="text"
                required
                value={spForm.name}
                onChange={(e) => setSpForm({ ...spForm, name: e.target.value })}
                placeholder="e.g. Rainbow Trout"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Scientific Name</label>
              <input
                type="text"
                value={spForm.scientificName}
                onChange={(e) => setSpForm({ ...spForm, scientificName: e.target.value })}
                placeholder="Oncorhynchus mykiss"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Temp Min (°C)</label>
              <input
                type="number"
                value={spForm.optimalTempMin}
                onChange={(e) => setSpForm({ ...spForm, optimalTempMin: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Temp Max (°C)</label>
              <input
                type="number"
                value={spForm.optimalTempMax}
                onChange={(e) => setSpForm({ ...spForm, optimalTempMax: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Min DO (mg/L)</label>
              <input
                type="number"
                step={0.1}
                value={spForm.minDO}
                onChange={(e) => setSpForm({ ...spForm, minDO: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Target Harvest (g)</label>
              <input
                type="number"
                value={spForm.targetHarvestWeightG}
                onChange={(e) =>
                  setSpForm({ ...spForm, targetHarvestWeightG: Number(e.target.value) })
                }
                className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Growing Density (fish / m²)
              </label>
              <input
                type="number"
                min={1}
                step={0.5}
                value={spForm.recommendedPerSqM}
                onChange={(e) =>
                  setSpForm({ ...spForm, recommendedPerSqM: Number(e.target.value) })
                }
                className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Default Feed Ratio (% BW)
              </label>
              <input
                type="number"
                min={0.5}
                step={0.1}
                value={spForm.defaultFeedRatioPct}
                onChange={(e) =>
                  setSpForm({ ...spForm, defaultFeedRatioPct: Number(e.target.value) })
                }
                className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setSpeciesModal(false)}
              className="px-4 py-2 bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-white font-semibold bg-teal-700 hover:bg-teal-800 rounded-lg"
            >
              Add Species
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
