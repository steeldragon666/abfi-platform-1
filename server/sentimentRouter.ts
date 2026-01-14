/**
 * Lending Sentiment Router
 * API endpoints for the AI-powered sentiment analysis
 * 
 * Provides real-time and historical sentiment data for:
 * - Overall market sentiment index
 * - Lender-specific sentiment scores
 * - Document-based sentiment analysis
 * - Fear/risk component breakdown
 */

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, publicProcedure, protectedProcedure } from "./_core/trpc";
import { getDb } from "./db";
import {
  sentimentDocuments,
  sentimentDailyIndex,
  lenderSentimentScores,
} from "../drizzle/schema";
import { eq, desc, gte, lte, sql, and } from "drizzle-orm";

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

// Helper for admin-only procedures
const adminProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Admin access required",
    });
  }
  return next({ ctx });
});

// ============================================================================
// DETERMINISTIC DATA GENERATION (consistent values based on date/time)
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

/**
 * Generate current sentiment index based on date
 */
function generateSentimentIndex() {
  const now = new Date();
  const seed = getDateSeed(now);
  
  // Base values with deterministic variation
  const baseIndex = 35;
  const variation = seededRandom(seed) * 20 - 10; // -10 to +10
  const overallIndex = Math.round((baseIndex + variation) * 10) / 10;
  
  // Calculate counts based on overall sentiment
  const totalDocs = 80 + Math.floor(seededRandom(seed + 1) * 40);
  const bullishRatio = 0.4 + seededRandom(seed + 2) * 0.3;
  const bearishRatio = 0.15 + seededRandom(seed + 3) * 0.15;
  
  const bullishCount = Math.round(totalDocs * bullishRatio);
  const bearishCount = Math.round(totalDocs * bearishRatio);
  const neutralCount = totalDocs - bullishCount - bearishCount;
  
  // Fear components (consistent based on day)
  const fearComponents = {
    regulatory_risk: Math.round(35 + seededRandom(seed + 10) * 30),
    technology_risk: Math.round(20 + seededRandom(seed + 11) * 20),
    feedstock_risk: Math.round(30 + seededRandom(seed + 12) * 25),
    counterparty_risk: Math.round(15 + seededRandom(seed + 13) * 20),
    market_risk: Math.round(40 + seededRandom(seed + 14) * 30),
    esg_concerns: Math.round(20 + seededRandom(seed + 15) * 25),
  };
  
  // Calculate changes
  const yesterdaySeed = getDateSeed(new Date(now.getTime() - 24 * 60 * 60 * 1000));
  const weekAgoSeed = getDateSeed(new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000));
  const monthAgoSeed = getDateSeed(new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000));
  
  const yesterdayIndex = 35 + seededRandom(yesterdaySeed) * 20 - 10;
  const weekAgoIndex = 35 + seededRandom(weekAgoSeed) * 20 - 10;
  const monthAgoIndex = 35 + seededRandom(monthAgoSeed) * 20 - 10;
  
  return {
    date: now.toISOString().split("T")[0],
    overall_index: overallIndex,
    bullish_count: bullishCount,
    bearish_count: bearishCount,
    neutral_count: neutralCount,
    documents_analyzed: totalDocs,
    fear_components: fearComponents,
    daily_change: Math.round((overallIndex - yesterdayIndex) * 10) / 10,
    weekly_change: Math.round((overallIndex - weekAgoIndex) * 10) / 10,
    monthly_change: Math.round((overallIndex - monthAgoIndex) * 10) / 10,
  };
}

/**
 * Generate sentiment trend for a period
 */
function generateTrend(period: string) {
  const months = period === "1m" ? 1 : period === "3m" ? 3 : period === "6m" ? 6 : period === "12m" ? 12 : 24;
  const days = months * 30;
  const trend = [];
  const now = new Date();

  for (let i = days; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const seed = getDateSeed(date);

    // Generate consistent values for each day
    const baseValue = 30 + Math.sin(i / 15) * 15;
    const variation = seededRandom(seed) * 10 - 5;
    const bullish = Math.max(0, Math.round(baseValue + variation));
    const bearish = Math.max(0, Math.round(25 - baseValue / 3 + seededRandom(seed + 1) * 8));

    trend.push({
      date: date.toISOString().split("T")[0],
      bullish,
      bearish,
      net_sentiment: bullish - bearish,
    });
  }

  return trend;
}

/**
 * Generate lender sentiment data
 */
function generateLenders() {
  const now = new Date();
  const seed = getDateSeed(now);
  
  const lenders = [
    { name: "NAB", baseSentiment: 45, baseDocuments: 35 },
    { name: "CBA", baseSentiment: 42, baseDocuments: 42 },
    { name: "Westpac", baseSentiment: 38, baseDocuments: 28 },
    { name: "ANZ", baseSentiment: 35, baseDocuments: 32 },
    { name: "Macquarie", baseSentiment: 58, baseDocuments: 45 },
    { name: "CEFC", baseSentiment: 72, baseDocuments: 55 },
    { name: "Export Finance Australia", baseSentiment: 52, baseDocuments: 22 },
    { name: "Bank of Queensland", baseSentiment: 28, baseDocuments: 15 },
  ];

  return lenders.map((l, idx) => {
    const lenderSeed = seed + idx * 100;
    const sentiment = Math.round(l.baseSentiment + seededRandom(lenderSeed) * 15 - 7);
    const documents = Math.round(l.baseDocuments + seededRandom(lenderSeed + 1) * 10);
    
    // Generate trend based on previous days
    const trend = [];
    for (let i = 9; i >= 0; i--) {
      const trendDate = new Date(now);
      trendDate.setDate(trendDate.getDate() - i * 3);
      const trendSeed = getDateSeed(trendDate) + idx * 100;
      trend.push(Math.round(l.baseSentiment + seededRandom(trendSeed) * 20 - 10));
    }
    
    // Calculate 30-day change
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const oldSeed = getDateSeed(thirtyDaysAgo) + idx * 100;
    const oldSentiment = l.baseSentiment + seededRandom(oldSeed) * 15 - 7;
    
    return {
      lender: l.name,
      sentiment,
      change_30d: Math.round((sentiment - oldSentiment) * 10) / 10,
      documents,
      trend,
    };
  });
}

/**
 * Generate document feed
 */
function generateDocuments(count: number = 15) {
  const now = new Date();
  const seed = getDateSeed(now);
  
  const sources = ["RBA", "APRA", "AFR", "Bloomberg", "Bank Earnings", "Industry Report", "S&P Global", "Reuters"];
  
  const titles = {
    BULLISH: [
      "CEFC announces $500M green lending facility for bioenergy projects",
      "NAB expands sustainable finance portfolio with biofuel focus",
      "Australian biofuel demand set to surge under new mandates",
      "Green hydrogen project secures major bank financing",
      "Renewable diesel plant receives $200M project finance",
      "Major banks signal increased appetite for clean energy deals",
      "ARENA awards funding for regional bioenergy hubs",
      "Corporate PPA demand drives renewable project financing",
    ],
    BEARISH: [
      "Rising interest rates squeeze bioenergy project margins",
      "Feedstock supply concerns cloud biofuel outlook",
      "Regulatory uncertainty delays sustainable aviation fuel projects",
      "Banks tighten lending criteria for renewable fuel ventures",
      "Technology risk concerns limit project finance appetite",
      "Supply chain disruptions impact bioenergy developments",
      "Project delays raise concerns over delivery timelines",
      "Cost pressures intensify in renewable fuel sector",
    ],
    NEUTRAL: [
      "RBA holds rates steady, monitors green transition impacts",
      "APRA reviews climate risk disclosure requirements",
      "Industry consultation on biofuel sustainability criteria",
      "Market awaits clarity on federal renewable fuel policy",
      "Banks assess bioenergy project pipeline for 2026",
      "Quarterly review of sustainable finance volumes",
      "ESG reporting requirements under review",
      "Industry stakeholders discuss financing frameworks",
    ],
  };

  const docs = [];

  for (let i = 0; i < count; i++) {
    const docSeed = seed + i * 7;
    
    // Deterministic sentiment selection (60% bullish, 25% neutral, 15% bearish)
    const sentimentRoll = Math.floor(seededRandom(docSeed) * 100);
    const sentiment: "BULLISH" | "BEARISH" | "NEUTRAL" = 
      sentimentRoll < 55 ? "BULLISH" : 
      sentimentRoll < 80 ? "NEUTRAL" : "BEARISH";
    
    const source = sources[Math.floor(seededRandom(docSeed + 1) * sources.length)];
    const titleList = titles[sentiment];
    const title = titleList[Math.floor(seededRandom(docSeed + 2) * titleList.length)];
    
    // Spread documents over last 30 days
    const daysAgo = Math.floor(seededRandom(docSeed + 3) * 30);
    const publishedDate = new Date(now);
    publishedDate.setDate(publishedDate.getDate() - daysAgo);
    publishedDate.setHours(Math.floor(seededRandom(docSeed + 4) * 12) + 8);

    const sentimentScore = 
      sentiment === "BULLISH" ? 40 + seededRandom(docSeed + 5) * 50 :
      sentiment === "BEARISH" ? -40 - seededRandom(docSeed + 5) * 50 :
      seededRandom(docSeed + 5) * 30 - 15;

    docs.push({
      id: `doc-${i + 1}-${seed}`,
      title,
      source,
      published_date: publishedDate.toISOString(),
      sentiment,
      sentiment_score: Math.round(sentimentScore * 10) / 10,
      url: `https://news.example.com/bioenergy/${now.getFullYear()}/${now.getMonth() + 1}/${i + 1}`,
    });
  }

  // Sort by date descending
  docs.sort((a, b) => new Date(b.published_date).getTime() - new Date(a.published_date).getTime());

  return docs;
}

/**
 * Generate fear component history
 */
function generateFearHistory(lookbackDays: number) {
  const now = new Date();
  
  const result: Record<string, { date: string; value: number }[]> = {
    regulatory_risk: [],
    technology_risk: [],
    feedstock_risk: [],
    counterparty_risk: [],
    market_risk: [],
    esg_concerns: [],
  };

  for (let i = lookbackDays; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split("T")[0];
    const seed = getDateSeed(date);
    
    // Generate each component with some persistence
    const baseTrend = Math.sin(i / 20) * 10;
    
    result.regulatory_risk.push({ 
      date: dateStr, 
      value: Math.round(40 + baseTrend + seededRandom(seed + 10) * 15) 
    });
    result.technology_risk.push({ 
      date: dateStr, 
      value: Math.round(22 + baseTrend * 0.5 + seededRandom(seed + 11) * 10) 
    });
    result.feedstock_risk.push({ 
      date: dateStr, 
      value: Math.round(35 + baseTrend * 0.8 + seededRandom(seed + 12) * 12) 
    });
    result.counterparty_risk.push({ 
      date: dateStr, 
      value: Math.round(18 + baseTrend * 0.3 + seededRandom(seed + 13) * 8) 
    });
    result.market_risk.push({ 
      date: dateStr, 
      value: Math.round(48 + baseTrend * 1.2 + seededRandom(seed + 14) * 15) 
    });
    result.esg_concerns.push({ 
      date: dateStr, 
      value: Math.round(25 + baseTrend * 0.6 + seededRandom(seed + 15) * 10) 
    });
  }

  return result;
}

// ============================================================================
// ROUTER ENDPOINTS
// ============================================================================

export const sentimentRouter = router({
  /**
   * Get current sentiment index
   */
  getIndex: publicProcedure.query(async () => {
    try {
      const db = await requireDb();

      // Try to get from database first
      const [latestIndex] = await db
        .select()
        .from(sentimentDailyIndex)
        .orderBy(desc(sentimentDailyIndex.date))
        .limit(1);

      if (!latestIndex) {
        // Use generated data if no database data
        return generateSentimentIndex();
      }

      // Get previous day for daily change
      const [previousDay] = await db
        .select()
        .from(sentimentDailyIndex)
        .where(sql`${sentimentDailyIndex.date} < ${latestIndex.date}`)
        .orderBy(desc(sentimentDailyIndex.date))
        .limit(1);

      // Get week ago for weekly change
      const weekAgo = new Date(latestIndex.date);
      weekAgo.setDate(weekAgo.getDate() - 7);
      const [weekAgoIndex] = await db
        .select()
        .from(sentimentDailyIndex)
        .where(sql`${sentimentDailyIndex.date} <= ${weekAgo.toISOString().split("T")[0]}`)
        .orderBy(desc(sentimentDailyIndex.date))
        .limit(1);

      const currentIndex = parseFloat(latestIndex.overallIndex as string);
      const previousIndex = previousDay ? parseFloat(previousDay.overallIndex as string) : currentIndex;
      const weekAgoValue = weekAgoIndex ? parseFloat(weekAgoIndex.overallIndex as string) : currentIndex;

      return {
        date: latestIndex.date,
        overall_index: currentIndex,
        bullish_count: latestIndex.bullishCount,
        bearish_count: latestIndex.bearishCount,
        neutral_count: latestIndex.neutralCount,
        documents_analyzed: latestIndex.documentsAnalyzed,
        fear_components: {
          regulatory_risk: parseFloat(latestIndex.regulatoryRisk as string || "0"),
          technology_risk: parseFloat(latestIndex.technologyRisk as string || "0"),
          feedstock_risk: parseFloat(latestIndex.feedstockRisk as string || "0"),
          counterparty_risk: parseFloat(latestIndex.counterpartyRisk as string || "0"),
          market_risk: parseFloat(latestIndex.marketRisk as string || "0"),
          esg_concerns: parseFloat(latestIndex.esgConcerns as string || "0"),
        },
        daily_change: previousIndex !== 0 ?
          ((currentIndex - previousIndex) / Math.abs(previousIndex)) * 100 : 0,
        weekly_change: weekAgoValue !== 0 ?
          ((currentIndex - weekAgoValue) / Math.abs(weekAgoValue)) * 100 : 0,
      };
    } catch (error) {
      console.error("Failed to get sentiment index:", error);
      return generateSentimentIndex();
    }
  }),

  /**
   * Get sentiment trend over time
   */
  getTrend: publicProcedure
    .input(z.object({
      period: z.enum(["1m", "3m", "6m", "12m", "24m"]).default("12m"),
    }))
    .query(async ({ input }) => {
      try {
        const db = await requireDb();

        // Calculate date range
        const months = input.period === "1m" ? 1 :
                       input.period === "3m" ? 3 :
                       input.period === "6m" ? 6 :
                       input.period === "12m" ? 12 : 24;

        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - months);

        const trends = await db
          .select({
            date: sentimentDailyIndex.date,
            bullish: sentimentDailyIndex.bullishCount,
            bearish: sentimentDailyIndex.bearishCount,
            overallIndex: sentimentDailyIndex.overallIndex,
          })
          .from(sentimentDailyIndex)
          .where(gte(sentimentDailyIndex.date, startDate))
          .orderBy(sentimentDailyIndex.date);

        if (trends.length === 0) {
          return generateTrend(input.period);
        }

        return trends.map((t) => ({
          date: t.date,
          bullish: t.bullish,
          bearish: t.bearish,
          net_sentiment: parseFloat(t.overallIndex as string),
        }));
      } catch (error) {
        console.error("Failed to get sentiment trend:", error);
        return generateTrend(input.period);
      }
    }),

  /**
   * Get lender sentiment scores
   */
  getLenders: publicProcedure
    .input(z.object({
      limit: z.number().min(1).max(20).default(8),
    }))
    .query(async ({ input }) => {
      try {
        const db = await requireDb();

        // Get unique lenders with their latest scores
        const lenders = await db
          .select({
            lender: lenderSentimentScores.lender,
            sentimentScore: lenderSentimentScores.sentimentScore,
            documentCount: lenderSentimentScores.documentCount,
            date: lenderSentimentScores.date,
          })
          .from(lenderSentimentScores)
          .orderBy(desc(lenderSentimentScores.date))
          .limit(input.limit * 10);

        if (lenders.length === 0) {
          return generateLenders().slice(0, input.limit);
        }

        // Group by lender and get latest for each
        const lenderMap = new Map<string, typeof lenders[0]>();
        for (const l of lenders) {
          if (!lenderMap.has(l.lender)) {
            lenderMap.set(l.lender, l);
          }
        }

        // Get trend data for each lender
        const results = await Promise.all(
          Array.from(lenderMap.values()).slice(0, input.limit).map(async (l) => {
            const trendData = await db
              .select({ score: lenderSentimentScores.sentimentScore })
              .from(lenderSentimentScores)
              .where(eq(lenderSentimentScores.lender, l.lender))
              .orderBy(desc(lenderSentimentScores.date))
              .limit(10);

            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            const [oldScore] = await db
              .select({ score: lenderSentimentScores.sentimentScore })
              .from(lenderSentimentScores)
              .where(and(
                eq(lenderSentimentScores.lender, l.lender),
                lte(lenderSentimentScores.date, thirtyDaysAgo)
              ))
              .orderBy(desc(lenderSentimentScores.date))
              .limit(1);

            const currentScore = parseFloat(l.sentimentScore as string);
            const oldScoreValue = oldScore ? parseFloat(oldScore.score as string) : currentScore;

            return {
              lender: l.lender,
              sentiment: currentScore,
              change_30d: Math.round((currentScore - oldScoreValue) * 10) / 10,
              documents: l.documentCount,
              trend: trendData.reverse().map((t) => parseFloat(t.score as string)),
            };
          })
        );

        return results;
      } catch (error) {
        console.error("Failed to get lender scores:", error);
        return generateLenders().slice(0, input.limit);
      }
    }),

  /**
   * Get document feed
   */
  getDocumentFeed: publicProcedure
    .input(z.object({
      limit: z.number().min(1).max(50).default(15),
      sentiment: z.enum(["BULLISH", "BEARISH", "NEUTRAL"]).optional(),
    }))
    .query(async ({ input }) => {
      try {
        const db = await requireDb();

        const conditions = [];
        if (input.sentiment) {
          conditions.push(eq(sentimentDocuments.sentiment, input.sentiment));
        }

        const docs = await db
          .select({
            id: sentimentDocuments.id,
            title: sentimentDocuments.title,
            source: sentimentDocuments.source,
            publishedDate: sentimentDocuments.publishedDate,
            sentiment: sentimentDocuments.sentiment,
            sentimentScore: sentimentDocuments.sentimentScore,
            url: sentimentDocuments.url,
          })
          .from(sentimentDocuments)
          .where(conditions.length > 0 ? and(...conditions) : undefined)
          .orderBy(desc(sentimentDocuments.publishedDate))
          .limit(input.limit);

        if (docs.length === 0) {
          const generated = generateDocuments(input.limit);
          if (input.sentiment) {
            return generated.filter(d => d.sentiment === input.sentiment);
          }
          return generated;
        }

        return docs.map((d) => ({
          id: String(d.id),
          title: d.title,
          source: d.source,
          published_date: d.publishedDate.toISOString(),
          sentiment: d.sentiment,
          sentiment_score: parseFloat(d.sentimentScore as string),
          url: d.url,
        }));
      } catch (error) {
        console.error("Failed to get document feed:", error);
        return generateDocuments(input.limit);
      }
    }),

  /**
   * Get fear component history
   */
  getFearComponentHistory: publicProcedure
    .input(z.object({
      lookbackDays: z.number().min(7).max(365).default(90),
    }))
    .query(async ({ input }) => {
      try {
        const db = await requireDb();

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - input.lookbackDays);

        const data = await db
          .select({
            date: sentimentDailyIndex.date,
            regulatoryRisk: sentimentDailyIndex.regulatoryRisk,
            technologyRisk: sentimentDailyIndex.technologyRisk,
            feedstockRisk: sentimentDailyIndex.feedstockRisk,
            counterpartyRisk: sentimentDailyIndex.counterpartyRisk,
            marketRisk: sentimentDailyIndex.marketRisk,
            esgConcerns: sentimentDailyIndex.esgConcerns,
          })
          .from(sentimentDailyIndex)
          .where(gte(sentimentDailyIndex.date, startDate))
          .orderBy(sentimentDailyIndex.date);

        if (data.length === 0) {
          return generateFearHistory(input.lookbackDays);
        }

        const result: Record<string, { date: string; value: number }[]> = {
          regulatory_risk: [],
          technology_risk: [],
          feedstock_risk: [],
          counterparty_risk: [],
          market_risk: [],
          esg_concerns: [],
        };

        for (const row of data) {
          const dateStr = row.date instanceof Date ? row.date.toISOString().split("T")[0] : String(row.date);
          result.regulatory_risk.push({ date: dateStr, value: parseFloat(row.regulatoryRisk as string || "0") });
          result.technology_risk.push({ date: dateStr, value: parseFloat(row.technologyRisk as string || "0") });
          result.feedstock_risk.push({ date: dateStr, value: parseFloat(row.feedstockRisk as string || "0") });
          result.counterparty_risk.push({ date: dateStr, value: parseFloat(row.counterpartyRisk as string || "0") });
          result.market_risk.push({ date: dateStr, value: parseFloat(row.marketRisk as string || "0") });
          result.esg_concerns.push({ date: dateStr, value: parseFloat(row.esgConcerns as string || "0") });
        }

        return result;
      } catch (error) {
        console.error("Failed to get fear component history:", error);
        return generateFearHistory(input.lookbackDays);
      }
    }),
});

export type SentimentRouter = typeof sentimentRouter;
