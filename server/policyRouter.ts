/**
 * Policy & Carbon Router
 * API endpoints for policy tracking and carbon revenue calculations
 */

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, publicProcedure } from "./_core/trpc";
import { getDb } from "./db";
import {
  policyTimelineEvents,
  policyKanbanItems,
  mandateScenarios,
  offtakeAgreements,
  accuPriceHistory,
  policyConsultations,
} from "../drizzle/schema";
import { eq, desc, gte, lte, and, sql } from "drizzle-orm";
import { carbonStandardsConnector, CarbonStandardArticle, cerConnector, policyDataConnector } from "./connectors";

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

// Mock data generators
function getMockKPIs() {
  return [
    { label: "Active Policies", value: 12, subtitle: "Across all jurisdictions" },
    { label: "Under Review", value: 5, subtitle: "Expected decisions in 2025" },
    { label: "ACCU Price", value: 34.5, subtitle: "Current spot price" },
    { label: "Consultations Open", value: 3, subtitle: "Submissions closing soon" },
  ];
}

function getMockTimeline(year: number) {
  const events = [
    { jurisdiction: "Federal", date: `${year}-01-15`, event_type: "enacted", title: "Safeguard Mechanism Reform Act" },
    { jurisdiction: "NSW", date: `${year}-02-01`, event_type: "consultation_open", title: "Renewable Fuel Standard Consultation" },
    { jurisdiction: "QLD", date: `${year}-03-10`, event_type: "expected_decision", title: "Biofuel Mandate Review" },
    { jurisdiction: "VIC", date: `${year}-04-20`, event_type: "enacted", title: "Zero Emissions Vehicle Roadmap" },
    { jurisdiction: "Federal", date: `${year}-05-15`, event_type: "consultation_open", title: "National Biofuels Strategy" },
    { jurisdiction: "SA", date: `${year}-06-01`, event_type: "expected_decision", title: "Green Hydrogen Action Plan" },
    { jurisdiction: "WA", date: `${year}-07-01`, event_type: "enacted", title: "Renewable Energy Buyback Scheme" },
    { jurisdiction: "Federal", date: `${year}-09-01`, event_type: "expected_decision", title: "Sustainable Aviation Fuel Mandate" },
    { jurisdiction: "NSW", date: `${year}-10-15`, event_type: "enacted", title: "Electric Vehicle Strategy Update" },
    { jurisdiction: "QLD", date: `${year}-11-01`, event_type: "consultation_open", title: "Waste-to-Energy Policy Framework" },
  ];
  return events;
}

function getMockKanban() {
  return {
    proposed: [
      { id: "p1", title: "National B10 Mandate", jurisdiction: "Federal", policy_type: "mandate", status: "proposed" },
      { id: "p2", title: "SAF Production Incentive", jurisdiction: "Federal", policy_type: "incentive", status: "proposed" },
      { id: "p3", title: "Biogas Feed-in Tariff", jurisdiction: "VIC", policy_type: "tariff", status: "proposed" },
    ],
    review: [
      { id: "r1", title: "Renewable Fuel Standard", jurisdiction: "NSW", policy_type: "standard", status: "review" },
      { id: "r2", title: "Biofuel Mandate 2025", jurisdiction: "QLD", policy_type: "mandate", status: "review" },
    ],
    enacted: [
      { id: "e1", title: "Safeguard Mechanism", jurisdiction: "Federal", policy_type: "regulation", status: "enacted" },
      { id: "e2", title: "Renewable Energy Target", jurisdiction: "Federal", policy_type: "target", status: "enacted" },
      { id: "e3", title: "E10 Mandate", jurisdiction: "NSW", policy_type: "mandate", status: "enacted" },
      { id: "e4", title: "E10 Mandate", jurisdiction: "QLD", policy_type: "mandate", status: "enacted" },
    ],
  };
}

function getMockMandateScenarios() {
  return [
    { name: "Current State", mandate_level: "B2", revenue_impact: 12000000 },
    { name: "B5 Scenario", mandate_level: "B5", revenue_impact: 28000000 },
    { name: "B10 Scenario", mandate_level: "B10", revenue_impact: 55000000 },
    { name: "B20 Scenario", mandate_level: "B20", revenue_impact: 105000000 },
  ];
}

function getMockOfftakeMarket() {
  return [
    { offtaker: "Qantas Group", mandate: "SAF Commitment 2030", volume: "100ML/year", term: "10 years", premium: "+15%" },
    { offtaker: "BP Australia", mandate: "B20 Supply", volume: "50ML/year", term: "5 years", premium: "+8%" },
    { offtaker: "Ampol", mandate: "Renewable Diesel", volume: "200ML/year", term: "7 years", premium: "+12%" },
    { offtaker: "Viva Energy", mandate: "Biodiesel Blend", volume: "75ML/year", term: "5 years", premium: "+10%" },
    { offtaker: "Shell Australia", mandate: "SAF Partnership", volume: "150ML/year", term: "8 years", premium: "+18%" },
  ];
}

function getMockACCUPrice() {
  return {
    price: 34.5,
    currency: "AUD",
    unit: "tCO2e",
    change: 1.25,
    change_pct: 3.8,
    source: "Clean Energy Regulator",
    as_of_date: new Date().toISOString().split("T")[0],
  };
}

function getMockConsultations() {
  const now = new Date();
  return [
    {
      id: "c1",
      title: "National Biofuels Strategy Consultation",
      jurisdiction: "Federal",
      opens: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      closes: new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      days_remaining: 15,
      relevance: "high",
      submission_url: "https://consult.industry.gov.au/biofuels",
    },
    {
      id: "c2",
      title: "Renewable Fuel Standard Review",
      jurisdiction: "NSW",
      opens: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      closes: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      days_remaining: 30,
      relevance: "high",
      submission_url: "https://haveyoursay.nsw.gov.au/renewable-fuel",
    },
    {
      id: "c3",
      title: "Waste-to-Energy Framework",
      jurisdiction: "QLD",
      opens: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      closes: new Date(now.getTime() + 45 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      days_remaining: 45,
      relevance: "medium",
      submission_url: "https://www.qld.gov.au/waste-to-energy",
    },
  ];
}

export const policyRouter = router({
  /**
   * Get policy KPIs - fetches real-time data from CER and policy connectors
   */
  getKPIs: publicProcedure.query(async () => {
    try {
      // Fetch data in parallel from connectors and database
      const [accuPrice, kanban, consultations, dbData] = await Promise.all([
        cerConnector.fetchACCUPrice(),
        policyDataConnector.fetchPolicyKanban(),
        policyDataConnector.fetchConsultations(),
        (async () => {
          try {
            const db = await requireDb();
            const [enacted] = await db
              .select({ count: sql<number>`count(*)` })
              .from(policyKanbanItems)
              .where(eq(policyKanbanItems.status, "enacted"));
            const [review] = await db
              .select({ count: sql<number>`count(*)` })
              .from(policyKanbanItems)
              .where(eq(policyKanbanItems.status, "review"));
            return { enacted: enacted?.count || 0, review: review?.count || 0 };
          } catch {
            return null;
          }
        })(),
      ]);

      // Merge database data with connector data
      const enactedCount = dbData?.enacted || kanban.enacted.length;
      const reviewCount = dbData?.review || kanban.review.length;
      const totalPolicies = enactedCount + reviewCount + kanban.proposed.length;

      return [
        { label: "Active Policies", value: totalPolicies, subtitle: "Across all jurisdictions" },
        { label: "Under Review", value: reviewCount + kanban.proposed.length, subtitle: "Expected decisions in 2025" },
        { label: "ACCU Price", value: accuPrice.price, subtitle: `${accuPrice.change_pct >= 0 ? "+" : ""}${accuPrice.change_pct.toFixed(1)}% today` },
        { label: "Consultations Open", value: consultations.length, subtitle: "Submissions closing soon" },
      ];
    } catch (error) {
      console.error("Failed to get policy KPIs:", error);
      // Fallback to connector data only
      try {
        const accuPrice = await cerConnector.fetchACCUPrice();
        const kanban = await policyDataConnector.fetchPolicyKanban();
        const consultations = await policyDataConnector.fetchConsultations();
        return [
          { label: "Active Policies", value: kanban.enacted.length + kanban.review.length + kanban.proposed.length, subtitle: "Across all jurisdictions" },
          { label: "Under Review", value: kanban.review.length + kanban.proposed.length, subtitle: "Expected decisions in 2025" },
          { label: "ACCU Price", value: accuPrice.price, subtitle: `${accuPrice.change_pct >= 0 ? "+" : ""}${accuPrice.change_pct.toFixed(1)}% today` },
          { label: "Consultations Open", value: consultations.length, subtitle: "Submissions closing soon" },
        ];
      } catch {
        return getMockKPIs();
      }
    }
  }),

  /**
   * Get policy timeline events - fetches from policy connector
   */
  getTimeline: publicProcedure
    .input(z.object({ year: z.number().default(2025) }))
    .query(async ({ input }) => {
      try {
        // First try database
        const db = await requireDb();
        const startDate = new Date(input.year, 0, 1);
        const endDate = new Date(input.year, 11, 31);

        const events = await db
          .select()
          .from(policyTimelineEvents)
          .where(and(gte(policyTimelineEvents.date, startDate), lte(policyTimelineEvents.date, endDate)))
          .orderBy(policyTimelineEvents.date);

        if (events.length > 0) {
          return events.map((e) => ({
            jurisdiction: e.jurisdiction,
            date: e.date instanceof Date ? e.date.toISOString().split("T")[0] : String(e.date),
            event_type: e.eventType,
            title: e.title,
            policy_id: e.policyId,
          }));
        }

        // Fall back to connector
        const connectorEvents = await policyDataConnector.fetchPolicyTimeline(input.year);
        return connectorEvents.map((e) => ({
          jurisdiction: e.jurisdiction,
          date: e.date,
          event_type: e.event_type,
          title: e.title,
          policy_id: e.id,
        }));
      } catch (error) {
        console.error("Failed to get timeline:", error);
        // Fall back to connector on error
        try {
          const connectorEvents = await policyDataConnector.fetchPolicyTimeline(input.year);
          return connectorEvents.map((e) => ({
            jurisdiction: e.jurisdiction,
            date: e.date,
            event_type: e.event_type,
            title: e.title,
            policy_id: e.id,
          }));
        } catch {
          return getMockTimeline(input.year);
        }
      }
    }),

  /**
   * Get policy kanban board - fetches from policy connector
   */
  getKanban: publicProcedure.query(async () => {
    try {
      const db = await requireDb();
      const items = await db.select().from(policyKanbanItems);

      if (items.length > 0) {
        const proposed = items.filter((i) => i.status === "proposed").map((i) => ({
          id: String(i.id),
          title: i.title,
          jurisdiction: i.jurisdiction,
          policy_type: i.policyType,
          status: i.status,
          summary: i.summary,
        }));

        const review = items.filter((i) => i.status === "review").map((i) => ({
          id: String(i.id),
          title: i.title,
          jurisdiction: i.jurisdiction,
          policy_type: i.policyType,
          status: i.status,
          summary: i.summary,
        }));

        const enacted = items.filter((i) => i.status === "enacted").map((i) => ({
          id: String(i.id),
          title: i.title,
          jurisdiction: i.jurisdiction,
          policy_type: i.policyType,
          status: i.status,
          summary: i.summary,
        }));

        return { proposed, review, enacted };
      }

      // Fall back to connector
      return await policyDataConnector.fetchPolicyKanban();
    } catch (error) {
      console.error("Failed to get kanban:", error);
      try {
        return await policyDataConnector.fetchPolicyKanban();
      } catch {
        return getMockKanban();
      }
    }
  }),

  /**
   * Get mandate scenarios - fetches from policy connector
   */
  getMandateScenarios: publicProcedure.query(async () => {
    try {
      const db = await requireDb();
      const scenarios = await db.select().from(mandateScenarios);

      if (scenarios.length > 0) {
        return scenarios.map((s) => ({
          name: s.name,
          mandate_level: s.mandateLevel,
          revenue_impact: parseFloat(s.revenueImpact as string),
        }));
      }

      // Fall back to connector
      const connectorScenarios = await policyDataConnector.fetchMandateScenarios();
      return connectorScenarios.map(s => ({
        name: s.name,
        mandate_level: s.mandate_level,
        revenue_impact: s.revenue_impact,
      }));
    } catch (error) {
      console.error("Failed to get mandate scenarios:", error);
      try {
        const connectorScenarios = await policyDataConnector.fetchMandateScenarios();
        return connectorScenarios.map(s => ({
          name: s.name,
          mandate_level: s.mandate_level,
          revenue_impact: s.revenue_impact,
        }));
      } catch {
        return getMockMandateScenarios();
      }
    }
  }),

  /**
   * Get offtake market data - fetches from policy connector
   */
  getOfftakeMarket: publicProcedure.query(async () => {
    try {
      const db = await requireDb();
      const agreements = await db
        .select()
        .from(offtakeAgreements)
        .where(eq(offtakeAgreements.isActive, true));

      if (agreements.length > 0) {
        return agreements.map((a) => ({
          offtaker: a.offtaker,
          mandate: a.mandate,
          volume: a.volume,
          term: a.term,
          premium: a.premium,
        }));
      }

      // Fall back to connector
      return await policyDataConnector.fetchOfftakeMarket();
    } catch (error) {
      console.error("Failed to get offtake market:", error);
      try {
        return await policyDataConnector.fetchOfftakeMarket();
      } catch {
        return getMockOfftakeMarket();
      }
    }
  }),

  /**
   * Get current ACCU price - fetches real-time from CER connector
   */
  getACCUPrice: publicProcedure.query(async () => {
    try {
      // First try to get real-time data from CER
      const livePrice = await cerConnector.fetchACCUPrice();
      
      // Also check DB for comparison/history
      try {
        const db = await requireDb();
        const [latest] = await db
          .select()
          .from(accuPriceHistory)
          .orderBy(desc(accuPriceHistory.date))
          .limit(1);

        // If DB has more recent data, merge it
        if (latest) {
          const dbDate = latest.date instanceof Date ? latest.date : new Date(String(latest.date));
          const liveDate = new Date(livePrice.as_of_date);
          if (dbDate > liveDate) {
            return {
              price: parseFloat(latest.price as string),
              currency: "AUD",
              unit: "tCO2e",
              change: parseFloat(latest.change as string) || livePrice.change,
              change_pct: parseFloat(latest.changePct as string) || livePrice.change_pct,
              source: latest.source || "Clean Energy Regulator",
              as_of_date: dbDate.toISOString().split("T")[0],
            };
          }
        }
      } catch {
        // DB not available, use live data
      }

      return livePrice;
    } catch (error) {
      console.error("Failed to get ACCU price:", error);
      return getMockACCUPrice();
    }
  }),

  /**
   * Calculate carbon revenue
   */
  calculateCarbon: publicProcedure
    .input(
      z.object({
        project_type: z.string(),
        annual_output_tonnes: z.number(),
        emission_factor: z.number(),
        baseline_year: z.number(),
        carbon_price: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      // Calculate ACCU credits based on emission factor and output
      const accuCredits = Math.round(input.annual_output_tonnes * input.emission_factor);

      // Calculate ACCU revenue
      const accuRevenue = accuCredits * input.carbon_price;

      // Safeguard mechanism benefit (estimated at 15% of ACCU revenue for covered facilities)
      const safeguardBenefit = Math.round(accuRevenue * 0.15);

      // Total annual revenue
      const totalAnnualRevenue = accuRevenue + safeguardBenefit;

      // Sensitivity analysis
      const sensitivityLow = Math.round(totalAnnualRevenue * 0.8);
      const sensitivityHigh = Math.round(totalAnnualRevenue * 1.2);

      return {
        accu_credits: accuCredits,
        accu_revenue: Math.round(accuRevenue),
        safeguard_benefit: safeguardBenefit,
        total_annual_revenue: Math.round(totalAnnualRevenue),
        sensitivity_low: sensitivityLow,
        sensitivity_high: sensitivityHigh,
      };
    }),

  /**
   * Get open consultations
   */
  getConsultations: publicProcedure.query(async () => {
    try {
      const db = await requireDb();
      const now = new Date();
      const dbConsultations = await db
        .select()
        .from(policyConsultations)
        .where(gte(policyConsultations.closes, now))
        .orderBy(policyConsultations.closes);

      if (dbConsultations.length > 0) {
        return dbConsultations.map((c) => {
          const closes = c.closes instanceof Date ? c.closes : new Date(c.closes);
          const daysRemaining = Math.ceil((closes.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

          return {
            id: String(c.id),
            title: c.title,
            jurisdiction: c.jurisdiction,
            opens: c.opens instanceof Date ? c.opens.toISOString().split("T")[0] : String(c.opens),
            closes: closes.toISOString().split("T")[0],
            days_remaining: daysRemaining,
            relevance: c.relevance,
            submission_url: c.submissionUrl,
          };
        });
      }

      // Fall back to connector
      return await policyDataConnector.fetchConsultations();
    } catch (error) {
      console.error("Failed to get consultations:", error);
      try {
        return await policyDataConnector.fetchConsultations();
      } catch {
        return getMockConsultations();
      }
    }
  }),

  /**
   * Get carbon standards news and announcements
   * Fetches articles from Verra, Gold Standard, and CFI
   */
  getCarbonStandardsNews: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
        source: z.enum(["all", "verra", "gold_standard", "cfi"]).default("all"),
        category: z.string().optional(),
      }).optional()
    )
    .query(async ({ input }) => {
      try {
        const limit = input?.limit ?? 20;
        const lookbackDate = new Date();
        lookbackDate.setDate(lookbackDate.getDate() - 180);

        let articles = await carbonStandardsConnector.fetchAllArticles(lookbackDate, limit);
        if (articles.length === 0) {
          articles = await carbonStandardsConnector.fetchAllArticles(undefined, limit);
        }

        // Filter by source if specified
        let filtered = articles;
        if (input?.source && input.source !== "all") {
          filtered = articles.filter(a => a.source === input.source);
        }

        // Filter by category if specified
        if (input?.category) {
          filtered = filtered.filter(a => a.category === input.category);
        }

        return {
          articles: filtered.map(a => ({
            id: a.id,
            source: a.source,
            sourceName: a.sourceName,
            title: a.title,
            excerpt: a.excerpt || null,
            url: a.url,
            publishedDate: a.publishedDate.toISOString(),
            category: a.category,
            relevance: a.relevance,
            keywords: a.keywords,
          })),
          totalCount: filtered.length,
          sources: [
            { id: "verra", name: "Verra VCS", color: "#1E88E5" },
            { id: "gold_standard", name: "Gold Standard", color: "#FFB300" },
            { id: "cfi", name: "Carbon Farming Initiative (CER)", color: "#43A047" },
            { id: "iscc", name: "ISCC Certification", color: "#8E24AA" },
            { id: "rsb", name: "RSB Biomaterials", color: "#3949AB" },
            { id: "reuters", name: "Reuters Energy", color: "#FF5722" },
            { id: "bloomberg", name: "Bloomberg Markets", color: "#000000" },
            { id: "carbon_pulse", name: "Carbon Pulse", color: "#009688" },
            { id: "biofuels_digest", name: "Biofuels Digest", color: "#4CAF50" },
            { id: "argus", name: "Argus Media", color: "#2196F3" },
            { id: "icis", name: "ICIS Energy", color: "#FF9800" },
            { id: "platts", name: "Platts Energy", color: "#9C27B0" },
            { id: "energy_intelligence", name: "Energy Intelligence", color: "#607D8B" },
            { id: "renewables_now", name: "Renewables Now", color: "#00BCD4" },
            { id: "cpi", name: "Climate Policy Initiative", color: "#3F51B5" },
            { id: "world_bank", name: "World Bank Climate", color: "#4CAF50" },
            { id: "irena", name: "IRENA", color: "#8BC34A" },
            { id: "iea", name: "IEA Energy", color: "#FFC107" },
            { id: "fao", name: "FAO Climate", color: "#795548" },
            { id: "google_news", name: "Google News", color: "#1A73E8" },
          ],
          categories: [
            "methodology",
            "policy",
            "market_update",
            "project_registration",
            "standard_update",
            "consultation",
            "press_release",
            "report",
            "industry_news",
            "regulatory_update",
            "trade_update",
            "technology_update",
          ],
        };
      } catch (error) {
        console.error("Failed to get carbon standards news:", error);
        // Return mock data as fallback
        return {
          articles: [
            {
              id: "mock-1",
              source: "verra",
              sourceName: "Verra VCS",
              title: "VCS Program Updates for Agriculture Projects",
              excerpt: "New guidance for agricultural carbon projects enhances monitoring requirements.",
              url: "https://verra.org/newsroom",
              publishedDate: new Date().toISOString(),
              category: "methodology",
              relevance: "high",
              keywords: ["vcs", "agriculture", "methodology"],
            },
            {
              id: "mock-2",
              source: "gold_standard",
              sourceName: "Gold Standard",
              title: "Gold Standard Launches Bioenergy Framework Update",
              excerpt: "Enhanced sustainability criteria for bioenergy projects.",
              url: "https://www.goldstandard.org/news",
              publishedDate: new Date().toISOString(),
              category: "standard_update",
              relevance: "high",
              keywords: ["bioenergy", "sustainability"],
            },
            {
              id: "mock-3",
              source: "cfi",
              sourceName: "Carbon Farming Initiative",
              title: "New ACCU Method for Soil Carbon",
              excerpt: "Clean Energy Regulator approves new soil carbon methodology.",
              url: "https://www.cleanenergyregulator.gov.au",
              publishedDate: new Date().toISOString(),
              category: "methodology",
              relevance: "high",
              keywords: ["accu", "soil carbon", "cfi"],
            },
          ],
          totalCount: 3,
          sources: [
            { id: "verra", name: "Verra VCS", color: "#1E88E5" },
            { id: "gold_standard", name: "Gold Standard", color: "#FFB300" },
            { id: "cfi", name: "Carbon Farming Initiative (CER)", color: "#43A047" },
            { id: "iscc", name: "ISCC Certification", color: "#8E24AA" },
            { id: "rsb", name: "RSB Biomaterials", color: "#3949AB" },
            { id: "reuters", name: "Reuters Energy", color: "#FF5722" },
            { id: "bloomberg", name: "Bloomberg Markets", color: "#000000" },
            { id: "carbon_pulse", name: "Carbon Pulse", color: "#009688" },
            { id: "biofuels_digest", name: "Biofuels Digest", color: "#4CAF50" },
            { id: "argus", name: "Argus Media", color: "#2196F3" },
            { id: "icis", name: "ICIS Energy", color: "#FF9800" },
            { id: "platts", name: "Platts Energy", color: "#9C27B0" },
            { id: "energy_intelligence", name: "Energy Intelligence", color: "#607D8B" },
            { id: "renewables_now", name: "Renewables Now", color: "#00BCD4" },
            { id: "cpi", name: "Climate Policy Initiative", color: "#3F51B5" },
            { id: "world_bank", name: "World Bank Climate", color: "#4CAF50" },
            { id: "irena", name: "IRENA", color: "#8BC34A" },
            { id: "iea", name: "IEA Energy", color: "#FFC107" },
            { id: "fao", name: "FAO Climate", color: "#795548" },
          ],
          categories: [
            "methodology",
            "policy",
            "market_update",
            "project_registration",
            "standard_update",
            "consultation",
            "press_release",
            "report",
            "industry_news",
            "regulatory_update",
            "trade_update",
            "technology_update",
          ],
        };
      }
    }),
});

export type PolicyRouter = typeof policyRouter;
