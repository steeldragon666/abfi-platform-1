/**
 * Seed script to migrate BiomassMap BIOFUEL_PROJECTS to the database
 * Run with: npx tsx server/seedBioenergyProjects.ts
 */

import "dotenv/config";
import { getDb } from "./db";
import { bioenergyProjects } from "../drizzle/schema";

// Signal type as defined in schema
type SignalType = "BULLISH" | "NEUTRAL-BULLISH" | "NEUTRAL" | "NEUTRAL-BEARISH" | "BEARISH" | "ON HOLD" | "MOTHBALLED" | "CANCELLED";
type StatusType = "announced" | "feasibility" | "development" | "construction" | "operational" | "halted" | "cancelled";
type StateType = "NSW" | "VIC" | "QLD" | "SA" | "WA" | "TAS" | "NT" | "ACT";

interface ProjectData {
  slug: string;
  name: string;
  company: string;
  parentCompany?: string;
  projectCode?: string;
  location: string;
  state: StateType;
  latitude: string;
  longitude: string;
  capacity: string;
  capacityValue?: number;
  capacityUnit?: string;
  status: StatusType;
  products: string[];
  biomass50km: number;
  technology: string;
  feedstock: string;
  bankabilityRating: string;
  growerContractRating: string;
  techReadinessRating: string;
  carbonIntensityRating: string;
  carbonIntensityValue?: string; // Stored as string in notes, numeric extracted if possible
  offtakeRating: string;
  govSupportRating: string;
  signal: SignalType;
  description: string;
}

// Data from BiomassMap.tsx BIOFUEL_PROJECTS array
const BIOFUEL_PROJECTS: ProjectData[] = [
  {
    slug: "malabar-biomethane",
    name: "Malabar Biomethane",
    company: "Jemena",
    parentCompany: "Sydney Water",
    location: "Malabar, NSW",
    state: "NSW",
    latitude: "-33.9631",
    longitude: "151.2552",
    capacity: "95 TJ/yr",
    capacityValue: 95,
    capacityUnit: "TJ/yr",
    status: "operational",
    products: ["Biomethane"],
    biomass50km: 180000,
    technology: "Anaerobic Digestion",
    feedstock: "Sewage sludge",
    bankabilityRating: "A",
    growerContractRating: "GC1",
    techReadinessRating: "TR1",
    carbonIntensityRating: "CI-A",
    carbonIntensityValue: "15",
    offtakeRating: "OQ1",
    govSupportRating: "GS1",
    signal: "BULLISH",
    description: "Only project with secured feedstock",
  },
  {
    slug: "jet-zero",
    name: "Jet Zero Australia",
    company: "Jet Zero Australia",
    projectCode: "Project Ulysses",
    location: "Townsville, QLD",
    state: "QLD",
    latitude: "-19.2569",
    longitude: "146.8187",
    capacity: "113 ML/yr",
    capacityValue: 113,
    capacityUnit: "ML/yr",
    status: "development",
    products: ["SAF", "Renewable Diesel"],
    biomass50km: 1060000,
    technology: "ATJ (Alcohol-to-Jet)",
    feedstock: "Ethanol",
    bankabilityRating: "BBB",
    growerContractRating: "GC3",
    techReadinessRating: "TR1",
    carbonIntensityRating: "CI-B",
    carbonIntensityValue: "28",
    offtakeRating: "OQ2",
    govSupportRating: "GS1",
    signal: "NEUTRAL-BULLISH",
    description: "Technology proven; feedstock uncontracted",
  },
  {
    slug: "ampol-brisbane",
    name: "Ampol-GrainCorp-IFM",
    company: "Brisbane Renewable Fuels",
    parentCompany: "Ampol/GrainCorp/IFM",
    location: "Brisbane, QLD",
    state: "QLD",
    latitude: "-27.4212",
    longitude: "153.1281",
    capacity: "450 ML/yr",
    capacityValue: 450,
    capacityUnit: "ML/yr",
    status: "development",
    products: ["SAF", "Renewable Diesel"],
    biomass50km: 142000,
    technology: "HEFA",
    feedstock: "Canola/Tallow/UCO",
    bankabilityRating: "BBB",
    growerContractRating: "GC3",
    techReadinessRating: "TR1",
    carbonIntensityRating: "CI-B",
    carbonIntensityValue: "30",
    offtakeRating: "OQ3",
    govSupportRating: "GS1",
    signal: "NEUTRAL",
    description: "HEFA proven; GrainCorp is aggregator not supplier",
  },
  {
    slug: "manildra-nowra",
    name: "Manildra Group",
    company: "Manildra Group",
    projectCode: "Bioethanol Platform",
    location: "Nowra, NSW",
    state: "NSW",
    latitude: "-34.8816",
    longitude: "150.6017",
    capacity: "300 ML/yr",
    capacityValue: 300,
    capacityUnit: "ML/yr",
    status: "operational",
    products: ["Ethanol"],
    biomass50km: 520000,
    technology: "Grain Fermentation",
    feedstock: "Wheat starch",
    bankabilityRating: "BBB",
    growerContractRating: "GC3",
    techReadinessRating: "TR1",
    carbonIntensityRating: "CI-B",
    carbonIntensityValue: "32",
    offtakeRating: "OQ3",
    govSupportRating: "GS1",
    signal: "NEUTRAL",
    description: "Operational producer; seasonal wheat purchasing",
  },
  {
    slug: "licella-swift",
    name: "Licella Holdings",
    company: "Licella Holdings",
    projectCode: "Project Swift (Bundaberg)",
    location: "Bundaberg, QLD",
    state: "QLD",
    latitude: "-24.8661",
    longitude: "152.3489",
    capacity: "60 ML/yr",
    capacityValue: 60,
    capacityUnit: "ML/yr",
    status: "development",
    products: ["SAF", "Renewable Diesel", "Naphtha"],
    biomass50km: 1430000,
    technology: "HTL (Hydrothermal Liquefaction)",
    feedstock: "Bagasse",
    bankabilityRating: "BB",
    growerContractRating: "GC3",
    techReadinessRating: "TR2",
    carbonIntensityRating: "CI-B",
    carbonIntensityValue: "30",
    offtakeRating: "OQ3",
    govSupportRating: "GS1",
    signal: "NEUTRAL",
    description: "HTL commercial in Canada; Isis Mill partnership unclear",
  },
  {
    slug: "viva-energy",
    name: "Viva Energy",
    company: "Viva Energy",
    projectCode: "Phased Biofuels Strategy",
    location: "Geelong, VIC",
    state: "VIC",
    latitude: "-38.1499",
    longitude: "144.3617",
    capacity: "SAF blending",
    status: "development",
    products: ["SAF"],
    biomass50km: 70000,
    technology: "HEFA",
    feedstock: "UCO/Tallow",
    bankabilityRating: "BB",
    growerContractRating: "GC4",
    techReadinessRating: "TR1",
    carbonIntensityRating: "CI-B",
    carbonIntensityValue: "35",
    offtakeRating: "OQ2",
    govSupportRating: "GS2",
    signal: "NEUTRAL",
    description: "Explicit policy dependency stated",
  },
  {
    slug: "wagner-sustainable",
    name: "Wagner Sustainable Fuels",
    company: "Wagner Sustainable Fuels",
    projectCode: "Wellcamp",
    location: "Toowoomba, QLD",
    state: "QLD",
    latitude: "-27.5598",
    longitude: "151.9507",
    capacity: "TBD",
    status: "development",
    products: ["SAF", "Renewable Diesel"],
    biomass50km: 420000,
    technology: "ATJ",
    feedstock: "Various (imported)",
    bankabilityRating: "BB",
    growerContractRating: "GC4",
    techReadinessRating: "TR2",
    carbonIntensityRating: "CI-B",
    carbonIntensityValue: "30",
    offtakeRating: "OQ3",
    govSupportRating: "GS3",
    signal: "NEUTRAL",
    description: "Blending operational; production feedstock unclear",
  },
  {
    slug: "graincorp-oilseed",
    name: "GrainCorp",
    company: "GrainCorp",
    projectCode: "Standalone Oilseed Processing",
    location: "Numurkah, VIC",
    state: "VIC",
    latitude: "-36.0893",
    longitude: "145.4407",
    capacity: "330,000 t/yr canola",
    capacityValue: 330000,
    capacityUnit: "t/yr",
    status: "development",
    products: ["Canola Oil Feedstock"],
    biomass50km: 860000,
    technology: "HEFA",
    feedstock: "Canola",
    bankabilityRating: "BB",
    growerContractRating: "GC3",
    techReadinessRating: "TR1",
    carbonIntensityRating: "CI-B",
    carbonIntensityValue: "28",
    offtakeRating: "OQ3",
    govSupportRating: "GS2",
    signal: "NEUTRAL-BEARISH",
    description: "Aggregator model; no grower contracts",
  },
  {
    slug: "northern-oil",
    name: "Northern Oil Yarwun",
    company: "Northern Oil",
    projectCode: "Pyrolysis Project",
    location: "Gladstone, QLD",
    state: "QLD",
    latitude: "-23.8300",
    longitude: "151.0333",
    capacity: "200 ML",
    capacityValue: 200,
    capacityUnit: "ML",
    status: "development",
    products: ["Biodiesel"],
    biomass50km: 675000,
    technology: "Pyrolysis",
    feedstock: "Mixed biomass",
    bankabilityRating: "B",
    growerContractRating: "GC4",
    techReadinessRating: "TR3",
    carbonIntensityRating: "CI-C",
    carbonIntensityValue: "45",
    offtakeRating: "OQ3",
    govSupportRating: "GS3",
    signal: "NEUTRAL-BEARISH",
    description: "Pyrolysis scale-up uncertain",
  },
  {
    slug: "rda-charters-towers",
    name: "RDA Charters Towers",
    company: "Regional Development Australia",
    projectCode: "Pentland Project",
    location: "Charters Towers, QLD",
    state: "QLD",
    latitude: "-20.0760",
    longitude: "146.2611",
    capacity: "TBD",
    status: "feasibility",
    products: ["SAF"],
    biomass50km: 890000,
    technology: "ATJ (PureSAF)",
    feedstock: "Sugarcane (proposed)",
    bankabilityRating: "CCC",
    growerContractRating: "GC4",
    techReadinessRating: "TR2",
    carbonIntensityRating: "CI-B",
    carbonIntensityValue: "25",
    offtakeRating: "OQ2",
    govSupportRating: "GS4",
    signal: "BEARISH",
    description: "No cane industry in region",
  },
  {
    slug: "xcf-global",
    name: "XCF Global",
    company: "XCF Global",
    projectCode: "F-T Project",
    location: "Gladstone, QLD",
    state: "QLD",
    latitude: "-23.8489",
    longitude: "151.2543",
    capacity: "100 ML/yr",
    capacityValue: 100,
    capacityUnit: "ML/yr",
    status: "feasibility",
    products: ["SAF", "Renewable Diesel"],
    biomass50km: 650000,
    technology: "Fischer-Tropsch",
    feedstock: "Biomass",
    bankabilityRating: "CCC",
    growerContractRating: "GC4",
    techReadinessRating: "TR3",
    carbonIntensityRating: "CI-C",
    carbonIntensityValue: "40",
    offtakeRating: "OQ4",
    govSupportRating: "GS4",
    signal: "BEARISH",
    description: "Early stage; F-T unproven at scale",
  },
  {
    slug: "zero-petroleum",
    name: "Zero Petroleum",
    company: "Zero Petroleum",
    projectCode: "e-Fuels Project",
    location: "Adelaide, SA",
    state: "SA",
    latitude: "-34.9285",
    longitude: "138.6007",
    capacity: "TBD",
    status: "development",
    products: ["Synthetic e-fuels"],
    biomass50km: 0,
    technology: "Power-to-Liquid",
    feedstock: "Green H2 + CO2",
    bankabilityRating: "CCC",
    growerContractRating: "GC4",
    techReadinessRating: "TR3",
    carbonIntensityRating: "CI-A",
    carbonIntensityValue: "10",
    offtakeRating: "OQ3",
    govSupportRating: "GS3",
    signal: "BEARISH",
    description: "CI depends on H2 source; e-fuels unproven",
  },
  {
    slug: "ethtec",
    name: "Ethtec",
    company: "Ethtec",
    projectCode: "Cellulosic Ethanol",
    location: "Mackay, QLD",
    state: "QLD",
    latitude: "-21.1411",
    longitude: "149.1861",
    capacity: "50 ML/yr",
    capacityValue: 50,
    capacityUnit: "ML/yr",
    status: "development",
    products: ["Cellulosic Ethanol"],
    biomass50km: 980000,
    technology: "Cellulosic Ethanol",
    feedstock: "Lignocellulosic",
    bankabilityRating: "CCC",
    growerContractRating: "GC4",
    techReadinessRating: "TR3",
    carbonIntensityRating: "CI-B",
    carbonIntensityValue: "35",
    offtakeRating: "OQ4",
    govSupportRating: "GS1",
    signal: "BEARISH",
    description: "Cellulosic globally challenged",
  },
  {
    slug: "bp-kwinana",
    name: "BP Kwinana",
    company: "BP",
    projectCode: "Refinery Conversion",
    location: "Kwinana, WA",
    state: "WA",
    latitude: "-32.2424",
    longitude: "115.7722",
    capacity: "10,000 bpd",
    status: "halted",
    products: ["SAF", "Renewable Diesel"],
    biomass50km: 85000,
    technology: "HEFA",
    feedstock: "TBD",
    bankabilityRating: "N/R",
    growerContractRating: "N/A",
    techReadinessRating: "TR1",
    carbonIntensityRating: "CI-B",
    carbonIntensityValue: "32",
    offtakeRating: "OQ1",
    govSupportRating: "GS3",
    signal: "ON HOLD",
    description: "ON HOLD — not rateable",
  },
  {
    slug: "united-dalby",
    name: "United Dalby",
    company: "United Dalby",
    projectCode: "Biodiesel Plant",
    location: "Dalby, QLD",
    state: "QLD",
    latitude: "-27.1811",
    longitude: "151.2658",
    capacity: "80 ML/yr",
    capacityValue: 80,
    capacityUnit: "ML/yr",
    status: "halted",
    products: ["Biodiesel"],
    biomass50km: 380000,
    technology: "Biodiesel",
    feedstock: "-",
    bankabilityRating: "D",
    growerContractRating: "N/A",
    techReadinessRating: "TR1",
    carbonIntensityRating: "N/A",
    offtakeRating: "N/A",
    govSupportRating: "N/A",
    signal: "MOTHBALLED",
    description: "MOTHBALLED",
  },
  {
    slug: "oceania-biofuels",
    name: "Oceania Biofuels",
    company: "Oceania Biofuels",
    projectCode: "Biodiesel Project",
    location: "Gladstone, QLD",
    state: "QLD",
    latitude: "-23.8527",
    longitude: "151.2300",
    capacity: "500 ML/yr (planned)",
    capacityValue: 500,
    capacityUnit: "ML/yr",
    status: "halted",
    products: ["Biodiesel", "SAF"],
    biomass50km: 650000,
    technology: "HEFA",
    feedstock: "-",
    bankabilityRating: "D",
    growerContractRating: "N/A",
    techReadinessRating: "TR1",
    carbonIntensityRating: "N/A",
    offtakeRating: "N/A",
    govSupportRating: "N/A",
    signal: "CANCELLED",
    description: "CANCELLED",
  },
];

async function seedBioenergyProjects() {
  console.log("🌱 Starting bioenergy projects seed...");

  try {
    // Get database connection
    const db = await getDb();
    if (!db) {
      throw new Error("Failed to connect to database");
    }

    // Check existing count
    const existingProjects = await db.select().from(bioenergyProjects);
    console.log(`📊 Found ${existingProjects.length} existing projects in database`);

    if (existingProjects.length > 0) {
      console.log("⚠️  Database already has projects. Skipping seed to prevent duplicates.");
      console.log("   To re-seed, first clear the table manually.");
      return;
    }

    // Insert all projects
    console.log(`📝 Inserting ${BIOFUEL_PROJECTS.length} bioenergy projects...`);

    for (const project of BIOFUEL_PROJECTS) {
      // Parse carbon intensity value to numeric (remove ~ and *)
      const ciValue = project.carbonIntensityValue
        ? parseFloat(project.carbonIntensityValue.replace(/[~*]/g, ''))
        : null;

      await db.insert(bioenergyProjects).values({
        slug: project.slug,
        name: project.name,
        company: project.company,
        parentCompany: project.parentCompany,
        projectCode: project.projectCode,
        location: project.location,
        state: project.state,
        latitude: project.latitude,
        longitude: project.longitude,
        capacity: project.capacity,
        capacityValue: project.capacityValue,
        capacityUnit: project.capacityUnit,
        status: project.status,
        products: project.products,
        biomass50km: project.biomass50km,
        technology: project.technology,
        feedstock: project.feedstock,
        bankabilityRating: project.bankabilityRating,
        growerContractRating: project.growerContractRating,
        techReadinessRating: project.techReadinessRating,
        carbonIntensityRating: project.carbonIntensityRating,
        carbonIntensityValue: ciValue ? String(ciValue) : undefined,
        offtakeRating: project.offtakeRating,
        govSupportRating: project.govSupportRating,
        signal: project.signal,
        description: project.description,
        claimStatus: "unclaimed",
        isPublic: true,
      });
      console.log(`   ✅ Inserted: ${project.name}`);
    }

    console.log("\n🎉 Seed complete!");
    console.log(`   Total projects seeded: ${BIOFUEL_PROJECTS.length}`);

    // Verify
    const finalCount = await db.select().from(bioenergyProjects);
    console.log(`   Verified count in database: ${finalCount.length}`);
  } catch (error) {
    console.error("❌ Seed failed:", error);
    throw error;
  }
}

// Run seed
seedBioenergyProjects()
  .then(() => {
    console.log("\n✨ Done!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Fatal error:", error);
    process.exit(1);
  });
