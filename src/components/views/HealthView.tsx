import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Microscope,
  Plus,
  ShieldAlert,
  Trash2,
  Upload,
} from 'lucide-react';
import { useFarm } from '../../context/FarmContext';
import { HealthRecord } from '../../types/aquafarm';
import {
  VIRUS_PATHOGEN_RULES,
  formatCurrency,
  formatDateShort,
  formatNumber,
  formatTimestamp,
  runVirusScreening,
} from '../../utils/calculations';
import { ModuleLogo } from '../ui/BrandLogos';
import { Modal, StatTile, StatusLabel } from '../ui/CommonUI';

type HealthTab = 'virus' | 'records';

export const HealthView: React.FC = () => {
  const {
    state,
    canDelete,
    addHealthRecord,
    updateHealthStatus,
    deleteHealthRecord,
    addVirusScan,
    deleteVirusScan,
  } = useFarm();

  const [tab, setTab] = useState<HealthTab>('virus');
  const [modalOpen, setModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('All');

  // Interactive Virus Detection Scanner State
  const [scanPondId, setScanPondId] = useState<string>(state.ponds[3]?.id ?? state.ponds[0]?.id ?? 'pond-1');
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([
    'Lethargy & swimming near pond edges',
  ]);
  const [samplePreview, setSamplePreview] = useState<string>('');
  const [lastResultId, setLastResultId] = useState<string | null>(null);

  const [form, setForm] = useState<Omit<HealthRecord, 'id'>>({
    date: '2026-11-18',
    pondId: state.ponds[0]?.id ?? 'pond-1',
    observation: '',
    diseaseName: '',
    symptoms: '',
    affectedCount: 0,
    mortalityCount: 0,
    treatment: '',
    medicineCost: 0,
    status: 'Under Treatment',
    nextCheckDate: '2026-11-22',
  });

  const allSymptoms = useMemo(
    () => Array.from(new Set(VIRUS_PATHOGEN_RULES.flatMap((r) => r.symptoms))),
    []
  );

  const scanPond = state.ponds.find((p) => p.id === scanPondId) ?? state.ponds[0];
  const latestPondWater = useMemo(() => {
    if (!scanPond) return undefined;
    return state.waterReadings
      .filter((w) => w.pondId === scanPond.id)
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp))[0];
  }, [state.waterReadings, scanPond]);

  const livePreviewResult = useMemo(() => {
    if (!scanPond) return null;
    return runVirusScreening(scanPond.species, selectedSymptoms, latestPondWater);
  }, [scanPond, selectedSymptoms, latestPondWater]);

  const toggleSymptom = (symptom: string) => {
    setSelectedSymptoms((prev) =>
      prev.includes(symptom) ? prev.filter((s) => s !== symptom) : [...prev, symptom]
    );
  };

  const handleSampleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setSamplePreview(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRunScan = () => {
    if (!scanPond || !livePreviewResult) return;
    const timestamp = new Date().toISOString().slice(0, 16);
    addVirusScan({
      timestamp,
      pondId: scanPond.id,
      species: scanPond.species,
      suspectedPathogen: livePreviewResult.suspectedPathogen,
      riskLevel: livePreviewResult.riskLevel,
      confidencePct: livePreviewResult.confidencePct,
      matchedSymptoms: selectedSymptoms,
      recommendedAction: livePreviewResult.recommendedAction,
      sampleImageUrl: samplePreview || undefined,
      quarantineRequired: livePreviewResult.quarantineRequired,
    });
    setLastResultId(timestamp);
  };

  const filtered = state.healthRecords.filter(
    (r) => statusFilter === 'All' || r.status === statusFilter
  );

  const highRiskScans = state.virusScans.filter((v) => v.riskLevel === 'High').length;
  const activeCases = state.healthRecords.filter((h) => h.status !== 'Resolved').length;
  const totalMedExpense = state.healthRecords.reduce((acc, h) => acc + h.medicineCost, 0);
  const totalDiseaseMortality = state.healthRecords.reduce((acc, h) => acc + h.mortalityCount, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-start gap-3">
          <ModuleLogo kind="virus" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Virus Detection & Fish Health Lab
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Early digital viral & pathogen screening paired with pond water stress correlation, quarantine protocols, and treatment tracking.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="px-4 py-2 text-xs font-semibold text-white bg-sky-700 hover:bg-sky-800 rounded-lg inline-flex items-center gap-1.5 whitespace-nowrap"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Treatment Record</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatTile
          label="High-Risk Virus Alerts"
          value={`${highRiskScans}`}
          detail={`${state.virusScans.length} total diagnostic scans`}
          accent={highRiskScans > 0 ? 'red' : 'teal'}
        />
        <StatTile
          label="Active Health Cases"
          value={`${activeCases}`}
          detail="Ponds under treatment or monitoring"
          accent={activeCases > 0 ? 'amber' : 'teal'}
        />
        <StatTile
          label="Total Medicine Expense"
          value={formatCurrency(totalMedExpense)}
          detail="Synced with financial ledger"
          accent="sky"
        />
        <StatTile
          label="Health-Related Loss"
          value={formatNumber(totalDiseaseMortality)}
          detail="Fish mortalities linked to cases"
          accent="slate"
        />
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-lg w-fit">
        <button
          type="button"
          onClick={() => setTab('virus')}
          className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
            tab === 'virus'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Virus Detection Scanner
        </button>
        <button
          type="button"
          onClick={() => setTab('records')}
          className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
            tab === 'records'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Disease & Treatment Log
        </button>
      </div>

      {tab === 'virus' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Scanner Input Panel */}
            <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-6 space-y-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                    <Microscope className="w-4 h-4 text-sky-700" />
                    <span>Digital Virus & Pathogen Screening</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Select pond, check observed fish symptoms, and optionally upload a sample photo for WSSV, TiLV, EUS, SVC, and CCV risk assessment.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-medium text-slate-700 mb-1.5">
                    Target Pond & Species
                  </label>
                  <select
                    value={scanPondId}
                    onChange={(e) => setScanPondId(e.target.value)}
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
                  <label className="block font-medium text-slate-700 mb-1.5">
                    Fish / Gill Sample Photo (Optional)
                  </label>
                  <label className="flex items-center justify-center gap-2 px-3 py-2 border border-dashed border-slate-300 hover:border-sky-600 rounded-lg cursor-pointer text-slate-600 hover:text-sky-800 transition-colors">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{samplePreview ? 'Change sample image' : 'Upload fish sample image'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleSampleImage}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {samplePreview && (
                <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <img
                    src={samplePreview}
                    alt="Uploaded fish sample"
                    className="w-16 h-16 rounded-lg object-cover border border-slate-200"
                  />
                  <div className="text-xs">
                    <div className="font-semibold text-slate-900">Sample Image Attached</div>
                    <div className="text-slate-500">
                      Included in digital virus diagnostic log for {scanPond?.code}.
                    </div>
                    <button
                      type="button"
                      onClick={() => setSamplePreview('')}
                      className="text-red-700 hover:underline mt-1"
                    >
                      Remove photo
                    </button>
                  </div>
                </div>
              )}

              <div>
                <div className="text-xs font-medium text-slate-700 mb-2">
                  Observed Physical & Behavioral Symptoms
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {allSymptoms.map((symptom) => {
                    const checked = selectedSymptoms.includes(symptom);
                    return (
                      <label
                        key={symptom}
                        className={`flex items-start gap-2.5 p-2.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                          checked
                            ? 'bg-sky-50 border-sky-600 text-slate-900'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleSymptom(symptom)}
                          className="mt-0.5 accent-sky-700"
                        />
                        <span>{symptom}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
                <div className="text-xs text-slate-500 tabular-nums">
                  {latestPondWater ? (
                    <span>
                      Correlated water reading: DO {latestPondWater.dissolvedOxygenMgL} mg/L · NH₃{' '}
                      {latestPondWater.ammoniaMgL} mg/L · {latestPondWater.temperatureC}°C
                    </span>
                  ) : (
                    <span>No recent water reading available for stress correlation</span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleRunScan}
                  className="px-4 py-2 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg inline-flex items-center gap-1.5 whitespace-nowrap"
                >
                  <Microscope className="w-3.5 h-3.5" />
                  <span>Run & Save Virus Scan</span>
                </button>
              </div>
            </div>

            {/* Live Diagnostic Result Preview */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between">
              {livePreviewResult && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500">
                      Diagnostic Assessment
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 text-xs font-bold ${
                        livePreviewResult.riskLevel === 'High'
                          ? 'text-red-700'
                          : livePreviewResult.riskLevel === 'Moderate'
                            ? 'text-amber-700'
                            : 'text-teal-700'
                      }`}
                    >
                      {livePreviewResult.riskLevel === 'High' ? (
                        <ShieldAlert className="w-4 h-4" />
                      ) : livePreviewResult.riskLevel === 'Moderate' ? (
                        <AlertTriangle className="w-4 h-4" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4" />
                      )}
                      {livePreviewResult.riskLevel} Risk
                    </span>
                  </div>

                  <div>
                    <div className="text-base font-bold text-slate-900">
                      {livePreviewResult.suspectedPathogen}
                    </div>
                    <div className="text-xs text-slate-500 mt-1 tabular-nums">
                      Match Confidence: <strong className="text-slate-800">{livePreviewResult.confidencePct}%</strong> ·{' '}
                      {scanPond?.species}
                    </div>
                  </div>

                  <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-1.5">
                    <div className="font-semibold text-slate-800">Recommended Biosecurity Action</div>
                    <p className="text-slate-600 leading-relaxed">
                      {livePreviewResult.recommendedAction}
                    </p>
                  </div>

                  {livePreviewResult.quarantineRequired && (
                    <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800 font-medium">
                      Quarantine Required: Isolate nets and halt pond-to-pond water transfer for {scanPond?.code}.
                    </div>
                  )}

                  {lastResultId && (
                    <div className="text-xs font-medium text-teal-700">
                      Scan saved to pond biosecurity log.
                    </div>
                  )}
                </div>
              )}

              <button
                type="button"
                onClick={() => {
                  if (scanPond && livePreviewResult) {
                    setForm({
                      ...form,
                      pondId: scanPond.id,
                      diseaseName: livePreviewResult.suspectedPathogen,
                      symptoms: selectedSymptoms.join(', ') || 'Preventive scan',
                      treatment: livePreviewResult.recommendedAction,
                      status:
                        livePreviewResult.riskLevel === 'High' ? 'Under Treatment' : 'Monitoring',
                    });
                    setModalOpen(true);
                  }
                }}
                className="mt-5 w-full py-2 px-3 text-xs font-semibold text-sky-800 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-lg transition-colors"
              >
                Convert to Treatment Record
              </button>
            </div>
          </div>

          {/* Scan History Table */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-200 text-xs font-semibold text-slate-900">
              Recent Virus Detection Scans ({state.virusScans.length})
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold text-slate-500">
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4">Pond & Species</th>
                    <th className="py-3 px-4">Pathogen Assessment</th>
                    <th className="py-3 px-4 text-right">Match</th>
                    <th className="py-3 px-4">Risk Level</th>
                    <th className="py-3 px-4">Biosecurity Action</th>
                    {canDelete && <th className="py-3 px-4 text-right">Action</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {state.virusScans.map((scan) => {
                    const pond = state.ponds.find((p) => p.id === scan.pondId);
                    return (
                      <tr key={scan.id} className="hover:bg-slate-50/70">
                        <td className="py-3 px-4 font-mono tabular-nums text-slate-600">
                          {formatTimestamp(scan.timestamp)}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-900">
                            {pond?.code ?? '—'} · {scan.species}
                          </div>
                          <div className="text-[11px] text-slate-500">By {scan.scannedBy}</div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-900">
                            {scan.suspectedPathogen}
                          </div>
                          {scan.matchedSymptoms.length > 0 && (
                            <div className="text-[11px] text-slate-500">
                              {scan.matchedSymptoms.join(' · ')}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold text-slate-800">
                          {scan.confidencePct}%
                        </td>
                        <td className="py-3 px-4">
                          <StatusLabel
                            level={
                              scan.riskLevel === 'High'
                                ? 'Critical'
                                : scan.riskLevel === 'Moderate'
                                  ? 'Warning'
                                  : 'Normal'
                            }
                          />
                        </td>
                        <td className="py-3 px-4 text-slate-600 max-w-xs">
                          {scan.recommendedAction}
                        </td>
                        {canDelete && (
                          <td className="py-3 px-4 text-right">
                            <button
                              type="button"
                              onClick={() => deleteVirusScan(scan.id)}
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
        </div>
      )}

      {tab === 'records' && (
        <div className="space-y-4">
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg w-fit">
            {['All', 'Under Treatment', 'Monitoring', 'Resolved'].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  statusFilter === st
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold text-slate-500">
                    <th className="py-3 px-4">Date & Pond</th>
                    <th className="py-3 px-4">Condition / Disease</th>
                    <th className="py-3 px-4">Symptoms & Observation</th>
                    <th className="py-3 px-4">Treatment Protocol</th>
                    <th className="py-3 px-4 text-right">Med Cost</th>
                    <th className="py-3 px-4">Next Check</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filtered.map((rec) => {
                    const pond = state.ponds.find((p) => p.id === rec.pondId);
                    return (
                      <tr key={rec.id} className="hover:bg-slate-50/70">
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-900">{pond?.code ?? '—'}</div>
                          <div className="text-[11px] text-slate-500 tabular-nums">
                            {formatDateShort(rec.date)}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-900">{rec.diseaseName}</div>
                          <div className="text-[11px] text-slate-500 tabular-nums">
                            {rec.affectedCount} affected · {rec.mortalityCount} lost
                          </div>
                        </td>
                        <td className="py-3 px-4 text-slate-700 max-w-xs">
                          <div>{rec.symptoms}</div>
                          {rec.observation && (
                            <div className="text-[11px] text-slate-500 mt-0.5">{rec.observation}</div>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-700 max-w-xs">{rec.treatment}</td>
                        <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold text-slate-900">
                          {formatCurrency(rec.medicineCost)}
                        </td>
                        <td className="py-3 px-4 tabular-nums text-slate-600">
                          {formatDateShort(rec.nextCheckDate)}
                        </td>
                        <td className="py-3 px-4">
                          <StatusLabel level={rec.status} />
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <select
                              value={rec.status}
                              onChange={(e) =>
                                updateHealthStatus(rec.id, e.target.value as HealthRecord['status'])
                              }
                              className="px-2 py-1 text-[11px] bg-white border border-slate-200 rounded-md"
                            >
                              <option value="Monitoring">Monitoring</option>
                              <option value="Under Treatment">Under Treatment</option>
                              <option value="Resolved">Resolved</option>
                            </select>
                            {canDelete && (
                              <button
                                type="button"
                                onClick={() => deleteHealthRecord(rec.id)}
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
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Log Health & Treatment Record"
        subtitle="Medicine expenses (₹) and mortalities automatically sync with financials and pond stock."
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!form.diseaseName.trim()) return;
            addHealthRecord(form);
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
              <label className="block font-medium text-slate-700 mb-1">Pond</label>
              <select
                value={form.pondId}
                onChange={(e) => setForm({ ...form, pondId: e.target.value })}
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
              <label className="block font-medium text-slate-700 mb-1">
                Disease / Virus Name
              </label>
              <input
                type="text"
                required
                value={form.diseaseName}
                onChange={(e) => setForm({ ...form, diseaseName: e.target.value })}
                placeholder="e.g. WSSV / Bacterial Fin Rot"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Status</label>
              <select
                value={form.status}
                onChange={(e) =>
                  setForm({ ...form, status: e.target.value as HealthRecord['status'] })
                }
                className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white"
              >
                <option value="Under Treatment">Under Treatment</option>
                <option value="Monitoring">Monitoring</option>
                <option value="Resolved">Resolved</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Observed Symptoms</label>
            <input
              type="text"
              required
              value={form.symptoms}
              onChange={(e) => setForm({ ...form, symptoms: e.target.value })}
              placeholder="e.g. Lethargy near surface, pale gill filaments"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Treatment / Medicine</label>
            <input
              type="text"
              required
              value={form.treatment}
              onChange={(e) => setForm({ ...form, treatment: e.target.value })}
              placeholder="e.g. Salt bath + Probiotic dose"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg"
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Affected</label>
              <input
                type="number"
                min={0}
                value={form.affectedCount}
                onChange={(e) => setForm({ ...form, affectedCount: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Mortalities</label>
              <input
                type="number"
                min={0}
                value={form.mortalityCount}
                onChange={(e) => setForm({ ...form, mortalityCount: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Medicine Cost (₹)</label>
              <input
                type="number"
                min={0}
                step={50}
                value={form.medicineCost}
                onChange={(e) => setForm({ ...form, medicineCost: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Next Check</label>
              <input
                type="date"
                value={form.nextCheckDate}
                onChange={(e) => setForm({ ...form, nextCheckDate: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 bg-slate-100 rounded-lg">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 text-white font-semibold bg-sky-700 rounded-lg">
              Save Record
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
