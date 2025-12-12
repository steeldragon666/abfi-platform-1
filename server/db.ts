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
  auditLogs, InsertAuditLog
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
