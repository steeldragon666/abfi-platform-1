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
        { id: 1, name: "Riverina Canola Project", status: "active", lat: -35.0, lng: 146.0, state: "NSW", score: 82 },
        { id: 2, name: "Wheatbelt UCO Facility", status: "active", lat: -31.5, lng: 117.5, state: "WA", score: 78 },
        { id: 3, name: "Darling Downs Tallow", status: "planning", lat: -27.5, lng: 151.5, state: "QLD", score: 71 },
      ],
      total: 3,
    })),

  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(({ input }) => ({
      id: input.id,
      name: "Sample Project",
      status: "active",
      lat: -33.8,
      lng: 151.2,
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
    .input(z.object({ latitude: z.number(), longitude: z.number() }))
    .query(({ input }) => getMockClimateIntelligence(input.latitude, input.longitude)),

  getProjectsClimate: publicProcedure
    .input(z.object({ projectIds: z.array(z.number()).optional() }))
    .query(() => ({
      projects: [],
      summary: { avgScore: 74, riskCount: 0, alertCount: 0 },
      dataSource: "SILO/BOM (CC BY 4.0)",
    })),

  getRegionalOverview: publicProcedure.query(() => ({
    regions: getMockRegionalOverview(),
    nationalSummary: { avgTemperature: 26, totalRainfall7Day: 45, avgSoilMoisture: 0.38, regionsWithAlerts: 0 },
    lastUpdated: new Date().toISOString(),
    dataSource: { provider: "SILO/BOM", license: "CC BY 4.0" },
  })),

  getClimateAlerts: publicProcedure
    .input(z.object({ states: z.array(z.string()).optional(), severity: z.string().optional() }).optional())
    .query(() => ({ alerts: [], count: 0, dataSource: "Bureau of Meteorology (CC BY 4.0)" })),

  getDataStatus: publicProcedure.query(() => ({
    silo: { status: "operational", lastSync: new Date().toISOString(), recordCount: 15420 },
    bom: { status: "operational", lastSync: new Date().toISOString(), warningCount: 0 },
    satellite: { status: "operational", lastUpdate: new Date(Date.now() - 86400000).toISOString() },
    dataSource: { provider: "SILO/BOM", license: "CC BY 4.0", attribution: "Australian Bureau of Meteorology" },
  })),
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
        version: "2.6.0",
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || "production",
        hasRouter: { prices: true, auth: true, climateHub: true, rsie: true, projectRegistry: true },
      })),
  }),
  prices: pricesRouter,
  auth: authRouter,
  climateHub: climateHubRouter,
  rsie: rsieRouter,
  projectRegistry: projectRegistryRouter,
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
