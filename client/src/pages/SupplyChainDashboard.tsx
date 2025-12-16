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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { trpc } from "@/lib/trpc";
import {
  Truck,
  Package,
  MapPin,
  Clock,
  CheckCircle2,
  Camera,
  FileText,
  Ship,
  Train,
  Plane,
  RefreshCw,
  Plus,
  Eye,
  Navigation,
  Weight,
  Calendar,
  ArrowRight,
  AlertCircle,
} from "lucide-react";
import { Redirect } from "wouter";
import { cn } from "@/lib/utils";
import {
  PageWrapper,
  FadeInUp,
} from "@/components/ui/motion";
import DashboardLayout from "@/components/DashboardLayout";
import { useState, useCallback } from "react";
import { toast } from "sonner";

// Stats card component
function StatsCard({
  title,
  value,
  icon: Icon,
  variant = "default",
  description,
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  variant?: "default" | "success" | "warning" | "info" | "pending";
  description?: string;
}) {
  const variantStyles = {
    default: "bg-white",
    success: "bg-emerald-50 border-emerald-200",
    warning: "bg-amber-50 border-amber-200",
    info: "bg-blue-50 border-blue-200",
    pending: "bg-orange-50 border-orange-200",
  };

  const iconStyles = {
    default: "text-slate-600",
    success: "text-emerald-600",
    warning: "text-amber-600",
    info: "text-blue-600",
    pending: "text-orange-600",
  };

  return (
    <Card className={cn("border", variantStyles[variant])}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground font-medium">{title}</p>
            <p className="text-3xl font-bold mt-1 font-mono">{value}</p>
            {description && (
              <p className="text-xs text-muted-foreground mt-1">{description}</p>
            )}
          </div>
          <div
            className={cn(
              "p-2 rounded-lg bg-slate-100",
              variant !== "default" && "bg-white/50"
            )}
          >
            <Icon className={cn("h-5 w-5", iconStyles[variant])} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Status badge for consignments
function ConsignmentStatusBadge({ status }: { status: string }) {
  const statusConfig: Record<string, { label: string; className: string }> = {
    created: { label: "Created", className: "bg-slate-100 text-slate-800" },
    dispatched: { label: "Dispatched", className: "bg-blue-100 text-blue-800" },
    in_transit: { label: "In Transit", className: "bg-amber-100 text-amber-800" },
    delivered: { label: "Delivered", className: "bg-purple-100 text-purple-800" },
    verified: { label: "Verified", className: "bg-emerald-100 text-emerald-800" },
    rejected: { label: "Rejected", className: "bg-red-100 text-red-800" },
  };

  const config = statusConfig[status] || { label: status, className: "bg-slate-100 text-slate-800" };

  return (
    <Badge className={cn("font-medium", config.className)}>
      {config.label}
    </Badge>
  );
}

// Transport mode icon
function TransportIcon({ mode }: { mode: string }) {
  const icons: Record<string, React.ElementType> = {
    road_truck: Truck,
    road_van: Truck,
    rail_freight: Train,
    sea_container: Ship,
    sea_bulk: Ship,
    air_cargo: Plane,
    barge: Ship,
    pipeline: Navigation,
  };

  const Icon = icons[mode] || Truck;
  return <Icon className="h-4 w-4" />;
}

// Create Consignment Dialog
function CreateConsignmentDialog({ onSuccess }: { onSuccess: () => void }) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    originSupplierId: "",
    feedstockType: "",
    declaredVolumeTonnes: "",
    destinationName: "",
    originLat: "",
    originLng: "",
    destinationLat: "",
    destinationLng: "",
  });

  const createMutation = trpc.supplyChain.createConsignment.useMutation({
    onSuccess: (data) => {
      toast.success(`Consignment ${data.consignmentId} created`);
      setOpen(false);
      onSuccess();
      setFormData({
        originSupplierId: "",
        feedstockType: "",
        declaredVolumeTonnes: "",
        destinationName: "",
        originLat: "",
        originLng: "",
        destinationLat: "",
        destinationLng: "",
      });
    },
    onError: (error) => {
      toast.error(`Failed to create consignment: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      originSupplierId: parseInt(formData.originSupplierId, 10),
      feedstockType: formData.feedstockType,
      declaredVolumeTonnes: parseFloat(formData.declaredVolumeTonnes),
      destinationName: formData.destinationName || undefined,
      originLat: formData.originLat || undefined,
      originLng: formData.originLng || undefined,
      destinationLat: formData.destinationLat || undefined,
      destinationLng: formData.destinationLng || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="btn-gold">
          <Plus className="h-4 w-4 mr-2" />
          New Consignment
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Create Consignment</DialogTitle>
          <DialogDescription>
            Register a new feedstock shipment in the supply chain
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="originSupplierId">Supplier ID *</Label>
              <Input
                id="originSupplierId"
                type="number"
                value={formData.originSupplierId}
                onChange={(e) => setFormData({ ...formData, originSupplierId: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="feedstockType">Feedstock Type *</Label>
              <Select
                value={formData.feedstockType}
                onValueChange={(v) => setFormData({ ...formData, feedstockType: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bamboo">Bamboo</SelectItem>
                  <SelectItem value="sugarcane">Sugarcane</SelectItem>
                  <SelectItem value="wheat_straw">Wheat Straw</SelectItem>
                  <SelectItem value="canola">Canola</SelectItem>
                  <SelectItem value="tallow">Tallow</SelectItem>
                  <SelectItem value="used_cooking_oil">Used Cooking Oil</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="declaredVolumeTonnes">Volume (tonnes) *</Label>
            <Input
              id="declaredVolumeTonnes"
              type="number"
              step="0.01"
              value={formData.declaredVolumeTonnes}
              onChange={(e) => setFormData({ ...formData, declaredVolumeTonnes: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="destinationName">Destination</Label>
            <Input
              id="destinationName"
              value={formData.destinationName}
              onChange={(e) => setFormData({ ...formData, destinationName: e.target.value })}
              placeholder="e.g., Brisbane Refinery"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="originLat">Origin Latitude</Label>
              <Input
                id="originLat"
                value={formData.originLat}
                onChange={(e) => setFormData({ ...formData, originLat: e.target.value })}
                placeholder="-27.4698"
              />
            </div>
            <div>
              <Label htmlFor="originLng">Origin Longitude</Label>
              <Input
                id="originLng"
                value={formData.originLng}
                onChange={(e) => setFormData({ ...formData, originLng: e.target.value })}
                placeholder="153.0251"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Creating..." : "Create Consignment"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Consignment Detail Dialog
function ConsignmentDetailDialog({ id }: { id: number }) {
  const [open, setOpen] = useState(false);
  const { data: consignment, isLoading } = trpc.supplyChain.getConsignment.useQuery(
    { id },
    { enabled: open }
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Eye className="h-4 w-4 mr-1" />
          View
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Consignment Details
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : consignment ? (
          <div className="space-y-6">
            {/* Header Info */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground">Consignment ID</Label>
                <p className="font-mono font-medium">{consignment.consignmentId}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Status</Label>
                <div className="mt-1">
                  <ConsignmentStatusBadge status={consignment.status} />
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Feedstock</Label>
                <p className="font-medium capitalize">{consignment.feedstockType}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Volume</Label>
                <p className="font-medium">{consignment.declaredVolumeTonnes} tonnes</p>
              </div>
            </div>

            {/* Supplier Info */}
            {consignment.supplier && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Origin Supplier</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="font-medium">{consignment.supplier.companyName}</p>
                  {consignment.originLat && consignment.originLng && (
                    <p className="text-sm text-muted-foreground">
                      <MapPin className="h-3 w-3 inline mr-1" />
                      {consignment.originLat}, {consignment.originLng}
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Freight Legs */}
            {consignment.freightLegs && consignment.freightLegs.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Truck className="h-4 w-4" />
                    Freight Legs ({consignment.freightLegs.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {consignment.freightLegs.map((leg: any, idx: number) => (
                      <div key={leg.id} className="flex items-center gap-4 p-3 bg-slate-50 rounded-lg">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white border">
                          <span className="text-sm font-medium">{leg.legNumber}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <TransportIcon mode={leg.transportMode} />
                          <span className="text-sm capitalize">{leg.transportMode.replace(/_/g, ' ')}</span>
                        </div>
                        <div className="flex-1 text-sm text-muted-foreground">
                          {leg.distanceKm} km
                        </div>
                        {leg.emissionsKgCo2e && (
                          <Badge variant="outline" className="text-xs">
                            {leg.emissionsKgCo2e} kg CO2e
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Evidence */}
            {consignment.evidence && consignment.evidence.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Camera className="h-4 w-4" />
                    Evidence ({consignment.evidence.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {consignment.evidence.map((ev: any) => (
                      <div key={ev.id} className="p-3 bg-slate-50 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium capitalize">
                            {ev.evidenceType.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {ev.mimeType}
                        </p>
                        {ev.verified && (
                          <Badge className="mt-2 bg-emerald-100 text-emerald-800 text-xs">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Verified
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <AlertCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Consignment not found</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default function SupplyChainDashboard() {
  const { user, isAuthenticated, loading } = useAuth();
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Fetch stats
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = trpc.supplyChain.getSupplyChainStats.useQuery({});

  // Fetch consignments
  const { data: consignmentsData, isLoading: consignmentsLoading, refetch: refetchConsignments } = trpc.supplyChain.listConsignments.useQuery({
    status: statusFilter !== "all" ? statusFilter as any : undefined,
    limit: 50,
  });

  const handleRefresh = useCallback(() => {
    refetchStats();
    refetchConsignments();
    toast.success("Data refreshed");
  }, [refetchStats, refetchConsignments]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-10 w-64 mb-2" />
          <Skeleton className="h-5 w-48 mb-8" />
          <div className="grid md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Redirect to="/" />;
  }

  return (
    <DashboardLayout>
      <PageWrapper className="max-w-7xl">
        {/* Header */}
        <FadeInUp className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-1 flex items-center gap-3">
                <Truck className="h-8 w-8 text-blue-600" />
                Supply Chain
              </h1>
              <p className="text-muted-foreground">
                Track consignments, freight legs, and chain of custody evidence
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={handleRefresh}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <CreateConsignmentDialog onSuccess={() => { refetchConsignments(); refetchStats(); }} />
            </div>
          </div>
        </FadeInUp>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          {statsLoading ? (
            <>
              {[1, 2, 3, 4, 5].map(i => (
                <Skeleton key={i} className="h-24 rounded-xl" />
              ))}
            </>
          ) : (
            <>
              <StatsCard
                title="Total Consignments"
                value={stats?.totalConsignments || 0}
                icon={Package}
                description="All shipments"
              />
              <StatsCard
                title="In Transit"
                value={stats?.inTransit || 0}
                icon={Truck}
                variant="warning"
                description="Currently moving"
              />
              <StatsCard
                title="Delivered"
                value={stats?.delivered || 0}
                icon={MapPin}
                variant="info"
                description="Arrived at destination"
              />
              <StatsCard
                title="Verified"
                value={stats?.verified || 0}
                icon={CheckCircle2}
                variant="success"
                description="Fully verified"
              />
              <StatsCard
                title="Total Volume"
                value={`${stats?.totalVolumeTonnes?.toLocaleString() || 0}t`}
                icon={Weight}
                description="Tonnes tracked"
              />
            </>
          )}
        </div>

        {/* Main Content */}
        <Tabs defaultValue="consignments" className="space-y-6">
          <TabsList>
            <TabsTrigger value="consignments">Consignments</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="map">Map View</TabsTrigger>
          </TabsList>

          <TabsContent value="consignments">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      Consignments
                    </CardTitle>
                    <CardDescription>
                      All registered feedstock shipments
                    </CardDescription>
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Filter status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="created">Created</SelectItem>
                      <SelectItem value="dispatched">Dispatched</SelectItem>
                      <SelectItem value="in_transit">In Transit</SelectItem>
                      <SelectItem value="delivered">Delivered</SelectItem>
                      <SelectItem value="verified">Verified</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                {consignmentsLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : consignmentsData?.consignments && consignmentsData.consignments.length > 0 ? (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Consignment ID</TableHead>
                          <TableHead>Feedstock</TableHead>
                          <TableHead>Volume</TableHead>
                          <TableHead>Origin</TableHead>
                          <TableHead>Destination</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Created</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {consignmentsData.consignments.map((consignment: any) => (
                          <TableRow key={consignment.id}>
                            <TableCell className="font-mono text-sm">
                              {consignment.consignmentId}
                            </TableCell>
                            <TableCell className="capitalize">
                              {consignment.feedstockType}
                            </TableCell>
                            <TableCell>
                              {consignment.declaredVolumeTonnes}t
                            </TableCell>
                            <TableCell>
                              {consignment.originLat && consignment.originLng ? (
                                <span className="text-xs text-muted-foreground">
                                  <MapPin className="h-3 w-3 inline mr-1" />
                                  {parseFloat(consignment.originLat).toFixed(2)}, {parseFloat(consignment.originLng).toFixed(2)}
                                </span>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {consignment.destinationName || (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <ConsignmentStatusBadge status={consignment.status} />
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {consignment.createdAt ? new Date(consignment.createdAt).toLocaleDateString() : '-'}
                            </TableCell>
                            <TableCell className="text-right">
                              <ConsignmentDetailDialog id={consignment.id} />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No consignments found</p>
                    <p className="text-sm">Create a new consignment to get started</p>
                  </div>
                )}

                {consignmentsData && consignmentsData.total > 0 && (
                  <div className="mt-4 text-sm text-muted-foreground text-center">
                    Showing {consignmentsData.consignments.length} of {consignmentsData.total} consignments
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="timeline">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Supply Chain Timeline
                </CardTitle>
                <CardDescription>
                  Visual timeline of consignment movements
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Sample timeline - would be populated with real data */}
                  {[
                    { time: "10:30 AM", event: "Consignment CONS-20251217-ABC dispatched", type: "dispatched" },
                    { time: "09:15 AM", event: "Freight leg completed - Brisbane to Sydney", type: "transit" },
                    { time: "Yesterday", event: "Consignment CONS-20251216-XYZ verified", type: "verified" },
                    { time: "2 days ago", event: "Evidence uploaded - Weighbridge docket", type: "evidence" },
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-start gap-4">
                      <div className="flex flex-col items-center">
                        <div className={cn(
                          "w-3 h-3 rounded-full",
                          item.type === "verified" && "bg-emerald-500",
                          item.type === "dispatched" && "bg-blue-500",
                          item.type === "transit" && "bg-amber-500",
                          item.type === "evidence" && "bg-purple-500"
                        )} />
                        {idx < 3 && <div className="w-px h-8 bg-slate-200" />}
                      </div>
                      <div className="flex-1 pb-4">
                        <p className="text-sm text-muted-foreground">{item.time}</p>
                        <p className="text-sm">{item.event}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="map">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Geographic View
                </CardTitle>
                <CardDescription>
                  Map visualization of supply chain routes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-96 bg-slate-100 rounded-lg flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <MapPin className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>Map visualization coming soon</p>
                    <p className="text-sm">Will display consignment origins, destinations, and freight routes</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Transport Mode Legend */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-lg">Transport Modes</CardTitle>
            <CardDescription>ISO 14083 aligned transport classifications</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { mode: "road_truck", label: "Road Truck", icon: Truck },
                { mode: "rail_freight", label: "Rail Freight", icon: Train },
                { mode: "sea_container", label: "Sea Container", icon: Ship },
                { mode: "air_cargo", label: "Air Cargo", icon: Plane },
              ].map(({ mode, label, icon: Icon }) => (
                <div key={mode} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                  <div className="p-2 bg-white rounded-lg">
                    <Icon className="h-5 w-5 text-slate-600" />
                  </div>
                  <span className="text-sm font-medium">{label}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </PageWrapper>
    </DashboardLayout>
  );
}
