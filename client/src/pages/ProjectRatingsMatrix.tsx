/**
 * Project Ratings Matrix - Nextgen Design
 *
 * Features:
 * - All projects bankability matrix view
 * - Searchable and filterable table
 * - Rating badges with tooltips
 * - Export and download options
 * - Typography components for consistent styling
 */

import { useState } from "react";
import { H1, H2, H3, H4, Body, MetricValue, DataLabel } from "@/components/Typography";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Search,
  ArrowLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Minus,
  Filter,
  Download,
  ExternalLink,
  AlertTriangle,
  CheckCircle2,
  Clock,
  XCircle,
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
  if (signal.includes("ON HOLD")) return "text-gray-600 bg-gray-50 border-gray-200";
  if (signal.includes("MOTHBALLED") || signal.includes("CANCELLED")) return "text-gray-500 bg-gray-100 border-gray-300";
  return "text-gray-600 bg-gray-50 border-gray-200";
};

const getSignalIcon = (signal: string) => {
  if (signal.includes("BULLISH")) return <TrendingUp className="h-3 w-3" />;
  if (signal.includes("BEARISH")) return <TrendingDown className="h-3 w-3" />;
  if (signal.includes("ON HOLD")) return <Clock className="h-3 w-3" />;
  if (signal.includes("MOTHBALLED") || signal.includes("CANCELLED")) return <XCircle className="h-3 w-3" />;
  return <Minus className="h-3 w-3" />;
};

// Project data
const projects = [
  {
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
    intensity: "4/5",
    temporal: "SHORT-TERM",
    notes: "Only project with secured feedstock",
    pathway: "Anaerobic Digestion",
    feedstock: "Sewage sludge",
    location: "Sydney, NSW",
    status: "Operational",
  },
  {
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
    intensity: "3/5",
    temporal: "MEDIUM-TERM",
    notes: "Technology proven; feedstock uncontracted",
    pathway: "ATJ",
    feedstock: "Ethanol",
    location: "Queensland",
    status: "Development",
  },
  {
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
    intensity: "3/5",
    temporal: "MEDIUM-TERM",
    notes: "HEFA proven; GrainCorp is aggregator not supplier",
    pathway: "HEFA",
    feedstock: "Canola/Tallow/UCO",
    location: "Brisbane, QLD",
    status: "Development",
  },
  {
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
    intensity: "3/5",
    temporal: "SHORT-TERM",
    notes: "Operational producer; seasonal wheat purchasing",
    pathway: "Ethanol",
    feedstock: "Wheat starch",
    location: "Nowra, NSW",
    status: "Operational",
  },
  {
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
    intensity: "2/5",
    temporal: "LONG-TERM",
    notes: "HTL commercial in Canada; Isis Mill partnership unclear",
    pathway: "HTL",
    feedstock: "Bagasse",
    location: "Bundaberg, QLD",
    status: "Development",
  },
  {
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
    intensity: "2/5",
    temporal: "LONG-TERM",
    notes: "Explicit policy dependency stated",
    pathway: "HEFA",
    feedstock: "UCO/Tallow",
    location: "Geelong, VIC",
    status: "Planning",
  },
  {
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
    intensity: "2/5",
    temporal: "SHORT/LONG-TERM",
    notes: "Blending operational; production feedstock unclear",
    pathway: "ATJ",
    feedstock: "Various (imported)",
    location: "Toowoomba, QLD",
    status: "Blending Operational",
  },
  {
    id: "graincorp-standalone",
    name: "GrainCorp",
    company: "Standalone",
    bankability: "BB",
    growerContract: "GC3",
    technology: "TR1",
    carbonIntensity: "CI-B",
    ciValue: "~28",
    offtake: "OQ3",
    govSupport: "GS2",
    signal: "NEUTRAL-BEARISH",
    intensity: "2/5",
    temporal: "MEDIUM-TERM",
    notes: "Aggregator model; no grower contracts",
    pathway: "HEFA",
    feedstock: "Canola",
    location: "Various",
    status: "Strategic",
  },
  {
    id: "northern-oil-yarwun",
    name: "Northern Oil Yarwun",
    company: "Pyrolysis Project",
    bankability: "B",
    growerContract: "GC4",
    technology: "TR3",
    carbonIntensity: "CI-C",
    ciValue: "~45",
    offtake: "OQ3",
    govSupport: "GS3",
    signal: "NEUTRAL-BEARISH",
    intensity: "2/5",
    temporal: "LONG-TERM",
    notes: "Pyrolysis scale-up uncertain",
    pathway: "Pyrolysis",
    feedstock: "Mixed biomass",
    location: "Gladstone, QLD",
    status: "Development",
  },
  {
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
    intensity: "1/5",
    temporal: "SPECULATIVE",
    notes: "No cane industry in region",
    pathway: "ATJ (PureSAF)",
    feedstock: "Sugarcane (proposed)",
    location: "Charters Towers, QLD",
    status: "Speculative",
  },
  {
    id: "xcf-global",
    name: "XCF Global",
    company: "F-T Project",
    bankability: "CCC",
    growerContract: "GC4",
    technology: "TR3",
    carbonIntensity: "CI-C",
    ciValue: "~40",
    offtake: "OQ4",
    govSupport: "GS4",
    signal: "BEARISH",
    intensity: "1/5",
    temporal: "SPECULATIVE",
    notes: "Early stage; F-T unproven at scale",
    pathway: "Fischer-Tropsch",
    feedstock: "Biomass",
    location: "TBD",
    status: "Early Stage",
  },
  {
    id: "zero-petroleum",
    name: "Zero Petroleum",
    company: "e-Fuels Project",
    bankability: "CCC",
    growerContract: "GC4",
    technology: "TR3",
    carbonIntensity: "CI-A",
    ciValue: "~10*",
    offtake: "OQ3",
    govSupport: "GS3",
    signal: "BEARISH",
    intensity: "1/5",
    temporal: "SPECULATIVE",
    notes: "*CI depends on H2 source; e-fuels unproven",
    pathway: "Power-to-Liquid",
    feedstock: "Green H2 + CO2",
    location: "TBD",
    status: "Development",
  },
  {
    id: "ethtec",
    name: "Ethtec",
    company: "Cellulosic Ethanol",
    bankability: "CCC",
    growerContract: "GC4",
    technology: "TR3",
    carbonIntensity: "CI-B",
    ciValue: "~35",
    offtake: "OQ4",
    govSupport: "GS1",
    signal: "BEARISH",
    intensity: "1/5",
    temporal: "SPECULATIVE",
    notes: "Cellulosic globally challenged",
    pathway: "Cellulosic Ethanol",
    feedstock: "Lignocellulosic",
    location: "TBD",
    status: "Development",
  },
  {
    id: "bp-kwinana",
    name: "BP Kwinana",
    company: "Refinery Conversion",
    bankability: "N/R",
    growerContract: "N/A",
    technology: "TR1",
    carbonIntensity: "CI-B",
    ciValue: "~32",
    offtake: "OQ1",
    govSupport: "GS3",
    signal: "ON HOLD",
    intensity: "-",
    temporal: "-",
    notes: "ON HOLD — not rateable",
    pathway: "HEFA",
    feedstock: "TBD",
    location: "Kwinana, WA",
    status: "On Hold",
  },
  {
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
    intensity: "-",
    temporal: "-",
    notes: "MOTHBALLED",
    pathway: "Biodiesel",
    feedstock: "-",
    location: "Dalby, QLD",
    status: "Mothballed",
  },
  {
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
    intensity: "-",
    temporal: "-",
    notes: "CANCELLED",
    pathway: "Biodiesel",
    feedstock: "-",
    location: "Various",
    status: "Cancelled",
  },
];

export default function ProjectRatingsMatrix() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [bankabilityFilter, setBankabilityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Filter projects
  const filteredProjects = projects.filter((project) => {
    const matchesSearch =
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.pathway.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesBankability =
      bankabilityFilter === "all" ||
      (bankabilityFilter === "investment" && ["AAA", "AA", "A"].includes(project.bankability)) ||
      (bankabilityFilter === "borderline" && ["BBB", "BB"].includes(project.bankability)) ||
      (bankabilityFilter === "speculative" && ["B", "CCC"].includes(project.bankability)) ||
      (bankabilityFilter === "inactive" && ["D", "N/R"].includes(project.bankability));

    const matchesStatus =
      statusFilter === "all" ||
      project.status.toLowerCase().includes(statusFilter.toLowerCase());

    return matchesSearch && matchesBankability && matchesStatus;
  });

  // Stats
  const investmentGrade = projects.filter(p => ["AAA", "AA", "A"].includes(p.bankability)).length;
  const borderline = projects.filter(p => ["BBB", "BB"].includes(p.bankability)).length;
  const speculative = projects.filter(p => ["B", "CCC"].includes(p.bankability)).length;
  const inactive = projects.filter(p => ["D", "N/R"].includes(p.bankability)).length;

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setLocation("/ratings")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Project Ratings Matrix</h1>
            <p className="text-gray-600">December 2025 Assessment — 16 Projects</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setBankabilityFilter("investment")}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Investment Grade</p>
                <p className="text-2xl font-bold text-[#D4AF37]">{investmentGrade}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-emerald-200" />
            </div>
            <p className="text-xs text-gray-600 mt-1">A or above</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setBankabilityFilter("borderline")}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Borderline/Moderate</p>
                <p className="text-2xl font-bold text-[#D4AF37]">{borderline}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-amber-200" />
            </div>
            <p className="text-xs text-gray-600 mt-1">BBB to BB</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setBankabilityFilter("speculative")}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">High Risk/Speculative</p>
                <p className="text-2xl font-bold text-red-600">{speculative}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-200" />
            </div>
            <p className="text-xs text-gray-600 mt-1">B or CCC</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setBankabilityFilter("inactive")}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Inactive/On Hold</p>
                <p className="text-2xl font-bold text-gray-600">{inactive}</p>
              </div>
              <Clock className="h-8 w-8 text-gray-200" />
            </div>
            <p className="text-xs text-gray-600 mt-1">D or N/R</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-600" />
              <Input
                placeholder="Search projects, companies, or pathways..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={bankabilityFilter} onValueChange={setBankabilityFilter}>
              <SelectTrigger className="w-full md:w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Bankability" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Ratings</SelectItem>
                <SelectItem value="investment">Investment Grade (A+)</SelectItem>
                <SelectItem value="borderline">Borderline (BBB-BB)</SelectItem>
                <SelectItem value="speculative">Speculative (B-CCC)</SelectItem>
                <SelectItem value="inactive">Inactive (D, N/R)</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="operational">Operational</SelectItem>
                <SelectItem value="development">Development</SelectItem>
                <SelectItem value="planning">Planning</SelectItem>
                <SelectItem value="speculative">Speculative</SelectItem>
              </SelectContent>
            </Select>
            {(bankabilityFilter !== "all" || statusFilter !== "all" || searchQuery) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setBankabilityFilter("all");
                  setStatusFilter("all");
                  setSearchQuery("");
                }}
              >
                Clear filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Ratings Matrix Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Project Ratings</CardTitle>
          <CardDescription>
            Click any project to view detailed assessment with fear components and lending signals
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="w-full">
            <div className="min-w-[1200px]">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-48">Project / Company</TableHead>
                    <TableHead className="w-20 text-center">Bank</TableHead>
                    <TableHead className="w-16 text-center">GC</TableHead>
                    <TableHead className="w-16 text-center">TR</TableHead>
                    <TableHead className="w-16 text-center">CI</TableHead>
                    <TableHead className="w-16 text-center">OQ</TableHead>
                    <TableHead className="w-16 text-center">GS</TableHead>
                    <TableHead className="w-32 text-center">Signal</TableHead>
                    <TableHead className="w-24">Pathway</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TooltipProvider>
                    {filteredProjects.map((project) => (
                      <TableRow
                        key={project.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => setLocation(`/ratings/project/${project.id}`)}
                      >
                        <TableCell>
                          <div>
                            <p className="font-medium">{project.name}</p>
                            <p className="text-xs text-gray-600">{project.company}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Tooltip>
                            <TooltipTrigger>
                              <Badge className={`${getRatingColor(project.bankability)} font-mono`}>
                                {project.bankability}
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Overall Bankability Rating</p>
                            </TooltipContent>
                          </Tooltip>
                        </TableCell>
                        <TableCell className="text-center">
                          <Tooltip>
                            <TooltipTrigger>
                              <Badge className={`${getRatingColor(project.growerContract)} font-mono text-xs`}>
                                {project.growerContract}
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Grower Contract Security</p>
                            </TooltipContent>
                          </Tooltip>
                        </TableCell>
                        <TableCell className="text-center">
                          <Tooltip>
                            <TooltipTrigger>
                              <Badge className={`${getRatingColor(project.technology)} font-mono text-xs`}>
                                {project.technology}
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Technology Readiness</p>
                            </TooltipContent>
                          </Tooltip>
                        </TableCell>
                        <TableCell className="text-center">
                          <Tooltip>
                            <TooltipTrigger>
                              <Badge className={`${getRatingColor(project.carbonIntensity)} font-mono text-xs`}>
                                {project.carbonIntensity}
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Carbon Intensity: {project.ciValue} gCO₂e/MJ</p>
                            </TooltipContent>
                          </Tooltip>
                        </TableCell>
                        <TableCell className="text-center">
                          <Tooltip>
                            <TooltipTrigger>
                              <Badge className={`${getRatingColor(project.offtake)} font-mono text-xs`}>
                                {project.offtake}
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Offtake Quality</p>
                            </TooltipContent>
                          </Tooltip>
                        </TableCell>
                        <TableCell className="text-center">
                          <Tooltip>
                            <TooltipTrigger>
                              <Badge className={`${getRatingColor(project.govSupport)} font-mono text-xs`}>
                                {project.govSupport}
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Government Support</p>
                            </TooltipContent>
                          </Tooltip>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className={`${getSignalColor(project.signal)} text-xs gap-1`}>
                            {getSignalIcon(project.signal)}
                            {project.signal}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs">{project.pathway}</TableCell>
                        <TableCell className="text-xs text-gray-600 max-w-[200px] truncate">
                          {project.notes}
                        </TableCell>
                        <TableCell>
                          <ChevronRight className="h-4 w-4 text-gray-600" />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TooltipProvider>
                </TableBody>
              </Table>
            </div>
          </ScrollArea>

          {filteredProjects.length === 0 && (
            <div className="text-center py-8 text-gray-600">
              No projects match your filters
            </div>
          )}
        </CardContent>
      </Card>

      {/* Legend */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-6 text-xs">
            <div>
              <p className="font-semibold mb-2">Legend</p>
              <div className="flex gap-4">
                <span><strong>Bank</strong> = Overall Bankability (AAA-D)</span>
                <span><strong>GC</strong> = Grower Contract (GC1-GC4)</span>
                <span><strong>TR</strong> = Technology Readiness (TR1-TR4)</span>
              </div>
              <div className="flex gap-4 mt-1">
                <span><strong>CI</strong> = Carbon Intensity (CI-A to CI-D)</span>
                <span><strong>OQ</strong> = Offtake Quality (OQ1-OQ4)</span>
                <span><strong>GS</strong> = Government Support (GS1-GS4)</span>
              </div>
            </div>
            <div className="border-l pl-6">
              <p className="font-semibold mb-2">Signals</p>
              <div className="flex gap-3">
                <Badge variant="outline" className="text-[#D4AF37] bg-emerald-50 border-emerald-200 text-xs">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  BULLISH
                </Badge>
                <Badge variant="outline" className="text-[#D4AF37] bg-amber-50 border-amber-200 text-xs">
                  <Minus className="h-3 w-3 mr-1" />
                  NEUTRAL
                </Badge>
                <Badge variant="outline" className="text-red-600 bg-red-50 border-red-200 text-xs">
                  <TrendingDown className="h-3 w-3 mr-1" />
                  BEARISH
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
