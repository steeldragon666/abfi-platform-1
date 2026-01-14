/**
 * Grant Decoder Service
 * NLP-powered analysis of grant agreements and compliance documents
 *
 * Features:
 * - Key milestone extraction with dates
 * - Payment trigger identification
 * - Termination clause analysis
 * - Reporting requirements extraction
 * - Risk flag detection
 * - Compliance checking against project reports
 *
 * Target Performance:
 * - 95% non-compliance risk detection
 * - ~30 seconds processing for 50-page document
 *
 * Note: This service provides simulated analysis in development.
 * In production, would integrate with:
 * - OpenAI GPT-4 Turbo for document understanding
 * - LangChain for RAG pipeline
 * - Pinecone for vector storage of grant documents
 */

import { logger } from "../utils/logger";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface GrantAgreement {
  id: string;
  title: string;
  grantProvider: string;
  grantProgram: string;
  awardAmount: number;
  currency: string;
  startDate: Date;
  endDate: Date;
  documentHash?: string;
}

export interface Milestone {
  id: string;
  title: string;
  description: string;
  dueDate: Date;
  paymentAmount?: number;
  paymentPercentage?: number;
  deliverables: string[];
  evidenceRequired: string[];
  status: "pending" | "in_progress" | "completed" | "overdue" | "waived";
}

export interface PaymentTrigger {
  id: string;
  description: string;
  amount: number;
  percentage: number;
  milestoneId?: string;
  conditions: string[];
  documentationRequired: string[];
}

export interface TerminationClause {
  type: "for_cause" | "for_convenience" | "mutual" | "automatic";
  description: string;
  noticePeriodDays: number;
  consequences: string[];
  remedyCurePeriodDays?: number;
}

export interface ReportingRequirement {
  id: string;
  reportType: string;
  frequency: "monthly" | "quarterly" | "annually" | "milestone_based" | "ad_hoc";
  dueDate?: Date;
  dueDayOfMonth?: number;
  description: string;
  template?: string;
  recipientEmail?: string;
}

export interface RiskFlag {
  severity: "low" | "medium" | "high" | "critical";
  category: "compliance" | "financial" | "timeline" | "scope" | "reporting" | "legal";
  description: string;
  recommendation: string;
  relatedClause?: string;
}

export interface GrantAnalysis {
  agreement: GrantAgreement;
  milestones: Milestone[];
  paymentTriggers: PaymentTrigger[];
  terminationClauses: TerminationClause[];
  reportingRequirements: ReportingRequirement[];
  riskFlags: RiskFlag[];
  keyObligations: string[];
  specialConditions: string[];
  processingTimeMs: number;
  modelVersion: string;
  confidenceScore: number;
}

export interface ComplianceReport {
  agreementId: string;
  projectReportId: string;
  overallCompliance: "compliant" | "minor_issues" | "major_issues" | "non_compliant";
  complianceScore: number; // 0-100
  findings: ComplianceFinding[];
  missedDeadlines: MissedDeadline[];
  documentationGaps: string[];
  recommendations: string[];
  reviewDate: Date;
}

export interface ComplianceFinding {
  severity: "info" | "warning" | "error" | "critical";
  category: string;
  description: string;
  clause: string;
  remediation: string;
}

export interface MissedDeadline {
  milestoneId: string;
  milestoneName: string;
  dueDate: Date;
  actualCompletionDate?: Date;
  daysOverdue: number;
  financialImpact?: number;
}

// ============================================================================
// GRANT PROGRAMS KNOWLEDGE BASE
// ============================================================================

const KNOWN_GRANT_PROGRAMS = {
  ARENA: {
    name: "Australian Renewable Energy Agency",
    programs: [
      "Advancing Renewables Program",
      "Bioenergy Program",
      "Regional Australia Microgrid Pilots",
    ],
    typicalMilestones: [
      "Financial close",
      "Construction commencement",
      "First energy production",
      "Commercial operations",
      "Performance verification",
    ],
    reportingCycles: ["quarterly", "annually"],
  },
  CEFC: {
    name: "Clean Energy Finance Corporation",
    programs: [
      "Clean Energy Innovation Fund",
      "Bioenergy Fund",
      "Regional Investment",
    ],
    typicalMilestones: [
      "Loan drawdown conditions",
      "Construction milestones",
      "Operations commencement",
      "Performance covenants",
    ],
    reportingCycles: ["quarterly", "annually"],
  },
  ERF: {
    name: "Emissions Reduction Fund",
    programs: [
      "ERF Contracts",
      "Safeguard Mechanism",
    ],
    typicalMilestones: [
      "Project registration",
      "First crediting period",
      "ACCU delivery",
      "Audit completion",
    ],
    reportingCycles: ["annually"],
  },
  STATE_QLD: {
    name: "Queensland Government",
    programs: [
      "Jobs and Regional Growth Fund",
      "Advance Queensland Industry Attraction Fund",
      "Biofutures 10-Year Roadmap",
    ],
    typicalMilestones: [
      "Job creation targets",
      "Investment milestones",
      "Regional benefit demonstration",
    ],
    reportingCycles: ["quarterly", "annually"],
  },
};

// ============================================================================
// GRANT DECODER SERVICE
// ============================================================================

/**
 * Decode and analyze a grant agreement document
 */
export async function decodeGrantAgreement(
  documentBase64: string,
  documentType: "pdf" | "docx" = "pdf"
): Promise<GrantAnalysis> {
  const startTime = Date.now();

  logger.info("GRANT_DECODER", `Decoding ${documentType.toUpperCase()} document`);

  // In production, would:
  // 1. Extract text from PDF/DOCX using pdf-parse or docxtemplater
  // 2. Send to OpenAI GPT-4 for structured extraction
  // 3. Use LangChain RAG for clause comparison against templates
  // 4. Store embeddings in Pinecone for future similarity search

  // For now, generate realistic simulated analysis
  const analysis = simulateGrantAnalysis();

  const processingTimeMs = Date.now() - startTime;

  return {
    ...analysis,
    processingTimeMs,
    modelVersion: "gpt-4-turbo-simulated",
    confidenceScore: 0.92,
  };
}

/**
 * Check compliance of a project report against grant agreement
 */
export async function checkGrantCompliance(
  agreementId: string,
  projectReportData: {
    reportDate: Date;
    milestoneProgress: Record<string, { completed: boolean; completionDate?: Date; evidence?: string[] }>;
    expenditure: { category: string; amount: number }[];
    jobsCreated?: number;
    issues?: string[];
  }
): Promise<ComplianceReport> {
  const startTime = Date.now();

  logger.info("GRANT_DECODER", `Checking compliance for agreement ${agreementId}`);

  // In production, would:
  // 1. Retrieve stored grant agreement analysis
  // 2. Compare project report against milestones and requirements
  // 3. Use NLP to identify discrepancies
  // 4. Generate remediation recommendations

  const findings: ComplianceFinding[] = [];
  const missedDeadlines: MissedDeadline[] = [];
  const documentationGaps: string[] = [];
  const recommendations: string[] = [];

  // Simulate milestone compliance check
  let milestoneIndex = 0;
  for (const [milestoneId, progress] of Object.entries(projectReportData.milestoneProgress)) {
    if (!progress.completed) {
      // Deterministic due date based on milestone ID
      const milestoneIdSeed = milestoneId.charCodeAt(0) + (milestoneId.charCodeAt(1) || 0) + milestoneIndex;
      const deterministicDays = (milestoneIdSeed % 25) + 5; // 5-30 days ago
      const simulatedDueDate = new Date(Date.now() - deterministicDays * 24 * 60 * 60 * 1000);
      if (simulatedDueDate < new Date()) {
        const daysOverdue = Math.floor((Date.now() - simulatedDueDate.getTime()) / (24 * 60 * 60 * 1000));
        missedDeadlines.push({
          milestoneId,
          milestoneName: `Milestone ${milestoneId}`,
          dueDate: simulatedDueDate,
          daysOverdue,
        });
        findings.push({
          severity: daysOverdue > 30 ? "critical" : "warning",
          category: "timeline",
          description: `Milestone ${milestoneId} is ${daysOverdue} days overdue`,
          clause: "Section 4.2 - Milestone Delivery",
          remediation: "Submit milestone variation request or provide evidence of completion",
        });
      }
    } else if (!progress.evidence || progress.evidence.length === 0) {
    milestoneIndex++;
      documentationGaps.push(`Missing evidence documentation for milestone ${milestoneId}`);
    }
  }

  // Check expenditure categories
  const totalExpenditure = projectReportData.expenditure.reduce((sum, e) => sum + e.amount, 0);
  const adminExpenditure = projectReportData.expenditure
    .filter(e => e.category.toLowerCase().includes("admin"))
    .reduce((sum, e) => sum + e.amount, 0);

  if (adminExpenditure / totalExpenditure > 0.15) {
    findings.push({
      severity: "warning",
      category: "financial",
      description: `Administrative costs (${((adminExpenditure / totalExpenditure) * 100).toFixed(1)}%) exceed typical threshold of 15%`,
      clause: "Section 6.1 - Eligible Expenditure",
      remediation: "Provide justification for administrative overhead or reallocate budget",
    });
  }

  // Generate recommendations
  if (missedDeadlines.length > 0) {
    recommendations.push("Submit formal milestone extension request with revised timeline");
  }
  if (documentationGaps.length > 0) {
    recommendations.push("Upload supporting evidence for completed milestones before next reporting period");
  }
  if (findings.some(f => f.category === "financial")) {
    recommendations.push("Prepare detailed expenditure breakdown for next quarterly report");
  }

  // Calculate overall compliance score
  const criticalCount = findings.filter(f => f.severity === "critical").length;
  const warningCount = findings.filter(f => f.severity === "warning").length;
  const complianceScore = Math.max(0, 100 - criticalCount * 25 - warningCount * 10);

  let overallCompliance: ComplianceReport["overallCompliance"];
  if (complianceScore >= 90) overallCompliance = "compliant";
  else if (complianceScore >= 70) overallCompliance = "minor_issues";
  else if (complianceScore >= 50) overallCompliance = "major_issues";
  else overallCompliance = "non_compliant";

  return {
    agreementId,
    projectReportId: `report-${Date.now()}`,
    overallCompliance,
    complianceScore,
    findings,
    missedDeadlines,
    documentationGaps,
    recommendations,
    reviewDate: new Date(),
  };
}

/**
 * Search for similar grant clauses in the knowledge base
 */
export async function searchSimilarClauses(
  queryText: string,
  grantProgram?: string
): Promise<{
  matches: {
    text: string;
    similarity: number;
    source: string;
    interpretation: string;
  }[];
}> {
  logger.info("GRANT_DECODER", `Searching for clauses similar to: "${queryText.substring(0, 50)}..."`);

  // In production, would:
  // 1. Generate embedding for query using sentence-transformers
  // 2. Search Pinecone vector store for similar clauses
  // 3. Return ranked results with interpretations

  // Simulate search results
  const matches = [
    {
      text: "The Recipient must maintain records of all project expenditure for a period of 7 years after project completion.",
      similarity: 0.89,
      source: "ARENA Standard Grant Agreement v2.3",
      interpretation: "Standard record-keeping requirement. Ensure all financial records are stored securely.",
    },
    {
      text: "Milestone payments are contingent upon satisfactory completion of deliverables as verified by the Grantor.",
      similarity: 0.82,
      source: "CEFC Bioenergy Fund Template",
      interpretation: "Payment release requires formal verification. Prepare evidence packages for each milestone.",
    },
  ];

  return { matches };
}

// ============================================================================
// SIMULATION FUNCTIONS (for development)
// ============================================================================

function simulateGrantAnalysis(): Omit<GrantAnalysis, "processingTimeMs" | "modelVersion" | "confidenceScore"> {
  const startDate = new Date("2025-01-15");
  const endDate = new Date("2027-12-31");

  const agreement: GrantAgreement = {
    id: `grant-${Date.now()}`,
    title: "Bioenergy Production Facility Grant Agreement",
    grantProvider: "Australian Renewable Energy Agency",
    grantProgram: "Advancing Renewables Program",
    awardAmount: 2500000,
    currency: "AUD",
    startDate,
    endDate,
  };

  const milestones: Milestone[] = [
    {
      id: "M1",
      title: "Financial Close",
      description: "Achieve financial close with all project financing secured",
      dueDate: new Date("2025-06-30"),
      paymentAmount: 250000,
      paymentPercentage: 10,
      deliverables: ["Executed loan agreements", "Equity commitment letters", "Financial model"],
      evidenceRequired: ["Signed financing documents", "Bank commitment letter"],
      status: "pending",
    },
    {
      id: "M2",
      title: "Construction Commencement",
      description: "Begin physical construction of the bioenergy facility",
      dueDate: new Date("2025-09-30"),
      paymentAmount: 500000,
      paymentPercentage: 20,
      deliverables: ["Building permits obtained", "Contractor mobilization", "Ground breaking"],
      evidenceRequired: ["Council approval", "Construction contract", "Site photos"],
      status: "pending",
    },
    {
      id: "M3",
      title: "Equipment Installation",
      description: "Complete installation of major equipment",
      dueDate: new Date("2026-06-30"),
      paymentAmount: 750000,
      paymentPercentage: 30,
      deliverables: ["Digester installation", "Generator installation", "Grid connection"],
      evidenceRequired: ["Equipment commissioning certificates", "Inspection reports"],
      status: "pending",
    },
    {
      id: "M4",
      title: "First Energy Production",
      description: "Achieve first energy production from the facility",
      dueDate: new Date("2026-09-30"),
      paymentAmount: 500000,
      paymentPercentage: 20,
      deliverables: ["Grid export commencement", "Initial performance data"],
      evidenceRequired: ["AEMO registration", "Energy production logs"],
      status: "pending",
    },
    {
      id: "M5",
      title: "Commercial Operations",
      description: "Achieve full commercial operations at design capacity",
      dueDate: new Date("2027-03-31"),
      paymentAmount: 500000,
      paymentPercentage: 20,
      deliverables: ["90-day operational period", "Performance verification"],
      evidenceRequired: ["Independent engineer report", "Operational data"],
      status: "pending",
    },
  ];

  const paymentTriggers: PaymentTrigger[] = milestones.map(m => ({
    id: `PT-${m.id}`,
    description: `Payment upon completion of ${m.title}`,
    amount: m.paymentAmount || 0,
    percentage: m.paymentPercentage || 0,
    milestoneId: m.id,
    conditions: [`Satisfactory completion of ${m.title}`, "Approval by ARENA"],
    documentationRequired: m.evidenceRequired,
  }));

  const terminationClauses: TerminationClause[] = [
    {
      type: "for_cause",
      description: "ARENA may terminate if Recipient fails to achieve milestones or breaches material obligations",
      noticePeriodDays: 30,
      consequences: ["Repayment of grant funds", "Loss of future funding eligibility"],
      remedyCurePeriodDays: 60,
    },
    {
      type: "for_convenience",
      description: "ARENA may terminate at its discretion with notice",
      noticePeriodDays: 90,
      consequences: ["Pro-rata payment for completed milestones", "No penalty to Recipient"],
    },
    {
      type: "mutual",
      description: "Either party may terminate by mutual written agreement",
      noticePeriodDays: 30,
      consequences: ["Negotiate final settlement", "Return of unused funds"],
    },
  ];

  const reportingRequirements: ReportingRequirement[] = [
    {
      id: "RR1",
      reportType: "Quarterly Progress Report",
      frequency: "quarterly",
      dueDayOfMonth: 15,
      description: "Progress update on milestones, expenditure, and key issues",
      template: "ARENA Quarterly Report Template v3.0",
    },
    {
      id: "RR2",
      reportType: "Annual Acquittal Report",
      frequency: "annually",
      dueDayOfMonth: 30,
      description: "Detailed financial acquittal with audited expenditure",
      template: "ARENA Financial Acquittal Template",
    },
    {
      id: "RR3",
      reportType: "Milestone Completion Report",
      frequency: "milestone_based",
      description: "Evidence package for each milestone completion claim",
    },
    {
      id: "RR4",
      reportType: "Final Project Report",
      frequency: "ad_hoc",
      dueDate: new Date("2027-06-30"),
      description: "Comprehensive project outcomes and lessons learned report",
    },
  ];

  const riskFlags: RiskFlag[] = [
    {
      severity: "medium",
      category: "timeline",
      description: "Tight timeline between financial close and construction (3 months)",
      recommendation: "Begin contractor engagement and permit applications immediately",
      relatedClause: "Milestones M1-M2",
    },
    {
      severity: "low",
      category: "reporting",
      description: "Quarterly reporting frequency may create administrative burden",
      recommendation: "Set up automated reporting systems and designate project coordinator",
    },
    {
      severity: "high",
      category: "financial",
      description: "Termination for cause could trigger full grant repayment ($2.5M exposure)",
      recommendation: "Ensure milestone contingency plans and maintain regular ARENA communication",
      relatedClause: "Section 15.2 - Termination and Consequences",
    },
  ];

  const keyObligations = [
    "Achieve all milestones by specified dates",
    "Maintain project expenditure records for 7 years",
    "Provide quarterly progress reports",
    "Obtain ARENA approval for any material project changes",
    "Acknowledge ARENA funding in public communications",
    "Allow ARENA site inspections upon reasonable notice",
    "Comply with all applicable laws and regulations",
  ];

  const specialConditions = [
    "Minimum 30% local content requirement for equipment procurement",
    "Mandatory knowledge sharing through ARENA Knowledge Bank",
    "First Nations consultation and employment targets",
    "Demonstration facility tour access for government and industry stakeholders",
  ];

  return {
    agreement,
    milestones,
    paymentTriggers,
    terminationClauses,
    reportingRequirements,
    riskFlags,
    keyObligations,
    specialConditions,
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export const grantDecoder = {
  decodeGrantAgreement,
  checkGrantCompliance,
  searchSimilarClauses,
};

export default grantDecoder;
