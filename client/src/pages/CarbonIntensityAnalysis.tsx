/**
 * ABFI Carbon Intensity Analysis Page
 *
 * Detailed lifecycle GHG emissions analysis for Australian biofuels projects
 */

import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Factory,
  Leaf,
  Flame,
  Droplets,
  Wind,
  Zap,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  BarChart3,
} from "lucide-react";

// Rating colors
const getCIRatingColor = (rating: string) => {
  const colors: Record<string, string> = {
    "CI-A": "bg-emerald-500 text-white",
    "CI-B": "bg-green-500 text-white",
    "CI-C": "bg-amber-500 text-white",
    "CI-D": "bg-red-500 text-white",
  };
  return colors[rating] || "bg-gray-400 text-white";
};

// Pathway CI benchmarks
const pathwayBenchmarks = [
  { pathway: "HEFA", feedstock: "UCO", ci: "15-25", rating: "CI-A", notes: "Waste pathway; lowest CI", icon: Droplets },
  { pathway: "HEFA", feedstock: "Tallow", ci: "20-30", rating: "CI-A/B", notes: "Animal rendering waste", icon: Factory },
  { pathway: "HEFA", feedstock: "Canola (AU)", ci: "28-35", rating: "CI-B", notes: "Low-till Australian practices", icon: Leaf },
  { pathway: "HEFA", feedstock: "Palm oil", ci: "40-60+", rating: "CI-C/D", notes: "ILUC concerns; may not qualify", icon: AlertTriangle },
  { pathway: "ATJ", feedstock: "Sugarcane ethanol", ci: "25-35", rating: "CI-B", notes: "Bagasse cogen credit helps", icon: Leaf },
  { pathway: "ATJ", feedstock: "Wheat ethanol", ci: "30-40", rating: "CI-B/C", notes: "Depends on farming practices", icon: Leaf },
  { pathway: "ATJ", feedstock: "Corn ethanol (US)", ci: "45-55", rating: "CI-C", notes: "Higher ILUC; lower efficiency", icon: AlertTriangle },
  { pathway: "HTL", feedstock: "Bagasse", ci: "25-35", rating: "CI-B", notes: "Second-gen; no ILUC", icon: Flame },
  { pathway: "HTL", feedstock: "Forestry residues", ci: "30-40", rating: "CI-B/C", notes: "Collection logistics add CI", icon: Leaf },
  { pathway: "Fischer-Tropsch", feedstock: "Biomass", ci: "35-50", rating: "CI-C", notes: "Energy-intensive process", icon: Factory },
  { pathway: "Power-to-Liquid", feedstock: "Green H2 + DAC", ci: "5-15", rating: "CI-A*", notes: "Only with renewable electricity", icon: Zap },
  { pathway: "Power-to-Liquid", feedstock: "Grid H2", ci: "60-100+", rating: "CI-D", notes: "Grid carbon intensity dependent", icon: AlertTriangle },
];

// Australian project CI estimates
const projectCIEstimates = [
  { project: "Malabar Biomethane", pathway: "AD", feedstock: "Sewage sludge", ci: "~15", rating: "CI-A", eligible: true, notes: "Biomethane not SAF" },
  { project: "Jet Zero Australia", pathway: "ATJ", feedstock: "Sugarcane/wheat ethanol", ci: "~28", rating: "CI-B", eligible: true, notes: "" },
  { project: "Ampol-GrainCorp-IFM", pathway: "HEFA", feedstock: "Canola/tallow/UCO", ci: "~30", rating: "CI-B", eligible: true, notes: "" },
  { project: "Licella Holdings", pathway: "HTL", feedstock: "Bagasse", ci: "~30", rating: "CI-B", eligible: true, notes: "" },
  { project: "Manildra (as feedstock)", pathway: "ATJ", feedstock: "Wheat ethanol", ci: "~32", rating: "CI-B", eligible: true, notes: "" },
  { project: "Wagner Sustainable", pathway: "ATJ", feedstock: "Various (imported)", ci: "~30", rating: "CI-B", eligible: true, notes: "" },
  { project: "Viva Energy", pathway: "HEFA", feedstock: "UCO/tallow", ci: "~35", rating: "CI-B", eligible: true, notes: "" },
  { project: "RDA Charters Towers", pathway: "ATJ", feedstock: "Integrated sugarcane", ci: "~25", rating: "CI-B", eligible: true, notes: "If feedstock exists" },
  { project: "Northern Oil Yarwun", pathway: "Pyrolysis", feedstock: "Mixed biomass", ci: "~45", rating: "CI-C", eligible: true, notes: "" },
  { project: "Zero Petroleum", pathway: "PtL", feedstock: "Green H2 + CO2", ci: "~10*", rating: "CI-A*", eligible: true, notes: "If green H2" },
  { project: "Ethtec", pathway: "ATJ", feedstock: "Cellulosic ethanol", ci: "~35", rating: "CI-B", eligible: true, notes: "" },
  { project: "XCF Global", pathway: "F-T", feedstock: "Biomass", ci: "~40", rating: "CI-C", eligible: true, notes: "" },
];

// CI Rating definitions
const ciRatingDefs = [
  { rating: "CI-A", range: "≤20 gCO₂e/MJ", reduction: "≥78%", color: "bg-emerald-500" },
  { rating: "CI-B", range: "21-35 gCO₂e/MJ", reduction: "61-77%", color: "bg-green-500" },
  { rating: "CI-C", range: "36-53 gCO₂e/MJ", reduction: "40-60%", color: "bg-amber-500" },
  { rating: "CI-D", range: "≥54 gCO₂e/MJ", reduction: "<40%", color: "bg-red-500" },
];

export default function CarbonIntensityAnalysis() {
  const [, setLocation] = useLocation();
  const [pathwayFilter, setPathwayFilter] = useState("all");

  // Filter benchmarks by pathway
  const filteredBenchmarks = pathwayFilter === "all"
    ? pathwayBenchmarks
    : pathwayBenchmarks.filter(b => b.pathway === pathwayFilter);

  // Calculate stats
  const ciACount = projectCIEstimates.filter(p => p.rating.includes("CI-A")).length;
  const ciBCount = projectCIEstimates.filter(p => p.rating === "CI-B").length;
  const ciCCount = projectCIEstimates.filter(p => p.rating.includes("CI-C")).length;
  const eligibleCount = projectCIEstimates.filter(p => p.eligible).length;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setLocation("/ratings")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Carbon Intensity Analysis</h1>
            <p className="text-muted-foreground">Lifecycle GHG emissions vs 89 gCO₂e/MJ baseline</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setLocation("/ratings/projects")}>
            <BarChart3 className="h-4 w-4 mr-2" />
            Project Matrix
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-emerald-600">{ciACount}</div>
            <div className="text-xs text-muted-foreground">CI-A Rated</div>
            <div className="text-xs text-muted-foreground">≥78% reduction</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-green-600">{ciBCount}</div>
            <div className="text-xs text-muted-foreground">CI-B Rated</div>
            <div className="text-xs text-muted-foreground">61-77% reduction</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-amber-600">{ciCCount}</div>
            <div className="text-xs text-muted-foreground">CI-C Rated</div>
            <div className="text-xs text-muted-foreground">40-60% reduction</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-blue-600">{eligibleCount}</div>
            <div className="text-xs text-muted-foreground">Cleaner Fuels</div>
            <div className="text-xs text-muted-foreground">Program Eligible</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold">89</div>
            <div className="text-xs text-muted-foreground">Baseline</div>
            <div className="text-xs text-muted-foreground">gCO₂e/MJ</div>
          </CardContent>
        </Card>
      </div>

      {/* Rating Scale Visual */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">CI Rating Scale</CardTitle>
          <CardDescription>
            Based on lifecycle greenhouse gas emissions relative to conventional jet fuel
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {ciRatingDefs.map((def) => (
              <div key={def.rating} className="flex items-center gap-4">
                <Badge className={`${getCIRatingColor(def.rating)} w-16 justify-center`}>
                  {def.rating}
                </Badge>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">{def.range}</span>
                    <span className="text-sm text-muted-foreground">({def.reduction} vs baseline)</span>
                  </div>
                  <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${def.color} transition-all`}
                      style={{
                        width: def.rating === "CI-A" ? "22%" :
                               def.rating === "CI-B" ? "39%" :
                               def.rating === "CI-C" ? "60%" : "100%"
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
            <div className="flex items-center justify-between text-xs text-muted-foreground mt-2">
              <span>0 gCO₂e/MJ</span>
              <span>89 gCO₂e/MJ (Baseline)</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Pathway CI Benchmarks */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Pathway CI Benchmarks</CardTitle>
                <CardDescription>Typical carbon intensity by production pathway</CardDescription>
              </div>
              <Select value={pathwayFilter} onValueChange={setPathwayFilter}>
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Pathways</SelectItem>
                  <SelectItem value="HEFA">HEFA</SelectItem>
                  <SelectItem value="ATJ">ATJ</SelectItem>
                  <SelectItem value="HTL">HTL</SelectItem>
                  <SelectItem value="Fischer-Tropsch">Fischer-Tropsch</SelectItem>
                  <SelectItem value="Power-to-Liquid">Power-to-Liquid</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Pathway</TableHead>
                    <TableHead>Feedstock</TableHead>
                    <TableHead className="text-center">CI</TableHead>
                    <TableHead className="text-center">Rating</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBenchmarks.map((item, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">{item.pathway}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <item.icon className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{item.feedstock}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center font-mono text-sm">{item.ci}</TableCell>
                      <TableCell className="text-center">
                        <Badge className={`${getCIRatingColor(item.rating.split("/")[0])} text-xs`}>
                          {item.rating}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Australian Project CI Estimates */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Australian Project CI Estimates</CardTitle>
            <CardDescription>Estimated carbon intensity for each project</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Project</TableHead>
                    <TableHead>Pathway</TableHead>
                    <TableHead className="text-center">CI</TableHead>
                    <TableHead className="text-center">Rating</TableHead>
                    <TableHead className="text-center">Eligible</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {projectCIEstimates.map((item, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium text-sm">{item.project}</TableCell>
                      <TableCell className="text-xs">{item.pathway}</TableCell>
                      <TableCell className="text-center font-mono text-sm">{item.ci}</TableCell>
                      <TableCell className="text-center">
                        <Badge className={`${getCIRatingColor(item.rating.replace("*", ""))} text-xs`}>
                          {item.rating}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {item.eligible ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-500 mx-auto" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500 mx-auto" />
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Feedstock CI Multipliers */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Info className="h-5 w-5" />
            Feedstock CI Multipliers & ILUC Penalties
          </CardTitle>
          <CardDescription>
            Indirect Land Use Change (ILUC) impacts on carbon intensity by feedstock type
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card className="border-red-200 bg-red-50/30">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <span className="font-semibold text-red-900">First-Generation (Food Crops)</span>
                </div>
                <p className="text-2xl font-mono text-red-700">+15-25 gCO₂e/MJ</p>
                <p className="text-xs text-red-800 mt-1">ILUC penalty applied</p>
              </CardContent>
            </Card>

            <Card className="border-emerald-200 bg-emerald-50/30">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span className="font-semibold text-emerald-900">Second-Generation (Residues)</span>
                </div>
                <p className="text-2xl font-mono text-emerald-700">0 ILUC</p>
                <p className="text-xs text-emerald-800 mt-1">No ILUC penalty</p>
              </CardContent>
            </Card>

            <Card className="border-emerald-200 bg-emerald-50/30">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Droplets className="h-4 w-4 text-emerald-600" />
                  <span className="font-semibold text-emerald-900">Waste Oils/Fats</span>
                </div>
                <p className="text-2xl font-mono text-emerald-700">~15-25 gCO₂e/MJ</p>
                <p className="text-xs text-emerald-800 mt-1">UCO, tallow — lowest baseline</p>
              </CardContent>
            </Card>

            <Card className="border-green-200 bg-green-50/30">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Leaf className="h-4 w-4 text-green-600" />
                  <span className="font-semibold text-green-900">Lignocellulosic</span>
                </div>
                <p className="text-2xl font-mono text-green-700">~20-35 gCO₂e/MJ</p>
                <p className="text-xs text-green-800 mt-1">Bagasse, forestry residues</p>
              </CardContent>
            </Card>

            <Card className="border-amber-200 bg-amber-50/30">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="h-4 w-4 text-amber-600" />
                  <span className="font-semibold text-amber-900">Power-to-Liquid</span>
                </div>
                <p className="text-2xl font-mono text-amber-700">0-80+ gCO₂e/MJ</p>
                <p className="text-xs text-amber-800 mt-1">Depends entirely on electricity source</p>
              </CardContent>
            </Card>

            <Card className="border-blue-200 bg-blue-50/30">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Factory className="h-4 w-4 text-blue-600" />
                  <span className="font-semibold text-blue-900">Australian Canola</span>
                </div>
                <p className="text-2xl font-mono text-blue-700">40% lower</p>
                <p className="text-xs text-blue-800 mt-1">vs global average (low-till practices)</p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Regulatory Thresholds */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Regulatory Compliance Thresholds</CardTitle>
          <CardDescription>
            Carbon intensity requirements for various SAF certification schemes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-2">Australia Cleaner Fuels</h4>
              <p className="text-2xl font-mono text-emerald-600">≤60 gCO₂e/MJ</p>
              <p className="text-xs text-muted-foreground mt-1">Program threshold</p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-2">EU RED III</h4>
              <p className="text-2xl font-mono text-emerald-600">≤35 gCO₂e/MJ</p>
              <p className="text-xs text-muted-foreground mt-1">~60% reduction required</p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-2">CORSIA</h4>
              <p className="text-2xl font-mono text-amber-600">10% reduction</p>
              <p className="text-xs text-muted-foreground mt-1">Minimum baseline</p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-2">US RFS D7</h4>
              <p className="text-2xl font-mono text-green-600">≤50%</p>
              <p className="text-xs text-muted-foreground mt-1">vs petroleum baseline</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Finding */}
      <Card className="border-emerald-200 bg-emerald-50/50">
        <CardContent className="p-4 flex items-start gap-3">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5 shrink-0" />
          <div>
            <h3 className="font-semibold text-emerald-900">Key Finding: Australian CI Competitive Advantage</h3>
            <p className="text-sm text-emerald-800 mt-1">
              Australian biofuels projects cluster in CI-B rating (61-77% reduction), meeting Cleaner Fuels Program thresholds.
              This represents a competitive advantage vs US corn ethanol pathways (typically CI-C or worse).
              Low-till Australian agricultural practices and access to waste feedstocks (UCO, tallow, bagasse) drive this advantage.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
