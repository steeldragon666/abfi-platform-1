import {
  eq,
  and,
  desc,
  asc,
  gte,
  lte,
  inArray,
  like,
  sql,
  or,
  isNull,
  isNotNull,
} from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  users,
  suppliers,
  InsertSupplier,
  buyers,
  InsertBuyer,
  feedstocks,
  InsertFeedstock,
  certificates,
  InsertCertificate,
  qualityTests,
  InsertQualityTest,
  inquiries,
  InsertInquiry,
  transactions,
  InsertTransaction,
  notifications,
  InsertNotification,
  savedSearches,
  InsertSavedSearch,
  savedAnalyses,
  InsertSavedAnalysis,
  auditLogs,
  InsertAuditLog,
  evidence,
  InsertEvidence,
  evidenceLinkages,
  InsertEvidenceLinkage,
  certificateSnapshots,
  InsertCertificateSnapshot,
  deliveryEvents,
  InsertDeliveryEvent,
  seasonalityProfiles,
  InsertSeasonalityProfile,
  climateExposure,
  InsertClimateExposure,
  yieldEstimates,
  InsertYieldEstimate,
  properties,
  InsertProperty,
  productionHistory,
  InsertProductionHistory,
  carbonPractices,
  InsertCarbonPractice,
  existingContracts,
  InsertExistingContract,
  marketplaceListings,
  InsertMarketplaceListing,
  financialInstitutions,
  InsertFinancialInstitution,
  demandSignals,
  InsertDemandSignal,
  supplierResponses,
  InsertSupplierResponse,
  platformTransactions,
  InsertPlatformTransaction,
  feedstockFutures,
  InsertFeedstockFutures,
  futuresYieldProjections,
  InsertFuturesYieldProjection,
  futuresEOI,
  InsertFuturesEOI,
  // RSIE Tables
  dataSources,
  InsertDataSource,
  ingestionRuns,
  InsertIngestionRun,
  riskEvents,
  InsertRiskEvent,
  supplierSites,
  InsertSupplierSite,
  supplierRiskExposure,
  InsertSupplierRiskExposure,
  contractRiskExposure,
  InsertContractRiskExposure,
  weatherGridDaily,
  InsertWeatherGridDaily,
  forecastGridHourly,
  InsertForecastGridHourly,
  userFeedback,
  InsertUserFeedback,
  intelligenceItems,
  InsertIntelligenceItem,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

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
      values.role = "admin";
      updateSet.role = "admin";
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
  const result = await db
    .select()
    .from(users)
    .where(eq(users.openId, openId))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateUserRole(
  userId: number,
  role: "user" | "admin" | "supplier" | "buyer" | "auditor"
) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ role }).where(eq(users.id, userId));
}

export async function getAllUsers() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(users).orderBy(desc(users.createdAt));
}

export async function updateUser(userId: number, updates: Partial<InsertUser>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(users).set(updates).where(eq(users.id, userId));
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
  const result = await db
    .select()
    .from(suppliers)
    .where(eq(suppliers.userId, userId))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getSupplierById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(suppliers)
    .where(eq(suppliers.id, id))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getSupplierByABN(abn: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(suppliers)
    .where(eq(suppliers.abn, abn))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateSupplier(
  id: number,
  data: Partial<InsertSupplier>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(suppliers).set(data).where(eq(suppliers.id, id));
}

export async function getAllSuppliers(filters?: {
  verificationStatus?: string;
}) {
  const db = await getDb();
  if (!db) return [];

  const baseQuery = db.select().from(suppliers);
  const finalQuery = filters?.verificationStatus
    ? baseQuery.where(
        eq(suppliers.verificationStatus, filters.verificationStatus as any)
      )
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
  const result = await db
    .select()
    .from(buyers)
    .where(eq(buyers.userId, userId))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getBuyerById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(buyers)
    .where(eq(buyers.id, id))
    .limit(1);
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
  const result = await db
    .select()
    .from(feedstocks)
    .where(eq(feedstocks.id, id))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getFeedstockByAbfiId(abfiId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(feedstocks)
    .where(eq(feedstocks.abfiId, abfiId))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getFeedstocksBySupplierId(supplierId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(feedstocks)
    .where(eq(feedstocks.supplierId, supplierId));
}

export async function updateFeedstock(
  id: number,
  data: Partial<InsertFeedstock>
) {
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
    conditions.push(
      lte(feedstocks.carbonIntensityValue, filters.maxCarbonIntensity)
    );
  }

  if (filters.status) {
    conditions.push(eq(feedstocks.status, filters.status as any));
  } else {
    // Default to active only
    conditions.push(eq(feedstocks.status, "active"));
  }

  const baseQuery = db.select().from(feedstocks);
  const whereQuery =
    conditions.length > 0 ? baseQuery.where(and(...conditions)) : baseQuery;
  const orderedQuery = whereQuery.orderBy(desc(feedstocks.abfiScore));
  const limitedQuery = filters.limit
    ? orderedQuery.limit(filters.limit)
    : orderedQuery;
  const finalQuery = filters.offset
    ? limitedQuery.offset(filters.offset)
    : limitedQuery;

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
  return await db
    .select()
    .from(certificates)
    .where(eq(certificates.feedstockId, feedstockId));
}

export async function updateCertificate(
  id: number,
  data: Partial<InsertCertificate>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(certificates).set(data).where(eq(certificates.id, id));
}

export async function getExpiringCertificates(daysAhead: number) {
  const db = await getDb();
  if (!db) return [];

  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + daysAhead);

  return await db
    .select()
    .from(certificates)
    .where(
      and(
        eq(certificates.status, "active"),
        lte(certificates.expiryDate, futureDate)
      )
    );
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
  return await db
    .select()
    .from(qualityTests)
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
  const result = await db
    .select()
    .from(inquiries)
    .where(eq(inquiries.id, id))
    .limit(1);
  return result[0];
}

export async function getInquiriesByBuyerId(buyerId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(inquiries)
    .where(eq(inquiries.buyerId, buyerId))
    .orderBy(desc(inquiries.createdAt));
}

export async function getInquiriesBySupplierId(supplierId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(inquiries)
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
  return await db
    .select()
    .from(transactions)
    .where(eq(transactions.supplierId, supplierId))
    .orderBy(desc(transactions.createdAt));
}

export async function getTransactionsByBuyerId(buyerId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(transactions)
    .where(eq(transactions.buyerId, buyerId))
    .orderBy(desc(transactions.createdAt));
}

export async function updateTransaction(
  id: number,
  data: Partial<InsertTransaction>
) {
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

export async function getNotificationsByUserId(
  userId: number,
  unreadOnly: boolean = false
) {
  const db = await getDb();
  if (!db) return [];

  const conditions = [eq(notifications.userId, userId)];
  if (unreadOnly) {
    conditions.push(eq(notifications.read, false));
  }

  return await db
    .select()
    .from(notifications)
    .where(and(...conditions))
    .orderBy(desc(notifications.createdAt))
    .limit(50);
}

export async function markNotificationAsRead(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .update(notifications)
    .set({ read: true, readAt: new Date() })
    .where(eq(notifications.id, id));
}

export async function markAllNotificationsAsRead(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .update(notifications)
    .set({ read: true, readAt: new Date() })
    .where(eq(notifications.userId, userId));
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
  return await db
    .select()
    .from(savedSearches)
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
  return await db
    .select()
    .from(savedAnalyses)
    .where(eq(savedAnalyses.userId, userId))
    .orderBy(desc(savedAnalyses.createdAt));
}

export async function getSavedAnalysisById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const results = await db
    .select()
    .from(savedAnalyses)
    .where(eq(savedAnalyses.id, id))
    .limit(1);
  return results[0] || null;
}

export async function updateSavedAnalysis(
  id: number,
  updates: Partial<InsertSavedAnalysis>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(savedAnalyses).set(updates).where(eq(savedAnalyses.id, id));
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
  const whereQuery =
    conditions.length > 0 ? baseQuery.where(and(...conditions)) : baseQuery;
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

  const feedstockCount = await db
    .select({ count: sql<number>`count(*)` })
    .from(feedstocks)
    .where(eq(feedstocks.supplierId, supplierId));

  const inquiryCount = await db
    .select({ count: sql<number>`count(*)` })
    .from(inquiries)
    .where(eq(inquiries.supplierId, supplierId));

  const transactionCount = await db
    .select({ count: sql<number>`count(*)` })
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

  const supplierCount = await db
    .select({ count: sql<number>`count(*)` })
    .from(suppliers);
  const buyerCount = await db
    .select({ count: sql<number>`count(*)` })
    .from(buyers);
  const feedstockCount = await db
    .select({ count: sql<number>`count(*)` })
    .from(feedstocks);
  const inquiryCount = await db
    .select({ count: sql<number>`count(*)` })
    .from(inquiries);
  const transactionCount = await db
    .select({ count: sql<number>`count(*)` })
    .from(transactions);

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
  projects,
  InsertProject,
  supplyAgreements,
  InsertSupplyAgreement,
  growerQualifications,
  InsertGrowerQualification,
  bankabilityAssessments,
  InsertBankabilityAssessment,
  lenderAccess,
  InsertLenderAccess,
  covenantMonitoring,
  InsertCovenantMonitoring,
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

  const result = await db
    .select()
    .from(projects)
    .where(eq(projects.id, id))
    .limit(1);
  return result[0];
}

export async function getProjectsByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(projects).where(eq(projects.userId, userId));
}

export async function updateProject(
  id: number,
  updates: Partial<InsertProject>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(projects).set(updates).where(eq(projects.id, id));
}

// Supply Agreements
export async function createSupplyAgreement(
  agreement: InsertSupplyAgreement
): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(supplyAgreements).values(agreement);
  return Number(result[0].insertId);
}

export async function getSupplyAgreementById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(supplyAgreements)
    .where(eq(supplyAgreements.id, id))
    .limit(1);
  return result[0];
}

export async function getSupplyAgreementsByProjectId(projectId: number) {
  const db = await getDb();
  if (!db) return [];

  const agreements = await db
    .select()
    .from(supplyAgreements)
    .where(eq(supplyAgreements.projectId, projectId));

  // Fetch supplier information for each agreement
  const agreementsWithSuppliers = await Promise.all(
    agreements.map(async agreement => {
      const supplier = await db
        .select()
        .from(suppliers)
        .where(eq(suppliers.id, agreement.supplierId))
        .limit(1);
      return {
        ...agreement,
        supplier: supplier[0] || null,
      };
    })
  );

  return agreementsWithSuppliers;
}

export async function updateSupplyAgreement(
  id: number,
  updates: Partial<InsertSupplyAgreement>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(supplyAgreements)
    .set(updates)
    .where(eq(supplyAgreements.id, id));
}

// Grower Qualifications
export async function createGrowerQualification(
  qualification: InsertGrowerQualification
): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(growerQualifications).values(qualification);
  return Number(result[0].insertId);
}

export async function getGrowerQualificationById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(growerQualifications)
    .where(eq(growerQualifications.id, id))
    .limit(1);
  return result[0];
}

export async function getGrowerQualificationsBySupplierId(supplierId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(growerQualifications)
    .where(eq(growerQualifications.supplierId, supplierId));
}

export async function updateGrowerQualification(
  id: number,
  updates: Partial<InsertGrowerQualification>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(growerQualifications)
    .set(updates)
    .where(eq(growerQualifications.id, id));
}

// Bankability Assessments
export async function createBankabilityAssessment(
  assessment: InsertBankabilityAssessment
): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(bankabilityAssessments).values(assessment);
  return Number(result[0].insertId);
}

export async function getBankabilityAssessmentById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(bankabilityAssessments)
    .where(eq(bankabilityAssessments.id, id))
    .limit(1);
  return result[0];
}

export async function getBankabilityAssessmentsByProjectId(projectId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(bankabilityAssessments)
    .where(eq(bankabilityAssessments.projectId, projectId))
    .orderBy(desc(bankabilityAssessments.createdAt));
}

export async function getLatestBankabilityAssessment(projectId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(bankabilityAssessments)
    .where(eq(bankabilityAssessments.projectId, projectId))
    .orderBy(desc(bankabilityAssessments.createdAt))
    .limit(1);

  return result[0];
}

export async function updateBankabilityAssessment(
  id: number,
  updates: Partial<InsertBankabilityAssessment>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(bankabilityAssessments)
    .set(updates)
    .where(eq(bankabilityAssessments.id, id));
}

export async function getAllBankabilityAssessments() {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(bankabilityAssessments)
    .orderBy(desc(bankabilityAssessments.createdAt));
}

// Lender Access
export async function createLenderAccess(
  access: InsertLenderAccess
): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(lenderAccess).values(access);
  return Number(result[0].insertId);
}

export async function getLenderAccessByProjectId(projectId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(lenderAccess)
    .where(eq(lenderAccess.projectId, projectId));
}

export async function getLenderAccessByGrantedBy(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(lenderAccess)
    .where(eq(lenderAccess.grantedBy, userId));
}

export async function getLenderAccessByEmail(email: string) {
  const db = await getDb();
  if (!db) return [];

  const now = new Date();
  return await db
    .select()
    .from(lenderAccess)
    .where(
      and(
        eq(lenderAccess.lenderEmail, email),
        lte(lenderAccess.validFrom, now),
        gte(lenderAccess.validUntil, now)
      )
    );
}

export async function getProjectsForLender(email: string) {
  const db = await getDb();
  if (!db) return [];

  const now = new Date();
  // Get all active lender access records for this email
  const accessRecords = await db
    .select()
    .from(lenderAccess)
    .where(
      and(
        eq(lenderAccess.lenderEmail, email),
        lte(lenderAccess.validFrom, now),
        gte(lenderAccess.validUntil, now)
      )
    );

  if (accessRecords.length === 0) return [];

  // Get projects for each access record
  const projectIds = accessRecords.map(a => a.projectId);
  const projectResults = await db
    .select()
    .from(projects)
    .where(inArray(projects.id, projectIds));

  return projectResults;
}

export async function updateLenderAccess(
  id: number,
  updates: Partial<InsertLenderAccess>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(lenderAccess).set(updates).where(eq(lenderAccess.id, id));
}

// Covenant Monitoring
export async function createCovenantMonitoring(
  monitoring: InsertCovenantMonitoring
): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(covenantMonitoring).values(monitoring);
  return Number(result[0].insertId);
}

export async function getCovenantMonitoringByProjectId(projectId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(covenantMonitoring)
    .where(eq(covenantMonitoring.projectId, projectId))
    .orderBy(desc(covenantMonitoring.createdAt));
}

export async function updateCovenantMonitoring(
  id: number,
  updates: Partial<InsertCovenantMonitoring>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(covenantMonitoring)
    .set(updates)
    .where(eq(covenantMonitoring.id, id));
}

// ============================================================================
// EVIDENCE CHAIN & DATA PROVENANCE
// ============================================================================

export async function createEvidence(
  evidenceData: InsertEvidence
): Promise<number> {
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

  const results = await db
    .select()
    .from(evidence)
    .where(eq(evidence.fileHash, fileHash));
  return results[0] || null;
}

export async function getEvidenceByStatus(status: any) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(evidence)
    .where(eq(evidence.status, status))
    .orderBy(desc(evidence.createdAt));
}

export async function getEvidenceByType(type: any) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(evidence)
    .where(eq(evidence.type, type))
    .orderBy(desc(evidence.createdAt));
}

export async function getExpiringEvidence(daysAhead: number = 30) {
  const db = await getDb();
  if (!db) return [];

  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + daysAhead);

  return await db
    .select()
    .from(evidence)
    .where(
      and(eq(evidence.status, "valid"), lte(evidence.expiryDate, futureDate))
    )
    .orderBy(evidence.expiryDate);
}

export async function updateEvidence(
  id: number,
  updates: Partial<InsertEvidence>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(evidence).set(updates).where(eq(evidence.id, id));
}

export async function supersedeEvidence(
  oldEvidenceId: number,
  newEvidenceId: number,
  reason: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(evidence)
    .set({
      status: "superseded",
      supersededById: newEvidenceId,
      supersessionReason: reason,
    })
    .where(eq(evidence.id, oldEvidenceId));
}

// Evidence Linkages
export async function createEvidenceLinkage(
  linkage: InsertEvidenceLinkage
): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(evidenceLinkages).values(linkage);
  return Number(result[0].insertId);
}

export async function getEvidenceLinkagesByEvidence(evidenceId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(evidenceLinkages)
    .where(eq(evidenceLinkages.evidenceId, evidenceId));
}

export async function getEvidenceLinkagesByEntity(
  entityType: any,
  entityId: number
) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select({
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
export async function createCertificateSnapshot(
  snapshot: InsertCertificateSnapshot
): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(certificateSnapshots).values(snapshot);
  return Number(result[0].insertId);
}

export async function getCertificateSnapshotById(id: number) {
  const db = await getDb();
  if (!db) return null;

  const results = await db
    .select()
    .from(certificateSnapshots)
    .where(eq(certificateSnapshots.id, id));
  return results[0] || null;
}

export async function getCertificateSnapshotsByCertificate(
  certificateId: number
) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(certificateSnapshots)
    .where(eq(certificateSnapshots.certificateId, certificateId))
    .orderBy(desc(certificateSnapshots.snapshotDate));
}

export async function getCertificateSnapshotByHash(snapshotHash: string) {
  const db = await getDb();
  if (!db) return null;

  const results = await db
    .select()
    .from(certificateSnapshots)
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

  const totalCommitted = events.reduce(
    (sum, e) => sum + (e.committedVolume || 0),
    0
  );
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
    variancePercent:
      totalCommitted > 0
        ? ((totalActual - totalCommitted) / totalCommitted) * 100
        : 0,
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

export async function createProperty(
  property: Omit<InsertProperty, "id" | "createdAt" | "updatedAt">
): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(properties).values(property);
  return result[0].insertId;
}

export async function createProductionHistory(
  history: Omit<InsertProductionHistory, "id" | "createdAt">
): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(productionHistory).values(history);
  return result[0].insertId;
}

export async function createCarbonPractice(
  practice: Omit<InsertCarbonPractice, "id" | "createdAt" | "updatedAt">
): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(carbonPractices).values(practice);
  return result[0].insertId;
}

export async function createExistingContract(
  contract: Omit<InsertExistingContract, "id" | "createdAt">
): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(existingContracts).values(contract);
  return result[0].insertId;
}

export async function createMarketplaceListing(
  listing: Omit<InsertMarketplaceListing, "id" | "createdAt" | "updatedAt">
): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

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

// ============================================================================
// CERTIFICATE VERIFICATION
// ============================================================================

export async function getCertificateById(id: number) {
  const db = await getDb();
  if (!db) return null;

  const results = await db
    .select()
    .from(certificates)
    .where(eq(certificates.id, id))
    .limit(1);

  return results[0] || null;
}

export async function getCertificateSnapshotByCertificateId(
  certificateId: number
) {
  const db = await getDb();
  if (!db) return null;

  const results = await db
    .select()
    .from(certificateSnapshots)
    .where(eq(certificateSnapshots.certificateId, certificateId))
    .limit(1);

  return results[0] || null;
}

// ============================================================================
// FINANCIAL INSTITUTIONS
// ============================================================================

export async function createFinancialInstitution(
  data: InsertFinancialInstitution
): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(financialInstitutions).values(data);
  return Number((result as any).insertId);
}

export async function getFinancialInstitutionByUserId(userId: number) {
  const db = await getDb();
  if (!db) return null;

  const results = await db
    .select()
    .from(financialInstitutions)
    .where(eq(financialInstitutions.userId, userId))
    .limit(1);

  return results[0] || null;
}

export async function getFinancialInstitutionByABN(abn: string) {
  const db = await getDb();
  if (!db) return null;

  const results = await db
    .select()
    .from(financialInstitutions)
    .where(eq(financialInstitutions.abn, abn))
    .limit(1);

  return results[0] || null;
}

export async function updateFinancialInstitution(
  id: number,
  data: Partial<InsertFinancialInstitution>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(financialInstitutions)
    .set(data)
    .where(eq(financialInstitutions.id, id));
}

// ============================================================================
// DEMAND SIGNAL REGISTRY
// ============================================================================

export async function createDemandSignal(signal: InsertDemandSignal) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(demandSignals).values(signal);
  return Number((result as any).insertId);
}

export async function getDemandSignalById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db
    .select()
    .from(demandSignals)
    .where(eq(demandSignals.id, id))
    .limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function getAllDemandSignals(filters?: {
  status?: string;
  feedstockType?: string;
  deliveryState?: string;
  buyerId?: number;
}) {
  const db = await getDb();
  if (!db) return [];

  let query = db.select().from(demandSignals);

  const conditions = [];
  if (filters?.status)
    conditions.push(eq(demandSignals.status, filters.status as any));
  if (filters?.feedstockType)
    conditions.push(eq(demandSignals.feedstockType, filters.feedstockType));
  if (filters?.deliveryState)
    conditions.push(
      eq(demandSignals.deliveryState, filters.deliveryState as any)
    );
  if (filters?.buyerId)
    conditions.push(eq(demandSignals.buyerId, filters.buyerId));

  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as any;
  }

  return await query.orderBy(desc(demandSignals.createdAt));
}

export async function updateDemandSignal(
  id: number,
  updates: Partial<InsertDemandSignal>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(demandSignals).set(updates).where(eq(demandSignals.id, id));
}

export async function incrementDemandSignalViewCount(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .update(demandSignals)
    .set({ viewCount: sql`${demandSignals.viewCount} + 1` })
    .where(eq(demandSignals.id, id));
}

export async function createSupplierResponse(response: InsertSupplierResponse) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(supplierResponses).values(response);

  // Increment response count on demand signal
  await db
    .update(demandSignals)
    .set({ responseCount: sql`${demandSignals.responseCount} + 1` })
    .where(eq(demandSignals.id, response.demandSignalId));

  return Number((result as any).insertId);
}

export async function getSupplierResponseById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db
    .select()
    .from(supplierResponses)
    .where(eq(supplierResponses.id, id))
    .limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function getResponsesByDemandSignal(demandSignalId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(supplierResponses)
    .where(eq(supplierResponses.demandSignalId, demandSignalId))
    .orderBy(
      desc(supplierResponses.matchScore),
      desc(supplierResponses.createdAt)
    );
}

export async function getResponsesBySupplierId(supplierId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(supplierResponses)
    .where(eq(supplierResponses.supplierId, supplierId))
    .orderBy(desc(supplierResponses.createdAt));
}

export async function updateSupplierResponse(
  id: number,
  updates: Partial<InsertSupplierResponse>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .update(supplierResponses)
    .set(updates)
    .where(eq(supplierResponses.id, id));
}

export async function createPlatformTransaction(
  transaction: InsertPlatformTransaction
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(platformTransactions).values(transaction);
  return Number((result as any).insertId);
}

export async function getPlatformTransactionById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db
    .select()
    .from(platformTransactions)
    .where(eq(platformTransactions.id, id))
    .limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function getTransactionsByBuyer(buyerId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(platformTransactions)
    .where(eq(platformTransactions.buyerId, buyerId))
    .orderBy(desc(platformTransactions.createdAt));
}

export async function getPlatformTransactionsBySupplierId(supplierId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(platformTransactions)
    .where(eq(platformTransactions.supplierId, supplierId))
    .orderBy(desc(platformTransactions.createdAt));
}

export async function updatePlatformTransaction(
  id: number,
  updates: Partial<InsertPlatformTransaction>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .update(platformTransactions)
    .set(updates)
    .where(eq(platformTransactions.id, id));
}

// ============================================================================
// FEEDSTOCK FUTURES (Long-term Perennial Crop Projections)
// ============================================================================

export async function generateFuturesId(): Promise<string> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const year = new Date().getFullYear();
  const prefix = `FUT-${year}-`;

  // Get the highest existing futures ID for this year
  const result = await db
    .select({ futuresId: feedstockFutures.futuresId })
    .from(feedstockFutures)
    .where(like(feedstockFutures.futuresId, `${prefix}%`))
    .orderBy(desc(feedstockFutures.futuresId))
    .limit(1);

  let nextNum = 1;
  if (result.length > 0 && result[0].futuresId) {
    const lastNum = parseInt(result[0].futuresId.replace(prefix, ""), 10);
    if (!isNaN(lastNum)) {
      nextNum = lastNum + 1;
    }
  }

  return `${prefix}${nextNum.toString().padStart(4, "0")}`;
}

export async function createFutures(futures: InsertFeedstockFutures) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(feedstockFutures).values(futures);
  return Number((result as any).insertId);
}

export async function getFuturesById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db
    .select()
    .from(feedstockFutures)
    .where(eq(feedstockFutures.id, id))
    .limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function getFuturesByFuturesId(futuresId: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db
    .select()
    .from(feedstockFutures)
    .where(eq(feedstockFutures.futuresId, futuresId))
    .limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function getFuturesBySupplierId(supplierId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(feedstockFutures)
    .where(eq(feedstockFutures.supplierId, supplierId))
    .orderBy(desc(feedstockFutures.createdAt));
}

export async function searchActiveFutures(filters?: {
  state?: string[];
  cropType?: string[];
  minVolume?: number;
  limit?: number;
  offset?: number;
}) {
  const db = await getDb();
  if (!db) return [];

  const conditions = [eq(feedstockFutures.status, "active")];

  if (filters?.state && filters.state.length > 0) {
    conditions.push(inArray(feedstockFutures.state, filters.state as any));
  }
  if (filters?.cropType && filters.cropType.length > 0) {
    conditions.push(
      inArray(feedstockFutures.cropType, filters.cropType as any)
    );
  }
  if (filters?.minVolume) {
    conditions.push(
      gte(feedstockFutures.totalAvailableTonnes, filters.minVolume.toString())
    );
  }

  let query = db
    .select()
    .from(feedstockFutures)
    .where(and(...conditions))
    .orderBy(desc(feedstockFutures.createdAt));

  if (filters?.limit) {
    query = query.limit(filters.limit) as any;
  }
  if (filters?.offset) {
    query = query.offset(filters.offset) as any;
  }

  return await query;
}

export async function updateFutures(
  id: number,
  updates: Partial<InsertFeedstockFutures>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .update(feedstockFutures)
    .set(updates)
    .where(eq(feedstockFutures.id, id));
}

export async function deleteFutures(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // Projections will be deleted via cascade
  await db.delete(feedstockFutures).where(eq(feedstockFutures.id, id));
}

export async function recalculateFuturesTotals(futuresId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Sum all projections
  const projections = await db
    .select()
    .from(futuresYieldProjections)
    .where(eq(futuresYieldProjections.futuresId, futuresId));

  let totalProjected = 0;
  let totalContracted = 0;

  for (const p of projections) {
    totalProjected += parseFloat(p.projectedTonnes) || 0;
    totalContracted += parseFloat(p.contractedTonnes || "0") || 0;
  }

  const totalAvailable = totalProjected - totalContracted;

  await db
    .update(feedstockFutures)
    .set({
      totalProjectedTonnes: totalProjected.toString(),
      totalContractedTonnes: totalContracted.toString(),
      totalAvailableTonnes: totalAvailable.toString(),
    })
    .where(eq(feedstockFutures.id, futuresId));
}

// ============================================================================
// FUTURES YIELD PROJECTIONS
// ============================================================================

export async function getProjectionsByFuturesId(futuresId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(futuresYieldProjections)
    .where(eq(futuresYieldProjections.futuresId, futuresId))
    .orderBy(asc(futuresYieldProjections.projectionYear));
}

export async function upsertYieldProjection(
  projection: InsertFuturesYieldProjection
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Check if projection exists for this year
  const existing = await db
    .select()
    .from(futuresYieldProjections)
    .where(
      and(
        eq(futuresYieldProjections.futuresId, projection.futuresId),
        eq(futuresYieldProjections.projectionYear, projection.projectionYear)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    // Update existing
    await db
      .update(futuresYieldProjections)
      .set({
        projectedTonnes: projection.projectedTonnes,
        contractedTonnes: projection.contractedTonnes,
        confidencePercent: projection.confidencePercent,
        harvestSeason: projection.harvestSeason,
        notes: projection.notes,
      })
      .where(eq(futuresYieldProjections.id, existing[0].id));
    return existing[0].id;
  } else {
    // Insert new
    const result = await db.insert(futuresYieldProjections).values(projection);
    return Number((result as any).insertId);
  }
}

export async function bulkUpsertProjections(
  futuresId: number,
  projections: Omit<InsertFuturesYieldProjection, "futuresId">[]
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  for (const projection of projections) {
    await upsertYieldProjection({
      ...projection,
      futuresId,
    });
  }

  // Recalculate totals after all projections are updated
  await recalculateFuturesTotals(futuresId);
}

export async function deleteProjection(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .delete(futuresYieldProjections)
    .where(eq(futuresYieldProjections.id, id));
}

// ============================================================================
// FUTURES EOI (Expression of Interest)
// ============================================================================

export async function generateEOIReference(): Promise<string> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const year = new Date().getFullYear();
  const prefix = `EOI-${year}-`;

  // Get the highest existing EOI reference for this year
  const result = await db
    .select({ eoiReference: futuresEOI.eoiReference })
    .from(futuresEOI)
    .where(like(futuresEOI.eoiReference, `${prefix}%`))
    .orderBy(desc(futuresEOI.eoiReference))
    .limit(1);

  let nextNum = 1;
  if (result.length > 0 && result[0].eoiReference) {
    const lastNum = parseInt(result[0].eoiReference.replace(prefix, ""), 10);
    if (!isNaN(lastNum)) {
      nextNum = lastNum + 1;
    }
  }

  return `${prefix}${nextNum.toString().padStart(4, "0")}`;
}

export async function createEOI(eoi: InsertFuturesEOI) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(futuresEOI).values(eoi);
  return Number((result as any).insertId);
}

export async function getEOIById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db
    .select()
    .from(futuresEOI)
    .where(eq(futuresEOI.id, id))
    .limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function getEOIsByFuturesId(futuresId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(futuresEOI)
    .where(eq(futuresEOI.futuresId, futuresId))
    .orderBy(desc(futuresEOI.createdAt));
}

export async function getEOIsByBuyerId(buyerId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(futuresEOI)
    .where(eq(futuresEOI.buyerId, buyerId))
    .orderBy(desc(futuresEOI.createdAt));
}

export async function getEOIByFuturesAndBuyer(
  futuresId: number,
  buyerId: number
) {
  const db = await getDb();
  if (!db) return null;
  const result = await db
    .select()
    .from(futuresEOI)
    .where(
      and(eq(futuresEOI.futuresId, futuresId), eq(futuresEOI.buyerId, buyerId))
    )
    .limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function updateEOI(
  id: number,
  updates: Partial<InsertFuturesEOI>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(futuresEOI).set(updates).where(eq(futuresEOI.id, id));
}

export async function updateEOIStatus(
  id: number,
  status: string,
  response?: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const updates: Partial<InsertFuturesEOI> = {
    status: status as any,
    respondedAt: new Date(),
  };

  if (response) {
    updates.supplierResponse = response;
  }

  await db.update(futuresEOI).set(updates).where(eq(futuresEOI.id, id));
}

export async function countEOIsByFuturesId(futuresId: number) {
  const db = await getDb();
  if (!db) return { total: 0, pending: 0, accepted: 0 };

  const eois = await db
    .select()
    .from(futuresEOI)
    .where(eq(futuresEOI.futuresId, futuresId));

  return {
    total: eois.length,
    pending: eois.filter(
      e => e.status === "pending" || e.status === "under_review"
    ).length,
    accepted: eois.filter(e => e.status === "accepted").length,
  };
}

// ============================================================================
// RSIE: DATA SOURCES
// ============================================================================

export async function listDataSources(enabledOnly: boolean = false) {
  const db = await getDb();
  if (!db) return [];

  if (enabledOnly) {
    return await db
      .select()
      .from(dataSources)
      .where(eq(dataSources.isEnabled, true))
      .orderBy(asc(dataSources.name));
  }

  return await db.select().from(dataSources).orderBy(asc(dataSources.name));
}

export async function getDataSourceById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db
    .select()
    .from(dataSources)
    .where(eq(dataSources.id, id))
    .limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function createDataSource(source: InsertDataSource) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(dataSources).values(source);
  return Number((result as any).insertId);
}

export async function updateDataSource(
  id: number,
  updates: Partial<InsertDataSource>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(dataSources).set(updates).where(eq(dataSources.id, id));
}

export async function toggleDataSourceEnabled(id: number, isEnabled: boolean) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .update(dataSources)
    .set({ isEnabled })
    .where(eq(dataSources.id, id));
}

// ============================================================================
// RSIE: INGESTION RUNS
// ============================================================================

export async function createIngestionRun(run: InsertIngestionRun) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(ingestionRuns).values(run);
  return Number((result as any).insertId);
}

export async function getIngestionRunById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db
    .select()
    .from(ingestionRuns)
    .where(eq(ingestionRuns.id, id))
    .limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function listIngestionRuns(filters: {
  sourceId?: number;
  status?: string;
  limit?: number;
}) {
  const db = await getDb();
  if (!db) return [];

  const conditions = [];
  if (filters.sourceId) {
    conditions.push(eq(ingestionRuns.sourceId, filters.sourceId));
  }
  if (filters.status) {
    conditions.push(eq(ingestionRuns.status, filters.status as any));
  }

  const query = db
    .select()
    .from(ingestionRuns)
    .orderBy(desc(ingestionRuns.startedAt))
    .limit(filters.limit || 20);

  if (conditions.length > 0) {
    return await query.where(and(...conditions));
  }
  return await query;
}

export async function updateIngestionRun(
  id: number,
  updates: Partial<InsertIngestionRun>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(ingestionRuns).set(updates).where(eq(ingestionRuns.id, id));
}

export async function completeIngestionRun(
  id: number,
  status: "succeeded" | "partial" | "failed",
  recordsIn: number,
  recordsOut: number,
  errorMessage?: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .update(ingestionRuns)
    .set({
      status,
      finishedAt: new Date(),
      recordsIn,
      recordsOut,
      errorMessage,
    })
    .where(eq(ingestionRuns.id, id));
}

// ============================================================================
// RSIE: RISK EVENTS
// ============================================================================

export async function createRiskEvent(event: InsertRiskEvent) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(riskEvents).values(event);
  return Number((result as any).insertId);
}

export async function getRiskEventById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db
    .select()
    .from(riskEvents)
    .where(eq(riskEvents.id, id))
    .limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function getRiskEventByFingerprint(fingerprint: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db
    .select()
    .from(riskEvents)
    .where(eq(riskEvents.eventFingerprint, fingerprint))
    .limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function searchRiskEvents(filters: {
  eventType?: string[];
  severity?: string[];
  eventStatus?: string[];
  limit?: number;
  offset?: number;
}) {
  const db = await getDb();
  if (!db) return { events: [], total: 0 };

  const conditions = [];

  // Default to showing active and watch status events
  if (filters.eventStatus && filters.eventStatus.length > 0) {
    conditions.push(inArray(riskEvents.eventStatus, filters.eventStatus as any));
  } else {
    conditions.push(inArray(riskEvents.eventStatus, ["active", "watch"] as any));
  }

  if (filters.eventType && filters.eventType.length > 0) {
    conditions.push(inArray(riskEvents.eventType, filters.eventType as any));
  }

  if (filters.severity && filters.severity.length > 0) {
    conditions.push(inArray(riskEvents.severity, filters.severity as any));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const events = await db
    .select()
    .from(riskEvents)
    .where(whereClause)
    .orderBy(desc(riskEvents.startDate))
    .limit(filters.limit || 50)
    .offset(filters.offset || 0);

  // Get total count
  const countResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(riskEvents)
    .where(whereClause);

  return {
    events,
    total: Number(countResult[0]?.count || 0),
  };
}

export async function updateRiskEvent(
  id: number,
  updates: Partial<InsertRiskEvent>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .update(riskEvents)
    .set(updates)
    .where(eq(riskEvents.id, id));
}

export async function resolveRiskEvent(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .update(riskEvents)
    .set({
      eventStatus: "resolved",
      endDate: new Date(),
    })
    .where(eq(riskEvents.id, id));
}

export async function getActiveRiskEventsInBbox(
  minLat: number,
  maxLat: number,
  minLng: number,
  maxLng: number
) {
  const db = await getDb();
  if (!db) return [];

  // Decimal columns in Drizzle return strings, use SQL for numeric comparison
  return await db
    .select()
    .from(riskEvents)
    .where(
      and(
        eq(riskEvents.eventStatus, "active"),
        sql`${riskEvents.bboxMinLat} <= ${maxLat}`,
        sql`${riskEvents.bboxMaxLat} >= ${minLat}`,
        sql`${riskEvents.bboxMinLng} <= ${maxLng}`,
        sql`${riskEvents.bboxMaxLng} >= ${minLng}`
      )
    );
}

// ============================================================================
// RSIE: SUPPLIER SITES
// ============================================================================

export async function createSupplierSite(site: InsertSupplierSite) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(supplierSites).values(site);
  return Number((result as any).insertId);
}

export async function getSupplierSiteById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db
    .select()
    .from(supplierSites)
    .where(eq(supplierSites.id, id))
    .limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function getSupplierSitesBySupplierId(supplierId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(supplierSites)
    .where(eq(supplierSites.supplierId, supplierId))
    .orderBy(asc(supplierSites.name));
}

export async function updateSupplierSite(
  id: number,
  updates: Partial<InsertSupplierSite>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .update(supplierSites)
    .set(updates)
    .where(eq(supplierSites.id, id));
}

export async function deleteSupplierSite(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(supplierSites).where(eq(supplierSites.id, id));
}

export async function getAllSitesWithBbox() {
  const db = await getDb();
  if (!db) return [];
  // Return all sites that have a valid bounding box
  return await db
    .select()
    .from(supplierSites)
    .where(
      and(
        isNotNull(supplierSites.bboxMinLat),
        isNotNull(supplierSites.bboxMaxLat),
        isNotNull(supplierSites.bboxMinLng),
        isNotNull(supplierSites.bboxMaxLng)
      )
    );
}

// ============================================================================
// RSIE: SUPPLIER RISK EXPOSURE
// ============================================================================

export async function createSupplierRiskExposure(
  exposure: InsertSupplierRiskExposure
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(supplierRiskExposure).values(exposure);
  return Number((result as any).insertId);
}

export async function getExposuresBySiteId(siteId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(supplierRiskExposure)
    .where(eq(supplierRiskExposure.supplierSiteId, siteId))
    .orderBy(desc(supplierRiskExposure.computedAt));
}

export async function getExposuresByRiskEventId(riskEventId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(supplierRiskExposure)
    .where(eq(supplierRiskExposure.riskEventId, riskEventId));
}

export async function getSupplierExposureSummary(supplierId: number) {
  const db = await getDb();
  if (!db)
    return {
      supplierId,
      activeRiskCount: 0,
      criticalCount: 0,
      highCount: 0,
      mediumCount: 0,
      lowCount: 0,
      totalTonnesAtRisk: 0,
      exposures: [],
    };

  // Get all sites for this supplier
  const sites = await getSupplierSitesBySupplierId(supplierId);
  if (sites.length === 0) {
    return {
      supplierId,
      activeRiskCount: 0,
      criticalCount: 0,
      highCount: 0,
      mediumCount: 0,
      lowCount: 0,
      totalTonnesAtRisk: 0,
      exposures: [],
    };
  }

  const siteIds = sites.map(s => s.id);

  // Get all exposures for these sites
  const exposures = await db
    .select()
    .from(supplierRiskExposure)
    .where(inArray(supplierRiskExposure.supplierSiteId, siteIds));

  // Get unique active risk event IDs
  const activeRiskEventIds = Array.from(new Set(exposures.map(e => e.riskEventId)));

  // Count by severity (would need to join with riskEvents for accurate count)
  let criticalCount = 0;
  let highCount = 0;
  let mediumCount = 0;
  let lowCount = 0;
  let totalTonnesAtRisk = 0;

  for (const exp of exposures) {
    const tonnes = Number(exp.estimatedImpactTonnes) || 0;
    totalTonnesAtRisk += tonnes;
    // Note: To get severity, we'd need to join with riskEvents
  }

  return {
    supplierId,
    activeRiskCount: activeRiskEventIds.length,
    criticalCount,
    highCount,
    mediumCount,
    lowCount,
    totalTonnesAtRisk,
    exposures,
  };
}

export async function updateExposureMitigation(
  id: number,
  mitigationStatus: "none" | "partial" | "full"
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .update(supplierRiskExposure)
    .set({
      mitigationStatus,
    })
    .where(eq(supplierRiskExposure.id, id));
}

export async function deleteExposuresForRiskEvent(riskEventId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .delete(supplierRiskExposure)
    .where(eq(supplierRiskExposure.riskEventId, riskEventId));
}

// ============================================================================
// RSIE: CONTRACT RISK EXPOSURE
// ============================================================================

export async function createContractRiskExposure(
  exposure: InsertContractRiskExposure
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(contractRiskExposure).values(exposure);
  return Number((result as any).insertId);
}

export async function getContractExposuresByContractId(contractId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(contractRiskExposure)
    .where(eq(contractRiskExposure.contractId, contractId))
    .orderBy(desc(contractRiskExposure.computedAt));
}

export async function getContractExposuresByRiskEventId(riskEventId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(contractRiskExposure)
    .where(eq(contractRiskExposure.riskEventId, riskEventId));
}

// ============================================================================
// RSIE: WEATHER GRID
// ============================================================================

export async function insertWeatherGridDaily(data: InsertWeatherGridDaily) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(weatherGridDaily).values(data);
  return Number((result as any).insertId);
}

export async function bulkInsertWeatherGridDaily(
  data: InsertWeatherGridDaily[]
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  if (data.length === 0) return;
  await db.insert(weatherGridDaily).values(data);
}

export async function getWeatherForCell(
  cellId: string,
  startDate?: Date,
  endDate?: Date
) {
  const db = await getDb();
  if (!db) return [];

  const conditions = [eq(weatherGridDaily.cellId, cellId)];

  if (startDate) {
    conditions.push(gte(weatherGridDaily.date, startDate));
  }
  if (endDate) {
    conditions.push(lte(weatherGridDaily.date, endDate));
  }

  return await db
    .select()
    .from(weatherGridDaily)
    .where(and(...conditions))
    .orderBy(desc(weatherGridDaily.date))
    .limit(365); // Max 1 year of daily data
}

export async function insertForecastGridHourly(data: InsertForecastGridHourly) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(forecastGridHourly).values(data);
  return Number((result as any).insertId);
}

export async function getForecastForCell(
  cellId: string,
  hoursAhead: number = 168 // 7 days default
) {
  const db = await getDb();
  if (!db) return [];

  const now = new Date();
  const futureDate = new Date(now.getTime() + hoursAhead * 60 * 60 * 1000);

  return await db
    .select()
    .from(forecastGridHourly)
    .where(
      and(
        eq(forecastGridHourly.cellId, cellId),
        gte(forecastGridHourly.hourTime, now),
        lte(forecastGridHourly.hourTime, futureDate)
      )
    )
    .orderBy(asc(forecastGridHourly.hourTime));
}

// ============================================================================
// RSIE: INTELLIGENCE ITEMS
// ============================================================================

export async function createIntelligenceItem(item: InsertIntelligenceItem) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(intelligenceItems).values(item);
  return Number((result as any).insertId);
}

export async function getIntelligenceItemById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db
    .select()
    .from(intelligenceItems)
    .where(eq(intelligenceItems.id, id))
    .limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function listIntelligenceItems(filters: {
  itemType?: string[];
  tags?: string[];
  limit?: number;
  offset?: number;
}) {
  const db = await getDb();
  if (!db) return { items: [], total: 0 };

  const conditions = [];

  if (filters.itemType && filters.itemType.length > 0) {
    conditions.push(
      inArray(intelligenceItems.itemType, filters.itemType as any)
    );
  }

  // Tags would require JSON search or a separate junction table
  // For now, skip tag filtering

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const items = await db
    .select()
    .from(intelligenceItems)
    .where(whereClause)
    .orderBy(desc(intelligenceItems.publishedAt))
    .limit(filters.limit || 20)
    .offset(filters.offset || 0);

  const countResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(intelligenceItems)
    .where(whereClause);

  return {
    items,
    total: Number(countResult[0]?.count || 0),
  };
}

export async function updateIntelligenceItem(
  id: number,
  updates: Partial<InsertIntelligenceItem>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .update(intelligenceItems)
    .set(updates)
    .where(eq(intelligenceItems.id, id));
}

export async function deleteIntelligenceItem(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(intelligenceItems).where(eq(intelligenceItems.id, id));
}

// ============================================================================
// RSIE: USER FEEDBACK
// ============================================================================

export async function createUserFeedback(feedback: InsertUserFeedback) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(userFeedback).values(feedback);
  return Number((result as any).insertId);
}

export async function getUserFeedbackById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db
    .select()
    .from(userFeedback)
    .where(eq(userFeedback.id, id))
    .limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function hasUserSubmittedFeedback(userId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  const result = await db
    .select()
    .from(userFeedback)
    .where(eq(userFeedback.userId, userId))
    .limit(1);
  return result.length > 0;
}

export async function listUserFeedback(filters: {
  limit?: number;
  offset?: number;
}) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(userFeedback)
    .orderBy(desc(userFeedback.createdAt))
    .limit(filters.limit || 50)
    .offset(filters.offset || 0);
}

export async function getFeedbackStats() {
  const db = await getDb();
  if (!db) return { count: 0, avgNps: null };

  const feedback = await db.select().from(userFeedback);

  if (feedback.length === 0) {
    return { count: 0, avgNps: null };
  }

  const npsScores = feedback
    .filter(f => f.npsScore !== null)
    .map(f => f.npsScore as number);

  const avgNps =
    npsScores.length > 0
      ? npsScores.reduce((a, b) => a + b, 0) / npsScores.length
      : null;

  return {
    count: feedback.length,
    avgNps,
  };
}

// ============================================================================
// RSIE: EXPOSURE CALCULATION HELPERS
// ============================================================================

/**
 * Calculate exposures for all supplier sites against a specific risk event
 * Uses bounding box intersection to find overlapping sites
 */
export async function calculateExposuresForRiskEvent(riskEventId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const event = await getRiskEventById(riskEventId);
  if (!event || event.eventStatus === "resolved") {
    return { processed: 0 };
  }

  // Get sites whose bbox overlaps with the risk event's bbox
  const sites = await db
    .select()
    .from(supplierSites)
    .where(
      and(
        isNotNull(supplierSites.bboxMinLat),
        isNotNull(supplierSites.bboxMaxLat),
        isNotNull(supplierSites.bboxMinLng),
        isNotNull(supplierSites.bboxMaxLng),
        // Bbox intersection check using SQL for decimal comparisons
        sql`${supplierSites.bboxMinLat} <= ${event.bboxMaxLat}`,
        sql`${supplierSites.bboxMaxLat} >= ${event.bboxMinLat}`,
        sql`${supplierSites.bboxMinLng} <= ${event.bboxMaxLng}`,
        sql`${supplierSites.bboxMaxLng} >= ${event.bboxMinLng}`
      )
    );

  let processed = 0;

  for (const site of sites) {
    // Check if exposure already exists
    const existing = await db
      .select()
      .from(supplierRiskExposure)
      .where(
        and(
          eq(supplierRiskExposure.supplierSiteId, site.id),
          eq(supplierRiskExposure.riskEventId, riskEventId)
        )
      )
      .limit(1);

    if (existing.length === 0) {
      // Create new exposure
      // In a real system, calculate overlap fraction using GeoJSON intersection
      const exposureFraction = "0.5000"; // Placeholder: 50% overlap
      const estimatedImpactTonnes = "0.00"; // Would calculate from supplier capacity

      await createSupplierRiskExposure({
        supplierId: site.supplierId,
        supplierSiteId: site.id,
        riskEventId,
        exposureFraction,
        estimatedImpactTonnes,
        computedAt: new Date(),
        mitigationStatus: "none",
      });
      processed++;
    }
  }

  return { processed };
}

/**
 * Recalculate all exposures for all active risk events
 */
export async function recalculateAllExposures() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const activeEvents = await db
    .select()
    .from(riskEvents)
    .where(inArray(riskEvents.eventStatus, ["active", "watch"] as any));

  let totalProcessed = 0;

  for (const event of activeEvents) {
    const result = await calculateExposuresForRiskEvent(event.id);
    totalProcessed += result.processed;
  }

  return { processed: totalProcessed, eventCount: activeEvents.length };
}
