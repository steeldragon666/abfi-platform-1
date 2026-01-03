import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  date,
  varchar,
  decimal,
  json,
  boolean,
  index,
  unique,
  uniqueIndex,
} from "drizzle-orm/mysql-core";

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
  role: mysqlEnum("role", ["user", "admin", "supplier", "buyer", "auditor"])
    .default("user")
    .notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ============================================================================
// SUPPLIERS
// ============================================================================

export const suppliers = mysqlTable(
  "suppliers",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId")
      .notNull()
      .references(() => users.id),
    abn: varchar("abn", { length: 11 }).notNull().unique(),
    companyName: varchar("companyName", { length: 255 }).notNull(),
    contactEmail: varchar("contactEmail", { length: 320 }).notNull(),
    contactPhone: varchar("contactPhone", { length: 20 }),

    // Address
    addressLine1: varchar("addressLine1", { length: 255 }),
    addressLine2: varchar("addressLine2", { length: 255 }),
    city: varchar("city", { length: 100 }),
    state: mysqlEnum("state", [
      "NSW",
      "VIC",
      "QLD",
      "SA",
      "WA",
      "TAS",
      "NT",
      "ACT",
    ]),
    postcode: varchar("postcode", { length: 4 }),
    country: varchar("country", { length: 2 }).default("AU"),

    // Location (lat/lng for mapping)
    latitude: varchar("latitude", { length: 20 }),
    longitude: varchar("longitude", { length: 20 }),

    // Status
    verificationStatus: mysqlEnum("verificationStatus", [
      "pending",
      "verified",
      "suspended",
    ])
      .default("pending")
      .notNull(),
    subscriptionTier: mysqlEnum("subscriptionTier", [
      "starter",
      "professional",
      "enterprise",
    ])
      .default("starter")
      .notNull(),

    // Metadata
    description: text("description"),
    website: varchar("website", { length: 255 }),

    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => ({
    userIdIdx: index("suppliers_userId_idx").on(table.userId),
  })
);

export type Supplier = typeof suppliers.$inferSelect;
export type InsertSupplier = typeof suppliers.$inferInsert;

// ============================================================================
// PRODUCER PROPERTIES
// ============================================================================

export const properties = mysqlTable(
  "properties",
  {
    id: int("id").autoincrement().primaryKey(),
    supplierId: int("supplierId")
      .notNull()
      .references(() => suppliers.id),

    // Property identification
    propertyName: varchar("propertyName", { length: 255 }).notNull(),
    primaryAddress: varchar("primaryAddress", { length: 500 }),
    latitude: varchar("latitude", { length: 20 }),
    longitude: varchar("longitude", { length: 20 }),
    state: mysqlEnum("state", [
      "NSW",
      "VIC",
      "QLD",
      "SA",
      "WA",
      "TAS",
      "NT",
      "ACT",
    ]),
    postcode: varchar("postcode", { length: 4 }),
    region: varchar("region", { length: 100 }),

    // Land details
    totalLandArea: int("totalLandArea"), // hectares
    cultivatedArea: int("cultivatedArea"), // hectares
    propertyType: mysqlEnum("propertyType", ["freehold", "leasehold", "mixed"]),

    // Water access
    waterAccessType: mysqlEnum("waterAccessType", [
      "irrigated_surface",
      "irrigated_groundwater",
      "irrigated_recycled",
      "dryland",
      "mixed_irrigation",
    ]),

    // Legal identifiers
    lotPlanNumbers: text("lotPlanNumbers"),
    boundaryFileUrl: varchar("boundaryFileUrl", { length: 500 }), // KML/Shapefile in S3

    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => ({
    supplierIdIdx: index("properties_supplierId_idx").on(table.supplierId),
  })
);

export type Property = typeof properties.$inferSelect;
export type InsertProperty = typeof properties.$inferInsert;

// ============================================================================
// PRODUCTION HISTORY
// ============================================================================

export const productionHistory = mysqlTable(
  "production_history",
  {
    id: int("id").autoincrement().primaryKey(),
    propertyId: int("propertyId")
      .notNull()
      .references(() => properties.id),

    // Season data
    seasonYear: int("seasonYear").notNull(),
    cropType: varchar("cropType", { length: 100 }),
    plantedArea: int("plantedArea"), // hectares
    totalHarvest: int("totalHarvest"), // tonnes
    yieldPerHectare: int("yieldPerHectare"), // auto-calculated: t/ha

    // Weather impact
    weatherImpact: mysqlEnum("weatherImpact", [
      "normal",
      "drought",
      "flood",
      "other",
    ]),
    notes: text("notes"),

    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => ({
    propertyIdIdx: index("production_history_propertyId_idx").on(
      table.propertyId
    ),
    seasonYearIdx: index("production_history_seasonYear_idx").on(
      table.seasonYear
    ),
  })
);

export type ProductionHistory = typeof productionHistory.$inferSelect;
export type InsertProductionHistory = typeof productionHistory.$inferInsert;

// ============================================================================
// CARBON PRACTICES
// ============================================================================

export const carbonPractices = mysqlTable(
  "carbon_practices",
  {
    id: int("id").autoincrement().primaryKey(),
    propertyId: int("propertyId")
      .notNull()
      .references(() => properties.id),

    // Tillage
    tillagePractice: mysqlEnum("tillagePractice", [
      "no_till",
      "minimum_till",
      "conventional",
      "multiple_passes",
    ]),

    // Fertilizer
    nitrogenKgPerHa: int("nitrogenKgPerHa"),
    fertiliserType: mysqlEnum("fertiliserType", [
      "urea",
      "anhydrous_ammonia",
      "dap_map",
      "organic_compost",
      "controlled_release",
      "mixed_blend",
    ]),
    applicationMethod: mysqlEnum("applicationMethod", [
      "broadcast",
      "banded",
      "injected",
      "fertigation",
      "variable_rate",
    ]),
    soilTestingFrequency: mysqlEnum("soilTestingFrequency", [
      "annual",
      "biennial",
      "rarely",
      "never",
    ]),

    // Crop protection
    herbicideApplicationsPerSeason: int("herbicideApplicationsPerSeason"),
    pesticideApplicationsPerSeason: int("pesticideApplicationsPerSeason"),
    integratedPestManagementCertified: boolean(
      "integratedPestManagementCertified"
    ).default(false),
    organicCertified: boolean("organicCertified").default(false),

    // Machinery & energy
    heavyMachineryDaysPerYear: int("heavyMachineryDaysPerYear"),
    primaryTractorFuelType: mysqlEnum("primaryTractorFuelType", [
      "diesel",
      "biodiesel_blend",
      "electric",
      "other",
    ]),
    annualDieselConsumptionLitres: int("annualDieselConsumptionLitres"),
    harvesterType: mysqlEnum("harvesterType", ["owned", "contractor"]),
    irrigationPumpEnergySource: mysqlEnum("irrigationPumpEnergySource", [
      "grid",
      "solar",
      "diesel",
      "none",
    ]),

    // Transport
    averageOnFarmDistanceKm: int("averageOnFarmDistanceKm"),
    onFarmTransportMethod: mysqlEnum("onFarmTransportMethod", [
      "truck",
      "tractor_trailer",
      "conveyor",
      "pipeline",
    ]),

    // Land use & sequestration
    previousLandUse: mysqlEnum("previousLandUse", [
      "native_vegetation",
      "improved_pasture",
      "other_cropping",
      "plantation_forestry",
      "existing_crop_10plus",
    ]),
    nativeVegetationClearedDate: date("nativeVegetationClearedDate"),
    coverCroppingPracticed: boolean("coverCroppingPracticed").default(false),
    stubbleManagement: mysqlEnum("stubbleManagement", [
      "retain",
      "burn",
      "remove",
      "incorporate",
    ]),
    permanentVegetationHa: int("permanentVegetationHa"),
    registeredCarbonProject: boolean("registeredCarbonProject").default(false),
    carbonProjectId: varchar("carbonProjectId", { length: 100 }),

    // Calculated score
    estimatedCarbonIntensity: int("estimatedCarbonIntensity"), // gCO2e/MJ
    abfiRating: varchar("abfiRating", { length: 2 }), // A+, A, B+, etc.

    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => ({
    propertyIdIdx: index("carbon_practices_propertyId_idx").on(
      table.propertyId
    ),
  })
);

export type CarbonPractice = typeof carbonPractices.$inferSelect;
export type InsertCarbonPractice = typeof carbonPractices.$inferInsert;

// ============================================================================
// EXISTING CONTRACTS
// ============================================================================

export const existingContracts = mysqlTable(
  "existing_contracts",
  {
    id: int("id").autoincrement().primaryKey(),
    supplierId: int("supplierId")
      .notNull()
      .references(() => suppliers.id),

    buyerName: varchar("buyerName", { length: 255 }),
    isConfidential: boolean("isConfidential").default(false),
    contractedVolumeTonnes: int("contractedVolumeTonnes"),
    contractEndDate: date("contractEndDate"),
    isExclusive: boolean("isExclusive").default(false),
    hasFirstRightOfRefusal: boolean("hasFirstRightOfRefusal").default(false),
    renewalLikelihood: mysqlEnum("renewalLikelihood", [
      "likely",
      "unlikely",
      "unknown",
    ]),

    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => ({
    supplierIdIdx: index("existing_contracts_supplierId_idx").on(
      table.supplierId
    ),
  })
);

export type ExistingContract = typeof existingContracts.$inferSelect;
export type InsertExistingContract = typeof existingContracts.$inferInsert;

// ============================================================================
// MARKETPLACE LISTINGS
// ============================================================================

export const marketplaceListings = mysqlTable(
  "marketplace_listings",
  {
    id: int("id").autoincrement().primaryKey(),
    supplierId: int("supplierId")
      .notNull()
      .references(() => suppliers.id),
    feedstockId: int("feedstockId").references(() => feedstocks.id),

    // Volume availability
    tonnesAvailableThisSeason: int("tonnesAvailableThisSeason"),
    tonnesAvailableAnnually: int("tonnesAvailableAnnually"),
    minimumContractVolumeTonnes: int("minimumContractVolumeTonnes"),
    maximumSingleBuyerAllocationPercent: int(
      "maximumSingleBuyerAllocationPercent"
    ),
    spotSaleParcelsAvailable: boolean("spotSaleParcelsAvailable").default(
      false
    ),

    // Contract timeline
    contractDurationPreference: mysqlEnum("contractDurationPreference", [
      "spot_only",
      "up_to_1_year",
      "up_to_3_years",
      "up_to_5_years",
      "up_to_10_years",
      "flexible",
    ]),
    availableFromDate: date("availableFromDate"),
    availableUntilDate: date("availableUntilDate"),
    deliveryFlexibility: mysqlEnum("deliveryFlexibility", [
      "fixed_windows",
      "flexible",
      "call_off",
    ]),
    storageAvailableOnFarm: boolean("storageAvailableOnFarm").default(false),
    storageCapacityTonnes: int("storageCapacityTonnes"),

    // Pricing (sensitive - never shown publicly)
    breakEvenPricePerTonne: int("breakEvenPricePerTonne"),
    minimumAcceptablePricePerTonne: int("minimumAcceptablePricePerTonne"),
    targetMarginDollars: int("targetMarginDollars"),
    targetMarginPercent: int("targetMarginPercent"),
    priceIndexPreference: mysqlEnum("priceIndexPreference", [
      "fixed_price",
      "index_linked",
      "hybrid",
      "open_to_discussion",
    ]),
    premiumLowCarbonCert: int("premiumLowCarbonCert"),
    premiumLongTermCommitment: int("premiumLongTermCommitment"),
    premiumExclusivity: int("premiumExclusivity"),

    // Logistics
    deliveryTermsPreferred: mysqlEnum("deliveryTermsPreferred", [
      "ex_farm",
      "delivered_to_buyer",
      "fob_port",
      "flexible",
    ]),
    nearestTransportHub: varchar("nearestTransportHub", { length: 255 }),
    roadTrainAccessible: boolean("roadTrainAccessible").default(false),
    railSidingAccess: boolean("railSidingAccess").default(false),
    schedulingConstraints: text("schedulingConstraints"),

    // Visibility settings
    showPropertyLocation: mysqlEnum("showPropertyLocation", [
      "region_only",
      "lga",
      "exact_address",
    ]).default("region_only"),
    showBusinessName: boolean("showBusinessName").default(false),
    showProductionVolumes: mysqlEnum("showProductionVolumes", [
      "show",
      "show_range",
      "hide_until_matched",
    ]).default("show_range"),
    showCarbonScore: boolean("showCarbonScore").default(true),
    allowDirectContact: boolean("allowDirectContact").default(false),

    // Status
    status: mysqlEnum("status", [
      "draft",
      "published",
      "paused",
      "expired",
    ]).default("draft"),
    profileCompletenessPercent: int("profileCompletenessPercent"),

    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
    publishedAt: timestamp("publishedAt"),
  },
  table => ({
    supplierIdIdx: index("marketplace_listings_supplierId_idx").on(
      table.supplierId
    ),
    statusIdx: index("marketplace_listings_status_idx").on(table.status),
  })
);

export type MarketplaceListing = typeof marketplaceListings.$inferSelect;
export type InsertMarketplaceListing = typeof marketplaceListings.$inferInsert;

// ============================================================================
// BUYERS
// ============================================================================

export const buyers = mysqlTable(
  "buyers",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId")
      .notNull()
      .references(() => users.id),
    abn: varchar("abn", { length: 11 }).notNull().unique(),
    companyName: varchar("companyName", { length: 255 }).notNull(),
    contactEmail: varchar("contactEmail", { length: 320 }).notNull(),
    contactPhone: varchar("contactPhone", { length: 20 }),

    // Facility location
    facilityName: varchar("facilityName", { length: 255 }),
    facilityAddress: varchar("facilityAddress", { length: 500 }),
    facilityLatitude: varchar("facilityLatitude", { length: 20 }),
    facilityLongitude: varchar("facilityLongitude", { length: 20 }),
    facilityState: mysqlEnum("facilityState", [
      "NSW",
      "VIC",
      "QLD",
      "SA",
      "WA",
      "TAS",
      "NT",
      "ACT",
    ]),

    // Subscription
    subscriptionTier: mysqlEnum("subscriptionTier", [
      "explorer",
      "professional",
      "enterprise",
    ])
      .default("explorer")
      .notNull(),

    // Metadata
    description: text("description"),
    website: varchar("website", { length: 255 }),

    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => ({
    userIdIdx: index("buyers_userId_idx").on(table.userId),
  })
);

export type Buyer = typeof buyers.$inferSelect;
export type InsertBuyer = typeof buyers.$inferInsert;

// ============================================================================
// FEEDSTOCKS
// ============================================================================

export const feedstocks = mysqlTable(
  "feedstocks",
  {
    id: int("id").autoincrement().primaryKey(),

    // Unique ABFI ID: ABFI-[TYPE]-[STATE]-[XXXXXX]
    abfiId: varchar("abfiId", { length: 50 }).notNull().unique(),

    supplierId: int("supplierId")
      .notNull()
      .references(() => suppliers.id),

    // Classification
    category: mysqlEnum("category", [
      "oilseed",
      "UCO",
      "tallow",
      "lignocellulosic",
      "waste",
      "algae",
      "bamboo",
      "other",
    ]).notNull(),
    type: varchar("type", { length: 100 }).notNull(), // e.g., "canola", "used_cooking_oil", "beef_tallow"

    // Location
    sourceName: varchar("sourceName", { length: 255 }), // Property/facility name
    sourceAddress: varchar("sourceAddress", { length: 500 }),
    latitude: varchar("latitude", { length: 20 }).notNull(),
    longitude: varchar("longitude", { length: 20 }).notNull(),
    state: mysqlEnum("state", [
      "NSW",
      "VIC",
      "QLD",
      "SA",
      "WA",
      "TAS",
      "NT",
      "ACT",
    ]).notNull(),
    region: varchar("region", { length: 100 }), // NRM region

    // Production
    productionMethod: mysqlEnum("productionMethod", [
      "crop",
      "waste",
      "residue",
      "processing_byproduct",
    ]).notNull(),
    annualCapacityTonnes: int("annualCapacityTonnes").notNull(),
    availableVolumeCurrent: int("availableVolumeCurrent").notNull(),
    availableVolumeForward: json("availableVolumeForward").$type<
      Record<string, number>
    >(), // { "2025-01": 100, "2025-02": 150 }

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
    qualityParameters:
      json("qualityParameters").$type<
        Record<string, { value: number; unit: string }>
      >(),

    // Pricing (optional)
    pricePerTonne: int("pricePerTonne"), // Stored in cents to avoid decimal
    priceVisibility: mysqlEnum("priceVisibility", [
      "public",
      "private",
      "on_request",
    ]).default("on_request"),

    // Status
    status: mysqlEnum("status", [
      "draft",
      "pending_review",
      "active",
      "suspended",
    ])
      .default("draft")
      .notNull(),
    verificationLevel: mysqlEnum("verificationLevel", [
      "self_declared",
      "document_verified",
      "third_party_audited",
      "abfi_certified",
    ])
      .default("self_declared")
      .notNull(),

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
  },
  table => ({
    supplierIdIdx: index("feedstocks_supplierId_idx").on(table.supplierId),
    categoryIdx: index("feedstocks_category_idx").on(table.category),
    stateIdx: index("feedstocks_state_idx").on(table.state),
    statusIdx: index("feedstocks_status_idx").on(table.status),
    abfiScoreIdx: index("feedstocks_abfiScore_idx").on(table.abfiScore),
  })
);

export type Feedstock = typeof feedstocks.$inferSelect;
export type InsertFeedstock = typeof feedstocks.$inferInsert;

// ============================================================================
// CERTIFICATES
// ============================================================================

export const certificates = mysqlTable(
  "certificates",
  {
    id: int("id").autoincrement().primaryKey(),
    feedstockId: int("feedstockId")
      .notNull()
      .references(() => feedstocks.id),

    type: mysqlEnum("type", [
      "ISCC_EU",
      "ISCC_PLUS",
      "RSB",
      "RED_II",
      "GO",
      "ABFI",
      "OTHER",
    ]).notNull(),
    certificateNumber: varchar("certificateNumber", { length: 100 }),

    issuedDate: timestamp("issuedDate"),
    expiryDate: timestamp("expiryDate"),

    status: mysqlEnum("status", ["active", "expired", "revoked"])
      .default("active")
      .notNull(),

    // Document storage
    documentUrl: varchar("documentUrl", { length: 500 }),
    documentKey: varchar("documentKey", { length: 500 }), // S3 key

    // ABFI Certificate specific fields
    ratingGrade: varchar("ratingGrade", { length: 10 }), // A+, A, B+, etc.
    assessmentDate: timestamp("assessmentDate"),
    certificatePdfUrl: varchar("certificatePdfUrl", { length: 500 }),
    certificatePdfKey: varchar("certificatePdfKey", { length: 500 }), // S3 key for generated PDF

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
  },
  table => ({
    feedstockIdIdx: index("certificates_feedstockId_idx").on(table.feedstockId),
    expiryDateIdx: index("certificates_expiryDate_idx").on(table.expiryDate),
  })
);

export type Certificate = typeof certificates.$inferSelect;
export type InsertCertificate = typeof certificates.$inferInsert;

// ============================================================================
// QUALITY TESTS
// ============================================================================

export const qualityTests = mysqlTable(
  "qualityTests",
  {
    id: int("id").autoincrement().primaryKey(),
    feedstockId: int("feedstockId")
      .notNull()
      .references(() => feedstocks.id),

    testDate: timestamp("testDate").notNull(),
    laboratory: varchar("laboratory", { length: 255 }),

    // Test parameters and results (JSON structure)
    parameters: json("parameters").$type<
      Record<
        string,
        {
          value: number;
          unit: string;
          specification?: { min?: number; max?: number };
          pass: boolean;
        }
      >
    >(),

    // Overall result
    overallPass: boolean("overallPass").default(true),

    // Document storage
    reportUrl: varchar("reportUrl", { length: 500 }),
    reportKey: varchar("reportKey", { length: 500 }), // S3 key

    notes: text("notes"),

    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => ({
    feedstockIdIdx: index("qualityTests_feedstockId_idx").on(table.feedstockId),
    testDateIdx: index("qualityTests_testDate_idx").on(table.testDate),
  })
);

export type QualityTest = typeof qualityTests.$inferSelect;
export type InsertQualityTest = typeof qualityTests.$inferInsert;

// ============================================================================
// INQUIRIES
// ============================================================================

export const inquiries = mysqlTable(
  "inquiries",
  {
    id: int("id").autoincrement().primaryKey(),

    buyerId: int("buyerId")
      .notNull()
      .references(() => buyers.id),
    supplierId: int("supplierId")
      .notNull()
      .references(() => suppliers.id),
    feedstockId: int("feedstockId").references(() => feedstocks.id),

    // Inquiry details
    subject: varchar("subject", { length: 255 }).notNull(),
    message: text("message").notNull(),

    // Requirements
    volumeRequired: int("volumeRequired"), // tonnes
    deliveryLocation: varchar("deliveryLocation", { length: 500 }),
    deliveryTimeframeStart: timestamp("deliveryTimeframeStart"),
    deliveryTimeframeEnd: timestamp("deliveryTimeframeEnd"),
    qualityRequirements: json("qualityRequirements").$type<
      Record<string, { min?: number; max?: number }>
    >(),

    // Status
    status: mysqlEnum("status", ["open", "responded", "closed", "cancelled"])
      .default("open")
      .notNull(),

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
  },
  table => ({
    buyerIdIdx: index("inquiries_buyerId_idx").on(table.buyerId),
    supplierIdIdx: index("inquiries_supplierId_idx").on(table.supplierId),
    feedstockIdIdx: index("inquiries_feedstockId_idx").on(table.feedstockId),
    statusIdx: index("inquiries_status_idx").on(table.status),
  })
);

export type Inquiry = typeof inquiries.$inferSelect;
export type InsertInquiry = typeof inquiries.$inferInsert;

// ============================================================================
// TRANSACTIONS
// ============================================================================

export const transactions = mysqlTable(
  "transactions",
  {
    id: int("id").autoincrement().primaryKey(),

    feedstockId: int("feedstockId")
      .notNull()
      .references(() => feedstocks.id),
    supplierId: int("supplierId")
      .notNull()
      .references(() => suppliers.id),
    buyerId: int("buyerId")
      .notNull()
      .references(() => buyers.id),
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
      "cancelled",
    ])
      .default("pending")
      .notNull(),

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
  },
  table => ({
    feedstockIdIdx: index("transactions_feedstockId_idx").on(table.feedstockId),
    supplierIdIdx: index("transactions_supplierId_idx").on(table.supplierId),
    buyerIdIdx: index("transactions_buyerId_idx").on(table.buyerId),
    statusIdx: index("transactions_status_idx").on(table.status),
  })
);

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = typeof transactions.$inferInsert;

// ============================================================================
// NOTIFICATIONS
// ============================================================================

export const notifications = mysqlTable(
  "notifications",
  {
    id: int("id").autoincrement().primaryKey(),

    userId: int("userId")
      .notNull()
      .references(() => users.id),

    type: mysqlEnum("type", [
      "inquiry_received",
      "inquiry_response",
      "certificate_expiring",
      "transaction_update",
      "rating_change",
      "verification_update",
      "system_announcement",
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
  },
  table => ({
    userIdIdx: index("notifications_userId_idx").on(table.userId),
    readIdx: index("notifications_read_idx").on(table.read),
    createdAtIdx: index("notifications_createdAt_idx").on(table.createdAt),
  })
);

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

// ============================================================================
// SAVED SEARCHES (for buyers)
// ============================================================================

export const savedSearches = mysqlTable(
  "savedSearches",
  {
    id: int("id").autoincrement().primaryKey(),

    buyerId: int("buyerId")
      .notNull()
      .references(() => buyers.id),

    name: varchar("name", { length: 255 }).notNull(),

    // Search criteria (stored as JSON)
    criteria: json("criteria")
      .$type<{
        category?: string[];
        type?: string[];
        state?: string[];
        minAbfiScore?: number;
        maxCarbonIntensity?: number;
        certifications?: string[];
        minVolume?: number;
        maxDistance?: number;
        [key: string]: any;
      }>()
      .notNull(),

    // Notification preferences
    notifyOnNewMatches: boolean("notifyOnNewMatches").default(false),

    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => ({
    buyerIdIdx: index("savedSearches_buyerId_idx").on(table.buyerId),
  })
);

export type SavedSearch = typeof savedSearches.$inferSelect;
export type InsertSavedSearch = typeof savedSearches.$inferInsert;

// ============================================================================
// SAVED RADIUS ANALYSES (Feedstock Map)
// ============================================================================

export const savedAnalyses = mysqlTable(
  "savedAnalyses",
  {
    id: int("id").autoincrement().primaryKey(),

    userId: int("userId")
      .notNull()
      .references(() => users.id),

    // Analysis metadata
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),

    // Geographic parameters
    radiusKm: int("radiusKm").notNull(), // 10-200km
    centerLat: varchar("centerLat", { length: 20 }).notNull(),
    centerLng: varchar("centerLng", { length: 20 }).notNull(),

    // Analysis results (stored as JSON)
    results: json("results")
      .$type<{
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
      }>()
      .notNull(),

    // Filter state at time of analysis
    filterState: json("filterState").$type<{
      selectedStates: string[];
      visibleLayers: string[];
      capacityRanges: Record<string, { min: number; max: number }>;
    }>(),

    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => ({
    userIdIdx: index("savedAnalyses_userId_idx").on(table.userId),
    createdAtIdx: index("savedAnalyses_createdAt_idx").on(table.createdAt),
  })
);

export type SavedAnalysis = typeof savedAnalyses.$inferSelect;
export type InsertSavedAnalysis = typeof savedAnalyses.$inferInsert;

// ============================================================================
// AUDIT LOGS
// ============================================================================

export const auditLogs = mysqlTable(
  "auditLogs",
  {
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
  },
  table => ({
    userIdIdx: index("auditLogs_userId_idx").on(table.userId),
    entityIdx: index("auditLogs_entity_idx").on(
      table.entityType,
      table.entityId
    ),
    createdAtIdx: index("auditLogs_createdAt_idx").on(table.createdAt),
  })
);

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = typeof auditLogs.$inferInsert;

// ============================================================================
// BANKABILITY MODULE - Projects & Supply Agreements
// ============================================================================

export const projects = mysqlTable(
  "projects",
  {
    id: int("id").autoincrement().primaryKey(),

    userId: int("userId")
      .notNull()
      .references(() => users.id), // Project developer

    // Step 1: Project Overview
    name: varchar("name", { length: 255 }).notNull(),
    developerName: varchar("developerName", { length: 255 }),
    abn: varchar("abn", { length: 11 }),
    website: varchar("website", { length: 255 }),
    description: text("description"),
    region: varchar("region", { length: 100 }),
    siteAddress: varchar("siteAddress", { length: 500 }),
    developmentStage: mysqlEnum("developmentStage", [
      "concept",
      "prefeasibility",
      "feasibility",
      "fid",
      "construction",
      "operational",
    ]),

    // Facility details
    facilityLocation: varchar("facilityLocation", { length: 255 }),
    state: mysqlEnum("state", [
      "NSW",
      "VIC",
      "QLD",
      "SA",
      "WA",
      "TAS",
      "NT",
      "ACT",
    ]),
    latitude: varchar("latitude", { length: 20 }),
    longitude: varchar("longitude", { length: 20 }),

    // Step 2: Technology Details
    conversionTechnology: varchar("conversionTechnology", { length: 100 }),
    technologyProvider: varchar("technologyProvider", { length: 255 }),
    primaryOutput: varchar("primaryOutput", { length: 100 }),
    secondaryOutputs: text("secondaryOutputs"),
    nameplateCapacity: int("nameplateCapacity"), // tonnes per annum
    outputCapacity: int("outputCapacity"), // Output product capacity
    outputUnit: varchar("outputUnit", { length: 50 }),

    // Step 3: Feedstock Requirements
    feedstockType: varchar("feedstockType", { length: 100 }), // Primary feedstock type
    secondaryFeedstocks: text("secondaryFeedstocks"),
    annualFeedstockVolume: int("annualFeedstockVolume"), // tonnes per annum
    feedstockQualitySpecs: text("feedstockQualitySpecs"),
    supplyRadius: int("supplyRadius"), // km
    logisticsRequirements: text("logisticsRequirements"),

    // Step 4: Funding Status
    totalCapex: int("totalCapex"), // $M
    fundingSecured: int("fundingSecured"), // $M
    fundingSources: text("fundingSources"),
    investmentStage: mysqlEnum("investmentStage", [
      "seed",
      "series_a",
      "series_b",
      "pre_fid",
      "post_fid",
      "operational",
    ]),
    seekingInvestment: boolean("seekingInvestment").default(false),
    investmentAmount: int("investmentAmount"), // $M

    // Project timeline
    targetCOD: timestamp("targetCOD"), // Commercial Operation Date
    financialCloseTarget: timestamp("financialCloseTarget"),
    constructionStart: timestamp("constructionStart"),

    // Debt structure
    debtTenor: int("debtTenor"), // years

    // Step 5: Approvals & Permits
    environmentalApproval: boolean("environmentalApproval").default(false),
    planningPermit: boolean("planningPermit").default(false),
    epaLicense: boolean("epaLicense").default(false),
    otherApprovals: text("otherApprovals"),
    approvalsNotes: text("approvalsNotes"),

    // Step 6: Verification
    verificationStatus: mysqlEnum("verificationStatus", [
      "pending",
      "documents_submitted",
      "under_review",
      "verified",
      "rejected",
    ]).default("pending"),
    verificationDocuments: json("verificationDocuments").$type<string[]>(),
    verificationNotes: text("verificationNotes"),

    // Step 7: Opportunities
    feedstockMatchingEnabled: boolean("feedstockMatchingEnabled").default(true),
    financingInterest: boolean("financingInterest").default(false),
    partnershipInterest: boolean("partnershipInterest").default(false),
    publicVisibility: mysqlEnum("publicVisibility", [
      "private",
      "investors_only",
      "suppliers_only",
      "public",
    ]).default("private"),

    // Status
    status: mysqlEnum("status", [
      "draft",
      "submitted",
      "planning",
      "development",
      "financing",
      "construction",
      "operational",
      "suspended",
    ])
      .default("draft")
      .notNull(),

    // Registration progress
    registrationStep: int("registrationStep").default(1),
    registrationComplete: boolean("registrationComplete").default(false),

    // Supply targets (percentages)
    tier1Target: int("tier1Target").default(80), // % of capacity
    tier2Target: int("tier2Target").default(40),
    optionsTarget: int("optionsTarget").default(15),
    rofrTarget: int("rofrTarget").default(15),

    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => ({
    userIdIdx: index("projects_userId_idx").on(table.userId),
    statusIdx: index("projects_status_idx").on(table.status),
    verificationIdx: index("projects_verification_idx").on(
      table.verificationStatus
    ),
  })
);

export type Project = typeof projects.$inferSelect;
export type InsertProject = typeof projects.$inferInsert;

// ============================================================================
// SUPPLY AGREEMENTS
// ============================================================================

export const supplyAgreements = mysqlTable(
  "supplyAgreements",
  {
    id: int("id").autoincrement().primaryKey(),

    projectId: int("projectId")
      .notNull()
      .references(() => projects.id),
    supplierId: int("supplierId")
      .notNull()
      .references(() => suppliers.id),

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
      "spot_reference",
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
      "terminated",
    ])
      .default("draft")
      .notNull(),

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
  },
  table => ({
    projectIdIdx: index("supplyAgreements_projectId_idx").on(table.projectId),
    supplierIdIdx: index("supplyAgreements_supplierId_idx").on(
      table.supplierId
    ),
    tierIdx: index("supplyAgreements_tier_idx").on(table.tier),
    statusIdx: index("supplyAgreements_status_idx").on(table.status),
  })
);

export type SupplyAgreement = typeof supplyAgreements.$inferSelect;
export type InsertSupplyAgreement = typeof supplyAgreements.$inferInsert;

// ============================================================================
// GROWER QUALIFICATIONS
// ============================================================================

export const growerQualifications = mysqlTable(
  "growerQualifications",
  {
    id: int("id").autoincrement().primaryKey(),

    supplierId: int("supplierId")
      .notNull()
      .references(() => suppliers.id),

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
    status: mysqlEnum("status", ["pending", "approved", "expired", "revoked"])
      .default("pending")
      .notNull(),

    // Supporting documents
    documentsUrl: json("documentsUrl").$type<string[]>(),

    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => ({
    supplierIdIdx: index("growerQualifications_supplierId_idx").on(
      table.supplierId
    ),
    levelIdx: index("growerQualifications_level_idx").on(table.level),
    statusIdx: index("growerQualifications_status_idx").on(table.status),
    validUntilIdx: index("growerQualifications_validUntil_idx").on(
      table.validUntil
    ),
  })
);

export type GrowerQualification = typeof growerQualifications.$inferSelect;
export type InsertGrowerQualification =
  typeof growerQualifications.$inferInsert;

// ============================================================================
// BANKABILITY ASSESSMENTS
// ============================================================================

export const bankabilityAssessments = mysqlTable(
  "bankabilityAssessments",
  {
    id: int("id").autoincrement().primaryKey(),

    projectId: int("projectId")
      .notNull()
      .references(() => projects.id),

    // Assessment metadata
    assessmentNumber: varchar("assessmentNumber", { length: 50 })
      .notNull()
      .unique(), // ABFI-BANK-YYYY-NNNNN
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
    rating: mysqlEnum("rating", [
      "AAA",
      "AA",
      "A",
      "BBB",
      "BB",
      "B",
      "CCC",
    ]).notNull(),
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
      "rejected",
    ])
      .default("draft")
      .notNull(),

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
  },
  table => ({
    projectIdIdx: index("bankabilityAssessments_projectId_idx").on(
      table.projectId
    ),
    assessmentNumberIdx: index(
      "bankabilityAssessments_assessmentNumber_idx"
    ).on(table.assessmentNumber),
    ratingIdx: index("bankabilityAssessments_rating_idx").on(table.rating),
    statusIdx: index("bankabilityAssessments_status_idx").on(table.status),
    validUntilIdx: index("bankabilityAssessments_validUntil_idx").on(
      table.validUntil
    ),
  })
);

export type BankabilityAssessment = typeof bankabilityAssessments.$inferSelect;
export type InsertBankabilityAssessment =
  typeof bankabilityAssessments.$inferInsert;

// ============================================================================
// LENDER ACCESS
// ============================================================================

export const lenderAccess = mysqlTable(
  "lenderAccess",
  {
    id: int("id").autoincrement().primaryKey(),

    projectId: int("projectId")
      .notNull()
      .references(() => projects.id),

    // Lender details
    lenderName: varchar("lenderName", { length: 255 }).notNull(),
    lenderEmail: varchar("lenderEmail", { length: 320 }).notNull(),
    lenderContact: varchar("lenderContact", { length: 255 }),

    // Access control
    accessToken: varchar("accessToken", { length: 64 }).notNull().unique(),
    grantedBy: int("grantedBy")
      .notNull()
      .references(() => users.id),
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
    status: mysqlEnum("status", ["active", "suspended", "revoked", "expired"])
      .default("active")
      .notNull(),

    // Audit
    lastAccessedAt: timestamp("lastAccessedAt"),
    accessCount: int("accessCount").default(0),

    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => ({
    projectIdIdx: index("lenderAccess_projectId_idx").on(table.projectId),
    accessTokenIdx: index("lenderAccess_accessToken_idx").on(table.accessToken),
    statusIdx: index("lenderAccess_status_idx").on(table.status),
  })
);

export type LenderAccess = typeof lenderAccess.$inferSelect;
export type InsertLenderAccess = typeof lenderAccess.$inferInsert;

// ============================================================================
// COVENANT MONITORING
// ============================================================================

export const covenantMonitoring = mysqlTable(
  "covenantMonitoring",
  {
    id: int("id").autoincrement().primaryKey(),

    projectId: int("projectId")
      .notNull()
      .references(() => projects.id),

    // Covenant details
    covenantType: varchar("covenantType", { length: 100 }).notNull(), // e.g., "minimum_primary_coverage", "max_concentration"
    covenantDescription: text("covenantDescription"),

    // Threshold
    thresholdValue: varchar("thresholdValue", { length: 100 }).notNull(),
    thresholdOperator: mysqlEnum("thresholdOperator", [
      ">=",
      "<=",
      "=",
      ">",
      "<",
    ]).notNull(),

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
    checkFrequency: mysqlEnum("checkFrequency", [
      "daily",
      "weekly",
      "monthly",
      "quarterly",
    ]).notNull(),

    // Status
    status: mysqlEnum("status", [
      "active",
      "breached",
      "cured",
      "waived",
      "inactive",
    ])
      .default("active")
      .notNull(),

    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => ({
    projectIdIdx: index("covenantMonitoring_projectId_idx").on(table.projectId),
    statusIdx: index("covenantMonitoring_status_idx").on(table.status),
    lastCheckedAtIdx: index("covenantMonitoring_lastCheckedAt_idx").on(
      table.lastCheckedAt
    ),
  })
);

export type CovenantMonitoring = typeof covenantMonitoring.$inferSelect;
export type InsertCovenantMonitoring = typeof covenantMonitoring.$inferInsert;

// ============================================================================
// EVIDENCE CHAIN & DATA PROVENANCE
// ============================================================================

/**
 * Evidence objects - separate from document blobs
 * Provides cryptographic integrity, issuer identity, and linkage to scores
 */
export const evidence = mysqlTable(
  "evidence",
  {
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
      "other",
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
      "self_declared",
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
      "pending_verification",
    ])
      .default("valid")
      .notNull(),

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
    uploadedBy: int("uploadedBy")
      .notNull()
      .references(() => users.id),
    verifiedBy: int("verifiedBy").references(() => users.id),
    verifiedAt: timestamp("verifiedAt"),

    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => ({
    fileHashIdx: index("evidence_fileHash_idx").on(table.fileHash),
    statusIdx: index("evidence_status_idx").on(table.status),
    typeIdx: index("evidence_type_idx").on(table.type),
    expiryDateIdx: index("evidence_expiryDate_idx").on(table.expiryDate),
  })
);

export type Evidence = typeof evidence.$inferSelect;
export type InsertEvidence = typeof evidence.$inferInsert;

/**
 * Evidence linkages - connects evidence to entities and scores
 */
export const evidenceLinkages = mysqlTable(
  "evidenceLinkages",
  {
    id: int("id").autoincrement().primaryKey(),

    evidenceId: int("evidenceId")
      .notNull()
      .references(() => evidence.id, { onDelete: "cascade" }),

    // Linked entity
    linkedEntityType: mysqlEnum("linkedEntityType", [
      "feedstock",
      "supplier",
      "certificate",
      "abfi_score",
      "bankability_assessment",
      "grower_qualification",
      "supply_agreement",
      "project",
    ]).notNull(),
    linkedEntityId: int("linkedEntityId").notNull(),

    // Linkage semantics
    linkageType: mysqlEnum("linkageType", [
      "supports",
      "validates",
      "contradicts",
      "supersedes",
      "references",
    ])
      .default("supports")
      .notNull(),

    // Weight in calculation (for score contributions)
    weightInCalculation: int("weightInCalculation"), // 0-100, null if not used in scoring

    // Linkage metadata
    linkedBy: int("linkedBy")
      .notNull()
      .references(() => users.id),
    linkageNotes: text("linkageNotes"),

    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => ({
    evidenceIdIdx: index("evidenceLinkages_evidenceId_idx").on(
      table.evidenceId
    ),
    entityIdx: index("evidenceLinkages_entity_idx").on(
      table.linkedEntityType,
      table.linkedEntityId
    ),
  })
);

export type EvidenceLinkage = typeof evidenceLinkages.$inferSelect;
export type InsertEvidenceLinkage = typeof evidenceLinkages.$inferInsert;

/**
 * Certificate snapshots - immutable evidence and score freeze at issuance
 */
export const certificateSnapshots = mysqlTable(
  "certificateSnapshots",
  {
    id: int("id").autoincrement().primaryKey(),

    certificateId: int("certificateId")
      .notNull()
      .references(() => certificates.id),

    snapshotDate: timestamp("snapshotDate").defaultNow().notNull(),
    snapshotHash: varchar("snapshotHash", { length: 64 }).notNull(), // SHA-256 of snapshot content

    // Frozen data at issuance
    frozenScoreData: json("frozenScoreData")
      .$type<{
        abfiScore?: number;
        pillarScores?: Record<string, number>;
        rating?: string;
        calculationDate?: string;
        [key: string]: any;
      }>()
      .notNull(),

    // Frozen evidence set (array of evidence IDs with hashes)
    frozenEvidenceSet: json("frozenEvidenceSet")
      .$type<
        Array<{
          evidenceId: number;
          fileHash: string;
          type: string;
          issuedDate: string;
          issuerName: string;
        }>
      >()
      .notNull(),

    // Immutability flag
    immutable: boolean("immutable").default(true).notNull(),

    // Audit
    createdBy: int("createdBy")
      .notNull()
      .references(() => users.id),

    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => ({
    certificateIdIdx: index("certificateSnapshots_certificateId_idx").on(
      table.certificateId
    ),
    snapshotHashIdx: index("certificateSnapshots_snapshotHash_idx").on(
      table.snapshotHash
    ),
  })
);

export type CertificateSnapshot = typeof certificateSnapshots.$inferSelect;
export type InsertCertificateSnapshot =
  typeof certificateSnapshots.$inferInsert;

// ============================================================================
// DELIVERY EVENTS (Phase 3: Physical Reality)
// ============================================================================

export const deliveryEvents = mysqlTable(
  "deliveryEvents",
  {
    id: int("id").autoincrement().primaryKey(),

    agreementId: int("agreementId")
      .notNull()
      .references(() => supplyAgreements.id),

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
      "failed",
    ])
      .default("scheduled")
      .notNull(),

    notes: text("notes"),

    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => ({
    agreementIdIdx: index("deliveryEvents_agreementId_idx").on(
      table.agreementId
    ),
    scheduledDateIdx: index("deliveryEvents_scheduledDate_idx").on(
      table.scheduledDate
    ),
    statusIdx: index("deliveryEvents_status_idx").on(table.status),
  })
);

export type DeliveryEvent = typeof deliveryEvents.$inferSelect;
export type InsertDeliveryEvent = typeof deliveryEvents.$inferInsert;

// ============================================================================
// SEASONALITY PROFILES (Phase 3: Physical Reality)
// ============================================================================

export const seasonalityProfiles = mysqlTable(
  "seasonalityProfiles",
  {
    id: int("id").autoincrement().primaryKey(),

    feedstockId: int("feedstockId")
      .notNull()
      .references(() => feedstocks.id),

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
  },
  table => ({
    feedstockIdIdx: index("seasonalityProfiles_feedstockId_idx").on(
      table.feedstockId
    ),
    monthIdx: index("seasonalityProfiles_month_idx").on(table.month),
  })
);

export type SeasonalityProfile = typeof seasonalityProfiles.$inferSelect;
export type InsertSeasonalityProfile = typeof seasonalityProfiles.$inferInsert;

// ============================================================================
// CLIMATE EXPOSURE (Phase 3: Physical Reality)
// ============================================================================

export const climateExposure = mysqlTable(
  "climateExposure",
  {
    id: int("id").autoincrement().primaryKey(),

    supplierId: int("supplierId")
      .notNull()
      .references(() => suppliers.id),
    feedstockId: int("feedstockId").references(() => feedstocks.id), // Optional: specific feedstock

    // Exposure type
    exposureType: mysqlEnum("exposureType", [
      "drought",
      "flood",
      "bushfire",
      "frost",
      "heatwave",
      "cyclone",
      "pest_outbreak",
    ]).notNull(),

    // Risk assessment
    riskLevel: mysqlEnum("riskLevel", [
      "low",
      "medium",
      "high",
      "extreme",
    ]).notNull(),
    probabilityPercent: int("probabilityPercent"), // Annual probability (0-100)
    impactSeverity: mysqlEnum("impactSeverity", [
      "minor",
      "moderate",
      "major",
      "catastrophic",
    ]),

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
  },
  table => ({
    supplierIdIdx: index("climateExposure_supplierId_idx").on(table.supplierId),
    feedstockIdIdx: index("climateExposure_feedstockId_idx").on(
      table.feedstockId
    ),
    riskLevelIdx: index("climateExposure_riskLevel_idx").on(table.riskLevel),
  })
);

export type ClimateExposure = typeof climateExposure.$inferSelect;
export type InsertClimateExposure = typeof climateExposure.$inferInsert;

// ============================================================================
// YIELD ESTIMATES (Phase 3: Physical Reality)
// ============================================================================

export const yieldEstimates = mysqlTable(
  "yieldEstimates",
  {
    id: int("id").autoincrement().primaryKey(),

    feedstockId: int("feedstockId")
      .notNull()
      .references(() => feedstocks.id),

    // Time period
    year: int("year").notNull(),
    season: mysqlEnum("season", [
      "summer",
      "autumn",
      "winter",
      "spring",
      "annual",
    ]),

    // Probabilistic estimates (tonnes/hectare)
    p50Yield: int("p50Yield").notNull(), // Median (50% confidence)
    p75Yield: int("p75Yield"), // 75% confidence (conservative)
    p90Yield: int("p90Yield"), // 90% confidence (very conservative)

    // Confidence and methodology
    confidenceLevel: mysqlEnum("confidenceLevel", [
      "low",
      "medium",
      "high",
    ]).notNull(),
    methodology: text("methodology"), // e.g., "Historical average", "Agronomic model", "Expert judgment"
    weatherDependencyScore: int("weatherDependencyScore"), // 1-10 (10 = highly weather dependent)

    // Metadata
    estimatedBy: int("estimatedBy").references(() => users.id),
    estimatedDate: timestamp("estimatedDate").notNull(),

    notes: text("notes"),

    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => ({
    feedstockIdIdx: index("yieldEstimates_feedstockId_idx").on(
      table.feedstockId
    ),
    yearIdx: index("yieldEstimates_year_idx").on(table.year),
  })
);

export type YieldEstimate = typeof yieldEstimates.$inferSelect;
export type InsertYieldEstimate = typeof yieldEstimates.$inferInsert;

// ============================================================================
// SCORE EXPLAINABILITY (Phase 4)
// ============================================================================

export const scoreCalculations = mysqlTable(
  "scoreCalculations",
  {
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
      "grower_qualification",
    ]).notNull(),

    // Calculation metadata
    calculationTimestamp: timestamp("calculationTimestamp").notNull(),
    calculatedBy: int("calculatedBy").references(() => users.id),
    calculationEngineVersion: varchar("calculationEngineVersion", {
      length: 50,
    }), // e.g., "v2.1.3"

    // Inputs and weights
    inputsSnapshot: json("inputsSnapshot").$type<Record<string, any>>(), // All inputs used
    weightsUsed: json("weightsUsed").$type<Record<string, number>>(), // Weight for each component

    // Contribution breakdown
    contributions: json("contributions").$type<
      Array<{
        component: string;
        inputValue: any;
        weight: number;
        contribution: number;
        notes?: string;
      }>
    >(),

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
  },
  table => ({
    scoreIdIdx: index("scoreCalculations_scoreId_idx").on(table.scoreId),
    scoreTypeIdx: index("scoreCalculations_scoreType_idx").on(table.scoreType),
    timestampIdx: index("scoreCalculations_timestamp_idx").on(
      table.calculationTimestamp
    ),
  })
);

export type ScoreCalculation = typeof scoreCalculations.$inferSelect;
export type InsertScoreCalculation = typeof scoreCalculations.$inferInsert;

// ============================================================================
// SCORE SENSITIVITY ANALYSIS (Phase 4)
// ============================================================================

export const scoreSensitivityAnalysis = mysqlTable(
  "scoreSensitivityAnalysis",
  {
    id: int("id").autoincrement().primaryKey(),

    calculationId: int("calculationId")
      .notNull()
      .references(() => scoreCalculations.id),

    // Input field being analyzed
    inputField: varchar("inputField", { length: 100 }).notNull(),
    currentValue: varchar("currentValue", { length: 255 }).notNull(),

    // Sensitivity results
    deltaPlus10: int("deltaPlus10"), // Score change if input increases 10%
    deltaMinus10: int("deltaMinus10"), // Score change if input decreases 10%
    sensitivityCoefficient: int("sensitivityCoefficient"), // Stored as integer (multiply by 100)

    // Interpretation
    impactLevel: mysqlEnum("impactLevel", [
      "low",
      "medium",
      "high",
      "critical",
    ]),

    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => ({
    calculationIdIdx: index("scoreSensitivityAnalysis_calculationId_idx").on(
      table.calculationId
    ),
  })
);

export type ScoreSensitivityAnalysis =
  typeof scoreSensitivityAnalysis.$inferSelect;
export type InsertScoreSensitivityAnalysis =
  typeof scoreSensitivityAnalysis.$inferInsert;

// ============================================================================
// SCORE IMPROVEMENT SIMULATIONS (Phase 4)
// ============================================================================

export const scoreImprovementSimulations = mysqlTable(
  "scoreImprovementSimulations",
  {
    id: int("id").autoincrement().primaryKey(),

    scoreId: int("scoreId").notNull(),
    scoreType: mysqlEnum("scoreType", [
      "abfi_composite",
      "bankability_composite",
      "grower_qualification",
    ]).notNull(),

    // Simulation parameters
    simulationDate: timestamp("simulationDate").notNull(),
    targetRating: varchar("targetRating", { length: 20 }).notNull(), // e.g., "AAA", "GQ1"

    // Required changes
    requiredChanges: json("requiredChanges").$type<
      Array<{
        field: string;
        currentValue: any;
        targetValue: any;
        changePercent: number;
        difficulty: "easy" | "moderate" | "hard" | "very_hard";
      }>
    >(),

    // Feasibility assessment
    feasibilityScore: int("feasibilityScore"), // 0-100
    estimatedTimelineDays: int("estimatedTimelineDays"),
    estimatedCost: int("estimatedCost"), // AUD

    // Recommendations
    recommendations: json("recommendations").$type<string[]>(),

    // Metadata
    simulatedBy: int("simulatedBy").references(() => users.id),

    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => ({
    scoreIdIdx: index("scoreImprovementSimulations_scoreId_idx").on(
      table.scoreId
    ),
    targetRatingIdx: index("scoreImprovementSimulations_targetRating_idx").on(
      table.targetRating
    ),
  })
);

export type ScoreImprovementSimulation =
  typeof scoreImprovementSimulations.$inferSelect;
export type InsertScoreImprovementSimulation =
  typeof scoreImprovementSimulations.$inferInsert;

// ============================================================================
// STRESS-TESTING ENGINE (Phase 6)
// ============================================================================

export const stressScenarios = mysqlTable(
  "stressScenarios",
  {
    id: int("id").autoincrement().primaryKey(),

    // Scenario definition
    scenarioName: varchar("scenarioName", { length: 255 }).notNull(),
    scenarioType: mysqlEnum("scenarioType", [
      "supplier_loss",
      "regional_shock",
      "supply_shortfall",
      "price_spike",
      "quality_degradation",
      "cascading_failure",
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
  },
  table => ({
    scenarioTypeIdx: index("stressScenarios_scenarioType_idx").on(
      table.scenarioType
    ),
  })
);

export type StressScenario = typeof stressScenarios.$inferSelect;
export type InsertStressScenario = typeof stressScenarios.$inferInsert;

// ============================================================================
// STRESS TEST RESULTS (Phase 6)
// ============================================================================

export const stressTestResults = mysqlTable(
  "stressTestResults",
  {
    id: int("id").autoincrement().primaryKey(),

    projectId: int("projectId")
      .notNull()
      .references(() => projects.id),
    scenarioId: int("scenarioId")
      .notNull()
      .references(() => stressScenarios.id),

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
    covenantBreaches: json("covenantBreaches").$type<
      Array<{
        covenantType: string;
        threshold: number;
        actualValue: number;
        breachSeverity: "minor" | "moderate" | "major" | "critical";
      }>
    >(),

    // Narrative
    narrativeSummary: text("narrativeSummary"),
    recommendations: json("recommendations").$type<string[]>(),

    // Pass/fail
    passesStressTest: boolean("passesStressTest").notNull(),
    minimumRatingMaintained: boolean("minimumRatingMaintained"),

    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => ({
    projectIdIdx: index("stressTestResults_projectId_idx").on(table.projectId),
    scenarioIdIdx: index("stressTestResults_scenarioId_idx").on(
      table.scenarioId
    ),
    testDateIdx: index("stressTestResults_testDate_idx").on(table.testDate),
  })
);

export type StressTestResult = typeof stressTestResults.$inferSelect;
export type InsertStressTestResult = typeof stressTestResults.$inferInsert;

// ============================================================================
// CONTRACT ENFORCEABILITY SCORES (Phase 6)
// ============================================================================

export const contractEnforceabilityScores = mysqlTable(
  "contractEnforceabilityScores",
  {
    id: int("id").autoincrement().primaryKey(),

    agreementId: int("agreementId")
      .notNull()
      .references(() => supplyAgreements.id),

    // Legal framework
    governingLaw: varchar("governingLaw", { length: 100 }), // e.g., "New South Wales"
    jurisdiction: varchar("jurisdiction", { length: 100 }), // e.g., "Supreme Court of NSW"
    disputeResolution: mysqlEnum("disputeResolution", [
      "litigation",
      "arbitration",
      "mediation",
      "expert_determination",
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
      "very_weak",
    ]).notNull(),

    // Assessment metadata
    assessedBy: int("assessedBy").references(() => users.id),
    assessedDate: timestamp("assessedDate").notNull(),
    legalOpinionAttached: boolean("legalOpinionAttached").default(false),

    notes: text("notes"),

    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => ({
    agreementIdIdx: index("contractEnforceabilityScores_agreementId_idx").on(
      table.agreementId
    ),
  })
);

export type ContractEnforceabilityScore =
  typeof contractEnforceabilityScores.$inferSelect;
export type InsertContractEnforceabilityScore =
  typeof contractEnforceabilityScores.$inferInsert;

// ============================================================================
// COVENANT BREACH EVENTS (Phase 7)
// ============================================================================

export const covenantBreachEvents = mysqlTable(
  "covenantBreachEvents",
  {
    id: int("id").autoincrement().primaryKey(),

    projectId: int("projectId")
      .notNull()
      .references(() => projects.id),
    covenantType: varchar("covenantType", { length: 100 }).notNull(), // e.g., "min_tier1_coverage"

    // Breach details
    breachDate: timestamp("breachDate").notNull(),
    detectedDate: timestamp("detectedDate").notNull(),
    severity: mysqlEnum("severity", [
      "info",
      "warning",
      "breach",
      "critical",
    ]).notNull(),

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
  },
  table => ({
    projectIdIdx: index("covenantBreachEvents_projectId_idx").on(
      table.projectId
    ),
    breachDateIdx: index("covenantBreachEvents_breachDate_idx").on(
      table.breachDate
    ),
    severityIdx: index("covenantBreachEvents_severity_idx").on(table.severity),
    resolvedIdx: index("covenantBreachEvents_resolved_idx").on(table.resolved),
  })
);

export type CovenantBreachEvent = typeof covenantBreachEvents.$inferSelect;
export type InsertCovenantBreachEvent =
  typeof covenantBreachEvents.$inferInsert;

// ============================================================================
// LENDER REPORTS (Phase 7)
// ============================================================================

export const lenderReports = mysqlTable(
  "lenderReports",
  {
    id: int("id").autoincrement().primaryKey(),

    projectId: int("projectId")
      .notNull()
      .references(() => projects.id),

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
    status: mysqlEnum("status", ["draft", "finalized", "sent", "acknowledged"])
      .notNull()
      .default("draft"),
    finalizedDate: timestamp("finalizedDate"),
    sentDate: timestamp("sentDate"),
    acknowledgedDate: timestamp("acknowledgedDate"),
    acknowledgedBy: int("acknowledgedBy").references(() => users.id),

    // Distribution
    recipientEmails: json("recipientEmails").$type<string[]>(),

    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => ({
    projectIdIdx: index("lenderReports_projectId_idx").on(table.projectId),
    reportMonthIdx: index("lenderReports_reportMonth_idx").on(
      table.reportMonth
    ),
    statusIdx: index("lenderReports_status_idx").on(table.status),
  })
);

export type LenderReport = typeof lenderReports.$inferSelect;
export type InsertLenderReport = typeof lenderReports.$inferInsert;

// ============================================================================
// ADMIN OVERRIDES (Phase 8)
// ============================================================================

export const adminOverrides = mysqlTable(
  "adminOverrides",
  {
    id: int("id").autoincrement().primaryKey(),

    // Override details
    overrideType: mysqlEnum("overrideType", [
      "score",
      "rating",
      "status",
      "expiry",
      "certification",
      "evidence_validity",
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
    requestedBy: int("requestedBy")
      .notNull()
      .references(() => users.id),
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
  },
  table => ({
    entityIdx: index("adminOverrides_entity_idx").on(
      table.entityType,
      table.entityId
    ),
    overrideTypeIdx: index("adminOverrides_overrideType_idx").on(
      table.overrideType
    ),
    revokedIdx: index("adminOverrides_revoked_idx").on(table.revoked),
  })
);

export type AdminOverride = typeof adminOverrides.$inferSelect;
export type InsertAdminOverride = typeof adminOverrides.$inferInsert;

// ============================================================================
// CERTIFICATE LEGAL METADATA (Phase 8)
// ============================================================================

export const certificateLegalMetadata = mysqlTable(
  "certificateLegalMetadata",
  {
    id: int("id").autoincrement().primaryKey(),

    certificateId: int("certificateId")
      .notNull()
      .references(() => certificates.id),
    version: int("version").notNull().default(1),

    // Validity and provenance
    validityPeriod: varchar("validityPeriod", { length: 100 }), // e.g., "12 months from issuance"
    snapshotId: int("snapshotId").references(() => certificateSnapshots.id),

    // Issuer information
    issuerName: varchar("issuerName", { length: 255 }).notNull(),
    issuerRole: varchar("issuerRole", { length: 100 }).notNull(),
    issuerLicenseNumber: varchar("issuerLicenseNumber", { length: 100 }),

    // Legal framework
    governingLaw: varchar("governingLaw", { length: 100 })
      .notNull()
      .default("New South Wales, Australia"),
    jurisdiction: varchar("jurisdiction", { length: 100 })
      .notNull()
      .default("Australia"),

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
  },
  table => ({
    certificateIdIdx: index("certificateLegalMetadata_certificateId_idx").on(
      table.certificateId
    ),
    versionIdx: index("certificateLegalMetadata_version_idx").on(table.version),
  })
);

export type CertificateLegalMetadata =
  typeof certificateLegalMetadata.$inferSelect;
export type InsertCertificateLegalMetadata =
  typeof certificateLegalMetadata.$inferInsert;

// ============================================================================
// USER CONSENTS (Phase 8)
// ============================================================================

export const userConsents = mysqlTable(
  "userConsents",
  {
    id: int("id").autoincrement().primaryKey(),

    userId: int("userId")
      .notNull()
      .references(() => users.id),

    // Consent details
    consentType: mysqlEnum("consentType", [
      "terms_of_service",
      "privacy_policy",
      "data_processing",
      "marketing",
      "third_party_sharing",
      "certification_reliance",
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
  },
  table => ({
    userIdIdx: index("userConsents_userId_idx").on(table.userId),
    consentTypeIdx: index("userConsents_consentType_idx").on(table.consentType),
    grantedIdx: index("userConsents_granted_idx").on(table.granted),
  })
);

export type UserConsent = typeof userConsents.$inferSelect;
export type InsertUserConsent = typeof userConsents.$inferInsert;

// ============================================================================
// DISPUTE RESOLUTION (Phase 8)
// ============================================================================

export const disputeResolutions = mysqlTable(
  "disputeResolutions",
  {
    id: int("id").autoincrement().primaryKey(),

    // Dispute details
    disputeType: mysqlEnum("disputeType", [
      "score_accuracy",
      "certificate_validity",
      "evidence_authenticity",
      "contract_interpretation",
      "service_quality",
      "billing",
    ]).notNull(),

    // Parties
    raisedBy: int("raisedBy")
      .notNull()
      .references(() => users.id),
    respondent: int("respondent").references(() => users.id),

    // Related entities
    relatedEntityType: varchar("relatedEntityType", { length: 50 }),
    relatedEntityId: int("relatedEntityId"),

    // Dispute content
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description").notNull(),
    desiredOutcome: text("desiredOutcome"),

    // Evidence
    supportingEvidence: json("supportingEvidence").$type<
      Array<{
        type: string;
        url: string;
        description: string;
      }>
    >(),

    // Status
    status: mysqlEnum("status", [
      "submitted",
      "under_review",
      "investigation",
      "mediation",
      "arbitration",
      "resolved",
      "closed",
    ])
      .notNull()
      .default("submitted"),

    priority: mysqlEnum("priority", ["low", "medium", "high", "urgent"])
      .notNull()
      .default("medium"),

    // Resolution
    assignedTo: int("assignedTo").references(() => users.id),
    resolutionDate: timestamp("resolutionDate"),
    resolutionSummary: text("resolutionSummary"),
    resolutionOutcome: mysqlEnum("resolutionOutcome", [
      "upheld",
      "partially_upheld",
      "rejected",
      "withdrawn",
      "settled",
    ]),

    // Remediation
    remediationActions: json("remediationActions").$type<
      Array<{
        action: string;
        responsible: string;
        deadline: string;
        completed: boolean;
      }>
    >(),

    // Dates
    submittedDate: timestamp("submittedDate").notNull(),
    reviewStartDate: timestamp("reviewStartDate"),
    targetResolutionDate: timestamp("targetResolutionDate"),

    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => ({
    raisedByIdx: index("disputeResolutions_raisedBy_idx").on(table.raisedBy),
    statusIdx: index("disputeResolutions_status_idx").on(table.status),
    priorityIdx: index("disputeResolutions_priority_idx").on(table.priority),
    submittedDateIdx: index("disputeResolutions_submittedDate_idx").on(
      table.submittedDate
    ),
  })
);

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
export type InsertDataRetentionPolicy =
  typeof dataRetentionPolicies.$inferInsert;

// ============================================================================
// FINANCIAL INSTITUTIONS
// ============================================================================

export const financialInstitutions = mysqlTable(
  "financialInstitutions",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId")
      .notNull()
      .references(() => users.id),

    // Institution Details
    institutionName: varchar("institutionName", { length: 255 }).notNull(),
    abn: varchar("abn", { length: 11 }).notNull().unique(),
    institutionType: mysqlEnum("institutionType", [
      "commercial_bank",
      "investment_bank",
      "private_equity",
      "venture_capital",
      "insurance",
      "superannuation",
      "government_agency",
      "development_finance",
      "other",
    ]).notNull(),

    // Regulatory Information
    regulatoryBody: varchar("regulatoryBody", { length: 255 }),
    licenseNumber: varchar("licenseNumber", { length: 100 }),

    // Authorized Representative
    contactName: varchar("contactName", { length: 255 }).notNull(),
    contactTitle: varchar("contactTitle", { length: 255 }),
    contactEmail: varchar("contactEmail", { length: 320 }).notNull(),
    contactPhone: varchar("contactPhone", { length: 20 }),

    // Verification
    verificationMethod: mysqlEnum("verificationMethod", [
      "mygov_id",
      "document_upload",
      "manual_review",
    ]),
    verificationStatus: mysqlEnum("verificationStatus", [
      "pending",
      "verified",
      "rejected",
      "suspended",
    ])
      .default("pending")
      .notNull(),
    verifiedAt: timestamp("verifiedAt"),
    verifiedBy: int("verifiedBy").references(() => users.id),

    // Access Tier
    accessTier: mysqlEnum("accessTier", ["basic", "professional", "enterprise"])
      .default("basic")
      .notNull(),

    // Data Categories Access
    dataCategories: json("dataCategories").$type<string[]>(),

    // Compliance Declarations
    authorizedRepresentative: boolean("authorizedRepresentative")
      .default(false)
      .notNull(),
    dataProtection: boolean("dataProtection").default(false).notNull(),
    regulatoryCompliance: boolean("regulatoryCompliance")
      .default(false)
      .notNull(),
    termsAccepted: boolean("termsAccepted").default(false).notNull(),

    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => ({
    userIdIdx: index("financialInstitutions_userId_idx").on(table.userId),
    verificationStatusIdx: index(
      "financialInstitutions_verificationStatus_idx"
    ).on(table.verificationStatus),
  })
);

export type FinancialInstitution = typeof financialInstitutions.$inferSelect;
export type InsertFinancialInstitution =
  typeof financialInstitutions.$inferInsert;

// ============================================================================
// DEMAND SIGNAL REGISTRY (RFQ/Matching System)
// ============================================================================

export const demandSignals = mysqlTable(
  "demandSignals",
  {
    id: int("id").autoincrement().primaryKey(),

    buyerId: int("buyerId")
      .notNull()
      .references(() => buyers.id),
    userId: int("userId")
      .notNull()
      .references(() => users.id),

    // Signal metadata
    signalNumber: varchar("signalNumber", { length: 50 }).notNull().unique(), // ABFI-DS-YYYY-NNNNN
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),

    // Feedstock requirements
    feedstockType: varchar("feedstockType", { length: 100 }).notNull(),
    feedstockCategory: mysqlEnum("feedstockCategory", [
      "agricultural_residue",
      "forestry_residue",
      "energy_crop",
      "organic_waste",
      "algae_aquatic",
      "mixed",
    ]).notNull(),

    // Volume requirements
    annualVolume: int("annualVolume").notNull(), // tonnes per annum
    volumeFlexibility: int("volumeFlexibility"), // % flexibility (e.g., ±10%)
    deliveryFrequency: mysqlEnum("deliveryFrequency", [
      "continuous",
      "weekly",
      "fortnightly",
      "monthly",
      "quarterly",
      "seasonal",
      "spot",
    ]).notNull(),

    // Quality requirements
    minMoistureContent: int("minMoistureContent"), // %
    maxMoistureContent: int("maxMoistureContent"), // %
    minEnergyContent: int("minEnergyContent"), // MJ/kg
    maxAshContent: int("maxAshContent"), // %
    maxChlorineContent: int("maxChlorineContent"), // ppm
    otherQualitySpecs: text("otherQualitySpecs"),

    // Delivery requirements
    deliveryLocation: varchar("deliveryLocation", { length: 255 }).notNull(),
    deliveryState: mysqlEnum("deliveryState", [
      "NSW",
      "VIC",
      "QLD",
      "SA",
      "WA",
      "TAS",
      "NT",
      "ACT",
    ]),
    deliveryLatitude: varchar("deliveryLatitude", { length: 20 }),
    deliveryLongitude: varchar("deliveryLongitude", { length: 20 }),
    maxTransportDistance: int("maxTransportDistance"), // km
    deliveryMethod: mysqlEnum("deliveryMethod", [
      "ex_farm",
      "delivered",
      "fob_port",
      "negotiable",
    ]).notNull(),

    // Pricing
    indicativePriceMin: int("indicativePriceMin"), // AUD per tonne
    indicativePriceMax: int("indicativePriceMax"), // AUD per tonne
    pricingMechanism: mysqlEnum("pricingMechanism", [
      "fixed",
      "indexed",
      "spot",
      "negotiable",
    ]).notNull(),

    // Timeline
    supplyStartDate: timestamp("supplyStartDate").notNull(),
    supplyEndDate: timestamp("supplyEndDate"),
    contractTerm: int("contractTerm"), // years
    responseDeadline: timestamp("responseDeadline").notNull(),

    // Certification requirements
    requiredCertifications: json("requiredCertifications").$type<string[]>(),
    sustainabilityRequirements: text("sustainabilityRequirements"),

    // Status
    status: mysqlEnum("status", [
      "draft",
      "published",
      "closed",
      "awarded",
      "cancelled",
    ])
      .default("draft")
      .notNull(),

    // Visibility
    isPublic: boolean("isPublic").default(true).notNull(), // Show to all suppliers
    targetSuppliers: json("targetSuppliers").$type<number[]>(), // Specific supplier IDs if private

    // Pricing
    listingFee: int("listingFee"), // AUD paid by buyer to post
    listingFeePaid: boolean("listingFeePaid").default(false).notNull(),

    // Metrics
    viewCount: int("viewCount").default(0).notNull(),
    responseCount: int("responseCount").default(0).notNull(),

    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
    publishedAt: timestamp("publishedAt"),
    closedAt: timestamp("closedAt"),
  },
  table => ({
    buyerIdIdx: index("demandSignals_buyerId_idx").on(table.buyerId),
    statusIdx: index("demandSignals_status_idx").on(table.status),
    feedstockTypeIdx: index("demandSignals_feedstockType_idx").on(
      table.feedstockType
    ),
    deliveryStateIdx: index("demandSignals_deliveryState_idx").on(
      table.deliveryState
    ),
    responseDeadlineIdx: index("demandSignals_responseDeadline_idx").on(
      table.responseDeadline
    ),
  })
);

export type DemandSignal = typeof demandSignals.$inferSelect;
export type InsertDemandSignal = typeof demandSignals.$inferInsert;

export const supplierResponses = mysqlTable(
  "supplierResponses",
  {
    id: int("id").autoincrement().primaryKey(),

    demandSignalId: int("demandSignalId")
      .notNull()
      .references(() => demandSignals.id),
    supplierId: int("supplierId")
      .notNull()
      .references(() => suppliers.id),
    userId: int("userId")
      .notNull()
      .references(() => users.id),

    // Response metadata
    responseNumber: varchar("responseNumber", { length: 50 })
      .notNull()
      .unique(), // ABFI-SR-YYYY-NNNNN

    // Proposed supply
    proposedVolume: int("proposedVolume").notNull(), // tonnes per annum
    proposedPrice: int("proposedPrice").notNull(), // AUD per tonne
    proposedDeliveryMethod: varchar("proposedDeliveryMethod", { length: 100 }),
    proposedStartDate: timestamp("proposedStartDate").notNull(),
    proposedContractTerm: int("proposedContractTerm"), // years

    // Supplier message
    coverLetter: text("coverLetter"),

    // Linked resources
    linkedFeedstocks: json("linkedFeedstocks").$type<number[]>(), // Feedstock IDs
    linkedCertificates: json("linkedCertificates").$type<number[]>(), // Certificate IDs
    linkedEvidence: json("linkedEvidence").$type<number[]>(), // Evidence IDs

    // Matching score (calculated by system)
    matchScore: int("matchScore"), // 0-100
    matchReasons: json("matchReasons").$type<string[]>(),

    // Status
    status: mysqlEnum("status", [
      "submitted",
      "shortlisted",
      "rejected",
      "accepted",
      "withdrawn",
    ])
      .default("submitted")
      .notNull(),

    // Buyer actions
    viewedByBuyer: boolean("viewedByBuyer").default(false).notNull(),
    viewedAt: timestamp("viewedAt"),
    buyerNotes: text("buyerNotes"),

    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => ({
    demandSignalIdIdx: index("supplierResponses_demandSignalId_idx").on(
      table.demandSignalId
    ),
    supplierIdIdx: index("supplierResponses_supplierId_idx").on(
      table.supplierId
    ),
    statusIdx: index("supplierResponses_status_idx").on(table.status),
    matchScoreIdx: index("supplierResponses_matchScore_idx").on(
      table.matchScore
    ),
  })
);

export type SupplierResponse = typeof supplierResponses.$inferSelect;
export type InsertSupplierResponse = typeof supplierResponses.$inferInsert;

export const platformTransactions = mysqlTable(
  "platformTransactions",
  {
    id: int("id").autoincrement().primaryKey(),

    // Parties
    buyerId: int("buyerId")
      .notNull()
      .references(() => buyers.id),
    supplierId: int("supplierId")
      .notNull()
      .references(() => suppliers.id),

    // Source
    demandSignalId: int("demandSignalId").references(() => demandSignals.id),
    supplierResponseId: int("supplierResponseId").references(
      () => supplierResponses.id
    ),
    supplyAgreementId: int("supplyAgreementId").references(
      () => supplyAgreements.id
    ),

    // Transaction metadata
    transactionNumber: varchar("transactionNumber", { length: 50 })
      .notNull()
      .unique(), // ABFI-TXN-YYYY-NNNNN
    transactionType: mysqlEnum("transactionType", [
      "offtake_agreement",
      "spot_purchase",
      "listing_fee",
      "verification_fee",
      "subscription_fee",
      "assessment_fee",
    ]).notNull(),

    // Financial details
    contractValue: int("contractValue"), // AUD total contract value
    annualVolume: int("annualVolume"), // tonnes per annum
    platformFeePercent: varchar("platformFeePercent", { length: 10 }), // e.g., "0.5%"
    platformFeeAmount: int("platformFeeAmount"), // AUD

    // Status
    status: mysqlEnum("status", [
      "pending",
      "confirmed",
      "completed",
      "disputed",
      "cancelled",
    ])
      .default("pending")
      .notNull(),

    // Payment tracking
    invoiceIssued: boolean("invoiceIssued").default(false).notNull(),
    invoiceIssuedAt: timestamp("invoiceIssuedAt"),
    paymentReceived: boolean("paymentReceived").default(false).notNull(),
    paymentReceivedAt: timestamp("paymentReceivedAt"),

    // Audit
    confirmedBy: int("confirmedBy").references(() => users.id),
    confirmedAt: timestamp("confirmedAt"),

    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => ({
    buyerIdIdx: index("platformTransactions_buyerId_idx").on(table.buyerId),
    supplierIdIdx: index("platformTransactions_supplierId_idx").on(
      table.supplierId
    ),
    statusIdx: index("platformTransactions_status_idx").on(table.status),
    transactionTypeIdx: index("platformTransactions_transactionType_idx").on(
      table.transactionType
    ),
  })
);

export type PlatformTransaction = typeof platformTransactions.$inferSelect;
export type InsertPlatformTransaction =
  typeof platformTransactions.$inferInsert;

// ============================================================================
// FEEDSTOCK FUTURES (Long-term Perennial Crop Projections)
// ============================================================================

export const feedstockFutures = mysqlTable(
  "feedstock_futures",
  {
    id: int("id").autoincrement().primaryKey(),
    futuresId: varchar("futuresId", { length: 20 }).notNull().unique(), // FUT-2025-0001
    supplierId: int("supplierId")
      .notNull()
      .references(() => suppliers.id),

    // Crop details
    cropType: mysqlEnum("cropType", [
      "bamboo",
      "rotation_forestry",
      "eucalyptus",
      "poplar",
      "willow",
      "miscanthus",
      "switchgrass",
      "arundo_donax",
      "hemp",
      "other_perennial",
    ]).notNull(),
    cropVariety: varchar("cropVariety", { length: 100 }),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),

    // Location
    state: mysqlEnum("state", [
      "NSW",
      "VIC",
      "QLD",
      "SA",
      "WA",
      "TAS",
      "NT",
      "ACT",
    ]).notNull(),
    region: varchar("region", { length: 100 }),
    latitude: varchar("latitude", { length: 20 }),
    longitude: varchar("longitude", { length: 20 }),

    // Land
    landAreaHectares: decimal("landAreaHectares", {
      precision: 10,
      scale: 2,
    }).notNull(),
    landStatus: mysqlEnum("landStatus", [
      "owned",
      "leased",
      "under_negotiation",
      "planned_acquisition",
    ]).default("owned"),

    // Timeline
    projectionStartYear: int("projectionStartYear").notNull(),
    projectionEndYear: int("projectionEndYear").notNull(),
    plantingDate: date("plantingDate"),
    firstHarvestYear: int("firstHarvestYear"),

    // Volumes (calculated from projections)
    totalProjectedTonnes: decimal("totalProjectedTonnes", {
      precision: 12,
      scale: 2,
    }).default("0"),
    totalContractedTonnes: decimal("totalContractedTonnes", {
      precision: 12,
      scale: 2,
    }).default("0"),
    totalAvailableTonnes: decimal("totalAvailableTonnes", {
      precision: 12,
      scale: 2,
    }).default("0"),

    // Pricing
    indicativePricePerTonne: decimal("indicativePricePerTonne", {
      precision: 10,
      scale: 2,
    }),
    priceEscalationPercent: decimal("priceEscalationPercent", {
      precision: 5,
      scale: 2,
    }).default("2.5"),
    pricingNotes: text("pricingNotes"),

    // Quality expectations
    expectedCarbonIntensity: decimal("expectedCarbonIntensity", {
      precision: 6,
      scale: 2,
    }),
    expectedMoistureContent: decimal("expectedMoistureContent", {
      precision: 5,
      scale: 2,
    }),
    expectedEnergyContent: decimal("expectedEnergyContent", {
      precision: 6,
      scale: 2,
    }),

    // Status
    status: mysqlEnum("futuresStatus", [
      "draft",
      "active",
      "partially_contracted",
      "fully_contracted",
      "expired",
      "cancelled",
    ])
      .default("draft")
      .notNull(),
    publishedAt: timestamp("publishedAt"),

    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => ({
    supplierIdIdx: index("futures_supplierId_idx").on(table.supplierId),
    statusIdx: index("futures_status_idx").on(table.status),
    cropTypeIdx: index("futures_cropType_idx").on(table.cropType),
    stateIdx: index("futures_state_idx").on(table.state),
  })
);

export type FeedstockFutures = typeof feedstockFutures.$inferSelect;
export type InsertFeedstockFutures = typeof feedstockFutures.$inferInsert;

// ============================================================================
// FUTURES YIELD PROJECTIONS (Year-by-year projections)
// ============================================================================

export const futuresYieldProjections = mysqlTable(
  "futures_yield_projections",
  {
    id: int("id").autoincrement().primaryKey(),
    futuresId: int("futuresId")
      .notNull()
      .references(() => feedstockFutures.id, { onDelete: "cascade" }),

    projectionYear: int("projectionYear").notNull(),
    harvestSeason: varchar("harvestSeason", { length: 50 }),
    projectedTonnes: decimal("projectedTonnes", {
      precision: 10,
      scale: 2,
    }).notNull(),
    contractedTonnes: decimal("contractedTonnes", {
      precision: 10,
      scale: 2,
    }).default("0"),
    confidencePercent: int("confidencePercent").default(80),
    notes: text("notes"),

    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => ({
    futuresIdIdx: index("projections_futuresId_idx").on(table.futuresId),
    yearIdx: index("projections_year_idx").on(table.projectionYear),
    uniqueYearPerFutures: unique("projections_unique").on(
      table.futuresId,
      table.projectionYear
    ),
  })
);

export type FuturesYieldProjection =
  typeof futuresYieldProjections.$inferSelect;
export type InsertFuturesYieldProjection =
  typeof futuresYieldProjections.$inferInsert;

// ============================================================================
// FUTURES EOI (Expression of Interest from Buyers)
// ============================================================================

export const futuresEOI = mysqlTable(
  "futures_eoi",
  {
    id: int("id").autoincrement().primaryKey(),
    eoiReference: varchar("eoiReference", { length: 20 }).notNull().unique(), // EOI-2025-0001
    futuresId: int("futuresId")
      .notNull()
      .references(() => feedstockFutures.id),
    buyerId: int("buyerId")
      .notNull()
      .references(() => buyers.id),

    // Interest period
    interestStartYear: int("interestStartYear").notNull(),
    interestEndYear: int("interestEndYear").notNull(),

    // Volume
    annualVolumeTonnes: decimal("annualVolumeTonnes", {
      precision: 10,
      scale: 2,
    }).notNull(),
    totalVolumeTonnes: decimal("totalVolumeTonnes", {
      precision: 12,
      scale: 2,
    }).notNull(),

    // Pricing
    offeredPricePerTonne: decimal("offeredPricePerTonne", {
      precision: 10,
      scale: 2,
    }),
    priceTerms: text("priceTerms"),

    // Delivery
    deliveryLocation: varchar("deliveryLocation", { length: 255 }),
    deliveryFrequency: varchar("deliveryFrequency", { length: 50 }).default(
      "quarterly"
    ),
    logisticsNotes: text("logisticsNotes"),

    // Terms
    paymentTerms: varchar("paymentTerms", { length: 50 }).default("negotiable"),
    additionalTerms: text("additionalTerms"),

    // Status
    status: mysqlEnum("eoiStatus", [
      "pending",
      "under_review",
      "accepted",
      "declined",
      "expired",
      "withdrawn",
    ])
      .default("pending")
      .notNull(),
    supplierResponse: text("supplierResponse"),
    respondedAt: timestamp("respondedAt"),

    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => ({
    futuresIdIdx: index("eoi_futuresId_idx").on(table.futuresId),
    buyerIdIdx: index("eoi_buyerId_idx").on(table.buyerId),
    statusIdx: index("eoi_status_idx").on(table.status),
  })
);

export type FuturesEOI = typeof futuresEOI.$inferSelect;
export type InsertFuturesEOI = typeof futuresEOI.$inferInsert;

// ============================================================================
// RSIE v2.1 - DATA PROVENANCE FOUNDATION
// ============================================================================

/**
 * Data Sources Registry
 * Registry of all external data providers for full provenance tracking
 */
export const dataSources = mysqlTable("data_sources", {
  id: int("id").autoincrement().primaryKey(),
  sourceKey: varchar("sourceKey", { length: 64 }).notNull().unique(), // e.g. 'silo', 'open_meteo', 'nasa_firms'
  name: varchar("name", { length: 128 }).notNull(),
  licenseClass: mysqlEnum("licenseClass", [
    "CC_BY_4",
    "CC_BY_3",
    "COMMERCIAL",
    "RESTRICTED",
    "UNKNOWN",
  ]).notNull(),
  termsUrl: varchar("termsUrl", { length: 512 }),
  attributionText: varchar("attributionText", { length: 512 }),
  isEnabled: boolean("isEnabled").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type DataSource = typeof dataSources.$inferSelect;
export type InsertDataSource = typeof dataSources.$inferInsert;

/**
 * Ingestion Runs Audit Log
 * Every data ingestion job is logged for provenance
 */
export const ingestionRuns = mysqlTable(
  "ingestion_runs",
  {
    id: int("id").autoincrement().primaryKey(),
    sourceId: int("sourceId")
      .notNull()
      .references(() => dataSources.id),
    runType: mysqlEnum("runType", [
      "baseline",
      "weather",
      "impact",
      "policy",
      "spatial",
    ]).notNull(),
    status: mysqlEnum("status", [
      "started",
      "succeeded",
      "failed",
      "partial",
    ]).notNull(),
    startedAt: timestamp("startedAt").notNull(),
    finishedAt: timestamp("finishedAt"),
    recordsIn: int("recordsIn").default(0),
    recordsOut: int("recordsOut").default(0),
    errorMessage: text("errorMessage"),
    artifactUri: varchar("artifactUri", { length: 512 }), // raw payload snapshot location
    datasetVersion: varchar("datasetVersion", { length: 128 }), // CKAN revision, provider run id
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => ({
    sourceIdIdx: index("ingestion_source_idx").on(table.sourceId),
    startedAtIdx: index("ingestion_started_idx").on(table.startedAt),
  })
);

export type IngestionRun = typeof ingestionRuns.$inferSelect;
export type InsertIngestionRun = typeof ingestionRuns.$inferInsert;

/**
 * RSIE Scoring Methods
 * Versioned scoring rubric definitions for audit trail
 */
export const rsieScoringMethods = mysqlTable("rsie_scoring_methods", {
  id: int("id").autoincrement().primaryKey(),
  methodVersion: varchar("methodVersion", { length: 32 }).notNull().unique(), // e.g. 'rsie-score-v1.0'
  definitionJson: json("definitionJson").notNull(), // weights, thresholds, mappings
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type RsieScoringMethod = typeof rsieScoringMethods.$inferSelect;
export type InsertRsieScoringMethod = typeof rsieScoringMethods.$inferInsert;

// ============================================================================
// RSIE v2.1 - RISK EVENTS
// ============================================================================

/**
 * Risk Events
 * Append-only table with deterministic fingerprint for all risk events
 */
export const riskEvents = mysqlTable(
  "risk_events",
  {
    id: int("id").autoincrement().primaryKey(),

    eventType: mysqlEnum("eventType", [
      "drought",
      "cyclone",
      "storm",
      "flood",
      "bushfire",
      "heatwave",
      "frost",
      "pest",
      "disease",
      "policy",
      "industrial_action",
      "logistics_disruption",
    ]).notNull(),

    eventClass: mysqlEnum("eventClass", [
      "hazard",
      "biosecurity",
      "systemic",
    ])
      .notNull()
      .default("hazard"),

    eventStatus: mysqlEnum("eventStatus", ["watch", "active", "resolved"])
      .notNull()
      .default("active"),

    severity: mysqlEnum("severity", ["low", "medium", "high", "critical"]).notNull(),

    affectedRegionGeojson: json("affectedRegionGeojson").notNull(),

    // Bounding box for prefiltering (required for MySQL + GeoJSON approach)
    bboxMinLat: decimal("bboxMinLat", { precision: 9, scale: 6 }),
    bboxMinLng: decimal("bboxMinLng", { precision: 9, scale: 6 }),
    bboxMaxLat: decimal("bboxMaxLat", { precision: 9, scale: 6 }),
    bboxMaxLng: decimal("bboxMaxLng", { precision: 9, scale: 6 }),

    startDate: timestamp("startDate").notNull(),
    endDate: timestamp("endDate"),

    scoreTotal: int("scoreTotal").notNull(),
    scoreComponents: json("scoreComponents").notNull(),
    confidence: decimal("confidence", { precision: 4, scale: 3 }).notNull(),
    methodVersion: varchar("methodVersion", { length: 32 }).notNull(),

    sourceId: int("sourceId").references(() => dataSources.id),
    sourceRefs: json("sourceRefs"),
    ingestionRunId: int("ingestionRunId").references(() => ingestionRuns.id),

    eventFingerprint: varchar("eventFingerprint", { length: 64 }).notNull().unique(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => ({
    eventTypeIdx: index("risk_event_type_idx").on(table.eventType),
    eventStatusIdx: index("risk_event_status_idx").on(table.eventStatus),
    startDateIdx: index("risk_event_start_idx").on(table.startDate),
    bboxIdx: index("risk_event_bbox_idx").on(
      table.bboxMinLat,
      table.bboxMaxLat,
      table.bboxMinLng,
      table.bboxMaxLng
    ),
  })
);

export type RiskEvent = typeof riskEvents.$inferSelect;
export type InsertRiskEvent = typeof riskEvents.$inferInsert;

// ============================================================================
// RSIE v2.1 - SUPPLIER SITES & EXPOSURE
// ============================================================================

/**
 * Supplier Sites
 * Supplier location polygons with bounding boxes for spatial queries
 */
export const supplierSites = mysqlTable(
  "supplier_sites",
  {
    id: int("id").autoincrement().primaryKey(),
    supplierId: int("supplierId")
      .notNull()
      .references(() => suppliers.id),
    name: varchar("name", { length: 128 }),
    regionState: varchar("regionState", { length: 8 }),
    sitePolygonGeojson: json("sitePolygonGeojson").notNull(),

    bboxMinLat: decimal("bboxMinLat", { precision: 9, scale: 6 }),
    bboxMinLng: decimal("bboxMinLng", { precision: 9, scale: 6 }),
    bboxMaxLat: decimal("bboxMaxLat", { precision: 9, scale: 6 }),
    bboxMaxLng: decimal("bboxMaxLng", { precision: 9, scale: 6 }),

    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => ({
    supplierIdIdx: index("site_supplier_idx").on(table.supplierId),
    bboxIdx: index("site_bbox_idx").on(
      table.bboxMinLat,
      table.bboxMaxLat,
      table.bboxMinLng,
      table.bboxMaxLng
    ),
  })
);

export type SupplierSite = typeof supplierSites.$inferSelect;
export type InsertSupplierSite = typeof supplierSites.$inferInsert;

/**
 * Supplier Risk Exposure
 * Computed exposure between suppliers and risk events
 */
export const supplierRiskExposure = mysqlTable(
  "supplier_risk_exposure",
  {
    id: int("id").autoincrement().primaryKey(),
    supplierId: int("supplierId")
      .notNull()
      .references(() => suppliers.id),
    supplierSiteId: int("supplierSiteId").references(() => supplierSites.id),
    riskEventId: int("riskEventId")
      .notNull()
      .references(() => riskEvents.id),

    exposureFraction: decimal("exposureFraction", { precision: 6, scale: 4 }).notNull(), // 0..1
    estimatedImpactTonnes: decimal("estimatedImpactTonnes", {
      precision: 12,
      scale: 2,
    }).notNull(),
    mitigationStatus: mysqlEnum("mitigationStatus", ["none", "partial", "full"]).default(
      "none"
    ),

    computedAt: timestamp("computedAt").notNull(),
  },
  table => ({
    supplierIdIdx: index("exposure_supplier_idx").on(table.supplierId),
    riskEventIdIdx: index("exposure_event_idx").on(table.riskEventId),
    uniqueExposure: unique("exposure_unique").on(table.supplierId, table.riskEventId),
  })
);

export type SupplierRiskExposure = typeof supplierRiskExposure.$inferSelect;
export type InsertSupplierRiskExposure = typeof supplierRiskExposure.$inferInsert;

/**
 * Contract Risk Exposure
 * Roll-up from supplier exposure to contract level
 */
export const contractRiskExposure = mysqlTable(
  "contract_risk_exposure",
  {
    id: int("id").autoincrement().primaryKey(),
    contractId: int("contractId")
      .notNull()
      .references(() => existingContracts.id),
    riskEventId: int("riskEventId")
      .notNull()
      .references(() => riskEvents.id),

    exposureFraction: decimal("exposureFraction", { precision: 6, scale: 4 }).notNull(),
    contractedTonnesAtRisk: decimal("contractedTonnesAtRisk", {
      precision: 12,
      scale: 2,
    }).notNull(),
    deliveryWindowOverlapDays: int("deliveryWindowOverlapDays").notNull(),
    deliveryRiskScore: int("deliveryRiskScore").notNull(), // 0..100
    confidence: decimal("confidence", { precision: 4, scale: 3 }).notNull(),

    computedAt: timestamp("computedAt").notNull(),
  },
  table => ({
    contractIdIdx: index("contract_exposure_contract_idx").on(table.contractId),
    riskEventIdIdx: index("contract_exposure_event_idx").on(table.riskEventId),
    uniqueExposure: unique("contract_exposure_unique").on(
      table.contractId,
      table.riskEventId
    ),
  })
);

export type ContractRiskExposure = typeof contractRiskExposure.$inferSelect;
export type InsertContractRiskExposure = typeof contractRiskExposure.$inferInsert;

// ============================================================================
// RSIE v2.1 - WEATHER DATA
// ============================================================================

/**
 * Weather Grid Daily (SILO Historical)
 */
export const weatherGridDaily = mysqlTable(
  "weather_grid_daily",
  {
    id: int("id").autoincrement().primaryKey(),
    cellId: varchar("cellId", { length: 20 }).notNull(),
    date: date("date").notNull(),
    rainfall: decimal("rainfall", { precision: 6, scale: 2 }),
    tmin: decimal("tmin", { precision: 5, scale: 2 }),
    tmax: decimal("tmax", { precision: 5, scale: 2 }),
    et0: decimal("et0", { precision: 6, scale: 2 }),
    radiation: decimal("radiation", { precision: 6, scale: 2 }),
    vpd: decimal("vpd", { precision: 5, scale: 3 }),
    sourceId: int("sourceId").references(() => dataSources.id),
    ingestionRunId: int("ingestionRunId").references(() => ingestionRuns.id),
    retrievedAt: timestamp("retrievedAt"),
    qualityFlag: varchar("qualityFlag", { length: 10 }),
  },
  table => ({
    cellDateUnique: unique("weather_cell_date").on(table.cellId, table.date),
    cellIdIdx: index("weather_cell_idx").on(table.cellId),
    dateIdx: index("weather_date_idx").on(table.date),
  })
);

export type WeatherGridDaily = typeof weatherGridDaily.$inferSelect;
export type InsertWeatherGridDaily = typeof weatherGridDaily.$inferInsert;

/**
 * Forecast Grid Hourly (Open-Meteo)
 */
export const forecastGridHourly = mysqlTable(
  "forecast_grid_hourly",
  {
    id: int("id").autoincrement().primaryKey(),
    cellId: varchar("cellId", { length: 20 }).notNull(),
    forecastRunTime: timestamp("forecastRunTime").notNull(),
    hourTime: timestamp("hourTime").notNull(),
    soilMoisture0_7cm: decimal("soilMoisture0_7cm", { precision: 5, scale: 3 }),
    soilMoisture7_28cm: decimal("soilMoisture7_28cm", { precision: 5, scale: 3 }),
    soilTemp: decimal("soilTemp", { precision: 5, scale: 2 }),
    et0: decimal("et0", { precision: 6, scale: 2 }),
    rainfall: decimal("rainfall", { precision: 6, scale: 2 }),
    windSpeed: decimal("windSpeed", { precision: 5, scale: 2 }),
    sourceId: int("sourceId").references(() => dataSources.id),
    ingestionRunId: int("ingestionRunId").references(() => ingestionRuns.id),
    retrievedAt: timestamp("retrievedAt"),
  },
  table => ({
    forecastUnique: unique("forecast_unique").on(
      table.cellId,
      table.forecastRunTime,
      table.hourTime
    ),
    cellIdIdx: index("forecast_cell_idx").on(table.cellId),
    hourTimeIdx: index("forecast_hour_idx").on(table.hourTime),
  })
);

export type ForecastGridHourly = typeof forecastGridHourly.$inferSelect;
export type InsertForecastGridHourly = typeof forecastGridHourly.$inferInsert;

// ============================================================================
// RSIE v2.1 - USER FEEDBACK SURVEY
// ============================================================================

/**
 * User Feedback
 * Survey responses from users
 */
export const userFeedback = mysqlTable("user_feedback", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").references(() => users.id),
  sessionDurationMinutes: int("sessionDurationMinutes"),
  likes: json("likes"), // Array of enum strings
  improvements: json("improvements"), // Array of enum strings
  featureRequests: text("featureRequests"),
  npsScore: int("npsScore"), // 0-10
  otherFeedback: text("otherFeedback"),
  dismissedWithoutCompleting: boolean("dismissedWithoutCompleting").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type UserFeedback = typeof userFeedback.$inferSelect;
export type InsertUserFeedback = typeof userFeedback.$inferInsert;

// ============================================================================
// RSIE v2.1 - BASELINE DATA SNAPSHOTS
// ============================================================================

/**
 * ABBA Baseline Cells
 * Normalized snapshots of ABBA feedstock baseline data
 */
export const abbaBaselineCells = mysqlTable(
  "abba_baseline_cells",
  {
    id: int("id").autoincrement().primaryKey(),
    datasetVersion: varchar("datasetVersion", { length: 128 }).notNull(),
    regionType: mysqlEnum("regionType", ["SA2", "SA4", "LGA"]).notNull(),
    regionCode: varchar("regionCode", { length: 16 }).notNull(),
    feedstockTypeKey: varchar("feedstockTypeKey", { length: 64 }).notNull(),
    annualDryTonnes: decimal("annualDryTonnes", { precision: 14, scale: 2 }).notNull(),

    methodRef: varchar("methodRef", { length: 512 }),
    confidence: decimal("confidence", { precision: 4, scale: 3 }).notNull(),
    sourceId: int("sourceId")
      .notNull()
      .references(() => dataSources.id),
    ingestionRunId: int("ingestionRunId")
      .notNull()
      .references(() => ingestionRuns.id),
    retrievedAt: timestamp("retrievedAt").notNull(),
  },
  table => ({
    versionRegionUnique: unique("abba_version_region").on(
      table.datasetVersion,
      table.regionType,
      table.regionCode,
      table.feedstockTypeKey
    ),
    regionIdx: index("abba_region_idx").on(table.regionType, table.regionCode),
  })
);

export type AbbaBaselineCell = typeof abbaBaselineCells.$inferSelect;
export type InsertAbbaBaselineCell = typeof abbaBaselineCells.$inferInsert;

/**
 * Biomass Quality Profiles
 * CSIRO quality data snapshots
 */
export const biomassQualityProfiles = mysqlTable("biomass_quality_profiles", {
  id: int("id").autoincrement().primaryKey(),
  feedstockTypeKey: varchar("feedstockTypeKey", { length: 64 }).notNull().unique(),

  hhvMjPerKg: decimal("hhvMjPerKg", { precision: 6, scale: 3 }),
  moisturePct: decimal("moisturePct", { precision: 5, scale: 2 }),
  ashPct: decimal("ashPct", { precision: 5, scale: 2 }),
  fixedCarbonPct: decimal("fixedCarbonPct", { precision: 5, scale: 2 }),
  volatileMatterPct: decimal("volatileMatterPct", { precision: 5, scale: 2 }),

  ultimateAnalysis: json("ultimateAnalysis"), // C/H/N/S/O where available
  ashComposition: json("ashComposition"),

  sourceId: int("sourceId")
    .notNull()
    .references(() => dataSources.id),
  ingestionRunId: int("ingestionRunId")
    .notNull()
    .references(() => ingestionRuns.id),
  retrievedAt: timestamp("retrievedAt").notNull(),

  confidence: decimal("confidence", { precision: 4, scale: 3 }).notNull(),
});

export type BiomassQualityProfile = typeof biomassQualityProfiles.$inferSelect;
export type InsertBiomassQualityProfile = typeof biomassQualityProfiles.$inferInsert;

/**
 * Spatial Layers Registry
 */
export const spatialLayers = mysqlTable("spatial_layers", {
  id: int("id").autoincrement().primaryKey(),
  layerKey: varchar("layerKey", { length: 64 }).notNull().unique(), // e.g. 'capad_2024', 'clum_2023_v2'
  layerType: mysqlEnum("layerType", [
    "polygon",
    "line",
    "raster_ref",
    "point",
  ]).notNull(),
  licenseClass: mysqlEnum("spatialLicenseClass", [
    "CC_BY_4",
    "CC_BY_3",
    "COMMERCIAL",
    "RESTRICTED",
    "UNKNOWN",
  ]).notNull(),

  datasetVersion: varchar("datasetVersion", { length: 128 }),
  storageUri: varchar("storageUri", { length: 512 }).notNull(), // where the snapshot lives
  retrievedAt: timestamp("retrievedAt").notNull(),

  sourceId: int("sourceId")
    .notNull()
    .references(() => dataSources.id),
  ingestionRunId: int("ingestionRunId")
    .notNull()
    .references(() => ingestionRuns.id),

  bbox: json("bbox"),
  notes: text("notes"),
});

export type SpatialLayer = typeof spatialLayers.$inferSelect;
export type InsertSpatialLayer = typeof spatialLayers.$inferInsert;

/**
 * Intelligence Items (News/Policy Feed)
 */
export const intelligenceItems = mysqlTable(
  "intelligence_items",
  {
    id: int("id").autoincrement().primaryKey(),
    itemType: mysqlEnum("itemType", ["news", "policy", "market_note"]).notNull(),
    title: varchar("title", { length: 256 }).notNull(),
    sourceUrl: varchar("sourceUrl", { length: 512 }).notNull(),
    publisher: varchar("publisher", { length: 128 }),
    publishedAt: timestamp("publishedAt"),

    summary: text("summary"),
    summaryModel: varchar("summaryModel", { length: 64 }),
    summaryGeneratedAt: timestamp("summaryGeneratedAt"),

    tags: json("tags"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => ({
    sourceUrlUnique: unique("intelligence_source_url").on(table.sourceUrl),
    itemTypeIdx: index("intelligence_type_idx").on(table.itemType),
    publishedAtIdx: index("intelligence_published_idx").on(table.publishedAt),
  })
);

export type IntelligenceItem = typeof intelligenceItems.$inferSelect;
export type InsertIntelligenceItem = typeof intelligenceItems.$inferInsert;

// ============================================================================
// ABFI v3.1 - EVIDENCE VAULT & CHAIN ANCHORING
// ============================================================================

/**
 * Evidence Manifests - Canonical JSON manifests with content-addressed storage
 * Per v3.1 spec: manifest_uri stored, never manifest_json in MySQL
 */
export const evidenceManifests = mysqlTable(
  "evidence_manifests",
  {
    id: int("id").autoincrement().primaryKey(),

    // Content-addressed storage (IPFS CID or S3 hash-named)
    manifestUri: varchar("manifestUri", { length: 512 }).notNull(),
    manifestHashSha256: varchar("manifestHashSha256", { length: 64 }).notNull(),

    // Document hash (the actual file this manifest describes)
    docHashSha256: varchar("docHashSha256", { length: 64 }).notNull(),

    // Source tracking
    sourceId: int("sourceId").references(() => dataSources.id),
    ingestionRunId: int("ingestionRunId").references(() => ingestionRuns.id),

    // Classification
    classification: mysqlEnum("classification", [
      "public",
      "internal",
      "confidential",
      "restricted",
    ])
      .default("internal")
      .notNull(),

    // Anchoring status
    anchorStatus: mysqlEnum("anchorStatus", [
      "pending",
      "batched",
      "anchored",
      "failed",
    ])
      .default("pending")
      .notNull(),
    anchorId: int("anchorId").references(() => chainAnchors.id),

    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => ({
    manifestHashIdx: index("manifest_hash_idx").on(table.manifestHashSha256),
    docHashIdx: index("manifest_doc_hash_idx").on(table.docHashSha256),
    anchorStatusIdx: index("manifest_anchor_status_idx").on(table.anchorStatus),
  })
);

export type EvidenceManifest = typeof evidenceManifests.$inferSelect;
export type InsertEvidenceManifest = typeof evidenceManifests.$inferInsert;

/**
 * Chain Anchors - Blockchain anchoring records with Merkle batching
 * Per v3.1 spec: Keccak-256 Merkle trees, daily/hourly batching
 */
export const chainAnchors = mysqlTable(
  "chain_anchors",
  {
    id: int("id").autoincrement().primaryKey(),

    // Merkle root
    merkleRoot: varchar("merkleRoot", { length: 66 }).notNull(), // 0x + 64 hex chars
    merkleAlgorithm: varchar("merkleAlgorithm", { length: 32 })
      .default("keccak256")
      .notNull(),
    leafCount: int("leafCount").notNull(),
    treeDepth: int("treeDepth").notNull(),

    // Chain transaction
    chainId: int("chainId").notNull(), // EVM chain ID
    chainName: varchar("chainName", { length: 64 }).notNull(),
    txHash: varchar("txHash", { length: 66 }), // Transaction hash once confirmed
    blockNumber: int("blockNumber"),
    blockTimestamp: timestamp("blockTimestamp"), // From block.timestamp

    // Contract details
    contractAddress: varchar("contractAddress", { length: 42 }).notNull(),
    anchorId: int("onChainAnchorId"), // ID returned from contract

    // Status
    status: mysqlEnum("status", [
      "pending",
      "submitted",
      "confirmed",
      "failed",
    ])
      .default("pending")
      .notNull(),
    errorMessage: text("errorMessage"),
    retryCount: int("retryCount").default(0).notNull(),

    // Batch metadata
    batchType: mysqlEnum("batchType", ["daily", "hourly", "manual"])
      .default("daily")
      .notNull(),
    batchPeriodStart: timestamp("batchPeriodStart").notNull(),
    batchPeriodEnd: timestamp("batchPeriodEnd").notNull(),

    createdAt: timestamp("createdAt").defaultNow().notNull(),
    confirmedAt: timestamp("confirmedAt"),
  },
  table => ({
    merkleRootIdx: index("anchor_merkle_root_idx").on(table.merkleRoot),
    txHashIdx: index("anchor_tx_hash_idx").on(table.txHash),
    statusIdx: index("anchor_status_idx").on(table.status),
    batchPeriodIdx: index("anchor_batch_period_idx").on(table.batchPeriodStart),
  })
);

export type ChainAnchor = typeof chainAnchors.$inferSelect;
export type InsertChainAnchor = typeof chainAnchors.$inferInsert;

/**
 * Merkle Proofs - Individual document proofs within batched anchors
 */
export const merkleProofs = mysqlTable(
  "merkle_proofs",
  {
    id: int("id").autoincrement().primaryKey(),

    anchorId: int("anchorId")
      .notNull()
      .references(() => chainAnchors.id),
    manifestId: int("manifestId")
      .notNull()
      .references(() => evidenceManifests.id),

    // Leaf data
    leafHash: varchar("leafHash", { length: 66 }).notNull(),
    leafIndex: int("leafIndex").notNull(),

    // Proof path (array of {hash, position} tuples)
    proofPath: json("proofPath")
      .$type<Array<{ hash: string; position: "left" | "right" }>>()
      .notNull(),

    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => ({
    anchorIdIdx: index("proof_anchor_idx").on(table.anchorId),
    manifestIdIdx: index("proof_manifest_idx").on(table.manifestId),
    leafHashIdx: index("proof_leaf_hash_idx").on(table.leafHash),
  })
);

export type MerkleProof = typeof merkleProofs.$inferSelect;
export type InsertMerkleProof = typeof merkleProofs.$inferInsert;

// ============================================================================
// ABFI v3.1 - SUPPLY CHAIN MODULE
// ============================================================================

/**
 * Consignments - Farm-to-facility supply chain tracking
 */
export const consignments = mysqlTable(
  "consignments",
  {
    id: int("id").autoincrement().primaryKey(),
    consignmentId: varchar("consignmentId", { length: 32 }).notNull().unique(), // CONS-YYYYMMDD-XXXXX

    // Origin
    originSupplierId: int("originSupplierId")
      .notNull()
      .references(() => suppliers.id),
    originPropertyId: int("originPropertyId").references(() => properties.id),
    originLat: decimal("originLat", { precision: 10, scale: 7 }),
    originLng: decimal("originLng", { precision: 10, scale: 7 }),

    // Destination
    destinationFacilityId: int("destinationFacilityId"),
    destinationName: varchar("destinationName", { length: 255 }),
    destinationLat: decimal("destinationLat", { precision: 10, scale: 7 }),
    destinationLng: decimal("destinationLng", { precision: 10, scale: 7 }),

    // Feedstock details
    feedstockId: int("feedstockId").references(() => feedstocks.id),
    feedstockType: varchar("feedstockType", { length: 100 }).notNull(),
    declaredVolumeTonnes: decimal("declaredVolumeTonnes", {
      precision: 12,
      scale: 3,
    }).notNull(),
    actualVolumeTonnes: decimal("actualVolumeTonnes", {
      precision: 12,
      scale: 3,
    }),

    // Dates
    harvestDate: date("harvestDate"),
    dispatchDate: timestamp("dispatchDate"),
    expectedArrivalDate: timestamp("expectedArrivalDate"),
    actualArrivalDate: timestamp("actualArrivalDate"),

    // Status & OTIF
    status: mysqlEnum("status", [
      "created",
      "dispatched",
      "in_transit",
      "delivered",
      "verified",
      "rejected",
    ])
      .default("created")
      .notNull(),
    otifStatus: mysqlEnum("otifStatus", [
      "pending",
      "on_time_in_full",
      "late",
      "short",
      "late_and_short",
      "rejected",
    ]).default("pending"),

    // Contract linkage
    agreementId: int("agreementId").references(() => supplyAgreements.id),

    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => ({
    consignmentIdIdx: unique("consignment_id_unique").on(table.consignmentId),
    originSupplierIdx: index("consignment_origin_idx").on(
      table.originSupplierId
    ),
    statusIdx: index("consignment_status_idx").on(table.status),
    dispatchDateIdx: index("consignment_dispatch_idx").on(table.dispatchDate),
  })
);

export type Consignment = typeof consignments.$inferSelect;
export type InsertConsignment = typeof consignments.$inferInsert;

/**
 * Freight Legs - Individual transport segments with emissions attribution
 */
export const freightLegs = mysqlTable(
  "freight_legs",
  {
    id: int("id").autoincrement().primaryKey(),

    consignmentId: int("consignmentId")
      .notNull()
      .references(() => consignments.id, { onDelete: "cascade" }),
    legNumber: int("legNumber").notNull(), // Sequence within consignment

    // Transport mode (ISO 14083 aligned)
    transportMode: mysqlEnum("transportMode", [
      "road_truck",
      "road_van",
      "rail_freight",
      "sea_container",
      "sea_bulk",
      "air_cargo",
      "barge",
      "pipeline",
    ]).notNull(),

    // Carrier details
    carrierName: varchar("carrierName", { length: 255 }),
    vehicleRegistration: varchar("vehicleRegistration", { length: 20 }),
    driverName: varchar("driverName", { length: 255 }),

    // Route
    originLat: decimal("originLat", { precision: 10, scale: 7 }).notNull(),
    originLng: decimal("originLng", { precision: 10, scale: 7 }).notNull(),
    originAddress: varchar("originAddress", { length: 500 }),
    destinationLat: decimal("destinationLat", { precision: 10, scale: 7 }).notNull(),
    destinationLng: decimal("destinationLng", { precision: 10, scale: 7 }).notNull(),
    destinationAddress: varchar("destinationAddress", { length: 500 }),

    // Distance
    distanceKm: decimal("distanceKm", { precision: 10, scale: 2 }).notNull(),
    distanceSource: mysqlEnum("distanceSource", [
      "gps_actual",
      "route_calculated",
      "straight_line",
      "declared",
    ])
      .default("route_calculated")
      .notNull(),

    // Timing
    departureTime: timestamp("departureTime"),
    arrivalTime: timestamp("arrivalTime"),

    // Emissions (ISO 14083)
    emissionsKgCo2e: decimal("emissionsKgCo2e", { precision: 12, scale: 4 }),
    emissionsFactor: decimal("emissionsFactor", { precision: 8, scale: 6 }), // kgCO2e/tonne-km
    emissionsMethodVersion: varchar("emissionsMethodVersion", { length: 32 }),

    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => ({
    consignmentIdx: index("freight_consignment_idx").on(table.consignmentId),
    transportModeIdx: index("freight_mode_idx").on(table.transportMode),
  })
);

export type FreightLeg = typeof freightLegs.$inferSelect;
export type InsertFreightLeg = typeof freightLegs.$inferInsert;

/**
 * Consignment Evidence - Photos, BOLs, weighbridge dockets
 */
export const consignmentEvidence = mysqlTable(
  "consignment_evidence",
  {
    id: int("id").autoincrement().primaryKey(),

    consignmentId: int("consignmentId")
      .notNull()
      .references(() => consignments.id, { onDelete: "cascade" }),

    evidenceType: mysqlEnum("evidenceType", [
      "harvest_photo",
      "loading_photo",
      "transit_photo",
      "delivery_photo",
      "weighbridge_docket",
      "bill_of_lading",
      "delivery_note",
      "quality_certificate",
      "invoice",
      "gps_track",
      "other",
    ]).notNull(),

    // File details
    fileUrl: varchar("fileUrl", { length: 512 }).notNull(),
    fileHashSha256: varchar("fileHashSha256", { length: 64 }).notNull(),
    mimeType: varchar("mimeType", { length: 100 }).notNull(),
    fileSizeBytes: int("fileSizeBytes").notNull(),

    // Geotag (for photos)
    capturedLat: decimal("capturedLat", { precision: 10, scale: 7 }),
    capturedLng: decimal("capturedLng", { precision: 10, scale: 7 }),
    capturedAt: timestamp("capturedAt"),

    // EXIF data
    deviceInfo: varchar("deviceInfo", { length: 255 }),
    exifData: json("exifData").$type<Record<string, any>>(),

    // Verification
    verified: boolean("verified").default(false).notNull(),
    verifiedBy: int("verifiedBy").references(() => users.id),
    verifiedAt: timestamp("verifiedAt"),

    uploadedBy: int("uploadedBy")
      .notNull()
      .references(() => users.id),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => ({
    consignmentIdx: index("cons_evidence_consignment_idx").on(
      table.consignmentId
    ),
    typeIdx: index("cons_evidence_type_idx").on(table.evidenceType),
    hashIdx: index("cons_evidence_hash_idx").on(table.fileHashSha256),
  })
);

export type ConsignmentEvidence = typeof consignmentEvidence.$inferSelect;
export type InsertConsignmentEvidence = typeof consignmentEvidence.$inferInsert;

// ============================================================================
// ABFI v3.1 - EMISSIONS ENGINE (ISO 14083, 14064-1, CORSIA)
// ============================================================================

/**
 * Emission Calculations - Versioned emission computations
 */
export const emissionCalculations = mysqlTable(
  "emission_calculations",
  {
    id: int("id").autoincrement().primaryKey(),

    // Scope
    calculationType: mysqlEnum("calculationType", [
      "transport_iso14083",
      "facility_scope1",
      "facility_scope2",
      "scope3_upstream",
      "scope3_downstream",
      "corsia_saf",
      "full_lifecycle",
    ]).notNull(),

    // Entity reference
    entityType: mysqlEnum("entityType", [
      "consignment",
      "freight_leg",
      "facility",
      "feedstock",
      "project",
      "product_batch",
    ]).notNull(),
    entityId: int("entityId").notNull(),

    // Method versioning
    methodologyVersion: varchar("methodologyVersion", { length: 32 }).notNull(),
    methodologyStandard: mysqlEnum("methodologyStandard", [
      "ISO_14083",
      "ISO_14064_1",
      "GHG_PROTOCOL",
      "CORSIA",
      "RED_II",
      "ABFI_INTERNAL",
    ]).notNull(),

    // Results
    totalEmissionsKgCo2e: decimal("totalEmissionsKgCo2e", {
      precision: 16,
      scale: 4,
    }).notNull(),
    emissionsIntensity: decimal("emissionsIntensity", {
      precision: 12,
      scale: 6,
    }), // per unit (gCO2e/MJ or kgCO2e/tonne)
    intensityUnit: varchar("intensityUnit", { length: 32 }),

    // Breakdown
    emissionsBreakdown: json("emissionsBreakdown").$type<{
      scope1?: number;
      scope2?: number;
      scope3?: number;
      transport?: number;
      processing?: number;
      feedstock?: number;
      distribution?: number;
      [key: string]: number | undefined;
    }>(),

    // Input snapshot (for reproducibility)
    inputSnapshot: json("inputSnapshot").$type<Record<string, any>>().notNull(),
    inputSnapshotHash: varchar("inputSnapshotHash", { length: 64 }).notNull(),

    // Uncertainty
    uncertaintyPercent: decimal("uncertaintyPercent", { precision: 5, scale: 2 }),
    dataQualityScore: int("dataQualityScore"), // 1-5

    // Audit
    calculatedBy: int("calculatedBy").references(() => users.id),
    calculatedAt: timestamp("calculatedAt").defaultNow().notNull(),

    // Anchoring
    anchorId: int("anchorId").references(() => evidenceManifests.id),
  },
  table => ({
    entityIdx: index("emission_entity_idx").on(table.entityType, table.entityId),
    methodIdx: index("emission_method_idx").on(table.methodologyStandard),
    calculatedAtIdx: index("emission_calculated_idx").on(table.calculatedAt),
  })
);

export type EmissionCalculation = typeof emissionCalculations.$inferSelect;
export type InsertEmissionCalculation = typeof emissionCalculations.$inferInsert;

/**
 * Emission Factors - Reference data for calculations
 */
export const emissionFactors = mysqlTable(
  "emission_factors",
  {
    id: int("id").autoincrement().primaryKey(),

    // Category
    category: mysqlEnum("category", [
      "transport_road",
      "transport_rail",
      "transport_sea",
      "transport_air",
      "electricity_grid",
      "fuel_combustion",
      "process_emissions",
      "fertilizer",
      "land_use",
    ]).notNull(),

    // Specifics
    subcategory: varchar("subcategory", { length: 100 }),
    region: varchar("region", { length: 64 }), // AU, NSW, etc.

    // Factor value
    factorValue: decimal("factorValue", { precision: 12, scale: 8 }).notNull(),
    factorUnit: varchar("factorUnit", { length: 64 }).notNull(), // e.g., kgCO2e/tonne-km

    // Source
    sourceStandard: varchar("sourceStandard", { length: 64 }).notNull(),
    sourceDocument: varchar("sourceDocument", { length: 255 }),
    sourceYear: int("sourceYear").notNull(),

    // Validity
    validFrom: date("validFrom").notNull(),
    validTo: date("validTo"),
    isCurrent: boolean("isCurrent").default(true).notNull(),

    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => ({
    categoryIdx: index("factor_category_idx").on(table.category),
    regionIdx: index("factor_region_idx").on(table.region),
    currentIdx: index("factor_current_idx").on(table.isCurrent),
  })
);

export type EmissionFactor = typeof emissionFactors.$inferSelect;
export type InsertEmissionFactor = typeof emissionFactors.$inferInsert;

// ============================================================================
// ABFI v3.1 - VERIFIABLE CREDENTIALS & DIDs
// ============================================================================

/**
 * DID Registry - Decentralized Identifiers for organizations
 */
export const didRegistry = mysqlTable(
  "did_registry",
  {
    id: int("id").autoincrement().primaryKey(),

    // DID identifier (did:web:abfi.au:org:supplier-123)
    did: varchar("did", { length: 255 }).notNull().unique(),
    didMethod: mysqlEnum("didMethod", ["did:web", "did:ethr", "did:key"])
      .default("did:web")
      .notNull(),

    // Controller
    controllerType: mysqlEnum("controllerType", [
      "organization",
      "user",
      "system",
    ]).notNull(),
    controllerId: int("controllerId").notNull(), // Supplier ID, User ID, etc.

    // DID Document
    didDocumentUri: varchar("didDocumentUri", { length: 512 }).notNull(),
    didDocumentHash: varchar("didDocumentHash", { length: 64 }).notNull(),

    // Keys
    publicKeyJwk: json("publicKeyJwk").$type<{
      kty: string;
      crv?: string;
      x?: string;
      y?: string;
      n?: string;
      e?: string;
    }>(),
    keyAlgorithm: varchar("keyAlgorithm", { length: 32 }).default("ES256"),

    // Status
    status: mysqlEnum("status", ["active", "revoked", "deactivated"])
      .default("active")
      .notNull(),
    revokedAt: timestamp("revokedAt"),
    revocationReason: text("revocationReason"),

    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => ({
    didIdx: unique("did_unique").on(table.did),
    controllerIdx: index("did_controller_idx").on(
      table.controllerType,
      table.controllerId
    ),
    statusIdx: index("did_status_idx").on(table.status),
  })
);

export type DidRecord = typeof didRegistry.$inferSelect;
export type InsertDidRecord = typeof didRegistry.$inferInsert;

/**
 * Verifiable Credentials - W3C compliant credential issuance
 */
export const verifiableCredentials = mysqlTable(
  "verifiable_credentials",
  {
    id: int("id").autoincrement().primaryKey(),

    // Credential identifier
    credentialId: varchar("credentialId", { length: 255 }).notNull().unique(),

    // Type
    credentialType: mysqlEnum("credentialType", [
      "GQTierCredential",
      "SupplyAgreementCredential",
      "EmissionsCertificate",
      "SustainabilityCertificate",
      "DeliveryConfirmation",
      "QualityAttestation",
      "AuditReport",
    ]).notNull(),

    // Issuer & Subject
    issuerDid: varchar("issuerDid", { length: 255 })
      .notNull()
      .references(() => didRegistry.did),
    subjectDid: varchar("subjectDid", { length: 255 }).notNull(),

    // Credential content (stored as content-addressed)
    credentialUri: varchar("credentialUri", { length: 512 }).notNull(),
    credentialHash: varchar("credentialHash", { length: 64 }).notNull(),

    // Claims summary (searchable subset)
    claimsSummary: json("claimsSummary").$type<Record<string, any>>(),

    // Validity
    issuanceDate: timestamp("issuanceDate").notNull(),
    expirationDate: timestamp("expirationDate"),

    // Proof
    proofType: varchar("proofType", { length: 64 }).default("Ed25519Signature2020"),
    proofValue: text("proofValue"),

    // Status
    status: mysqlEnum("status", ["active", "revoked", "expired", "suspended"])
      .default("active")
      .notNull(),
    revokedAt: timestamp("revokedAt"),
    revocationReason: text("revocationReason"),

    // Anchoring
    anchorId: int("anchorId").references(() => evidenceManifests.id),

    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => ({
    credentialIdIdx: unique("vc_credential_id_unique").on(table.credentialId),
    issuerIdx: index("vc_issuer_idx").on(table.issuerDid),
    subjectIdx: index("vc_subject_idx").on(table.subjectDid),
    typeIdx: index("vc_type_idx").on(table.credentialType),
    statusIdx: index("vc_status_idx").on(table.status),
  })
);

export type VerifiableCredential = typeof verifiableCredentials.$inferSelect;
export type InsertVerifiableCredential = typeof verifiableCredentials.$inferInsert;

// ============================================================================
// ABFI v3.1 - MCP CONNECTORS
// ============================================================================

/**
 * MCP Connections - External system integrations
 */
export const mcpConnections = mysqlTable(
  "mcp_connections",
  {
    id: int("id").autoincrement().primaryKey(),

    // Owner
    ownerType: mysqlEnum("ownerType", ["supplier", "buyer", "facility"]).notNull(),
    ownerId: int("ownerId").notNull(),

    // Connector type
    connectorType: mysqlEnum("connectorType", [
      "xero",
      "myob",
      "google_drive",
      "gmail",
      "microsoft_365",
      "sharepoint",
      "quickbooks",
    ]).notNull(),

    // OAuth tokens (encrypted in practice)
    accessToken: text("accessToken"),
    refreshToken: text("refreshToken"),
    tokenExpiresAt: timestamp("tokenExpiresAt"),

    // Connection status
    status: mysqlEnum("status", [
      "pending",
      "connected",
      "expired",
      "revoked",
      "error",
    ])
      .default("pending")
      .notNull(),
    lastSyncAt: timestamp("lastSyncAt"),
    lastError: text("lastError"),

    // Scope/permissions
    grantedScopes: json("grantedScopes").$type<string[]>(),

    // Metadata
    externalAccountId: varchar("externalAccountId", { length: 255 }),
    externalAccountName: varchar("externalAccountName", { length: 255 }),

    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => ({
    ownerIdx: index("mcp_owner_idx").on(table.ownerType, table.ownerId),
    connectorIdx: index("mcp_connector_idx").on(table.connectorType),
    statusIdx: index("mcp_status_idx").on(table.status),
  })
);

export type McpConnection = typeof mcpConnections.$inferSelect;
export type InsertMcpConnection = typeof mcpConnections.$inferInsert;

/**
 * MCP Sync Logs - Track data synchronization
 */
export const mcpSyncLogs = mysqlTable(
  "mcp_sync_logs",
  {
    id: int("id").autoincrement().primaryKey(),

    connectionId: int("connectionId")
      .notNull()
      .references(() => mcpConnections.id),

    syncType: mysqlEnum("syncType", [
      "full",
      "incremental",
      "manual",
      "webhook",
    ]).notNull(),
    syncDirection: mysqlEnum("syncDirection", ["inbound", "outbound"]).notNull(),

    // Results
    status: mysqlEnum("status", ["started", "completed", "failed", "partial"])
      .default("started")
      .notNull(),
    recordsProcessed: int("recordsProcessed").default(0),
    recordsFailed: int("recordsFailed").default(0),
    errorDetails: json("errorDetails").$type<Array<{ record: string; error: string }>>(),

    startedAt: timestamp("startedAt").defaultNow().notNull(),
    completedAt: timestamp("completedAt"),
  },
  table => ({
    connectionIdx: index("sync_connection_idx").on(table.connectionId),
    statusIdx: index("sync_status_idx").on(table.status),
    startedAtIdx: index("sync_started_idx").on(table.startedAt),
  })
);

export type McpSyncLog = typeof mcpSyncLogs.$inferSelect;
export type InsertMcpSyncLog = typeof mcpSyncLogs.$inferInsert;

// ============================================================================
// ABFI v3.1 - GO SCHEME & AUDIT PACKS
// ============================================================================

/**
 * GO Certificates - Guarantee of Origin tracking
 */
export const goCertificates = mysqlTable(
  "go_certificates",
  {
    id: int("id").autoincrement().primaryKey(),

    // Certificate ID
    goId: varchar("goId", { length: 64 }).notNull().unique(),
    goScheme: mysqlEnum("goScheme", ["REGO", "PGO", "GO_AU", "ISCC_PLUS", "RSB"])
      .default("GO_AU")
      .notNull(),

    // Attributes (REGO/PGO aligned)
    energySource: varchar("energySource", { length: 100 }).notNull(),
    productionPeriodStart: date("productionPeriodStart").notNull(),
    productionPeriodEnd: date("productionPeriodEnd").notNull(),
    productionFacilityId: varchar("productionFacilityId", { length: 64 }),
    productionCountry: varchar("productionCountry", { length: 2 }).default("AU"),

    // Volume
    energyMwh: decimal("energyMwh", { precision: 12, scale: 3 }),
    volumeTonnes: decimal("volumeTonnes", { precision: 12, scale: 3 }),
    volumeUnit: varchar("volumeUnit", { length: 32 }),

    // Carbon attributes
    ghgEmissionsKgCo2e: decimal("ghgEmissionsKgCo2e", { precision: 16, scale: 4 }),
    carbonIntensity: decimal("carbonIntensity", { precision: 10, scale: 4 }),
    carbonIntensityUnit: varchar("carbonIntensityUnit", { length: 32 }).default(
      "gCO2e/MJ"
    ),

    // Ownership chain
    currentHolderId: int("currentHolderId"),
    originalIssuerId: int("originalIssuerId"),

    // Status
    status: mysqlEnum("status", [
      "issued",
      "transferred",
      "cancelled",
      "retired",
      "expired",
    ])
      .default("issued")
      .notNull(),
    retiredFor: text("retiredFor"), // Claim purpose

    // Registry link
    externalRegistryId: varchar("externalRegistryId", { length: 128 }),
    externalRegistryUrl: varchar("externalRegistryUrl", { length: 512 }),

    // Anchoring
    anchorId: int("anchorId").references(() => evidenceManifests.id),

    issuedAt: timestamp("issuedAt").notNull(),
    expiresAt: timestamp("expiresAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => ({
    goIdIdx: unique("go_id_unique").on(table.goId),
    schemeIdx: index("go_scheme_idx").on(table.goScheme),
    statusIdx: index("go_status_idx").on(table.status),
    holderIdx: index("go_holder_idx").on(table.currentHolderId),
  })
);

export type GoCertificate = typeof goCertificates.$inferSelect;
export type InsertGoCertificate = typeof goCertificates.$inferInsert;

/**
 * Audit Packs - Generated assurance documentation
 */
export const auditPacks = mysqlTable(
  "audit_packs",
  {
    id: int("id").autoincrement().primaryKey(),

    // Pack identifier
    packId: varchar("packId", { length: 64 }).notNull().unique(),
    packType: mysqlEnum("packType", [
      "lender_assurance",
      "go_application",
      "sustainability_audit",
      "compliance_review",
      "annual_report",
    ]).notNull(),

    // Entity scope
    entityType: mysqlEnum("entityType", [
      "project",
      "supplier",
      "consignment",
      "product_batch",
    ]).notNull(),
    entityId: int("entityId").notNull(),

    // Period covered
    periodStart: date("periodStart").notNull(),
    periodEnd: date("periodEnd").notNull(),

    // Generated content
    packUri: varchar("packUri", { length: 512 }).notNull(), // PDF/ZIP location
    packHash: varchar("packHash", { length: 64 }).notNull(),
    packSizeBytes: int("packSizeBytes").notNull(),

    // Contents manifest
    includedEvidenceIds: json("includedEvidenceIds").$type<number[]>(),
    includedCalculationIds: json("includedCalculationIds").$type<number[]>(),
    includedCredentialIds: json("includedCredentialIds").$type<number[]>(),

    // Status
    status: mysqlEnum("status", ["draft", "generated", "reviewed", "finalized"])
      .default("draft")
      .notNull(),

    // Review
    reviewedBy: int("reviewedBy").references(() => users.id),
    reviewedAt: timestamp("reviewedAt"),
    reviewNotes: text("reviewNotes"),

    // Anchoring
    anchorId: int("anchorId").references(() => evidenceManifests.id),

    generatedBy: int("generatedBy")
      .notNull()
      .references(() => users.id),
    generatedAt: timestamp("generatedAt").defaultNow().notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => ({
    packIdIdx: unique("pack_id_unique").on(table.packId),
    entityIdx: index("pack_entity_idx").on(table.entityType, table.entityId),
    typeIdx: index("pack_type_idx").on(table.packType),
    statusIdx: index("pack_status_idx").on(table.status),
  })
);

export type AuditPack = typeof auditPacks.$inferSelect;
export type InsertAuditPack = typeof auditPacks.$inferInsert;

// ============================================================================
// STEALTH DISCOVERY - AI Intelligence Tables
// ============================================================================

/**
 * Stealth Entities - Organizations discovered through signal intelligence
 */
export const stealthEntities = mysqlTable(
  "stealth_entities",
  {
    id: int("id").autoincrement().primaryKey(),
    entityType: mysqlEnum("entityType", [
      "company",
      "project",
      "facility",
      "government_agency",
      "research_institution",
      "joint_venture",
      "unknown",
    ]).notNull(),
    canonicalName: varchar("canonicalName", { length: 255 }).notNull(),
    allNames: json("allNames").$type<string[]>().default([]),
    identifiers: json("identifiers").$type<{
      abn?: string;
      acn?: string;
      website?: string;
      linkedIn?: string;
    }>(),
    metadata: json("metadata").$type<Record<string, unknown>>(),
    currentScore: decimal("currentScore", { precision: 5, scale: 2 }).default("0"),
    signalCount: int("signalCount").default(0).notNull(),
    needsReview: boolean("needsReview").default(false).notNull(),
    reviewNotes: text("reviewNotes"),
    lastSignalAt: timestamp("lastSignalAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    nameIdx: index("stealth_name_idx").on(table.canonicalName),
    typeIdx: index("stealth_type_idx").on(table.entityType),
    scoreIdx: index("stealth_score_idx").on(table.currentScore),
  })
);

export type StealthEntity = typeof stealthEntities.$inferSelect;
export type InsertStealthEntity = typeof stealthEntities.$inferInsert;

/**
 * Stealth Signals - Individual intelligence signals from various sources
 */
export const stealthSignals = mysqlTable(
  "stealth_signals",
  {
    id: int("id").autoincrement().primaryKey(),
    entityId: int("entityId")
      .notNull()
      .references(() => stealthEntities.id),
    signalType: mysqlEnum("signalType", [
      "planning_application",
      "grant_announcement",
      "investment_disclosure",
      "environmental_approval",
      "patent_filing",
      "patent_biofuel_tech",
      "job_posting",
      "news_mention",
      "regulatory_filing",
      "partnership_announcement",
    ]).notNull(),
    signalWeight: decimal("signalWeight", { precision: 5, scale: 2 }).default("1"),
    confidence: decimal("confidence", { precision: 5, scale: 2 }).default("50"),
    source: varchar("source", { length: 100 }).notNull(),
    title: varchar("title", { length: 500 }).notNull(),
    description: text("description"),
    rawData: json("rawData").$type<Record<string, unknown>>(),
    detectedAt: timestamp("detectedAt").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    entityIdx: index("signal_entity_idx").on(table.entityId),
    typeIdx: index("signal_type_idx").on(table.signalType),
    detectedIdx: index("signal_detected_idx").on(table.detectedAt),
  })
);

export type StealthSignal = typeof stealthSignals.$inferSelect;
export type InsertStealthSignal = typeof stealthSignals.$inferInsert;

/**
 * Stealth Ingestion Jobs - Track data ingestion runs
 */
export const stealthIngestionJobs = mysqlTable(
  "stealth_ingestion_jobs",
  {
    id: int("id").autoincrement().primaryKey(),
    connector: varchar("connector", { length: 100 }).notNull(),
    jobType: mysqlEnum("jobType", ["manual", "scheduled"]).notNull(),
    status: mysqlEnum("status", ["pending", "running", "completed", "failed"])
      .default("pending")
      .notNull(),
    signalsDiscovered: int("signalsDiscovered").default(0),
    entitiesCreated: int("entitiesCreated").default(0),
    entitiesUpdated: int("entitiesUpdated").default(0),
    errorMessage: text("errorMessage"),
    startedAt: timestamp("startedAt"),
    completedAt: timestamp("completedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    connectorIdx: index("job_connector_idx").on(table.connector),
    statusIdx: index("job_status_idx").on(table.status),
  })
);

export type StealthIngestionJob = typeof stealthIngestionJobs.$inferSelect;
export type InsertStealthIngestionJob = typeof stealthIngestionJobs.$inferInsert;

// ============================================================================
// LENDING SENTIMENT TABLES
// ============================================================================

/**
 * Analyzed documents with sentiment classification
 */
export const sentimentDocuments = mysqlTable(
  "sentiment_documents",
  {
    id: int("id").primaryKey().autoincrement(),
    sourceId: varchar("sourceId", { length: 255 }).notNull(),
    source: varchar("source", { length: 100 }).notNull(), // rba, apra, afr, bank_earnings, etc.
    title: varchar("title", { length: 500 }).notNull(),
    content: text("content"),
    url: varchar("url", { length: 1000 }),
    publishedDate: timestamp("publishedDate").notNull(),
    sentiment: mysqlEnum("sentiment", ["BULLISH", "BEARISH", "NEUTRAL"]).notNull(),
    sentimentScore: decimal("sentimentScore", { precision: 5, scale: 2 }).notNull(), // -100 to +100
    confidence: decimal("confidence", { precision: 5, scale: 4 }).notNull(), // 0 to 1
    // Fear component breakdown (for bearish signals)
    regulatoryRisk: decimal("regulatoryRisk", { precision: 5, scale: 2 }).default("0"),
    technologyRisk: decimal("technologyRisk", { precision: 5, scale: 2 }).default("0"),
    feedstockRisk: decimal("feedstockRisk", { precision: 5, scale: 2 }).default("0"),
    counterpartyRisk: decimal("counterpartyRisk", { precision: 5, scale: 2 }).default("0"),
    marketRisk: decimal("marketRisk", { precision: 5, scale: 2 }).default("0"),
    esgConcerns: decimal("esgConcerns", { precision: 5, scale: 2 }).default("0"),
    // Metadata
    lender: varchar("lender", { length: 100 }), // If from a specific lender
    keywords: json("keywords").$type<string[]>(),
    rawData: json("rawData"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    sourceIdx: index("doc_source_idx").on(table.source),
    sentimentIdx: index("doc_sentiment_idx").on(table.sentiment),
    publishedIdx: index("doc_published_idx").on(table.publishedDate),
    lenderIdx: index("doc_lender_idx").on(table.lender),
    sourceIdIdx: uniqueIndex("doc_source_id_idx").on(table.sourceId),
  })
);

export type SentimentDocument = typeof sentimentDocuments.$inferSelect;
export type InsertSentimentDocument = typeof sentimentDocuments.$inferInsert;

/**
 * Daily aggregated sentiment index
 */
export const sentimentDailyIndex = mysqlTable(
  "sentiment_daily_index",
  {
    id: int("id").primaryKey().autoincrement(),
    date: date("date").notNull(),
    overallIndex: decimal("overallIndex", { precision: 6, scale: 2 }).notNull(), // -100 to +100
    bullishCount: int("bullishCount").notNull().default(0),
    bearishCount: int("bearishCount").notNull().default(0),
    neutralCount: int("neutralCount").notNull().default(0),
    documentsAnalyzed: int("documentsAnalyzed").notNull().default(0),
    // Fear components (averaged for the day)
    regulatoryRisk: decimal("regulatoryRisk", { precision: 5, scale: 2 }).default("0"),
    technologyRisk: decimal("technologyRisk", { precision: 5, scale: 2 }).default("0"),
    feedstockRisk: decimal("feedstockRisk", { precision: 5, scale: 2 }).default("0"),
    counterpartyRisk: decimal("counterpartyRisk", { precision: 5, scale: 2 }).default("0"),
    marketRisk: decimal("marketRisk", { precision: 5, scale: 2 }).default("0"),
    esgConcerns: decimal("esgConcerns", { precision: 5, scale: 2 }).default("0"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  },
  (table) => ({
    dateIdx: uniqueIndex("daily_date_idx").on(table.date),
  })
);

export type SentimentDailyIndex = typeof sentimentDailyIndex.$inferSelect;
export type InsertSentimentDailyIndex = typeof sentimentDailyIndex.$inferInsert;

/**
 * Per-lender sentiment tracking
 */
export const lenderSentimentScores = mysqlTable(
  "lender_sentiment_scores",
  {
    id: int("id").primaryKey().autoincrement(),
    lender: varchar("lender", { length: 100 }).notNull(),
    date: date("date").notNull(),
    sentimentScore: decimal("sentimentScore", { precision: 6, scale: 2 }).notNull(),
    documentCount: int("documentCount").notNull().default(0),
    bullishCount: int("bullishCount").notNull().default(0),
    bearishCount: int("bearishCount").notNull().default(0),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    lenderDateIdx: uniqueIndex("lender_date_idx").on(table.lender, table.date),
    lenderIdx: index("lender_idx").on(table.lender),
    dateIdx: index("lender_score_date_idx").on(table.date),
  })
);

// ============================================================================
// FEEDSTOCK PRICES - Price Index Data
// ============================================================================

/**
 * Feedstock Price OHLC Data
 * Daily OHLC (Open, High, Low, Close) price data for feedstock commodities
 */
export const feedstockPrices = mysqlTable(
  "feedstock_prices",
  {
    id: int("id").primaryKey().autoincrement(),
    commodity: varchar("commodity", { length: 50 }).notNull(), // UCO, Tallow, Canola, Palm
    region: varchar("region", { length: 20 }).notNull(), // AUS, SEA, EU, NA, LATAM
    date: date("date").notNull(),
    open: decimal("open", { precision: 10, scale: 2 }).notNull(),
    high: decimal("high", { precision: 10, scale: 2 }).notNull(),
    low: decimal("low", { precision: 10, scale: 2 }).notNull(),
    close: decimal("close", { precision: 10, scale: 2 }).notNull(),
    volume: int("volume"), // Optional trading volume
    source: varchar("source", { length: 100 }).default("ABFI Internal"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    commodityRegionDateIdx: uniqueIndex("commodity_region_date_idx").on(
      table.commodity,
      table.region,
      table.date
    ),
    commodityIdx: index("price_commodity_idx").on(table.commodity),
    regionIdx: index("price_region_idx").on(table.region),
    dateIdx: index("price_date_idx").on(table.date),
  })
);

/**
 * Regional Price Summary
 * Current prices by region for heatmap display
 */
export const regionalPriceSummary = mysqlTable(
  "regional_price_summary",
  {
    id: int("id").primaryKey().autoincrement(),
    commodity: varchar("commodity", { length: 50 }).notNull(),
    region: varchar("region", { length: 20 }).notNull(),
    regionName: varchar("regionName", { length: 100 }).notNull(),
    price: decimal("price", { precision: 10, scale: 2 }).notNull(),
    changePct: decimal("changePct", { precision: 6, scale: 2 }).notNull(),
    currency: varchar("currency", { length: 10 }).notNull().default("AUD"),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  },
  (table) => ({
    commodityRegionIdx: uniqueIndex("regional_commodity_region_idx").on(
      table.commodity,
      table.region
    ),
  })
);

/**
 * Forward Curve Data
 * Forward prices for different tenors
 */
export const forwardCurves = mysqlTable(
  "forward_curves",
  {
    id: int("id").primaryKey().autoincrement(),
    commodity: varchar("commodity", { length: 50 }).notNull(),
    region: varchar("region", { length: 20 }).notNull(),
    tenor: varchar("tenor", { length: 20 }).notNull(), // Spot, 1M, 3M, 6M, 1Y
    price: decimal("price", { precision: 10, scale: 2 }).notNull(),
    changeFromSpot: decimal("changeFromSpot", { precision: 6, scale: 2 }).notNull(),
    asOfDate: date("asOfDate").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    commodityRegionDateIdx: uniqueIndex("forward_commodity_region_date_idx").on(
      table.commodity,
      table.region,
      table.asOfDate,
      table.tenor
    ),
  })
);

/**
 * Technical Indicators
 * Technical analysis indicators for commodities
 */
export const technicalIndicators = mysqlTable(
  "technical_indicators",
  {
    id: int("id").primaryKey().autoincrement(),
    commodity: varchar("commodity", { length: 50 }).notNull(),
    region: varchar("region", { length: 20 }).notNull().default("AUS"),
    indicatorName: varchar("indicatorName", { length: 50 }).notNull(), // RSI, MACD, SMA20, etc.
    value: decimal("value", { precision: 12, scale: 4 }).notNull(),
    signal: mysqlEnum("signal", ["buy", "sell", "neutral"]).notNull(),
    calculatedAt: timestamp("calculatedAt").defaultNow().notNull(),
  },
  (table) => ({
    commodityRegionIdx: uniqueIndex("tech_commodity_region_indicator_idx").on(
      table.commodity,
      table.region,
      table.indicatorName
    ),
  })
);

// ============================================================================
// POLICY & CARBON - Policy Tracker and Carbon Revenue
// ============================================================================

/**
 * Policy Timeline Events
 * Key policy events by jurisdiction
 */
export const policyTimelineEvents = mysqlTable(
  "policy_timeline_events",
  {
    id: int("id").primaryKey().autoincrement(),
    jurisdiction: varchar("jurisdiction", { length: 50 }).notNull(), // Federal, NSW, VIC, QLD, etc.
    date: date("date").notNull(),
    eventType: mysqlEnum("eventType", ["enacted", "consultation_open", "expected_decision", "expired"]).notNull(),
    title: varchar("title", { length: 500 }).notNull(),
    description: text("description"),
    policyId: varchar("policyId", { length: 100 }),
    url: varchar("url", { length: 1000 }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    dateIdx: index("policy_date_idx").on(table.date),
    jurisdictionIdx: index("policy_jurisdiction_idx").on(table.jurisdiction),
  })
);

/**
 * Policy Kanban Items
 * Policies organized by status (proposed, review, enacted)
 */
export const policyKanbanItems = mysqlTable(
  "policy_kanban_items",
  {
    id: int("id").primaryKey().autoincrement(),
    title: varchar("title", { length: 500 }).notNull(),
    jurisdiction: varchar("jurisdiction", { length: 50 }).notNull(),
    policyType: varchar("policyType", { length: 100 }).notNull(),
    status: mysqlEnum("status", ["proposed", "review", "enacted", "expired"]).notNull(),
    summary: text("summary"),
    expectedDate: date("expectedDate"),
    url: varchar("url", { length: 1000 }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  },
  (table) => ({
    statusIdx: index("kanban_status_idx").on(table.status),
    jurisdictionIdx: index("kanban_jurisdiction_idx").on(table.jurisdiction),
  })
);

/**
 * Mandate Scenarios
 * Revenue impact under different mandate levels
 */
export const mandateScenarios = mysqlTable(
  "mandate_scenarios",
  {
    id: int("id").primaryKey().autoincrement(),
    name: varchar("name", { length: 100 }).notNull(),
    mandateLevel: varchar("mandateLevel", { length: 20 }).notNull(), // B5, B10, B20
    revenueImpact: decimal("revenueImpact", { precision: 15, scale: 2 }).notNull(),
    description: text("description"),
    assumptions: json("assumptions").$type<Record<string, any>>(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    mandateLevelIdx: index("mandate_level_idx").on(table.mandateLevel),
  })
);

/**
 * Offtake Agreements
 * Current offtake agreements and premiums
 */
export const offtakeAgreements = mysqlTable(
  "offtake_agreements",
  {
    id: int("id").primaryKey().autoincrement(),
    offtaker: varchar("offtaker", { length: 200 }).notNull(),
    mandate: varchar("mandate", { length: 100 }).notNull(),
    volume: varchar("volume", { length: 100 }).notNull(),
    term: varchar("term", { length: 50 }).notNull(),
    premium: varchar("premium", { length: 50 }).notNull(),
    isActive: boolean("isActive").default(true),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  }
);

/**
 * ACCU Price History
 * Australian Carbon Credit Unit price tracking
 */
export const accuPriceHistory = mysqlTable(
  "accu_price_history",
  {
    id: int("id").primaryKey().autoincrement(),
    date: date("date").notNull(),
    price: decimal("price", { precision: 10, scale: 2 }).notNull(),
    change: decimal("change", { precision: 10, scale: 2 }).notNull(),
    changePct: decimal("changePct", { precision: 6, scale: 2 }).notNull(),
    source: varchar("source", { length: 100 }).default("CER"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    dateIdx: uniqueIndex("accu_date_idx").on(table.date),
  })
);

/**
 * Policy Consultations
 * Open consultations for policy input
 */
export const policyConsultations = mysqlTable(
  "policy_consultations",
  {
    id: int("id").primaryKey().autoincrement(),
    title: varchar("title", { length: 500 }).notNull(),
    jurisdiction: varchar("jurisdiction", { length: 50 }).notNull(),
    opens: date("opens").notNull(),
    closes: date("closes").notNull(),
    relevance: varchar("relevance", { length: 50 }).notNull(), // high, medium, low
    submissionUrl: varchar("submissionUrl", { length: 1000 }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    closesIdx: index("consultation_closes_idx").on(table.closes),
  })
);

// ============================================================================
// UNIFIED MARKET INTELLIGENCE MAP (Phase 9)
// ============================================================================

/**
 * Growing Intentions
 * Grower planting commitments for forward visibility
 */
export const growingIntentions = mysqlTable(
  "growingIntentions",
  {
    id: int("id").autoincrement().primaryKey(),
    growerId: int("growerId")
      .notNull()
      .references(() => suppliers.id),
    feedstockTypeId: varchar("feedstockTypeId", { length: 50 }).notNull(),
    areaHa: decimal("areaHa", { precision: 10, scale: 2 }).notNull(),
    latitude: varchar("latitude", { length: 20 }).notNull(),
    longitude: varchar("longitude", { length: 20 }).notNull(),
    plantDate: date("plantDate").notNull(),
    expectedHarvestDate: date("expectedHarvestDate").notNull(),
    expectedYield: decimal("expectedYield", { precision: 12, scale: 2 }),
    commitmentLevel: mysqlEnum("commitmentLevel", [
      "planning",
      "confirmed",
      "under_contract",
    ]).notNull(),
    visibility: mysqlEnum("visibility", [
      "private",
      "market_wide",
      "role_restricted",
      "counterparty",
      "public",
    ]).default("market_wide"),
    status: mysqlEnum("intentionStatus", ["active", "cancelled", "harvested"]).default(
      "active"
    ),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    growerIdIdx: index("growingIntentions_growerId_idx").on(table.growerId),
    statusIdx: index("growingIntentions_status_idx").on(table.status),
    harvestDateIdx: index("growingIntentions_harvestDate_idx").on(
      table.expectedHarvestDate
    ),
  })
);

export type GrowingIntention = typeof growingIntentions.$inferSelect;
export type InsertGrowingIntention = typeof growingIntentions.$inferInsert;

/**
 * Power Stations / Processing Facilities
 * Biomass/bioenergy processing infrastructure
 */
export const powerStations = mysqlTable(
  "powerStations",
  {
    id: int("id").autoincrement().primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    latitude: varchar("latitude", { length: 20 }).notNull(),
    longitude: varchar("longitude", { length: 20 }).notNull(),
    type: mysqlEnum("stationType", [
      "cofiring",
      "dedicated",
      "cogen",
      "biogas",
      "processor",
    ]).notNull(),
    capacityMw: decimal("capacityMw", { precision: 10, scale: 2 }),
    feedstockRequirements: json("feedstockRequirements").$type<string[]>(),
    contractStatus: mysqlEnum("stationContractStatus", [
      "open",
      "partial",
      "contracted",
    ]),
    ownerName: varchar("ownerName", { length: 255 }),
    status: mysqlEnum("stationStatus", [
      "operational",
      "development",
      "planned",
    ]),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    typeIdx: index("powerStations_type_idx").on(table.type),
    statusIdx: index("powerStations_status_idx").on(table.status),
  })
);

export type PowerStation = typeof powerStations.$inferSelect;
export type InsertPowerStation = typeof powerStations.$inferInsert;

/**
 * Logistics Hubs
 * Ports, rail terminals, storage facilities
 */
export const logisticsHubs = mysqlTable(
  "logisticsHubs",
  {
    id: int("id").autoincrement().primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    latitude: varchar("latitude", { length: 20 }).notNull(),
    longitude: varchar("longitude", { length: 20 }).notNull(),
    type: mysqlEnum("hubType", [
      "port",
      "rail_terminal",
      "road_hub",
      "storage",
    ]).notNull(),
    handlingCapacity: decimal("handlingCapacity", { precision: 12, scale: 2 }),
    feedstockTypes: json("feedstockTypes").$type<string[]>(),
    transportCostPerKm: decimal("transportCostPerKm", { precision: 6, scale: 2 }),
    status: mysqlEnum("hubStatus", ["active", "planned"]).default("active"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    typeIdx: index("logisticsHubs_type_idx").on(table.type),
  })
);

export type LogisticsHub = typeof logisticsHubs.$inferSelect;
export type InsertLogisticsHub = typeof logisticsHubs.$inferInsert;

/**
 * Contract Matches
 * AI-generated matches between demand signals and supply
 */
export const contractMatches = mysqlTable(
  "contractMatches",
  {
    id: int("id").autoincrement().primaryKey(),
    demandSignalId: int("demandSignalId")
      .notNull()
      .references(() => demandSignals.id),
    projectId: int("projectId").references(() => projects.id),
    intentionId: int("intentionId").references(() => growingIntentions.id),
    matchScore: decimal("matchScore", { precision: 5, scale: 2 }).notNull(), // 0-100
    distanceKm: decimal("distanceKm", { precision: 8, scale: 2 }),
    estimatedTransportCost: decimal("estimatedTransportCost", {
      precision: 10,
      scale: 2,
    }),
    volumeMatchPercent: decimal("volumeMatchPercent", { precision: 5, scale: 2 }),
    status: mysqlEnum("matchStatus", [
      "suggested",
      "viewed",
      "negotiating",
      "accepted",
      "rejected",
      "expired",
    ]).default("suggested"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    expiresAt: timestamp("expiresAt"),
  },
  (table) => ({
    demandSignalIdIdx: index("contractMatches_demandSignalId_idx").on(
      table.demandSignalId
    ),
    statusIdx: index("contractMatches_status_idx").on(table.status),
    intentionIdIdx: index("contractMatches_intentionId_idx").on(table.intentionId),
  })
);

export type ContractMatch = typeof contractMatches.$inferSelect;
export type InsertContractMatch = typeof contractMatches.$inferInsert;

/**
 * Contracts
 * Executed supply contracts between growers and buyers
 */
export const contracts = mysqlTable(
  "contracts",
  {
    id: int("id").autoincrement().primaryKey(),
    matchId: int("matchId")
      .notNull()
      .references(() => contractMatches.id),
    buyerId: int("buyerId")
      .notNull()
      .references(() => users.id),
    growerId: int("growerId")
      .notNull()
      .references(() => users.id),
    feedstockTypeId: varchar("feedstockTypeId", { length: 50 }).notNull(),
    volumeTonnes: decimal("volumeTonnes", { precision: 12, scale: 2 }).notNull(),
    pricePerTonne: decimal("pricePerTonne", { precision: 10, scale: 2 }).notNull(),
    totalValue: decimal("totalValue", { precision: 14, scale: 2 }).notNull(),
    deliveryTerms: json("deliveryTerms").$type<Record<string, any>>(),
    qualitySpecs: json("qualitySpecs").$type<Record<string, any>>(),
    paymentTerms: mysqlEnum("paymentTerms", [
      "upfront",
      "on_delivery",
      "net_30",
      "milestone",
    ]),
    paymentSchedule: json("paymentSchedule").$type<any[]>(),
    status: mysqlEnum("contractStatus", [
      "draft",
      "pending_grower",
      "pending_buyer",
      "active",
      "delivering",
      "completed",
      "disputed",
      "cancelled",
    ]).default("draft"),
    signedByBuyer: timestamp("signedByBuyer"),
    signedByGrower: timestamp("signedByGrower"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    buyerIdIdx: index("contracts_buyerId_idx").on(table.buyerId),
    growerIdIdx: index("contracts_growerId_idx").on(table.growerId),
    statusIdx: index("contracts_status_idx").on(table.status),
    matchIdIdx: index("contracts_matchId_idx").on(table.matchId),
  })
);

export type Contract = typeof contracts.$inferSelect;
export type InsertContract = typeof contracts.$inferInsert;

/**
 * Deliveries
 * Individual delivery events under contracts
 */
export const deliveries = mysqlTable(
  "deliveries",
  {
    id: int("id").autoincrement().primaryKey(),
    contractId: int("contractId")
      .notNull()
      .references(() => contracts.id),
    scheduledDate: timestamp("scheduledDate").notNull(),
    actualDate: timestamp("actualDate"),
    volumeTonnes: decimal("volumeTonnes", { precision: 12, scale: 2 }).notNull(),
    qualityResults: json("qualityResults").$type<Record<string, any>>(),
    pickupLocation: json("pickupLocation").$type<{
      lat: number;
      lng: number;
      address: string;
    }>(),
    deliveryLocation: json("deliveryLocation").$type<{
      lat: number;
      lng: number;
      address: string;
    }>(),
    transportProvider: varchar("transportProvider", { length: 255 }),
    transportCost: decimal("transportCost", { precision: 10, scale: 2 }),
    status: mysqlEnum("deliveryStatus", [
      "scheduled",
      "in_transit",
      "delivered",
      "quality_verified",
      "disputed",
      "settled",
    ]).default("scheduled"),
    proofOfDelivery: varchar("proofOfDelivery", { length: 500 }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    contractIdIdx: index("deliveries_contractId_idx").on(table.contractId),
    statusIdx: index("deliveries_status_idx").on(table.status),
    scheduledDateIdx: index("deliveries_scheduledDate_idx").on(table.scheduledDate),
  })
);

export type Delivery = typeof deliveries.$inferSelect;
export type InsertDelivery = typeof deliveries.$inferInsert;

/**
 * Price Signals
 * Market price indicators by feedstock and region
 */
export const priceSignals = mysqlTable(
  "priceSignals",
  {
    id: int("id").autoincrement().primaryKey(),
    feedstockTypeId: varchar("feedstockTypeId", { length: 50 }).notNull(),
    regionId: varchar("regionId", { length: 10 }).notNull(),
    spotPrice: decimal("spotPrice", { precision: 10, scale: 2 }),
    forward1M: decimal("forward1M", { precision: 10, scale: 2 }),
    forward3M: decimal("forward3M", { precision: 10, scale: 2 }),
    forward6M: decimal("forward6M", { precision: 10, scale: 2 }),
    forward12M: decimal("forward12M", { precision: 10, scale: 2 }),
    supplyIndex: decimal("supplyIndex", { precision: 5, scale: 2 }),
    demandIndex: decimal("demandIndex", { precision: 5, scale: 2 }),
    source: mysqlEnum("priceSource", [
      "contract_average",
      "demand_signal",
      "grower_ask",
      "external_index",
      "calculated",
    ]),
    confidence: mysqlEnum("priceConfidence", [
      "high",
      "medium",
      "low",
      "indicative",
    ]),
    validFrom: timestamp("validFrom").notNull(),
    validTo: timestamp("validTo").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    feedstockRegionIdx: index("priceSignals_feedstock_region_idx").on(
      table.feedstockTypeId,
      table.regionId
    ),
    validFromIdx: index("priceSignals_validFrom_idx").on(table.validFrom),
  })
);

export type PriceSignal = typeof priceSignals.$inferSelect;
export type InsertPriceSignal = typeof priceSignals.$inferInsert;

/**
 * Price Alerts
 * User-configured price threshold notifications
 */
export const priceAlerts = mysqlTable(
  "priceAlerts",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId")
      .notNull()
      .references(() => users.id),
    feedstockTypeId: varchar("feedstockTypeId", { length: 50 }).notNull(),
    regionId: varchar("regionId", { length: 10 }),
    alertType: mysqlEnum("alertType", [
      "above_threshold",
      "below_threshold",
      "percent_change_up",
      "percent_change_down",
    ]).notNull(),
    thresholdValue: decimal("thresholdValue", { precision: 10, scale: 2 }).notNull(),
    isActive: boolean("isActive").default(true),
    lastTriggered: timestamp("lastTriggered"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("priceAlerts_userId_idx").on(table.userId),
    activeIdx: index("priceAlerts_active_idx").on(table.isActive),
  })
);

export type PriceAlert = typeof priceAlerts.$inferSelect;
export type InsertPriceAlert = typeof priceAlerts.$inferInsert;

/**
 * Transport Routes
 * Cached route calculations between locations
 */
export const transportRoutes = mysqlTable(
  "transportRoutes",
  {
    id: int("id").autoincrement().primaryKey(),
    originType: mysqlEnum("originType", [
      "project",
      "intention",
      "power_station",
      "logistics_hub",
      "custom",
    ]).notNull(),
    originId: int("originId"),
    originLat: varchar("originLat", { length: 20 }).notNull(),
    originLng: varchar("originLng", { length: 20 }).notNull(),
    destinationType: mysqlEnum("destinationType", [
      "project",
      "intention",
      "power_station",
      "logistics_hub",
      "custom",
    ]).notNull(),
    destinationId: int("destinationId"),
    destinationLat: varchar("destinationLat", { length: 20 }).notNull(),
    destinationLng: varchar("destinationLng", { length: 20 }).notNull(),
    distanceKm: decimal("distanceKm", { precision: 8, scale: 2 }).notNull(),
    estimatedHours: decimal("estimatedHours", { precision: 6, scale: 2 }),
    routeGeometry: json("routeGeometry").$type<any>(), // GeoJSON LineString
    baseCostPerKm: decimal("baseCostPerKm", { precision: 6, scale: 2 }),
    fuelSurcharge: decimal("fuelSurcharge", { precision: 6, scale: 2 }),
    tollsCost: decimal("tollsCost", { precision: 8, scale: 2 }),
    handlingCost: decimal("handlingCost", { precision: 8, scale: 2 }),
    totalCostPerTonne: decimal("totalCostPerTonne", { precision: 8, scale: 2 }),
    transportMode: mysqlEnum("routeTransportMode", [
      "road",
      "rail",
      "road_rail",
      "ship",
    ]).notNull(),
    validFrom: timestamp("validFrom").defaultNow().notNull(),
    validTo: timestamp("validTo"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    originIdx: index("transportRoutes_origin_idx").on(
      table.originType,
      table.originId
    ),
    destinationIdx: index("transportRoutes_destination_idx").on(
      table.destinationType,
      table.destinationId
    ),
  })
);

export type TransportRoute = typeof transportRoutes.$inferSelect;
export type InsertTransportRoute = typeof transportRoutes.$inferInsert;

/**
 * Forward Availability
 * Aggregated supply/demand forecasts by region and period
 */
export const forwardAvailability = mysqlTable(
  "forwardAvailability",
  {
    id: int("id").autoincrement().primaryKey(),
    feedstockTypeId: varchar("feedstockTypeId", { length: 50 }).notNull(),
    regionCode: varchar("regionCode", { length: 10 }),
    month: int("month").notNull(),
    year: int("year").notNull(),
    confirmedSupply: decimal("confirmedSupply", { precision: 14, scale: 2 }),
    projectedSupply: decimal("projectedSupply", { precision: 14, scale: 2 }),
    demandCommitted: decimal("demandCommitted", { precision: 14, scale: 2 }),
    confidence: mysqlEnum("availabilityConfidence", ["high", "medium", "low"]),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    feedstockRegionMonthIdx: index("forwardAvailability_frm_idx").on(
      table.feedstockTypeId,
      table.regionCode,
      table.year,
      table.month
    ),
  })
);

export type ForwardAvailability = typeof forwardAvailability.$inferSelect;
export type InsertForwardAvailability = typeof forwardAvailability.$inferInsert;

// ============================================================================
// ABARES MARKET INTELLIGENCE
// ============================================================================

/**
 * ABARES Crop Forecasts
 * Australian Crop Report data for yield prediction and supply forecasting
 */
export const abaresCropForecasts = mysqlTable(
  "abaresCropForecasts",
  {
    id: int("id").autoincrement().primaryKey(),

    // Report identification
    reportDate: timestamp("reportDate").notNull(),
    season: varchar("season", { length: 10 }).notNull(), // e.g., "2024-25"
    sourceReport: varchar("sourceReport", { length: 255 }),

    // Crop and location
    crop: varchar("crop", { length: 50 }).notNull(),
    state: mysqlEnum("cropState", ["NSW", "VIC", "QLD", "SA", "WA", "TAS", "NT", "ACT"]).notNull(),
    regionCode: varchar("regionCode", { length: 20 }), // SA2/SA4 code

    // Area metrics (hectares)
    plantedAreaHa: decimal("plantedAreaHa", { precision: 12, scale: 2 }),
    harvestedAreaHa: decimal("harvestedAreaHa", { precision: 12, scale: 2 }),

    // Production metrics
    expectedProductionTonnes: decimal("expectedProductionTonnes", { precision: 14, scale: 2 }),
    expectedYieldTonnesPerHa: decimal("expectedYieldTonnesPerHa", { precision: 6, scale: 2 }),

    // Confidence intervals
    confidenceLower: decimal("confidenceLower", { precision: 6, scale: 2 }),
    confidenceUpper: decimal("confidenceUpper", { precision: 6, scale: 2 }),

    // Forecast metadata
    forecastType: mysqlEnum("forecastType", ["preliminary", "revised", "final"]).default("revised"),
    comparedToPreviousYear: decimal("comparedToPreviousYear", { precision: 5, scale: 2 }), // % change
    comparedTo5YearAvg: decimal("comparedTo5YearAvg", { precision: 5, scale: 2 }), // % change

    // Weather impact
    seasonalConditions: mysqlEnum("seasonalConditions", [
      "favorable",
      "average",
      "below_average",
      "drought",
    ]).default("average"),
    notes: text("notes"),

    // Ingestion tracking
    ingestedAt: timestamp("ingestedAt").defaultNow().notNull(),
    sourceUrl: varchar("sourceUrl", { length: 500 }),
  },
  (table) => ({
    seasonIdx: index("abaresCropForecasts_season_idx").on(table.season),
    cropStateIdx: index("abaresCropForecasts_cropState_idx").on(table.crop, table.state),
    reportDateIdx: index("abaresCropForecasts_reportDate_idx").on(table.reportDate),
  })
);

export type AbaresCropForecast = typeof abaresCropForecasts.$inferSelect;
export type InsertAbaresCropForecast = typeof abaresCropForecasts.$inferInsert;

/**
 * ABARES Commodity Prices
 * Historical and current commodity price data for benchmarking
 */
export const abaresCommodityPrices = mysqlTable(
  "abaresCommodityPrices",
  {
    id: int("id").autoincrement().primaryKey(),

    // Price identification
    priceDate: timestamp("priceDate").notNull(),
    commodity: varchar("commodity", { length: 100 }).notNull(),
    unit: varchar("unit", { length: 50 }).notNull(), // e.g., "$/tonne", "$/kg"

    // Price data
    price: decimal("price", { precision: 10, scale: 2 }).notNull(),
    priceType: mysqlEnum("priceType", ["farm_gate", "export", "wholesale"]).default("farm_gate"),

    // Location
    state: mysqlEnum("commodityState", ["NSW", "VIC", "QLD", "SA", "WA", "TAS", "NT", "ACT", "NAT"]),
    region: varchar("region", { length: 100 }),

    // Trailing averages
    avg5Year: decimal("avg5Year", { precision: 10, scale: 2 }),
    avg10Year: decimal("avg10Year", { precision: 10, scale: 2 }),

    // Source
    sourceReport: varchar("sourceReport", { length: 255 }),
    isProjected: boolean("isProjected").default(false),

    // Ingestion
    ingestedAt: timestamp("ingestedAt").defaultNow().notNull(),
  },
  (table) => ({
    commodityDateIdx: index("abaresCommodityPrices_commodityDate_idx").on(
      table.commodity,
      table.priceDate
    ),
    priceDateIdx: index("abaresCommodityPrices_priceDate_idx").on(table.priceDate),
  })
);

export type AbaresCommodityPrice = typeof abaresCommodityPrices.$inferSelect;
export type InsertAbaresCommodityPrice = typeof abaresCommodityPrices.$inferInsert;

/**
 * ABARES Farm Benchmarks
 * Farm financial benchmarks for viability scoring
 */
export const abaresFarmBenchmarks = mysqlTable(
  "abaresFarmBenchmarks",
  {
    id: int("id").autoincrement().primaryKey(),

    // Benchmark identification
    financialYear: varchar("financialYear", { length: 10 }).notNull(), // e.g., "2023-24"
    farmSizeCategory: mysqlEnum("farmSizeCategory", ["small", "medium", "large", "very_large"]),
    farmType: varchar("farmType", { length: 100 }).notNull(), // e.g., "cropping", "mixed_farming"
    state: mysqlEnum("benchmarkState", ["NSW", "VIC", "QLD", "SA", "WA", "TAS", "NT", "ACT"]).notNull(),
    region: varchar("benchmarkRegion", { length: 100 }),

    // Financial metrics ($/ha or AUD)
    avgGrossMarginPerHa: decimal("avgGrossMarginPerHa", { precision: 10, scale: 2 }),
    avgOperatingCostsPerHa: decimal("avgOperatingCostsPerHa", { precision: 10, scale: 2 }),
    avgNetFarmIncome: decimal("avgNetFarmIncome", { precision: 14, scale: 2 }),
    medianNetFarmIncome: decimal("medianNetFarmIncome", { precision: 14, scale: 2 }),

    // Balance sheet ratios (stored as decimal 0-1)
    debtToAssetRatio: decimal("debtToAssetRatio", { precision: 5, scale: 4 }),
    returnOnCapital: decimal("returnOnCapital", { precision: 5, scale: 4 }),
    equityRatio: decimal("equityRatio", { precision: 5, scale: 4 }),

    // Operational metrics
    avgFarmAreaHa: decimal("avgFarmAreaHa", { precision: 10, scale: 2 }),
    avgCroppedAreaHa: decimal("avgCroppedAreaHa", { precision: 10, scale: 2 }),

    // Sample metadata
    sampleSize: int("sampleSize"),
    confidenceLevel: decimal("confidenceLevel", { precision: 4, scale: 2 }), // e.g., 0.95

    // Ingestion
    ingestedAt: timestamp("ingestedAt").defaultNow().notNull(),
    sourceReport: varchar("sourceReport", { length: 255 }),
  },
  (table) => ({
    fyStateIdx: index("abaresFarmBenchmarks_fyState_idx").on(table.financialYear, table.state),
    farmTypeIdx: index("abaresFarmBenchmarks_farmType_idx").on(table.farmType),
  })
);

export type AbaresFarmBenchmark = typeof abaresFarmBenchmarks.$inferSelect;
export type InsertAbaresFarmBenchmark = typeof abaresFarmBenchmarks.$inferInsert;

/**
 * ABARES Supply Forecasts
 * ML-generated supply availability predictions
 */
export const abaresSupplyForecasts = mysqlTable(
  "abaresSupplyForecasts",
  {
    id: int("id").autoincrement().primaryKey(),

    // Forecast identification
    forecastDate: timestamp("forecastDate").notNull(),
    regionCode: varchar("forecastRegionCode", { length: 20 }).notNull(),
    feedstockType: varchar("feedstockType", { length: 100 }).notNull(),
    horizonDays: int("horizonDays").notNull(), // e.g., 90, 180

    // Probability output
    availabilityProbability: decimal("availabilityProbability", { precision: 5, scale: 4 }).notNull(),
    confidenceIntervalLower: decimal("confidenceIntervalLower", { precision: 5, scale: 4 }),
    confidenceIntervalUpper: decimal("confidenceIntervalUpper", { precision: 5, scale: 4 }),

    // Contributing factors
    contributingFactors: json("contributingFactors").$type<{
      weatherImpact: number;
      cropForecastImpact: number;
      historicalReliability: number;
      freightCapacity: number;
      [key: string]: number;
    }>(),

    // Model metadata
    modelVersion: varchar("modelVersion", { length: 50 }),
    modelAccuracy: decimal("modelAccuracy", { precision: 5, scale: 4 }), // Validation accuracy

    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    regionFeedstockIdx: index("abaresSupplyForecasts_regionFeedstock_idx").on(
      table.regionCode,
      table.feedstockType
    ),
    forecastDateIdx: index("abaresSupplyForecasts_forecastDate_idx").on(table.forecastDate),
  })
);

export type AbaresSupplyForecast = typeof abaresSupplyForecasts.$inferSelect;
export type InsertAbaresSupplyForecast = typeof abaresSupplyForecasts.$inferInsert;

/**
 * ABARES Yield Predictions
 * AI-enhanced yield predictions combining ABARES data with satellite/weather
 */
export const abaresYieldPredictions = mysqlTable(
  "abaresYieldPredictions",
  {
    id: int("id").autoincrement().primaryKey(),

    // Prediction target
    predictionDate: timestamp("predictionDate").notNull(),
    propertyId: int("propertyId").references(() => properties.id),
    supplierId: int("supplierId").references(() => suppliers.id),
    crop: varchar("predictionCrop", { length: 50 }).notNull(),
    season: varchar("predictionSeason", { length: 10 }).notNull(),

    // Location (if not linked to property)
    state: mysqlEnum("predictionState", ["NSW", "VIC", "QLD", "SA", "WA", "TAS", "NT", "ACT"]),
    regionCode: varchar("predictionRegionCode", { length: 20 }),

    // Yield prediction
    predictedYieldTonnesPerHa: decimal("predictedYieldTonnesPerHa", { precision: 8, scale: 2 }).notNull(),
    confidenceLower: decimal("yieldConfidenceLower", { precision: 8, scale: 2 }),
    confidenceUpper: decimal("yieldConfidenceUpper", { precision: 8, scale: 2 }),

    // Prediction basis
    methodology: varchar("methodology", { length: 255 }), // e.g., "ABARES + Satellite NDVI"
    dataInputs: json("dataInputs").$type<{
      abaresWeight: number;
      satelliteWeight: number;
      historicalWeight: number;
      weatherWeight: number;
    }>(),

    // Validation (after harvest)
    actualYieldTonnesPerHa: decimal("actualYieldTonnesPerHa", { precision: 8, scale: 2 }),
    predictionError: decimal("predictionError", { precision: 6, scale: 4 }), // % error

    createdAt: timestamp("createdAt").defaultNow().notNull(),
    validatedAt: timestamp("validatedAt"),
  },
  (table) => ({
    propertyIdx: index("abaresYieldPredictions_property_idx").on(table.propertyId),
    cropSeasonIdx: index("abaresYieldPredictions_cropSeason_idx").on(table.crop, table.season),
  })
);

export type AbaresYieldPrediction = typeof abaresYieldPredictions.$inferSelect;
export type InsertAbaresYieldPrediction = typeof abaresYieldPredictions.$inferInsert;

/**
 * ABARES Ingestion Runs
 * Track data ingestion from ABARES sources
 */
export const abaresIngestionRuns = mysqlTable(
  "abaresIngestionRuns",
  {
    id: int("id").autoincrement().primaryKey(),

    // Run identification
    runType: mysqlEnum("runType", [
      "crop_report",
      "commodity_prices",
      "farm_benchmarks",
      "land_use",
    ]).notNull(),
    sourceUrl: varchar("ingestionSourceUrl", { length: 500 }),

    // Timing
    startedAt: timestamp("startedAt").notNull(),
    finishedAt: timestamp("finishedAt"),

    // Results
    status: mysqlEnum("ingestionStatus", ["started", "succeeded", "partial", "failed"]).notNull(),
    recordsIn: int("recordsIn"),
    recordsOut: int("recordsOut"),
    recordsSkipped: int("recordsSkipped"),

    // Errors
    errorMessage: text("errorMessage"),
    errorDetails: json("errorDetails").$type<{
      errors: string[];
      warnings: string[];
    }>(),

    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    runTypeIdx: index("abaresIngestionRuns_runType_idx").on(table.runType),
    startedAtIdx: index("abaresIngestionRuns_startedAt_idx").on(table.startedAt),
  })
);

export type AbaresIngestionRun = typeof abaresIngestionRuns.$inferSelect;
export type InsertAbaresIngestionRun = typeof abaresIngestionRuns.$inferInsert;

// ============================================================================
// BOM CLIMATE DATA
// ============================================================================

/**
 * SILO Climate Data Points
 * Historical climate data from SILO (Scientific Information for Land Owners)
 * 5km grid resolution, 1889-present
 */
export const siloClimateData = mysqlTable(
  "siloClimateData",
  {
    id: int("id").autoincrement().primaryKey(),

    // Location
    latitude: decimal("latitude", { precision: 10, scale: 6 }).notNull(),
    longitude: decimal("longitude", { precision: 10, scale: 6 }).notNull(),
    stationId: varchar("stationId", { length: 20 }),
    stationName: varchar("stationName", { length: 100 }),

    // Date
    date: date("date").notNull(),

    // Core variables
    dailyRainMm: decimal("dailyRainMm", { precision: 8, scale: 2 }),
    maxTempC: decimal("maxTempC", { precision: 5, scale: 2 }),
    minTempC: decimal("minTempC", { precision: 5, scale: 2 }),
    solarRadiationMJ: decimal("solarRadiationMJ", { precision: 6, scale: 2 }),

    // Evaporation
    evapPanMm: decimal("evapPanMm", { precision: 6, scale: 2 }),
    evapSynMm: decimal("evapSynMm", { precision: 6, scale: 2 }),
    etShortCropMm: decimal("etShortCropMm", { precision: 6, scale: 2 }),
    etTallCropMm: decimal("etTallCropMm", { precision: 6, scale: 2 }),

    // Humidity and pressure
    vapourPressureHPa: decimal("vapourPressureHPa", { precision: 6, scale: 2 }),
    vpDeficitHPa: decimal("vpDeficitHPa", { precision: 6, scale: 2 }),
    relHumidityMaxTemp: int("relHumidityMaxTemp"),
    relHumidityMinTemp: int("relHumidityMinTemp"),
    mslPressureHPa: decimal("mslPressureHPa", { precision: 7, scale: 2 }),

    // Quality codes (0=observed, 1-3=interpolated)
    qualityCodes: json("qualityCodes").$type<Record<string, number>>(),

    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    locationDateIdx: index("siloClimateData_location_date_idx").on(
      table.latitude,
      table.longitude,
      table.date
    ),
    dateIdx: index("siloClimateData_date_idx").on(table.date),
    stationIdx: index("siloClimateData_station_idx").on(table.stationId),
  })
);

export type SiloClimateData = typeof siloClimateData.$inferSelect;
export type InsertSiloClimateData = typeof siloClimateData.$inferInsert;

/**
 * BOM Weather Observations
 * Real-time weather observations from BOM stations
 */
export const bomObservations = mysqlTable(
  "bomObservations",
  {
    id: int("id").autoincrement().primaryKey(),

    // Station info
    stationId: varchar("stationId", { length: 20 }).notNull(),
    stationName: varchar("stationName", { length: 100 }).notNull(),
    state: mysqlEnum("state", ["NSW", "VIC", "QLD", "SA", "WA", "TAS", "NT", "ACT"]).notNull(),
    latitude: decimal("latitude", { precision: 10, scale: 6 }).notNull(),
    longitude: decimal("longitude", { precision: 10, scale: 6 }).notNull(),

    // Observation time
    observationTime: timestamp("observationTime").notNull(),

    // Temperature
    temperatureC: decimal("temperatureC", { precision: 5, scale: 2 }),
    apparentTempC: decimal("apparentTempC", { precision: 5, scale: 2 }),
    dewPointC: decimal("dewPointC", { precision: 5, scale: 2 }),

    // Humidity
    humidityPercent: int("humidityPercent"),

    // Wind
    windSpeedKmh: decimal("windSpeedKmh", { precision: 6, scale: 2 }),
    windGustKmh: decimal("windGustKmh", { precision: 6, scale: 2 }),
    windDirection: varchar("windDirection", { length: 10 }),

    // Pressure
    pressureHPa: decimal("pressureHPa", { precision: 7, scale: 2 }),

    // Rainfall
    rainfallSince9amMm: decimal("rainfallSince9amMm", { precision: 8, scale: 2 }),
    rainfall24hrMm: decimal("rainfall24hrMm", { precision: 8, scale: 2 }),

    // Cloud
    cloudCover: varchar("cloudCover", { length: 50 }),

    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    stationTimeIdx: index("bomObservations_station_time_idx").on(
      table.stationId,
      table.observationTime
    ),
    timeIdx: index("bomObservations_time_idx").on(table.observationTime),
    stateIdx: index("bomObservations_state_idx").on(table.state),
  })
);

export type BomObservation = typeof bomObservations.$inferSelect;
export type InsertBomObservation = typeof bomObservations.$inferInsert;

/**
 * BOM Forecasts
 * Weather forecasts from BOM
 */
export const bomForecasts = mysqlTable(
  "bomForecasts",
  {
    id: int("id").autoincrement().primaryKey(),

    // Location
    locationName: varchar("locationName", { length: 100 }).notNull(),
    state: mysqlEnum("state", ["NSW", "VIC", "QLD", "SA", "WA", "TAS", "NT", "ACT"]).notNull(),
    latitude: decimal("latitude", { precision: 10, scale: 6 }).notNull(),
    longitude: decimal("longitude", { precision: 10, scale: 6 }).notNull(),

    // Issue time
    issueTime: timestamp("issueTime").notNull(),

    // Forecast date
    forecastDate: date("forecastDate").notNull(),

    // Temperature
    minTempC: decimal("minTempC", { precision: 5, scale: 2 }),
    maxTempC: decimal("maxTempC", { precision: 5, scale: 2 }),

    // Conditions
    precis: varchar("precis", { length: 255 }),
    precipitationProbability: int("precipitationProbability"),
    precipitationRangeMin: decimal("precipitationRangeMin", { precision: 6, scale: 2 }),
    precipitationRangeMax: decimal("precipitationRangeMax", { precision: 6, scale: 2 }),

    // UV and fire
    uvIndex: int("uvIndex"),
    uvCategory: varchar("uvCategory", { length: 20 }),
    fireWeatherRating: varchar("fireWeatherRating", { length: 50 }),
    fireWeatherIndex: int("fireWeatherIndex"),

    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    locationDateIdx: index("bomForecasts_location_date_idx").on(
      table.locationName,
      table.forecastDate
    ),
    issueTimeIdx: index("bomForecasts_issueTime_idx").on(table.issueTime),
    forecastDateIdx: index("bomForecasts_forecastDate_idx").on(table.forecastDate),
  })
);

export type BomForecast = typeof bomForecasts.$inferSelect;
export type InsertBomForecast = typeof bomForecasts.$inferInsert;

/**
 * Seasonal Climate Outlooks
 * 3-month probabilistic rainfall and temperature outlooks
 */
export const seasonalOutlooks = mysqlTable(
  "seasonalOutlooks",
  {
    id: int("id").autoincrement().primaryKey(),

    // Issue date
    issueDate: date("issueDate").notNull(),

    // Valid period
    validPeriodStart: date("validPeriodStart").notNull(),
    validPeriodEnd: date("validPeriodEnd").notNull(),
    validPeriodMonths: varchar("validPeriodMonths", { length: 50 }), // e.g., "Jan - Mar"

    // Region
    region: varchar("region", { length: 100 }).notNull(),
    state: mysqlEnum("state", ["NSW", "VIC", "QLD", "SA", "WA", "TAS", "NT", "ACT"]),
    latitude: decimal("latitude", { precision: 10, scale: 6 }),
    longitude: decimal("longitude", { precision: 10, scale: 6 }),

    // Rainfall outlook (tercile probabilities)
    rainBelowMedianPercent: int("rainBelowMedianPercent"),
    rainNearMedianPercent: int("rainNearMedianPercent"),
    rainAboveMedianPercent: int("rainAboveMedianPercent"),
    medianRainfallMm: decimal("medianRainfallMm", { precision: 8, scale: 2 }),

    // Temperature outlook - max temp
    maxTempBelowMedianPercent: int("maxTempBelowMedianPercent"),
    maxTempNearMedianPercent: int("maxTempNearMedianPercent"),
    maxTempAboveMedianPercent: int("maxTempAboveMedianPercent"),

    // Temperature outlook - min temp
    minTempBelowMedianPercent: int("minTempBelowMedianPercent"),
    minTempNearMedianPercent: int("minTempNearMedianPercent"),
    minTempAboveMedianPercent: int("minTempAboveMedianPercent"),

    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    regionDateIdx: index("seasonalOutlooks_region_date_idx").on(
      table.region,
      table.issueDate
    ),
    issueDateIdx: index("seasonalOutlooks_issueDate_idx").on(table.issueDate),
    validPeriodIdx: index("seasonalOutlooks_validPeriod_idx").on(
      table.validPeriodStart,
      table.validPeriodEnd
    ),
  })
);

export type SeasonalOutlook = typeof seasonalOutlooks.$inferSelect;
export type InsertSeasonalOutlook = typeof seasonalOutlooks.$inferInsert;

/**
 * BOM Weather Warnings
 * Active severe weather warnings
 */
export const bomWarnings = mysqlTable(
  "bomWarnings",
  {
    id: int("id").autoincrement().primaryKey(),

    // Warning identification
    warningId: varchar("warningId", { length: 50 }).notNull().unique(),
    warningType: mysqlEnum("warningType", [
      "severe_thunderstorm",
      "flood",
      "fire_weather",
      "heat",
      "frost",
      "wind",
      "other",
    ]).notNull(),
    severity: mysqlEnum("severity", [
      "minor",
      "moderate",
      "severe",
      "extreme",
    ]).notNull(),

    // Content
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description").notNull(),

    // Timing
    issueTime: timestamp("issueTime").notNull(),
    expiryTime: timestamp("expiryTime"),

    // Affected areas
    affectedAreas: json("affectedAreas").$type<string[]>().notNull(),
    state: mysqlEnum("state", ["NSW", "VIC", "QLD", "SA", "WA", "TAS", "NT", "ACT"]),

    // Coordinates
    coordinates: json("coordinates").$type<Array<{
      latitude: number;
      longitude: number;
      radius?: number;
    }>>(),

    // Status
    active: boolean("active").default(true).notNull(),
    supersededBy: varchar("supersededBy", { length: 50 }),

    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    warningIdIdx: index("bomWarnings_warningId_idx").on(table.warningId),
    typeIdx: index("bomWarnings_type_idx").on(table.warningType),
    severityIdx: index("bomWarnings_severity_idx").on(table.severity),
    activeIdx: index("bomWarnings_active_idx").on(table.active),
    issueTimeIdx: index("bomWarnings_issueTime_idx").on(table.issueTime),
    stateIdx: index("bomWarnings_state_idx").on(table.state),
  })
);

export type BomWarning = typeof bomWarnings.$inferSelect;
export type InsertBomWarning = typeof bomWarnings.$inferInsert;

/**
 * Agricultural Climate Metrics
 * Derived metrics for agricultural planning
 */
export const agriculturalClimateMetrics = mysqlTable(
  "agriculturalClimateMetrics",
  {
    id: int("id").autoincrement().primaryKey(),

    // Location
    propertyId: int("propertyId").references(() => properties.id),
    supplierId: int("supplierId").references(() => suppliers.id),
    latitude: decimal("latitude", { precision: 10, scale: 6 }).notNull(),
    longitude: decimal("longitude", { precision: 10, scale: 6 }).notNull(),
    region: varchar("region", { length: 100 }),

    // Period
    periodStart: date("periodStart").notNull(),
    periodEnd: date("periodEnd").notNull(),
    season: varchar("season", { length: 20 }), // e.g., "2024-25"

    // Crop reference
    cropType: varchar("cropType", { length: 50 }),

    // Growing metrics
    growingDegreeDays: int("growingDegreeDays"),
    chillHours: int("chillHours"),
    effectiveRainfallMm: decimal("effectiveRainfallMm", { precision: 8, scale: 2 }),

    // Stress metrics
    frostDays: int("frostDays"),
    heatStressDays: int("heatStressDays"), // Days > 35°C
    droughtIndex: decimal("droughtIndex", { precision: 5, scale: 4 }), // 0-1

    // Risk levels
    frostRisk: mysqlEnum("frostRisk", ["low", "moderate", "high"]),
    heatStressRisk: mysqlEnum("heatStressRisk", ["low", "moderate", "high"]),
    droughtRisk: mysqlEnum("droughtRisk", ["low", "moderate", "high"]),

    // Soil moisture estimate
    soilMoistureIndex: decimal("soilMoistureIndex", { precision: 5, scale: 4 }),

    // Calculation metadata
    dataSource: varchar("dataSource", { length: 50 }).default("SILO"),
    calculatedAt: timestamp("calculatedAt").notNull(),

    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    propertyIdx: index("agClimateMetrics_property_idx").on(table.propertyId),
    supplierIdx: index("agClimateMetrics_supplier_idx").on(table.supplierId),
    periodIdx: index("agClimateMetrics_period_idx").on(
      table.periodStart,
      table.periodEnd
    ),
    regionIdx: index("agClimateMetrics_region_idx").on(table.region),
  })
);

export type AgriculturalClimateMetric = typeof agriculturalClimateMetrics.$inferSelect;
export type InsertAgriculturalClimateMetric = typeof agriculturalClimateMetrics.$inferInsert;

/**
 * BOM Ingestion Runs
 * Track data ingestion from BOM/SILO sources
 */
export const bomIngestionRuns = mysqlTable(
  "bomIngestionRuns",
  {
    id: int("id").autoincrement().primaryKey(),

    // Run identification
    runType: mysqlEnum("runType", [
      "silo_historical",
      "observations",
      "forecasts",
      "seasonal_outlook",
      "warnings",
      "climate_metrics",
    ]).notNull(),
    sourceUrl: varchar("sourceUrl", { length: 500 }),

    // Scope
    region: varchar("region", { length: 100 }),
    state: mysqlEnum("state", ["NSW", "VIC", "QLD", "SA", "WA", "TAS", "NT", "ACT"]),
    dateRangeStart: date("dateRangeStart"),
    dateRangeEnd: date("dateRangeEnd"),

    // Timing
    startedAt: timestamp("startedAt").notNull(),
    finishedAt: timestamp("finishedAt"),

    // Results
    status: mysqlEnum("status", ["started", "succeeded", "partial", "failed"]).notNull(),
    recordsIn: int("recordsIn"),
    recordsOut: int("recordsOut"),
    recordsSkipped: int("recordsSkipped"),

    // Errors
    errorMessage: text("errorMessage"),
    errorDetails: json("errorDetails").$type<{
      errors: string[];
      warnings: string[];
    }>(),

    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    runTypeIdx: index("bomIngestionRuns_runType_idx").on(table.runType),
    startedAtIdx: index("bomIngestionRuns_startedAt_idx").on(table.startedAt),
    stateIdx: index("bomIngestionRuns_state_idx").on(table.state),
  })
);

export type BomIngestionRun = typeof bomIngestionRuns.$inferSelect;
export type InsertBomIngestionRun = typeof bomIngestionRuns.$inferInsert;
