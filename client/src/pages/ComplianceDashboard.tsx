/**
 * Compliance Dashboard - Nextgen Design
 *
 * Features:
 * - Quick stats bar at top with icon + value + label pattern
 * - Card-based layout with consistent spacing
 * - Typography components for consistent styling
 */

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  FileText,
  Download,
  Shield,
  Activity,
  Users,
  ClipboardCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { H1, H3, Body, MetricValue, DataLabel } from "@/components/Typography";

// Quick stats for top bar
const QUICK_STATS = [
  { label: "Audit Events", value: "1,247", icon: Activity, color: "text-[#D4AF37]" },
  { label: "Active Consents", value: "156", icon: Users, color: "text-blue-600" },
  { label: "Open Disputes", value: "3", icon: AlertCircle, color: "text-red-500" },
  { label: "Compliance Score", value: "94%", icon: ClipboardCheck, color: "text-green-600" },
];

// Metric card helper component
function MetricCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="h-10 w-10 rounded-lg bg-muted/50 flex items-center justify-center">
        {icon}
      </div>
      <div>
        <DataLabel>{title}</DataLabel>
        <MetricValue size="lg">{value}</MetricValue>
      </div>
    </div>
  );
}

export default function ComplianceDashboard() {
  const currentQuarter = trpc.complianceReporting.getCurrentQuarter.useQuery();

  const [selectedQuarter, setSelectedQuarter] = useState<number>(
    currentQuarter.data?.quarter || 1
  );
  const [selectedYear, setSelectedYear] = useState<number>(
    currentQuarter.data?.year || new Date().getFullYear()
  );

  const report = trpc.complianceReporting.generateReport.useQuery({
    quarter: selectedQuarter,
    year: selectedYear,
  });

  const reportSummary = trpc.complianceReporting.getReportSummary.useQuery({
    quarter: selectedQuarter,
    year: selectedYear,
  });

  const getComplianceBadge = (level: string) => {
    switch (level) {
      case "excellent":
        return <Badge className="bg-green-100 text-green-800 border-green-200">Excellent</Badge>;
      case "good":
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Good</Badge>;
      case "fair":
        return <Badge className="bg-amber-100 text-amber-800 border-amber-200">Fair</Badge>;
      case "needs_attention":
        return <Badge className="bg-red-100 text-red-800 border-red-200">Needs Attention</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const downloadReport = () => {
    if (!reportSummary.data) return;
    const blob = new Blob([reportSummary.data], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `compliance-report-Q${selectedQuarter}-${selectedYear}.txt`;
    a.click();
    URL.revokeObjectURL(url);
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
                  <stat.icon className={cn("h-5 w-5", stat.color)} />
                </div>
                <div>
                  <MetricValue size="md">{stat.value}</MetricValue>
                  <DataLabel>{stat.label}</DataLabel>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#D4AF37]/10">
              <Shield className="h-6 w-6 text-[#D4AF37]" />
            </div>
            <div>
              <H1 className="text-2xl">Compliance Dashboard</H1>
              <Body className="text-gray-600">Quarterly compliance reports with governance metrics</Body>
            </div>
          </div>
        </div>

      {/* Period Selector */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Report Period</CardTitle>
          <CardDescription>
            Select quarter and year to view compliance metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Quarter</label>
              <Select
                value={selectedQuarter.toString()}
                onValueChange={value => setSelectedQuarter(parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Q1 (Jan-Mar)</SelectItem>
                  <SelectItem value="2">Q2 (Apr-Jun)</SelectItem>
                  <SelectItem value="3">Q3 (Jul-Sep)</SelectItem>
                  <SelectItem value="4">Q4 (Oct-Dec)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Year</label>
              <Select
                value={selectedYear.toString()}
                onValueChange={value => setSelectedYear(parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[2024, 2025, 2026].map(year => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={downloadReport} disabled={!reportSummary.data}>
              <Download className="h-4 w-4 mr-2" />
              Download Report
            </Button>
          </div>
        </CardContent>
      </Card>

      {report.isLoading && (
        <div className="text-center py-12">
          <p className="text-gray-600">
            Generating compliance report...
          </p>
        </div>
      )}

      {report.data && (
        <>
          {/* Overall Compliance */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Overall Compliance Status</span>
                {getComplianceBadge(report.data.summary.overallCompliance)}
              </CardTitle>
              <CardDescription>
                Q{report.data.period.quarter} {report.data.period.year} (
                {new Date(report.data.period.startDate).toLocaleDateString()} -{" "}
                {new Date(report.data.period.endDate).toLocaleDateString()})
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-yellow-500" />
                    Key Findings
                  </h3>
                  {report.data.summary.keyFindings.length === 0 ? (
                    <p className="text-sm text-gray-600">
                      No significant findings
                    </p>
                  ) : (
                    <ul className="space-y-2">
                      {report.data.summary.keyFindings.map((finding, i) => (
                        <li key={i} className="text-sm flex gap-2">
                          <span className="text-gray-600">•</span>
                          <span>{finding}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    Recommendations
                  </h3>
                  {report.data.summary.recommendations.length === 0 ? (
                    <p className="text-sm text-gray-600">
                      No recommendations
                    </p>
                  ) : (
                    <ul className="space-y-2">
                      {report.data.summary.recommendations.map((rec, i) => (
                        <li key={i} className="text-sm flex gap-2">
                          <span className="text-gray-600">•</span>
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Detailed Metrics Tabs */}
          <Tabs defaultValue="audit" className="space-y-4">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="audit">Audit Activity</TabsTrigger>
              <TabsTrigger value="overrides">Admin Overrides</TabsTrigger>
              <TabsTrigger value="consents">Consents</TabsTrigger>
              <TabsTrigger value="disputes">Disputes</TabsTrigger>
              <TabsTrigger value="platform">Platform</TabsTrigger>
            </TabsList>

            {/* Audit Activity Tab */}
            <TabsContent value="audit">
              <Card>
                <CardHeader>
                  <CardTitle>Audit Activity</CardTitle>
                  <CardDescription>
                    Audit log events and user activity
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-6 mb-6">
                    <MetricCard
                      title="Total Events"
                      value={report.data.auditMetrics?.totalEvents || 0}
                      icon={<FileText className="h-5 w-5" />}
                    />
                    <MetricCard
                      title="Unique Actions"
                      value={
                        report.data.auditMetrics?.eventsByAction.length || 0
                      }
                      icon={<TrendingUp className="h-5 w-5" />}
                    />
                    <MetricCard
                      title="Active Users"
                      value={report.data.auditMetrics?.activeUsers.length || 0}
                      icon={<TrendingUp className="h-5 w-5" />}
                    />
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-3">Top Actions</h4>
                      <div className="space-y-2">
                        {report.data.auditMetrics?.eventsByAction
                          .slice(0, 5)
                          .map((action, i) => (
                            <div
                              key={i}
                              className="flex justify-between items-center"
                            >
                              <span className="text-sm">{action.action}</span>
                              <Badge variant="outline">{action.count}</Badge>
                            </div>
                          ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-3">Top Entity Types</h4>
                      <div className="space-y-2">
                        {report.data.auditMetrics?.eventsByEntity
                          .slice(0, 5)
                          .map((entity, i) => (
                            <div
                              key={i}
                              className="flex justify-between items-center"
                            >
                              <span className="text-sm">
                                {entity.entityType}
                              </span>
                              <Badge variant="outline">{entity.count}</Badge>
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Admin Overrides Tab */}
            <TabsContent value="overrides">
              <Card>
                <CardHeader>
                  <CardTitle>Admin Overrides</CardTitle>
                  <CardDescription>
                    Override activity and revocations
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-6 mb-6">
                    <MetricCard
                      title="Total Overrides"
                      value={report.data.overrideMetrics?.totalOverrides || 0}
                      icon={<AlertCircle className="h-5 w-5" />}
                    />
                    <MetricCard
                      title="Active"
                      value={report.data.overrideMetrics?.activeOverrides || 0}
                      icon={<CheckCircle2 className="h-5 w-5 text-green-500" />}
                    />
                    <MetricCard
                      title="Revoked"
                      value={report.data.overrideMetrics?.revokedOverrides || 0}
                      icon={<AlertCircle className="h-5 w-5 text-red-500" />}
                    />
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-3">Overrides by Type</h4>
                      <div className="space-y-2">
                        {report.data.overrideMetrics?.overridesByType.map(
                          (type, i) => (
                            <div
                              key={i}
                              className="flex justify-between items-center"
                            >
                              <span className="text-sm">
                                {type.overrideType}
                              </span>
                              <Badge variant="outline">{type.count}</Badge>
                            </div>
                          )
                        )}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-3">
                        Overrides by Entity
                      </h4>
                      <div className="space-y-2">
                        {report.data.overrideMetrics?.overridesByEntity.map(
                          (entity, i) => (
                            <div
                              key={i}
                              className="flex justify-between items-center"
                            >
                              <span className="text-sm">
                                {entity.entityType}
                              </span>
                              <Badge variant="outline">{entity.count}</Badge>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Consents Tab */}
            <TabsContent value="consents">
              <Card>
                <CardHeader>
                  <CardTitle>Consent Management</CardTitle>
                  <CardDescription>
                    User consent tracking and withdrawals
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6 mb-6">
                    <MetricCard
                      title="Total Consents"
                      value={report.data.consentMetrics?.totalConsents || 0}
                      icon={<CheckCircle2 className="h-5 w-5" />}
                    />
                    <MetricCard
                      title="Withdrawals"
                      value={report.data.consentMetrics?.totalWithdrawals || 0}
                      icon={<AlertCircle className="h-5 w-5" />}
                    />
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-3">Consents by Type</h4>
                      <div className="space-y-2">
                        {report.data.consentMetrics?.consentsByType.map(
                          (consent, i) => (
                            <div
                              key={i}
                              className="flex justify-between items-center"
                            >
                              <span className="text-sm">
                                {consent.consentType} (
                                {consent.granted ? "Granted" : "Denied"})
                              </span>
                              <Badge variant="outline">{consent.count}</Badge>
                            </div>
                          )
                        )}
                      </div>
                    </div>

                    {(report.data.consentMetrics?.withdrawalsByType?.length ||
                      0) > 0 && (
                      <div>
                        <h4 className="font-semibold mb-3">
                          Withdrawals by Type
                        </h4>
                        <div className="space-y-2">
                          {report.data.consentMetrics?.withdrawalsByType?.map(
                            (withdrawal, i) => (
                              <div
                                key={i}
                                className="flex justify-between items-center"
                              >
                                <span className="text-sm">
                                  {withdrawal.consentType}
                                </span>
                                <Badge variant="outline">
                                  {withdrawal.count}
                                </Badge>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Disputes Tab */}
            <TabsContent value="disputes">
              <Card>
                <CardHeader>
                  <CardTitle>Dispute Resolution</CardTitle>
                  <CardDescription>
                    Dispute tracking and resolution metrics
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-6 mb-6">
                    <MetricCard
                      title="Total Disputes"
                      value={report.data.disputeMetrics?.totalDisputes || 0}
                      icon={<AlertCircle className="h-5 w-5" />}
                    />
                    <MetricCard
                      title="Resolved"
                      value={report.data.disputeMetrics?.resolvedDisputes || 0}
                      icon={<CheckCircle2 className="h-5 w-5 text-green-500" />}
                    />
                    <MetricCard
                      title="Avg Resolution Time"
                      value={`${report.data.disputeMetrics?.avgResolutionDays || 0} days`}
                      icon={<TrendingDown className="h-5 w-5" />}
                    />
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-3">Disputes by Type</h4>
                      <div className="space-y-2">
                        {report.data.disputeMetrics?.disputesByType.map(
                          (type, i) => (
                            <div
                              key={i}
                              className="flex justify-between items-center"
                            >
                              <span className="text-sm">
                                {type.disputeType}
                              </span>
                              <Badge variant="outline">{type.count}</Badge>
                            </div>
                          )
                        )}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-3">Disputes by Status</h4>
                      <div className="space-y-2">
                        {report.data.disputeMetrics?.disputesByStatus.map(
                          (status, i) => (
                            <div
                              key={i}
                              className="flex justify-between items-center"
                            >
                              <span className="text-sm">{status.status}</span>
                              <Badge variant="outline">{status.count}</Badge>
                            </div>
                          )
                        )}
                      </div>
                    </div>

                    {(report.data.disputeMetrics?.resolutionOutcomes?.length ||
                      0) > 0 && (
                      <div>
                        <h4 className="font-semibold mb-3">
                          Resolution Outcomes
                        </h4>
                        <div className="space-y-2">
                          {report.data.disputeMetrics?.resolutionOutcomes?.map(
                            (outcome, i) => (
                              <div
                                key={i}
                                className="flex justify-between items-center"
                              >
                                <span className="text-sm">
                                  {outcome.outcome}
                                </span>
                                <Badge variant="outline">{outcome.count}</Badge>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Platform Tab */}
            <TabsContent value="platform">
              <Card>
                <CardHeader>
                  <CardTitle>Platform Activity</CardTitle>
                  <CardDescription>
                    User growth and platform metrics
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-6 mb-6">
                    <MetricCard
                      title="New Users"
                      value={report.data.platformMetrics?.newUsers || 0}
                      icon={<TrendingUp className="h-5 w-5 text-green-500" />}
                    />
                    <MetricCard
                      title="New Feedstocks"
                      value={report.data.platformMetrics?.newFeedstocks || 0}
                      icon={<TrendingUp className="h-5 w-5 text-blue-500" />}
                    />
                    <MetricCard
                      title="Active Feedstocks"
                      value={report.data.platformMetrics?.activeFeedstocks || 0}
                      icon={<CheckCircle2 className="h-5 w-5 text-green-500" />}
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold mb-3">
                        Certificates Issued
                      </h4>
                      <div className="text-3xl font-bold">
                        {report.data.certificateMetrics?.totalCertificates || 0}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {report.data.certificateMetrics?.expiringSoon || 0}{" "}
                        expiring soon
                      </p>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-3">
                        Certificates by Type
                      </h4>
                      <div className="space-y-2">
                        {report.data.certificateMetrics?.certificatesByType
                          .slice(0, 5)
                          .map((cert, i) => (
                            <div
                              key={i}
                              className="flex justify-between items-center"
                            >
                              <span className="text-sm">{cert.type}</span>
                              <Badge variant="outline">{cert.count}</Badge>
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
      </div>
    </div>
  );
}
