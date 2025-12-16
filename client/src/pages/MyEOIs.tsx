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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { formatDate } from "@/const";
import {
  FileText,
  Calendar,
  MapPin,
  TrendingUp,
  DollarSign,
  TreeDeciduous,
  Sprout,
  Leaf,
  Eye,
  X,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  Building2,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";

// Mock data for demonstration
const MOCK_EOIS = [
  {
    id: 1,
    eoiReference: "EOI-2025-0001",
    status: "pending",
    interestStartYear: 2026,
    interestEndYear: 2030,
    annualVolumeTonnes: "5000",
    totalVolumeTonnes: "25000",
    offeredPricePerTonne: "135.00",
    deliveryLocation: "Port of Brisbane",
    additionalTerms: "Quarterly delivery preferred, flexible on timing",
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    futures: {
      id: 1,
      futuresId: "FUT-2025-0012",
      title: "Premium Eucalyptus Plantation - Hunter Valley",
      cropType: "eucalyptus",
      state: "NSW",
      region: "Hunter Valley",
      projectionStartYear: 2025,
      projectionEndYear: 2040,
    },
  },
  {
    id: 2,
    eoiReference: "EOI-2025-0002",
    status: "under_review",
    interestStartYear: 2027,
    interestEndYear: 2035,
    annualVolumeTonnes: "8000",
    totalVolumeTonnes: "72000",
    offeredPricePerTonne: "142.50",
    deliveryLocation: "Melbourne Processing Hub",
    additionalTerms: "Long-term partnership interest",
    createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
    futures: {
      id: 2,
      futuresId: "FUT-2025-0008",
      title: "Miscanthus Giganteus - Sustainable Biomass",
      cropType: "miscanthus",
      state: "VIC",
      region: "Gippsland",
      projectionStartYear: 2026,
      projectionEndYear: 2045,
    },
  },
  {
    id: 3,
    eoiReference: "EOI-2024-0089",
    status: "accepted",
    interestStartYear: 2025,
    interestEndYear: 2030,
    annualVolumeTonnes: "3500",
    totalVolumeTonnes: "21000",
    offeredPricePerTonne: "128.00",
    deliveryLocation: "Port of Newcastle",
    supplierResponse:
      "Thank you for your interest. We are pleased to accept your EOI and look forward to finalizing the contract terms.",
    respondedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    futures: {
      id: 3,
      futuresId: "FUT-2024-0045",
      title: "Bamboo Biomass Operation - Northern QLD",
      cropType: "bamboo",
      state: "QLD",
      region: "Atherton Tablelands",
      projectionStartYear: 2024,
      projectionEndYear: 2039,
    },
  },
  {
    id: 4,
    eoiReference: "EOI-2024-0076",
    status: "declined",
    interestStartYear: 2025,
    interestEndYear: 2028,
    annualVolumeTonnes: "2000",
    totalVolumeTonnes: "8000",
    offeredPricePerTonne: "105.00",
    deliveryLocation: "Adelaide",
    supplierResponse:
      "Thank you for your interest. Unfortunately, we have committed this volume to another buyer. We encourage you to browse our other listings.",
    respondedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    futures: {
      id: 4,
      futuresId: "FUT-2024-0038",
      title: "Willow Coppice System - Murray River",
      cropType: "willow",
      state: "SA",
      region: "Riverland",
      projectionStartYear: 2024,
      projectionEndYear: 2034,
    },
  },
  {
    id: 5,
    eoiReference: "EOI-2024-0065",
    status: "withdrawn",
    interestStartYear: 2025,
    interestEndYear: 2027,
    annualVolumeTonnes: "1500",
    totalVolumeTonnes: "4500",
    offeredPricePerTonne: null,
    deliveryLocation: "Perth",
    createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
    futures: {
      id: 5,
      futuresId: "FUT-2024-0029",
      title: "Industrial Hemp Farm - Margaret River",
      cropType: "hemp",
      state: "WA",
      region: "South West",
      projectionStartYear: 2024,
      projectionEndYear: 2034,
    },
  },
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

const EOI_STATUS_LABELS: Record<string, string> = {
  pending: "Pending Review",
  under_review: "Under Review",
  accepted: "Accepted",
  declined: "Declined",
  expired: "Expired",
  withdrawn: "Withdrawn",
};

const getEOIStatusColor = (status: string) => {
  switch (status) {
    case "pending":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "under_review":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "accepted":
      return "bg-emerald-100 text-emerald-800 border-emerald-200";
    case "declined":
      return "bg-red-100 text-red-800 border-red-200";
    case "expired":
    case "withdrawn":
      return "bg-gray-100 text-gray-600 border-gray-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

const getEOIStatusIcon = (status: string) => {
  switch (status) {
    case "pending":
      return <Clock className="h-5 w-5 text-yellow-600" />;
    case "under_review":
      return <AlertCircle className="h-5 w-5 text-blue-600" />;
    case "accepted":
      return <CheckCircle2 className="h-5 w-5 text-emerald-600" />;
    case "declined":
      return <XCircle className="h-5 w-5 text-red-600" />;
    case "withdrawn":
      return <X className="h-5 w-5 text-gray-600" />;
    default:
      return <Clock className="h-5 w-5 text-gray-600" />;
  }
};

export default function MyEOIs() {
  const { user, loading: authLoading } = useAuth();
  const utils = trpc.useUtils();

  const { data: apiEois, isLoading } = trpc.futures.myEOIs.useQuery(undefined, {
    enabled: !!user,
  });

  const withdrawMutation = trpc.futures.withdrawEOI.useMutation({
    onSuccess: () => {
      toast.success("EOI withdrawn successfully");
      utils.futures.myEOIs.invalidate();
    },
    onError: error => toast.error(error.message),
  });

  // Use mock data if API returns empty
  const eois = apiEois && apiEois.length > 0 ? apiEois : MOCK_EOIS;
  const isUsingMockData = !apiEois || apiEois.length === 0;

  if (authLoading || !user) {
    return (
      <DashboardLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center">
            <Skeleton className="h-8 w-64 mx-auto mb-4" />
            <Skeleton className="h-4 w-48 mx-auto" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Group EOIs by status
  const pendingEOIs =
    eois?.filter((e: any) => ["pending", "under_review"].includes(e.status)) ||
    [];
  const activeEOIs = eois?.filter((e: any) => e.status === "accepted") || [];
  const closedEOIs =
    eois?.filter((e: any) =>
      ["declined", "expired", "withdrawn"].includes(e.status)
    ) || [];

  // Stats
  const stats = {
    total: eois?.length || 0,
    pending: pendingEOIs.length,
    accepted: activeEOIs.length,
    totalVolume:
      eois?.reduce(
        (sum: number, e: any) => sum + parseFloat(e.totalVolumeTonnes || "0"),
        0
      ) || 0,
    acceptedVolume: activeEOIs.reduce(
      (sum: number, e: any) => sum + parseFloat(e.totalVolumeTonnes || "0"),
      0
    ),
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            <FileText className="h-7 w-7 text-primary" />
            <h1 className="text-2xl font-bold">My Expressions of Interest</h1>
            {isUsingMockData && (
              <Badge className="bg-amber-100 text-amber-800">
                <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                Demo Data
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground">
            Track and manage your submitted EOIs for futures listings
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="border-l-4 border-l-teal-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total EOIs
                </CardTitle>
                <FileText className="h-4 w-4 text-teal-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold font-mono">
                  {stats.total}
                </div>
                <p className="text-xs text-muted-foreground">
                  Submitted to suppliers
                </p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-yellow-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Pending Review
                </CardTitle>
                <Clock className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold font-mono">
                  {stats.pending}
                </div>
                <p className="text-xs text-muted-foreground">
                  Awaiting response
                </p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-emerald-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Accepted</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold font-mono">
                  {stats.accepted}
                </div>
                <p className="text-xs text-muted-foreground">
                  Ready for contract
                </p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-blue-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Contracted Volume
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold font-mono">
                  {stats.acceptedVolume.toLocaleString()}t
                </div>
                <p className="text-xs text-muted-foreground">Total committed</p>
              </CardContent>
            </Card>
        </div>

        {/* EOI List */}
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
          ) : eois && eois.length > 0 ? (
            <div className="space-y-10">
              {/* Pending EOIs */}
              {pendingEOIs.length > 0 && (
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-yellow-100 rounded-lg">
                      <Clock className="h-5 w-5 text-yellow-600" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">Pending Response</h2>
                      <p className="text-sm text-muted-foreground">
                        {pendingEOIs.length} EOI
                        {pendingEOIs.length !== 1 ? "s" : ""} awaiting supplier
                        review
                      </p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    {pendingEOIs.map((eoi: any) => (
                      <EOICard
                        key={eoi.id}
                        eoi={eoi}
                        onWithdraw={
                          !isUsingMockData
                            ? id => withdrawMutation.mutate({ eoiId: id })
                            : undefined
                        }
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Accepted EOIs */}
              {activeEOIs.length > 0 && (
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-emerald-100 rounded-lg">
                      <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">Accepted</h2>
                      <p className="text-sm text-muted-foreground">
                        {activeEOIs.length} EOI
                        {activeEOIs.length !== 1 ? "s" : ""} ready for
                        contracting
                      </p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    {activeEOIs.map((eoi: any) => (
                      <EOICard key={eoi.id} eoi={eoi} />
                    ))}
                  </div>
                </div>
              )}

              {/* Closed EOIs */}
              {closedEOIs.length > 0 && (
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      <XCircle className="h-5 w-5 text-gray-500" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-muted-foreground">
                        Closed
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        {closedEOIs.length} EOI
                        {closedEOIs.length !== 1 ? "s" : ""} declined, expired,
                        or withdrawn
                      </p>
                    </div>
                  </div>
                  <div className="space-y-4 opacity-75">
                    {closedEOIs.map((eoi: any) => (
                      <EOICard key={eoi.id} eoi={eoi} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Card className="max-w-2xl mx-auto">
              <CardContent className="py-16 text-center">
                <div className="w-20 h-20 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <FileText className="h-10 w-10 text-teal-600" />
                </div>
                <h3 className="text-2xl font-bold mb-3">No EOIs Yet</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  You haven't submitted any expressions of interest yet. Browse
                  the marketplace to find futures listings and secure your
                  long-term feedstock supply.
                </p>
                <Link href="/futures">
                  <Button size="lg" className="bg-teal-600 hover:bg-teal-700">
                    Browse Futures Marketplace
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
      </div>
    </DashboardLayout>
  );
}

function EOICard({
  eoi,
  onWithdraw,
}: {
  eoi: any;
  onWithdraw?: (id: number) => void;
}) {
  const f = eoi.futures;

  return (
    <Card className="hover:shadow-lg transition-all duration-200 hover:border-teal-200">
      <CardContent className="pt-6">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
          {/* EOI Info */}
          <div className="flex-1">
            <div className="flex items-start gap-4 mb-4">
              <div className="p-3 bg-emerald-100 rounded-xl shrink-0">
                {f ? (
                  CROP_TYPE_ICONS[f.cropType] || (
                    <Sprout className="h-5 w-5 text-emerald-600" />
                  )
                ) : (
                  <FileText className="h-5 w-5 text-emerald-600" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="font-bold text-lg">{eoi.eoiReference}</span>
                  <Badge className={getEOIStatusColor(eoi.status)}>
                    {EOI_STATUS_LABELS[eoi.status]}
                  </Badge>
                </div>
                {f && (
                  <p className="text-muted-foreground text-sm truncate">
                    {f.futuresId} • {f.title}
                  </p>
                )}
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm mb-4 p-4 bg-muted/30 rounded-lg">
              <div>
                <p className="text-muted-foreground text-xs uppercase tracking-wide mb-1">
                  Interest Period
                </p>
                <p className="font-semibold">
                  {eoi.interestStartYear} - {eoi.interestEndYear}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs uppercase tracking-wide mb-1">
                  Annual Volume
                </p>
                <p className="font-semibold font-mono">
                  {parseFloat(eoi.annualVolumeTonnes).toLocaleString()}t
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs uppercase tracking-wide mb-1">
                  Total Volume
                </p>
                <p className="font-semibold font-mono">
                  {parseFloat(eoi.totalVolumeTonnes).toLocaleString()}t
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs uppercase tracking-wide mb-1">
                  Offered Price
                </p>
                <p className="font-semibold font-mono">
                  {eoi.offeredPricePerTonne
                    ? `$${parseFloat(eoi.offeredPricePerTonne).toFixed(2)}/t`
                    : "Negotiable"}
                </p>
              </div>
            </div>

            {/* Futures Details */}
            {f && (
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-3">
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4" />
                  {f.state}
                  {f.region && `, ${f.region}`}
                </div>
                <div className="flex items-center gap-1.5">
                  <Building2 className="h-4 w-4" />
                  {CROP_TYPE_LABELS[f.cropType]}
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  {f.projectionStartYear} - {f.projectionEndYear}
                </div>
              </div>
            )}

            {/* Supplier Response */}
            {eoi.supplierResponse && (
              <div className="mt-4 p-4 bg-teal-50 border border-teal-100 rounded-lg">
                <p className="text-sm font-semibold text-teal-800 mb-1">
                  Supplier Response:
                </p>
                <p className="text-sm text-teal-700">{eoi.supplierResponse}</p>
                {eoi.respondedAt && (
                  <p className="text-xs text-teal-600 mt-2">
                    Responded {formatDate(eoi.respondedAt)}
                  </p>
                )}
              </div>
            )}

            <div className="mt-3 text-xs text-muted-foreground">
              Submitted {formatDate(eoi.createdAt)}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-row lg:flex-col gap-2 shrink-0">
            {f && (
              <Link href={`/futures/${f.id}`}>
                <Button variant="outline" size="sm" className="w-full">
                  <Eye className="h-4 w-4 mr-2" />
                  View Listing
                </Button>
              </Link>
            )}
            {["pending", "under_review"].includes(eoi.status) && onWithdraw && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 border-red-200 hover:bg-red-50 w-full"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Withdraw
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Withdraw EOI?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to withdraw this expression of
                      interest? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => onWithdraw(eoi.id)}
                      className="bg-destructive text-destructive-foreground"
                    >
                      Withdraw
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
