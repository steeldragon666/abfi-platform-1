import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
  Send,
  Download,
  Leaf,
} from "lucide-react";
import type { CIReportStatus, CIMethodology } from "@/types/database";

export const metadata = {
  title: "CI Reports - Supplier Dashboard",
};

export default async function SupplierCIReportsPage() {
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

  // Get CI reports with feedstock info
  const { data: reports } = await supabase
    .from("carbon_intensity_reports")
    .select(`
      *,
      feedstock:feedstocks(id, feedstock_id, name, category)
    `)
    .eq("supplier_id", supplier.id)
    .order("created_at", { ascending: false });

  // Calculate stats
  const stats = {
    total: reports?.length || 0,
    verified: reports?.filter((r) => r.status === "verified").length || 0,
    pending: reports?.filter((r) => ["submitted", "under_review"].includes(r.status)).length || 0,
    avgCI: reports?.length
      ? Math.round(
          (reports.reduce((sum, r) => sum + (r.total_ci_value || 0), 0) / reports.length) * 10
        ) / 10
      : 0,
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
    if (rating.startsWith("A")) return "text-green-600";
    if (rating.startsWith("B")) return "text-blue-600";
    if (rating.startsWith("C")) return "text-yellow-600";
    if (rating === "D") return "text-orange-600";
    return "text-red-600";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Carbon Intensity Reports</h1>
          <p className="text-muted-foreground">
            Manage your CI reports and certifications
          </p>
        </div>
        <Button asChild>
          <Link href="/supplier/ci-reports/new">
            <Plus className="mr-2 h-4 w-4" />
            New CI Report
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Verified</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.verified}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg CI Value</CardTitle>
            <Leaf className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgCI} <span className="text-sm font-normal text-muted-foreground">gCO2e/MJ</span></div>
          </CardContent>
        </Card>
      </div>

      {/* Reports Table */}
      <Card>
        <CardHeader>
          <CardTitle>CI Reports</CardTitle>
          <CardDescription>
            {reports?.length || 0} report(s) created
          </CardDescription>
        </CardHeader>
        <CardContent>
          {reports && reports.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Report ID</TableHead>
                  <TableHead>Feedstock</TableHead>
                  <TableHead>Methodology</TableHead>
                  <TableHead className="text-center">CI Value</TableHead>
                  <TableHead className="text-center">Rating</TableHead>
                  <TableHead className="text-center">GHG Savings</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium font-mono text-sm">{report.report_id}</div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(report.reporting_period_start).toLocaleDateString()} - {new Date(report.reporting_period_end).toLocaleDateString()}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{report.feedstock?.name || "Unknown"}</div>
                        <div className="text-sm text-muted-foreground">
                          {report.feedstock?.feedstock_id || ""}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{getMethodologyLabel(report.methodology)}</Badge>
                    </TableCell>
                    <TableCell className="text-center font-mono">
                      {report.total_ci_value?.toFixed(1) || "-"}
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={`font-bold ${getCIRatingColor(report.ci_rating)}`}>
                        {report.ci_rating || "-"}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      {report.ghg_savings_percentage !== null ? (
                        <span className={report.ghg_savings_percentage >= 50 ? "text-green-600" : "text-orange-600"}>
                          {report.ghg_savings_percentage.toFixed(1)}%
                        </span>
                      ) : "-"}
                    </TableCell>
                    <TableCell>{getStatusBadge(report.status)}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/supplier/ci-reports/${report.id}`}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </Link>
                          </DropdownMenuItem>
                          {report.status === "draft" && (
                            <>
                              <DropdownMenuItem asChild>
                                <Link href={`/supplier/ci-reports/${report.id}/edit`}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </>
                          )}
                          {report.status === "verified" && (
                            <DropdownMenuItem>
                              <Download className="mr-2 h-4 w-4" />
                              Download Certificate
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <Leaf className="h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-medium">No CI Reports yet</h3>
              <p className="mt-1 text-sm text-muted-foreground text-center max-w-sm">
                Create your first Carbon Intensity report to track and certify the
                emissions associated with your feedstock production.
              </p>
              <Button asChild className="mt-6">
                <Link href="/supplier/ci-reports/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Your First CI Report
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
