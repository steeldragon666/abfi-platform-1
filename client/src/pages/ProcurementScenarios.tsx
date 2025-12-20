/**
 * ProcurementScenarios - Volume security modeling and scenario planning for buyers.
 * Phase 5: Buyer Procurement & Scenario Tools
 */
import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { PageLayout, PageContainer } from "@/components/layout";
import {
  LineChart,
  Shield,
  Target,
  TrendingDown,
  TrendingUp,
  Users,
  AlertTriangle,
  CheckCircle2,
  BarChart3,
  Calculator,
  Layers,
  RefreshCw,
  Download,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Mock data for scenarios
const MOCK_SUPPLIERS = [
  { id: 1, name: "Murray Biomass Co", capacity: 25000, reliability: 0.95, price: 85, location: "VIC", rating: "A" },
  { id: 2, name: "Hunter Valley Ag", capacity: 18000, reliability: 0.92, price: 78, location: "NSW", rating: "A" },
  { id: 3, name: "Darling Downs Farm", capacity: 35000, reliability: 0.88, price: 72, location: "QLD", rating: "B+" },
  { id: 4, name: "Riverina Producers", capacity: 22000, reliability: 0.94, price: 82, location: "NSW", rating: "A-" },
  { id: 5, name: "SA Grain Residues", capacity: 15000, reliability: 0.91, price: 88, location: "SA", rating: "B+" },
];

interface ScenarioResult {
  volumeSecured: number;
  totalCost: number;
  avgPrice: number;
  supplierCount: number;
  concentrationRisk: number; // HHI
  coveragePercent: number;
  recommendations: string[];
}

export default function ProcurementScenarios() {
  const [activeTab, setActiveTab] = useState("volume-security");
  
  // Volume security scenario parameters
  const [requiredVolume, setRequiredVolume] = useState(50000);
  const [supplierLossPercent, setSupplierLossPercent] = useState(20);
  const [priceVolatility, setPriceVolatility] = useState(15);
  const [minReliability, setMinReliability] = useState(0.85);
  
  // Scenario results
  const [isCalculating, setIsCalculating] = useState(false);
  const [scenarioResults, setScenarioResults] = useState<ScenarioResult | null>(null);
  
  // Selected suppliers for comparison
  const [selectedSuppliers, setSelectedSuppliers] = useState<number[]>([1, 2, 3]);

  const calculateScenario = () => {
    setIsCalculating(true);
    
    // Simulate calculation
    setTimeout(() => {
      const eligibleSuppliers = MOCK_SUPPLIERS.filter(
        s => selectedSuppliers.includes(s.id) && s.reliability >= minReliability
      );
      
      const totalCapacity = eligibleSuppliers.reduce((sum, s) => sum + s.capacity, 0);
      const volumeSecured = Math.min(totalCapacity, requiredVolume);
      const avgPrice = eligibleSuppliers.reduce((sum, s) => sum + s.price, 0) / eligibleSuppliers.length;
      
      // Calculate HHI (concentration risk)
      const marketShares = eligibleSuppliers.map(s => (s.capacity / totalCapacity) * 100);
      const hhi = marketShares.reduce((sum, share) => sum + Math.pow(share, 2), 0);
      
      // Generate recommendations
      const recommendations = [];
      if (hhi > 2500) {
        recommendations.push("High concentration risk - consider adding more suppliers");
      }
      if (volumeSecured < requiredVolume) {
        recommendations.push(`Volume gap of ${(requiredVolume - volumeSecured).toLocaleString()} tonnes - expand supplier base`);
      }
      if (avgPrice > 80) {
        recommendations.push("Above-average pricing - negotiate volume discounts");
      }
      
      setScenarioResults({
        volumeSecured,
        totalCost: volumeSecured * avgPrice,
        avgPrice,
        supplierCount: eligibleSuppliers.length,
        concentrationRisk: hhi,
        coveragePercent: (volumeSecured / requiredVolume) * 100,
        recommendations,
      });
      
      setIsCalculating(false);
    }, 1000);
  };

  const getConcentrationLabel = (hhi: number) => {
    if (hhi < 1500) return { label: "Low", color: "text-green-600 bg-green-50" };
    if (hhi < 2500) return { label: "Moderate", color: "text-amber-600 bg-amber-50" };
    return { label: "High", color: "text-red-600 bg-red-50" };
  };

  const toggleSupplier = (id: number) => {
    setSelectedSuppliers(prev => 
      prev.includes(id) 
        ? prev.filter(s => s !== id)
        : [...prev, id]
    );
  };

  return (
    <PageLayout>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 text-white py-12 lg:py-16 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-1/4 -right-1/4 w-[600px] h-[600px] rounded-full bg-purple-500/10 blur-[100px]" />
        </div>

        <PageContainer className="relative z-10" padding="none">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-8">
            <div className="max-w-2xl">
              <div className="flex flex-wrap gap-2 mb-6">
                <Badge
                  variant="outline"
                  className="border-purple-400/50 text-purple-300 bg-purple-500/10"
                >
                  <Calculator className="h-3 w-3 mr-1" />
                  Phase 5: Procurement Tools
                </Badge>
              </div>

              <h1 className="text-4xl lg:text-5xl font-display font-bold mb-4">
                Procurement Scenarios
              </h1>
              <p className="text-xl text-slate-300 leading-relaxed">
                Model volume security, optimize supplier portfolios, and stress-test 
                your feedstock procurement strategy.
              </p>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                <Download className="h-4 w-4 mr-2" />
                Export Report
              </Button>
            </div>
          </div>
        </PageContainer>
      </section>

      <PageContainer>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-8">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="volume-security" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Volume Security
            </TabsTrigger>
            <TabsTrigger value="supplier-comparison" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Supplier Comparison
            </TabsTrigger>
            <TabsTrigger value="portfolio-optimization" className="flex items-center gap-2">
              <Layers className="h-4 w-4" />
              Portfolio Optimization
            </TabsTrigger>
          </TabsList>

          {/* Volume Security Tab */}
          <TabsContent value="volume-security" className="space-y-6">
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Scenario Parameters */}
              <Card className="lg:col-span-1">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-primary" />
                    Scenario Parameters
                  </CardTitle>
                  <CardDescription>
                    Configure your volume security stress test
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label>Required Annual Volume (tonnes)</Label>
                    <Input
                      type="number"
                      value={requiredVolume}
                      onChange={(e) => setRequiredVolume(parseInt(e.target.value) || 0)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Your target feedstock procurement
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Supplier Loss Scenario (%)</Label>
                    <Slider
                      value={[supplierLossPercent]}
                      onValueChange={(v) => setSupplierLossPercent(v[0])}
                      max={50}
                      step={5}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>0%</span>
                      <span className="font-medium">{supplierLossPercent}% loss</span>
                      <span>50%</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Price Volatility Tolerance (%)</Label>
                    <Slider
                      value={[priceVolatility]}
                      onValueChange={(v) => setPriceVolatility(v[0])}
                      max={30}
                      step={5}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>0%</span>
                      <span className="font-medium">±{priceVolatility}%</span>
                      <span>30%</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Minimum Supplier Reliability</Label>
                    <Slider
                      value={[minReliability * 100]}
                      onValueChange={(v) => setMinReliability(v[0] / 100)}
                      min={70}
                      max={99}
                      step={1}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>70%</span>
                      <span className="font-medium">{(minReliability * 100).toFixed(0)}%</span>
                      <span>99%</span>
                    </div>
                  </div>

                  <Button 
                    className="w-full" 
                    onClick={calculateScenario}
                    disabled={isCalculating}
                  >
                    {isCalculating ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Calculating...
                      </>
                    ) : (
                      <>
                        <Calculator className="h-4 w-4 mr-2" />
                        Run Scenario
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Results */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-primary" />
                    Scenario Results
                  </CardTitle>
                  <CardDescription>
                    Volume security analysis under stress conditions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {scenarioResults ? (
                    <div className="space-y-6">
                      {/* Key Metrics */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-muted/50 rounded-lg p-4">
                          <div className="text-sm text-muted-foreground">Volume Secured</div>
                          <div className="text-2xl font-bold font-mono">
                            {scenarioResults.volumeSecured.toLocaleString()}t
                          </div>
                          <Progress 
                            value={scenarioResults.coveragePercent} 
                            className="h-2 mt-2"
                          />
                          <div className="text-xs text-muted-foreground mt-1">
                            {scenarioResults.coveragePercent.toFixed(1)}% of target
                          </div>
                        </div>

                        <div className="bg-muted/50 rounded-lg p-4">
                          <div className="text-sm text-muted-foreground">Avg Price</div>
                          <div className="text-2xl font-bold font-mono">
                            ${scenarioResults.avgPrice.toFixed(0)}/t
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            Total: ${(scenarioResults.totalCost / 1000000).toFixed(1)}M
                          </div>
                        </div>

                        <div className="bg-muted/50 rounded-lg p-4">
                          <div className="text-sm text-muted-foreground">Suppliers</div>
                          <div className="text-2xl font-bold font-mono">
                            {scenarioResults.supplierCount}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            Active suppliers
                          </div>
                        </div>

                        <div className="bg-muted/50 rounded-lg p-4">
                          <div className="text-sm text-muted-foreground">Concentration</div>
                          <Badge 
                            className={cn(
                              "text-xs mt-1",
                              getConcentrationLabel(scenarioResults.concentrationRisk).color
                            )}
                          >
                            {getConcentrationLabel(scenarioResults.concentrationRisk).label}
                          </Badge>
                          <div className="text-xs text-muted-foreground mt-2">
                            HHI: {scenarioResults.concentrationRisk.toFixed(0)}
                          </div>
                        </div>
                      </div>

                      {/* Coverage Visualization */}
                      <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-6">
                        <h4 className="font-semibold mb-4">Volume Coverage Analysis</h4>
                        <div className="relative h-8 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div 
                            className={cn(
                              "h-full rounded-full transition-all",
                              scenarioResults.coveragePercent >= 100 
                                ? "bg-green-500" 
                                : scenarioResults.coveragePercent >= 80 
                                  ? "bg-amber-500" 
                                  : "bg-red-500"
                            )}
                            style={{ width: `${Math.min(scenarioResults.coveragePercent, 100)}%` }}
                          />
                          <div className="absolute inset-0 flex items-center justify-center text-sm font-medium">
                            {scenarioResults.volumeSecured.toLocaleString()}t / {requiredVolume.toLocaleString()}t
                          </div>
                        </div>
                        
                        {scenarioResults.coveragePercent < 100 && (
                          <div className="flex items-center gap-2 mt-4 text-amber-600">
                            <AlertTriangle className="h-4 w-4" />
                            <span className="text-sm">
                              Volume gap: {(requiredVolume - scenarioResults.volumeSecured).toLocaleString()} tonnes
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Recommendations */}
                      {scenarioResults.recommendations.length > 0 && (
                        <div className="border rounded-lg p-4">
                          <h4 className="font-semibold mb-3 flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-primary" />
                            Recommendations
                          </h4>
                          <ul className="space-y-2">
                            {scenarioResults.recommendations.map((rec, i) => (
                              <li key={i} className="flex items-start gap-2 text-sm">
                                <ChevronRight className="h-4 w-4 mt-0.5 text-muted-foreground" />
                                {rec}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                      <Calculator className="h-12 w-12 mb-4 opacity-50" />
                      <p>Configure parameters and run a scenario to see results</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Supplier Comparison Tab */}
          <TabsContent value="supplier-comparison" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Supplier Comparison Matrix
                </CardTitle>
                <CardDescription>
                  Compare suppliers across key metrics. Click to toggle selection.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Supplier</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead className="text-right">Capacity (t/yr)</TableHead>
                      <TableHead className="text-right">Reliability</TableHead>
                      <TableHead className="text-right">Price ($/t)</TableHead>
                      <TableHead>Rating</TableHead>
                      <TableHead className="text-center">Selected</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {MOCK_SUPPLIERS.map((supplier) => {
                      const isSelected = selectedSuppliers.includes(supplier.id);
                      return (
                        <TableRow 
                          key={supplier.id}
                          className={cn(
                            "cursor-pointer transition-colors",
                            isSelected ? "bg-primary/5" : "hover:bg-muted/50"
                          )}
                          onClick={() => toggleSupplier(supplier.id)}
                        >
                          <TableCell className="font-medium">{supplier.name}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{supplier.location}</Badge>
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {supplier.capacity.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge 
                              className={cn(
                                "font-mono",
                                supplier.reliability >= 0.9 
                                  ? "bg-green-100 text-green-800" 
                                  : "bg-amber-100 text-amber-800"
                              )}
                            >
                              {(supplier.reliability * 100).toFixed(0)}%
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            ${supplier.price}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{supplier.rating}</Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            {isSelected ? (
                              <CheckCircle2 className="h-5 w-5 text-primary mx-auto" />
                            ) : (
                              <div className="h-5 w-5 rounded-full border-2 mx-auto" />
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>

                <div className="mt-6 flex items-center justify-between bg-muted/50 rounded-lg p-4">
                  <div>
                    <span className="text-sm text-muted-foreground">Selected: </span>
                    <span className="font-semibold">{selectedSuppliers.length} suppliers</span>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Total Capacity: </span>
                    <span className="font-mono font-semibold">
                      {MOCK_SUPPLIERS
                        .filter(s => selectedSuppliers.includes(s.id))
                        .reduce((sum, s) => sum + s.capacity, 0)
                        .toLocaleString()}t
                    </span>
                  </div>
                  <Button 
                    onClick={calculateScenario}
                    disabled={selectedSuppliers.length === 0}
                  >
                    Analyze Selection
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Portfolio Optimization Tab */}
          <TabsContent value="portfolio-optimization" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Layers className="h-5 w-5 text-primary" />
                  Portfolio Optimization
                </CardTitle>
                <CardDescription>
                  Optimize your supplier portfolio for cost, reliability, and risk
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-6 mb-8">
                  <div className="space-y-4">
                    <h4 className="font-semibold flex items-center gap-2">
                      <Target className="h-4 w-4 text-primary" />
                      Optimization Goals
                    </h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Minimize Cost</span>
                        <Slider defaultValue={[70]} max={100} className="w-24" />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Maximize Reliability</span>
                        <Slider defaultValue={[85]} max={100} className="w-24" />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Minimize Concentration</span>
                        <Slider defaultValue={[60]} max={100} className="w-24" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-semibold flex items-center gap-2">
                      <Shield className="h-4 w-4 text-primary" />
                      Constraints
                    </h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Max per Supplier</span>
                        <Select defaultValue="40">
                          <SelectTrigger className="w-24">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="30">30%</SelectItem>
                            <SelectItem value="40">40%</SelectItem>
                            <SelectItem value="50">50%</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Min Suppliers</span>
                        <Select defaultValue="3">
                          <SelectTrigger className="w-24">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="2">2</SelectItem>
                            <SelectItem value="3">3</SelectItem>
                            <SelectItem value="4">4</SelectItem>
                            <SelectItem value="5">5</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-semibold flex items-center gap-2">
                      <LineChart className="h-4 w-4 text-primary" />
                      Output
                    </h4>
                    <Button className="w-full">
                      <Calculator className="h-4 w-4 mr-2" />
                      Run Optimization
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      Uses linear programming to find optimal supplier allocation
                    </p>
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-6">
                  <h4 className="font-semibold mb-4">Optimal Portfolio Allocation</h4>
                  <div className="space-y-3">
                    {MOCK_SUPPLIERS.slice(0, 4).map((supplier, i) => {
                      const allocation = [35, 30, 20, 15][i];
                      return (
                        <div key={supplier.id} className="flex items-center gap-4">
                          <div className="w-40 text-sm truncate">{supplier.name}</div>
                          <div className="flex-1">
                            <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-primary rounded-full"
                                style={{ width: `${allocation}%` }}
                              />
                            </div>
                          </div>
                          <div className="w-16 text-right font-mono text-sm">
                            {allocation}%
                          </div>
                          <div className="w-24 text-right font-mono text-sm text-muted-foreground">
                            {Math.round((requiredVolume * allocation) / 100).toLocaleString()}t
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </PageContainer>
    </PageLayout>
  );
}
