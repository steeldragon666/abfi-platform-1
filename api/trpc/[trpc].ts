/**
 * tRPC API Route Handler for Vercel Serverless
 * Self-contained with mock data for demo deployments
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { initTRPC } from "@trpc/server";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { z } from "zod";

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
// Self-contained tRPC setup
// =============================================================================

type Context = { user: null };

const t = initTRPC.context<Context>().create();
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

// API router for Vercel
const apiRouter = router({
  system: router({
    health: publicProcedure
      .input(z.object({ timestamp: z.number().min(0).optional() }).optional())
      .query(() => ({
        ok: true,
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || "production",
      })),
  }),
  prices: pricesRouter,
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

    // Use self-contained router with simple context (no auth needed for public endpoints)
    const response = await fetchRequestHandler({
      endpoint: "/api/trpc",
      req: request,
      router: apiRouter,
      createContext: async () => ({ user: null }),
    });

    response.headers.forEach((value, key) => res.setHeader(key, value));
    res.status(response.status);
    res.send(await response.text());
  } catch (error) {
    handleError(res, error);
  } finally {
    logRequest(req, startTime);
  }
}
