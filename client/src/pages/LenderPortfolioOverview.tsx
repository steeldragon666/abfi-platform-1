/**
 * Lender Portfolio Overview - Nextgen Design
 *
 * Features:
 * - Portfolio summary with key metrics
 * - Project allocation breakdown charts
 * - Risk distribution by rating
 * - Performance trends visualization
 * - Typography components for consistent styling
 */

import { useState } from "react";
import { H1, H2, H3, H4, Body, MetricValue, DataLabel } from "@/components/Typography";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BarChart2,
  TrendingUp,
  TrendingDown,
  PieChart,
  DollarSign,
  Building2,
  Leaf,
  AlertTriangle,
  ArrowLeft,
  Download,
  Filter,
  RefreshCw,
} from "lucide-react";
import { Link } from "wouter";
import { LazyChart } from "@/components/ui/lazy-charts";

// Mock data
const portfolioSummary = {
  totalValue: 1250000000,
  activeProjects: 45,
  averageRating: "B+",
  ytdReturn: 8.2,
  covenantBreaches: 2,
  upcomingRenewals: 5,
};

const allocationData = [
  { name: "Ethanol", value: 35, amount: 437500000, color: "#3b82f6" },
  { name: "Biodiesel", value: 28, amount: 350000000, color: "#22c55e" },
  { name: "Biogas", value: 20, amount: 250000000, color: "#f59e0b" },
  { name: "Woodchips", value: 12, amount: 150000000, color: "#8b5cf6" },
  { name: "Other", value: 5, amount: 62500000, color: "#6b7280" },
];

const riskDistribution = [
  { rating: "AAA", count: 5, amount: 180000000 },
  { rating: "AA", count: 8, amount: 250000000 },
  { rating: "A", count: 12, amount: 320000000 },
  { rating: "BBB", count: 10, amount: 280000000 },
  { rating: "BB", count: 6, amount: 150000000 },
  { rating: "B", count: 3, amount: 50000000 },
  { rating: "CCC", count: 1, amount: 20000000 },
];

const performanceTrend = [
  { month: "Jul", value: 1180, target: 1150 },
  { month: "Aug", value: 1195, target: 1170 },
  { month: "Sep", value: 1210, target: 1190 },
  { month: "Oct", value: 1225, target: 1210 },
  { month: "Nov", value: 1240, target: 1230 },
  { month: "Dec", value: 1250, target: 1250 },
];

const topProjects = [
  {
    id: 1,
    name: "Murray Valley Biorefinery",
    type: "Ethanol",
    investment: 85000000,
    rating: "AA",
    status: "performing",
    covenantStatus: "compliant",
  },
  {
    id: 2,
    name: "Gippsland Green Energy",
    type: "Biodiesel",
    investment: 62000000,
    rating: "A",
    status: "performing",
    covenantStatus: "compliant",
  },
  {
    id: 3,
    name: "Darling Downs Biomass",
    type: "Woodchips",
    investment: 45000000,
    rating: "BBB",
    status: "watch",
    covenantStatus: "warning",
  },
  {
    id: 4,
    name: "Riverina Renewable Fuels",
    type: "Ethanol",
    investment: 78000000,
    rating: "AA",
    status: "performing",
    covenantStatus: "compliant",
  },
  {
    id: 5,
    name: "Pilbara Power Generation",
    type: "Biogas",
    investment: 95000000,
    rating: "A",
    status: "performing",
    covenantStatus: "compliant",
  },
];

const formatCurrency = (value: number) => {
  if (value >= 1000000000) {
    return `$${(value / 1000000000).toFixed(1)}B`;
  }
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(0)}M`;
  }
  return `$${value.toLocaleString()}`;
};

const getRatingColor = (rating: string) => {
  if (rating.startsWith("AA")) return "bg-green-100 text-green-800";
  if (rating.startsWith("A")) return "bg-blue-100 text-blue-800";
  if (rating.startsWith("BBB")) return "bg-yellow-100 text-yellow-800";
  if (rating.startsWith("BB")) return "bg-orange-100 text-orange-800";
  return "bg-red-100 text-red-800";
};

export default function LenderPortfolioOverview() {
  const [timeRange, setTimeRange] = useState("6m");

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <div className="bg-background border-b">
        <div className="container-default py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/lender">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold">Portfolio Overview</h1>
                <p className="text-muted-foreground text-sm">
                  Comprehensive view of your bioenergy investments
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container-default py-8 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Portfolio</p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(portfolioSummary.totalValue)}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-primary" />
                </div>
              </div>
              <div className="mt-2 flex items-center text-sm">
                <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                <span className="text-green-600 font-medium">+{portfolioSummary.ytdReturn}%</span>
                <span className="text-muted-foreground ml-1">YTD</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Projects</p>
                  <p className="text-2xl font-bold">{portfolioSummary.activeProjects}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-secondary/10 flex items-center justify-center">
                  <Building2 className="h-6 w-6 text-secondary" />
                </div>
              </div>
              <div className="mt-2 text-sm text-muted-foreground">
                Across 6 feedstock categories
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Avg. Risk Rating</p>
                  <p className="text-2xl font-bold">{portfolioSummary.averageRating}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <BarChart2 className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <div className="mt-2 text-sm text-muted-foreground">
                Investment grade quality
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Covenant Alerts</p>
                  <p className="text-2xl font-bold">{portfolioSummary.covenantBreaches}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 text-amber-600" />
                </div>
              </div>
              <div className="mt-2 text-sm text-muted-foreground">
                {portfolioSummary.upcomingRenewals} renewals due
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Portfolio Performance */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Portfolio Performance</CardTitle>
                  <CardDescription>Value vs. target over time</CardDescription>
                </div>
                <Select value={timeRange} onValueChange={setTimeRange}>
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3m">3 months</SelectItem>
                    <SelectItem value="6m">6 months</SelectItem>
                    <SelectItem value="1y">1 year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <LazyChart height={300}>
                {({ ResponsiveContainer, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip, Area }) => (
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={performanceTrend}>
                      <defs>
                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="month" stroke="#9ca3af" fontSize={12} />
                      <YAxis stroke="#9ca3af" fontSize={12} tickFormatter={(v) => `$${v}M`} />
                      <Tooltip
                        formatter={(value: number) => [`$${value}M`, ""]}
                        contentStyle={{ borderRadius: "8px" }}
                      />
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        fill="url(#colorValue)"
                        name="Actual"
                      />
                      <Area
                        type="monotone"
                        dataKey="target"
                        stroke="#9ca3af"
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        fill="none"
                        name="Target"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </LazyChart>
            </CardContent>
          </Card>

          {/* Allocation by Feedstock */}
          <Card>
            <CardHeader>
              <CardTitle>Allocation by Feedstock</CardTitle>
              <CardDescription>Investment distribution across categories</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] flex items-center">
                <div className="w-1/2">
                  <LazyChart height={250}>
                    {({ ResponsiveContainer, PieChart, Pie, Cell, Tooltip }) => (
                      <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                          <Pie
                            data={allocationData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            paddingAngle={2}
                            dataKey="value"
                          >
                            {allocationData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value: number) => [`${value}%`, ""]} />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </LazyChart>
                </div>
                <div className="w-1/2 space-y-3">
                  {allocationData.map((item) => (
                    <div key={item.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-sm">{item.name}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-medium">{item.value}%</span>
                        <span className="text-xs text-muted-foreground ml-2">
                          {formatCurrency(item.amount)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Risk Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Risk Distribution</CardTitle>
            <CardDescription>Projects by ABFI bankability rating</CardDescription>
          </CardHeader>
          <CardContent>
            <LazyChart height={200}>
              {({ ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Bar }) => (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={riskDistribution} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis type="number" tickFormatter={(v) => formatCurrency(v)} fontSize={12} />
                    <YAxis dataKey="rating" type="category" fontSize={12} width={50} />
                    <Tooltip formatter={(value: number) => [formatCurrency(value), "Amount"]} />
                    <Bar dataKey="amount" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </LazyChart>
          </CardContent>
        </Card>

        {/* Top Projects Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Top Investments</CardTitle>
                <CardDescription>Largest projects by investment value</CardDescription>
              </div>
              <Button variant="outline" size="sm">
                View All Projects
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Project</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Investment</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Covenant Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topProjects.map((project) => (
                  <TableRow key={project.id}>
                    <TableCell className="font-medium">{project.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{project.type}</Badge>
                    </TableCell>
                    <TableCell>{formatCurrency(project.investment)}</TableCell>
                    <TableCell>
                      <Badge className={getRatingColor(project.rating)}>
                        {project.rating}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={project.covenantStatus === "compliant" ? "default" : "secondary"}
                        className={
                          project.covenantStatus === "compliant"
                            ? "bg-green-100 text-green-800"
                            : "bg-amber-100 text-amber-800"
                        }
                      >
                        {project.covenantStatus === "compliant" ? "Compliant" : "Warning"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
