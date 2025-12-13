/**
 * Temporal Versioning & Validity Framework
 * Time-aware queries and version management
 */

import { getDb } from "./db.js";
import { eq, and, lte, gte, isNull, or } from "drizzle-orm";
import {
  feedstocks,
  certificates,
  supplyAgreements,
  bankabilityAssessments,
} from "../drizzle/schema.js";

/**
 * Get entity as of a specific date
 * Returns the version that was valid at that point in time
 */
export async function getEntityAsOfDate(
  entityType: "feedstock" | "certificate" | "supply_agreement" | "bankability_assessment",
  entityId: number,
  asOfDate: Date
): Promise<any | null> {
  const db = await getDb();
  if (!db) return null;

  const table = getTableForEntityType(entityType);
  if (!table) return null;

  // Find version where validFrom <= asOfDate AND (validTo > asOfDate OR validTo IS NULL)
  const results = await db
    .select()
    .from(table)
    .where(
      and(
        eq(table.id, entityId),
        lte(table.validFrom, asOfDate),
        or(
          gte(table.validTo, asOfDate),
          isNull(table.validTo)
        )
      )
    )
    .limit(1);

  return results[0] || null;
}

/**
 * Get current version of entity
 */
export async function getCurrentVersion(
  entityType: "feedstock" | "certificate" | "supply_agreement" | "bankability_assessment",
  entityId: number
): Promise<any | null> {
  const db = await getDb();
  if (!db) return null;

  const table = getTableForEntityType(entityType);
  if (!table) return null;

  const results = await db
    .select()
    .from(table)
    .where(
      and(
        eq(table.id, entityId),
        eq(table.isCurrent, true)
      )
    )
    .limit(1);

  return results[0] || null;
}

/**
 * Get version history for an entity
 * Returns all versions ordered by version number
 */
export async function getEntityHistory(
  entityType: "feedstock" | "certificate" | "supply_agreement" | "bankability_assessment",
  entityId: number
): Promise<any[]> {
  const db = await getDb();
  if (!db) return [];

  const table = getTableForEntityType(entityType);
  if (!table) return [];

  // Get all versions for this entity (same base ID)
  // Note: In a full implementation, we'd track the original entity ID
  // For now, we'll just return versions that reference each other
  return await db
    .select()
    .from(table)
    .where(eq(table.id, entityId))
    .orderBy(table.versionNumber);
}

/**
 * Create new version of entity
 * Marks old version as superseded and creates new version
 */
export async function createNewVersion(
  entityType: "feedstock" | "certificate" | "supply_agreement" | "bankability_assessment",
  oldEntityId: number,
  newEntityData: Record<string, any>,
  versionReason: string
): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const table = getTableForEntityType(entityType);
  if (!table) throw new Error("Invalid entity type");

  const now = new Date();

  // Get current version
  const currentVersion = await getCurrentVersion(entityType, oldEntityId);
  if (!currentVersion) {
    throw new Error("Current version not found");
  }

  // Mark old version as superseded
  await db.update(table)
    .set({
      isCurrent: false,
      validTo: now,
    })
    .where(eq(table.id, oldEntityId));

  // Create new version
  const newVersion = {
    ...newEntityData,
    versionNumber: currentVersion.versionNumber + 1,
    validFrom: now,
    validTo: null,
    supersededById: null,
    isCurrent: true,
    versionReason: versionReason,
  };

  // Insert new version
  const result = await db.insert(table).values(newVersion);
  const newVersionId = Number(result[0].insertId);

  // Update old version to point to new version
  await db.update(table)
    .set({ supersededById: newVersionId })
    .where(eq(table.id, oldEntityId));

  return newVersionId;
}

/**
 * Get version timeline for an entity
 * Returns summary of all versions with key changes
 */
export async function getVersionTimeline(
  entityType: "feedstock" | "certificate" | "supply_agreement" | "bankability_assessment",
  entityId: number
): Promise<Array<{
  versionNumber: number;
  validFrom: Date;
  validTo: Date | null;
  isCurrent: boolean;
  reason: string | null;
  supersededById: number | null;
}>> {
  const history = await getEntityHistory(entityType, entityId);

  return history.map((version) => ({
    versionNumber: version.versionNumber,
    validFrom: version.validFrom,
    validTo: version.validTo,
    isCurrent: version.isCurrent,
    reason: version.versionReason || version.amendmentReason || version.reassessmentReason,
    supersededById: version.supersededById,
  }));
}

/**
 * Check if entity is current
 */
export function isEntityCurrent(entity: any): boolean {
  return entity.isCurrent === true && entity.validTo === null;
}

/**
 * Check if entity was valid at a specific date
 */
export function wasEntityValidAt(entity: any, date: Date): boolean {
  const validFrom = new Date(entity.validFrom);
  const validTo = entity.validTo ? new Date(entity.validTo) : null;

  return validFrom <= date && (validTo === null || validTo > date);
}

/**
 * Get validity period for entity
 */
export function getValidityPeriod(entity: any): { from: Date; to: Date | null } {
  return {
    from: new Date(entity.validFrom),
    to: entity.validTo ? new Date(entity.validTo) : null,
  };
}

/**
 * Calculate days until expiry (for entities with validTo)
 */
export function daysUntilExpiry(entity: any): number | null {
  if (!entity.validTo) return null;

  const now = new Date();
  const validTo = new Date(entity.validTo);
  const diffMs = validTo.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  return diffDays;
}

/**
 * Check if entity is expiring soon
 */
export function isExpiringSoon(entity: any, daysThreshold: number = 30): boolean {
  const days = daysUntilExpiry(entity);
  return days !== null && days > 0 && days <= daysThreshold;
}

/**
 * Check if entity is expired
 */
export function isExpired(entity: any): boolean {
  const days = daysUntilExpiry(entity);
  return days !== null && days < 0;
}

/**
 * Helper to get table reference for entity type
 */
function getTableForEntityType(
  entityType: "feedstock" | "certificate" | "supply_agreement" | "bankability_assessment"
): any {
  switch (entityType) {
    case "feedstock":
      return feedstocks;
    case "certificate":
      return certificates;
    case "supply_agreement":
      return supplyAgreements;
    case "bankability_assessment":
      return bankabilityAssessments;
    default:
      return null;
  }
}

/**
 * Compare two versions and return differences
 */
export function compareVersions(oldVersion: any, newVersion: any): Record<string, { old: any; new: any }> {
  const differences: Record<string, { old: any; new: any }> = {};

  // Get all keys from both versions
  const allKeys = Array.from(new Set([...Object.keys(oldVersion), ...Object.keys(newVersion)]));

  // Exclude metadata fields
  const excludeKeys = [
    "id",
    "versionNumber",
    "validFrom",
    "validTo",
    "supersededById",
    "isCurrent",
    "createdAt",
    "updatedAt",
    "versionReason",
    "amendmentReason",
    "reassessmentReason",
  ];

  for (const key of allKeys) {
    if (excludeKeys.includes(key)) continue;

    const oldValue = oldVersion[key];
    const newValue = newVersion[key];

    // Compare values (handle JSON objects)
    const oldStr = JSON.stringify(oldValue);
    const newStr = JSON.stringify(newValue);

    if (oldStr !== newStr) {
      differences[key] = { old: oldValue, new: newValue };
    }
  }

  return differences;
}
