/**
 * SupplierFutures - Supplier dashboard for managing futures listings.
 */
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { PageContainer } from "@/components/layout";
import {
  Sprout,
  Plus,
  Edit,
  Eye,
  TreeDeciduous,
  Leaf,
  Calendar,
  MapPin,
  TrendingUp,
  FileText,
  Users,
  ArrowRight,
  Package,
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { formatDate } from "@/const";

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
  bamboo: <Sprout className="h-5 w-5" />,
  rotation_forestry: <TreeDeciduous className="h-5 w-5" />,
  eucalyptus: <TreeDeciduous className="h-5 w-5" />,
  poplar: <TreeDeciduous className="h-5 w-5" />,
  willow: <TreeDeciduous className="h-5 w-5" />,
  miscanthus: <Leaf className="h-5 w-5" />,
  switchgrass: <Leaf className="h-5 w-5" />,
  arundo_donax: <Leaf className="h-5 w-5" />,
  hemp: <Leaf className="h-5 w-5" />,
  other_perennial: <Sprout className="h-5 w-5" />,
};

// Mock data for demonstration
const MOCK_FUTURES = [
  {
    id: 1,
    futuresId: "FUT-2025-0001",
    title: "Hunter Valley Eucalyptus Plantation",
    cropType: "eucalyptus",
    cropVariety: "E. grandis",
    state: "NSW",
    region: "Hunter Valley",
    landAreaHectares: "2500",
    projectionStartYear: 2025,
    projectionEndYear: 2035,
    totalProjectedTonnes: "250000",
    totalContractedTonnes: "75000",
    totalAvailableTonnes: "175000",
    indicativePricePerTonne: "120.00",
    status: "active",
    publishedAt: "2025-01-15",
    createdAt: "2025-01-10",
    eoiCounts: { total: 5, pending: 2, accepted: 2, declined: 1 },
  },
  {
    id: 2,
    futuresId: "FUT-2025-0002",
    title: "Gippsland Miscanthus Farm",
    cropType: "miscanthus",
    cropVariety: "M. x giganteus",
    state: "VIC",
    region: "Gippsland",
    landAreaHectares: "800",
    projectionStartYear: 2025,
    projectionEndYear: 2040,
    totalProjectedTonnes: "120000",
    totalContractedTonnes: "0",
    totalAvailableTonnes: "120000",
    indicativePricePerTonne: "95.00",
    status: "active",
    publishedAt: "2025-01-20",
    createdAt: "2025-01-18",
    eoiCounts: { total: 3, pending: 3, accepted: 0, declined: 0 },
  },
  {
    id: 3,
    futuresId: "FUT-2025-0003",
    title: "Wide Bay Bamboo Plantation",
    cropType: "bamboo",
    state: "QLD",
    region: "Wide Bay",
    landAreaHectares: "400",
    projectionStartYear: 2026,
    projectionEndYear: 2036,
    totalProjectedTonnes: "60000",
    totalContractedTonnes: "0",
    totalAvailableTonnes: "60000",
    indicativePricePerTonne: null,
    status: "draft",
    publishedAt: null,
    createdAt: "2025-01-25",
    eoiCounts: { total: 0, pending: 0, accepted: 0, declined: 0 },
  },
];

export default function SupplierFutures() {
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();

  const { data: apiFutures, isLoading } = trpc.futures.list.useQuery(
    undefined,
    { enabled: !!user }
  );

  // Use mock data if API returns empty
  const futures =
    apiFutures && apiFutures.length > 0 ? apiFutures : MOCK_FUTURES;
  const showingMockData = !apiFutures || apiFutures.length === 0;

  if (authLoading || !user) {
    return (
      <DashboardLayout>
        <div className="py-8">
          <Skeleton className="h-8 w-64 mx-auto mb-4" />
          <Skeleton className="h-4 w-48 mx-auto" />
        </div>
      </DashboardLayout>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "draft":
        return "bg-gray-100 text-gray-800";
      case "partially_contracted":
        return "bg-blue-100 text-blue-800";
      case "fully_contracted":
        return "bg-purple-100 text-purple-800";
      case "expired":
        return "bg-orange-100 text-orange-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatStatusLabel = (status: string) => {
    return status.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
  };

  // Calculate stats
  const stats = {
    active: futures?.filter((f: any) => f.status === "active").length || 0,
    totalProjected:
      futures?.reduce(
        (sum: number, f: any) =>
          sum + (parseFloat(f.totalProjectedTonnes || "0") || 0),
        0
      ) || 0,
    totalContracted:
      futures?.reduce(
        (sum: number, f: any) =>
          sum + (parseFloat(f.totalContractedTonnes || "0") || 0),
        0
      ) || 0,
    pendingEOIs:
      futures?.reduce(
        (sum: number, f: any) => sum + (f.eoiCounts?.pending || 0),
        0
      ) || 0,
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            {showingMockData && (
              <Badge className="mb-3 bg-amber-100 text-amber-800">
                Demo Data
              </Badge>
            )}
            <h1 className="text-2xl font-bold mb-1">
              Futures Listings
            </h1>
            <p className="text-muted-foreground">
              Manage your long-term perennial crop projections and EOIs
            </p>
          </div>
          <Button
            size="lg"
            onClick={() => setLocation("/supplier/futures/create")}
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Futures Listing
          </Button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-2">
                <Sprout className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Active Listings</span>
              </div>
              <div className="text-3xl font-bold font-mono">{stats.active}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Total Projected</span>
              </div>
              <div className="text-3xl font-bold font-mono">
                {(stats.totalProjected / 1000).toFixed(0)}k t
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Contracted</span>
              </div>
              <div className="text-3xl font-bold font-mono">
                {(stats.totalContracted / 1000).toFixed(0)}k t
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Pending EOIs</span>
              </div>
              <div className="text-3xl font-bold font-mono">
                {stats.pendingEOIs}
              </div>
              {stats.pendingEOIs > 0 && (
                <div className="text-xs text-amber-600 mt-1">
                  Requires attention
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : futures && futures.length > 0 ? (
          <div className="space-y-4">
            {futures.map((f: any) => {
              const availablePercent =
                parseFloat(f.totalProjectedTonnes || "0") > 0
                  ? (parseFloat(f.totalAvailableTonnes || "0") /
                      parseFloat(f.totalProjectedTonnes || "0")) *
                    100
                  : 100;
              const projectionYears =
                f.projectionEndYear - f.projectionStartYear + 1;

              return (
                <Card
                  key={f.id}
                  className="group hover:shadow-lg transition-all duration-200 hover:border-primary/30"
                >
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <CardTitle className="flex items-center gap-3">
                          <div className="p-2.5 bg-green-100 rounded-xl">
                            {CROP_TYPE_ICONS[f.cropType] || (
                              <Sprout className="h-5 w-5" />
                            )}
                          </div>
                          <div>
                            <span className="text-lg">{f.futuresId}</span>
                            <p className="text-sm font-normal text-muted-foreground">
                              {f.title ||
                                `${f.landAreaHectares}ha ${CROP_TYPE_LABELS[f.cropType]} plantation`}
                            </p>
                          </div>
                        </CardTitle>
                      </div>
                      <div className="flex gap-2">
                        <Badge className={getStatusColor(f.status)}>
                          {formatStatusLabel(f.status)}
                        </Badge>
                        <Badge variant="outline">
                          {CROP_TYPE_LABELS[f.cropType] || f.cropType}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {f.state}
                          {f.region ? `, ${f.region}` : ""}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {f.projectionStartYear} - {f.projectionEndYear} (
                          {projectionYears} years)
                        </span>
                      </div>
                      <div>
                        <div className="text-muted-foreground text-xs">
                          Land Area
                        </div>
                        <div className="font-semibold">
                          {parseFloat(f.landAreaHectares).toLocaleString()} ha
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground text-xs">
                          Indicative Price
                        </div>
                        <div className="font-semibold font-mono">
                          {f.indicativePricePerTonne
                            ? `$${parseFloat(f.indicativePricePerTonne).toFixed(2)}/t`
                            : "Negotiable"}
                        </div>
                      </div>
                    </div>

                    {/* Volume Stats */}
                    <div className="bg-muted/50 rounded-xl p-4 space-y-3">
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">
                            Total Projected
                          </span>
                          <p className="font-semibold font-mono">
                            {parseFloat(
                              f.totalProjectedTonnes || "0"
                            ).toLocaleString()}{" "}
                            t
                          </p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">
                            Contracted
                          </span>
                          <p className="font-semibold text-blue-600 font-mono">
                            {parseFloat(
                              f.totalContractedTonnes || "0"
                            ).toLocaleString()}{" "}
                            t
                          </p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">
                            Available
                          </span>
                          <p className="font-semibold text-green-600 font-mono">
                            {parseFloat(
                              f.totalAvailableTonnes || "0"
                            ).toLocaleString()}{" "}
                            t
                          </p>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-muted-foreground">
                            Availability
                          </span>
                          <span>{Math.round(availablePercent)}%</span>
                        </div>
                        <Progress value={availablePercent} className="h-2" />
                      </div>
                    </div>

                    {/* EOI Stats & Actions */}
                    <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t">
                      <div className="flex items-center gap-4">
                        {f.eoiCounts && f.eoiCounts.total > 0 ? (
                          <div className="flex items-center gap-2 text-sm">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span>
                              <strong>{f.eoiCounts.total}</strong> EOIs received
                            </span>
                            {f.eoiCounts.pending > 0 && (
                              <Badge
                                variant="secondary"
                                className="bg-amber-100 text-amber-800"
                              >
                                {f.eoiCounts.pending} pending
                              </Badge>
                            )}
                            {f.eoiCounts.accepted > 0 && (
                              <Badge className="bg-green-100 text-green-800">
                                {f.eoiCounts.accepted} accepted
                              </Badge>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            No EOIs yet
                          </span>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <Link href={`/supplier/futures/${f.id}`}>
                          <Button
                            variant="outline"
                            size="sm"
                            className="group-hover:border-primary group-hover:text-primary"
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </Button>
                        </Link>
                        {f.status === "draft" && (
                          <Link href={`/supplier/futures/create?edit=${f.id}`}>
                            <Button variant="outline" size="sm">
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </Button>
                          </Link>
                        )}
                        {f.eoiCounts?.pending > 0 && (
                          <Link href={`/supplier/futures/${f.id}?tab=eois`}>
                            <Button size="sm">
                              <Users className="h-4 w-4 mr-2" />
                              Review EOIs
                            </Button>
                          </Link>
                        )}
                      </div>
                    </div>

                    <div className="text-xs text-muted-foreground">
                      Created {formatDate(f.createdAt)}
                      {f.publishedAt &&
                        ` • Published ${formatDate(f.publishedAt)}`}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="border-dashed">
            <CardContent className="py-16 text-center">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-emerald-100 flex items-center justify-center">
                <Sprout className="h-8 w-8 text-emerald-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">
                No futures listings yet
              </h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Create your first futures listing to advertise long-term
                perennial crop supply and connect with buyers looking for
                reliable biomass sources.
              </p>
              <Button
                size="lg"
                onClick={() => setLocation("/supplier/futures/create")}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Futures Listing
              </Button>
            </CardContent>
          </Card>
        )}

        {/* CTA Section */}
        <Card className="bg-gradient-to-r from-emerald-50 to-teal-50 border">
          <CardContent className="py-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-emerald-100 rounded-xl">
                  <Package className="h-6 w-6 text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-semibold">View Your EOIs</h3>
                  <p className="text-sm text-muted-foreground">
                    Track and respond to expressions of interest from buyers
                  </p>
                </div>
              </div>
              <Link href="/buyer/eois">
                <Button variant="outline" className="gap-2">
                  View My EOIs
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
