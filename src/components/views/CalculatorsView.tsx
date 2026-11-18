import React, { useState } from 'react';
import { Calculator } from 'lucide-react';
import { useFarm } from '../../context/FarmContext';
import {
  calculateMortalityRatePct,
  calculatePondBiomassKg,
  calculateSmartDailyFeedKg,
  evaluateWaterReading,
  formatCurrency,
  formatNumber,
} from '../../utils/calculations';
import { StatusLabel } from '../ui/CommonUI';

export const CalculatorsView: React.FC = () => {
  const { state, canAccessFinance } = useFarm();

  // 1. Smart Feeding Calculator
  const [feedStock, setFeedStock] = useState(14420);
  const [feedAvgG, setFeedAvgG] = useState(465);
  const [feedPct, setFeedPct] = useState(3.0);
  const [feedPrice, setFeedPrice] = useState(72);

  // 2. Mortality Calculator
  const [mortInitial, setMortInitial] = useState(15000);
  const [mortCurrent, setMortCurrent] = useState(14420);

  // 3. Growth & FCR Calculator
  const [startWeightG, setStartWeightG] = useState(12);
  const [endWeightG, setEndWeightG] = useState(465);
  const [cultureDays, setCultureDays] = useState(150);
  const [totalBiomassGainKg, setTotalBiomassGainKg] = useState(6500);
  const [totalFeedUsedKg, setTotalFeedUsedKg] = useState(9100);

  // 4. Profit Calculator
  const [harvestKg, setHarvestKg] = useState(5000);
  const [priceKg, setPriceKg] = useState(170);
  const [costFingerlings, setCostFingerlings] = useState(67500);
  const [costFeed, setCostFeed] = useState(320000);
  const [costOther, setCostOther] = useState(95000);

  // Calculations
  const dailyFeedKg = calculateSmartDailyFeedKg(feedStock, feedAvgG, feedPct);
  const biomassKg = (feedStock * feedAvgG) / 1000;

  const lostCount = Math.max(0, mortInitial - mortCurrent);
  const mortRate = mortInitial > 0 ? (lostCount / mortInitial) * 100 : 0;
  const survivalRate = 100 - mortRate;

  const weightGainG = Math.max(0, endWeightG - startWeightG);
  const adg = cultureDays > 0 ? weightGainG / cultureDays : 0;
  const fcr = totalBiomassGainKg > 0 ? totalFeedUsedKg / totalBiomassGainKg : 0;

  const grossRevenue = harvestKg * priceKg;
  const totalCost = costFingerlings + costFeed + costOther;
  const netProfit = grossRevenue - totalCost;
  const breakEvenPrice = harvestKg > 0 ? totalCost / harvestKg : 0;
  const roiPct = totalCost > 0 ? (netProfit / totalCost) * 100 : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Smart Farm Calculators & Multi-Pond Comparison
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Interactive calculators for feeding rations, mortality rates, growth & FCR, profitability, and side-by-side pond benchmarking.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Smart Feeding Calculator */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">1. Smart Feeding Calculator</h2>
            <Calculator className="w-4 h-4 text-sky-700" />
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-slate-600 mb-1">Fish Count</label>
              <input
                type="number"
                value={feedStock}
                onChange={(e) => setFeedStock(Number(e.target.value))}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-600 mb-1">Avg Weight (g)</label>
              <input
                type="number"
                value={feedAvgG}
                onChange={(e) => setFeedAvgG(Number(e.target.value))}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-600 mb-1">Feeding Rate (% BW)</label>
              <input
                type="number"
                step={0.1}
                value={feedPct}
                onChange={(e) => setFeedPct(Number(e.target.value))}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-600 mb-1">Feed Cost (₹/kg)</label>
              <input
                type="number"
                step={0.05}
                value={feedPrice}
                onChange={(e) => setFeedPrice(Number(e.target.value))}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg font-mono"
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 pt-2 border-t border-slate-100 text-xs">
            <div>
              <div className="text-slate-500">Biomass</div>
              <div className="font-bold font-mono text-slate-900 mt-0.5">
                {formatNumber(biomassKg, 1)} kg
              </div>
            </div>
            <div>
              <div className="text-slate-500">Daily Feed</div>
              <div className="font-bold font-mono text-sky-800 mt-0.5">
                {formatNumber(dailyFeedKg, 1)} kg
              </div>
            </div>
            <div>
              <div className="text-slate-500">Daily Cost</div>
              <div className="font-bold font-mono text-teal-700 mt-0.5">
                {formatCurrency(dailyFeedKg * feedPrice)}
              </div>
            </div>
          </div>
        </div>

        {/* 2. Fish Mortality Calculator */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">2. Fish Mortality Calculator</h2>
            <Calculator className="w-4 h-4 text-teal-700" />
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-slate-600 mb-1">Initial Stocked Count</label>
              <input
                type="number"
                value={mortInitial}
                onChange={(e) => setMortInitial(Number(e.target.value))}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-600 mb-1">Current Estimated Count</label>
              <input
                type="number"
                value={mortCurrent}
                onChange={(e) => setMortCurrent(Number(e.target.value))}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg font-mono"
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 pt-2 border-t border-slate-100 text-xs">
            <div>
              <div className="text-slate-500">Total Loss</div>
              <div className="font-bold font-mono text-slate-900 mt-0.5">
                {formatNumber(lostCount)} fish
              </div>
            </div>
            <div>
              <div className="text-slate-500">Mortality Rate</div>
              <div className="font-bold font-mono text-amber-700 mt-0.5">
                {mortRate.toFixed(2)}%
              </div>
            </div>
            <div>
              <div className="text-slate-500">Survival Rate</div>
              <div className="font-bold font-mono text-teal-700 mt-0.5">
                {survivalRate.toFixed(2)}%
              </div>
            </div>
          </div>
        </div>

        {/* 3. Growth & FCR Calculator */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">
              3. Growth Rate & FCR Calculator
            </h2>
            <Calculator className="w-4 h-4 text-sky-700" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="block text-slate-600 mb-1">Start Wt (g)</label>
              <input
                type="number"
                value={startWeightG}
                onChange={(e) => setStartWeightG(Number(e.target.value))}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-600 mb-1">Current Wt (g)</label>
              <input
                type="number"
                value={endWeightG}
                onChange={(e) => setEndWeightG(Number(e.target.value))}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-600 mb-1">Days Cultured</label>
              <input
                type="number"
                value={cultureDays}
                onChange={(e) => setCultureDays(Number(e.target.value))}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-600 mb-1">Biomass Gain (kg)</label>
              <input
                type="number"
                value={totalBiomassGainKg}
                onChange={(e) => setTotalBiomassGainKg(Number(e.target.value))}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg font-mono"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-slate-600 mb-1">Total Feed Fed (kg)</label>
              <input
                type="number"
                value={totalFeedUsedKg}
                onChange={(e) => setTotalFeedUsedKg(Number(e.target.value))}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg font-mono"
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 pt-2 border-t border-slate-100 text-xs">
            <div>
              <div className="text-slate-500">Weight Gain</div>
              <div className="font-bold font-mono text-slate-900 mt-0.5">{weightGainG} g</div>
            </div>
            <div>
              <div className="text-slate-500">Avg Daily Gain</div>
              <div className="font-bold font-mono text-teal-700 mt-0.5">
                {adg.toFixed(2)} g/day
              </div>
            </div>
            <div>
              <div className="text-slate-500">FCR Ratio</div>
              <div className="font-bold font-mono text-sky-800 mt-0.5">{fcr.toFixed(2)}</div>
            </div>
          </div>
        </div>

        {/* 4. Profit & Break-Even Calculator */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">
              4. Harvest Profit & Break-Even Calculator
            </h2>
            <Calculator className="w-4 h-4 text-teal-700" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="block text-slate-600 mb-1">Harvest Qty (kg)</label>
              <input
                type="number"
                value={harvestKg}
                onChange={(e) => setHarvestKg(Number(e.target.value))}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-600 mb-1">Price / kg (₹)</label>
              <input
                type="number"
                step={0.1}
                value={priceKg}
                onChange={(e) => setPriceKg(Number(e.target.value))}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-600 mb-1">Fingerlings (₹)</label>
              <input
                type="number"
                value={costFingerlings}
                onChange={(e) => setCostFingerlings(Number(e.target.value))}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-600 mb-1">Feed Cost (₹)</label>
              <input
                type="number"
                value={costFeed}
                onChange={(e) => setCostFeed(Number(e.target.value))}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg font-mono"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-slate-600 mb-1">Labour, Meds & Utilities (₹)</label>
              <input
                type="number"
                value={costOther}
                onChange={(e) => setCostOther(Number(e.target.value))}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg font-mono"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-100 text-xs">
            <div>
              <div className="text-slate-500">Sales</div>
              <div className="font-bold font-mono text-slate-900 mt-0.5">
                {formatCurrency(grossRevenue)}
              </div>
            </div>
            <div>
              <div className="text-slate-500">Net Profit</div>
              <div
                className={`font-bold font-mono mt-0.5 ${
                  netProfit >= 0 ? 'text-teal-700' : 'text-red-700'
                }`}
              >
                {formatCurrency(netProfit)}
              </div>
            </div>
            <div>
              <div className="text-slate-500">Break-Even</div>
              <div className="font-bold font-mono text-slate-800 mt-0.5">
                {formatCurrency(breakEvenPrice)}/kg
              </div>
            </div>
            <div>
              <div className="text-slate-500">ROI</div>
              <div className="font-bold font-mono text-sky-800 mt-0.5">{roiPct.toFixed(1)}%</div>
            </div>
          </div>
        </div>
      </div>

      {/* Multi-Pond Comparison Matrix */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200">
          <h2 className="text-sm font-semibold text-slate-900">
            5. Multi-Pond Performance Comparison
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Side-by-side comparison of biomass, mortality, feed logged, water quality, and pond economics.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold text-slate-500">
                <th className="py-3 px-4">Pond</th>
                <th className="py-3 px-4">Species</th>
                <th className="py-3 px-4 text-right">Biomass (kg)</th>
                <th className="py-3 px-4 text-right">Mortality %</th>
                <th className="py-3 px-4 text-right">Logged Feed</th>
                <th className="py-3 px-4 text-right">Harvested</th>
                {canAccessFinance && <th className="py-3 px-4 text-right">Direct Cost</th>}
                {canAccessFinance && <th className="py-3 px-4 text-right">Sales Revenue</th>}
                <th className="py-3 px-4">Water Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {state.ponds.map((pond) => {
                const feedKg = state.feedingLogs
                  .filter((l) => l.pondId === pond.id)
                  .reduce((acc, l) => acc + l.quantityKg, 0);
                const harvestedKg = state.harvestRecords
                  .filter((h) => h.pondId === pond.id)
                  .reduce((acc, h) => acc + h.quantityKg, 0);
                const directCost = state.financialEntries
                  .filter((f) => f.pondId === pond.id && f.type === 'Expense')
                  .reduce((acc, f) => acc + f.amount, 0);
                const salesRev = state.harvestRecords
                  .filter((h) => h.pondId === pond.id)
                  .reduce((acc, h) => acc + h.totalSales, 0);
                const latestWater = state.waterReadings
                  .filter((w) => w.pondId === pond.id)
                  .sort((a, b) => b.timestamp.localeCompare(a.timestamp))[0];
                const profile = state.speciesProfiles.find((s) => s.name === pond.species);
                const waterStatus = latestWater
                  ? evaluateWaterReading(latestWater, profile).overall
                  : 'Warning';

                return (
                  <tr key={pond.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {pond.code} · {pond.name}
                    </td>
                    <td className="py-3 px-4 text-slate-700">{pond.species}</td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold text-sky-800">
                      {formatNumber(calculatePondBiomassKg(pond), 1)} kg
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-amber-700">
                      {calculateMortalityRatePct(pond)}%
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-700">
                      {formatNumber(feedKg)} kg
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-teal-700">
                      {formatNumber(harvestedKg)} kg
                    </td>
                    {canAccessFinance && (
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-700">
                        {formatCurrency(directCost)}
                      </td>
                    )}
                    {canAccessFinance && (
                      <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold text-teal-700">
                        {formatCurrency(salesRev)}
                      </td>
                    )}
                    <td className="py-3 px-4">
                      <StatusLabel level={waterStatus} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
