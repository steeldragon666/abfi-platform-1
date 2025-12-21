/**
 * Entity Resolution Service
 * Resolves signals to canonical entities using fuzzy matching and ABN lookup
 */

import { getDb } from "../db";
import { stealthEntities, stealthSignals } from "../../drizzle/schema";
import { eq, sql, like, or } from "drizzle-orm";
import { RawSignal } from "../connectors/baseConnector";

// Helper to get db instance with null check
async function requireDb() {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }
  return db;
}

interface ResolvedEntity {
  id: number;
  canonicalName: string;
  isNew: boolean;
}

interface EntityMatch {
  id: number;
  canonicalName: string;
  allNames: string[];
  score: number; // 0-1 match confidence
}

/**
 * Normalize company name for matching
 * Removes common suffixes and standardizes format
 */
function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b(pty|ltd|limited|incorporated|inc|corp|corporation)\b/g, "")
    .replace(/[.,]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Calculate similarity between two strings (Levenshtein-based)
 */
function calculateSimilarity(str1: string, str2: string): number {
  const s1 = normalizeName(str1);
  const s2 = normalizeName(str2);

  if (s1 === s2) return 1.0;

  // Simple token-based similarity
  const tokens1 = new Set(s1.split(" "));
  const tokens2 = new Set(s2.split(" "));

  const intersection = new Set(Array.from(tokens1).filter((x) => tokens2.has(x)));
  const union = new Set([...Array.from(tokens1), ...Array.from(tokens2)]);

  // Jaccard similarity
  return intersection.size / union.size;
}

/**
 * Find existing entities that might match the given name
 */
async function findPotentialMatches(entityName: string): Promise<EntityMatch[]> {
  const normalizedName = normalizeName(entityName);
  const searchTerms = normalizedName.split(" ").filter((t) => t.length > 2);

  if (searchTerms.length === 0) {
    return [];
  }

  // Search for entities with similar names
  const db = await requireDb();
  const entities = await db
    .select()
    .from(stealthEntities)
    .where(
      or(
        ...searchTerms.map((term) =>
          like(sql`LOWER(${stealthEntities.canonicalName})`, `%${term}%`)
        )
      )
    )
    .limit(10);

  // Calculate match scores
  const matches: EntityMatch[] = entities.map((entity) => {
    // Check match against canonical name and all known names
    const allNames = entity.allNames as string[];
    const scores = [entity.canonicalName, ...allNames].map((name) =>
      calculateSimilarity(entityName, name)
    );
    const bestScore = Math.max(...scores);

    return {
      id: entity.id,
      canonicalName: entity.canonicalName,
      allNames,
      score: bestScore,
    };
  });

  // Filter and sort by score
  return matches.filter((m) => m.score > 0.5).sort((a, b) => b.score - a.score);
}

/**
 * Resolve a signal to an existing or new entity
 */
export async function resolveEntity(signal: RawSignal): Promise<ResolvedEntity> {
  const db = await requireDb();

  // First, check for exact ABN match if available
  if (signal.identifiers?.abn) {
    const abnMatch = await db
      .select()
      .from(stealthEntities)
      .where(
        sql`JSON_CONTAINS(${stealthEntities.identifiers}, '"${signal.identifiers.abn}"', '$.abn')`
      )
      .limit(1);

    if (abnMatch.length > 0) {
      return {
        id: abnMatch[0].id,
        canonicalName: abnMatch[0].canonicalName,
        isNew: false,
      };
    }
  }

  // Find potential name matches
  const matches = await findPotentialMatches(signal.entityName);

  if (matches.length > 0 && matches[0].score >= 0.8) {
    // High confidence match - use existing entity
    const bestMatch = matches[0];

    // Add the new name variant if not already present
    if (
      !bestMatch.allNames.some(
        (n) => normalizeName(n) === normalizeName(signal.entityName)
      )
    ) {
      const updatedNames = [...bestMatch.allNames, signal.entityName];
      await db
        .update(stealthEntities)
        .set({ allNames: updatedNames })
        .where(eq(stealthEntities.id, bestMatch.id));
    }

    return {
      id: bestMatch.id,
      canonicalName: bestMatch.canonicalName,
      isNew: false,
    };
  }

  // No good match found - create new entity
  const [newEntity] = await db
    .insert(stealthEntities)
    .values({
      entityType: "unknown",
      canonicalName: signal.entityName,
      allNames: [signal.entityName],
      identifiers: signal.identifiers || null,
      metadata: signal.metadata || null,
      currentScore: "0",
      signalCount: 0,
      needsReview: false,
    })
    .$returningId();

  return {
    id: newEntity.id,
    canonicalName: signal.entityName,
    isNew: true,
  };
}

/**
 * Process a batch of signals, resolving entities and storing signals
 */
export async function processSignals(
  signals: RawSignal[],
  source: string
): Promise<{
  entitiesCreated: number;
  entitiesUpdated: number;
  signalsStored: number;
  errors: string[];
}> {
  const db = await requireDb();
  let entitiesCreated = 0;
  let entitiesUpdated = 0;
  let signalsStored = 0;
  const errors: string[] = [];

  for (const signal of signals) {
    try {
      // Resolve entity
      const entity = await resolveEntity(signal);

      if (entity.isNew) {
        entitiesCreated++;
      } else {
        entitiesUpdated++;
      }

      // Store signal (sourceId/sourceUrl stored in rawData since not in schema)
      await db.insert(stealthSignals).values({
        entityId: entity.id,
        signalType: signal.signalType,
        signalWeight: String(signal.signalWeight),
        confidence: String(signal.confidence),
        source,
        title: signal.title,
        description: signal.description || null,
        rawData: {
          ...signal.rawData,
          sourceId: signal.sourceId,
          sourceUrl: signal.sourceUrl,
        },
        detectedAt: signal.detectedAt,
      });

      signalsStored++;

      // Update entity metadata and last signal timestamp
      await db
        .update(stealthEntities)
        .set({
          lastSignalAt: signal.detectedAt,
          signalCount: sql`${stealthEntities.signalCount} + 1`,
        })
        .where(eq(stealthEntities.id, entity.id));
    } catch (error) {
      const errorMsg = `Failed to process signal ${signal.sourceId}: ${
        error instanceof Error ? error.message : "Unknown error"
      }`;
      console.error(errorMsg);
      errors.push(errorMsg);
    }
  }

  return {
    entitiesCreated,
    entitiesUpdated,
    signalsStored,
    errors,
  };
}

/**
 * Merge duplicate entities
 * Used during manual review or automated deduplication
 */
export async function mergeEntities(
  primaryId: number,
  duplicateId: number
): Promise<void> {
  const db = await requireDb();

  // Get both entities
  const [primary] = await db
    .select()
    .from(stealthEntities)
    .where(eq(stealthEntities.id, primaryId))
    .limit(1);

  const [duplicate] = await db
    .select()
    .from(stealthEntities)
    .where(eq(stealthEntities.id, duplicateId))
    .limit(1);

  if (!primary || !duplicate) {
    throw new Error("One or both entities not found");
  }

  // Merge names
  const primaryNames = primary.allNames as string[];
  const duplicateNames = duplicate.allNames as string[];
  const mergedNames = Array.from(new Set([...primaryNames, ...duplicateNames]));

  // Merge identifiers
  const mergedIdentifiers = {
    ...(duplicate.identifiers as object || {}),
    ...(primary.identifiers as object || {}),
  };

  // Update primary entity
  await db
    .update(stealthEntities)
    .set({
      allNames: mergedNames,
      identifiers: mergedIdentifiers,
      signalCount: primary.signalCount + duplicate.signalCount,
    })
    .where(eq(stealthEntities.id, primaryId));

  // Move signals to primary entity
  await db
    .update(stealthSignals)
    .set({ entityId: primaryId })
    .where(eq(stealthSignals.entityId, duplicateId));

  // Delete duplicate entity
  await db.delete(stealthEntities).where(eq(stealthEntities.id, duplicateId));
}
