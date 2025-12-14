/**
 * Carbon Intensity Calculation Engine
 * Implements CI calculations for RED II, RTFO, ISO 14064, ISCC, and RSB methodologies
 */

import type {
  CIMethodology,
  CIDataQuality,
  FeedstockCategory,
  CICalculationResult,
  CIEmissionInput,
} from '@/types/database';

import {
  FOSSIL_FUEL_COMPARATOR,
  CI_RATING_THRESHOLDS,
  COMPLIANCE_THRESHOLDS,
  RED_II_NEW_INSTALLATION_THRESHOLD,
  DEFAULT_EMISSION_FACTORS,
  METHODOLOGY_ADJUSTMENTS,
  DATA_QUALITY_UNCERTAINTY,
  AUSTRALIAN_GRID_FACTORS,
  TRANSPORT_EMISSION_FACTORS,
} from './constants';

// ============================================
// CORE CALCULATION FUNCTIONS
// ============================================

/**
 * Calculate Scope 1 (Direct) emissions total
 */
export function calculateScope1Total(
  cultivation: number,
  processing: number,
  transport: number
): number {
  return cultivation + processing + transport;
}

/**
 * Calculate Scope 2 (Indirect - Energy) emissions total
 */
export function calculateScope2Total(
  electricity: number,
  steamHeat: number
): number {
  return electricity + steamHeat;
}

/**
 * Calculate Scope 3 (Value Chain) emissions total
 */
export function calculateScope3Total(
  upstreamInputs: number,
  landUseChange: number,
  distribution: number,
  endOfLife: number
): number {
  return upstreamInputs + landUseChange + distribution + endOfLife;
}

/**
 * Calculate total CI value from all scopes
 */
export function calculateTotalCI(
  scope1: { cultivation: number; processing: number; transport: number },
  scope2: { electricity: number; steamHeat: number },
  scope3: { upstreamInputs: number; landUseChange: number; distribution: number; endOfLife: number }
): number {
  const scope1Total = calculateScope1Total(scope1.cultivation, scope1.processing, scope1.transport);
  const scope2Total = calculateScope2Total(scope2.electricity, scope2.steamHeat);
  const scope3Total = calculateScope3Total(
    scope3.upstreamInputs,
    scope3.landUseChange,
    scope3.distribution,
    scope3.endOfLife
  );

  return scope1Total + scope2Total + scope3Total;
}

/**
 * Calculate GHG savings percentage against fossil fuel comparator
 * Formula: ((94 - CI) / 94) * 100
 */
export function calculateGHGSavings(ciValue: number): number {
  if (ciValue < 0) {
    // Negative CI means carbon-negative (e.g., with carbon capture)
    return ((FOSSIL_FUEL_COMPARATOR - ciValue) / FOSSIL_FUEL_COMPARATOR) * 100;
  }
  return Math.round(((FOSSIL_FUEL_COMPARATOR - ciValue) / FOSSIL_FUEL_COMPARATOR) * 100 * 100) / 100;
}

/**
 * Get CI rating based on total CI value (A+ to F)
 */
export function getCIRating(ciValue: number): string {
  if (ciValue < CI_RATING_THRESHOLDS['A+']) return 'A+';
  if (ciValue < CI_RATING_THRESHOLDS['A']) return 'A';
  if (ciValue < CI_RATING_THRESHOLDS['B+']) return 'B+';
  if (ciValue < CI_RATING_THRESHOLDS['B']) return 'B';
  if (ciValue < CI_RATING_THRESHOLDS['C+']) return 'C+';
  if (ciValue < CI_RATING_THRESHOLDS['C']) return 'C';
  if (ciValue < CI_RATING_THRESHOLDS['D']) return 'D';
  return 'F';
}

/**
 * Calculate CI score (0-100, higher is better)
 */
export function getCIScore(ciValue: number): number {
  // Score of 100 at 0 gCO2e/MJ, score of 0 at 94+ gCO2e/MJ
  const score = Math.max(0, Math.min(100, ((FOSSIL_FUEL_COMPARATOR - ciValue) / FOSSIL_FUEL_COMPARATOR) * 100));
  return Math.round(score * 10) / 10;
}

// ============================================
// COMPLIANCE CHECKING
// ============================================

/**
 * Check if CI value meets RED II compliance
 */
export function checkREDIICompliance(
  ghgSavings: number,
  isNewInstallation: boolean = false
): boolean {
  const threshold = isNewInstallation ? RED_II_NEW_INSTALLATION_THRESHOLD : COMPLIANCE_THRESHOLDS.RED_II;
  return ghgSavings >= threshold;
}

/**
 * Check if CI value meets RTFO compliance
 */
export function checkRTFOCompliance(ghgSavings: number): boolean {
  return ghgSavings >= COMPLIANCE_THRESHOLDS.RTFO;
}

/**
 * Check compliance for all methodologies
 */
export function checkAllCompliance(
  ghgSavings: number,
  isNewInstallation: boolean = false
): {
  red_ii_compliant: boolean;
  rtfo_compliant: boolean;
  cfp_compliant: boolean;
  iscc_compliant: boolean;
  rsb_compliant: boolean;
} {
  return {
    red_ii_compliant: checkREDIICompliance(ghgSavings, isNewInstallation),
    rtfo_compliant: ghgSavings >= COMPLIANCE_THRESHOLDS.RTFO,
    cfp_compliant: ghgSavings >= 50, // CFP typically uses 50% threshold
    iscc_compliant: ghgSavings >= COMPLIANCE_THRESHOLDS.ISCC,
    rsb_compliant: ghgSavings >= COMPLIANCE_THRESHOLDS.RSB,
  };
}

// ============================================
// DEFAULT VALUE APPLICATION
// ============================================

/**
 * Get default emission factors for a feedstock category
 */
export function getDefaultFactors(category: FeedstockCategory): typeof DEFAULT_EMISSION_FACTORS[FeedstockCategory] {
  return DEFAULT_EMISSION_FACTORS[category] || DEFAULT_EMISSION_FACTORS.other;
}

/**
 * Apply default values where primary data is missing
 */
export function applyDefaultValues(
  input: Partial<CIEmissionInput>,
  category: FeedstockCategory,
  dataQualityLevel: CIDataQuality = 'default'
): CIEmissionInput {
  const defaults = getDefaultFactors(category);
  const uncertaintyFactor = DATA_QUALITY_UNCERTAINTY[dataQualityLevel] || 1.0;

  return {
    scope1_cultivation: input.scope1_cultivation ?? defaults.scope1_cultivation * uncertaintyFactor,
    scope1_processing: input.scope1_processing ?? defaults.scope1_processing * uncertaintyFactor,
    scope1_transport: input.scope1_transport ?? defaults.scope1_transport * uncertaintyFactor,
    scope2_electricity: input.scope2_electricity ?? defaults.scope2_electricity * uncertaintyFactor,
    scope2_steam_heat: input.scope2_steam_heat ?? defaults.scope2_steam_heat * uncertaintyFactor,
    scope3_upstream_inputs: input.scope3_upstream_inputs ?? defaults.scope3_upstream_inputs * uncertaintyFactor,
    scope3_land_use_change: input.scope3_land_use_change ?? defaults.scope3_land_use_change * uncertaintyFactor,
    scope3_distribution: input.scope3_distribution ?? defaults.scope3_distribution * uncertaintyFactor,
    scope3_end_of_life: input.scope3_end_of_life ?? defaults.scope3_end_of_life,
  };
}

// ============================================
// UNCERTAINTY CALCULATIONS
// ============================================

/**
 * Calculate uncertainty range for CI value
 */
export function calculateUncertainty(
  ciValue: number,
  dataQualityLevel: CIDataQuality,
  methodology: CIMethodology
): { low: number; high: number } {
  const dataUncertainty = DATA_QUALITY_UNCERTAINTY[dataQualityLevel] || 1.3;
  const methodologyUncertainty = METHODOLOGY_ADJUSTMENTS[methodology]?.uncertaintyFactor || 1.0;

  const combinedUncertainty = Math.sqrt(
    Math.pow(dataUncertainty - 1, 2) + Math.pow(methodologyUncertainty - 1, 2)
  ) + 1;

  const range = ciValue * (combinedUncertainty - 1);

  return {
    low: Math.max(0, Math.round((ciValue - range) * 100) / 100),
    high: Math.round((ciValue + range) * 100) / 100,
  };
}

// ============================================
// HELPER CALCULATIONS
// ============================================

/**
 * Calculate electricity emissions from kWh and state
 */
export function calculateElectricityEmissions(
  kWh: number,
  outputMJ: number,
  state: string = 'national'
): number {
  const gridFactor = AUSTRALIAN_GRID_FACTORS[state] || AUSTRALIAN_GRID_FACTORS.national;
  // Convert kgCO2e to gCO2e and normalize by output MJ
  return (kWh * gridFactor * 1000) / outputMJ;
}

/**
 * Calculate transport emissions from distance and mode
 */
export function calculateTransportEmissions(
  tonnes: number,
  distanceKm: number,
  outputMJ: number,
  mode: keyof typeof TRANSPORT_EMISSION_FACTORS = 'road_truck'
): number {
  const factor = TRANSPORT_EMISSION_FACTORS[mode];
  // gCO2e/tonne-km * tonnes * km = gCO2e, then normalize by output MJ
  return (factor * tonnes * distanceKm) / outputMJ;
}

// ============================================
// MAIN CALCULATION FUNCTION
// ============================================

/**
 * Perform full CI calculation and return comprehensive results
 */
export function calculateCIReport(
  input: CIEmissionInput,
  methodology: CIMethodology,
  dataQualityLevel: CIDataQuality = 'primary_measured',
  isNewInstallation: boolean = false
): CICalculationResult {
  // Calculate scope totals
  const scope1_total = calculateScope1Total(
    input.scope1_cultivation,
    input.scope1_processing,
    input.scope1_transport
  );

  const scope2_total = calculateScope2Total(
    input.scope2_electricity,
    input.scope2_steam_heat
  );

  const scope3_total = calculateScope3Total(
    input.scope3_upstream_inputs,
    input.scope3_land_use_change,
    input.scope3_distribution,
    input.scope3_end_of_life
  );

  // Calculate total CI
  const total_ci_value = scope1_total + scope2_total + scope3_total;

  // Calculate GHG savings
  const ghg_savings_percentage = calculateGHGSavings(total_ci_value);

  // Get rating and score
  const ci_rating = getCIRating(total_ci_value);
  const ci_score = getCIScore(total_ci_value);

  // Check compliance
  const compliance = checkAllCompliance(ghg_savings_percentage, isNewInstallation);

  // Calculate uncertainty
  const uncertainty = calculateUncertainty(total_ci_value, dataQualityLevel, methodology);

  return {
    // Scope totals
    scope1_total: Math.round(scope1_total * 100) / 100,
    scope2_total: Math.round(scope2_total * 100) / 100,
    scope3_total: Math.round(scope3_total * 100) / 100,

    // Total and metrics
    total_ci_value: Math.round(total_ci_value * 100) / 100,
    ghg_savings_percentage,
    ci_rating,
    ci_score,

    // Compliance flags
    ...compliance,

    // Uncertainty range
    uncertainty_range_low: uncertainty.low,
    uncertainty_range_high: uncertainty.high,
  };
}

/**
 * Calculate CI from partial input with defaults applied
 */
export function calculateCIWithDefaults(
  partialInput: Partial<CIEmissionInput>,
  category: FeedstockCategory,
  methodology: CIMethodology,
  dataQualityLevel: CIDataQuality = 'default',
  isNewInstallation: boolean = false
): CICalculationResult {
  const fullInput = applyDefaultValues(partialInput, category, dataQualityLevel);
  return calculateCIReport(fullInput, methodology, dataQualityLevel, isNewInstallation);
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Format CI value for display
 */
export function formatCIValue(ciValue: number): string {
  return `${ciValue.toFixed(2)} gCO2e/MJ`;
}

/**
 * Format GHG savings for display
 */
export function formatGHGSavings(savings: number): string {
  return `${savings.toFixed(1)}%`;
}

/**
 * Get compliance status text
 */
export function getComplianceStatus(compliant: boolean): string {
  return compliant ? 'Compliant' : 'Non-Compliant';
}

/**
 * Get rating color class for UI display
 */
export function getRatingColorClass(rating: string): string {
  switch (rating) {
    case 'A+':
    case 'A':
      return 'text-green-600 bg-green-50';
    case 'B+':
    case 'B':
      return 'text-blue-600 bg-blue-50';
    case 'C+':
    case 'C':
      return 'text-yellow-600 bg-yellow-50';
    case 'D':
      return 'text-orange-600 bg-orange-50';
    case 'F':
      return 'text-red-600 bg-red-50';
    default:
      return 'text-gray-600 bg-gray-50';
  }
}

/**
 * Validate CI emission input values
 */
export function validateCIInput(input: CIEmissionInput): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check for negative values (except end_of_life which can be negative for credits)
  if (input.scope1_cultivation < 0) errors.push('Scope 1 cultivation cannot be negative');
  if (input.scope1_processing < 0) errors.push('Scope 1 processing cannot be negative');
  if (input.scope1_transport < 0) errors.push('Scope 1 transport cannot be negative');
  if (input.scope2_electricity < 0) errors.push('Scope 2 electricity cannot be negative');
  if (input.scope2_steam_heat < 0) errors.push('Scope 2 steam/heat cannot be negative');
  if (input.scope3_upstream_inputs < 0) errors.push('Scope 3 upstream inputs cannot be negative');
  if (input.scope3_land_use_change < 0) errors.push('Scope 3 land use change cannot be negative');
  if (input.scope3_distribution < 0) errors.push('Scope 3 distribution cannot be negative');

  // Check for unreasonably high values
  const emissionValues = [
    input.scope1_cultivation,
    input.scope1_processing,
    input.scope1_transport,
    input.scope2_electricity,
    input.scope2_steam_heat,
    input.scope3_upstream_inputs,
    input.scope3_land_use_change,
    input.scope3_distribution,
    input.scope3_end_of_life,
  ];
  const total = emissionValues.reduce((sum, val) => sum + Math.abs(val), 0);
  if (total > 200) {
    errors.push('Total emissions seem unusually high. Please verify input values.');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
