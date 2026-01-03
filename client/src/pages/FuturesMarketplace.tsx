/**
 * Futures Marketplace - Nextgen Design
 *
 * Features:
 * - Searchable futures listings grid
 * - Filter by crop type, state, and price
 * - Crop type icons and badges
 * - Yield and pricing display cards
 * - Typography components for consistent styling
 */

import { Button } from "@/components/ui/Button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AUSTRALIAN_STATES } from "@/const";
import { trpc } from "@/lib/trpc";
import { PageLayout, PageContainer } from "@/components/layout";
import { H1, H2, H3, Body, MetricValue, DataLabel } from "@/components/Typography";
import {
  Search,
  Filter,
  MapPin,
  Calendar,
  TrendingUp,
  DollarSign,
  TreeDeciduous,
  Sprout,
  Leaf,
  ChevronRight,
  X,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";

const CROP_TYPE_OPTIONS = [
  { value: "bamboo", label: "Bamboo", icon: Sprout },
  {
    value: "rotation_forestry",
    label: "Rotation Forestry",
    icon: TreeDeciduous,
  },
  { value: "eucalyptus", label: "Eucalyptus", icon: TreeDeciduous },
  { value: "poplar", label: "Poplar", icon: TreeDeciduous },
  { value: "willow", label: "Willow", icon: TreeDeciduous },
  { value: "miscanthus", label: "Miscanthus", icon: Leaf },
  { value: "switchgrass", label: "Switchgrass", icon: Leaf },
  { value: "arundo_donax", label: "Arundo Donax", icon: Leaf },
  { value: "hemp", label: "Industrial Hemp", icon: Leaf },
  { value: "other_perennial", label: "Other Perennial", icon: Sprout },
];

const CROP_TYPE_LABELS: Record<string, string> = {
  bamboo: "Bamboo",
  rotation_forestry: "Rotation Forestry",
  eucalyptus: "Eucalyptus",
  poplar: "Poplar",
  willow: "Willow",
  miscanthus: "Miscanthus",
  switchgrass: "Switchgrass",
  arundo_donax: "Arundo Donax",
  hemp: "Industrial Hemp",
  other_perennial: "Other Perennial",
};

const CROP_TYPE_ICONS: Record<string, React.ReactNode> = {
  bamboo: <Sprout className="h-5 w-5 text-[#D4AF37]" />,
  rotation_forestry: <TreeDeciduous className="h-5 w-5 text-green-600" />,
  eucalyptus: <TreeDeciduous className="h-5 w-5 text-[#D4AF37]" />,
  poplar: <TreeDeciduous className="h-5 w-5 text-lime-600" />,
  willow: <TreeDeciduous className="h-5 w-5 text-green-700" />,
  miscanthus: <Leaf className="h-5 w-5 text-yellow-600" />,
  switchgrass: <Leaf className="h-5 w-5 text-[#D4AF37]" />,
  arundo_donax: <Leaf className="h-5 w-5 text-orange-600" />,
  hemp: <Leaf className="h-5 w-5 text-green-500" />,
  other_perennial: <Sprout className="h-5 w-5 text-[#D4AF37]" />,
};

// Mock data for demonstration - Bamboo featured prominently
const MOCK_FUTURES = [
  {
    id: 1,
    futuresId: "FUT-2025-0001",
    cropType: "bamboo",
    title: "Premium Dendrocalamus Bamboo - Darling Downs Plantation",
    state: "QLD",
    region: "Darling Downs",
    projectionStartYear: 2025,
    projectionEndYear: 2050,
    totalProjectedTonnes: "350000",
    totalAvailableTonnes: "320000",
    totalContractedTonnes: "30000",
    indicativePricePerTonne: "145",
    landAreaHectares: "5500",
    supplierName: "Queensland Bamboo Biomass",
    growerQuality: "GQ1",
    featured: true,
  },
  {
    id: 2,
    futuresId: "FUT-2025-0002",
    cropType: "bamboo",
    title: "Bambusa Balcooa - High-Density Energy Crop",
    state: "QLD",
    region: "Atherton Tablelands",
    projectionStartYear: 2025,
    projectionEndYear: 2045,
    totalProjectedTonnes: "180000",
    totalAvailableTonnes: "165000",
    totalContractedTonnes: "15000",
    indicativePricePerTonne: "155",
    landAreaHectares: "3200",
    supplierName: "FNQ Bamboo Collective",
    growerQuality: "GQ1",
    featured: true,
  },
  {
    id: 3,
    futuresId: "FUT-2025-0003",
    cropType: "bamboo",
    title: "Giant Bamboo - Coastal NSW Plantation",
    state: "NSW",
    region: "Northern Rivers",
    projectionStartYear: 2026,
    projectionEndYear: 2046,
    totalProjectedTonnes: "120000",
    totalAvailableTonnes: "120000",
    totalContractedTonnes: "0",
    indicativePricePerTonne: "135",
    landAreaHectares: "2100",
    supplierName: "Byron Bamboo Industries",
    growerQuality: "GQ2",
    featured: true,
  },
  {
    id: 4,
    futuresId: "FUT-2025-0004",
    cropType: "rotation_forestry",
    title: "Short Rotation Forestry - Mixed Hardwood",
    state: "TAS",
    region: "North East",
    projectionStartYear: 2026,
    projectionEndYear: 2041,
    totalProjectedTonnes: "320000",
    totalAvailableTonnes: "280000",
    totalContractedTonnes: "40000",
    indicativePricePerTonne: "65",
    landAreaHectares: "5000",
    supplierName: "Tasmanian Forestry Alliance",
    growerQuality: "GQ1",
  },
  {
    id: 5,
    futuresId: "FUT-2025-0005",
    cropType: "hemp",
    title: "Industrial Hemp - Multi-Purpose Biomass",
    state: "SA",
    region: "Adelaide Plains",
    projectionStartYear: 2025,
    projectionEndYear: 2030,
    totalProjectedTonnes: "45000",
    totalAvailableTonnes: "45000",
    totalContractedTonnes: "0",
    indicativePricePerTonne: "120",
    landAreaHectares: "800",
    supplierName: "SA Hemp Industries",
    growerQuality: "GQ3",
  },
  {
    id: 6,
    futuresId: "FUT-2025-0006",
    cropType: "switchgrass",
    title: "Switchgrass - Low Input Energy Crop",
    state: "WA",
    region: "South West",
    projectionStartYear: 2026,
    projectionEndYear: 2036,
    totalProjectedTonnes: "90000",
    totalAvailableTonnes: "90000",
    totalContractedTonnes: "0",
    indicativePricePerTonne: "88",
    landAreaHectares: "1800",
    supplierName: "WA Energy Crops",
    growerQuality: "GQ2",
  },
];

const GQ_COLORS: Record<string, string> = {
  GQ1: "bg-emerald-100 text-emerald-700 border-emerald-200",
  GQ2: "bg-green-100 text-green-700 border-green-200",
  GQ3: "bg-yellow-100 text-yellow-700 border-yellow-200",
  GQ4: "bg-orange-100 text-orange-700 border-orange-200",
};

export default function FuturesMarketplace() {
  const [stateFilter, setStateFilter] = useState<string>("");
  const [cropTypeFilter, setCropTypeFilter] = useState<string>("");
  const [minVolumeFilter, setMinVolumeFilter] = useState<string>("");

  const {
    data: apiData,
    isLoading,
    refetch,
  } = trpc.futures.search.useQuery({
    state: stateFilter ? [stateFilter as any] : undefined,
    cropType: cropTypeFilter ? [cropTypeFilter as any] : undefined,
    minVolume: minVolumeFilter ? parseInt(minVolumeFilter) : undefined,
    limit: 50,
  });

  // Use mock data if no real data
  const futures = apiData && apiData.length > 0 ? apiData : MOCK_FUTURES;
  const isUsingMockData = !apiData || apiData.length === 0;

  const clearFilters = () => {
    setStateFilter("");
    setCropTypeFilter("");
    setMinVolumeFilter("");
  };

  const hasFilters = stateFilter || cropTypeFilter || minVolumeFilter;

  // Calculate summary stats
  const totalVolume = futures.reduce(
    (sum, f: any) => sum + parseFloat(f.totalAvailableTonnes || "0"),
    0
  );
  const totalListings = futures.length;
  const avgPrice =
    futures.reduce(
      (sum, f: any) => sum + parseFloat(f.indicativePricePerTonne || "0"),
      0
    ) / futures.length;
  const totalHectares = futures.reduce(
    (sum, f: any) => sum + parseFloat(f.landAreaHectares || "0"),
    0
  );

  return (
    <PageLayout>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 text-black py-16 lg:py-20 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-1/4 -right-1/4 w-[600px] h-[600px] rounded-full bg-[#D4AF37]/10 blur-[100px]" />
          <div className="absolute -bottom-1/4 -left-1/4 w-[400px] h-[400px] rounded-full bg-[#D4AF37]/10 blur-[80px]" />
        </div>

        <PageContainer className="relative z-10" padding="none">
          <div className="max-w-3xl">
            <div className="flex flex-wrap gap-2 mb-6">
              <Badge
                variant="outline"
                className="border-emerald-400/50 text-emerald-300 bg-[#D4AF37]/10"
              >
                <Zap className="h-3 w-3 mr-1" />
                Live Marketplace
              </Badge>
              {isUsingMockData && (
                <Badge
                  variant="outline"
                  className="border-amber-400/50 text-amber-300 bg-[#D4AF37]/10"
                >
                  Demo Data
                </Badge>
              )}
            </div>

            <H1 className="mb-4">
              Futures Marketplace
            </H1>
            <Body className="text-xl text-gray-600 mb-8 leading-relaxed">
              Secure long-term supply of sustainable perennial biomass. Browse
              verified futures listings and express interest in multi-year
              contracts with qualified growers.
            </Body>

            <div className="flex flex-wrap gap-3">
              <Badge className="bg-white/10 text-black border-white/20 py-2 px-4">
                <TreeDeciduous className="h-4 w-4 mr-2" />
                Perennial Crops
              </Badge>
              <Badge className="bg-white/10 text-black border-white/20 py-2 px-4">
                <Calendar className="h-4 w-4 mr-2" />
                Up to 25 Year Contracts
              </Badge>
              <Badge className="bg-white/10 text-black border-white/20 py-2 px-4">
                <ShieldCheck className="h-4 w-4 mr-2" />
                GQ1-GQ4 Verified
              </Badge>
            </div>
          </div>

          <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 text-center">
              <MetricValue className="text-black">
                {totalListings}
              </MetricValue>
              <DataLabel className="text-gray-500 mt-1">Active Listings</DataLabel>
            </div>
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 text-center">
              <MetricValue className="text-[#D4AF37]">
                {(totalVolume / 1000).toFixed(0)}k
              </MetricValue>
              <DataLabel className="text-gray-500 mt-1">
                Tonnes Available
              </DataLabel>
            </div>
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 text-center">
              <MetricValue className="text-black">
                ${avgPrice.toFixed(0)}
              </MetricValue>
              <DataLabel className="text-gray-500 mt-1">Avg Price/Tonne</DataLabel>
            </div>
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 text-center">
              <MetricValue className="text-black">
                {(totalHectares / 1000).toFixed(1)}k
              </MetricValue>
              <DataLabel className="text-gray-500 mt-1">Hectares</DataLabel>
            </div>
          </div>
        </PageContainer>
      </section>

      <PageContainer>
        {/* Filters */}
        <Card className="mb-8 -mt-6 relative z-20 shadow-lg">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Filter className="h-5 w-5 text-[#D4AF37]" />
                Filter Listings
              </CardTitle>
              {hasFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="h-4 w-4 mr-1" />
                  Clear Filters
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">State</Label>
                <Select
                  value={stateFilter || "all"}
                  onValueChange={v => setStateFilter(v === "all" ? "" : v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All states" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All States</SelectItem>
                    {AUSTRALIAN_STATES.map(s => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Crop Type</Label>
                <Select
                  value={cropTypeFilter || "all"}
                  onValueChange={v => setCropTypeFilter(v === "all" ? "" : v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All crop types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Crop Types</SelectItem>
                    {CROP_TYPE_OPTIONS.map(crop => (
                      <SelectItem key={crop.value} value={crop.value}>
                        <div className="flex items-center gap-2">
                          <crop.icon className="h-4 w-4" />
                          {crop.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Minimum Volume (tonnes)
                </Label>
                <Input
                  type="number"
                  placeholder="e.g., 1000"
                  value={minVolumeFilter}
                  onChange={e => setMinVolumeFilter(e.target.value)}
                  className="font-mono"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">&nbsp;</Label>
                <Button onClick={() => refetch()} className="w-full">
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results Header */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-gray-600">
            <strong className="text-foreground">{futures.length}</strong>{" "}
            futures listing{futures.length !== 1 ? "s" : ""} found
            {isUsingMockData && (
              <span className="ml-2 text-[#D4AF37]">(Demo data)</span>
            )}
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/feedstock-map">
                <MapPin className="h-4 w-4 mr-1" />
                View on Map
              </Link>
            </Button>
          </div>
        </div>

        {/* Results Grid */}
        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-32 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {futures.map((f: any) => {
              const totalProjected = parseFloat(f.totalProjectedTonnes || "0");
              const totalAvailable = parseFloat(f.totalAvailableTonnes || "0");
              const totalContracted = parseFloat(
                f.totalContractedTonnes || "0"
              );
              const projectionYears =
                f.projectionEndYear - f.projectionStartYear + 1;
              const contractedPercent =
                totalProjected > 0
                  ? (totalContracted / totalProjected) * 100
                  : 0;

              return (
                <Card
                  key={f.id}
                  className="hover:shadow-lg transition-all group border-2 border-transparent hover:border-primary/20"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-[#D4AF37]/10 rounded-xl group-hover:bg-[#D4AF37]/20 transition-colors">
                          {CROP_TYPE_ICONS[f.cropType] || (
                            <Sprout className="h-5 w-5 text-[#D4AF37]" />
                          )}
                        </div>
                        <div>
                          <CardTitle className="text-base font-mono">
                            {f.futuresId}
                          </CardTitle>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {CROP_TYPE_LABELS[f.cropType]}
                            </Badge>
                            {f.growerQuality && (
                              <Badge
                                className={cn(
                                  "text-xs border",
                                  GQ_COLORS[f.growerQuality]
                                )}
                              >
                                {f.growerQuality}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    <CardDescription className="mt-3 line-clamp-2 text-sm">
                      {f.title}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <MapPin className="h-4 w-4 shrink-0" />
                        <span className="truncate">
                          {f.state}
                          {f.region && `, ${f.region}`}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Calendar className="h-4 w-4 shrink-0" />
                        <span>
                          {f.projectionStartYear}-{f.projectionEndYear}
                        </span>
                      </div>
                    </div>

                    <div className="bg-muted/50 rounded-lg p-3 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">
                          Available
                        </span>
                        <span className="font-semibold text-[#D4AF37] font-mono">
                          {totalAvailable.toLocaleString()}t
                        </span>
                      </div>
                      <div>
                        <div className="flex justify-between text-xs text-gray-600 mb-1">
                          <span>Contracted</span>
                          <span>{contractedPercent.toFixed(0)}%</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full transition-all"
                            style={{ width: `${contractedPercent}%` }}
                          />
                        </div>
                      </div>
                      <div className="flex justify-between text-sm pt-1 border-t border-border/50">
                        <span className="text-gray-600">
                          Contract Period
                        </span>
                        <span className="font-medium">
                          {projectionYears} years
                        </span>
                      </div>
                    </div>

                    {f.supplierName && (
                      <div className="text-sm text-gray-600">
                        <span className="font-medium text-foreground">
                          {f.supplierName}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-3 border-t">
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4 text-gray-600" />
                        <span className="font-semibold text-lg">
                          {f.indicativePricePerTonne
                            ? `$${parseFloat(f.indicativePricePerTonne).toFixed(0)}`
                            : "TBD"}
                        </span>
                        <span className="text-sm text-gray-600">
                          /t
                        </span>
                      </div>
                      <Link href={`/futures/${f.id}`}>
                        <Button
                          size="sm"
                          className="group-hover:bg-primary group-hover:text-[#D4AF37]-foreground"
                        >
                          View Details
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* CTA Section */}
        <section className="mt-16 mb-8">
          <Card className="bg-gradient-to-r from-primary/5 to-[#D4AF37]/5 border-primary/20">
            <CardContent className="py-8">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div>
                  <H3 className="mb-2">
                    Are you a biomass producer?
                  </H3>
                  <Body className="text-gray-600">
                    List your perennial crop futures and connect with verified
                    buyers seeking long-term supply.
                  </Body>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" asChild>
                    <Link href="/for-growers">Learn More</Link>
                  </Button>
                  <Button asChild>
                    <Link href="/supplier/futures/create">
                      <TrendingUp className="h-4 w-4 mr-2" />
                      List Your Futures
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </PageContainer>
    </PageLayout>
  );
}
