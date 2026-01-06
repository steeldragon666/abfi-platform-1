/**
 * Bankability Dashboard - Nextgen Design
 *
 * Features:
 * - Project bankability scoring and ratings
 * - Score gauges with 5-pillar breakdown
 * - Project cards with key metrics
 * - Typography components for consistent styling
 */

import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { Badge, RatingBadge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/lib/trpc";
import { PageLayout, PageContainer } from "@/components/layout";
import {
  Plus,
  TrendingUp,
  AlertCircle,
  FileText,
  Users,
  ArrowRight,
  Building2,
  Shield,
  Activity,
  Calendar,
  MapPin,
  Zap,
  CheckCircle2,
  Clock,
  BarChart3,
} from "lucide-react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";
import { ScoreGauge } from "@/components/ScoreCard";
import { H1, H2, H3, Body, MetricValue, DataLabel } from "@/components/Typography";

// Mock data for demonstration
const MOCK_PROJECTS = [
  {
    id: 1,
    name: "Pilbara Biomass Energy Facility",
    description:
      "150MW biomass power plant utilizing agricultural residues and plantation forestry",
    status: "development",
    bankabilityRating: "AA",
    bankabilityScore: 82,
    nameplateCapacity: 150,
    facilityLocation: "Newman, WA",
    state: "WA",
    targetCOD: "2027-06-30",
    debtTenor: 15,
    primaryCoverage: 85,
    secondaryCoverage: 25,
    volumeScore: 78,
    qualityScore: 85,
    structureScore: 88,
    riskScore: 72,
    operationalScore: 80,
    supplierCount: 8,
    totalContracted: 245000,
  },
  {
    id: 2,
    name: "Murray-Darling Green Energy Hub",
    description:
      "75MW combined heat and power facility processing agricultural waste from the region",
    status: "financing",
    bankabilityRating: "A",
    bankabilityScore: 74,
    nameplateCapacity: 75,
    facilityLocation: "Griffith, NSW",
    state: "NSW",
    targetCOD: "2026-12-15",
    debtTenor: 12,
    primaryCoverage: 110,
    secondaryCoverage: 20,
    volumeScore: 70,
    qualityScore: 78,
    structureScore: 75,
    riskScore: 68,
    operationalScore: 72,
    supplierCount: 12,
    totalContracted: 180000,
  },
  {
    id: 3,
    name: "Gippsland Renewable Baseload",
    description:
      "200MW baseload renewable facility with integrated pellet production",
    status: "planning",
    bankabilityRating: "BBB",
    bankabilityScore: 62,
    nameplateCapacity: 200,
    facilityLocation: "Traralgon, VIC",
    state: "VIC",
    targetCOD: "2028-03-01",
    debtTenor: 18,
    primaryCoverage: 45,
    secondaryCoverage: 10,
    volumeScore: 55,
    qualityScore: 65,
    structureScore: 70,
    riskScore: 58,
    operationalScore: 62,
    supplierCount: 5,
    totalContracted: 120000,
  },
];

const RATING_COLORS: Record<string, string> = {
  AAA: "bg-[#D4AF37] text-black",
  AA: "bg-green-500 text-black",
  A: "bg-lime-500 text-black",
  BBB: "bg-yellow-500 text-black",
  BB: "bg-[#D4AF37] text-black",
  B: "bg-orange-500 text-black",
  CCC: "bg-red-500 text-black",
};

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; icon: typeof CheckCircle2 }
> = {
  operational: {
    label: "Operational",
    color: "bg-emerald-100 text-emerald-700",
    icon: CheckCircle2,
  },
  construction: {
    label: "Construction",
    color: "bg-blue-100 text-blue-700",
    icon: Activity,
  },
  financing: {
    label: "Financing",
    color: "bg-purple-100 text-purple-700",
    icon: TrendingUp,
  },
  development: {
    label: "Development",
    color: "bg-amber-100 text-amber-700",
    icon: Building2,
  },
  planning: {
    label: "Planning",
    color: "bg-slate-100 text-slate-700",
    icon: Clock,
  },
  suspended: {
    label: "Suspended",
    color: "bg-red-100 text-red-700",
    icon: AlertCircle,
  },
};

export default function BankabilityDashboard() {
  const { user, loading: authLoading } = useAuth();

  const { data: apiProjects, isLoading: projectsLoading } =
    trpc.bankability.getMyProjects.useQuery(undefined, { enabled: !!user });

  // Use mock data if no real data
  const projects =
    apiProjects && apiProjects.length > 0 ? apiProjects : MOCK_PROJECTS;
  const isUsingMockData = !apiProjects || apiProjects.length === 0;

  // Calculate aggregate stats
  const totalCapacity = projects.reduce(
    (sum, p: any) => sum + (p.nameplateCapacity || 0),
    0
  );
  const avgRating =
    projects
      .filter((p: any) => p.bankabilityScore)
      .reduce((sum, p: any) => sum + p.bankabilityScore, 0) /
      projects.filter((p: any) => p.bankabilityScore).length || 0;
  const totalSuppliers = projects.reduce(
    (sum, p: any) => sum + (p.supplierCount || 0),
    0
  );
  const totalVolume = projects.reduce(
    (sum, p: any) => sum + (p.totalContracted || 0),
    0
  );

  if (authLoading) {
    return (
      <PageLayout>
        <PageContainer>
          <div className="space-y-4 py-8">
            <Skeleton className="h-10 w-64 mb-2" />
            <Skeleton className="h-5 w-48 mb-8" />
            <div className="grid md:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-48 rounded-xl" />
              ))}
            </div>
          </div>
        </PageContainer>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      {/* Hero Section */}
      <section className="bg-black text-white py-16 lg:py-20 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-1/4 -right-1/4 w-[600px] h-[600px] rounded-full bg-blue-500/10 blur-[100px]" />
          <div className="absolute -bottom-1/4 -left-1/4 w-[400px] h-[400px] rounded-full bg-indigo-500/10 blur-[80px]" />
        </div>

        <PageContainer className="relative z-10" padding="none">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-8">
            <div className="max-w-2xl">
              <div className="flex flex-wrap gap-2 mb-6">
                <Badge
                  variant="outline"
                  className="border-blue-400/50 text-blue-300 bg-blue-500/10"
                >
                  <Shield className="h-3 w-3 mr-1" />
                  Bank-Grade Assessment
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

              <H1 className="text-4xl lg:text-5xl font-display font-bold mb-4">
                Bankability Dashboard
              </H1>
              <Body className="text-xl text-gray-600 leading-relaxed">
                Manage bioenergy projects, track supply chain integrity, and
                generate investment-grade bankability assessments.
              </Body>
            </div>

            <div className="shrink-0">
              <Link href="/project-registration/flow">
                <Button
                  size="lg"
                  className="bg-white text-slate-900 hover:bg-slate-100"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  New Project
                </Button>
              </Link>
            </div>
          </div>

          {/* Stats Row */}
          <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 text-center">
              <MetricValue className="text-3xl font-bold font-mono text-black">
                {projects.length}
              </MetricValue>
              <DataLabel className="text-sm text-gray-500 mt-1">Active Projects</DataLabel>
            </div>
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 text-center">
              <MetricValue className="text-3xl font-bold font-mono text-blue-400">
                {totalCapacity}
              </MetricValue>
              <DataLabel className="text-sm text-gray-500 mt-1">Total MW</DataLabel>
            </div>
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 text-center">
              <MetricValue className="text-3xl font-bold font-mono text-black">
                {avgRating.toFixed(0)}
              </MetricValue>
              <DataLabel className="text-sm text-gray-500 mt-1">Avg Score</DataLabel>
            </div>
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 text-center">
              <MetricValue className="text-3xl font-bold font-mono text-black">
                {totalSuppliers}
              </MetricValue>
              <DataLabel className="text-sm text-gray-500 mt-1">Suppliers</DataLabel>
            </div>
          </div>
        </PageContainer>
      </section>

      <PageContainer>
        {/* Results Header */}
        <div className="flex items-center justify-between mb-6 -mt-4">
          <p className="text-gray-600">
            <strong className="text-foreground">{projects.length}</strong>{" "}
            project{projects.length !== 1 ? "s" : ""} tracked
            {isUsingMockData && (
              <span className="ml-2 text-[#D4AF37]">(Demo data)</span>
            )}
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/lender-portal">
                <BarChart3 className="h-4 w-4 mr-1" />
                Lender View
              </Link>
            </Button>
          </div>
        </div>

        {projectsLoading ? (
          <div className="space-y-4">
            {[1, 2].map(i => (
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
          <div className="space-y-6">
            {projects.map((project: any) => {
              const statusConfig =
                STATUS_CONFIG[project.status] || STATUS_CONFIG.planning;
              const StatusIcon = statusConfig.icon;

              return (
                <Card
                  key={project.id}
                  className="hover:shadow-lg transition-all group border-2 border-transparent hover:border-primary/20"
                >
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="p-3 rounded-xl bg-[#D4AF37]/10 group-hover:bg-[#D4AF37]/20 transition-colors">
                          <Building2 className="h-6 w-6 text-[#D4AF37]" />
                        </div>
                        <div className="flex-1">
                          <CardTitle className="text-xl group-hover:text-[#D4AF37] transition-colors">
                            {project.name}
                          </CardTitle>
                          <CardDescription className="mt-1 text-sm">
                            {project.description || "No description provided"}
                          </CardDescription>
                          <div className="flex items-center gap-3 mt-3 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3.5 w-3.5" />
                              {project.facilityLocation || project.state}
                            </span>
                            <span className="flex items-center gap-1">
                              <Zap className="h-3.5 w-3.5" />
                              {project.nameplateCapacity} MW
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5" />
                              COD{" "}
                              {project.targetCOD
                                ? new Date(project.targetCOD).getFullYear()
                                : "TBD"}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <Badge className={cn("gap-1", statusConfig.color)}>
                          <StatusIcon className="h-3 w-3" />
                          {statusConfig.label}
                        </Badge>
                        {project.bankabilityRating && (
                          <Badge
                            className={cn(
                              "font-mono",
                              RATING_COLORS[project.bankabilityRating]
                            )}
                          >
                            {project.bankabilityRating}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-6">
                    {/* Key Metrics */}
                    <div className="grid md:grid-cols-4 gap-4">
                      <div className="p-3 rounded-lg bg-muted/50">
                        <DataLabel className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                          Capacity
                        </DataLabel>
                        <MetricValue className="font-semibold font-mono text-lg mt-1">
                          {project.nameplateCapacity?.toLocaleString()}{" "}
                          <span className="text-gray-600 text-sm">
                            MW
                          </span>
                        </MetricValue>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/50">
                        <DataLabel className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                          Target COD
                        </DataLabel>
                        <MetricValue className="font-semibold text-lg mt-1">
                          {project.targetCOD
                            ? new Date(project.targetCOD).toLocaleDateString(
                                "en-AU",
                                { month: "short", year: "numeric" }
                              )
                            : "TBD"}
                        </MetricValue>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/50">
                        <DataLabel className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                          Debt Tenor
                        </DataLabel>
                        <MetricValue className="font-semibold font-mono text-lg mt-1">
                          {project.debtTenor
                            ? `${project.debtTenor} years`
                            : "TBD"}
                        </MetricValue>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/50">
                        <DataLabel className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                          Suppliers
                        </DataLabel>
                        <MetricValue className="font-semibold font-mono text-lg mt-1">
                          {project.supplierCount || 0}
                        </MetricValue>
                      </div>
                    </div>

                    {/* Supply Position */}
                    <div className="p-4 rounded-xl bg-muted/30 border space-y-4">
                      <div className="flex justify-between items-center">
                        <H3 className="font-semibold flex items-center gap-2 !text-sm">
                          <Activity className="h-4 w-4 text-[#D4AF37]" />
                          Supply Position
                        </H3>
                        <Badge variant="outline" className="text-xs">
                          Target: 150% coverage
                        </Badge>
                      </div>

                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <DataLabel className="text-gray-600">
                              Primary Coverage (Tier 1)
                            </DataLabel>
                            <MetricValue className="font-medium font-mono">
                              {project.primaryCoverage || 0}% / 120%
                            </MetricValue>
                          </div>
                          <Progress
                            value={(project.primaryCoverage || 0) / 1.2}
                            className="h-2"
                          />
                          <Body className="text-xs text-gray-600">
                            Long-term take-or-pay contracts
                          </Body>
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <DataLabel className="text-gray-600">
                              Secondary Coverage (Tier 2)
                            </DataLabel>
                            <MetricValue className="font-medium font-mono">
                              {project.secondaryCoverage || 0}% / 30%
                            </MetricValue>
                          </div>
                          <Progress
                            value={(project.secondaryCoverage || 0) / 0.3}
                            className="h-2"
                          />
                          <Body className="text-xs text-gray-600">
                            Contingent supply options
                          </Body>
                        </div>
                      </div>

                      <div className="pt-3 border-t flex items-center justify-between">
                        <DataLabel className="text-sm text-gray-600">
                          Total Contracted Volume
                        </DataLabel>
                        <MetricValue className="font-semibold font-mono text-[#D4AF37]">
                          {(project.totalContracted || 0).toLocaleString()}{" "}
                          tonnes/year
                        </MetricValue>
                      </div>
                    </div>

                    {/* 5-Pillar Assessment */}
                    {project.bankabilityScore && (
                      <div className="p-4 rounded-xl border space-y-4">
                        <H3 className="font-semibold flex items-center gap-2 !text-sm">
                          <Shield className="h-4 w-4 text-[#D4AF37]" />
                          5-Pillar Bankability Assessment
                        </H3>
                        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                          <div className="text-center col-span-2 md:col-span-1">
                            <ScoreGauge
                              score={Math.round(project.bankabilityScore)}
                              size="md"
                            />
                            <div className="text-xs text-gray-600 mt-1 font-medium">
                              Composite
                            </div>
                          </div>
                          {[
                            {
                              label: "Volume",
                              score: project.volumeScore,
                              weight: "30%",
                            },
                            {
                              label: "Quality",
                              score: project.qualityScore,
                              weight: "25%",
                            },
                            {
                              label: "Structure",
                              score: project.structureScore,
                              weight: "20%",
                            },
                            {
                              label: "Risk",
                              score: project.riskScore,
                              weight: "15%",
                            },
                            {
                              label: "Operations",
                              score: project.operationalScore,
                              weight: "10%",
                            },
                          ].map(pillar => (
                            <div
                              key={pillar.label}
                              className="text-center p-3 rounded-lg bg-muted/30"
                            >
                              <MetricValue className="text-2xl font-bold font-mono">
                                {pillar.score || "--"}
                              </MetricValue>
                              <DataLabel className="text-xs text-gray-600">
                                {pillar.label} ({pillar.weight})
                              </DataLabel>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Alerts */}
                    {(!project.bankabilityRating ||
                      project.bankabilityRating === "CCC" ||
                      project.bankabilityRating === "BB" ||
                      project.bankabilityRating === "B") && (
                      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                        <div className="p-1.5 rounded-lg bg-amber-100">
                          <AlertCircle className="h-4 w-4 text-[#D4AF37]" />
                        </div>
                        <div className="text-sm">
                          <div className="font-medium text-amber-800">
                            Action Required
                          </div>
                          <div className="text-amber-700">
                            {project.primaryCoverage < 100
                              ? "Increase primary supply coverage to meet lender requirements"
                              : "Complete supply quality assessments to improve bankability rating"}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2 pt-2 border-t">
                      <Link
                        href={`/dashboard/projects/${project.id}/agreements`}
                      >
                        <Button variant="outline" size="sm">
                          <FileText className="h-4 w-4 mr-1" />
                          View Agreements
                        </Button>
                      </Link>
                      <Link href={`/bankability/concentration/${project.id}`}>
                        <Button variant="outline" size="sm">
                          <BarChart3 className="h-4 w-4 mr-1" />
                          Concentration Analysis
                        </Button>
                      </Link>
                      <Button variant="outline" size="sm">
                        <Users className="h-4 w-4 mr-1" />
                        Manage Suppliers
                      </Button>
                      <Link href={`/bankability/assess/${project.id}`}>
                        <Button size="sm">
                          Run Assessment
                          <ArrowRight className="h-4 w-4 ml-1" />
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
          <Card className="bg-gradient-to-r from-blue-500/5 to-indigo-500/5 border-blue-500/20">
            <CardContent className="py-8">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div>
                  <H3 className="text-xl font-semibold mb-2">
                    Need to secure feedstock supply?
                  </H3>
                  <Body className="text-gray-600">
                    Browse our marketplace of verified futures listings from
                    qualified growers across Australia.
                  </Body>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" asChild>
                    <Link href="/for-developers">Learn More</Link>
                  </Button>
                  <Button asChild>
                    <Link href="/futures">
                      <TrendingUp className="h-4 w-4 mr-2" />
                      Browse Marketplace
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
