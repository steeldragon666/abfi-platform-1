/**
 * Bankability Ratings - Nextgen Design
 *
 * Features:
 * - ABFI rating framework v3.0 taxonomy
 * - Multi-tier rating scales (AAA to D)
 * - Grower, technology, carbon, offtake ratings
 * - Color-coded rating badges
 * - Typography components for consistent styling
 */

import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/Button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Shield,
  Leaf,
  Cpu,
  Factory,
  TrendingUp,
  Building2,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ArrowRight,
  BarChart3,
  Info,
} from "lucide-react";
import { H1, H2, H3, Body, MetricValue, DataLabel } from "@/components/Typography";

// Rating color schemes
const getRatingColor = (rating: string) => {
  const colors: Record<string, string> = {
    // Overall Bankability
    "AAA": "bg-[#D4AF37] text-black",
    "AA": "bg-emerald-400 text-black",
    "A": "bg-green-500 text-black",
    "BBB": "bg-yellow-500 text-black",
    "BB": "bg-[#D4AF37] text-black",
    "B": "bg-orange-500 text-black",
    "CCC": "bg-red-500 text-black",
    "D": "bg-gray-700 text-black",
    "N/R": "bg-gray-400 text-black",
    // Grower Contract
    "GC1": "bg-[#D4AF37] text-black",
    "GC2": "bg-green-500 text-black",
    "GC3": "bg-[#D4AF37] text-black",
    "GC4": "bg-red-500 text-black",
    // Technology Readiness
    "TR1": "bg-[#D4AF37] text-black",
    "TR2": "bg-green-500 text-black",
    "TR3": "bg-[#D4AF37] text-black",
    "TR4": "bg-red-500 text-black",
    // Carbon Intensity
    "CI-A": "bg-[#D4AF37] text-black",
    "CI-B": "bg-green-500 text-black",
    "CI-C": "bg-[#D4AF37] text-black",
    "CI-D": "bg-red-500 text-black",
    // Offtake Quality
    "OQ1": "bg-[#D4AF37] text-black",
    "OQ2": "bg-green-500 text-black",
    "OQ3": "bg-[#D4AF37] text-black",
    "OQ4": "bg-red-500 text-black",
    // Government Support
    "GS1": "bg-[#D4AF37] text-black",
    "GS2": "bg-green-500 text-black",
    "GS3": "bg-[#D4AF37] text-black",
    "GS4": "bg-red-500 text-black",
  };
  return colors[rating] || "bg-gray-400 text-black";
};

const getSignalColor = (signal: string) => {
  if (signal.includes("BULLISH")) return "text-[#D4AF37] bg-emerald-50";
  if (signal.includes("NEUTRAL")) return "text-[#D4AF37] bg-amber-50";
  if (signal.includes("BEARISH")) return "text-red-600 bg-red-50";
  return "text-gray-600 bg-gray-50";
};

// Rating taxonomy definitions
const bankabilityRatings = [
  { rating: "AAA", definition: "Investment Grade - Exceptional", appetite: "Strong institutional appetite", characteristics: "Proven technology, secured feedstock (GC1), investment-grade offtakers, government funding secured, operational or near-FID" },
  { rating: "AA", definition: "Investment Grade - Strong", appetite: "Broad lender interest", characteristics: "Proven technology, strong feedstock security (GC1-GC2), quality offtakers, government support confirmed" },
  { rating: "A", definition: "Investment Grade - Adequate", appetite: "Selective lender interest", characteristics: "Proven technology, adequate feedstock (GC2), credible offtakers, some government engagement" },
  { rating: "BBB", definition: "Borderline Investment Grade", appetite: "Specialist lender interest", characteristics: "Technology proven elsewhere, feedstock arrangements developing (GC2-GC3), offtake discussions underway" },
  { rating: "BB", definition: "Speculative - Moderate Risk", appetite: "Limited lender pool", characteristics: "Technology scaling, feedstock uncertain (GC3), offtake MOUs only, policy dependent" },
  { rating: "B", definition: "Speculative - High Risk", appetite: "Specialist/venture only", characteristics: "First-of-kind technology, feedstock unproven (GC3-GC4), no binding offtake" },
  { rating: "CCC", definition: "Speculative - Very High Risk", appetite: "Not currently financeable", characteristics: "Unproven technology, no feedstock security (GC4), no counterparties, fundamental feasibility questions" },
];

const growerContractRatings = [
  { rating: "GC1", definition: "Secured - Binding Contracts", status: "Multi-year binding agreements with named growers/cooperatives; volume commitments ≥80% of requirements; price mechanisms disclosed; take-or-pay provisions", risk: "LOW" },
  { rating: "GC2", definition: "Committed - Processor Agreements", status: "Binding agreements with mills/crushers/aggregators; processor has demonstrated grower relationships; volume commitments for project life", risk: "MEDIUM-LOW" },
  { rating: "GC3", definition: "Indicative - MOUs/Partnerships", status: "Non-binding MOUs with processors or industry bodies; \"support\" letters from grower organizations; feasibility-stage discussions; no volume commitments", risk: "MEDIUM-HIGH" },
  { rating: "GC4", definition: "Unsubstantiated - Aspirational", status: "No disclosed feedstock arrangements; claims of \"flexibility\" without supply security; spot market assumptions; greenfield agricultural development required", risk: "HIGH-CRITICAL" },
];

const technologyRatings = [
  { rating: "TR1", trl: "TRL 9", definition: "Commercial - Proven at Scale", status: "Multiple commercial plants operating globally; technology licensor with track record" },
  { rating: "TR2", trl: "TRL 7-8", definition: "Demonstration - Validated", status: "First commercial plant operating or commissioning; technology proven at scale" },
  { rating: "TR3", trl: "TRL 5-6", definition: "Pilot - Scaling", status: "Pilot plant operational; commercial scale-up in progress; technology validation ongoing" },
  { rating: "TR4", trl: "TRL 1-4", definition: "R&D - Developmental", status: "Laboratory or bench scale only; fundamental research phase; commercial pathway unproven" },
];

const carbonIntensityRatings = [
  { rating: "CI-A", range: "≤20 gCO₂e/MJ", reduction: "≥78%", eligibility: "Exceeds all current mandates; premium pricing eligible; CORSIA compliant" },
  { rating: "CI-B", range: "21-35 gCO₂e/MJ", reduction: "61-77%", eligibility: "Meets EU RED III; Cleaner Fuels Program eligible (≤60 threshold); CORSIA compliant" },
  { rating: "CI-C", range: "36-53 gCO₂e/MJ", reduction: "40-60%", eligibility: "Meets basic SAF definitions; may face regulatory threshold risk as standards tighten" },
  { rating: "CI-D", range: "≥54 gCO₂e/MJ", reduction: "<40%", eligibility: "May not qualify as SAF under emerging frameworks; significant regulatory risk" },
];

const offtakeQualityRatings = [
  { rating: "OQ1", definition: "Investment Grade Binding", profile: "Binding HOA/contract with investment-grade counterparty (major airline, fuel major); volume and duration specified" },
  { rating: "OQ2", definition: "Credible Committed", profile: "MOU with named creditworthy counterparty; exclusivity or priority arrangements; pricing framework agreed" },
  { rating: "OQ3", definition: "Indicative Interest", profile: "Letters of support; industry partnership announcements; no volume or price commitment" },
  { rating: "OQ4", definition: "Unsubstantiated", profile: "No disclosed offtake discussions; merchant market assumptions" },
];

const governmentSupportRatings = [
  { rating: "GS1", definition: "Secured - Funds Committed", status: "ARENA/CEFC/state funding agreements executed; funds disbursed or committed" },
  { rating: "GS2", definition: "Approved - Awaiting Disbursement", status: "Funding approved pending milestones; conditional commitments in place" },
  { rating: "GS3", definition: "Engaged - Application Stage", status: "Active applications submitted; feasibility funding received; policy engagement ongoing" },
  { rating: "GS4", definition: "No Government Engagement", status: "No disclosed government funding applications or support" },
];

export default function BankabilityRatings() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <H1 className="text-2xl font-bold tracking-tight">ABFI Bankability Rating Framework</H1>
          <Body className="text-gray-600">Version 3.0 — Australian Biofuels Project Assessment System</Body>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setLocation("/ratings/projects")}>
            <BarChart3 className="h-4 w-4 mr-2" />
            Project Matrix
          </Button>
          <Button onClick={() => setLocation("/ratings/projects")}>
            View All Projects
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card className="col-span-1">
          <CardContent className="p-4 text-center">
            <MetricValue className="text-3xl font-bold text-[#D4AF37]">1</MetricValue>
            <DataLabel className="text-xs text-gray-600">Investment Grade</DataLabel>
          </CardContent>
        </Card>
        <Card className="col-span-1">
          <CardContent className="p-4 text-center">
            <MetricValue className="text-3xl font-bold text-[#D4AF37]">7</MetricValue>
            <DataLabel className="text-xs text-gray-600">Borderline/Spec</DataLabel>
          </CardContent>
        </Card>
        <Card className="col-span-1">
          <CardContent className="p-4 text-center">
            <MetricValue className="text-3xl font-bold text-red-600">5</MetricValue>
            <DataLabel className="text-xs text-gray-600">High Risk</DataLabel>
          </CardContent>
        </Card>
        <Card className="col-span-1">
          <CardContent className="p-4 text-center">
            <MetricValue className="text-3xl font-bold">0</MetricValue>
            <DataLabel className="text-xs text-gray-600">GC1 Projects</DataLabel>
          </CardContent>
        </Card>
        <Card className="col-span-1">
          <CardContent className="p-4 text-center">
            <MetricValue className="text-3xl font-bold text-blue-600">12</MetricValue>
            <DataLabel className="text-xs text-gray-600">TR1-TR2 Tech</DataLabel>
          </CardContent>
        </Card>
        <Card className="col-span-1">
          <CardContent className="p-4 text-center">
            <MetricValue className="text-3xl font-bold text-green-600">89%</MetricValue>
            <DataLabel className="text-xs text-gray-600">CI-A/B Rated</DataLabel>
          </CardContent>
        </Card>
      </div>

      {/* Key Finding Alert */}
      <Card className="border-amber-200 bg-amber-50/50">
        <CardContent className="p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-[#D4AF37] mt-0.5 shrink-0" />
          <div>
            <H3 className="font-semibold text-amber-900">Critical Finding: Universal Grower Contract Gap</H3>
            <Body className="text-sm text-amber-800 mt-1">
              No Australian biofuels project achieves GC1 or GC2. Every project relies on aggregator relationships,
              mill partnerships without grower contracts, spot market assumptions, or non-existent agricultural development.
              Only exception: Malabar Biomethane (municipal waste is population-guaranteed).
            </Body>
          </div>
        </CardContent>
      </Card>

      {/* Rating Taxonomy Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
          <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
          <TabsTrigger value="bankability" className="text-xs">Bankability</TabsTrigger>
          <TabsTrigger value="grower" className="text-xs">Grower Contract</TabsTrigger>
          <TabsTrigger value="technology" className="text-xs">Technology</TabsTrigger>
          <TabsTrigger value="carbon" className="text-xs">Carbon Intensity</TabsTrigger>
          <TabsTrigger value="offtake" className="text-xs">Offtake & Gov</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6 mt-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Overall Bankability Card */}
            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab("bankability")}>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-blue-600" />
                  <CardTitle className="text-base">Overall Bankability</CardTitle>
                </div>
                <CardDescription>AAA → CCC scale</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1 mb-3">
                  {["AAA", "AA", "A", "BBB", "BB", "B", "CCC"].map(r => (
                    <Badge key={r} className={`${getRatingColor(r)} text-xs`}>{r}</Badge>
                  ))}
                </div>
                <Body className="text-xs text-gray-600">
                  Composite rating reflecting overall project financeability based on all sub-ratings
                </Body>
              </CardContent>
            </Card>

            {/* Grower Contract Card */}
            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab("grower")}>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Leaf className="h-5 w-5 text-[#D4AF37]" />
                  <CardTitle className="text-base">Grower Contract Security</CardTitle>
                </div>
                <CardDescription>GC1 → GC4 scale</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1 mb-3">
                  {["GC1", "GC2", "GC3", "GC4"].map(r => (
                    <Badge key={r} className={`${getRatingColor(r)} text-xs`}>{r}</Badge>
                  ))}
                </div>
                <Body className="text-xs text-gray-600">
                  Feedstock supply security from binding contracts to aspirational claims
                </Body>
              </CardContent>
            </Card>

            {/* Technology Readiness Card */}
            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab("technology")}>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Cpu className="h-5 w-5 text-purple-600" />
                  <CardTitle className="text-base">Technology Readiness</CardTitle>
                </div>
                <CardDescription>TR1 → TR4 scale</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1 mb-3">
                  {["TR1", "TR2", "TR3", "TR4"].map(r => (
                    <Badge key={r} className={`${getRatingColor(r)} text-xs`}>{r}</Badge>
                  ))}
                </div>
                <Body className="text-xs text-gray-600">
                  Technology maturity from commercial-proven to R&D stage
                </Body>
              </CardContent>
            </Card>

            {/* Carbon Intensity Card */}
            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab("carbon")}>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Factory className="h-5 w-5 text-[#D4AF37]" />
                  <CardTitle className="text-base">Carbon Intensity</CardTitle>
                </div>
                <CardDescription>CI-A → CI-D scale</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1 mb-3">
                  {["CI-A", "CI-B", "CI-C", "CI-D"].map(r => (
                    <Badge key={r} className={`${getRatingColor(r)} text-xs`}>{r}</Badge>
                  ))}
                </div>
                <Body className="text-xs text-gray-600">
                  Lifecycle GHG emissions vs 89 gCO₂e/MJ baseline
                </Body>
              </CardContent>
            </Card>

            {/* Offtake Quality Card */}
            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab("offtake")}>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-[#D4AF37]" />
                  <CardTitle className="text-base">Offtake Quality</CardTitle>
                </div>
                <CardDescription>OQ1 → OQ4 scale</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1 mb-3">
                  {["OQ1", "OQ2", "OQ3", "OQ4"].map(r => (
                    <Badge key={r} className={`${getRatingColor(r)} text-xs`}>{r}</Badge>
                  ))}
                </div>
                <Body className="text-xs text-gray-600">
                  Offtake agreement quality from binding to unsubstantiated
                </Body>
              </CardContent>
            </Card>

            {/* Government Support Card */}
            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab("offtake")}>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-indigo-600" />
                  <CardTitle className="text-base">Government Support</CardTitle>
                </div>
                <CardDescription>GS1 → GS4 scale</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1 mb-3">
                  {["GS1", "GS2", "GS3", "GS4"].map(r => (
                    <Badge key={r} className={`${getRatingColor(r)} text-xs`}>{r}</Badge>
                  ))}
                </div>
                <Body className="text-xs text-gray-600">
                  Government funding status from secured to no engagement
                </Body>
              </CardContent>
            </Card>
          </div>

          {/* Key Findings Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Key Assessment Findings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <XCircle className="h-4 w-4 text-red-500 mt-1 shrink-0" />
                    <div>
                      <p className="font-medium text-sm">Grower Contract Gap is Universal</p>
                      <p className="text-xs text-gray-600">No project achieves GC1 or GC2. All rely on aggregators, MOUs, or aspirational claims.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-1 shrink-0" />
                    <div>
                      <p className="font-medium text-sm">Technology is Not the Bottleneck</p>
                      <p className="text-xs text-gray-600">Most projects rate TR1 or TR2. HEFA, ATJ, and AD are all commercially proven.</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-1 shrink-0" />
                    <div>
                      <p className="font-medium text-sm">Carbon Intensity is Generally Strong</p>
                      <p className="text-xs text-gray-600">Australian projects cluster in CI-B (61-77% reduction). Competitive vs US corn ethanol.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <HelpCircle className="h-4 w-4 text-[#D4AF37] mt-1 shrink-0" />
                    <div>
                      <p className="font-medium text-sm">Investment Grade Threshold</p>
                      <p className="text-xs text-gray-600">Only Malabar Biomethane achieves "A" rating with GC1, OQ1, and operational status.</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Bankability Tab */}
        <TabsContent value="bankability" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-600" />
                Overall Bankability Rating (AAA → CCC)
              </CardTitle>
              <CardDescription>
                Composite assessment of project financeability based on feedstock security, technology maturity,
                carbon credentials, offtake quality, and government support.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="w-full">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-20">Rating</TableHead>
                      <TableHead className="w-48">Definition</TableHead>
                      <TableHead className="w-48">Lending Appetite</TableHead>
                      <TableHead>Typical Characteristics</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bankabilityRatings.map((item) => (
                      <TableRow key={item.rating}>
                        <TableCell>
                          <Badge className={`${getRatingColor(item.rating)} font-mono`}>{item.rating}</Badge>
                        </TableCell>
                        <TableCell className="font-medium">{item.definition}</TableCell>
                        <TableCell className="text-sm">{item.appetite}</TableCell>
                        <TableCell className="text-sm text-gray-600">{item.characteristics}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Grower Contract Tab */}
        <TabsContent value="grower" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Leaf className="h-5 w-5 text-[#D4AF37]" />
                Grower Contract Security Rating (GC1 → GC4)
              </CardTitle>
              <CardDescription>
                Assessment of feedstock supply security from binding multi-year contracts to aspirational claims.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="w-full">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-20">Rating</TableHead>
                      <TableHead className="w-48">Definition</TableHead>
                      <TableHead>Contract Status</TableHead>
                      <TableHead className="w-32">Risk Profile</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {growerContractRatings.map((item) => (
                      <TableRow key={item.rating}>
                        <TableCell>
                          <Badge className={`${getRatingColor(item.rating)} font-mono`}>{item.rating}</Badge>
                        </TableCell>
                        <TableCell className="font-medium">{item.definition}</TableCell>
                        <TableCell className="text-sm text-gray-600">{item.status}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={
                            item.risk === "LOW" ? "border-[#D4AF37] text-[#D4AF37]" :
                            item.risk === "MEDIUM-LOW" ? "border-green-500 text-green-600" :
                            item.risk === "MEDIUM-HIGH" ? "border-[#D4AF37] text-[#D4AF37]" :
                            "border-red-500 text-red-600"
                          }>
                            {item.risk}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Technology Tab */}
        <TabsContent value="technology" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cpu className="h-5 w-5 text-purple-600" />
                Technology Readiness Rating (TR1 → TR4)
              </CardTitle>
              <CardDescription>
                Technology maturity assessment mapped to standard Technology Readiness Levels (TRL).
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="w-full">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-20">Rating</TableHead>
                      <TableHead className="w-24">TRL</TableHead>
                      <TableHead className="w-48">Definition</TableHead>
                      <TableHead>Commercial Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {technologyRatings.map((item) => (
                      <TableRow key={item.rating}>
                        <TableCell>
                          <Badge className={`${getRatingColor(item.rating)} font-mono`}>{item.rating}</Badge>
                        </TableCell>
                        <TableCell className="font-mono text-sm">{item.trl}</TableCell>
                        <TableCell className="font-medium">{item.definition}</TableCell>
                        <TableCell className="text-sm text-gray-600">{item.status}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Carbon Intensity Tab */}
        <TabsContent value="carbon" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Factory className="h-5 w-5 text-[#D4AF37]" />
                Carbon Intensity Rating (CI-A → CI-D)
              </CardTitle>
              <CardDescription>
                Lifecycle GHG emissions relative to conventional jet fuel baseline (89 gCO₂e/MJ).
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="w-full">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-20">Rating</TableHead>
                      <TableHead className="w-36">CI Range</TableHead>
                      <TableHead className="w-32">Reduction</TableHead>
                      <TableHead>Regulatory Eligibility</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {carbonIntensityRatings.map((item) => (
                      <TableRow key={item.rating}>
                        <TableCell>
                          <Badge className={`${getRatingColor(item.rating)} font-mono`}>{item.rating}</Badge>
                        </TableCell>
                        <TableCell className="font-mono text-sm">{item.range}</TableCell>
                        <TableCell className="font-medium">{item.reduction}</TableCell>
                        <TableCell className="text-sm text-gray-600">{item.eligibility}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>

              {/* Feedstock CI Multipliers */}
              <div className="mt-6 p-4 bg-slate-50 rounded-lg">
                <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  Feedstock CI Multipliers
                </h4>
                <div className="grid md:grid-cols-2 gap-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">First-generation (food crops)</span>
                    <span className="font-mono text-red-600">+15-25 gCO₂e/MJ</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Second-generation (residues/waste)</span>
                    <span className="font-mono text-green-600">0 ILUC penalty</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Waste oils/fats (UCO, tallow)</span>
                    <span className="font-mono text-[#D4AF37]">~15-25 gCO₂e/MJ</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Lignocellulosic (bagasse, forestry)</span>
                    <span className="font-mono text-green-600">~20-35 gCO₂e/MJ</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Power-to-Liquid</span>
                    <span className="font-mono text-[#D4AF37]">0-80+ gCO₂e/MJ*</span>
                  </div>
                </div>
                <p className="text-xs text-gray-600 mt-2">* Depends entirely on electricity source</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Offtake & Government Tab */}
        <TabsContent value="offtake" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-[#D4AF37]" />
                Offtake Quality Rating (OQ1 → OQ4)
              </CardTitle>
              <CardDescription>
                Assessment of product offtake agreement quality and counterparty creditworthiness.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="w-full">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-20">Rating</TableHead>
                      <TableHead className="w-48">Definition</TableHead>
                      <TableHead>Counterparty Profile</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {offtakeQualityRatings.map((item) => (
                      <TableRow key={item.rating}>
                        <TableCell>
                          <Badge className={`${getRatingColor(item.rating)} font-mono`}>{item.rating}</Badge>
                        </TableCell>
                        <TableCell className="font-medium">{item.definition}</TableCell>
                        <TableCell className="text-sm text-gray-600">{item.profile}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-indigo-600" />
                Government Support Rating (GS1 → GS4)
              </CardTitle>
              <CardDescription>
                Assessment of government funding status and policy support.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="w-full">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-20">Rating</TableHead>
                      <TableHead className="w-48">Definition</TableHead>
                      <TableHead>Funding Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {governmentSupportRatings.map((item) => (
                      <TableRow key={item.rating}>
                        <TableCell>
                          <Badge className={`${getRatingColor(item.rating)} font-mono`}>{item.rating}</Badge>
                        </TableCell>
                        <TableCell className="font-medium">{item.definition}</TableCell>
                        <TableCell className="text-sm text-gray-600">{item.status}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
