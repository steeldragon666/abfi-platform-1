/**
 * Feedstock Detail - Nextgen Design
 *
 * Features:
 * - Header with icon container pattern
 * - Card-based content layout
 * - Typography components for consistent styling
 * - ABFI Score display with grade breakdown
 */

import { useRoute, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/Button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Loader2,
  MapPin,
  TrendingUp,
  Award,
  FileText,
  Send,
  ArrowLeft,
  Package,
} from "lucide-react";
import { FEEDSTOCK_CATEGORIES } from "@/const";
import { H1, Body } from "@/components/Typography";

const FEEDSTOCK_TYPES: Record<
  string,
  Array<{ value: string; label: string }>
> = {
  oilseed: [
    { value: "canola", label: "Canola" },
    { value: "soybean", label: "Soybean" },
    { value: "sunflower", label: "Sunflower" },
  ],
  UCO: [{ value: "used_cooking_oil", label: "Used Cooking Oil" }],
  tallow: [
    { value: "beef_tallow", label: "Beef Tallow" },
    { value: "mutton_tallow", label: "Mutton Tallow" },
  ],
  lignocellulosic: [
    { value: "wheat_straw", label: "Wheat Straw" },
    { value: "corn_stover", label: "Corn Stover" },
    { value: "sugarcane_bagasse", label: "Sugarcane Bagasse" },
  ],
  waste: [{ value: "municipal_waste", label: "Municipal Waste" }],
  algae: [{ value: "microalgae", label: "Microalgae" }],
  bamboo: [{ value: "bamboo", label: "Bamboo" }],
  other: [{ value: "other", label: "Other" }],
};

const STATES = [
  { value: "NSW", label: "New South Wales" },
  { value: "VIC", label: "Victoria" },
  { value: "QLD", label: "Queensland" },
  { value: "SA", label: "South Australia" },
  { value: "WA", label: "Western Australia" },
  { value: "TAS", label: "Tasmania" },
  { value: "NT", label: "Northern Territory" },
  { value: "ACT", label: "Australian Capital Territory" },
];

export default function FeedstockDetail() {
  const [, params] = useRoute("/feedstock/:id");
  const feedstockId = params?.id ? parseInt(params.id) : 0;

  const {
    data: feedstock,
    isLoading,
    error,
  } = trpc.feedstocks.getById.useQuery({ id: feedstockId });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#D4AF37]" />
      </div>
    );
  }

  if (error || !feedstock) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-lg text-gray-600">Feedstock not found</p>
        <Link href="/browse">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Browse
          </Button>
        </Link>
      </div>
    );
  }

  const getScoreColor = (score: number | null) => {
    if (!score) return "bg-gray-500";
    if (score >= 80) return "bg-green-600";
    if (score >= 60) return "bg-yellow-600";
    return "bg-red-600";
  };

  const getScoreGrade = (score: number | null) => {
    if (!score) return "Not Rated";
    if (score >= 90) return "A+";
    if (score >= 80) return "A";
    if (score >= 70) return "B";
    if (score >= 60) return "C";
    return "D";
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-[#D4AF37]/10">
              <Package className="h-6 w-6 text-[#D4AF37]" />
            </div>
            <div>
              <H1 className="text-2xl">{feedstock.abfiId}</H1>
              <Body className="text-gray-600">
                {
                  FEEDSTOCK_CATEGORIES.find(c => c.value === feedstock.category)
                    ?.label
                }{" "}
                -{" "}
                {
                  FEEDSTOCK_TYPES[
                    feedstock.category as keyof typeof FEEDSTOCK_TYPES
                  ]?.find((t: any) => t.value === feedstock.type)?.label
                }
              </Body>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {/* ABFI Score Badge */}
            <div className="text-center">
              <div className="text-sm text-gray-600 mb-1">ABFI Score</div>
              <div
                className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${getScoreColor(feedstock.abfiScore)} text-white font-bold text-xl`}
              >
                {feedstock.abfiScore || "N/A"}
              </div>
              <div className="text-sm mt-1 text-gray-600">
                {getScoreGrade(feedstock.abfiScore)}
              </div>
            </div>
            <Link href="/browse">
              <Button variant="ghost">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Browse
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Location & Supply */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Location & Supply
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-600 mb-1">
                      State
                    </div>
                    <div className="font-medium">
                      {
                        STATES.find((s: any) => s.value === feedstock.state)
                          ?.label
                      }
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 mb-1">
                      Location
                    </div>
                    <div className="font-medium">
                      {feedstock.sourceAddress || "Not specified"}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 mb-1">
                      Annual Capacity
                    </div>
                    <div className="font-medium">
                      {feedstock.annualCapacityTonnes?.toLocaleString() ||
                        "N/A"}{" "}
                      tonnes
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 mb-1">
                      Available Volume
                    </div>
                    <div className="font-medium">
                      {feedstock.availableVolumeCurrent?.toLocaleString() ||
                        "N/A"}{" "}
                      tonnes
                    </div>
                  </div>
                </div>

                {feedstock.pricePerTonne && (
                  <div>
                    <div className="text-sm text-gray-600 mb-1">
                      Price
                    </div>
                    <div className="text-2xl font-bold text-[#D4AF37]">
                      ${feedstock.pricePerTonne}{" "}
                      <span className="text-sm font-normal text-gray-600">
                        per tonne
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quality Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Quality Metrics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-600 mb-1">
                      Carbon Intensity
                    </div>
                    <div className="font-medium">
                      {feedstock.carbonIntensityValue || "N/A"} gCO2e/MJ
                    </div>
                  </div>
                  {feedstock.productionMethod && (
                    <div className="col-span-2">
                      <div className="text-sm text-gray-600 mb-1">
                        Production Method
                      </div>
                      <div className="font-medium capitalize">
                        {feedstock.productionMethod.replace("_", " ")}
                      </div>
                    </div>
                  )}
                </div>

                {feedstock.abfiScore && (
                  <>
                    <Separator />
                    <div>
                      <div className="text-sm font-medium mb-3">
                        ABFI Score Breakdown
                      </div>
                      <div className="space-y-2">
                        {feedstock.sustainabilityScore && (
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span>Sustainability</span>
                              <span className="font-medium">
                                {feedstock.sustainabilityScore}/100
                              </span>
                            </div>
                            <div className="h-2 bg-secondary rounded-full overflow-hidden">
                              <div
                                className="h-full bg-green-600"
                                style={{
                                  width: `${feedstock.sustainabilityScore}%`,
                                }}
                              />
                            </div>
                          </div>
                        )}
                        {feedstock.carbonIntensityScore && (
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span>Carbon Intensity</span>
                              <span className="font-medium">
                                {feedstock.carbonIntensityScore}/100
                              </span>
                            </div>
                            <div className="h-2 bg-secondary rounded-full overflow-hidden">
                              <div
                                className="h-full bg-green-600"
                                style={{
                                  width: `${feedstock.carbonIntensityScore}%`,
                                }}
                              />
                            </div>
                          </div>
                        )}
                        {feedstock.qualityScore && (
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span>Quality</span>
                              <span className="font-medium">
                                {feedstock.qualityScore}/100
                              </span>
                            </div>
                            <div className="h-2 bg-secondary rounded-full overflow-hidden">
                              <div
                                className="h-full bg-green-600"
                                style={{ width: `${feedstock.qualityScore}%` }}
                              />
                            </div>
                          </div>
                        )}
                        {feedstock.reliabilityScore && (
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span>Reliability</span>
                              <span className="font-medium">
                                {feedstock.reliabilityScore}/100
                              </span>
                            </div>
                            <div className="h-2 bg-secondary rounded-full overflow-hidden">
                              <div
                                className="h-full bg-green-600"
                                style={{
                                  width: `${feedstock.reliabilityScore}%`,
                                }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Certifications */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Certifications
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Badge variant="secondary" className="text-sm">
                  {feedstock.verificationLevel?.replace("_", " ").toUpperCase()}
                </Badge>
                <p className="text-xs text-gray-600 mt-2">
                  Verification level indicates the degree of third-party
                  validation
                </p>
              </CardContent>
            </Card>

            {/* Description */}
            {feedstock.description && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Description
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed">
                    {feedstock.description}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status */}
            <Card>
              <CardHeader>
                <CardTitle>Status</CardTitle>
              </CardHeader>
              <CardContent>
                <Badge
                  variant={
                    feedstock.status === "active" ? "default" : "secondary"
                  }
                  className="text-sm"
                >
                  {feedstock.status?.toUpperCase()}
                </Badge>
              </CardContent>
            </Card>

            {/* Contact */}
            <Card>
              <CardHeader>
                <CardTitle>Interested?</CardTitle>
                <CardDescription>
                  Send an inquiry to the supplier
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href={`/inquiry/send?feedstockId=${feedstock.id}`}>
                  <Button className="w-full">
                    <Send className="mr-2 h-4 w-4" />
                    Send Inquiry
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Metadata */}
            <Card>
              <CardHeader>
                <CardTitle>Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <div className="text-gray-600 mb-1">Listed</div>
                  <div>
                    {new Date(feedstock.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <div>
                  <div className="text-gray-600 mb-1">Last Updated</div>
                  <div>
                    {new Date(feedstock.updatedAt).toLocaleDateString()}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
