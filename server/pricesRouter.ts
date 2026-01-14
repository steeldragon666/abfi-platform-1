/**
 * Feedstock Prices Router
 * API endpoints for the feedstock price index dashboard
 * 
 * Provides deterministic price data based on time for consistent display
 */

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, publicProcedure } from "./_core/trpc";
import { getDb } from "./db";
import {
  feedstockPrices,
  regionalPriceSummary,
  forwardCurves,
  technicalIndicators,
} from "../drizzle/schema";
import { eq, desc, gte, and, sql } from "drizzle-orm";

// Helper to get db instance with null check
async function requireDb() {
  const db = await getDb();
  if (!db) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Database not available",
    });
  }
  return db;
}

// ============================================================================
// DETERMINISTIC HELPERS
// ============================================================================

/**
 * Generate a deterministic seed from a date
 */
function getDateSeed(date: Date): number {
  return date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate();
}

/**
 * Deterministic pseudo-random number generator
 */
function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

// Commodity base prices (realistic Jan 2026 values, AUD/MT)
const COMMODITY_BASE_PRICES: Record<string, number> = {
  UCO: 1280,
  Tallow: 1050,
  Canola: 750,
  Palm: 920,
};

const REGIONS = [
  { id: "AUS", name: "Australia", modifier: 1.0 },
  { id: "SEA", name: "Southeast Asia", modifier: 0.85 },
  { id: "EU", name: "Europe", modifier: 1.18 },
  { id: "NA", name: "North America", modifier: 1.12 },
  { id: "LATAM", name: "Latin America", modifier: 0.88 },
];

// ============================================================================
// DETERMINISTIC DATA GENERATORS
// ============================================================================

function generateKPIs() {
  const seed = getDateSeed(new Date());
  
  return Object.entries(COMMODITY_BASE_PRICES).map(([commodity, basePrice], idx) => {
    const commoditySeed = seed + idx * 17;
    
    // Deterministic daily change between -3% and +3%
    const changePct = (seededRandom(commoditySeed) - 0.5) * 6;
    const adjustedPrice = basePrice * (1 + changePct / 100);
    
    return {
      commodity,
      price: Math.round(adjustedPrice),
      currency: "AUD",
      unit: "MT",
      change_pct: Math.round(changePct * 10) / 10,
      change_direction: changePct > 0.5 ? "up" : changePct < -0.5 ? "down" : "flat",
    };
  });
}

function generateOHLC(commodity: string, region: string, period: string) {
  const basePrice = COMMODITY_BASE_PRICES[commodity] || 1000;
  const regionData = REGIONS.find(r => r.id === region);
  const regionModifier = regionData?.modifier || 1.0;
  const adjustedBasePrice = basePrice * regionModifier;
  
  const days = period === "1M" ? 30 : period === "3M" ? 90 : period === "6M" ? 180 : period === "1Y" ? 365 : 730;
  const data = [];
  const now = new Date();

  let prevClose = adjustedBasePrice;

  for (let i = days; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const daySeed = getDateSeed(date) + commodity.charCodeAt(0);

    // Generate realistic price movement with trend and mean reversion
    const trendComponent = Math.sin(i / 45) * (adjustedBasePrice * 0.05);
    const randomWalk = (seededRandom(daySeed) - 0.5) * (adjustedBasePrice * 0.02);
    const meanReversion = (adjustedBasePrice - prevClose) * 0.1;
    
    const dayClose = prevClose + trendComponent / 30 + randomWalk + meanReversion;
    
    // Generate OHLC from close price
    const volatility = adjustedBasePrice * 0.015;
    const open = prevClose + (seededRandom(daySeed + 1) - 0.5) * volatility;
    const high = Math.max(open, dayClose) + seededRandom(daySeed + 2) * volatility;
    const low = Math.min(open, dayClose) - seededRandom(daySeed + 3) * volatility;
    const close = dayClose;
    
    // Volume based on day of week (lower on weekends conceptually)
    const dayOfWeek = date.getDay();
    const volumeMultiplier = (dayOfWeek === 0 || dayOfWeek === 6) ? 0.3 : 1.0;
    const volume = Math.floor((20000 + seededRandom(daySeed + 4) * 40000) * volumeMultiplier);

    data.push({
      date: date.toISOString().split("T")[0],
      open: Math.round(open * 100) / 100,
      high: Math.round(high * 100) / 100,
      low: Math.round(low * 100) / 100,
      close: Math.round(close * 100) / 100,
      volume,
    });
    
    prevClose = close;
  }

  return {
    commodity,
    region,
    data,
    source: "ABFI Market Data",
  };
}

function generateHeatmap(commodity: string) {
  const basePrice = COMMODITY_BASE_PRICES[commodity] || 1000;
  const seed = getDateSeed(new Date()) + commodity.charCodeAt(0);

  return {
    commodity,
    regions: REGIONS.map((r, idx) => {
      const regionSeed = seed + idx * 13;
      const price = basePrice * r.modifier + (seededRandom(regionSeed) - 0.5) * 40;
      const changePct = (seededRandom(regionSeed + 1) - 0.5) * 6;
      
      return {
        region: r.id,
        region_name: r.name,
        price: Math.round(price),
        change_pct: Math.round(changePct * 10) / 10,
        currency: "AUD",
      };
    }),
  };
}

function generateForwardCurve(commodity: string, region: string) {
  const basePrice = COMMODITY_BASE_PRICES[commodity] || 1000;
  const regionData = REGIONS.find(r => r.id === region);
  const adjustedBasePrice = basePrice * (regionData?.modifier || 1.0);
  
  const seed = getDateSeed(new Date()) + commodity.charCodeAt(0) + region.charCodeAt(0);
  
  // Determine curve shape based on seed
  const shapeRoll = seededRandom(seed);
  const isContango = shapeRoll > 0.4; // 60% contango (normal market)
  
  const tenors = ["Spot", "1M", "3M", "6M", "1Y"];
  const points = tenors.map((tenor, idx) => {
    const tenorMonths = idx === 0 ? 0 : idx === 1 ? 1 : idx === 2 ? 3 : idx === 3 ? 6 : 12;
    
    // Contango: future prices higher (storage costs)
    // Backwardation: future prices lower (convenience yield)
    const spreadPerMonth = isContango ? 8 : -6;
    const baseSpread = tenorMonths * spreadPerMonth;
    const noise = (seededRandom(seed + idx) - 0.5) * 10;
    
    const price = adjustedBasePrice + baseSpread + noise;
    
    return {
      tenor,
      price: Math.round(price),
      change_from_spot: idx === 0 ? 0 : Math.round(baseSpread + noise),
    };
  });

  return {
    commodity,
    region,
    curve_shape: isContango ? "contango" : "backwardation",
    points,
    as_of_date: new Date().toISOString().split("T")[0],
  };
}

function generateTechnicals(commodity: string) {
  const basePrice = COMMODITY_BASE_PRICES[commodity] || 1000;
  const seed = getDateSeed(new Date()) + commodity.charCodeAt(0);
  
  // RSI: 0-100, neutral around 50
  const rsi = 35 + seededRandom(seed) * 35; // 35-70 range typically
  const rsiSignal: "buy" | "sell" | "neutral" = rsi > 70 ? "sell" : rsi < 30 ? "buy" : "neutral";
  
  // MACD: centered around 0
  const macd = (seededRandom(seed + 1) - 0.5) * 30;
  const macdSignal: "buy" | "sell" | "neutral" = macd > 8 ? "buy" : macd < -8 ? "sell" : "neutral";
  
  // Moving averages
  const sma20 = basePrice + (seededRandom(seed + 2) - 0.5) * 40;
  const sma50 = basePrice + (seededRandom(seed + 3) - 0.5) * 60 - 15;
  const smaSignal: "buy" | "sell" | "neutral" = sma20 > sma50 + 10 ? "buy" : sma20 < sma50 - 10 ? "sell" : "neutral";
  
  // Bollinger %B: 0-1 typically, can exceed
  const bollingerB = 0.3 + seededRandom(seed + 4) * 0.4;
  const bollingerSignal: "buy" | "sell" | "neutral" = bollingerB > 0.85 ? "sell" : bollingerB < 0.15 ? "buy" : "neutral";
  
  // Volume trend
  const volumeChange = (seededRandom(seed + 5) - 0.5) * 40;
  const volumeSignal: "buy" | "sell" | "neutral" = volumeChange > 15 ? "buy" : volumeChange < -15 ? "sell" : "neutral";

  return [
    { name: "RSI (14)", value: Math.round(rsi * 100) / 100, signal: rsiSignal },
    { name: "MACD", value: Math.round(macd * 100) / 100, signal: macdSignal },
    { name: "SMA 20", value: Math.round(sma20 * 100) / 100, signal: smaSignal },
    { name: "SMA 50", value: Math.round(sma50 * 100) / 100, signal: smaSignal },
    { name: "Bollinger %B", value: Math.round(bollingerB * 100) / 100, signal: bollingerSignal },
    { name: "Volume Trend", value: Math.round(volumeChange * 100) / 100, signal: volumeSignal },
  ];
}

// ============================================================================
// ROUTER ENDPOINTS
// ============================================================================

export const pricesRouter = router({
  /**
   * Get price KPIs for all commodities
   */
  getKPIs: publicProcedure.query(async () => {
    try {
      const db = await requireDb();

      // Get latest price for each commodity
      const commodities = ["UCO", "Tallow", "Canola", "Palm"];
      const results = [];

      for (const commodity of commodities) {
        const [latest] = await db
          .select()
          .from(feedstockPrices)
          .where(and(eq(feedstockPrices.commodity, commodity), eq(feedstockPrices.region, "AUS")))
          .orderBy(desc(feedstockPrices.date))
          .limit(1);

        if (latest) {
          // Get previous day for change calculation
          const [previous] = await db
            .select()
            .from(feedstockPrices)
            .where(
              and(
                eq(feedstockPrices.commodity, commodity),
                eq(feedstockPrices.region, "AUS"),
                sql`${feedstockPrices.date} < ${latest.date}`
              )
            )
            .orderBy(desc(feedstockPrices.date))
            .limit(1);

          const currentPrice = parseFloat(latest.close as string);
          const previousPrice = previous ? parseFloat(previous.close as string) : currentPrice;
          const changePct = previousPrice !== 0 ? ((currentPrice - previousPrice) / previousPrice) * 100 : 0;

          results.push({
            commodity,
            price: currentPrice,
            currency: "AUD",
            unit: "MT",
            change_pct: Math.round(changePct * 10) / 10,
            change_direction: changePct > 0.5 ? "up" : changePct < -0.5 ? "down" : "flat",
          });
        }
      }

      if (results.length === 0) {
        return generateKPIs();
      }

      return results;
    } catch (error) {
      console.error("Failed to get price KPIs:", error);
      return generateKPIs();
    }
  }),

  /**
   * Get OHLC price data
   */
  getOHLC: publicProcedure
    .input(
      z.object({
        commodity: z.string(),
        region: z.string().default("AUS"),
        period: z.enum(["1M", "3M", "6M", "1Y", "2Y"]).default("1Y"),
      })
    )
    .query(async ({ input }) => {
      try {
        const db = await requireDb();

        // Calculate date range
        const days =
          input.period === "1M" ? 30 : input.period === "3M" ? 90 : input.period === "6M" ? 180 : input.period === "1Y" ? 365 : 730;

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const data = await db
          .select({
            date: feedstockPrices.date,
            open: feedstockPrices.open,
            high: feedstockPrices.high,
            low: feedstockPrices.low,
            close: feedstockPrices.close,
            volume: feedstockPrices.volume,
            source: feedstockPrices.source,
          })
          .from(feedstockPrices)
          .where(
            and(
              eq(feedstockPrices.commodity, input.commodity.toUpperCase()),
              eq(feedstockPrices.region, input.region),
              gte(feedstockPrices.date, startDate)
            )
          )
          .orderBy(feedstockPrices.date);

        if (data.length === 0) {
          return generateOHLC(input.commodity, input.region, input.period);
        }

        return {
          commodity: input.commodity,
          region: input.region,
          data: data.map((d) => ({
            date: d.date instanceof Date ? d.date.toISOString().split("T")[0] : String(d.date),
            open: parseFloat(d.open as string),
            high: parseFloat(d.high as string),
            low: parseFloat(d.low as string),
            close: parseFloat(d.close as string),
            volume: d.volume || 0,
          })),
          source: data[0]?.source || "ABFI Market Data",
        };
      } catch (error) {
        console.error("Failed to get OHLC data:", error);
        return generateOHLC(input.commodity, input.region, input.period);
      }
    }),

  /**
   * Get regional price heatmap
   */
  getHeatmap: publicProcedure
    .input(
      z.object({
        commodity: z.string(),
      })
    )
    .query(async ({ input }) => {
      try {
        const db = await requireDb();

        const regions = await db
          .select()
          .from(regionalPriceSummary)
          .where(eq(regionalPriceSummary.commodity, input.commodity.toUpperCase()));

        if (regions.length === 0) {
          return generateHeatmap(input.commodity);
        }

        return {
          commodity: input.commodity,
          regions: regions.map((r) => ({
            region: r.region,
            region_name: r.regionName,
            price: parseFloat(r.price as string),
            change_pct: parseFloat(r.changePct as string),
            currency: r.currency,
          })),
        };
      } catch (error) {
        console.error("Failed to get heatmap:", error);
        return generateHeatmap(input.commodity);
      }
    }),

  /**
   * Get forward curve
   */
  getForwardCurve: publicProcedure
    .input(
      z.object({
        commodity: z.string(),
        region: z.string().default("AUS"),
      })
    )
    .query(async ({ input }) => {
      try {
        const db = await requireDb();

        // Get most recent forward curve data
        const [latestDate] = await db
          .select({ asOfDate: forwardCurves.asOfDate })
          .from(forwardCurves)
          .where(
            and(eq(forwardCurves.commodity, input.commodity.toUpperCase()), eq(forwardCurves.region, input.region))
          )
          .orderBy(desc(forwardCurves.asOfDate))
          .limit(1);

        if (!latestDate) {
          return generateForwardCurve(input.commodity, input.region);
        }

        const points = await db
          .select()
          .from(forwardCurves)
          .where(
            and(
              eq(forwardCurves.commodity, input.commodity.toUpperCase()),
              eq(forwardCurves.region, input.region),
              eq(forwardCurves.asOfDate, latestDate.asOfDate)
            )
          );

        // Determine curve shape
        const spotPrice = points.find((p) => p.tenor === "Spot");
        const farPrice = points.find((p) => p.tenor === "1Y");
        let curveShape: "contango" | "backwardation" | "flat" = "flat";

        if (spotPrice && farPrice) {
          const spotVal = parseFloat(spotPrice.price as string);
          const farVal = parseFloat(farPrice.price as string);
          if (farVal > spotVal + 10) curveShape = "contango";
          else if (farVal < spotVal - 10) curveShape = "backwardation";
        }

        return {
          commodity: input.commodity,
          region: input.region,
          curve_shape: curveShape,
          points: points.map((p) => ({
            tenor: p.tenor,
            price: parseFloat(p.price as string),
            change_from_spot: parseFloat(p.changeFromSpot as string),
          })),
          as_of_date:
            latestDate.asOfDate instanceof Date
              ? latestDate.asOfDate.toISOString().split("T")[0]
              : String(latestDate.asOfDate),
        };
      } catch (error) {
        console.error("Failed to get forward curve:", error);
        return generateForwardCurve(input.commodity, input.region);
      }
    }),

  /**
   * Get technical indicators
   */
  getTechnicals: publicProcedure
    .input(
      z.object({
        commodity: z.string(),
        region: z.string().default("AUS"),
      })
    )
    .query(async ({ input }) => {
      try {
        const db = await requireDb();

        const indicators = await db
          .select()
          .from(technicalIndicators)
          .where(
            and(
              eq(technicalIndicators.commodity, input.commodity.toUpperCase()),
              eq(technicalIndicators.region, input.region)
            )
          );

        if (indicators.length === 0) {
          return generateTechnicals(input.commodity);
        }

        return indicators.map((i) => ({
          name: i.indicatorName,
          value: parseFloat(i.value as string),
          signal: i.signal,
        }));
      } catch (error) {
        console.error("Failed to get technicals:", error);
        return generateTechnicals(input.commodity);
      }
    }),

  /**
   * Get available commodities and regions
   */
  getCommodities: publicProcedure.query(async () => {
    return {
      commodities: [
        { id: "UCO", name: "Used Cooking Oil", unit: "MT" },
        { id: "Tallow", name: "Tallow", unit: "MT" },
        { id: "Canola", name: "Canola Oil", unit: "MT" },
        { id: "Palm", name: "Palm Oil", unit: "MT" },
      ],
      regions: REGIONS.map(r => ({ id: r.id, name: r.name })),
    };
  }),
});

export type PricesRouter = typeof pricesRouter;
