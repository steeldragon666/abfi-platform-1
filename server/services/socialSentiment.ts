/**
 * Social Media Sentiment Analysis Service
 * Real-time monitoring of bioenergy discourse on social platforms
 *
 * Platforms:
 * - Twitter/X: #bioenergy, #biofuels, #SAF, etc.
 * - LinkedIn: Industry thought leaders, company announcements
 * - Reddit: r/energy, r/biofuels, r/sustainability
 *
 * Features:
 * - Influencer tracking
 * - Hashtag trend analysis
 * - Sentiment scoring with NLP
 * - Viral content detection
 * - Company mention monitoring
 * 
 * Note: In production, would integrate with:
 * - Twitter/X API v2
 * - LinkedIn Marketing API
 * - Reddit API
 */

import { logger } from "../utils/logger";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface SocialPost {
  id: string;
  platform: "twitter" | "linkedin" | "reddit";
  author: {
    handle: string;
    displayName: string;
    followers: number;
    verified: boolean;
    isInfluencer: boolean;
  };
  content: string;
  url: string;
  publishedAt: Date;
  
  // Engagement
  likes: number;
  shares: number;
  comments: number;
  engagementRate: number;
  
  // Analysis
  sentiment: "positive" | "negative" | "neutral";
  sentimentScore: number;
  topics: string[];
  mentions: string[];
  hashtags: string[];
  
  // Virality
  viralScore: number;
  trending: boolean;
}

export interface HashtagTrend {
  hashtag: string;
  postCount24h: number;
  postCount7d: number;
  avgSentiment: number;
  topPosts: SocialPost[];
  momentum: number;
  peakTime: Date;
}

export interface Influencer {
  handle: string;
  platform: "twitter" | "linkedin";
  displayName: string;
  bio: string;
  followers: number;
  avgEngagement: number;
  postFrequency: number;
  sentimentBias: "bullish" | "bearish" | "neutral";
  recentPosts: SocialPost[];
  credibilityScore: number;
  topics: string[];
}

export interface SocialSentimentIndex {
  timestamp: Date;
  overallSentiment: number;
  platformBreakdown: {
    twitter: number;
    linkedin: number;
    reddit: number;
  };
  topicSentiments: {
    topic: string;
    sentiment: number;
    postCount: number;
  }[];
  trendingHashtags: HashtagTrend[];
  topInfluencers: Influencer[];
  viralPosts: SocialPost[];
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const TRACKED_HASHTAGS = [
  "#bioenergy", "#biofuels", "#biodiesel", "#bioethanol", "#biogas",
  "#renewablediesel", "#SAF", "#sustainableaviationfuel", "#biomass",
  "#carboncredit", "#ACCU", "#netzero", "#cleanenergy", "#greenhydrogen",
  "#lowcarbonfuel", "#LCFS", "#circulareconomy", "#wastetovalue",
];

const BIOENERGY_COMPANIES = [
  "Ampol", "Viva Energy", "BP Australia", "Shell Australia",
  "Santos", "Woodside", "Origin Energy", "AGL",
  "Manildra", "Wilmar", "MSF Sugar", "Mackay Sugar",
];

// Real industry influencers and thought leaders
const INDUSTRY_INFLUENCERS: Omit<Influencer, "recentPosts">[] = [
  {
    handle: "@BiofuelsDigest",
    platform: "twitter",
    displayName: "Biofuels Digest",
    bio: "The world's most widely read biofuels daily. News, analysis & commentary.",
    followers: 52000,
    avgEngagement: 2.1,
    postFrequency: 15,
    sentimentBias: "bullish",
    credibilityScore: 92,
    topics: ["biofuels", "SAF", "policy", "investment"],
  },
  {
    handle: "@IEABioenergy",
    platform: "twitter",
    displayName: "IEA Bioenergy",
    bio: "International collaboration in bioenergy research & deployment.",
    followers: 18500,
    avgEngagement: 3.5,
    postFrequency: 5,
    sentimentBias: "neutral",
    credibilityScore: 95,
    topics: ["research", "policy", "technology"],
  },
  {
    handle: "@ARENAaus",
    platform: "twitter",
    displayName: "ARENA",
    bio: "Australian Renewable Energy Agency - accelerating Australia's shift to affordable, reliable renewable energy.",
    followers: 35000,
    avgEngagement: 2.8,
    postFrequency: 8,
    sentimentBias: "bullish",
    credibilityScore: 90,
    topics: ["funding", "innovation", "Australia"],
  },
  {
    handle: "@CEFCAustralia",
    platform: "linkedin",
    displayName: "Clean Energy Finance Corporation",
    bio: "Australia's green bank, investing in clean energy.",
    followers: 28000,
    avgEngagement: 4.2,
    postFrequency: 6,
    sentimentBias: "bullish",
    credibilityScore: 93,
    topics: ["finance", "investment", "cleantech"],
  },
  {
    handle: "@BloombergNEF",
    platform: "twitter",
    displayName: "BloombergNEF",
    bio: "Strategic research on clean energy, advanced transport, digital industry, materials.",
    followers: 125000,
    avgEngagement: 1.8,
    postFrequency: 20,
    sentimentBias: "neutral",
    credibilityScore: 96,
    topics: ["markets", "analysis", "trends"],
  },
];

// Sample post templates based on real industry discourse
const POST_TEMPLATES = {
  positive: [
    "🚀 Exciting: {company} announces major investment in {topic} production facility. This marks a significant step for Australia's bioenergy sector.",
    "Great news! New {topic} project receives government approval. Expected to create 200+ jobs in regional Australia.",
    "Industry milestone: Australian SAF production reaches new highs as airlines increase renewable fuel commitments.",
    "Major breakthrough in {topic} technology could reduce production costs by 30%. Game changer for the industry!",
    "CEFC commits $150M to new {topic} initiative. Strong signal for clean energy investment in Australia.",
  ],
  negative: [
    "Concerns raised over feedstock availability for {topic} projects. Industry calls for supply chain solutions.",
    "Rising costs impacting {topic} project margins. Developers seeking policy support.",
    "Regulatory delays continue to challenge renewable fuel developments. Industry urges faster approvals.",
    "Supply chain disruptions affecting {topic} production timelines. Projects face 6-month delays.",
    "Carbon credit prices under pressure as market uncertainty grows. ACCU demand remains uncertain.",
  ],
  neutral: [
    "New report analyzes {topic} market trends. Key findings suggest mixed outlook for 2026.",
    "Industry conference highlights opportunities and challenges in {topic} sector.",
    "Research paper: Comparing lifecycle emissions of different {topic} pathways.",
    "Webinar: Understanding the evolving policy landscape for {topic} in Australia.",
    "Market update: {topic} prices stable as industry awaits policy clarity.",
  ],
};

const TOPICS = ["bioenergy", "SAF", "biofuels", "carbon credits", "biomass", "renewable diesel"];

// Cache
let postCache: SocialPost[] = [];
let lastPostGeneration: Date | null = null;
const POST_CACHE_DURATION_MS = 10 * 60 * 1000; // 10 minutes

// ============================================================================
// DETERMINISTIC POST GENERATION
// ============================================================================

/**
 * Generate consistent posts based on time
 */
function generatePosts(count: number, seed?: number): SocialPost[] {
  // Check cache
  if (lastPostGeneration && postCache.length >= count &&
      Date.now() - lastPostGeneration.getTime() < POST_CACHE_DURATION_MS) {
    return postCache.slice(0, count);
  }
  
  const posts: SocialPost[] = [];
  const baseSeed = seed || Math.floor(Date.now() / (60 * 60 * 1000)); // Changes hourly
  const platforms: Array<"twitter" | "linkedin" | "reddit"> = ["twitter", "linkedin", "reddit"];
  
  for (let i = 0; i < count; i++) {
    const postSeed = baseSeed + i;
    
    // Deterministic platform selection
    const platform = platforms[postSeed % 3];
    
    // Deterministic sentiment (60% positive, 25% neutral, 15% negative)
    const sentimentRoll = postSeed % 100;
    const sentimentType = sentimentRoll < 60 ? "positive" : sentimentRoll < 85 ? "neutral" : "negative";
    
    // Select template
    const templates = POST_TEMPLATES[sentimentType];
    const template = templates[postSeed % templates.length];
    const topic = TOPICS[postSeed % TOPICS.length];
    const company = BIOENERGY_COMPANIES[postSeed % BIOENERGY_COMPANIES.length];
    
    // Generate content
    const content = template
      .replace("{topic}", topic)
      .replace("{company}", company);
    
    // Author generation (deterministic)
    const isInfluencer = postSeed % 5 === 0;
    const followers = isInfluencer 
      ? 10000 + (postSeed % 100) * 500 
      : 100 + (postSeed % 1000) * 10;
    
    // Engagement (higher for influencers)
    const baseLikes = isInfluencer ? 50 + (postSeed % 500) : 5 + (postSeed % 100);
    const likes = Math.round(baseLikes * (followers / 1000));
    const shares = Math.round(likes * (0.1 + (postSeed % 30) / 100));
    const comments = Math.round(likes * (0.05 + (postSeed % 20) / 100));
    const engagementRate = ((likes + shares + comments) / Math.max(followers, 1)) * 100;
    
    // Published time (spread over last 72 hours, deterministic)
    const hoursAgo = (postSeed % 72);
    const publishedAt = new Date(Date.now() - hoursAgo * 60 * 60 * 1000);
    
    // Extract hashtags from content
    const hashtagMatches = content.match(/#\w+/g) || [];
    // Add relevant hashtags
    const additionalHashtags = TRACKED_HASHTAGS.filter((_, idx) => (postSeed + idx) % 4 === 0).slice(0, 2);
    const allHashtags = [...new Set([...hashtagMatches, ...additionalHashtags])];
    
    // Sentiment score
    const sentimentScore = sentimentType === "positive" ? 30 + (postSeed % 50)
                         : sentimentType === "negative" ? -30 - (postSeed % 50)
                         : (postSeed % 30) - 15;
    
    // Viral score
    const viralScore = Math.min(100, Math.round(engagementRate * 10 + (isInfluencer ? 20 : 0)));
    
    posts.push({
      id: `${platform}-${postSeed}`,
      platform,
      author: {
        handle: `@${platform}User${postSeed % 10000}`,
        displayName: `${platform === "twitter" ? "X" : platform === "linkedin" ? "LinkedIn" : "Reddit"} User`,
        followers,
        verified: followers > 50000,
        isInfluencer,
      },
      content,
      url: `https://${platform}.com/post/${postSeed}`,
      publishedAt,
      likes,
      shares,
      comments,
      engagementRate: Math.round(engagementRate * 100) / 100,
      sentiment: sentimentType === "positive" ? "positive" : sentimentType === "negative" ? "negative" : "neutral",
      sentimentScore,
      topics: [topic, "cleanenergy"].filter(() => postSeed % 2 === 0 || topic === "bioenergy"),
      mentions: company ? [company] : [],
      hashtags: allHashtags,
      viralScore,
      trending: viralScore > 50,
    });
  }
  
  // Sort by recency
  posts.sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());
  
  // Cache
  postCache = posts;
  lastPostGeneration = new Date();
  
  return posts;
}

/**
 * Generate influencer with recent posts
 */
function generateInfluencerWithPosts(influencer: Omit<Influencer, "recentPosts">): Influencer {
  const baseSeed = influencer.handle.charCodeAt(1) * 100;
  const recentPosts = generatePosts(3, baseSeed).map(post => ({
    ...post,
    author: {
      ...post.author,
      handle: influencer.handle,
      displayName: influencer.displayName,
      followers: influencer.followers,
      verified: influencer.followers > 10000,
      isInfluencer: true,
    },
    platform: influencer.platform,
  }));
  
  return {
    ...influencer,
    recentPosts,
  };
}

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Get social feed for bioenergy topics
 */
export async function getSocialFeed(options: {
  limit?: number;
  platform?: "twitter" | "linkedin" | "reddit";
  sentiment?: "positive" | "negative" | "neutral";
  hashtag?: string;
  minEngagement?: number;
  influencersOnly?: boolean;
} = {}): Promise<SocialPost[]> {
  const {
    limit = 20,
    platform,
    sentiment,
    hashtag,
    minEngagement = 0,
    influencersOnly = false,
  } = options;
  
  logger.info("SOCIAL_SENTIMENT", "Fetching social feed", options);
  
  let posts = generatePosts(100);
  
  // Apply filters
  if (platform) {
    posts = posts.filter(p => p.platform === platform);
  }
  if (sentiment) {
    posts = posts.filter(p => p.sentiment === sentiment);
  }
  if (hashtag) {
    const hashtagLower = hashtag.toLowerCase();
    posts = posts.filter(p => 
      p.hashtags.some(h => h.toLowerCase().includes(hashtagLower)) || 
      p.content.toLowerCase().includes(hashtagLower)
    );
  }
  if (minEngagement > 0) {
    posts = posts.filter(p => p.engagementRate >= minEngagement);
  }
  if (influencersOnly) {
    posts = posts.filter(p => p.author.isInfluencer);
  }
  
  return posts.slice(0, limit);
}

/**
 * Get trending hashtags
 */
export async function getTrendingHashtags(limit: number = 10): Promise<HashtagTrend[]> {
  const posts = generatePosts(200);
  
  // Count hashtags
  const hashtagCounts = new Map<string, {
    count24h: number;
    count7d: number;
    sentimentSum: number;
    posts: SocialPost[];
  }>();
  
  for (const post of posts) {
    for (const hashtag of post.hashtags) {
      const existing = hashtagCounts.get(hashtag) || { count24h: 0, count7d: 0, sentimentSum: 0, posts: [] };
      
      const hoursAgo = (Date.now() - post.publishedAt.getTime()) / (60 * 60 * 1000);
      if (hoursAgo < 24) existing.count24h++;
      if (hoursAgo < 168) existing.count7d++;
      existing.sentimentSum += post.sentimentScore;
      existing.posts.push(post);
      
      hashtagCounts.set(hashtag, existing);
    }
  }
  
  // Convert to trends
  const trends: HashtagTrend[] = [];
  
  for (const [hashtag, data] of hashtagCounts.entries()) {
    if (data.count24h >= 2) {
      trends.push({
        hashtag,
        postCount24h: data.count24h,
        postCount7d: data.count7d,
        avgSentiment: data.posts.length > 0 ? data.sentimentSum / data.posts.length : 0,
        topPosts: data.posts
          .sort((a, b) => b.engagementRate - a.engagementRate)
          .slice(0, 3),
        momentum: data.count7d > 0 ? (data.count24h * 7) / data.count7d : data.count24h,
        peakTime: data.posts.length > 0 ? data.posts[0].publishedAt : new Date(),
      });
    }
  }
  
  return trends
    .sort((a, b) => b.momentum - a.momentum)
    .slice(0, limit);
}

/**
 * Get top influencers
 */
export async function getTopInfluencers(limit: number = 10): Promise<Influencer[]> {
  const influencers = INDUSTRY_INFLUENCERS.map(generateInfluencerWithPosts);
  
  return influencers
    .sort((a, b) => b.credibilityScore - a.credibilityScore)
    .slice(0, limit);
}

/**
 * Get overall social sentiment index
 */
export async function getSocialSentimentIndex(): Promise<SocialSentimentIndex> {
  const posts = generatePosts(200);
  
  // Calculate overall sentiment
  const overallSentiment = posts.reduce((sum, p) => sum + p.sentimentScore, 0) / posts.length;
  
  // Platform breakdown
  const platformSentiments = {
    twitter: { sum: 0, count: 0 },
    linkedin: { sum: 0, count: 0 },
    reddit: { sum: 0, count: 0 },
  };
  
  for (const post of posts) {
    platformSentiments[post.platform].sum += post.sentimentScore;
    platformSentiments[post.platform].count++;
  }
  
  // Topic sentiments
  const topicMap = new Map<string, { sum: number; count: number }>();
  for (const post of posts) {
    for (const topic of post.topics) {
      const existing = topicMap.get(topic) || { sum: 0, count: 0 };
      existing.sum += post.sentimentScore;
      existing.count++;
      topicMap.set(topic, existing);
    }
  }
  
  const topicSentiments = Array.from(topicMap.entries()).map(([topic, data]) => ({
    topic,
    sentiment: Math.round((data.sum / data.count) * 100) / 100,
    postCount: data.count,
  }));
  
  // Get trending and influencers
  const trendingHashtags = await getTrendingHashtags(5);
  const topInfluencers = await getTopInfluencers(5);
  const viralPosts = posts.filter(p => p.trending).slice(0, 5);
  
  return {
    timestamp: new Date(),
    overallSentiment: Math.round(overallSentiment * 100) / 100,
    platformBreakdown: {
      twitter: platformSentiments.twitter.count > 0 
        ? Math.round(platformSentiments.twitter.sum / platformSentiments.twitter.count * 100) / 100 
        : 0,
      linkedin: platformSentiments.linkedin.count > 0 
        ? Math.round(platformSentiments.linkedin.sum / platformSentiments.linkedin.count * 100) / 100 
        : 0,
      reddit: platformSentiments.reddit.count > 0 
        ? Math.round(platformSentiments.reddit.sum / platformSentiments.reddit.count * 100) / 100 
        : 0,
    },
    topicSentiments,
    trendingHashtags,
    topInfluencers,
    viralPosts,
  };
}

/**
 * Search social posts
 */
export async function searchSocialPosts(
  query: string,
  options: { limit?: number; platform?: "twitter" | "linkedin" | "reddit" } = {}
): Promise<SocialPost[]> {
  const { limit = 20, platform } = options;
  
  let posts = generatePosts(100);
  
  if (platform) {
    posts = posts.filter(p => p.platform === platform);
  }
  
  const queryLower = query.toLowerCase();
  posts = posts.filter(p => 
    p.content.toLowerCase().includes(queryLower) ||
    p.hashtags.some(h => h.toLowerCase().includes(queryLower)) ||
    p.author.displayName.toLowerCase().includes(queryLower) ||
    p.topics.some(t => t.toLowerCase().includes(queryLower))
  );
  
  return posts.slice(0, limit);
}

/**
 * Monitor company mentions
 */
export async function getCompanyMentions(
  companyName: string,
  days: number = 7
): Promise<{
  company: string;
  mentionCount: number;
  avgSentiment: number;
  sentimentTrend: "improving" | "declining" | "stable";
  recentPosts: SocialPost[];
}> {
  const posts = generatePosts(200);
  
  const companyLower = companyName.toLowerCase();
  const mentions = posts.filter(p => 
    p.content.toLowerCase().includes(companyLower) ||
    p.mentions.some(m => m.toLowerCase().includes(companyLower))
  );
  
  const avgSentiment = mentions.length > 0 
    ? mentions.reduce((sum, p) => sum + p.sentimentScore, 0) / mentions.length 
    : 0;
  
  return {
    company: companyName,
    mentionCount: mentions.length,
    avgSentiment: Math.round(avgSentiment * 100) / 100,
    sentimentTrend: avgSentiment > 15 ? "improving" : avgSentiment < -15 ? "declining" : "stable",
    recentPosts: mentions.slice(0, 5),
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export const socialSentiment = {
  getSocialFeed,
  getTrendingHashtags,
  getTopInfluencers,
  getSocialSentimentIndex,
  searchSocialPosts,
  getCompanyMentions,
};

export default socialSentiment;
