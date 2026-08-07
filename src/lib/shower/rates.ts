import type { RateTable } from './types';

// Default market rates (DFW), seeded from the Eagles Glass catalog + typical
// frameless-shower pricing. Every value is editable per shop in Settings.
export const DEFAULT_SHOWER_RATES: RateTable = {
  glassPerSqft: {
    '3/8"': { clear: 22, 'low-iron': 30, frosted: 28, tinted: 26 },
    '1/2"': { clear: 28, 'low-iron': 38, frosted: 35, tinted: 32 },
  },
  hardware: {
    hinge: 85,
    handle: 130,
    connector: 40,
    slidingKit: 480,
    headerPerFt: 14,
    towelBar: 65,
  },
  fabrication: {
    handleHole: 15,
    hingeCutout: 20,
    notch: 25,
  },
  labor: {
    installBase: 300,
    installPerSqft: 6,
  },
  finishUpchargePct: {
    chrome: 0,
    'brushed-nickel': 0,
    'matte-black': 15,
    'oil-rubbed-bronze': 15,
    brass: 20,
  },
};
