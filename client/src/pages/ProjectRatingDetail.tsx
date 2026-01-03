/**
 * Project Rating Detail - Nextgen Design
 *
 * Features:
 * - Detailed project bankability assessment
 * - Rating breakdown by category
 * - Trend signals (bullish/bearish)
 * - Risk factor indicators
 * - Typography components for consistent styling
 */

import { useRoute, useLocation } from "wouter";
import { H1, H2, H3, H4, Body, MetricValue, DataLabel } from "@/components/Typography";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/Button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft,
  Shield,
  Leaf,
  Cpu,
  Factory,
  TrendingUp,
  TrendingDown,
  Building2,
  MapPin,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Info,
  ExternalLink,
  FileText,
  Minus,
} from "lucide-react";

// Rating color schemes
const getRatingColor = (rating: string) => {
  const colors: Record<string, string> = {
    "AAA": "bg-[#D4AF37] text-black",
    "AA": "bg-emerald-400 text-black",
    "A": "bg-green-500 text-black",
    "BBB": "bg-yellow-500 text-black",
    "BB": "bg-[#D4AF37] text-black",
    "B": "bg-orange-500 text-black",
    "CCC": "bg-red-500 text-black",
    "D": "bg-gray-700 text-black",
    "N/R": "bg-gray-400 text-black",
    "GC1": "bg-[#D4AF37] text-black",
    "GC2": "bg-green-500 text-black",
    "GC3": "bg-[#D4AF37] text-black",
    "GC4": "bg-red-500 text-black",
    "TR1": "bg-[#D4AF37] text-black",
    "TR2": "bg-green-500 text-black",
    "TR3": "bg-[#D4AF37] text-black",
    "TR4": "bg-red-500 text-black",
    "CI-A": "bg-[#D4AF37] text-black",
    "CI-B": "bg-green-500 text-black",
    "CI-C": "bg-[#D4AF37] text-black",
    "CI-D": "bg-red-500 text-black",
    "OQ1": "bg-[#D4AF37] text-black",
    "OQ2": "bg-green-500 text-black",
    "OQ3": "bg-[#D4AF37] text-black",
    "OQ4": "bg-red-500 text-black",
    "GS1": "bg-[#D4AF37] text-black",
    "GS2": "bg-green-500 text-black",
    "GS3": "bg-[#D4AF37] text-black",
    "GS4": "bg-red-500 text-black",
    "N/A": "bg-gray-300 text-gray-600",
  };
  return colors[rating] || "bg-gray-400 text-black";
};

const getSignalColor = (signal: string) => {
  if (signal.includes("BULLISH")) return "text-[#D4AF37] bg-emerald-50 border-emerald-200";
  if (signal.includes("NEUTRAL")) return "text-[#D4AF37] bg-amber-50 border-amber-200";
  if (signal.includes("BEARISH")) return "text-red-600 bg-red-50 border-red-200";
  return "text-gray-600 bg-gray-50 border-gray-200";
};

const getRiskColor = (risk: string) => {
  const level = risk.toLowerCase();
  if (level.includes("very low") || level === "minimal") return "text-[#D4AF37]";
  if (level.includes("low")) return "text-green-600";
  if (level.includes("medium")) return "text-[#D4AF37]";
  if (level.includes("high") || level.includes("critical")) return "text-red-600";
  return "text-gray-600";
};

const getRiskProgress = (risk: string): number => {
  const level = risk.toLowerCase();
  if (level.includes("very low") || level === "minimal") return 10;
  if (level.includes("low") && !level.includes("medium")) return 30;
  if (level.includes("medium-low")) return 40;
  if (level.includes("medium-high")) return 60;
  if (level.includes("medium") && !level.includes("high") && !level.includes("low")) return 50;
  if (level.includes("high") && !level.includes("very") && !level.includes("critical")) return 75;
  if (level.includes("very high") || level.includes("critical")) return 95;
  return 50;
};

// Project data store
const projectsData: Record<string, any> = {
  "malabar-biomethane": {
    id: "malabar-biomethane",
    name: "Malabar Biomethane",
    company: "Jemena/Sydney Water",
    bankability: "A",
    growerContract: "GC1",
    technology: "TR1",
    carbonIntensity: "CI-A",
    ciValue: "~15",
    offtake: "OQ1",
    govSupport: "GS1",
    signal: "BULLISH",
    intensity: 4,
    temporal: "SHORT-TERM",
    pathway: "Anaerobic Digestion",
    feedstock: "Sewage sludge",
    location: "Sydney, NSW",
    status: "Operational",
    funding: "$5.9M ARENA funding secured and disbursed",
    ratings: [
      { dimension: "Overall Bankability", rating: "A", justification: "Operational, utility-grade counterparties, secured feedstock" },
      { dimension: "Grower Contract (GC)", rating: "GC1", justification: "Sewage sludge from Sydney Water — municipal waste guaranteed by population; binding infrastructure agreement" },
      { dimension: "Technology (TR)", rating: "TR1", justification: "Anaerobic digestion + upgrading — mature, proven globally" },
      { dimension: "Carbon Intensity (CI)", rating: "CI-A (~15 gCO₂e/MJ)", justification: "Waste-to-biomethane pathway; avoided methane emissions credit" },
      { dimension: "Offtake Quality (OQ)", rating: "OQ1", justification: "Jemena gas network injection — regulated utility offtaker" },
      { dimension: "Government Support (GS)", rating: "GS1", justification: "$5.9M ARENA funding secured and disbursed" },
    ],
    fearComponents: [
      { risk: "TECHNOLOGY_RISK", level: "Very Low", description: "AD technology mature and proven globally" },
      { risk: "FEEDSTOCK_RISK", level: "Very Low", description: "Municipal waste guaranteed by Sydney population" },
    ],
    criticalGap: null,
  },
  "jet-zero-australia": {
    id: "jet-zero-australia",
    name: "Jet Zero Australia",
    company: "Project Ulysses",
    bankability: "BBB",
    growerContract: "GC3",
    technology: "TR1",
    carbonIntensity: "CI-B",
    ciValue: "~28",
    offtake: "OQ2",
    govSupport: "GS1",
    signal: "NEUTRAL-BULLISH",
    intensity: 3,
    temporal: "MEDIUM-TERM",
    pathway: "ATJ (Alcohol-to-Jet)",
    feedstock: "Ethanol from sugarcane/wheat",
    location: "Queensland",
    status: "Development",
    funding: "$14M secured (ARENA $9M + QLD QNIDS $5M)",
    ratings: [
      { dimension: "Overall Bankability", rating: "BBB", justification: "Strong technology/partners but critical feedstock gap" },
      { dimension: "Grower Contract (GC)", rating: "GC3", justification: "CEO states reliance on \"excess ethanol supply\" — spot market assumption; no disclosed supplier contracts with Manildra or others" },
      { dimension: "Technology (TR)", rating: "TR1", justification: "LanzaJet ATJ commercial at Freedom Pines (USA); proven" },
      { dimension: "Carbon Intensity (CI)", rating: "CI-B (~28 gCO₂e/MJ)", justification: "Ethanol from sugarcane/wheat residues pathway; 70% reduction claimed" },
      { dimension: "Offtake Quality (OQ)", rating: "OQ2", justification: "Qantas binding HOA — investment-grade counterparty" },
      { dimension: "Government Support (GS)", rating: "GS1", justification: "$14M secured (ARENA $9M + QLD QNIDS $5M)" },
    ],
    fearComponents: [
      { risk: "FEEDSTOCK_RISK", level: "HIGH", description: "No disclosed ethanol supply contracts" },
      { risk: "COUNTERPARTY_RISK", level: "Low", description: "Qantas, Airbus, Idemitsu backing" },
      { risk: "TECHNOLOGY_RISK", level: "Very Low", description: "LanzaJet proven" },
      { risk: "REGULATORY_RISK", level: "Medium", description: "Awaiting federal SAF mandate" },
    ],
    criticalGap: {
      claimed: "\"Contracted bioethanol from east coast suppliers\"",
      evidence: "CEO interview states \"leverage Australia's excess ethanol supply\"",
      status: "NO DISCLOSED CONTRACTS with Manildra, Wilmar, or any ethanol producer",
      risk: "If E10 mandates enforced or export demand increases, \"excess\" disappears",
    },
  },
  "ampol-graincorp-ifm": {
    id: "ampol-graincorp-ifm",
    name: "Ampol-GrainCorp-IFM",
    company: "Brisbane Renewable Fuels",
    bankability: "BBB",
    growerContract: "GC3",
    technology: "TR1",
    carbonIntensity: "CI-B",
    ciValue: "~30",
    offtake: "OQ3",
    govSupport: "GS1",
    signal: "NEUTRAL",
    intensity: 3,
    temporal: "MEDIUM-TERM",
    pathway: "HEFA",
    feedstock: "Canola/Tallow/UCO",
    location: "Brisbane, QLD",
    status: "Development",
    funding: "$14.1M ARENA funding (Ampol $8M + GrainCorp $6.1M)",
    ratings: [
      { dimension: "Overall Bankability", rating: "BBB", justification: "Strong consortium but aggregator model ≠ supply security" },
      { dimension: "Grower Contract (GC)", rating: "GC3", justification: "GrainCorp operates seasonal/spot canola purchasing; NEXT program is certification not contracts; \"grower support signalled\" by peak bodies ≠ binding commitments" },
      { dimension: "Technology (TR)", rating: "TR1", justification: "HEFA — most commercially proven pathway globally (~40 plants)" },
      { dimension: "Carbon Intensity (CI)", rating: "CI-B (~30 gCO₂e/MJ)", justification: "Canola HEFA pathway; Australian canola 40% lower CI than global average" },
      { dimension: "Offtake Quality (OQ)", rating: "OQ3", justification: "Leveraging Ampol aviation relationships — no binding SAF offtake disclosed" },
      { dimension: "Government Support (GS)", rating: "GS1", justification: "$14.1M ARENA funding (Ampol $8M + GrainCorp $6.1M)" },
    ],
    fearComponents: [
      { risk: "FEEDSTOCK_RISK", level: "HIGH", description: "GrainCorp has no grower contracts; aggregator model" },
      { risk: "MARKET_RISK", level: "Medium", description: "Export competition ($4B/year feedstock exports)" },
      { risk: "POLICY_RISK", level: "Medium", description: "Awaiting mandate certainty" },
      { risk: "COUNTERPARTY_RISK", level: "Low", description: "ASX-listed consortium partners" },
    ],
    criticalGap: {
      claimed: "\"GrainCorp integration provides feedstock security\"",
      evidence: "GrainCorp purchases canola seasonally from growers",
      status: "NO DISCLOSED multi-year grower supply agreements",
      risk: "Growers can sell to any buyer including export (currently higher value). Competitor Risk: CBH pursuing BP partnership in WA — may redirect WA canola",
    },
  },
  "licella-holdings": {
    id: "licella-holdings",
    name: "Licella Holdings",
    company: "Project Swift (Bundaberg)",
    bankability: "BB",
    growerContract: "GC3",
    technology: "TR2",
    carbonIntensity: "CI-B",
    ciValue: "~30",
    offtake: "OQ3",
    govSupport: "GS1",
    signal: "NEUTRAL",
    intensity: 2,
    temporal: "LONG-TERM",
    pathway: "HTL (Hydrothermal Liquefaction)",
    feedstock: "Bagasse",
    location: "Bundaberg, QLD",
    status: "Development",
    funding: "$8M ARENA funding secured",
    ratings: [
      { dimension: "Overall Bankability", rating: "BB", justification: "Strong technology; feedstock security significantly overstated" },
      { dimension: "Grower Contract (GC)", rating: "GC3", justification: "Isis Central Sugar Mill \"partnership\" — mill itself notes infrastructure challenges and viability concerns; growers supply mill voluntarily" },
      { dimension: "Technology (TR)", rating: "TR2", justification: "Cat-HTR commercial at Chuntoh Ghuna (Canada) — first commercial HTL plant" },
      { dimension: "Carbon Intensity (CI)", rating: "CI-B (~30 gCO₂e/MJ)", justification: "Bagasse HTL pathway; 80% reduction claimed" },
      { dimension: "Offtake Quality (OQ)", rating: "OQ3", justification: "Shell upgrading partnership; Japan consortium MoU — no binding SAF sales" },
      { dimension: "Government Support (GS)", rating: "GS1", justification: "$8M ARENA funding secured" },
    ],
    fearComponents: [
      { risk: "FEEDSTOCK_RISK", level: "VERY HIGH", description: "Mill viability questioned; no grower contracts" },
      { risk: "COUNTERPARTY_RISK", level: "High", description: "Mill partnership, not contract" },
      { risk: "TECHNOLOGY_RISK", level: "Low-Medium", description: "HTL commercial but Australian first-of-kind" },
      { risk: "MARKET_RISK", level: "Medium", description: "SAF upgrading pathway via Shell" },
    ],
    criticalGap: {
      claimed: "\"Co-location with Isis Central Sugar Mill provides assured bagasse\"",
      evidence: "Mill's parliamentary submission: \"ageing infrastructure is a key barrier\"; Mill needs \"investment to ensure ICSM can be both economically sustainable\"; Bagasse availability depends on growers continuing to supply THIS mill",
      status: "NO BINDING AGREEMENT with mill; NO grower contracts disclosed",
      risk: "If growers exit sugarcane (macadamia, avocado, retirement), bagasse disappears",
    },
    growerExitScenarios: [
      { scenario: "Status quo — growers continue", probability: "60%", bagasseImpact: "100% supply", viability: "Viable" },
      { scenario: "Partial grower exit (20%)", probability: "25%", bagasseImpact: "80% supply", viability: "Reduced capacity" },
      { scenario: "Significant grower exit (40%)", probability: "10%", bagasseImpact: "60% supply", viability: "Marginal" },
      { scenario: "Mill closure/consolidation", probability: "5%", bagasseImpact: "0% supply", viability: "Project fails" },
    ],
  },
  "rda-charters-towers": {
    id: "rda-charters-towers",
    name: "RDA Charters Towers",
    company: "Pentland Project",
    bankability: "CCC",
    growerContract: "GC4",
    technology: "TR2",
    carbonIntensity: "CI-B",
    ciValue: "~25",
    offtake: "OQ2",
    govSupport: "GS4",
    signal: "BEARISH",
    intensity: 1,
    temporal: "SPECULATIVE",
    pathway: "ATJ (KBR PureSAF)",
    feedstock: "Sugarcane (proposed greenfield)",
    location: "Charters Towers, QLD",
    status: "Speculative",
    funding: "No disclosed federal/state funding",
    ratings: [
      { dimension: "Overall Bankability", rating: "CCC", justification: "Fundamental feasibility questions" },
      { dimension: "Grower Contract (GC)", rating: "GC4", justification: "No cane industry exists in Charters Towers region; requires greenfield agricultural development" },
      { dimension: "Technology (TR)", rating: "TR2", justification: "KBR PureSAF — limited commercial deployment" },
      { dimension: "Carbon Intensity (CI)", rating: "CI-B (~25 gCO₂e/MJ)", justification: "Integrated sugarcane-to-SAF claimed; would be excellent IF feedstock exists" },
      { dimension: "Offtake Quality (OQ)", rating: "OQ2", justification: "Virgin Australia + Qatar Airways partnership" },
      { dimension: "Government Support (GS)", rating: "GS4", justification: "No disclosed federal/state funding" },
    ],
    fearComponents: [
      { risk: "FEEDSTOCK_RISK", level: "CRITICAL", description: "No existing cane industry; water uncertain" },
      { risk: "EXECUTION_RISK", level: "CRITICAL", description: "Requires agricultural + industrial development" },
      { risk: "REGULATORY_RISK", level: "High", description: "Water approvals pending since 2017" },
      { risk: "TECHNOLOGY_RISK", level: "Medium", description: "PureSAF limited commercial track record" },
    ],
    criticalGap: {
      claimed: "\"Sugarcane grown onsite\" — fully integrated model",
      evidence: "Mayor Liz Schmidt: \"valid questions about logistics, water, and agriculture\"; Bob Katter MP: \"I don't know if I'm convinced this will turn into something\"; Region: 140km inland from Townsville — NOT in cane-growing belt; Water: \"Burdekin water consents currently being finalised\" — since 2017+",
      status: "NO land acquisition disclosed; NO water rights secured; NO existing cane cultivation; NO grower contracts (growers don't exist)",
      risk: "Project requires creating agricultural industry from scratch",
    },
  },
  "manildra-group": {
    id: "manildra-group",
    name: "Manildra Group",
    company: "Bioethanol Platform",
    bankability: "BBB",
    growerContract: "GC3",
    technology: "TR1",
    carbonIntensity: "CI-B",
    ciValue: "~32",
    offtake: "OQ3",
    govSupport: "GS1",
    signal: "NEUTRAL",
    intensity: 3,
    temporal: "SHORT-TERM",
    pathway: "First-Generation Ethanol",
    feedstock: "Wheat starch",
    location: "Nowra, NSW",
    status: "Operational",
    funding: "$85M CEFC investment + $95M EFA-guaranteed commercial debt",
    ratings: [
      { dimension: "Overall Bankability", rating: "BBB", justification: "Operational producer with 30+ year track record" },
      { dimension: "Grower Contract (GC)", rating: "GC3", justification: "Seasonal wheat purchasing; family relationships with NSW growers but no disclosed long-term contracts" },
      { dimension: "Technology (TR)", rating: "TR1", justification: "First-generation ethanol — mature, proven" },
      { dimension: "Carbon Intensity (CI)", rating: "CI-B (~32 gCO₂e/MJ)", justification: "Wheat starch ethanol; RSB certified" },
      { dimension: "Offtake Quality (OQ)", rating: "OQ3", justification: "E10 blending market; potential ATJ feedstock supplier" },
      { dimension: "Government Support (GS)", rating: "GS1", justification: "$85M CEFC investment + $95M EFA-guaranteed commercial debt" },
    ],
    fearComponents: [
      { risk: "FEEDSTOCK_RISK", level: "Medium", description: "Seasonal purchasing but 70+ year grower relationships" },
      { risk: "MARKET_RISK", level: "Medium", description: "E10 mandate weak enforcement" },
      { risk: "TECHNOLOGY_RISK", level: "Very Low", description: "Operational since 1991" },
    ],
    criticalGap: null,
  },
  "viva-energy": {
    id: "viva-energy",
    name: "Viva Energy",
    company: "Phased Biofuels Strategy",
    bankability: "BB",
    growerContract: "GC4",
    technology: "TR1",
    carbonIntensity: "CI-B",
    ciValue: "~35",
    offtake: "OQ2",
    govSupport: "GS2",
    signal: "NEUTRAL",
    intensity: 2,
    temporal: "LONG-TERM",
    pathway: "HEFA (Co-processing → Standalone)",
    feedstock: "UCO/Tallow",
    location: "Geelong, VIC",
    status: "Planning",
    funding: "$2.4M ARENA for Brisbane infrastructure",
    ratings: [
      { dimension: "Overall Bankability", rating: "BB", justification: "Phased approach but explicit policy dependency" },
      { dimension: "Grower Contract (GC)", rating: "GC4", justification: "Cleanaway UCO MOU; Gevo HOA — non-binding arrangements" },
      { dimension: "Technology (TR)", rating: "TR1", justification: "Co-processing (Phase 1) proven; HEFA (Phase 3) proven" },
      { dimension: "Carbon Intensity (CI)", rating: "CI-B (~35 gCO₂e/MJ)", justification: "UCO/tallow HEFA pathway" },
      { dimension: "Offtake Quality (OQ)", rating: "OQ2", justification: "Virgin Australia partnership (Proserpine supply)" },
      { dimension: "Government Support (GS)", rating: "GS2", justification: "$2.4M ARENA for Brisbane infrastructure" },
    ],
    fearComponents: [
      { risk: "POLICY_RISK", level: "VERY HIGH", description: "Phase 3 explicitly awaits \"government policy\"" },
      { risk: "FEEDSTOCK_RISK", level: "High", description: "MOUs, not contracts" },
      { risk: "TECHNOLOGY_RISK", level: "Very Low", description: "Proven pathways" },
    ],
    criticalGap: {
      claimed: "\"Phased approach to SAF production\"",
      evidence: "Viva CEO statement: \"Phase 3 investment decision contingent on government policy settings\"",
      status: "Phase 1 (co-processing) underway; Phase 2-3 explicitly awaiting policy certainty",
      risk: "Without federal SAF mandate, Phases 2-3 may not proceed",
    },
  },
  "wagner-sustainable": {
    id: "wagner-sustainable",
    name: "Wagner Sustainable Fuels",
    company: "Wellcamp",
    bankability: "BB",
    growerContract: "GC4",
    technology: "TR2",
    carbonIntensity: "CI-B",
    ciValue: "~30",
    offtake: "OQ3",
    govSupport: "GS3",
    signal: "NEUTRAL",
    intensity: 2,
    temporal: "SHORT/LONG-TERM",
    pathway: "ATJ (CirculAir/LanzaTech)",
    feedstock: "Various (imported for blending)",
    location: "Toowoomba, QLD",
    status: "Blending Operational",
    funding: "QLD feasibility funding",
    ratings: [
      { dimension: "Overall Bankability", rating: "BB", justification: "Blending operational; production pathway unclear" },
      { dimension: "Grower Contract (GC)", rating: "GC4", justification: "Blending imports SAF; Brisbane refinery feedstock unaddressed" },
      { dimension: "Technology (TR)", rating: "TR2", justification: "CirculAir platform (LanzaTech/LanzaJet); FlyORO blending" },
      { dimension: "Carbon Intensity (CI)", rating: "CI-B (~30 gCO₂e/MJ)", justification: "Depends on imported SAF source" },
      { dimension: "Offtake Quality (OQ)", rating: "OQ3", justification: "Regional airline focus; Boeing investor" },
      { dimension: "Government Support (GS)", rating: "GS3", justification: "QLD feasibility funding" },
    ],
    fearComponents: [
      { risk: "FEEDSTOCK_RISK", level: "High", description: "Production feedstock unclear; blending relies on imports" },
      { risk: "TECHNOLOGY_RISK", level: "Medium", description: "CirculAir scaling; LanzaTech proven elsewhere" },
      { risk: "MARKET_RISK", level: "Medium", description: "Regional airline focus limits scale" },
    ],
    criticalGap: {
      claimed: "\"Integrated SAF production and blending hub\"",
      evidence: "FlyORO blending facility operational; Brisbane refinery partnership announced but feedstock sourcing not disclosed",
      status: "Blending operational using imported SAF; domestic production feedstock pathway unclear",
      risk: "Blending success doesn't validate production economics",
    },
  },
  "graincorp-standalone": {
    id: "graincorp-standalone",
    name: "GrainCorp",
    company: "Standalone Biofuels Strategy",
    bankability: "BB",
    growerContract: "GC3",
    technology: "TR1",
    carbonIntensity: "CI-B",
    ciValue: "~28",
    offtake: "OQ3",
    govSupport: "GS2",
    signal: "NEUTRAL-BEARISH",
    intensity: 2,
    temporal: "MEDIUM-TERM",
    pathway: "HEFA",
    feedstock: "Canola (aggregated)",
    location: "Various (East Coast)",
    status: "Strategic",
    funding: "Separate from Ampol consortium funding",
    ratings: [
      { dimension: "Overall Bankability", rating: "BB", justification: "Aggregator model; no grower contracts" },
      { dimension: "Grower Contract (GC)", rating: "GC3", justification: "GrainCorp is grain aggregator — purchases seasonally from growers at market prices; NEXT certification program is sustainability labeling, not supply contracts" },
      { dimension: "Technology (TR)", rating: "TR1", justification: "HEFA pathway proven globally" },
      { dimension: "Carbon Intensity (CI)", rating: "CI-B (~28 gCO₂e/MJ)", justification: "Australian canola HEFA; low-till practices" },
      { dimension: "Offtake Quality (OQ)", rating: "OQ3", justification: "No binding SAF offtake; strategic optionality" },
      { dimension: "Government Support (GS)", rating: "GS2", justification: "Government engagement but separate from consortium" },
    ],
    fearComponents: [
      { risk: "FEEDSTOCK_RISK", level: "HIGH", description: "Aggregator model — growers can sell to any buyer including export" },
      { risk: "MARKET_RISK", level: "High", description: "$4B/year feedstock exports compete for supply" },
      { risk: "COUNTERPARTY_RISK", level: "Low", description: "ASX-listed, investment grade" },
    ],
    criticalGap: {
      claimed: "\"GrainCorp's grower network provides feedstock access\"",
      evidence: "GrainCorp operates as aggregator — buys at harvest, sells to highest bidder; NEXT program certifies sustainability, doesn't guarantee supply",
      status: "NO multi-year supply agreements with growers disclosed",
      risk: "Export markets currently offer higher prices than domestic biofuels can pay",
    },
  },
  "northern-oil-yarwun": {
    id: "northern-oil-yarwun",
    name: "Northern Oil Yarwun",
    company: "Pyrolysis Biocrude Project",
    bankability: "B",
    growerContract: "GC4",
    technology: "TR3",
    carbonIntensity: "CI-C",
    ciValue: "~45",
    offtake: "OQ3",
    govSupport: "GS3",
    signal: "NEUTRAL-BEARISH",
    intensity: 2,
    temporal: "LONG-TERM",
    pathway: "Pyrolysis",
    feedstock: "Mixed biomass",
    location: "Gladstone, QLD",
    status: "Development",
    funding: "State feasibility support",
    ratings: [
      { dimension: "Overall Bankability", rating: "B", justification: "Technology scale-up uncertain; feedstock uncontracted" },
      { dimension: "Grower Contract (GC)", rating: "GC4", justification: "Mixed biomass sourcing — no disclosed supply agreements" },
      { dimension: "Technology (TR)", rating: "TR3", justification: "Pyrolysis pilot scale; commercial scale-up unproven at this configuration" },
      { dimension: "Carbon Intensity (CI)", rating: "CI-C (~45 gCO₂e/MJ)", justification: "Pyrolysis pathway higher CI than HEFA/ATJ; upgrading energy intensive" },
      { dimension: "Offtake Quality (OQ)", rating: "OQ3", justification: "Co-processing discussions with nearby refineries" },
      { dimension: "Government Support (GS)", rating: "GS3", justification: "QLD government engagement; feasibility support" },
    ],
    fearComponents: [
      { risk: "TECHNOLOGY_RISK", level: "High", description: "Pyrolysis biocrude upgrading commercially challenging" },
      { risk: "FEEDSTOCK_RISK", level: "High", description: "Mixed biomass logistics complex; no supply contracts" },
      { risk: "MARKET_RISK", level: "Medium", description: "Biocrude requires refinery co-processing partner" },
    ],
    criticalGap: {
      claimed: "\"Pyrolysis pathway to transport fuels\"",
      evidence: "Pilot operations demonstrated; commercial-scale biocrude upgrading pathway unclear",
      status: "Technology validation ongoing; no binding refinery co-processing agreement",
      risk: "Pyrolysis biocrude quality/stability challenges for refinery acceptance",
    },
  },
  "xcf-global": {
    id: "xcf-global",
    name: "XCF Global",
    company: "Fischer-Tropsch SAF Project",
    bankability: "CCC",
    growerContract: "GC4",
    technology: "TR3",
    carbonIntensity: "CI-C",
    ciValue: "~40",
    offtake: "OQ4",
    govSupport: "GS4",
    signal: "BEARISH",
    intensity: 1,
    temporal: "SPECULATIVE",
    pathway: "Fischer-Tropsch",
    feedstock: "Biomass gasification",
    location: "TBD",
    status: "Early Stage",
    funding: "No disclosed government funding",
    ratings: [
      { dimension: "Overall Bankability", rating: "CCC", justification: "Early stage; F-T unproven at scale for biomass" },
      { dimension: "Grower Contract (GC)", rating: "GC4", justification: "No disclosed feedstock arrangements" },
      { dimension: "Technology (TR)", rating: "TR3", justification: "Fischer-Tropsch proven for gas/coal; biomass gasification F-T limited commercial success globally" },
      { dimension: "Carbon Intensity (CI)", rating: "CI-C (~40 gCO₂e/MJ)", justification: "Biomass F-T pathway; energy intensive process" },
      { dimension: "Offtake Quality (OQ)", rating: "OQ4", justification: "No disclosed offtake discussions" },
      { dimension: "Government Support (GS)", rating: "GS4", justification: "No disclosed government funding applications" },
    ],
    fearComponents: [
      { risk: "TECHNOLOGY_RISK", level: "VERY HIGH", description: "Biomass gasification F-T has poor commercial track record globally" },
      { risk: "FEEDSTOCK_RISK", level: "High", description: "No supply arrangements disclosed" },
      { risk: "EXECUTION_RISK", level: "VERY HIGH", description: "Very early stage; capital intensive pathway" },
      { risk: "MARKET_RISK", level: "High", description: "No offtake interest disclosed" },
    ],
    criticalGap: {
      claimed: "\"Fischer-Tropsch pathway to SAF\"",
      evidence: "Multiple biomass-to-F-T projects globally have failed (e.g., Range Fuels, KiOR, Solena); pathway technically viable but economically challenged",
      status: "Very early stage; no location, no feedstock, no offtake, no funding disclosed",
      risk: "F-T pathway requires massive scale for economics; biomass feedstock quality/consistency challenging",
    },
  },
  "zero-petroleum": {
    id: "zero-petroleum",
    name: "Zero Petroleum",
    company: "e-Fuels / Power-to-Liquid Project",
    bankability: "CCC",
    growerContract: "GC4",
    technology: "TR3",
    carbonIntensity: "CI-A",
    ciValue: "~10*",
    offtake: "OQ3",
    govSupport: "GS3",
    signal: "BEARISH",
    intensity: 1,
    temporal: "SPECULATIVE",
    pathway: "Power-to-Liquid (e-Fuels)",
    feedstock: "Green H2 + CO2 (DAC or point source)",
    location: "TBD",
    status: "Development",
    funding: "State government engagement",
    ratings: [
      { dimension: "Overall Bankability", rating: "CCC", justification: "*CI depends entirely on hydrogen source; e-fuels unproven at scale" },
      { dimension: "Grower Contract (GC)", rating: "GC4", justification: "N/A — e-fuels don't use agricultural feedstock; hydrogen source not secured" },
      { dimension: "Technology (TR)", rating: "TR3", justification: "Power-to-Liquid demonstrated at pilot scale; no commercial SAF-scale plants operating" },
      { dimension: "Carbon Intensity (CI)", rating: "CI-A* (~10 gCO₂e/MJ)", justification: "*Only achievable with 100% renewable electricity for electrolysis; grid power = CI-D" },
      { dimension: "Offtake Quality (OQ)", rating: "OQ3", justification: "Industry interest; no binding agreements" },
      { dimension: "Government Support (GS)", rating: "GS3", justification: "Government engagement; hydrogen strategy alignment" },
    ],
    fearComponents: [
      { risk: "TECHNOLOGY_RISK", level: "High", description: "E-fuels not commercially proven at SAF scale" },
      { risk: "COST_RISK", level: "VERY HIGH", description: "E-fuels currently 5-10x cost of conventional jet fuel" },
      { risk: "INFRASTRUCTURE_RISK", level: "High", description: "Requires massive renewable electricity + electrolyzer capacity" },
      { risk: "EXECUTION_RISK", level: "High", description: "Pathway depends on green hydrogen economics improving dramatically" },
    ],
    criticalGap: {
      claimed: "\"Zero-carbon e-fuels pathway\"",
      evidence: "CI-A rating ONLY valid with 100% renewable electricity; Australian grid ~60% fossil; dedicated renewables required",
      status: "No green hydrogen supply secured; no electrolyzer capacity committed; no DAC/CO2 source confirmed",
      risk: "Economics require green H2 at <$2/kg — current Australian green H2 ~$6-8/kg",
    },
  },
  "ethtec": {
    id: "ethtec",
    name: "Ethtec",
    company: "Cellulosic Ethanol Project",
    bankability: "CCC",
    growerContract: "GC4",
    technology: "TR3",
    carbonIntensity: "CI-B",
    ciValue: "~35",
    offtake: "OQ4",
    govSupport: "GS1",
    signal: "BEARISH",
    intensity: 1,
    temporal: "SPECULATIVE",
    pathway: "Cellulosic Ethanol",
    feedstock: "Lignocellulosic biomass",
    location: "TBD",
    status: "Development",
    funding: "ARENA funding received",
    ratings: [
      { dimension: "Overall Bankability", rating: "CCC", justification: "Cellulosic ethanol globally challenged; no commercial success stories" },
      { dimension: "Grower Contract (GC)", rating: "GC4", justification: "Lignocellulosic feedstock sourcing not disclosed" },
      { dimension: "Technology (TR)", rating: "TR3", justification: "Cellulosic ethanol has struggled globally — DuPont, Abengoa, POET-DSM all faced challenges" },
      { dimension: "Carbon Intensity (CI)", rating: "CI-B (~35 gCO₂e/MJ)", justification: "Cellulosic pathway good CI; IF technology works" },
      { dimension: "Offtake Quality (OQ)", rating: "OQ4", justification: "No disclosed offtake arrangements" },
      { dimension: "Government Support (GS)", rating: "GS1", justification: "ARENA funding for technology development" },
    ],
    fearComponents: [
      { risk: "TECHNOLOGY_RISK", level: "VERY HIGH", description: "Cellulosic ethanol has failed commercially globally multiple times" },
      { risk: "FEEDSTOCK_RISK", level: "High", description: "Lignocellulosic logistics complex; no supply contracts" },
      { risk: "MARKET_RISK", level: "High", description: "No offtake interest disclosed" },
      { risk: "EXECUTION_RISK", level: "VERY HIGH", description: "Technology pathway has poor global track record" },
    ],
    criticalGap: {
      claimed: "\"Advanced cellulosic ethanol technology\"",
      evidence: "Global cellulosic ethanol failures: DuPont Nevada (closed 2017), Abengoa Kansas (bankrupt 2015), POET-DSM (struggled); enzyme costs and pretreatment challenges remain",
      status: "Development stage; no commercial plant announced; no feedstock or offtake secured",
      risk: "Pathway has consumed billions in global investment with limited commercial success",
    },
  },
  "bp-kwinana": {
    id: "bp-kwinana",
    name: "BP Kwinana",
    company: "Refinery Biofuels Conversion",
    bankability: "N/R",
    growerContract: "N/A",
    technology: "TR1",
    carbonIntensity: "CI-B",
    ciValue: "~32",
    offtake: "OQ1",
    govSupport: "GS3",
    signal: "ON HOLD",
    intensity: 0,
    temporal: "-",
    pathway: "HEFA (Refinery Conversion)",
    feedstock: "TBD",
    location: "Kwinana, WA",
    status: "On Hold",
    funding: "Government engagement ongoing",
    ratings: [
      { dimension: "Overall Bankability", rating: "N/R", justification: "ON HOLD — Project paused pending market conditions" },
      { dimension: "Grower Contract (GC)", rating: "N/A", justification: "Project on hold; feedstock strategy not finalized" },
      { dimension: "Technology (TR)", rating: "TR1", justification: "HEFA refinery conversion proven globally (Neste, Marathon, etc.)" },
      { dimension: "Carbon Intensity (CI)", rating: "CI-B (~32 gCO₂e/MJ)", justification: "Depends on feedstock mix selected" },
      { dimension: "Offtake Quality (OQ)", rating: "OQ1", justification: "BP internal offtake capacity; aviation fuel supply agreements" },
      { dimension: "Government Support (GS)", rating: "GS3", justification: "WA and federal government engagement" },
    ],
    fearComponents: [
      { risk: "PROJECT_STATUS", level: "Critical", description: "Project ON HOLD — not proceeding under current conditions" },
      { risk: "POLICY_RISK", level: "High", description: "Decision awaiting federal SAF mandate clarity" },
      { risk: "FEEDSTOCK_RISK", level: "Medium", description: "WA feedstock (canola) competition from CBH/other projects" },
    ],
    criticalGap: {
      claimed: "\"Kwinana refinery conversion to renewable fuels\"",
      evidence: "BP announced pause in 2023 citing \"market conditions\"; awaiting policy certainty before FID",
      status: "PROJECT ON HOLD — Not rateable until decision to proceed",
      risk: "May not proceed without federal SAF mandate; CBH/other WA projects competing for limited feedstock",
    },
  },
  "united-dalby": {
    id: "united-dalby",
    name: "United Dalby",
    company: "Biodiesel Plant",
    bankability: "D",
    growerContract: "N/A",
    technology: "TR1",
    carbonIntensity: "N/A",
    ciValue: "-",
    offtake: "N/A",
    govSupport: "N/A",
    signal: "MOTHBALLED",
    intensity: 0,
    temporal: "-",
    pathway: "Biodiesel (FAME)",
    feedstock: "Tallow/UCO",
    location: "Dalby, QLD",
    status: "Mothballed",
    funding: "N/A — Plant mothballed",
    ratings: [
      { dimension: "Overall Bankability", rating: "D", justification: "MOTHBALLED — Plant not operating" },
      { dimension: "Grower Contract (GC)", rating: "N/A", justification: "Plant mothballed; no active feedstock procurement" },
      { dimension: "Technology (TR)", rating: "TR1", justification: "First-generation biodiesel — mature technology" },
      { dimension: "Carbon Intensity (CI)", rating: "N/A", justification: "Not applicable — plant not operating" },
      { dimension: "Offtake Quality (OQ)", rating: "N/A", justification: "No active offtake" },
      { dimension: "Government Support (GS)", rating: "N/A", justification: "No current government engagement" },
    ],
    fearComponents: [
      { risk: "PROJECT_STATUS", level: "Critical", description: "MOTHBALLED — Not operating" },
    ],
    criticalGap: {
      claimed: "N/A — Plant not operating",
      evidence: "United Biodiesel Dalby plant mothballed due to economic conditions",
      status: "MOTHBALLED — No restart announced",
      risk: "Australian biodiesel economics challenging without mandate support",
    },
  },
  "oceania-biofuels": {
    id: "oceania-biofuels",
    name: "Oceania Biofuels",
    company: "Biodiesel Project",
    bankability: "D",
    growerContract: "N/A",
    technology: "TR1",
    carbonIntensity: "N/A",
    ciValue: "-",
    offtake: "N/A",
    govSupport: "N/A",
    signal: "CANCELLED",
    intensity: 0,
    temporal: "-",
    pathway: "Biodiesel",
    feedstock: "Various",
    location: "Various (proposed)",
    status: "Cancelled",
    funding: "N/A — Project cancelled",
    ratings: [
      { dimension: "Overall Bankability", rating: "D", justification: "CANCELLED — Project did not proceed" },
      { dimension: "Grower Contract (GC)", rating: "N/A", justification: "Project cancelled" },
      { dimension: "Technology (TR)", rating: "TR1", justification: "Biodiesel technology proven" },
      { dimension: "Carbon Intensity (CI)", rating: "N/A", justification: "Not applicable — project cancelled" },
      { dimension: "Offtake Quality (OQ)", rating: "N/A", justification: "Project cancelled" },
      { dimension: "Government Support (GS)", rating: "N/A", justification: "Project cancelled" },
    ],
    fearComponents: [
      { risk: "PROJECT_STATUS", level: "Critical", description: "CANCELLED — Project did not proceed" },
    ],
    criticalGap: {
      claimed: "N/A — Project cancelled",
      evidence: "Oceania Biofuels project announced but did not reach FID",
      status: "CANCELLED",
      risk: "Historical project — not relevant for current investment",
    },
  },
};

// Add aliases for IDs used in BIOFUEL_PROJECTS map markers
projectsData["jet-zero"] = projectsData["jet-zero-australia"];
projectsData["ampol-brisbane"] = projectsData["ampol-graincorp-ifm"];
projectsData["manildra-nowra"] = projectsData["manildra-group"];
projectsData["licella-swift"] = projectsData["licella-holdings"];
projectsData["graincorp-oilseed"] = projectsData["graincorp-standalone"];
projectsData["northern-oil"] = projectsData["northern-oil-yarwun"];

// Default project for unknown IDs
const defaultProject = {
  id: "unknown",
  name: "Project Not Found",
  company: "-",
  bankability: "N/R",
  growerContract: "N/A",
  technology: "N/A",
  carbonIntensity: "N/A",
  ciValue: "-",
  offtake: "N/A",
  govSupport: "N/A",
  signal: "N/A",
  intensity: 0,
  temporal: "-",
  pathway: "-",
  feedstock: "-",
  location: "-",
  status: "-",
  funding: "-",
  ratings: [],
  fearComponents: [],
  criticalGap: null,
};

export default function ProjectRatingDetail() {
  const [, params] = useRoute("/ratings/project/:id");
  const [, setLocation] = useLocation();

  const projectId = params?.id || "";
  const project = projectsData[projectId] || defaultProject;

  if (project.id === "unknown") {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <Card>
          <CardContent className="p-12 text-center">
            <XCircle className="h-12 w-12 text-gray-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Project Not Found</h2>
            <p className="text-gray-600 mb-4">
              The project you're looking for doesn't exist or hasn't been assessed yet.
            </p>
            <Button onClick={() => setLocation("/ratings/projects")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Project Matrix
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" onClick={() => setLocation("/ratings/projects")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold tracking-tight">{project.name}</h1>
              <Badge className={`${getRatingColor(project.bankability)} text-lg px-3 py-1`}>
                {project.bankability}
              </Badge>
            </div>
            <p className="text-gray-600">{project.company}</p>
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {project.location}
              </span>
              <span className="flex items-center gap-1">
                <Factory className="h-3 w-3" />
                {project.pathway}
              </span>
              <Badge variant="outline">{project.status}</Badge>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <Badge variant="outline" className={`${getSignalColor(project.signal)} text-base px-4 py-2`}>
            {project.signal.includes("BULLISH") && <TrendingUp className="h-4 w-4 mr-2" />}
            {project.signal.includes("BEARISH") && <TrendingDown className="h-4 w-4 mr-2" />}
            {project.signal.includes("NEUTRAL") && !project.signal.includes("BULLISH") && !project.signal.includes("BEARISH") && <Minus className="h-4 w-4 mr-2" />}
            ABFI Signal: {project.signal}
          </Badge>
          <div className="text-sm text-gray-600">
            Intensity: {project.intensity}/5 | Temporal: {project.temporal}
          </div>
        </div>
      </div>

      {/* Rating Summary Cards */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
        <Card>
          <CardContent className="p-3 text-center">
            <Shield className="h-4 w-4 mx-auto mb-1 text-blue-600" />
            <Badge className={`${getRatingColor(project.bankability)} text-xs`}>{project.bankability}</Badge>
            <p className="text-xs text-gray-600 mt-1">Bankability</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <Leaf className="h-4 w-4 mx-auto mb-1 text-[#D4AF37]" />
            <Badge className={`${getRatingColor(project.growerContract)} text-xs`}>{project.growerContract}</Badge>
            <p className="text-xs text-gray-600 mt-1">Grower Contract</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <Cpu className="h-4 w-4 mx-auto mb-1 text-purple-600" />
            <Badge className={`${getRatingColor(project.technology)} text-xs`}>{project.technology}</Badge>
            <p className="text-xs text-gray-600 mt-1">Technology</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <Factory className="h-4 w-4 mx-auto mb-1 text-[#D4AF37]" />
            <Badge className={`${getRatingColor(project.carbonIntensity)} text-xs`}>{project.carbonIntensity}</Badge>
            <p className="text-xs text-gray-600 mt-1">Carbon ({project.ciValue})</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <TrendingUp className="h-4 w-4 mx-auto mb-1 text-[#D4AF37]" />
            <Badge className={`${getRatingColor(project.offtake)} text-xs`}>{project.offtake}</Badge>
            <p className="text-xs text-gray-600 mt-1">Offtake</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <Building2 className="h-4 w-4 mx-auto mb-1 text-indigo-600" />
            <Badge className={`${getRatingColor(project.govSupport)} text-xs`}>{project.govSupport}</Badge>
            <p className="text-xs text-gray-600 mt-1">Gov Support</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Detailed Ratings Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Detailed Assessment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Dimension</TableHead>
                  <TableHead className="w-20">Rating</TableHead>
                  <TableHead>Justification</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {project.ratings.map((item: any, idx: number) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium text-sm">{item.dimension}</TableCell>
                    <TableCell>
                      <Badge className={`${getRatingColor(item.rating.split(" ")[0])} text-xs`}>
                        {item.rating.split(" ")[0]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-gray-600">{item.justification}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Fear Components */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Risk Components
            </CardTitle>
            <CardDescription>
              Fear factor analysis for lending decision
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {project.fearComponents.map((item: any, idx: number) => (
              <div key={idx} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{item.risk.replace(/_/g, " ")}</span>
                  <span className={`text-sm font-semibold ${getRiskColor(item.level)}`}>
                    {item.level}
                  </span>
                </div>
                <Progress value={getRiskProgress(item.level)} className="h-2" />
                <p className="text-xs text-gray-600">{item.description}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Critical Gap Analysis */}
      {project.criticalGap && (
        <Card className="border-red-200 bg-red-50/30">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-red-800">
              <XCircle className="h-5 w-5" />
              Critical Gap Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-semibold text-red-900 mb-1">Claimed:</p>
                <p className="text-sm text-red-800 bg-white/50 p-2 rounded">{project.criticalGap.claimed}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-red-900 mb-1">Evidence:</p>
                <p className="text-sm text-red-800 bg-white/50 p-2 rounded">{project.criticalGap.evidence}</p>
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold text-red-900 mb-1">Status:</p>
              <p className="text-sm text-red-800 bg-white/50 p-2 rounded font-medium">{project.criticalGap.status}</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-red-900 mb-1">Risk:</p>
              <p className="text-sm text-red-800 bg-white/50 p-2 rounded">{project.criticalGap.risk}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Grower Exit Scenarios (if applicable) */}
      {project.growerExitScenarios && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Leaf className="h-5 w-5" />
              Grower Exit Scenario Modeling
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Scenario</TableHead>
                  <TableHead className="text-center">Probability</TableHead>
                  <TableHead className="text-center">Bagasse Impact</TableHead>
                  <TableHead className="text-center">Project Viability</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {project.growerExitScenarios.map((item: any, idx: number) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">{item.scenario}</TableCell>
                    <TableCell className="text-center">{item.probability}</TableCell>
                    <TableCell className="text-center">{item.bagasseImpact}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className={
                        item.viability === "Viable" ? "border-[#D4AF37] text-[#D4AF37]" :
                        item.viability === "Reduced capacity" ? "border-[#D4AF37] text-[#D4AF37]" :
                        item.viability === "Marginal" ? "border-orange-500 text-orange-600" :
                        "border-red-500 text-red-600"
                      }>
                        {item.viability}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Project Info Footer */}
      <Card>
        <CardContent className="p-4">
          <div className="grid md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-gray-600">Feedstock</p>
              <p className="font-medium">{project.feedstock}</p>
            </div>
            <div>
              <p className="text-gray-600">Technology Pathway</p>
              <p className="font-medium">{project.pathway}</p>
            </div>
            <div>
              <p className="text-gray-600">Location</p>
              <p className="font-medium">{project.location}</p>
            </div>
            <div>
              <p className="text-gray-600">Government Funding</p>
              <p className="font-medium">{project.funding}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
