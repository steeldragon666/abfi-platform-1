/**
 * Market Intelligence API Router
 * Express endpoints for comprehensive market intelligence
 *
 * Endpoints:
 * - Dashboard & Overview
 * - News & Articles
 * - Carbon Markets
 * - Social Sentiment
 * - Executive Briefings
 */

import { Router, Request, Response } from "express";
import { z } from "zod";
import {
  newsIntelligence,
  globalCarbonMarkets,
  socialSentiment,
  marketIntelligenceHub,
} from "./services";

const router = Router();

// ============================================================================
// UNIFIED DASHBOARD
// ============================================================================

/**
 * GET /api/market-intelligence/dashboard
 * Get unified market intelligence dashboard
 */
router.get("/dashboard", async (req: Request, res: Response) => {
  try {
    const dashboard = await marketIntelligenceHub.getMarketDashboard();
    
    res.json({
      success: true,
      data: dashboard,
    });
  } catch (error) {
    console.error("[MarketIntel] Dashboard error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to generate market dashboard",
    });
  }
});

/**
 * GET /api/market-intelligence/briefing
 * Get executive briefing
 */
router.get("/briefing", async (req: Request, res: Response) => {
  try {
    const period = req.query.period === "weekly" ? "weekly" : "daily";
    const briefing = await marketIntelligenceHub.generateExecutiveBriefing(period);
    
    res.json({
      success: true,
      data: briefing,
    });
  } catch (error) {
    console.error("[MarketIntel] Briefing error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to generate executive briefing",
    });
  }
});

/**
 * GET /api/market-intelligence/signals
 * Get active market signals
 */
router.get("/signals", async (req: Request, res: Response) => {
  try {
    const signals = await marketIntelligenceHub.detectMarketSignals();
    
    res.json({
      success: true,
      data: {
        signals,
        count: signals.length,
        lastUpdated: new Date(),
      },
    });
  } catch (error) {
    console.error("[MarketIntel] Signals error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get market signals",
    });
  }
});

/**
 * GET /api/market-intelligence/search
 * Search across all intelligence sources
 */
router.get("/search", async (req: Request, res: Response) => {
  try {
    const query = z.string().min(2).parse(req.query.q);
    const sourcesParam = req.query.sources as string | undefined;
    const sources = sourcesParam?.split(",") as ("news" | "social" | "carbon")[] | undefined;
    const limit = Math.min(50, parseInt(req.query.limit as string) || 20);
    
    const results = await marketIntelligenceHub.searchIntelligence(query, {
      sources,
      limit,
    });
    
    res.json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error("[MarketIntel] Search error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to search intelligence",
    });
  }
});

// ============================================================================
// NEWS & ARTICLES
// ============================================================================

/**
 * GET /api/market-intelligence/news/feed
 * Get news feed
 */
router.get("/news/feed", async (req: Request, res: Response) => {
  try {
    const limit = Math.min(50, parseInt(req.query.limit as string) || 20);
    const category = req.query.category as string | undefined;
    const region = req.query.region as string | undefined;
    const sentiment = req.query.sentiment as "bullish" | "bearish" | "neutral" | undefined;
    const minRelevance = parseInt(req.query.minRelevance as string) || 0;
    
    const feed = await newsIntelligence.getNewsFeed({
      limit,
      category,
      region,
      sentiment,
      minRelevance,
    });
    
    res.json({
      success: true,
      data: feed,
    });
  } catch (error) {
    console.error("[MarketIntel] News feed error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get news feed",
    });
  }
});

/**
 * GET /api/market-intelligence/news/alerts
 * Get breaking news alerts
 */
router.get("/news/alerts", async (req: Request, res: Response) => {
  try {
    const acknowledgedParam = req.query.acknowledged as string | undefined;
    const acknowledgedIds = acknowledgedParam?.split(",") || [];
    
    const alerts = await newsIntelligence.getBreakingAlerts(acknowledgedIds);
    
    res.json({
      success: true,
      data: {
        alerts,
        count: alerts.length,
        unacknowledged: alerts.filter(a => !a.acknowledged).length,
      },
    });
  } catch (error) {
    console.error("[MarketIntel] Alerts error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get news alerts",
    });
  }
});

/**
 * GET /api/market-intelligence/news/search
 * Search news articles
 */
router.get("/news/search", async (req: Request, res: Response) => {
  try {
    const query = z.string().min(2).parse(req.query.q);
    const limit = Math.min(50, parseInt(req.query.limit as string) || 20);
    
    const articles = await newsIntelligence.searchNews(query, { limit });
    
    res.json({
      success: true,
      data: {
        articles,
        count: articles.length,
        query,
      },
    });
  } catch (error) {
    console.error("[MarketIntel] News search error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to search news",
    });
  }
});

// ============================================================================
// CARBON MARKETS
// ============================================================================

/**
 * GET /api/market-intelligence/carbon/dashboard
 * Get carbon market dashboard
 */
router.get("/carbon/dashboard", async (req: Request, res: Response) => {
  try {
    const dashboard = await globalCarbonMarkets.getCarbonMarketDashboard();
    
    res.json({
      success: true,
      data: dashboard,
    });
  } catch (error) {
    console.error("[MarketIntel] Carbon dashboard error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get carbon market dashboard",
    });
  }
});

/**
 * GET /api/market-intelligence/carbon/prices/:market
 * Get prices for a specific market
 */
router.get("/carbon/prices/:market", async (req: Request, res: Response) => {
  try {
    const market = req.params.market.toLowerCase();
    const prices = await globalCarbonMarkets.getMarketPrices(market);
    
    res.json({
      success: true,
      data: {
        market,
        prices,
        timestamp: new Date(),
      },
    });
  } catch (error) {
    console.error("[MarketIntel] Carbon prices error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get carbon market prices",
    });
  }
});

/**
 * GET /api/market-intelligence/carbon/history/:market/:instrument
 * Get historical prices
 */
router.get("/carbon/history/:market/:instrument", async (req: Request, res: Response) => {
  try {
    const market = req.params.market.toLowerCase();
    const instrument = req.params.instrument;
    const days = Math.min(365, parseInt(req.query.days as string) || 30);
    
    const history = await globalCarbonMarkets.getHistoricalPrices(market, instrument, days);
    
    res.json({
      success: true,
      data: {
        market,
        instrument,
        days,
        history,
      },
    });
  } catch (error) {
    console.error("[MarketIntel] Carbon history error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get carbon price history",
    });
  }
});

/**
 * GET /api/market-intelligence/carbon/arbitrage
 * Get arbitrage opportunities
 */
router.get("/carbon/arbitrage", async (req: Request, res: Response) => {
  try {
    const opportunities = await globalCarbonMarkets.detectArbitrageOpportunities();
    
    res.json({
      success: true,
      data: {
        opportunities,
        count: opportunities.length,
        lastUpdated: new Date(),
      },
    });
  } catch (error) {
    console.error("[MarketIntel] Arbitrage error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to detect arbitrage opportunities",
    });
  }
});

/**
 * GET /api/market-intelligence/carbon/correlations
 * Get market correlations
 */
router.get("/carbon/correlations", async (req: Request, res: Response) => {
  try {
    const period = (req.query.period || "30d") as "7d" | "30d" | "90d" | "1y";
    const correlations = await globalCarbonMarkets.calculateCorrelations(period);
    
    res.json({
      success: true,
      data: {
        period,
        correlations,
      },
    });
  } catch (error) {
    console.error("[MarketIntel] Correlations error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to calculate correlations",
    });
  }
});

// ============================================================================
// SOCIAL SENTIMENT
// ============================================================================

/**
 * GET /api/market-intelligence/social/feed
 * Get social media feed
 */
router.get("/social/feed", async (req: Request, res: Response) => {
  try {
    const limit = Math.min(50, parseInt(req.query.limit as string) || 20);
    const platform = req.query.platform as "twitter" | "linkedin" | "reddit" | undefined;
    const sentiment = req.query.sentiment as "positive" | "negative" | "neutral" | undefined;
    const hashtag = req.query.hashtag as string | undefined;
    const influencersOnly = req.query.influencersOnly === "true";
    
    const posts = await socialSentiment.getSocialFeed({
      limit,
      platform,
      sentiment,
      hashtag,
      influencersOnly,
    });
    
    res.json({
      success: true,
      data: {
        posts,
        count: posts.length,
      },
    });
  } catch (error) {
    console.error("[MarketIntel] Social feed error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get social feed",
    });
  }
});

/**
 * GET /api/market-intelligence/social/index
 * Get social sentiment index
 */
router.get("/social/index", async (req: Request, res: Response) => {
  try {
    const index = await socialSentiment.getSocialSentimentIndex();
    
    res.json({
      success: true,
      data: index,
    });
  } catch (error) {
    console.error("[MarketIntel] Social index error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get social sentiment index",
    });
  }
});

/**
 * GET /api/market-intelligence/social/trending
 * Get trending hashtags
 */
router.get("/social/trending", async (req: Request, res: Response) => {
  try {
    const limit = Math.min(20, parseInt(req.query.limit as string) || 10);
    const trending = await socialSentiment.getTrendingHashtags(limit);
    
    res.json({
      success: true,
      data: {
        trending,
        count: trending.length,
      },
    });
  } catch (error) {
    console.error("[MarketIntel] Trending error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get trending hashtags",
    });
  }
});

/**
 * GET /api/market-intelligence/social/influencers
 * Get top influencers
 */
router.get("/social/influencers", async (req: Request, res: Response) => {
  try {
    const limit = Math.min(20, parseInt(req.query.limit as string) || 10);
    const influencers = await socialSentiment.getTopInfluencers(limit);
    
    res.json({
      success: true,
      data: {
        influencers,
        count: influencers.length,
      },
    });
  } catch (error) {
    console.error("[MarketIntel] Influencers error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get top influencers",
    });
  }
});

/**
 * GET /api/market-intelligence/social/company/:name
 * Get company mention analysis
 */
router.get("/social/company/:name", async (req: Request, res: Response) => {
  try {
    const companyName = req.params.name;
    const days = Math.min(30, parseInt(req.query.days as string) || 7);
    
    const mentions = await socialSentiment.getCompanyMentions(companyName, days);
    
    res.json({
      success: true,
      data: mentions,
    });
  } catch (error) {
    console.error("[MarketIntel] Company mentions error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get company mentions",
    });
  }
});

export const marketIntelligenceRouter = router;
export default router;
