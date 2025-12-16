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
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import {
  Award,
  Building2,
  Leaf,
  Package,
  ShoppingCart,
  Shield,
  TrendingUp,
  CheckCircle,
  Clock,
  FileText,
  Search,
  Bell,
  ArrowRight,
  Plus,
  MessageSquare,
  Upload,
  DollarSign,
  BarChart3,
  AlertCircle,
} from "lucide-react";
import { Link, Redirect } from "wouter";
import { cn } from "@/lib/utils";
import {
  PageWrapper,
  FadeInUp,
  StaggerContainer,
  StaggerItem,
  HoverCard,
} from "@/components/ui/motion";
import DashboardLayout from "@/components/DashboardLayout";

// Australian feedstock types with bamboo focus
const FEEDSTOCK_TYPES = [
  "Bamboo",
  "Eucalyptus",
  "Sugarcane Bagasse",
  "Wheat Straw",
  "Cotton Gin Trash",
];

// Sample activity data with Australian/bamboo context
const SAMPLE_ACTIVITIES = [
  {
    time: "10:30 AM",
    message: "New contract signed for 500t Bamboo - Queensland Biomass Co.",
    status: "Signed",
    statusColor: "bg-emerald-500",
  },
  {
    time: "09:15 AM",
    message: "Listing approved: Premium Bamboo Chips - Darling Downs",
    status: "Approved",
    statusColor: "bg-blue-500",
  },
  {
    time: "Yesterday, 4:45 PM",
    message: "Payment received for Contract #ABF-2025-0042",
    status: "Received",
    statusColor: "bg-emerald-500",
  },
  {
    time: "Yesterday, 3:00 PM",
    message: "Lab certificate uploaded for Bamboo Lot #BD-2025-178",
    status: "Uploaded",
    statusColor: "bg-amber-500",
  },
];

// Stats card component matching the mockup
function StatsCardNew({
  title,
  value,
  icon: Icon,
  variant = "default",
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  variant?: "default" | "success" | "warning" | "info";
}) {
  const variantStyles = {
    default: "bg-white",
    success: "bg-emerald-50 border-emerald-200",
    warning: "bg-amber-50 border-amber-200",
    info: "bg-blue-50 border-blue-200",
  };

  const iconStyles = {
    default: "text-slate-600",
    success: "text-emerald-600",
    warning: "text-amber-600",
    info: "text-blue-600",
  };

  return (
    <Card className={cn("border", variantStyles[variant])}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground font-medium">{title}</p>
            <p className="text-3xl font-bold mt-1 font-mono">{value}</p>
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

// Quick action button component
function QuickActionButton({
  icon: Icon,
  label,
  href,
  variant = "outline",
}: {
  icon: React.ElementType;
  label: string;
  href: string;
  variant?: "gold" | "outline";
}) {
  return (
    <Link href={href}>
      <button
        className={cn(
          "flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all",
          variant === "gold"
            ? "btn-gold"
            : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300"
        )}
      >
        <Icon className="h-4 w-4" />
        {label}
      </button>
    </Link>
  );
}

// Contract status data for donut chart
const CONTRACT_STATUS_DATA = [
  { label: "Active", value: 65, color: "#10B981" },
  { label: "Pending", value: 20, color: "#F59E0B" },
  { label: "Closed", value: 15, color: "#6B7280" },
];

// Simple donut chart component
function DonutChart({
  data,
  total,
}: {
  data: { label: string; value: number; color: string }[];
  total: number;
}) {
  // Calculate stroke-dasharray for each segment
  const circumference = 2 * Math.PI * 40;
  let currentOffset = 0;

  return (
    <div className="flex items-center gap-6">
      <div className="relative">
        <svg width="120" height="120" viewBox="0 0 100 100">
          {data.map((segment, index) => {
            const strokeLength = (segment.value / 100) * circumference;
            const offset = currentOffset;
            currentOffset += strokeLength;

            return (
              <circle
                key={index}
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke={segment.color}
                strokeWidth="12"
                strokeDasharray={`${strokeLength} ${circumference - strokeLength}`}
                strokeDashoffset={-offset}
                transform="rotate(-90 50 50)"
              />
            );
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold">{total}</span>
          <span className="text-xs text-muted-foreground">Total</span>
          <span className="text-xs text-muted-foreground">Contracts</span>
        </div>
      </div>
      <div className="space-y-2">
        {data.map((segment, index) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: segment.color }}
            />
            <span className="text-muted-foreground">{segment.label}</span>
            <span className="font-medium">({segment.value}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Simple area chart component for supply volume
function SupplyVolumeChart() {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
  const values = [120, 180, 220, 280, 350, 420];
  const maxValue = Math.max(...values);
  const chartHeight = 150;
  const chartWidth = 400;
  const padding = { top: 20, right: 20, bottom: 30, left: 50 };
  const plotWidth = chartWidth - padding.left - padding.right;
  const plotHeight = chartHeight - padding.top - padding.bottom;

  // Generate path for the area
  const points = values.map((v, i) => ({
    x: padding.left + (i / (values.length - 1)) * plotWidth,
    y: padding.top + plotHeight - (v / maxValue) * plotHeight,
  }));

  const linePath = points.map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(" ");
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${padding.top + plotHeight} L ${points[0].x} ${padding.top + plotHeight} Z`;

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-auto">
        {/* Y-axis labels */}
        {[0, 200, 400].map((v, i) => (
          <text
            key={i}
            x={padding.left - 10}
            y={padding.top + plotHeight - (v / maxValue) * plotHeight}
            textAnchor="end"
            dominantBaseline="middle"
            className="text-[10px] fill-slate-400"
          >
            {v}k
          </text>
        ))}

        {/* Grid lines */}
        {[0, 200, 400].map((v, i) => (
          <line
            key={i}
            x1={padding.left}
            y1={padding.top + plotHeight - (v / maxValue) * plotHeight}
            x2={chartWidth - padding.right}
            y2={padding.top + plotHeight - (v / maxValue) * plotHeight}
            stroke="#E5E7EB"
            strokeDasharray="2,2"
          />
        ))}

        {/* Area fill */}
        <path d={areaPath} fill="url(#areaGradient)" />

        {/* Line */}
        <path d={linePath} fill="none" stroke="#10B981" strokeWidth="2" />

        {/* Dots */}
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="4" fill="#10B981" />
        ))}

        {/* X-axis labels */}
        {months.map((m, i) => (
          <text
            key={i}
            x={padding.left + (i / (months.length - 1)) * plotWidth}
            y={chartHeight - 8}
            textAnchor="middle"
            className="text-[10px] fill-slate-400"
          >
            {m}
          </text>
        ))}

        {/* Gradient definition */}
        <defs>
          <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10B981" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#10B981" stopOpacity="0.05" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

export default function Dashboard() {
  const { user, isAuthenticated, loading } = useAuth();
  const { data: profile, isLoading: profileLoading } =
    trpc.auth.getProfile.useQuery(undefined, {
      enabled: isAuthenticated,
    });

  if (loading || profileLoading) {
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

  // Check if user has supplier or buyer profile
  const hasSupplier = !!profile?.supplier;
  const hasBuyer = !!profile?.buyer;
  const isAdmin = user?.role === "admin";

  // Example stats - would come from API in production
  const stats = {
    activeContracts: 12,
    pendingInquiries: 8,
    totalVolume: "$2.4M",
    riskScore: "A+",
  };

  return (
    <DashboardLayout>
      <PageWrapper className="max-w-7xl">
        {/* Welcome Section */}
        <FadeInUp className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-1">
            Welcome back, {user?.name || "User"}
          </h1>
          <p className="text-muted-foreground">
            Here's what's happening with your Australian biomass portfolio today.
          </p>
        </FadeInUp>

        {/* Stats Cards Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatsCardNew
            title="Active Contracts"
            value={stats.activeContracts}
            icon={FileText}
          />
          <StatsCardNew
            title="Pending Inquiries"
            value={stats.pendingInquiries}
            icon={MessageSquare}
            variant="warning"
          />
          <StatsCardNew
            title="Total Volume (AUD)"
            value={stats.totalVolume}
            icon={DollarSign}
          />
          <StatsCardNew
            title="Risk Score"
            value={stats.riskScore}
            icon={Shield}
            variant="success"
          />
        </div>

        {/* Admin Section */}
        {isAdmin && (
          <Card className="mb-8 border-amber-200 bg-amber-50">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-100">
                    <Shield className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Admin Access</CardTitle>
                    <CardDescription>
                      You have administrative privileges
                    </CardDescription>
                  </div>
                </div>
                <Badge variant="outline" className="text-amber-600 border-amber-300">
                  Admin
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                <Link href="/admin">
                  <Card className="border-amber-200 hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3 mb-2">
                        <Clock className="h-4 w-4 text-amber-600" />
                        <span className="font-medium">Pending Verifications</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Review bamboo supplier submissions
                      </p>
                    </CardContent>
                  </Card>
                </Link>

                <Card className="border-slate-200">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <BarChart3 className="h-4 w-4 text-slate-600" />
                      <span className="font-medium">Platform Analytics</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Monitor marketplace activity
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-slate-200">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <FileText className="h-4 w-4 text-slate-600" />
                      <span className="font-medium">Audit Logs</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Review system activity
                    </p>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Content Grid */}
        {!hasSupplier && !hasBuyer ? (
          // Profile Selection for new users
          <StaggerContainer className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <StaggerItem>
              <HoverCard className="h-full">
                <Card className="group h-full border-2 hover:border-[#D4AF37] transition-colors">
                  <CardHeader className="pb-4">
                    <div className="p-3 rounded-xl bg-slate-100 w-fit mb-4 group-hover:bg-amber-50 transition-colors">
                      <Building2 className="h-8 w-8 text-slate-700 group-hover:text-amber-600" />
                    </div>
                    <CardTitle className="text-xl">Register as Supplier</CardTitle>
                    <CardDescription className="text-base">
                      List your bamboo and other Australian biomass feedstocks
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3 text-sm text-muted-foreground mb-6">
                      <li className="flex items-center gap-3">
                        <CheckCircle className="h-4 w-4 text-emerald-500" />
                        Get ABFI-rated for your bamboo feedstocks
                      </li>
                      <li className="flex items-center gap-3">
                        <CheckCircle className="h-4 w-4 text-emerald-500" />
                        Access Australian biofuel buyer network
                      </li>
                      <li className="flex items-center gap-3">
                        <CheckCircle className="h-4 w-4 text-emerald-500" />
                        Receive expressions of interest
                      </li>
                    </ul>
                    <Link href="/supplier/register">
                      <button className="w-full btn-gold">
                        Create Supplier Profile
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </button>
                    </Link>
                  </CardContent>
                </Card>
              </HoverCard>
            </StaggerItem>

            <StaggerItem>
              <HoverCard className="h-full">
                <Card className="group h-full border-2 hover:border-[#D4AF37] transition-colors">
                  <CardHeader className="pb-4">
                    <div className="p-3 rounded-xl bg-slate-100 w-fit mb-4 group-hover:bg-amber-50 transition-colors">
                      <ShoppingCart className="h-8 w-8 text-slate-700 group-hover:text-amber-600" />
                    </div>
                    <CardTitle className="text-xl">Register as Buyer</CardTitle>
                    <CardDescription className="text-base">
                      Source verified Australian biomass from trusted suppliers
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3 text-sm text-muted-foreground mb-6">
                      <li className="flex items-center gap-3">
                        <CheckCircle className="h-4 w-4 text-emerald-500" />
                        Access ABFI-rated bamboo suppliers
                      </li>
                      <li className="flex items-center gap-3">
                        <CheckCircle className="h-4 w-4 text-emerald-500" />
                        Advanced search and filtering
                      </li>
                      <li className="flex items-center gap-3">
                        <CheckCircle className="h-4 w-4 text-emerald-500" />
                        Submit expressions of interest
                      </li>
                    </ul>
                    <Link href="/buyer/register">
                      <button className="w-full btn-gold">
                        Create Buyer Profile
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </button>
                    </Link>
                  </CardContent>
                </Card>
              </HoverCard>
            </StaggerItem>
          </StaggerContainer>
        ) : (
          // Existing user dashboard
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Activity Feed - Left Column (2/3) */}
            <div className="lg:col-span-2 space-y-6">
              {/* Activity Feed */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Activity Feed</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {SAMPLE_ACTIVITIES.map((activity, index) => (
                      <div
                        key={index}
                        className="flex items-start justify-between py-2 border-b last:border-0"
                      >
                        <div className="flex-1">
                          <p className="text-sm text-muted-foreground mb-1">
                            {activity.time}
                          </p>
                          <p className="text-sm">{activity.message}</p>
                        </div>
                        <Badge
                          className={cn(
                            "ml-4 text-white border-0",
                            activity.statusColor
                          )}
                        >
                          {activity.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                  <Link href="/activity">
                    <Button variant="link" className="p-0 h-auto mt-4 text-sm">
                      View All Activity
                      <ArrowRight className="h-3 w-3 ml-1" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              {/* Supply Volume Chart */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">
                    Bamboo Supply Volume Over Time
                  </CardTitle>
                  <CardDescription>
                    Total tonnes delivered (2025)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <SupplyVolumeChart />
                </CardContent>
              </Card>
            </div>

            {/* Right Column (1/3) */}
            <div className="space-y-6">
              {/* Quick Actions */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {hasSupplier && (
                    <>
                      <QuickActionButton
                        icon={Plus}
                        label="New Bamboo Listing"
                        href="/feedstock/create"
                        variant="gold"
                      />
                      <QuickActionButton
                        icon={Package}
                        label="Add Futures Projection"
                        href="/supplier/futures/create"
                      />
                    </>
                  )}
                  {hasBuyer && (
                    <QuickActionButton
                      icon={Search}
                      label="Browse Bamboo"
                      href="/browse?feedstock=bamboo"
                      variant="gold"
                    />
                  )}
                  <QuickActionButton
                    icon={MessageSquare}
                    label="Send Message"
                    href="/messages"
                  />
                </CardContent>
              </Card>

              {/* Contract Status */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Contract Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <DonutChart data={CONTRACT_STATUS_DATA} total={20} />
                </CardContent>
              </Card>

              {/* Featured Feedstock */}
              <Card className="bg-gradient-to-br from-emerald-50 to-white border-emerald-200">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Leaf className="h-5 w-5 text-emerald-600" />
                    <CardTitle className="text-lg text-emerald-800">
                      Featured: Bamboo
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-emerald-700 mb-4">
                    Australian bamboo is one of the fastest-growing renewable
                    resources, with exceptional carbon sequestration properties
                    and ideal characteristics for biofuel production.
                  </p>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="bg-card rounded-lg p-3 border border-emerald-100">
                      <p className="text-muted-foreground">Energy Content</p>
                      <p className="font-semibold text-emerald-800">18.5 MJ/kg</p>
                    </div>
                    <div className="bg-card rounded-lg p-3 border border-emerald-100">
                      <p className="text-muted-foreground">Moisture</p>
                      <p className="font-semibold text-emerald-800">8-12%</p>
                    </div>
                  </div>
                  <Link href="/browse?feedstock=bamboo">
                    <Button className="w-full mt-4 bg-emerald-600 hover:bg-emerald-700">
                      Explore Bamboo Listings
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Supplier/Buyer Specific Stats (if registered) */}
        {(hasSupplier || hasBuyer) && (
          <div className="mt-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  {hasSupplier ? "Supplier" : "Buyer"} Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-6">
                  {hasSupplier && (
                    <>
                      <div className="text-center p-4 bg-slate-50 rounded-lg">
                        <p className="text-3xl font-bold text-slate-900 font-mono">
                          {profile.supplier?.verificationStatus === "verified"
                            ? "Verified"
                            : "Pending"}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Verification Status
                        </p>
                      </div>
                      <div className="text-center p-4 bg-slate-50 rounded-lg">
                        <p className="text-3xl font-bold text-slate-900 font-mono">
                          0
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Active Bamboo Listings
                        </p>
                      </div>
                      <div className="text-center p-4 bg-slate-50 rounded-lg">
                        <p className="text-3xl font-bold text-slate-900 font-mono">
                          0
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Pending EOIs
                        </p>
                      </div>
                    </>
                  )}
                  {hasBuyer && (
                    <>
                      <div className="text-center p-4 bg-slate-50 rounded-lg">
                        <p className="text-3xl font-bold text-slate-900 font-mono">
                          0
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Saved Searches
                        </p>
                      </div>
                      <div className="text-center p-4 bg-slate-50 rounded-lg">
                        <p className="text-3xl font-bold text-slate-900 font-mono">
                          0
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          My EOIs Submitted
                        </p>
                      </div>
                      <div className="text-center p-4 bg-slate-50 rounded-lg">
                        <p className="text-3xl font-bold text-slate-900 font-mono">
                          0
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Active Contracts
                        </p>
                      </div>
                    </>
                  )}
                </div>
                <div className="flex justify-center gap-4 mt-6">
                  {hasSupplier && (
                    <>
                      <Link href="/supplier/feedstocks">
                        <Button variant="outline">View My Feedstocks</Button>
                      </Link>
                      <Link href="/feedstock/create">
                        <button className="btn-gold">
                          <Plus className="h-4 w-4" />
                          Add Bamboo Listing
                        </button>
                      </Link>
                    </>
                  )}
                  {hasBuyer && (
                    <>
                      <Link href="/buyer/eois">
                        <Button variant="outline">View My EOIs</Button>
                      </Link>
                      <Link href="/browse">
                        <button className="btn-gold">
                          <Search className="h-4 w-4" />
                          Browse Feedstocks
                        </button>
                      </Link>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </PageWrapper>
    </DashboardLayout>
  );
}
