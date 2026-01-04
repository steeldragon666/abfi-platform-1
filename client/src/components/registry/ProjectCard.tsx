/**
 * Project Card Component
 * Compact card for displaying bioenergy project in grid view
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/Button";
import { MapPin, Factory, Leaf, Zap, ChevronRight, BadgeCheck, Users } from "lucide-react";
import { Link } from "wouter";
import { BankabilityBadge, RatingBadgesRow, SignalBadge } from "./RatingBadges";
import { cn } from "@/lib/utils";

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
  feasibility: "Feasibility",
  construction: "Under Construction",
  announced: "Announced",
  halted: "Halted",
  cancelled: "Cancelled",
};

interface ProjectCardProps {
  project: {
    id: number;
    slug: string;
    name: string;
    company: string;
    location: string;
    state?: string | null;
    status: string;
    technology?: string | null;
    feedstock?: string | null;
    capacity?: string | null;
    biomass50km?: number | null;
    bankabilityRating?: string | null;
    growerContractRating?: string | null;
    techReadinessRating?: string | null;
    carbonIntensityRating?: string | null;
    offtakeRating?: string | null;
    govSupportRating?: string | null;
    signal?: string | null;
    claimStatus?: string | null;
  };
  compact?: boolean;
}

export function ProjectCard({ project, compact = false }: ProjectCardProps) {
  const isVerified = project.claimStatus === "verified";
  const statusClass = STATUS_COLORS[project.status] || STATUS_COLORS.announced;
  const statusLabel = STATUS_LABELS[project.status] || project.status;

  if (compact) {
    return (
      <Link href={`/registry/project/${project.slug}`}>
        <Card className="h-full hover:shadow-md transition-all hover:-translate-y-0.5 cursor-pointer">
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-sm truncate">{project.name}</h3>
                <p className="text-xs text-muted-foreground truncate">{project.company}</p>
              </div>
              <BankabilityBadge rating={project.bankabilityRating} size="md" />
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
              <MapPin className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">{project.location}</span>
            </div>

            <div className="flex items-center justify-between">
              <Badge variant="outline" className={cn("text-[10px]", statusClass)}>
                {statusLabel}
              </Badge>
              {isVerified && (
                <Badge className="bg-[#D4AF37] text-black text-[10px]">
                  <BadgeCheck className="h-3 w-3 mr-0.5" />
                  Claimed
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </Link>
    );
  }

  return (
    <Link href={`/registry/project/${project.slug}`}>
      <Card className="h-full hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <CardTitle className="text-base truncate">{project.name}</CardTitle>
              <p className="text-sm text-muted-foreground truncate">{project.company}</p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <BankabilityBadge rating={project.bankabilityRating} size="lg" />
              <SignalBadge signal={project.signal} size="sm" />
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          {/* Location */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">{project.location}</span>
          </div>

          {/* Technology & Feedstock */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            {project.technology && (
              <div className="flex items-center gap-1.5">
                <Factory className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="truncate">{project.technology}</span>
              </div>
            )}
            {project.feedstock && (
              <div className="flex items-center gap-1.5">
                <Leaf className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="truncate">{project.feedstock}</span>
              </div>
            )}
          </div>

          {/* Capacity & Biomass */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            {project.capacity && (
              <div className="flex items-center gap-1.5">
                <Zap className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="truncate">{project.capacity}</span>
              </div>
            )}
            {project.biomass50km && project.biomass50km > 0 && (
              <div className="text-emerald-600 font-medium">
                {project.biomass50km.toLocaleString()} t/yr
              </div>
            )}
          </div>

          {/* Rating badges */}
          <RatingBadgesRow
            growerContract={project.growerContractRating}
            techReadiness={project.techReadinessRating}
            carbonIntensity={project.carbonIntensityRating}
            offtake={project.offtakeRating}
            govSupport={project.govSupportRating}
            size="sm"
            compact
          />

          {/* Footer */}
          <div className="flex items-center justify-between pt-2 border-t">
            <Badge variant="outline" className={cn("text-xs", statusClass)}>
              {statusLabel}
            </Badge>
            <div className="flex items-center gap-2">
              {isVerified ? (
                <Badge className="bg-[#D4AF37] text-black text-xs">
                  <BadgeCheck className="h-3 w-3 mr-1" />
                  Claimed
                </Badge>
              ) : (
                <Badge variant="outline" className="text-xs">
                  <Users className="h-3 w-3 mr-1" />
                  Unclaimed
                </Badge>
              )}
            </div>
          </div>

          {/* View button */}
          <Button variant="ghost" size="sm" className="w-full mt-2">
            View Details
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </CardContent>
      </Card>
    </Link>
  );
}
