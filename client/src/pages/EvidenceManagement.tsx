import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  Upload,
  FileText,
  Shield,
  AlertCircle,
  CheckCircle,
  Clock,
  Search,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

export default function EvidenceManagement() {
  const { user, loading: authLoading } = useAuth();
  const [selectedEvidence, setSelectedEvidence] = useState<number | null>(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  // Only admins and auditors can access
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Skeleton className="h-64 w-full max-w-2xl" />
      </div>
    );
  }

  if (!user || (user.role !== "admin" && user.role !== "auditor")) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="py-12 text-center">
            <Shield className="h-12 w-12 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
            <p className="text-sm text-gray-600">
              Only administrators and auditors can access evidence management.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8 text-[#D4AF37]" />
              <h1 className="text-3xl font-bold">Evidence Management</h1>
            </div>
            <Button onClick={() => setUploadDialogOpen(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Upload Evidence
            </Button>
          </div>
          <p className="text-gray-600">
            Manage evidence chain, verify documents, and ensure data provenance
          </p>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="py-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="search" className="text-xs mb-2">
                  Search
                </Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-600" />
                  <Input
                    id="search"
                    placeholder="Search by filename, issuer..."
                    className="pl-9"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="filterType" className="text-xs mb-2">
                  Evidence Type
                </Label>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="lab_test">Lab Test</SelectItem>
                    <SelectItem value="audit_report">Audit Report</SelectItem>
                    <SelectItem value="registry_cert">
                      Registry Certificate
                    </SelectItem>
                    <SelectItem value="contract">Contract</SelectItem>
                    <SelectItem value="insurance_policy">
                      Insurance Policy
                    </SelectItem>
                    <SelectItem value="financial_statement">
                      Financial Statement
                    </SelectItem>
                    <SelectItem value="land_title">Land Title</SelectItem>
                    <SelectItem value="sustainability_cert">
                      Sustainability Certificate
                    </SelectItem>
                    <SelectItem value="quality_test">Quality Test</SelectItem>
                    <SelectItem value="delivery_record">
                      Delivery Record
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="filterStatus" className="text-xs mb-2">
                  Status
                </Label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="valid">Valid</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                    <SelectItem value="revoked">Revoked</SelectItem>
                    <SelectItem value="superseded">Superseded</SelectItem>
                    <SelectItem value="pending_verification">
                      Pending Verification
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Evidence List */}
        <Card>
          <CardHeader>
            <CardTitle>Evidence Repository</CardTitle>
            <CardDescription>
              All uploaded evidence with cryptographic integrity verification
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {/* Placeholder evidence items */}
              <EvidenceItem
                id={1}
                type="lab_test"
                filename="moisture-analysis-2024-01.pdf"
                issuer="ALS Laboratory Group"
                issuedDate="2024-01-15"
                expiryDate="2025-01-15"
                status="valid"
                verified={true}
                hash="a3f8b2c1..."
                onClick={() => setSelectedEvidence(1)}
              />
              <EvidenceItem
                id={2}
                type="sustainability_cert"
                filename="rsb-certificate-2023.pdf"
                issuer="Roundtable on Sustainable Biomaterials"
                issuedDate="2023-06-01"
                expiryDate="2024-12-31"
                status="expiring_soon"
                verified={true}
                hash="d7e4c9a2..."
                onClick={() => setSelectedEvidence(2)}
              />
              <EvidenceItem
                id={3}
                type="contract"
                filename="supply-agreement-abc-farms.pdf"
                issuer="ABC Farms Pty Ltd"
                issuedDate="2024-02-01"
                expiryDate={null}
                status="pending_verification"
                verified={false}
                hash="b8f1d3e5..."
                onClick={() => setSelectedEvidence(3)}
              />
            </div>

            <div className="mt-6 text-center text-sm text-gray-600">
              <p>Showing 3 of 3 evidence items</p>
            </div>
          </CardContent>
        </Card>

        {/* Upload Dialog */}
        {uploadDialogOpen && (
          <UploadEvidenceDialog onClose={() => setUploadDialogOpen(false)} />
        )}
      </div>
    </div>
  );
}

interface EvidenceItemProps {
  id: number;
  type: string;
  filename: string;
  issuer: string;
  issuedDate: string;
  expiryDate: string | null;
  status: string;
  verified: boolean;
  hash: string;
  onClick: () => void;
}

function EvidenceItem({
  type,
  filename,
  issuer,
  issuedDate,
  expiryDate,
  status,
  verified,
  hash,
  onClick,
}: EvidenceItemProps) {
  const getStatusBadge = () => {
    switch (status) {
      case "valid":
        return (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Valid
          </Badge>
        );
      case "expiring_soon":
        return (
          <Badge className="bg-yellow-100 text-yellow-800">
            <Clock className="h-3 w-3 mr-1" />
            Expiring Soon
          </Badge>
        );
      case "expired":
        return (
          <Badge className="bg-red-100 text-red-800">
            <AlertCircle className="h-3 w-3 mr-1" />
            Expired
          </Badge>
        );
      case "pending_verification":
        return (
          <Badge className="bg-blue-100 text-blue-800">
            <Clock className="h-3 w-3 mr-1" />
            Pending Verification
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTypeLabel = (t: string) => {
    return t
      .split("_")
      .map(word => word ? word.charAt(0).toUpperCase() + word.slice(1) : "")
      .join(" ");
  };

  return (
    <button
      onClick={onClick}
      className="w-full text-left p-4 rounded-lg border hover:bg-muted/50 transition-colors"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <FileText className="h-5 w-5 text-gray-600" />
          <div>
            <div className="font-medium">{filename}</div>
            <div className="text-xs text-gray-600 mt-0.5">
              {getTypeLabel(type)} • Issued by {issuer}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {verified && (
            <Badge
              variant="outline"
              className="bg-blue-50 text-blue-700 border-blue-200"
            >
              <Shield className="h-3 w-3 mr-1" />
              Verified
            </Badge>
          )}
          {getStatusBadge()}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 text-xs">
        <div>
          <div className="text-gray-600">Issued Date</div>
          <div className="font-medium mt-0.5">
            {new Date(issuedDate).toLocaleDateString()}
          </div>
        </div>
        <div>
          <div className="text-gray-600">Expiry Date</div>
          <div className="font-medium mt-0.5">
            {expiryDate
              ? new Date(expiryDate).toLocaleDateString()
              : "No expiry"}
          </div>
        </div>
        <div>
          <div className="text-gray-600">File Hash (SHA-256)</div>
          <div className="font-mono font-medium mt-0.5">{hash}</div>
        </div>
      </div>
    </button>
  );
}

interface UploadEvidenceDialogProps {
  onClose: () => void;
}

function UploadEvidenceDialog({ onClose }: UploadEvidenceDialogProps) {
  const [evidenceType, setEvidenceType] = useState<string>("lab_test");
  const [issuerType, setIssuerType] = useState<string>("lab");

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle>Upload Evidence</CardTitle>
          <CardDescription>
            Upload a new evidence document with cryptographic integrity
            verification
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="file">Evidence File *</Label>
            <Input id="file" type="file" />
            <p className="text-xs text-gray-600">
              File will be automatically hashed (SHA-256) for integrity
              verification
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="evidenceType">Evidence Type *</Label>
              <Select value={evidenceType} onValueChange={setEvidenceType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lab_test">Lab Test</SelectItem>
                  <SelectItem value="audit_report">Audit Report</SelectItem>
                  <SelectItem value="registry_cert">
                    Registry Certificate
                  </SelectItem>
                  <SelectItem value="contract">Contract</SelectItem>
                  <SelectItem value="insurance_policy">
                    Insurance Policy
                  </SelectItem>
                  <SelectItem value="financial_statement">
                    Financial Statement
                  </SelectItem>
                  <SelectItem value="land_title">Land Title</SelectItem>
                  <SelectItem value="sustainability_cert">
                    Sustainability Certificate
                  </SelectItem>
                  <SelectItem value="quality_test">Quality Test</SelectItem>
                  <SelectItem value="delivery_record">
                    Delivery Record
                  </SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="issuerType">Issuer Type *</Label>
              <Select value={issuerType} onValueChange={setIssuerType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lab">Laboratory</SelectItem>
                  <SelectItem value="auditor">Auditor</SelectItem>
                  <SelectItem value="registry">Registry</SelectItem>
                  <SelectItem value="counterparty">Counterparty</SelectItem>
                  <SelectItem value="supplier">Supplier</SelectItem>
                  <SelectItem value="government">Government Agency</SelectItem>
                  <SelectItem value="certification_body">
                    Certification Body
                  </SelectItem>
                  <SelectItem value="self_declared">Self-Declared</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="issuerName">Issuer Name *</Label>
            <Input id="issuerName" placeholder="e.g., ALS Laboratory Group" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="issuerCredentials">
              Issuer Credentials (Optional)
            </Label>
            <Input
              id="issuerCredentials"
              placeholder="e.g., NATA Accreditation #12345"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="issuedDate">Issued Date *</Label>
              <Input id="issuedDate" type="date" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expiryDate">Expiry Date (Optional)</Label>
              <Input id="expiryDate" type="date" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="metadata">Additional Metadata (Optional)</Label>
            <Textarea
              id="metadata"
              placeholder='JSON format: { "testMethod": "ASTM D2974", "sampleId": "S-2024-001" }'
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button>
              <Upload className="h-4 w-4 mr-2" />
              Upload & Hash
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
