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
  sentimentScore: number; // -100 to 100
  topics: string[];
  mentions: string[]; // Companies, projects mentioned
  hashtags: string[];
  
  // Virality
  viralScore: number; // 0-100
  trending: boolean;
}

export interface HashtagTrend {
  hashtag: string;
  postCount24h: number;
  postCount7d: number;
  avgSentiment: number;
  topPosts: SocialPost[];
  momentum: number; // growth rate
  peakTime: Date;
}

export interface Influencer {
  handle: string;
  platform: "twitter" | "linkedin";
  displayName: string;
  bio: string;
  followers: number;
  avgEngagement: number;
  postFrequency: number; // posts per week
  sentimentBias: "bullish" | "bearish" | "neutral";
  recentPosts: SocialPost[];
  credibilityScore: number; // 0-100
  topics: string[];
}

export interface SocialSentimentIndex {
  timestamp: Date;
  overallSentiment: number; // -100 to 100
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

const TRACKED_ACCOUNTS = {
  twitter: [
    "@ARENA_aus", "@CEFCAustralia", "@BioenergyCo", "@IEABioenergy",
    "@BiofuelsDigest", "@BloombergNEF", "@IEA", "@IRABORNEO",
  ],
  linkedin: [
    "arena-australia", "cefc-australia", "bioenergy-australia",
    "iea-bioenergy", "world-bioenergy-association",
  ],
};

const BIOENERGY_COMPANIES = [
  "Ampol", "Viva Energy", "BP Australia", "Shell Australia",
  "Santos", "Woodside", "Origin Energy", "AGL",
  "Manildra", "Wilmar", "MSF Sugar", "Mackay Sugar",
];

// ============================================================================
// POST SIMULATION (for development)
// ============================================================================

function generateSimulatedPosts(count: number): SocialPost[] {
  const posts: SocialPost[] = [];
  
  const sampleContent = {
    positive: [
      "Exciting news for the #bioenergy sector! New $500M investment announced for SAF production in Australia. #cleanenergy #netzero",
      "Just visited an amazing #biomass facility converting agricultural waste to renewable fuel. The future is here! #circulareconomy",
      "Australia's biofuel industry is booming - 15% growth in production capacity this quarter. #biofuels #renewable",
      "Great progress on sustainable aviation fuel. Airlines committing to 10% SAF by 2030. #SAF #aviation #sustainability",
      "New carbon credit methodology approved for biochar projects. Game changer for farmers! #ACCU #carboncredit",
    ],
    negative: [
      "Concerned about the sustainability certification delays affecting bioenergy projects. Need faster regulatory action. #biofuels",
      "Supply chain issues continue to plague the bioenergy sector. Feedstock availability remains a challenge. #biomass",
      "Rising costs putting pressure on renewable fuel margins. Industry needs more policy support. #bioenergy #cleanenergy",
      "Project delays and cost overruns in the SAF sector. Is the industry overpromising? #SAF #aviation",
      "Greenwashing concerns in the voluntary carbon market affecting credibility. #carboncredit #ESG",
    ],
    neutral: [
      "Interesting analysis of global biofuel production trends. Australia ranked 15th globally. #biofuels #data",
      "Attending the bioenergy conference next week. Who else is going? #bioenergy #networking",
      "New report on feedstock availability for Australian bioenergy. Worth reading. #biomass #research",
      "Comparing lifecycle emissions of various renewable fuels. Results are mixed. #LCA #cleanenergy",
      "Industry consultation on new biofuel standards now open. Submit your views! #policy #biofuels",
    ],
  };
  
  const platforms: Array<"twitter" | "linkedin" | "reddit"> = ["twitter", "linkedin", "reddit"];
  
  for (let i = 0; i < count; i++) {
    const platform = platforms[Math.floor(Math.random() * platforms.length)];
    const sentimentType = Math.random() < 0.4 ? "positive" : Math.random() < 0.7 ? "neutral" : "negative";
    const content = sampleContent[sentimentType][Math.floor(Math.random() * 5)];
    
    const followers = Math.floor(Math.pow(10, 2 + Math.random() * 4));
    const isInfluencer = followers > 10000;
    
    const likes = Math.floor(Math.random() * followers * 0.02);
    const shares = Math.floor(likes * (0.1 + Math.random() * 0.3));
    const comments = Math.floor(likes * (0.05 + Math.random() * 0.2));
    const engagementRate = ((likes + shares + comments) / followers) * 100;
    
    const publishedAt = new Date();
    publishedAt.setHours(publishedAt.getHours() - Math.floor(Math.random() * 72));
    
    // Extract hashtags from content
    const hashtagMatches = content.match(/#\w+/g) || [];
    
    const sentimentScore = sentimentType === "positive" ? 30 + Math.random() * 70 :
                          sentimentType === "negative" ? -30 - Math.random() * 70 :
                          (Math.random() - 0.5) * 40;
    
    const viralScore = Math.min(100, engagementRate * 10 + (isInfluencer ? 20 : 0));
    
    posts.push({
      id: `social-${platform}-${Date.now()}-${i}`,
      platform,
      author: {
        handle: `@user${Math.floor(Math.random() * 10000)}`,
        displayName: `User ${Math.floor(Math.random() * 10000)}`,
        followers,
        verified: followers > 50000,
        isInfluencer,
      },
      content,
      url: `https://${platform}.com/post/${Date.now()}-${i}`,
      publishedAt,
      likes,
      shares,
      comments,
      engagementRate: Math.round(engagementRate * 100) / 100,
      sentiment: sentimentType,
      sentimentScore: Math.round(sentimentScore * 100) / 100,
      topics: ["bioenergy", "cleanenergy"].filter(() => Math.random() > 0.3),
      mentions: BIOENERGY_COMPANIES.filter(() => Math.random() > 0.9),
      hashtags: hashtagMatches,
      viralScore: Math.round(viralScore),
      trending: viralScore > 60,
    });
  }
  
  return posts.sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());
}

function generateSimulatedInfluencers(): Influencer[] {
  const influencers: Influencer[] = [
    {
      handle: "@BioenergyCEO",
      platform: "twitter",
      displayName: "Bioenergy Industry Leader",
      bio: "CEO of leading bioenergy company. 20+ years in renewable fuels.",
      followers: 45000,
      avgEngagement: 2.5,
      postFrequency: 8,
      sentimentBias: "bullish",
      recentPosts: generateSimulatedPosts(3),
      credibilityScore: 85,
      topics: ["bioenergy", "SAF", "investment"],
    },
    {
      handle: "@CleanFuelAnalyst",
      platform: "twitter",
      displayName: "Clean Fuel Market Analyst",
      bio: "Independent analyst covering biofuels, hydrogen, and EVs.",
      followers: 28000,
      avgEngagement: 3.2,
      postFrequency: 15,
      sentimentBias: "neutral",
      recentPosts: generateSimulatedPosts(3),
      credibilityScore: 78,
      topics: ["market analysis", "policy", "technology"],
    },
    {
      handle: "@SustainableAg",
      platform: "linkedin",
      displayName: "Sustainable Agriculture Expert",
      bio: "Researching feedstock sustainability and agricultural residues.",
      followers: 18000,
      avgEngagement: 4.1,
      postFrequency: 5,
      sentimentBias: "bullish",
      recentPosts: generateSimulatedPosts(3),
      credibilityScore: 82,
      topics: ["feedstock", "sustainability", "agriculture"],
    },
    {
      handle: "@CarbonTrader",
      platform: "twitter",
      displayName: "Carbon Markets Specialist",
      bio: "Trading carbon credits since 2010. ACCUs, EUAs, VCS.",
      followers: 35000,
      avgEngagement: 2.8,
      postFrequency: 12,
      sentimentBias: "neutral",
      recentPosts: generateSimulatedPosts(3),
      credibilityScore: 75,
      topics: ["carbon", "trading", "markets"],
    },
  ];
  
  return influencers;
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
  
  // In production, would call Twitter/LinkedIn/Reddit APIs
  let posts = generateSimulatedPosts(50);
  
  // Apply filters
  if (platform) {
    posts = posts.filter(p => p.platform === platform);
  }
  if (sentiment) {
    posts = posts.filter(p => p.sentiment === sentiment);
  }
  if (hashtag) {
    posts = posts.filter(p => p.hashtags.includes(hashtag) || p.content.toLowerCase().includes(hashtag.toLowerCase()));
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
  const posts = generateSimulatedPosts(100);
  
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
    if (data.count24h >= 1) {
      trends.push({
        hashtag,
        postCount24h: data.count24h,
        postCount7d: data.count7d,
        avgSentiment: data.sentimentSum / data.posts.length,
        topPosts: data.posts
          .sort((a, b) => b.engagementRate - a.engagementRate)
          .slice(0, 3),
        momentum: data.count7d > 0 ? data.count24h / (data.count7d / 7) : data.count24h,
        peakTime: data.posts[0]?.publishedAt || new Date(),
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
  const influencers = generateSimulatedInfluencers();
  
  return influencers
    .sort((a, b) => b.credibilityScore - a.credibilityScore)
    .slice(0, limit);
}

/**
 * Get overall social sentiment index
 */
export async function getSocialSentimentIndex(): Promise<SocialSentimentIndex> {
  const posts = generateSimulatedPosts(100);
  
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
    sentiment: data.sum / data.count,
    postCount: data.count,
  }));
  
  // Get trending and viral
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
  
  let posts = generateSimulatedPosts(50);
  
  if (platform) {
    posts = posts.filter(p => p.platform === platform);
  }
  
  const queryLower = query.toLowerCase();
  posts = posts.filter(p => 
    p.content.toLowerCase().includes(queryLower) ||
    p.hashtags.some(h => h.toLowerCase().includes(queryLower)) ||
    p.author.displayName.toLowerCase().includes(queryLower)
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
  const posts = generateSimulatedPosts(100);
  
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
    sentimentTrend: avgSentiment > 10 ? "improving" : avgSentiment < -10 ? "declining" : "stable",
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
