export { logAuditEvent, extractAuditContext, createAuditLogger, queryAuditLogs } from "./auditLogger";
export type { AuditAction, EntityType, AuditEventData } from "./auditLogger";

// Counterparty Due Diligence (ABN Monitoring)
export {
  monitorABN,
  runDailyABNMonitoring,
  calculateFraudScore,
  getCounterpartyRiskProfile,
  counterpartyDueDiligenceService,
} from "./counterpartyDueDiligence";
export type {
  ABNMonitoringResult,
  ABNAlert,
  CounterpartyRiskProfile,
} from "./counterpartyDueDiligence";

// ACCU Price Forecasting
export {
  getCurrentACCUPrice,
  forecastACCUPrice,
  simulateProjectNPV,
  ingestACCUPrices,
  accuPriceForecaster,
} from "./accuPriceForecaster";
export type {
  ACCUPriceForecast,
  NPVSimulation,
} from "./accuPriceForecaster";

// Haulage Cost AI
export {
  calculateElevationAdjustedCost,
  haulageCostAI,
} from "./haulageCostAI";
export type {
  RouteAnalysis,
  ElevationProfile,
  WeighbridgeLocation,
} from "./haulageCostAI";

// Supply Security ML Model
export {
  generateSupplyForecast,
  calculateSupplierReliability,
  getRegionalSupplyHealth,
  supplySecurityModel,
} from "./supplySecurityModel";
export type {
  SupplyForecast,
  SupplierReliabilityScore,
  RegionalSupplyHealth,
} from "./supplySecurityModel";

// Feedstock Quality Vision (Computer Vision)
export {
  analyzeQualityFromPhotos,
  estimateYieldFromSatellite,
  batchAnalyzeQuality,
  feedstockQualityVision,
} from "./feedstockQualityVision";
export type {
  QualityAssessment,
  SatelliteYieldEstimate,
  ImageAnalysisRequest,
} from "./feedstockQualityVision";

// Grant Decoder (NLP)
export {
  decodeGrantAgreement,
  checkGrantCompliance,
  searchSimilarClauses,
  grantDecoder,
} from "./grantDecoder";
export type {
  GrantAnalysis,
  ComplianceReport,
  Milestone,
  RiskFlag,
} from "./grantDecoder";

// Price Discovery Engine (AEMO integration)
export {
  calculateFairValuePrice,
  getRegionalBenchmarks,
  getCurrentAEMOPrices,
  priceDiscoveryEngine,
} from "./priceDiscoveryEngine";
export type {
  PriceQuote,
  QualityParams,
  AEMOData,
  RegionalPriceBenchmark,
} from "./priceDiscoveryEngine";

// News Intelligence (RSS/API scraping)
export {
  getNewsFeed,
  getBreakingAlerts,
  searchNews,
  newsIntelligence,
} from "./newsIntelligence";
export type {
  NewsArticle,
  TrendingTopic,
  NewsFeed,
  NewsAlert,
} from "./newsIntelligence";

// Global Carbon Markets
export {
  getMarketPrices,
  getMarketOverview,
  getAllMarketsOverview,
  getHistoricalPrices,
  detectArbitrageOpportunities,
  calculateCorrelations,
  getCarbonMarketDashboard,
  globalCarbonMarkets,
} from "./globalCarbonMarkets";
export type {
  CarbonPrice,
  MarketOverview,
  ArbitrageOpportunity,
  HistoricalPrice,
  MarketCorrelation,
} from "./globalCarbonMarkets";

// Social Sentiment Analysis
export {
  getSocialFeed,
  getTrendingHashtags,
  getTopInfluencers,
  getSocialSentimentIndex,
  searchSocialPosts,
  getCompanyMentions,
  socialSentiment,
} from "./socialSentiment";
export type {
  SocialPost,
  HashtagTrend,
  Influencer,
  SocialSentimentIndex,
} from "./socialSentiment";

// Market Intelligence Hub (Unified Aggregator)
export {
  getMarketDashboard,
  generateExecutiveBriefing,
  searchIntelligence,
  detectMarketSignals,
  marketIntelligenceHub,
} from "./marketIntelligenceHub";
export type {
  MarketSignal,
  MarketDashboard,
  ExecutiveBriefing,
} from "./marketIntelligenceHub";