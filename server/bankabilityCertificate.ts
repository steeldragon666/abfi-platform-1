/**
 * Bankability Certificate Generator
 * Generates PDF certificates for approved bankability assessments
 */

import { generateABFICertificate, generateCertificateHash, type CertificateData } from './certificateGenerator';

export interface BankabilityAssessmentData {
  assessmentId: number;
  projectName: string;
  projectLocation: string;
  feedstockType: string;
  annualVolume: number;
  compositeScore: number;
  rating: string;
  volumeSecurityScore: number;
  counterpartyQualityScore: number;
  contractStructureScore: number;
  concentrationRiskScore: number;
  operationalReadinessScore: number;
  assessmentDate: Date;
  approvedBy?: string;
  approvedDate?: Date;
}

export async function generateBankabilityCertificate(data: BankabilityAssessmentData): Promise<Buffer> {
  // Convert bankability assessment data to certificate format
  const certificateData: CertificateData = {
    feedstockId: data.assessmentId,
    feedstockName: data.feedstockType,
    feedstockCategory: 'Bankability Assessment',
    supplierName: data.projectName,
    supplierABN: '00000000000', // Not applicable for bankability
    location: data.projectLocation,
    state: 'QLD', // Default, should be extracted from location
    abfiScore: data.compositeScore,
    sustainabilityScore: data.compositeScore,
    carbonIntensityScore: data.concentrationRiskScore,
    qualityScore: data.volumeSecurityScore,
    reliabilityScore: data.counterpartyQualityScore,
    ratingGrade: data.rating,
    certificateNumber: `BANK-${data.assessmentId}-${Date.now()}`,
    issueDate: data.assessmentDate.toISOString(),
    validUntil: new Date(data.assessmentDate.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    assessmentDate: data.assessmentDate.toISOString(),
    carbonIntensity: 0,
    annualVolume: data.annualVolume,
    certifications: ['ABFI Bankability Assessment'],
  };

  // Generate certificate hash
  const certificateHash = generateCertificateHash(certificateData);

  // Generate PDF with custom title for bankability
  const pdfBuffer = await generateABFICertificate({
    ...certificateData,
    certificateHash,
  });

  return pdfBuffer;
}

export function getBankabilityRating(compositeScore: number): string {
  if (compositeScore >= 90) return 'AAA';
  if (compositeScore >= 85) return 'AA';
  if (compositeScore >= 80) return 'A';
  if (compositeScore >= 75) return 'BBB';
  if (compositeScore >= 70) return 'BB';
  if (compositeScore >= 65) return 'B';
  return 'CCC';
}
