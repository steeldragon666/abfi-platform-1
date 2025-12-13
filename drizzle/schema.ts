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
  category: mysqlEnum("category", ["oilseed", "UCO", "tallow", "lignocellulosic", "waste", "algae", "bamboo", "other"]).notNull(),
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
  
  // Temporal Versioning
  versionNumber: int("versionNumber").default(1).notNull(),
  validFrom: timestamp("validFrom").defaultNow().notNull(),
  validTo: timestamp("validTo"), // NULL means current version
  supersededById: int("supersededById"), // References feedstocks.id (self-reference)
  versionReason: text("versionReason"), // Why this version was created
  isCurrent: boolean("isCurrent").default(true).notNull(),
  
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
  
  // Temporal Versioning
  versionNumber: int("versionNumber").default(1).notNull(),
  validFrom: timestamp("validFrom").defaultNow().notNull(),
  validTo: timestamp("validTo"), // NULL means current version
  supersededById: int("supersededById"), // References certificates.id (self-reference)
  renewalDate: timestamp("renewalDate"), // When certificate was renewed
  isCurrent: boolean("isCurrent").default(true).notNull(),
  
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
  responseDetails: json("responseDetails").$type<{
    pricePerTonne?: number;
    availableVolume?: number;
    deliveryTimeframe?: string;
    deliveryTerms?: string;
    minimumOrder?: number;
  }>(),
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
// SAVED RADIUS ANALYSES (Feedstock Map)
// ============================================================================

export const savedAnalyses = mysqlTable("savedAnalyses", {
  id: int("id").autoincrement().primaryKey(),
  
  userId: int("userId").notNull().references(() => users.id),
  
  // Analysis metadata
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  
  // Geographic parameters
  radiusKm: int("radiusKm").notNull(), // 10-200km
  centerLat: varchar("centerLat", { length: 20 }).notNull(),
  centerLng: varchar("centerLng", { length: 20 }).notNull(),
  
  // Analysis results (stored as JSON)
  results: json("results").$type<{
    feasibilityScore: number;
    facilities: {
      sugarMills: number;
      biogasFacilities: number;
      biofuelPlants: number;
      ports: number;
      grainHubs: number;
    };
    feedstockTonnes: {
      bagasse: number;
      grainStubble: number;
      forestryResidue: number;
      biogas: number;
      total: number;
    };
    infrastructure: {
      ports: string[];
      railLines: string[];
    };
    recommendations: string[];
  }>().notNull(),
  
  // Filter state at time of analysis
  filterState: json("filterState").$type<{
    selectedStates: string[];
    visibleLayers: string[];
    capacityRanges: Record<string, { min: number; max: number }>;
  }>(),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  userIdIdx: index("savedAnalyses_userId_idx").on(table.userId),
  createdAtIdx: index("savedAnalyses_createdAt_idx").on(table.createdAt),
}));

export type SavedAnalysis = typeof savedAnalyses.$inferSelect;
export type InsertSavedAnalysis = typeof savedAnalyses.$inferInsert;

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

// ============================================================================
// BANKABILITY MODULE - Projects & Supply Agreements
// ============================================================================

export const projects = mysqlTable("projects", {
  id: int("id").autoincrement().primaryKey(),
  
  userId: int("userId").notNull().references(() => users.id), // Project developer
  
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  
  // Facility details
  facilityLocation: varchar("facilityLocation", { length: 255 }),
  state: mysqlEnum("state", ["NSW", "VIC", "QLD", "SA", "WA", "TAS", "NT", "ACT"]),
  latitude: varchar("latitude", { length: 20 }),
  longitude: varchar("longitude", { length: 20 }),
  
  // Capacity
  nameplateCapacity: int("nameplateCapacity").notNull(), // tonnes per annum
  feedstockType: varchar("feedstockType", { length: 100 }), // Primary feedstock type
  
  // Project timeline
  targetCOD: timestamp("targetCOD"), // Commercial Operation Date
  financialCloseTarget: timestamp("financialCloseTarget"),
  
  // Debt structure
  debtTenor: int("debtTenor"), // years
  
  // Status
  status: mysqlEnum("status", [
    "planning",
    "development",
    "financing",
    "construction",
    "operational",
    "suspended"
  ]).default("planning").notNull(),
  
  // Supply targets (percentages)
  tier1Target: int("tier1Target").default(80), // % of capacity
  tier2Target: int("tier2Target").default(40),
  optionsTarget: int("optionsTarget").default(15),
  rofrTarget: int("rofrTarget").default(15),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  userIdIdx: index("projects_userId_idx").on(table.userId),
  statusIdx: index("projects_status_idx").on(table.status),
}));

export type Project = typeof projects.$inferSelect;
export type InsertProject = typeof projects.$inferInsert;

// ============================================================================
// SUPPLY AGREEMENTS
// ============================================================================

export const supplyAgreements = mysqlTable("supplyAgreements", {
  id: int("id").autoincrement().primaryKey(),
  
  projectId: int("projectId").notNull().references(() => projects.id),
  supplierId: int("supplierId").notNull().references(() => suppliers.id),
  
  // Agreement classification
  tier: mysqlEnum("tier", ["tier1", "tier2", "option", "rofr"]).notNull(),
  
  // Volume commitments
  annualVolume: int("annualVolume").notNull(), // tonnes per annum
  flexBandPercent: int("flexBandPercent"), // ±% flexibility
  
  // Term
  startDate: timestamp("startDate").notNull(),
  endDate: timestamp("endDate").notNull(),
  termYears: int("termYears").notNull(),
  
  // Pricing
  pricingMechanism: mysqlEnum("pricingMechanism", [
    "fixed",
    "fixed_with_escalation",
    "index_linked",
    "index_with_floor_ceiling",
    "spot_reference"
  ]).notNull(),
  basePrice: int("basePrice"), // cents per tonne
  floorPrice: int("floorPrice"),
  ceilingPrice: int("ceilingPrice"),
  escalationRate: varchar("escalationRate", { length: 50 }), // e.g., "CPI+1%"
  
  // Take-or-pay / Deliver-or-pay
  takeOrPayPercent: int("takeOrPayPercent"), // Project minimum purchase %
  deliverOrPayPercent: int("deliverOrPayPercent"), // Supplier minimum delivery %
  
  // Option-specific fields
  optionFeePercent: int("optionFeePercent"), // Annual option fee as % of notional
  strikePrice: int("strikePrice"), // cents per tonne
  exerciseWindowDays: int("exerciseWindowDays"),
  
  // ROFR-specific fields
  rofrAnnualFee: int("rofrAnnualFee"), // Fixed annual fee
  rofrNoticeDays: int("rofrNoticeDays"), // Days to match offer
  
  // Quality requirements
  minAbfiScore: int("minAbfiScore"),
  maxCarbonIntensity: int("maxCarbonIntensity"),
  qualitySpecs: json("qualitySpecs").$type<Record<string, any>>(),
  
  // Security package
  bankGuaranteePercent: int("bankGuaranteePercent"),
  bankGuaranteeAmount: int("bankGuaranteeAmount"), // AUD
  parentGuarantee: boolean("parentGuarantee").default(false),
  lenderStepInRights: boolean("lenderStepInRights").default(false),
  
  // Termination provisions
  earlyTerminationNoticeDays: int("earlyTerminationNoticeDays"),
  lenderConsentRequired: boolean("lenderConsentRequired").default(false),
  
  // Force majeure
  forceMajeureVolumeReductionCap: int("forceMajeureVolumeReductionCap"), // %
  
  // Status
  status: mysqlEnum("status", [
    "draft",
    "negotiation",
    "executed",
    "active",
    "suspended",
    "terminated"
  ]).default("draft").notNull(),
  
  executionDate: timestamp("executionDate"),
  
  // Documents
  documentUrl: varchar("documentUrl", { length: 500 }),
  
  // Temporal Versioning
  versionNumber: int("versionNumber").default(1).notNull(),
  validFrom: timestamp("validFrom").defaultNow().notNull(),
  validTo: timestamp("validTo"), // NULL means current version
  supersededById: int("supersededById"), // References supplyAgreements.id (self-reference)
  amendmentReason: text("amendmentReason"), // Why this amendment was made
  isCurrent: boolean("isCurrent").default(true).notNull(),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  projectIdIdx: index("supplyAgreements_projectId_idx").on(table.projectId),
  supplierIdIdx: index("supplyAgreements_supplierId_idx").on(table.supplierId),
  tierIdx: index("supplyAgreements_tier_idx").on(table.tier),
  statusIdx: index("supplyAgreements_status_idx").on(table.status),
}));

export type SupplyAgreement = typeof supplyAgreements.$inferSelect;
export type InsertSupplyAgreement = typeof supplyAgreements.$inferInsert;

// ============================================================================
// GROWER QUALIFICATIONS
// ============================================================================

export const growerQualifications = mysqlTable("growerQualifications", {
  id: int("id").autoincrement().primaryKey(),
  
  supplierId: int("supplierId").notNull().references(() => suppliers.id),
  
  // Qualification level
  level: mysqlEnum("level", ["GQ1", "GQ2", "GQ3", "GQ4"]).notNull(),
  levelName: varchar("levelName", { length: 50 }), // "Premier", "Qualified", "Developing", "Provisional"
  
  // Assessment criteria scores (0-100)
  operatingHistoryScore: int("operatingHistoryScore"),
  financialStrengthScore: int("financialStrengthScore"),
  landTenureScore: int("landTenureScore"),
  productionCapacityScore: int("productionCapacityScore"),
  creditScore: int("creditScore"),
  insuranceScore: int("insuranceScore"),
  
  // Composite score
  compositeScore: int("compositeScore").notNull(),
  
  // Assessment details
  assessedBy: int("assessedBy").references(() => users.id), // Assessor user ID
  assessmentDate: timestamp("assessmentDate").notNull(),
  assessmentNotes: text("assessmentNotes"),
  
  // Validity
  validFrom: timestamp("validFrom").notNull(),
  validUntil: timestamp("validUntil").notNull(),
  
  // Status
  status: mysqlEnum("status", [
    "pending",
    "approved",
    "expired",
    "revoked"
  ]).default("pending").notNull(),
  
  // Supporting documents
  documentsUrl: json("documentsUrl").$type<string[]>(),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  supplierIdIdx: index("growerQualifications_supplierId_idx").on(table.supplierId),
  levelIdx: index("growerQualifications_level_idx").on(table.level),
  statusIdx: index("growerQualifications_status_idx").on(table.status),
  validUntilIdx: index("growerQualifications_validUntil_idx").on(table.validUntil),
}));

export type GrowerQualification = typeof growerQualifications.$inferSelect;
export type InsertGrowerQualification = typeof growerQualifications.$inferInsert;

// ============================================================================
// BANKABILITY ASSESSMENTS
// ============================================================================

export const bankabilityAssessments = mysqlTable("bankabilityAssessments", {
  id: int("id").autoincrement().primaryKey(),
  
  projectId: int("projectId").notNull().references(() => projects.id),
  
  // Assessment metadata
  assessmentNumber: varchar("assessmentNumber", { length: 50 }).notNull().unique(), // ABFI-BANK-YYYY-NNNNN
  assessmentDate: timestamp("assessmentDate").notNull(),
  assessedBy: int("assessedBy").references(() => users.id),
  
  // Category scores (0-100)
  volumeSecurityScore: int("volumeSecurityScore").notNull(),
  counterpartyQualityScore: int("counterpartyQualityScore").notNull(),
  contractStructureScore: int("contractStructureScore").notNull(),
  concentrationRiskScore: int("concentrationRiskScore").notNull(),
  operationalReadinessScore: int("operationalReadinessScore").notNull(),
  
  // Composite score and rating
  compositeScore: int("compositeScore").notNull(), // 0-100
  rating: mysqlEnum("rating", ["AAA", "AA", "A", "BBB", "BB", "B", "CCC"]).notNull(),
  ratingDescription: varchar("ratingDescription", { length: 100 }),
  
  // Supply position summary
  tier1Volume: int("tier1Volume"),
  tier1Percent: int("tier1Percent"),
  tier2Volume: int("tier2Volume"),
  tier2Percent: int("tier2Percent"),
  optionsVolume: int("optionsVolume"),
  optionsPercent: int("optionsPercent"),
  rofrVolume: int("rofrVolume"),
  rofrPercent: int("rofrPercent"),
  totalPrimaryVolume: int("totalPrimaryVolume"),
  totalPrimaryPercent: int("totalPrimaryPercent"),
  totalSecondaryVolume: int("totalSecondaryVolume"),
  totalSecondaryPercent: int("totalSecondaryPercent"),
  totalSecuredVolume: int("totalSecuredVolume"),
  totalSecuredPercent: int("totalSecuredPercent"),
  
  // Contract summary
  totalAgreements: int("totalAgreements"),
  weightedAvgTerm: varchar("weightedAvgTerm", { length: 20 }), // e.g., "16.2 years"
  weightedAvgGQ: varchar("weightedAvgGQ", { length: 20 }), // e.g., "1.8"
  securityCoverageAmount: int("securityCoverageAmount"), // AUD
  
  // Concentration metrics
  supplierHHI: int("supplierHHI"),
  largestSupplierPercent: int("largestSupplierPercent"),
  climateZones: int("climateZones"),
  maxSingleEventExposure: int("maxSingleEventExposure"), // %
  
  // Key findings
  strengths: json("strengths").$type<string[]>(),
  monitoringItems: json("monitoringItems").$type<string[]>(),
  
  // Status
  status: mysqlEnum("status", [
    "draft",
    "submitted",
    "under_review",
    "approved",
    "rejected"
  ]).default("draft").notNull(),
  
  // Validity
  validFrom: timestamp("validFrom"),
  validUntil: timestamp("validUntil"),
  
  // Certificate
  certificateIssued: boolean("certificateIssued").default(false),
  certificateIssuedAt: timestamp("certificateIssuedAt"),
  certificateUrl: varchar("certificateUrl", { length: 500 }),
  
  // Temporal Versioning (in addition to validFrom/validUntil)
  versionNumber: int("versionNumber").default(1).notNull(),
  supersededById: int("supersededById"), // References bankabilityAssessments.id (self-reference)
  reassessmentReason: text("reassessmentReason"), // Why reassessment was triggered
  isCurrent: boolean("isCurrent").default(true).notNull(),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  projectIdIdx: index("bankabilityAssessments_projectId_idx").on(table.projectId),
  assessmentNumberIdx: index("bankabilityAssessments_assessmentNumber_idx").on(table.assessmentNumber),
  ratingIdx: index("bankabilityAssessments_rating_idx").on(table.rating),
  statusIdx: index("bankabilityAssessments_status_idx").on(table.status),
  validUntilIdx: index("bankabilityAssessments_validUntil_idx").on(table.validUntil),
}));

export type BankabilityAssessment = typeof bankabilityAssessments.$inferSelect;
export type InsertBankabilityAssessment = typeof bankabilityAssessments.$inferInsert;

// ============================================================================
// LENDER ACCESS
// ============================================================================

export const lenderAccess = mysqlTable("lenderAccess", {
  id: int("id").autoincrement().primaryKey(),
  
  projectId: int("projectId").notNull().references(() => projects.id),
  
  // Lender details
  lenderName: varchar("lenderName", { length: 255 }).notNull(),
  lenderEmail: varchar("lenderEmail", { length: 320 }).notNull(),
  lenderContact: varchar("lenderContact", { length: 255 }),
  
  // Access control
  accessToken: varchar("accessToken", { length: 64 }).notNull().unique(),
  grantedBy: int("grantedBy").notNull().references(() => users.id),
  grantedAt: timestamp("grantedAt").defaultNow().notNull(),
  
  // Permissions
  canViewAgreements: boolean("canViewAgreements").default(true),
  canViewAssessments: boolean("canViewAssessments").default(true),
  canViewCovenants: boolean("canViewCovenants").default(true),
  canDownloadReports: boolean("canDownloadReports").default(true),
  
  // Validity
  validFrom: timestamp("validFrom").notNull(),
  validUntil: timestamp("validUntil").notNull(),
  
  // Status
  status: mysqlEnum("status", ["active", "suspended", "revoked", "expired"]).default("active").notNull(),
  
  // Audit
  lastAccessedAt: timestamp("lastAccessedAt"),
  accessCount: int("accessCount").default(0),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  projectIdIdx: index("lenderAccess_projectId_idx").on(table.projectId),
  accessTokenIdx: index("lenderAccess_accessToken_idx").on(table.accessToken),
  statusIdx: index("lenderAccess_status_idx").on(table.status),
}));

export type LenderAccess = typeof lenderAccess.$inferSelect;
export type InsertLenderAccess = typeof lenderAccess.$inferInsert;

// ============================================================================
// COVENANT MONITORING
// ============================================================================

export const covenantMonitoring = mysqlTable("covenantMonitoring", {
  id: int("id").autoincrement().primaryKey(),
  
  projectId: int("projectId").notNull().references(() => projects.id),
  
  // Covenant details
  covenantType: varchar("covenantType", { length: 100 }).notNull(), // e.g., "minimum_primary_coverage", "max_concentration"
  covenantDescription: text("covenantDescription"),
  
  // Threshold
  thresholdValue: varchar("thresholdValue", { length: 100 }).notNull(),
  thresholdOperator: mysqlEnum("thresholdOperator", [">=", "<=", "=", ">", "<"]).notNull(),
  
  // Current value
  currentValue: varchar("currentValue", { length: 100 }),
  
  // Compliance
  inCompliance: boolean("inCompliance").notNull(),
  breachDate: timestamp("breachDate"),
  breachNotified: boolean("breachNotified").default(false),
  breachNotifiedAt: timestamp("breachNotifiedAt"),
  
  // Cure period
  curePeriodDays: int("curePeriodDays"),
  cureDeadline: timestamp("cureDeadline"),
  cured: boolean("cured").default(false),
  curedAt: timestamp("curedAt"),
  
  // Monitoring
  lastCheckedAt: timestamp("lastCheckedAt").notNull(),
  checkFrequency: mysqlEnum("checkFrequency", ["daily", "weekly", "monthly", "quarterly"]).notNull(),
  
  // Status
  status: mysqlEnum("status", ["active", "breached", "cured", "waived", "inactive"]).default("active").notNull(),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  projectIdIdx: index("covenantMonitoring_projectId_idx").on(table.projectId),
  statusIdx: index("covenantMonitoring_status_idx").on(table.status),
  lastCheckedAtIdx: index("covenantMonitoring_lastCheckedAt_idx").on(table.lastCheckedAt),
}));

export type CovenantMonitoring = typeof covenantMonitoring.$inferSelect;
export type InsertCovenantMonitoring = typeof covenantMonitoring.$inferInsert;

// ============================================================================
// EVIDENCE CHAIN & DATA PROVENANCE
// ============================================================================

/**
 * Evidence objects - separate from document blobs
 * Provides cryptographic integrity, issuer identity, and linkage to scores
 */
export const evidence = mysqlTable("evidence", {
  id: int("id").autoincrement().primaryKey(),
  
  // Evidence classification
  type: mysqlEnum("type", [
    "lab_test",
    "audit_report",
    "registry_cert",
    "contract",
    "insurance_policy",
    "financial_statement",
    "land_title",
    "sustainability_cert",
    "quality_test",
    "delivery_record",
    "other"
  ]).notNull(),
  
  // File integrity
  fileHash: varchar("fileHash", { length: 64 }).notNull(), // SHA-256 hash
  fileUrl: varchar("fileUrl", { length: 500 }).notNull(),
  fileSize: int("fileSize").notNull(), // bytes
  mimeType: varchar("mimeType", { length: 100 }).notNull(),
  originalFilename: varchar("originalFilename", { length: 255 }).notNull(),
  
  // Issuer identity
  issuerId: int("issuerId"), // References user ID of issuer
  issuerType: mysqlEnum("issuerType", [
    "lab",
    "auditor",
    "registry",
    "counterparty",
    "supplier",
    "government",
    "certification_body",
    "self_declared"
  ]).notNull(),
  issuerName: varchar("issuerName", { length: 255 }).notNull(),
  issuerCredentials: text("issuerCredentials"), // Accreditation details
  
  // Validity period
  issuedDate: timestamp("issuedDate").notNull(),
  expiryDate: timestamp("expiryDate"),
  
  // Status
  status: mysqlEnum("status", [
    "valid",
    "expired",
    "revoked",
    "superseded",
    "pending_verification"
  ]).default("valid").notNull(),
  
  // Versioning
  versionNumber: int("versionNumber").default(1).notNull(),
  supersededById: int("supersededById").references((): any => evidence.id),
  supersessionReason: text("supersessionReason"),
  
  // Metadata (type-specific fields)
  metadata: json("metadata").$type<{
    testMethod?: string;
    standardReference?: string;
    certificationScheme?: string;
    sampleId?: string;
    testResults?: Record<string, any>;
    [key: string]: any;
  }>(),
  
  // Audit trail
  uploadedBy: int("uploadedBy").notNull().references(() => users.id),
  verifiedBy: int("verifiedBy").references(() => users.id),
  verifiedAt: timestamp("verifiedAt"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  fileHashIdx: index("evidence_fileHash_idx").on(table.fileHash),
  statusIdx: index("evidence_status_idx").on(table.status),
  typeIdx: index("evidence_type_idx").on(table.type),
  expiryDateIdx: index("evidence_expiryDate_idx").on(table.expiryDate),
}));

export type Evidence = typeof evidence.$inferSelect;
export type InsertEvidence = typeof evidence.$inferInsert;

/**
 * Evidence linkages - connects evidence to entities and scores
 */
export const evidenceLinkages = mysqlTable("evidenceLinkages", {
  id: int("id").autoincrement().primaryKey(),
  
  evidenceId: int("evidenceId").notNull().references(() => evidence.id, { onDelete: "cascade" }),
  
  // Linked entity
  linkedEntityType: mysqlEnum("linkedEntityType", [
    "feedstock",
    "supplier",
    "certificate",
    "abfi_score",
    "bankability_assessment",
    "grower_qualification",
    "supply_agreement",
    "project"
  ]).notNull(),
  linkedEntityId: int("linkedEntityId").notNull(),
  
  // Linkage semantics
  linkageType: mysqlEnum("linkageType", [
    "supports",
    "validates",
    "contradicts",
    "supersedes",
    "references"
  ]).default("supports").notNull(),
  
  // Weight in calculation (for score contributions)
  weightInCalculation: int("weightInCalculation"), // 0-100, null if not used in scoring
  
  // Linkage metadata
  linkedBy: int("linkedBy").notNull().references(() => users.id),
  linkageNotes: text("linkageNotes"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  evidenceIdIdx: index("evidenceLinkages_evidenceId_idx").on(table.evidenceId),
  entityIdx: index("evidenceLinkages_entity_idx").on(table.linkedEntityType, table.linkedEntityId),
}));

export type EvidenceLinkage = typeof evidenceLinkages.$inferSelect;
export type InsertEvidenceLinkage = typeof evidenceLinkages.$inferInsert;

/**
 * Certificate snapshots - immutable evidence and score freeze at issuance
 */
export const certificateSnapshots = mysqlTable("certificateSnapshots", {
  id: int("id").autoincrement().primaryKey(),
  
  certificateId: int("certificateId").notNull().references(() => certificates.id),
  
  snapshotDate: timestamp("snapshotDate").defaultNow().notNull(),
  snapshotHash: varchar("snapshotHash", { length: 64 }).notNull(), // SHA-256 of snapshot content
  
  // Frozen data at issuance
  frozenScoreData: json("frozenScoreData").$type<{
    abfiScore?: number;
    pillarScores?: Record<string, number>;
    rating?: string;
    calculationDate?: string;
    [key: string]: any;
  }>().notNull(),
  
  // Frozen evidence set (array of evidence IDs with hashes)
  frozenEvidenceSet: json("frozenEvidenceSet").$type<Array<{
    evidenceId: number;
    fileHash: string;
    type: string;
    issuedDate: string;
    issuerName: string;
  }>>().notNull(),
  
  // Immutability flag
  immutable: boolean("immutable").default(true).notNull(),
  
  // Audit
  createdBy: int("createdBy").notNull().references(() => users.id),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  certificateIdIdx: index("certificateSnapshots_certificateId_idx").on(table.certificateId),
  snapshotHashIdx: index("certificateSnapshots_snapshotHash_idx").on(table.snapshotHash),
}));

export type CertificateSnapshot = typeof certificateSnapshots.$inferSelect;
export type InsertCertificateSnapshot = typeof certificateSnapshots.$inferInsert;

// ============================================================================
// DELIVERY EVENTS (Phase 3: Physical Reality)
// ============================================================================

export const deliveryEvents = mysqlTable("deliveryEvents", {
  id: int("id").autoincrement().primaryKey(),
  
  agreementId: int("agreementId").notNull().references(() => supplyAgreements.id),
  
  // Scheduled vs Actual
  scheduledDate: timestamp("scheduledDate").notNull(),
  actualDate: timestamp("actualDate"),
  
  // Volume
  committedVolume: int("committedVolume").notNull(), // tonnes
  actualVolume: int("actualVolume"), // tonnes
  variancePercent: int("variancePercent"), // Calculated: (actual - committed) / committed * 100
  varianceReason: text("varianceReason"),
  
  // Performance flags
  onTime: boolean("onTime"), // actualDate <= scheduledDate
  qualityMet: boolean("qualityMet"),
  
  // Quality parameters (if tested)
  qualityTestId: int("qualityTestId").references(() => qualityTests.id),
  
  // Status
  status: mysqlEnum("status", [
    "scheduled",
    "in_transit",
    "delivered",
    "partial",
    "cancelled",
    "failed"
  ]).default("scheduled").notNull(),
  
  notes: text("notes"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  agreementIdIdx: index("deliveryEvents_agreementId_idx").on(table.agreementId),
  scheduledDateIdx: index("deliveryEvents_scheduledDate_idx").on(table.scheduledDate),
  statusIdx: index("deliveryEvents_status_idx").on(table.status),
}));

export type DeliveryEvent = typeof deliveryEvents.$inferSelect;
export type InsertDeliveryEvent = typeof deliveryEvents.$inferInsert;

// ============================================================================
// SEASONALITY PROFILES (Phase 3: Physical Reality)
// ============================================================================

export const seasonalityProfiles = mysqlTable("seasonalityProfiles", {
  id: int("id").autoincrement().primaryKey(),
  
  feedstockId: int("feedstockId").notNull().references(() => feedstocks.id),
  
  // Monthly availability (1-12)
  month: int("month").notNull(), // 1 = January, 12 = December
  availabilityPercent: int("availabilityPercent").notNull(), // 0-100
  
  // Peak season flags
  isPeakSeason: boolean("isPeakSeason").default(false),
  harvestWindowStart: timestamp("harvestWindowStart"),
  harvestWindowEnd: timestamp("harvestWindowEnd"),
  
  // Historical data
  historicalYield: int("historicalYield"), // tonnes in this month (historical average)
  
  notes: text("notes"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  feedstockIdIdx: index("seasonalityProfiles_feedstockId_idx").on(table.feedstockId),
  monthIdx: index("seasonalityProfiles_month_idx").on(table.month),
}));

export type SeasonalityProfile = typeof seasonalityProfiles.$inferSelect;
export type InsertSeasonalityProfile = typeof seasonalityProfiles.$inferInsert;

// ============================================================================
// CLIMATE EXPOSURE (Phase 3: Physical Reality)
// ============================================================================

export const climateExposure = mysqlTable("climateExposure", {
  id: int("id").autoincrement().primaryKey(),
  
  supplierId: int("supplierId").notNull().references(() => suppliers.id),
  feedstockId: int("feedstockId").references(() => feedstocks.id), // Optional: specific feedstock
  
  // Exposure type
  exposureType: mysqlEnum("exposureType", [
    "drought",
    "flood",
    "bushfire",
    "frost",
    "heatwave",
    "cyclone",
    "pest_outbreak"
  ]).notNull(),
  
  // Risk assessment
  riskLevel: mysqlEnum("riskLevel", ["low", "medium", "high", "extreme"]).notNull(),
  probabilityPercent: int("probabilityPercent"), // Annual probability (0-100)
  impactSeverity: mysqlEnum("impactSeverity", ["minor", "moderate", "major", "catastrophic"]),
  
  // Mitigation
  mitigationMeasures: text("mitigationMeasures"),
  insuranceCoverage: boolean("insuranceCoverage").default(false),
  insuranceValue: int("insuranceValue"), // AUD
  
  // Assessment metadata
  assessedDate: timestamp("assessedDate").notNull(),
  assessedBy: int("assessedBy").references(() => users.id),
  nextReviewDate: timestamp("nextReviewDate"),
  
  // Historical events
  lastEventDate: timestamp("lastEventDate"),
  lastEventImpact: text("lastEventImpact"),
  
  notes: text("notes"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  supplierIdIdx: index("climateExposure_supplierId_idx").on(table.supplierId),
  feedstockIdIdx: index("climateExposure_feedstockId_idx").on(table.feedstockId),
  riskLevelIdx: index("climateExposure_riskLevel_idx").on(table.riskLevel),
}));

export type ClimateExposure = typeof climateExposure.$inferSelect;
export type InsertClimateExposure = typeof climateExposure.$inferInsert;

// ============================================================================
// YIELD ESTIMATES (Phase 3: Physical Reality)
// ============================================================================

export const yieldEstimates = mysqlTable("yieldEstimates", {
  id: int("id").autoincrement().primaryKey(),
  
  feedstockId: int("feedstockId").notNull().references(() => feedstocks.id),
  
  // Time period
  year: int("year").notNull(),
  season: mysqlEnum("season", ["summer", "autumn", "winter", "spring", "annual"]),
  
  // Probabilistic estimates (tonnes/hectare)
  p50Yield: int("p50Yield").notNull(), // Median (50% confidence)
  p75Yield: int("p75Yield"), // 75% confidence (conservative)
  p90Yield: int("p90Yield"), // 90% confidence (very conservative)
  
  // Confidence and methodology
  confidenceLevel: mysqlEnum("confidenceLevel", ["low", "medium", "high"]).notNull(),
  methodology: text("methodology"), // e.g., "Historical average", "Agronomic model", "Expert judgment"
  weatherDependencyScore: int("weatherDependencyScore"), // 1-10 (10 = highly weather dependent)
  
  // Metadata
  estimatedBy: int("estimatedBy").references(() => users.id),
  estimatedDate: timestamp("estimatedDate").notNull(),
  
  notes: text("notes"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  feedstockIdIdx: index("yieldEstimates_feedstockId_idx").on(table.feedstockId),
  yearIdx: index("yieldEstimates_year_idx").on(table.year),
}));

export type YieldEstimate = typeof yieldEstimates.$inferSelect;
export type InsertYieldEstimate = typeof yieldEstimates.$inferInsert;

// ============================================================================
// SCORE EXPLAINABILITY (Phase 4)
// ============================================================================

export const scoreCalculations = mysqlTable("scoreCalculations", {
  id: int("id").autoincrement().primaryKey(),
  
  // Score reference
  scoreId: int("scoreId").notNull(), // References feedstock.id, bankabilityAssessment.id, etc.
  scoreType: mysqlEnum("scoreType", [
    "abfi_composite",
    "abfi_sustainability",
    "abfi_carbon",
    "abfi_quality",
    "abfi_reliability",
    "bankability_composite",
    "bankability_volume_security",
    "bankability_counterparty",
    "bankability_contract",
    "bankability_concentration",
    "bankability_operational",
    "grower_qualification"
  ]).notNull(),
  
  // Calculation metadata
  calculationTimestamp: timestamp("calculationTimestamp").notNull(),
  calculatedBy: int("calculatedBy").references(() => users.id),
  calculationEngineVersion: varchar("calculationEngineVersion", { length: 50 }), // e.g., "v2.1.3"
  
  // Inputs and weights
  inputsSnapshot: json("inputsSnapshot").$type<Record<string, any>>(), // All inputs used
  weightsUsed: json("weightsUsed").$type<Record<string, number>>(), // Weight for each component
  
  // Contribution breakdown
  contributions: json("contributions").$type<Array<{
    component: string;
    inputValue: any;
    weight: number;
    contribution: number;
    notes?: string;
  }>>(),
  
  // Evidence linkages
  evidenceIds: json("evidenceIds").$type<number[]>(), // Which evidence influenced this score
  
  // Final result
  finalScore: int("finalScore").notNull(),
  rating: varchar("rating", { length: 20 }), // e.g., "AAA", "GQ1"
  
  // Admin overrides
  isOverridden: boolean("isOverridden").default(false),
  overrideReason: text("overrideReason"),
  overriddenBy: int("overriddenBy").references(() => users.id),
  overriddenAt: timestamp("overriddenAt"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  scoreIdIdx: index("scoreCalculations_scoreId_idx").on(table.scoreId),
  scoreTypeIdx: index("scoreCalculations_scoreType_idx").on(table.scoreType),
  timestampIdx: index("scoreCalculations_timestamp_idx").on(table.calculationTimestamp),
}));

export type ScoreCalculation = typeof scoreCalculations.$inferSelect;
export type InsertScoreCalculation = typeof scoreCalculations.$inferInsert;

// ============================================================================
// SCORE SENSITIVITY ANALYSIS (Phase 4)
// ============================================================================

export const scoreSensitivityAnalysis = mysqlTable("scoreSensitivityAnalysis", {
  id: int("id").autoincrement().primaryKey(),
  
  calculationId: int("calculationId").notNull().references(() => scoreCalculations.id),
  
  // Input field being analyzed
  inputField: varchar("inputField", { length: 100 }).notNull(),
  currentValue: varchar("currentValue", { length: 255 }).notNull(),
  
  // Sensitivity results
  deltaPlus10: int("deltaPlus10"), // Score change if input increases 10%
  deltaMinus10: int("deltaMinus10"), // Score change if input decreases 10%
  sensitivityCoefficient: int("sensitivityCoefficient"), // Stored as integer (multiply by 100)
  
  // Interpretation
  impactLevel: mysqlEnum("impactLevel", ["low", "medium", "high", "critical"]),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  calculationIdIdx: index("scoreSensitivityAnalysis_calculationId_idx").on(table.calculationId),
}));

export type ScoreSensitivityAnalysis = typeof scoreSensitivityAnalysis.$inferSelect;
export type InsertScoreSensitivityAnalysis = typeof scoreSensitivityAnalysis.$inferInsert;

// ============================================================================
// SCORE IMPROVEMENT SIMULATIONS (Phase 4)
// ============================================================================

export const scoreImprovementSimulations = mysqlTable("scoreImprovementSimulations", {
  id: int("id").autoincrement().primaryKey(),
  
  scoreId: int("scoreId").notNull(),
  scoreType: mysqlEnum("scoreType", [
    "abfi_composite",
    "bankability_composite",
    "grower_qualification"
  ]).notNull(),
  
  // Simulation parameters
  simulationDate: timestamp("simulationDate").notNull(),
  targetRating: varchar("targetRating", { length: 20 }).notNull(), // e.g., "AAA", "GQ1"
  
  // Required changes
  requiredChanges: json("requiredChanges").$type<Array<{
    field: string;
    currentValue: any;
    targetValue: any;
    changePercent: number;
    difficulty: "easy" | "moderate" | "hard" | "very_hard";
  }>>(),
  
  // Feasibility assessment
  feasibilityScore: int("feasibilityScore"), // 0-100
  estimatedTimelineDays: int("estimatedTimelineDays"),
  estimatedCost: int("estimatedCost"), // AUD
  
  // Recommendations
  recommendations: json("recommendations").$type<string[]>(),
  
  // Metadata
  simulatedBy: int("simulatedBy").references(() => users.id),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  scoreIdIdx: index("scoreImprovementSimulations_scoreId_idx").on(table.scoreId),
  targetRatingIdx: index("scoreImprovementSimulations_targetRating_idx").on(table.targetRating),
}));

export type ScoreImprovementSimulation = typeof scoreImprovementSimulations.$inferSelect;
export type InsertScoreImprovementSimulation = typeof scoreImprovementSimulations.$inferInsert;

// ============================================================================
// STRESS-TESTING ENGINE (Phase 6)
// ============================================================================

export const stressScenarios = mysqlTable("stressScenarios", {
  id: int("id").autoincrement().primaryKey(),
  
  // Scenario definition
  scenarioName: varchar("scenarioName", { length: 255 }).notNull(),
  scenarioType: mysqlEnum("scenarioType", [
    "supplier_loss",
    "regional_shock",
    "supply_shortfall",
    "price_spike",
    "quality_degradation",
    "cascading_failure"
  ]).notNull(),
  
  // Parameters (JSON structure depends on scenario type)
  parameters: json("parameters").$type<{
    supplierId?: number;
    supplierIds?: number[];
    region?: string;
    shortfallPercent?: number;
    priceIncreasePercent?: number;
    qualityDropPoints?: number;
    cascadeDepth?: number;
  }>(),
  
  // Metadata
  description: text("description"),
  createdBy: int("createdBy").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  
  // Reusability
  isTemplate: boolean("isTemplate").default(false),
}, (table) => ({
  scenarioTypeIdx: index("stressScenarios_scenarioType_idx").on(table.scenarioType),
}));

export type StressScenario = typeof stressScenarios.$inferSelect;
export type InsertStressScenario = typeof stressScenarios.$inferInsert;

// ============================================================================
// STRESS TEST RESULTS (Phase 6)
// ============================================================================

export const stressTestResults = mysqlTable("stressTestResults", {
  id: int("id").autoincrement().primaryKey(),
  
  projectId: int("projectId").notNull().references(() => projects.id),
  scenarioId: int("scenarioId").notNull().references(() => stressScenarios.id),
  
  // Test metadata
  testDate: timestamp("testDate").notNull(),
  testedBy: int("testedBy").references(() => users.id),
  
  // Base case (before stress)
  baseRating: varchar("baseRating", { length: 20 }).notNull(), // e.g., "AAA"
  baseScore: int("baseScore").notNull(),
  baseHhi: int("baseHhi"), // Herfindahl-Hirschman Index (0-10000)
  baseTier1Coverage: int("baseTier1Coverage"), // Percentage
  
  // Stress case (after stress)
  stressRating: varchar("stressRating", { length: 20 }).notNull(),
  stressScore: int("stressScore").notNull(),
  stressHhi: int("stressHhi"),
  stressTier1Coverage: int("stressTier1Coverage"),
  
  // Deltas
  ratingDelta: int("ratingDelta"), // Number of notches (e.g., AAA → AA = -1)
  scoreDelta: int("scoreDelta"),
  hhiDelta: int("hhiDelta"),
  
  // Supply impact
  supplyShortfallPercent: int("supplyShortfallPercent"), // 0-100
  remainingSuppliers: int("remainingSuppliers"),
  
  // Covenant breaches
  covenantBreaches: json("covenantBreaches").$type<Array<{
    covenantType: string;
    threshold: number;
    actualValue: number;
    breachSeverity: "minor" | "moderate" | "major" | "critical";
  }>>(),
  
  // Narrative
  narrativeSummary: text("narrativeSummary"),
  recommendations: json("recommendations").$type<string[]>(),
  
  // Pass/fail
  passesStressTest: boolean("passesStressTest").notNull(),
  minimumRatingMaintained: boolean("minimumRatingMaintained"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  projectIdIdx: index("stressTestResults_projectId_idx").on(table.projectId),
  scenarioIdIdx: index("stressTestResults_scenarioId_idx").on(table.scenarioId),
  testDateIdx: index("stressTestResults_testDate_idx").on(table.testDate),
}));

export type StressTestResult = typeof stressTestResults.$inferSelect;
export type InsertStressTestResult = typeof stressTestResults.$inferInsert;

// ============================================================================
// CONTRACT ENFORCEABILITY SCORES (Phase 6)
// ============================================================================

export const contractEnforceabilityScores = mysqlTable("contractEnforceabilityScores", {
  id: int("id").autoincrement().primaryKey(),
  
  agreementId: int("agreementId").notNull().references(() => supplyAgreements.id),
  
  // Legal framework
  governingLaw: varchar("governingLaw", { length: 100 }), // e.g., "New South Wales"
  jurisdiction: varchar("jurisdiction", { length: 100 }), // e.g., "Supreme Court of NSW"
  disputeResolution: mysqlEnum("disputeResolution", [
    "litigation",
    "arbitration",
    "mediation",
    "expert_determination"
  ]),
  
  // Component scores (0-10 each)
  terminationClauseScore: int("terminationClauseScore"), // Protections against early termination
  stepInRightsScore: int("stepInRightsScore"), // Lender ability to step in
  securityPackageScore: int("securityPackageScore"), // Collateral, guarantees
  remediesScore: int("remediesScore"), // Damages, specific performance
  jurisdictionScore: int("jurisdictionScore"), // Quality of legal system
  
  // Overall
  overallEnforceabilityScore: int("overallEnforceabilityScore").notNull(), // 0-50
  enforceabilityRating: mysqlEnum("enforceabilityRating", [
    "strong",
    "adequate",
    "weak",
    "very_weak"
  ]).notNull(),
  
  // Assessment metadata
  assessedBy: int("assessedBy").references(() => users.id),
  assessedDate: timestamp("assessedDate").notNull(),
  legalOpinionAttached: boolean("legalOpinionAttached").default(false),
  
  notes: text("notes"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  agreementIdIdx: index("contractEnforceabilityScores_agreementId_idx").on(table.agreementId),
}));

export type ContractEnforceabilityScore = typeof contractEnforceabilityScores.$inferSelect;
export type InsertContractEnforceabilityScore = typeof contractEnforceabilityScores.$inferInsert;

// ============================================================================
// COVENANT BREACH EVENTS (Phase 7)
// ============================================================================

export const covenantBreachEvents = mysqlTable("covenantBreachEvents", {
  id: int("id").autoincrement().primaryKey(),
  
  projectId: int("projectId").notNull().references(() => projects.id),
  covenantType: varchar("covenantType", { length: 100 }).notNull(), // e.g., "min_tier1_coverage"
  
  // Breach details
  breachDate: timestamp("breachDate").notNull(),
  detectedDate: timestamp("detectedDate").notNull(),
  severity: mysqlEnum("severity", ["info", "warning", "breach", "critical"]).notNull(),
  
  // Values
  actualValue: int("actualValue").notNull(),
  thresholdValue: int("thresholdValue").notNull(),
  variancePercent: int("variancePercent").notNull(), // How far from threshold
  
  // Narrative
  narrativeExplanation: text("narrativeExplanation"),
  impactAssessment: text("impactAssessment"),
  
  // Resolution
  resolved: boolean("resolved").default(false).notNull(),
  resolvedDate: timestamp("resolvedDate"),
  resolutionNotes: text("resolutionNotes"),
  resolvedBy: int("resolvedBy").references(() => users.id),
  
  // Notifications
  lenderNotified: boolean("lenderNotified").default(false),
  notifiedDate: timestamp("notifiedDate"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  projectIdIdx: index("covenantBreachEvents_projectId_idx").on(table.projectId),
  breachDateIdx: index("covenantBreachEvents_breachDate_idx").on(table.breachDate),
  severityIdx: index("covenantBreachEvents_severity_idx").on(table.severity),
  resolvedIdx: index("covenantBreachEvents_resolved_idx").on(table.resolved),
}));

export type CovenantBreachEvent = typeof covenantBreachEvents.$inferSelect;
export type InsertCovenantBreachEvent = typeof covenantBreachEvents.$inferInsert;

// ============================================================================
// LENDER REPORTS (Phase 7)
// ============================================================================

export const lenderReports = mysqlTable("lenderReports", {
  id: int("id").autoincrement().primaryKey(),
  
  projectId: int("projectId").notNull().references(() => projects.id),
  
  // Report period
  reportMonth: varchar("reportMonth", { length: 7 }).notNull(), // YYYY-MM format
  reportYear: int("reportYear").notNull(),
  reportQuarter: int("reportQuarter"), // 1-4
  
  // Generation metadata
  generatedDate: timestamp("generatedDate").notNull(),
  generatedBy: int("generatedBy").references(() => users.id),
  
  // Report artifacts
  reportPdfUrl: varchar("reportPdfUrl", { length: 500 }),
  evidencePackUrl: varchar("evidencePackUrl", { length: 500 }),
  manifestUrl: varchar("manifestUrl", { length: 500 }),
  
  // Content summaries
  executiveSummary: text("executiveSummary"),
  scoreChangesNarrative: text("scoreChangesNarrative"),
  covenantComplianceStatus: json("covenantComplianceStatus").$type<{
    compliant: boolean;
    breaches: number;
    warnings: number;
  }>(),
  supplyPositionSummary: json("supplyPositionSummary").$type<{
    tier1Coverage: number;
    tier2Coverage: number;
    totalSuppliers: number;
    hhi: number;
  }>(),
  
  // Evidence summary
  evidenceCount: int("evidenceCount").default(0),
  evidenceTypes: json("evidenceTypes").$type<string[]>(),
  
  // Status
  status: mysqlEnum("status", ["draft", "finalized", "sent", "acknowledged"]).notNull().default("draft"),
  finalizedDate: timestamp("finalizedDate"),
  sentDate: timestamp("sentDate"),
  acknowledgedDate: timestamp("acknowledgedDate"),
  acknowledgedBy: int("acknowledgedBy").references(() => users.id),
  
  // Distribution
  recipientEmails: json("recipientEmails").$type<string[]>(),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  projectIdIdx: index("lenderReports_projectId_idx").on(table.projectId),
  reportMonthIdx: index("lenderReports_reportMonth_idx").on(table.reportMonth),
  statusIdx: index("lenderReports_status_idx").on(table.status),
}));

export type LenderReport = typeof lenderReports.$inferSelect;
export type InsertLenderReport = typeof lenderReports.$inferInsert;

// ============================================================================
// ADMIN OVERRIDES (Phase 8)
// ============================================================================

export const adminOverrides = mysqlTable("adminOverrides", {
  id: int("id").autoincrement().primaryKey(),
  
  // Override details
  overrideType: mysqlEnum("overrideType", [
    "score",
    "rating",
    "status",
    "expiry",
    "certification",
    "evidence_validity"
  ]).notNull(),
  
  entityType: varchar("entityType", { length: 50 }).notNull(),
  entityId: int("entityId").notNull(),
  
  // Values
  originalValue: text("originalValue").notNull(), // JSON string
  overrideValue: text("overrideValue").notNull(), // JSON string
  
  // Justification (required for compliance)
  justification: text("justification").notNull(),
  riskAssessment: text("riskAssessment"), // Why this override is acceptable
  
  // Approval workflow
  requestedBy: int("requestedBy").notNull().references(() => users.id),
  approvedBy: int("approvedBy").references(() => users.id),
  overrideDate: timestamp("overrideDate").notNull(),
  approvalDate: timestamp("approvalDate"),
  
  // Expiry and revocation
  expiryDate: timestamp("expiryDate"),
  revoked: boolean("revoked").default(false).notNull(),
  revokedDate: timestamp("revokedDate"),
  revokedBy: int("revokedBy").references(() => users.id),
  revocationReason: text("revocationReason"),
  
  // Audit trail
  auditLogId: int("auditLogId").references(() => auditLogs.id),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  entityIdx: index("adminOverrides_entity_idx").on(table.entityType, table.entityId),
  overrideTypeIdx: index("adminOverrides_overrideType_idx").on(table.overrideType),
  revokedIdx: index("adminOverrides_revoked_idx").on(table.revoked),
}));

export type AdminOverride = typeof adminOverrides.$inferSelect;
export type InsertAdminOverride = typeof adminOverrides.$inferInsert;

// ============================================================================
// CERTIFICATE LEGAL METADATA (Phase 8)
// ============================================================================

export const certificateLegalMetadata = mysqlTable("certificateLegalMetadata", {
  id: int("id").autoincrement().primaryKey(),
  
  certificateId: int("certificateId").notNull().references(() => certificates.id),
  version: int("version").notNull().default(1),
  
  // Validity and provenance
  validityPeriod: varchar("validityPeriod", { length: 100 }), // e.g., "12 months from issuance"
  snapshotId: int("snapshotId").references(() => certificateSnapshots.id),
  
  // Issuer information
  issuerName: varchar("issuerName", { length: 255 }).notNull(),
  issuerRole: varchar("issuerRole", { length: 100 }).notNull(),
  issuerLicenseNumber: varchar("issuerLicenseNumber", { length: 100 }),
  
  // Legal framework
  governingLaw: varchar("governingLaw", { length: 100 }).notNull().default("New South Wales, Australia"),
  jurisdiction: varchar("jurisdiction", { length: 100 }).notNull().default("Australia"),
  
  // Disclaimers and limitations
  limitationStatements: text("limitationStatements").notNull(),
  disclaimers: text("disclaimers").notNull(),
  relianceTerms: text("relianceTerms").notNull(),
  liabilityCap: varchar("liabilityCap", { length: 255 }),
  
  // Certification scope
  certificationScope: text("certificationScope").notNull(),
  exclusions: text("exclusions"),
  assumptions: text("assumptions"),
  
  // Verification
  verificationUrl: varchar("verificationUrl", { length: 500 }),
  qrCodeUrl: varchar("qrCodeUrl", { length: 500 }),
  
  // Metadata
  createdBy: int("createdBy").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  certificateIdIdx: index("certificateLegalMetadata_certificateId_idx").on(table.certificateId),
  versionIdx: index("certificateLegalMetadata_version_idx").on(table.version),
}));

export type CertificateLegalMetadata = typeof certificateLegalMetadata.$inferSelect;
export type InsertCertificateLegalMetadata = typeof certificateLegalMetadata.$inferInsert;

// ============================================================================
// USER CONSENTS (Phase 8)
// ============================================================================

export const userConsents = mysqlTable("userConsents", {
  id: int("id").autoincrement().primaryKey(),
  
  userId: int("userId").notNull().references(() => users.id),
  
  // Consent details
  consentType: mysqlEnum("consentType", [
    "terms_of_service",
    "privacy_policy",
    "data_processing",
    "marketing",
    "third_party_sharing",
    "certification_reliance"
  ]).notNull(),
  
  consentVersion: varchar("consentVersion", { length: 20 }).notNull(), // e.g., "1.0", "2.1"
  consentText: text("consentText").notNull(), // Full text at time of consent
  
  // Consent status
  granted: boolean("granted").notNull(),
  grantedDate: timestamp("grantedDate"),
  
  // Withdrawal
  withdrawn: boolean("withdrawn").default(false).notNull(),
  withdrawnDate: timestamp("withdrawnDate"),
  
  // Tracking
  ipAddress: varchar("ipAddress", { length: 45 }),
  userAgent: text("userAgent"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  userIdIdx: index("userConsents_userId_idx").on(table.userId),
  consentTypeIdx: index("userConsents_consentType_idx").on(table.consentType),
  grantedIdx: index("userConsents_granted_idx").on(table.granted),
}));

export type UserConsent = typeof userConsents.$inferSelect;
export type InsertUserConsent = typeof userConsents.$inferInsert;

// ============================================================================
// DISPUTE RESOLUTION (Phase 8)
// ============================================================================

export const disputeResolutions = mysqlTable("disputeResolutions", {
  id: int("id").autoincrement().primaryKey(),
  
  // Dispute details
  disputeType: mysqlEnum("disputeType", [
    "score_accuracy",
    "certificate_validity",
    "evidence_authenticity",
    "contract_interpretation",
    "service_quality",
    "billing"
  ]).notNull(),
  
  // Parties
  raisedBy: int("raisedBy").notNull().references(() => users.id),
  respondent: int("respondent").references(() => users.id),
  
  // Related entities
  relatedEntityType: varchar("relatedEntityType", { length: 50 }),
  relatedEntityId: int("relatedEntityId"),
  
  // Dispute content
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  desiredOutcome: text("desiredOutcome"),
  
  // Evidence
  supportingEvidence: json("supportingEvidence").$type<Array<{
    type: string;
    url: string;
    description: string;
  }>>(),
  
  // Status
  status: mysqlEnum("status", [
    "submitted",
    "under_review",
    "investigation",
    "mediation",
    "arbitration",
    "resolved",
    "closed"
  ]).notNull().default("submitted"),
  
  priority: mysqlEnum("priority", ["low", "medium", "high", "urgent"]).notNull().default("medium"),
  
  // Resolution
  assignedTo: int("assignedTo").references(() => users.id),
  resolutionDate: timestamp("resolutionDate"),
  resolutionSummary: text("resolutionSummary"),
  resolutionOutcome: mysqlEnum("resolutionOutcome", [
    "upheld",
    "partially_upheld",
    "rejected",
    "withdrawn",
    "settled"
  ]),
  
  // Remediation
  remediationActions: json("remediationActions").$type<Array<{
    action: string;
    responsible: string;
    deadline: string;
    completed: boolean;
  }>>(),
  
  // Dates
  submittedDate: timestamp("submittedDate").notNull(),
  reviewStartDate: timestamp("reviewStartDate"),
  targetResolutionDate: timestamp("targetResolutionDate"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  raisedByIdx: index("disputeResolutions_raisedBy_idx").on(table.raisedBy),
  statusIdx: index("disputeResolutions_status_idx").on(table.status),
  priorityIdx: index("disputeResolutions_priority_idx").on(table.priority),
  submittedDateIdx: index("disputeResolutions_submittedDate_idx").on(table.submittedDate),
}));

export type DisputeResolution = typeof disputeResolutions.$inferSelect;
export type InsertDisputeResolution = typeof disputeResolutions.$inferInsert;

// ============================================================================
// DATA RETENTION POLICIES (Phase 8)
// ============================================================================

export const dataRetentionPolicies = mysqlTable("dataRetentionPolicies", {
  id: int("id").autoincrement().primaryKey(),
  
  // Policy details
  entityType: varchar("entityType", { length: 50 }).notNull().unique(),
  retentionPeriodDays: int("retentionPeriodDays").notNull(),
  
  // Deletion rules
  autoDelete: boolean("autoDelete").default(false).notNull(),
  archiveBeforeDelete: boolean("archiveBeforeDelete").default(true).notNull(),
  
  // Legal basis
  legalBasis: text("legalBasis").notNull(),
  regulatoryRequirement: varchar("regulatoryRequirement", { length: 255 }),
  
  // Policy metadata
  policyVersion: varchar("policyVersion", { length: 20 }).notNull(),
  effectiveDate: timestamp("effectiveDate").notNull(),
  reviewDate: timestamp("reviewDate"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type DataRetentionPolicy = typeof dataRetentionPolicies.$inferSelect;
export type InsertDataRetentionPolicy = typeof dataRetentionPolicies.$inferInsert;
