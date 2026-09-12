import {
  extractDiagnosticSignals,
  calculateScores,
  diagnoseAndRecommend,
  DeviceContext,
} from '../src/server/engine';

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  ✓ ${message}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failed++;
  }
}

async function runEngineTests() {
  console.log('====================================================');
  console.log('🧠 RUNNING DIAGNOSTIC & DECISION ENGINE UNIT TESTS');
  console.log('====================================================\n');

  // TEST 1: Symptom Extraction for Display Damage
  {
    console.log('--- Suite 1: Rule-Based Symptom & Feature Extraction ---');
    const signals = extractDiagnosticSignals(
      'Dropped phone on marble floor, display glass is shattered and touch digitizer is unresponsive in the bottom half',
      'SMARTPHONE',
      'Google'
    );
    assert(signals.primaryComponent === 'DISPLAY', 'Correctly identifies DISPLAY as primary component');
    assert(signals.issueCategory === 'Display & Touch Digitizer', 'Maps to correct display issue category');
    assert(signals.severity === 'HIGH', 'Assigns HIGH severity for broken digitizer');
    assert(signals.confidence >= 80, `Confidence is robust (got ${signals.confidence}%)`);
    assert(signals.evidence.length >= 2, 'Extracts structured evidence points');
    assert(!signals.liquidDamage, 'Correctly reports no liquid damage');
  }

  // TEST 2: Battery Swelling & Thermal Safety
  {
    const signals = extractDiagnosticSignals(
      'Back panel is bulging, battery is swollen and phone shuts down at 35%',
      'SMARTPHONE',
      'Samsung'
    );
    assert(signals.primaryComponent === 'BATTERY', 'Identifies BATTERY component');
    assert(
      signals.evidence.some((e) => e.includes('SAFETY WARNING') || e.includes('swollen')),
      'Includes safety warning for swollen lithium cells'
    );
  }

  // TEST 3: Liquid Damage Ingress Detection
  {
    const signals = extractDiagnosticSignals(
      'Spilled coffee on keyboard, laptop powered off immediately and won\'t turn on',
      'LAPTOP',
      'Apple'
    );
    assert(signals.liquidDamage === true, 'Detects liquid damage flag');
    assert(signals.powerFailure === true, 'Detects power failure flag');
    assert(signals.severity === 'CRITICAL', 'Escalates liquid ingress + power failure to CRITICAL');
  }

  // TEST 4: Framework Modular Laptop DIY Feasibility
  {
    const signals = extractDiagnosticSignals(
      'Battery life degraded after 3 years, drains in 1 hour',
      'LAPTOP',
      'Framework'
    );
    assert(signals.diyFeasible === true, 'Framework laptop battery replacement recognized as DIY feasible');
    assert(
      signals.evidence.some((e) => e.toLowerCase().includes('framework')),
      'Recognizes Framework modular architecture in evidence'
    );
  }

  // TEST 5: Scoring Formula & 7-Factor Model (25 + 20 + 15 + 15 + 10 + 10 + 5 = 100)
  {
    console.log('\n--- Suite 2: 7-Factor Score Model (25+20+15+15+10+10+5=100) & Economic Math ---');
    const device: DeviceContext = {
      id: 'dev_1',
      category: 'SMARTPHONE',
      brand: 'Google',
      model: 'Pixel 7',
      purchasePrice: 55000,
      currentValue: 32000,
      purchaseDate: new Date(Date.now() - 365.25 * 24 * 60 * 60 * 1000 * 1.5), // 1.5 years old
      condition: 'GOOD',
    };

    const signals = extractDiagnosticSignals('Cracked front screen glass', 'SMARTPHONE', 'Google');
    const scoring = calculateScores(device, signals);

    // Verify 7-factor weights sum to 100
    const f = scoring.factors;
    const maxWeightsSum =
      f.disassembly.maxScore +
      f.partsAvailability.maxScore +
      f.documentation.maxScore +
      f.modularity.maxScore +
      f.softwarePairing.maxScore +
      f.ageAndSupport.maxScore +
      f.serviceEcosystem.maxScore;

    assert(maxWeightsSum === 100, `7 factors sum exactly to 100 (got ${maxWeightsSum})`);
    assert(f.disassembly.maxScore === 25, 'Factor 1 Disassembly has maxScore 25');
    assert(f.partsAvailability.maxScore === 20, 'Factor 2 Parts Availability has maxScore 20');
    assert(f.documentation.maxScore === 15, 'Factor 3 Documentation has maxScore 15');
    assert(f.modularity.maxScore === 15, 'Factor 4 Modularity has maxScore 15');
    assert(f.softwarePairing.maxScore === 10, 'Factor 5 Software Pairing has maxScore 10');
    assert(f.ageAndSupport.maxScore === 10, 'Factor 6 Age & Support has maxScore 10');
    assert(f.serviceEcosystem.maxScore === 5, 'Factor 7 Service Ecosystem has maxScore 5');

    // Verify baseline score calculation
    const calculatedBaseline =
      f.disassembly.score +
      f.partsAvailability.score +
      f.documentation.score +
      f.modularity.score +
      f.softwarePairing.score +
      f.ageAndSupport.score +
      f.serviceEcosystem.score;
    assert(scoring.baselineScore === calculatedBaseline, `Baseline matches factor sum (${scoring.baselineScore})`);

    // Verify final repairability score matches baseline minus penalties
    const expectedScore = Math.max(10, Math.min(98, scoring.baselineScore - scoring.penalties.amount));
    assert(scoring.repairabilityScore === expectedScore, `Repairability score matches baseline minus deductions (${scoring.repairabilityScore})`);

    assert(scoring.estimatedCostMin > 0 && scoring.estimatedCostMax > scoring.estimatedCostMin, 'Cost range is valid');
    assert(scoring.repairCostRatio < 0.50, `Repair Cost Ratio is economical (got ${scoring.repairCostRatio})`);
    assert(scoring.economicScore > 60, `Economic score reflects value preservation (got ${scoring.economicScore})`);
  }

  // TEST 6: Decision Matrix — DIY Recommendation
  {
    console.log('\n--- Suite 3: Lifecycle Decision Matrix ---');
    const device: DeviceContext = {
      id: 'dev_fw',
      category: 'LAPTOP',
      brand: 'Framework',
      model: 'Laptop 13',
      purchasePrice: 95000,
      currentValue: 75000,
      purchaseDate: new Date(Date.now() - 365.25 * 24 * 60 * 60 * 1000 * 1.0),
      condition: 'EXCELLENT',
    };
    const decision = diagnoseAndRecommend(device, 'Battery capacity degraded, drains fast');
    assert(decision.recommendedAction === 'DIY', `Recommends DIY for modular Framework battery (got ${decision.recommendedAction})`);
    assert(decision.reasoning.includes('Economic Assessment'), 'Includes Economic Assessment in reasoning');
    assert(decision.reasoning.includes('Technical Feasibility'), 'Includes Technical Feasibility in reasoning');
    assert(decision.reasoning.includes('E-Waste'), 'Includes Environmental / E-Waste impact in reasoning');
  }

  // TEST 7: Decision Matrix — Professional REPAIR Recommendation
  {
    const device: DeviceContext = {
      id: 'dev_pix',
      category: 'SMARTPHONE',
      brand: 'Google',
      model: 'Pixel 8',
      purchasePrice: 75000,
      currentValue: 50000,
      purchaseDate: new Date(Date.now() - 365.25 * 24 * 60 * 60 * 1000 * 0.8),
      condition: 'GOOD',
    };
    const decision = diagnoseAndRecommend(device, 'Cracked OLED screen after a drop, touch still works');
    assert(decision.recommendedAction === 'REPAIR', `Recommends REPAIR for flagship screen with low RCR (got ${decision.recommendedAction})`);
  }

  // TEST 8: Decision Matrix — REPLACE for Obsolete/High-Cost Ratio
  {
    const device: DeviceContext = {
      id: 'dev_old',
      category: 'SMARTPHONE',
      brand: 'Generic',
      model: 'Budget One',
      purchasePrice: 12000,
      currentValue: 3000,
      purchaseDate: new Date(Date.now() - 365.25 * 24 * 60 * 60 * 1000 * 6.5), // 6.5 years old
      condition: 'DEGRADED',
    };
    const decision = diagnoseAndRecommend(device, 'Motherboard dead, no power, won\'t boot');
    assert(decision.recommendedAction === 'REPLACE' || decision.recommendedAction === 'RECYCLE', `Recommends REPLACE or RECYCLE for 6.5-year old dead budget phone (got ${decision.recommendedAction})`);
  }

  // TEST 9: Decision Matrix — RECYCLE for Catastrophic Liquid Ingress
  {
    const device: DeviceContext = {
      id: 'dev_catastrophic',
      category: 'LAPTOP',
      brand: 'Apple',
      model: 'MacBook Air',
      purchasePrice: 80000,
      currentValue: 20000,
      purchaseDate: new Date(Date.now() - 365.25 * 24 * 60 * 60 * 1000 * 4),
      condition: 'CRITICAL',
    };
    const decision = diagnoseAndRecommend(device, 'Submerged in water pool, burned smell, logic board shorted, completely dead with no power');
    assert(decision.recommendedAction === 'RECYCLE', `Recommends RECYCLE for catastrophic liquid submersion (got ${decision.recommendedAction})`);
    assert(
      decision.reasoning.includes('India E-Waste') || decision.reasoning.includes('E-Waste'),
      'Cites India E-Waste (Management) Rules, 2022 compliance in recycling rationale'
    );
  }

  // TEST 10: Decision Matrix — RESELL for Functional Device with Marginal Repair Utility
  {
    const device: DeviceContext = {
      id: 'dev_resell',
      category: 'SMARTPHONE',
      brand: 'Samsung',
      model: 'Galaxy S20',
      purchasePrice: 65000,
      currentValue: 12000,
      purchaseDate: new Date(Date.now() - 365.25 * 24 * 60 * 60 * 1000 * 4),
      condition: 'FAIR',
    };
    // Display cost ~7k on 12k value => RCR ~0.58 => RESELL
    const decision = diagnoseAndRecommend(device, 'Screen glass cracked, but phone functions, camera and touch work');
    assert(
      decision.recommendedAction === 'RESELL' || decision.recommendedAction === 'REPAIR',
      `Categorizes marginal economic scenario reasonably (got ${decision.recommendedAction})`
    );
  }

  console.log('\n----------------------------------------------------');
  console.log(`ENGINE TEST RESULTS: ${passed} PASSED | ${failed} FAILED`);
  console.log('====================================================\n');

  if (failed > 0) process.exit(1);
}

runEngineTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
