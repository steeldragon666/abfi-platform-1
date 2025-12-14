/**
 * Carbon Intensity Constants and Default Emission Factors
 * Based on RED II, RTFO, ISO 14064, ISCC, and RSB methodologies
 */

import type { CIMethodology, FeedstockCategory } from '@/types/database';

// Fossil fuel comparator for GHG savings calculation (gCO2e/MJ)
export const FOSSIL_FUEL_COMPARATOR = 94;

// CI Rating thresholds (gCO2e/MJ)
export const CI_RATING_THRESHOLDS = {
  'A+': 10,
  'A': 20,
  'B+': 30,
  'B': 40,
  'C+': 50,
  'C': 60,
  'D': 70,
  // F: >= 70
} as const;

// Minimum GHG savings requirements by methodology (%)
export const COMPLIANCE_THRESHOLDS: Record<CIMethodology, number> = {
  RED_II: 50,      // 50% for existing installations, 65% for new (post-2021)
  RTFO: 50,        // 50% minimum
  ISO_14064: 0,    // No minimum (reporting standard)
  ISCC: 50,        // 50% minimum
  RSB: 50,         // 50% minimum
};

// New installation threshold for RED II (post Jan 2021)
export const RED_II_NEW_INSTALLATION_THRESHOLD = 65;

// Default emission factors by feedstock category (gCO2e/MJ)
// These are industry average values when primary data is not available
export interface DefaultEmissionFactors {
  scope1_cultivation: number;
  scope1_processing: number;
  scope1_transport: number;
  scope2_electricity: number;
  scope2_steam_heat: number;
  scope3_upstream_inputs: number;
  scope3_land_use_change: number;
  scope3_distribution: number;
  scope3_end_of_life: number;
}

// FeedstockCategory values: 'oilseed' | 'UCO' | 'tallow' | 'lignocellulosic' | 'waste' | 'algae' | 'bamboo' | 'other'
export const DEFAULT_EMISSION_FACTORS: Record<FeedstockCategory, DefaultEmissionFactors> = {
  // Oilseed - Moderate emissions (canola, soybean, etc.)
  oilseed: {
    scope1_cultivation: 12.5,     // Farming, fertilizers
    scope1_processing: 5.8,       // Crushing, refining
    scope1_transport: 2.3,        // Farm to processor
    scope2_electricity: 3.2,      // Processing electricity
    scope2_steam_heat: 2.1,       // Refining heat
    scope3_upstream_inputs: 4.5,  // Seeds, fertilizers, pesticides
    scope3_land_use_change: 8.0,  // Potential LUC (varies greatly)
    scope3_distribution: 2.5,     // Distribution
    scope3_end_of_life: 0,        // Biogenic
  },

  // UCO (Used Cooking Oil) - Very low emissions, waste product
  UCO: {
    scope1_cultivation: 0,        // Waste product, no cultivation
    scope1_processing: 3.5,       // Collection and pre-processing
    scope1_transport: 1.2,        // Transport to processor
    scope2_electricity: 1.8,      // Processing electricity
    scope2_steam_heat: 0.5,       // Minimal heat required
    scope3_upstream_inputs: 0.3,  // Processing chemicals
    scope3_land_use_change: 0,    // No LUC for waste
    scope3_distribution: 1.5,     // Distribution to end user
    scope3_end_of_life: 0,        // Biogenic carbon
  },

  // Tallow (Animal Fats) - Low emissions, byproduct
  tallow: {
    scope1_cultivation: 0,        // Byproduct of meat industry
    scope1_processing: 4.2,       // Rendering and processing
    scope1_transport: 1.5,        // Transport
    scope2_electricity: 2.1,      // Processing electricity
    scope2_steam_heat: 1.2,       // Steam for rendering
    scope3_upstream_inputs: 0.5,  // Processing inputs
    scope3_land_use_change: 0,    // No direct LUC
    scope3_distribution: 1.8,     // Distribution
    scope3_end_of_life: 0,        // Biogenic
  },

  // Lignocellulosic (Crop/Forestry Residues, Wood) - Low emissions
  lignocellulosic: {
    scope1_cultivation: 1.8,      // Collection only
    scope1_processing: 4.0,       // Baling, chipping, processing
    scope1_transport: 2.8,        // Transport from field/forest
    scope2_electricity: 1.8,      // Processing electricity
    scope2_steam_heat: 0.9,       // Minimal heat
    scope3_upstream_inputs: 1.4,  // Collection equipment fuel
    scope3_land_use_change: 0,    // No LUC for residues
    scope3_distribution: 2.0,     // Distribution
    scope3_end_of_life: 0,        // Biogenic
  },

  // Waste (Municipal/Industrial) - Low emissions, waste diversion
  waste: {
    scope1_cultivation: 0,        // Waste product
    scope1_processing: 6.8,       // Sorting, processing
    scope1_transport: 2.3,        // Collection
    scope2_electricity: 3.3,      // Processing electricity
    scope2_steam_heat: 1.8,       // Processing heat
    scope3_upstream_inputs: 0.9,  // Processing chemicals
    scope3_land_use_change: 0,    // No LUC
    scope3_distribution: 1.9,     // Distribution
    scope3_end_of_life: -3.0,     // Credit for avoided landfill
  },

  // Algae - Variable, generally moderate
  algae: {
    scope1_cultivation: 8.0,      // Pond/reactor operation
    scope1_processing: 7.5,       // Harvesting, drying, extraction
    scope1_transport: 1.0,        // Usually co-located
    scope2_electricity: 12.0,     // High electricity for cultivation
    scope2_steam_heat: 3.0,       // Drying
    scope3_upstream_inputs: 5.0,  // Nutrients, CO2
    scope3_land_use_change: 0,    // No LUC
    scope3_distribution: 1.5,     // Distribution
    scope3_end_of_life: 0,        // Biogenic
  },

  // Bamboo - Low to moderate emissions
  bamboo: {
    scope1_cultivation: 3.5,      // Minimal inputs, fast growing
    scope1_processing: 5.0,       // Processing
    scope1_transport: 2.5,        // Transport
    scope2_electricity: 2.8,      // Processing electricity
    scope2_steam_heat: 1.5,       // Processing heat
    scope3_upstream_inputs: 1.5,  // Minimal inputs
    scope3_land_use_change: 2.0,  // Can be grown on degraded land
    scope3_distribution: 2.0,     // Distribution
    scope3_end_of_life: 0,        // Biogenic
  },

  // Other - Conservative defaults
  other: {
    scope1_cultivation: 10.0,
    scope1_processing: 6.0,
    scope1_transport: 2.5,
    scope2_electricity: 3.5,
    scope2_steam_heat: 2.0,
    scope3_upstream_inputs: 4.0,
    scope3_land_use_change: 5.0,
    scope3_distribution: 2.5,
    scope3_end_of_life: 0,
  },
};

// Australian electricity grid emission factors by state (kgCO2e/kWh)
export const AUSTRALIAN_GRID_FACTORS: Record<string, number> = {
  NSW: 0.79,
  VIC: 0.96,
  QLD: 0.81,
  SA: 0.35,
  WA: 0.69,
  TAS: 0.15,
  NT: 0.64,
  ACT: 0.79,  // Uses NSW grid
  national: 0.79,
};

// Transport emission factors by mode (gCO2e/tonne-km)
export const TRANSPORT_EMISSION_FACTORS = {
  road_truck: 62,           // Heavy goods vehicle
  road_light: 150,          // Light commercial vehicle
  rail_diesel: 22,          // Diesel rail freight
  rail_electric: 8,         // Electric rail (varies by grid)
  ship_coastal: 16,         // Coastal shipping
  ship_international: 8,    // International shipping
  barge: 31,                // Inland waterway
  pipeline: 5,              // Pipeline transport
} as const;

// Fertilizer emission factors (kgCO2e/kg)
export const FERTILIZER_EMISSION_FACTORS = {
  nitrogen_synthetic: 5.9,   // Synthetic N fertilizer
  nitrogen_organic: 0.5,     // Organic N source
  phosphorus: 1.0,           // P fertilizer
  potassium: 0.5,            // K fertilizer
  lime: 0.44,                // Agricultural lime
} as const;

// Processing energy factors
export const PROCESSING_ENERGY_FACTORS = {
  // MJ electricity per MJ feedstock output
  uco_processing: 0.02,
  animal_fat_rendering: 0.04,
  vegetable_oil_extraction: 0.05,
  vegetable_oil_refining: 0.03,
  biomass_pelletizing: 0.08,
  anaerobic_digestion: 0.10,
  pyrolysis: 0.15,
  gasification: 0.20,
} as const;

// Methodology-specific adjustments
export const METHODOLOGY_ADJUSTMENTS: Record<CIMethodology, {
  includesIndirectLUC: boolean;
  allocationMethod: string;
  uncertaintyFactor: number;
}> = {
  RED_II: {
    includesIndirectLUC: true,
    allocationMethod: 'energy',
    uncertaintyFactor: 1.0,
  },
  RTFO: {
    includesIndirectLUC: true,
    allocationMethod: 'energy',
    uncertaintyFactor: 1.0,
  },
  ISO_14064: {
    includesIndirectLUC: false,
    allocationMethod: 'mass',
    uncertaintyFactor: 1.1,
  },
  ISCC: {
    includesIndirectLUC: true,
    allocationMethod: 'energy',
    uncertaintyFactor: 1.0,
  },
  RSB: {
    includesIndirectLUC: true,
    allocationMethod: 'energy',
    uncertaintyFactor: 1.05,
  },
};

// Verification level descriptions
export const VERIFICATION_LEVELS = {
  self_declared: {
    label: 'Self-Declared',
    description: 'Values declared by the supplier without third-party verification',
    uncertaintyMultiplier: 1.2,
  },
  document_verified: {
    label: 'Document Verified',
    description: 'Supporting documentation reviewed by ABFI',
    uncertaintyMultiplier: 1.1,
  },
  third_party_audited: {
    label: 'Third-Party Audited',
    description: 'Independently audited by accredited third party',
    uncertaintyMultiplier: 1.05,
  },
  abfi_certified: {
    label: 'ABFI Certified',
    description: 'Full certification through ABFI verification process',
    uncertaintyMultiplier: 1.0,
  },
} as const;

// Data quality levels with uncertainty factors
export const DATA_QUALITY_UNCERTAINTY: Record<string, number> = {
  default: 1.3,           // Using default values
  industry_average: 1.15, // Using industry average data
  primary_measured: 1.0,  // Using primary measured data
};
