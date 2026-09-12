import { DeviceCategory } from '@prisma/client';
import { ComponentType } from './types';

interface CostRange {
  min: number;
  max: number;
}

// Baseline component costs in INR (₹)
const BASELINE_COSTS: Record<DeviceCategory, Record<ComponentType, CostRange>> = {
  SMARTPHONE: {
    DISPLAY: { min: 3500, max: 8500 },
    BATTERY: { min: 1500, max: 3200 },
    CHARGING_PORT: { min: 900, max: 2200 },
    LOGIC_BOARD: { min: 6000, max: 14000 },
    CAMERA: { min: 2000, max: 5500 },
    KEYBOARD: { min: 1000, max: 2500 },
    AUDIO: { min: 800, max: 1800 },
    STORAGE: { min: 3000, max: 7000 },
    GENERAL: { min: 1200, max: 3500 },
  },
  LAPTOP: {
    DISPLAY: { min: 6000, max: 15000 },
    BATTERY: { min: 2500, max: 6500 },
    CHARGING_PORT: { min: 1200, max: 3000 },
    LOGIC_BOARD: { min: 10000, max: 28000 },
    CAMERA: { min: 1500, max: 3500 },
    KEYBOARD: { min: 2000, max: 5000 },
    AUDIO: { min: 1200, max: 2500 },
    STORAGE: { min: 3000, max: 9000 },
    GENERAL: { min: 2000, max: 6000 },
  },
  TABLET: {
    DISPLAY: { min: 5000, max: 12000 },
    BATTERY: { min: 2000, max: 4800 },
    CHARGING_PORT: { min: 1000, max: 2500 },
    LOGIC_BOARD: { min: 8000, max: 18000 },
    CAMERA: { min: 1800, max: 4000 },
    KEYBOARD: { min: 1500, max: 3500 },
    AUDIO: { min: 1000, max: 2200 },
    STORAGE: { min: 3000, max: 8000 },
    GENERAL: { min: 1800, max: 4500 },
  },
  HEADPHONES: {
    DISPLAY: { min: 800, max: 2000 },
    BATTERY: { min: 1200, max: 2800 },
    CHARGING_PORT: { min: 600, max: 1500 },
    LOGIC_BOARD: { min: 2000, max: 5000 },
    CAMERA: { min: 800, max: 1500 },
    KEYBOARD: { min: 500, max: 1000 },
    AUDIO: { min: 1500, max: 4000 },
    STORAGE: { min: 800, max: 2000 },
    GENERAL: { min: 800, max: 2200 },
  },
  MONITOR: {
    DISPLAY: { min: 7000, max: 18000 },
    BATTERY: { min: 1000, max: 2500 },
    CHARGING_PORT: { min: 1200, max: 2800 },
    LOGIC_BOARD: { min: 3500, max: 9000 },
    CAMERA: { min: 1200, max: 3000 },
    KEYBOARD: { min: 500, max: 1000 },
    AUDIO: { min: 1000, max: 2500 },
    STORAGE: { min: 1000, max: 3000 },
    GENERAL: { min: 1500, max: 4500 },
  },
};

// Brand tier multipliers
function getBrandMultiplier(brand: string): number {
  const b = brand.toLowerCase();
  if (b.includes('apple')) return 1.45;       // Premium proprietary parts & serialization
  if (b.includes('sony') || b.includes('bose')) return 1.25;
  if (b.includes('samsung') || b.includes('google')) return 1.15;
  if (b.includes('framework')) return 0.90;   // Direct modular replacement parts
  if (b.includes('xiaomi') || b.includes('realme') || b.includes('motorola')) return 0.85;
  return 1.0;
}

export function estimateRepairCost(
  category: DeviceCategory,
  component: ComponentType,
  brand: string,
  purchasePrice?: number | null
): CostRange {
  const categoryTable = BASELINE_COSTS[category] || BASELINE_COSTS.SMARTPHONE;
  const baseline = categoryTable[component] || categoryTable.GENERAL;
  const multiplier = getBrandMultiplier(brand);

  let min = Math.round((baseline.min * multiplier) / 100) * 100;
  let max = Math.round((baseline.max * multiplier) / 100) * 100;

  // Scale bounds if purchase price is known (e.g. ultra-budget phone parts cost less; ultra-flagship parts cost more)
  if (purchasePrice && purchasePrice > 0) {
    if (purchasePrice > 100000) {
      min = Math.round((min * 1.35) / 100) * 100;
      max = Math.round((max * 1.35) / 100) * 100;
    } else if (purchasePrice < 15000) {
      min = Math.round((min * 0.70) / 100) * 100;
      max = Math.round((max * 0.70) / 100) * 100;
    }
  }

  return { min, max };
}
