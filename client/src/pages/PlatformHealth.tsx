import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { PageLayout, PageContainer } from "@/components/layout";
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Server,
  Database,
  Cloud,
  Shield,
  Clock,
  Zap,
  RefreshCw,
  ExternalLink,
  Award,
  Lock,
  FileCheck,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Simulated health data - in production, this would come from monitoring APIs
const SYSTEM_COMPONENTS = [
  {
    id: "api",
    name: "API Server",
    status: "operational",
    uptime: 99.98,
    responseTime: 45,
    icon: Server,
  },
  {
    id: "database",
    name: "Database",
    status: "operational",
    uptime: 99.99,
    responseTime: 12,
    icon: Database,
  },
  {
    id: "storage",
    name: "File Storage",
    status: "operational",
    uptime: 99.95,
    responseTime: 85,
    icon: Cloud,
  },
  {
    id: "auth",
    name: "Authentication",
    status: "operational",
    uptime: 100,
    responseTime: 23,
    icon: Lock,
  },
  {
    id: "scoring",
    name: "Scoring Engine",
    status: "operational",
    uptime: 99.97,
    responseTime: 156,
    icon: Zap,
  },
];

const TRUST_BADGES = [
  {
    id: "iso27001",
    name: "ISO 27001",
    description: "Information Security Management",
    status: "certified",
    validUntil: "2026-03-15",
    icon: Shield,
  },
  {
    id: "soc2",
    name: "SOC 2 Type II",
    description: "Service Organization Controls",
    status: "certified",
    validUntil: "2025-08-20",
    icon: FileCheck,
  },
  {
    id: "gdpr",
    name: "GDPR Compliant",
    description: "EU Data Protection",
    status: "compliant",
    validUntil: null,
    icon: Lock,
  },
  {
    id: "iosco",
    name: "IOSCO Principles",
    description: "Price Index Methodology",
    status: "aligned",
    validUntil: null,
    icon: Award,
  },
];

const SLA_METRICS = [
  { name: "Platform Availability", target: 99.9, actual: 99.97, unit: "%" },
  { name: "API Response Time", target: 200, actual: 45, unit: "ms", inverted: true },
  { name: "Data Freshness", target: 60, actual: 15, unit: "min", inverted: true },
  { name: "Support Response", target: 4, actual: 1.5, unit: "hrs", inverted: true },
];

const RECENT_INCIDENTS = [
  {
    id: 1,
    date: "2025-01-08",
    title: "Scheduled Maintenance",
    status: "resolved",
    duration: "45 min",
    impact: "minor",
  },
  {
    id: 2,
    date: "2024-12-15",
    title: "API Rate Limiting Issue",
    status: "resolved",
    duration: "12 min",
    impact: "minor",
  },
];

export default function PlatformHealth() {
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setLastUpdated(new Date());
      setIsRefreshing(false);
    }, 1000);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "operational":
        return "bg-green-500";
      case "degraded":
        return "bg-yellow-500";
      case "outage":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "operational":
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case "degraded":
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case "outage":
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return null;
    }
  };

  const overallStatus = SYSTEM_COMPONENTS.every(c => c.status === "operational")
    ? "operational"
    : SYSTEM_COMPONENTS.some(c => c.status === "outage")
      ? "outage"
      : "degraded";

  return (
    <PageLayout>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-slate-900 via-emerald-900/20 to-slate-900 text-black py-12 lg:py-16 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-1/4 -right-1/4 w-[600px] h-[600px] rounded-full bg-[#D4AF37]/10 blur-[100px]" />
        </div>

        <PageContainer className="relative z-10" padding="none">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
            <div className="max-w-2xl">
              <div className="flex flex-wrap gap-2 mb-6">
                <Badge
                  variant="outline"
                  className={cn(
                    "border-emerald-400/50 text-emerald-300 bg-[#D4AF37]/10",
                    overallStatus === "operational" && "border-emerald-400/50",
                    overallStatus === "degraded" && "border-yellow-400/50 text-yellow-300 bg-yellow-500/10",
                    overallStatus === "outage" && "border-red-400/50 text-red-300 bg-red-500/10"
                  )}
                >
                  {overallStatus === "operational" && <CheckCircle2 className="h-3 w-3 mr-1" />}
                  {overallStatus === "degraded" && <AlertTriangle className="h-3 w-3 mr-1" />}
                  {overallStatus === "outage" && <XCircle className="h-3 w-3 mr-1" />}
                  {overallStatus === "operational" ? "All Systems Operational" :
                    overallStatus === "degraded" ? "Degraded Performance" : "Service Disruption"}
                </Badge>
              </div>

              <h1 className="text-4xl lg:text-5xl font-display font-bold mb-4">
                Platform Status
              </h1>
              <p className="text-xl text-gray-600 leading-relaxed">
                Real-time monitoring, uptime tracking, and trust certifications
                for the ABFI platform.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Button
                onClick={handleRefresh}
                disabled={isRefreshing}
                variant="outline"
                className="border-white/20 text-black hover:bg-white/10"
              >
                <RefreshCw className={cn("h-4 w-4 mr-2", isRefreshing && "animate-spin")} />
                Refresh
              </Button>
            </div>
          </div>

          <div className="mt-6 text-sm text-gray-500">
            <Clock className="h-4 w-4 inline mr-1" />
            Last updated: {lastUpdated.toLocaleString("en-AU")}
          </div>
        </PageContainer>
      </section>

      <PageContainer>
        <div className="grid lg:grid-cols-3 gap-6 -mt-8">
          {/* System Components */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  System Components
                </CardTitle>
                <CardDescription>
                  Current status of all platform services
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {SYSTEM_COMPONENTS.map((component) => {
                  const Icon = component.icon;
                  return (
                    <div
                      key={component.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-muted">
                          <Icon className="h-4 w-4 text-gray-600" />
                        </div>
                        <div>
                          <div className="font-medium flex items-center gap-2">
                            {component.name}
                            {getStatusIcon(component.status)}
                          </div>
                          <div className="text-xs text-gray-600">
                            {component.uptime}% uptime • {component.responseTime}ms avg
                          </div>
                        </div>
                      </div>
                      <div
                        className={cn(
                          "w-2 h-2 rounded-full",
                          getStatusColor(component.status)
                        )}
                      />
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* SLA Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  SLA Performance
                </CardTitle>
                <CardDescription>
                  Service Level Agreement metrics (30-day rolling)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {SLA_METRICS.map((metric) => {
                  const isExceeding = metric.inverted
                    ? metric.actual < metric.target
                    : metric.actual >= metric.target;
                  const progress = metric.inverted
                    ? Math.min(100, (metric.target / metric.actual) * 100)
                    : Math.min(100, (metric.actual / metric.target) * 100);

                  return (
                    <div key={metric.name} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>{metric.name}</span>
                        <span className={cn(
                          "font-mono font-medium",
                          isExceeding ? "text-green-600" : "text-red-600"
                        )}>
                          {metric.actual}{metric.unit}
                          <span className="text-gray-600 ml-1">
                            / {metric.target}{metric.unit} target
                          </span>
                        </span>
                      </div>
                      <Progress
                        value={progress}
                        className={cn(
                          "h-2",
                          isExceeding ? "[&>div]:bg-green-500" : "[&>div]:bg-red-500"
                        )}
                      />
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Recent Incidents */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Recent Incidents
                </CardTitle>
                <CardDescription>
                  Past 90 days incident history
                </CardDescription>
              </CardHeader>
              <CardContent>
                {RECENT_INCIDENTS.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-3" />
                    <p className="font-medium">No incidents in the past 90 days</p>
                    <p className="text-sm text-gray-600">
                      All systems have been operating normally
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {RECENT_INCIDENTS.map((incident) => (
                      <div
                        key={incident.id}
                        className="flex items-start gap-3 p-3 rounded-lg bg-muted/30"
                      >
                        <div
                          className={cn(
                            "p-1.5 rounded-full mt-0.5",
                            incident.status === "resolved"
                              ? "bg-green-100"
                              : "bg-yellow-100"
                          )}
                        >
                          {incident.status === "resolved" ? (
                            <CheckCircle2 className="h-3 w-3 text-green-600" />
                          ) : (
                            <AlertTriangle className="h-3 w-3 text-yellow-600" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-sm">
                              {incident.title}
                            </span>
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-xs",
                                incident.impact === "minor"
                                  ? "border-yellow-300 text-yellow-700"
                                  : incident.impact === "major"
                                    ? "border-red-300 text-red-700"
                                    : "border-gray-300"
                              )}
                            >
                              {incident.impact}
                            </Badge>
                          </div>
                          <div className="text-xs text-gray-600 mt-1">
                            {incident.date} • Duration: {incident.duration}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Trust Badges & Certifications */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Trust Certifications
                </CardTitle>
                <CardDescription>
                  Third-party audits and compliance
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {TRUST_BADGES.map((badge) => {
                  const Icon = badge.icon;
                  return (
                    <div
                      key={badge.id}
                      className="p-4 rounded-lg border bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800"
                    >
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-[#D4AF37]/10">
                          <Icon className="h-5 w-5 text-[#D4AF37]" />
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold">{badge.name}</div>
                          <div className="text-xs text-gray-600 mb-2">
                            {badge.description}
                          </div>
                          <Badge
                            className={cn(
                              "text-xs",
                              badge.status === "certified"
                                ? "bg-green-100 text-green-800"
                                : badge.status === "compliant"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-purple-100 text-purple-800"
                            )}
                          >
                            {badge.status ? badge.status.charAt(0).toUpperCase() + badge.status.slice(1) : ""}
                          </Badge>
                          {badge.validUntil && (
                            <div className="text-xs text-gray-600 mt-2">
                              Valid until: {badge.validUntil}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Platform Statistics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Active Users</span>
                  <span className="font-mono font-semibold">2,547</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">API Calls Today</span>
                  <span className="font-mono font-semibold">1.2M</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Certificates Issued</span>
                  <span className="font-mono font-semibold">847</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Data Points</span>
                  <span className="font-mono font-semibold">45.3M</span>
                </div>
              </CardContent>
            </Card>

            {/* External Links */}
            <Card>
              <CardHeader>
                <CardTitle>Resources</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start" asChild>
                  <a href="/terms" target="_blank">
                    <FileCheck className="h-4 w-4 mr-2" />
                    Terms of Service
                    <ExternalLink className="h-3 w-3 ml-auto" />
                  </a>
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <a href="/privacy" target="_blank">
                    <Lock className="h-4 w-4 mr-2" />
                    Privacy Policy
                    <ExternalLink className="h-3 w-3 ml-auto" />
                  </a>
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <a href="/docs/api" target="_blank">
                    <Server className="h-4 w-4 mr-2" />
                    API Documentation
                    <ExternalLink className="h-3 w-3 ml-auto" />
                  </a>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </PageContainer>
    </PageLayout>
  );
}
