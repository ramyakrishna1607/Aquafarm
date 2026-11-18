import React, { useMemo, useState } from 'react';
import { Download, Printer } from 'lucide-react';
import { useFarm } from '../../context/FarmContext';
import {
  calculateMortalityRatePct,
  calculatePondBiomassKg,
  downloadCSV,
  formatCurrency,
  formatNumber,
} from '../../utils/calculations';
import { GroupedBarChart, InteractiveAreaChart } from '../charts/FarmCharts';
import { AquaFarmLogo } from '../ui/BrandLogos';
import { StatTile } from '../ui/CommonUI';

export const ReportsView: React.FC = () => {
  const { state, canAccessFinance } = useFarm();
  const [startDate, setStartDate] = useState('2026-06-01');
  const [endDate, setEndDate] = useState('2026-11-30');
  const [pondFilter, setPondFilter] = useState('All');
  const [speciesFilter, setSpeciesFilter] = useState('All');

  const matchingPonds = useMemo(() => {
    return state.ponds.filter((p) => {
      const matchPond = pondFilter === 'All' || p.id === pondFilter;
      const matchSpecies = speciesFilter === 'All' || p.species === speciesFilter;
      return matchPond && matchSpecies;
    });
  }, [state.ponds, pondFilter, speciesFilter]);

  const matchingPondIds = useMemo(
    () => new Set(matchingPonds.map((p) => p.id)),
    [matchingPonds]
  );

  const inRange = (iso: string) => {
    const d = iso.slice(0, 10);
    return (!startDate || d >= startDate) && (!endDate || d <= endDate);
  };

  // Production & Mortality per pond
  const productionData = useMemo(() => {
    return matchingPonds.map((p) => {
      const harvested = state.harvestRecords
        .filter((h) => h.pondId === p.id && inRange(h.date))
        .reduce((acc, h) => acc + h.quantityKg, 0);
      return {
        label: `${p.code} (${p.species})`,
        primary: Math.round(calculatePondBiomassKg(p)),
        secondary: Math.round(harvested),
      };
    });
  }, [matchingPonds, state.harvestRecords, startDate, endDate]);

  // Feed consumption per pond
  const feedConsumptionData = useMemo(() => {
    return matchingPonds.map((p) => {
      const fedKg = state.feedingLogs
        .filter((f) => f.pondId === p.id && inRange(f.date))
        .reduce((acc, f) => acc + f.quantityKg, 0);
      return {
        label: `${p.code} ${p.name}`,
        primary: Math.round(fedKg),
      };
    });
  }, [matchingPonds, state.feedingLogs, startDate, endDate]);

  // Mortality rate per pond
  const mortalityData = useMemo(() => {
    return matchingPonds.map((p) => ({
      label: `${p.code} (${p.species})`,
      primary: calculateMortalityRatePct(p),
    }));
  }, [matchingPonds]);

  // Growth trend
  const growthTrend = useMemo(() => {
    return state.growthSamples
      .filter((g) => matchingPondIds.has(g.pondId) && inRange(g.date))
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((g) => {
        const pond = state.ponds.find((p) => p.id === g.pondId);
        return {
          label: `${g.date.slice(5)} ${pond?.code ?? ''}`,
          value: g.avgWeightG,
        };
      });
  }, [state.growthSamples, state.ponds, matchingPondIds, startDate, endDate]);

  // Water quality DO trend
  const waterTrend = useMemo(() => {
    return state.waterReadings
      .filter((w) => matchingPondIds.has(w.pondId) && inRange(w.timestamp))
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
      .map((w) => {
        const pond = state.ponds.find((p) => p.id === w.pondId);
        return {
          label: `${w.timestamp.slice(5, 10)} ${pond?.code ?? ''}`,
          value: w.dissolvedOxygenMgL,
          secondaryValue: w.temperatureC,
        };
      });
  }, [state.waterReadings, state.ponds, matchingPondIds, startDate, endDate]);

  // Monthly Expenses & Revenue
  const monthlyFinance = useMemo(() => {
    const map = new Map<string, { rev: number; exp: number }>();
    state.financialEntries
      .filter((e) => inRange(e.date) && (!e.pondId || matchingPondIds.has(e.pondId)))
      .forEach((e) => {
        const m = e.date.slice(0, 7);
        const cur = map.get(m) ?? { rev: 0, exp: 0 };
        if (e.type === 'Income') cur.rev += e.amount;
        else cur.exp += e.amount;
        map.set(m, cur);
      });
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, v]) => ({
        label: month,
        primary: Math.round(v.rev),
        secondary: Math.round(v.exp),
      }));
  }, [state.financialEntries, matchingPondIds, startDate, endDate]);

  const summary = useMemo(() => {
    const totalStandingKg = matchingPonds.reduce(
      (acc, p) => acc + calculatePondBiomassKg(p),
      0
    );
    const totalHarvestedKg = state.harvestRecords
      .filter((h) => matchingPondIds.has(h.pondId) && inRange(h.date))
      .reduce((acc, h) => acc + h.quantityKg, 0);
    const totalFeedKg = state.feedingLogs
      .filter((f) => matchingPondIds.has(f.pondId) && inRange(f.date))
      .reduce((acc, f) => acc + f.quantityKg, 0);
    const fin = state.financialEntries.filter(
      (e) => inRange(e.date) && (!e.pondId || matchingPondIds.has(e.pondId))
    );
    const revenue = fin.filter((f) => f.type === 'Income').reduce((a, b) => a + b.amount, 0);
    const expenses = fin.filter((f) => f.type === 'Expense').reduce((a, b) => a + b.amount, 0);
    return {
      totalStandingKg,
      totalHarvestedKg,
      totalFeedKg,
      revenue,
      expenses,
      profit: revenue - expenses,
    };
  }, [matchingPonds, matchingPondIds, state.harvestRecords, state.feedingLogs, state.financialEntries, startDate, endDate]);

  const handleExportCSV = () => {
    const headers = [
      'Pond Code',
      'Pond Name',
      'Species',
      'Current Stock',
      'Avg Weight (g)',
      'Standing Biomass (kg)',
      'Harvested (kg)',
      'Mortality (%)',
      'Feed Logged (kg)',
    ];
    const rows = matchingPonds.map((p) => {
      const harvested = state.harvestRecords
        .filter((h) => h.pondId === p.id && inRange(h.date))
        .reduce((acc, h) => acc + h.quantityKg, 0);
      const fed = state.feedingLogs
        .filter((f) => f.pondId === p.id && inRange(f.date))
        .reduce((acc, f) => acc + f.quantityKg, 0);
      return [
        p.code,
        p.name,
        p.species,
        p.currentStock,
        p.avgWeightGrams,
        calculatePondBiomassKg(p),
        harvested,
        calculateMortalityRatePct(p),
        fed,
      ];
    });
    downloadCSV(`aquafarm-analytics-${startDate}-to-${endDate}.csv`, headers, rows);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="hidden print:block pt-0.5">
            <AquaFarmLogo size="md" theme="dark" showSubtitle />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Reports & Analytics
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Filter production, growth, feed consumption, mortality, water trends, and profitability across dates, ponds, and species.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 no-print">
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
            onClick={() => window.print()}
            className="px-4 py-2 text-xs font-semibold text-white bg-sky-700 hover:bg-sky-800 rounded-lg inline-flex items-center gap-1.5 whitespace-nowrap"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Export PDF / Print</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 no-print">
        <div>
          <label className="block text-[11px] font-medium text-slate-500 mb-1">From Date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg"
          />
        </div>
        <div>
          <label className="block text-[11px] font-medium text-slate-500 mb-1">To Date</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg"
          />
        </div>
        <div>
          <label className="block text-[11px] font-medium text-slate-500 mb-1">Pond Filter</label>
          <select
            value={pondFilter}
            onChange={(e) => setPondFilter(e.target.value)}
            className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg"
          >
            <option value="All">All Ponds</option>
            {state.ponds.map((p) => (
              <option key={p.id} value={p.id}>
                {p.code} — {p.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[11px] font-medium text-slate-500 mb-1">Species Filter</label>
          <select
            value={speciesFilter}
            onChange={(e) => setSpeciesFilter(e.target.value)}
            className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg"
          >
            <option value="All">All Species</option>
            {state.speciesProfiles.map((sp) => (
              <option key={sp.id} value={sp.name}>
                {sp.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatTile
          label="Standing Biomass"
          value={`${formatNumber(summary.totalStandingKg, 1)} kg`}
          detail={`${matchingPonds.length} ponds selected`}
          accent="sky"
        />
        <StatTile
          label="Harvested Output"
          value={`${formatNumber(summary.totalHarvestedKg)} kg`}
          detail="Within selected date range"
          accent="teal"
        />
        <StatTile
          label="Logged Feed Used"
          value={`${formatNumber(summary.totalFeedKg)} kg`}
          detail="Recorded feeding volume"
          accent="sky"
        />
        <StatTile
          label={canAccessFinance ? 'Net Period Profit' : 'Average Mortality'}
          value={
            canAccessFinance
              ? formatCurrency(summary.profit)
              : `${
                  matchingPonds.length > 0
                    ? (
                        matchingPonds.reduce((a, p) => a + calculateMortalityRatePct(p), 0) /
                        matchingPonds.length
                      ).toFixed(1)
                    : '0.0'
                }%`
          }
          detail={
            canAccessFinance
              ? `Rev ${formatCurrency(summary.revenue)} · Exp ${formatCurrency(summary.expenses)}`
              : 'Across selected ponds'
          }
          accent="teal"
        />
      </div>

      {/* Visual Report Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GroupedBarChart
          title="Pond-Wise Production (Biomass vs Harvested)"
          subtitle="Live standing biomass vs harvested weight (kg)"
          data={productionData}
          primaryLabel="Standing Biomass"
          secondaryLabel="Harvested"
          unitSuffix=" kg"
          primaryColor="#0369a1"
          secondaryColor="#0d9488"
        />
        <GroupedBarChart
          title="Pond-Wise Mortality Rate (%)"
          subtitle="Cumulative stock loss percentage per pond"
          data={mortalityData}
          primaryLabel="Mortality %"
          unitSuffix="%"
          primaryColor="#d97706"
        />
        <InteractiveAreaChart
          title="Fish Growth Trajectory"
          subtitle="Sampled average fish weight (g) over time"
          data={growthTrend}
          unit="g"
          primaryLabel="Avg Weight"
          primaryColor="#0d9488"
        />
        <InteractiveAreaChart
          title="Water Quality Trend (DO & Temperature)"
          subtitle="Dissolved Oxygen (mg/L) vs Temperature (°C)"
          data={waterTrend}
          unit="mg/L / °C"
          primaryLabel="Dissolved O₂"
          secondaryLabel="Temperature"
          primaryColor="#0369a1"
          secondaryColor="#0d9488"
        />
        <GroupedBarChart
          title="Feed Consumption by Pond"
          subtitle="Logged feed distributed in selected period (kg)"
          data={feedConsumptionData}
          primaryLabel="Feed Consumed"
          unitSuffix=" kg"
          primaryColor="#0369a1"
        />
        {canAccessFinance && (
          <GroupedBarChart
            title="Monthly Revenue & Expenses"
            subtitle="Profitability trend across operating months"
            data={monthlyFinance}
            primaryLabel="Revenue"
            secondaryLabel="Expenses"
            unitPrefix="₹"
            primaryColor="#0369a1"
            secondaryColor="#64748b"
          />
        )}
      </div>
    </div>
  );
};
