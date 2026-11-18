import React, { useMemo, useState } from 'react';
import { Plus, SlidersHorizontal, Trash2 } from 'lucide-react';
import { useFarm } from '../../context/FarmContext';
import { SpeciesProfile } from '../../types/aquafarm';
import { evaluateWaterReading, formatTimestamp } from '../../utils/calculations';
import { InteractiveAreaChart } from '../charts/FarmCharts';
import { ModuleLogo } from '../ui/BrandLogos';
import { Modal, StatTile, StatusLabel } from '../ui/CommonUI';

type WaterTab = 'monitor' | 'history' | 'thresholds';

export const WaterQualityView: React.FC = () => {
  const {
    state,
    canDelete,
    addWaterReading,
    deleteWaterReading,
    updateSpeciesProfile,
  } = useFarm();

  const [tab, setTab] = useState<WaterTab>('monitor');
  const [selectedPondId, setSelectedPondId] = useState<string>(state.ponds[0]?.id ?? 'pond-1');
  const [selectedMetric, setSelectedMetric] = useState<'dissolvedOxygenMgL' | 'temperatureC' | 'ph' | 'ammoniaMgL'>('dissolvedOxygenMgL');
  const [logModal, setLogModal] = useState(false);

  const [form, setForm] = useState({
    timestamp: '2026-11-18T12:00',
    pondId: state.ponds[0]?.id ?? 'pond-1',
    temperatureC: 28.0,
    ph: 7.4,
    dissolvedOxygenMgL: 5.8,
    ammoniaMgL: 0.02,
    transparencyCm: 35,
    notes: '',
  });

  const pondSnapshots = useMemo(() => {
    return state.ponds.map((pond) => {
      const readings = state.waterReadings
        .filter((r) => r.pondId === pond.id)
        .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
      const latest = readings[0];
      const profile = state.speciesProfiles.find((s) => s.name === pond.species);
      const evaluation = latest ? evaluateWaterReading(latest, profile) : null;
      return { pond, latest, evaluation, profile };
    });
  }, [state.ponds, state.waterReadings, state.speciesProfiles]);

  const counts = useMemo(() => {
    let normal = 0;
    let warning = 0;
    let critical = 0;
    pondSnapshots.forEach((s) => {
      const level = s.evaluation?.overall ?? 'Warning';
      if (level === 'Normal') normal += 1;
      else if (level === 'Warning') warning += 1;
      else critical += 1;
    });
    return { normal, warning, critical };
  }, [pondSnapshots]);

  const trendPond = state.ponds.find((p) => p.id === selectedPondId) ?? state.ponds[0];
  const trendProfile = state.speciesProfiles.find((s) => s.name === trendPond?.species);

  const trendSeries = useMemo(() => {
    return state.waterReadings
      .filter((r) => r.pondId === selectedPondId)
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
      .map((r) => ({
        label: r.timestamp.slice(5, 10),
        value: r[selectedMetric],
      }));
  }, [state.waterReadings, selectedPondId, selectedMetric]);

  const metricMeta = {
    dissolvedOxygenMgL: {
      label: 'Dissolved Oxygen',
      unit: 'mg/L',
      safeRange: trendProfile
        ? { min: trendProfile.minDO, max: 9.0, label: `Safe ≥ ${trendProfile.minDO} mg/L` }
        : undefined,
    },
    temperatureC: {
      label: 'Water Temperature',
      unit: '°C',
      safeRange: trendProfile
        ? {
            min: trendProfile.optimalTempMin,
            max: trendProfile.optimalTempMax,
            label: `Safe ${trendProfile.optimalTempMin}–${trendProfile.optimalTempMax}°C`,
          }
        : undefined,
    },
    ph: {
      label: 'pH Level',
      unit: 'pH',
      safeRange: trendProfile
        ? {
            min: trendProfile.optimalPhMin,
            max: trendProfile.optimalPhMax,
            label: `Safe ${trendProfile.optimalPhMin}–${trendProfile.optimalPhMax}`,
          }
        : undefined,
    },
    ammoniaMgL: {
      label: 'Ammonia (NH₃)',
      unit: 'mg/L',
      safeRange: trendProfile
        ? { min: 0, max: trendProfile.maxAmmonia, label: `Safe ≤ ${trendProfile.maxAmmonia} mg/L` }
        : undefined,
    },
  }[selectedMetric];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-start gap-3">
          <ModuleLogo kind="water" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Water Quality Monitoring
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Track temperature, pH, dissolved oxygen, ammonia, and transparency against species-specific thresholds.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setLogModal(true)}
          className="px-4 py-2 text-xs font-semibold text-white bg-sky-700 hover:bg-sky-800 rounded-lg inline-flex items-center gap-1.5 whitespace-nowrap"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Log Water Reading</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatTile label="Ponds Normal" value={`${counts.normal}`} detail="All parameters within safe zone" accent="teal" />
        <StatTile label="Warning Status" value={`${counts.warning}`} detail="Approaching threshold limits" accent="amber" />
        <StatTile label="Critical Alerts" value={`${counts.critical}`} detail="Immediate aeration / exchange" accent={counts.critical > 0 ? 'red' : 'teal'} />
        <StatTile label="Logged Tests" value={`${state.waterReadings.length}`} detail="Cumulative water lab records" accent="sky" />
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-lg w-fit">
        {(
          [
            ['monitor', 'Pond Status & Trends'],
            ['history', 'Testing History'],
            ['thresholds', 'Species Thresholds'],
          ] as [WaterTab, string][]
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

      {tab === 'monitor' && (
        <div className="space-y-6">
          {/* Live Pond Matrix */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold text-slate-500">
                    <th className="py-3 px-4">Pond & Species</th>
                    <th className="py-3 px-4">Last Tested</th>
                    <th className="py-3 px-4 text-right">Temp (°C)</th>
                    <th className="py-3 px-4 text-right">pH</th>
                    <th className="py-3 px-4 text-right">DO (mg/L)</th>
                    <th className="py-3 px-4 text-right">NH₃ (mg/L)</th>
                    <th className="py-3 px-4 text-right">Clarity (cm)</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {pondSnapshots.map(({ pond, latest, evaluation }) => (
                    <tr key={pond.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">
                          {pond.code} · {pond.name}
                        </div>
                        <div className="text-[11px] text-slate-500">{pond.species}</div>
                      </td>
                      <td className="py-3 px-4 font-mono tabular-nums text-slate-600">
                        {latest ? formatTimestamp(latest.timestamp) : 'No test'}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums">
                        {latest ? `${latest.temperatureC.toFixed(1)}°C` : '—'}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums">
                        {latest ? latest.ph.toFixed(1) : '—'}
                      </td>
                      <td
                        className={`py-3 px-4 text-right font-mono tabular-nums font-semibold ${
                          evaluation?.parameters[2]?.status === 'Critical'
                            ? 'text-red-700'
                            : evaluation?.parameters[2]?.status === 'Warning'
                              ? 'text-amber-700'
                              : 'text-teal-700'
                        }`}
                      >
                        {latest ? `${latest.dissolvedOxygenMgL.toFixed(1)}` : '—'}
                      </td>
                      <td
                        className={`py-3 px-4 text-right font-mono tabular-nums font-semibold ${
                          evaluation?.parameters[3]?.status === 'Critical'
                            ? 'text-red-700'
                            : evaluation?.parameters[3]?.status === 'Warning'
                              ? 'text-amber-700'
                              : 'text-slate-800'
                        }`}
                      >
                        {latest ? `${latest.ammoniaMgL.toFixed(2)}` : '—'}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums">
                        {latest ? `${latest.transparencyCm} cm` : '—'}
                      </td>
                      <td className="py-3 px-4">
                        <StatusLabel level={evaluation?.overall ?? 'Warning'} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pond Water Trend Explorer */}
          <div className="space-y-3">
            <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
              <div className="text-xs font-semibold text-slate-900">
                Pond Parameter Trend & Safe-Zone Band
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={selectedPondId}
                  onChange={(e) => setSelectedPondId(e.target.value)}
                  className="px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg"
                >
                  {state.ponds.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.code} — {p.name} ({p.species})
                    </option>
                  ))}
                </select>
                <select
                  value={selectedMetric}
                  onChange={(e) =>
                    setSelectedMetric(
                      e.target.value as 'dissolvedOxygenMgL' | 'temperatureC' | 'ph' | 'ammoniaMgL'
                    )
                  }
                  className="px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg"
                >
                  <option value="dissolvedOxygenMgL">Dissolved Oxygen (mg/L)</option>
                  <option value="temperatureC">Temperature (°C)</option>
                  <option value="ph">pH Level</option>
                  <option value="ammoniaMgL">Ammonia NH₃ (mg/L)</option>
                </select>
              </div>
            </div>

            <InteractiveAreaChart
              title={`${trendPond?.code ?? ''} — ${metricMeta.label}`}
              subtitle={`Shaded teal band indicates configured safe operating zone for ${trendPond?.species ?? 'species'}`}
              data={trendSeries}
              unit={metricMeta.unit}
              primaryLabel={metricMeta.label}
              safeRange={metricMeta.safeRange}
              primaryColor="#0369a1"
            />
          </div>
        </div>
      )}

      {tab === 'history' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold text-slate-500">
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Pond</th>
                  <th className="py-3 px-4 text-right">Temp</th>
                  <th className="py-3 px-4 text-right">pH</th>
                  <th className="py-3 px-4 text-right">DO</th>
                  <th className="py-3 px-4 text-right">NH₃</th>
                  <th className="py-3 px-4 text-right">Clarity</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Tester</th>
                  {canDelete && <th className="py-3 px-4 text-right">Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {state.waterReadings.map((r) => {
                  const pond = state.ponds.find((p) => p.id === r.pondId);
                  const profile = state.speciesProfiles.find((s) => s.name === pond?.species);
                  const ev = evaluateWaterReading(r, profile);
                  return (
                    <tr key={r.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4 font-mono tabular-nums text-slate-600">
                        {formatTimestamp(r.timestamp)}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        {pond?.code ?? '—'}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums">
                        {r.temperatureC.toFixed(1)}°C
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums">
                        {r.ph.toFixed(1)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums">
                        {r.dissolvedOxygenMgL.toFixed(1)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums">
                        {r.ammoniaMgL.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums">
                        {r.transparencyCm} cm
                      </td>
                      <td className="py-3 px-4">
                        <StatusLabel level={ev.overall} />
                      </td>
                      <td className="py-3 px-4 text-slate-600">{r.recordedBy}</td>
                      {canDelete && (
                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => deleteWaterReading(r.id)}
                            className="p-1 text-slate-400 hover:text-red-600"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'thresholds' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-sky-700" />
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Configurable Water Quality Thresholds by Species
              </h2>
              <p className="text-xs text-slate-500">
                Adjusting these values immediately recalculates Normal, Warning, and Critical indicators across all ponds.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold text-slate-500">
                  <th className="py-3 px-3">Species</th>
                  <th className="py-3 px-3">Temp Min (°C)</th>
                  <th className="py-3 px-3">Temp Max (°C)</th>
                  <th className="py-3 px-3">pH Min</th>
                  <th className="py-3 px-3">pH Max</th>
                  <th className="py-3 px-3">Min DO (mg/L)</th>
                  <th className="py-3 px-3">Max NH₃ (mg/L)</th>
                  <th className="py-3 px-3">Min Clarity (cm)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {state.speciesProfiles.map((sp: SpeciesProfile) => (
                  <tr key={sp.id}>
                    <td className="py-3 px-3 font-semibold text-slate-900">{sp.name}</td>
                    <td className="py-2 px-3">
                      <input
                        type="number"
                        step={0.5}
                        value={sp.optimalTempMin}
                        onChange={(e) =>
                          updateSpeciesProfile(sp.id, { optimalTempMin: Number(e.target.value) })
                        }
                        className="w-20 px-2 py-1 border border-slate-200 rounded font-mono"
                      />
                    </td>
                    <td className="py-2 px-3">
                      <input
                        type="number"
                        step={0.5}
                        value={sp.optimalTempMax}
                        onChange={(e) =>
                          updateSpeciesProfile(sp.id, { optimalTempMax: Number(e.target.value) })
                        }
                        className="w-20 px-2 py-1 border border-slate-200 rounded font-mono"
                      />
                    </td>
                    <td className="py-2 px-3">
                      <input
                        type="number"
                        step={0.1}
                        value={sp.optimalPhMin}
                        onChange={(e) =>
                          updateSpeciesProfile(sp.id, { optimalPhMin: Number(e.target.value) })
                        }
                        className="w-20 px-2 py-1 border border-slate-200 rounded font-mono"
                      />
                    </td>
                    <td className="py-2 px-3">
                      <input
                        type="number"
                        step={0.1}
                        value={sp.optimalPhMax}
                        onChange={(e) =>
                          updateSpeciesProfile(sp.id, { optimalPhMax: Number(e.target.value) })
                        }
                        className="w-20 px-2 py-1 border border-slate-200 rounded font-mono"
                      />
                    </td>
                    <td className="py-2 px-3">
                      <input
                        type="number"
                        step={0.1}
                        value={sp.minDO}
                        onChange={(e) =>
                          updateSpeciesProfile(sp.id, { minDO: Number(e.target.value) })
                        }
                        className="w-20 px-2 py-1 border border-slate-200 rounded font-mono"
                      />
                    </td>
                    <td className="py-2 px-3">
                      <input
                        type="number"
                        step={0.01}
                        value={sp.maxAmmonia}
                        onChange={(e) =>
                          updateSpeciesProfile(sp.id, { maxAmmonia: Number(e.target.value) })
                        }
                        className="w-20 px-2 py-1 border border-slate-200 rounded font-mono"
                      />
                    </td>
                    <td className="py-2 px-3">
                      <input
                        type="number"
                        step={1}
                        value={sp.minTransparencyCm}
                        onChange={(e) =>
                          updateSpeciesProfile(sp.id, { minTransparencyCm: Number(e.target.value) })
                        }
                        className="w-20 px-2 py-1 border border-slate-200 rounded font-mono"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Log Water Reading Modal */}
      <Modal
        open={logModal}
        onClose={() => setLogModal(false)}
        title="Log Water Quality Test"
        subtitle="Values are evaluated automatically against the pond's species thresholds."
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            addWaterReading(form);
            setLogModal(false);
          }}
          className="space-y-3 text-xs"
        >
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Pond</label>
              <select
                value={form.pondId}
                onChange={(e) => setForm({ ...form, pondId: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white"
              >
                {state.ponds.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.code} — {p.name} ({p.species})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Test Date & Time</label>
              <input
                type="datetime-local"
                value={form.timestamp}
                onChange={(e) => setForm({ ...form, timestamp: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Temperature (°C)</label>
              <input
                type="number"
                step={0.1}
                value={form.temperatureC}
                onChange={(e) => setForm({ ...form, temperatureC: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">pH Level</label>
              <input
                type="number"
                step={0.1}
                value={form.ph}
                onChange={(e) => setForm({ ...form, ph: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Dissolved O₂ (mg/L)</label>
              <input
                type="number"
                step={0.1}
                value={form.dissolvedOxygenMgL}
                onChange={(e) =>
                  setForm({ ...form, dissolvedOxygenMgL: Number(e.target.value) })
                }
                className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Ammonia (mg/L)</label>
              <input
                type="number"
                step={0.01}
                value={form.ammoniaMgL}
                onChange={(e) => setForm({ ...form, ammoniaMgL: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Transparency (cm)</label>
              <input
                type="number"
                step={1}
                value={form.transparencyCm}
                onChange={(e) => setForm({ ...form, transparencyCm: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Field Notes</label>
            <input
              type="text"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="e.g. Morning aeration verified"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setLogModal(false)} className="px-4 py-2 bg-slate-100 rounded-lg">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 text-white font-semibold bg-sky-700 rounded-lg">
              Save Reading
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
