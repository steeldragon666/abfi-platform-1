/**
 * ABFI Rating System - Calculation Engine
 * 
 * Composite ABFI Score (0-100) = weighted average of 4 pillars:
 * - Sustainability Score: 30%
 * - Carbon Intensity Score: 30%
 * - Quality Score: 25%
 * - Supply Reliability Score: 15%
 */

import type { Feedstock, Certificate, QualityTest, Transaction } from "../drizzle/schema";

export interface AbfiScores {
  abfiScore: number;
  sustainabilityScore: number;
  carbonIntensityScore: number;
  qualityScore: number;
  reliabilityScore: number;
}

export interface RatingImprovementSuggestion {
  pillar: string;
  currentScore: number;
  potentialGain: number;
  suggestions: string[];
}

// ============================================================================
// MAIN RATING CALCULATOR
// ============================================================================

export function calculateAbfiScore(
  feedstock: Feedstock,
  certificates: Certificate[],
  qualityTests: QualityTest[],
  transactions: Transaction[]
): AbfiScores {
  const sustainabilityScore = calculateSustainabilityScore(feedstock, certificates);
  const carbonIntensityScore = calculateCarbonIntensityScore(feedstock.carbonIntensityValue || 0);
  const qualityScore = calculateQualityScore(feedstock, qualityTests);
  const reliabilityScore = calculateReliabilityScore(transactions);
  
  const composite = (
    sustainabilityScore * 0.30 +
    carbonIntensityScore * 0.30 +
    qualityScore * 0.25 +
    reliabilityScore * 0.15
  );
  
  return {
    abfiScore: Math.round(composite),
    sustainabilityScore: Math.round(sustainabilityScore),
    carbonIntensityScore: Math.round(carbonIntensityScore),
    qualityScore: Math.round(qualityScore),
    reliabilityScore: Math.round(reliabilityScore),
  };
}

// ============================================================================
// PILLAR 1: SUSTAINABILITY SCORE (0-100)
// ============================================================================

/**
 * Sustainability Score Components:
 * - Certification Tier Points: 0-40
 * - Land Use Compliance: 0-25
 * - Social Compliance: 0-20
 * - Biodiversity & Soil: 0-15
 */
export function calculateSustainabilityScore(
  feedstock: Feedstock,
  certificates: Certificate[]
): number {
  let score = 0;
  
  // Certification Tier Points (0-40)
  score += getCertificationPoints(certificates);
  
  // For MVP, we'll use simplified scoring based on verification level
  // In production, these would come from detailed compliance data
  
  // Land Use Compliance (0-25) - estimated from verification level
  if (feedstock.verificationLevel === 'abfi_certified') {
    score += 25;
  } else if (feedstock.verificationLevel === 'third_party_audited') {
    score += 20;
  } else if (feedstock.verificationLevel === 'document_verified') {
    score += 15;
  } else {
    score += 10; // self_declared
  }
  
  // Social Compliance (0-20) - estimated
  if (feedstock.verificationLevel === 'abfi_certified' || feedstock.verificationLevel === 'third_party_audited') {
    score += 20;
  } else {
    score += 10;
  }
  
  // Biodiversity & Soil (0-15) - estimated
  if (feedstock.verificationLevel === 'abfi_certified') {
    score += 15;
  } else if (feedstock.verificationLevel === 'third_party_audited') {
    score += 10;
  } else {
    score += 5;
  }
  
  return Math.min(100, score);
}

function getCertificationPoints(certificates: Certificate[]): number {
  const activeCerts = certificates.filter(c => c.status === 'active');
  
  if (activeCerts.length === 0) return 0;
  
  // Find highest-value certification
  let maxPoints = 0;
  
  for (const cert of activeCerts) {
    let points = 0;
    
    switch (cert.type) {
      case 'ISCC_EU':
      case 'ISCC_PLUS':
        points = 40;
        break;
      case 'RSB':
        points = 38;
        break;
      case 'ABFI':
        points = 30;
        break;
      case 'RED_II':
        points = 25;
        break;
      case 'GO':
        points = 20;
        break;
      default:
        points = 10;
    }
    
    maxPoints = Math.max(maxPoints, points);
  }
  
  return maxPoints;
}

// ============================================================================
// PILLAR 2: CARBON INTENSITY SCORE (0-100)
// ============================================================================

/**
 * Carbon Intensity Score based on gCO2e/MJ
 * Lower CI = higher score
 * 
 * Rating Bands:
 * A+ (<10): 95-100
 * A (10-20): 85-94
 * B+ (20-30): 75-84
 * B (30-40): 65-74
 * C+ (40-50): 55-64
 * C (50-60): 45-54
 * D (60-70): 35-44
 * F (>70): 0-34
 */
export function calculateCarbonIntensityScore(ciValue: number): number {
  if (ciValue < 10) return 95 + (10 - ciValue) * 0.5;
  if (ciValue < 20) return 85 + (20 - ciValue);
  if (ciValue < 30) return 75 + (30 - ciValue);
  if (ciValue < 40) return 65 + (40 - ciValue);
  if (ciValue < 50) return 55 + (50 - ciValue);
  if (ciValue < 60) return 45 + (60 - ciValue);
  if (ciValue < 70) return 35 + (70 - ciValue);
  return Math.max(0, 35 - (ciValue - 70));
}

export function getCarbonIntensityGrade(ciValue: number): string {
  if (ciValue < 10) return 'A+';
  if (ciValue < 20) return 'A';
  if (ciValue < 30) return 'B+';
  if (ciValue < 40) return 'B';
  if (ciValue < 50) return 'C+';
  if (ciValue < 60) return 'C';
  if (ciValue < 70) return 'D';
  return 'F';
}

// ============================================================================
// PILLAR 3: QUALITY SCORE (0-100)
// ============================================================================

/**
 * Quality Score based on feedstock type and test results
 * Different parameters for different feedstock categories
 */
export function calculateQualityScore(
  feedstock: Feedstock,
  qualityTests: QualityTest[]
): number {
  // If no quality tests, use a baseline score based on verification
  if (qualityTests.length === 0) {
    if (feedstock.verificationLevel === 'abfi_certified') return 80;
    if (feedstock.verificationLevel === 'third_party_audited') return 70;
    if (feedstock.verificationLevel === 'document_verified') return 60;
    return 50; // self_declared
  }
  
  // Use most recent quality test
  const latestTest = qualityTests[0];
  
  if (!latestTest || !latestTest.parameters) {
    return 50; // Default if no parameters
  }
  
  // Calculate score based on feedstock category
  switch (feedstock.category) {
    case 'oilseed':
      return calculateOilseedQualityScore(latestTest.parameters);
    case 'UCO':
      return calculateUCOQualityScore(latestTest.parameters);
    case 'tallow':
      return calculateTallowQualityScore(latestTest.parameters);
    case 'lignocellulosic':
      return calculateLignocellulosicQualityScore(latestTest.parameters);
    case 'waste':
      return calculateWasteQualityScore(latestTest.parameters);
    default:
      return calculateGenericQualityScore(latestTest.parameters);
  }
}

function calculateOilseedQualityScore(parameters: any): number {
  let score = 0;
  
  // Oil content (0-25 points)
  const oilContent = parameters.oilContent?.value;
  if (oilContent >= 42) score += 25;
  else if (oilContent >= 38) score += 20;
  else score += 10;
  
  // Free fatty acid (0-25 points)
  const ffa = parameters.freefattyAcid?.value || parameters.ffa?.value;
  if (ffa < 2) score += 25;
  else if (ffa < 4) score += 20;
  else score += 10;
  
  // Moisture (0-20 points)
  const moisture = parameters.moisture?.value;
  if (moisture < 8) score += 20;
  else if (moisture < 10) score += 15;
  else score += 5;
  
  // Impurities (0-15 points)
  const impurities = parameters.impurities?.value;
  if (impurities < 2) score += 15;
  else if (impurities < 4) score += 10;
  else score += 5;
  
  // Phosphorus (0-15 points)
  const phosphorus = parameters.phosphorus?.value;
  if (phosphorus < 15) score += 15;
  else if (phosphorus < 30) score += 10;
  else score += 5;
  
  return Math.min(100, score);
}

function calculateUCOQualityScore(parameters: any): number {
  let score = 0;
  
  // Free fatty acid (0-30 points)
  const ffa = parameters.freefattyAcid?.value || parameters.ffa?.value;
  if (ffa < 5) score += 30;
  else if (ffa < 15) score += 20;
  else score += 10;
  
  // Moisture (0-25 points)
  const moisture = parameters.moisture?.value;
  if (moisture < 0.5) score += 25;
  else if (moisture < 1) score += 20;
  else score += 10;
  
  // Impurities (0-20 points)
  const impurities = parameters.impurities?.value;
  if (impurities < 1) score += 20;
  else if (impurities < 2) score += 15;
  else score += 5;
  
  // Iodine value (0-15 points)
  const iodine = parameters.iodineValue?.value;
  if (iodine >= 80 && iodine <= 120) score += 15;
  else if (iodine >= 60 && iodine <= 140) score += 10;
  else score += 5;
  
  // MIU (0-10 points)
  const miu = parameters.miu?.value || parameters.MIU?.value;
  if (miu < 3) score += 10;
  else if (miu < 5) score += 5;
  
  return Math.min(100, score);
}

function calculateTallowQualityScore(parameters: any): number {
  let score = 0;
  
  // Free fatty acid (0-30 points)
  const ffa = parameters.freefattyAcid?.value || parameters.ffa?.value;
  if (ffa < 5) score += 30;
  else if (ffa < 15) score += 20;
  else score += 10;
  
  // Moisture (0-25 points)
  const moisture = parameters.moisture?.value;
  if (moisture < 0.5) score += 25;
  else if (moisture < 1) score += 20;
  else score += 10;
  
  // Titre (0-20 points)
  const titre = parameters.titre?.value;
  if (titre >= 40 && titre <= 46) score += 20;
  else if (titre >= 38 && titre <= 48) score += 15;
  else score += 5;
  
  // Impurities (0-15 points)
  const impurities = parameters.impurities?.value;
  if (impurities < 0.5) score += 15;
  else if (impurities < 1) score += 10;
  else score += 5;
  
  // Category (0-10 points)
  const category = parameters.category?.value;
  if (category === 3) score += 10;
  else if (category === 2) score += 5;
  
  return Math.min(100, score);
}

function calculateLignocellulosicQualityScore(parameters: any): number {
  let score = 0;
  
  // Moisture (0-25 points)
  const moisture = parameters.moisture?.value;
  if (moisture < 15) score += 25;
  else if (moisture < 25) score += 20;
  else score += 10;
  
  // Ash content (0-25 points)
  const ash = parameters.ashContent?.value || parameters.ash?.value;
  if (ash < 5) score += 25;
  else if (ash < 10) score += 20;
  else score += 10;
  
  // Calorific value (0-20 points)
  const calorific = parameters.calorificValue?.value;
  if (calorific > 18) score += 20;
  else if (calorific > 15) score += 15;
  else score += 5;
  
  // Particle size consistency (0-15 points)
  const particleSize = parameters.particleSizeConsistency?.value;
  if (particleSize > 90) score += 15;
  else if (particleSize > 80) score += 10;
  else score += 5;
  
  // Contaminants (0-15 points)
  const contaminants = parameters.contaminants?.value;
  if (contaminants === 'within_spec') score += 15;
  else if (contaminants === 'marginal') score += 10;
  else score += 5;
  
  return Math.min(100, score);
}

function calculateWasteQualityScore(parameters: any): number {
  let score = 0;
  
  // Contamination rate (0-30 points)
  const contamination = parameters.contaminationRate?.value;
  if (contamination < 3) score += 30;
  else if (contamination < 8) score += 20;
  else score += 10;
  
  // Organic content (0-25 points)
  const organic = parameters.organicContent?.value;
  if (organic > 90) score += 25;
  else if (organic > 80) score += 20;
  else score += 10;
  
  // Moisture (0-20 points)
  const moisture = parameters.moisture?.value;
  if (moisture < 60) score += 20;
  else if (moisture < 75) score += 15;
  else score += 5;
  
  // Homogeneity (0-15 points)
  const homogeneity = parameters.homogeneity?.value;
  if (homogeneity === 'high') score += 15;
  else if (homogeneity === 'medium') score += 10;
  else score += 5;
  
  // Heavy metals (0-10 points)
  const heavyMetals = parameters.heavyMetals?.value;
  if (heavyMetals === 'below_threshold') score += 10;
  else if (heavyMetals === 'at_threshold') score += 5;
  
  return Math.min(100, score);
}

function calculateGenericQualityScore(parameters: any): number {
  // Count how many parameters pass their specifications
  const paramArray = Object.values(parameters);
  const totalParams = paramArray.length;
  
  if (totalParams === 0) return 50;
  
  const passedParams = paramArray.filter((p: any) => p.pass === true).length;
  const passRate = passedParams / totalParams;
  
  return Math.round(passRate * 100);
}

// ============================================================================
// PILLAR 4: SUPPLY RELIABILITY SCORE (0-100)
// ============================================================================

/**
 * Supply Reliability Score Components:
 * - Delivery performance (OTIF): 0-30
 * - Volume consistency: 0-25
 * - Quality consistency: 0-20
 * - Response time: 0-15
 * - Platform history: 0-10
 */
export function calculateReliabilityScore(transactions: Transaction[]): number {
  if (transactions.length === 0) {
    // New supplier - provisional score
    return 50;
  }
  
  let score = 0;
  
  // Delivery performance - OTIF (On-Time, In-Full) (0-30 points)
  const completedTransactions = transactions.filter(t => t.status === 'completed');
  if (completedTransactions.length > 0) {
    const onTimeCount = completedTransactions.filter(t => {
      // Simplified: assume completed = on time for MVP
      return true;
    }).length;
    const otifRate = onTimeCount / completedTransactions.length;
    score += otifRate * 30;
  } else {
    score += 15; // Partial credit for having transactions
  }
  
  // Volume consistency (0-25 points)
  if (completedTransactions.length >= 2) {
    // Calculate variance in delivered volumes
    const volumes = completedTransactions.map(t => t.volumeTonnes);
    const avgVolume = volumes.reduce((a, b) => a + b, 0) / volumes.length;
    const variance = volumes.reduce((sum, v) => sum + Math.pow(v - avgVolume, 2), 0) / volumes.length;
    const coefficientOfVariation = Math.sqrt(variance) / avgVolume;
    
    // Lower CoV = higher score
    if (coefficientOfVariation < 0.1) score += 25;
    else if (coefficientOfVariation < 0.2) score += 20;
    else if (coefficientOfVariation < 0.3) score += 15;
    else score += 10;
  } else {
    score += 12; // Partial credit
  }
  
  // Quality consistency (0-20 points)
  const ratedTransactions = completedTransactions.filter(t => t.buyerRating !== null);
  if (ratedTransactions.length > 0) {
    const avgRating = ratedTransactions.reduce((sum, t) => sum + (t.buyerRating || 0), 0) / ratedTransactions.length;
    score += (avgRating / 5) * 20;
  } else {
    score += 10; // Partial credit
  }
  
  // Response time (0-15 points) - simplified for MVP
  score += 12; // Default good score
  
  // Platform history (0-10 points)
  const monthsActive = Math.min(12, transactions.length); // Simplified
  score += (monthsActive / 12) * 10;
  
  return Math.min(100, Math.round(score));
}

// ============================================================================
// RATING IMPROVEMENT SUGGESTIONS
// ============================================================================

export function generateRatingImprovements(
  scores: AbfiScores,
  feedstock: Feedstock,
  certificates: Certificate[]
): RatingImprovementSuggestion[] {
  const suggestions: RatingImprovementSuggestion[] = [];
  
  // Sustainability improvements
  if (scores.sustainabilityScore < 80) {
    const certSuggestions = [];
    const hasPremiumCert = certificates.some(c => 
      c.status === 'active' && (c.type === 'ISCC_EU' || c.type === 'ISCC_PLUS' || c.type === 'RSB')
    );
    
    if (!hasPremiumCert) {
      certSuggestions.push('Obtain ISCC EU/PLUS or RSB certification (+40 points)');
    }
    
    if (feedstock.verificationLevel === 'self_declared') {
      certSuggestions.push('Upgrade to document verification (+5-10 points)');
    }
    
    if (feedstock.verificationLevel !== 'abfi_certified') {
      certSuggestions.push('Complete ABFI certification process (+10-15 points)');
    }
    
    if (certSuggestions.length > 0) {
      suggestions.push({
        pillar: 'Sustainability',
        currentScore: scores.sustainabilityScore,
        potentialGain: 100 - scores.sustainabilityScore,
        suggestions: certSuggestions,
      });
    }
  }
  
  // Carbon intensity improvements
  if (scores.carbonIntensityScore < 80) {
    const carbonSuggestions = [];
    const currentCI = feedstock.carbonIntensityValue || 0;
    
    if (currentCI > 30) {
      carbonSuggestions.push('Optimize transport logistics to reduce emissions');
      carbonSuggestions.push('Switch to renewable energy in processing');
    }
    
    if (currentCI > 50) {
      carbonSuggestions.push('Review cultivation practices and fertilizer use');
    }
    
    if (carbonSuggestions.length > 0) {
      suggestions.push({
        pillar: 'Carbon Intensity',
        currentScore: scores.carbonIntensityScore,
        potentialGain: 100 - scores.carbonIntensityScore,
        suggestions: carbonSuggestions,
      });
    }
  }
  
  // Quality improvements
  if (scores.qualityScore < 80) {
    suggestions.push({
      pillar: 'Quality',
      currentScore: scores.qualityScore,
      potentialGain: 100 - scores.qualityScore,
      suggestions: [
        'Upload recent quality test reports from certified laboratories',
        'Implement quality control procedures',
        'Ensure parameters meet optimal specifications',
      ],
    });
  }
  
  // Reliability improvements
  if (scores.reliabilityScore < 80) {
    suggestions.push({
      pillar: 'Supply Reliability',
      currentScore: scores.reliabilityScore,
      potentialGain: 100 - scores.reliabilityScore,
      suggestions: [
        'Complete more transactions to build track record',
        'Maintain consistent delivery schedules',
        'Respond promptly to buyer inquiries',
      ],
    });
  }
  
  return suggestions;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function getAbfiScoreGrade(score: number): string {
  if (score >= 90) return 'A+';
  if (score >= 80) return 'A';
  if (score >= 70) return 'B+';
  if (score >= 60) return 'B';
  if (score >= 50) return 'C+';
  if (score >= 40) return 'C';
  if (score >= 30) return 'D';
  return 'F';
}

export function getScoreColor(score: number): string {
  if (score >= 80) return 'green';
  if (score >= 60) return 'yellow';
  if (score >= 40) return 'orange';
  return 'red';
}
