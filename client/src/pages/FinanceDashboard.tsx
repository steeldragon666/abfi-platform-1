/**
 * Finance/Lender Dashboard - Redesigned
 *
 * Features:
 * - Risk alerts with severity indicators
 * - Portfolio tracking with entity monitoring
 * - Real-time sentiment and price feeds
 * - Stress testing access
 * - Report generation
 * - API access panel
 */

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  Eye,
  TrendingUp,
  BarChart3,
  FileText,
  Bell,
  ChevronRight,
  Zap,
  Target,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Shield,
  Download,
  Calendar,
  Clock,
  DollarSign,
  Building2,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from "lucide-react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";

// Quick stats
const QUICK_STATS = [
  { label: "Entities Tracked", value: "247", change: "+12", trend: "up", icon: Building2 },
  { label: "High Score Alerts", value: "42", change: "+5", trend: "up", icon: AlertTriangle },
  { label: "Sentiment Index", value: "+32", change: "+8", trend: "up", icon: Activity },
  { label: "Portfolio Value", value: "$2.4B", change: "+3.2%", trend: "up", icon: DollarSign },
];

// Risk alerts
const RISK_ALERTS = [
  {
    id: "1",
    severity: "high",
    title: "New competitor patent filing",
    entity: "Southern Oil Refining",
    entityScore: 87.5,
    description: "Advanced HVO catalyst technology patent filed with IP Australia",
    time: "2h ago",
    category: "Competitive",
  },
  {
    id: "2",
    severity: "medium",
    title: "Policy change impact",
    entity: "BioEnergy Holdings",
    entityScore: 72.3,
    description: "NSW RFS consultation may affect feedstock pricing",
    time: "5h ago",
    category: "Regulatory",
  },
  {
    id: "3",
    severity: "low",
    title: "Positive grant announcement",
    entity: "Jet Zero Australia",
    entityScore: 82.1,
    description: "ARENA $15M grant awarded for SAF demonstration",
    time: "1d ago",
    category: "Funding",
  },
  {
    id: "4",
    severity: "high",
    title: "Supply chain disruption risk",
    entity: "QLD Biofuels Corp",
    entityScore: 65.8,
    description: "Key canola supplier facing drought conditions",
    time: "3h ago",
    category: "Supply Risk",
  },
];

// Portfolio entities
const PORTFOLIO_ENTITIES = [
  { id: "1", name: "Southern Oil Refining", score: 87.5, change: +2.3, signals: 12, status: "high" },
  { id: "2", name: "Jet Zero Australia", score: 82.1, change: +5.1, signals: 8, status: "high" },
  { id: "3", name: "BioEnergy Holdings", score: 72.3, change: -1.2, signals: 5, status: "medium" },
  { id: "4", name: "QLD Biofuels Corp", score: 65.8, change: -3.4, signals: 3, status: "watch" },
  { id: "5", name: "Green Ammonia AU", score: 58.2, change: +0.8, signals: 2, status: "new" },
];

// Intelligence tools
const INTELLIGENCE_TOOLS = [
  {
    id: "stealth",
    label: "Stealth Discovery",
    icon: Eye,
    description: "Surface unannounced projects",
    badge: "67 signals",
    href: "/stealth-discovery",
    color: "text-purple-600",
    bgColor: "bg-purple-500/10",
  },
  {
    id: "sentiment",
    label: "Lending Sentiment",
    icon: TrendingUp,
    description: "AI-powered sentiment analysis",
    badge: "+8 index",
    href: "/lending-sentiment",
    color: "text-blue-600",
    bgColor: "bg-blue-500/10",
  },
  {
    id: "prices",
    label: "Feedstock Prices",
    icon: BarChart3,
    description: "Real-time price intelligence",
    badge: "Live",
    href: "/feedstock-prices",
    color: "text-emerald-600",
    bgColor: "bg-emerald-500/10",
  },
  {
    id: "policy",
    label: "Policy & Carbon",
    icon: FileText,
    description: "Regulatory timeline",
    badge: "Updated",
    href: "/policy-carbon",
    color: "text-amber-600",
    bgColor: "bg-amber-500/10",
  },
];

// Recent reports
const RECENT_REPORTS = [
  { id: "1", name: "Q4 2024 Market Analysis", date: "Dec 15, 2024", type: "Market", status: "ready" },
  { id: "2", name: "Stress Test - Drought Scenario", date: "Dec 10, 2024", type: "Risk", status: "ready" },
  { id: "3", name: "Portfolio Summary", date: "Dec 1, 2024", type: "Portfolio", status: "ready" },
];

export default function FinanceDashboard() {
  const [activeTab, setActiveTab] = useState("overview");

  const getSeverityStyles = (severity: string) => {
    switch (severity) {
      case "high":
        return {
          badge: "bg-red-100 text-red-800 border-red-200",
          icon: "text-red-500",
          border: "border-l-red-500",
        };
      case "medium":
        return {
          badge: "bg-amber-100 text-amber-800 border-amber-200",
          icon: "text-amber-500",
          border: "border-l-amber-500",
        };
      case "low":
        return {
          badge: "bg-emerald-100 text-emerald-800 border-emerald-200",
          icon: "text-emerald-500",
          border: "border-l-emerald-500",
        };
      default:
        return {
          badge: "bg-slate-100 text-slate-800 border-slate-200",
          icon: "text-slate-500",
          border: "border-l-slate-500",
        };
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Quick Stats Bar */}
      <div className="border-b bg-card/50">
        <div className="container mx-auto px-4 py-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {QUICK_STATS.map((stat, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-muted/50 flex items-center justify-center">
                  <stat.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-xs",
                        stat.trend === "up"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-red-50 text-red-700 border-red-200"
                      )}
                    >
                      {stat.trend === "up" ? (
                        <ArrowUpRight className="h-3 w-3 mr-0.5" />
                      ) : (
                        <ArrowDownRight className="h-3 w-3 mr-0.5" />
                      )}
                      {stat.change}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="alerts">
                Alerts
                <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                  {RISK_ALERTS.filter((a) => a.severity === "high").length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
              <TabsTrigger value="reports">Reports</TabsTrigger>
            </TabsList>
            <div className="flex gap-2">
              <Link href="/stress-testing">
                <Button variant="outline" size="sm">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Stress Test
                </Button>
              </Link>
              <Button size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Risk Alerts Summary */}
              <Card className="lg:col-span-2">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Bell className="h-5 w-5 text-amber-500" />
                      Risk Alerts
                    </CardTitle>
                    <Button variant="ghost" size="sm" onClick={() => setActiveTab("alerts")}>
                      View All
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {RISK_ALERTS.slice(0, 3).map((alert) => {
                      const styles = getSeverityStyles(alert.severity);
                      return (
                        <div
                          key={alert.id}
                          className={cn(
                            "p-3 rounded-lg border border-l-4 hover:bg-muted/50 transition-colors cursor-pointer",
                            styles.border
                          )}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3">
                              <div className={cn("mt-0.5", styles.icon)}>
                                {alert.severity === "high" ? (
                                  <AlertCircle className="h-5 w-5" />
                                ) : alert.severity === "medium" ? (
                                  <AlertTriangle className="h-5 w-5" />
                                ) : (
                                  <CheckCircle2 className="h-5 w-5" />
                                )}
                              </div>
                              <div>
                                <p className="font-medium text-sm">{alert.title}</p>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  {alert.entity} · Score: {alert.entityScore}
                                </p>
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <Badge variant="outline" className={cn("text-xs", styles.badge)}>
                                {alert.category}
                              </Badge>
                              <p className="text-xs text-muted-foreground mt-1">{alert.time}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Portfolio Summary */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-blue-500" />
                    Tracked Entities
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {PORTFOLIO_ENTITIES.slice(0, 4).map((entity) => (
                      <div
                        key={entity.id}
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className={cn(
                              "h-2 w-2 rounded-full",
                              entity.status === "high" && "bg-emerald-500",
                              entity.status === "medium" && "bg-blue-500",
                              entity.status === "watch" && "bg-amber-500",
                              entity.status === "new" && "bg-purple-500"
                            )}
                          />
                          <div>
                            <p className="text-sm font-medium">{entity.name}</p>
                            <p className="text-xs text-muted-foreground">{entity.signals} signals</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold">{entity.score}</p>
                          <p
                            className={cn(
                              "text-xs",
                              entity.change > 0 ? "text-emerald-600" : "text-red-600"
                            )}
                          >
                            {entity.change > 0 ? "+" : ""}
                            {entity.change}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-3"
                    onClick={() => setActiveTab("portfolio")}
                  >
                    View All Entities
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Intelligence Tools */}
            <div>
              <h2 className="text-lg font-semibold mb-4">Intelligence Tools</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                {INTELLIGENCE_TOOLS.map((tool) => (
                  <Link key={tool.id} href={tool.href}>
                    <Card className="h-full cursor-pointer hover:shadow-md transition-all hover:border-primary/50">
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center", tool.bgColor)}>
                            <tool.icon className={cn("h-5 w-5", tool.color)} />
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {tool.badge}
                          </Badge>
                        </div>
                        <CardTitle className="text-base mt-3">{tool.label}</CardTitle>
                        <CardDescription className="text-xs">{tool.description}</CardDescription>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="flex items-center text-sm text-primary font-medium">
                          Open Tool
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Alerts Tab */}
          <TabsContent value="alerts" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Risk Alerts</CardTitle>
                    <CardDescription>Real-time alerts from your tracked entities</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="destructive">{RISK_ALERTS.filter((a) => a.severity === "high").length} High</Badge>
                    <Badge variant="outline" className="bg-amber-50 text-amber-700">
                      {RISK_ALERTS.filter((a) => a.severity === "medium").length} Medium
                    </Badge>
                    <Badge variant="outline" className="bg-emerald-50 text-emerald-700">
                      {RISK_ALERTS.filter((a) => a.severity === "low").length} Low
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {RISK_ALERTS.map((alert) => {
                    const styles = getSeverityStyles(alert.severity);
                    return (
                      <div
                        key={alert.id}
                        className={cn(
                          "p-4 rounded-lg border border-l-4 hover:bg-muted/50 transition-colors cursor-pointer",
                          styles.border
                        )}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-4">
                            <div className={cn("mt-0.5", styles.icon)}>
                              {alert.severity === "high" ? (
                                <AlertCircle className="h-6 w-6" />
                              ) : alert.severity === "medium" ? (
                                <AlertTriangle className="h-6 w-6" />
                              ) : (
                                <CheckCircle2 className="h-6 w-6" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium">{alert.title}</p>
                              <p className="text-sm text-muted-foreground mt-1">{alert.description}</p>
                              <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Building2 className="h-3 w-3" />
                                  {alert.entity}
                                </span>
                                <span>·</span>
                                <span>Score: {alert.entityScore}</span>
                                <span>·</span>
                                <span>{alert.time}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <Badge variant="outline" className={cn("text-xs", styles.badge)}>
                              {alert.category}
                            </Badge>
                            <Button variant="outline" size="sm">
                              Investigate
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Portfolio Tab */}
          <TabsContent value="portfolio" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Tracked Portfolio</CardTitle>
                    <CardDescription>Entities you're monitoring for investment decisions</CardDescription>
                  </div>
                  <Link href="/stealth-discovery">
                    <Button>
                      <Target className="h-4 w-4 mr-2" />
                      Add Entity
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {PORTFOLIO_ENTITIES.map((entity) => (
                    <div
                      key={entity.id}
                      className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={cn(
                            "h-3 w-3 rounded-full",
                            entity.status === "high" && "bg-emerald-500",
                            entity.status === "medium" && "bg-blue-500",
                            entity.status === "watch" && "bg-amber-500",
                            entity.status === "new" && "bg-purple-500"
                          )}
                        />
                        <div>
                          <p className="font-medium">{entity.name}</p>
                          <p className="text-sm text-muted-foreground">{entity.signals} active signals</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div>
                          <p className="text-sm text-muted-foreground">Score</p>
                          <p className="text-lg font-bold">{entity.score}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Change</p>
                          <p
                            className={cn(
                              "text-lg font-bold flex items-center",
                              entity.change > 0 ? "text-emerald-600" : entity.change < 0 ? "text-red-600" : ""
                            )}
                          >
                            {entity.change > 0 ? (
                              <ArrowUpRight className="h-4 w-4" />
                            ) : entity.change < 0 ? (
                              <ArrowDownRight className="h-4 w-4" />
                            ) : (
                              <Minus className="h-4 w-4" />
                            )}
                            {Math.abs(entity.change)}
                          </p>
                        </div>
                        <Progress value={entity.score} className="w-24" />
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Generate Report</CardTitle>
                  <CardDescription>Create custom reports for your portfolio</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <Button variant="outline" className="h-24 flex-col">
                      <BarChart3 className="h-6 w-6 mb-2" />
                      Market Analysis
                    </Button>
                    <Button variant="outline" className="h-24 flex-col">
                      <AlertTriangle className="h-6 w-6 mb-2" />
                      Risk Assessment
                    </Button>
                    <Button variant="outline" className="h-24 flex-col">
                      <Target className="h-6 w-6 mb-2" />
                      Portfolio Summary
                    </Button>
                    <Button variant="outline" className="h-24 flex-col">
                      <Activity className="h-6 w-6 mb-2" />
                      Sentiment Report
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Reports</CardTitle>
                  <CardDescription>Previously generated reports</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {RECENT_REPORTS.map((report) => (
                      <div
                        key={report.id}
                        className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="font-medium text-sm">{report.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {report.type} · {report.date}
                            </p>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* API Access */}
            <Card>
              <CardHeader>
                <CardTitle>Risk Scoring API</CardTitle>
                <CardDescription>Programmatic access to risk scores and intelligence data</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-slate-900 rounded-lg p-4 text-white font-mono text-sm mb-4">
                  <p className="text-slate-400">// Example API Response</p>
                  <pre className="mt-2 overflow-x-auto">{`{
  "entity_id": "ENT-2024-0042",
  "canonical_name": "Southern Oil Refining",
  "current_score": 87.5,
  "signal_count": 12,
  "risk_level": "low",
  "confidence": 0.95,
  "last_updated": "2024-12-22T10:30:00Z"
}`}</pre>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                    Coming Q2 2025
                  </Badge>
                  <Button variant="outline" size="sm">
                    Join Waitlist
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
