import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDate } from "@/const";
import { trpc } from "@/lib/trpc";
import { AlertCircle, CheckCircle2, Clock, Leaf, Shield, XCircle } from "lucide-react";
import { Link, Redirect } from "wouter";
import { toast } from "sonner";

export default function AdminDashboard() {
  const { user, isAuthenticated, loading } = useAuth();

  const { data: pendingSuppliers, isLoading: loadingSuppliers, refetch: refetchSuppliers } =
    trpc.admin.getPendingSuppliers.useQuery(undefined, {
      enabled: isAuthenticated && user?.role === "admin",
    });

  const { data: pendingFeedstocks, isLoading: loadingFeedstocks, refetch: refetchFeedstocks } =
    trpc.admin.getPendingFeedstocks.useQuery(undefined, {
      enabled: isAuthenticated && user?.role === "admin",
    });

  const verifySupplierMutation = trpc.admin.verifySupplier.useMutation({
    onSuccess: () => {
      toast.success("Supplier verified successfully");
      refetchSuppliers();
    },
    onError: (error: any) => {
      toast.error(error.message || "Verification failed");
    },
  });



  const verifyFeedstockMutation = trpc.admin.verifyFeedstock.useMutation({
    onSuccess: () => {
      toast.success("Feedstock verified successfully");
      refetchFeedstocks();
    },
    onError: (error: any) => {
      toast.error(error.message || "Verification failed");
    },
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="border-b bg-white">
          <div className="container mx-auto px-4 py-4">
            <Skeleton className="h-8 w-32" />
          </div>
        </header>
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-12 w-64" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== "admin") {
    return <Redirect to="/dashboard" />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/">
            <div className="flex items-center gap-2 cursor-pointer">
              <Leaf className="h-8 w-8 text-primary" />
              <span className="text-2xl font-bold text-primary">ABFI</span>
            </div>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost">Dashboard</Button>
            </Link>
            <Link href="/browse">
              <Button variant="ghost">Browse</Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold text-primary">Admin Dashboard</h1>
          </div>
          <p className="text-gray-600">Manage verifications and platform operations</p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Pending Suppliers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">
                {loadingSuppliers ? "..." : pendingSuppliers?.length || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Pending Feedstocks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">
                {loadingFeedstocks ? "..." : pendingFeedstocks?.length || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Verifications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                {((pendingSuppliers?.length || 0) + (pendingFeedstocks?.length || 0))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Platform Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium">Active</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Verification Tabs */}
        <Tabs defaultValue="suppliers" className="space-y-4">
          <TabsList>
            <TabsTrigger value="suppliers">
              Pending Suppliers ({pendingSuppliers?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="feedstocks">
              Pending Feedstocks ({pendingFeedstocks?.length || 0})
            </TabsTrigger>
          </TabsList>

          {/* Suppliers Tab */}
          <TabsContent value="suppliers">
            {loadingSuppliers ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-48 w-full" />
                ))}
              </div>
            ) : pendingSuppliers && pendingSuppliers.length > 0 ? (
              <div className="space-y-4">
                {pendingSuppliers.map((supplier) => (
                  <Card key={supplier.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle>{supplier.companyName}</CardTitle>
                          <CardDescription>ABN: {supplier.abn}</CardDescription>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Clock className="h-4 w-4" />
                          {formatDate(supplier.createdAt)}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-sm text-gray-600">Contact Email</p>
                          <p className="font-medium">{supplier.contactEmail}</p>
                        </div>
                        {supplier.contactPhone && (
                          <div>
                            <p className="text-sm text-gray-600">Contact Phone</p>
                            <p className="font-medium">{supplier.contactPhone}</p>
                          </div>
                        )}
                        {supplier.addressLine1 && (
                          <div>
                            <p className="text-sm text-gray-600">Address</p>
                            <p className="font-medium">
                              {supplier.addressLine1}
                              {supplier.city && `, ${supplier.city}`}
                              {supplier.state && ` ${supplier.state}`}
                            </p>
                          </div>
                        )}
                        {supplier.website && (
                          <div>
                            <p className="text-sm text-gray-600">Website</p>
                            <a
                              href={supplier.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-medium text-primary hover:underline"
                            >
                              {supplier.website}
                            </a>
                          </div>
                        )}
                      </div>

                      {supplier.description && (
                        <div className="mb-4">
                          <p className="text-sm text-gray-600 mb-1">Description</p>
                          <p className="text-sm">{supplier.description}</p>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => verifySupplierMutation.mutate({ supplierId: supplier.id, approved: true })}
                          disabled={verifySupplierMutation.isPending}
                        >
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Verify
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => verifySupplierMutation.mutate({ supplierId: supplier.id, approved: false })}
                          disabled={verifySupplierMutation.isPending}
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Reject
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">All Caught Up!</h3>
                  <p className="text-gray-600">No pending supplier verifications</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Feedstocks Tab */}
          <TabsContent value="feedstocks">
            {loadingFeedstocks ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-48 w-full" />
                ))}
              </div>
            ) : pendingFeedstocks && pendingFeedstocks.length > 0 ? (
              <div className="space-y-4">
                {pendingFeedstocks.map((feedstock) => (
                  <Card key={feedstock.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle>{feedstock.type}</CardTitle>
                          <CardDescription>
                            {feedstock.abfiId} • {feedstock.category}
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Clock className="h-4 w-4" />
                          {formatDate(feedstock.createdAt)}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid md:grid-cols-3 gap-4 mb-4">
                        <div>
                          <p className="text-sm text-gray-600">Location</p>
                          <p className="font-medium">{feedstock.state}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Annual Capacity</p>
                          <p className="font-medium">
                            {feedstock.annualCapacityTonnes.toLocaleString()} tonnes
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Available Now</p>
                          <p className="font-medium">
                            {feedstock.availableVolumeCurrent.toLocaleString()} tonnes
                          </p>
                        </div>
                      </div>

                      {feedstock.description && (
                        <div className="mb-4">
                          <p className="text-sm text-gray-600 mb-1">Description</p>
                          <p className="text-sm">{feedstock.description}</p>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() =>
                            verifyFeedstockMutation.mutate({ feedstockId: feedstock.id, approved: true })
                          }
                          disabled={verifyFeedstockMutation.isPending}
                        >
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Verify
                        </Button>
                        <Button size="sm" variant="outline">
                          <AlertCircle className="h-4 w-4 mr-2" />
                          Request More Info
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">All Caught Up!</h3>
                  <p className="text-gray-600">No pending feedstock verifications</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
