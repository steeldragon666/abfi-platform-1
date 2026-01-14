/**
 * ABFI Bankability Scoring Engine
 *
 * Calculates bankability scores for bioenergy projects based on:
 * 1. Volume Security (30%)
 * 2. Counterparty Quality (25%)
 * 3. Contract Structure (20%)
 * 4. Concentration Risk (15%)
 * 5. Operational Readiness (10%)
 */

// ============================================================================
// TYPES
// ============================================================================

export interface SupplyPosition {
  nameplateCapacity: number;
  tier1Volume: number;
  tier2Volume: number;
  optionsVolume: number;
  rofrVolume: number;
  debtTenor: number; // years
  agreements: AgreementForScoring[];
}

export interface AgreementForScoring {
  tier: "tier1" | "tier2" | "option" | "rofr";
  annualVolume: number;
  termYears: number;
  pricingMechanism: string;
  lenderStepInRights: boolean;
  earlyTerminationNoticeDays: number;
  lenderConsentRequired: boolean;
  forceMajeureVolumeReductionCap: number | null;
  growerQualification: number; // 1-4 (GQ1-GQ4)
  bankGuaranteePercent: number | null;
  supplierId: number;
}

export interface ConcentrationData {
  supplierVolumes: Map<number, number>; // supplierId -> volume
  totalVolume: number;
  climateZones: number;
  largestSupplierVolume: number;
}

export interface OperationalData {
  logisticsContracted: boolean;
  logisticsTested: boolean;
  qaSystemStatus: "operational" | "implementation" | "designed" | "planning";
  abfiIntegration: "full" | "partial" | "manual" | "none";
  contingencyPlans: "comprehensive" | "basic" | "limited" | "none";
}

export interface BankabilityScores {
  volumeSecurity: number;
  counterpartyQuality: number;
  contractStructure: number;
  concentrationRisk: number;
  operationalReadiness: number;
  composite: number;
  rating: "AAA" | "AA" | "A" | "BBB" | "BB" | "B" | "CCC";
  ratingDescription: string;
}

// ============================================================================
// CATEGORY 1: VOLUME SECURITY (30%)
// ============================================================================

export function calculateVolumeSecurityScore(position: SupplyPosition): number {
  const {
    nameplateCapacity,
    tier1Volume,
    tier2Volume,
    optionsVolume,
    rofrVolume,
    debtTenor,
    agreements,
  } = position;

  // Primary coverage (Tier 1 + Tier 2)
  const primaryVolume = tier1Volume + tier2Volume;
  const primaryPercent = (primaryVolume / nameplateCapacity) * 100;

  let primaryScore = 0;
  if (primaryPercent >= 125) primaryScore = 100;
  else if (primaryPercent >= 120) primaryScore = 90;
  else if (primaryPercent >= 115) primaryScore = 75;
  else if (primaryPercent >= 110) primaryScore = 60;
  else if (primaryPercent >= 105) primaryScore = 40;
  else if (primaryPercent >= 100) primaryScore = 20;
  else primaryScore = 0;

  // Secondary coverage (Options + ROFR)
  const secondaryVolume = optionsVolume + rofrVolume;
  const secondaryPercent = (secondaryVolume / nameplateCapacity) * 100;

  let secondaryScore = 0;
  if (secondaryPercent >= 35) secondaryScore = 100;
  else if (secondaryPercent >= 30) secondaryScore = 90;
  else if (secondaryPercent >= 25) secondaryScore = 75;
  else if (secondaryPercent >= 20) secondaryScore = 60;
  else if (secondaryPercent >= 15) secondaryScore = 40;
  else if (secondaryPercent >= 10) secondaryScore = 20;
  else secondaryScore = 0;

  // Contract term alignment
  const weightedAvgTerm =
    agreements.reduce((sum, a) => sum + a.termYears * a.annualVolume, 0) /
    agreements.reduce((sum, a) => sum + a.annualVolume, 0);

  let termScore = 0;
  const allMeetTenorPlus3 = agreements.every(a => a.termYears >= debtTenor + 3);
  const allMeetTenor = agreements.every(a => a.termYears >= debtTenor);

  if (allMeetTenorPlus3) termScore = 100;
  else if (allMeetTenor) termScore = 80;
  else if (weightedAvgTerm >= debtTenor) termScore = 60;
  else if (
    agreements.some(
      a => a.termYears < debtTenor && a.annualVolume < primaryVolume * 0.2
    )
  )
    termScore = 40;
  else termScore = 0;

  // Composite
  return primaryScore * 0.5 + secondaryScore * 0.3 + termScore * 0.2;
}

// ============================================================================
// CATEGORY 2: COUNTERPARTY QUALITY (25%)
// ============================================================================

export function calculateCounterpartyQualityScore(
  agreements: AgreementForScoring[]
): number {
  if (agreements.length === 0) return 0;

  // Weighted average GQ (lower is better: GQ1=1, GQ2=2, GQ3=3, GQ4=4)
  const totalVolume = agreements.reduce((sum, a) => sum + a.annualVolume, 0);
  const weightedAvgGQ =
    agreements.reduce(
      (sum, a) => sum + a.growerQualification * a.annualVolume,
      0
    ) / totalVolume;

  let avgGQScore = 0;
  if (weightedAvgGQ <= 1.5) avgGQScore = 100;
  else if (weightedAvgGQ <= 2.0) avgGQScore = 85;
  else if (weightedAvgGQ <= 2.5) avgGQScore = 70;
  else if (weightedAvgGQ <= 3.0) avgGQScore = 55;
  else avgGQScore = 40;

  // Tier 1 counterparty strength
  const tier1Agreements = agreements.filter(a => a.tier === "tier1");
  const allTier1GQ1 = tier1Agreements.every(a => a.growerQualification === 1);
  const allTier1GQ2OrBetter = tier1Agreements.every(
    a => a.growerQualification <= 2
  );
  const majorityTier1GQ2OrBetter =
    tier1Agreements.filter(a => a.growerQualification <= 2).length >
    tier1Agreements.length / 2;

  let tier1Score = 0;
  if (allTier1GQ1) tier1Score = 100;
  else if (allTier1GQ2OrBetter) tier1Score = 85;
  else if (majorityTier1GQ2OrBetter) tier1Score = 70;
  else tier1Score = 50;

  // Security package completeness
  const agreementsWithSecurity = agreements.filter(
    a =>
      (a.tier === "tier1" && (a.bankGuaranteePercent ?? 0) >= 10) ||
      (a.tier === "tier2" && (a.bankGuaranteePercent ?? 0) >= 5)
  ).length;

  const securityPercent = (agreementsWithSecurity / agreements.length) * 100;

  let securityScore = 0;
  if (securityPercent === 100) securityScore = 100;
  else if (securityPercent > 90) securityScore = 80;
  else if (securityPercent > 80) securityScore = 60;
  else securityScore = 40;

  // Composite
  return avgGQScore * 0.4 + tier1Score * 0.35 + securityScore * 0.25;
}

// ============================================================================
// CATEGORY 3: CONTRACT STRUCTURE (20%)
// ============================================================================

export function calculateContractStructureScore(
  agreements: AgreementForScoring[]
): number {
  if (agreements.length === 0) return 0;

  const totalVolume = agreements.reduce((sum, a) => sum + a.annualVolume, 0);

  // Pricing mechanism robustness
  const pricingScores = agreements.map(a => {
    if (
      a.pricingMechanism === "fixed" ||
      a.pricingMechanism === "fixed_with_escalation"
    )
      return 100;
    if (a.pricingMechanism === "index_with_floor_ceiling") return 85;
    if (a.pricingMechanism === "index_linked") return 70;
    if (a.pricingMechanism === "spot_reference") return 20;
    return 50;
  });
  const weightedPricingScore =
    pricingScores.reduce(
      (sum, score, i) => sum + score * agreements[i].annualVolume,
      0
    ) / totalVolume;

  // Termination protection
  const terminationScores = agreements.map(a => {
    if (a.lenderConsentRequired && a.earlyTerminationNoticeDays >= 720)
      return 100; // 24 months
    if (a.lenderConsentRequired && a.earlyTerminationNoticeDays >= 360)
      return 85; // 12 months
    if (a.earlyTerminationNoticeDays >= 360) return 70;
    if (a.earlyTerminationNoticeDays >= 180) return 50;
    return 30;
  });
  const weightedTerminationScore =
    terminationScores.reduce(
      (sum, score, i) => sum + score * agreements[i].annualVolume,
      0
    ) / totalVolume;

  // Force majeure provisions
  const fmScores = agreements.map(a => {
    if (
      a.forceMajeureVolumeReductionCap !== null &&
      a.forceMajeureVolumeReductionCap <= 30
    )
      return 100;
    if (
      a.forceMajeureVolumeReductionCap !== null &&
      a.forceMajeureVolumeReductionCap <= 50
    )
      return 75;
    if (a.forceMajeureVolumeReductionCap !== null) return 50;
    return 25;
  });
  const weightedFMScore =
    fmScores.reduce(
      (sum, score, i) => sum + score * agreements[i].annualVolume,
      0
    ) / totalVolume;

  // Step-in rights
  const stepInAgreements = agreements.filter(a => a.lenderStepInRights).length;
  const stepInPercent = (stepInAgreements / agreements.length) * 100;

  let stepInScore = 0;
  if (stepInPercent === 100) stepInScore = 100;
  else if (stepInPercent >= 80) stepInScore = 70;
  else stepInScore = 40;

  // Composite
  return (
    weightedPricingScore * 0.3 +
    weightedTerminationScore * 0.3 +
    weightedFMScore * 0.2 +
    stepInScore * 0.2
  );
}

// ============================================================================
// CATEGORY 4: CONCENTRATION RISK (15%)
// ============================================================================

export function calculateConcentrationRiskScore(
  data: ConcentrationData
): number {
  const { supplierVolumes, totalVolume, climateZones, largestSupplierVolume } =
    data;

  // Herfindahl-Hirschman Index (HHI)
  let hhi = 0;
  for (const volume of Array.from(supplierVolumes.values())) {
    const marketShare = (volume / totalVolume) * 100;
    hhi += marketShare * marketShare;
  }

  let hhiScore = 0;
  if (hhi < 1000) hhiScore = 100;
  else if (hhi < 1500) hhiScore = 80;
  else if (hhi < 2000) hhiScore = 60;
  else if (hhi < 2500) hhiScore = 40;
  else hhiScore = 20;

  // Top supplier exposure
  const largestPercent = (largestSupplierVolume / totalVolume) * 100;

  let topScore = 0;
  if (largestPercent < 15) topScore = 100;
  else if (largestPercent < 20) topScore = 80;
  else if (largestPercent < 25) topScore = 60;
  else if (largestPercent < 30) topScore = 40;
  else topScore = 20;

  // Geographic concentration
  let geoScore = 0;
  if (climateZones >= 4) geoScore = 100;
  else if (climateZones === 3) geoScore = 80;
  else if (climateZones === 2) geoScore = 60;
  else geoScore = 40;

  // Single event exposure (simplified - assume max event affects largest climate zone)
  // In real implementation, this would be calculated from actual geographic distribution
  const maxEventExposure = largestPercent; // Simplified assumption

  let eventScore = 0;
  if (maxEventExposure <= 20) eventScore = 100;
  else if (maxEventExposure <= 30) eventScore = 70;
  else if (maxEventExposure <= 40) eventScore = 50;
  else eventScore = 25;

  // Composite
  return hhiScore * 0.3 + topScore * 0.25 + geoScore * 0.25 + eventScore * 0.2;
}

// ============================================================================
// CATEGORY 5: OPERATIONAL READINESS (10%)
// ============================================================================

export function calculateOperationalReadinessScore(
  data: OperationalData
): number {
  // Logistics infrastructure
  let logisticsScore = 0;
  if (data.logisticsContracted && data.logisticsTested) logisticsScore = 100;
  else if (data.logisticsContracted) logisticsScore = 80;
  else logisticsScore = 60; // Identified but not contracted

  // Quality assurance system
  let qaScore = 0;
  if (data.qaSystemStatus === "operational") qaScore = 100;
  else if (data.qaSystemStatus === "implementation") qaScore = 75;
  else if (data.qaSystemStatus === "designed") qaScore = 50;
  else qaScore = 25;

  // ABFI platform integration
  let abfiScore = 0;
  if (data.abfiIntegration === "full") abfiScore = 100;
  else if (data.abfiIntegration === "partial") abfiScore = 75;
  else if (data.abfiIntegration === "manual") abfiScore = 50;
  else abfiScore = 25;

  // Contingency planning
  let contingencyScore = 0;
  if (data.contingencyPlans === "comprehensive") contingencyScore = 100;
  else if (data.contingencyPlans === "basic") contingencyScore = 70;
  else if (data.contingencyPlans === "limited") contingencyScore = 40;
  else contingencyScore = 20;

  // Composite
  return (
    logisticsScore * 0.3 +
    qaScore * 0.3 +
    abfiScore * 0.2 +
    contingencyScore * 0.2
  );
}

// ============================================================================
// COMPOSITE SCORE & RATING
// ============================================================================

export function calculateCompositeBankabilityScore(
  volumeSecurity: number,
  counterpartyQuality: number,
  contractStructure: number,
  concentrationRisk: number,
  operationalReadiness: number
): number {
  return (
    volumeSecurity * 0.3 +
    counterpartyQuality * 0.25 +
    contractStructure * 0.2 +
    concentrationRisk * 0.15 +
    operationalReadiness * 0.1
  );
}

export function getRating(compositeScore: number): {
  rating: BankabilityScores["rating"];
  description: string;
} {
  if (compositeScore >= 90)
    return { rating: "AAA", description: "Fully bankable, premium terms" };
  if (compositeScore >= 85)
    return { rating: "AA", description: "Fully bankable, standard terms" };
  if (compositeScore >= 80)
    return { rating: "A", description: "Bankable with standard covenants" };
  if (compositeScore >= 75)
    return { rating: "BBB", description: "Bankable with enhanced covenants" };
  if (compositeScore >= 70)
    return {
      rating: "BB",
      description: "Conditionally bankable, enhancements required",
    };
  if (compositeScore >= 65)
    return { rating: "B", description: "Significant enhancements required" };
  return { rating: "CCC", description: "Not bankable without restructuring" };
}

// ============================================================================
// MAIN SCORING FUNCTION
// ============================================================================

export function calculateBankabilityScores(
  position: SupplyPosition,
  concentrationData: ConcentrationData,
  operationalData: OperationalData
): BankabilityScores {
  const volumeSecurity = calculateVolumeSecurityScore(position);
  const counterpartyQuality = calculateCounterpartyQualityScore(
    position.agreements
  );
  const contractStructure = calculateContractStructureScore(
    position.agreements
  );
  const concentrationRisk = calculateConcentrationRiskScore(concentrationData);
  const operationalReadiness =
    calculateOperationalReadinessScore(operationalData);

  const composite = calculateCompositeBankabilityScore(
    volumeSecurity,
    counterpartyQuality,
    contractStructure,
    concentrationRisk,
    operationalReadiness
  );

  const { rating, description } = getRating(composite);

  return {
    volumeSecurity: Math.round(volumeSecurity),
    counterpartyQuality: Math.round(counterpartyQuality),
    contractStructure: Math.round(contractStructure),
    concentrationRisk: Math.round(concentrationRisk),
    operationalReadiness: Math.round(operationalReadiness),
    composite: Math.round(composite * 10) / 10, // One decimal place
    rating,
    ratingDescription: description,
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function generateAssessmentNumber(): string {
  const year = new Date().getFullYear();
  // Generate deterministic 5-digit number from UUID
  const uuid = crypto.randomUUID().replace(/-/g, "");
  const numericId = parseInt(uuid.substring(0, 8), 16) % 90000 + 10000;
  return `ABFI-BANK-${year}-${numericId}`;
}

export function calculateSupplierHHI(
  supplierVolumes: Map<number, number>,
  totalVolume: number
): number {
  let hhi = 0;
  for (const volume of Array.from(supplierVolumes.values())) {
    const marketShare = (volume / totalVolume) * 100;
    hhi += marketShare * marketShare;
  }
  return Math.round(hhi);
}

export function calculateWeightedAverageTerm(
  agreements: AgreementForScoring[]
): number {
  const totalVolume = agreements.reduce((sum, a) => sum + a.annualVolume, 0);
  if (totalVolume === 0) return 0;

  const weightedSum = agreements.reduce(
    (sum, a) => sum + a.termYears * a.annualVolume,
    0
  );
  return Math.round((weightedSum / totalVolume) * 10) / 10; // One decimal place
}

export function calculateWeightedAverageGQ(
  agreements: AgreementForScoring[]
): number {
  const totalVolume = agreements.reduce((sum, a) => sum + a.annualVolume, 0);
  if (totalVolume === 0) return 0;

  const weightedSum = agreements.reduce(
    (sum, a) => sum + a.growerQualification * a.annualVolume,
    0
  );
  return Math.round((weightedSum / totalVolume) * 10) / 10; // One decimal place
}
