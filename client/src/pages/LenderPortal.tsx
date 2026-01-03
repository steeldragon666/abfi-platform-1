/**
 * Lender Portal - Nextgen Design
 *
 * Features:
 * - Project access and permissions management
 * - Stress test results visualization
 * - Rating badges with color coding
 * - Score breakdown components
 * - Typography components for consistent styling
 */

import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/lib/trpc";
import {
  Shield,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  FileText,
  Download,
  Eye,
  Zap,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";
import { RatingBadge, ScoreBreakdown } from "@/components/ScoreCard";
import { Link } from "wouter";
import { cn } from "@/lib/utils";
import { H1, H2, H3, Body, MetricValue, DataLabel } from "@/components/Typography";

const RATING_COLORS: Record<string, string> = {
  AAA: "bg-[#D4AF37] text-black",
  AA: "bg-green-500 text-black",
  A: "bg-lime-500 text-black",
  BBB: "bg-yellow-500 text-black",
  BB: "bg-[#D4AF37] text-black",
  B: "bg-orange-500 text-black",
  CCC: "bg-red-500 text-black",
  CC: "bg-red-700 text-black",
};

export default function LenderPortal() {
  const { user, loading: authLoading } = useAuth();
  const [selectedProject, setSelectedProject] = useState<number | null>(null);

  // Get projects the lender has been granted access to
  const { data: projects, isLoading: projectsLoading } =
    trpc.bankability.getMyLenderProjects.useQuery();

  // Get stress test results for selected project
  const { data: stressResults } = trpc.stressTesting.getProjectResults.useQuery(
    { projectId: selectedProject! },
    { enabled: !!selectedProject }
  );

  // Get latest stress test result
  const latestStressTest = stressResults?.[0];

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Skeleton className="h-64 w-full max-w-2xl" />
      </div>
    );
  }

  if (projectsLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container py-8">
          <Skeleton className="h-8 w-64 mb-8" />
          <div className="grid gap-6">
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
          </div>
        </div>
      </div>
    );
  }

  const formatDate = (date: Date | null) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-AU", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "operational":
        return "bg-green-100 text-green-800";
      case "construction":
        return "bg-blue-100 text-blue-800";
      case "financing":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getCovenantStatus = (
    project: any
  ): { status: "compliant" | "warning" | "breach"; message: string } => {
    // Check Tier 1 covenant (typically 80% minimum)
    const tier1Target = project.tier1Target || 80;
    const tier1Actual = project.supplyPosition?.tier1Coverage ?? 0;

    if (tier1Actual < tier1Target * 0.9) {
      return {
        status: "breach",
        message: `Tier 1 coverage below threshold (${tier1Actual}% vs ${tier1Target}% target)`,
      };
    }
    if (tier1Actual < tier1Target) {
      return {
        status: "warning",
        message: `Tier 1 coverage approaching threshold (${tier1Actual}% vs ${tier1Target}% target)`,
      };
    }
    return { status: "compliant", message: "All covenants compliant" };
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="h-8 w-8 text-[#D4AF37]" />
            <H1 className="text-3xl font-bold">Lender Portal</H1>
          </div>
          <Body className="text-gray-600">
            Read-only monitoring view for financed bioenergy projects
          </Body>
        </div>

        {!projects || projects.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Shield className="h-12 w-12 text-gray-600 mx-auto mb-4" />
              <H3 className="text-lg font-semibold mb-2">
                No Projects Available
              </H3>
              <Body className="text-sm text-gray-600">
                You don't have access to any projects yet. Contact your
                relationship manager.
              </Body>
            </CardContent>
          </Card>
        ) : (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Project List */}
            <div className="lg:col-span-1 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    Monitored Projects
                  </CardTitle>
                  <CardDescription>
                    Select a project to view details
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {projects.map((project: any) => {
                    const covenant = getCovenantStatus(project);
                    return (
                      <button
                        key={project.id}
                        onClick={() => setSelectedProject(project.id)}
                        className={`w-full text-left p-3 rounded-lg border transition-colors ${
                          selectedProject === project.id
                            ? "bg-[#D4AF37]/10 border-primary"
                            : "hover:bg-muted/50"
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="font-medium text-sm">
                            {project.name}
                          </div>
                          {covenant.status === "breach" && (
                            <AlertCircle className="h-4 w-4 text-red-600" />
                          )}
                          {covenant.status === "warning" && (
                            <AlertCircle className="h-4 w-4 text-yellow-600" />
                          )}
                          {covenant.status === "compliant" && (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          )}
                        </div>
                        <Badge
                          variant="outline"
                          className={getStatusColor(project.status)}
                        >
                          {project.status}
                        </Badge>
                      </button>
                    );
                  })}
                </CardContent>
              </Card>
            </div>

            {/* Project Details */}
            <div className="lg:col-span-2 space-y-6">
              {selectedProject ? (
                (() => {
                  const project = projects.find(
                    (p: any) => p.id === selectedProject
                  );
                  if (!project) return null;

                  const covenant = getCovenantStatus(project);

                  return (
                    <>
                      {/* Project Overview */}
                      <Card>
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div>
                              <CardTitle>{project.name}</CardTitle>
                              <CardDescription className="mt-1">
                                {project.facilityLocation} •{" "}
                                {(
                                  project.nameplateCapacity || 0
                                ).toLocaleString()}{" "}
                                tonnes/year capacity
                              </CardDescription>
                            </div>
                            <Button variant="outline" size="sm">
                              <Download className="h-4 w-4 mr-2" />
                              Export Report
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="grid grid-cols-3 gap-4">
                            <div>
                              <DataLabel className="text-sm text-gray-600 mb-1">
                                Status
                              </DataLabel>
                              <Badge className={getStatusColor(project.status)}>
                                {project.status}
                              </Badge>
                            </div>
                            <div>
                              <DataLabel className="text-sm text-gray-600 mb-1">
                                Bankability Rating
                              </DataLabel>
                              <Body className="text-sm">Not assessed</Body>
                            </div>
                            <div>
                              <DataLabel className="text-sm text-gray-600 mb-1">
                                Technology
                              </DataLabel>
                              <MetricValue className="text-sm font-medium">N/A</MetricValue>
                            </div>
                          </div>

                          {project.description && (
                            <div>
                              <DataLabel className="text-sm text-gray-600 mb-1">
                                Description
                              </DataLabel>
                              <Body className="text-sm">{project.description}</Body>
                            </div>
                          )}
                        </CardContent>
                      </Card>

                      {/* Covenant Status */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Shield className="h-5 w-5" />
                            Covenant Monitoring
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div
                            className={`flex items-start gap-3 p-4 rounded-lg ${
                              covenant.status === "breach"
                                ? "bg-red-50 border border-red-200"
                                : covenant.status === "warning"
                                  ? "bg-yellow-50 border border-yellow-200"
                                  : "bg-green-50 border border-green-200"
                            }`}
                          >
                            {covenant.status === "breach" && (
                              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                            )}
                            {covenant.status === "warning" && (
                              <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                            )}
                            {covenant.status === "compliant" && (
                              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                            )}
                            <div>
                              <div
                                className={`font-medium mb-1 ${
                                  covenant.status === "breach"
                                    ? "text-red-900"
                                    : covenant.status === "warning"
                                      ? "text-yellow-900"
                                      : "text-green-900"
                                }`}
                              >
                                {covenant.status === "breach"
                                  ? "Covenant Breach"
                                  : covenant.status === "warning"
                                    ? "Covenant Warning"
                                    : "Covenants Compliant"}
                              </div>
                              <p
                                className={`text-sm ${
                                  covenant.status === "breach"
                                    ? "text-red-700"
                                    : covenant.status === "warning"
                                      ? "text-yellow-700"
                                      : "text-green-700"
                                }`}
                              >
                                {covenant.message}
                              </p>
                            </div>
                          </div>

                          <div className="space-y-3">
                            <div>
                              <div className="flex justify-between text-sm mb-1">
                                <DataLabel className="text-gray-600">
                                  Tier 1 Coverage
                                </DataLabel>
                                <MetricValue className="font-medium">
                                  {project.supplyPosition?.tier1Coverage ?? 0}% / {project.tier1Target || 80}%
                                </MetricValue>
                              </div>
                              <Progress value={Math.min(100, (project.supplyPosition?.tier1Coverage ?? 0) / (project.tier1Target || 80) * 100)} className="h-2" />
                            </div>
                            <div>
                              <div className="flex justify-between text-sm mb-1">
                                <DataLabel className="text-gray-600">
                                  Total Primary Coverage
                                </DataLabel>
                                <MetricValue className="font-medium">{project.supplyPosition?.primaryCoverage ?? 0}%</MetricValue>
                              </div>
                              <Progress value={Math.min(100, project.supplyPosition?.primaryCoverage ?? 0)} className="h-2" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Supply Position */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5" />
                            Supply Position
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ScoreBreakdown
                            scores={[
                              {
                                label: "Tier 1 (Core)",
                                value: project.supplyPosition?.tier1Coverage ?? 0,
                                maxValue: 100,
                              },
                              {
                                label: "Tier 2 (Supplementary)",
                                value: project.supplyPosition?.tier2Coverage ?? 0,
                                maxValue: 100,
                              },
                              {
                                label: "Options",
                                value: Math.round(((project.supplyPosition?.optionsVolume ?? 0) / (project.annualFeedstockVolume || 1)) * 100),
                                maxValue: 100,
                              },
                              {
                                label: "ROFR",
                                value: Math.round(((project.supplyPosition?.rofrVolume ?? 0) / (project.annualFeedstockVolume || 1)) * 100),
                                maxValue: 100,
                              },
                            ]}
                          />
                        </CardContent>
                      </Card>

                      {/* Stress Test Results */}
                      <Card>
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-2">
                              <AlertTriangle className="h-5 w-5" />
                              Stress Test Results
                            </CardTitle>
                            <Link href="/stress-testing">
                              <Button variant="outline" size="sm">
                                <Zap className="h-4 w-4 mr-2" />
                                Run Test
                              </Button>
                            </Link>
                          </div>
                        </CardHeader>
                        <CardContent>
                          {latestStressTest ? (
                            <div className="space-y-4">
                              <div className={cn(
                                "flex items-center gap-3 p-4 rounded-lg",
                                latestStressTest.passesStressTest
                                  ? "bg-green-50 border border-green-200"
                                  : "bg-red-50 border border-red-200"
                              )}>
                                {latestStressTest.passesStressTest ? (
                                  <CheckCircle className="h-5 w-5 text-green-600" />
                                ) : (
                                  <AlertCircle className="h-5 w-5 text-red-600" />
                                )}
                                <div className="flex-1">
                                  <div className={cn(
                                    "font-medium",
                                    latestStressTest.passesStressTest ? "text-green-900" : "text-red-900"
                                  )}>
                                    {latestStressTest.passesStressTest ? "Passes Stress Test" : "Fails Stress Test"}
                                  </div>
                                  <p className={cn(
                                    "text-sm",
                                    latestStressTest.passesStressTest ? "text-green-700" : "text-red-700"
                                  )}>
                                    Rating impact: {latestStressTest.baseRating} → {latestStressTest.stressRating} ({latestStressTest.ratingDelta ?? 0 >= 0 ? "+" : ""}{latestStressTest.ratingDelta ?? 0} notches)
                                  </p>
                                </div>
                              </div>
                              <div className="grid grid-cols-3 gap-3 text-center">
                                <div className="p-2 rounded bg-muted/50">
                                  <div className="text-xs text-gray-600">Supply Shortfall</div>
                                  <div className="font-mono font-semibold">{latestStressTest.supplyShortfallPercent}%</div>
                                </div>
                                <div className="p-2 rounded bg-muted/50">
                                  <div className="text-xs text-gray-600">HHI Delta</div>
                                  <div className="font-mono font-semibold">{latestStressTest.hhiDelta ?? 0 > 0 ? "+" : ""}{latestStressTest.hhiDelta ?? 0}</div>
                                </div>
                                <div className="p-2 rounded bg-muted/50">
                                  <div className="text-xs text-gray-600">Inv. Grade</div>
                                  <div>{latestStressTest.minimumRatingMaintained ?
                                    <CheckCircle className="h-4 w-4 text-green-600 mx-auto" /> :
                                    <AlertCircle className="h-4 w-4 text-red-600 mx-auto" />
                                  }</div>
                                </div>
                              </div>
                              <p className="text-xs text-gray-600">
                                Last tested: {new Date(latestStressTest.testDate).toLocaleDateString("en-AU")}
                              </p>
                            </div>
                          ) : (
                            <div className="text-center py-6">
                              <AlertTriangle className="h-8 w-8 text-gray-600 mx-auto mb-2" />
                              <Body className="text-sm text-gray-600 mb-3">
                                No stress tests have been run for this project
                              </Body>
                              <Link href="/stress-testing">
                                <Button size="sm">
                                  <Zap className="h-4 w-4 mr-2" />
                                  Run First Test
                                </Button>
                              </Link>
                            </div>
                          )}
                        </CardContent>
                      </Card>

                      {/* Documents */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            Documents
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <Button
                            variant="outline"
                            className="w-full justify-start"
                            size="sm"
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Latest Bankability Certificate
                          </Button>
                          <Button
                            variant="outline"
                            className="w-full justify-start"
                            size="sm"
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Supply Agreement Summary
                          </Button>
                          <Button
                            variant="outline"
                            className="w-full justify-start"
                            size="sm"
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Covenant Compliance Report
                          </Button>
                        </CardContent>
                      </Card>
                    </>
                  );
                })()
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Shield className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                    <Body className="text-gray-600">
                      Select a project to view details
                    </Body>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
