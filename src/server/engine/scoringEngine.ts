import { DeviceCategory } from '@prisma/client';
import { DiagnosticSignals, DeviceContext, ScoringResult, FactorScore, RepairabilityFactors } from './types';
import { estimateRepairCost } from './costMatrix';

/**
 * 7-Factor Repairability Score Model (Original RepairGraph Weighting Informed by General Repairability Principles)
 *
 * Weight Distribution:
 * 1. Physical Disassembly & Fasteners:   25 points (25%)
 * 2. Spare Parts Availability:           20 points (20%)
 * 3. Documentation & Repair Manuals:     15 points (15%)
 * 4. Hardware Modularity:                15 points (15%)
 * 5. Software Locks & Parts Pairing:     10 points (10%)
 * 6. Device Age & Lifecycle Support:     10 points (10%)
 * 7. Local Service Ecosystem & Tools:     5 points (5%)
 * -------------------------------------------------------------
 * TOTAL DESIGN REPAIRABILITY BASELINE:  100 points (100%)
 */

// Factor 1: Physical Disassembly & Enclosure Fasteners (Max: 25)
function evaluateDisassembly(category: DeviceCategory, brand: string): FactorScore {
  const b = brand.toLowerCase();
  let score = 16;
  let benchmark = 'Standard chassis fasteners with moderate adhesive';
  let notes = 'Moderate tool requirements for enclosure opening';

  if (b.includes('framework') || b.includes('fairphone')) {
    score = 24;
    benchmark = 'Modular magnetic / captive screws without glue seams';
    notes = 'Standard Torx T5 / Phillips #00, fully zero-glue enclosure';
  } else if (category === 'LAPTOP') {
    if (b.includes('lenovo') || b.includes('dell') || b.includes('hp')) {
      score = 21;
      benchmark = 'Non-glued base panel with standard Phillips/Torx screws';
      notes = 'Captive bottom screws with standard clip release';
    } else if (b.includes('apple')) {
      score = 14;
      benchmark = 'Proprietary Pentalobe P5 screws, tight chassis tolerances';
      notes = 'Requires specialized P5 driver and battery pull-tab precision';
    } else {
      score = 19;
      benchmark = 'Standard chassis screws, minimal adhesive';
      notes = 'Standard Phillips fasteners';
    }
  } else if (category === 'SMARTPHONE') {
    if (b.includes('google')) {
      score = 18;
      benchmark = 'Front-facing screen separation with moderate heat';
      notes = 'Screen lifts from front, allowing direct internal access';
    } else if (b.includes('apple')) {
      score = 14;
      benchmark = 'Pentalobe screws and water-resistant perimeter seal';
      notes = 'Heat plate and specialized suction lift required';
    } else {
      score = 15;
      benchmark = 'Heat-activated perimeter adhesive seam';
      notes = 'Requires hot plate / isopropanol adhesive release';
    }
  } else if (category === 'HEADPHONES') {
    score = 16;
    benchmark = 'Clip-on or twist-off ear cushions with internal screws';
    notes = 'Earpads twist and unclip; internal cup secured with Phillips screws';
  } else if (category === 'TABLET') {
    score = 11;
    benchmark = 'Heavily adhesive-bonded glass digitizer assembly';
    notes = 'High risk of display fracture during perimeter release';
  } else if (category === 'MONITOR') {
    score = 18;
    benchmark = 'Snap-fit rear bezel with standard VESA mount screws';
    notes = 'Easy access to internal power supply board';
  }

  return { name: 'Physical Disassembly & Fasteners', score, maxScore: 25, weight: 25, benchmark, notes };
}

// Factor 2: Spare Parts Availability (Max: 20)
function evaluatePartsAvailability(brand: string): FactorScore {
  const b = brand.toLowerCase();
  let score = 14;
  let benchmark = 'Moderate commercial availability in domestic market';
  let notes = 'Parts accessible via third-party distributors';

  if (b.includes('framework') || b.includes('fairphone')) {
    score = 19;
    benchmark = 'Official direct parts marketplace with long-term supply guarantee';
    notes = 'OEM replacement modules available direct from manufacturer';
  } else if (b.includes('apple') || b.includes('samsung')) {
    score = 18;
    benchmark = 'Ubiquitous domestic aftermarket and OEM parts supply chain';
    notes = 'Widely stocked displays, batteries, and charge ports across Tier-1/2 markets';
  } else if (b.includes('xiaomi') || b.includes('realme') || b.includes('motorola')) {
    score = 17;
    benchmark = 'Broad availability of replacement displays and batteries';
    notes = 'Dense domestic parts supply across independent distribution channels';
  } else if (b.includes('lenovo') || b.includes('dell') || b.includes('hp')) {
    score = 17;
    benchmark = 'Public OEM FRU catalog stocked by regional enterprise suppliers';
    notes = 'FRU batteries, fans, keyboards, and hinges readily stocked';
  } else if (b.includes('google')) {
    score = 16;
    benchmark = 'Genuine OEM distribution partnership through authorized channels';
    notes = 'Official screen and battery packs distributed via iFixit / F1 Info Solutions';
  } else if (b.includes('sony') || b.includes('bose')) {
    score = 12;
    benchmark = 'Authorized service depot parts catalog';
    notes = 'Cushions and batteries available; individual transducer drivers restricted';
  }

  return { name: 'Spare Parts Availability', score, maxScore: 20, weight: 20, benchmark, notes };
}

// Factor 3: Documentation & Repair Manuals (Max: 15)
function evaluateDocumentation(brand: string): FactorScore {
  const b = brand.toLowerCase();
  let score = 9;
  let benchmark = 'Community teardowns and third-party repair guides available';
  let notes = 'No manufacturer-published schematics; reliance on independent guides';

  if (b.includes('framework') || b.includes('fairphone')) {
    score = 15;
    benchmark = 'Open-source Hardware Maintenance Manuals, schematics, and 3D CAD';
    notes = 'Comprehensive schematics freely published under Right to Repair';
  } else if (b.includes('lenovo') || b.includes('dell')) {
    score = 14;
    benchmark = 'Public Hardware Maintenance Manuals (HMM) with torque specs';
    notes = 'Freely downloadable official maintenance guides with exploded diagrams';
  } else if (b.includes('google')) {
    score = 13;
    benchmark = 'Official OEM step-by-step repair manuals published via iFixit';
    notes = 'Step-by-step photo guides and screw size maps freely accessible';
  } else if (b.includes('samsung')) {
    score = 11;
    benchmark = 'Official self-repair guides published for flagship models';
    notes = 'Self-repair guides available for Galaxy S-series and Book models';
  } else if (b.includes('apple')) {
    score = 10;
    benchmark = 'Official Self Service Repair manuals published with proprietary tools';
    notes = 'Detailed manuals published, but calibration workflows restricted';
  } else if (b.includes('sony') || b.includes('bose')) {
    score = 8;
    benchmark = 'Authorized service manual only; restricted consumer availability';
    notes = 'No consumer-facing official teardown documentation';
  }

  return { name: 'Documentation & Manuals', score, maxScore: 15, weight: 15, benchmark, notes };
}

// Factor 4: Hardware Modularity (Max: 15)
function evaluateModularity(category: DeviceCategory, brand: string): FactorScore {
  const b = brand.toLowerCase();
  let score = 9;
  let benchmark = 'Standard consumer hardware component integration';
  let notes = 'Subsystems partially modular with adhesive attachments';

  if (b.includes('framework') || b.includes('fairphone')) {
    score = 15;
    benchmark = '100% modular sub-assemblies, socketed I/O modules, no adhesive';
    notes = 'Independent motherboard, socketed storage/memory, modular ports';
  } else if (category === 'LAPTOP') {
    if (b.includes('lenovo') || b.includes('dell') || b.includes('hp')) {
      score = 13;
      benchmark = 'Modular daughterboards, socketed SO-DIMM and M.2 NVMe slots';
      notes = 'Cooling fan separable from heatpipe; modular keyboard and battery';
    } else if (b.includes('apple')) {
      score = 6;
      benchmark = 'Integrated SoC with soldered Unified Memory and NAND storage';
      notes = 'Zero upgradability; logic-board replacement required for storage/RAM';
    } else {
      score = 11;
      benchmark = 'Modular storage and thermal assembly; partially soldered RAM';
      notes = 'M.2 slot upgradable, standard thermal module';
    }
  } else if (category === 'SMARTPHONE') {
    if (b.includes('google')) {
      score = 11;
      benchmark = 'Front-entry display and separable camera modules';
      notes = 'Modular daughterboard USB-C; stretch-release battery tabs';
    } else if (b.includes('samsung')) {
      score = 10;
      benchmark = 'Sub-board charging assembly with bonded battery pack';
      notes = 'Independent charging daughterboard, adhesive-secured battery';
    } else if (b.includes('apple')) {
      score = 9;
      benchmark = 'Modular display and battery with pull tabs; integrated cables';
      notes = 'Delicate flex cables; fused speaker and sensor assemblies';
    } else {
      score = 10;
      benchmark = 'Standard smartphone daughterboard architecture';
      notes = 'Separable charging sub-board';
    }
  } else if (category === 'TABLET') {
    score = 6;
    benchmark = 'Fused display/digitizer stack with soldered I/O';
    notes = 'High integration; battery glued to aluminum chassis';
  } else if (category === 'HEADPHONES') {
    score = 8;
    benchmark = 'Modular battery and cushions; soldered driver voice coils';
    notes = 'Standard 3.7V cell swap straightforward; micro-soldering for drivers';
  } else if (category === 'MONITOR') {
    score = 11;
    benchmark = 'Independent power supply board and scaler board';
    notes = 'Swappable internal power delivery unit';
  }

  return { name: 'Hardware Modularity', score, maxScore: 15, weight: 15, benchmark, notes };
}

// Factor 5: Software Locks & Parts Pairing (Max: 10)
function evaluateSoftwarePairing(brand: string): FactorScore {
  const b = brand.toLowerCase();
  let score = 8;
  let benchmark = 'Unrestricted component replacement without pairing locks';
  let notes = 'Replaced hardware operates without cryptographic validation';

  if (b.includes('framework') || b.includes('fairphone')) {
    score = 10;
    benchmark = 'Open firmware with zero component serialization locks';
    notes = 'No pairing restrictions on any hardware module';
  } else if (b.includes('apple')) {
    score = 5;
    benchmark = 'System Configuration software calibration and serial pairing';
    notes = 'Cryptographic serialization on display, battery, and camera modules';
  } else if (b.includes('google')) {
    score = 8;
    benchmark = 'Public web-based calibration tools supported';
    notes = 'Web-based optical fingerprint sensor calibration accessible via browser';
  } else if (b.includes('samsung')) {
    score = 7;
    benchmark = 'Sensor calibration supported through service utilities';
    notes = 'Minimal software locking outside of fingerprint sensor recalibration';
  } else {
    score = 10;
    benchmark = 'Zero digital serialization pairing barriers';
    notes = 'Standard plug-and-play operation for OEM and aftermarket modules';
  }

  return { name: 'Parts Pairing & Software Locks', score, maxScore: 10, weight: 10, benchmark, notes };
}

// Factor 6: Device Age & Lifecycle Support (Max: 10)
function evaluateAgeAndSupport(ageYears: number): FactorScore {
  const score = Math.max(0, Math.min(10, Math.round(10 - ageYears * 1.5)));
  let benchmark = 'Active manufacturer hardware and security support window';
  let notes = `${ageYears.toFixed(1)} years since initial purchase/release`;

  if (ageYears <= 1.0) {
    benchmark = 'Current-generation device under active warranty and parts supply';
    notes = 'Optimal support window; abundant supply chain availability';
  } else if (ageYears <= 3.0) {
    benchmark = 'Mainstream hardware lifecycle with stable software updates';
    notes = 'Active security patches and steady spare parts catalog';
  } else if (ageYears <= 5.0) {
    benchmark = 'Extended hardware lifecycle; critical patches maintained';
    notes = 'Approaching legacy status; aftermarket parts primary source';
  } else {
    benchmark = 'Legacy / End-of-Life status; discontinued manufacturer parts';
    notes = 'Operating beyond typical OEM support lifecycle';
  }

  return { name: 'Device Age & Lifecycle Support', score, maxScore: 10, weight: 10, benchmark, notes };
}

// Factor 7: Local Service Ecosystem & Tool Accessibility (Max: 5)
function evaluateServiceEcosystem(category: DeviceCategory, brand: string): FactorScore {
  const b = brand.toLowerCase();
  let score = 4;
  let benchmark = 'Accessible through certified independent repair workshops';
  let notes = 'Standard precision tools (Phillips, Torx, spudgers) readily available';

  if (b.includes('apple') || b.includes('samsung') || b.includes('xiaomi')) {
    score = 5;
    benchmark = 'High density of certified and independent technicians across Indian metro/tier hubs';
    notes = 'Extensive local repair bench availability and widespread tool access';
  } else if (category === 'LAPTOP' && (b.includes('lenovo') || b.includes('dell') || b.includes('hp'))) {
    score = 5;
    benchmark = 'Dense authorized service and independent laptop technician ecosystem';
    notes = 'Universal technician familiarity and standard screwdriver access';
  } else if (b.includes('framework') || b.includes('fairphone')) {
    score = 3;
    benchmark = 'Direct mail-in or self-service focus; limited walk-in authorized centers';
    notes = 'Standard tools supplied with device, but fewer local specialty shops';
  }

  return { name: 'Local Service Ecosystem & Tools', score, maxScore: 5, weight: 5, benchmark, notes };
}

export function calculateScores(
  device: DeviceContext,
  signals: DiagnosticSignals
): ScoringResult {
  // 1. Calculate Device Age in years
  let ageYears = 1.5;
  if (device.purchaseDate) {
    const msDiff = Date.now() - new Date(device.purchaseDate).getTime();
    ageYears = Math.max(0.1, Number((msDiff / (1000 * 60 * 60 * 24 * 365.25)).toFixed(1)));
  }

  // 2. Derive Fair Market Value if not explicitly supplied
  let currentValue = device.currentValue;
  if (!currentValue || currentValue <= 0) {
    const purchasePrice = device.purchasePrice || 35000;
    // Standard consumer electronics depreciation: 22% per year, residual floor 15%
    const depreciated = purchasePrice * Math.pow(1 - 0.22, ageYears);
    currentValue = Math.max(purchasePrice * 0.15, Math.round(depreciated / 100) * 100);
  }

  // 3. Estimate Repair Costs
  const costRange = estimateRepairCost(
    device.category,
    signals.primaryComponent,
    device.brand,
    device.purchasePrice
  );
  const estimatedCostAvg = (costRange.min + costRange.max) / 2;

  // 4. Calculate Repair Cost Ratio (RCR)
  const repairCostRatio = Number((estimatedCostAvg / currentValue).toFixed(3));

  // 5. Calculate Economic Score: 100 - (RCR * 100), bounded [0, 100]
  const economicScore = Math.max(0, Math.min(100, Math.round((1 - repairCostRatio) * 100)));

  // 6. Evaluate the 7 Design Repairability Factors (Sum: 100)
  const disassembly = evaluateDisassembly(device.category, device.brand);         // 25
  const partsAvailability = evaluatePartsAvailability(device.brand);               // 20
  const documentation = evaluateDocumentation(device.brand);                       // 15
  const modularity = evaluateModularity(device.category, device.brand);             // 15
  const softwarePairing = evaluateSoftwarePairing(device.brand);                   // 10
  const ageAndSupport = evaluateAgeAndSupport(ageYears);                           // 10
  const serviceEcosystem = evaluateServiceEcosystem(device.category, device.brand);// 5

  const baselineScore =
    disassembly.score +
    partsAvailability.score +
    documentation.score +
    modularity.score +
    softwarePairing.score +
    ageAndSupport.score +
    serviceEcosystem.score;

  // 7. Incident-Specific Hazard Deductions
  let penaltyAmount = 0;
  const penaltyReasons: string[] = [];

  if (signals.liquidDamage) {
    penaltyAmount += 20;
    penaltyReasons.push('Liquid damage: risk of latent electrolytic oxidation (-20 pts)');
  }
  if (signals.powerFailure) {
    penaltyAmount += 10;
    penaltyReasons.push('Power failure: potential PMIC / logic rail short (-10 pts)');
  }
  if (signals.primaryComponent === 'LOGIC_BOARD') {
    penaltyAmount += 15;
    penaltyReasons.push('Logic-board fault: elevated micro-soldering complexity (-15 pts)');
  }
  if (signals.severity === 'CRITICAL') {
    penaltyAmount += 10;
    penaltyReasons.push('Critical hardware severity deduction (-10 pts)');
  }

  // Final Incident-Adjusted Repairability Score, bounded [10, 98]
  const repairabilityScore = Math.max(10, Math.min(98, baselineScore - penaltyAmount));

  // Normalized 0-100 indices for backward compatibility
  const partsAvailabilityIndex = Math.round((partsAvailability.score / partsAvailability.maxScore) * 100);
  const modularityIndex = Math.round((modularity.score / modularity.maxScore) * 100);
  const documentationIndex = Math.round((documentation.score / documentation.maxScore) * 100);

  const factors: RepairabilityFactors = {
    disassembly,
    partsAvailability,
    documentation,
    modularity,
    softwarePairing,
    ageAndSupport,
    serviceEcosystem,
  };

  return {
    repairabilityScore,
    baselineScore,
    penalties: {
      amount: penaltyAmount,
      reasons: penaltyReasons,
    },
    economicScore,
    repairCostRatio,
    estimatedCostMin: costRange.min,
    estimatedCostMax: costRange.max,
    estimatedCostAvg,
    factors,
    partsAvailabilityIndex,
    modularityIndex,
    documentationIndex,
    ageYears,
  };
}
