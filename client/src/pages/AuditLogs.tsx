/**
 * Audit Logs - Nextgen Design
 *
 * Features:
 * - Transaction audit trail viewer
 * - Compliance evidence logging
 * - Search and filter capabilities
 * - Typography components for consistent styling
 */

import { useState } from"react";
import { H1, H2, H3, H4, Body, MetricValue, DataLabel } from"@/components/Typography";
import { useAuth } from"@/_core/hooks/useAuth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from"@/components/ui/Card";
import { Badge } from"@/components/ui/badge";
import { Button } from"@/components/ui/Button";
import { Skeleton } from"@/components/ui/skeleton";
import { Input } from"@/components/ui/input";
import { Label } from"@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from"@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from"@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from"@/components/ui/dialog";
import { trpc } from"@/lib/trpc";
import { PageLayout, PageContainer } from"@/components/layout";
import {
  Shield,
  FileSearch,
  User,
  Clock,
  Filter,
  RefreshCw,
  Eye,
  Download,
  Activity,
  Database,
  Users,
  BarChart3,
} from"lucide-react";
import { cn } from"@/lib/utils";

const ACTION_COLORS: Record<string, string> = {
  create:"bg-green-100 text-green-800",
  update:"bg-blue-100 text-blue-800",
  delete:"bg-red-100 text-red-800",
  verify:"bg-purple-100 text-purple-800",
  approve:"bg-emerald-100 text-emerald-800",
  reject:"bg-orange-100 text-orange-800",
  login:"bg-slate-100 text-slate-800",
  export:"bg-cyan-100 text-cyan-800",
};

const ENTITY_TYPES = [
  { value:"", label:"All Entities" },
  { value:"feedstock", label:"Feedstock" },
  { value:"supplier", label:"Supplier" },
  { value:"buyer", label:"Buyer" },
  { value:"certificate", label:"Certificate" },
  { value:"project", label:"Project" },
  { value:"agreement", label:"Agreement" },
  { value:"assessment", label:"Assessment" },
  { value:"evidence", label:"Evidence" },
  { value:"user", label:"User" },
];

export default function AuditLogs() {
  const { user, loading: authLoading } = useAuth();
  const [entityType, setEntityType] = useState<string>("");
  const [entityId, setEntityId] = useState<string>("");
  const [limit, setLimit] = useState<number>(100);
  const [selectedLog, setSelectedLog] = useState<any>(null);

  const { data: auditLogsData, isLoading: logsLoading, refetch } = trpc.audit.getLogs.useQuery(
    {
      entityType: entityType || undefined,
      entityId: entityId ? parseInt(entityId) : undefined,
      limit,
    },
    { enabled: !!user && user.role ==="admin" }
  );
  const logs = auditLogsData?.logs;

  const { data: stats, isLoading: statsLoading } = trpc.audit.getStats.useQuery(
    undefined,
    { enabled: !!user && user.role ==="admin" }
  );

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleString("en-AU", {
      day:"numeric",
      month:"short",
      year:"numeric",
      hour:"2-digit",
      minute:"2-digit",
    });
  };

  const getActionColor = (action: string) => {
    const baseAction = action.split("_")[0].toLowerCase();
    return ACTION_COLORS[baseAction] ||"bg-gray-100 text-gray-800";
  };

  if (authLoading) {
    return (
      <PageLayout>
        <PageContainer>
          <div className="space-y-4 py-8">
            <Skeleton className="h-10 w-64 mb-8" />
            <Skeleton className="h-64" />
          </div>
        </PageContainer>
      </PageLayout>
    );
  }

  if (!user || user.role !=="admin") {
    return (
      <PageLayout>
        <PageContainer>
          <Card className="mt-8">
            <CardContent className="py-12 text-center">
              <Shield className="h-12 w-12 text-gray-600 mx-auto mb-4" />
              <H3 className="text-lg  mb-2">Access Denied</H3>
              <p className="text-gray-600">
                Only administrators can view audit logs.
              </p>
            </CardContent>
          </Card>
        </PageContainer>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      {/* Hero Section */}
      <section className="bg-black text-white py-12 lg:py-16 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-1/4 -right-1/4 w-[600px] h-[600px] rounded-full bg-indigo-500/10 blur-[100px]" />
        </div>

        <PageContainer className="relative z-10" padding="none">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-8">
            <div className="max-w-2xl">
              <div className="flex flex-wrap gap-2 mb-6">
                <Badge
                  variant="outline"
                  className="border-indigo-400/50 text-indigo-300 bg-indigo-500/10"
                >
                  <Shield className="h-3 w-3 mr-1" />
                  Phase 8: Audit & Compliance
                </Badge>
              </div>

              <H1 className="text-4xl lg:text-5xl font-display  mb-4">
                Audit Logs
              </H1>
              <p className="text-xl text-gray-600 leading-relaxed">
                Comprehensive audit trail for all platform operations. Track changes,
                verify compliance, and maintain regulatory defensibility.
              </p>
            </div>
          </div>
        </PageContainer>
      </section>

      <PageContainer>
        {/* Stats Cards */}
        {!statsLoading && stats && (
          <div className="grid md:grid-cols-4 gap-4 -mt-8 mb-8">
            <Card className="bg-white">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-indigo-100">
                    <Activity className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{stats.totalLogs}</div>
                    <div className="text-sm text-gray-600">Total Logs</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-100">
                    <Database className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">
                      {Object.keys(stats.entityCounts).length}
                    </div>
                    <div className="text-sm text-gray-600">Entity Types</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-100">
                    <BarChart3 className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">
                      {Object.keys(stats.actionCounts).length}
                    </div>
                    <div className="text-sm text-gray-600">Action Types</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-100">
                    <Users className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">
                      {Object.keys(stats.userCounts).length}
                    </div>
                    <div className="text-sm text-gray-600">Active Users</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Entity Type</Label>
                <Select value={entityType} onValueChange={setEntityType}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Entities" />
                  </SelectTrigger>
                  <SelectContent>
                    {ENTITY_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value ||"all"}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Entity ID</Label>
                <Input
                  type="number"
                  placeholder="e.g., 123"
                  value={entityId}
                  onChange={(e) => setEntityId(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Limit</Label>
                <Select
                  value={limit.toString()}
                  onValueChange={(v) => setLimit(parseInt(v))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                    <SelectItem value="250">250</SelectItem>
                    <SelectItem value="500">500</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button onClick={() => refetch()} className="w-full">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Logs Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileSearch className="h-5 w-5" />
                Audit Trail
              </CardTitle>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
            <CardDescription>
              {logs?.length || 0} records found
            </CardDescription>
          </CardHeader>
          <CardContent>
            {logsLoading ? (
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-12" />
                ))}
              </div>
            ) : !logs || logs.length === 0 ? (
              <div className="text-center py-12">
                <FileSearch className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                <H3 className="text-lg  mb-2">No Logs Found</H3>
                <p className="text-gray-600">
                  No audit logs match your filter criteria.
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Entity</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead className="text-right">Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log: any) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-mono text-xs">
                        {formatDate(log.createdAt)}
                      </TableCell>
                      <TableCell>
                        <Badge className={cn("text-xs", getActionColor(log.action))}>
                          {log.action}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-gray-600">{log.entityType}</span>
                        <span className="font-mono text-xs ml-1">#{log.entityId}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3 text-gray-600" />
                          <span className="font-mono text-xs">
                            {log.userId ||"System"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-gray-600">
                        {log.ipAddress ||"N/A"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedLog(log)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Audit Log Details</DialogTitle>
                              <DialogDescription>
                                Full details of the audit log entry
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label className="text-gray-600">ID</Label>
                                  <div className="font-mono">{log.id}</div>
                                </div>
                                <div>
                                  <Label className="text-gray-600">Timestamp</Label>
                                  <div>{formatDate(log.createdAt)}</div>
                                </div>
                                <div>
                                  <Label className="text-gray-600">Action</Label>
                                  <div>
                                    <Badge className={getActionColor(log.action)}>
                                      {log.action}
                                    </Badge>
                                  </div>
                                </div>
                                <div>
                                  <Label className="text-gray-600">Entity</Label>
                                  <div>
                                    {log.entityType} #{log.entityId}
                                  </div>
                                </div>
                                <div>
                                  <Label className="text-gray-600">User ID</Label>
                                  <div className="font-mono">{log.userId ||"System"}</div>
                                </div>
                                <div>
                                  <Label className="text-gray-600">IP Address</Label>
                                  <div className="font-mono">{log.ipAddress ||"N/A"}</div>
                                </div>
                              </div>
                              {log.userAgent && (
                                <div>
                                  <Label className="text-gray-600">User Agent</Label>
                                  <div className="text-xs bg-muted p-2 rounded font-mono overflow-x-auto">
                                    {log.userAgent}
                                  </div>
                                </div>
                              )}
                              {log.changes && (
                                <div>
                                  <Label className="text-gray-600">Changes</Label>
                                  <pre className="text-xs bg-muted p-3 rounded overflow-x-auto max-h-64">
                                    {JSON.stringify(log.changes, null, 2)}
                                  </pre>
                                </div>
                              )}
                            </div>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </PageContainer>
    </PageLayout>
  );
}
