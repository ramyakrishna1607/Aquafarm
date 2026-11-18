import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { DEMO_USERS, INITIAL_FARM_STATE } from '../data/seedData';
import {
  AttendanceRecord,
  CustomReminder,
  Employee,
  EmployeeTask,
  FarmSettings,
  FarmState,
  FeedInventoryItem,
  FeedingSchedule,
  FeedPurchase,
  FinancialEntry,
  FingerlingBatch,
  GrowthSample,
  HarvestRecord,
  HealthRecord,
  MortalityRecord,
  Pond,
  SpeciesProfile,
  UserAccount,
  UserRole,
  VirusDetectionScan,
  WaterReading,
} from '../types/aquafarm';
import { evaluateWaterReading } from '../utils/calculations';

const STATE_STORAGE_KEY = 'aquafarm_state_v2';
const USER_STORAGE_KEY = 'aquafarm_user_v2';
const REGISTERED_USERS_KEY = 'aquafarm_registered_users_v2';

export interface ReminderAlert {
  id: string;
  category: 'Water Quality' | 'Low Feed' | 'Feeding' | 'Health Check' | 'Harvest' | 'Task' | 'Custom';
  severity: 'Critical' | 'Warning' | 'Info';
  title: string;
  detail: string;
  dueDate: string;
  pondId?: string;
}

interface FarmContextValue {
  state: FarmState;
  currentUser: UserAccount | null;
  registeredUsers: UserAccount[];
  login: (email: string, role?: UserRole) => void;
  register: (name: string, email: string, role: UserRole, title: string) => void;
  logout: () => void;
  switchRole: (role: UserRole) => void;
  resetDemoData: () => void;

  // Role capabilities
  canDelete: boolean;
  canEditOperations: boolean;
  canAccessFinance: boolean;
  canManageStaff: boolean;

  // Farm-wide Master Settings
  updateFarmSettings: (updates: Partial<FarmSettings>) => void;

  // Pond actions
  addPond: (pond: Omit<Pond, 'id'>) => void;
  updatePond: (id: string, updates: Partial<Pond>) => void;
  deletePond: (id: string) => void;

  // Species & Stock actions
  addSpeciesProfile: (profile: Omit<SpeciesProfile, 'id'>) => void;
  updateSpeciesProfile: (id: string, updates: Partial<SpeciesProfile>) => void;
  deleteSpeciesProfile: (id: string) => void;
  addFingerlingBatch: (batch: Omit<FingerlingBatch, 'id' | 'totalCost'>) => void;
  updateFingerlingBatch: (id: string, updates: Partial<FingerlingBatch>) => void;
  deleteFingerlingBatch: (id: string) => void;
  addMortalityRecord: (record: Omit<MortalityRecord, 'id'>) => void;
  updateMortalityRecord: (id: string, updates: Partial<MortalityRecord>) => void;
  deleteMortalityRecord: (id: string) => void;
  addGrowthSample: (sample: Omit<GrowthSample, 'id'>) => void;
  updateGrowthSample: (id: string, updates: Partial<GrowthSample>) => void;
  deleteGrowthSample: (id: string) => void;

  // Feeding actions
  addFeedInventory: (item: Omit<FeedInventoryItem, 'id'>) => void;
  updateFeedInventory: (id: string, updates: Partial<FeedInventoryItem>) => void;
  deleteFeedInventory: (id: string) => void;
  addFeedingSchedule: (schedule: Omit<FeedingSchedule, 'id'>) => void;
  updateFeedingSchedule: (id: string, updates: Partial<FeedingSchedule>) => void;
  toggleScheduleActive: (id: string) => void;
  deleteFeedingSchedule: (id: string) => void;
  executeScheduleFeeding: (scheduleId: string) => void;
  logManualFeeding: (entry: {
    date: string;
    time: string;
    pondId: string;
    feedId: string;
    quantityKg: number;
  }) => void;
  addFeedPurchase: (purchase: Omit<FeedPurchase, 'id' | 'feedName'>) => void;
  updateFeedPurchase: (id: string, updates: Partial<FeedPurchase>) => void;
  deleteFeedPurchase: (id: string) => void;

  // Water Quality actions
  addWaterReading: (reading: Omit<WaterReading, 'id' | 'recordedBy'>) => void;
  updateWaterReading: (id: string, updates: Partial<WaterReading>) => void;
  deleteWaterReading: (id: string) => void;

  // Health & Virus Detection actions
  addHealthRecord: (record: Omit<HealthRecord, 'id'>) => void;
  updateHealthRecord: (id: string, updates: Partial<HealthRecord>) => void;
  updateHealthStatus: (id: string, status: HealthRecord['status']) => void;
  deleteHealthRecord: (id: string) => void;
  addVirusScan: (scan: Omit<VirusDetectionScan, 'id' | 'scannedBy'>) => void;
  updateVirusScan: (id: string, updates: Partial<VirusDetectionScan>) => void;
  deleteVirusScan: (id: string) => void;

  // Harvest actions
  addHarvestRecord: (
    harvest: Omit<HarvestRecord, 'id' | 'totalSales'>,
    deductFishCount?: number
  ) => void;
  updateHarvestRecord: (id: string, updates: Partial<HarvestRecord>) => void;
  toggleHarvestPayment: (id: string) => void;
  deleteHarvestRecord: (id: string) => void;

  // Finance actions
  addFinancialEntry: (entry: Omit<FinancialEntry, 'id'>) => void;
  updateFinancialEntry: (id: string, updates: Partial<FinancialEntry>) => void;
  deleteFinancialEntry: (id: string) => void;

  // Employee actions
  addEmployee: (employee: Omit<Employee, 'id'>) => void;
  updateEmployee: (id: string, updates: Partial<Employee>) => void;
  updateEmployeeStatus: (id: string, status: Employee['status']) => void;
  deleteEmployee: (id: string) => void;
  recordAttendance: (employeeId: string, status: AttendanceRecord['status']) => void;
  addEmployeeTask: (task: Omit<EmployeeTask, 'id'>) => void;
  updateEmployeeTask: (id: string, updates: Partial<EmployeeTask>) => void;
  toggleEmployeeTask: (id: string) => void;
  deleteEmployeeTask: (id: string) => void;

  // Reminders
  addCustomReminder: (reminder: Omit<CustomReminder, 'id' | 'completed'>) => void;
  toggleCustomReminder: (id: string) => void;
  deleteCustomReminder: (id: string) => void;
  alerts: ReminderAlert[];
}

const FarmContext = createContext<FarmContextValue | null>(null);

function makeId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

export const FarmProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<FarmState>(() => {
    try {
      const saved = localStorage.getItem(STATE_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Partial<FarmState>;
        return {
          ...INITIAL_FARM_STATE,
          ...parsed,
          farmSettings: {
            ...INITIAL_FARM_STATE.farmSettings,
            ...(parsed.farmSettings ?? {}),
          },
        };
      }
    } catch {
      // ignore storage errors
    }
    return INITIAL_FARM_STATE;
  });

  const [registeredUsers, setRegisteredUsers] = useState<UserAccount[]>(() => {
    try {
      const saved = localStorage.getItem(REGISTERED_USERS_KEY);
      if (saved) {
        return JSON.parse(saved) as UserAccount[];
      }
    } catch {
      // ignore
    }
    return DEMO_USERS;
  });

  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    try {
      const saved = localStorage.getItem(USER_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved) as UserAccount;
      }
    } catch {
      // ignore
    }
    return null;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STATE_STORAGE_KEY, JSON.stringify(state));
    } catch {
      // ignore
    }
  }, [state]);

  useEffect(() => {
    try {
      localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(registeredUsers));
    } catch {
      // ignore
    }
  }, [registeredUsers]);

  useEffect(() => {
    try {
      if (currentUser) {
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(currentUser));
      } else {
        localStorage.removeItem(USER_STORAGE_KEY);
      }
    } catch {
      // ignore
    }
  }, [currentUser]);

  const appendActivity = (prev: FarmState, module: string, description: string): FarmState['activities'] => {
    const now = new Date().toISOString().slice(0, 16);
    const entry = {
      id: makeId('act'),
      timestamp: now,
      module,
      description,
      actor: currentUser?.name ?? 'System',
    };
    return [entry, ...prev.activities].slice(0, 30);
  };

  const login = (email: string, role?: UserRole) => {
    const normalized = email.trim().toLowerCase();
    const existing = registeredUsers.find((u) => u.email.toLowerCase() === normalized);
    if (existing) {
      setCurrentUser(role ? { ...existing, role } : existing);
      return;
    }
    const fallbackByRole = DEMO_USERS.find((u) => u.role === (role ?? 'Admin')) ?? DEMO_USERS[0];
    setCurrentUser({
      ...fallbackByRole,
      email: email || fallbackByRole.email,
    });
  };

  const register = (name: string, email: string, role: UserRole, title: string) => {
    const newUser: UserAccount = {
      id: makeId('usr'),
      name: name.trim(),
      email: email.trim(),
      role,
      title: title.trim() || `${role} Staff`,
    };
    setRegisteredUsers((prev) => [...prev, newUser]);
    setCurrentUser(newUser);
  };

  const logout = () => setCurrentUser(null);

  const switchRole = (role: UserRole) => {
    const demoMatch = DEMO_USERS.find((u) => u.role === role);
    if (demoMatch) {
      setCurrentUser(demoMatch);
    } else if (currentUser) {
      setCurrentUser({ ...currentUser, role });
    }
  };

  const resetDemoData = () => {
    setState(INITIAL_FARM_STATE);
  };

  const role = currentUser?.role ?? 'Employee';
  const canDelete = role === 'Admin';
  const canEditOperations = role === 'Admin' || role === 'Farm Manager' || role === 'Employee';
  const canAccessFinance = role === 'Admin' || role === 'Farm Manager';
  const canManageStaff = role === 'Admin' || role === 'Farm Manager';

  const updateFarmSettings = (updates: Partial<FarmSettings>) => {
    setState((prev) => ({
      ...prev,
      farmSettings: { ...prev.farmSettings, ...updates },
      activities: appendActivity(prev, 'Farm Keys', 'Updated master farm configuration keys'),
    }));
  };

  const addPond = (pond: Omit<Pond, 'id'>) => {
    setState((prev) => ({
      ...prev,
      ponds: [...prev.ponds, { ...pond, id: makeId('pond') }],
      activities: appendActivity(prev, 'Ponds', `Added pond ${pond.code} — ${pond.name} (${pond.species})`),
    }));
  };

  const updatePond = (id: string, updates: Partial<Pond>) => {
    setState((prev) => {
      const target = prev.ponds.find((p) => p.id === id);
      return {
        ...prev,
        ponds: prev.ponds.map((p) => (p.id === id ? { ...p, ...updates } : p)),
        activities: appendActivity(prev, 'Ponds', `Updated pond ${target?.code ?? id}`),
      };
    });
  };

  const deletePond = (id: string) => {
    setState((prev) => {
      const target = prev.ponds.find((p) => p.id === id);
      return {
        ...prev,
        ponds: prev.ponds.filter((p) => p.id !== id),
        activities: appendActivity(prev, 'Ponds', `Removed pond ${target?.code ?? id}`),
      };
    });
  };

  const addSpeciesProfile = (profile: Omit<SpeciesProfile, 'id'>) => {
    setState((prev) => ({
      ...prev,
      speciesProfiles: [...prev.speciesProfiles, { ...profile, id: makeId('sp') }],
      activities: appendActivity(prev, 'Stock', `Added species profile for ${profile.name}`),
    }));
  };

  const updateSpeciesProfile = (id: string, updates: Partial<SpeciesProfile>) => {
    setState((prev) => {
      const sp = prev.speciesProfiles.find((s) => s.id === id);
      return {
        ...prev,
        speciesProfiles: prev.speciesProfiles.map((s) => (s.id === id ? { ...s, ...updates } : s)),
        activities: appendActivity(prev, 'Water Quality', `Updated species profile keys for ${sp?.name ?? id}`),
      };
    });
  };

  const deleteSpeciesProfile = (id: string) => {
    setState((prev) => ({
      ...prev,
      speciesProfiles: prev.speciesProfiles.filter((s) => s.id !== id),
    }));
  };

  const addFingerlingBatch = (batch: Omit<FingerlingBatch, 'id' | 'totalCost'>) => {
    const totalCost = Math.round(batch.quantity * batch.unitCost * 100) / 100;
    setState((prev) => {
      const pond = prev.ponds.find((p) => p.id === batch.pondId);
      const finEntry: FinancialEntry = {
        id: makeId('fin'),
        date: batch.date,
        type: 'Expense',
        category: 'Fingerlings',
        description: `Stocked ${batch.quantity.toLocaleString()} ${batch.species} into ${pond?.code ?? 'Pond'}`,
        amount: totalCost,
        pondId: batch.pondId,
      };
      return {
        ...prev,
        fingerlingBatches: [{ ...batch, id: makeId('fb'), totalCost }, ...prev.fingerlingBatches],
        ponds: prev.ponds.map((p) =>
          p.id === batch.pondId
            ? {
                ...p,
                initialStock: p.initialStock + batch.quantity,
                currentStock: p.currentStock + batch.quantity,
              }
            : p
        ),
        financialEntries: [finEntry, ...prev.financialEntries],
        activities: appendActivity(
          prev,
          'Fish Stock',
          `Purchased ${batch.quantity.toLocaleString()} ${batch.species} fingerlings (₹${totalCost.toLocaleString('en-IN')})`
        ),
      };
    });
  };

  const updateFingerlingBatch = (id: string, updates: Partial<FingerlingBatch>) => {
    setState((prev) => ({
      ...prev,
      fingerlingBatches: prev.fingerlingBatches.map((b) => {
        if (b.id !== id) return b;
        const merged = { ...b, ...updates };
        merged.totalCost = Math.round(merged.quantity * merged.unitCost * 100) / 100;
        return merged;
      }),
      activities: appendActivity(prev, 'Fish Stock', 'Updated fingerling purchase record'),
    }));
  };

  const deleteFingerlingBatch = (id: string) => {
    setState((prev) => ({
      ...prev,
      fingerlingBatches: prev.fingerlingBatches.filter((b) => b.id !== id),
    }));
  };

  const addMortalityRecord = (record: Omit<MortalityRecord, 'id'>) => {
    setState((prev) => {
      const pond = prev.ponds.find((p) => p.id === record.pondId);
      return {
        ...prev,
        mortalityRecords: [{ ...record, id: makeId('mort') }, ...prev.mortalityRecords],
        ponds: prev.ponds.map((p) =>
          p.id === record.pondId
            ? { ...p, currentStock: Math.max(0, p.currentStock - record.count) }
            : p
        ),
        activities: appendActivity(
          prev,
          'Fish Stock',
          `Recorded ${record.count} mortalities in ${pond?.code ?? 'Pond'} (${record.cause})`
        ),
      };
    });
  };

  const updateMortalityRecord = (id: string, updates: Partial<MortalityRecord>) => {
    setState((prev) => ({
      ...prev,
      mortalityRecords: prev.mortalityRecords.map((m) => (m.id === id ? { ...m, ...updates } : m)),
      activities: appendActivity(prev, 'Fish Stock', 'Updated mortality record'),
    }));
  };

  const deleteMortalityRecord = (id: string) => {
    setState((prev) => ({
      ...prev,
      mortalityRecords: prev.mortalityRecords.filter((m) => m.id !== id),
    }));
  };

  const addGrowthSample = (sample: Omit<GrowthSample, 'id'>) => {
    setState((prev) => {
      const pond = prev.ponds.find((p) => p.id === sample.pondId);
      return {
        ...prev,
        growthSamples: [{ ...sample, id: makeId('gr') }, ...prev.growthSamples],
        ponds: prev.ponds.map((p) =>
          p.id === sample.pondId ? { ...p, avgWeightGrams: sample.avgWeightG } : p
        ),
        activities: appendActivity(
          prev,
          'Fish Stock',
          `Updated growth sample for ${pond?.code ?? 'Pond'}: avg ${sample.avgWeightG}g`
        ),
      };
    });
  };

  const updateGrowthSample = (id: string, updates: Partial<GrowthSample>) => {
    setState((prev) => ({
      ...prev,
      growthSamples: prev.growthSamples.map((g) => (g.id === id ? { ...g, ...updates } : g)),
      activities: appendActivity(prev, 'Fish Stock', 'Updated growth sample record'),
    }));
  };

  const deleteGrowthSample = (id: string) => {
    setState((prev) => ({
      ...prev,
      growthSamples: prev.growthSamples.filter((g) => g.id !== id),
    }));
  };

  const addFeedInventory = (item: Omit<FeedInventoryItem, 'id'>) => {
    setState((prev) => ({
      ...prev,
      feedInventory: [...prev.feedInventory, { ...item, id: makeId('feed') }],
      activities: appendActivity(prev, 'Feeding', `Added feed stock item ${item.feedName}`),
    }));
  };

  const updateFeedInventory = (id: string, updates: Partial<FeedInventoryItem>) => {
    setState((prev) => ({
      ...prev,
      feedInventory: prev.feedInventory.map((f) => (f.id === id ? { ...f, ...updates } : f)),
      activities: appendActivity(prev, 'Feeding', 'Updated feed inventory details'),
    }));
  };

  const deleteFeedInventory = (id: string) => {
    setState((prev) => ({
      ...prev,
      feedInventory: prev.feedInventory.filter((f) => f.id !== id),
    }));
  };

  const addFeedingSchedule = (schedule: Omit<FeedingSchedule, 'id'>) => {
    setState((prev) => ({
      ...prev,
      feedingSchedules: [...prev.feedingSchedules, { ...schedule, id: makeId('sched') }],
      activities: appendActivity(prev, 'Feeding', `Created ${schedule.timeSlot} schedule for ${schedule.feedName}`),
    }));
  };

  const updateFeedingSchedule = (id: string, updates: Partial<FeedingSchedule>) => {
    setState((prev) => ({
      ...prev,
      feedingSchedules: prev.feedingSchedules.map((s) => (s.id === id ? { ...s, ...updates } : s)),
      activities: appendActivity(prev, 'Feeding', 'Updated feeding schedule'),
    }));
  };

  const toggleScheduleActive = (id: string) => {
    setState((prev) => ({
      ...prev,
      feedingSchedules: prev.feedingSchedules.map((s) =>
        s.id === id ? { ...s, active: !s.active } : s
      ),
    }));
  };

  const deleteFeedingSchedule = (id: string) => {
    setState((prev) => ({
      ...prev,
      feedingSchedules: prev.feedingSchedules.filter((s) => s.id !== id),
    }));
  };

  const executeScheduleFeeding = (scheduleId: string) => {
    setState((prev) => {
      const sched = prev.feedingSchedules.find((s) => s.id === scheduleId);
      if (!sched) return prev;
      const feed = prev.feedInventory.find((f) => f.id === sched.feedId);
      const pond = prev.ponds.find((p) => p.id === sched.pondId);
      const today = new Date().toISOString().slice(0, 10);
      const nowTime = new Date().toTimeString().slice(0, 5);
      const cost = Math.round((sched.quantityKg * (feed?.costPerKg ?? 1.3)) * 100) / 100;

      return {
        ...prev,
        feedingSchedules: prev.feedingSchedules.map((s) =>
          s.id === scheduleId ? { ...s, lastFedDate: today } : s
        ),
        feedInventory: prev.feedInventory.map((f) =>
          f.id === sched.feedId ? { ...f, stockKg: Math.max(0, f.stockKg - sched.quantityKg) } : f
        ),
        feedingLogs: [
          {
            id: makeId('fl'),
            date: today,
            time: nowTime,
            pondId: sched.pondId,
            feedId: sched.feedId,
            feedName: sched.feedName,
            quantityKg: sched.quantityKg,
            cost,
            recordedBy: currentUser?.name ?? 'Staff',
          },
          ...prev.feedingLogs,
        ],
        activities: appendActivity(
          prev,
          'Feeding',
          `Completed scheduled feeding: ${sched.quantityKg} kg ${sched.feedName} to ${pond?.code ?? 'Pond'}`
        ),
      };
    });
  };

  const logManualFeeding = (entry: {
    date: string;
    time: string;
    pondId: string;
    feedId: string;
    quantityKg: number;
  }) => {
    setState((prev) => {
      const feed = prev.feedInventory.find((f) => f.id === entry.feedId);
      const pond = prev.ponds.find((p) => p.id === entry.pondId);
      const cost = Math.round((entry.quantityKg * (feed?.costPerKg ?? 1.3)) * 100) / 100;
      return {
        ...prev,
        feedInventory: prev.feedInventory.map((f) =>
          f.id === entry.feedId ? { ...f, stockKg: Math.max(0, f.stockKg - entry.quantityKg) } : f
        ),
        feedingLogs: [
          {
            id: makeId('fl'),
            date: entry.date,
            time: entry.time,
            pondId: entry.pondId,
            feedId: entry.feedId,
            feedName: feed?.feedName ?? 'Custom Feed',
            quantityKg: entry.quantityKg,
            cost,
            recordedBy: currentUser?.name ?? 'Staff',
          },
          ...prev.feedingLogs,
        ],
        activities: appendActivity(
          prev,
          'Feeding',
          `Logged ${entry.quantityKg} kg ${feed?.feedName ?? 'feed'} to ${pond?.code ?? 'Pond'}`
        ),
      };
    });
  };

  const addFeedPurchase = (purchase: Omit<FeedPurchase, 'id' | 'feedName'>) => {
    setState((prev) => {
      const feed = prev.feedInventory.find((f) => f.id === purchase.feedId);
      const feedName = feed?.feedName ?? 'Feed Stock';
      const finEntry: FinancialEntry = {
        id: makeId('fin'),
        date: purchase.date,
        type: 'Expense',
        category: 'Feed',
        description: `Feed purchase: ${feedName} (${purchase.quantityKg} kg)`,
        amount: purchase.totalCost,
      };
      return {
        ...prev,
        feedPurchases: [{ ...purchase, id: makeId('fp'), feedName }, ...prev.feedPurchases],
        feedInventory: prev.feedInventory.map((f) =>
          f.id === purchase.feedId
            ? {
                ...f,
                stockKg: f.stockKg + purchase.quantityKg,
                lastRestocked: purchase.date,
                costPerKg: Math.round((purchase.totalCost / Math.max(1, purchase.quantityKg)) * 100) / 100,
              }
            : f
        ),
        financialEntries: [finEntry, ...prev.financialEntries],
        activities: appendActivity(
          prev,
          'Feeding',
          `Purchased ${purchase.quantityKg} kg of ${feedName} (₹${purchase.totalCost.toLocaleString('en-IN')})`
        ),
      };
    });
  };

  const updateFeedPurchase = (id: string, updates: Partial<FeedPurchase>) => {
    setState((prev) => ({
      ...prev,
      feedPurchases: prev.feedPurchases.map((fp) => (fp.id === id ? { ...fp, ...updates } : fp)),
      activities: appendActivity(prev, 'Feeding', 'Updated feed purchase record'),
    }));
  };

  const deleteFeedPurchase = (id: string) => {
    setState((prev) => ({
      ...prev,
      feedPurchases: prev.feedPurchases.filter((fp) => fp.id !== id),
    }));
  };

  const addWaterReading = (reading: Omit<WaterReading, 'id' | 'recordedBy'>) => {
    setState((prev) => {
      const pond = prev.ponds.find((p) => p.id === reading.pondId);
      const profile = prev.speciesProfiles.find((s) => s.name === pond?.species);
      const fullReading: WaterReading = {
        ...reading,
        id: makeId('wq'),
        recordedBy: currentUser?.name ?? 'Staff',
      };
      const evaluation = evaluateWaterReading(fullReading, profile);
      return {
        ...prev,
        waterReadings: [fullReading, ...prev.waterReadings],
        activities: appendActivity(
          prev,
          'Water Quality',
          `${evaluation.overall} water test in ${pond?.code ?? 'Pond'}: Temp ${reading.temperatureC}°C, DO ${reading.dissolvedOxygenMgL} mg/L, pH ${reading.ph}`
        ),
      };
    });
  };

  const updateWaterReading = (id: string, updates: Partial<WaterReading>) => {
    setState((prev) => ({
      ...prev,
      waterReadings: prev.waterReadings.map((w) => (w.id === id ? { ...w, ...updates } : w)),
      activities: appendActivity(prev, 'Water Quality', 'Updated water quality reading keys'),
    }));
  };

  const deleteWaterReading = (id: string) => {
    setState((prev) => ({
      ...prev,
      waterReadings: prev.waterReadings.filter((w) => w.id !== id),
    }));
  };

  const addHealthRecord = (record: Omit<HealthRecord, 'id'>) => {
    setState((prev) => {
      const pond = prev.ponds.find((p) => p.id === record.pondId);
      const newFinEntries =
        record.medicineCost > 0
          ? [
              {
                id: makeId('fin'),
                date: record.date,
                type: 'Expense' as const,
                category: 'Medicine' as const,
                description: `Treatment (${record.diseaseName}) for ${pond?.code ?? 'Pond'}`,
                amount: record.medicineCost,
                pondId: record.pondId,
              },
              ...prev.financialEntries,
            ]
          : prev.financialEntries;

      return {
        ...prev,
        healthRecords: [{ ...record, id: makeId('hl') }, ...prev.healthRecords],
        ponds:
          record.mortalityCount > 0
            ? prev.ponds.map((p) =>
                p.id === record.pondId
                  ? { ...p, currentStock: Math.max(0, p.currentStock - record.mortalityCount) }
                  : p
              )
            : prev.ponds,
        financialEntries: newFinEntries,
        activities: appendActivity(
          prev,
          'Health',
          `Logged health record (${record.diseaseName}) for ${pond?.code ?? 'Pond'}`
        ),
      };
    });
  };

  const updateHealthRecord = (id: string, updates: Partial<HealthRecord>) => {
    setState((prev) => ({
      ...prev,
      healthRecords: prev.healthRecords.map((h) => (h.id === id ? { ...h, ...updates } : h)),
      activities: appendActivity(prev, 'Health', 'Updated treatment & health record'),
    }));
  };

  const updateHealthStatus = (id: string, status: HealthRecord['status']) => {
    setState((prev) => ({
      ...prev,
      healthRecords: prev.healthRecords.map((h) => (h.id === id ? { ...h, status } : h)),
    }));
  };

  const deleteHealthRecord = (id: string) => {
    setState((prev) => ({
      ...prev,
      healthRecords: prev.healthRecords.filter((h) => h.id !== id),
    }));
  };

  const addVirusScan = (scan: Omit<VirusDetectionScan, 'id' | 'scannedBy'>) => {
    setState((prev) => {
      const pond = prev.ponds.find((p) => p.id === scan.pondId);
      const newScan: VirusDetectionScan = {
        ...scan,
        id: makeId('vs'),
        scannedBy: currentUser?.name ?? 'Staff',
      };
      return {
        ...prev,
        virusScans: [newScan, ...prev.virusScans],
        activities: appendActivity(
          prev,
          'Virus Detection',
          `${scan.riskLevel} risk (${scan.suspectedPathogen}) detected in ${pond?.code ?? 'Pond'}`
        ),
      };
    });
  };

  const updateVirusScan = (id: string, updates: Partial<VirusDetectionScan>) => {
    setState((prev) => ({
      ...prev,
      virusScans: prev.virusScans.map((v) => (v.id === id ? { ...v, ...updates } : v)),
      activities: appendActivity(prev, 'Virus Detection', 'Updated virus screening record'),
    }));
  };

  const deleteVirusScan = (id: string) => {
    setState((prev) => ({
      ...prev,
      virusScans: prev.virusScans.filter((v) => v.id !== id),
    }));
  };

  const addHarvestRecord = (
    harvest: Omit<HarvestRecord, 'id' | 'totalSales'>,
    deductFishCount?: number
  ) => {
    const totalSales = Math.round(harvest.quantityKg * harvest.pricePerKg * 100) / 100;
    setState((prev) => {
      const pond = prev.ponds.find((p) => p.id === harvest.pondId);
      const estimatedFish =
        deductFishCount ??
        Math.round((harvest.quantityKg * 1000) / Math.max(1, harvest.avgWeightG));
      const finEntry: FinancialEntry = {
        id: makeId('fin'),
        date: harvest.date,
        type: 'Income',
        category: 'Fish Sales',
        description: `Harvest sale — ${harvest.species} (${harvest.quantityKg} kg) to ${harvest.buyerName}`,
        amount: totalSales,
        pondId: harvest.pondId,
      };
      return {
        ...prev,
        harvestRecords: [{ ...harvest, id: makeId('hv'), totalSales }, ...prev.harvestRecords],
        ponds: prev.ponds.map((p) =>
          p.id === harvest.pondId
            ? {
                ...p,
                currentStock: Math.max(0, p.currentStock - estimatedFish),
                status: p.currentStock - estimatedFish <= 200 ? 'Resting' : 'Active',
              }
            : p
        ),
        financialEntries: [finEntry, ...prev.financialEntries],
        activities: appendActivity(
          prev,
          'Harvest',
          `Recorded ${harvest.quantityKg} kg harvest from ${pond?.code ?? 'Pond'} (₹${totalSales.toLocaleString('en-IN')})`
        ),
      };
    });
  };

  const updateHarvestRecord = (id: string, updates: Partial<HarvestRecord>) => {
    setState((prev) => ({
      ...prev,
      harvestRecords: prev.harvestRecords.map((h) => {
        if (h.id !== id) return h;
        const merged = { ...h, ...updates };
        merged.totalSales = Math.round(merged.quantityKg * merged.pricePerKg * 100) / 100;
        return merged;
      }),
      activities: appendActivity(prev, 'Harvest', 'Updated harvest & buyer sales record'),
    }));
  };

  const toggleHarvestPayment = (id: string) => {
    setState((prev) => ({
      ...prev,
      harvestRecords: prev.harvestRecords.map((h) =>
        h.id === id
          ? { ...h, paymentStatus: h.paymentStatus === 'Paid' ? 'Pending' : 'Paid' }
          : h
      ),
    }));
  };

  const deleteHarvestRecord = (id: string) => {
    setState((prev) => ({
      ...prev,
      harvestRecords: prev.harvestRecords.filter((h) => h.id !== id),
    }));
  };

  const addFinancialEntry = (entry: Omit<FinancialEntry, 'id'>) => {
    setState((prev) => ({
      ...prev,
      financialEntries: [{ ...entry, id: makeId('fin') }, ...prev.financialEntries],
      activities: appendActivity(
        prev,
        'Finance',
        `Recorded ${entry.type.toLowerCase()} (${entry.category}): ₹${entry.amount.toLocaleString('en-IN')}`
      ),
    }));
  };

  const updateFinancialEntry = (id: string, updates: Partial<FinancialEntry>) => {
    setState((prev) => ({
      ...prev,
      financialEntries: prev.financialEntries.map((f) => (f.id === id ? { ...f, ...updates } : f)),
      activities: appendActivity(prev, 'Finance', 'Updated financial ledger entry'),
    }));
  };

  const deleteFinancialEntry = (id: string) => {
    setState((prev) => ({
      ...prev,
      financialEntries: prev.financialEntries.filter((f) => f.id !== id),
    }));
  };

  const addEmployee = (employee: Omit<Employee, 'id'>) => {
    setState((prev) => ({
      ...prev,
      employees: [...prev.employees, { ...employee, id: makeId('emp') }],
      activities: appendActivity(prev, 'Employees', `Added staff member ${employee.name} (${employee.role})`),
    }));
  };

  const updateEmployee = (id: string, updates: Partial<Employee>) => {
    setState((prev) => {
      const target = prev.employees.find((e) => e.id === id);
      return {
        ...prev,
        employees: prev.employees.map((e) => (e.id === id ? { ...e, ...updates } : e)),
        activities: appendActivity(
          prev,
          'Employees',
          `Digitally updated staff profile for ${updates.name ?? target?.name ?? id}`
        ),
      };
    });
  };

  const updateEmployeeStatus = (id: string, status: Employee['status']) => {
    setState((prev) => ({
      ...prev,
      employees: prev.employees.map((e) => (e.id === id ? { ...e, status } : e)),
    }));
  };

  const deleteEmployee = (id: string) => {
    setState((prev) => ({
      ...prev,
      employees: prev.employees.filter((e) => e.id !== id),
    }));
  };

  const recordAttendance = (employeeId: string, status: AttendanceRecord['status']) => {
    const today = new Date().toISOString().slice(0, 10);
    const nowTime = status === 'Absent' ? '—' : new Date().toTimeString().slice(0, 5);
    setState((prev) => {
      const existing = prev.attendanceRecords.find(
        (a) => a.employeeId === employeeId && a.date === today
      );
      if (existing) {
        return {
          ...prev,
          attendanceRecords: prev.attendanceRecords.map((a) =>
            a.id === existing.id ? { ...a, status, checkInTime: nowTime } : a
          ),
        };
      }
      return {
        ...prev,
        attendanceRecords: [
          { id: makeId('att'), date: today, employeeId, status, checkInTime: nowTime },
          ...prev.attendanceRecords,
        ],
      };
    });
  };

  const addEmployeeTask = (task: Omit<EmployeeTask, 'id'>) => {
    setState((prev) => ({
      ...prev,
      employeeTasks: [{ ...task, id: makeId('task') }, ...prev.employeeTasks],
      activities: appendActivity(prev, 'Employees', `Assigned task: ${task.title}`),
    }));
  };

  const updateEmployeeTask = (id: string, updates: Partial<EmployeeTask>) => {
    setState((prev) => ({
      ...prev,
      employeeTasks: prev.employeeTasks.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    }));
  };

  const toggleEmployeeTask = (id: string) => {
    setState((prev) => ({
      ...prev,
      employeeTasks: prev.employeeTasks.map((t) =>
        t.id === id ? { ...t, completed: !t.completed } : t
      ),
    }));
  };

  const deleteEmployeeTask = (id: string) => {
    setState((prev) => ({
      ...prev,
      employeeTasks: prev.employeeTasks.filter((t) => t.id !== id),
    }));
  };

  const addCustomReminder = (reminder: Omit<CustomReminder, 'id' | 'completed'>) => {
    setState((prev) => ({
      ...prev,
      customReminders: [{ ...reminder, id: makeId('rem'), completed: false }, ...prev.customReminders],
    }));
  };

  const toggleCustomReminder = (id: string) => {
    setState((prev) => ({
      ...prev,
      customReminders: prev.customReminders.map((r) =>
        r.id === id ? { ...r, completed: !r.completed } : r
      ),
    }));
  };

  const deleteCustomReminder = (id: string) => {
    setState((prev) => ({
      ...prev,
      customReminders: prev.customReminders.filter((r) => r.id !== id),
    }));
  };

  // Compute dynamic Reminders & Alerts across Water Quality, Feed Inventory, Schedules, Health, Harvest, Tasks, Custom
  const alerts = useMemo<ReminderAlert[]>(() => {
    const items: ReminderAlert[] = [];
    const today = new Date().toISOString().slice(0, 10);

    // 1. Latest water quality reading per pond
    state.ponds.forEach((pond) => {
      const readings = state.waterReadings
        .filter((w) => w.pondId === pond.id)
        .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
      if (readings.length === 0) {
        items.push({
          id: `alert-wq-missing-${pond.id}`,
          category: 'Water Quality',
          severity: 'Warning',
          title: `Water test due for ${pond.code}`,
          detail: `No water quality readings logged yet for ${pond.name}.`,
          dueDate: today,
          pondId: pond.id,
        });
      } else {
        const latest = readings[0];
        const profile = state.speciesProfiles.find((s) => s.name === pond.species);
        const evalRes = evaluateWaterReading(latest, profile);
        if (evalRes.overall !== 'Normal') {
          items.push({
            id: `alert-wq-${pond.id}`,
            category: 'Water Quality',
            severity: evalRes.overall === 'Critical' ? 'Critical' : 'Warning',
            title: `${evalRes.overall} water alert — ${pond.code} (${pond.name})`,
            detail: evalRes.alerts.join(' · '),
            dueDate: latest.timestamp.slice(0, 10),
            pondId: pond.id,
          });
        }
      }
    });

    // 2. Low feed inventory
    state.feedInventory.forEach((feed) => {
      if (feed.stockKg <= feed.reorderLevelKg) {
        items.push({
          id: `alert-feed-${feed.id}`,
          category: 'Low Feed',
          severity: feed.stockKg <= feed.reorderLevelKg * 0.5 ? 'Critical' : 'Warning',
          title: `Low stock: ${feed.feedName}`,
          detail: `${feed.stockKg} kg remaining (reorder threshold ${feed.reorderLevelKg} kg).`,
          dueDate: today,
        });
      }
    });

    // 3. Pending daily feed schedules not yet marked fed today
    state.feedingSchedules
      .filter((s) => s.active && s.lastFedDate !== today)
      .forEach((sched) => {
        const pond = state.ponds.find((p) => p.id === sched.pondId);
        items.push({
          id: `alert-sched-${sched.id}`,
          category: 'Feeding',
          severity: 'Info',
          title: `Feeding due at ${sched.timeSlot} — ${pond?.code ?? 'Pond'}`,
          detail: `${sched.quantityKg} kg of ${sched.feedName}.`,
          dueDate: today,
          pondId: sched.pondId,
        });
      });

    // 4. Health follow-up checks
    state.healthRecords
      .filter((h) => h.status !== 'Resolved')
      .forEach((h) => {
        const pond = state.ponds.find((p) => p.id === h.pondId);
        items.push({
          id: `alert-health-${h.id}`,
          category: 'Health Check',
          severity: 'Warning',
          title: `Health check: ${h.diseaseName} (${pond?.code ?? 'Pond'})`,
          detail: `${h.treatment}. Next check due ${h.nextCheckDate}.`,
          dueDate: h.nextCheckDate,
          pondId: h.pondId,
        });
      });

    // 5. Harvest ready ponds
    state.ponds
      .filter((p) => p.status === 'Harvest Ready')
      .forEach((pond) => {
        items.push({
          id: `alert-harvest-${pond.id}`,
          category: 'Harvest',
          severity: 'Info',
          title: `${pond.code} (${pond.name}) is Harvest Ready`,
          detail: `Est. biomass ${Math.round((pond.currentStock * pond.avgWeightGrams) / 1000).toLocaleString()} kg (${pond.species}).`,
          dueDate: today,
          pondId: pond.id,
        });
      });

    // 6. High/Moderate Virus Detection scans
    state.virusScans
      .filter((v) => v.riskLevel !== 'Low')
      .slice(0, 3)
      .forEach((v) => {
        const pond = state.ponds.find((p) => p.id === v.pondId);
        items.push({
          id: `alert-virus-${v.id}`,
          category: 'Health Check',
          severity: v.riskLevel === 'High' ? 'Critical' : 'Warning',
          title: `Virus Alert (${v.riskLevel}): ${v.suspectedPathogen}`,
          detail: `${pond?.code ?? 'Pond'} (${v.confidencePct}% match) — ${v.recommendedAction}`,
          dueDate: v.timestamp.slice(0, 10),
          pondId: v.pondId,
        });
      });

    // 7. Custom reminders
    state.customReminders
      .filter((r) => !r.completed)
      .forEach((r) => {
        items.push({
          id: `alert-custom-${r.id}`,
          category: 'Custom',
          severity: 'Info',
          title: r.title,
          detail: `${r.category} reminder`,
          dueDate: r.dueDate,
          pondId: r.pondId,
        });
      });

    const severityRank = { Critical: 0, Warning: 1, Info: 2 };
    return items.sort((a, b) => severityRank[a.severity] - severityRank[b.severity]);
  }, [state]);

  return (
    <FarmContext.Provider
      value={{
        state,
        currentUser,
        registeredUsers,
        login,
        register,
        logout,
        switchRole,
        resetDemoData,
        canDelete,
        canEditOperations,
        canAccessFinance,
        canManageStaff,
        updateFarmSettings,
        addPond,
        updatePond,
        deletePond,
        addSpeciesProfile,
        updateSpeciesProfile,
        deleteSpeciesProfile,
        addFingerlingBatch,
        updateFingerlingBatch,
        deleteFingerlingBatch,
        addMortalityRecord,
        updateMortalityRecord,
        deleteMortalityRecord,
        addGrowthSample,
        updateGrowthSample,
        deleteGrowthSample,
        addFeedInventory,
        updateFeedInventory,
        deleteFeedInventory,
        addFeedingSchedule,
        updateFeedingSchedule,
        toggleScheduleActive,
        deleteFeedingSchedule,
        executeScheduleFeeding,
        logManualFeeding,
        addFeedPurchase,
        updateFeedPurchase,
        deleteFeedPurchase,
        addWaterReading,
        updateWaterReading,
        deleteWaterReading,
        addHealthRecord,
        updateHealthRecord,
        updateHealthStatus,
        deleteHealthRecord,
        addVirusScan,
        updateVirusScan,
        deleteVirusScan,
        addHarvestRecord,
        updateHarvestRecord,
        toggleHarvestPayment,
        deleteHarvestRecord,
        addFinancialEntry,
        updateFinancialEntry,
        deleteFinancialEntry,
        addEmployee,
        updateEmployee,
        updateEmployeeStatus,
        deleteEmployee,
        recordAttendance,
        addEmployeeTask,
        updateEmployeeTask,
        toggleEmployeeTask,
        deleteEmployeeTask,
        addCustomReminder,
        toggleCustomReminder,
        deleteCustomReminder,
        alerts,
      }}
    >
      {children}
    </FarmContext.Provider>
  );
};

export function useFarm(): FarmContextValue {
  const ctx = useContext(FarmContext);
  if (!ctx) {
    throw new Error('useFarm must be used inside FarmProvider');
  }
  return ctx;
}
