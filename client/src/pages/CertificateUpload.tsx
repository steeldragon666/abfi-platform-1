import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, FileText, Leaf, Upload } from "lucide-react";
import { useState } from "react";
import { Link, Redirect, useLocation, useSearch } from "wouter";
import { toast } from "sonner";

const CERTIFICATE_TYPES = [
  {
    value: "ISCC",
    label: "ISCC (International Sustainability & Carbon Certification)",
  },
  { value: "RSB", label: "RSB (Roundtable on Sustainable Biomaterials)" },
  { value: "RED_II", label: "RED II (Renewable Energy Directive)" },
  { value: "ABFI", label: "ABFI Certification" },
  { value: "ISO_14001", label: "ISO 14001 (Environmental Management)" },
  { value: "other", label: "Other" },
];

export default function CertificateUpload() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const searchParams = new URLSearchParams(useSearch());
  const feedstockId = searchParams.get("feedstockId");

  const { data: profile } = trpc.auth.getProfile.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const { data: feedstock } = trpc.feedstocks.getById.useQuery(
    { id: parseInt(feedstockId || "0") },
    { enabled: !!feedstockId }
  );

  const [certificateType, setCertificateType] = useState("");
  const [issuer, setIssuer] = useState("");
  const [certificateNumber, setCertificateNumber] = useState("");
  const [issueDate, setIssueDate] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const uploadMutation = trpc.certificates.create.useMutation({
    onSuccess: () => {
      toast.success("Certificate uploaded successfully!");
      setLocation(`/feedstock/${feedstockId}`);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to upload certificate");
      setUploading(false);
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    if (!profile?.supplier) {
      toast.error("Supplier profile required");
      return;
    }

    if (!feedstock) {
      toast.error("Feedstock not found");
      return;
    }

    if (!file) {
      toast.error("Please select a file to upload");
      return;
    }

    setUploading(true);

    try {
      // Upload file to S3
      const formData = new FormData();
      formData.append("file", file);

      // In a real implementation, you would upload to S3 here
      // For now, we'll simulate with a placeholder URL
      const fileUrl = `https://storage.example.com/certificates/${file.name}`;

      // Create certificate record
      uploadMutation.mutate({
        feedstockId: feedstock.id,
        type: certificateType as any,
        certificateNumber: certificateNumber || undefined,
        issuedDate: issueDate ? new Date(issueDate) : undefined,
        expiryDate: expiryDate ? new Date(expiryDate) : undefined,
        documentUrl: fileUrl,
        notes: `Issuer: ${issuer}`,
      });
    } catch (error) {
      toast.error("Failed to upload file");
      setUploading(false);
    }
  };

  const canSubmit =
    certificateType && issuer && issueDate && expiryDate && file && !uploading;

  if (!isAuthenticated) {
    return <Redirect to="/dashboard" />;
  }

  if (!profile?.supplier) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Supplier Profile Required</CardTitle>
            <CardDescription>
              You need to be a registered supplier to upload certificates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/supplier/register">
              <Button className="w-full">Register as Supplier</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!feedstock) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Feedstock Not Found</CardTitle>
            <CardDescription>
              The feedstock you're trying to add a certificate to could not be
              found
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard">
              <Button className="w-full">Back to Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/">
            <div className="flex items-center gap-2 cursor-pointer">
              <Leaf className="h-8 w-8 text-primary" />
              <span className="text-2xl font-bold text-primary">ABFI</span>
            </div>
          </Link>
          <Link href="/dashboard">
            <Button variant="ghost">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold text-primary">
              Upload Certificate
            </h1>
          </div>
          <p className="text-gray-600">
            Add certification documents to improve your ABFI rating
          </p>
        </div>

        {/* Feedstock Summary */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Feedstock</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium text-lg">{feedstock.type}</p>
                <p className="text-sm text-gray-600">{feedstock.abfiId}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Current ABFI Score</p>
                <p className="text-2xl font-bold text-primary">
                  {feedstock.abfiScore || "N/A"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Upload Form */}
        <Card>
          <CardHeader>
            <CardTitle>Certificate Details</CardTitle>
            <CardDescription>
              Provide information about the certification document you're
              uploading
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="certificateType">Certificate Type *</Label>
                <Select
                  value={certificateType}
                  onValueChange={setCertificateType}
                >
                  <SelectTrigger id="certificateType">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {CERTIFICATE_TYPES.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="issuer">Issuing Organization *</Label>
                <Input
                  id="issuer"
                  placeholder="e.g., ISCC System GmbH"
                  value={issuer}
                  onChange={e => setIssuer(e.target.value)}
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="certificateNumber">Certificate Number</Label>
                <Input
                  id="certificateNumber"
                  placeholder="e.g., ISCC-AU-123456"
                  value={certificateNumber}
                  onChange={e => setCertificateNumber(e.target.value)}
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="issueDate">Issue Date *</Label>
                <Input
                  id="issueDate"
                  type="date"
                  value={issueDate}
                  onChange={e => setIssueDate(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="expiryDate">Expiry Date *</Label>
                <Input
                  id="expiryDate"
                  type="date"
                  value={expiryDate}
                  onChange={e => setExpiryDate(e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="file">Certificate Document *</Label>
              <div className="mt-2">
                <div className="flex items-center justify-center w-full">
                  <label
                    htmlFor="file"
                    className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
                  >
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-10 h-10 mb-3 text-gray-400" />
                      <p className="mb-2 text-sm text-gray-500">
                        {file ? (
                          <span className="font-semibold">{file.name}</span>
                        ) : (
                          <>
                            <span className="font-semibold">
                              Click to upload
                            </span>{" "}
                            or drag and drop
                          </>
                        )}
                      </p>
                      <p className="text-xs text-gray-500">
                        PDF, JPG, PNG (MAX. 10MB)
                      </p>
                    </div>
                    <input
                      id="file"
                      type="file"
                      className="hidden"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={handleFileChange}
                    />
                  </label>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">
                Benefits of Certification
              </h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Improves your sustainability score in the ABFI rating</li>
                <li>• Increases buyer confidence and trust</li>
                <li>• Makes your feedstock more discoverable in searches</li>
                <li>• Demonstrates compliance with industry standards</li>
              </ul>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Link href="/dashboard">
                <Button variant="outline">Cancel</Button>
              </Link>
              <Button onClick={handleSubmit} disabled={!canSubmit}>
                {uploading ? "Uploading..." : "Upload Certificate"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
