import React, { useMemo, useState } from 'react';
import { Eye, Pencil, Plus, Search, Trash2, Waves } from 'lucide-react';
import { useFarm } from '../../context/FarmContext';
import { Pond, PondStatus } from '../../types/aquafarm';
import {
  calculateMortalityRatePct,
  calculatePondBiomassKg,
  calculatePondCapacityPct,
  calculateRecommendedPondCapacity,
  evaluateWaterReading,
  formatDateShort,
  formatNumber,
} from '../../utils/calculations';
import { ModuleLogo, SpeciesLogo } from '../ui/BrandLogos';
import { EmptyState, Modal, StatTile, StatusLabel } from '../ui/CommonUI';

const EMPTY_FORM: Omit<Pond, 'id'> = {
  code: '',
  name: '',
  areaSqM: 2000,
  waterCapacityLiters: 3000000,
  species: 'Nile Tilapia',
  stockingDate: '2026-11-18',
  maxStockCapacity: 14000,
  initialStock: 10000,
  currentStock: 10000,
  avgWeightGrams: 15,
  status: 'Active',
  aerators: 2,
  notes: '',
};

export const PondsView: React.FC = () => {
  const { state, addPond, updatePond, deletePond, canDelete } = useFarm();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [speciesFilter, setSpeciesFilter] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'code' | 'biomass' | 'stock'>('code');
  const [viewMode, setViewMode] = useState<'table' | 'map'>('table');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<Pond, 'id'>>(EMPTY_FORM);
  const [inspectPond, setInspectPond] = useState<Pond | null>(null);

  const speciesOptions = useMemo(
    () => Array.from(new Set(state.speciesProfiles.map((s) => s.name))),
    [state.speciesProfiles]
  );

  const filteredPonds = useMemo(() => {
    return state.ponds
      .filter((p) => {
        const matchesSearch =
          p.code.toLowerCase().includes(search.toLowerCase()) ||
          p.name.toLowerCase().includes(search.toLowerCase()) ||
          p.species.toLowerCase().includes(search.toLowerCase());
        const matchesStatus = statusFilter === 'All' || p.status === statusFilter;
        const matchesSpecies = speciesFilter === 'All' || p.species === speciesFilter;
        return matchesSearch && matchesStatus && matchesSpecies;
      })
      .sort((a, b) => {
        if (sortBy === 'biomass') return calculatePondBiomassKg(b) - calculatePondBiomassKg(a);
        if (sortBy === 'stock') return b.currentStock - a.currentStock;
        return a.code.localeCompare(b.code);
      });
  }, [state.ponds, search, statusFilter, speciesFilter, sortBy]);

  const totalWaterVolumeM3 = state.ponds.reduce(
    (acc, p) => acc + p.waterCapacityLiters / 1000,
    0
  );
  const totalBiomass = state.ponds.reduce((acc, p) => acc + calculatePondBiomassKg(p), 0);
  const totalGrowingCapacity = state.ponds.reduce(
    (acc, p) => acc + (p.maxStockCapacity ?? p.initialStock),
    0
  );
  const totalCurrentFish = state.ponds.reduce((acc, p) => acc + p.currentStock, 0);

  const openCreate = () => {
    setEditingId(null);
    const defaultSpecies = speciesOptions[0] ?? 'Nile Tilapia';
    const profile = state.speciesProfiles.find((s) => s.name === defaultSpecies);
    setForm({
      ...EMPTY_FORM,
      code: `P-0${state.ponds.length + 1}`,
      species: defaultSpecies,
      maxStockCapacity: calculateRecommendedPondCapacity(EMPTY_FORM.areaSqM, profile),
    });
    setModalOpen(true);
  };

  const openEdit = (pond: Pond) => {
    setEditingId(pond.id);
    const { id: _ignored, ...rest } = pond;
    setForm(rest);
    setModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.code.trim() || !form.name.trim()) return;
    if (editingId) {
      updatePond(editingId, form);
    } else {
      addPond(form);
    }
    setModalOpen(false);
  };

  const getHarvestedKgForPond = (pondId: string) =>
    state.harvestRecords
      .filter((h) => h.pondId === pondId)
      .reduce((acc, h) => acc + h.quantityKg, 0);

  const applyRecommendedCapacity = (areaSqM: number, speciesName: string) => {
    const profile = state.speciesProfiles.find((s) => s.name === speciesName);
    return calculateRecommendedPondCapacity(areaSqM, profile);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-start gap-3">
          <ModuleLogo kind="ponds" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Ponds & Growing Capacity
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Manage number of ponds, pond size, species stocking density (how many fish can grow in each pond), and live production tracking.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                viewMode === 'table'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Table View
            </button>
            <button
              type="button"
              onClick={() => setViewMode('map')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                viewMode === 'map'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Visual Pond Map
            </button>
          </div>
          <button
            type="button"
            onClick={openCreate}
            className="px-4 py-2 text-xs font-semibold text-white bg-sky-700 hover:bg-sky-800 rounded-lg transition-colors inline-flex items-center gap-1.5 whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Pond</span>
          </button>
        </div>
      </div>

      {/* Summary Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatTile label="Number of Ponds" value={`${state.ponds.length}`} detail={`${state.ponds.filter((p) => p.status === 'Harvest Ready').length} harvest ready`} accent="sky" />
        <StatTile
          label="Total Growing Capacity"
          value={`${formatNumber(totalGrowingCapacity)} fish`}
          detail={`${formatNumber(totalCurrentFish)} currently stocked (${Math.round((totalCurrentFish / Math.max(1, totalGrowingCapacity)) * 100)}% used)`}
          accent="teal"
        />
        <StatTile
          label="Standing Biomass"
          value={`${formatNumber(totalBiomass, 1)} kg`}
          detail="Live estimated fish weight"
          accent="sky"
        />
        <StatTile
          label="Total Water Volume"
          value={`${formatNumber(totalWaterVolumeM3)} m³`}
          detail={`${formatNumber(totalWaterVolumeM3 * 1000)} liters capacity`}
          accent="teal"
        />
      </div>

      {/* Filter & Search Toolbar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by pond ID, name, or species..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-sky-700"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg"
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Harvest Ready">Harvest Ready</option>
            <option value="Maintenance">Maintenance</option>
            <option value="Resting">Resting</option>
          </select>
          <select
            value={speciesFilter}
            onChange={(e) => setSpeciesFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg"
          >
            <option value="All">All Species</option>
            {speciesOptions.map((sp) => (
              <option key={sp} value={sp}>
                {sp}
              </option>
            ))}
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'code' | 'biomass' | 'stock')}
            className="px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg"
          >
            <option value="code">Sort: Pond ID</option>
            <option value="biomass">Sort: Biomass (High-Low)</option>
            <option value="stock">Sort: Stock Count</option>
          </select>
        </div>
      </div>

      {/* Pond Table or Visual Map */}
      {filteredPonds.length === 0 ? (
        <EmptyState
          icon={<Waves className="w-5 h-5" />}
          title="No ponds match your filter"
          description="Try clearing the search query or add a new pond unit to begin tracking fish stock."
          actionLabel="Add New Pond"
          onAction={openCreate}
        />
      ) : viewMode === 'map' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPonds.map((pond) => {
            const biomass = calculatePondBiomassKg(pond);
            const capPct = calculatePondCapacityPct(pond);
            const latestWater = state.waterReadings
              .filter((w) => w.pondId === pond.id)
              .sort((a, b) => b.timestamp.localeCompare(a.timestamp))[0];
            const profile = state.speciesProfiles.find((s) => s.name === pond.species);
            const waterLevel = latestWater
              ? evaluateWaterReading(latestWater, profile).overall
              : 'Warning';
            return (
              <div
                key={pond.id}
                onClick={() => setInspectPond(pond)}
                className="bg-white border border-slate-200 hover:border-sky-600 rounded-xl p-5 cursor-pointer transition-colors flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <SpeciesLogo species={pond.species} />
                      <div className="min-w-0">
                        <div className="text-xs font-mono font-semibold text-sky-800">
                          {pond.code} · {formatNumber(pond.areaSqM)} m²
                        </div>
                        <h3 className="text-sm font-bold text-slate-900 truncate">{pond.name}</h3>
                      </div>
                    </div>
                    <StatusLabel level={pond.status} />
                  </div>
                  <div className="text-xs text-slate-500 mt-2">
                    {pond.species} · {pond.aerators} aerators
                  </div>
                </div>

                <div className="mt-4">
                  <div className="flex justify-between text-[11px] text-slate-500 mb-1 tabular-nums">
                    <span>Growing Capacity</span>
                    <span className="font-mono text-slate-800">
                      {formatNumber(pond.currentStock)} / {formatNumber(pond.maxStockCapacity)} ({capPct}%)
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-teal-600 rounded-full"
                      style={{ width: `${capPct}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-100 text-xs tabular-nums">
                  <div>
                    <div className="text-[11px] text-slate-500">Avg Weight</div>
                    <div className="font-mono font-semibold text-slate-900 mt-0.5">
                      {pond.avgWeightGrams} g
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] text-slate-500">Biomass</div>
                    <div className="font-mono font-semibold text-sky-800 mt-0.5">
                      {formatNumber(biomass, 0)} kg
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] text-slate-500">Water</div>
                    <div className="mt-0.5">
                      <StatusLabel level={waterLevel} />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold text-slate-500">
                  <th className="py-3 px-4">Pond ID & Name</th>
                  <th className="py-3 px-4">Species</th>
                  <th className="py-3 px-4 text-right">Size / Capacity</th>
                  <th className="py-3 px-4 text-right">Stock / Can Grow</th>
                  <th className="py-3 px-4 text-right">Biomass</th>
                  <th className="py-3 px-4 text-right">Harvested</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredPonds.map((pond) => {
                  const biomass = calculatePondBiomassKg(pond);
                  const harvestedKg = getHarvestedKgForPond(pond.id);
                  const capPct = calculatePondCapacityPct(pond);
                  return (
                    <tr key={pond.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{pond.code}</div>
                        <div className="text-[11px] text-slate-500">{pond.name}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <SpeciesLogo species={pond.species} />
                          <span className="text-slate-700">{pond.species}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-600">
                        <div>{formatNumber(pond.areaSqM)} m²</div>
                        <div className="text-[11px] text-slate-400">
                          {formatNumber(pond.waterCapacityLiters / 1000)} m³
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-900">
                        <div>
                          {formatNumber(pond.currentStock)}{' '}
                          <span className="text-slate-400">/ {formatNumber(pond.maxStockCapacity)}</span>
                        </div>
                        <div className="text-[11px] text-teal-700">
                          {capPct}% capacity · avg {pond.avgWeightGrams}g
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold text-sky-800">
                        {formatNumber(biomass, 1)} kg
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-teal-700">
                        {formatNumber(harvestedKg)} kg
                      </td>
                      <td className="py-3 px-4">
                        <StatusLabel level={pond.status} />
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setInspectPond(pond)}
                            title="Inspect pond production"
                            className="p-1.5 text-slate-500 hover:text-sky-700 hover:bg-sky-50 rounded-md transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => openEdit(pond)}
                            title="Edit pond"
                            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          {canDelete && (
                            <button
                              type="button"
                              onClick={() => deletePond(pond.id)}
                              title="Delete pond"
                              className="p-1.5 text-slate-400 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
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

      {/* Add / Edit Pond Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? `Edit Pond ${form.code}` : 'Add New Fish Pond'}
        subtitle="Configure physical dimensions, species, how many fish can grow, and operational status."
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Pond ID</label>
              <input
                type="text"
                required
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                placeholder="P-07"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-700 mb-1">Pond Name</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. South Growout Basin"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Fish Species</label>
              <select
                value={form.species}
                onChange={(e) => {
                  const nextSpecies = e.target.value;
                  setForm({
                    ...form,
                    species: nextSpecies,
                    maxStockCapacity: applyRecommendedCapacity(form.areaSqM, nextSpecies),
                  });
                }}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
              >
                {speciesOptions.map((sp) => (
                  <option key={sp} value={sp}>
                    {sp}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Pond Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as PondStatus })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
              >
                <option value="Active">Active</option>
                <option value="Harvest Ready">Harvest Ready</option>
                <option value="Maintenance">Maintenance</option>
                <option value="Resting">Resting</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Area (m²)</label>
              <input
                type="number"
                min={10}
                value={form.areaSqM}
                onChange={(e) => {
                  const area = Number(e.target.value);
                  setForm({
                    ...form,
                    areaSqM: area,
                    maxStockCapacity: applyRecommendedCapacity(area, form.species),
                  });
                }}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg font-mono tabular-nums"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Capacity (Liters)
              </label>
              <input
                type="number"
                min={1000}
                step={1000}
                value={form.waterCapacityLiters}
                onChange={(e) =>
                  setForm({ ...form, waterCapacityLiters: Number(e.target.value) })
                }
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg font-mono tabular-nums"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Max Can Grow
              </label>
              <input
                type="number"
                min={50}
                value={form.maxStockCapacity}
                onChange={(e) =>
                  setForm({ ...form, maxStockCapacity: Number(e.target.value) })
                }
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg font-mono tabular-nums"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Aerators</label>
              <input
                type="number"
                min={0}
                value={form.aerators}
                onChange={(e) => setForm({ ...form, aerators: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg font-mono tabular-nums"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Stocking Date
              </label>
              <input
                type="date"
                value={form.stockingDate}
                onChange={(e) => setForm({ ...form, stockingDate: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Initial Stock
              </label>
              <input
                type="number"
                min={0}
                value={form.initialStock}
                onChange={(e) => setForm({ ...form, initialStock: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg font-mono tabular-nums"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Current Stock
              </label>
              <input
                type="number"
                min={0}
                value={form.currentStock}
                onChange={(e) => setForm({ ...form, currentStock: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg font-mono tabular-nums"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Avg Weight (g)
              </label>
              <input
                type="number"
                min={0.1}
                step={0.1}
                value={form.avgWeightGrams}
                onChange={(e) => setForm({ ...form, avgWeightGrams: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg font-mono tabular-nums"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Notes</label>
            <textarea
              rows={2}
              value={form.notes ?? ''}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Optional pond management notes..."
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-sky-700 hover:bg-sky-800 rounded-lg"
            >
              {editingId ? 'Save Changes' : 'Create Pond'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Inspect Pond Production Modal */}
      <Modal
        open={Boolean(inspectPond)}
        onClose={() => setInspectPond(null)}
        title={inspectPond ? `${inspectPond.code} — ${inspectPond.name}` : ''}
        subtitle={
          inspectPond
            ? `${inspectPond.species} · Stocked ${formatDateShort(inspectPond.stockingDate)} · Max Can Grow: ${formatNumber(inspectPond.maxStockCapacity)} fish`
            : ''
        }
      >
        {inspectPond && (() => {
          const latestWater = state.waterReadings
            .filter((w) => w.pondId === inspectPond.id)
            .sort((a, b) => b.timestamp.localeCompare(a.timestamp))[0];
          const profile = state.speciesProfiles.find((s) => s.name === inspectPond.species);
          const waterEval = latestWater ? evaluateWaterReading(latestWater, profile) : null;
          const totalFedKg = state.feedingLogs
            .filter((l) => l.pondId === inspectPond.id)
            .reduce((acc, l) => acc + l.quantityKg, 0);
          const totalHarvested = getHarvestedKgForPond(inspectPond.id);
          const roomRemaining = Math.max(
            0,
            inspectPond.maxStockCapacity - inspectPond.currentStock
          );

          return (
            <div className="space-y-5 text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="text-slate-500">Current / Max Grow</div>
                  <div className="text-sm font-bold text-sky-800 tabular-nums mt-0.5">
                    {formatNumber(inspectPond.currentStock)} / {formatNumber(inspectPond.maxStockCapacity)}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {formatNumber(roomRemaining)} room left
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="text-slate-500">Current Biomass</div>
                  <div className="text-base font-bold text-sky-800 tabular-nums mt-0.5">
                    {formatNumber(calculatePondBiomassKg(inspectPond), 1)} kg
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="text-slate-500">Mortality Rate</div>
                  <div className="text-base font-bold text-slate-900 tabular-nums mt-0.5">
                    {calculateMortalityRatePct(inspectPond)}%
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="text-slate-500">Harvested</div>
                  <div className="text-base font-bold text-teal-700 tabular-nums mt-0.5">
                    {formatNumber(totalHarvested)} kg
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {formatNumber(totalFedKg)} kg fed
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-200 pt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-slate-900">Latest Water Quality</span>
                  {waterEval && <StatusLabel level={waterEval.overall} />}
                </div>
                {latestWater ? (
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center">
                    <div className="p-2 bg-slate-50 rounded-lg">
                      <div className="text-slate-500">Temp</div>
                      <div className="font-mono font-semibold mt-0.5">
                        {latestWater.temperatureC}°C
                      </div>
                    </div>
                    <div className="p-2 bg-slate-50 rounded-lg">
                      <div className="text-slate-500">pH</div>
                      <div className="font-mono font-semibold mt-0.5">{latestWater.ph}</div>
                    </div>
                    <div className="p-2 bg-slate-50 rounded-lg">
                      <div className="text-slate-500">DO</div>
                      <div className="font-mono font-semibold mt-0.5">
                        {latestWater.dissolvedOxygenMgL} mg/L
                      </div>
                    </div>
                    <div className="p-2 bg-slate-50 rounded-lg">
                      <div className="text-slate-500">NH₃</div>
                      <div className="font-mono font-semibold mt-0.5">
                        {latestWater.ammoniaMgL} mg/L
                      </div>
                    </div>
                    <div className="p-2 bg-slate-50 rounded-lg">
                      <div className="text-slate-500">Clarity</div>
                      <div className="font-mono font-semibold mt-0.5">
                        {latestWater.transparencyCm} cm
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-slate-500">No water quality readings logged yet.</div>
                )}
              </div>

              {inspectPond.notes && (
                <div className="border-t border-slate-200 pt-3 text-slate-600">
                  <span className="font-semibold text-slate-800">Notes: </span>
                  {inspectPond.notes}
                </div>
              )}
            </div>
          );
        })()}
      </Modal>
    </div>
  );
};
