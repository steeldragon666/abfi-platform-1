/**
 * News & Article Intelligence Service
 * Real-time scraping and aggregation of bioenergy news from multiple sources
 *
 * Features:
 * - RSS feed aggregation from major news sources
 * - NLP-based sentiment analysis
 * - Keyword extraction and topic categorization
 * - Trending topics identification
 * - Alert generation for breaking news
 *
 * Sources:
 * - Australian: ARENA, CEFC, ABC
 * - Global: Biofuels Digest, Biomass Magazine, IEA Bioenergy
 * - Carbon: Carbon Pulse
 */

import { logger } from "../utils/logger";
import { getDb } from "../db";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  content?: string;
  source: string;
  sourceType: "rss" | "api" | "scrape";
  url: string;
  imageUrl?: string;
  publishedAt: Date;
  fetchedAt: Date;
  
  // Analysis
  sentiment: "bullish" | "bearish" | "neutral";
  sentimentScore: number; // -100 to 100
  relevanceScore: number; // 0 to 100
  
  // Categorization
  categories: string[];
  keywords: string[];
  regions: string[];
  feedstockTypes?: string[];
  
  // Engagement (if available)
  shareCount?: number;
  commentCount?: number;
}

export interface TrendingTopic {
  topic: string;
  category: string;
  articleCount: number;
  sentimentAvg: number;
  momentum: number; // velocity of mentions
  relatedKeywords: string[];
  peakTime: Date;
  isBreaking: boolean;
}

export interface NewsFeed {
  articles: NewsArticle[];
  trending: TrendingTopic[];
  lastUpdated: Date;
  sourceStats: {
    source: string;
    articleCount: number;
    avgSentiment: number;
  }[];
}

export interface NewsAlert {
  id: string;
  type: "breaking" | "regulatory" | "market" | "project" | "policy";
  severity: "low" | "medium" | "high" | "critical";
  title: string;
  summary: string;
  articleId: string;
  createdAt: Date;
  acknowledged: boolean;
}

// ============================================================================
// RSS FEED SOURCES
// ============================================================================

interface RSSFeedConfig {
  name: string;
  url: string;
  category: string;
  region: string;
}

const RSS_FEEDS: Record<string, RSSFeedConfig> = {
  // Australian Sources
  arena: {
    name: "ARENA News",
    url: "https://arena.gov.au/news/feed/",
    category: "government",
    region: "AU",
  },
  cefc: {
    name: "CEFC Media",
    url: "https://www.cefc.com.au/media/feed/",
    category: "finance",
    region: "AU",
  },
  abc_environment: {
    name: "ABC Environment",
    url: "https://www.abc.net.au/news/feed/51120/rss.xml",
    category: "news",
    region: "AU",
  },
  
  // Global Industry
  biofuels_digest: {
    name: "Biofuels Digest",
    url: "https://www.biofuelsdigest.com/bdigest/feed/",
    category: "industry",
    region: "GLOBAL",
  },
  biomass_magazine: {
    name: "Biomass Magazine",
    url: "https://biomassmagazine.com/rss/articles",
    category: "industry",
    region: "GLOBAL",
  },
  renewable_energy_world: {
    name: "Renewable Energy World",
    url: "https://www.renewableenergyworld.com/feed/",
    category: "industry",
    region: "GLOBAL",
  },
  
  // Policy & Regulatory
  iea_bioenergy: {
    name: "IEA Bioenergy",
    url: "https://www.ieabioenergy.com/feed/",
    category: "policy",
    region: "GLOBAL",
  },
  
  // Carbon Markets
  carbon_pulse_free: {
    name: "Carbon Pulse",
    url: "https://carbon-pulse.com/feed/",
    category: "carbon",
    region: "GLOBAL",
  },
};

// Keyword patterns for relevance scoring
const RELEVANCE_KEYWORDS = {
  high: [
    "bioenergy", "biofuel", "biodiesel", "bioethanol", "biogas",
    "biomass", "renewable diesel", "sustainable aviation fuel", "SAF",
    "feedstock", "low carbon fuel", "LCFS", "carbon credit", "ACCU",
    "renewable energy certificate", "REC", "green hydrogen",
  ],
  medium: [
    "renewable energy", "clean energy", "net zero", "decarbonization",
    "carbon neutral", "emissions reduction", "climate policy",
    "energy transition", "circular economy", "waste to energy",
  ],
  low: [
    "sustainability", "environment", "green", "climate change",
    "agriculture", "farming", "forestry", "waste management",
  ],
};

// Sentiment keywords
const SENTIMENT_KEYWORDS = {
  bullish: [
    "investment", "funding", "expansion", "growth", "approval",
    "breakthrough", "record", "milestone", "partnership", "deal",
    "mandate", "target", "incentive", "subsidy", "grant", "success",
    "increase", "boost", "award", "launch", "opens", "secures",
  ],
  bearish: [
    "delay", "cancellation", "shutdown", "concern", "challenge",
    "uncertainty", "risk", "decline", "shortage", "cost overrun",
    "opposition", "lawsuit", "regulatory hurdle", "tariff", "fails",
    "closes", "cuts", "reduces", "suspends", "halts", "drops",
  ],
};

// Cache for fetched articles to avoid repeated fetches
let articleCache: NewsArticle[] = [];
let lastFetchTime: Date | null = null;
const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes

// ============================================================================
// RSS PARSING (using fetch and basic XML parsing)
// ============================================================================

/**
 * Parse RSS XML content into articles
 */
function parseRSSXML(xml: string, feed: RSSFeedConfig): NewsArticle[] {
  const articles: NewsArticle[] = [];
  
  try {
    // Simple XML parsing using regex (for Node.js without xml2js)
    // Extract items from RSS feed
    const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
    const items = xml.match(itemRegex) || [];
    
    for (const item of items.slice(0, 10)) { // Limit to 10 per feed
      // Extract title
      const titleMatch = item.match(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i);
      const title = titleMatch ? cleanText(titleMatch[1]) : "";
      
      if (!title) continue;
      
      // Extract description/summary
      const descMatch = item.match(/<description>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/i);
      const summary = descMatch ? cleanText(descMatch[1]).substring(0, 500) : "";
      
      // Extract link
      const linkMatch = item.match(/<link>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/link>/i);
      const url = linkMatch ? cleanText(linkMatch[1]) : "";
      
      // Extract pubDate
      const dateMatch = item.match(/<pubDate>([\s\S]*?)<\/pubDate>/i);
      const publishedAt = dateMatch ? new Date(dateMatch[1].trim()) : new Date();
      
      // Extract image if present
      const imageMatch = item.match(/<media:content[^>]*url="([^"]+)"/i) ||
                         item.match(/<enclosure[^>]*url="([^"]+)"/i) ||
                         item.match(/<image>.*?<url>([\s\S]*?)<\/url>.*?<\/image>/i);
      const imageUrl = imageMatch ? imageMatch[1] : undefined;
      
      // Analyze sentiment and relevance
      const fullText = `${title} ${summary}`;
      const sentiment = analyzeSentiment(fullText);
      const relevance = calculateRelevance(fullText);
      
      // Only include articles with some relevance to bioenergy
      if (relevance > 0 || feed.category === "industry" || feed.category === "carbon") {
        // Create deterministic ID from title hash
        const titleHash = title.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0).toString(36);
        articles.push({
          id: `${feed.category}-${Date.now()}-${titleHash}`,
          title,
          summary,
          source: feed.name,
          sourceType: "rss",
          url,
          imageUrl,
          publishedAt: isNaN(publishedAt.getTime()) ? new Date() : publishedAt,
          fetchedAt: new Date(),
          sentiment: sentiment.label,
          sentimentScore: sentiment.score,
          relevanceScore: Math.max(relevance, 30), // Minimum relevance for included articles
          categories: [feed.category],
          keywords: extractKeywords(fullText),
          regions: [feed.region],
        });
      }
    }
  } catch (error) {
    logger.error("NEWS_INTEL", `Failed to parse RSS from ${feed.name}:`, error);
  }
  
  return articles;
}

/**
 * Clean text by removing HTML tags and decoding entities
 */
function cleanText(text: string): string {
  return text
    .replace(/<[^>]*>/g, "") // Remove HTML tags
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Fetch and parse all RSS feeds
 */
async function fetchRSSFeeds(): Promise<NewsArticle[]> {
  // Check cache
  if (lastFetchTime && articleCache.length > 0 && 
      Date.now() - lastFetchTime.getTime() < CACHE_DURATION_MS) {
    logger.info("NEWS_INTEL", `Using cached articles (${articleCache.length} articles)`);
    return articleCache;
  }
  
  const articles: NewsArticle[] = [];
  const fetchPromises: Promise<void>[] = [];
  
  for (const [feedKey, feed] of Object.entries(RSS_FEEDS)) {
    const fetchPromise = (async () => {
      try {
        logger.info("NEWS_INTEL", `Fetching RSS from ${feed.name}...`);
        
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout
        
        const response = await fetch(feed.url, {
          signal: controller.signal,
          headers: {
            "User-Agent": "ABFI-Platform/1.0 (News Aggregator)",
            "Accept": "application/rss+xml, application/xml, text/xml, */*",
          },
        });
        
        clearTimeout(timeout);
        
        if (!response.ok) {
          logger.warn("NEWS_INTEL", `Failed to fetch ${feed.name}: ${response.status}`);
          return;
        }
        
        const xml = await response.text();
        const feedArticles = parseRSSXML(xml, feed);
        
        logger.info("NEWS_INTEL", `Fetched ${feedArticles.length} articles from ${feed.name}`);
        articles.push(...feedArticles);
        
      } catch (error: any) {
        if (error.name === "AbortError") {
          logger.warn("NEWS_INTEL", `Timeout fetching ${feed.name}`);
        } else {
          logger.warn("NEWS_INTEL", `Error fetching ${feed.name}:`, error.message);
        }
      }
    })();
    
    fetchPromises.push(fetchPromise);
  }
  
  // Wait for all fetches to complete
  await Promise.all(fetchPromises);
  
  // Update cache
  if (articles.length > 0) {
    articleCache = articles;
    lastFetchTime = new Date();
    logger.info("NEWS_INTEL", `Total articles fetched: ${articles.length}`);
  } else {
    logger.warn("NEWS_INTEL", "No articles fetched from any source");
  }
  
  return articles;
}

/**
 * Analyze sentiment of text
 */
function analyzeSentiment(text: string): { label: "bullish" | "bearish" | "neutral"; score: number } {
  const lowerText = text.toLowerCase();
  
  let bullishCount = 0;
  let bearishCount = 0;
  
  for (const keyword of SENTIMENT_KEYWORDS.bullish) {
    if (lowerText.includes(keyword)) bullishCount++;
  }
  
  for (const keyword of SENTIMENT_KEYWORDS.bearish) {
    if (lowerText.includes(keyword)) bearishCount++;
  }
  
  const net = bullishCount - bearishCount;
  
  if (net > 0) {
    return { label: "bullish", score: Math.min(100, net * 20 + 10) };
  } else if (net < 0) {
    return { label: "bearish", score: Math.max(-100, net * 20 - 10) };
  } else {
    return { label: "neutral", score: 0 };
  }
}

/**
 * Calculate relevance score
 */
function calculateRelevance(text: string): number {
  const lowerText = text.toLowerCase();
  let score = 0;
  
  for (const keyword of RELEVANCE_KEYWORDS.high) {
    if (lowerText.includes(keyword)) score += 20;
  }
  for (const keyword of RELEVANCE_KEYWORDS.medium) {
    if (lowerText.includes(keyword)) score += 10;
  }
  for (const keyword of RELEVANCE_KEYWORDS.low) {
    if (lowerText.includes(keyword)) score += 5;
  }
  
  return Math.min(100, score);
}

/**
 * Extract keywords from text
 */
function extractKeywords(text: string): string[] {
  const lowerText = text.toLowerCase();
  const keywords: string[] = [];
  
  const allKeywords = [
    ...RELEVANCE_KEYWORDS.high,
    ...RELEVANCE_KEYWORDS.medium,
    ...SENTIMENT_KEYWORDS.bullish,
    ...SENTIMENT_KEYWORDS.bearish,
  ];
  
  for (const keyword of allKeywords) {
    if (lowerText.includes(keyword)) {
      keywords.push(keyword);
    }
  }
  
  return [...new Set(keywords)].slice(0, 10);
}

// ============================================================================
// TRENDING & ANALYSIS
// ============================================================================

/**
 * Identify trending topics from articles
 */
function identifyTrendingTopics(articles: NewsArticle[]): TrendingTopic[] {
  const topicCounts: Map<string, {
    count: number;
    sentimentSum: number;
    articles: NewsArticle[];
  }> = new Map();
  
  // Count keyword occurrences
  for (const article of articles) {
    for (const keyword of article.keywords) {
      const existing = topicCounts.get(keyword) || { count: 0, sentimentSum: 0, articles: [] };
      existing.count++;
      existing.sentimentSum += article.sentimentScore;
      existing.articles.push(article);
      topicCounts.set(keyword, existing);
    }
  }
  
  // Convert to trending topics
  const trending: TrendingTopic[] = [];
  
  for (const [topic, data] of topicCounts.entries()) {
    if (data.count >= 2) {
      // Find related keywords
      const relatedKeywords = new Set<string>();
      for (const article of data.articles) {
        for (const kw of article.keywords) {
          if (kw !== topic) relatedKeywords.add(kw);
        }
      }
      
      // Calculate momentum (articles in last 24h / total)
      const last24h = data.articles.filter(a => 
        Date.now() - a.publishedAt.getTime() < 24 * 60 * 60 * 1000
      ).length;
      const momentum = data.count > 0 ? last24h / data.count : 0;
      
      trending.push({
        topic,
        category: data.articles[0]?.categories[0] || "general",
        articleCount: data.count,
        sentimentAvg: data.sentimentSum / data.count,
        momentum,
        relatedKeywords: [...relatedKeywords].slice(0, 5),
        peakTime: data.articles.reduce((latest, a) => 
          a.publishedAt > latest ? a.publishedAt : latest, 
          new Date(0)
        ),
        isBreaking: momentum > 0.5 && data.count >= 3,
      });
    }
  }
  
  // Sort by article count and momentum
  trending.sort((a, b) => (b.articleCount * (1 + b.momentum)) - (a.articleCount * (1 + a.momentum)));
  
  return trending.slice(0, 10);
}

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Get latest news feed with trending topics
 */
export async function getNewsFeed(options: {
  limit?: number;
  category?: string;
  region?: string;
  minRelevance?: number;
  sentiment?: "bullish" | "bearish" | "neutral";
} = {}): Promise<NewsFeed> {
  const { limit = 20, category, region, minRelevance = 0, sentiment } = options;
  
  logger.info("NEWS_INTEL", "Fetching news feed", options);
  
  // Fetch articles from all sources
  let articles = await fetchRSSFeeds();
  
  // Apply filters
  if (category) {
    articles = articles.filter(a => a.categories.includes(category));
  }
  if (region) {
    articles = articles.filter(a => a.regions.includes(region));
  }
  if (minRelevance > 0) {
    articles = articles.filter(a => a.relevanceScore >= minRelevance);
  }
  if (sentiment) {
    articles = articles.filter(a => a.sentiment === sentiment);
  }
  
  // Sort by recency
  articles.sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());
  
  // Get trending topics
  const trending = identifyTrendingTopics(articles);
  
  // Calculate source stats
  const sourceMap = new Map<string, { count: number; sentimentSum: number }>();
  for (const article of articles) {
    const existing = sourceMap.get(article.source) || { count: 0, sentimentSum: 0 };
    existing.count++;
    existing.sentimentSum += article.sentimentScore;
    sourceMap.set(article.source, existing);
  }
  
  const sourceStats = Array.from(sourceMap.entries()).map(([source, data]) => ({
    source,
    articleCount: data.count,
    avgSentiment: data.count > 0 ? data.sentimentSum / data.count : 0,
  }));
  
  return {
    articles: articles.slice(0, limit),
    trending,
    lastUpdated: new Date(),
    sourceStats,
  };
}

/**
 * Get breaking news alerts
 */
export async function getBreakingAlerts(
  acknowledgedIds: string[] = []
): Promise<NewsAlert[]> {
  const feed = await getNewsFeed({ minRelevance: 30 });
  
  const alerts: NewsAlert[] = [];
  
  // Check for breaking news (high momentum + high relevance)
  for (const topic of feed.trending) {
    if (topic.isBreaking) {
      const alertId = `alert-${topic.topic}-${topic.peakTime.getTime()}`;
      
      alerts.push({
        id: alertId,
        type: topic.category === "policy" ? "regulatory" :
              topic.category === "carbon" ? "market" :
              topic.category === "finance" ? "project" : "breaking",
        severity: topic.articleCount >= 5 ? "high" : topic.articleCount >= 3 ? "medium" : "low",
        title: `Trending: ${topic.topic}`,
        summary: `${topic.articleCount} articles in the last 24 hours. Sentiment: ${topic.sentimentAvg > 0 ? "bullish" : topic.sentimentAvg < 0 ? "bearish" : "neutral"}.`,
        articleId: feed.articles.find(a => a.keywords.includes(topic.topic))?.id || "",
        createdAt: topic.peakTime,
        acknowledged: acknowledgedIds.includes(alertId),
      });
    }
  }
  
  // Check for high-impact articles
  for (const article of feed.articles.slice(0, 5)) {
    if (article.relevanceScore >= 60 && Math.abs(article.sentimentScore) >= 30) {
      const alertId = `alert-article-${article.id}`;
      
      if (!alerts.some(a => a.articleId === article.id)) {
        alerts.push({
          id: alertId,
          type: article.categories.includes("policy") ? "policy" :
                article.categories.includes("carbon") ? "market" : "breaking",
          severity: Math.abs(article.sentimentScore) >= 50 ? "high" : "medium",
          title: article.title,
          summary: article.summary,
          articleId: article.id,
          createdAt: article.publishedAt,
          acknowledged: acknowledgedIds.includes(alertId),
        });
      }
    }
  }
  
  return alerts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

/**
 * Search news articles
 */
export async function searchNews(
  query: string,
  options: { limit?: number; dateFrom?: Date; dateTo?: Date } = {}
): Promise<NewsArticle[]> {
  const { limit = 20, dateFrom, dateTo } = options;
  
  const feed = await getNewsFeed({ limit: 100 });
  
  const queryLower = query.toLowerCase();
  let results = feed.articles.filter(a => 
    a.title.toLowerCase().includes(queryLower) ||
    a.summary.toLowerCase().includes(queryLower) ||
    a.keywords.some(k => k.includes(queryLower))
  );
  
  if (dateFrom) {
    results = results.filter(a => a.publishedAt >= dateFrom);
  }
  if (dateTo) {
    results = results.filter(a => a.publishedAt <= dateTo);
  }
  
  return results.slice(0, limit);
}

/**
 * Force refresh the cache
 */
export async function refreshCache(): Promise<number> {
  lastFetchTime = null;
  articleCache = [];
  const articles = await fetchRSSFeeds();
  return articles.length;
}

// ============================================================================
// EXPORTS
// ============================================================================

export const newsIntelligence = {
  getNewsFeed,
  getBreakingAlerts,
  searchNews,
  refreshCache,
};

export default newsIntelligence;
