import React, { useMemo, useState } from 'react';
import { AlertTriangle, Calculator, Check, CheckCircle2, Plus, Trash2 } from 'lucide-react';
import { useFarm } from '../../context/FarmContext';
import { FeedInventoryItem, FeedingSchedule } from '../../types/aquafarm';
import {
  calculatePondBiomassKg,
  calculateSmartDailyFeedKg,
  formatCurrency,
  formatDateShort,
  formatNumber,
} from '../../utils/calculations';
import { ModuleLogo } from '../ui/BrandLogos';
import { Modal, StatTile } from '../ui/CommonUI';

type FeedingTab = 'schedules' | 'inventory' | 'purchases' | 'logs' | 'calculator';

export const FeedingView: React.FC = () => {
  const {
    state,
    canDelete,
    addFeedingSchedule,
    toggleScheduleActive,
    deleteFeedingSchedule,
    executeScheduleFeeding,
    logManualFeeding,
    addFeedPurchase,
    addFeedInventory,
  } = useFarm();

  const [tab, setTab] = useState<FeedingTab>('schedules');
  const [schedModal, setSchedModal] = useState(false);
  const [logModal, setLogModal] = useState(false);
  const [purchaseModal, setPurchaseModal] = useState(false);
  const [invModal, setInvModal] = useState(false);

  const today = new Date().toISOString().slice(0, 10);

  // Forms
  const [schedForm, setSchedForm] = useState({
    pondId: state.ponds[0]?.id ?? 'pond-1',
    timeSlot: '08:00',
    feedId: state.feedInventory[0]?.id ?? 'feed-1',
    quantityKg: 50,
    frequency: 'Twice Daily' as FeedingSchedule['frequency'],
    active: true,
  });

  const [logForm, setLogForm] = useState({
    date: today,
    time: '08:00',
    pondId: state.ponds[0]?.id ?? 'pond-1',
    feedId: state.feedInventory[0]?.id ?? 'feed-1',
    quantityKg: 45,
  });

  const [purchaseForm, setPurchaseForm] = useState({
    date: today,
    feedId: state.feedInventory[0]?.id ?? 'feed-1',
    quantityKg: 500,
    totalCost: 36000,
    supplier: 'NutriAqua Feeds',
  });

  const [invForm, setInvForm] = useState({
    feedName: '',
    feedType: 'Floating Pellet' as FeedInventoryItem['feedType'],
    proteinPct: 32,
    stockKg: 500,
    reorderLevelKg: 250,
    costPerKg: 75,
    supplier: 'NutriAqua Feeds',
    lastRestocked: today,
  });

  // Smart Feeding Calculator State
  const [calcPondId, setCalcPondId] = useState<string>(state.ponds[0]?.id ?? 'pond-1');
  const selectedPond = state.ponds.find((p) => p.id === calcPondId) ?? state.ponds[0];
  const [calcStock, setCalcStock] = useState<number>(selectedPond?.currentStock ?? 10000);
  const [calcWeightG, setCalcWeightG] = useState<number>(selectedPond?.avgWeightGrams ?? 400);
  const [calcRatePct, setCalcRatePct] = useState<number>(3.0);
  const [calcMeals, setCalcMeals] = useState<number>(2);
  const [calcCostPerKg, setCalcCostPerKg] = useState<number>(72);

  const handleSelectCalcPond = (id: string) => {
    setCalcPondId(id);
    const p = state.ponds.find((pond) => pond.id === id);
    if (p) {
      setCalcStock(p.currentStock);
      setCalcWeightG(p.avgWeightGrams);
      const sp = state.speciesProfiles.find((s) => s.name === p.species);
      if (sp) setCalcRatePct(sp.defaultFeedRatioPct);
    }
  };

  const calcBiomassKg = (calcStock * calcWeightG) / 1000;
  const calcDailyFeedKg = calculateSmartDailyFeedKg(calcStock, calcWeightG, calcRatePct);
  const calcPerMealKg = Math.round((calcDailyFeedKg / Math.max(1, calcMeals)) * 100) / 100;
  const calcDailyCost = calcDailyFeedKg * calcCostPerKg;

  const totals = useMemo(() => {
    const totalInventoryKg = state.feedInventory.reduce((acc, f) => acc + f.stockKg, 0);
    const dailyPlannedKg = state.feedingSchedules
      .filter((s) => s.active)
      .reduce((acc, s) => acc + s.quantityKg, 0);
    const lowStockCount = state.feedInventory.filter(
      (f) => f.stockKg <= f.reorderLevelKg
    ).length;
    const totalLoggedCost = state.feedingLogs.reduce((acc, l) => acc + l.cost, 0);
    return { totalInventoryKg, dailyPlannedKg, lowStockCount, totalLoggedCost };
  }, [state]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-start gap-3">
          <ModuleLogo kind="feeding" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Feeding & Feed Inventory
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Manage daily feeding schedules, stock levels, purchase history, consumption logs, and biomass-based feed calculations.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setPurchaseModal(true)}
            className="px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg whitespace-nowrap"
          >
            Record Feed Purchase
          </button>
          <button
            type="button"
            onClick={() => setLogModal(true)}
            className="px-3.5 py-2 text-xs font-medium text-teal-800 bg-teal-50 border border-teal-200 hover:bg-teal-100 rounded-lg whitespace-nowrap"
          >
            Log Feeding
          </button>
          <button
            type="button"
            onClick={() => setSchedModal(true)}
            className="px-4 py-2 text-xs font-semibold text-white bg-sky-700 hover:bg-sky-800 rounded-lg inline-flex items-center gap-1.5 whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Schedule</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatTile
          label="Total Feed Inventory"
          value={`${formatNumber(totals.totalInventoryKg)} kg`}
          detail={`${state.feedInventory.length} feed varieties in store`}
          accent="sky"
        />
        <StatTile
          label="Daily Planned Ration"
          value={`${formatNumber(totals.dailyPlannedKg)} kg/day`}
          detail={`${state.feedingSchedules.filter((s) => s.active).length} active schedules`}
          accent="teal"
        />
        <StatTile
          label="Low Stock Alerts"
          value={`${totals.lowStockCount} Items`}
          detail={totals.lowStockCount > 0 ? 'Reorder required promptly' : 'All feed bins healthy'}
          accent={totals.lowStockCount > 0 ? 'amber' : 'teal'}
        />
        <StatTile
          label="Logged Feed Cost"
          value={formatCurrency(totals.totalLoggedCost)}
          detail={`${state.feedingLogs.length} feeding runs logged`}
          accent="sky"
        />
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-lg w-fit">
        {(
          [
            ['schedules', 'Daily Schedules'],
            ['inventory', 'Feed Inventory'],
            ['purchases', 'Purchase History'],
            ['logs', 'Consumption Reports'],
            ['calculator', 'Smart Feeding Calculator'],
          ] as [FeedingTab, string][]
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

      {/* Daily Schedules */}
      {tab === 'schedules' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold text-slate-500">
                  <th className="py-3 px-4">Time</th>
                  <th className="py-3 px-4">Pond</th>
                  <th className="py-3 px-4">Feed Type</th>
                  <th className="py-3 px-4 text-right">Quantity</th>
                  <th className="py-3 px-4">Frequency</th>
                  <th className="py-3 px-4">Today Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {state.feedingSchedules.map((sched) => {
                  const pond = state.ponds.find((p) => p.id === sched.pondId);
                  const fedToday = sched.lastFedDate === today;
                  return (
                    <tr key={sched.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4 font-mono tabular-nums font-semibold text-slate-900">
                        {sched.timeSlot}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-900">{pond?.code ?? '—'}</span>
                        <span className="text-slate-500"> · {pond?.name}</span>
                      </td>
                      <td className="py-3 px-4 text-slate-700">{sched.feedName}</td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold text-sky-800">
                        {sched.quantityKg} kg
                      </td>
                      <td className="py-3 px-4 text-slate-600">{sched.frequency}</td>
                      <td className="py-3 px-4">
                        {fedToday ? (
                          <span className="inline-flex items-center gap-1 text-teal-700 font-semibold">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Fed today
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-amber-700 font-medium">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            Pending
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => executeScheduleFeeding(sched.id)}
                            disabled={fedToday}
                            className={`px-2.5 py-1 rounded-md text-xs font-medium inline-flex items-center gap-1 transition-colors ${
                              fedToday
                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                : 'bg-teal-700 text-white hover:bg-teal-800'
                            }`}
                          >
                            <Check className="w-3 h-3" />
                            <span>{fedToday ? 'Logged' : 'Mark Fed'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleScheduleActive(sched.id)}
                            className="px-2 py-1 text-xs text-slate-600 hover:text-slate-900 border border-slate-200 rounded-md"
                          >
                            {sched.active ? 'Pause' : 'Resume'}
                          </button>
                          {canDelete && (
                            <button
                              type="button"
                              onClick={() => deleteFeedingSchedule(sched.id)}
                              className="p-1 text-slate-400 hover:text-red-600"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Feed Inventory */}
      {tab === 'inventory' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setInvModal(true)}
              className="px-3.5 py-2 text-xs font-semibold text-white bg-sky-700 hover:bg-sky-800 rounded-lg inline-flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Feed Variety</span>
            </button>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold text-slate-500">
                    <th className="py-3 px-4">Feed Name</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4 text-right">Protein</th>
                    <th className="py-3 px-4 text-right">Stock Level</th>
                    <th className="py-3 px-4 text-right">Reorder Threshold</th>
                    <th className="py-3 px-4 text-right">Cost / kg</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {state.feedInventory.map((item) => {
                    const isLow = item.stockKg <= item.reorderLevelKg;
                    return (
                      <tr key={item.id} className="hover:bg-slate-50/70">
                        <td className="py-3 px-4 font-semibold text-slate-900">
                          {item.feedName}
                          <div className="text-[11px] font-normal text-slate-500">
                            {item.supplier}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-slate-700">{item.feedType}</td>
                        <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-700">
                          {item.proteinPct}%
                        </td>
                        <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold text-slate-900">
                          {formatNumber(item.stockKg)} kg
                        </td>
                        <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-500">
                          {formatNumber(item.reorderLevelKg)} kg
                        </td>
                        <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-800">
                          {formatCurrency(item.costPerKg)}
                        </td>
                        <td className="py-3 px-4">
                          {isLow ? (
                            <span className="inline-flex items-center gap-1 text-amber-700 font-semibold">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              Low Stock
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-teal-700 font-semibold">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              In Stock
                            </span>
                          )}
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

      {/* Purchase History */}
      {tab === 'purchases' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold text-slate-500">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Feed Variety</th>
                  <th className="py-3 px-4">Supplier</th>
                  <th className="py-3 px-4 text-right">Quantity</th>
                  <th className="py-3 px-4 text-right">Total Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {state.feedPurchases.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 tabular-nums text-slate-600">
                      {formatDateShort(p.date)}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900">{p.feedName}</td>
                    <td className="py-3 px-4 text-slate-600">{p.supplier}</td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-900">
                      {formatNumber(p.quantityKg)} kg
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold text-sky-800">
                      {formatCurrency(p.totalCost)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Consumption Logs */}
      {tab === 'logs' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold text-slate-500">
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Pond</th>
                  <th className="py-3 px-4">Feed Variety</th>
                  <th className="py-3 px-4 text-right">Quantity</th>
                  <th className="py-3 px-4 text-right">Feed Cost</th>
                  <th className="py-3 px-4">Recorded By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {state.feedingLogs.map((log) => {
                  const pond = state.ponds.find((p) => p.id === log.pondId);
                  return (
                    <tr key={log.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4 font-mono tabular-nums text-slate-600">
                        {formatDateShort(log.date)} · {log.time}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        {pond?.code ?? '—'}
                      </td>
                      <td className="py-3 px-4 text-slate-700">{log.feedName}</td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold text-teal-700">
                        {log.quantityKg} kg
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-900">
                        {formatCurrency(log.cost)}
                      </td>
                      <td className="py-3 px-4 text-slate-600">{log.recordedBy}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Smart Feeding Calculator */}
      {tab === 'calculator' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Calculator className="w-4 h-4 text-sky-700" />
              <h2 className="text-sm font-semibold text-slate-900">
                Smart Biomass & Feed Ration Calculator
              </h2>
            </div>
            <p className="text-xs text-slate-500">
              Load values directly from any pond or adjust fish count, body weight, and feeding percentage.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Load From Pond</label>
                <select
                  value={calcPondId}
                  onChange={(e) => handleSelectCalcPond(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white"
                >
                  {state.ponds.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.code} — {p.name} ({p.species}) · {formatNumber(calculatePondBiomassKg(p), 1)} kg
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Estimated Fish Count
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={calcStock}
                    onChange={(e) => setCalcStock(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Average Weight (g)
                  </label>
                  <input
                    type="number"
                    min={0.5}
                    step={0.5}
                    value={calcWeightG}
                    onChange={(e) => setCalcWeightG(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Feeding Rate (% BW)
                  </label>
                  <input
                    type="number"
                    min={0.5}
                    max={12}
                    step={0.1}
                    value={calcRatePct}
                    onChange={(e) => setCalcRatePct(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Meals / Day</label>
                  <input
                    type="number"
                    min={1}
                    max={6}
                    value={calcMeals}
                    onChange={(e) => setCalcMeals(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Feed Cost (₹/kg)</label>
                  <input
                    type="number"
                    min={0.1}
                    step={0.05}
                    value={calcCostPerKg}
                    onChange={(e) => setCalcCostPerKg(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Recommended Daily Ration</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Formula: Biomass (kg) × Feeding Rate (%)
              </p>

              <div className="grid grid-cols-2 gap-4 mt-5">
                <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="text-xs text-slate-500">Estimated Biomass</div>
                  <div className="text-xl font-bold text-slate-900 tabular-nums mt-1">
                    {formatNumber(calcBiomassKg, 1)} kg
                  </div>
                </div>
                <div className="p-4 rounded-lg bg-sky-50 border border-sky-200">
                  <div className="text-xs text-sky-800 font-medium">Daily Feed Required</div>
                  <div className="text-xl font-bold text-sky-900 tabular-nums mt-1">
                    {formatNumber(calcDailyFeedKg, 2)} kg
                  </div>
                </div>
                <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="text-xs text-slate-500">Per Meal ({calcMeals}x daily)</div>
                  <div className="text-xl font-bold text-teal-700 tabular-nums mt-1">
                    {formatNumber(calcPerMealKg, 2)} kg
                  </div>
                </div>
                <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="text-xs text-slate-500">Daily Feed Cost</div>
                  <div className="text-xl font-bold text-slate-900 tabular-nums mt-1">
                    {formatCurrency(calcDailyCost)}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-200 flex items-center justify-between text-xs">
              <span className="text-slate-600">
                30-Day Projected Feed: <strong className="font-mono text-slate-900">{formatNumber(calcDailyFeedKg * 30, 0)} kg</strong>
              </span>
              <span className="font-mono font-semibold text-sky-800">
                {formatCurrency(calcDailyCost * 30)} / mo
              </span>
            </div>
          </div>
        </div>
      )}

      {/* New Schedule Modal */}
      <Modal
        open={schedModal}
        onClose={() => setSchedModal(false)}
        title="Create Feeding Schedule"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const feed = state.feedInventory.find((f) => f.id === schedForm.feedId);
            addFeedingSchedule({
              ...schedForm,
              feedName: feed?.feedName ?? 'Feed',
            });
            setSchedModal(false);
          }}
          className="space-y-3 text-xs"
        >
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Pond</label>
              <select
                value={schedForm.pondId}
                onChange={(e) => setSchedForm({ ...schedForm, pondId: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white"
              >
                {state.ponds.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.code} — {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Feed Time</label>
              <input
                type="time"
                value={schedForm.timeSlot}
                onChange={(e) => setSchedForm({ ...schedForm, timeSlot: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
              />
            </div>
          </div>
          <div>
            <label className="block font-medium text-slate-700 mb-1">Feed Variety</label>
            <select
              value={schedForm.feedId}
              onChange={(e) => setSchedForm({ ...schedForm, feedId: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white"
            >
              {state.feedInventory.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.feedName} ({f.stockKg} kg avail)
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Quantity (kg)</label>
              <input
                type="number"
                min={1}
                value={schedForm.quantityKg}
                onChange={(e) => setSchedForm({ ...schedForm, quantityKg: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Frequency</label>
              <select
                value={schedForm.frequency}
                onChange={(e) =>
                  setSchedForm({
                    ...schedForm,
                    frequency: e.target.value as FeedingSchedule['frequency'],
                  })
                }
                className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white"
              >
                <option value="Daily">Daily</option>
                <option value="Twice Daily">Twice Daily</option>
                <option value="Three Times Daily">Three Times Daily</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setSchedModal(false)} className="px-4 py-2 bg-slate-100 rounded-lg">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 text-white font-semibold bg-sky-700 rounded-lg">
              Save Schedule
            </button>
          </div>
        </form>
      </Modal>

      {/* Log Manual Feeding Modal */}
      <Modal
        open={logModal}
        onClose={() => setLogModal(false)}
        title="Log Feed Distribution"
        subtitle="Deducts feed from store inventory and logs consumption cost."
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            logManualFeeding(logForm);
            setLogModal(false);
          }}
          className="space-y-3 text-xs"
        >
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Date</label>
              <input
                type="date"
                value={logForm.date}
                onChange={(e) => setLogForm({ ...logForm, date: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Time</label>
              <input
                type="time"
                value={logForm.time}
                onChange={(e) => setLogForm({ ...logForm, time: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
              />
            </div>
          </div>
          <div>
            <label className="block font-medium text-slate-700 mb-1">Pond</label>
            <select
              value={logForm.pondId}
              onChange={(e) => setLogForm({ ...logForm, pondId: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white"
            >
              {state.ponds.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.code} — {p.name}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Feed Variety</label>
              <select
                value={logForm.feedId}
                onChange={(e) => setLogForm({ ...logForm, feedId: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white"
              >
                {state.feedInventory.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.feedName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Quantity (kg)</label>
              <input
                type="number"
                min={0.5}
                step={0.5}
                value={logForm.quantityKg}
                onChange={(e) => setLogForm({ ...logForm, quantityKg: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setLogModal(false)} className="px-4 py-2 bg-slate-100 rounded-lg">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 text-white font-semibold bg-teal-700 rounded-lg">
              Log Feeding
            </button>
          </div>
        </form>
      </Modal>

      {/* Feed Purchase Modal */}
      <Modal
        open={purchaseModal}
        onClose={() => setPurchaseModal(false)}
        title="Record Feed Purchase"
        subtitle="Adds purchased stock to inventory and creates a Feed expense record."
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            addFeedPurchase(purchaseForm);
            setPurchaseModal(false);
          }}
          className="space-y-3 text-xs"
        >
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Purchase Date</label>
              <input
                type="date"
                value={purchaseForm.date}
                onChange={(e) => setPurchaseForm({ ...purchaseForm, date: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Supplier</label>
              <input
                type="text"
                required
                value={purchaseForm.supplier}
                onChange={(e) => setPurchaseForm({ ...purchaseForm, supplier: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg"
              />
            </div>
          </div>
          <div>
            <label className="block font-medium text-slate-700 mb-1">Feed Item</label>
            <select
              value={purchaseForm.feedId}
              onChange={(e) => setPurchaseForm({ ...purchaseForm, feedId: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white"
            >
              {state.feedInventory.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.feedName}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Quantity (kg)</label>
              <input
                type="number"
                min={1}
                value={purchaseForm.quantityKg}
                onChange={(e) =>
                  setPurchaseForm({ ...purchaseForm, quantityKg: Number(e.target.value) })
                }
                className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Total Cost (₹)</label>
              <input
                type="number"
                min={1}
                step={0.01}
                value={purchaseForm.totalCost}
                onChange={(e) =>
                  setPurchaseForm({ ...purchaseForm, totalCost: Number(e.target.value) })
                }
                className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setPurchaseModal(false)} className="px-4 py-2 bg-slate-100 rounded-lg">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 text-white font-semibold bg-sky-700 rounded-lg">
              Record Purchase
            </button>
          </div>
        </form>
      </Modal>

      {/* Add Feed Inventory Variety */}
      <Modal
        open={invModal}
        onClose={() => setInvModal(false)}
        title="Add New Feed Variety"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!invForm.feedName.trim()) return;
            addFeedInventory(invForm);
            setInvModal(false);
          }}
          className="space-y-3 text-xs"
        >
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Feed Name</label>
              <input
                type="text"
                required
                value={invForm.feedName}
                onChange={(e) => setInvForm({ ...invForm, feedName: e.target.value })}
                placeholder="e.g. Grower Pro 35% 3mm"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Feed Type</label>
              <select
                value={invForm.feedType}
                onChange={(e) =>
                  setInvForm({
                    ...invForm,
                    feedType: e.target.value as FeedInventoryItem['feedType'],
                  })
                }
                className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white"
              >
                <option value="Starter Crumble">Starter Crumble</option>
                <option value="Floating Pellet">Floating Pellet</option>
                <option value="Sinking Pellet">Sinking Pellet</option>
                <option value="Grower Mash">Grower Mash</option>
                <option value="Shrimp Pellet">Shrimp Pellet</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Initial Stock (kg)</label>
              <input
                type="number"
                value={invForm.stockKg}
                onChange={(e) => setInvForm({ ...invForm, stockKg: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Reorder At (kg)</label>
              <input
                type="number"
                value={invForm.reorderLevelKg}
                onChange={(e) => setInvForm({ ...invForm, reorderLevelKg: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Cost / kg (₹)</label>
              <input
                type="number"
                step={0.01}
                value={invForm.costPerKg}
                onChange={(e) => setInvForm({ ...invForm, costPerKg: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setInvModal(false)} className="px-4 py-2 bg-slate-100 rounded-lg">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 text-white font-semibold bg-sky-700 rounded-lg">
              Save Feed
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
