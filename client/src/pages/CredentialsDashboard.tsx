import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import {
  BadgeCheck,
  Key,
  FileCheck,
  Shield,
  User,
  Building2,
  Server,
  Plus,
  Eye,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Copy,
  ExternalLink,
} from "lucide-react";
import { Redirect } from "wouter";
import { cn } from "@/lib/utils";
import {
  PageWrapper,
  FadeInUp,
} from "@/components/ui/motion";
import DashboardLayout from "@/components/DashboardLayout";
import { useState, useCallback } from "react";
import { toast } from "sonner";

// Stats card component
function StatsCard({
  title,
  value,
  icon: Icon,
  variant = "default",
  description,
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  variant?: "default" | "success" | "warning" | "info";
  description?: string;
}) {
  const variantStyles = {
    default: "bg-white",
    success: "bg-emerald-50 border-emerald-200",
    warning: "bg-amber-50 border-amber-200",
    info: "bg-blue-50 border-blue-200",
  };

  const iconStyles = {
    default: "text-slate-600",
    success: "text-emerald-600",
    warning: "text-amber-600",
    info: "text-blue-600",
  };

  return (
    <Card className={cn("border", variantStyles[variant])}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground font-medium">{title}</p>
            <p className="text-3xl font-bold mt-1 font-mono">{value}</p>
            {description && (
              <p className="text-xs text-muted-foreground mt-1">{description}</p>
            )}
          </div>
          <div
            className={cn(
              "p-2 rounded-lg bg-slate-100",
              variant !== "default" && "bg-white/50"
            )}
          >
            <Icon className={cn("h-5 w-5", iconStyles[variant])} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Status badge for credentials
function CredentialStatusBadge({ status }: { status: string }) {
  const statusConfig: Record<string, { label: string; className: string; icon: React.ElementType }> = {
    active: { label: "Active", className: "bg-emerald-100 text-emerald-800", icon: CheckCircle2 },
    revoked: { label: "Revoked", className: "bg-red-100 text-red-800", icon: XCircle },
    expired: { label: "Expired", className: "bg-slate-100 text-slate-800", icon: Clock },
    suspended: { label: "Suspended", className: "bg-amber-100 text-amber-800", icon: AlertCircle },
  };

  const config = statusConfig[status] || { label: status, className: "bg-slate-100 text-slate-800", icon: AlertCircle };
  const Icon = config.icon;

  return (
    <Badge className={cn("font-medium flex items-center gap-1", config.className)}>
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
}

// Controller type icon
function ControllerIcon({ type }: { type: string }) {
  const icons: Record<string, React.ElementType> = {
    organization: Building2,
    user: User,
    system: Server,
  };
  const Icon = icons[type] || User;
  return <Icon className="h-4 w-4" />;
}

// DID display with copy
function DIDDisplay({ did }: { did: string }) {
  const copyToClipboard = useCallback(() => {
    navigator.clipboard.writeText(did);
    toast.success("DID copied to clipboard");
  }, [did]);

  const truncated = did.length > 40 ? `${did.slice(0, 20)}...${did.slice(-15)}` : did;

  return (
    <div className="flex items-center gap-2">
      <code className="text-xs bg-slate-100 px-2 py-1 rounded font-mono">
        {truncated}
      </code>
      <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={copyToClipboard}>
        <Copy className="h-3 w-3" />
      </Button>
    </div>
  );
}

// Create DID Dialog
function CreateDIDDialog({ onSuccess }: { onSuccess: () => void }) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    controllerType: "organization" as "organization" | "user" | "system",
    controllerId: "",
    method: "did:web" as "did:web" | "did:ethr" | "did:key",
  });

  const createMutation = trpc.vc.createDid.useMutation({
    onSuccess: (data) => {
      toast.success(`DID created: ${data.did.slice(0, 30)}...`);
      setOpen(false);
      onSuccess();
    },
    onError: (error) => {
      toast.error(`Failed to create DID: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      controllerType: formData.controllerType,
      controllerId: parseInt(formData.controllerId, 10),
      method: formData.method,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="btn-gold">
          <Plus className="h-4 w-4 mr-2" />
          Create DID
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Decentralized Identifier</DialogTitle>
          <DialogDescription>
            Register a new DID for an entity in the system
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Controller Type</Label>
            <Select
              value={formData.controllerType}
              onValueChange={(v) => setFormData({ ...formData, controllerType: v as typeof formData.controllerType })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="organization">Organization</SelectItem>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Controller ID</Label>
            <Input
              type="number"
              value={formData.controllerId}
              onChange={(e) => setFormData({ ...formData, controllerId: e.target.value })}
              placeholder="Entity ID in the system"
              required
            />
          </div>

          <div>
            <Label>DID Method</Label>
            <Select
              value={formData.method}
              onValueChange={(v) => setFormData({ ...formData, method: v as typeof formData.method })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="did:web">did:web (Web-based)</SelectItem>
                <SelectItem value="did:ethr">did:ethr (Ethereum)</SelectItem>
                <SelectItem value="did:key">did:key (Key-based)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Creating..." : "Create DID"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Issue Credential Dialog
function IssueCredentialDialog({ onSuccess }: { onSuccess: () => void }) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    credentialType: "GQTierCredential" as const,
    issuerDid: "",
    subjectDid: "",
    claimsSummary: "{}",
  });

  const issueMutation = trpc.vc.issueCredential.useMutation({
    onSuccess: (data) => {
      toast.success(`Credential issued: ${data.credentialId}`);
      setOpen(false);
      onSuccess();
    },
    onError: (error) => {
      toast.error(`Failed to issue credential: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let claims = {};
    try {
      claims = JSON.parse(formData.claimsSummary);
    } catch {
      toast.error("Invalid JSON in claims summary");
      return;
    }
    issueMutation.mutate({
      credentialType: formData.credentialType,
      issuerDid: formData.issuerDid,
      subjectDid: formData.subjectDid,
      claimsSummary: claims,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <FileCheck className="h-4 w-4 mr-2" />
          Issue Credential
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Issue Verifiable Credential</DialogTitle>
          <DialogDescription>
            Create a new W3C Verifiable Credential
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Credential Type</Label>
            <Select
              value={formData.credentialType}
              onValueChange={(v) => setFormData({ ...formData, credentialType: v as typeof formData.credentialType })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="GQTierCredential">GQ Tier Credential</SelectItem>
                <SelectItem value="SupplyAgreementCredential">Supply Agreement</SelectItem>
                <SelectItem value="EmissionsCertificate">Emissions Certificate</SelectItem>
                <SelectItem value="SustainabilityCertificate">Sustainability Certificate</SelectItem>
                <SelectItem value="DeliveryConfirmation">Delivery Confirmation</SelectItem>
                <SelectItem value="QualityAttestation">Quality Attestation</SelectItem>
                <SelectItem value="AuditReport">Audit Report</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Issuer DID</Label>
            <Input
              value={formData.issuerDid}
              onChange={(e) => setFormData({ ...formData, issuerDid: e.target.value })}
              placeholder="did:web:abfi.io:..."
              required
            />
          </div>

          <div>
            <Label>Subject DID</Label>
            <Input
              value={formData.subjectDid}
              onChange={(e) => setFormData({ ...formData, subjectDid: e.target.value })}
              placeholder="did:web:abfi.io:..."
              required
            />
          </div>

          <div>
            <Label>Claims (JSON)</Label>
            <Input
              value={formData.claimsSummary}
              onChange={(e) => setFormData({ ...formData, claimsSummary: e.target.value })}
              placeholder='{"tier": "GQ3", "score": 85}'
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={issueMutation.isPending}>
              {issueMutation.isPending ? "Issuing..." : "Issue Credential"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Verify Credential Dialog
function VerifyCredentialDialog() {
  const [open, setOpen] = useState(false);
  const [credentialId, setCredentialId] = useState("");
  const [verificationResult, setVerificationResult] = useState<any>(null);

  const { refetch } = trpc.vc.verifyCredential.useQuery(
    { credentialId },
    { enabled: false }
  );

  const handleVerify = async () => {
    if (!credentialId) {
      toast.error("Please enter a credential ID");
      return;
    }
    const result = await refetch();
    if (result.data) {
      setVerificationResult(result.data);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Shield className="h-4 w-4 mr-2" />
          Verify Credential
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Verify Credential</DialogTitle>
          <DialogDescription>
            Check the validity of a verifiable credential
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Credential ID</Label>
            <Input
              value={credentialId}
              onChange={(e) => setCredentialId(e.target.value)}
              placeholder="urn:uuid:..."
            />
          </div>

          <Button onClick={handleVerify} className="w-full">
            Verify
          </Button>

          {verificationResult && (
            <div className={cn(
              "p-4 rounded-lg",
              verificationResult.valid ? "bg-emerald-50 border border-emerald-200" : "bg-red-50 border border-red-200"
            )}>
              <div className="flex items-center gap-2 mb-2">
                {verificationResult.valid ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600" />
                )}
                <span className="font-medium">
                  {verificationResult.valid ? "Valid Credential" : "Invalid Credential"}
                </span>
              </div>
              {verificationResult.errors && verificationResult.errors.length > 0 && (
                <ul className="text-sm text-red-700 list-disc list-inside">
                  {verificationResult.errors.map((err: string, idx: number) => (
                    <li key={idx}>{err}</li>
                  ))}
                </ul>
              )}
              {verificationResult.valid && (
                <div className="text-sm text-emerald-700 space-y-1">
                  <p>Type: {verificationResult.credentialType}</p>
                  <p>Issuer: {verificationResult.issuerDid?.slice(0, 30)}...</p>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function CredentialsDashboard() {
  const { user, isAuthenticated, loading } = useAuth();

  // Fetch stats
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = trpc.vc.getVCStats.useQuery();

  // Fetch credentials
  const { data: credentialsData, isLoading: credentialsLoading, refetch: refetchCredentials } = trpc.vc.listCredentials.useQuery({
    limit: 50,
  });

  const handleRefresh = useCallback(() => {
    refetchStats();
    refetchCredentials();
    toast.success("Data refreshed");
  }, [refetchStats, refetchCredentials]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-10 w-64 mb-2" />
          <Skeleton className="h-5 w-48 mb-8" />
          <div className="grid md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-50/30 flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center">
              <BadgeCheck className="h-8 w-8 text-purple-600" />
            </div>
            <CardTitle className="text-2xl">Verifiable Credentials</CardTitle>
            <CardDescription>
              W3C Verifiable Credentials and Decentralized Identifiers for your biofuel supply chain
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              Sign in to manage your verifiable credentials, issue certifications, and verify supply chain claims.
            </p>
            <Button asChild className="w-full">
              <a href="/api/login">Sign In to Continue</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <PageWrapper className="max-w-7xl">
        {/* Header */}
        <FadeInUp className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-1 flex items-center gap-3">
                <BadgeCheck className="h-8 w-8 text-purple-600" />
                Verifiable Credentials
              </h1>
              <p className="text-muted-foreground">
                W3C Verifiable Credentials and Decentralized Identifiers
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={handleRefresh}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <CreateDIDDialog onSuccess={() => refetchStats()} />
            </div>
          </div>
        </FadeInUp>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statsLoading ? (
            <>
              {[1, 2, 3, 4].map(i => (
                <Skeleton key={i} className="h-24 rounded-xl" />
              ))}
            </>
          ) : (
            <>
              <StatsCard
                title="Total DIDs"
                value={stats?.totalDids || 0}
                icon={Key}
                description="Registered identifiers"
              />
              <StatsCard
                title="Active DIDs"
                value={stats?.activeDids || 0}
                icon={CheckCircle2}
                variant="success"
                description="Currently active"
              />
              <StatsCard
                title="Total Credentials"
                value={stats?.totalCredentials || 0}
                icon={FileCheck}
                description="Issued credentials"
              />
              <StatsCard
                title="Active Credentials"
                value={stats?.activeCredentials || 0}
                icon={BadgeCheck}
                variant="info"
                description="Valid and active"
              />
            </>
          )}
        </div>

        {/* Main Content */}
        <Tabs defaultValue="credentials" className="space-y-6">
          <TabsList>
            <TabsTrigger value="credentials">Credentials</TabsTrigger>
            <TabsTrigger value="dids">DID Registry</TabsTrigger>
            <TabsTrigger value="verify">Verification</TabsTrigger>
          </TabsList>

          <TabsContent value="credentials">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <FileCheck className="h-5 w-5" />
                      Issued Credentials
                    </CardTitle>
                    <CardDescription>
                      W3C Verifiable Credentials in the system
                    </CardDescription>
                  </div>
                  <IssueCredentialDialog onSuccess={() => refetchCredentials()} />
                </div>
              </CardHeader>
              <CardContent>
                {credentialsLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : credentialsData?.credentials && credentialsData.credentials.length > 0 ? (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Credential ID</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Issuer</TableHead>
                          <TableHead>Subject</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Issued</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {credentialsData.credentials.map((cred: any) => (
                          <TableRow key={cred.id}>
                            <TableCell className="font-mono text-xs">
                              {cred.credentialId.slice(0, 25)}...
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{cred.credentialType}</Badge>
                            </TableCell>
                            <TableCell>
                              <DIDDisplay did={cred.issuerDid} />
                            </TableCell>
                            <TableCell>
                              <DIDDisplay did={cred.subjectDid} />
                            </TableCell>
                            <TableCell>
                              <CredentialStatusBadge status={cred.status} />
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {cred.issuanceDate ? new Date(cred.issuanceDate).toLocaleDateString() : '-'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <FileCheck className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No credentials issued yet</p>
                    <p className="text-sm">Issue a new credential to get started</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="dids">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  DID Registry
                </CardTitle>
                <CardDescription>
                  Registered Decentralized Identifiers
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-muted-foreground">
                  <Key className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>DID listing coming soon</p>
                  <p className="text-sm">Use the "Create DID" button to register new identifiers</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="verify">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Credential Verification
                </CardTitle>
                <CardDescription>
                  Verify the authenticity and validity of credentials
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="max-w-md mx-auto">
                  <VerifyCredentialDialog />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Credential Types Info */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-lg">Supported Credential Types</CardTitle>
            <CardDescription>W3C Verifiable Credential types in the ABFI ecosystem</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              {[
                { type: "GQTierCredential", desc: "Grower Qualification tier attestation" },
                { type: "SupplyAgreementCredential", desc: "Signed supply contract reference" },
                { type: "EmissionsCertificate", desc: "Carbon emissions calculation certification" },
                { type: "SustainabilityCertificate", desc: "Sustainability compliance attestation" },
                { type: "DeliveryConfirmation", desc: "Consignment delivery verification" },
                { type: "QualityAttestation", desc: "Feedstock quality test results" },
              ].map(({ type, desc }) => (
                <div key={type} className="p-4 bg-slate-50 rounded-lg border">
                  <h4 className="font-medium text-sm mb-1">{type}</h4>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </PageWrapper>
    </DashboardLayout>
  );
}
