import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  Shield,
  PlayCircle,
  Clock,
  CheckCircle,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

export default function MonitoringJobsScheduler() {
  const { user, loading: authLoading } = useAuth();

  const [runningJob, setRunningJob] = useState<string | null>(null);

  // Fetch job status
  const {
    data: jobStatus,
    isLoading,
    refetch,
  } = trpc.monitoringJobs.getJobStatus.useQuery();

  // Mutations for triggering jobs
  const triggerCovenantCheck =
    trpc.monitoringJobs.triggerCovenantCheck.useMutation({
      onSuccess: result => {
        console.log("Covenant Check Complete:", result);
        alert(
          `Covenant Check Complete: Checked ${result.projectsChecked} projects, detected ${result.breachesDetected} breaches`
        );
        setRunningJob(null);
        refetch();
      },
      onError: error => {
        console.error("Job Failed:", error);
        alert(`Job Failed: ${error.message}`);
        setRunningJob(null);
      },
    });

  const triggerSupplyRecalc =
    trpc.monitoringJobs.triggerSupplyRecalc.useMutation({
      onSuccess: result => {
        console.log("Supply Recalculation Complete:", result);
        alert(
          `Supply Recalculation Complete: Processed ${result.projectsProcessed} projects, updated ${result.agreementsUpdated} agreements`
        );
        setRunningJob(null);
        refetch();
      },
      onError: error => {
        console.error("Job Failed:", error);
        alert(`Job Failed: ${error.message}`);
        setRunningJob(null);
      },
    });

  const triggerRenewalAlerts =
    trpc.monitoringJobs.triggerRenewalAlerts.useMutation({
      onSuccess: result => {
        console.log("Renewal Alerts Complete:", result);
        alert(
          `Renewal Alerts Complete: Checked ${result.contractsChecked} contracts, generated ${result.alertsGenerated} alerts`
        );
        setRunningJob(null);
        refetch();
      },
      onError: error => {
        console.error("Job Failed:", error);
        alert(`Job Failed: ${error.message}`);
        setRunningJob(null);
      },
    });

  const triggerAllJobs = trpc.monitoringJobs.triggerAllJobs.useMutation({
    onSuccess: results => {
      console.log("All Jobs Complete:", results);
      alert(
        `All Jobs Complete: Covenant: ${results.covenantCheck.breachesDetected} breaches | Supply: ${results.supplyRecalc.projectsProcessed} projects | Renewals: ${results.renewalAlerts.alertsGenerated} alerts`
      );
      setRunningJob(null);
      refetch();
    },
    onError: error => {
      console.error("Jobs Failed:", error);
      alert(`Jobs Failed: ${error.message}`);
      setRunningJob(null);
    },
  });

  if (authLoading || !user) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Skeleton className="h-64 w-full max-w-2xl" />
        </div>
      </DashboardLayout>
    );
  }

  // Check admin permissions
  if (user.role !== "admin") {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="max-w-md">
            <CardContent className="py-12 text-center">
              <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
              <p className="text-sm text-muted-foreground">
                You don't have permission to access the monitoring jobs scheduler.
              </p>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-8">
          <Skeleton className="h-8 w-64" />
          <div className="grid gap-6">
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const handleTriggerJob = (jobName: string, mutationFn: any) => {
    setRunningJob(jobName);
    mutationFn.mutate();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "running":
        return "bg-blue-100 text-blue-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "failed":
        return "bg-red-100 text-red-800";
      case "pending_setup":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "running":
        return <RefreshCw className="h-5 w-5 text-blue-600 animate-spin" />;
      case "completed":
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case "failed":
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Clock className="h-5 w-5 text-yellow-600" />;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Shield className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold">Monitoring Jobs Scheduler</h1>
          </div>
          <p className="text-muted-foreground">
            Manage and trigger automated monitoring jobs for covenant compliance
            and supply tracking
          </p>
        </div>

        {/* Quick Actions */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Manually trigger monitoring jobs</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={() =>
                  handleTriggerJob("covenant", triggerCovenantCheck)
                }
                disabled={runningJob !== null}
                variant="outline"
              >
                {runningJob === "covenant" ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <PlayCircle className="h-4 w-4 mr-2" />
                )}
                Run Covenant Check
              </Button>
              <Button
                onClick={() => handleTriggerJob("supply", triggerSupplyRecalc)}
                disabled={runningJob !== null}
                variant="outline"
              >
                {runningJob === "supply" ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <PlayCircle className="h-4 w-4 mr-2" />
                )}
                Run Supply Recalc
              </Button>
              <Button
                onClick={() =>
                  handleTriggerJob("renewal", triggerRenewalAlerts)
                }
                disabled={runningJob !== null}
                variant="outline"
              >
                {runningJob === "renewal" ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <PlayCircle className="h-4 w-4 mr-2" />
                )}
                Run Renewal Alerts
              </Button>
              <Button
                onClick={() => handleTriggerJob("all", triggerAllJobs)}
                disabled={runningJob !== null}
                className="bg-primary"
              >
                {runningJob === "all" ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <PlayCircle className="h-4 w-4 mr-2" />
                )}
                Run All Jobs
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Scheduled Jobs Status */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold mb-4">Scheduled Jobs</h2>

          {jobStatus?.scheduledJobs.map((job: any, index: number) => (
            <Card key={index}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl">{job.name}</CardTitle>
                    <CardDescription className="mt-2">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        {job.schedule}
                      </div>
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(job.status)}
                    <Badge className={getStatusColor(job.status)}>
                      {job.status.replace("_", " ")}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">
                      Last Run
                    </p>
                    <p className="text-sm font-medium">
                      {job.lastRun
                        ? new Date(job.lastRun).toLocaleString("en-AU")
                        : "Never"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">
                      Next Run
                    </p>
                    <p className="text-sm font-medium">
                      {job.nextRun
                        ? new Date(job.nextRun).toLocaleString("en-AU")
                        : "Not scheduled"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Job Descriptions */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Job Descriptions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Daily Covenant Check</h4>
              <p className="text-sm text-muted-foreground">
                Checks all active projects for covenant breaches. Monitors Tier
                1 supply coverage against thresholds and records breaches with
                severity levels (info/warning/breach/critical). Generates lender
                notifications for significant breaches.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">
                Weekly Supply Recalculation
              </h4>
              <p className="text-sm text-muted-foreground">
                Recalculates supply positions for all projects. Updates Tier
                1/2/Options/ROFR totals, calculates coverage percentages, and
                triggers bankability reassessment if significant changes are
                detected (more than 5% change in Tier 1 coverage).
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Contract Renewal Alerts</h4>
              <p className="text-sm text-muted-foreground">
                Checks for contracts expiring within 90 days. Generates alerts
                with impact assessment, prioritizes Tier 1 agreements as high
                impact, and prevents duplicate alerts. Severity increases as
                expiry date approaches (warning at 30 days).
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
