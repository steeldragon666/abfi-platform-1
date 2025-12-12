import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Award, Building2, Leaf, Package, ShoppingCart, Shield, TrendingUp } from "lucide-react";
import { Link, Redirect } from "wouter";

export default function Dashboard() {
  const { user, isAuthenticated, loading } = useAuth();
  const { data: profile, isLoading: profileLoading } = trpc.auth.getProfile.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  if (loading || profileLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="border-b bg-white">
          <div className="container mx-auto px-4 py-4">
            <Skeleton className="h-8 w-32" />
          </div>
        </header>
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-12 w-64 mb-8" />
          <div className="grid md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-48" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Redirect to="/" />;
  }

  // Check if user has supplier or buyer profile
  const hasSupplier = !!profile?.supplier;
  const hasBuyer = !!profile?.buyer;
  const isAdmin = user?.role === 'admin';

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
            <span className="text-sm text-gray-600">
              {user?.name || user?.email}
            </span>
            <Link href="/browse">
              <Button variant="ghost">Browse</Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-primary mb-2">Dashboard</h1>
          <p className="text-gray-600">
            Welcome back, {user?.name || 'User'}
          </p>
        </div>

        {/* Admin Section */}
        {isAdmin && (
          <Card className="mb-8 border-primary">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-6 w-6 text-primary" />
                Admin Access
              </CardTitle>
              <CardDescription>
                You have administrative privileges
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Pending Verifications</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600">
                      Review supplier and feedstock submissions
                    </p>
                    <Button className="mt-4 w-full" size="sm">
                      View Queue
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Platform Stats</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600">
                      Monitor marketplace activity
                    </p>
                    <Button className="mt-4 w-full" size="sm">
                      View Analytics
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Audit Logs</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600">
                      Review system activity
                    </p>
                    <Button className="mt-4 w-full" size="sm">
                      View Logs
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Profile Selection */}
        {!hasSupplier && !hasBuyer ? (
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <Building2 className="h-12 w-12 text-primary mb-4" />
                <CardTitle>Register as Supplier</CardTitle>
                <CardDescription>
                  List your biofuel feedstocks and connect with buyers across Australia
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600 mb-6">
                  <li className="flex items-center gap-2">
                    <Award className="h-4 w-4 text-green-600" />
                    Get ABFI-rated for your feedstocks
                  </li>
                  <li className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-green-600" />
                    Manage multiple feedstock listings
                  </li>
                  <li className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    Receive buyer inquiries
                  </li>
                </ul>
                <Button className="w-full">
                  Create Supplier Profile
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <ShoppingCart className="h-12 w-12 text-primary mb-4" />
                <CardTitle>Register as Buyer</CardTitle>
                <CardDescription>
                  Source verified biofuel feedstocks from trusted suppliers
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600 mb-6">
                  <li className="flex items-center gap-2">
                    <Award className="h-4 w-4 text-green-600" />
                    Access ABFI-rated feedstocks
                  </li>
                  <li className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-green-600" />
                    Advanced search and filtering
                  </li>
                  <li className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    Send RFQs to suppliers
                  </li>
                </ul>
                <Button className="w-full">
                  Create Buyer Profile
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-6">
            {/* Supplier Dashboard */}
            {hasSupplier && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>My Feedstocks</CardTitle>
                    <CardDescription>Manage your listings</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-primary mb-2">
                      0
                    </div>
                    <p className="text-sm text-gray-600 mb-4">Active listings</p>
                    <Button className="w-full" size="sm">
                      View All
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Inquiries</CardTitle>
                    <CardDescription>Buyer requests</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-primary mb-2">
                      0
                    </div>
                    <p className="text-sm text-gray-600 mb-4">Pending responses</p>
                    <Button className="w-full" size="sm">
                      View Inquiries
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Verification</CardTitle>
                    <CardDescription>Account status</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm font-medium mb-2 capitalize">
                      {profile.supplier?.verificationStatus?.replace('_', ' ')}
                    </div>
                    <p className="text-sm text-gray-600 mb-4">
                      {profile.supplier?.verificationStatus === 'verified' 
                        ? 'Your account is verified'
                        : 'Verification in progress'}
                    </p>
                    <Button className="w-full" size="sm" variant="outline">
                      View Details
                    </Button>
                  </CardContent>
                </Card>
              </>
            )}

            {/* Buyer Dashboard */}
            {hasBuyer && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>Saved Searches</CardTitle>
                    <CardDescription>Your preferences</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-primary mb-2">
                      0
                    </div>
                    <p className="text-sm text-gray-600 mb-4">Active searches</p>
                    <Button className="w-full" size="sm">
                      Manage Searches
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>My Inquiries</CardTitle>
                    <CardDescription>Sent requests</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-primary mb-2">
                      0
                    </div>
                    <p className="text-sm text-gray-600 mb-4">Total inquiries</p>
                    <Button className="w-full" size="sm">
                      View All
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Browse Feedstocks</CardTitle>
                    <CardDescription>Find suppliers</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-4">
                      Search verified feedstock sources
                    </p>
                    <Link href="/browse">
                      <Button className="w-full" size="sm">
                        Start Searching
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        )}

        {/* Quick Actions */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Link href="/browse">
                <Button variant="outline">Browse Feedstocks</Button>
              </Link>
              {hasSupplier && (
                <Button variant="outline">Add New Feedstock</Button>
              )}
              {hasBuyer && (
                <Button variant="outline">Create Saved Search</Button>
              )}
              <Button variant="outline">View Notifications</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
