/**
 * Futures Create - Multi-step Wizard
 *
 * Features:
 * - Hero section with gradient background
 * - 6-step wizard with progress indicators
 * - Typography components for consistent styling
 * - Dynamic yield projections table
 * - Draft/Publish workflow
 */

import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
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
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { PageLayout } from "@/components/layout";
import { AUSTRALIAN_STATES } from "@/const";
import { trpc } from "@/lib/trpc";
import { H1, H2, H3, Body, MetricValue, DataLabel } from "@/components/Typography";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Leaf,
  MapPin,
  Calendar,
  TrendingUp,
  DollarSign,
  FileText,
  TreeDeciduous,
  Sprout,
  Plus,
  Trash2,
  Save,
  Send,
  Sparkles,
} from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { Link, useLocation, useSearch } from "wouter";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Step = 1 | 2 | 3 | 4 | 5 | 6;

const CROP_TYPE_OPTIONS = [
  { value: "bamboo", label: "Bamboo", icon: Sprout },
  {
    value: "rotation_forestry",
    label: "Rotation Forestry",
    icon: TreeDeciduous,
  },
  { value: "eucalyptus", label: "Eucalyptus", icon: TreeDeciduous },
  { value: "poplar", label: "Poplar", icon: TreeDeciduous },
  { value: "willow", label: "Willow", icon: TreeDeciduous },
  { value: "miscanthus", label: "Miscanthus", icon: Leaf },
  { value: "switchgrass", label: "Switchgrass", icon: Leaf },
  { value: "arundo_donax", label: "Arundo Donax", icon: Leaf },
  { value: "hemp", label: "Industrial Hemp", icon: Leaf },
  { value: "other_perennial", label: "Other Perennial", icon: Sprout },
];

const LAND_STATUS_OPTIONS = [
  { value: "owned", label: "Owned" },
  { value: "leased", label: "Leased" },
  { value: "under_negotiation", label: "Under Negotiation" },
  { value: "planned_acquisition", label: "Planned Acquisition" },
];

const HARVEST_SEASON_OPTIONS = [
  { value: "summer", label: "Summer (Dec-Feb)" },
  { value: "autumn", label: "Autumn (Mar-May)" },
  { value: "winter", label: "Winter (Jun-Aug)" },
  { value: "spring", label: "Spring (Sep-Nov)" },
  { value: "year_round", label: "Year-round" },
];

interface YieldProjection {
  projectionYear: number;
  projectedTonnes: string;
  confidencePercent: string;
  harvestSeason: string;
  notes: string;
}

export default function FuturesCreate() {
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const searchString = useSearch();
  const searchParams = new URLSearchParams(searchString);
  const editId = searchParams.get("edit");

  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Step 1: Crop Details
  const [cropType, setCropType] = useState("");
  const [cropVariety, setCropVariety] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  // Step 2: Location
  const [state, setState] = useState("");
  const [region, setRegion] = useState("");
  const [landAreaHectares, setLandAreaHectares] = useState("");
  const [landStatus, setLandStatus] = useState("owned");

  // Step 3: Timeline
  const [projectionStartYear, setProjectionStartYear] = useState(
    new Date().getFullYear().toString()
  );
  const [projectionEndYear, setProjectionEndYear] = useState(
    (new Date().getFullYear() + 10).toString()
  );
  const [plantingDate, setPlantingDate] = useState("");
  const [firstHarvestYear, setFirstHarvestYear] = useState("");

  // Step 4: Yield Projections
  const [projections, setProjections] = useState<YieldProjection[]>([]);

  // Step 5: Pricing & Quality
  const [indicativePricePerTonne, setIndicativePricePerTonne] = useState("");
  const [priceEscalationPercent, setPriceEscalationPercent] = useState("2.5");
  const [pricingNotes, setPricingNotes] = useState("");
  const [expectedCarbonIntensity, setExpectedCarbonIntensity] = useState("");
  const [expectedMoistureContent, setExpectedMoistureContent] = useState("");
  const [expectedEnergyContent, setExpectedEnergyContent] = useState("");

  // Fetch existing futures if editing
  const { data: existingFutures, isLoading: loadingExisting } =
    trpc.futures.getById.useQuery(
      { id: parseInt(editId || "0") },
      { enabled: !!editId }
    );

  // Load existing data when editing
  useEffect(() => {
    if (existingFutures) {
      const { futures, projections: existingProjections } = existingFutures;
      setCropType(futures.cropType);
      setCropVariety(futures.cropVariety || "");
      setTitle(futures.title);
      setDescription(futures.description || "");
      setState(futures.state);
      setRegion(futures.region || "");
      setLandAreaHectares(futures.landAreaHectares);
      setLandStatus(futures.landStatus || "owned");
      setProjectionStartYear(futures.projectionStartYear.toString());
      setProjectionEndYear(futures.projectionEndYear.toString());
      setFirstHarvestYear(futures.firstHarvestYear?.toString() || "");
      setIndicativePricePerTonne(futures.indicativePricePerTonne || "");
      setPriceEscalationPercent(futures.priceEscalationPercent || "2.5");
      setPricingNotes(futures.pricingNotes || "");
      setExpectedCarbonIntensity(futures.expectedCarbonIntensity || "");
      setExpectedMoistureContent(futures.expectedMoistureContent || "");
      setExpectedEnergyContent(futures.expectedEnergyContent || "");

      if (existingProjections) {
        setProjections(
          existingProjections.map((p: any) => ({
            projectionYear: p.projectionYear,
            projectedTonnes: p.projectedTonnes || "",
            confidencePercent: p.confidencePercent?.toString() || "80",
            harvestSeason: p.harvestSeason || "",
            notes: p.notes || "",
          }))
        );
      }
    }
  }, [existingFutures]);

  // Generate projections based on timeline
  const generateProjections = () => {
    const startYear = parseInt(projectionStartYear);
    const endYear = parseInt(projectionEndYear);
    if (isNaN(startYear) || isNaN(endYear) || endYear < startYear) return;

    const newProjections: YieldProjection[] = [];
    for (let year = startYear; year <= endYear; year++) {
      const existing = projections.find(p => p.projectionYear === year);
      newProjections.push(
        existing || {
          projectionYear: year,
          projectedTonnes: "",
          confidencePercent: "80",
          harvestSeason: "",
          notes: "",
        }
      );
    }
    setProjections(newProjections);
  };

  // Calculate totals
  const totalProjectedTonnes = useMemo(() => {
    return projections.reduce(
      (sum, p) => sum + (parseFloat(p.projectedTonnes) || 0),
      0
    );
  }, [projections]);

  const createMutation = trpc.futures.create.useMutation({
    onSuccess: data => {
      toast.success("Futures listing created successfully!");
      setLocation(`/supplier/futures/${data.id}`);
    },
    onError: error => {
      toast.error(error.message || "Failed to create futures listing");
      setIsSubmitting(false);
    },
  });

  const updateMutation = trpc.futures.update.useMutation({
    onSuccess: () => {
      toast.success("Futures listing updated successfully!");
      setLocation(`/supplier/futures/${editId}`);
    },
    onError: error => {
      toast.error(error.message || "Failed to update futures listing");
      setIsSubmitting(false);
    },
  });

  const saveProjectionsMutation = trpc.futures.saveProjections.useMutation();

  const handleSubmit = async (publishNow: boolean) => {
    setIsSubmitting(true);

    const formData = {
      cropType: cropType as any,
      cropVariety: cropVariety || undefined,
      title,
      description: description || undefined,
      state: state as any,
      region: region || undefined,
      landAreaHectares: parseFloat(landAreaHectares),
      landStatus: landStatus as any,
      projectionStartYear: parseInt(projectionStartYear),
      projectionEndYear: parseInt(projectionEndYear),
      firstHarvestYear: firstHarvestYear
        ? parseInt(firstHarvestYear)
        : undefined,
      indicativePricePerTonne: indicativePricePerTonne
        ? parseFloat(indicativePricePerTonne)
        : undefined,
      priceEscalationPercent: priceEscalationPercent
        ? parseFloat(priceEscalationPercent)
        : undefined,
      pricingNotes: pricingNotes || undefined,
      expectedCarbonIntensity: expectedCarbonIntensity
        ? parseFloat(expectedCarbonIntensity)
        : undefined,
      expectedMoistureContent: expectedMoistureContent
        ? parseFloat(expectedMoistureContent)
        : undefined,
      expectedEnergyContent: expectedEnergyContent
        ? parseFloat(expectedEnergyContent)
        : undefined,
      status: publishNow ? ("active" as const) : ("draft" as const),
      projections: projections
        .filter(p => p.projectedTonnes)
        .map(p => ({
          projectionYear: p.projectionYear,
          projectedTonnes: parseFloat(p.projectedTonnes),
          confidencePercent: p.confidencePercent
            ? parseInt(p.confidencePercent)
            : undefined,
          harvestSeason: p.harvestSeason || undefined,
          notes: p.notes || undefined,
        })),
    };

    if (editId) {
      await updateMutation.mutateAsync({
        id: parseInt(editId),
        title: formData.title,
        description: formData.description,
        region: formData.region,
        landAreaHectares: formData.landAreaHectares,
        landStatus: formData.landStatus,
        indicativePricePerTonne: formData.indicativePricePerTonne,
        priceEscalationPercent: formData.priceEscalationPercent,
        pricingNotes: formData.pricingNotes,
        expectedCarbonIntensity: formData.expectedCarbonIntensity,
        expectedMoistureContent: formData.expectedMoistureContent,
        expectedEnergyContent: formData.expectedEnergyContent,
      });
      // Save projections separately for updates
      await saveProjectionsMutation.mutateAsync({
        futuresId: parseInt(editId),
        projections: formData.projections,
      });
    } else {
      createMutation.mutate(formData);
    }
  };

  const updateProjection = (
    index: number,
    field: keyof YieldProjection,
    value: string
  ) => {
    const updated = [...projections];
    updated[index] = { ...updated[index], [field]: value };
    setProjections(updated);
  };

  // Validation
  const canProceedStep1 = cropType && title;
  const canProceedStep2 = state && landAreaHectares;
  const canProceedStep3 = projectionStartYear && projectionEndYear;
  const canProceedStep4 = projections.some(
    p => parseFloat(p.projectedTonnes) > 0
  );
  const canProceedStep5 = true; // All optional

  const stepIcons = [Leaf, MapPin, Calendar, TrendingUp, DollarSign, FileText];
  const stepLabels = [
    "Crop Details",
    "Location",
    "Timeline",
    "Projections",
    "Pricing",
    "Review",
  ];

  if (authLoading || !user) {
    return (
      <PageLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center">
            <Skeleton className="h-8 w-64 mx-auto mb-4" />
            <Skeleton className="h-4 w-48 mx-auto" />
          </div>
        </div>
      </PageLayout>
    );
  }

  if (editId && loadingExisting) {
    return (
      <PageLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center">
            <Skeleton className="h-8 w-64 mx-auto mb-4" />
            <Skeleton className="h-4 w-48 mx-auto" />
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-[#D4AF37] via-emerald-600 to-green-700 text-black overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-10" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-400/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

        <div className="container mx-auto px-4 py-12 lg:py-16 relative z-10">
          <Link href="/supplier/futures">
            <Button
              variant="ghost"
              className="mb-6 text-black/80 hover:text-black hover:bg-white/10"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to My Futures
            </Button>
          </Link>

          <div className="max-w-3xl">
            <Badge className="bg-white/20 text-black border-white/30 backdrop-blur-sm mb-4">
              <TreeDeciduous className="h-3.5 w-3.5 mr-1.5" />
              {editId ? "Edit Listing" : "New Listing"}
            </Badge>

            <H1 className="mb-4 tracking-tight">
              {editId ? "Edit Futures" : "Create Futures"}
              <span className="block text-emerald-200">Listing</span>
            </H1>

            <Body className="text-lg text-emerald-100 max-w-xl">
              Project your long-term perennial crop yields and connect with
              buyers seeking future supply agreements.
            </Body>
          </div>
        </div>
      </section>

      {/* Progress Steps */}
      <section className="bg-background border-b py-6">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="flex items-center justify-between">
            {[1, 2, 3, 4, 5, 6].map(step => {
              const StepIcon = stepIcons[step - 1];
              return (
                <div key={step} className="flex items-center flex-1">
                  <button
                    onClick={() =>
                      step < currentStep && setCurrentStep(step as Step)
                    }
                    className={cn(
                      "flex items-center justify-center w-12 h-12 rounded-xl border-2 transition-all",
                      currentStep >= step
                        ? "bg-[#D4AF37] border-[#D4AF37] text-black shadow-lg shadow-teal-600/25"
                        : "bg-card border-border text-gray-600",
                      step < currentStep && "cursor-pointer hover:opacity-80"
                    )}
                    disabled={step >= currentStep}
                  >
                    {currentStep > step ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      <StepIcon className="h-5 w-5" />
                    )}
                  </button>
                  {step < 6 && (
                    <div
                      className={cn(
                        "flex-1 h-1 mx-2 rounded-full transition-colors",
                        currentStep > step ? "bg-[#D4AF37]" : "bg-border"
                      )}
                    />
                  )}
                </div>
              );
            })}
          </div>
          <div className="flex justify-between mt-3 px-1">
            {stepLabels.map((label, i) => (
              <span
                key={label}
                className={cn(
                  "text-xs font-medium transition-colors text-center w-16",
                  currentStep >= i + 1
                    ? "text-[#D4AF37] font-semibold"
                    : "text-gray-600"
                )}
              >
                {label}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Form Content */}
      <section className="py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Step 1: Crop Details */}
          {currentStep === 1 && (
            <Card className="border-t-4 border-t-teal-500">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-teal-100">
                    <Leaf className="h-6 w-6 text-[#D4AF37]" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl">Crop Details</CardTitle>
                    <CardDescription>
                      Select the perennial crop type and provide details
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="cropType" className="text-base font-semibold">
                    Crop Type *
                  </Label>
                  <Select value={cropType} onValueChange={setCropType}>
                    <SelectTrigger id="cropType" className="h-12">
                      <SelectValue placeholder="Select crop type" />
                    </SelectTrigger>
                    <SelectContent>
                      {CROP_TYPE_OPTIONS.map(crop => (
                        <SelectItem key={crop.value} value={crop.value}>
                          <div className="flex items-center gap-2">
                            <crop.icon className="h-4 w-4 text-[#D4AF37]" />
                            {crop.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="cropVariety"
                    className="text-base font-semibold"
                  >
                    Variety / Cultivar
                  </Label>
                  <Input
                    id="cropVariety"
                    placeholder="e.g., Moso, Madake, Clone 433"
                    value={cropVariety}
                    onChange={e => setCropVariety(e.target.value)}
                    className="h-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="title" className="text-base font-semibold">
                    Listing Title *
                  </Label>
                  <Input
                    id="title"
                    placeholder="e.g., 500ha Eucalyptus Plantation - QLD"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    className="h-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="description"
                    className="text-base font-semibold"
                  >
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    placeholder="Describe your plantation, growing conditions, sustainability practices..."
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    rows={4}
                    className="resize-none"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-6 border-t">
                  <Button
                    onClick={() => setCurrentStep(2)}
                    disabled={!canProceedStep1}
                    size="lg"
                    className="bg-[#D4AF37] hover:bg-teal-700"
                  >
                    Next Step
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Location */}
          {currentStep === 2 && (
            <Card className="border-t-4 border-t-teal-500">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-teal-100">
                    <MapPin className="h-6 w-6 text-[#D4AF37]" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl">Location & Land</CardTitle>
                    <CardDescription>
                      Where is your plantation located?
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="state" className="text-base font-semibold">
                      State *
                    </Label>
                    <Select value={state} onValueChange={setState}>
                      <SelectTrigger id="state" className="h-12">
                        <SelectValue placeholder="Select state" />
                      </SelectTrigger>
                      <SelectContent>
                        {AUSTRALIAN_STATES.map(s => (
                          <SelectItem key={s.value} value={s.value}>
                            {s.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="region" className="text-base font-semibold">
                      Region
                    </Label>
                    <Input
                      id="region"
                      placeholder="e.g., Darling Downs, Murray-Darling"
                      value={region}
                      onChange={e => setRegion(e.target.value)}
                      className="h-12"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label
                      htmlFor="landAreaHectares"
                      className="text-base font-semibold"
                    >
                      Land Area (hectares) *
                    </Label>
                    <Input
                      id="landAreaHectares"
                      type="number"
                      placeholder="e.g., 500"
                      value={landAreaHectares}
                      onChange={e => setLandAreaHectares(e.target.value)}
                      className="h-12 font-mono"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="landStatus"
                      className="text-base font-semibold"
                    >
                      Land Status
                    </Label>
                    <Select value={landStatus} onValueChange={setLandStatus}>
                      <SelectTrigger id="landStatus" className="h-12">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        {LAND_STATUS_OPTIONS.map(status => (
                          <SelectItem key={status.value} value={status.value}>
                            {status.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex justify-between gap-3 pt-6 border-t">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentStep(1)}
                    size="lg"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Previous
                  </Button>
                  <Button
                    onClick={() => setCurrentStep(3)}
                    disabled={!canProceedStep2}
                    size="lg"
                    className="bg-[#D4AF37] hover:bg-teal-700"
                  >
                    Next Step
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Timeline */}
          {currentStep === 3 && (
            <Card className="border-t-4 border-t-teal-500">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-teal-100">
                    <Calendar className="h-6 w-6 text-[#D4AF37]" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl">
                      Projection Timeline
                    </CardTitle>
                    <CardDescription>
                      Define the timeframe for your yield projections
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label
                      htmlFor="projectionStartYear"
                      className="text-base font-semibold"
                    >
                      Start Year *
                    </Label>
                    <Select
                      value={projectionStartYear}
                      onValueChange={setProjectionStartYear}
                    >
                      <SelectTrigger id="projectionStartYear" className="h-12">
                        <SelectValue placeholder="Select year" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from(
                          { length: 10 },
                          (_, i) => new Date().getFullYear() + i
                        ).map(year => (
                          <SelectItem key={year} value={year.toString()}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="projectionEndYear"
                      className="text-base font-semibold"
                    >
                      End Year *
                    </Label>
                    <Select
                      value={projectionEndYear}
                      onValueChange={setProjectionEndYear}
                    >
                      <SelectTrigger id="projectionEndYear" className="h-12">
                        <SelectValue placeholder="Select year" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from(
                          { length: 30 },
                          (_, i) => parseInt(projectionStartYear || "2025") + i
                        ).map(year => (
                          <SelectItem key={year} value={year.toString()}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label
                      htmlFor="plantingDate"
                      className="text-base font-semibold"
                    >
                      Planting Date
                    </Label>
                    <Input
                      id="plantingDate"
                      type="date"
                      value={plantingDate}
                      onChange={e => setPlantingDate(e.target.value)}
                      className="h-12"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="firstHarvestYear"
                      className="text-base font-semibold"
                    >
                      First Harvest Year
                    </Label>
                    <Select
                      value={firstHarvestYear}
                      onValueChange={setFirstHarvestYear}
                    >
                      <SelectTrigger id="firstHarvestYear" className="h-12">
                        <SelectValue placeholder="Select year" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from(
                          { length: 30 },
                          (_, i) => parseInt(projectionStartYear || "2025") + i
                        ).map(year => (
                          <SelectItem key={year} value={year.toString()}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="bg-teal-50 border border-teal-100 rounded-xl p-5">
                  <p className="text-sm text-teal-700">
                    Projection period:{" "}
                    <strong className="text-teal-800">
                      {parseInt(projectionEndYear) -
                        parseInt(projectionStartYear) +
                        1}{" "}
                      years
                    </strong>{" "}
                    ({projectionStartYear} - {projectionEndYear})
                  </p>
                </div>

                <div className="flex justify-between gap-3 pt-6 border-t">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentStep(2)}
                    size="lg"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Previous
                  </Button>
                  <Button
                    onClick={() => {
                      generateProjections();
                      setCurrentStep(4);
                    }}
                    disabled={!canProceedStep3}
                    size="lg"
                    className="bg-[#D4AF37] hover:bg-teal-700"
                  >
                    Next Step
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 4: Yield Projections */}
          {currentStep === 4 && (
            <Card className="border-t-4 border-t-teal-500">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-teal-100">
                    <TrendingUp className="h-6 w-6 text-[#D4AF37]" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl">
                      Yield Projections
                    </CardTitle>
                    <CardDescription>
                      Enter projected yields for each year
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-teal-50 border border-teal-100 rounded-xl p-5 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                  <div>
                    <DataLabel className="text-[#D4AF37] mb-1">
                      Total Projected Volume
                    </DataLabel>
                    <MetricValue className="text-teal-800">
                      {totalProjectedTonnes.toLocaleString()} tonnes
                    </MetricValue>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={generateProjections}
                    className="border-teal-200 text-teal-700 hover:bg-teal-100"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Regenerate Years
                  </Button>
                </div>

                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                  {projections.map((projection, index) => (
                    <div
                      key={projection.projectionYear}
                      className="border rounded-xl p-4 hover:border-teal-200 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <H3 className="font-bold text-lg">
                          {projection.projectionYear}
                        </H3>
                        <Badge
                          variant="outline"
                          className="border-teal-200 text-teal-700"
                        >
                          Year {index + 1}
                        </Badge>
                      </div>
                      <div className="grid md:grid-cols-4 gap-4">
                        <div className="space-y-1.5">
                          <Label className="text-xs text-gray-600">
                            Projected Tonnes *
                          </Label>
                          <Input
                            type="number"
                            placeholder="0"
                            value={projection.projectedTonnes}
                            onChange={e =>
                              updateProjection(
                                index,
                                "projectedTonnes",
                                e.target.value
                              )
                            }
                            className="font-mono h-10"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs text-gray-600">
                            Confidence %
                          </Label>
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            placeholder="80"
                            value={projection.confidencePercent}
                            onChange={e =>
                              updateProjection(
                                index,
                                "confidencePercent",
                                e.target.value
                              )
                            }
                            className="font-mono h-10"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs text-gray-600">
                            Harvest Season
                          </Label>
                          <Select
                            value={projection.harvestSeason}
                            onValueChange={v =>
                              updateProjection(index, "harvestSeason", v)
                            }
                          >
                            <SelectTrigger className="h-10">
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                              {HARVEST_SEASON_OPTIONS.map(season => (
                                <SelectItem
                                  key={season.value}
                                  value={season.value}
                                >
                                  {season.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs text-gray-600">
                            Notes
                          </Label>
                          <Input
                            placeholder="Optional notes"
                            value={projection.notes}
                            onChange={e =>
                              updateProjection(index, "notes", e.target.value)
                            }
                            className="h-10"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between gap-3 pt-6 border-t">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentStep(3)}
                    size="lg"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Previous
                  </Button>
                  <Button
                    onClick={() => setCurrentStep(5)}
                    disabled={!canProceedStep4}
                    size="lg"
                    className="bg-[#D4AF37] hover:bg-teal-700"
                  >
                    Next Step
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 5: Pricing & Quality */}
          {currentStep === 5 && (
            <Card className="border-t-4 border-t-teal-500">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-teal-100">
                    <DollarSign className="h-6 w-6 text-[#D4AF37]" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl">
                      Pricing & Quality
                    </CardTitle>
                    <CardDescription>
                      Set indicative pricing and quality parameters
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label
                      htmlFor="indicativePricePerTonne"
                      className="text-base font-semibold"
                    >
                      Indicative Price ($/tonne)
                    </Label>
                    <Input
                      id="indicativePricePerTonne"
                      type="number"
                      placeholder="e.g., 120"
                      value={indicativePricePerTonne}
                      onChange={e => setIndicativePricePerTonne(e.target.value)}
                      className="h-12 font-mono"
                    />
                    <p className="text-xs text-gray-600">
                      Leave blank for "negotiable"
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="priceEscalationPercent"
                      className="text-base font-semibold"
                    >
                      Annual Price Escalation (%)
                    </Label>
                    <Input
                      id="priceEscalationPercent"
                      type="number"
                      step="0.1"
                      placeholder="2.5"
                      value={priceEscalationPercent}
                      onChange={e => setPriceEscalationPercent(e.target.value)}
                      className="h-12 font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="pricingNotes"
                    className="text-base font-semibold"
                  >
                    Pricing Notes
                  </Label>
                  <Textarea
                    id="pricingNotes"
                    placeholder="Any special pricing considerations, volume discounts, etc."
                    value={pricingNotes}
                    onChange={e => setPricingNotes(e.target.value)}
                    rows={3}
                    className="resize-none"
                  />
                </div>

                <div className="pt-6 border-t">
                  <h4 className="text-base font-semibold mb-4">
                    Expected Quality Parameters
                  </h4>
                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="expectedCarbonIntensity">
                        Carbon Intensity (kg CO₂e/t)
                      </Label>
                      <Input
                        id="expectedCarbonIntensity"
                        type="number"
                        placeholder="e.g., 15"
                        value={expectedCarbonIntensity}
                        onChange={e =>
                          setExpectedCarbonIntensity(e.target.value)
                        }
                        className="h-12 font-mono"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="expectedMoistureContent">
                        Moisture Content (%)
                      </Label>
                      <Input
                        id="expectedMoistureContent"
                        type="number"
                        placeholder="e.g., 12"
                        value={expectedMoistureContent}
                        onChange={e =>
                          setExpectedMoistureContent(e.target.value)
                        }
                        className="h-12 font-mono"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="expectedEnergyContent">
                        Energy Content (GJ/t)
                      </Label>
                      <Input
                        id="expectedEnergyContent"
                        type="number"
                        placeholder="e.g., 18"
                        value={expectedEnergyContent}
                        onChange={e => setExpectedEnergyContent(e.target.value)}
                        className="h-12 font-mono"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-between gap-3 pt-6 border-t">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentStep(4)}
                    size="lg"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Previous
                  </Button>
                  <Button
                    onClick={() => setCurrentStep(6)}
                    size="lg"
                    className="bg-[#D4AF37] hover:bg-teal-700"
                  >
                    Review
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 6: Review & Submit */}
          {currentStep === 6 && (
            <Card className="border-t-4 border-t-teal-500">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-teal-100">
                    <FileText className="h-6 w-6 text-[#D4AF37]" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl">Review & Submit</CardTitle>
                    <CardDescription>
                      Review your futures listing before submitting
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Summary Cards */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-muted/50 rounded-xl p-5 space-y-2">
                    <DataLabel className="text-gray-600 uppercase tracking-wider">
                      CROP
                    </DataLabel>
                    <H3 className="text-lg">
                      {CROP_TYPE_OPTIONS.find(c => c.value === cropType)?.label}
                      {cropVariety && ` - ${cropVariety}`}
                    </H3>
                    <Body className="text-sm text-gray-600">{title}</Body>
                  </div>

                  <div className="bg-muted/50 rounded-xl p-5 space-y-2">
                    <DataLabel className="text-gray-600 uppercase tracking-wider">
                      LOCATION
                    </DataLabel>
                    <H3 className="text-lg">
                      {AUSTRALIAN_STATES.find(s => s.value === state)?.label}
                      {region && `, ${region}`}
                    </H3>
                    <Body className="text-sm text-gray-600">
                      {parseFloat(landAreaHectares).toLocaleString()} ha (
                      {
                        LAND_STATUS_OPTIONS.find(l => l.value === landStatus)
                          ?.label
                      }
                      )
                    </Body>
                  </div>

                  <div className="bg-muted/50 rounded-xl p-5 space-y-2">
                    <DataLabel className="text-gray-600 uppercase tracking-wider">
                      TIMELINE
                    </DataLabel>
                    <H3 className="text-lg">
                      {projectionStartYear} - {projectionEndYear}
                    </H3>
                    <Body className="text-sm text-gray-600">
                      {parseInt(projectionEndYear) -
                        parseInt(projectionStartYear) +
                        1}{" "}
                      years
                      {firstHarvestYear &&
                        `, first harvest ${firstHarvestYear}`}
                    </Body>
                  </div>

                  <div className="bg-teal-50 border border-teal-100 rounded-xl p-5 space-y-2">
                    <DataLabel className="text-[#D4AF37] uppercase tracking-wider">
                      VOLUME
                    </DataLabel>
                    <MetricValue className="text-2xl text-teal-800">
                      {totalProjectedTonnes.toLocaleString()} t
                    </MetricValue>
                    <Body className="text-sm text-[#D4AF37]">
                      ~
                      {Math.round(
                        totalProjectedTonnes /
                          (parseInt(projectionEndYear) -
                            parseInt(projectionStartYear) +
                            1)
                      ).toLocaleString()}{" "}
                      tonnes/year average
                    </Body>
                  </div>
                </div>

                {/* Pricing Summary */}
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-5">
                  <h4 className="font-semibold mb-2 text-emerald-800">
                    Pricing
                  </h4>
                  <p className="text-lg font-mono">
                    {indicativePricePerTonne ? (
                      <span className="font-bold text-emerald-700">
                        ${parseFloat(indicativePricePerTonne).toFixed(2)}/tonne
                      </span>
                    ) : (
                      <span className="text-[#D4AF37]">Negotiable</span>
                    )}
                    {priceEscalationPercent && (
                      <span className="text-[#D4AF37] ml-2">
                        (+{priceEscalationPercent}% p.a.)
                      </span>
                    )}
                  </p>
                  {pricingNotes && (
                    <p className="text-sm text-[#D4AF37] mt-2 italic">
                      {pricingNotes}
                    </p>
                  )}
                </div>

                {/* Quality Summary */}
                {(expectedCarbonIntensity ||
                  expectedMoistureContent ||
                  expectedEnergyContent) && (
                  <div className="border rounded-xl p-5">
                    <h4 className="font-semibold mb-3">Expected Quality</h4>
                    <div className="flex flex-wrap gap-6">
                      {expectedCarbonIntensity && (
                        <div className="text-center">
                          <p className="text-2xl font-bold font-mono">
                            {expectedCarbonIntensity}
                          </p>
                          <p className="text-xs text-gray-600">
                            kg CO₂e/t
                          </p>
                        </div>
                      )}
                      {expectedMoistureContent && (
                        <div className="text-center">
                          <p className="text-2xl font-bold font-mono">
                            {expectedMoistureContent}%
                          </p>
                          <p className="text-xs text-gray-600">
                            Moisture
                          </p>
                        </div>
                      )}
                      {expectedEnergyContent && (
                        <div className="text-center">
                          <p className="text-2xl font-bold font-mono">
                            {expectedEnergyContent}
                          </p>
                          <p className="text-xs text-gray-600">
                            GJ/t Energy
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row justify-between gap-4 pt-6 border-t">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentStep(5)}
                    size="lg"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Previous
                  </Button>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                      variant="outline"
                      onClick={() => handleSubmit(false)}
                      disabled={isSubmitting}
                      size="lg"
                      className="border-teal-200 text-teal-700 hover:bg-teal-50"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {isSubmitting ? "Saving..." : "Save as Draft"}
                    </Button>
                    <Button
                      onClick={() => handleSubmit(true)}
                      disabled={isSubmitting}
                      size="lg"
                      className="bg-[#D4AF37] hover:bg-teal-700"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      {isSubmitting ? "Publishing..." : "Publish Now"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </section>
    </PageLayout>
  );
}
