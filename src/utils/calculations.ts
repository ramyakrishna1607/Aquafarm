import {
  Pond,
  SpeciesProfile,
  WaterReading,
  WaterStatusLevel,
} from '../types/aquafarm';

export function calculatePondBiomassKg(pond: Pond): number {
  return Math.round(((pond.currentStock * pond.avgWeightGrams) / 1000) * 10) / 10;
}

export function calculatePondCapacityPct(pond: Pond): number {
  if (!pond.maxStockCapacity || pond.maxStockCapacity <= 0) return 0;
  return Math.min(100, Math.round((pond.currentStock / pond.maxStockCapacity) * 100));
}

export function calculateRecommendedPondCapacity(
  areaSqM: number,
  speciesProfile?: SpeciesProfile
): number {
  const density = speciesProfile?.recommendedPerSqM ?? 6;
  return Math.max(100, Math.round(areaSqM * density));
}

export function calculateMortalityRatePct(pond: Pond): number {
  if (pond.initialStock <= 0) return 0;
  const lost = Math.max(0, pond.initialStock - pond.currentStock);
  return Math.round((lost / pond.initialStock) * 1000) / 10;
}

export function calculateSurvivalRatePct(pond: Pond): number {
  if (pond.initialStock <= 0) return 100;
  return Math.round((pond.currentStock / pond.initialStock) * 1000) / 10;
}

export function calculateSmartDailyFeedKg(
  stockCount: number,
  avgWeightGrams: number,
  feedingRatePct: number
): number {
  const biomassKg = (stockCount * avgWeightGrams) / 1000;
  return Math.round((biomassKg * (feedingRatePct / 100)) * 100) / 100;
}

export interface VirusDiagnosticRule {
  pathogen: string;
  species: string[];
  symptoms: string[];
  waterTriggers: string;
  action: string;
  quarantine: boolean;
}

export const VIRUS_PATHOGEN_RULES: VirusDiagnosticRule[] = [
  {
    pathogen: 'White Spot Syndrome Virus (WSSV)',
    species: ['Pacific White Shrimp'],
    symptoms: [
      'White calcified spots on carapace',
      'Reddish body discoloration',
      'Lethargy & swimming near pond edges',
      'Sudden drop in feed consumption',
    ],
    waterTriggers: 'Rapid temperature fluctuation or low dissolved oxygen (< 4.5 mg/L)',
    action:
      'Quarantine pond immediately, halt water discharge to adjacent ponds, boost aeration, apply probiotics & Vitamin C.',
    quarantine: true,
  },
  {
    pathogen: 'Tilapia Lake Virus (TiLV)',
    species: ['Nile Tilapia'],
    symptoms: [
      'Ocular lesions / cloudy or sunken eyes',
      'Skin erosions & darkened coloration',
      'Loss of appetite & erratic swimming',
      'Abdominal swelling (ascites)',
    ],
    waterTriggers: 'Warm water stress (> 30°C) combined with high stocking density',
    action:
      'Isolate pond equipment & nets, reduce feeding by 50%, maintain DO > 5.0 mg/L, consult aquaculture vet for PCR confirmation.',
    quarantine: true,
  },
  {
    pathogen: 'Epizootic Ulcerative Syndrome (EUS)',
    species: ['Rohu Carp', 'Channel Catfish', 'Nile Tilapia'],
    symptoms: [
      'Deep hemorrhagic ulcers on body flanks',
      'Red spots on head or operculum',
      'Frayed fins & secondary fungal tufts',
      'Surface gasping at dawn',
    ],
    waterTriggers: 'Low pH (< 6.8) or sudden cold snap after heavy rainfall',
    action:
      'Apply agricultural lime (CaCO₃) to stabilize pH, treat with potassium permanganate (2 ppm), remove severely moribund fish.',
    quarantine: true,
  },
  {
    pathogen: 'Channel Catfish Virus (CCV) / Aeromonas Complex',
    species: ['Channel Catfish', 'Striped Bass'],
    symptoms: [
      'Abdominal swelling (ascites)',
      'Hemorrhages at fin bases',
      'Spiral or vertical hanging swimming',
      'Pale gills & gill mucus excess',
    ],
    waterTriggers: 'Elevated ammonia (> 0.05 mg/L) and high temperature (> 29°C)',
    action:
      'Perform 25% fresh water exchange, pause high-protein feed for 24h, dose zeolite & oral immune booster.',
    quarantine: false,
  },
  {
    pathogen: 'Spring Viremia of Carp (SVC)',
    species: ['Rohu Carp'],
    symptoms: [
      'Exophthalmia (pop-eye)',
      'Darkened skin & pale gills',
      'Vent inflammation & trailing fecal casts',
      'Gathering near water inlets',
    ],
    waterTriggers: 'Cooler water fluctuations and high organic load',
    action:
      'Quarantine stock movement, sanitize nets with iodine solution, stabilize water clarity and aeration.',
    quarantine: true,
  },
];

export function runVirusScreening(
  species: string,
  selectedSymptoms: string[],
  waterReading?: WaterReading
): {
  suspectedPathogen: string;
  riskLevel: 'Low' | 'Moderate' | 'High';
  confidencePct: number;
  recommendedAction: string;
  quarantineRequired: boolean;
} {
  if (selectedSymptoms.length === 0) {
    return {
      suspectedPathogen: 'No Viral / Pathogen Indicators Detected',
      riskLevel: 'Low',
      confidencePct: 92,
      recommendedAction:
        'Routine biosecurity clear. Continue daily feeding and morning DO/pH checks.',
      quarantineRequired: false,
    };
  }

  let bestRule = VIRUS_PATHOGEN_RULES[0];
  let bestScore = -1;

  for (const rule of VIRUS_PATHOGEN_RULES) {
    const speciesBonus = rule.species.includes(species) ? 1.5 : 0;
    const symptomMatches = selectedSymptoms.filter((s) =>
      rule.symptoms.includes(s)
    ).length;
    const score = symptomMatches * 2 + speciesBonus;
    if (score > bestScore) {
      bestScore = score;
      bestRule = rule;
    }
  }

  const matchedCount = selectedSymptoms.filter((s) =>
    bestRule.symptoms.includes(s)
  ).length;
  const waterStressBonus =
    waterReading &&
    (waterReading.dissolvedOxygenMgL < 4.5 || waterReading.ammoniaMgL > 0.05)
      ? 10
      : 0;

  const rawConfidence = Math.min(
    96,
    Math.max(42, matchedCount * 22 + (bestRule.species.includes(species) ? 16 : 4) + waterStressBonus)
  );

  const riskLevel: 'Low' | 'Moderate' | 'High' =
    matchedCount >= 2 || (matchedCount >= 1 && waterStressBonus > 0)
      ? 'High'
      : matchedCount === 1 || selectedSymptoms.length >= 2
        ? 'Moderate'
        : 'Low';

  return {
    suspectedPathogen:
      riskLevel === 'Low' && matchedCount === 0
        ? 'Non-Specific Stress Indicator (Monitor)'
        : bestRule.pathogen,
    riskLevel,
    confidencePct: rawConfidence,
    recommendedAction: bestRule.action,
    quarantineRequired: riskLevel === 'High' && bestRule.quarantine,
  };
}

export interface ParameterEvaluation {
  parameter: string;
  valueLabel: string;
  status: WaterStatusLevel;
  message: string;
}

export interface WaterEvaluationResult {
  overall: WaterStatusLevel;
  parameters: ParameterEvaluation[];
  alerts: string[];
}

export function evaluateWaterReading(
  reading: WaterReading,
  speciesProfile?: SpeciesProfile
): WaterEvaluationResult {
  const tempMin = speciesProfile?.optimalTempMin ?? 24;
  const tempMax = speciesProfile?.optimalTempMax ?? 31;
  const phMin = speciesProfile?.optimalPhMin ?? 6.8;
  const phMax = speciesProfile?.optimalPhMax ?? 8.4;
  const minDO = speciesProfile?.minDO ?? 4.5;
  const maxAmmonia = speciesProfile?.maxAmmonia ?? 0.05;
  const minTrans = speciesProfile?.minTransparencyCm ?? 28;

  const parameters: ParameterEvaluation[] = [];
  const alerts: string[] = [];

  // Temperature
  let tempStatus: WaterStatusLevel = 'Normal';
  if (reading.temperatureC < tempMin - 2 || reading.temperatureC > tempMax + 2) {
    tempStatus = 'Critical';
    alerts.push(`Temperature ${reading.temperatureC}°C outside critical bounds`);
  } else if (reading.temperatureC < tempMin || reading.temperatureC > tempMax) {
    tempStatus = 'Warning';
    alerts.push(`Temperature ${reading.temperatureC}°C outside optimal (${tempMin}–${tempMax}°C)`);
  }
  parameters.push({
    parameter: 'Temperature',
    valueLabel: `${reading.temperatureC.toFixed(1)} °C`,
    status: tempStatus,
    message: `Optimal ${tempMin}–${tempMax} °C`,
  });

  // pH
  let phStatus: WaterStatusLevel = 'Normal';
  if (reading.ph < phMin - 0.5 || reading.ph > phMax + 0.5) {
    phStatus = 'Critical';
    alerts.push(`pH ${reading.ph} critically outside safe range`);
  } else if (reading.ph < phMin || reading.ph > phMax) {
    phStatus = 'Warning';
    alerts.push(`pH ${reading.ph} slightly off (${phMin}–${phMax})`);
  }
  parameters.push({
    parameter: 'pH Level',
    valueLabel: reading.ph.toFixed(1),
    status: phStatus,
    message: `Optimal ${phMin}–${phMax}`,
  });

  // Dissolved Oxygen
  let doStatus: WaterStatusLevel = 'Normal';
  if (reading.dissolvedOxygenMgL < minDO - 0.5) {
    doStatus = 'Critical';
    alerts.push(`Dissolved Oxygen critically low (${reading.dissolvedOxygenMgL} mg/L < ${minDO} mg/L)`);
  } else if (reading.dissolvedOxygenMgL < minDO) {
    doStatus = 'Warning';
    alerts.push(`Dissolved Oxygen below target (${reading.dissolvedOxygenMgL} mg/L)`);
  }
  parameters.push({
    parameter: 'Dissolved O₂',
    valueLabel: `${reading.dissolvedOxygenMgL.toFixed(1)} mg/L`,
    status: doStatus,
    message: `Min ${minDO.toFixed(1)} mg/L`,
  });

  // Ammonia
  let nh3Status: WaterStatusLevel = 'Normal';
  if (reading.ammoniaMgL > maxAmmonia * 1.5) {
    nh3Status = 'Critical';
    alerts.push(`Ammonia spike (${reading.ammoniaMgL} mg/L > ${maxAmmonia} mg/L)`);
  } else if (reading.ammoniaMgL > maxAmmonia) {
    nh3Status = 'Warning';
    alerts.push(`Ammonia elevated (${reading.ammoniaMgL} mg/L)`);
  }
  parameters.push({
    parameter: 'Ammonia (NH₃)',
    valueLabel: `${reading.ammoniaMgL.toFixed(2)} mg/L`,
    status: nh3Status,
    message: `Max ${maxAmmonia.toFixed(2)} mg/L`,
  });

  // Transparency
  let transStatus: WaterStatusLevel = 'Normal';
  if (reading.transparencyCm < minTrans - 8) {
    transStatus = 'Critical';
    alerts.push(`Low water clarity (${reading.transparencyCm} cm)`);
  } else if (reading.transparencyCm < minTrans) {
    transStatus = 'Warning';
    alerts.push(`Reduced water transparency (${reading.transparencyCm} cm)`);
  }
  parameters.push({
    parameter: 'Transparency',
    valueLabel: `${reading.transparencyCm} cm`,
    status: transStatus,
    message: `Min ${minTrans} cm`,
  });

  const overall: WaterStatusLevel = parameters.some((p) => p.status === 'Critical')
    ? 'Critical'
    : parameters.some((p) => p.status === 'Warning')
      ? 'Warning'
      : 'Normal';

  return { overall, parameters, alerts };
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
  }).format(amount);
}

export function formatNumber(value: number, decimals = 0): string {
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

export function formatDateShort(isoDate: string): string {
  if (!isoDate) return '—';
  const parsed = new Date(isoDate.includes('T') ? isoDate : `${isoDate}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return isoDate;
  return parsed.toLocaleDateString('en-IN', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatTimestamp(isoTimestamp: string): string {
  if (!isoTimestamp) return '—';
  const parsed = new Date(isoTimestamp);
  if (Number.isNaN(parsed.getTime())) return isoTimestamp;
  return parsed.toLocaleString('en-IN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function downloadCSV(filename: string, headers: string[], rows: (string | number)[][]): void {
  const escapeCell = (val: string | number) => {
    const str = String(val ?? '');
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };
  const csvContent = [
    headers.map(escapeCell).join(','),
    ...rows.map((r) => r.map(escapeCell).join(',')),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
