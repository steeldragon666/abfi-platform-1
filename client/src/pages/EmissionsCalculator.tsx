import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { trpc } from "@/lib/trpc";
import {
  BarChart3,
  Truck,
  Plane,
  Ship,
  Train,
  Leaf,
  Calculator,
  Fuel,
  Factory,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  Info,
} from "lucide-react";
import { Redirect } from "wouter";
import { cn } from "@/lib/utils";
import {
  PageWrapper,
  FadeInUp,
} from "@/components/ui/motion";
import DashboardLayout from "@/components/DashboardLayout";
import { useState, useMemo } from "react";

// Transport mode icons
function getTransportIcon(mode: string) {
  const icons: Record<string, React.ElementType> = {
    road_truck: Truck,
    road_van: Truck,
    rail_freight: Train,
    sea_container: Ship,
    sea_bulk: Ship,
    air_cargo: Plane,
    barge: Ship,
    pipeline: Factory,
  };
  return icons[mode] || Truck;
}

// Result card component
function ResultCard({
  label,
  value,
  unit,
  variant = "default",
  icon: Icon,
}: {
  label: string;
  value: string | number;
  unit: string;
  variant?: "default" | "success" | "warning" | "error";
  icon?: React.ElementType;
}) {
  const variantStyles = {
    default: "bg-slate-50",
    success: "bg-emerald-50 border-emerald-200",
    warning: "bg-amber-50 border-amber-200",
    error: "bg-red-50 border-red-200",
  };

  return (
    <div className={cn("p-4 rounded-lg border", variantStyles[variant])}>
      <div className="flex items-center gap-2 mb-2">
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-bold font-mono">{value}</span>
        <span className="text-sm text-muted-foreground">{unit}</span>
      </div>
    </div>
  );
}

// Transport Emissions Calculator
function TransportCalculator() {
  const [formData, setFormData] = useState({
    distanceKm: 500,
    massKg: 10000,
    transportMode: "road_truck" as const,
    vehicleType: "",
    loadFactor: 0.8,
    returnEmpty: false,
  });

  const { data: result, isLoading, refetch } = trpc.emissions.calculateTransportEmissions.useQuery(formData);

  const Icon = getTransportIcon(formData.transportMode);

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        {/* Input Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Transport Parameters
            </CardTitle>
            <CardDescription>
              ISO 14083:2023 compliant calculation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="transportMode">Transport Mode</Label>
              <Select
                value={formData.transportMode}
                onValueChange={(v) => setFormData({ ...formData, transportMode: v as typeof formData.transportMode })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="road_truck">Road Truck</SelectItem>
                  <SelectItem value="road_van">Road Van</SelectItem>
                  <SelectItem value="rail_freight">Rail Freight</SelectItem>
                  <SelectItem value="sea_container">Sea Container</SelectItem>
                  <SelectItem value="sea_bulk">Sea Bulk</SelectItem>
                  <SelectItem value="air_cargo">Air Cargo</SelectItem>
                  <SelectItem value="barge">Barge</SelectItem>
                  <SelectItem value="pipeline">Pipeline</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="distanceKm">Distance (km)</Label>
                <Input
                  id="distanceKm"
                  type="number"
                  value={formData.distanceKm}
                  onChange={(e) => setFormData({ ...formData, distanceKm: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label htmlFor="massKg">Mass (kg)</Label>
                <Input
                  id="massKg"
                  type="number"
                  value={formData.massKg}
                  onChange={(e) => setFormData({ ...formData, massKg: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div>
              <Label>Load Factor: {(formData.loadFactor * 100).toFixed(0)}%</Label>
              <Slider
                value={[formData.loadFactor * 100]}
                onValueChange={([v]) => setFormData({ ...formData, loadFactor: v / 100 })}
                min={10}
                max={100}
                step={5}
                className="mt-2"
              />
            </div>

            <div className="flex items-center gap-3">
              <Switch
                checked={formData.returnEmpty}
                onCheckedChange={(v) => setFormData({ ...formData, returnEmpty: v })}
              />
              <Label>Include empty return trip (+30%)</Label>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Icon className="h-5 w-5" />
              Emissions Result
            </CardTitle>
            <CardDescription>
              Based on default emission factors
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            ) : result ? (
              <div className="space-y-4">
                <ResultCard
                  label="Total Emissions"
                  value={result.emissionsKgCo2e}
                  unit="kg CO2e"
                  variant="default"
                  icon={BarChart3}
                />
                <ResultCard
                  label="Carbon Intensity"
                  value={result.carbonIntensityGCo2eTkm}
                  unit="gCO2e/tkm"
                  variant={result.carbonIntensityGCo2eTkm < 50 ? "success" : result.carbonIntensityGCo2eTkm < 100 ? "warning" : "error"}
                  icon={Leaf}
                />
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <p className="text-xs text-muted-foreground">Tonne-km</p>
                    <p className="font-mono font-medium">{result.tonneKm}</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <p className="text-xs text-muted-foreground">Factor Used</p>
                    <p className="font-mono font-medium">{result.factorUsed} {result.factorUnit}</p>
                  </div>
                </div>
                <Badge variant="outline" className="w-full justify-center py-2">
                  {result.methodology}
                </Badge>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// CORSIA SAF Calculator
function CORSIACalculator() {
  const [pathway, setPathway] = useState<string>("hefa_used_cooking_oil");
  const [customCI, setCustomCI] = useState<number>(0);

  const { data: result, isLoading } = trpc.emissions.calculateCorsiaCI.useQuery({
    safPathway: pathway as any,
    customCI: pathway === "custom" ? customCI : undefined,
  });

  const { data: defaults } = trpc.emissions.getCorsiaDefaults.useQuery();

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        {/* Input */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Plane className="h-5 w-5" />
              SAF Pathway Selection
            </CardTitle>
            <CardDescription>
              CORSIA default carbon intensity values
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>SAF Production Pathway</Label>
              <Select value={pathway} onValueChange={setPathway}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hefa_used_cooking_oil">HEFA - Used Cooking Oil</SelectItem>
                  <SelectItem value="hefa_tallow">HEFA - Tallow</SelectItem>
                  <SelectItem value="hefa_palm_fatty_acid">HEFA - Palm Fatty Acid Distillate</SelectItem>
                  <SelectItem value="ft_municipal_waste">Fischer-Tropsch - Municipal Waste</SelectItem>
                  <SelectItem value="atj_sugarcane">ATJ - Sugarcane</SelectItem>
                  <SelectItem value="atj_corn">ATJ - Corn</SelectItem>
                  <SelectItem value="custom">Custom Value</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {pathway === "custom" && (
              <div>
                <Label>Custom CI (gCO2e/MJ)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={customCI}
                  onChange={(e) => setCustomCI(parseFloat(e.target.value) || 0)}
                />
              </div>
            )}

            {defaults && (
              <div className="p-4 bg-slate-50 rounded-lg">
                <h4 className="text-sm font-medium mb-3">CORSIA Default Values</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Conventional Jet A-1</span>
                    <span className="font-mono">{defaults.conventional_jet} gCO2e/MJ</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">UCO HEFA</span>
                    <span className="font-mono">{defaults.saf_hefa_used_cooking_oil} gCO2e/MJ</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">FT Municipal Waste</span>
                    <span className="font-mono">{defaults.saf_ft_municipal_waste} gCO2e/MJ</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Results */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Fuel className="h-5 w-5" />
              GHG Reduction Analysis
            </CardTitle>
            <CardDescription>
              Compared to conventional jet fuel
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            ) : result ? (
              <div className="space-y-4">
                <ResultCard
                  label="Carbon Intensity"
                  value={result.carbonIntensityGCo2eMJ}
                  unit="gCO2e/MJ"
                  icon={BarChart3}
                />
                <ResultCard
                  label="GHG Reduction"
                  value={result.ghgReductionPercent}
                  unit="%"
                  variant={result.ghgReductionPercent >= 65 ? "success" : result.ghgReductionPercent >= 10 ? "warning" : "error"}
                  icon={Leaf}
                />

                <div className="space-y-3 pt-2">
                  <div className={cn(
                    "flex items-center gap-3 p-3 rounded-lg",
                    result.meetsCorsia ? "bg-emerald-50" : "bg-amber-50"
                  )}>
                    {result.meetsCorsia ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-amber-600" />
                    )}
                    <div>
                      <p className="font-medium text-sm">CORSIA Eligible</p>
                      <p className="text-xs text-muted-foreground">Requires ≥10% GHG reduction</p>
                    </div>
                  </div>

                  <div className={cn(
                    "flex items-center gap-3 p-3 rounded-lg",
                    result.meetsRedII ? "bg-emerald-50" : "bg-red-50"
                  )}>
                    {result.meetsRedII ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-red-600" />
                    )}
                    <div>
                      <p className="font-medium text-sm">RED II Compliant</p>
                      <p className="text-xs text-muted-foreground">Requires ≥65% GHG reduction</p>
                    </div>
                  </div>
                </div>

                <Badge variant="outline" className="w-full justify-center py-2">
                  {result.methodology}
                </Badge>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Feedstock Carbon Intensity Calculator
function FeedstockCalculator() {
  const [formData, setFormData] = useState({
    feedstockType: "sugarcane",
    massKg: 10000,
    nitrogenFertilizerKg: 50,
    dieselLiters: 100,
    electricityKwh: 200,
    transportDistanceKm: 100,
    transportMode: "road",
  });

  const { data: result, isLoading } = trpc.emissions.calculateFeedstockCI.useQuery(formData);

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        {/* Input */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Leaf className="h-5 w-5" />
              Feedstock Parameters
            </CardTitle>
            <CardDescription>
              ISO 14064-1 aligned cultivation emissions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Feedstock Type</Label>
                <Select
                  value={formData.feedstockType}
                  onValueChange={(v) => setFormData({ ...formData, feedstockType: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sugarcane">Sugarcane</SelectItem>
                    <SelectItem value="wheat">Wheat</SelectItem>
                    <SelectItem value="canola">Canola</SelectItem>
                    <SelectItem value="sorghum">Sorghum</SelectItem>
                    <SelectItem value="corn">Corn</SelectItem>
                    <SelectItem value="soybeans">Soybeans</SelectItem>
                    <SelectItem value="used_cooking_oil">Used Cooking Oil</SelectItem>
                    <SelectItem value="tallow">Tallow</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Mass (kg)</Label>
                <Input
                  type="number"
                  value={formData.massKg}
                  onChange={(e) => setFormData({ ...formData, massKg: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <h4 className="text-sm font-medium">Cultivation Inputs</h4>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs">N Fertilizer (kg)</Label>
                  <Input
                    type="number"
                    value={formData.nitrogenFertilizerKg}
                    onChange={(e) => setFormData({ ...formData, nitrogenFertilizerKg: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label className="text-xs">Diesel (L)</Label>
                  <Input
                    type="number"
                    value={formData.dieselLiters}
                    onChange={(e) => setFormData({ ...formData, dieselLiters: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label className="text-xs">Electricity (kWh)</Label>
                  <Input
                    type="number"
                    value={formData.electricityKwh}
                    onChange={(e) => setFormData({ ...formData, electricityKwh: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <h4 className="text-sm font-medium">Transport to Processing</h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Distance (km)</Label>
                  <Input
                    type="number"
                    value={formData.transportDistanceKm}
                    onChange={(e) => setFormData({ ...formData, transportDistanceKm: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label className="text-xs">Mode</Label>
                  <Select
                    value={formData.transportMode}
                    onValueChange={(v) => setFormData({ ...formData, transportMode: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="road">Road</SelectItem>
                      <SelectItem value="rail">Rail</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Carbon Footprint Breakdown
            </CardTitle>
            <CardDescription>
              Upstream cultivation and transport emissions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            ) : result ? (
              <div className="space-y-4">
                <ResultCard
                  label="Total Emissions"
                  value={result.totalEmissionsKgCo2e}
                  unit="kg CO2e"
                  icon={BarChart3}
                />
                <ResultCard
                  label="Carbon Intensity"
                  value={result.carbonIntensityGCo2eKg}
                  unit="gCO2e/kg"
                  variant={result.carbonIntensityGCo2eKg < 50 ? "success" : result.carbonIntensityGCo2eKg < 150 ? "warning" : "error"}
                  icon={Leaf}
                />

                <div className="space-y-2 pt-2">
                  <h4 className="text-sm font-medium">Emissions Breakdown</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Cultivation</span>
                      <span className="font-mono text-sm">{result.cultivationEmissionsKgCo2e} kg CO2e</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500"
                        style={{
                          width: `${(result.cultivationEmissionsKgCo2e / result.totalEmissionsKgCo2e) * 100}%`
                        }}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Transport</span>
                      <span className="font-mono text-sm">{result.transportEmissionsKgCo2e} kg CO2e</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500"
                        style={{
                          width: `${(result.transportEmissionsKgCo2e / result.totalEmissionsKgCo2e) * 100}%`
                        }}
                      />
                    </div>
                  </div>
                </div>

                <Badge variant="outline" className="w-full justify-center py-2">
                  {result.methodology}
                </Badge>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function EmissionsCalculator() {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-10 w-64 mb-2" />
          <Skeleton className="h-5 w-48 mb-8" />
          <div className="grid md:grid-cols-2 gap-6">
            <Skeleton className="h-96 rounded-xl" />
            <Skeleton className="h-96 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50/30 flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
              <Calculator className="h-8 w-8 text-emerald-600" />
            </div>
            <CardTitle className="text-2xl">Emissions Calculator</CardTitle>
            <CardDescription>
              ISO 14083, ISO 14064-1, and CORSIA compliant emissions calculations for your biofuel supply chain
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              Sign in to access the full emissions calculator with transport mode analysis, lifecycle assessment, and compliance reporting.
            </p>
            <Button asChild className="w-full">
              <a href="/api/login">Sign In to Continue</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <PageWrapper className="max-w-7xl">
        {/* Header */}
        <FadeInUp className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-1 flex items-center gap-3">
                <BarChart3 className="h-8 w-8 text-emerald-600" />
                Emissions Calculator
              </h1>
              <p className="text-muted-foreground">
                ISO 14083, ISO 14064-1, and CORSIA compliant emissions calculations
              </p>
            </div>
          </div>
        </FadeInUp>

        {/* Calculator Tabs */}
        <Tabs defaultValue="transport" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="transport" className="flex items-center gap-2">
              <Truck className="h-4 w-4" />
              Transport
            </TabsTrigger>
            <TabsTrigger value="corsia" className="flex items-center gap-2">
              <Plane className="h-4 w-4" />
              CORSIA SAF
            </TabsTrigger>
            <TabsTrigger value="feedstock" className="flex items-center gap-2">
              <Leaf className="h-4 w-4" />
              Feedstock
            </TabsTrigger>
          </TabsList>

          <TabsContent value="transport">
            <TransportCalculator />
          </TabsContent>

          <TabsContent value="corsia">
            <CORSIACalculator />
          </TabsContent>

          <TabsContent value="feedstock">
            <FeedstockCalculator />
          </TabsContent>
        </Tabs>

        {/* Methodology Info */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Info className="h-5 w-5" />
              Methodology Standards
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-900 mb-2">ISO 14083:2023</h4>
                <p className="text-sm text-blue-800">
                  Quantification of greenhouse gas emissions from transport operations, including freight and passenger transport.
                </p>
              </div>
              <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                <h4 className="font-semibold text-emerald-900 mb-2">CORSIA</h4>
                <p className="text-sm text-emerald-800">
                  Carbon Offsetting and Reduction Scheme for International Aviation - default life cycle values for SAF.
                </p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                <h4 className="font-semibold text-purple-900 mb-2">ISO 14064-1</h4>
                <p className="text-sm text-purple-800">
                  Greenhouse gas accounting and verification at organization level - Scope 1, 2, and 3 emissions.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </PageWrapper>
    </DashboardLayout>
  );
}
