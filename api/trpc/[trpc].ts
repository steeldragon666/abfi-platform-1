/**
 * tRPC API Route Handler for Vercel Serverless
 * Self-contained with mock data for demo deployments
 * Version: 2.3.0 - fixed logout to clear session cookie
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { initTRPC, TRPCError } from "@trpc/server";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { z } from "zod";
import superjson from "superjson";
import { jwtVerify } from "jose";

// =============================================================================
// Middleware
// =============================================================================

const ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "http://localhost:3002",
  "http://localhost:5173",
  process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "",
  process.env.PRODUCTION_URL || "",
].filter(Boolean);

function setCorsHeaders(req: VercelRequest, res: VercelResponse): boolean {
  const origin = req.headers.origin || "";
  const isAllowed = ALLOWED_ORIGINS.some(allowed =>
    origin === allowed || origin.endsWith(".vercel.app")
  );
  if (isAllowed) res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, Cookie");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Max-Age", "86400");
  if (req.method === "OPTIONS") { res.status(200).end(); return true; }
  return false;
}

function setSecurityHeaders(res: VercelResponse): void {
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  if (process.env.NODE_ENV === "production") {
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }
}

function logRequest(req: VercelRequest, startTime: number): void {
  console.log(`[${req.method || "GET"}] ${req.url || "/"} - ${Date.now() - startTime}ms`);
}

function handleError(res: VercelResponse, error: unknown): void {
  console.error("[API Error]", error);
  res.status(500).json({
    error: "Internal Server Error",
    message: process.env.NODE_ENV === "development" && error instanceof Error ? error.message : undefined,
  });
}

// =============================================================================
// Mock Data for Demo
// =============================================================================

const COMMODITY_BASE_PRICES: Record<string, number> = {
  UCO: 1250,
  Tallow: 980,
  Canola: 720,
  Palm: 850,
};

const REGIONS = [
  { id: "AUS", name: "Australia" },
  { id: "SEA", name: "Southeast Asia" },
  { id: "EU", name: "Europe" },
  { id: "NA", name: "North America" },
  { id: "LATAM", name: "Latin America" },
];

function getMockKPIs() {
  return Object.entries(COMMODITY_BASE_PRICES).map(([commodity, basePrice]) => {
    const change = (Math.random() - 0.5) * 10;
    return {
      commodity,
      price: Math.round(basePrice * (1 + change / 100)),
      currency: "AUD",
      unit: "MT",
      change_pct: Math.round(change * 10) / 10,
      change_direction: change > 0.5 ? "up" : change < -0.5 ? "down" : "flat",
    };
  });
}

function getMockOHLC(commodity: string, region: string, period: string) {
  const basePrice = COMMODITY_BASE_PRICES[commodity] || 1000;
  const days = period === "1M" ? 30 : period === "3M" ? 90 : period === "6M" ? 180 : period === "1Y" ? 365 : 730;
  const data = [];
  const now = new Date();

  for (let i = days; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const trend = Math.sin(i / 30) * 50;
    const noise = (Math.random() - 0.5) * 30;
    const dayPrice = basePrice + trend + noise;
    const open = dayPrice + (Math.random() - 0.5) * 20;
    const close = dayPrice + (Math.random() - 0.5) * 20;
    const high = Math.max(open, close) + Math.random() * 15;
    const low = Math.min(open, close) - Math.random() * 15;

    data.push({
      date: date.toISOString().split("T")[0],
      open: Math.round(open * 100) / 100,
      high: Math.round(high * 100) / 100,
      low: Math.round(low * 100) / 100,
      close: Math.round(close * 100) / 100,
      volume: Math.floor(Math.random() * 50000) + 10000,
    });
  }

  return { commodity, region, data, source: "ABFI Internal" };
}

function getMockHeatmap(commodity: string) {
  const basePrice = COMMODITY_BASE_PRICES[commodity] || 1000;
  return {
    commodity,
    regions: REGIONS.map((r) => {
      const regionMultiplier = r.id === "AUS" ? 1 : r.id === "SEA" ? 0.85 : r.id === "EU" ? 1.15 : r.id === "NA" ? 1.1 : 0.9;
      const price = basePrice * regionMultiplier + (Math.random() - 0.5) * 50;
      return {
        region: r.id,
        region_name: r.name,
        price: Math.round(price),
        change_pct: Math.round((Math.random() - 0.5) * 10 * 10) / 10,
        currency: "AUD",
      };
    }),
  };
}

function getMockForwardCurve(commodity: string, region: string) {
  const basePrice = COMMODITY_BASE_PRICES[commodity] || 1000;
  const isContango = Math.random() > 0.5;
  const tenors = ["Spot", "1M", "3M", "6M", "1Y"];
  const points = tenors.map((tenor, idx) => {
    const spread = isContango ? idx * 15 : -idx * 10;
    const price = basePrice + spread + (Math.random() - 0.5) * 10;
    return { tenor, price: Math.round(price), change_from_spot: idx === 0 ? 0 : Math.round(spread) };
  });

  return {
    commodity,
    region,
    curve_shape: isContango ? "contango" : "backwardation",
    points,
    as_of_date: new Date().toISOString().split("T")[0],
  };
}

function getMockTechnicals(commodity: string) {
  const indicators = [
    { name: "RSI (14)", baseValue: 50, range: 30 },
    { name: "MACD", baseValue: 0, range: 20 },
    { name: "SMA 20", baseValue: COMMODITY_BASE_PRICES[commodity] || 1000, range: 50 },
    { name: "SMA 50", baseValue: (COMMODITY_BASE_PRICES[commodity] || 1000) - 20, range: 50 },
    { name: "Bollinger %B", baseValue: 0.5, range: 0.5 },
  ];

  return indicators.map((ind) => {
    const value = ind.baseValue + (Math.random() - 0.5) * ind.range;
    let signal: "buy" | "sell" | "neutral";
    if (ind.name.includes("RSI")) {
      signal = value > 70 ? "sell" : value < 30 ? "buy" : "neutral";
    } else if (ind.name === "MACD") {
      signal = value > 5 ? "buy" : value < -5 ? "sell" : "neutral";
    } else if (ind.name === "Bollinger %B") {
      signal = value > 0.8 ? "sell" : value < 0.2 ? "buy" : "neutral";
    } else {
      signal = Math.random() > 0.6 ? "buy" : Math.random() > 0.3 ? "neutral" : "sell";
    }
    return { name: ind.name, value: Math.round(value * 100) / 100, signal };
  });
}

// =============================================================================
// Auth helpers
// =============================================================================

const COOKIE_NAME = "abfi_session";
const SESSION_SECRET = process.env.SESSION_SECRET || "dev-secret-key-change-in-production";

interface DevUser {
  openId: string;
  name: string;
  email: string;
  role: string;
}

async function getUserFromCookie(cookieHeader: string | null): Promise<DevUser | null> {
  if (!cookieHeader) return null;

  const cookies = cookieHeader.split(";").reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split("=");
    acc[key] = value;
    return acc;
  }, {} as Record<string, string>);

  const token = cookies[COOKIE_NAME];
  if (!token) return null;

  try {
    const secret = new TextEncoder().encode(SESSION_SECRET);
    const { payload } = await jwtVerify(token, secret);
    return {
      openId: payload.sub as string,
      name: payload.name as string,
      email: payload.email as string,
      role: payload.role as string,
    };
  } catch {
    return null;
  }
}

// =============================================================================
// Self-contained tRPC setup
// =============================================================================

type Context = { user: DevUser | null; cookieHeader: string | null };

const t = initTRPC.context<Context>().create({
  transformer: superjson,
});
const publicProcedure = t.procedure;
const router = t.router;

// Prices router with mock data for demo
const pricesRouter = router({
  getKPIs: publicProcedure.query(() => getMockKPIs()),

  getOHLC: publicProcedure
    .input(z.object({
      commodity: z.string(),
      region: z.string().default("AUS"),
      period: z.enum(["1M", "3M", "6M", "1Y", "2Y"]).default("1Y"),
    }))
    .query(({ input }) => getMockOHLC(input.commodity, input.region, input.period)),

  getHeatmap: publicProcedure
    .input(z.object({ commodity: z.string() }))
    .query(({ input }) => getMockHeatmap(input.commodity)),

  getForwardCurve: publicProcedure
    .input(z.object({
      commodity: z.string(),
      region: z.string().default("AUS"),
    }))
    .query(({ input }) => getMockForwardCurve(input.commodity, input.region)),

  getTechnicals: publicProcedure
    .input(z.object({
      commodity: z.string(),
      region: z.string().default("AUS"),
    }))
    .query(({ input }) => getMockTechnicals(input.commodity)),

  getCommodities: publicProcedure.query(() => ({
    commodities: [
      { id: "UCO", name: "Used Cooking Oil", unit: "MT" },
      { id: "Tallow", name: "Tallow", unit: "MT" },
      { id: "Canola", name: "Canola Oil", unit: "MT" },
      { id: "Palm", name: "Palm Oil", unit: "MT" },
    ],
    regions: REGIONS,
  })),
});

// =============================================================================
// Mock Climate Data for Australian SILO/BOM (CC BY 4.0)
// =============================================================================

const AUSTRALIAN_GRID_CELLS = [
  { id: "WHEATBELT_WA", name: "Wheatbelt", state: "WA", lat: -31.5, lng: 117.5 },
  { id: "RIVERINA_NSW", name: "Riverina", state: "NSW", lat: -35.0, lng: 146.0 },
  { id: "MALLEE_VIC", name: "Mallee", state: "VIC", lat: -35.5, lng: 142.0 },
  { id: "EYRE_SA", name: "Eyre Peninsula", state: "SA", lat: -33.5, lng: 136.0 },
  { id: "DARLING_DOWNS_QLD", name: "Darling Downs", state: "QLD", lat: -27.5, lng: 151.5 },
  { id: "CENTRAL_QLD", name: "Central Queensland", state: "QLD", lat: -23.5, lng: 149.5 },
];

function getMockClimateIntelligence(lat: number, lng: number) {
  const region = AUSTRALIAN_GRID_CELLS.find(r =>
    Math.abs(r.lat - lat) < 3 && Math.abs(r.lng - lng) < 3
  ) || AUSTRALIAN_GRID_CELLS[0];

  const baseTemp = 25 + (Math.random() - 0.5) * 10;
  const rainfall = Math.random() * 30;

  return {
    location: { latitude: lat, longitude: lng, region: region.name, state: region.state },
    timestamp: new Date().toISOString(),
    satellite: {
      ndvi: { mean: 0.35 + Math.random() * 0.3, min: 0.1, max: 0.7, healthCategory: "moderate" },
      vegetationHealth: { healthScore: 65 + Math.random() * 20, evi: 0.28, lai: 2.1, trend: "stable", alerts: [] },
      soilMoisture: { surfaceMoisture: 0.25 + Math.random() * 0.2, rootZoneMoisture: 0.35, moistureCategory: "adequate", droughtRisk: "low" },
    },
    climate: {
      current: { maxTemp: baseTemp + 5, minTemp: baseTemp - 8, rainfall, humidity: 45 + Math.random() * 30 },
      forecast: { days: 7, rainfallTotal: rainfall * 3, tempRange: { min: baseTemp - 10, max: baseTemp + 8 }, frostDays: 0, heatStressDays: 1 },
      seasonal: { rainfallOutlook: "near_average", temperatureOutlook: "above_average", probability: 0.6 },
      risks: {
        drought: { level: "moderate", probability: 0.25 },
        frost: { level: "low", daysExpected: 0 },
        heatStress: { level: "moderate", daysExpected: 3 },
        flood: { level: "low", probability: 0.05 },
      },
    },
    alerts: [],
    overallScore: 72 + Math.floor(Math.random() * 15),
    recommendations: ["Monitor soil moisture levels during forecast dry period", "Consider irrigation scheduling based on evapotranspiration rates"],
    dataFreshness: { satellite: "2 days ago", climate: "6 hours ago" },
    dataSource: { provider: "SILO/BOM", license: "CC BY 4.0", attribution: "Australian Bureau of Meteorology & Queensland Government SILO" },
  };
}

function getMockRegionalOverview() {
  return AUSTRALIAN_GRID_CELLS.map(region => ({
    regionId: region.id,
    regionName: region.name,
    state: region.state,
    coordinates: { lat: region.lat, lng: region.lng },
    currentConditions: {
      temperature: 22 + Math.random() * 12,
      rainfall7Day: Math.random() * 25,
      soilMoisture: 0.3 + Math.random() * 0.25,
      ndvi: 0.3 + Math.random() * 0.35,
    },
    riskLevel: Math.random() > 0.7 ? "elevated" : "normal",
    alerts: [],
    lastUpdated: new Date().toISOString(),
  }));
}

// =============================================================================
// Mock RSIE (Risk & Supply Intelligence Engine) Data
// =============================================================================

const RISK_EVENT_TYPES = ["bushfire", "flood", "drought", "cyclone", "hailstorm", "frost", "heatwave"] as const;
const RISK_SEVERITY = ["low", "medium", "high", "critical"] as const;

function getMockRiskEvents() {
  return [
    {
      id: 1,
      eventType: "drought",
      eventClass: "hazard",
      eventStatus: "active",
      severity: "medium",
      region: "Western NSW",
      state: "NSW",
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      scoreTotal: 65,
      confidence: "high",
      description: "Prolonged dry conditions affecting crop yields",
      dataSource: { provider: "BOM", license: "CC BY 4.0" },
    },
    {
      id: 2,
      eventType: "heatwave",
      eventClass: "hazard",
      eventStatus: "watch",
      severity: "high",
      region: "Northern Victoria",
      state: "VIC",
      startDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      scoreTotal: 78,
      confidence: "medium",
      description: "Extreme heat forecast for coming week",
      dataSource: { provider: "BOM", license: "CC BY 4.0" },
    },
  ];
}

function getMockWeatherForCell(cellId: string) {
  const baseTemp = 25 + (Math.random() - 0.5) * 15;
  return {
    cellId,
    historical: Array.from({ length: 30 }, (_, i) => ({
      date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      maxTemp: baseTemp + 5 + (Math.random() - 0.5) * 8,
      minTemp: baseTemp - 8 + (Math.random() - 0.5) * 6,
      rainfall: Math.random() > 0.7 ? Math.random() * 15 : 0,
      humidity: 40 + Math.random() * 40,
    })),
    dataSource: { provider: "SILO", license: "CC BY 4.0", attribution: "Queensland Government SILO" },
  };
}

function getMockForecast(cellId: string) {
  const baseTemp = 26 + (Math.random() - 0.5) * 10;
  return {
    cellId,
    forecast: Array.from({ length: 7 }, (_, i) => ({
      date: new Date(Date.now() + i * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      maxTemp: baseTemp + 5 + (Math.random() - 0.5) * 6,
      minTemp: baseTemp - 6 + (Math.random() - 0.5) * 4,
      precipProbability: Math.random() * 0.5,
      precipAmount: Math.random() > 0.6 ? Math.random() * 10 : 0,
      conditions: Math.random() > 0.7 ? "Partly cloudy" : "Sunny",
    })),
    dataSource: { provider: "BOM", license: "CC BY 4.0", attribution: "Australian Bureau of Meteorology" },
  };
}

function getMockDataSources() {
  return [
    { id: 1, sourceKey: "bom_observations", name: "BOM Weather Observations", licenseClass: "CC_BY_4", isEnabled: true },
    { id: 2, sourceKey: "bom_forecasts", name: "BOM Weather Forecasts", licenseClass: "CC_BY_4", isEnabled: true },
    { id: 3, sourceKey: "silo_climate", name: "SILO Climate Data", licenseClass: "CC_BY_4", isEnabled: true },
    { id: 4, sourceKey: "abares_commodities", name: "ABARES Agricultural Data", licenseClass: "CC_BY_4", isEnabled: true },
  ];
}

// Project Registry router (for Climate Hub)
const projectRegistryRouter = router({
  list: publicProcedure
    .input(z.object({ status: z.string().optional(), limit: z.number().optional() }).optional())
    .query(() => ({
      projects: [
        { id: 1, name: "Riverina Canola Project", slug: "riverina-canola", company: "AgriEnergy NSW", status: "operational", technology: "Biodiesel", latitude: "-35.0", longitude: "146.0", state: "NSW", score: 82 },
        { id: 2, name: "Wheatbelt UCO Facility", slug: "wheatbelt-uco", company: "WA Biofuels", status: "operational", technology: "UCO Processing", latitude: "-31.5", longitude: "117.5", state: "WA", score: 78 },
        { id: 3, name: "Darling Downs Tallow", slug: "darling-downs-tallow", company: "QLD Renewables", status: "construction", technology: "Tallow Refining", latitude: "-27.5", longitude: "151.5", state: "QLD", score: 71 },
      ],
      total: 3,
    })),

  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(({ input }) => ({
      id: input.id,
      name: "Sample Project",
      slug: "sample-project",
      company: "Sample Company",
      status: "operational",
      technology: "Biodiesel",
      latitude: "-33.8",
      longitude: "151.2",
      state: "NSW",
      score: 75,
      climateScore: 72,
      dataSource: { provider: "SILO/BOM", license: "CC BY 4.0" },
    })),
});

// RSIE router with Australian Government data
const rsieRouter = router({
  dataSources: router({
    list: publicProcedure.query(() => getMockDataSources()),
    listEnabled: publicProcedure.query(() => getMockDataSources().filter(d => d.isEnabled)),
  }),

  riskEvents: router({
    list: publicProcedure
      .input(z.object({
        eventType: z.array(z.string()).optional(),
        severity: z.array(z.string()).optional(),
        limit: z.number().default(50),
        offset: z.number().default(0),
      }).optional())
      .query(() => ({ events: getMockRiskEvents(), total: 2 })),

    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(({ input }) => getMockRiskEvents().find(e => e.id === input.id) || null),

    getInBbox: publicProcedure
      .input(z.object({
        minLat: z.number(), maxLat: z.number(),
        minLng: z.number(), maxLng: z.number(),
      }))
      .query(() => getMockRiskEvents()),

    getActiveRiskEvents: publicProcedure.query(() => getMockRiskEvents().filter(e => e.eventStatus === "active")),
  }),

  exposure: router({
    mySummary: publicProcedure.query(() => ({
      totalExposure: 0,
      riskScore: 25,
      mitigatedPercentage: 85,
      activeAlerts: 0,
    })),
  }),

  weather: router({
    getForCell: publicProcedure
      .input(z.object({ cellId: z.string() }))
      .query(({ input }) => getMockWeatherForCell(input.cellId)),

    getForecast: publicProcedure
      .input(z.object({ cellId: z.string(), hoursAhead: z.number().default(168) }))
      .query(({ input }) => getMockForecast(input.cellId)),

    getCombined: publicProcedure
      .input(z.object({ cellId: z.string() }))
      .query(({ input }) => ({
        ...getMockWeatherForCell(input.cellId),
        ...getMockForecast(input.cellId),
      })),

    myAlerts: publicProcedure.query(() => []),
  }),

  intelligence: router({
    list: publicProcedure
      .input(z.object({ limit: z.number().default(20) }).optional())
      .query(() => ({
        items: [
          { id: 1, type: "market_note", title: "UCO prices stable in Q1", publishedAt: new Date().toISOString(), source: "ABFI Analysis" },
          { id: 2, type: "policy", title: "New SAF mandate announced", publishedAt: new Date().toISOString(), source: "Government" },
        ],
        total: 2,
      })),
  }),

  ingestion: router({
    status: publicProcedure.query(() => ({
      lastRun: new Date().toISOString(),
      recordsProcessed: 1542,
      errors: 0,
      sources: ["BOM", "SILO", "ABARES"],
    })),
  }),
});

// Climate Hub router with SILO/BOM data
const climateHubRouter = router({
  getLocationIntelligence: publicProcedure
    .input(z.object({ lat: z.number(), lng: z.number(), includeHistorical: z.boolean().optional() }))
    .query(({ input }) => getMockClimateIntelligence(input.lat, input.lng)),

  getProjectsClimate: publicProcedure
    .input(z.object({ projectIds: z.array(z.number()).optional() }))
    .query(() => ({
      projects: [],
      summary: { avgScore: 74, riskCount: 0, alertCount: 0 },
      dataSource: "SILO/BOM (CC BY 4.0)",
    })),

  getRegionalOverview: publicProcedure
    .input(z.object({ state: z.string().optional() }).optional())
    .query(() => ({
      regions: getMockRegionalOverview(),
      summary: {
        projectCount: 3,
        dominantDroughtRisk: "moderate",
        avgTemperature: 26,
        totalRainfall7Day: 45,
        avgSoilMoisture: 0.38,
        regionsWithAlerts: 0,
      },
      nationalSummary: { avgTemperature: 26, totalRainfall7Day: 45, avgSoilMoisture: 0.38, regionsWithAlerts: 0 },
      lastUpdated: new Date().toISOString(),
      dataSource: { provider: "SILO/BOM", license: "CC BY 4.0" },
    })),

  getClimateAlerts: publicProcedure
    .input(z.object({ states: z.array(z.string()).optional(), severity: z.string().optional() }).optional())
    .query(() => ({
      total: 0,
      byType: [
        { type: "heatwave", count: 0, alerts: [] },
        { type: "drought", count: 0, alerts: [] },
        { type: "flood", count: 0, alerts: [] },
        { type: "fire", count: 0, alerts: [] },
      ],
      states: [],
      dataSource: "Bureau of Meteorology (CC BY 4.0)",
    })),

  getDataStatus: publicProcedure.query(() => ({
    status: "operational" as const,
    mode: "demo" as const,
    services: {
      earthEngine: { available: true, mode: "demo", lastData: new Date(Date.now() - 86400000).toISOString() },
      bomClimate: { available: true, lastData: new Date().toISOString() },
      silo: { available: true, recordCount: 15420 },
    },
    cache: { entries: 42, maxAge: "24 hours" },
    silo: { status: "operational", lastSync: new Date().toISOString(), recordCount: 15420 },
    bom: { status: "operational", lastSync: new Date().toISOString(), warningCount: 0 },
    satellite: { status: "operational", lastUpdate: new Date(Date.now() - 86400000).toISOString() },
    dataSource: { provider: "SILO/BOM", license: "CC BY 4.0", attribution: "Australian Bureau of Meteorology" },
  })),
});

// =============================================================================
// Mock Feedstocks Data
// =============================================================================

const MOCK_FEEDSTOCKS = [
  { id: 1, abfiId: "ABFI-FS-001", type: "Used Cooking Oil", category: "waste_oils", state: "NSW", latitude: "-33.8688", longitude: "151.2093", abfiScore: 85, carbonIntensityValue: 12.5, annualCapacityTonnes: 50000, availableVolumeCurrent: 35000, pricePerTonne: 1250, priceVisibility: "public", status: "verified" },
  { id: 2, abfiId: "ABFI-FS-002", type: "Beef Tallow", category: "animal_fats", state: "QLD", latitude: "-27.4698", longitude: "153.0251", abfiScore: 78, carbonIntensityValue: 18.2, annualCapacityTonnes: 75000, availableVolumeCurrent: 42000, pricePerTonne: 980, priceVisibility: "public", status: "verified" },
  { id: 3, abfiId: "ABFI-FS-003", type: "Canola Oil", category: "oilseeds", state: "VIC", latitude: "-37.8136", longitude: "144.9631", abfiScore: 92, carbonIntensityValue: 8.5, annualCapacityTonnes: 120000, availableVolumeCurrent: 85000, pricePerTonne: 720, priceVisibility: "public", status: "verified" },
  { id: 4, abfiId: "ABFI-FS-004", type: "Palm Fatty Acid Distillate", category: "waste_oils", state: "WA", latitude: "-31.9505", longitude: "115.8605", abfiScore: 72, carbonIntensityValue: 22.1, annualCapacityTonnes: 45000, availableVolumeCurrent: 28000, pricePerTonne: 650, priceVisibility: "public", status: "verified" },
  { id: 5, abfiId: "ABFI-FS-005", type: "Poultry Fat", category: "animal_fats", state: "SA", latitude: "-34.9285", longitude: "138.6007", abfiScore: 81, carbonIntensityValue: 15.8, annualCapacityTonnes: 30000, availableVolumeCurrent: 18000, pricePerTonne: 890, priceVisibility: "public", status: "verified" },
  { id: 6, abfiId: "ABFI-FS-006", type: "Sugarcane Bagasse", category: "crop_residues", state: "QLD", latitude: "-19.2590", longitude: "146.8169", abfiScore: 88, carbonIntensityValue: 6.2, annualCapacityTonnes: 200000, availableVolumeCurrent: 150000, pricePerTonne: 120, priceVisibility: "public", status: "verified" },
  { id: 7, abfiId: "ABFI-FS-007", type: "Wheat Straw", category: "crop_residues", state: "NSW", latitude: "-35.2809", longitude: "149.1300", abfiScore: 79, carbonIntensityValue: 9.1, annualCapacityTonnes: 80000, availableVolumeCurrent: 55000, pricePerTonne: 85, priceVisibility: "public", status: "verified" },
  { id: 8, abfiId: "ABFI-FS-008", type: "Forestry Residues", category: "woody_biomass", state: "TAS", latitude: "-42.8821", longitude: "147.3272", abfiScore: 86, carbonIntensityValue: 7.8, annualCapacityTonnes: 95000, availableVolumeCurrent: 72000, pricePerTonne: 95, priceVisibility: "public", status: "verified" },
  { id: 9, abfiId: "ABFI-FS-009", type: "Food Processing Waste", category: "organic_waste", state: "VIC", latitude: "-37.5622", longitude: "143.8503", abfiScore: 74, carbonIntensityValue: 14.3, annualCapacityTonnes: 25000, availableVolumeCurrent: 15000, pricePerTonne: 180, priceVisibility: "public", status: "verified" },
  { id: 10, abfiId: "ABFI-FS-010", type: "Municipal Green Waste", category: "organic_waste", state: "ACT", latitude: "-35.2809", longitude: "149.1300", abfiScore: 69, carbonIntensityValue: 19.5, annualCapacityTonnes: 15000, availableVolumeCurrent: 8000, pricePerTonne: 45, priceVisibility: "public", status: "verified" },
];

const feedstocksRouter = router({
  search: publicProcedure
    .input(z.object({
      category: z.array(z.string()).nullish(),
      state: z.array(z.string()).nullish(),
      minAbfiScore: z.number().nullish(),
      maxCarbonIntensity: z.number().nullish(),
      limit: z.number().default(200),
    }).optional())
    .query(({ input }) => {
      let results = [...MOCK_FEEDSTOCKS];
      if (input?.category?.length) {
        results = results.filter(f => input.category!.includes(f.category));
      }
      if (input?.state?.length) {
        results = results.filter(f => input.state!.includes(f.state));
      }
      if (input?.minAbfiScore) {
        results = results.filter(f => f.abfiScore >= input.minAbfiScore!);
      }
      if (input?.maxCarbonIntensity) {
        results = results.filter(f => f.carbonIntensityValue <= input.maxCarbonIntensity!);
      }
      return results.slice(0, input?.limit || 200);
    }),

  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(({ input }) => MOCK_FEEDSTOCKS.find(f => f.id === input.id) || null),

  getPublic: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(({ input }) => MOCK_FEEDSTOCKS.find(f => f.id === input.id) || null),
});

// =============================================================================
// Mock Futures Data
// =============================================================================

const MOCK_FUTURES = [
  { id: 1, supplierId: 1, cropType: "Canola", state: "NSW", volumeTonnes: 5000, harvestYear: 2026, harvestQuarter: "Q1", pricePerTonne: 750, status: "published", createdAt: new Date().toISOString() },
  { id: 2, supplierId: 2, cropType: "Wheat Straw", state: "VIC", volumeTonnes: 8000, harvestYear: 2026, harvestQuarter: "Q2", pricePerTonne: 95, status: "published", createdAt: new Date().toISOString() },
  { id: 3, supplierId: 3, cropType: "Sugarcane Bagasse", state: "QLD", volumeTonnes: 15000, harvestYear: 2026, harvestQuarter: "Q3", pricePerTonne: 130, status: "published", createdAt: new Date().toISOString() },
  { id: 4, supplierId: 4, cropType: "Forestry Residues", state: "TAS", volumeTonnes: 6000, harvestYear: 2026, harvestQuarter: "Q4", pricePerTonne: 105, status: "published", createdAt: new Date().toISOString() },
  { id: 5, supplierId: 5, cropType: "UCO", state: "SA", volumeTonnes: 3000, harvestYear: 2027, harvestQuarter: "Q1", pricePerTonne: 1300, status: "published", createdAt: new Date().toISOString() },
];

const futuresRouter = router({
  search: publicProcedure
    .input(z.object({
      state: z.string().nullish(),
      cropType: z.string().nullish(),
      minVolume: z.number().nullish(),
      limit: z.number().default(50),
    }).optional())
    .query(({ input }) => {
      let results = [...MOCK_FUTURES];
      if (input?.state) {
        results = results.filter(f => f.state === input.state);
      }
      if (input?.cropType) {
        results = results.filter(f => f.cropType === input.cropType);
      }
      if (input?.minVolume) {
        results = results.filter(f => f.volumeTonnes >= input.minVolume!);
      }
      return results.slice(0, input?.limit || 50);
    }),

  getPublic: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(({ input }) => MOCK_FUTURES.find(f => f.id === input.id) || null),

  list: publicProcedure
    .input(z.object({ limit: z.number().default(50) }).optional())
    .query(({ input }) => MOCK_FUTURES.slice(0, input?.limit || 50)),
});

// =============================================================================
// Mock Admin Router
// =============================================================================

const adminRouter = router({
  getPendingSuppliers: publicProcedure.query(() => []),
  getPendingFeedstocks: publicProcedure.query(() => []),
  getStats: publicProcedure.query(() => ({
    totalSuppliers: 25,
    pendingVerifications: 0,
    totalFeedstocks: 10,
    activeFutures: 5,
  })),
});

// =============================================================================
// Mock Demand Signals Router
// =============================================================================

const MOCK_DEMAND_SIGNALS = [
  { id: 1, buyerId: 1, title: "UCO Required - Sydney Metro", feedstockTypes: ["UCO"], volumeRequired: 10000, status: "published", createdAt: new Date().toISOString() },
  { id: 2, buyerId: 2, title: "Tallow for Biodiesel Production", feedstockTypes: ["Tallow"], volumeRequired: 25000, status: "published", createdAt: new Date().toISOString() },
  { id: 3, buyerId: 3, title: "Crop Residues for Biomass Plant", feedstockTypes: ["Wheat Straw", "Sugarcane Bagasse"], volumeRequired: 50000, status: "published", createdAt: new Date().toISOString() },
];

const demandSignalsRouter = router({
  list: publicProcedure
    .input(z.object({ status: z.string().optional() }).optional())
    .query(({ input }) => {
      let results = [...MOCK_DEMAND_SIGNALS];
      if (input?.status) {
        results = results.filter(d => d.status === input.status);
      }
      return results;
    }),

  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(({ input }) => MOCK_DEMAND_SIGNALS.find(d => d.id === input.id) || null),
});

// Auth router for dev login
const authRouter = router({
  me: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.user) {
      return null;
    }
    return ctx.user;
  }),

  logout: publicProcedure.mutation(async ({ ctx }) => {
    // The actual cookie clearing happens in the response headers
    // For now, just return success
    return { success: true };
  }),
});

// API router for Vercel
const apiRouter = router({
  system: router({
    health: publicProcedure
      .input(z.object({ timestamp: z.number().min(0).optional() }).optional())
      .query(() => ({
        ok: true,
        version: "2.9.0",
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || "production",
        hasRouter: { prices: true, auth: true, climateHub: true, rsie: true, projectRegistry: true, feedstocks: true, futures: true, admin: true, demandSignals: true },
      })),
  }),
  prices: pricesRouter,
  auth: authRouter,
  climateHub: climateHubRouter,
  rsie: rsieRouter,
  projectRegistry: projectRegistryRouter,
  feedstocks: feedstocksRouter,
  futures: futuresRouter,
  admin: adminRouter,
  demandSignals: demandSignalsRouter,
});

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "50mb",
    },
  },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const startTime = Date.now();

  try {
    setSecurityHeaders(res);
    if (setCorsHeaders(req, res)) return;

    // Convert Vercel request to Fetch Request
    const url = new URL(req.url || "/", `https://${req.headers.host}`);
    const headers = new Headers();
    for (const [key, value] of Object.entries(req.headers)) {
      if (value) headers.set(key, Array.isArray(value) ? value.join(", ") : value);
    }

    let body: string | undefined;
    if (req.method === "POST" || req.method === "PUT") {
      body = typeof req.body === "string" ? req.body : JSON.stringify(req.body);
    }

    const request = new Request(url, { method: req.method, headers, body });

    // Get cookie header for auth
    const cookieHeader = req.headers.cookie || null;
    const user = await getUserFromCookie(cookieHeader);

    // Use self-contained router with context including user from cookie
    const response = await fetchRequestHandler({
      endpoint: "/api/trpc",
      req: request,
      router: apiRouter,
      createContext: async () => ({ user, cookieHeader }),
    });

    response.headers.forEach((value, key) => res.setHeader(key, value));

    // Check if this was a logout request and clear the session cookie
    const urlPath = url.pathname + url.search;
    if (urlPath.includes("auth.logout")) {
      const isSecure = req.headers.host?.includes("vercel.app") || req.headers["x-forwarded-proto"] === "https";
      res.setHeader("Set-Cookie", [
        `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${isSecure ? "; Secure" : ""}`
      ]);
    }

    res.status(response.status);
    res.send(await response.text());
  } catch (error) {
    handleError(res, error);
  } finally {
    logRequest(req, startTime);
  }
}
