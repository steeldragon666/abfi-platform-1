/**
 * Lender Risk Analytics - Nextgen Design
 *
 * Features:
 * - Concentration risk analysis (HHI index)
 * - Counterparty exposure tracking
 * - Geographic risk distribution maps
 * - Interactive stress testing scenarios
 * - Typography components for consistent styling
 */

import { useState } from "react";
import { H1, H2, H3, H4, Body, MetricValue, DataLabel } from "@/components/Typography";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  ShieldAlert,
  TrendingDown,
  MapPin,
  Users,
  ArrowLeft,
  AlertTriangle,
  CheckCircle,
  Info,
  RefreshCw,
  Zap,
  Loader2,
} from "lucide-react";
import { Link } from "wouter";
import { LazyChart } from "@/components/ui/lazy-charts";
import { trpc } from "@/lib/trpc";

const formatCurrency = (value: number) => {
  if (value >= 1000000000) return `$${(value / 1000000000).toFixed(1)}B`;
  if (value >= 1000000) return `$${(value / 1000000).toFixed(0)}M`;
  return `$${value.toLocaleString()}`;
};

const getHHIColor = (hhi: number) => {
  if (hhi < 1000) return "text-green-600";
  if (hhi < 2500) return "text-amber-600";
  return "text-red-600";
};

const getHHILabel = (hhi: number) => {
  if (hhi < 1000) return "Low Concentration";
  if (hhi < 2500) return "Moderate Concentration";
  return "High Concentration";
};

export default function LenderRiskAnalytics() {
  const [stressMultiplier, setStressMultiplier] = useState([1.0]);

  // Fetch data from API
  const { data: concentrationMetrics, isLoading: loadingConcentration, refetch: refetchConcentration } =
    trpc.riskAnalytics.getConcentrationMetrics.useQuery();

  const { data: supplierConcentration, isLoading: loadingSuppliers, refetch: refetchSuppliers } =
    trpc.riskAnalytics.getSupplierConcentration.useQuery({ limit: 6 });

  const { data: geographicRisk, isLoading: loadingGeographic, refetch: refetchGeographic } =
    trpc.riskAnalytics.getGeographicRisk.useQuery();

  const { data: riskFactors, isLoading: loadingFactors, refetch: refetchFactors } =
    trpc.riskAnalytics.getRiskFactors.useQuery();

  const { data: stressScenarios, isLoading: loadingScenarios, refetch: refetchScenarios } =
    trpc.riskAnalytics.getStressScenarios.useQuery();

  const isLoading = loadingConcentration || loadingSuppliers || loadingGeographic || loadingFactors || loadingScenarios;

  const handleRefresh = () => {
    refetchConcentration();
    refetchSuppliers();
    refetchGeographic();
    refetchFactors();
    refetchScenarios();
  };

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <div className="bg-background border-b">
        <div className="container-default py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/lender">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold">Risk Analytics</h1>
                <p className="text-muted-foreground text-sm">
                  Portfolio risk assessment and stress testing
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Refresh Analysis
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container-default py-8 space-y-6">
        <Tabs defaultValue="concentration">
          <TabsList className="grid w-full grid-cols-4 lg:w-[600px]">
            <TabsTrigger value="concentration">Concentration</TabsTrigger>
            <TabsTrigger value="geographic">Geographic</TabsTrigger>
            <TabsTrigger value="factors">Risk Factors</TabsTrigger>
            <TabsTrigger value="stress">Stress Testing</TabsTrigger>
          </TabsList>

          {/* Concentration Risk */}
          <TabsContent value="concentration" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">HHI Index</span>
                    <ShieldAlert className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className={`text-3xl font-bold ${getHHIColor(concentrationMetrics?.hhiIndex ?? 0)}`}>
                    {(concentrationMetrics?.hhiIndex ?? 0).toLocaleString()}
                  </div>
                  <Badge
                    variant="secondary"
                    className={
                      concentrationMetrics?.hhiStatus === "low"
                        ? "bg-green-100 text-green-800"
                        : concentrationMetrics?.hhiStatus === "moderate"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-red-100 text-red-800"
                    }
                  >
                    {getHHILabel(concentrationMetrics?.hhiIndex ?? 0)}
                  </Badge>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Top Supplier Share</span>
                    <Users className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="text-3xl font-bold">
                    {concentrationMetrics?.topSupplierShare ?? 0}%
                  </div>
                  <Progress value={concentrationMetrics?.topSupplierShare ?? 0} className="mt-2" />
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Top 3 Suppliers</span>
                    <Users className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="text-3xl font-bold">
                    {concentrationMetrics?.topThreeShare ?? 0}%
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    of total portfolio
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Supplier Concentration</CardTitle>
                <CardDescription>
                  Portfolio share by counterparty
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <LazyChart height={300}>
                    {({ ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Bar, Cell }) => (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={supplierConcentration ?? []} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis type="number" unit="%" fontSize={12} />
                          <YAxis dataKey="name" type="category" fontSize={12} width={120} />
                          <Tooltip formatter={(value: number) => [`${value}%`, "Share"]} />
                          <Bar dataKey="share" radius={[0, 4, 4, 0]}>
                            {(supplierConcentration ?? []).map((entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={
                                  entry.risk === "low"
                                    ? "#22c55e"
                                    : entry.risk === "medium"
                                      ? "#f59e0b"
                                      : "#ef4444"
                                }
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </LazyChart>
                </div>
              </CardContent>
            </Card>

            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>About HHI Index</AlertTitle>
              <AlertDescription>
                The Herfindahl-Hirschman Index (HHI) measures market concentration.
                Values below 1,000 indicate low concentration, 1,000-2,500 moderate,
                and above 2,500 high concentration risk.
              </AlertDescription>
            </Alert>
          </TabsContent>

          {/* Geographic Risk */}
          <TabsContent value="geographic" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Geographic Exposure</CardTitle>
                <CardDescription>
                  Investment exposure and climate risk by state
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>State</TableHead>
                      <TableHead>Exposure</TableHead>
                      <TableHead>Drought Risk</TableHead>
                      <TableHead>Fire Risk</TableHead>
                      <TableHead>Combined</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(geographicRisk ?? []).map((region) => {
                      const combinedRisk = (region.droughtRisk + region.fireRisk) / 2;
                      return (
                        <TableRow key={region.state}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-muted-foreground" />
                              {region.state}
                            </div>
                          </TableCell>
                          <TableCell>{formatCurrency(region.exposure)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Progress value={region.droughtRisk} className="w-20" />
                              <span className="text-sm">{region.droughtRisk}%</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Progress value={region.fireRisk} className="w-20" />
                              <span className="text-sm">{region.fireRisk}%</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="secondary"
                              className={
                                combinedRisk < 40
                                  ? "bg-green-100 text-green-800"
                                  : combinedRisk < 60
                                    ? "bg-amber-100 text-amber-800"
                                    : "bg-red-100 text-red-800"
                              }
                            >
                              {combinedRisk < 40 ? "Low" : combinedRisk < 60 ? "Medium" : "High"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Risk Factors */}
          <TabsContent value="factors" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Risk Factor Analysis</CardTitle>
                <CardDescription>
                  Overall portfolio risk assessment by category
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  <LazyChart height={400}>
                    {({ ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Tooltip }) => (
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart data={riskFactors ?? []}>
                          <PolarGrid stroke="#e5e7eb" />
                          <PolarAngleAxis dataKey="factor" fontSize={12} />
                          <PolarRadiusAxis angle={30} domain={[0, 100]} fontSize={10} />
                          <Radar
                            name="Risk Score"
                            dataKey="score"
                            stroke="#3b82f6"
                            fill="#3b82f6"
                            fillOpacity={0.3}
                            strokeWidth={2}
                          />
                          <Tooltip formatter={(value: number) => [`${value}/100`, "Score"]} />
                        </RadarChart>
                      </ResponsiveContainer>
                    )}
                  </LazyChart>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(riskFactors ?? []).map((factor) => (
                <Card key={factor.factor}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{factor.factor}</span>
                      <span
                        className={`text-lg font-bold ${
                          factor.score >= 70
                            ? "text-green-600"
                            : factor.score >= 50
                              ? "text-amber-600"
                              : "text-red-600"
                        }`}
                      >
                        {factor.score}
                      </span>
                    </div>
                    <Progress value={factor.score} className="h-2" />
                    <p className="text-xs text-muted-foreground mt-2">
                      {factor.score >= 70
                        ? "Well managed"
                        : factor.score >= 50
                          ? "Needs attention"
                          : "High risk"}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Stress Testing */}
          <TabsContent value="stress" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Stress Test Scenarios</CardTitle>
                <CardDescription>
                  Impact analysis of adverse market conditions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Stress Multiplier</span>
                    <span className="text-sm text-muted-foreground">
                      {stressMultiplier[0].toFixed(1)}x
                    </span>
                  </div>
                  <Slider
                    value={stressMultiplier}
                    onValueChange={setStressMultiplier}
                    min={0.5}
                    max={2.0}
                    step={0.1}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Adjust severity of stress scenarios
                  </p>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Scenario</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Portfolio Impact</TableHead>
                      <TableHead>Projects Affected</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(stressScenarios ?? []).map((scenario) => {
                      const adjustedImpact = scenario.portfolioImpact * stressMultiplier[0];
                      return (
                        <TableRow key={scenario.name}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <Zap className="h-4 w-4 text-amber-500" />
                              {scenario.name}
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {scenario.description}
                          </TableCell>
                          <TableCell>
                            <span className="text-red-600 font-medium">
                              {adjustedImpact.toFixed(1)}%
                            </span>
                          </TableCell>
                          <TableCell>{scenario.projectsAffected}</TableCell>
                          <TableCell>
                            {scenario.mitigated ? (
                              <Badge className="bg-green-100 text-green-800">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Mitigated
                              </Badge>
                            ) : (
                              <Badge className="bg-amber-100 text-amber-800">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                Unmitigated
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Unmitigated Risk Alert</AlertTitle>
              <AlertDescription>
                The "Price Shock" scenario is currently unmitigated and could result in
                significant portfolio losses. Consider hedging strategies or diversification.
              </AlertDescription>
            </Alert>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
