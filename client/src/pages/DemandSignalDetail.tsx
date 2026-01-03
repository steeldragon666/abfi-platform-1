/**
 * Demand Signal Detail - Nextgen Design
 *
 * Features:
 * - Comprehensive demand signal view
 * - Response submission dialog for suppliers
 * - Quality requirements display
 * - Pricing and delivery specifications
 * - Typography components for consistent styling
 */

import { useState } from "react";
import { H1, H2, H3, H4, Body, MetricValue, DataLabel } from "@/components/Typography";
import { useRoute, useLocation } from "wouter";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { PageLayout, PageContainer } from "@/components/layout";
import {
  ArrowLeft,
  MapPin,
  Calendar,
  TrendingUp,
  Package,
  Send,
  CheckCircle2,
  Building2,
  Clock,
  Eye,
  Zap,
  Beaker,
  Truck,
  DollarSign,
  Leaf,
  AlertCircle,
} from "lucide-react";

// Mock signal for demonstration when API returns empty
const MOCK_SIGNAL = {
  id: 1,
  signalNumber: "DS-2025-0001",
  title: "Wheat Straw for Bioenergy Plant - Hunter Valley",
  description:
    "Large-scale bioenergy facility seeking consistent supply of wheat straw for year-round operations. Our facility is currently under construction with commissioning expected Q3 2025. We are seeking long-term offtake agreements with reliable suppliers who can demonstrate consistent quality and volume capabilities.",
  feedstockType: "Wheat Straw",
  feedstockCategory: "agricultural_residue",
  annualVolume: 75000,
  volumeFlexibility: 15,
  deliveryFrequency: "monthly",
  minMoistureContent: 8,
  maxMoistureContent: 15,
  minEnergyContent: 14,
  maxAshContent: 8,
  maxChlorineContent: 500,
  otherQualitySpecs:
    "No foreign material contamination. Bales must be stored under cover. Certification for sustainable harvesting practices preferred.",
  deliveryLocation: "Muswellbrook",
  deliveryState: "NSW",
  maxTransportDistance: 250,
  deliveryMethod: "delivered",
  indicativePriceMin: 85,
  indicativePriceMax: 110,
  pricingMechanism: "indexed",
  supplyStartDate: "2025-07-01",
  supplyEndDate: "2030-06-30",
  contractTerm: 5,
  responseDeadline: "2025-03-15",
  sustainabilityRequirements:
    "ISCC certification preferred. Carbon intensity documentation required. Suppliers must demonstrate sustainable farming practices and provide chain of custody documentation.",
  status: "published",
  responseCount: 8,
  viewCount: 156,
  buyerName: "Hunter Energy Partners",
  buyerLogo: null,
  createdAt: "2025-01-15",
};

const CATEGORY_COLORS: Record<
  string,
  { bg: string; text: string; label: string }
> = {
  agricultural_residue: {
    bg: "bg-green-100",
    text: "text-green-800",
    label: "Agricultural Residue",
  },
  forestry_residue: {
    bg: "bg-amber-100",
    text: "text-amber-800",
    label: "Forestry Residue",
  },
  energy_crop: {
    bg: "bg-blue-100",
    text: "text-blue-800",
    label: "Energy Crop",
  },
  organic_waste: {
    bg: "bg-purple-100",
    text: "text-purple-800",
    label: "Organic Waste",
  },
  algae_aquatic: {
    bg: "bg-cyan-100",
    text: "text-cyan-800",
    label: "Algae/Aquatic",
  },
  mixed: { bg: "bg-gray-100", text: "text-gray-800", label: "Mixed" },
};

export default function DemandSignalDetail() {
  const [, params] = useRoute("/demand-signals/:id");
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const signalId = parseInt(params?.id || "0");

  const [showResponseDialog, setShowResponseDialog] = useState(false);
  const [responseForm, setResponseForm] = useState({
    proposedVolume: "",
    proposedPrice: "",
    proposedDeliveryMethod: "",
    proposedStartDate: "",
    proposedContractTerm: "",
    coverLetter: "",
  });

  const { data, isLoading } = trpc.demandSignals.getById.useQuery({
    id: signalId,
  });

  // Use mock data if API returns empty
  const signal = data?.signal || MOCK_SIGNAL;
  const isBuyer = data?.isBuyer || false;
  const showingMockData = !data?.signal;

  const submitResponseMutation = trpc.demandSignals.submitResponse.useMutation({
    onSuccess: () => {
      setShowResponseDialog(false);
      setResponseForm({
        proposedVolume: "",
        proposedPrice: "",
        proposedDeliveryMethod: "",
        proposedStartDate: "",
        proposedContractTerm: "",
        coverLetter: "",
      });
    },
  });

  const handleSubmitResponse = () => {
    submitResponseMutation.mutate({
      demandSignalId: signalId,
      proposedVolume: parseInt(responseForm.proposedVolume),
      proposedPrice: parseInt(responseForm.proposedPrice),
      proposedDeliveryMethod: responseForm.proposedDeliveryMethod || undefined,
      proposedStartDate: new Date(responseForm.proposedStartDate),
      proposedContractTerm: responseForm.proposedContractTerm
        ? parseInt(responseForm.proposedContractTerm)
        : undefined,
      coverLetter: responseForm.coverLetter || undefined,
    });
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-AU", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  if (isLoading) {
    return (
      <PageLayout>
        <PageContainer size="lg" padding="lg">
          <Skeleton className="h-8 w-32 mb-6" />
          <Skeleton className="h-64 mb-4" />
          <Skeleton className="h-48 mb-4" />
          <Skeleton className="h-48" />
        </PageContainer>
      </PageLayout>
    );
  }

  const category =
    CATEGORY_COLORS[signal.feedstockCategory] || CATEGORY_COLORS.mixed;
  const isExpired = new Date() > new Date(signal.responseDeadline);
  const daysUntilDeadline = Math.ceil(
    (new Date(signal.responseDeadline).getTime() - Date.now()) /
      (1000 * 60 * 60 * 24)
  );

  // Calculate volume coverage progress (mock data)
  const responseCoverage = Math.min(95, (signal.responseCount || 0) * 12);

  return (
    <PageLayout>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-purple-900 via-indigo-900 to-slate-900 text-black">
        <PageContainer size="lg" padding="md" className="py-8">
          <Button
            variant="ghost"
            onClick={() => setLocation("/demand-signals")}
            className="mb-4 text-black/80 hover:text-black hover:bg-white/10"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Demand Signals
          </Button>

          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            <div className="flex-1">
              {showingMockData && (
                <Badge className="mb-3 bg-white/20 text-black border-white/30">
                  Demo Data
                </Badge>
              )}
              <div className="flex items-center gap-3 mb-3">
                <Badge className={`${category.bg} ${category.text} border-0`}>
                  {category.label}
                </Badge>
                <Badge variant="outline" className="text-black border-white/30">
                  {signal.feedstockType}
                </Badge>
                <Badge
                  variant={
                    signal.status === "published" ? "default" : "secondary"
                  }
                  className="bg-[#D4AF37] text-black border-0"
                >
                  {signal.status}
                </Badge>
              </div>
              <h1 className="text-3xl md:text-4xl font-display font-bold mb-3">
                {signal.title}
              </h1>
              <div className="flex items-center gap-4 text-black/70 text-sm">
                <span className="flex items-center gap-1">
                  <Building2 className="h-4 w-4" />
                  {(signal as any).buyerName || "Verified Buyer"}
                </span>
                <span>•</span>
                <span>{signal.signalNumber}</span>
              </div>
            </div>

            <div className="lg:text-right">
              <div className="text-4xl md:text-5xl font-bold font-mono">
                {signal.annualVolume?.toLocaleString()}
              </div>
              <div className="text-black/70">tonnes/year</div>
              {signal.volumeFlexibility && (
                <div className="text-sm text-black/60 mt-1">
                  ±{signal.volumeFlexibility}% flexibility
                </div>
              )}
            </div>
          </div>
        </PageContainer>
      </section>

      {/* Main Content */}
      <PageContainer size="lg" padding="md">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            {signal.description && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-[#D4AF37]" />
                    Overview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 leading-relaxed">
                    {signal.description}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Volume Requirements */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-[#D4AF37]" />
                  Volume Requirements
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div>
                    <div className="text-sm text-gray-600 mb-1">
                      Annual Volume
                    </div>
                    <div className="text-xl font-bold font-mono">
                      {signal.annualVolume?.toLocaleString()} t
                    </div>
                  </div>
                  {signal.volumeFlexibility && (
                    <div>
                      <div className="text-sm text-gray-600 mb-1">
                        Flexibility
                      </div>
                      <div className="text-xl font-bold">
                        ±{signal.volumeFlexibility}%
                      </div>
                    </div>
                  )}
                  <div>
                    <div className="text-sm text-gray-600 mb-1">
                      Delivery Frequency
                    </div>
                    <div className="text-xl font-bold capitalize">
                      {signal.deliveryFrequency?.replace("_", " ")}
                    </div>
                  </div>
                  {signal.contractTerm && (
                    <div>
                      <div className="text-sm text-gray-600 mb-1">
                        Contract Term
                      </div>
                      <div className="text-xl font-bold">
                        {signal.contractTerm} years
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Quality Specifications */}
            {(signal.minMoistureContent ||
              signal.maxMoistureContent ||
              signal.minEnergyContent ||
              signal.maxAshContent ||
              signal.maxChlorineContent ||
              signal.otherQualitySpecs) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Beaker className="h-5 w-5 text-[#D4AF37]" />
                    Quality Specifications
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-6">
                    {signal.minMoistureContent && (
                      <div>
                        <div className="text-sm text-gray-600 mb-1">
                          Min Moisture
                        </div>
                        <div className="font-semibold">
                          {signal.minMoistureContent}%
                        </div>
                      </div>
                    )}
                    {signal.maxMoistureContent && (
                      <div>
                        <div className="text-sm text-gray-600 mb-1">
                          Max Moisture
                        </div>
                        <div className="font-semibold">
                          {signal.maxMoistureContent}%
                        </div>
                      </div>
                    )}
                    {signal.minEnergyContent && (
                      <div>
                        <div className="text-sm text-gray-600 mb-1">
                          Min Energy Content
                        </div>
                        <div className="font-semibold">
                          {signal.minEnergyContent} MJ/kg
                        </div>
                      </div>
                    )}
                    {signal.maxAshContent && (
                      <div>
                        <div className="text-sm text-gray-600 mb-1">
                          Max Ash
                        </div>
                        <div className="font-semibold">
                          {signal.maxAshContent}%
                        </div>
                      </div>
                    )}
                    {signal.maxChlorineContent && (
                      <div>
                        <div className="text-sm text-gray-600 mb-1">
                          Max Chlorine
                        </div>
                        <div className="font-semibold">
                          {signal.maxChlorineContent} ppm
                        </div>
                      </div>
                    )}
                  </div>
                  {signal.otherQualitySpecs && (
                    <div className="pt-4 border-t">
                      <div className="text-sm text-gray-600 mb-2">
                        Additional Requirements
                      </div>
                      <p className="text-sm">{signal.otherQualitySpecs}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Delivery Requirements */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5 text-[#D4AF37]" />
                  Delivery Requirements
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                  <div>
                    <div className="text-sm text-gray-600 mb-1">
                      Delivery Location
                    </div>
                    <div className="font-semibold flex items-center gap-1">
                      <MapPin className="h-4 w-4 text-gray-600" />
                      {signal.deliveryLocation}
                      {signal.deliveryState && `, ${signal.deliveryState}`}
                    </div>
                  </div>
                  {signal.maxTransportDistance && (
                    <div>
                      <div className="text-sm text-gray-600 mb-1">
                        Max Transport Distance
                      </div>
                      <div className="font-semibold">
                        {signal.maxTransportDistance} km
                      </div>
                    </div>
                  )}
                  <div>
                    <div className="text-sm text-gray-600 mb-1">
                      Delivery Method
                    </div>
                    <div className="font-semibold capitalize">
                      {signal.deliveryMethod?.replace("_", " ")}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Pricing */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-[#D4AF37]" />
                  Pricing
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-6">
                  {signal.indicativePriceMin && signal.indicativePriceMax && (
                    <div>
                      <div className="text-sm text-gray-600 mb-1">
                        Indicative Price Range
                      </div>
                      <div className="text-2xl font-bold font-mono text-[#D4AF37]">
                        ${signal.indicativePriceMin} - $
                        {signal.indicativePriceMax}
                      </div>
                      <div className="text-sm text-gray-600">
                        AUD per tonne
                      </div>
                    </div>
                  )}
                  <div>
                    <div className="text-sm text-gray-600 mb-1">
                      Pricing Mechanism
                    </div>
                    <div className="font-semibold capitalize">
                      {signal.pricingMechanism}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      {signal.pricingMechanism === "indexed" &&
                        "Price adjusts with market indices"}
                      {signal.pricingMechanism === "fixed" &&
                        "Price locked for contract term"}
                      {signal.pricingMechanism === "negotiable" &&
                        "Open to discussion"}
                      {signal.pricingMechanism === "spot" &&
                        "Spot market rates apply"}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Sustainability */}
            {signal.sustainabilityRequirements && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Leaf className="h-5 w-5 text-[#D4AF37]" />
                    Sustainability Requirements
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed">
                    {signal.sustainabilityRequirements}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Action Card */}
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="pt-6">
                {isExpired ? (
                  <div className="text-center">
                    <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
                    <h3 className="font-semibold mb-2">
                      Response Deadline Passed
                    </h3>
                    <p className="text-sm text-gray-600">
                      This demand signal is no longer accepting responses.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm text-gray-600">
                        Response Deadline
                      </span>
                      <Badge
                        variant={
                          daysUntilDeadline <= 7 ? "destructive" : "outline"
                        }
                      >
                        {daysUntilDeadline} days left
                      </Badge>
                    </div>
                    <div className="text-lg font-semibold mb-4">
                      {formatDate(signal.responseDeadline)}
                    </div>

                    {!isBuyer && user && (
                      <Dialog
                        open={showResponseDialog}
                        onOpenChange={setShowResponseDialog}
                      >
                        <DialogTrigger asChild>
                          <Button className="w-full" size="lg">
                            <Send className="h-4 w-4 mr-2" />
                            Submit Response
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Submit Your Response</DialogTitle>
                            <DialogDescription>
                              Provide your proposal for "{signal.title}"
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor="proposedVolume">
                                  Proposed Volume (t/year) *
                                </Label>
                                <Input
                                  id="proposedVolume"
                                  type="number"
                                  value={responseForm.proposedVolume}
                                  onChange={e =>
                                    setResponseForm(prev => ({
                                      ...prev,
                                      proposedVolume: e.target.value,
                                    }))
                                  }
                                  placeholder="e.g., 25000"
                                  className="mt-1.5"
                                  required
                                />
                              </div>
                              <div>
                                <Label htmlFor="proposedPrice">
                                  Proposed Price ($/t) *
                                </Label>
                                <Input
                                  id="proposedPrice"
                                  type="number"
                                  value={responseForm.proposedPrice}
                                  onChange={e =>
                                    setResponseForm(prev => ({
                                      ...prev,
                                      proposedPrice: e.target.value,
                                    }))
                                  }
                                  placeholder="e.g., 95"
                                  className="mt-1.5"
                                  required
                                />
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor="proposedStartDate">
                                  Earliest Start Date *
                                </Label>
                                <Input
                                  id="proposedStartDate"
                                  type="date"
                                  value={responseForm.proposedStartDate}
                                  onChange={e =>
                                    setResponseForm(prev => ({
                                      ...prev,
                                      proposedStartDate: e.target.value,
                                    }))
                                  }
                                  className="mt-1.5"
                                  required
                                />
                              </div>
                              <div>
                                <Label htmlFor="proposedContractTerm">
                                  Contract Term (years)
                                </Label>
                                <Input
                                  id="proposedContractTerm"
                                  type="number"
                                  value={responseForm.proposedContractTerm}
                                  onChange={e =>
                                    setResponseForm(prev => ({
                                      ...prev,
                                      proposedContractTerm: e.target.value,
                                    }))
                                  }
                                  placeholder="e.g., 5"
                                  className="mt-1.5"
                                />
                              </div>
                            </div>
                            <div>
                              <Label htmlFor="proposedDeliveryMethod">
                                Delivery Method
                              </Label>
                              <Input
                                id="proposedDeliveryMethod"
                                value={responseForm.proposedDeliveryMethod}
                                onChange={e =>
                                  setResponseForm(prev => ({
                                    ...prev,
                                    proposedDeliveryMethod: e.target.value,
                                  }))
                                }
                                placeholder="e.g., Delivered to site, Ex farm"
                                className="mt-1.5"
                              />
                            </div>
                            <div>
                              <Label htmlFor="coverLetter">
                                Cover Letter / Additional Info
                              </Label>
                              <Textarea
                                id="coverLetter"
                                value={responseForm.coverLetter}
                                onChange={e =>
                                  setResponseForm(prev => ({
                                    ...prev,
                                    coverLetter: e.target.value,
                                  }))
                                }
                                placeholder="Introduce your operation, experience, and why you're a good fit for this requirement..."
                                rows={5}
                                className="mt-1.5"
                              />
                            </div>
                            <Button
                              onClick={handleSubmitResponse}
                              disabled={
                                submitResponseMutation.isPending ||
                                !responseForm.proposedVolume ||
                                !responseForm.proposedPrice ||
                                !responseForm.proposedStartDate
                              }
                              className="w-full"
                              size="lg"
                            >
                              {submitResponseMutation.isPending
                                ? "Submitting..."
                                : "Submit Response"}
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}

                    {!user && (
                      <Button
                        className="w-full"
                        size="lg"
                        onClick={() => setLocation("/login")}
                      >
                        Sign In to Respond
                      </Button>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            {/* Timeline Card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Timeline
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-sm text-gray-600">
                    Supply Start
                  </div>
                  <div className="font-semibold">
                    {formatDate(signal.supplyStartDate)}
                  </div>
                </div>
                {signal.supplyEndDate && (
                  <div>
                    <div className="text-sm text-gray-600">
                      Supply End
                    </div>
                    <div className="font-semibold">
                      {formatDate(signal.supplyEndDate)}
                    </div>
                  </div>
                )}
                <div>
                  <div className="text-sm text-gray-600">
                    Response Deadline
                  </div>
                  <div className="font-semibold text-red-600">
                    {formatDate(signal.responseDeadline)}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Stats Card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Activity</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-sm text-gray-600">
                    <Zap className="h-4 w-4" />
                    Responses
                  </span>
                  <span className="font-semibold">
                    {signal.responseCount || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-sm text-gray-600">
                    <Eye className="h-4 w-4" />
                    Views
                  </span>
                  <span className="font-semibold">{signal.viewCount || 0}</span>
                </div>
                <div className="pt-3 border-t">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">
                      Volume Coverage
                    </span>
                    <span className="font-medium">{responseCoverage}%</span>
                  </div>
                  <Progress value={responseCoverage} className="h-2" />
                  <p className="text-xs text-gray-600 mt-2">
                    Estimated coverage based on {signal.responseCount || 0}{" "}
                    responses
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Buyer Info */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Buyer
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-[#D4AF37]/10 flex items-center justify-center">
                    <Building2 className="h-6 w-6 text-[#D4AF37]" />
                  </div>
                  <div>
                    <div className="font-semibold">
                      {(signal as any).buyerName || "Verified Buyer"}
                    </div>
                    <div className="text-sm text-gray-600">
                      ABFI Verified
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </PageContainer>
    </PageLayout>
  );
}
