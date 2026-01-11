/**
 * Climate Intelligence Hub Scheduled Jobs
 * Weekly satellite data refresh and monthly cache cleanup
 */

import { getDb } from "./db";
import { eq, lt, and, isNotNull } from "drizzle-orm";
import { climateLocationData, bioenergyProjects } from "../drizzle/schema";
import { getVegetationHealth } from "./services/earthEngine";

/**
 * Weekly Satellite Data Refresh
 * Refreshes GEE satellite data for all bioenergy project locations
 * Runs every Sunday at 1:00 AM
 */
export async function weeklySatelliteDataRefresh(): Promise<{
  success: boolean;
  locationsRefreshed: number;
  errors: string[];
}> {
  console.log("[Climate Hub] Starting weekly satellite data refresh...");

  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const errors: string[] = [];
  let locationsRefreshed = 0;

  try {
    // Get all bioenergy projects with coordinates
    const projects = await db
      .select({
        id: bioenergyProjects.id,
        name: bioenergyProjects.name,
        latitude: bioenergyProjects.latitude,
        longitude: bioenergyProjects.longitude,
      })
      .from(bioenergyProjects)
      .where(and(
        isNotNull(bioenergyProjects.latitude),
        isNotNull(bioenergyProjects.longitude)
      ));

    console.log(`[Climate Hub] Found ${projects.length} bioenergy projects to refresh`);

    for (const project of projects) {
      if (!project.latitude || !project.longitude) continue;

      try {
        const lat = parseFloat(project.latitude);
        const lng = parseFloat(project.longitude);

        // Calculate location hash for caching
        const locationHash = `${lat.toFixed(2)}_${lng.toFixed(2)}`;

        // Check if we need to refresh (data older than 6 days)
        const sixDaysAgo = new Date();
        sixDaysAgo.setDate(sixDaysAgo.getDate() - 6);

        const existingCache = await db
          .select()
          .from(climateLocationData)
          .where(eq(climateLocationData.locationHash, locationHash))
          .limit(1);

        const needsRefresh = existingCache.length === 0 ||
          (existingCache[0].satelliteDataUpdatedAt && new Date(existingCache[0].satelliteDataUpdatedAt) < sixDaysAgo);

        if (!needsRefresh) {
          console.log(`[Climate Hub] Skipping ${project.name} - satellite data is fresh`);
          continue;
        }

        // Fetch fresh satellite data from Earth Engine
        console.log(`[Climate Hub] Refreshing satellite data for ${project.name}...`);

        const satelliteData = await getVegetationHealth({ lat, lng });

        if (satelliteData) {
          // Update or insert cache record
          if (existingCache.length > 0) {
            await db.update(climateLocationData)
              .set({
                ndviMean: satelliteData.ndvi?.toString() || null,
                vegetationEVI: satelliteData.evi?.toString() || null,
                vegetationLAI: satelliteData.lai?.toString() || null,
                vegetationHealthScore: satelliteData.healthScore || null,
                vegetationTrend: satelliteData.trend || null,
                satelliteDataUpdatedAt: new Date(),
                updatedAt: new Date(),
              })
              .where(eq(climateLocationData.locationHash, locationHash));
          } else {
            await db.insert(climateLocationData).values({
              locationHash,
              latitude: lat.toString(),
              longitude: lng.toString(),
              ndviMean: satelliteData.ndvi?.toString() || null,
              vegetationEVI: satelliteData.evi?.toString() || null,
              vegetationLAI: satelliteData.lai?.toString() || null,
              vegetationHealthScore: satelliteData.healthScore || null,
              vegetationTrend: satelliteData.trend || null,
              satelliteDataUpdatedAt: new Date(),
            });
          }

          locationsRefreshed++;
        }
      } catch (error) {
        const errMsg = `Failed to refresh satellite data for ${project.name}: ${error}`;
        console.error(`[Climate Hub] ${errMsg}`);
        errors.push(errMsg);
      }

      // Rate limiting: wait 1 second between requests to avoid GEE quota issues
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log(`[Climate Hub] Satellite data refresh complete. ${locationsRefreshed} locations refreshed.`);

    return {
      success: errors.length === 0,
      locationsRefreshed,
      errors,
    };
  } catch (error) {
    console.error("[Climate Hub] Satellite data refresh failed:", error);
    throw error;
  }
}

/**
 * Monthly Climate Data Cache Cleanup
 * Removes stale cache entries older than 60 days
 * Runs on 15th of each month at 2:00 AM
 */
export async function monthlyClimateDataCacheCleanup(): Promise<{
  success: boolean;
  recordsDeleted: number;
  errors: string[];
}> {
  console.log("[Climate Hub] Starting monthly cache cleanup...");

  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const errors: string[] = [];
  let recordsDeleted = 0;

  try {
    // Delete cache entries older than 60 days
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const staleRecords = await db
      .select({ id: climateLocationData.id })
      .from(climateLocationData)
      .where(lt(climateLocationData.updatedAt, sixtyDaysAgo));

    console.log(`[Climate Hub] Found ${staleRecords.length} stale cache entries`);

    for (const record of staleRecords) {
      try {
        await db.delete(climateLocationData)
          .where(eq(climateLocationData.id, record.id));
        recordsDeleted++;
      } catch (error) {
        const errMsg = `Failed to delete cache record ${record.id}: ${error}`;
        console.error(`[Climate Hub] ${errMsg}`);
        errors.push(errMsg);
      }
    }

    console.log(`[Climate Hub] Cache cleanup complete. ${recordsDeleted} records deleted.`);

    return {
      success: errors.length === 0,
      recordsDeleted,
      errors,
    };
  } catch (error) {
    console.error("[Climate Hub] Cache cleanup failed:", error);
    throw error;
  }
}

/**
 * Run all climate hub jobs
 * Used for manual triggering
 */
export async function runAllClimateHubJobs(): Promise<{
  satelliteRefresh: Awaited<ReturnType<typeof weeklySatelliteDataRefresh>>;
  cacheCleanup: Awaited<ReturnType<typeof monthlyClimateDataCacheCleanup>>;
}> {
  console.log("[Climate Hub] Running all climate hub jobs...");

  const [satelliteRefresh, cacheCleanup] = await Promise.all([
    weeklySatelliteDataRefresh().catch(e => ({ success: false, locationsRefreshed: 0, errors: [e.message] })),
    monthlyClimateDataCacheCleanup().catch(e => ({ success: false, recordsDeleted: 0, errors: [e.message] })),
  ]);

  console.log("[Climate Hub] All jobs complete.");

  return {
    satelliteRefresh,
    cacheCleanup,
  };
}
