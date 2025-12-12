import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, json, boolean, index, unique } from "drizzle-orm/mysql-core";

/**
 * ABFI Platform Database Schema
 * Australian Bioenergy Feedstock Institute - B2B Marketplace
 */

// ============================================================================
// USERS & AUTHENTICATION
// ============================================================================

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin", "supplier", "buyer", "auditor"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ============================================================================
// SUPPLIERS
// ============================================================================

export const suppliers = mysqlTable("suppliers", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  abn: varchar("abn", { length: 11 }).notNull().unique(),
  companyName: varchar("companyName", { length: 255 }).notNull(),
  contactEmail: varchar("contactEmail", { length: 320 }).notNull(),
  contactPhone: varchar("contactPhone", { length: 20 }),
  
  // Address
  addressLine1: varchar("addressLine1", { length: 255 }),
  addressLine2: varchar("addressLine2", { length: 255 }),
  city: varchar("city", { length: 100 }),
  state: mysqlEnum("state", ["NSW", "VIC", "QLD", "SA", "WA", "TAS", "NT", "ACT"]),
  postcode: varchar("postcode", { length: 4 }),
  country: varchar("country", { length: 2 }).default("AU"),
  
  // Location (lat/lng for mapping)
  latitude: varchar("latitude", { length: 20 }),
  longitude: varchar("longitude", { length: 20 }),
  
  // Status
  verificationStatus: mysqlEnum("verificationStatus", ["pending", "verified", "suspended"]).default("pending").notNull(),
  subscriptionTier: mysqlEnum("subscriptionTier", ["starter", "professional", "enterprise"]).default("starter").notNull(),
  
  // Metadata
  description: text("description"),
  website: varchar("website", { length: 255 }),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  userIdIdx: index("suppliers_userId_idx").on(table.userId),
}));

export type Supplier = typeof suppliers.$inferSelect;
export type InsertSupplier = typeof suppliers.$inferInsert;

// ============================================================================
// BUYERS
// ============================================================================

export const buyers = mysqlTable("buyers", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  abn: varchar("abn", { length: 11 }).notNull().unique(),
  companyName: varchar("companyName", { length: 255 }).notNull(),
  contactEmail: varchar("contactEmail", { length: 320 }).notNull(),
  contactPhone: varchar("contactPhone", { length: 20 }),
  
  // Facility location
  facilityName: varchar("facilityName", { length: 255 }),
  facilityAddress: varchar("facilityAddress", { length: 500 }),
  facilityLatitude: varchar("facilityLatitude", { length: 20 }),
  facilityLongitude: varchar("facilityLongitude", { length: 20 }),
  facilityState: mysqlEnum("facilityState", ["NSW", "VIC", "QLD", "SA", "WA", "TAS", "NT", "ACT"]),
  
  // Subscription
  subscriptionTier: mysqlEnum("subscriptionTier", ["explorer", "professional", "enterprise"]).default("explorer").notNull(),
  
  // Metadata
  description: text("description"),
  website: varchar("website", { length: 255 }),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  userIdIdx: index("buyers_userId_idx").on(table.userId),
}));

export type Buyer = typeof buyers.$inferSelect;
export type InsertBuyer = typeof buyers.$inferInsert;

// ============================================================================
// FEEDSTOCKS
// ============================================================================

export const feedstocks = mysqlTable("feedstocks", {
  id: int("id").autoincrement().primaryKey(),
  
  // Unique ABFI ID: ABFI-[TYPE]-[STATE]-[XXXXXX]
  abfiId: varchar("abfiId", { length: 50 }).notNull().unique(),
  
  supplierId: int("supplierId").notNull().references(() => suppliers.id),
  
  // Classification
  category: mysqlEnum("category", ["oilseed", "UCO", "tallow", "lignocellulosic", "waste", "algae", "other"]).notNull(),
  type: varchar("type", { length: 100 }).notNull(), // e.g., "canola", "used_cooking_oil", "beef_tallow"
  
  // Location
  sourceName: varchar("sourceName", { length: 255 }), // Property/facility name
  sourceAddress: varchar("sourceAddress", { length: 500 }),
  latitude: varchar("latitude", { length: 20 }).notNull(),
  longitude: varchar("longitude", { length: 20 }).notNull(),
  state: mysqlEnum("state", ["NSW", "VIC", "QLD", "SA", "WA", "TAS", "NT", "ACT"]).notNull(),
  region: varchar("region", { length: 100 }), // NRM region
  
  // Production
  productionMethod: mysqlEnum("productionMethod", ["crop", "waste", "residue", "processing_byproduct"]).notNull(),
  annualCapacityTonnes: int("annualCapacityTonnes").notNull(),
  availableVolumeCurrent: int("availableVolumeCurrent").notNull(),
  availableVolumeForward: json("availableVolumeForward").$type<Record<string, number>>(), // { "2025-01": 100, "2025-02": 150 }
  
  // ABFI Scores (0-100)
  abfiScore: int("abfiScore"), // Composite score
  sustainabilityScore: int("sustainabilityScore"),
  carbonIntensityScore: int("carbonIntensityScore"),
  qualityScore: int("qualityScore"),
  reliabilityScore: int("reliabilityScore"),
  
  // Carbon data
  carbonIntensityValue: int("carbonIntensityValue"), // gCO2e/MJ (stored as integer to avoid decimal)
  carbonIntensityMethod: varchar("carbonIntensityMethod", { length: 255 }),
  
  // Quality parameters (type-specific, stored as JSON)
  qualityParameters: json("qualityParameters").$type<Record<string, { value: number; unit: string }>>(),
  
  // Pricing (optional)
  pricePerTonne: int("pricePerTonne"), // Stored in cents to avoid decimal
  priceVisibility: mysqlEnum("priceVisibility", ["public", "private", "on_request"]).default("on_request"),
  
  // Status
  status: mysqlEnum("status", ["draft", "pending_review", "active", "suspended"]).default("draft").notNull(),
  verificationLevel: mysqlEnum("verificationLevel", [
    "self_declared",
    "document_verified",
    "third_party_audited",
    "abfi_certified"
  ]).default("self_declared").notNull(),
  
  // Metadata
  description: text("description"),
  verifiedAt: timestamp("verifiedAt"),
  verifiedBy: int("verifiedBy").references(() => users.id),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  supplierIdIdx: index("feedstocks_supplierId_idx").on(table.supplierId),
  categoryIdx: index("feedstocks_category_idx").on(table.category),
  stateIdx: index("feedstocks_state_idx").on(table.state),
  statusIdx: index("feedstocks_status_idx").on(table.status),
  abfiScoreIdx: index("feedstocks_abfiScore_idx").on(table.abfiScore),
}));

export type Feedstock = typeof feedstocks.$inferSelect;
export type InsertFeedstock = typeof feedstocks.$inferInsert;

// ============================================================================
// CERTIFICATES
// ============================================================================

export const certificates = mysqlTable("certificates", {
  id: int("id").autoincrement().primaryKey(),
  feedstockId: int("feedstockId").notNull().references(() => feedstocks.id),
  
  type: mysqlEnum("type", ["ISCC_EU", "ISCC_PLUS", "RSB", "RED_II", "GO", "ABFI", "OTHER"]).notNull(),
  certificateNumber: varchar("certificateNumber", { length: 100 }),
  
  issuedDate: timestamp("issuedDate"),
  expiryDate: timestamp("expiryDate"),
  
  status: mysqlEnum("status", ["active", "expired", "revoked"]).default("active").notNull(),
  
  // Document storage
  documentUrl: varchar("documentUrl", { length: 500 }),
  documentKey: varchar("documentKey", { length: 500 }), // S3 key
  
  // Verification
  verifiedAt: timestamp("verifiedAt"),
  verifiedBy: int("verifiedBy").references(() => users.id),
  
  notes: text("notes"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  feedstockIdIdx: index("certificates_feedstockId_idx").on(table.feedstockId),
  expiryDateIdx: index("certificates_expiryDate_idx").on(table.expiryDate),
}));

export type Certificate = typeof certificates.$inferSelect;
export type InsertCertificate = typeof certificates.$inferInsert;

// ============================================================================
// QUALITY TESTS
// ============================================================================

export const qualityTests = mysqlTable("qualityTests", {
  id: int("id").autoincrement().primaryKey(),
  feedstockId: int("feedstockId").notNull().references(() => feedstocks.id),
  
  testDate: timestamp("testDate").notNull(),
  laboratory: varchar("laboratory", { length: 255 }),
  
  // Test parameters and results (JSON structure)
  parameters: json("parameters").$type<Record<string, {
    value: number;
    unit: string;
    specification?: { min?: number; max?: number };
    pass: boolean;
  }>>(),
  
  // Overall result
  overallPass: boolean("overallPass").default(true),
  
  // Document storage
  reportUrl: varchar("reportUrl", { length: 500 }),
  reportKey: varchar("reportKey", { length: 500 }), // S3 key
  
  notes: text("notes"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  feedstockIdIdx: index("qualityTests_feedstockId_idx").on(table.feedstockId),
  testDateIdx: index("qualityTests_testDate_idx").on(table.testDate),
}));

export type QualityTest = typeof qualityTests.$inferSelect;
export type InsertQualityTest = typeof qualityTests.$inferInsert;

// ============================================================================
// INQUIRIES
// ============================================================================

export const inquiries = mysqlTable("inquiries", {
  id: int("id").autoincrement().primaryKey(),
  
  buyerId: int("buyerId").notNull().references(() => buyers.id),
  supplierId: int("supplierId").notNull().references(() => suppliers.id),
  feedstockId: int("feedstockId").references(() => feedstocks.id),
  
  // Inquiry details
  subject: varchar("subject", { length: 255 }).notNull(),
  message: text("message").notNull(),
  
  // Requirements
  volumeRequired: int("volumeRequired"), // tonnes
  deliveryLocation: varchar("deliveryLocation", { length: 500 }),
  deliveryTimeframeStart: timestamp("deliveryTimeframeStart"),
  deliveryTimeframeEnd: timestamp("deliveryTimeframeEnd"),
  qualityRequirements: json("qualityRequirements").$type<Record<string, { min?: number; max?: number }>>(),
  
  // Status
  status: mysqlEnum("status", ["open", "responded", "closed", "cancelled"]).default("open").notNull(),
  
  // Response
  responseMessage: text("responseMessage"),
  respondedAt: timestamp("respondedAt"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  buyerIdIdx: index("inquiries_buyerId_idx").on(table.buyerId),
  supplierIdIdx: index("inquiries_supplierId_idx").on(table.supplierId),
  feedstockIdIdx: index("inquiries_feedstockId_idx").on(table.feedstockId),
  statusIdx: index("inquiries_status_idx").on(table.status),
}));

export type Inquiry = typeof inquiries.$inferSelect;
export type InsertInquiry = typeof inquiries.$inferInsert;

// ============================================================================
// TRANSACTIONS
// ============================================================================

export const transactions = mysqlTable("transactions", {
  id: int("id").autoincrement().primaryKey(),
  
  feedstockId: int("feedstockId").notNull().references(() => feedstocks.id),
  supplierId: int("supplierId").notNull().references(() => suppliers.id),
  buyerId: int("buyerId").notNull().references(() => buyers.id),
  inquiryId: int("inquiryId").references(() => inquiries.id),
  
  // Transaction details
  volumeTonnes: int("volumeTonnes").notNull(),
  pricePerTonne: int("pricePerTonne"), // Stored in cents
  totalValue: int("totalValue"), // Stored in cents
  
  deliveryDate: timestamp("deliveryDate"),
  deliveryLocation: varchar("deliveryLocation", { length: 500 }),
  
  // Status
  status: mysqlEnum("status", [
    "pending",
    "confirmed",
    "in_transit",
    "delivered",
    "completed",
    "disputed",
    "cancelled"
  ]).default("pending").notNull(),
  
  // Quality receipt
  qualityReceiptId: int("qualityReceiptId").references(() => qualityTests.id),
  
  // Ratings
  supplierRating: int("supplierRating"), // 1-5
  buyerRating: int("buyerRating"), // 1-5
  supplierFeedback: text("supplierFeedback"),
  buyerFeedback: text("buyerFeedback"),
  
  notes: text("notes"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  completedAt: timestamp("completedAt"),
}, (table) => ({
  feedstockIdIdx: index("transactions_feedstockId_idx").on(table.feedstockId),
  supplierIdIdx: index("transactions_supplierId_idx").on(table.supplierId),
  buyerIdIdx: index("transactions_buyerId_idx").on(table.buyerId),
  statusIdx: index("transactions_status_idx").on(table.status),
}));

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = typeof transactions.$inferInsert;

// ============================================================================
// NOTIFICATIONS
// ============================================================================

export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  
  userId: int("userId").notNull().references(() => users.id),
  
  type: mysqlEnum("type", [
    "inquiry_received",
    "inquiry_response",
    "certificate_expiring",
    "transaction_update",
    "rating_change",
    "verification_update",
    "system_announcement"
  ]).notNull(),
  
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  
  // Related entities
  relatedEntityType: varchar("relatedEntityType", { length: 50 }),
  relatedEntityId: int("relatedEntityId"),
  
  // Status
  read: boolean("read").default(false).notNull(),
  readAt: timestamp("readAt"),
  
  // Delivery
  emailSent: boolean("emailSent").default(false),
  emailSentAt: timestamp("emailSentAt"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("notifications_userId_idx").on(table.userId),
  readIdx: index("notifications_read_idx").on(table.read),
  createdAtIdx: index("notifications_createdAt_idx").on(table.createdAt),
}));

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

// ============================================================================
// SAVED SEARCHES (for buyers)
// ============================================================================

export const savedSearches = mysqlTable("savedSearches", {
  id: int("id").autoincrement().primaryKey(),
  
  buyerId: int("buyerId").notNull().references(() => buyers.id),
  
  name: varchar("name", { length: 255 }).notNull(),
  
  // Search criteria (stored as JSON)
  criteria: json("criteria").$type<{
    category?: string[];
    type?: string[];
    state?: string[];
    minAbfiScore?: number;
    maxCarbonIntensity?: number;
    certifications?: string[];
    minVolume?: number;
    maxDistance?: number;
    [key: string]: any;
  }>().notNull(),
  
  // Notification preferences
  notifyOnNewMatches: boolean("notifyOnNewMatches").default(false),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  buyerIdIdx: index("savedSearches_buyerId_idx").on(table.buyerId),
}));

export type SavedSearch = typeof savedSearches.$inferSelect;
export type InsertSavedSearch = typeof savedSearches.$inferInsert;

// ============================================================================
// AUDIT LOGS
// ============================================================================

export const auditLogs = mysqlTable("auditLogs", {
  id: int("id").autoincrement().primaryKey(),
  
  userId: int("userId").references(() => users.id),
  
  action: varchar("action", { length: 100 }).notNull(), // e.g., "create_feedstock", "update_supplier", "verify_certificate"
  entityType: varchar("entityType", { length: 50 }).notNull(), // e.g., "feedstock", "supplier", "certificate"
  entityId: int("entityId").notNull(),
  
  // Changes (before/after state)
  changes: json("changes").$type<{
    before?: Record<string, any>;
    after?: Record<string, any>;
  }>(),
  
  // Request metadata
  ipAddress: varchar("ipAddress", { length: 45 }),
  userAgent: varchar("userAgent", { length: 500 }),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("auditLogs_userId_idx").on(table.userId),
  entityIdx: index("auditLogs_entity_idx").on(table.entityType, table.entityId),
  createdAtIdx: index("auditLogs_createdAt_idx").on(table.createdAt),
}));

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = typeof auditLogs.$inferInsert;
