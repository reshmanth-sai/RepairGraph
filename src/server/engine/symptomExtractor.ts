import { DiagnosticSignals, ComponentType, IssueSeverity } from './types';
import { DeviceCategory } from '@prisma/client';

interface SymptomPattern {
  component: ComponentType;
  categoryName: string;
  defaultIssue: string;
  keywords: string[];
  severity: IssueSeverity;
  diyFeasibleForCategory: (category: DeviceCategory) => boolean;
}

const PATTERNS: SymptomPattern[] = [
  {
    component: 'DISPLAY',
    categoryName: 'Display & Touch Digitizer',
    defaultIssue: 'Damaged display panel or digitizer flex connection',
    keywords: [
      'screen', 'display', 'glass', 'cracked', 'shattered', 'lcd', 'oled', 'amoled',
      'touch', 'flicker', 'flickering', 'vertical lines', 'black screen', 'pixel',
      'dead pixels', 'digitizer', 'blank screen'
    ],
    severity: 'HIGH',
    diyFeasibleForCategory: (cat) => cat === 'LAPTOP' || cat === 'MONITOR',
  },
  {
    component: 'BATTERY',
    categoryName: 'Power & Battery Degradation',
    defaultIssue: 'Degraded chemical capacity or cell impedance failure',
    keywords: [
      'battery', 'drain', 'draining', 'charge fast', 'dies quickly', 'swollen',
      'swelling', 'bulging', 'shuts down', 'random shutdown', 'health 70%', 'cycle count',
      'overheating battery', 'holds no charge'
    ],
    severity: 'MEDIUM',
    diyFeasibleForCategory: (cat) => cat === 'LAPTOP' || cat === 'HEADPHONES',
  },
  {
    component: 'CHARGING_PORT',
    categoryName: 'I/O & Charging Interface',
    defaultIssue: 'Damaged USB-C / Lightning port pins or mechanical loosening',
    keywords: [
      'port', 'usb-c', 'lightning', 'charger', 'loose cable', 'cable loose',
      'wobble', 'wiggle', 'slow charging', 'intermittent charging', 'charging port'
    ],
    severity: 'MEDIUM',
    diyFeasibleForCategory: () => false,
  },
  {
    component: 'LOGIC_BOARD',
    categoryName: 'Core Logic & Power Delivery (PMIC)',
    defaultIssue: 'Power Management IC failure or short circuit on main rail',
    keywords: [
      'motherboard', 'logic board', 'no power', 'won\'t turn on', 'wont turn on',
      'dead', 'boot loop', 'bootloop', 'water', 'liquid', 'spill', 'coffee',
      'short circuit', 'burnt', 'smoke', 'beeps', 'bsod'
    ],
    severity: 'CRITICAL',
    diyFeasibleForCategory: () => false,
  },
  {
    component: 'KEYBOARD',
    categoryName: 'Input Hardware (Keyboard / Trackpad)',
    defaultIssue: 'Scissor/butterfly switch mechanical failure or debris ingress',
    keywords: [
      'keyboard', 'key', 'keys', 'typing', 'spacebar', 'stuck key',
      'trackpad', 'touchpad', 'mouse click'
    ],
    severity: 'LOW',
    diyFeasibleForCategory: (cat) => cat === 'LAPTOP',
  },
  {
    component: 'AUDIO',
    categoryName: 'Acoustic Subsystem (Speaker / Mic)',
    defaultIssue: 'Torn speaker diaphragm or obstructed microphone mesh',
    keywords: [
      'sound', 'audio', 'speaker', 'mic', 'microphone', 'distorted',
      'muffled', 'crackling', 'volume low', 'earpiece'
    ],
    severity: 'LOW',
    diyFeasibleForCategory: () => false,
  },
  {
    component: 'CAMERA',
    categoryName: 'Optical Sensor & Lens Module',
    defaultIssue: 'Cracked lens element or optical image stabilization (OIS) failure',
    keywords: [
      'camera', 'lens', 'blurry', 'focus', 'shaking camera', 'black camera', 'ois'
    ],
    severity: 'LOW',
    diyFeasibleForCategory: () => false,
  },
  {
    component: 'STORAGE',
    categoryName: 'Non-Volatile Storage (SSD / Flash)',
    defaultIssue: 'NAND flash bad sectors or controller read/write errors',
    keywords: [
      'ssd', 'hard drive', 'storage', 'disk full', 'slow boot', 'flashing folder', 'nvme'
    ],
    severity: 'HIGH',
    diyFeasibleForCategory: (cat) => cat === 'LAPTOP',
  },
];

function matchesKeyword(text: string, keyword: string): boolean {
  if (keyword.includes(' ') || keyword.includes("'") || keyword.includes('-')) {
    return text.includes(keyword);
  }
  const regex = new RegExp(`\\b${keyword}\\b`, 'i');
  return regex.test(text);
}

export function extractDiagnosticSignals(
  description: string,
  deviceCategory: DeviceCategory = 'SMARTPHONE',
  brand = ''
): DiagnosticSignals {
  const normalized = description.toLowerCase();
  const evidence: string[] = [];

  // Check liquid damage indicators with word boundary matching
  const liquidKeywords = ['water', 'liquid', 'spill', 'soaked', 'dropped in water', 'rain', 'pool', 'coffee', 'tea'];
  const liquidDamage = liquidKeywords.some((w) => matchesKeyword(normalized, w));
  if (liquidDamage) {
    evidence.push('Liquid ingress reported; poses high risk of trace corrosion and secondary component shorts.');
  }

  // Check power failure indicators
  const powerKeywords = ["won't turn on", 'wont turn on', 'dead', 'no power', 'no sign of life', 'unresponsive'];
  const powerFailure = powerKeywords.some((w) => matchesKeyword(normalized, w));
  if (powerFailure) {
    evidence.push('Complete lack of power indicates potential battery cutoff, charging fuse, or PMIC breakdown.');
  }

  // Score matching patterns
  const matches: { pattern: SymptomPattern; score: number; matchedWords: string[] }[] = [];

  for (const pattern of PATTERNS) {
    const matchedWords = pattern.keywords.filter((k) => matchesKeyword(normalized, k));
    if (matchedWords.length > 0) {
      let score = matchedWords.length * 10;
      // Exact phrase bonus
      if (normalized.includes(pattern.categoryName.toLowerCase())) score += 20;
      matches.push({ pattern, score, matchedWords });
    }
  }

  matches.sort((a, b) => b.score - a.score);

  if (matches.length === 0) {
    // Fallback general diagnosis
    return {
      issueCategory: 'General Hardware Diagnostic',
      possibleIssue: 'Unspecified hardware fault or component degradation',
      confidence: 65.0,
      evidence: [
        'User description did not match specific high-frequency failure keywords.',
        'Initial physical inspection required by certified technician.',
      ],
      primaryComponent: 'GENERAL',
      severity: 'MEDIUM',
      diyFeasible: false,
      liquidDamage: false,
      powerFailure: false,
    };
  }

  const primaryMatch = matches[0];
  const secondaryMatch = matches.length > 1 ? matches[1] : undefined;

  // Add evidence based on matched tokens
  evidence.push(
    `Identified symptoms: "${primaryMatch.matchedWords.slice(0, 4).join(', ')}" correlating with ${primaryMatch.pattern.categoryName}.`
  );

  if (primaryMatch.pattern.component === 'BATTERY' && normalized.includes('swollen')) {
    evidence.push('SAFETY WARNING: Swollen lithium-ion cells pose thermal runaway risk; immediate replacement required.');
  }

  if (secondaryMatch) {
    evidence.push(
      `Secondary symptom: "${secondaryMatch.matchedWords.slice(0, 3).join(', ')}" suggesting secondary correlation with ${secondaryMatch.pattern.categoryName}.`
    );
  }

  // Calculate confidence: base 75%, boosted by token count and clarity, penalized by multi-system ambiguity
  let confidence = Math.min(95, 75 + primaryMatch.matchedWords.length * 5);
  if (liquidDamage) confidence = Math.max(60, confidence - 15); // Liquid damage is inherently unpredictable

  // Check DIY feasibility
  let diyFeasible = primaryMatch.pattern.diyFeasibleForCategory(deviceCategory);
  // Special exceptions: Framework laptops are always highly modular for battery/screen/storage
  if (brand.toLowerCase().includes('framework') && ['BATTERY', 'DISPLAY', 'STORAGE', 'KEYBOARD'].includes(primaryMatch.pattern.component)) {
    diyFeasible = true;
    evidence.push('Framework modular architecture enables certified end-user replacement without specialized repair jig.');
  }

  // Format possible issue with context
  let possibleIssue = primaryMatch.pattern.defaultIssue;
  if (primaryMatch.pattern.component === 'DISPLAY' && normalized.includes('crack')) {
    possibleIssue = 'Fractured outer glass and digitizer assembly; underlying display panel requires module replacement.';
  } else if (primaryMatch.pattern.component === 'BATTERY' && normalized.includes('drain')) {
    possibleIssue = 'Accelerated battery cell degradation below acceptable capacity retention.';
  } else if (liquidDamage) {
    possibleIssue = 'Liquid ingress causing corrosion across power delivery components and logic circuitry.';
  }

  return {
    issueCategory: primaryMatch.pattern.categoryName,
    possibleIssue,
    confidence: Number(confidence.toFixed(1)),
    evidence,
    primaryComponent: primaryMatch.pattern.component,
    secondaryComponent: secondaryMatch?.pattern.component,
    severity: liquidDamage ? 'CRITICAL' : primaryMatch.pattern.severity,
    diyFeasible,
    liquidDamage,
    powerFailure,
  };
}
