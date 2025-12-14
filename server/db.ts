import { eq, and, desc, asc, gte, lte, inArray, like, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, users,
  suppliers, InsertSupplier,
  buyers, InsertBuyer,
  feedstocks, InsertFeedstock,
  certificates, InsertCertificate,
  qualityTests, InsertQualityTest,
  inquiries, InsertInquiry,
  transactions, InsertTransaction,
  notifications, InsertNotification,
  savedSearches, InsertSavedSearch,
  savedAnalyses, InsertSavedAnalysis,
  auditLogs, InsertAuditLog,
  evidence, InsertEvidence,
  evidenceLinkages, InsertEvidenceLinkage,
  certificateSnapshots, InsertCertificateSnapshot,
  deliveryEvents, InsertDeliveryEvent,
  seasonalityProfiles, InsertSeasonalityProfile,
  climateExposure, InsertClimateExposure,
  yieldEstimates, InsertYieldEstimate,
  properties, InsertProperty,
  productionHistory, InsertProductionHistory,
  carbonPractices, InsertCarbonPractice,
  existingContracts, InsertExistingContract,
  marketplaceListings, InsertMarketplaceListing
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ============================================================================
// USER MANAGEMENT
// ============================================================================

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateUserRole(userId: number, role: "user" | "admin" | "supplier" | "buyer" | "auditor") {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ role }).where(eq(users.id, userId));
}

// ============================================================================
// SUPPLIERS
// ============================================================================

export async function createSupplier(supplier: InsertSupplier) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(suppliers).values(supplier);
  return Number((result as any).insertId);
}

export async function getSupplierByUserId(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(suppliers).where(eq(suppliers.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getSupplierById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(suppliers).where(eq(suppliers.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getSupplierByABN(abn: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(suppliers).where(eq(suppliers.abn, abn)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateSupplier(id: number, data: Partial<InsertSupplier>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(suppliers).set(data).where(eq(suppliers.id, id));
}

export async function getAllSuppliers(filters?: { verificationStatus?: string }) {
  const db = await getDb();
  if (!db) return [];
  
  const baseQuery = db.select().from(suppliers);
  const finalQuery = filters?.verificationStatus 
    ? baseQuery.where(eq(suppliers.verificationStatus, filters.verificationStatus as any))
    : baseQuery;
  
  return await finalQuery;
}

// ============================================================================
// BUYERS
// ============================================================================

export async function createBuyer(buyer: InsertBuyer) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(buyers).values(buyer);
  return Number((result as any).insertId);
}

export async function getBuyerByUserId(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(buyers).where(eq(buyers.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getBuyerById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(buyers).where(eq(buyers.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateBuyer(id: number, data: Partial<InsertBuyer>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(buyers).set(data).where(eq(buyers.id, id));
}

// ============================================================================
// FEEDSTOCKS
// ============================================================================

export async function createFeedstock(feedstock: InsertFeedstock) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(feedstocks).values(feedstock);
  return Number((result as any).insertId);
}

export async function getFeedstockById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(feedstocks).where(eq(feedstocks.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getFeedstockByAbfiId(abfiId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(feedstocks).where(eq(feedstocks.abfiId, abfiId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getFeedstocksBySupplierId(supplierId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(feedstocks).where(eq(feedstocks.supplierId, supplierId));
}

export async function updateFeedstock(id: number, data: Partial<InsertFeedstock>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(feedstocks).set(data).where(eq(feedstocks.id, id));
}

export async function searchFeedstocks(filters: {
  category?: string[];
  type?: string[];
  state?: string[];
  minAbfiScore?: number;
  maxCarbonIntensity?: number;
  status?: string;
  limit?: number;
  offset?: number;
}) {
  const db = await getDb();
  if (!db) return [];
  
  const conditions = [];
  
  if (filters.category && filters.category.length > 0) {
    conditions.push(inArray(feedstocks.category, filters.category as any));
  }
  
  if (filters.state && filters.state.length > 0) {
    conditions.push(inArray(feedstocks.state, filters.state as any));
  }
  
  if (filters.minAbfiScore !== undefined) {
    conditions.push(gte(feedstocks.abfiScore, filters.minAbfiScore));
  }
  
  if (filters.maxCarbonIntensity !== undefined) {
    conditions.push(lte(feedstocks.carbonIntensityValue, filters.maxCarbonIntensity));
  }
  
  if (filters.status) {
    conditions.push(eq(feedstocks.status, filters.status as any));
  } else {
    // Default to active only
    conditions.push(eq(feedstocks.status, "active"));
  }
  
  const baseQuery = db.select().from(feedstocks);
  const whereQuery = conditions.length > 0 ? baseQuery.where(and(...conditions)) : baseQuery;
  const orderedQuery = whereQuery.orderBy(desc(feedstocks.abfiScore));
  const limitedQuery = filters.limit ? orderedQuery.limit(filters.limit) : orderedQuery;
  const finalQuery = filters.offset ? limitedQuery.offset(filters.offset) : limitedQuery;
  
  return await finalQuery;
}

// ============================================================================
// CERTIFICATES
// ============================================================================

export async function createCertificate(certificate: InsertCertificate) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(certificates).values(certificate);
  return Number((result as any).insertId);
}

export async function getCertificatesByFeedstockId(feedstockId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(certificates).where(eq(certificates.feedstockId, feedstockId));
}

export async function updateCertificate(id: number, data: Partial<InsertCertificate>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(certificates).set(data).where(eq(certificates.id, id));
}

export async function getExpiringCertificates(daysAhead: number) {
  const db = await getDb();
  if (!db) return [];
  
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + daysAhead);
  
  return await db.select().from(certificates)
    .where(and(
      eq(certificates.status, "active"),
      lte(certificates.expiryDate, futureDate)
    ));
}

// ============================================================================
// QUALITY TESTS
// ============================================================================

export async function createQualityTest(test: InsertQualityTest) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(qualityTests).values(test);
  return Number((result as any).insertId);
}

export async function getQualityTestsByFeedstockId(feedstockId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(qualityTests)
    .where(eq(qualityTests.feedstockId, feedstockId))
    .orderBy(desc(qualityTests.testDate));
}

// ============================================================================
// INQUIRIES
// ============================================================================

export async function createInquiry(inquiry: InsertInquiry) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(inquiries).values(inquiry);
  return Number((result as any).insertId);
}

export async function getInquiryById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(inquiries).where(eq(inquiries.id, id)).limit(1);
  return result[0];
}

export async function getInquiriesByBuyerId(buyerId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(inquiries)
    .where(eq(inquiries.buyerId, buyerId))
    .orderBy(desc(inquiries.createdAt));
}

export async function getInquiriesBySupplierId(supplierId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(inquiries)
    .where(eq(inquiries.supplierId, supplierId))
    .orderBy(desc(inquiries.createdAt));
}

export async function updateInquiry(id: number, data: Partial<InsertInquiry>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(inquiries).set(data).where(eq(inquiries.id, id));
}

// ============================================================================
// TRANSACTIONS
// ============================================================================

export async function createTransaction(transaction: InsertTransaction) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(transactions).values(transaction);
  return Number((result as any).insertId);
}

export async function getTransactionsBySupplierId(supplierId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(transactions)
    .where(eq(transactions.supplierId, supplierId))
    .orderBy(desc(transactions.createdAt));
}

export async function getTransactionsByBuyerId(buyerId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(transactions)
    .where(eq(transactions.buyerId, buyerId))
    .orderBy(desc(transactions.createdAt));
}

export async function updateTransaction(id: number, data: Partial<InsertTransaction>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(transactions).set(data).where(eq(transactions.id, id));
}

// ============================================================================
// NOTIFICATIONS
// ============================================================================

export async function createNotification(notification: InsertNotification) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(notifications).values(notification);
  return Number((result as any).insertId);
}

export async function getNotificationsByUserId(userId: number, unreadOnly: boolean = false) {
  const db = await getDb();
  if (!db) return [];
  
  const conditions = [eq(notifications.userId, userId)];
  if (unreadOnly) {
    conditions.push(eq(notifications.read, false));
  }
  
  return await db.select().from(notifications)
    .where(and(...conditions))
    .orderBy(desc(notifications.createdAt))
    .limit(50);
}

export async function markNotificationAsRead(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(notifications).set({ read: true, readAt: new Date() }).where(eq(notifications.id, id));
}

export async function markAllNotificationsAsRead(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(notifications).set({ read: true, readAt: new Date() }).where(eq(notifications.userId, userId));
}

// ============================================================================
// SAVED SEARCHES
// ============================================================================

export async function createSavedSearch(search: InsertSavedSearch) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(savedSearches).values(search);
  return Number((result as any).insertId);
}

export async function getSavedSearchesByBuyerId(buyerId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(savedSearches)
    .where(eq(savedSearches.buyerId, buyerId))
    .orderBy(desc(savedSearches.createdAt));
}

export async function deleteSavedSearch(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(savedSearches).where(eq(savedSearches.id, id));
}

// ============================================================================
// SAVED ANALYSES (Feedstock Map)
// ============================================================================

export async function createSavedAnalysis(analysis: InsertSavedAnalysis) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(savedAnalyses).values(analysis);
  return Number((result as any).insertId);
}

export async function getSavedAnalysesByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(savedAnalyses)
    .where(eq(savedAnalyses.userId, userId))
    .orderBy(desc(savedAnalyses.createdAt));
}

export async function getSavedAnalysisById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const results = await db.select().from(savedAnalyses)
    .where(eq(savedAnalyses.id, id))
    .limit(1);
  return results[0] || null;
}

export async function updateSavedAnalysis(id: number, updates: Partial<InsertSavedAnalysis>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(savedAnalyses)
    .set(updates)
    .where(eq(savedAnalyses.id, id));
}

export async function deleteSavedAnalysis(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(savedAnalyses).where(eq(savedAnalyses.id, id));
}

// ============================================================================
// AUDIT LOGS
// ============================================================================

export async function createAuditLog(log: InsertAuditLog) {
  const db = await getDb();
  if (!db) return;
  try {
    await db.insert(auditLogs).values(log);
  } catch (error) {
    console.error("[Audit] Failed to create log:", error);
  }
}

export async function getAuditLogs(filters?: {
  userId?: number;
  entityType?: string;
  entityId?: number;
  limit?: number;
}) {
  const db = await getDb();
  if (!db) return [];
  
  const conditions = [];
  
  if (filters?.userId) {
    conditions.push(eq(auditLogs.userId, filters.userId));
  }
  
  if (filters?.entityType) {
    conditions.push(eq(auditLogs.entityType, filters.entityType));
  }
  
  if (filters?.entityId) {
    conditions.push(eq(auditLogs.entityId, filters.entityId));
  }
  
  const baseQuery = db.select().from(auditLogs);
  const whereQuery = conditions.length > 0 ? baseQuery.where(and(...conditions)) : baseQuery;
  const orderedQuery = whereQuery.orderBy(desc(auditLogs.createdAt));
  const limitValue = filters?.limit || 100;
  const finalQuery = orderedQuery.limit(limitValue);
  
  return await finalQuery;
}

// ============================================================================
// ANALYTICS & STATS
// ============================================================================

export async function getSupplierStats(supplierId: number) {
  const db = await getDb();
  if (!db) return null;
  
  const feedstockCount = await db.select({ count: sql<number>`count(*)` })
    .from(feedstocks)
    .where(eq(feedstocks.supplierId, supplierId));
  
  const inquiryCount = await db.select({ count: sql<number>`count(*)` })
    .from(inquiries)
    .where(eq(inquiries.supplierId, supplierId));
  
  const transactionCount = await db.select({ count: sql<number>`count(*)` })
    .from(transactions)
    .where(eq(transactions.supplierId, supplierId));
  
  return {
    feedstockCount: feedstockCount[0]?.count || 0,
    inquiryCount: inquiryCount[0]?.count || 0,
    transactionCount: transactionCount[0]?.count || 0,
  };
}

export async function getPlatformStats() {
  const db = await getDb();
  if (!db) return null;
  
  const supplierCount = await db.select({ count: sql<number>`count(*)` }).from(suppliers);
  const buyerCount = await db.select({ count: sql<number>`count(*)` }).from(buyers);
  const feedstockCount = await db.select({ count: sql<number>`count(*)` }).from(feedstocks);
  const inquiryCount = await db.select({ count: sql<number>`count(*)` }).from(inquiries);
  const transactionCount = await db.select({ count: sql<number>`count(*)` }).from(transactions);
  
  return {
    supplierCount: supplierCount[0]?.count || 0,
    buyerCount: buyerCount[0]?.count || 0,
    feedstockCount: feedstockCount[0]?.count || 0,
    inquiryCount: inquiryCount[0]?.count || 0,
    transactionCount: transactionCount[0]?.count || 0,
  };
}


// ============================================================================
// BANKABILITY MODULE
// ============================================================================

import {
  projects, InsertProject,
  supplyAgreements, InsertSupplyAgreement,
  growerQualifications, InsertGrowerQualification,
  bankabilityAssessments, InsertBankabilityAssessment,
  lenderAccess, InsertLenderAccess,
  covenantMonitoring, InsertCovenantMonitoring
} from "../drizzle/schema";

// Projects
export async function createProject(project: InsertProject): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(projects).values(project);
  return Number(result[0].insertId);
}

export async function getProjectById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
  return result[0];
}

export async function getProjectsByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(projects).where(eq(projects.userId, userId));
}

export async function updateProject(id: number, updates: Partial<InsertProject>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(projects).set(updates).where(eq(projects.id, id));
}

// Supply Agreements
export async function createSupplyAgreement(agreement: InsertSupplyAgreement): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(supplyAgreements).values(agreement);
  return Number(result[0].insertId);
}

export async function getSupplyAgreementById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(supplyAgreements).where(eq(supplyAgreements.id, id)).limit(1);
  return result[0];
}

export async function getSupplyAgreementsByProjectId(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const agreements = await db.select().from(supplyAgreements).where(eq(supplyAgreements.projectId, projectId));
  
  // Fetch supplier information for each agreement
  const agreementsWithSuppliers = await Promise.all(
    agreements.map(async (agreement) => {
      const supplier = await db.select().from(suppliers).where(eq(suppliers.id, agreement.supplierId)).limit(1);
      return {
        ...agreement,
        supplier: supplier[0] || null,
      };
    })
  );
  
  return agreementsWithSuppliers;
}

export async function updateSupplyAgreement(id: number, updates: Partial<InsertSupplyAgreement>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(supplyAgreements).set(updates).where(eq(supplyAgreements.id, id));
}

// Grower Qualifications
export async function createGrowerQualification(qualification: InsertGrowerQualification): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(growerQualifications).values(qualification);
  return Number(result[0].insertId);
}

export async function getGrowerQualificationById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(growerQualifications).where(eq(growerQualifications.id, id)).limit(1);
  return result[0];
}

export async function getGrowerQualificationsBySupplierId(supplierId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(growerQualifications).where(eq(growerQualifications.supplierId, supplierId));
}

export async function updateGrowerQualification(id: number, updates: Partial<InsertGrowerQualification>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(growerQualifications).set(updates).where(eq(growerQualifications.id, id));
}

// Bankability Assessments
export async function createBankabilityAssessment(assessment: InsertBankabilityAssessment): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(bankabilityAssessments).values(assessment);
  return Number(result[0].insertId);
}

export async function getBankabilityAssessmentById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(bankabilityAssessments).where(eq(bankabilityAssessments.id, id)).limit(1);
  return result[0];
}

export async function getBankabilityAssessmentsByProjectId(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(bankabilityAssessments)
    .where(eq(bankabilityAssessments.projectId, projectId))
    .orderBy(desc(bankabilityAssessments.createdAt));
}

export async function getLatestBankabilityAssessment(projectId: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(bankabilityAssessments)
    .where(eq(bankabilityAssessments.projectId, projectId))
    .orderBy(desc(bankabilityAssessments.createdAt))
    .limit(1);
  
  return result[0];
}

export async function updateBankabilityAssessment(id: number, updates: Partial<InsertBankabilityAssessment>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(bankabilityAssessments).set(updates).where(eq(bankabilityAssessments.id, id));
}

// Lender Access
export async function createLenderAccess(access: InsertLenderAccess): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(lenderAccess).values(access);
  return Number(result[0].insertId);
}

export async function getLenderAccessByProjectId(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(lenderAccess).where(eq(lenderAccess.projectId, projectId));
}

export async function getLenderAccessByGrantedBy(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(lenderAccess).where(eq(lenderAccess.grantedBy, userId));
}

export async function updateLenderAccess(id: number, updates: Partial<InsertLenderAccess>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(lenderAccess).set(updates).where(eq(lenderAccess.id, id));
}

// Covenant Monitoring
export async function createCovenantMonitoring(monitoring: InsertCovenantMonitoring): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(covenantMonitoring).values(monitoring);
  return Number(result[0].insertId);
}

export async function getCovenantMonitoringByProjectId(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(covenantMonitoring)
    .where(eq(covenantMonitoring.projectId, projectId))
    .orderBy(desc(covenantMonitoring.createdAt));
}

export async function updateCovenantMonitoring(id: number, updates: Partial<InsertCovenantMonitoring>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(covenantMonitoring).set(updates).where(eq(covenantMonitoring.id, id));
}

// ============================================================================
// EVIDENCE CHAIN & DATA PROVENANCE
// ============================================================================

export async function createEvidence(evidenceData: InsertEvidence): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(evidence).values(evidenceData);
  return Number(result[0].insertId);
}

export async function getEvidenceById(id: number) {
  const db = await getDb();
  if (!db) return null;
  
  const results = await db.select().from(evidence).where(eq(evidence.id, id));
  return results[0] || null;
}

export async function getEvidenceByHash(fileHash: string) {
  const db = await getDb();
  if (!db) return null;
  
  const results = await db.select().from(evidence).where(eq(evidence.fileHash, fileHash));
  return results[0] || null;
}

export async function getEvidenceByStatus(status: any) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(evidence)
    .where(eq(evidence.status, status))
    .orderBy(desc(evidence.createdAt));
}

export async function getEvidenceByType(type: any) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(evidence)
    .where(eq(evidence.type, type))
    .orderBy(desc(evidence.createdAt));
}

export async function getExpiringEvidence(daysAhead: number = 30) {
  const db = await getDb();
  if (!db) return [];
  
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + daysAhead);
  
  return await db.select().from(evidence)
    .where(
      and(
        eq(evidence.status, "valid"),
        lte(evidence.expiryDate, futureDate)
      )
    )
    .orderBy(evidence.expiryDate);
}

export async function updateEvidence(id: number, updates: Partial<InsertEvidence>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(evidence).set(updates).where(eq(evidence.id, id));
}

export async function supersedeEvidence(oldEvidenceId: number, newEvidenceId: number, reason: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(evidence).set({
    status: "superseded",
    supersededById: newEvidenceId,
    supersessionReason: reason,
  }).where(eq(evidence.id, oldEvidenceId));
}

// Evidence Linkages
export async function createEvidenceLinkage(linkage: InsertEvidenceLinkage): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(evidenceLinkages).values(linkage);
  return Number(result[0].insertId);
}

export async function getEvidenceLinkagesByEvidence(evidenceId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(evidenceLinkages)
    .where(eq(evidenceLinkages.evidenceId, evidenceId));
}

export async function getEvidenceLinkagesByEntity(entityType: any, entityId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select({
    linkage: evidenceLinkages,
    evidence: evidence,
  })
  .from(evidenceLinkages)
  .leftJoin(evidence, eq(evidenceLinkages.evidenceId, evidence.id))
  .where(
    and(
      eq(evidenceLinkages.linkedEntityType, entityType),
      eq(evidenceLinkages.linkedEntityId, entityId)
    )
  );
}

export async function deleteEvidenceLinkage(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(evidenceLinkages).where(eq(evidenceLinkages.id, id));
}

// Certificate Snapshots
export async function createCertificateSnapshot(snapshot: InsertCertificateSnapshot): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(certificateSnapshots).values(snapshot);
  return Number(result[0].insertId);
}

export async function getCertificateSnapshotById(id: number) {
  const db = await getDb();
  if (!db) return null;
  
  const results = await db.select().from(certificateSnapshots)
    .where(eq(certificateSnapshots.id, id));
  return results[0] || null;
}

export async function getCertificateSnapshotsByCertificate(certificateId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(certificateSnapshots)
    .where(eq(certificateSnapshots.certificateId, certificateId))
    .orderBy(desc(certificateSnapshots.snapshotDate));
}

export async function getCertificateSnapshotByHash(snapshotHash: string) {
  const db = await getDb();
  if (!db) return null;
  
  const results = await db.select().from(certificateSnapshots)
    .where(eq(certificateSnapshots.snapshotHash, snapshotHash));
  return results[0] || null;
}

// ============================================================================
// PHYSICAL REALITY & SUPPLY RISK (Phase 3)
// ============================================================================

/**
 * Delivery Events
 */
export async function createDeliveryEvent(data: InsertDeliveryEvent) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(deliveryEvents).values(data);
  return Number(result[0].insertId);
}

export async function getDeliveryEventsByAgreement(agreementId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db
    .select()
    .from(deliveryEvents)
    .where(eq(deliveryEvents.agreementId, agreementId))
    .orderBy(desc(deliveryEvents.scheduledDate));
}

export async function getDeliveryPerformanceMetrics(agreementId: number) {
  const db = await getDb();
  if (!db) return null;
  
  const events = await db
    .select()
    .from(deliveryEvents)
    .where(
      and(
        eq(deliveryEvents.agreementId, agreementId),
        eq(deliveryEvents.status, "delivered")
      )
    );
  
  if (events.length === 0) return null;
  
  const totalCommitted = events.reduce((sum, e) => sum + (e.committedVolume || 0), 0);
  const totalActual = events.reduce((sum, e) => sum + (e.actualVolume || 0), 0);
  const onTimeCount = events.filter(e => e.onTime).length;
  const qualityMetCount = events.filter(e => e.qualityMet).length;
  
  return {
    totalEvents: events.length,
    fillRate: totalCommitted > 0 ? (totalActual / totalCommitted) * 100 : 0,
    onTimePercent: (onTimeCount / events.length) * 100,
    qualityMetPercent: (qualityMetCount / events.length) * 100,
    totalCommitted,
    totalActual,
    variance: totalActual - totalCommitted,
    variancePercent: totalCommitted > 0 ? ((totalActual - totalCommitted) / totalCommitted) * 100 : 0,
  };
}

/**
 * Seasonality Profiles
 */
export async function createSeasonalityProfile(data: InsertSeasonalityProfile) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(seasonalityProfiles).values(data);
  return Number(result[0].insertId);
}

export async function getSeasonalityByFeedstock(feedstockId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db
    .select()
    .from(seasonalityProfiles)
    .where(eq(seasonalityProfiles.feedstockId, feedstockId))
    .orderBy(seasonalityProfiles.month);
}

/**
 * Climate Exposure
 */
export async function createClimateExposure(data: InsertClimateExposure) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(climateExposure).values(data);
  return Number(result[0].insertId);
}

export async function getClimateExposureBySupplier(supplierId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db
    .select()
    .from(climateExposure)
    .where(eq(climateExposure.supplierId, supplierId))
    .orderBy(desc(climateExposure.riskLevel));
}

export async function getClimateExposureByFeedstock(feedstockId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db
    .select()
    .from(climateExposure)
    .where(eq(climateExposure.feedstockId, feedstockId))
    .orderBy(desc(climateExposure.riskLevel));
}

/**
 * Yield Estimates
 */
export async function createYieldEstimate(data: InsertYieldEstimate) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(yieldEstimates).values(data);
  return Number(result[0].insertId);
}

export async function getYieldEstimatesByFeedstock(feedstockId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db
    .select()
    .from(yieldEstimates)
    .where(eq(yieldEstimates.feedstockId, feedstockId))
    .orderBy(desc(yieldEstimates.year));
}

export async function getLatestYieldEstimate(feedstockId: number) {
  const db = await getDb();
  if (!db) return null;
  
  const results = await db
    .select()
    .from(yieldEstimates)
    .where(eq(yieldEstimates.feedstockId, feedstockId))
    .orderBy(desc(yieldEstimates.year))
    .limit(1);
  
  return results[0] || null;
}


// ============================================================================
// PRODUCER REGISTRATION
// ============================================================================

export async function createProperty(property: Omit<InsertProperty, 'id' | 'createdAt' | 'updatedAt'>): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  const result = await db.insert(properties).values(property);
  return result[0].insertId;
}

export async function createProductionHistory(history: Omit<InsertProductionHistory, 'id' | 'createdAt'>): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  const result = await db.insert(productionHistory).values(history);
  return result[0].insertId;
}

export async function createCarbonPractice(practice: Omit<InsertCarbonPractice, 'id' | 'createdAt' | 'updatedAt'>): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  const result = await db.insert(carbonPractices).values(practice);
  return result[0].insertId;
}

export async function createExistingContract(contract: Omit<InsertExistingContract, 'id' | 'createdAt'>): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  const result = await db.insert(existingContracts).values(contract);
  return result[0].insertId;
}

export async function createMarketplaceListing(listing: Omit<InsertMarketplaceListing, 'id' | 'createdAt' | 'updatedAt'>): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  const result = await db.insert(marketplaceListings).values(listing);
  return result[0].insertId;
}

export async function getPropertiesBySupplier(supplierId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db
    .select()
    .from(properties)
    .where(eq(properties.supplierId, supplierId));
}

export async function getProductionHistoryByProperty(propertyId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db
    .select()
    .from(productionHistory)
    .where(eq(productionHistory.propertyId, propertyId))
    .orderBy(desc(productionHistory.seasonYear));
}
