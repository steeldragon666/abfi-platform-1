import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { Package, Plus, Edit, Eye, AlertCircle } from "lucide-react";
import { Link } from "wouter";
import { formatDate } from "@/const";

export default function SupplierFeedstocks() {
  const { user, loading: authLoading } = useAuth();
  
  const { data: feedstocks, isLoading } = trpc.feedstocks.list.useQuery(
    undefined,
    { enabled: !!user }
  );

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Skeleton className="h-8 w-64 mx-auto mb-4" />
          <Skeleton className="h-4 w-48 mx-auto" />
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-800";
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "draft": return "bg-gray-100 text-gray-800";
      case "suspended": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getVerificationColor = (level: string) => {
    switch (level) {
      case "verified": return "bg-blue-100 text-blue-800";
      case "self_reported": return "bg-gray-100 text-gray-800";
      case "third_party": return "bg-purple-100 text-purple-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold mb-2">My Feedstocks</h1>
            <p className="text-muted-foreground">
              Manage your feedstock listings
            </p>
          </div>
          <Link href="/feedstock/create">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add New Feedstock
            </Button>
          </Link>
        </div>

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
        ) : feedstocks && feedstocks.length > 0 ? (
          <div className="space-y-4">
            {feedstocks.map((feedstock: any) => (
              <Card key={feedstock.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2">
                        <Package className="h-5 w-5" />
                        {feedstock.abfiId || `ABFI-${feedstock.id}`}
                      </CardTitle>
                      <CardDescription className="mt-2">
                        {feedstock.category} • {feedstock.type} • {feedstock.state}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Badge className={getStatusColor(feedstock.status)}>
                        {feedstock.status.toUpperCase()}
                      </Badge>
                      <Badge className={getVerificationColor(feedstock.verificationLevel)}>
                        {feedstock.verificationLevel?.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground">ABFI Score</div>
                      <div className="text-2xl font-bold text-primary">
                        {feedstock.abfiScore?.toFixed(1) || 'N/A'}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Grade: {feedstock.abfiGrade || 'Pending'}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Annual Capacity</div>
                      <div className="font-medium">
                        {feedstock.annualCapacity?.toLocaleString() || 'N/A'} tonnes
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Available Volume</div>
                      <div className="font-medium">
                        {feedstock.availableVolume?.toLocaleString() || 'N/A'} tonnes
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Price</div>
                      <div className="font-medium">
                        ${feedstock.pricePerTonne?.toFixed(2) || 'N/A'}/tonne
                      </div>
                    </div>
                  </div>

                  {feedstock.status === 'pending' && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-start gap-2">
                      <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                      <div className="text-sm">
                        <div className="font-medium text-yellow-900">Pending Verification</div>
                        <div className="text-yellow-700">
                          Your feedstock is under review by ABFI administrators
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Link href={`/feedstock/${feedstock.id}`}>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                    </Link>
                    <Link href={`/feedstock/edit/${feedstock.id}`}>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                    </Link>
                    {feedstock.status === 'active' && (
                      <Button variant="outline" size="sm">
                        Suspend
                      </Button>
                    )}
                    {feedstock.status === 'suspended' && (
                      <Button variant="outline" size="sm">
                        Reactivate
                      </Button>
                    )}
                  </div>

                  <div className="text-xs text-muted-foreground">
                    Created {formatDate(feedstock.createdAt)} • Last updated {formatDate(feedstock.updatedAt)}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No feedstocks listed yet</h3>
              <p className="text-muted-foreground mb-4">
                Start by adding your first feedstock listing
              </p>
              <Link href="/feedstock/create">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add New Feedstock
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
