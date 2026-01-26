/**
 * ABFI Grower Dashboard - Premium SaaS Experience
 *
 * Features:
 * - Generous spacing and clear information hierarchy
 * - Premium typography and component design
 * - Logical information architecture
 * - No cramped elements or maze-like navigation
 * - High-end iconography and cursor effects
 */

import { useEffect, useMemo, useState } from "react";
import { Plus, Bell, MapPin, Calendar, TrendingUp, AlertTriangle, Upload, Eye, Droplets, Shield, Star } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { PlatformMap } from "@/components/maps/PlatformMap";
import { CarbonWallet } from "@/components/carbon/CarbonWallet";
import { RefreshButton } from "@/components/ui/RefreshButton";
import {
  Leaf,
  CheckCircle2,
  Circle,
  ChevronRight,
  Sprout,
  ArrowRight,
  Wallet,
} from "lucide-react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";
import { H3, Body, MetricValue } from "@/components/Typography";
import { OnboardingModal } from "@/components/OnboardingModal";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { ClimateAlertsBar } from "@/components/climate/ClimateAlertsBar";
import { UnifiedClimatePanel } from "@/components/climate/UnifiedClimatePanel";

// Onboarding checklist items
const ONBOARDING_CHECKLIST = [
  { id:"account", label:"Create Account", completed: true },
  { id:"profile", label:"Business Profile", completed: true },
  { id:"feedstock", label:"Register Feedstock", completed: false },
  { id:"certification", label:"Upload Certifications", completed: false },
  { id:"verification", label:"Complete Verification", completed: false },
];

// Priority actions - smart recommendations based on user state
const PRIORITY_ACTIONS = [
  {
    id:"register",
    title:"Register Your First Feedstock",
    description:"Start by adding your feedstock details to get discovered by buyers",
    icon: Plus,
    priority:"high",
    href:"/feedstock/create",
    cta:"Add Feedstock",
  },
  {
    id:"certification",
    title:"Upload Sustainability Certification",
    description:"ISCC or RSB certification increases buyer confidence",
    icon: Upload,
    priority:"medium",
    href:"/certificate/upload",
    cta:"Upload Certificate",
  },
  {
    id:"inquiry",
    title:"New Inquiry Received",
    description:"Biodiesel Australia is interested in your canola supply",
    icon: Bell,
    priority:"high",
    href:"/inquiries/supplier",
    cta:"View Inquiry",
  },
];

export default function GrowerDashboard() {
  const { user, loading: authLoading } = useAuth();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const utils = trpc.useUtils();

  const {
    data: feedstocks,
    isLoading: feedstocksLoading,
    refetch: refetchFeedstocks,
  } = trpc.feedstocks.list.useQuery(undefined, { enabled: !!user });

  const {
    data: inquiries,
    isLoading: inquiriesLoading,
    refetch: refetchInquiries,
  } = trpc.inquiries.listForSupplier.useQuery(undefined, { enabled: !!user });

  const { data: climateAlerts, isLoading: alertsLoading } =
    trpc.climateHub.getClimateAlerts.useQuery({});

  // Check if user should see onboarding
  useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem('abfi_onboarding_completed');
    const hasSkippedOnboarding = localStorage.getItem('abfi_onboarding_skipped');
    
    if (!hasSeenOnboarding && !hasSkippedOnboarding) {
      const timer = setTimeout(() => setShowOnboarding(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);
  const completedSteps = ONBOARDING_CHECKLIST.filter((item) => item.completed).length;
  const totalSteps = ONBOARDING_CHECKLIST.length;
  const progressPercent = (completedSteps / totalSteps) * 100;


  const listings = Array.isArray(feedstocks) ? feedstocks : [];
  const supplierInquiries = Array.isArray(inquiries) ? inquiries : [];
  const primaryLocation = listings.find((l: any) => l.latitude && l.longitude) || null;
  const primaryCoordinates = primaryLocation
    ? { lat: parseFloat(primaryLocation.latitude), lng: parseFloat(primaryLocation.longitude) }
    : null;

  const activeListings = listings.filter((l: any) => l.status === "active").length;
  const totalVolume = listings.reduce(
    (sum: number, l: any) => sum + (l.availableVolume || 0),
    0
  );
  const pendingInquiries = supplierInquiries.filter((i: any) =>
    ["open", "responded"].includes(i.status)
  ).length;
  const avgRating = listings.length
    ? (
        listings.reduce((sum: number, l: any) => sum + (l.abfiScore || 0), 0) /
        listings.length
      ).toFixed(1)
    : "N/A";

  const quickStats = useMemo(
    () => [
      { label: "Active Listings", value: String(activeListings), icon: Leaf },
      { label: "Total Volume", value: totalVolume ? `${totalVolume.toLocaleString()} t` : "0 t", icon: TrendingUp },
      { label: "Pending Inquiries", value: String(pendingInquiries), icon: Bell },
      { label: "Avg. Rating", value: avgRating, icon: Star },
    ],
    [activeListings, totalVolume, pendingInquiries, avgRating]
  );

  const handleRefresh = async () => {
    await Promise.all([refetchFeedstocks(), refetchInquiries()]);
    await utils.notifications.list.invalidate();
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-background">
        <div className="premium-container py-12 space-y-4">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-6 w-96" />
          <div className="grid gap-4 md:grid-cols-2">
            <Skeleton className="h-40" />
            <Skeleton className="h-40" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background premium-fade-in">
      {/* Onboarding Modal */}
      <OnboardingModal
        isOpen={showOnboarding}
        onClose={() => setShowOnboarding(false)}
        userRole="grower"
      />

      {/* Premium Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="premium-container flex h-20 items-center justify-between">
          {/* Logo and Title */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center">
                <Leaf className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="premium-heading-xl text-foreground">Grower Dashboard</h1>
                <p className="text-sm text-muted-foreground">Manage your feedstock operations</p>
              </div>
            </div>
          </div>

          {/* Header Actions */}
          <div className="flex items-center space-x-3">
            <RefreshButton
              onRefresh={handleRefresh}
              isLoading={feedstocksLoading || inquiriesLoading}
              label="Refresh"
            />
            <Button variant="ghost" size="sm" className="premium-button">
              <Bell className="h-5 w-5" />
            </Button>
            <Badge variant="secondary" className="px-3 py-1">Premium Account</Badge>
          </div>
        </div>
      </header>

      {/* Quick Stats Bar - Premium Version */}
      <div className="border-b bg-gradient-to-r from-primary/5 to-secondary/5 py-3 px-4">
        <div className="premium-container">
          <div className="flex items-center justify-center gap-8">
            {quickStats.map((stat, index) => (
              <div key={index} className="flex items-center gap-3 px-4 py-2 rounded-lg bg-background/80 backdrop-blur-sm border border-primary/10">
                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                  <stat.icon className={cn("h-4 w-4 text-primary")} aria-hidden="true" />
                </div>
                <div className="text-center">
                  <div className="premium-metric text-primary">{stat.value}</div>
                  <div className="text-xs text-muted-foreground">{stat.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content - Premium Layout */}
      <main className="premium-container premium-section space-y-6">
        {progressPercent < 100 && (
          <Card className="border-emerald-200 bg-emerald-50/50">
            <CardHeader className="pb-2 pt-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2 text-gray-900">
                  <CheckCircle2 className="h-4 w-4 text-[#D4AF37]" aria-hidden="true" />
                  Complete Setup
                </CardTitle>
                <Badge variant="outline" className="text-xs bg-emerald-100 text-emerald-700">
                  {Math.round(progressPercent)}%
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pb-4">
              <Progress
                value={progressPercent}
                className="h-1.5 mb-3"
                aria-label={`Setup progress: ${Math.round(progressPercent)}% complete`}
              />
              <div className="space-y-1">
                {ONBOARDING_CHECKLIST.map((item) => (
                  <div
                    key={item.id}
                    className={cn(
                      "flex items-center gap-2 text-xs",
                      item.completed ? "text-emerald-700" : "text-gray-600"
                    )}
                  >
                    {item.completed ? (
                      <CheckCircle2 className="h-3 w-3 text-[#D4AF37]" />
                    ) : (
                      <Circle className="h-3 w-3" />
                    )}
                    <span className={item.completed ? "line-through text-gray-900" : ""}>
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="premium-card">
          <CardHeader className="pb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-warning/10 rounded-lg flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-warning" />
              </div>
              <div>
                <CardTitle className="premium-heading">Priority Actions</CardTitle>
                <CardDescription className="premium-body">
                  One-click access to core grower workflows.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2">
              {PRIORITY_ACTIONS.map((action) => (
                <Link key={action.id} href={action.href}>
                  <div
                    className={cn(
                      "flex items-center justify-between p-4 rounded-xl border transition-all hover:shadow-lg cursor-pointer group",
                      action.priority === "high"
                        ? "border-warning/30 bg-warning/5 hover:border-warning/50 hover:bg-warning/10"
                        : "border-muted hover:border-primary/30 hover:bg-primary/5"
                    )}
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform",
                          action.priority === "high" ? "bg-warning/10" : "bg-primary/10"
                        )}
                      >
                        <action.icon
                          className={cn(
                            "h-5 w-5",
                            action.priority === "high" ? "text-warning" : "text-primary"
                          )}
                        />
                      </div>
                      <div>
                        <p className="font-semibold">{action.title}</p>
                        <p className="text-sm text-muted-foreground">{action.description}</p>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        <section className="grid gap-6 lg:grid-cols-[1.35fr_1fr]">
          <Card className="premium-card">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="premium-heading">Spot Market Waste</CardTitle>
                  <CardDescription className="premium-body">
                    Live listings from your supplier profile.
                  </CardDescription>
                </div>
                <Link href="/feedstock/create">
                  <Button className="premium-button">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Listing
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {feedstocksLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              ) : listings.length === 0 ? (
                <div className="text-center py-10 border rounded-lg border-dashed">
                  <Leaf className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
                  <p className="text-sm text-muted-foreground">No listings yet.</p>
                  <Link href="/feedstock/create">
                    <Button size="sm" className="mt-4">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Your First Feedstock
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {listings.map((listing: any) => (
                    <div
                      key={listing.id}
                      className="p-4 rounded-xl border border-muted hover:border-primary/30 hover:shadow-lg transition-all"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-base">{listing.name || `Feedstock ${listing.id}`}</p>
                            <Badge
                              className={cn(
                                "text-xs",
                                listing.status === "active"
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : "bg-amber-50 text-amber-700 border-amber-200"
                              )}
                            >
                              {listing.status || "pending"}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground mt-1">
                            {listing.category || listing.feedstockType || "Feedstock"} • {listing.state || "AU"}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-semibold text-success">
                            {listing.pricePerTonne ? `$${listing.pricePerTonne.toFixed(0)}/t` : "Price N/A"}
                          </div>
                          <div className="flex items-center justify-end gap-1 text-sm">
                            <Star className="h-4 w-4 text-yellow-400 fill-current" />
                            <span>{listing.abfiScore?.toFixed(1) || "N/A"}</span>
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4 mt-4 text-sm text-muted-foreground">
                        <div>
                          <div>Available Volume</div>
                          <div className="font-medium text-foreground">
                            {listing.availableVolume?.toLocaleString() || "N/A"} t
                          </div>
                        </div>
                        <div>
                          <div>Delivery Window</div>
                          <div className="font-medium text-foreground">{listing.deliveryWindow || "Flexible"}</div>
                        </div>
                        <div>
                          <div>Inquiries</div>
                          <div className="font-medium text-foreground">{listing.inquiries || 0}</div>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-4">
                        <Link href={`/feedstock/${listing.id}`} className="flex-1">
                          <Button variant="outline" size="sm" className="w-full text-xs">
                            <Eye className="h-3 w-3 mr-1" />
                            View
                          </Button>
                        </Link>
                        <Link href={`/feedstock/edit/${listing.id}`} className="flex-1">
                          <Button variant="outline" size="sm" className="w-full text-xs">
                            Edit
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="premium-card">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="premium-heading">Live Weather</CardTitle>
                    <CardDescription className="premium-body">
                      BOM radar, warnings, and SILO climate signals.
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    BOM + SILO
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ClimateAlertsBar
                  alerts={Array.isArray(climateAlerts?.byType) ? climateAlerts.byType.flatMap((g) => g.alerts) : []}
                  isLoading={alertsLoading}
                />
                <UnifiedClimatePanel coordinates={primaryCoordinates} className="w-full max-w-none" />
              </CardContent>
            </Card>

            <Card className="border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
              <CardHeader className="pb-2 pt-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm flex items-center gap-2 text-gray-900">
                    <Sprout className="h-4 w-4 text-green-600" />
                    Base-load Supply
                  </CardTitle>
                  <Badge className="bg-green-600 text-white text-[10px]">NEW</Badge>
                </div>
                <CardDescription className="text-xs">
                  Beema Bamboo - 15-year contracted revenue
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-4 space-y-3">
                <div className="p-3 rounded-lg bg-white border border-green-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-muted-foreground">Projected Annual</span>
                    <span className="text-sm font-semibold text-green-700">2,750 t DM</span>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-muted-foreground">Contracted Price</span>
                    <span className="text-sm font-semibold">$85/t + 3%/yr</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Contract End</span>
                    <span className="text-sm font-semibold">Jun 2039</span>
                  </div>
                  <div className="mt-3 pt-3 border-t border-green-100">
                    <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Verified & Active
                    </Badge>
                  </div>
                </div>
                <Link href="/beema-bamboo">
                  <Button size="sm" variant="outline" className="w-full gap-2 border-green-300 text-green-700 hover:bg-green-50">
                    <Sprout className="h-4 w-4" />
                    Learn About Beema
                    <ArrowRight className="h-3 w-3" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="border-green-200" id="carbon-wallet">
              <CardHeader className="pb-2 pt-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm flex items-center gap-2 text-gray-900">
                    <Wallet className="h-4 w-4 text-green-600" />
                    Carbon Assets
                  </CardTitle>
                  <Badge variant="outline" className="text-[10px] border-green-300 text-green-700">
                    CorTenX
                  </Badge>
                </div>
                <CardDescription className="text-xs">
                  ACCUs, SMCs & GOs from Clean Energy Regulator
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-4">
                <CarbonWallet />
              </CardContent>
            </Card>

            <Card className="premium-card">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="premium-heading">Inbound Inquiries</CardTitle>
                    <CardDescription className="premium-body">
                      Latest buyer requests for your supply.
                    </CardDescription>
                  </div>
                  <Link href="/inquiries/supplier">
                    <Button size="sm" variant="outline">
                      View All
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {inquiriesLoading ? (
                  <div className="space-y-3">
                    {[1, 2].map((i) => (
                      <Skeleton key={i} className="h-14 w-full" />
                    ))}
                  </div>
                ) : supplierInquiries.length === 0 ? (
                  <div className="text-center text-sm text-muted-foreground py-6">
                    No inquiries yet.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {supplierInquiries.slice(0, 3).map((inquiry: any) => (
                      <div key={inquiry.id} className="p-3 rounded-lg border">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium">{inquiry.subject}</p>
                          <Badge variant="outline" className="text-xs">
                            {inquiry.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {inquiry.buyerName || "Anonymous Buyer"} •{" "}
                          {new Date(inquiry.createdAt).toLocaleDateString("en-AU")}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="premium-section">
          <Card className="premium-card">
            <CardHeader className="pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-coastal/10 rounded-lg flex items-center justify-center">
                  <MapPin className="h-5 w-5 text-coastal" />
                </div>
                <div>
                  <CardTitle className="premium-heading">Feedstock & Weather Map</CardTitle>
                  <CardDescription className="premium-body">
                    BOM radar, warnings, and your listings in one view.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-96 rounded-lg overflow-hidden border">
                <PlatformMap
                  preset="grower"
                  height="100%"
                  showControls={true}
                  showLayerPanel={true}
                  enableFeedstockLayer={true}
                />
              </div>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}
