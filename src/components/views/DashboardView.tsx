import React, { useMemo } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Calculator,
  CheckCircle2,
  Droplets,
  Fish,
  TrendingUp,
  Utensils,
  XCircle,
} from 'lucide-react';
import { useFarm } from '../../context/FarmContext';
import { AppRoute } from '../../types/aquafarm';
import {
  calculatePondBiomassKg,
  evaluateWaterReading,
  formatCurrency,
  formatDateShort,
  formatNumber,
  formatTimestamp,
} from '../../utils/calculations';
import { GroupedBarChart, InteractiveAreaChart } from '../charts/FarmCharts';
import { ModuleLogo } from '../ui/BrandLogos';
import { StatTile, StatusLabel } from '../ui/CommonUI';

export const DashboardView: React.FC<{ onNavigate: (route: AppRoute) => void }> = ({
  onNavigate,
}) => {
  const { state, alerts, canAccessFinance } = useFarm();

  const metrics = useMemo(() => {
    const totalPonds = state.ponds.length;
    const activePonds = state.ponds.filter(
      (p) => p.status === 'Active' || p.status === 'Harvest Ready'
    ).length;
    const totalStock = state.ponds.reduce((acc, p) => acc + p.currentStock, 0);
    const standingBiomassKg = state.ponds.reduce(
      (acc, p) => acc + calculatePondBiomassKg(p),
      0
    );
    const totalHarvestedKg = state.harvestRecords.reduce(
      (acc, h) => acc + h.quantityKg,
      0
    );
    const dailyScheduledFeedKg = state.feedingSchedules
      .filter((s) => s.active)
      .reduce((acc, s) => acc + s.quantityKg, 0);

    const totalExpenses = state.financialEntries
      .filter((f) => f.type === 'Expense')
      .reduce((acc, f) => acc + f.amount, 0);
    const totalRevenue = state.financialEntries
      .filter((f) => f.type === 'Income')
      .reduce((acc, f) => acc + f.amount, 0);
    const netProfit = totalRevenue - totalExpenses;

    // Water status counts across ponds
    let normalPonds = 0;
    let warningPonds = 0;
    let criticalPonds = 0;
    const pondStatuses = state.ponds.map((pond) => {
      const latest = state.waterReadings
        .filter((r) => r.pondId === pond.id)
        .sort((a, b) => b.timestamp.localeCompare(a.timestamp))[0];
      const profile = state.speciesProfiles.find((s) => s.name === pond.species);
      if (!latest) {
        warningPonds += 1;
        return { pond, level: 'Warning' as const, latest: undefined };
      }
      const ev = evaluateWaterReading(latest, profile);
      if (ev.overall === 'Normal') normalPonds += 1;
      else if (ev.overall === 'Warning') warningPonds += 1;
      else criticalPonds += 1;
      return { pond, level: ev.overall, latest };
    });

    return {
      totalPonds,
      activePonds,
      totalStock,
      standingBiomassKg,
      totalHarvestedKg,
      dailyScheduledFeedKg,
      totalExpenses,
      totalRevenue,
      netProfit,
      normalPonds,
      warningPonds,
      criticalPonds,
      pondStatuses,
    };
  }, [state]);

  // Monthly Revenue vs Expenses chart data
  const monthlyCashflow = useMemo(() => {
    const map = new Map<string, { income: number; expense: number }>();
    state.financialEntries.forEach((entry) => {
      const monthKey = entry.date.slice(0, 7);
      const current = map.get(monthKey) ?? { income: 0, expense: 0 };
      if (entry.type === 'Income') current.income += entry.amount;
      else current.expense += entry.amount;
      map.set(monthKey, current);
    });
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-5)
      .map(([month, vals]) => ({
        label: month,
        primary: Math.round(vals.income),
        secondary: Math.round(vals.expense),
      }));
  }, [state.financialEntries]);

  // Standing Biomass & Growth progression for P-01 & P-02
  const growthChartData = useMemo(() => {
    const pond1Samples = state.growthSamples
      .filter((g) => g.pondId === 'pond-1')
      .sort((a, b) => a.date.localeCompare(b.date));
    const pond2Samples = state.growthSamples
      .filter((g) => g.pondId === 'pond-2')
      .sort((a, b) => a.date.localeCompare(b.date));

    return pond1Samples.map((s, idx) => ({
      label: s.date.slice(5),
      value: s.avgWeightG,
      secondaryValue: pond2Samples[idx]?.avgWeightG,
    }));
  }, [state.growthSamples]);

  // Pond Biomass comparison
  const pondBiomassBars = useMemo(
    () =>
      state.ponds.map((p) => ({
        label: `${p.code} ${p.species}`,
        primary: Math.round(calculatePondBiomassKg(p)),
      })),
    [state.ponds]
  );

  const upcomingItems = alerts.slice(0, 5);
  const recentActivities = state.activities.slice(0, 6);

  return (
    <div className="space-y-6">
      {/* Page Title Row */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Farm Operations Overview
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time production biomass, water quality status, feeding schedules, and financial health across all ponds.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => onNavigate('health')}
            className="px-3.5 py-2 text-xs font-medium text-teal-800 bg-teal-50 border border-teal-200 hover:bg-teal-100 rounded-lg transition-colors inline-flex items-center gap-1.5 whitespace-nowrap"
          >
            <span>Virus Detection</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigate('calculators')}
            className="px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors inline-flex items-center gap-1.5 whitespace-nowrap"
          >
            <Calculator className="w-3.5 h-3.5 text-sky-700" />
            <span>Smart Calculators</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigate('ponds')}
            className="px-4 py-2 text-xs font-semibold text-white bg-sky-700 hover:bg-sky-800 rounded-lg transition-colors inline-flex items-center gap-1.5 whitespace-nowrap"
          >
            <span>Manage Ponds</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Core Operations Quick-Access Modules with Custom Logos */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {(
          [
            {
              route: 'ponds',
              logo: 'ponds',
              title: 'Ponds & Capacity',
              meta: `${metrics.totalPonds} ponds · ${formatNumber(state.ponds.reduce((a, p) => a + p.maxStockCapacity, 0))} max`,
            },
            {
              route: 'feeding',
              logo: 'feeding',
              title: 'Feeding Ops',
              meta: `${formatNumber(metrics.dailyScheduledFeedKg)} kg/day ration`,
            },
            {
              route: 'water',
              logo: 'water',
              title: 'Water Quality',
              meta: `${metrics.normalPonds} normal · ${metrics.criticalPonds} crit`,
            },
            {
              route: 'health',
              logo: 'virus',
              title: 'Virus Detection',
              meta: `${state.virusScans.length} digital scans`,
            },
            {
              route: 'harvest',
              logo: 'harvest',
              title: 'Harvests',
              meta: `${formatNumber(metrics.totalHarvestedKg)} kg yielded`,
            },
            {
              route: 'employees',
              logo: 'employees',
              title: 'Staff & ₹ Payroll',
              meta: `${state.employees.length} team members`,
            },
          ] as const
        ).map((mod) => (
          <button
            key={mod.route}
            type="button"
            onClick={() => onNavigate(mod.route)}
            className="bg-white border border-slate-200 hover:border-sky-600 rounded-xl p-3.5 text-left transition-colors flex items-center gap-3"
          >
            <ModuleLogo kind={mod.logo} size="sm" />
            <div className="min-w-0">
              <div className="text-xs font-semibold text-slate-900 truncate">{mod.title}</div>
              <div className="text-[11px] text-slate-500 truncate mt-0.5 tabular-nums">{mod.meta}</div>
            </div>
          </button>
        ))}
      </div>

      {/* Primary KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatTile
          label="Total Ponds"
          value={`${metrics.totalPonds} Units`}
          detail={`${metrics.activePonds} active / harvest-ready`}
          accent="sky"
        />
        <StatTile
          label="Total Fish Stock"
          value={formatNumber(metrics.totalStock)}
          detail={`${formatNumber(metrics.standingBiomassKg, 1)} kg · Max ${formatNumber(state.ponds.reduce((a, p) => a + p.maxStockCapacity, 0))} capacity`}
          accent="teal"
        />
        <StatTile
          label="Total Production Harvested"
          value={`${formatNumber(metrics.totalHarvestedKg)} kg`}
          detail={`${state.harvestRecords.length} completed harvests`}
          accent="sky"
        />
        <StatTile
          label="Daily Feed Consumption"
          value={`${formatNumber(metrics.dailyScheduledFeedKg)} kg/day`}
          detail={`${state.feedingSchedules.filter((s) => s.active).length} active feeding schedules`}
          accent="teal"
        />
      </div>

      {/* Secondary KPI Strip: Water Quality + Financials */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Water Quality Status</span>
            <Droplets className="w-4 h-4 text-sky-700" />
          </div>
          <div className="mt-2.5 flex items-center gap-3 text-xs font-semibold tabular-nums">
            <span className="inline-flex items-center gap-1 text-teal-700">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {metrics.normalPonds} Normal
            </span>
            <span className="inline-flex items-center gap-1 text-amber-700">
              <AlertTriangle className="w-3.5 h-3.5" />
              {metrics.warningPonds} Warn
            </span>
            <span className="inline-flex items-center gap-1 text-red-700">
              <XCircle className="w-3.5 h-3.5" />
              {metrics.criticalPonds} Crit
            </span>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('water')}
            className="text-left text-xs text-sky-700 hover:underline mt-2 font-medium"
          >
            Inspect pond readings
          </button>
        </div>

        {canAccessFinance ? (
          <>
            <StatTile
              label="Total Expenses"
              value={formatCurrency(metrics.totalExpenses)}
              detail="Feed, fingerlings, labour, utilities"
              accent="slate"
            />
            <StatTile
              label="Total Revenue"
              value={formatCurrency(metrics.totalRevenue)}
              detail="Verified fish harvest sales"
              accent="sky"
            />
            <StatTile
              label="Net Profit"
              value={formatCurrency(metrics.netProfit)}
              detail={
                metrics.totalRevenue > 0
                  ? `${Math.round((metrics.netProfit / metrics.totalRevenue) * 100)}% operating margin`
                  : 'No revenue yet'
              }
              accent={metrics.netProfit >= 0 ? 'teal' : 'red'}
            />
          </>
        ) : (
          <div className="sm:col-span-3 bg-white border border-slate-200 rounded-xl p-5 flex items-center justify-between">
            <div>
              <div className="text-xs font-medium text-slate-500">Today&apos;s Field Summary</div>
              <div className="text-sm font-semibold text-slate-900 mt-1">
                {state.employeeTasks.filter((t) => !t.completed).length} pending operational tasks ·{' '}
                {state.feedingSchedules.filter((s) => s.active).length} active feeding runs
              </div>
              <div className="text-xs text-slate-500 mt-1">
                Financial ledger figures are visible to Farm Managers and Admins.
              </div>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('feeding')}
              className="px-3.5 py-2 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg whitespace-nowrap"
            >
              Open Feeding Log
            </button>
          </div>
        )}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <InteractiveAreaChart
          title="Average Fish Weight Growth Curve"
          subtitle="Monthly sampling comparison (g per fish)"
          data={growthChartData}
          unit="g"
          primaryLabel="P-01 Nile Tilapia"
          secondaryLabel="P-02 Channel Catfish"
          primaryColor="#0369a1"
          secondaryColor="#0d9488"
        />

        {canAccessFinance ? (
          <GroupedBarChart
            title="Monthly Revenue vs Expenditure (₹)"
            subtitle="Cashflow comparison across recent operating months"
            data={monthlyCashflow}
            primaryLabel="Revenue"
            secondaryLabel="Expenses"
            unitPrefix="₹"
            primaryColor="#0369a1"
            secondaryColor="#64748b"
          />
        ) : (
          <GroupedBarChart
            title="Pond Standing Biomass Comparison"
            subtitle="Current estimated live weight per pond (kg)"
            data={pondBiomassBars}
            primaryLabel="Biomass (kg)"
            unitSuffix=" kg"
            primaryColor="#0d9488"
          />
        )}
      </div>

      {/* Pond Water & Stock Snapshot + Biomass Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Pond Production & Water Status</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Live stock, average weight, and latest water quality evaluation
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('ponds')}
              className="text-xs font-medium text-sky-700 hover:underline whitespace-nowrap"
            >
              View all ponds
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-semibold text-slate-500">
                  <th className="py-2.5 px-4">Pond</th>
                  <th className="py-2.5 px-4">Species</th>
                  <th className="py-2.5 px-4 text-right">Stock</th>
                  <th className="py-2.5 px-4 text-right">Biomass</th>
                  <th className="py-2.5 px-4 text-right">Temp / DO</th>
                  <th className="py-2.5 px-4">Water Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {metrics.pondStatuses.map(({ pond, level, latest }) => (
                  <tr key={pond.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{pond.code}</div>
                      <div className="text-[11px] text-slate-500">{pond.name}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-700">{pond.species}</td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-800">
                      {formatNumber(pond.currentStock)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums font-medium text-slate-900">
                      {formatNumber(calculatePondBiomassKg(pond), 1)} kg
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-600">
                      {latest
                        ? `${latest.temperatureC.toFixed(1)}°C / ${latest.dissolvedOxygenMgL.toFixed(1)}`
                        : 'No reading'}
                    </td>
                    <td className="py-3 px-4">
                      <StatusLabel level={level} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <GroupedBarChart
          title="Pond-Wise Biomass"
          subtitle="Current standing weight (kg)"
          data={pondBiomassBars}
          primaryLabel="Biomass"
          unitSuffix=" kg"
          primaryColor="#0d9488"
        />
      </div>

      {/* Bottom Row: Upcoming Activities & Recent Farm Log */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Upcoming Activities & Alerts</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Automated feeding, water testing, health, and harvest reminders
              </p>
            </div>
            <span className="text-xs font-mono tabular-nums text-slate-500">
              {alerts.length} total
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {upcomingItems.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">
                All schedules and water thresholds are clear.
              </div>
            ) : (
              upcomingItems.map((item) => (
                <div key={item.id} className="py-3 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-[11px] text-slate-500">
                      <span
                        className={`font-semibold ${
                          item.severity === 'Critical'
                            ? 'text-red-700'
                            : item.severity === 'Warning'
                              ? 'text-amber-700'
                              : 'text-sky-700'
                        }`}
                      >
                        {item.severity}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{item.category}</span>
                      <span aria-hidden="true">·</span>
                      <span className="tabular-nums">{formatDateShort(item.dueDate)}</span>
                    </div>
                    <div className="text-xs font-semibold text-slate-900 mt-0.5 truncate">
                      {item.title}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5 truncate">{item.detail}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Recent Farm Activities</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Latest operational logs recorded by farm staff
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Fish className="w-3.5 h-3.5 text-teal-600" />
              <Utensils className="w-3.5 h-3.5 text-sky-700" />
              <TrendingUp className="w-3.5 h-3.5 text-slate-500" />
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {recentActivities.map((act) => (
              <div key={act.id} className="py-3 flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="text-[11px] text-slate-500">
                    <span className="font-semibold text-slate-700">{act.module}</span>
                    <span aria-hidden="true"> · </span>
                    <span>{act.actor}</span>
                  </div>
                  <div className="text-xs text-slate-800 mt-0.5 leading-snug">
                    {act.description}
                  </div>
                </div>
                <div className="text-[11px] font-mono tabular-nums text-slate-400 shrink-0">
                  {formatTimestamp(act.timestamp)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
