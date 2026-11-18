export type UserRole = 'Admin' | 'Farm Manager' | 'Employee';

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  title: string;
  avatarUrl?: string;
}

export type PondStatus = 'Active' | 'Harvest Ready' | 'Maintenance' | 'Resting';

export interface Pond {
  id: string;
  code: string;
  name: string;
  areaSqM: number;
  waterCapacityLiters: number;
  species: string;
  stockingDate: string;
  maxStockCapacity: number; // Maximum fish that can safely grow in this pond
  initialStock: number;
  currentStock: number;
  avgWeightGrams: number;
  status: PondStatus;
  aerators: number;
  notes?: string;
}

export interface SpeciesProfile {
  id: string;
  name: string;
  scientificName: string;
  optimalTempMin: number;
  optimalTempMax: number;
  optimalPhMin: number;
  optimalPhMax: number;
  minDO: number;
  maxAmmonia: number;
  minTransparencyCm: number;
  targetHarvestWeightG: number;
  defaultFeedRatioPct: number;
  recommendedPerSqM: number; // How many fish/shrimp can grow per m²
}

export interface FingerlingBatch {
  id: string;
  date: string;
  pondId: string;
  species: string;
  supplier: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  avgWeightG: number;
}

export interface MortalityRecord {
  id: string;
  date: string;
  pondId: string;
  count: number;
  cause: string;
  notes?: string;
}

export interface GrowthSample {
  id: string;
  date: string;
  pondId: string;
  sampleSize: number;
  avgWeightG: number;
  avgLengthCm: number;
  notes?: string;
}

export interface FeedInventoryItem {
  id: string;
  feedName: string;
  feedType: 'Starter Crumble' | 'Floating Pellet' | 'Sinking Pellet' | 'Grower Mash' | 'Shrimp Pellet';
  proteinPct: number;
  stockKg: number;
  reorderLevelKg: number;
  costPerKg: number;
  supplier: string;
  lastRestocked: string;
}

export interface FeedingSchedule {
  id: string;
  pondId: string;
  timeSlot: string;
  feedId: string;
  feedName: string;
  quantityKg: number;
  frequency: 'Daily' | 'Twice Daily' | 'Three Times Daily';
  active: boolean;
  lastFedDate?: string;
}

export interface FeedPurchase {
  id: string;
  date: string;
  feedId: string;
  feedName: string;
  quantityKg: number;
  totalCost: number;
  supplier: string;
}

export interface FeedingLog {
  id: string;
  date: string;
  time: string;
  pondId: string;
  feedId: string;
  feedName: string;
  quantityKg: number;
  cost: number;
  recordedBy: string;
}

export type WaterStatusLevel = 'Normal' | 'Warning' | 'Critical';

export interface WaterReading {
  id: string;
  timestamp: string;
  pondId: string;
  temperatureC: number;
  ph: number;
  dissolvedOxygenMgL: number;
  ammoniaMgL: number;
  transparencyCm: number;
  recordedBy: string;
  notes?: string;
}

export interface HealthRecord {
  id: string;
  date: string;
  pondId: string;
  observation: string;
  diseaseName: string;
  symptoms: string;
  affectedCount: number;
  mortalityCount: number;
  treatment: string;
  medicineCost: number;
  status: 'Monitoring' | 'Under Treatment' | 'Resolved';
  nextCheckDate: string;
}

export interface VirusDetectionScan {
  id: string;
  timestamp: string;
  pondId: string;
  species: string;
  suspectedPathogen: string;
  riskLevel: 'Low' | 'Moderate' | 'High';
  confidencePct: number;
  matchedSymptoms: string[];
  recommendedAction: string;
  sampleImageUrl?: string;
  quarantineRequired: boolean;
  scannedBy: string;
}

export interface HarvestRecord {
  id: string;
  date: string;
  pondId: string;
  species: string;
  quantityKg: number;
  avgWeightG: number;
  pricePerKg: number;
  totalSales: number;
  buyerName: string;
  buyerContact: string;
  paymentStatus: 'Paid' | 'Pending';
}

export type FinanceCategory =
  | 'Fish Sales'
  | 'Feed'
  | 'Fingerlings'
  | 'Medicine'
  | 'Labour'
  | 'Electricity & Maintenance'
  | 'Other';

export interface FinancialEntry {
  id: string;
  date: string;
  type: 'Income' | 'Expense';
  category: FinanceCategory;
  description: string;
  amount: number;
  pondId?: string;
}

export interface Employee {
  id: string;
  name: string;
  role: string;
  department: 'Pond Operations' | 'Water & Health Lab' | 'Feeding & Logistics' | 'Management';
  phone: string;
  email: string;
  monthlySalary: number; // Stored in Indian Rupees (INR)
  status: 'On Duty' | 'Off Duty' | 'On Leave';
  assignedPonds: string[];
  joinDate: string;
}

export interface AttendanceRecord {
  id: string;
  date: string;
  employeeId: string;
  status: 'Present' | 'Half Day' | 'Absent';
  checkInTime: string;
}

export interface EmployeeTask {
  id: string;
  title: string;
  employeeId: string;
  pondId?: string;
  dueDate: string;
  priority: 'Normal' | 'High';
  completed: boolean;
}

export interface CustomReminder {
  id: string;
  title: string;
  category: 'Feeding' | 'Water Testing' | 'Health Check' | 'Harvest' | 'Maintenance';
  dueDate: string;
  pondId?: string;
  completed: boolean;
}

export interface FarmActivity {
  id: string;
  timestamp: string;
  module: string;
  description: string;
  actor: string;
}

export interface FarmSettings {
  farmName: string;
  ownerName: string;
  location: string;
  currencySymbol: string;
  virusAutoQuarantinePct: number;
  defaultFeedRatioPct: number;
  waterAlertSensitivity: 'Standard' | 'Strict' | 'Relaxed';
}

export type AppRoute =
  | 'dashboard'
  | 'ponds'
  | 'stock'
  | 'feeding'
  | 'water'
  | 'health'
  | 'harvest'
  | 'finance'
  | 'employees'
  | 'reports'
  | 'calculators'
  | 'keys';

export interface FarmState {
  farmSettings: FarmSettings;
  ponds: Pond[];
  speciesProfiles: SpeciesProfile[];
  fingerlingBatches: FingerlingBatch[];
  mortalityRecords: MortalityRecord[];
  growthSamples: GrowthSample[];
  feedInventory: FeedInventoryItem[];
  feedingSchedules: FeedingSchedule[];
  feedPurchases: FeedPurchase[];
  feedingLogs: FeedingLog[];
  waterReadings: WaterReading[];
  healthRecords: HealthRecord[];
  virusScans: VirusDetectionScan[];
  harvestRecords: HarvestRecord[];
  financialEntries: FinancialEntry[];
  employees: Employee[];
  attendanceRecords: AttendanceRecord[];
  employeeTasks: EmployeeTask[];
  customReminders: CustomReminder[];
  activities: FarmActivity[];
}
