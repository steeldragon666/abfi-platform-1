"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Clock,
  Send,
  Leaf,
  Factory,
  Truck,
  Zap,
  FlameKindling,
  Package,
  TreeDeciduous,
  Recycle,
  AlertTriangle,
  Play,
  Download,
} from "lucide-react";
import { toast } from "sonner";
import type { CIReportStatus, CIMethodology } from "@/types/database";

interface ReportWithRelations {
  id: string;
  report_id: string;
  feedstock_id: string;
  supplier_id: string;
  reporting_period_start: string;
  reporting_period_end: string;
  reference_year: number;
  methodology: CIMethodology;
  methodology_version: string | null;
  data_quality_level: string;
  scope1_cultivation: number;
  scope1_processing: number;
  scope1_transport: number;
  scope1_total: number;
  scope2_electricity: number;
  scope2_steam_heat: number;
  scope2_total: number;
  scope3_upstream_inputs: number;
  scope3_land_use_change: number;
  scope3_distribution: number;
  scope3_end_of_life: number;
  scope3_total: number;
  total_ci_value: number;
  ci_rating: string | null;
  ci_score: number | null;
  ghg_savings_percentage: number | null;
  red_ii_compliant: boolean;
  rtfo_compliant: boolean;
  cfp_compliant: boolean;
  uncertainty_range_low: number | null;
  uncertainty_range_high: number | null;
  calculation_notes: string | null;
  status: CIReportStatus;
  verification_level: string;
  feedstock?: {
    id: string;
    feedstock_id: string;
    name: string;
    category: string;
    state?: string;
    region?: string;
  };
  supplier?: {
    id: string;
    company_name: string;
    contact_email?: string;
  };
  verifier?: {
    id: string;
    full_name: string;
  };
  assigned_auditor?: {
    id: string;
    full_name: string;
  };
  audit_logs?: Array<{
    id: string;
    action: string;
    notes: string | null;
    created_at: string;
    new_status: string | null;
    user?: {
      id: string;
      full_name: string;
    };
  }>;
}

export default function AuditorCIReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const [reportId, setReportId] = useState<string | null>(null);
  const [report, setReport] = useState<ReportWithRelations | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Dialog states
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [revisionDialogOpen, setRevisionDialogOpen] = useState(false);

  // Form states
  const [notes, setNotes] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");

  useEffect(() => {
    params.then((p) => setReportId(p.id));
  }, [params]);

  useEffect(() => {
    if (reportId) {
      fetchReport();
    }
  }, [reportId]);

  const fetchReport = async () => {
    try {
      const response = await fetch(`/api/ci-reports/${reportId}`);
      if (!response.ok) throw new Error("Failed to fetch report");
      const data = await response.json();
      setReport(data);
    } catch (error) {
      toast.error("Failed to load report");
      router.push("/auditor/ci-verification");
    } finally {
      setLoading(false);
    }
  };

  const handleStartReview = async () => {
    setActionLoading(true);
    try {
      const response = await fetch(`/api/ci-reports/${reportId}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start_review" }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to start review");
      }

      toast.success("Review started - report assigned to you");
      fetchReport();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to start review");
    } finally {
      setActionLoading(false);
    }
  };

  const handleApprove = async () => {
    setActionLoading(true);
    try {
      const response = await fetch(`/api/ci-reports/${reportId}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "approve",
          notes: notes || null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to approve report");
      }

      toast.success("Report approved successfully");
      setApproveDialogOpen(false);
      router.push("/auditor/ci-verification");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to approve");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast.error("Please provide a rejection reason");
      return;
    }

    setActionLoading(true);
    try {
      const response = await fetch(`/api/ci-reports/${reportId}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reject",
          rejection_reason: rejectionReason,
          notes: notes || null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to reject report");
      }

      toast.success("Report rejected");
      setRejectDialogOpen(false);
      router.push("/auditor/ci-verification");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to reject");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRequestRevision = async () => {
    if (!notes.trim()) {
      toast.error("Please provide revision notes");
      return;
    }

    setActionLoading(true);
    try {
      const response = await fetch(`/api/ci-reports/${reportId}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "request_revision",
          notes: notes,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to request revision");
      }

      toast.success("Revision requested - report returned to supplier");
      setRevisionDialogOpen(false);
      router.push("/auditor/ci-verification");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to request revision");
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: CIReportStatus) => {
    switch (status) {
      case "verified":
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            <CheckCircle className="mr-1 h-3 w-3" />
            Verified
          </Badge>
        );
      case "submitted":
        return (
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            <Send className="mr-1 h-3 w-3" />
            Submitted
          </Badge>
        );
      case "under_review":
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
            <Clock className="mr-1 h-3 w-3" />
            Under Review
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="destructive">
            <XCircle className="mr-1 h-3 w-3" />
            Rejected
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getMethodologyLabel = (methodology: CIMethodology) => {
    const labels: Record<CIMethodology, string> = {
      RED_II: "RED II",
      RTFO: "RTFO",
      ISO_14064: "ISO 14064",
      ISCC: "ISCC",
      RSB: "RSB",
    };
    return labels[methodology] || methodology;
  };

  const getCIRatingColor = (rating: string | null) => {
    if (!rating) return "text-gray-500 bg-gray-50";
    if (rating.startsWith("A")) return "text-green-600 bg-green-50";
    if (rating.startsWith("B")) return "text-blue-600 bg-blue-50";
    if (rating.startsWith("C")) return "text-yellow-600 bg-yellow-50";
    if (rating === "D") return "text-orange-600 bg-orange-50";
    return "text-red-600 bg-red-50";
  };

  const formatDate = (date: string | null) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("en-AU", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!report) {
    return null;
  }

  const canStartReview = report.status === "submitted";
  const canVerify = report.status === "under_review";
  const isVerified = report.status === "verified";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/auditor/ci-verification">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight font-mono">
              {report.report_id}
            </h1>
            <p className="text-muted-foreground">
              {report.supplier?.company_name} - {report.feedstock?.name}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {getStatusBadge(report.status)}
          {canStartReview && (
            <Button onClick={handleStartReview} disabled={actionLoading}>
              <Play className="mr-2 h-4 w-4" />
              Start Review
            </Button>
          )}
          {canVerify && (
            <>
              <Button
                variant="outline"
                onClick={() => setRevisionDialogOpen(true)}
                disabled={actionLoading}
              >
                <AlertTriangle className="mr-2 h-4 w-4" />
                Request Revision
              </Button>
              <Button
                variant="destructive"
                onClick={() => setRejectDialogOpen(true)}
                disabled={actionLoading}
              >
                <XCircle className="mr-2 h-4 w-4" />
                Reject
              </Button>
              <Button
                onClick={() => setApproveDialogOpen(true)}
                disabled={actionLoading}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Approve
              </Button>
            </>
          )}
          {isVerified && (
            <Button asChild>
              <a href={`/api/ci-reports/${reportId}/certificate`} download>
                <Download className="mr-2 h-4 w-4" />
                Download Certificate
              </a>
            </Button>
          )}
        </div>
      </div>

      {/* Warning for high CI value */}
      {report.ghg_savings_percentage !== null && report.ghg_savings_percentage < 50 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-orange-800">
              <AlertTriangle className="h-5 w-5" />
              <span className="font-medium">Warning: Low GHG Savings</span>
            </div>
            <p className="text-orange-700 text-sm mt-1">
              This report shows {report.ghg_savings_percentage.toFixed(1)}% GHG savings,
              which is below the 50% threshold required for most compliance schemes.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        {/* Summary Card */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Leaf className="h-5 w-5" />
              CI Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center py-4">
              <div className={`inline-flex items-center justify-center rounded-full px-6 py-3 ${getCIRatingColor(report.ci_rating)}`}>
                <span className="text-4xl font-bold">{report.ci_rating || "-"}</span>
              </div>
              <div className="mt-2 text-3xl font-bold">
                {report.total_ci_value?.toFixed(1) || "-"}
                <span className="text-sm font-normal text-muted-foreground ml-1">gCO2e/MJ</span>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">GHG Savings</span>
                <span className={`font-medium ${(report.ghg_savings_percentage || 0) >= 50 ? "text-green-600" : "text-orange-600"}`}>
                  {report.ghg_savings_percentage?.toFixed(1) || "-"}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Uncertainty Range</span>
                <span className="font-medium">
                  {report.uncertainty_range_low?.toFixed(1)} - {report.uncertainty_range_high?.toFixed(1)}
                </span>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="text-sm font-medium">Compliance Status</div>
              <div className="grid grid-cols-3 gap-2">
                <div className={`text-xs px-2 py-1 rounded text-center ${report.red_ii_compliant ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                  RED II {report.red_ii_compliant ? "✓" : "✗"}
                </div>
                <div className={`text-xs px-2 py-1 rounded text-center ${report.rtfo_compliant ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                  RTFO {report.rtfo_compliant ? "✓" : "✗"}
                </div>
                <div className={`text-xs px-2 py-1 rounded text-center ${report.cfp_compliant ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                  CFP {report.cfp_compliant ? "✓" : "✗"}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Scope Emissions */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Emission Breakdown by Scope</CardTitle>
            <CardDescription>All values in gCO2e/MJ</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Scope 1 */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Scope 1</Badge>
                  <span className="text-sm text-muted-foreground">Direct Emissions</span>
                  <span className="ml-auto font-bold">{report.scope1_total?.toFixed(2)}</span>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                    <Leaf className="h-4 w-4 text-green-600" />
                    <div>
                      <div className="text-xs text-muted-foreground">Cultivation</div>
                      <div className="font-medium">{report.scope1_cultivation?.toFixed(2)}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                    <Factory className="h-4 w-4 text-orange-600" />
                    <div>
                      <div className="text-xs text-muted-foreground">Processing</div>
                      <div className="font-medium">{report.scope1_processing?.toFixed(2)}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                    <Truck className="h-4 w-4 text-blue-600" />
                    <div>
                      <div className="text-xs text-muted-foreground">Transport</div>
                      <div className="font-medium">{report.scope1_transport?.toFixed(2)}</div>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Scope 2 */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Scope 2</Badge>
                  <span className="text-sm text-muted-foreground">Indirect Energy</span>
                  <span className="ml-auto font-bold">{report.scope2_total?.toFixed(2)}</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                    <Zap className="h-4 w-4 text-yellow-600" />
                    <div>
                      <div className="text-xs text-muted-foreground">Electricity</div>
                      <div className="font-medium">{report.scope2_electricity?.toFixed(2)}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                    <FlameKindling className="h-4 w-4 text-red-600" />
                    <div>
                      <div className="text-xs text-muted-foreground">Steam/Heat</div>
                      <div className="font-medium">{report.scope2_steam_heat?.toFixed(2)}</div>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Scope 3 */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">Scope 3</Badge>
                  <span className="text-sm text-muted-foreground">Value Chain</span>
                  <span className="ml-auto font-bold">{report.scope3_total?.toFixed(2)}</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                    <Package className="h-4 w-4 text-indigo-600" />
                    <div>
                      <div className="text-xs text-muted-foreground">Upstream Inputs</div>
                      <div className="font-medium">{report.scope3_upstream_inputs?.toFixed(2)}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                    <TreeDeciduous className="h-4 w-4 text-green-600" />
                    <div>
                      <div className="text-xs text-muted-foreground">Land Use Change</div>
                      <div className="font-medium">{report.scope3_land_use_change?.toFixed(2)}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                    <Truck className="h-4 w-4 text-blue-600" />
                    <div>
                      <div className="text-xs text-muted-foreground">Distribution</div>
                      <div className="font-medium">{report.scope3_distribution?.toFixed(2)}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                    <Recycle className="h-4 w-4 text-teal-600" />
                    <div>
                      <div className="text-xs text-muted-foreground">End of Life</div>
                      <div className="font-medium">{report.scope3_end_of_life?.toFixed(2)}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Report Details & Timeline */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Report Info */}
        <Card>
          <CardHeader>
            <CardTitle>Report Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">Supplier</div>
                <div className="font-medium">{report.supplier?.company_name}</div>
                <div className="text-xs text-muted-foreground">{report.supplier?.contact_email}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Feedstock</div>
                <div className="font-medium">{report.feedstock?.name}</div>
                <div className="text-xs text-muted-foreground">{report.feedstock?.feedstock_id}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Methodology</div>
                <div className="font-medium">{getMethodologyLabel(report.methodology)}</div>
                {report.methodology_version && (
                  <div className="text-xs text-muted-foreground">v{report.methodology_version}</div>
                )}
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Data Quality</div>
                <div className="font-medium capitalize">{report.data_quality_level?.replace(/_/g, " ")}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Reporting Period</div>
                <div className="font-medium">
                  {formatDate(report.reporting_period_start)} - {formatDate(report.reporting_period_end)}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Reference Year</div>
                <div className="font-medium">{report.reference_year}</div>
              </div>
            </div>

            {report.calculation_notes && (
              <>
                <Separator />
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Calculation Notes</div>
                  <p className="text-sm">{report.calculation_notes}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Audit Timeline */}
        <Card>
          <CardHeader>
            <CardTitle>Audit History</CardTitle>
          </CardHeader>
          <CardContent>
            {report.audit_logs && report.audit_logs.length > 0 ? (
              <div className="space-y-4">
                {report.audit_logs.map((log, index) => (
                  <div key={log.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`w-2 h-2 rounded-full ${
                        log.action === "approved" ? "bg-green-500" :
                        log.action === "rejected" ? "bg-red-500" :
                        log.action === "submitted" ? "bg-blue-500" :
                        log.action === "review_started" ? "bg-yellow-500" :
                        "bg-gray-400"
                      }`} />
                      {index < report.audit_logs!.length - 1 && (
                        <div className="w-px h-full bg-border mt-1" />
                      )}
                    </div>
                    <div className="pb-4">
                      <div className="flex items-center gap-2">
                        <span className="font-medium capitalize">{log.action.replace(/_/g, " ")}</span>
                        {log.new_status && (
                          <Badge variant="outline" className="text-xs">{log.new_status}</Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {log.user?.full_name || "System"} • {new Date(log.created_at).toLocaleString()}
                      </div>
                      {log.notes && (
                        <p className="text-sm mt-1 text-muted-foreground">{log.notes}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">No audit history</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Approve Dialog */}
      <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve CI Report</DialogTitle>
            <DialogDescription>
              Confirm that this report has been reviewed and meets verification requirements.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Notes (Optional)</Label>
              <Textarea
                placeholder="Add any notes about this verification..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleApprove}
              disabled={actionLoading}
              className="bg-green-600 hover:bg-green-700"
            >
              {actionLoading ? "Approving..." : "Approve Report"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject CI Report</DialogTitle>
            <DialogDescription>
              Provide a reason for rejecting this report. The supplier will be notified.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Rejection Reason *</Label>
              <Textarea
                placeholder="Explain why this report is being rejected..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
                required
              />
            </div>
            <div>
              <Label>Additional Notes (Optional)</Label>
              <Textarea
                placeholder="Any additional notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={actionLoading || !rejectionReason.trim()}
            >
              {actionLoading ? "Rejecting..." : "Reject Report"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Request Revision Dialog */}
      <Dialog open={revisionDialogOpen} onOpenChange={setRevisionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Revision</DialogTitle>
            <DialogDescription>
              Request changes from the supplier. The report will be returned to draft status.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Revision Notes *</Label>
              <Textarea
                placeholder="Describe what needs to be corrected or clarified..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRevisionDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleRequestRevision}
              disabled={actionLoading || !notes.trim()}
            >
              {actionLoading ? "Sending..." : "Request Revision"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
