import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
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
import {
  ArrowLeft,
  Edit,
  Send,
  Download,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
  Leaf,
  Factory,
  Truck,
  Zap,
  FlameKindling,
  Package,
  TreeDeciduous,
  Recycle,
} from "lucide-react";
import type { CIReportStatus, CIMethodology } from "@/types/database";

export const metadata = {
  title: "CI Report Details",
};

export default async function CIReportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get supplier
  const { data: supplier } = await supabase
    .from("suppliers")
    .select("*")
    .eq("profile_id", user.id)
    .single();

  if (!supplier) {
    redirect("/supplier/settings");
  }

  // Get CI report with details
  const { data: report } = await supabase
    .from("carbon_intensity_reports")
    .select(`
      *,
      feedstock:feedstocks(id, feedstock_id, name, category, state, region),
      verifier:profiles!carbon_intensity_reports_verified_by_fkey(id, full_name)
    `)
    .eq("id", id)
    .eq("supplier_id", supplier.id)
    .single();

  if (!report) {
    notFound();
  }

  // Get audit logs
  const { data: auditLogs } = await supabase
    .from("ci_audit_logs")
    .select(`
      *,
      user:profiles(id, full_name)
    `)
    .eq("report_id", id)
    .order("created_at", { ascending: false });

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
      case "draft":
        return (
          <Badge variant="outline">
            <Edit className="mr-1 h-3 w-3" />
            Draft
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="destructive">
            <XCircle className="mr-1 h-3 w-3" />
            Rejected
          </Badge>
        );
      case "expired":
        return (
          <Badge variant="outline" className="bg-gray-100 text-gray-600">
            <AlertCircle className="mr-1 h-3 w-3" />
            Expired
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
    if (!rating) return "text-gray-500";
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/supplier/ci-reports">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight font-mono">
              {report.report_id}
            </h1>
            <p className="text-muted-foreground">
              {report.feedstock?.name} - {getMethodologyLabel(report.methodology)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {getStatusBadge(report.status)}
          {report.status === "draft" && (
            <>
              <Button variant="outline" asChild>
                <Link href={`/supplier/ci-reports/${report.id}/edit`}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </Link>
              </Button>
              <Button>
                <Send className="mr-2 h-4 w-4" />
                Submit for Verification
              </Button>
            </>
          )}
          {report.status === "verified" && (
            <Button asChild>
              <a href={`/api/ci-reports/${report.id}/certificate`} download>
                <Download className="mr-2 h-4 w-4" />
                Download Certificate
              </a>
            </Button>
          )}
        </div>
      </div>

      {/* Rejection/Auditor Notes Alert */}
      {report.status === "rejected" && report.rejection_reason && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-red-800 text-sm">Rejection Reason</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-700">{report.rejection_reason}</p>
          </CardContent>
        </Card>
      )}

      {report.auditor_notes && report.status !== "rejected" && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-blue-800 text-sm">Auditor Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-blue-700">{report.auditor_notes}</p>
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
                <div className="text-sm text-muted-foreground">Reporting Period</div>
                <div className="font-medium">
                  {formatDate(report.reporting_period_start)} - {formatDate(report.reporting_period_end)}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Reference Year</div>
                <div className="font-medium">{report.reference_year}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Data Quality</div>
                <div className="font-medium capitalize">{report.data_quality_level?.replace(/_/g, " ")}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Verification Level</div>
                <div className="font-medium capitalize">{report.verification_level?.replace(/_/g, " ")}</div>
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

            {report.status === "verified" && (
              <>
                <Separator />
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Verified By</div>
                    <div className="font-medium">{report.verifier?.full_name || "-"}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Verified Date</div>
                    <div className="font-medium">{formatDate(report.verified_at)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Expiry Date</div>
                    <div className="font-medium">{formatDate(report.expiry_date)}</div>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Audit Timeline */}
        <Card>
          <CardHeader>
            <CardTitle>Activity Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            {auditLogs && auditLogs.length > 0 ? (
              <div className="space-y-4">
                {auditLogs.map((log, index) => (
                  <div key={log.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`w-2 h-2 rounded-full ${
                        log.action === "approved" ? "bg-green-500" :
                        log.action === "rejected" ? "bg-red-500" :
                        log.action === "submitted" ? "bg-blue-500" :
                        "bg-gray-400"
                      }`} />
                      {index < auditLogs.length - 1 && (
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
              <p className="text-muted-foreground text-center py-4">No activity recorded</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
