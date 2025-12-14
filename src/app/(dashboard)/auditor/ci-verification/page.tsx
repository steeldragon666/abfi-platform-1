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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Leaf,
} from "lucide-react";
import type { CIMethodology, CIReportStatus } from "@/types/database";

export const metadata = {
  title: "CI Verification Queue - Auditor Dashboard",
};

export default async function AuditorCIVerificationPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get pending reports (submitted, not yet in review)
  const { data: pendingReports } = await supabase
    .from("carbon_intensity_reports")
    .select(`
      *,
      feedstock:feedstocks(id, feedstock_id, name, category),
      supplier:suppliers(id, company_name)
    `)
    .eq("status", "submitted")
    .order("submitted_at", { ascending: true });

  // Get reports under review
  const { data: reviewingReports } = await supabase
    .from("carbon_intensity_reports")
    .select(`
      *,
      feedstock:feedstocks(id, feedstock_id, name, category),
      supplier:suppliers(id, company_name),
      assigned_auditor:profiles!carbon_intensity_reports_assigned_auditor_id_fkey(id, full_name)
    `)
    .eq("status", "under_review")
    .order("submitted_at", { ascending: true });

  // Get recently completed (verified/rejected in last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data: completedReports } = await supabase
    .from("carbon_intensity_reports")
    .select(`
      *,
      feedstock:feedstocks(id, feedstock_id, name, category),
      supplier:suppliers(id, company_name),
      verifier:profiles!carbon_intensity_reports_verified_by_fkey(id, full_name)
    `)
    .in("status", ["verified", "rejected"])
    .gte("verified_at", thirtyDaysAgo.toISOString())
    .order("verified_at", { ascending: false })
    .limit(20);

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
            Submitted
          </Badge>
        );
      case "under_review":
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
            <Clock className="mr-1 h-3 w-3" />
            In Review
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

  const formatDate = (date: string | null) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("en-AU", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const getCIRatingColor = (rating: string | null) => {
    if (!rating) return "text-gray-500";
    if (rating.startsWith("A")) return "text-green-600";
    if (rating.startsWith("B")) return "text-blue-600";
    if (rating.startsWith("C")) return "text-yellow-600";
    if (rating === "D") return "text-orange-600";
    return "text-red-600";
  };

  const ReportRow = ({ report, showAssignee = false, showVerifier = false }: {
    report: typeof pendingReports extends (infer T)[] | null ? T : never;
    showAssignee?: boolean;
    showVerifier?: boolean;
  }) => (
    <TableRow>
      <TableCell>
        <div>
          <div className="font-mono text-sm">{report.report_id}</div>
          <div className="text-xs text-muted-foreground">{formatDate(report.submitted_at)}</div>
        </div>
      </TableCell>
      <TableCell>
        <div>
          <div className="font-medium">{report.supplier?.company_name || "-"}</div>
        </div>
      </TableCell>
      <TableCell>
        <div>
          <div className="font-medium">{report.feedstock?.name || "-"}</div>
          <div className="text-xs text-muted-foreground">{report.feedstock?.category}</div>
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
      {showAssignee && (
        <TableCell>
          {(report as { assigned_auditor?: { full_name?: string } }).assigned_auditor?.full_name || "-"}
        </TableCell>
      )}
      {showVerifier && (
        <TableCell>
          {(report as { verifier?: { full_name?: string } }).verifier?.full_name || "-"}
        </TableCell>
      )}
      <TableCell>{getStatusBadge(report.status)}</TableCell>
      <TableCell>
        <Button asChild size="sm" variant="outline">
          <Link href={`/auditor/ci-verification/${report.id}`}>
            <Eye className="mr-1 h-3 w-3" />
            Review
          </Link>
        </Button>
      </TableCell>
    </TableRow>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">CI Verification Queue</h1>
        <p className="text-muted-foreground">
          Review and verify Carbon Intensity reports
        </p>
      </div>

      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending" className="gap-2">
            Pending
            {pendingReports && pendingReports.length > 0 && (
              <Badge variant="secondary" className="ml-1">{pendingReports.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="reviewing" className="gap-2">
            In Review
            {reviewingReports && reviewingReports.length > 0 && (
              <Badge variant="secondary" className="ml-1">{reviewingReports.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="completed">Recent Completed</TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-600" />
                Pending Verification
              </CardTitle>
              <CardDescription>
                Reports submitted and awaiting an auditor to start review
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pendingReports && pendingReports.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Report ID</TableHead>
                      <TableHead>Supplier</TableHead>
                      <TableHead>Feedstock</TableHead>
                      <TableHead>Methodology</TableHead>
                      <TableHead className="text-center">CI Value</TableHead>
                      <TableHead className="text-center">Rating</TableHead>
                      <TableHead className="text-center">GHG Savings</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingReports.map((report) => (
                      <ReportRow key={report.id} report={report} />
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="flex flex-col items-center justify-center py-12">
                  <CheckCircle className="h-12 w-12 text-green-500" />
                  <h3 className="mt-4 text-lg font-medium">Queue is empty</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    No reports pending initial review
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reviewing">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Leaf className="h-5 w-5 text-yellow-600" />
                Under Review
              </CardTitle>
              <CardDescription>
                Reports currently being reviewed by auditors
              </CardDescription>
            </CardHeader>
            <CardContent>
              {reviewingReports && reviewingReports.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Report ID</TableHead>
                      <TableHead>Supplier</TableHead>
                      <TableHead>Feedstock</TableHead>
                      <TableHead>Methodology</TableHead>
                      <TableHead className="text-center">CI Value</TableHead>
                      <TableHead className="text-center">Rating</TableHead>
                      <TableHead className="text-center">GHG Savings</TableHead>
                      <TableHead>Assigned To</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reviewingReports.map((report) => (
                      <ReportRow key={report.id} report={report} showAssignee />
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="flex flex-col items-center justify-center py-12">
                  <Clock className="h-12 w-12 text-muted-foreground/50" />
                  <h3 className="mt-4 text-lg font-medium">No active reviews</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    No reports currently under review
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="completed">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Recently Completed
              </CardTitle>
              <CardDescription>
                Reports verified or rejected in the last 30 days
              </CardDescription>
            </CardHeader>
            <CardContent>
              {completedReports && completedReports.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Report ID</TableHead>
                      <TableHead>Supplier</TableHead>
                      <TableHead>Feedstock</TableHead>
                      <TableHead>Methodology</TableHead>
                      <TableHead className="text-center">CI Value</TableHead>
                      <TableHead className="text-center">Rating</TableHead>
                      <TableHead className="text-center">GHG Savings</TableHead>
                      <TableHead>Verified By</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {completedReports.map((report) => (
                      <ReportRow key={report.id} report={report} showVerifier />
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="flex flex-col items-center justify-center py-12">
                  <Leaf className="h-12 w-12 text-muted-foreground/50" />
                  <h3 className="mt-4 text-lg font-medium">No recent completions</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    No reports completed in the last 30 days
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
