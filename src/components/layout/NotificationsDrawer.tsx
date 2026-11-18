import React, { useState } from 'react';
import { AlertTriangle, Bell, Check, Info, Plus, Trash2, X, XCircle } from 'lucide-react';
import { useFarm } from '../../context/FarmContext';
import { AppRoute, CustomReminder } from '../../types/aquafarm';
import { formatDateShort } from '../../utils/calculations';

export const NotificationsDrawer: React.FC<{
  open: boolean;
  onClose: () => void;
  onNavigate: (route: AppRoute) => void;
}> = ({ open, onClose, onNavigate }) => {
  const { state, alerts, addCustomReminder, toggleCustomReminder, deleteCustomReminder } = useFarm();
  const [filterCat, setFilterCat] = useState<string>('All');
  const [showAdd, setShowAdd] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<CustomReminder['category']>('Water Testing');
  const [dueDate, setDueDate] = useState('2026-11-19');
  const [pondId, setPondId] = useState('');

  if (!open) return null;

  const categories = ['All', 'Water Quality', 'Low Feed', 'Feeding', 'Health Check', 'Harvest', 'Custom'];
  const filtered = filterCat === 'All' ? alerts : alerts.filter((a) => a.category === filterCat);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    addCustomReminder({
      title: title.trim(),
      category,
      dueDate,
      pondId: pondId || undefined,
    });
    setTitle('');
    setShowAdd(false);
  };

  const targetRoute = (cat: string): AppRoute => {
    switch (cat) {
      case 'Water Quality':
        return 'water';
      case 'Low Feed':
      case 'Feeding':
        return 'feeding';
      case 'Health Check':
        return 'health';
      case 'Harvest':
        return 'harvest';
      default:
        return 'dashboard';
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-slate-900/35 backdrop-blur-[1px]"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-md bg-white h-full border-l border-slate-200 flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <Bell className="w-4 h-4 text-sky-700" />
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Notifications & Reminders</h2>
              <p className="text-xs text-slate-500">
                {alerts.length} active operational items
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setShowAdd(!showAdd)}
              className="px-2.5 py-1.5 text-xs font-medium text-sky-700 bg-sky-50 hover:bg-sky-100 rounded-lg transition-colors inline-flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close notifications"
              className="p-2 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {showAdd && (
          <form onSubmit={handleAdd} className="p-4 bg-slate-50 border-b border-slate-200 space-y-3">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Reminder title (e.g. Calibrate DO probe)"
              className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg"
            />
            <div className="grid grid-cols-2 gap-2">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as CustomReminder['category'])}
                className="px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg"
              >
                <option value="Feeding">Feeding</option>
                <option value="Water Testing">Water Testing</option>
                <option value="Health Check">Health Check</option>
                <option value="Harvest">Harvest</option>
                <option value="Maintenance">Maintenance</option>
              </select>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg"
              />
            </div>
            <div className="flex items-center justify-between gap-2">
              <select
                value={pondId}
                onChange={(e) => setPondId(e.target.value)}
                className="flex-1 px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg"
              >
                <option value="">All Ponds / General</option>
                {state.ponds.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.code} — {p.name}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                className="px-3 py-1.5 text-xs font-semibold text-white bg-sky-700 hover:bg-sky-800 rounded-lg"
              >
                Save
              </button>
            </div>
          </form>
        )}

        <div className="px-4 py-2.5 border-b border-slate-200 flex items-center gap-1.5 overflow-x-auto">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setFilterCat(cat)}
              className={`px-2.5 py-1 text-xs font-medium rounded-md whitespace-nowrap shrink-0 transition-colors ${
                filterCat === cat
                  ? 'bg-sky-700 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
          {filtered.length === 0 ? (
            <div className="py-12 px-6 text-center text-xs text-slate-500">
              No active reminders in this category.
            </div>
          ) : (
            filtered.map((alert) => {
              const isCustom = alert.id.startsWith('alert-custom-');
              const rawCustomId = alert.id.replace('alert-custom-', '');
              return (
                <div key={alert.id} className="p-4 hover:bg-slate-50/80 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 shrink-0">
                      {alert.severity === 'Critical' ? (
                        <XCircle className="w-4 h-4 text-red-600" />
                      ) : alert.severity === 'Warning' ? (
                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                      ) : (
                        <Info className="w-4 h-4 text-sky-700" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 text-[11px] text-slate-500">
                        <span className="font-medium text-slate-700">{alert.category}</span>
                        <span aria-hidden="true">·</span>
                        <span className="tabular-nums">{formatDateShort(alert.dueDate)}</span>
                      </div>
                      <div className="text-xs font-semibold text-slate-900 mt-0.5">
                        {alert.title}
                      </div>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">{alert.detail}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <button
                          type="button"
                          onClick={() => {
                            onNavigate(targetRoute(alert.category));
                            onClose();
                          }}
                          className="text-xs font-medium text-sky-700 hover:underline"
                        >
                          Open module
                        </button>
                        {isCustom && (
                          <>
                            <button
                              type="button"
                              onClick={() => toggleCustomReminder(rawCustomId)}
                              className="text-xs font-medium text-teal-700 hover:underline inline-flex items-center gap-1"
                            >
                              <Check className="w-3 h-3" />
                              <span>Done</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteCustomReminder(rawCustomId)}
                              className="text-xs text-slate-400 hover:text-red-600 inline-flex items-center gap-1"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>Remove</span>
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
