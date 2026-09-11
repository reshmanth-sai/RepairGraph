import { Device, RepairJob, RepairPassportEntry, RecentActivity } from './types';

export const MOCK_DEVICES: Device[] = [
  {
    id: 'dev-thinkpad-t14',
    brand: 'Lenovo',
    model: 'ThinkPad T14 Gen 3',
    modelCode: '21AH002XUS',
    category: 'laptop',
    serialNumber: 'PF-3B79K2',
    purchaseDate: '2023-04-12',
    purchasePriceINR: 98000,
    fairMarketValueINR: 56000,
    condition: 'fair',
    warrantyStatus: 'expired',
    warrantyExpiry: '2024-04-12',
    repairStatus: 'in_repair',
    lastActivityDate: '2026-09-10',
    repairabilityScore: 82,
    repairabilityDetail: {
      overallScore: 82,
      grade: 'Good',
      summary: 'High modularity with standard Philips screws, socketed SO-DIMM and M.2 NVMe slots. Official Lenovo Hardware Maintenance Manuals publicly available under India Right to Repair portal.',
      factors: [
        { name: 'Physical Disassembly', score: 22, maxScore: 25, weight: 25, benchmark: 'Non-glued base panel, standard screws', notes: 'Retained captive screws on bottom chassis, straightforward clip release.' },
        { name: 'Parts Availability', score: 18, maxScore: 20, weight: 20, benchmark: 'OEM FRU parts catalog publicly listed', notes: 'FRU 5B10W13930 battery and thermal modules stocked by regional distributors.' },
        { name: 'Documentation & Manuals', score: 14, maxScore: 15, weight: 15, benchmark: 'Official schematics and teardown PDF', notes: 'Lenovo HMM freely downloadable with exploded diagram views.' },
        { name: 'Repair Complexity', score: 12, maxScore: 15, weight: 15, benchmark: 'Modular sub-assemblies', notes: 'Cooling fan assembly separable from heat pipe without board extraction.' },
        { name: 'Parts Pairing & Locks', score: 9, maxScore: 10, weight: 10, benchmark: 'No cryptographic serialization', notes: 'No motherboard locking on swapped battery or SSD units.' },
        { name: 'Local Service Ecosystem', score: 7, maxScore: 15, weight: 15, benchmark: 'Authorized & verified independent repairers', notes: 'Dense independent repairer network across Tier-1/2 Indian hubs.' },
      ]
    },
    specs: {
      'Processor': 'Intel Core i7-1260P (12 cores)',
      'Memory': '16 GB DDR4 (Upgradable)',
      'Storage': '512 GB PCIe 4.0 NVMe',
      'Display': '14.0" WUXGA (1920 x 1200) IPS Anti-glare',
      'Chassis': 'Magnesium bottom, CFRP hybrid top'
    },
    activeIssue: {
      id: 'iss-lenovo-01',
      title: 'Thermal Throttling & Bearing Noise',
      reportedAt: '2026-09-08',
      category: 'thermal',
      severity: 'moderate',
      symptoms: ['High fan RPM at idle', 'Thermal shutdown above 85°C', 'Dry bearing whirring noise'],
      diagnosticConfidence: 0.91,
      estimatedCostMinINR: 3200,
      estimatedCostMaxINR: 4500,
      recommendedAction: 'repair',
      recommendationReasoning: 'Repair cost represents 6.8% of current fair market value. Thermal module and Delta fan replacement extends operational life by 24+ months.',
      activeJobId: 'job-rg-1092'
    }
  },
  {
    id: 'dev-macbook-air-m2',
    brand: 'Apple',
    model: 'MacBook Air 13″ (M2)',
    modelCode: 'MLY33HN/A',
    category: 'laptop',
    serialNumber: 'C02G879MD6NV',
    purchaseDate: '2023-08-19',
    purchasePriceINR: 114900,
    fairMarketValueINR: 72000,
    condition: 'degraded',
    warrantyStatus: 'expired',
    warrantyExpiry: '2024-08-19',
    repairStatus: 'issue_reported',
    lastActivityDate: '2026-09-09',
    repairabilityScore: 58,
    repairabilityDetail: {
      overallScore: 58,
      grade: 'Fair',
      summary: 'Integrated SoC with soldered Unified Memory and NAND storage. Battery module secured with stretch-release adhesive tabs. Battery replacement requires specialized Pentalobe P5 drivers.',
      factors: [
        { name: 'Physical Disassembly', score: 14, maxScore: 25, weight: 25, benchmark: 'Pentalobe P5 screws, tight tolerances', notes: 'Requires specialized driver and battery pull-tab precision.' },
        { name: 'Parts Availability', score: 12, maxScore: 20, weight: 20, benchmark: 'Self Service Repair catalog', notes: 'OEM battery packs available through authorized channels; third-party cells require BMS swap.' },
        { name: 'Documentation & Manuals', score: 11, maxScore: 15, weight: 15, benchmark: 'Official Apple Repair Manual', notes: 'Detailed official guide published under Apple Self Service Repair.' },
        { name: 'Repair Complexity', score: 8, maxScore: 15, weight: 15, benchmark: 'Adhesive-backed battery cells', notes: 'High care required during battery extraction to avoid cell puncture.' },
        { name: 'Parts Pairing & Locks', score: 5, maxScore: 10, weight: 10, benchmark: 'System Configuration software calibration', notes: 'Battery serial warning clears upon official cloud configuration.' },
        { name: 'Local Service Ecosystem', score: 8, maxScore: 15, weight: 15, benchmark: 'Widespread metro technician presence', notes: 'High density of specialized Apple technicians in major metro centers.' },
      ]
    },
    specs: {
      'Chipset': 'Apple M2 (8-core CPU, 8-core GPU)',
      'Memory': '8 GB Unified Memory (Soldered)',
      'Storage': '256 GB SSD (Soldered)',
      'Display': '13.6" Liquid Retina Display',
      'Battery': '52.6 Wh Lithium-polymer'
    },
    activeIssue: {
      id: 'iss-mac-02',
      title: 'Battery Swelling & Rapid Drain',
      reportedAt: '2026-09-09',
      category: 'battery',
      severity: 'high',
      symptoms: ['Slight trackpad elevation', 'Battery drops from 40% to shut-off', 'Cycle count: 812'],
      diagnosticConfidence: 0.88,
      estimatedCostMinINR: 7500,
      estimatedCostMaxINR: 11200,
      recommendedAction: 'repair',
      recommendationReasoning: 'Battery replacement estimated at ₹8,900 (12.3% of ₹72,000 device value). Replacement saves ₹63,100 versus acquiring a replacement M3/M4 tier system.',
      activeJobId: undefined
    }
  },
  {
    id: 'dev-pixel-7-pro',
    brand: 'Google',
    model: 'Pixel 7 Pro',
    modelCode: 'GE2AE',
    category: 'smartphone',
    serialNumber: '28191FDH30018G',
    purchaseDate: '2023-01-15',
    purchasePriceINR: 84999,
    fairMarketValueINR: 34000,
    condition: 'good',
    warrantyStatus: 'expired',
    warrantyExpiry: '2024-01-15',
    repairStatus: 'repaired',
    lastActivityDate: '2026-03-14',
    repairabilityScore: 74,
    repairabilityDetail: {
      overallScore: 74,
      grade: 'Good',
      summary: 'Front-entry OLED display panel facilitates screen repairs without disassembling entire internal stack. Google iFixit partnership provides genuine OEM parts and calibration software.',
      factors: [
        { name: 'Physical Disassembly', score: 19, maxScore: 25, weight: 25, benchmark: 'Front-facing screen separation', notes: 'Screen heats and lifts from front, allowing direct sub-board access.' },
        { name: 'Parts Availability', score: 17, maxScore: 20, weight: 20, benchmark: 'Genuine Google OEM distribution', notes: 'Official display, battery, and camera modules available.' },
        { name: 'Documentation & Manuals', score: 13, maxScore: 15, weight: 15, benchmark: 'Step-by-step guides published', notes: 'Comprehensive manuals with torque specifications.' },
        { name: 'Repair Complexity', score: 11, maxScore: 15, weight: 15, benchmark: 'Display adhesive cutting', notes: 'Moderate complexity; requires suction handle and isopropanol.' },
        { name: 'Parts Pairing & Locks', score: 8, maxScore: 10, weight: 10, benchmark: 'Public Fingerprint Calibration Tool', notes: 'Web-based optical fingerprint sensor calibration accessible via Chrome.' },
        { name: 'Local Service Ecosystem', score: 6, maxScore: 15, weight: 15, benchmark: 'Authorized F1 Info Solutions hubs', notes: 'Expanding walk-in authorized support network in Tier-1 cities.' },
      ]
    },
    specs: {
      'Processor': 'Google Tensor G2',
      'Display': '6.7" QHD+ LTPO OLED 120Hz',
      'Cameras': '50MP Wide + 12MP Ultra-wide + 48MP 5x Telephoto',
      'Battery': '5000 mAh with 30W Fast Charging'
    }
  },
  {
    id: 'dev-sony-wh1000xm5',
    brand: 'Sony',
    model: 'WH-1000XM5 Noise Canceling',
    modelCode: 'WH1000XM5/B',
    category: 'audio',
    serialNumber: '5082194',
    purchaseDate: '2024-11-05',
    purchasePriceINR: 29990,
    fairMarketValueINR: 22000,
    condition: 'excellent',
    warrantyStatus: 'active',
    warrantyExpiry: '2026-11-05',
    repairStatus: 'none',
    lastActivityDate: '2026-08-20',
    repairabilityScore: 61,
    repairabilityDetail: {
      overallScore: 61,
      grade: 'Fair',
      summary: 'Ear-pads click off easily without adhesive. Headband hinge redesign reduces stress fractures, but internal driver wiring is delicate and soldered directly to the ANC processing board.',
      factors: [
        { name: 'Physical Disassembly', score: 16, maxScore: 25, weight: 25, benchmark: 'Clip-on ear cushions', notes: 'Earpads twist and unclip; internal driver cup secured with 4 Phillips screws.' },
        { name: 'Parts Availability', score: 11, maxScore: 20, weight: 20, benchmark: 'Sony authorized parts depot', notes: 'Replacement cushions and battery modules stocked; individual drivers rare.' },
        { name: 'Documentation & Manuals', score: 8, maxScore: 15, weight: 15, benchmark: 'Authorized service manual only', notes: 'No consumer-facing official teardown documentation.' },
        { name: 'Repair Complexity', score: 10, maxScore: 15, weight: 15, benchmark: 'Micro-soldering required for drivers', notes: 'Battery swap straightforward via JST connector in right ear cup.' },
        { name: 'Parts Pairing & Locks', score: 10, maxScore: 10, weight: 10, benchmark: 'Zero digital locking', notes: 'Standard 3.7V Li-ion battery cell with zero crypto validation.' },
        { name: 'Local Service Ecosystem', score: 6, maxScore: 15, weight: 15, benchmark: 'Sony Service Center network', notes: 'Accessible across all major metro centers in India.' },
      ]
    },
    specs: {
      'Driver Unit': '30mm, Dome type (CCAW Voice coil)',
      'Noise Canceling': 'Dual Processors (V1 + QN1) with 8 Microphones',
      'Battery Life': 'Up to 30 hours (NC ON)',
      'Weight': 'Approx. 250g'
    }
  }
];

export const MOCK_ACTIVE_JOB: RepairJob = {
  id: 'job-rg-1092',
  deviceId: 'dev-thinkpad-t14',
  deviceModel: 'Lenovo ThinkPad T14 Gen 3',
  issueTitle: 'Thermal Throttling & Bearing Noise Overhaul',
  status: 'TESTING',
  technician: {
    name: 'Vikram Joshi',
    businessName: 'Precision Silicon Labs',
    tier: 'verified_independent',
    rating: 4.88,
    completedJobsCount: 342,
    location: 'Indiranagar, Bengaluru',
    distanceKm: 2.4
  },
  estimatedCostINR: 3800,
  agreedCostINR: 3800,
  warrantyMonths: 6,
  createdAt: '2026-09-09T10:30:00Z',
  estimatedCompletion: '2026-09-12T17:00:00Z',
  timeline: [
    { stage: 'REQUESTED', label: 'Request Submitted', timestamp: 'Sep 08, 14:20', note: 'Customer reported unexpected shutdown and loud fan rattle during compute loads.', completed: true, current: false },
    { stage: 'ACCEPTED', label: 'Quote Accepted', timestamp: 'Sep 08, 18:45', note: 'Quote ₹3,800 accepted (includes genuine Delta fan + Arctic MX-6 paste + 6 mo. warranty).', completed: true, current: false },
    { stage: 'DIAGNOSING', label: 'Physical Bench Inspection', timestamp: 'Sep 09, 11:15', note: 'Confirmed dry fan bearing and degraded factory thermal paste with 94°C junction spike.', completed: true, current: false },
    { stage: 'WAITING_FOR_PART', label: 'OEM Part Received', timestamp: 'Sep 10, 09:30', note: 'Delta Electronics FRU 5H41B77239 fan module verified OEM genuine.', completed: true, current: false },
    { stage: 'REPAIRING', label: 'Module Installation', timestamp: 'Sep 10, 16:00', note: 'Heatsink cleaned with 99% IPA, MX-6 compound applied, fan mounted at 0.35 Nm torque.', completed: true, current: false },
    { stage: 'TESTING', label: 'Thermal Stress Testing', timestamp: 'Sep 11, 14:00', note: 'Running Prime95 + FurMark 60-minute loop. Temps stable at 68°C peak under sustained load.', completed: false, current: true },
    { stage: 'COMPLETED', label: 'Ready for Collection', timestamp: undefined, note: 'Diagnostic report and Repair Passport cryptographic verification stamp generated upon completion.', completed: false, current: false },
  ],
  partsUsed: [
    { partName: 'Delta Blower Fan Module (FRU 5H41B77239)', partNumber: '5H41B77239', grade: 'OEM Genuine', costINR: 2400 },
    { partName: 'Arctic MX-6 High-Viscosity Thermal Paste (0.8g application)', partNumber: 'ACTCP00079A', grade: 'OES Certified', costINR: 400 }
  ]
};

export const MOCK_PASSPORT_ENTRIES: RepairPassportEntry[] = [
  {
    id: 'pass-px7p-01',
    deviceId: 'dev-pixel-7-pro',
    date: '2026-03-14',
    serviceType: 'Display Assembly Replacement',
    serviceProvider: 'F1 Info Solutions (Authorized Google Service Partner)',
    providerTier: 'authorized',
    costINR: 14500,
    partsReplaced: ['Google Pixel 7 Pro 120Hz LTPO OLED Display Sub-assembly (Part #G949-00128-01)'],
    serviceReference: 'SR-F1-2026-09418',
    diagnosticOutcome: 'Complete touch and LTPO refresh rate pass; optical fingerprint sensor calibrated using official service suite.',
    conditionAfterService: 'good'
  },
  {
    id: 'pass-tp-01',
    deviceId: 'dev-thinkpad-t14',
    date: '2025-06-22',
    serviceType: 'Keyboard Module Replacement',
    serviceProvider: 'Precision Silicon Labs',
    providerTier: 'verified_independent',
    costINR: 2800,
    partsReplaced: ['Lenovo Backlit English US Keyboard FRU 5N21D67912'],
    serviceReference: 'SR-PSL-2025-0412',
    diagnosticOutcome: 'All 84 keys verified via keyboard matrix tester. Spill protection membrane intact.',
    conditionAfterService: 'good'
  }
];

export const MOCK_RECENT_ACTIVITIES: RecentActivity[] = [
  {
    id: 'act-01',
    type: 'job_status_updated',
    timestamp: 'Today, 14:00',
    title: 'Thermal stress test initiated',
    description: 'Vikram Joshi started 60-minute sustained load benchmark for ThinkPad T14 Gen 3.',
    jobId: 'job-rg-1092'
  },
  {
    id: 'act-02',
    type: 'diagnostic_run',
    timestamp: 'Yesterday, 17:35',
    title: 'Battery evaluation completed',
    description: 'MacBook Air 13″ evaluation generated: Component repair recommended (₹8,900 estimated benchmark).',
    deviceId: 'dev-macbook-air-m2'
  },
  {
    id: 'act-03',
    type: 'job_status_updated',
    timestamp: 'Sep 10, 16:00',
    title: 'OEM fan module installed',
    description: 'Delta Electronics FRU mounted and thermal compound replaced.',
    jobId: 'job-rg-1092'
  },
  {
    id: 'act-04',
    type: 'quote_received',
    timestamp: 'Sep 08, 18:30',
    title: 'Repair quote accepted',
    description: 'Precision Silicon Labs agreed to ₹3,800 with 6-month repair warranty.',
    jobId: 'job-rg-1092'
  },
  {
    id: 'act-05',
    type: 'passport_stamped',
    timestamp: 'Mar 14, 2026',
    title: 'Service record logged',
    description: 'Display replacement verified for Google Pixel 7 Pro (F1 Info Solutions).',
    deviceId: 'dev-pixel-7-pro'
  }
];
