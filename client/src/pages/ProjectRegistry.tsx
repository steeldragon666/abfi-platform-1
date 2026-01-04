/**
 * Project Registry Page
 * Public registry of Australian bioenergy projects with filtering and search
 *
 * Features:
 * - Grid/List toggle view
 * - Filter by status, state, technology, feedstock
 * - Search by name, company, location
 * - Stats overview
 * - "Claim Your Project" CTA
 */

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Filter,
  Grid3X3,
  List,
  MapPin,
  Factory,
  Leaf,
  Users,
  BadgeCheck,
  TrendingUp,
  Building2,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { ProjectCard } from "@/components/registry/ProjectCard";
import { H1, Body, MetricValue, DataLabel } from "@/components/Typography";

// Status options
const STATUS_OPTIONS = [
  { value: "all", label: "All Statuses" },
  { value: "operational", label: "Operational" },
  { value: "development", label: "In Development" },
  { value: "feasibility", label: "Feasibility" },
  { value: "construction", label: "Under Construction" },
  { value: "announced", label: "Announced" },
  { value: "halted", label: "Halted" },
];

const STATE_OPTIONS = [
  { value: "all", label: "All States" },
  { value: "NSW", label: "New South Wales" },
  { value: "VIC", label: "Victoria" },
  { value: "QLD", label: "Queensland" },
  { value: "SA", label: "South Australia" },
  { value: "WA", label: "Western Australia" },
  { value: "TAS", label: "Tasmania" },
  { value: "NT", label: "Northern Territory" },
  { value: "ACT", label: "ACT" },
];

export default function ProjectRegistry() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [stateFilter, setStateFilter] = useState("all");
  const [technologyFilter, setTechnologyFilter] = useState("all");

  // Fetch projects
  const {
    data: projectsData,
    isLoading: projectsLoading,
    error: projectsError,
  } = trpc.projectRegistry.list.useQuery({
    status: statusFilter !== "all" ? statusFilter as any : undefined,
    state: stateFilter !== "all" ? stateFilter as any : undefined,
    technology: technologyFilter !== "all" ? technologyFilter : undefined,
    search: search || undefined,
    limit: 100,
  });

  // Fetch stats
  const { data: stats } = trpc.projectRegistry.getStats.useQuery();

  // Fetch filter options
  const { data: filterOptions } = trpc.projectRegistry.getFilterOptions.useQuery();

  const projects = projectsData?.projects || [];
  const totalProjects = projectsData?.total || 0;

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
            <H1>Australian Bioenergy Projects</H1>
          </div>
          <Body className="text-muted-foreground max-w-2xl">
            Comprehensive registry of bioenergy and sustainable aviation fuel projects across Australia.
            View project details, bankability ratings, and claim your project.
          </Body>
        </div>

        <Link href="/registry/claim">
          <Button size="lg" className="gap-2">
            <BadgeCheck className="h-5 w-5" />
            Claim Your Project
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <MetricValue className="text-2xl">{stats?.total || 0}</MetricValue>
            <DataLabel>Total Projects</DataLabel>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <MetricValue className="text-2xl text-green-600">{stats?.operational || 0}</MetricValue>
            <DataLabel>Operational</DataLabel>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <MetricValue className="text-2xl text-blue-600">{stats?.development || 0}</MetricValue>
            <DataLabel>In Development</DataLabel>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <MetricValue className="text-2xl text-amber-600">{stats?.feasibility || 0}</MetricValue>
            <DataLabel>Feasibility</DataLabel>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <MetricValue className="text-2xl text-red-600">{stats?.halted || 0}</MetricValue>
            <DataLabel>Halted</DataLabel>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <MetricValue className="text-2xl text-[#D4AF37]">{stats?.claimed || 0}</MetricValue>
            <DataLabel>Claimed</DataLabel>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, company, or location..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full lg:w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* State Filter */}
            <Select value={stateFilter} onValueChange={setStateFilter}>
              <SelectTrigger className="w-full lg:w-[180px]">
                <SelectValue placeholder="State" />
              </SelectTrigger>
              <SelectContent>
                {STATE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Technology Filter */}
            <Select value={technologyFilter} onValueChange={setTechnologyFilter}>
              <SelectTrigger className="w-full lg:w-[180px]">
                <SelectValue placeholder="Technology" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Technologies</SelectItem>
                {filterOptions?.technologies.map((tech) => (
                  <SelectItem key={tech} value={tech}>
                    {tech}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* View Toggle */}
            <div className="flex gap-1 border rounded-md p-1">
              <Button
                variant={viewMode === "grid" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("grid")}
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("list")}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results count */}
      <div className="flex items-center justify-between">
        <Body className="text-muted-foreground">
          Showing {projects.length} of {totalProjects} projects
        </Body>
        {(search || statusFilter !== "all" || stateFilter !== "all" || technologyFilter !== "all") && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearch("");
              setStatusFilter("all");
              setStateFilter("all");
              setTechnologyFilter("all");
            }}
          >
            Clear filters
          </Button>
        )}
      </div>

      {/* Loading State */}
      {projectsLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Error State */}
      {projectsError && (
        <Card className="border-destructive">
          <CardContent className="p-6 text-center">
            <p className="text-destructive">Failed to load projects. Please try again.</p>
          </CardContent>
        </Card>
      )}

      {/* Projects Grid/List */}
      {!projectsLoading && !projectsError && (
        <>
          {projects.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Factory className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold mb-2">No projects found</h3>
                <p className="text-muted-foreground">
                  Try adjusting your filters or search terms.
                </p>
              </CardContent>
            </Card>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {projects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {projects.map((project) => (
                <ProjectCard key={project.id} project={project} compact />
              ))}
            </div>
          )}
        </>
      )}

      {/* CTA Section */}
      <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
        <CardContent className="p-8 text-center">
          <BadgeCheck className="h-12 w-12 mx-auto text-primary mb-4" />
          <h3 className="text-xl font-semibold mb-2">Is your project listed?</h3>
          <p className="text-muted-foreground mb-4 max-w-lg mx-auto">
            Claim your project to manage its public profile, update information,
            and improve your bankability rating visibility.
          </p>
          <Link href="/registry/claim">
            <Button size="lg" className="gap-2">
              <Users className="h-5 w-5" />
              Claim Your Project
              <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
