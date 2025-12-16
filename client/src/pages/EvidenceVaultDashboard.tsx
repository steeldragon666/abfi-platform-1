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
import { trpc } from "@/lib/trpc";
import {
  Shield,
  FileCheck,
  Link2,
  Clock,
  CheckCircle2,
  Hash,
  Database,
  GitBranch,
  Upload,
  Eye,
  RefreshCw,
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
  variant?: "default" | "success" | "warning" | "info" | "pending";
  description?: string;
}) {
  const variantStyles = {
    default: "bg-white",
    success: "bg-emerald-50 border-emerald-200",
    warning: "bg-amber-50 border-amber-200",
    info: "bg-blue-50 border-blue-200",
    pending: "bg-orange-50 border-orange-200",
  };

  const iconStyles = {
    default: "text-slate-600",
    success: "text-emerald-600",
    warning: "text-amber-600",
    info: "text-blue-600",
    pending: "text-orange-600",
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

// Status badge component
function StatusBadge({ status }: { status: string }) {
  const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    pending: { label: "Pending", variant: "secondary" },
    batched: { label: "Batched", variant: "outline" },
    anchored: { label: "Anchored", variant: "default" },
    confirmed: { label: "Confirmed", variant: "default" },
  };

  const config = statusConfig[status] || { label: status, variant: "secondary" };

  return (
    <Badge variant={config.variant} className={cn(
      status === "anchored" && "bg-emerald-500 hover:bg-emerald-600",
      status === "pending" && "bg-amber-100 text-amber-800 hover:bg-amber-200",
      status === "batched" && "bg-blue-100 text-blue-800 hover:bg-blue-200"
    )}>
      {config.label}
    </Badge>
  );
}

// Hash display with copy
function HashDisplay({ hash, label }: { hash: string; label?: string }) {
  const copyToClipboard = useCallback(() => {
    navigator.clipboard.writeText(hash);
    toast.success("Hash copied to clipboard");
  }, [hash]);

  const truncated = hash.length > 16 ? `${hash.slice(0, 8)}...${hash.slice(-8)}` : hash;

  return (
    <div className="flex items-center gap-2">
      {label && <span className="text-sm text-muted-foreground">{label}:</span>}
      <code className="text-xs bg-slate-100 px-2 py-1 rounded font-mono">
        {truncated}
      </code>
      <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={copyToClipboard}>
        <Copy className="h-3 w-3" />
      </Button>
    </div>
  );
}

// Merkle Proof Viewer Dialog
function MerkleProofViewer({ manifestId }: { manifestId: number }) {
  const { data: proof, isLoading } = trpc.evidenceVault.getMerkleProof.useQuery(
    { manifestId },
    { enabled: false }
  );
  const [open, setOpen] = useState(false);

  const { refetch } = trpc.evidenceVault.getMerkleProof.useQuery(
    { manifestId },
    { enabled: open }
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Eye className="h-4 w-4 mr-1" />
          Proof
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitBranch className="h-5 w-5" />
            Merkle Proof Details
          </DialogTitle>
          <DialogDescription>
            Cryptographic proof of inclusion in the blockchain anchor
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : proof ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground">Chain</Label>
                <p className="font-medium">{proof.chainName} (ID: {proof.chainId})</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Status</Label>
                <p className="font-medium">
                  {proof.verified ? (
                    <span className="text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 className="h-4 w-4" /> Verified
                    </span>
                  ) : (
                    <span className="text-amber-600 flex items-center gap-1">
                      <Clock className="h-4 w-4" /> Pending
                    </span>
                  )}
                </p>
              </div>
            </div>

            <div>
              <Label className="text-xs text-muted-foreground">Merkle Root</Label>
              <code className="block text-xs bg-slate-100 p-2 rounded font-mono break-all mt-1">
                {proof.merkleRoot}
              </code>
            </div>

            <div>
              <Label className="text-xs text-muted-foreground">Leaf Hash</Label>
              <code className="block text-xs bg-slate-100 p-2 rounded font-mono break-all mt-1">
                {proof.leafHash}
              </code>
            </div>

            <div>
              <Label className="text-xs text-muted-foreground">Leaf Index</Label>
              <p className="font-mono">{proof.leafIndex}</p>
            </div>

            {proof.txHash && (
              <div>
                <Label className="text-xs text-muted-foreground">Transaction Hash</Label>
                <div className="flex items-center gap-2 mt-1">
                  <code className="text-xs bg-slate-100 p-2 rounded font-mono break-all flex-1">
                    {proof.txHash}
                  </code>
                  <a
                    href={`https://etherscan.io/tx/${proof.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-700"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              </div>
            )}

            {proof.blockNumber && (
              <div>
                <Label className="text-xs text-muted-foreground">Block Number</Label>
                <p className="font-mono">{proof.blockNumber}</p>
              </div>
            )}

            <div>
              <Label className="text-xs text-muted-foreground">Proof Path</Label>
              <div className="bg-slate-50 p-3 rounded mt-1 max-h-48 overflow-y-auto">
                {proof.proofPath && Array.isArray(proof.proofPath) ? (
                  <div className="space-y-2">
                    {proof.proofPath.map((step: { hash: string; position: string }, idx: number) => (
                      <div key={idx} className="flex items-center gap-2 text-xs">
                        <span className="text-muted-foreground">{idx + 1}.</span>
                        <code className="font-mono bg-white px-2 py-1 rounded break-all flex-1">
                          {step.hash}
                        </code>
                        <Badge variant="outline" className="text-xs">
                          {step.position}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No proof path available</p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <AlertCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No Merkle proof available yet</p>
            <p className="text-sm">This manifest has not been anchored to blockchain</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// Create Manifest Dialog
function CreateManifestDialog({ onSuccess }: { onSuccess: () => void }) {
  const [open, setOpen] = useState(false);
  const [fileName, setFileName] = useState("");
  const [fileSize, setFileSize] = useState("");
  const [mimeType, setMimeType] = useState("application/pdf");
  const [docHash, setDocHash] = useState("");
  const [classification, setClassification] = useState<"public" | "internal" | "confidential" | "restricted">("internal");

  const createMutation = trpc.evidenceVault.createManifest.useMutation({
    onSuccess: () => {
      toast.success("Manifest created successfully");
      setOpen(false);
      onSuccess();
      // Reset form
      setFileName("");
      setFileSize("");
      setDocHash("");
    },
    onError: (error) => {
      toast.error(`Failed to create manifest: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!docHash || docHash.length !== 64) {
      toast.error("Document hash must be a 64-character SHA-256 hex string");
      return;
    }
    createMutation.mutate({
      docHashSha256: docHash,
      fileName,
      fileSize: parseInt(fileSize, 10),
      mimeType,
      classification,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="btn-gold">
          <Upload className="h-4 w-4 mr-2" />
          Create Manifest
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Evidence Manifest</DialogTitle>
          <DialogDescription>
            Register a new document hash in the evidence vault
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="docHash">Document SHA-256 Hash *</Label>
            <Input
              id="docHash"
              value={docHash}
              onChange={(e) => setDocHash(e.target.value)}
              placeholder="64-character hex hash"
              className="font-mono text-sm"
              required
            />
          </div>

          <div>
            <Label htmlFor="fileName">File Name *</Label>
            <Input
              id="fileName"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              placeholder="document.pdf"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="fileSize">File Size (bytes) *</Label>
              <Input
                id="fileSize"
                type="number"
                value={fileSize}
                onChange={(e) => setFileSize(e.target.value)}
                placeholder="1024"
                required
              />
            </div>
            <div>
              <Label htmlFor="mimeType">MIME Type</Label>
              <Select value={mimeType} onValueChange={setMimeType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="application/pdf">PDF</SelectItem>
                  <SelectItem value="image/jpeg">JPEG Image</SelectItem>
                  <SelectItem value="image/png">PNG Image</SelectItem>
                  <SelectItem value="application/json">JSON</SelectItem>
                  <SelectItem value="text/csv">CSV</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="classification">Classification</Label>
            <Select value={classification} onValueChange={(v) => setClassification(v as typeof classification)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public">Public</SelectItem>
                <SelectItem value="internal">Internal</SelectItem>
                <SelectItem value="confidential">Confidential</SelectItem>
                <SelectItem value="restricted">Restricted</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Creating..." : "Create Manifest"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function EvidenceVaultDashboard() {
  const { user, isAuthenticated, loading } = useAuth();
  const [selectedManifests, setSelectedManifests] = useState<number[]>([]);

  // Fetch stats
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = trpc.evidenceVault.getAnchorStats.useQuery();

  // Fetch pending manifests
  const { data: pendingManifests, isLoading: pendingLoading, refetch: refetchPending } = trpc.evidenceVault.listPending.useQuery(
    { limit: 100 }
  );

  // Batch anchor mutation
  const batchAnchorMutation = trpc.evidenceVault.createBatchAnchor.useMutation({
    onSuccess: (data) => {
      toast.success(`Batch anchor created with ${data.leafCount} manifests`);
      setSelectedManifests([]);
      refetchPending();
      refetchStats();
    },
    onError: (error) => {
      toast.error(`Failed to create batch: ${error.message}`);
    },
  });

  const handleRefresh = useCallback(() => {
    refetchStats();
    refetchPending();
    toast.success("Data refreshed");
  }, [refetchStats, refetchPending]);

  const handleSelectManifest = useCallback((id: number, checked: boolean) => {
    setSelectedManifests(prev =>
      checked ? [...prev, id] : prev.filter(m => m !== id)
    );
  }, []);

  const handleSelectAll = useCallback((checked: boolean) => {
    if (checked && pendingManifests) {
      setSelectedManifests(pendingManifests.map(m => m.id));
    } else {
      setSelectedManifests([]);
    }
  }, [pendingManifests]);

  const handleBatchAnchor = useCallback(() => {
    if (selectedManifests.length === 0) {
      toast.error("Select at least one manifest to anchor");
      return;
    }

    const now = new Date();
    const periodStart = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 24 hours ago

    batchAnchorMutation.mutate({
      manifestIds: selectedManifests,
      chainId: 1,
      chainName: "ethereum",
      contractAddress: "0x0000000000000000000000000000000000000000",
      batchPeriodStart: periodStart,
      batchPeriodEnd: now,
    });
  }, [selectedManifests, batchAnchorMutation]);

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
    return <Redirect to="/" />;
  }

  return (
    <DashboardLayout>
      <PageWrapper className="max-w-7xl">
        {/* Header */}
        <FadeInUp className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-1 flex items-center gap-3">
                <Shield className="h-8 w-8 text-amber-600" />
                Evidence Vault
              </h1>
              <p className="text-muted-foreground">
                Blockchain-anchored document integrity verification
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={handleRefresh}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <CreateManifestDialog onSuccess={() => { refetchPending(); refetchStats(); }} />
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
                title="Total Manifests"
                value={stats?.totalManifests || 0}
                icon={Database}
                description="All registered documents"
              />
              <StatsCard
                title="Pending Anchoring"
                value={stats?.pendingManifests || 0}
                icon={Clock}
                variant="pending"
                description="Ready for blockchain"
              />
              <StatsCard
                title="Batched"
                value={stats?.batchedManifests || 0}
                icon={GitBranch}
                variant="info"
                description="In Merkle tree"
              />
              <StatsCard
                title="Anchored"
                value={stats?.anchoredManifests || 0}
                icon={CheckCircle2}
                variant="success"
                description="On-chain verified"
              />
            </>
          )}
        </div>

        {/* Anchor Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Link2 className="h-5 w-5 text-blue-600" />
                Chain Anchors
              </CardTitle>
              <CardDescription>Blockchain transaction batches</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-slate-50 rounded-lg">
                  <p className="text-3xl font-bold font-mono">{stats?.totalAnchors || 0}</p>
                  <p className="text-sm text-muted-foreground">Total Anchors</p>
                </div>
                <div className="text-center p-4 bg-emerald-50 rounded-lg">
                  <p className="text-3xl font-bold font-mono text-emerald-700">{stats?.confirmedAnchors || 0}</p>
                  <p className="text-sm text-muted-foreground">Confirmed</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Hash className="h-5 w-5 text-purple-600" />
                Hash Algorithm
              </CardTitle>
              <CardDescription>Cryptographic standards used</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <span className="text-sm text-muted-foreground">Document Hash</span>
                  <Badge variant="outline">SHA-256</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <span className="text-sm text-muted-foreground">Merkle Tree</span>
                  <Badge variant="outline">Keccak-256</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pending Manifests Table */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileCheck className="h-5 w-5 text-amber-600" />
                  Pending Manifests
                </CardTitle>
                <CardDescription>Documents awaiting blockchain anchoring</CardDescription>
              </div>
              {selectedManifests.length > 0 && (
                <Button
                  onClick={handleBatchAnchor}
                  disabled={batchAnchorMutation.isPending}
                  className="btn-gold"
                >
                  {batchAnchorMutation.isPending ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Creating Batch...
                    </>
                  ) : (
                    <>
                      <Link2 className="h-4 w-4 mr-2" />
                      Anchor {selectedManifests.length} Selected
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {pendingLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : pendingManifests && pendingManifests.length > 0 ? (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <input
                          type="checkbox"
                          checked={selectedManifests.length === pendingManifests.length}
                          onChange={(e) => handleSelectAll(e.target.checked)}
                          className="rounded border-gray-300"
                        />
                      </TableHead>
                      <TableHead>ID</TableHead>
                      <TableHead>Document Hash</TableHead>
                      <TableHead>Manifest URI</TableHead>
                      <TableHead>Classification</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingManifests.map((manifest) => (
                      <TableRow key={manifest.id}>
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={selectedManifests.includes(manifest.id)}
                            onChange={(e) => handleSelectManifest(manifest.id, e.target.checked)}
                            className="rounded border-gray-300"
                          />
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          #{manifest.id}
                        </TableCell>
                        <TableCell>
                          <HashDisplay hash={manifest.docHashSha256} />
                        </TableCell>
                        <TableCell>
                          <code className="text-xs bg-slate-100 px-2 py-1 rounded">
                            {manifest.manifestUri?.slice(0, 30)}...
                          </code>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {manifest.classification}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={manifest.anchorStatus} />
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {manifest.createdAt ? new Date(manifest.createdAt).toLocaleDateString() : '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          <MerkleProofViewer manifestId={manifest.id} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <FileCheck className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No pending manifests</p>
                <p className="text-sm">Create a new manifest to get started</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="mt-8 bg-gradient-to-br from-slate-50 to-white">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="h-5 w-5 text-amber-600" />
              How Evidence Vault Works
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-3">
                  <Hash className="h-6 w-6 text-blue-600" />
                </div>
                <h4 className="font-semibold mb-2">1. Hash Documents</h4>
                <p className="text-sm text-muted-foreground">
                  Documents are hashed using SHA-256, creating a unique fingerprint without storing the actual content.
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-3">
                  <GitBranch className="h-6 w-6 text-purple-600" />
                </div>
                <h4 className="font-semibold mb-2">2. Merkle Batching</h4>
                <p className="text-sm text-muted-foreground">
                  Multiple hashes are combined into a Merkle tree, generating a single root hash for efficient verification.
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-3">
                  <Link2 className="h-6 w-6 text-emerald-600" />
                </div>
                <h4 className="font-semibold mb-2">3. Blockchain Anchor</h4>
                <p className="text-sm text-muted-foreground">
                  The Merkle root is anchored to Ethereum, providing immutable proof of document existence at a point in time.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </PageWrapper>
    </DashboardLayout>
  );
}
