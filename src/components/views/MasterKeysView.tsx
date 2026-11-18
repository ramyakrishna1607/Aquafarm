import React, { useState } from 'react';
import {
  CheckCircle2,
  KeyRound,
  SlidersHorizontal,
  Users,
  Utensils,
} from 'lucide-react';
import { useFarm } from '../../context/FarmContext';
import { Employee, PondStatus } from '../../types/aquafarm';
import {
  FishEmblemSvg,
  HarvestBasketSvg,
  PondGridSvg,
  SymbolBadge,
  VirusShieldSvg,
} from '../ui/FarmSymbols';

type KeysTab = 'farm' | 'ponds' | 'species' | 'feed' | 'employees' | 'harvests';

export const MasterKeysView: React.FC = () => {
  const {
    state,
    updateFarmSettings,
    updatePond,
    updateSpeciesProfile,
    updateFeedInventory,
    updateEmployee,
    updateHarvestRecord,
  } = useFarm();

  const [tab, setTab] = useState<KeysTab>('farm');
  const [savedNotice, setSavedNotice] = useState<string>('');

  const flashSaved = (msg: string) => {
    setSavedNotice(msg);
    window.setTimeout(() => setSavedNotice(''), 2500);
  };

  const fs = state.farmSettings;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-start gap-3">
          <SymbolBadge tone="indigo" size="lg">
            <KeyRound className="w-5 h-5" />
          </SymbolBadge>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Farm Keys & Master Configuration
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Update all farm keys directly in one place: farm profile, pond growing capacities, species thresholds, feed prices, employee salaries (₹), and harvest pricing.
            </p>
          </div>
        </div>

        {savedNotice && (
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-700 bg-teal-50 border border-teal-200 px-3 py-2 rounded-lg">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{savedNotice}</span>
          </div>
        )}
      </div>

      {/* Category Switcher */}
      <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-lg w-fit">
        {(
          [
            ['farm', 'Farm & Alert Keys'],
            ['ponds', `Pond Keys (${state.ponds.length})`],
            ['species', `Species Keys (${state.speciesProfiles.length})`],
            ['feed', `Feed Keys (${state.feedInventory.length})`],
            ['employees', `Employee & Salary Keys (${state.employees.length})`],
            ['harvests', `Harvest Keys (${state.harvestRecords.length})`],
          ] as [KeysTab, string][]
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

      {/* 1. Farm Identity & Biosecurity Keys */}
      {tab === 'farm' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
            <div className="flex items-center gap-2.5">
              <SymbolBadge tone="sky" size="sm">
                <SlidersHorizontal className="w-4 h-4" />
              </SymbolBadge>
              <div>
                <h2 className="text-sm font-semibold text-slate-900">Farm Profile Keys</h2>
                <p className="text-xs text-slate-500">
                  Changes sync immediately across the dashboard, header, and printed reports.
                </p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Farm Name</label>
                <input
                  type="text"
                  value={fs.farmName}
                  onChange={(e) => {
                    updateFarmSettings({ farmName: e.target.value });
                    flashSaved('Farm name updated');
                  }}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Owner / Director</label>
                  <input
                    type="text"
                    value={fs.ownerName}
                    onChange={(e) => {
                      updateFarmSettings({ ownerName: e.target.value });
                      flashSaved('Owner key updated');
                    }}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Farm Location</label>
                  <input
                    type="text"
                    value={fs.location}
                    onChange={(e) => {
                      updateFarmSettings({ location: e.target.value });
                      flashSaved('Location key updated');
                    }}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
            <div className="flex items-center gap-2.5">
              <SymbolBadge tone="rose" size="sm">
                <VirusShieldSvg className="w-4 h-4" />
              </SymbolBadge>
              <div>
                <h2 className="text-sm font-semibold text-slate-900">
                  Virus Detection & Feeding Keys
                </h2>
                <p className="text-xs text-slate-500">
                  Configure digital biosecurity quarantine triggers and feeding defaults.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Auto-Quarantine Confidence (%)
                </label>
                <input
                  type="number"
                  min={30}
                  max={95}
                  value={fs.virusAutoQuarantinePct}
                  onChange={(e) => {
                    updateFarmSettings({ virusAutoQuarantinePct: Number(e.target.value) });
                    flashSaved('Virus quarantine threshold updated');
                  }}
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
                  max={10}
                  step={0.1}
                  value={fs.defaultFeedRatioPct}
                  onChange={(e) => {
                    updateFarmSettings({ defaultFeedRatioPct: Number(e.target.value) });
                    flashSaved('Default feed ratio updated');
                  }}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Water Alert Sensitivity
                </label>
                <select
                  value={fs.waterAlertSensitivity}
                  onChange={(e) => {
                    updateFarmSettings({
                      waterAlertSensitivity: e.target.value as 'Standard' | 'Strict' | 'Relaxed',
                    });
                    flashSaved('Water sensitivity updated');
                  }}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white"
                >
                  <option value="Strict">Strict (Early Warning)</option>
                  <option value="Standard">Standard (Balanced)</option>
                  <option value="Relaxed">Relaxed (Critical Only)</option>
                </select>
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">Currency Display</label>
                <input
                  type="text"
                  value={fs.currencySymbol}
                  onChange={(e) => {
                    updateFarmSettings({ currencySymbol: e.target.value });
                    flashSaved('Currency symbol updated');
                  }}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Pond Keys & Growing Capacities */}
      {tab === 'ponds' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center gap-2.5">
            <SymbolBadge tone="sky" size="sm">
              <PondGridSvg className="w-4 h-4" />
            </SymbolBadge>
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                All Pond Keys & Max Growing Capacities
              </h2>
              <p className="text-xs text-slate-500">
                Edit pond IDs, names, species, pond size (m²), how many fish can grow, current stock, and status inline.
              </p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold text-slate-500">
                  <th className="py-3 px-3">Pond ID</th>
                  <th className="py-3 px-3">Pond Name</th>
                  <th className="py-3 px-3">Species</th>
                  <th className="py-3 px-3">Area (m²)</th>
                  <th className="py-3 px-3">Max Can Grow</th>
                  <th className="py-3 px-3">Current Stock</th>
                  <th className="py-3 px-3">Avg Wt (g)</th>
                  <th className="py-3 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {state.ponds.map((pond) => (
                  <tr key={pond.id} className="hover:bg-slate-50/60">
                    <td className="py-2 px-3">
                      <input
                        type="text"
                        value={pond.code}
                        onChange={(e) => updatePond(pond.id, { code: e.target.value })}
                        className="w-20 px-2 py-1 border border-slate-200 rounded font-mono font-semibold"
                      />
                    </td>
                    <td className="py-2 px-3">
                      <input
                        type="text"
                        value={pond.name}
                        onChange={(e) => updatePond(pond.id, { name: e.target.value })}
                        className="w-44 px-2 py-1 border border-slate-200 rounded"
                      />
                    </td>
                    <td className="py-2 px-3">
                      <select
                        value={pond.species}
                        onChange={(e) => updatePond(pond.id, { species: e.target.value })}
                        className="px-2 py-1 border border-slate-200 rounded bg-white"
                      >
                        {state.speciesProfiles.map((sp) => (
                          <option key={sp.id} value={sp.name}>
                            {sp.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-2 px-3">
                      <input
                        type="number"
                        min={10}
                        value={pond.areaSqM}
                        onChange={(e) => updatePond(pond.id, { areaSqM: Number(e.target.value) })}
                        className="w-24 px-2 py-1 border border-slate-200 rounded font-mono"
                      />
                    </td>
                    <td className="py-2 px-3">
                      <input
                        type="number"
                        min={10}
                        value={pond.maxStockCapacity}
                        onChange={(e) =>
                          updatePond(pond.id, { maxStockCapacity: Number(e.target.value) })
                        }
                        className="w-24 px-2 py-1 border border-sky-300 bg-sky-50/40 rounded font-mono font-semibold text-sky-900"
                      />
                    </td>
                    <td className="py-2 px-3">
                      <input
                        type="number"
                        min={0}
                        value={pond.currentStock}
                        onChange={(e) =>
                          updatePond(pond.id, { currentStock: Number(e.target.value) })
                        }
                        className="w-24 px-2 py-1 border border-slate-200 rounded font-mono"
                      />
                    </td>
                    <td className="py-2 px-3">
                      <input
                        type="number"
                        min={0.5}
                        step={0.5}
                        value={pond.avgWeightGrams}
                        onChange={(e) =>
                          updatePond(pond.id, { avgWeightGrams: Number(e.target.value) })
                        }
                        className="w-20 px-2 py-1 border border-slate-200 rounded font-mono"
                      />
                    </td>
                    <td className="py-2 px-3">
                      <select
                        value={pond.status}
                        onChange={(e) =>
                          updatePond(pond.id, { status: e.target.value as PondStatus })
                        }
                        className="px-2 py-1 border border-slate-200 rounded bg-white"
                      >
                        <option value="Active">Active</option>
                        <option value="Harvest Ready">Harvest Ready</option>
                        <option value="Maintenance">Maintenance</option>
                        <option value="Resting">Resting</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. Species & Water Quality Keys */}
      {tab === 'species' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center gap-2.5">
            <SymbolBadge tone="teal" size="sm">
              <FishEmblemSvg className="w-4 h-4" />
            </SymbolBadge>
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Species Water Quality & Growing Density Keys
              </h2>
              <p className="text-xs text-slate-500">
                Update temperature, pH, dissolved oxygen, ammonia, target harvest weight, and fish/m² density keys.
              </p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold text-slate-500">
                  <th className="py-3 px-3">Species Name</th>
                  <th className="py-3 px-3">Temp Min–Max (°C)</th>
                  <th className="py-3 px-3">pH Min–Max</th>
                  <th className="py-3 px-3">Min DO</th>
                  <th className="py-3 px-3">Max NH₃</th>
                  <th className="py-3 px-3">Target Wt (g)</th>
                  <th className="py-3 px-3">Density (fish/m²)</th>
                  <th className="py-3 px-3">Feed %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {state.speciesProfiles.map((sp) => (
                  <tr key={sp.id} className="hover:bg-slate-50/60">
                    <td className="py-2 px-3">
                      <input
                        type="text"
                        value={sp.name}
                        onChange={(e) => updateSpeciesProfile(sp.id, { name: e.target.value })}
                        className="w-36 px-2 py-1 border border-slate-200 rounded font-semibold"
                      />
                    </td>
                    <td className="py-2 px-3">
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          step={0.5}
                          value={sp.optimalTempMin}
                          onChange={(e) =>
                            updateSpeciesProfile(sp.id, { optimalTempMin: Number(e.target.value) })
                          }
                          className="w-16 px-2 py-1 border border-slate-200 rounded font-mono"
                        />
                        <span>–</span>
                        <input
                          type="number"
                          step={0.5}
                          value={sp.optimalTempMax}
                          onChange={(e) =>
                            updateSpeciesProfile(sp.id, { optimalTempMax: Number(e.target.value) })
                          }
                          className="w-16 px-2 py-1 border border-slate-200 rounded font-mono"
                        />
                      </div>
                    </td>
                    <td className="py-2 px-3">
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          step={0.1}
                          value={sp.optimalPhMin}
                          onChange={(e) =>
                            updateSpeciesProfile(sp.id, { optimalPhMin: Number(e.target.value) })
                          }
                          className="w-16 px-2 py-1 border border-slate-200 rounded font-mono"
                        />
                        <span>–</span>
                        <input
                          type="number"
                          step={0.1}
                          value={sp.optimalPhMax}
                          onChange={(e) =>
                            updateSpeciesProfile(sp.id, { optimalPhMax: Number(e.target.value) })
                          }
                          className="w-16 px-2 py-1 border border-slate-200 rounded font-mono"
                        />
                      </div>
                    </td>
                    <td className="py-2 px-3">
                      <input
                        type="number"
                        step={0.1}
                        value={sp.minDO}
                        onChange={(e) => updateSpeciesProfile(sp.id, { minDO: Number(e.target.value) })}
                        className="w-16 px-2 py-1 border border-slate-200 rounded font-mono"
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
                        className="w-16 px-2 py-1 border border-slate-200 rounded font-mono"
                      />
                    </td>
                    <td className="py-2 px-3">
                      <input
                        type="number"
                        value={sp.targetHarvestWeightG}
                        onChange={(e) =>
                          updateSpeciesProfile(sp.id, {
                            targetHarvestWeightG: Number(e.target.value),
                          })
                        }
                        className="w-20 px-2 py-1 border border-slate-200 rounded font-mono"
                      />
                    </td>
                    <td className="py-2 px-3">
                      <input
                        type="number"
                        step={0.5}
                        value={sp.recommendedPerSqM}
                        onChange={(e) =>
                          updateSpeciesProfile(sp.id, { recommendedPerSqM: Number(e.target.value) })
                        }
                        className="w-16 px-2 py-1 border border-teal-300 bg-teal-50/40 rounded font-mono font-semibold text-teal-800"
                      />
                    </td>
                    <td className="py-2 px-3">
                      <input
                        type="number"
                        step={0.1}
                        value={sp.defaultFeedRatioPct}
                        onChange={(e) =>
                          updateSpeciesProfile(sp.id, {
                            defaultFeedRatioPct: Number(e.target.value),
                          })
                        }
                        className="w-16 px-2 py-1 border border-slate-200 rounded font-mono"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. Feed Inventory Keys */}
      {tab === 'feed' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center gap-2.5">
            <SymbolBadge tone="amber" size="sm">
              <Utensils className="w-4 h-4" />
            </SymbolBadge>
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Feed Inventory & Price Keys (₹)</h2>
              <p className="text-xs text-slate-500">
                Edit feed names, protein %, stock balances, reorder alerts, and unit costs in Rupees.
              </p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold text-slate-500">
                  <th className="py-3 px-3">Feed Name</th>
                  <th className="py-3 px-3">Protein %</th>
                  <th className="py-3 px-3">Stock (kg)</th>
                  <th className="py-3 px-3">Reorder At (kg)</th>
                  <th className="py-3 px-3">Cost / kg (₹)</th>
                  <th className="py-3 px-3">Supplier</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {state.feedInventory.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/60">
                    <td className="py-2 px-3">
                      <input
                        type="text"
                        value={item.feedName}
                        onChange={(e) =>
                          updateFeedInventory(item.id, { feedName: e.target.value })
                        }
                        className="w-52 px-2 py-1 border border-slate-200 rounded font-semibold"
                      />
                    </td>
                    <td className="py-2 px-3">
                      <input
                        type="number"
                        value={item.proteinPct}
                        onChange={(e) =>
                          updateFeedInventory(item.id, { proteinPct: Number(e.target.value) })
                        }
                        className="w-16 px-2 py-1 border border-slate-200 rounded font-mono"
                      />
                    </td>
                    <td className="py-2 px-3">
                      <input
                        type="number"
                        value={item.stockKg}
                        onChange={(e) =>
                          updateFeedInventory(item.id, { stockKg: Number(e.target.value) })
                        }
                        className="w-24 px-2 py-1 border border-slate-200 rounded font-mono"
                      />
                    </td>
                    <td className="py-2 px-3">
                      <input
                        type="number"
                        value={item.reorderLevelKg}
                        onChange={(e) =>
                          updateFeedInventory(item.id, { reorderLevelKg: Number(e.target.value) })
                        }
                        className="w-24 px-2 py-1 border border-slate-200 rounded font-mono"
                      />
                    </td>
                    <td className="py-2 px-3">
                      <input
                        type="number"
                        step={0.5}
                        value={item.costPerKg}
                        onChange={(e) =>
                          updateFeedInventory(item.id, { costPerKg: Number(e.target.value) })
                        }
                        className="w-24 px-2 py-1 border border-amber-300 bg-amber-50/40 rounded font-mono font-semibold"
                      />
                    </td>
                    <td className="py-2 px-3">
                      <input
                        type="text"
                        value={item.supplier}
                        onChange={(e) =>
                          updateFeedInventory(item.id, { supplier: e.target.value })
                        }
                        className="w-44 px-2 py-1 border border-slate-200 rounded"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. Employee, Role & Salary Keys */}
      {tab === 'employees' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center gap-2.5">
            <SymbolBadge tone="indigo" size="sm">
              <Users className="w-4 h-4" />
            </SymbolBadge>
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Employee Details, Roles & Rupee Salaries (₹)
              </h2>
              <p className="text-xs text-slate-500">
                Digitally update staff names, job roles, departments, phone numbers, and monthly salaries in Indian Rupees.
              </p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold text-slate-500">
                  <th className="py-3 px-3">Name</th>
                  <th className="py-3 px-3">Role</th>
                  <th className="py-3 px-3">Department</th>
                  <th className="py-3 px-3">Monthly Salary (₹)</th>
                  <th className="py-3 px-3">Phone</th>
                  <th className="py-3 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {state.employees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50/60">
                    <td className="py-2 px-3">
                      <input
                        type="text"
                        value={emp.name}
                        onChange={(e) => updateEmployee(emp.id, { name: e.target.value })}
                        className="w-36 px-2 py-1 border border-slate-200 rounded font-semibold"
                      />
                    </td>
                    <td className="py-2 px-3">
                      <input
                        type="text"
                        value={emp.role}
                        onChange={(e) => updateEmployee(emp.id, { role: e.target.value })}
                        className="w-44 px-2 py-1 border border-slate-200 rounded"
                      />
                    </td>
                    <td className="py-2 px-3">
                      <select
                        value={emp.department}
                        onChange={(e) =>
                          updateEmployee(emp.id, {
                            department: e.target.value as Employee['department'],
                          })
                        }
                        className="px-2 py-1 border border-slate-200 rounded bg-white"
                      >
                        <option value="Pond Operations">Pond Operations</option>
                        <option value="Water & Health Lab">Water & Health Lab</option>
                        <option value="Feeding & Logistics">Feeding & Logistics</option>
                        <option value="Management">Management</option>
                      </select>
                    </td>
                    <td className="py-2 px-3">
                      <input
                        type="number"
                        step={500}
                        value={emp.monthlySalary}
                        onChange={(e) =>
                          updateEmployee(emp.id, { monthlySalary: Number(e.target.value) })
                        }
                        className="w-28 px-2 py-1 border border-indigo-300 bg-indigo-50/40 rounded font-mono font-semibold text-indigo-900"
                      />
                    </td>
                    <td className="py-2 px-3">
                      <input
                        type="text"
                        value={emp.phone}
                        onChange={(e) => updateEmployee(emp.id, { phone: e.target.value })}
                        className="w-36 px-2 py-1 border border-slate-200 rounded"
                      />
                    </td>
                    <td className="py-2 px-3">
                      <select
                        value={emp.status}
                        onChange={(e) =>
                          updateEmployee(emp.id, { status: e.target.value as Employee['status'] })
                        }
                        className="px-2 py-1 border border-slate-200 rounded bg-white"
                      >
                        <option value="On Duty">On Duty</option>
                        <option value="Off Duty">Off Duty</option>
                        <option value="On Leave">On Leave</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. Harvest Keys */}
      {tab === 'harvests' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center gap-2.5">
            <SymbolBadge tone="emerald" size="sm">
              <HarvestBasketSvg className="w-4 h-4" />
            </SymbolBadge>
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Harvest & Sales Keys (₹)</h2>
              <p className="text-xs text-slate-500">
                Update harvest dates, quantities (kg), prices per kg (₹), buyer details, and settlement statuses.
              </p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold text-slate-500">
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Species</th>
                  <th className="py-3 px-3">Qty (kg)</th>
                  <th className="py-3 px-3">Avg Wt (g)</th>
                  <th className="py-3 px-3">Price / kg (₹)</th>
                  <th className="py-3 px-3">Buyer</th>
                  <th className="py-3 px-3">Payment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {state.harvestRecords.map((h) => (
                  <tr key={h.id} className="hover:bg-slate-50/60">
                    <td className="py-2 px-3">
                      <input
                        type="date"
                        value={h.date}
                        onChange={(e) => updateHarvestRecord(h.id, { date: e.target.value })}
                        className="px-2 py-1 border border-slate-200 rounded font-mono"
                      />
                    </td>
                    <td className="py-2 px-3 font-semibold text-slate-800">{h.species}</td>
                    <td className="py-2 px-3">
                      <input
                        type="number"
                        min={1}
                        value={h.quantityKg}
                        onChange={(e) =>
                          updateHarvestRecord(h.id, { quantityKg: Number(e.target.value) })
                        }
                        className="w-24 px-2 py-1 border border-slate-200 rounded font-mono"
                      />
                    </td>
                    <td className="py-2 px-3">
                      <input
                        type="number"
                        min={1}
                        value={h.avgWeightG}
                        onChange={(e) =>
                          updateHarvestRecord(h.id, { avgWeightG: Number(e.target.value) })
                        }
                        className="w-20 px-2 py-1 border border-slate-200 rounded font-mono"
                      />
                    </td>
                    <td className="py-2 px-3">
                      <input
                        type="number"
                        step={1}
                        value={h.pricePerKg}
                        onChange={(e) =>
                          updateHarvestRecord(h.id, { pricePerKg: Number(e.target.value) })
                        }
                        className="w-24 px-2 py-1 border border-emerald-300 bg-emerald-50/40 rounded font-mono font-semibold text-emerald-900"
                      />
                    </td>
                    <td className="py-2 px-3">
                      <input
                        type="text"
                        value={h.buyerName}
                        onChange={(e) => updateHarvestRecord(h.id, { buyerName: e.target.value })}
                        className="w-44 px-2 py-1 border border-slate-200 rounded"
                      />
                    </td>
                    <td className="py-2 px-3">
                      <select
                        value={h.paymentStatus}
                        onChange={(e) =>
                          updateHarvestRecord(h.id, {
                            paymentStatus: e.target.value as 'Paid' | 'Pending',
                          })
                        }
                        className="px-2 py-1 border border-slate-200 rounded bg-white"
                      >
                        <option value="Paid">Paid</option>
                        <option value="Pending">Pending</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
