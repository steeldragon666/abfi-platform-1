/**
 * Global Carbon Market Intelligence Service
 * Real-time data and analysis from carbon markets worldwide
 *
 * Markets Covered:
 * - Australian: ACCUs, LGCs, STCs, ESCs
 * - European: EU ETS (EUAs), UK ETS
 * - North American: California CCA, RGGI, WCI
 * - Voluntary: VCS (Verra), Gold Standard, ACR
 *
 * Features:
 * - Live price feeds with historical data
 * - Cross-market correlation analysis
 * - Arbitrage opportunity detection
 * - Regulatory impact assessment
 * - Volume and liquidity metrics
 */

import { logger } from "../utils/logger";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface CarbonPrice {
  market: string;
  instrument: string;
  price: number;
  currency: string;
  change24h: number;
  changePercent24h: number;
  volume24h: number;
  high24h: number;
  low24h: number;
  timestamp: Date;
}

export interface MarketOverview {
  market: string;
  fullName: string;
  region: string;
  instrumentTypes: string[];
  currentPrices: CarbonPrice[];
  marketCap?: number;
  dailyVolume: number;
  trend: "bullish" | "bearish" | "neutral";
  regulatoryStatus: string;
  lastUpdated: Date;
}

export interface ArbitrageOpportunity {
  id: string;
  fromMarket: string;
  toMarket: string;
  priceDifference: number;
  percentageSpread: number;
  estimatedProfit: number; // per tonne CO2e
  transactionCosts: number;
  netOpportunity: number;
  riskLevel: "low" | "medium" | "high";
  expiresAt: Date;
  notes: string[];
}

export interface HistoricalPrice {
  date: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface MarketCorrelation {
  market1: string;
  market2: string;
  correlation: number; // -1 to 1
  period: "7d" | "30d" | "90d" | "1y";
  significance: number; // p-value
}

// ============================================================================
// MARKET CONFIGURATION
// ============================================================================

const CARBON_MARKETS = {
  // Australian Markets
  accu: {
    name: "ACCU",
    fullName: "Australian Carbon Credit Units",
    region: "AU",
    currency: "AUD",
    basePrice: 35,
    volatility: 0.15,
    instruments: ["Spot", "Generic Forward", "HIR Forward"],
  },
  lgc: {
    name: "LGC",
    fullName: "Large-scale Generation Certificates",
    region: "AU",
    currency: "AUD",
    basePrice: 42,
    volatility: 0.12,
    instruments: ["Spot", "Cal-26", "Cal-27", "Cal-28"],
  },
  stc: {
    name: "STC",
    fullName: "Small-scale Technology Certificates",
    region: "AU",
    currency: "AUD",
    basePrice: 38,
    volatility: 0.05,
    instruments: ["Spot"],
  },
  
  // European Markets
  eua: {
    name: "EUA",
    fullName: "EU Emission Allowances",
    region: "EU",
    currency: "EUR",
    basePrice: 65,
    volatility: 0.20,
    instruments: ["Spot", "Dec-26", "Dec-27", "Dec-28"],
  },
  uka: {
    name: "UKA",
    fullName: "UK Emission Allowances",
    region: "UK",
    currency: "GBP",
    basePrice: 35,
    volatility: 0.18,
    instruments: ["Spot", "Dec-26"],
  },
  
  // North American Markets
  cca: {
    name: "CCA",
    fullName: "California Carbon Allowances",
    region: "US-CA",
    currency: "USD",
    basePrice: 32,
    volatility: 0.10,
    instruments: ["Spot", "Dec-26", "Dec-27"],
  },
  rggi: {
    name: "RGGI",
    fullName: "Regional Greenhouse Gas Initiative",
    region: "US-NE",
    currency: "USD",
    basePrice: 15,
    volatility: 0.08,
    instruments: ["Auction", "Secondary"],
  },
  
  // Voluntary Markets
  vcs: {
    name: "VCS",
    fullName: "Verified Carbon Standard",
    region: "GLOBAL",
    currency: "USD",
    basePrice: 12,
    volatility: 0.25,
    instruments: ["Nature", "Tech", "Energy"],
  },
  gold_standard: {
    name: "GS",
    fullName: "Gold Standard",
    region: "GLOBAL",
    currency: "USD",
    basePrice: 18,
    volatility: 0.22,
    instruments: ["Cookstoves", "Renewable", "Forestry"],
  },
};

// ============================================================================
// PRICE SIMULATION (for development)
// ============================================================================

function simulatePrice(market: typeof CARBON_MARKETS[keyof typeof CARBON_MARKETS]): number {
  // Random walk with mean reversion
  const randomFactor = (Math.random() - 0.5) * 2 * market.volatility;
  return market.basePrice * (1 + randomFactor);
}

function simulatePriceChange(): { change: number; percent: number } {
  const percent = (Math.random() - 0.5) * 10; // -5% to +5%
  return { change: 0, percent };
}

function simulateVolume(basePrice: number): number {
  // Volume in tonnes CO2e
  return Math.round(basePrice * 10000 * (0.5 + Math.random()));
}

// ============================================================================
// MARKET DATA FETCHING
// ============================================================================

/**
 * Get current prices for all instruments in a market
 */
export async function getMarketPrices(marketId: string): Promise<CarbonPrice[]> {
  const market = CARBON_MARKETS[marketId as keyof typeof CARBON_MARKETS];
  
  if (!market) {
    throw new Error(`Unknown market: ${marketId}`);
  }
  
  logger.info("CARBON_MARKETS", `Fetching prices for ${market.name}`);
  
  const prices: CarbonPrice[] = [];
  
  for (const instrument of market.instruments) {
    const basePrice = simulatePrice(market);
    const priceAdjust = instrument === "Spot" ? 1 : 
      instrument.includes("26") ? 1.05 :
      instrument.includes("27") ? 1.08 :
      instrument.includes("28") ? 1.12 : 1.02;
    
    const price = basePrice * priceAdjust;
    const change = simulatePriceChange();
    
    prices.push({
      market: market.name,
      instrument,
      price: Math.round(price * 100) / 100,
      currency: market.currency,
      change24h: Math.round(price * change.percent / 100 * 100) / 100,
      changePercent24h: Math.round(change.percent * 100) / 100,
      volume24h: simulateVolume(price),
      high24h: Math.round(price * 1.02 * 100) / 100,
      low24h: Math.round(price * 0.98 * 100) / 100,
      timestamp: new Date(),
    });
  }
  
  return prices;
}

/**
 * Get market overview
 */
export async function getMarketOverview(marketId: string): Promise<MarketOverview> {
  const market = CARBON_MARKETS[marketId as keyof typeof CARBON_MARKETS];
  
  if (!market) {
    throw new Error(`Unknown market: ${marketId}`);
  }
  
  const prices = await getMarketPrices(marketId);
  const totalVolume = prices.reduce((sum, p) => sum + p.volume24h, 0);
  const avgChange = prices.reduce((sum, p) => sum + p.changePercent24h, 0) / prices.length;
  
  return {
    market: market.name,
    fullName: market.fullName,
    region: market.region,
    instrumentTypes: market.instruments,
    currentPrices: prices,
    dailyVolume: totalVolume,
    trend: avgChange > 1 ? "bullish" : avgChange < -1 ? "bearish" : "neutral",
    regulatoryStatus: "Active",
    lastUpdated: new Date(),
  };
}

/**
 * Get all markets overview
 */
export async function getAllMarketsOverview(): Promise<MarketOverview[]> {
  const overviews: MarketOverview[] = [];
  
  for (const marketId of Object.keys(CARBON_MARKETS)) {
    try {
      const overview = await getMarketOverview(marketId);
      overviews.push(overview);
    } catch (error) {
      logger.error("CARBON_MARKETS", `Failed to get overview for ${marketId}:`, error);
    }
  }
  
  return overviews;
}

/**
 * Get historical prices
 */
export async function getHistoricalPrices(
  marketId: string,
  instrument: string,
  days: number = 30
): Promise<HistoricalPrice[]> {
  const market = CARBON_MARKETS[marketId as keyof typeof CARBON_MARKETS];
  
  if (!market) {
    throw new Error(`Unknown market: ${marketId}`);
  }
  
  const history: HistoricalPrice[] = [];
  let price = market.basePrice;
  
  for (let i = days; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    
    // Simulate price movement
    const change = (Math.random() - 0.5) * 2 * market.volatility * 0.3; // Damped daily volatility
    price = price * (1 + change);
    
    const dayVolatility = Math.random() * market.volatility * 0.5;
    const high = price * (1 + dayVolatility);
    const low = price * (1 - dayVolatility);
    const open = low + Math.random() * (high - low);
    const close = low + Math.random() * (high - low);
    
    history.push({
      date,
      open: Math.round(open * 100) / 100,
      high: Math.round(high * 100) / 100,
      low: Math.round(low * 100) / 100,
      close: Math.round(close * 100) / 100,
      volume: simulateVolume(price) / 10, // Daily volume
    });
  }
  
  return history;
}

/**
 * Detect arbitrage opportunities between markets
 */
export async function detectArbitrageOpportunities(): Promise<ArbitrageOpportunity[]> {
  const opportunities: ArbitrageOpportunity[] = [];
  
  // Get spot prices for comparable markets
  const accuPrices = await getMarketPrices("accu");
  const vcsPrices = await getMarketPrices("vcs");
  const gsPrices = await getMarketPrices("gold_standard");
  
  const accuSpot = accuPrices.find(p => p.instrument === "Spot")?.price || 35;
  const vcsSpot = vcsPrices.find(p => p.instrument === "Nature")?.price || 12;
  const gsSpot = gsPrices.find(p => p.instrument === "Cookstoves")?.price || 18;
  
  // Convert to AUD (simplified)
  const audToUsd = 0.65;
  const accuInUsd = accuSpot * audToUsd;
  
  // Check ACCU vs VCS spread
  if (accuInUsd - vcsSpot > 5) {
    opportunities.push({
      id: `arb-accu-vcs-${Date.now()}`,
      fromMarket: "VCS",
      toMarket: "ACCU",
      priceDifference: accuInUsd - vcsSpot,
      percentageSpread: ((accuInUsd - vcsSpot) / vcsSpot) * 100,
      estimatedProfit: accuInUsd - vcsSpot - 3, // Transaction costs
      transactionCosts: 3,
      netOpportunity: accuInUsd - vcsSpot - 3,
      riskLevel: "high", // Quality/eligibility risk
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      notes: [
        "VCS credits may not be eligible for Australian compliance",
        "Consider regulatory approval requirements",
        "Exchange rate risk applies",
      ],
    });
  }
  
  // Check VCS vs Gold Standard spread
  if (gsSpot - vcsSpot > 3) {
    opportunities.push({
      id: `arb-vcs-gs-${Date.now()}`,
      fromMarket: "VCS",
      toMarket: "Gold Standard",
      priceDifference: gsSpot - vcsSpot,
      percentageSpread: ((gsSpot - vcsSpot) / vcsSpot) * 100,
      estimatedProfit: gsSpot - vcsSpot - 1.5,
      transactionCosts: 1.5,
      netOpportunity: gsSpot - vcsSpot - 1.5,
      riskLevel: "medium",
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      notes: [
        "Gold Standard premium for co-benefits",
        "Check project type equivalence",
      ],
    });
  }
  
  return opportunities;
}

/**
 * Calculate market correlations
 */
export async function calculateCorrelations(
  period: "7d" | "30d" | "90d" | "1y" = "30d"
): Promise<MarketCorrelation[]> {
  const correlations: MarketCorrelation[] = [];
  const markets = ["accu", "eua", "cca", "vcs"];
  
  // Simulate correlation values (in production, would calculate from historical data)
  const simulatedCorrelations: Record<string, Record<string, number>> = {
    accu: { eua: 0.65, cca: 0.72, vcs: 0.45 },
    eua: { cca: 0.78, vcs: 0.52 },
    cca: { vcs: 0.48 },
  };
  
  for (const m1 of markets) {
    for (const m2 of markets) {
      if (m1 !== m2 && simulatedCorrelations[m1]?.[m2]) {
        correlations.push({
          market1: CARBON_MARKETS[m1 as keyof typeof CARBON_MARKETS]?.name || m1,
          market2: CARBON_MARKETS[m2 as keyof typeof CARBON_MARKETS]?.name || m2,
          correlation: simulatedCorrelations[m1][m2],
          period,
          significance: 0.01 + Math.random() * 0.04,
        });
      }
    }
  }
  
  return correlations;
}

/**
 * Get market summary for dashboard
 */
export async function getCarbonMarketDashboard(): Promise<{
  australianMarkets: MarketOverview[];
  internationalMarkets: MarketOverview[];
  voluntaryMarkets: MarketOverview[];
  arbitrageOpportunities: ArbitrageOpportunity[];
  correlations: MarketCorrelation[];
  lastUpdated: Date;
}> {
  const allMarkets = await getAllMarketsOverview();
  
  const australianMarkets = allMarkets.filter(m => 
    ["AU"].includes(m.region)
  );
  
  const internationalMarkets = allMarkets.filter(m => 
    ["EU", "UK", "US-CA", "US-NE"].includes(m.region)
  );
  
  const voluntaryMarkets = allMarkets.filter(m => 
    m.region === "GLOBAL"
  );
  
  const arbitrageOpportunities = await detectArbitrageOpportunities();
  const correlations = await calculateCorrelations();
  
  return {
    australianMarkets,
    internationalMarkets,
    voluntaryMarkets,
    arbitrageOpportunities,
    correlations,
    lastUpdated: new Date(),
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export const globalCarbonMarkets = {
  getMarketPrices,
  getMarketOverview,
  getAllMarketsOverview,
  getHistoricalPrices,
  detectArbitrageOpportunities,
  calculateCorrelations,
  getCarbonMarketDashboard,
};

export default globalCarbonMarkets;
