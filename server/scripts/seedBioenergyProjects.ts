/**
 * Seed Script for Bioenergy Projects Registry
 * Run with: npx tsx server/scripts/seedBioenergyProjects.ts
 *
 * Migrates the hardcoded BIOFUEL_PROJECTS from BiomassMap.tsx to the database
 */

import "dotenv/config";
import { getDb } from "../db";
import { bioenergyProjects } from "../../drizzle/schema";

// Source data from BiomassMap.tsx
const BIOFUEL_PROJECTS = [
  {
    id: "malabar-biomethane",
    name: "Malabar Biomethane",
    company: "Jemena/Sydney Water",
    location: "Malabar, NSW",
    lat: -33.9631,
    lng: 151.2552,
    capacity: "95 TJ/yr",
    status: "operational" as const,
    products: ["Biomethane"],
    biomass50km: 180000,
    technology: "Anaerobic Digestion",
    bankability: "A",
    growerContract: "GC1",
    techReadiness: "TR1",
    carbonIntensity: "CI-A",
    ciValue: "~15",
    offtake: "OQ1",
    govSupport: "GS1",
    signal: "BULLISH" as const,
    feedstock: "Sewage sludge",
    notes: "Only project with secured feedstock",
  },
  {
    id: "jet-zero",
    name: "Jet Zero Australia",
    company: "Project Ulysses",
    location: "Townsville, QLD",
    lat: -19.2569,
    lng: 146.8187,
    capacity: "113 ML/yr",
    status: "development" as const,
    products: ["SAF", "Renewable Diesel"],
    biomass50km: 1060000,
    technology: "ATJ (Alcohol-to-Jet)",
    bankability: "BBB",
    growerContract: "GC3",
    techReadiness: "TR1",
    carbonIntensity: "CI-B",
    ciValue: "~28",
    offtake: "OQ2",
    govSupport: "GS1",
    signal: "NEUTRAL-BULLISH" as const,
    feedstock: "Ethanol",
    notes: "Technology proven; feedstock uncontracted",
  },
  {
    id: "ampol-brisbane",
    name: "Ampol-GrainCorp-IFM",
    company: "Brisbane Renewable Fuels",
    location: "Brisbane, QLD",
    lat: -27.4212,
    lng: 153.1281,
    capacity: "450 ML/yr",
    status: "development" as const,
    products: ["SAF", "Renewable Diesel"],
    biomass50km: 142000,
    technology: "HEFA",
    bankability: "BBB",
    growerContract: "GC3",
    techReadiness: "TR1",
    carbonIntensity: "CI-B",
    ciValue: "~30",
    offtake: "OQ3",
    govSupport: "GS1",
    signal: "NEUTRAL" as const,
    feedstock: "Canola/Tallow/UCO",
    notes: "HEFA proven; GrainCorp is aggregator not supplier",
  },
  {
    id: "manildra-nowra",
    name: "Manildra Group",
    company: "Bioethanol Platform",
    location: "Nowra, NSW",
    lat: -34.8816,
    lng: 150.6017,
    capacity: "300 ML/yr",
    status: "operational" as const,
    products: ["Ethanol"],
    biomass50km: 520000,
    technology: "Grain Fermentation",
    bankability: "BBB",
    growerContract: "GC3",
    techReadiness: "TR1",
    carbonIntensity: "CI-B",
    ciValue: "~32",
    offtake: "OQ3",
    govSupport: "GS1",
    signal: "NEUTRAL" as const,
    feedstock: "Wheat starch",
    notes: "Operational producer; seasonal wheat purchasing",
  },
  {
    id: "licella-swift",
    name: "Licella Holdings",
    company: "Project Swift (Bundaberg)",
    location: "Bundaberg, QLD",
    lat: -24.8661,
    lng: 152.3489,
    capacity: "60 ML/yr",
    status: "development" as const,
    products: ["SAF", "Renewable Diesel", "Naphtha"],
    biomass50km: 1430000,
    technology: "HTL (Hydrothermal Liquefaction)",
    bankability: "BB",
    growerContract: "GC3",
    techReadiness: "TR2",
    carbonIntensity: "CI-B",
    ciValue: "~30",
    offtake: "OQ3",
    govSupport: "GS1",
    signal: "NEUTRAL" as const,
    feedstock: "Bagasse",
    notes: "HTL commercial in Canada; Isis Mill partnership unclear",
  },
  {
    id: "viva-energy",
    name: "Viva Energy",
    company: "Phased Biofuels Strategy",
    location: "Geelong, VIC",
    lat: -38.1499,
    lng: 144.3617,
    capacity: "SAF blending",
    status: "development" as const,
    products: ["SAF"],
    biomass50km: 70000,
    technology: "HEFA",
    bankability: "BB",
    growerContract: "GC4",
    techReadiness: "TR1",
    carbonIntensity: "CI-B",
    ciValue: "~35",
    offtake: "OQ2",
    govSupport: "GS2",
    signal: "NEUTRAL" as const,
    feedstock: "UCO/Tallow",
    notes: "Explicit policy dependency stated",
  },
  {
    id: "wagner-sustainable",
    name: "Wagner Sustainable Fuels",
    company: "Wellcamp",
    location: "Toowoomba, QLD",
    lat: -27.5598,
    lng: 151.9507,
    capacity: "TBD",
    status: "development" as const,
    products: ["SAF", "Renewable Diesel"],
    biomass50km: 420000,
    technology: "ATJ",
    bankability: "BB",
    growerContract: "GC4",
    techReadiness: "TR2",
    carbonIntensity: "CI-B",
    ciValue: "~30",
    offtake: "OQ3",
    govSupport: "GS3",
    signal: "NEUTRAL" as const,
    feedstock: "Various (imported)",
    notes: "Blending operational; production feedstock unclear",
  },
  {
    id: "graincorp-oilseed",
    name: "GrainCorp",
    company: "Standalone",
    location: "Numurkah, VIC",
    lat: -36.0893,
    lng: 145.4407,
    capacity: "330,000 t/yr canola",
    status: "development" as const,
    products: ["Canola Oil Feedstock"],
    biomass50km: 860000,
    technology: "HEFA",
    bankability: "BB",
    growerContract: "GC3",
    techReadiness: "TR1",
    carbonIntensity: "CI-B",
    ciValue: "~28",
    offtake: "OQ3",
    govSupport: "GS2",
    signal: "NEUTRAL-BEARISH" as const,
    feedstock: "Canola",
    notes: "Aggregator model; no grower contracts",
  },
  {
    id: "northern-oil",
    name: "Northern Oil Yarwun",
    company: "Pyrolysis Project",
    location: "Gladstone, QLD",
    lat: -23.8300,
    lng: 151.0333,
    capacity: "200 ML",
    status: "development" as const,
    products: ["Biodiesel"],
    biomass50km: 675000,
    technology: "Pyrolysis",
    bankability: "B",
    growerContract: "GC4",
    techReadiness: "TR3",
    carbonIntensity: "CI-C",
    ciValue: "~45",
    offtake: "OQ3",
    govSupport: "GS3",
    signal: "NEUTRAL-BEARISH" as const,
    feedstock: "Mixed biomass",
    notes: "Pyrolysis scale-up uncertain",
  },
  {
    id: "rda-charters-towers",
    name: "RDA Charters Towers",
    company: "Pentland Project",
    location: "Charters Towers, QLD",
    lat: -20.0760,
    lng: 146.2611,
    capacity: "TBD",
    status: "feasibility" as const,
    products: ["SAF"],
    biomass50km: 890000,
    technology: "ATJ (PureSAF)",
    bankability: "CCC",
    growerContract: "GC4",
    techReadiness: "TR2",
    carbonIntensity: "CI-B",
    ciValue: "~25",
    offtake: "OQ2",
    govSupport: "GS4",
    signal: "BEARISH" as const,
    feedstock: "Sugarcane (proposed)",
    notes: "No cane industry in region",
  },
  {
    id: "xcf-global",
    name: "XCF Global",
    company: "F-T Project",
    location: "Gladstone, QLD",
    lat: -23.8489,
    lng: 151.2543,
    capacity: "100 ML/yr",
    status: "feasibility" as const,
    products: ["SAF", "Renewable Diesel"],
    biomass50km: 650000,
    technology: "Fischer-Tropsch",
    bankability: "CCC",
    growerContract: "GC4",
    techReadiness: "TR3",
    carbonIntensity: "CI-C",
    ciValue: "~40",
    offtake: "OQ4",
    govSupport: "GS4",
    signal: "BEARISH" as const,
    feedstock: "Biomass",
    notes: "Early stage; F-T unproven at scale",
  },
  {
    id: "zero-petroleum",
    name: "Zero Petroleum",
    company: "e-Fuels Project",
    location: "Adelaide, SA",
    lat: -34.9285,
    lng: 138.6007,
    capacity: "TBD",
    status: "development" as const,
    products: ["Synthetic e-fuels"],
    biomass50km: 0,
    technology: "Power-to-Liquid",
    bankability: "CCC",
    growerContract: "GC4",
    techReadiness: "TR3",
    carbonIntensity: "CI-A",
    ciValue: "~10*",
    offtake: "OQ3",
    govSupport: "GS3",
    signal: "BEARISH" as const,
    feedstock: "Green H2 + CO2",
    notes: "*CI depends on H2 source; e-fuels unproven",
  },
  {
    id: "ethtec",
    name: "Ethtec",
    company: "Cellulosic Ethanol",
    location: "Mackay, QLD",
    lat: -21.1411,
    lng: 149.1861,
    capacity: "50 ML/yr",
    status: "development" as const,
    products: ["Cellulosic Ethanol"],
    biomass50km: 980000,
    technology: "Cellulosic Ethanol",
    bankability: "CCC",
    growerContract: "GC4",
    techReadiness: "TR3",
    carbonIntensity: "CI-B",
    ciValue: "~35",
    offtake: "OQ4",
    govSupport: "GS1",
    signal: "BEARISH" as const,
    feedstock: "Lignocellulosic",
    notes: "Cellulosic globally challenged",
  },
  {
    id: "bp-kwinana",
    name: "BP Kwinana",
    company: "Refinery Conversion",
    location: "Kwinana, WA",
    lat: -32.2424,
    lng: 115.7722,
    capacity: "10,000 bpd",
    status: "halted" as const,
    products: ["SAF", "Renewable Diesel"],
    biomass50km: 85000,
    technology: "HEFA",
    bankability: "N/R",
    growerContract: "N/A",
    techReadiness: "TR1",
    carbonIntensity: "CI-B",
    ciValue: "~32",
    offtake: "OQ1",
    govSupport: "GS3",
    signal: "ON HOLD" as const,
    feedstock: "TBD",
    notes: "ON HOLD - not rateable",
  },
  {
    id: "united-dalby",
    name: "United Dalby",
    company: "Biodiesel Plant",
    location: "Dalby, QLD",
    lat: -27.1811,
    lng: 151.2658,
    capacity: "80 ML/yr",
    status: "halted" as const,
    products: ["Biodiesel"],
    biomass50km: 380000,
    technology: "Biodiesel",
    bankability: "D",
    growerContract: "N/A",
    techReadiness: "TR1",
    carbonIntensity: "N/A",
    ciValue: "-",
    offtake: "N/A",
    govSupport: "N/A",
    signal: "MOTHBALLED" as const,
    feedstock: "-",
    notes: "MOTHBALLED",
  },
  {
    id: "oceania-biofuels",
    name: "Oceania Biofuels",
    company: "Biodiesel Project",
    location: "Gladstone, QLD",
    lat: -23.8527,
    lng: 151.2300,
    capacity: "500 ML/yr (planned)",
    status: "halted" as const,
    products: ["Biodiesel", "SAF"],
    biomass50km: 650000,
    technology: "HEFA",
    bankability: "D",
    growerContract: "N/A",
    techReadiness: "TR1",
    carbonIntensity: "N/A",
    ciValue: "-",
    offtake: "N/A",
    govSupport: "N/A",
    signal: "CANCELLED" as const,
    feedstock: "-",
    notes: "CANCELLED",
  },
];

// Helper to extract state from location string
function extractState(location: string): "NSW" | "VIC" | "QLD" | "SA" | "WA" | "TAS" | "NT" | "ACT" | null {
  const stateMap: Record<string, "NSW" | "VIC" | "QLD" | "SA" | "WA" | "TAS" | "NT" | "ACT"> = {
    "NSW": "NSW",
    "VIC": "VIC",
    "QLD": "QLD",
    "SA": "SA",
    "WA": "WA",
    "TAS": "TAS",
    "NT": "NT",
    "ACT": "ACT",
  };

  for (const [abbr, state] of Object.entries(stateMap)) {
    if (location.includes(abbr)) {
      return state;
    }
  }
  return null;
}

// Helper to parse CI value
function parseCIValue(ciValue: string): number | null {
  const match = ciValue.match(/~?(\d+)/);
  return match ? parseFloat(match[1]) : null;
}

// Map BiomassMap status to schema status
function mapStatus(status: string): "announced" | "feasibility" | "development" | "construction" | "operational" | "halted" | "cancelled" {
  const statusMap: Record<string, "announced" | "feasibility" | "development" | "construction" | "operational" | "halted" | "cancelled"> = {
    operational: "operational",
    development: "development",
    feasibility: "feasibility",
    pilot: "development",
    halted: "halted",
  };
  return statusMap[status] || "announced";
}

async function seedBioenergyProjects(db: any) {
  console.log("Seeding bioenergy projects...");

  const projects = BIOFUEL_PROJECTS.map((p) => ({
    slug: p.id,
    name: p.name,
    company: p.company,
    location: p.location,
    state: extractState(p.location),
    latitude: p.lat.toString(),
    longitude: p.lng.toString(),
    capacity: p.capacity,
    products: p.products,
    technology: p.technology,
    feedstock: p.feedstock,
    biomass50km: p.biomass50km,
    status: mapStatus(p.status),
    bankabilityRating: p.bankability,
    growerContractRating: p.growerContract,
    techReadinessRating: p.techReadiness,
    carbonIntensityRating: p.carbonIntensity,
    carbonIntensityValue: parseCIValue(p.ciValue)?.toString(),
    offtakeRating: p.offtake,
    govSupportRating: p.govSupport,
    signal: p.signal,
    assessmentNotes: p.notes,
    dataSource: "BiomassMap.tsx migration",
    isPublic: true,
    claimStatus: "unclaimed" as const,
  }));

  // Use insertOrUpdate to avoid duplicates
  for (const project of projects) {
    await db.insert(bioenergyProjects).values(project).onDuplicateKeyUpdate({
      set: {
        name: project.name,
        company: project.company,
        location: project.location,
        state: project.state,
        latitude: project.latitude,
        longitude: project.longitude,
        capacity: project.capacity,
        products: project.products,
        technology: project.technology,
        feedstock: project.feedstock,
        biomass50km: project.biomass50km,
        status: project.status,
        bankabilityRating: project.bankabilityRating,
        growerContractRating: project.growerContractRating,
        techReadinessRating: project.techReadinessRating,
        carbonIntensityRating: project.carbonIntensityRating,
        carbonIntensityValue: project.carbonIntensityValue,
        offtakeRating: project.offtakeRating,
        govSupportRating: project.govSupportRating,
        signal: project.signal,
        assessmentNotes: project.assessmentNotes,
        dataSource: project.dataSource,
      },
    });
  }

  console.log(`  Inserted/updated ${projects.length} bioenergy projects`);
  return projects.length;
}

async function main() {
  console.log("=".repeat(60));
  console.log("ABFI Bioenergy Projects Registry - Seed Script");
  console.log("=".repeat(60));
  console.log();

  try {
    const db = await getDb();
    if (!db) {
      throw new Error("Database not available");
    }

    const count = await seedBioenergyProjects(db);

    console.log();
    console.log("=".repeat(40));
    console.log("Summary:");
    console.log(`  Bioenergy projects: ${count}`);
    console.log("=".repeat(60));
    console.log("Seeding complete!");
    console.log("=".repeat(60));
  } catch (error) {
    console.error("Seeding failed:", error);
    process.exit(1);
  }

  process.exit(0);
}

main();
