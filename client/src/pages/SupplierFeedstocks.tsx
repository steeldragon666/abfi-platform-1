/**
 * Supplier Feedstocks - Nextgen Design
 *
 * Features:
 * - Header with icon container pattern
 * - Card-based list layout
 * - Certificate generation dialogs
 * - Typography components for consistent styling
 */

import { useAuth } from "@/_core/hooks/useAuth";
import { H1, Body } from "@/components/Typography";
import { Button } from "@/components/ui/Button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  Package,
  Plus,
  Edit,
  Eye,
  AlertCircle,
  Award,
  FileText,
  Download,
  ArrowLeft,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { toast } from "sonner";
import { Link } from "wouter";
import { formatDate } from "@/const";

export default function SupplierFeedstocks() {
  const { user, loading: authLoading } = useAuth();
  const [showCertDialog, setShowCertDialog] = useState(false);
  const [showBadpDialog, setShowBadpDialog] = useState(false);
  const [selectedFeedstock, setSelectedFeedstock] = useState<any>(null);
  const [badpClientName, setBadpClientName] = useState("");

  const { data: feedstocks, isLoading } = trpc.feedstocks.list.useQuery(
    undefined,
    { enabled: !!user }
  );

  const generateCertificate =
    trpc.certificates.generateABFICertificate.useMutation({
      onSuccess: data => {
        toast.success("Certificate generated successfully!");
        setShowCertDialog(false);
        window.open(data.pdfUrl, "_blank");
      },
      onError: error => {
        toast.error(error.message || "Failed to generate certificate");
      },
    });

  const generateBADP = trpc.certificates.generateBADP.useMutation({
    onSuccess: data => {
      toast.success("BADP generated successfully!");
      setShowBadpDialog(false);
      setBadpClientName("");
      window.open(data.pdfUrl, "_blank");
    },
    onError: error => {
      toast.error(error.message || "Failed to generate BADP");
    },
  });

  const handleGenerateCertificate = (feedstock: any) => {
    if (!feedstock.abfiScore) {
      toast.error(
        "Feedstock must have ABFI rating before generating certificate"
      );
      return;
    }
    setSelectedFeedstock(feedstock);
    setShowCertDialog(true);
  };

  const handleGenerateBADP = (feedstock: any) => {
    setSelectedFeedstock(feedstock);
    setShowBadpDialog(true);
  };

  const confirmGenerateCertificate = () => {
    if (selectedFeedstock) {
      generateCertificate.mutate({ feedstockId: selectedFeedstock.id });
    }
  };

  const confirmGenerateBADP = () => {
    if (selectedFeedstock && badpClientName.trim()) {
      generateBADP.mutate({
        feedstockId: selectedFeedstock.id,
        preparedFor: badpClientName.trim(),
      });
    } else {
      toast.error("Please enter client/investor name");
    }
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Skeleton className="h-8 w-64 mx-auto mb-4" />
          <Skeleton className="h-4 w-48 mx-auto" />
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "draft":
        return "bg-gray-100 text-gray-800";
      case "suspended":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getVerificationColor = (level: string) => {
    switch (level) {
      case "verified":
        return "bg-blue-100 text-blue-800";
      case "self_reported":
        return "bg-gray-100 text-gray-800";
      case "third_party":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#D4AF37]/10">
              <Package className="h-6 w-6 text-[#D4AF37]" />
            </div>
            <div>
              <H1 className="text-2xl">My Feedstocks</H1>
              <Body className="text-gray-600">Manage your feedstock listings</Body>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/feedstock/create">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add New Feedstock
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="ghost">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : feedstocks && feedstocks.length > 0 ? (
          <div className="space-y-4">
            {feedstocks.map((feedstock: any) => (
              <Card
                key={feedstock.id}
                className="hover:shadow-md transition-shadow"
              >
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2">
                        <Package className="h-5 w-5" />
                        {feedstock.abfiId || `ABFI-${feedstock.id}`}
                      </CardTitle>
                      <CardDescription className="mt-2">
                        {feedstock.category} • {feedstock.type} •{" "}
                        {feedstock.state}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Badge className={getStatusColor(feedstock.status)}>
                        {feedstock.status.toUpperCase()}
                      </Badge>
                      <Badge
                        className={getVerificationColor(
                          feedstock.verificationLevel
                        )}
                      >
                        {feedstock.verificationLevel
                          ?.replace("_", " ")
                          .toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="text-gray-600">ABFI Score</div>
                      <div className="text-2xl font-bold text-[#D4AF37]">
                        {feedstock.abfiScore?.toFixed(1) || "N/A"}
                      </div>
                      <div className="text-xs text-gray-600">
                        Grade: {feedstock.abfiGrade || "Pending"}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-600">
                        Annual Capacity
                      </div>
                      <div className="font-medium">
                        {feedstock.annualCapacity?.toLocaleString() || "N/A"}{" "}
                        tonnes
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-600">
                        Available Volume
                      </div>
                      <div className="font-medium">
                        {feedstock.availableVolume?.toLocaleString() || "N/A"}{" "}
                        tonnes
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-600">Price</div>
                      <div className="font-medium">
                        ${feedstock.pricePerTonne?.toFixed(2) || "N/A"}/tonne
                      </div>
                    </div>
                  </div>

                  {feedstock.status === "pending" && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-start gap-2">
                      <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                      <div className="text-sm">
                        <div className="font-medium text-yellow-900">
                          Pending Verification
                        </div>
                        <div className="text-yellow-700">
                          Your feedstock is under review by ABFI administrators
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2">
                    <Link href={`/feedstock/${feedstock.id}`}>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                    </Link>
                    <Link href={`/feedstock/edit/${feedstock.id}`}>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                    </Link>
                    {feedstock.abfiScore && feedstock.status === "active" && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleGenerateCertificate(feedstock)}
                          className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                        >
                          <Award className="h-4 w-4 mr-2" />
                          Generate Certificate
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleGenerateBADP(feedstock)}
                          className="border-blue-200 text-blue-700 hover:bg-blue-50"
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          Generate BADP
                        </Button>
                      </>
                    )}
                    {feedstock.status === "active" && (
                      <Button variant="outline" size="sm">
                        Suspend
                      </Button>
                    )}
                    {feedstock.status === "suspended" && (
                      <Button variant="outline" size="sm">
                        Reactivate
                      </Button>
                    )}
                  </div>

                  <div className="text-xs text-gray-600">
                    Created {formatDate(feedstock.createdAt)} • Last updated{" "}
                    {formatDate(feedstock.updatedAt)}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <Package className="h-12 w-12 text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                No feedstocks listed yet
              </h3>
              <p className="text-gray-600 mb-4">
                Start by adding your first feedstock listing
              </p>
              <Link href="/feedstock/create">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add New Feedstock
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Certificate Generation Dialog */}
        <Dialog open={showCertDialog} onOpenChange={setShowCertDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Generate ABFI Rating Certificate</DialogTitle>
              <DialogDescription>
                Generate a professional PDF certificate for feedstock{" "}
                {selectedFeedstock?.abfiId}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <Award className="h-8 w-8 text-[#D4AF37]" />
                  <div>
                    <div className="font-semibold text-emerald-900">
                      ABFI Rating Certificate
                    </div>
                    <div className="text-sm text-emerald-700">
                      Professional certification document
                    </div>
                  </div>
                </div>
                <div className="text-sm text-emerald-800 space-y-1">
                  <div>
                    • ABFI Score: {selectedFeedstock?.abfiScore?.toFixed(1)}/100
                  </div>
                  <div>• 4-Pillar Assessment Breakdown</div>
                  <div>• Supplier & Feedstock Details</div>
                  <div>• Valid for 12 months</div>
                </div>
              </div>
              <div className="text-sm text-gray-600">
                <strong>Revenue:</strong> $3,000 - $15,000 per certificate
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowCertDialog(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={confirmGenerateCertificate}
                disabled={generateCertificate.isPending}
                className="bg-[#D4AF37] hover:bg-emerald-700"
              >
                {generateCertificate.isPending ? (
                  <>
                    <Download className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Generate Certificate
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* BADP Generation Dialog */}
        <Dialog open={showBadpDialog} onOpenChange={setShowBadpDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Generate Biological Asset Data Pack</DialogTitle>
              <DialogDescription>
                Generate comprehensive documentation for institutional investors
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <FileText className="h-8 w-8 text-blue-600" />
                  <div>
                    <div className="font-semibold text-blue-900">
                      BADP Documentation
                    </div>
                    <div className="text-sm text-blue-700">
                      Capital markets ready
                    </div>
                  </div>
                </div>
                <div className="text-sm text-blue-800 space-y-1">
                  <div>• Executive Summary</div>
                  <div>• Verified Yield Curves (P50/P75/P90)</div>
                  <div>• Risk Assessment & Stress Scenarios</div>
                  <div>• ABFI & Bankability Ratings</div>
                </div>
              </div>

              <div>
                <Label htmlFor="clientName">
                  Prepared For (Client/Investor Name)
                </Label>
                <Input
                  id="clientName"
                  placeholder="e.g., Green Capital Partners"
                  value={badpClientName}
                  onChange={e => setBadpClientName(e.target.value)}
                  className="mt-2"
                />
              </div>

              <div className="text-sm text-gray-600">
                <strong>Revenue:</strong> $75,000 - $300,000 per asset pack
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowBadpDialog(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={confirmGenerateBADP}
                disabled={generateBADP.isPending || !badpClientName.trim()}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {generateBADP.isPending ? (
                  <>
                    <Download className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Generate BADP
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
