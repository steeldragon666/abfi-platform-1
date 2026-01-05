/**
 * Project Registry Detail Page
 * Full project profile with ratings, gap analysis, and claim functionality
 *
 * Features:
 * - Project hero with key info
 * - 6-dimension rating visualization
 * - Gap analysis for missing information
 * - Climate intelligence section with unified satellite + weather data
 * - Claim button for unclaimed projects
 */

import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/Button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  MapPin,
  Factory,
  Leaf,
  Zap,
  Building2,
  BadgeCheck,
  Users,
  ArrowLeft,
  ExternalLink,
  Mail,
  Globe,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Info,
  Loader2,
  BarChart3,
  Satellite,
} from "lucide-react";
import { Link, useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { RatingBadge, BankabilityBadge, SignalBadge, RatingBadgesRow } from "@/components/registry/RatingBadges";
import { H1, H2, H3, Body, MetricValue, DataLabel } from "@/components/Typography";
import { cn } from "@/lib/utils";
import { UnifiedClimatePanel } from "@/components/climate/UnifiedClimatePanel";

// Status colors
const STATUS_COLORS: Record<string, string> = {
  operational: "bg-green-100 text-green-800 border-green-300",
  development: "bg-blue-100 text-blue-800 border-blue-300",
  feasibility: "bg-amber-100 text-amber-800 border-amber-300",
  construction: "bg-purple-100 text-purple-800 border-purple-300",
  announced: "bg-gray-100 text-gray-800 border-gray-300",
  halted: "bg-red-100 text-red-800 border-red-300",
  cancelled: "bg-gray-200 text-gray-600 border-gray-400",
};

const STATUS_LABELS: Record<string, string> = {
  operational: "Operational",
  development: "In Development",
  feasibility: "Feasibility Study",
  construction: "Under Construction",
  announced: "Announced",
  halted: "Halted",
  cancelled: "Cancelled",
};

// Rating dimension card
function RatingDimensionCard({
  title,
  rating,
  description,
  score,
  weight,
  type,
}: {
  title: string;
  rating: string | null;
  description: string;
  score: number | null;
  weight: number;
  type: "growerContract" | "techReadiness" | "carbonIntensity" | "offtake" | "govSupport";
}) {
  return (
    <Card className="h-full">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <DataLabel className="text-xs">{title}</DataLabel>
          <RatingBadge rating={rating} type={type} size="md" />
        </div>
        <p className="text-sm text-muted-foreground mb-3">{description}</p>
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span>Score</span>
            <span className="font-mono">{score ?? "N/A"}/100</span>
          </div>
          <Progress value={score ?? 0} className="h-1.5" />
          <div className="text-xs text-muted-foreground">
            Weight: {(weight * 100).toFixed(0)}%
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ProjectRegistryDetail() {
  const { slug } = useParams<{ slug: string }>();

  // Fetch project
  const {
    data: project,
    isLoading: projectLoading,
    error: projectError,
  } = trpc.projectRegistry.getBySlug.useQuery({ slug: slug || "" }, {
    enabled: !!slug,
  });

  // Fetch gap analysis
  const { data: gapAnalysis } = trpc.projectRegistry.getGapAnalysis.useQuery(
    { slug: slug || "" },
    { enabled: !!slug }
  );

  // Fetch assessment calculation
  const { data: assessment } = trpc.projectAssessment.calculate.useQuery(
    { projectId: project?.id || 0 },
    { enabled: !!project?.id }
  );

  // Compute coordinates for climate panel
  const projectCoordinates = useMemo(() => {
    if (!project?.latitude || !project?.longitude) return null;
    const lat = parseFloat(project.latitude);
    const lng = parseFloat(project.longitude);
    if (isNaN(lat) || isNaN(lng)) return null;
    return { lat, lng };
  }, [project?.latitude, project?.longitude]);

  if (projectLoading) {
    return (
      <div className="container mx-auto px-4 py-12 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (projectError || !project) {
    return (
      <div className="container mx-auto px-4 py-12">
        <Card className="border-destructive">
          <CardContent className="p-12 text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-destructive mb-4" />
            <h3 className="font-semibold mb-2">Project not found</h3>
            <p className="text-muted-foreground mb-4">
              The project you're looking for doesn't exist or has been removed.
            </p>
            <Link href="/registry">
              <Button>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Registry
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isVerified = project.claimStatus === "verified";
  const statusClass = STATUS_COLORS[project.status] || STATUS_COLORS.announced;
  const statusLabel = STATUS_LABELS[project.status] || project.status;

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Back Button */}
      <Link href="/registry">
        <Button variant="ghost" size="sm">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Registry
        </Button>
      </Link>

      {/* Hero Section */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <H1>{project.name}</H1>
                    {isVerified && (
                      <Badge className="bg-[#D4AF37] text-black">
                        <BadgeCheck className="h-4 w-4 mr-1" />
                        Verified
                      </Badge>
                    )}
                  </div>
                  <p className="text-lg text-muted-foreground">{project.company}</p>
                  {project.parentCompany && (
                    <p className="text-sm text-muted-foreground">
                      Part of {project.parentCompany}
                    </p>
                  )}
                </div>

                <div className="flex flex-col items-end gap-2">
                  <BankabilityBadge rating={project.bankabilityRating} size="lg" />
                  <SignalBadge signal={project.signal} size="md" />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{project.location}</span>
                    {project.state && (
                      <Badge variant="outline">{project.state}</Badge>
                    )}
                  </div>

                  {project.technology && (
                    <div className="flex items-center gap-2">
                      <Factory className="h-4 w-4 text-muted-foreground" />
                      <span>{project.technology}</span>
                    </div>
                  )}

                  {project.feedstock && (
                    <div className="flex items-center gap-2">
                      <Leaf className="h-4 w-4 text-muted-foreground" />
                      <span>{project.feedstock}</span>
                    </div>
                  )}

                  {project.capacity && (
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-muted-foreground" />
                      <span>{project.capacity}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={cn("text-sm", statusClass)}>
                      {statusLabel}
                    </Badge>
                  </div>

                  {project.biomass50km && project.biomass50km > 0 && (
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-emerald-600" />
                      <span className="text-emerald-600 font-semibold">
                        {project.biomass50km.toLocaleString()} t/yr within 50km
                      </span>
                    </div>
                  )}

                  {project.products && (project.products as string[]).length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {(project.products as string[]).map((product) => (
                        <Badge key={product} variant="secondary">
                          {product}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Description */}
              {project.publicDescription && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm text-muted-foreground">{project.publicDescription}</p>
                </div>
              )}

              {/* Assessment Notes */}
              {project.assessmentNotes && (
                <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Info className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <p className="text-sm italic">{project.assessmentNotes}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 6-Dimension Ratings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                6-Dimension Bankability Assessment
              </CardTitle>
              <CardDescription>
                Comprehensive rating across feedstock security, technology, carbon, offtake, and government support
              </CardDescription>
            </CardHeader>
            <CardContent>
              {assessment?.componentScores ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <RatingDimensionCard
                    title="Grower Contract"
                    rating={project.growerContractRating}
                    description={assessment.componentScores.growerContract.description}
                    score={assessment.componentScores.growerContract.score}
                    weight={assessment.componentScores.growerContract.weight}
                    type="growerContract"
                  />
                  <RatingDimensionCard
                    title="Tech Readiness"
                    rating={project.techReadinessRating}
                    description={assessment.componentScores.techReadiness.description}
                    score={assessment.componentScores.techReadiness.score}
                    weight={assessment.componentScores.techReadiness.weight}
                    type="techReadiness"
                  />
                  <RatingDimensionCard
                    title="Carbon Intensity"
                    rating={project.carbonIntensityRating}
                    description={assessment.componentScores.carbonIntensity.description}
                    score={assessment.componentScores.carbonIntensity.score}
                    weight={assessment.componentScores.carbonIntensity.weight}
                    type="carbonIntensity"
                  />
                  <RatingDimensionCard
                    title="Offtake Quality"
                    rating={project.offtakeRating}
                    description={assessment.componentScores.offtake.description}
                    score={assessment.componentScores.offtake.score}
                    weight={assessment.componentScores.offtake.weight}
                    type="offtake"
                  />
                  <RatingDimensionCard
                    title="Gov Support"
                    rating={project.govSupportRating}
                    description={assessment.componentScores.govSupport.description}
                    score={assessment.componentScores.govSupport.score}
                    weight={assessment.componentScores.govSupport.weight}
                    type="govSupport"
                  />
                  <Card className="h-full">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <DataLabel className="text-xs">Biomass Availability</DataLabel>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        {assessment.componentScores.biomassAvailability.description}
                      </p>
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span>Score</span>
                          <span className="font-mono">
                            {assessment.componentScores.biomassAvailability.score?.toFixed(0) ?? "N/A"}/100
                          </span>
                        </div>
                        <Progress
                          value={assessment.componentScores.biomassAvailability.score ?? 0}
                          className="h-1.5"
                        />
                        <div className="text-xs text-muted-foreground">
                          Weight: {(assessment.componentScores.biomassAvailability.weight * 100).toFixed(0)}%
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  <RatingBadgesRow
                    growerContract={project.growerContractRating}
                    techReadiness={project.techReadinessRating}
                    carbonIntensity={project.carbonIntensityRating}
                    offtake={project.offtakeRating}
                    govSupport={project.govSupportRating}
                    size="md"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Claim CTA */}
          {!isVerified && (
            <Card className="border-primary/50 bg-primary/5">
              <CardContent className="p-6 text-center">
                <Users className="h-10 w-10 mx-auto text-primary mb-3" />
                <h3 className="font-semibold mb-2">Is this your project?</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Claim this project to manage its public profile and improve visibility.
                </p>
                <Link href={`/registry/claim?project=${project.slug}`}>
                  <Button className="w-full gap-2">
                    <BadgeCheck className="h-4 w-4" />
                    Claim This Project
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Gap Analysis */}
          {gapAnalysis && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Profile Completeness</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Completeness</span>
                      <span className="font-mono font-semibold">
                        {gapAnalysis.completenessScore}%
                      </span>
                    </div>
                    <Progress value={gapAnalysis.completenessScore} className="h-2" />
                  </div>

                  <div className="text-sm text-muted-foreground">
                    {gapAnalysis.completeFields} of {gapAnalysis.totalFields} fields complete
                  </div>

                  {gapAnalysis.missingFields.length > 0 && (
                    <div className="space-y-2">
                      <DataLabel className="text-xs">Missing Information</DataLabel>
                      <ul className="space-y-1">
                        {gapAnalysis.missingFields.slice(0, 5).map((field) => (
                          <li key={field} className="flex items-center gap-2 text-sm">
                            <XCircle className="h-3 w-3 text-red-500" />
                            {field}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {gapAnalysis.recommendations.length > 0 && (
                    <div className="pt-3 border-t">
                      <DataLabel className="text-xs mb-2">Recommendations</DataLabel>
                      <ul className="space-y-2">
                        {gapAnalysis.recommendations.map((rec, i) => (
                          <li key={i} className="text-xs text-muted-foreground">
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Contact Info */}
          {(project.publicContactEmail || project.publicWebsite) && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Contact</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {project.publicContactEmail && (
                  <a
                    href={`mailto:${project.publicContactEmail}`}
                    className="flex items-center gap-2 text-sm text-primary hover:underline"
                  >
                    <Mail className="h-4 w-4" />
                    {project.publicContactEmail}
                  </a>
                )}
                {project.publicWebsite && (
                  <a
                    href={project.publicWebsite}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-primary hover:underline"
                  >
                    <Globe className="h-4 w-4" />
                    Website
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </CardContent>
            </Card>
          )}

          {/* Data Source */}
          <Card>
            <CardContent className="p-4">
              <DataLabel className="text-xs mb-2">Data Source</DataLabel>
              <p className="text-sm text-muted-foreground">
                {project.dataSource || "Public announcements"}
              </p>
              {project.lastVerifiedAt && (
                <p className="text-xs text-muted-foreground mt-1">
                  Last verified: {new Date(project.lastVerifiedAt).toLocaleDateString()}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Climate Intelligence Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Satellite className="h-5 w-5 text-primary" />
            Location Climate Intelligence
          </CardTitle>
          <CardDescription>
            Satellite and weather data for this project location
          </CardDescription>
        </CardHeader>
        <CardContent>
          {projectCoordinates ? (
            <div className="flex justify-center">
              <UnifiedClimatePanel
                coordinates={projectCoordinates}
                className="w-full max-w-lg"
              />
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Location coordinates not available</p>
              <p className="text-sm">
                Climate intelligence requires project latitude and longitude
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
