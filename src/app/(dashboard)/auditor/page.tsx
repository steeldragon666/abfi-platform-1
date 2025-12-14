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
  Clock,
  CheckCircle,
  XCircle,
  FileText,
  ArrowRight,
  TrendingUp,
  Users,
} from "lucide-react";
import type { CIMethodology } from "@/types/database";

export const metadata = {
  title: "Auditor Dashboard - ABFI",
};

export default async function AuditorDashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile || !["auditor", "admin"].includes(profile.role)) {
    redirect("/");
  }

  // Get pending reports count
  const { count: pendingCount } = await supabase
    .from("carbon_intensity_reports")
    .select("*", { count: "exact", head: true })
    .in("status", ["submitted", "under_review"]);

  // Get reports under review by this auditor
  const { count: myReviewCount } = await supabase
    .from("carbon_intensity_reports")
    .select("*", { count: "exact", head: true })
    .eq("status", "under_review")
    .eq("assigned_auditor_id", user.id);

  // Get completed verifications this month
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { count: completedThisMonth } = await supabase
    .from("carbon_intensity_reports")
    .select("*", { count: "exact", head: true })
    .eq("verified_by", user.id)
    .gte("verified_at", startOfMonth.toISOString());

  // Get recent pending reports
  const { data: pendingReports } = await supabase
    .from("carbon_intensity_reports")
    .select(`
      *,
      feedstock:feedstocks(id, feedstock_id, name, category),
      supplier:suppliers(id, company_name)
    `)
    .in("status", ["submitted", "under_review"])
    .order("submitted_at", { ascending: true })
    .limit(5);

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome back, {profile.full_name?.split(" ")[0] || "Auditor"}
        </h1>
        <p className="text-muted-foreground">
          Here&apos;s an overview of your verification queue
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Queue</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{pendingCount || 0}</div>
            <p className="text-xs text-muted-foreground">Reports awaiting review</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Active Reviews</CardTitle>
            <FileText className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{myReviewCount || 0}</div>
            <p className="text-xs text-muted-foreground">Currently assigned to you</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed This Month</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{completedThisMonth || 0}</div>
            <p className="text-xs text-muted-foreground">Verifications completed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approval Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">Based on recent audits</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Verification Queue</CardTitle>
            <CardDescription>Reports awaiting verification</CardDescription>
          </CardHeader>
          <CardContent>
            {pendingReports && pendingReports.length > 0 ? (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Report</TableHead>
                      <TableHead>Supplier</TableHead>
                      <TableHead>Methodology</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingReports.map((report) => (
                      <TableRow key={report.id}>
                        <TableCell>
                          <Link
                            href={`/auditor/ci-verification/${report.id}`}
                            className="font-mono text-sm hover:underline"
                          >
                            {report.report_id}
                          </Link>
                        </TableCell>
                        <TableCell>{report.supplier?.company_name || "-"}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{getMethodologyLabel(report.methodology)}</Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(report.submitted_at)}
                        </TableCell>
                        <TableCell>
                          {report.status === "under_review" ? (
                            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                              <Clock className="mr-1 h-3 w-3" />
                              In Review
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                              Submitted
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <div className="mt-4">
                  <Button asChild variant="outline" className="w-full">
                    <Link href="/auditor/ci-verification">
                      View All Pending Reports
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <CheckCircle className="h-12 w-12 text-green-500" />
                <h3 className="mt-4 text-lg font-medium">All caught up!</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  No reports pending verification
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common verification tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button asChild className="w-full justify-start" variant="outline">
              <Link href="/auditor/ci-verification">
                <Clock className="mr-2 h-4 w-4" />
                View Verification Queue
              </Link>
            </Button>
            <Button asChild className="w-full justify-start" variant="outline">
              <Link href="/auditor/completed">
                <CheckCircle className="mr-2 h-4 w-4" />
                View Completed Audits
              </Link>
            </Button>
            <Button asChild className="w-full justify-start" variant="outline">
              <Link href="/auditor/analytics">
                <TrendingUp className="mr-2 h-4 w-4" />
                View Analytics
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
