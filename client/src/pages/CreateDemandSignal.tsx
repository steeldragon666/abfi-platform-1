/**
 * Create Demand Signal - Nextgen Design
 *
 * Features:
 * - 7-step wizard (Basics, Volume, Quality, Delivery, Pricing, Timeline, Review)
 * - Progressive form validation
 * - Quality specifications input
 * - Pricing mechanism selection
 * - Typography components for consistent styling
 */

import { useState } from "react";
import { H1, H2, H3, H4, Body, MetricValue, DataLabel } from "@/components/Typography";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
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
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { PageLayout, PageContainer } from "@/components/layout";
import {
  ArrowLeft,
  ArrowRight,
  Send,
  FileText,
  Package,
  Beaker,
  MapPin,
  DollarSign,
  Calendar,
  Leaf,
  CheckCircle2,
} from "lucide-react";

const STEPS = [
  { id: 1, title: "Basics", icon: Package },
  { id: 2, title: "Volume", icon: Package },
  { id: 3, title: "Quality", icon: Beaker },
  { id: 4, title: "Delivery", icon: MapPin },
  { id: 5, title: "Pricing", icon: DollarSign },
  { id: 6, title: "Timeline", icon: Calendar },
  { id: 7, title: "Review", icon: CheckCircle2 },
];

export default function CreateDemandSignal() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    feedstockType: "",
    feedstockCategory: "agricultural_residue" as const,
    annualVolume: "",
    volumeFlexibility: "",
    deliveryFrequency: "monthly" as const,
    minMoistureContent: "",
    maxMoistureContent: "",
    minEnergyContent: "",
    maxAshContent: "",
    maxChlorineContent: "",
    otherQualitySpecs: "",
    deliveryLocation: "",
    deliveryState: "NSW" as const,
    maxTransportDistance: "",
    deliveryMethod: "delivered" as const,
    indicativePriceMin: "",
    indicativePriceMax: "",
    pricingMechanism: "negotiable" as const,
    supplyStartDate: "",
    supplyEndDate: "",
    contractTerm: "",
    responseDeadline: "",
    sustainabilityRequirements: "",
  });

  const createMutation = trpc.demandSignals.create.useMutation({
    onSuccess: (data: { id: number; signalNumber: string }) => {
      setLocation(`/demand-signals/${data.id}`);
    },
  });

  const handleSubmit = (e: React.FormEvent, status: "draft" | "published") => {
    e.preventDefault();

    createMutation.mutate({
      ...formData,
      status,
      annualVolume: parseInt(formData.annualVolume) || 0,
      volumeFlexibility: formData.volumeFlexibility
        ? parseInt(formData.volumeFlexibility)
        : undefined,
      minMoistureContent: formData.minMoistureContent
        ? parseInt(formData.minMoistureContent)
        : undefined,
      maxMoistureContent: formData.maxMoistureContent
        ? parseInt(formData.maxMoistureContent)
        : undefined,
      minEnergyContent: formData.minEnergyContent
        ? parseInt(formData.minEnergyContent)
        : undefined,
      maxAshContent: formData.maxAshContent
        ? parseInt(formData.maxAshContent)
        : undefined,
      maxChlorineContent: formData.maxChlorineContent
        ? parseInt(formData.maxChlorineContent)
        : undefined,
      maxTransportDistance: formData.maxTransportDistance
        ? parseInt(formData.maxTransportDistance)
        : undefined,
      indicativePriceMin: formData.indicativePriceMin
        ? parseInt(formData.indicativePriceMin)
        : undefined,
      indicativePriceMax: formData.indicativePriceMax
        ? parseInt(formData.indicativePriceMax)
        : undefined,
      contractTerm: formData.contractTerm
        ? parseInt(formData.contractTerm)
        : undefined,
      supplyStartDate: new Date(formData.supplyStartDate),
      supplyEndDate: formData.supplyEndDate
        ? new Date(formData.supplyEndDate)
        : undefined,
      responseDeadline: new Date(formData.responseDeadline),
    });
  };

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const nextStep = () => setCurrentStep(s => Math.min(s + 1, STEPS.length));
  const prevStep = () => setCurrentStep(s => Math.max(s - 1, 1));
  const progress = (currentStep / STEPS.length) * 100;

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      agricultural_residue: "Agricultural Residue",
      forestry_residue: "Forestry Residue",
      energy_crop: "Energy Crop",
      organic_waste: "Organic Waste",
      algae_aquatic: "Algae/Aquatic",
      mixed: "Mixed",
    };
    return labels[category] || category;
  };

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

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl md:text-4xl font-display font-bold mb-2">
                Post Demand Signal
              </h1>
              <p className="text-black/70">
                Specify your feedstock requirements to connect with verified
                suppliers
              </p>
            </div>
            <div className="hidden md:flex items-center gap-2">
              <Badge variant="outline" className="text-black border-white/30">
                Step {currentStep} of {STEPS.length}
              </Badge>
            </div>
          </div>
        </PageContainer>
      </section>

      {/* Progress Bar */}
      <div className="sticky top-0 z-10 bg-background border-b">
        <PageContainer size="lg" padding="none" className="py-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {STEPS.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isComplete = currentStep > step.id;

              return (
                <button
                  key={step.id}
                  onClick={() => setCurrentStep(step.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg whitespace-nowrap transition-all ${
                    isActive
                      ? "bg-primary text-black"
                      : isComplete
                        ? "bg-[#D4AF37]/10 text-[#D4AF37]"
                        : "text-gray-600 hover:bg-muted"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="text-sm font-medium">{step.title}</span>
                  {isComplete && <CheckCircle2 className="h-4 w-4" />}
                </button>
              );
            })}
          </div>
          <Progress value={progress} className="h-1 mt-2" />
        </PageContainer>
      </div>

      {/* Form Content */}
      <PageContainer size="md" padding="md">
        <form onSubmit={e => handleSubmit(e, "published")}>
          {/* Step 1: Basic Information */}
          {currentStep === 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-[#D4AF37]" />
                  Basic Information
                </CardTitle>
                <CardDescription>
                  Provide an overview of your feedstock requirements
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="title">Signal Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={e => updateField("title", e.target.value)}
                    placeholder="e.g., Wheat Straw Required for Bioenergy Project"
                    className="mt-1.5"
                    required
                  />
                  <p className="text-sm text-gray-600 mt-1.5">
                    A clear title helps suppliers quickly understand your needs
                  </p>
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={e => updateField("description", e.target.value)}
                    placeholder="Provide additional context about your requirements, project timeline, and any specific needs..."
                    rows={4}
                    className="mt-1.5"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="feedstockType">Feedstock Type *</Label>
                    <Input
                      id="feedstockType"
                      value={formData.feedstockType}
                      onChange={e =>
                        updateField("feedstockType", e.target.value)
                      }
                      placeholder="e.g., Wheat Straw, Bagasse"
                      className="mt-1.5"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="feedstockCategory">Category *</Label>
                    <Select
                      value={formData.feedstockCategory}
                      onValueChange={value =>
                        updateField("feedstockCategory", value)
                      }
                    >
                      <SelectTrigger className="mt-1.5">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="agricultural_residue">
                          Agricultural Residue
                        </SelectItem>
                        <SelectItem value="forestry_residue">
                          Forestry Residue
                        </SelectItem>
                        <SelectItem value="energy_crop">Energy Crop</SelectItem>
                        <SelectItem value="organic_waste">
                          Organic Waste
                        </SelectItem>
                        <SelectItem value="algae_aquatic">
                          Algae/Aquatic
                        </SelectItem>
                        <SelectItem value="mixed">Mixed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Volume Requirements */}
          {currentStep === 2 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-[#D4AF37]" />
                  Volume Requirements
                </CardTitle>
                <CardDescription>
                  Specify quantity and delivery frequency
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="annualVolume">
                      Annual Volume (tonnes) *
                    </Label>
                    <Input
                      id="annualVolume"
                      type="number"
                      value={formData.annualVolume}
                      onChange={e =>
                        updateField("annualVolume", e.target.value)
                      }
                      placeholder="e.g., 50000"
                      className="mt-1.5"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="volumeFlexibility">Flexibility (%)</Label>
                    <Input
                      id="volumeFlexibility"
                      type="number"
                      value={formData.volumeFlexibility}
                      onChange={e =>
                        updateField("volumeFlexibility", e.target.value)
                      }
                      placeholder="e.g., 10"
                      className="mt-1.5"
                    />
                    <p className="text-xs text-gray-600 mt-1">
                      Acceptable variation in volume
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="deliveryFrequency">
                      Delivery Frequency *
                    </Label>
                    <Select
                      value={formData.deliveryFrequency}
                      onValueChange={value =>
                        updateField("deliveryFrequency", value)
                      }
                    >
                      <SelectTrigger className="mt-1.5">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="continuous">Continuous</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="fortnightly">Fortnightly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="quarterly">Quarterly</SelectItem>
                        <SelectItem value="seasonal">Seasonal</SelectItem>
                        <SelectItem value="spot">Spot</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="bg-muted/50 rounded-lg p-4">
                  <h4 className="font-medium mb-2">Volume Calculator</h4>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <div className="text-gray-600">Daily</div>
                      <div className="font-mono font-medium">
                        {formData.annualVolume
                          ? `${Math.round(parseInt(formData.annualVolume) / 365)} t`
                          : "—"}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-600">Monthly</div>
                      <div className="font-mono font-medium">
                        {formData.annualVolume
                          ? `${Math.round(parseInt(formData.annualVolume) / 12).toLocaleString()} t`
                          : "—"}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-600">Quarterly</div>
                      <div className="font-mono font-medium">
                        {formData.annualVolume
                          ? `${Math.round(parseInt(formData.annualVolume) / 4).toLocaleString()} t`
                          : "—"}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Quality Specifications */}
          {currentStep === 3 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Beaker className="h-5 w-5 text-[#D4AF37]" />
                  Quality Specifications
                </CardTitle>
                <CardDescription>
                  Define quality parameters for the feedstock (optional but
                  recommended)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="minMoistureContent">
                      Min Moisture Content (%)
                    </Label>
                    <Input
                      id="minMoistureContent"
                      type="number"
                      value={formData.minMoistureContent}
                      onChange={e =>
                        updateField("minMoistureContent", e.target.value)
                      }
                      placeholder="e.g., 10"
                      className="mt-1.5"
                    />
                  </div>

                  <div>
                    <Label htmlFor="maxMoistureContent">
                      Max Moisture Content (%)
                    </Label>
                    <Input
                      id="maxMoistureContent"
                      type="number"
                      value={formData.maxMoistureContent}
                      onChange={e =>
                        updateField("maxMoistureContent", e.target.value)
                      }
                      placeholder="e.g., 15"
                      className="mt-1.5"
                    />
                  </div>

                  <div>
                    <Label htmlFor="minEnergyContent">
                      Min Energy Content (MJ/kg)
                    </Label>
                    <Input
                      id="minEnergyContent"
                      type="number"
                      value={formData.minEnergyContent}
                      onChange={e =>
                        updateField("minEnergyContent", e.target.value)
                      }
                      placeholder="e.g., 14"
                      className="mt-1.5"
                    />
                  </div>

                  <div>
                    <Label htmlFor="maxAshContent">Max Ash Content (%)</Label>
                    <Input
                      id="maxAshContent"
                      type="number"
                      value={formData.maxAshContent}
                      onChange={e =>
                        updateField("maxAshContent", e.target.value)
                      }
                      placeholder="e.g., 8"
                      className="mt-1.5"
                    />
                  </div>

                  <div>
                    <Label htmlFor="maxChlorineContent">
                      Max Chlorine Content (ppm)
                    </Label>
                    <Input
                      id="maxChlorineContent"
                      type="number"
                      value={formData.maxChlorineContent}
                      onChange={e =>
                        updateField("maxChlorineContent", e.target.value)
                      }
                      placeholder="e.g., 500"
                      className="mt-1.5"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="otherQualitySpecs">
                    Other Quality Specifications
                  </Label>
                  <Textarea
                    id="otherQualitySpecs"
                    value={formData.otherQualitySpecs}
                    onChange={e =>
                      updateField("otherQualitySpecs", e.target.value)
                    }
                    placeholder="Any additional quality requirements (particle size, contamination limits, certifications, etc.)..."
                    rows={3}
                    className="mt-1.5"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 4: Delivery Requirements */}
          {currentStep === 4 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-[#D4AF37]" />
                  Delivery Requirements
                </CardTitle>
                <CardDescription>
                  Specify delivery location and logistics preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="deliveryLocation">
                      Delivery Location *
                    </Label>
                    <Input
                      id="deliveryLocation"
                      value={formData.deliveryLocation}
                      onChange={e =>
                        updateField("deliveryLocation", e.target.value)
                      }
                      placeholder="e.g., Narrabri, NSW"
                      className="mt-1.5"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="deliveryState">State *</Label>
                    <Select
                      value={formData.deliveryState}
                      onValueChange={value =>
                        updateField("deliveryState", value)
                      }
                    >
                      <SelectTrigger className="mt-1.5">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="NSW">New South Wales</SelectItem>
                        <SelectItem value="VIC">Victoria</SelectItem>
                        <SelectItem value="QLD">Queensland</SelectItem>
                        <SelectItem value="SA">South Australia</SelectItem>
                        <SelectItem value="WA">Western Australia</SelectItem>
                        <SelectItem value="TAS">Tasmania</SelectItem>
                        <SelectItem value="NT">Northern Territory</SelectItem>
                        <SelectItem value="ACT">ACT</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="maxTransportDistance">
                      Max Transport Distance (km)
                    </Label>
                    <Input
                      id="maxTransportDistance"
                      type="number"
                      value={formData.maxTransportDistance}
                      onChange={e =>
                        updateField("maxTransportDistance", e.target.value)
                      }
                      placeholder="e.g., 200"
                      className="mt-1.5"
                    />
                    <p className="text-xs text-gray-600 mt-1">
                      Leave blank for no restriction
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="deliveryMethod">Delivery Method *</Label>
                    <Select
                      value={formData.deliveryMethod}
                      onValueChange={value =>
                        updateField("deliveryMethod", value)
                      }
                    >
                      <SelectTrigger className="mt-1.5">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ex_farm">
                          Ex Farm (Buyer arranges transport)
                        </SelectItem>
                        <SelectItem value="delivered">
                          Delivered (Supplier arranges)
                        </SelectItem>
                        <SelectItem value="fob_port">FOB Port</SelectItem>
                        <SelectItem value="negotiable">Negotiable</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 5: Pricing */}
          {currentStep === 5 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-[#D4AF37]" />
                  Pricing
                </CardTitle>
                <CardDescription>
                  Provide indicative pricing information to help suppliers
                  assess fit
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="indicativePriceMin">
                      Min Price (AUD/tonne)
                    </Label>
                    <Input
                      id="indicativePriceMin"
                      type="number"
                      value={formData.indicativePriceMin}
                      onChange={e =>
                        updateField("indicativePriceMin", e.target.value)
                      }
                      placeholder="e.g., 80"
                      className="mt-1.5"
                    />
                  </div>

                  <div>
                    <Label htmlFor="indicativePriceMax">
                      Max Price (AUD/tonne)
                    </Label>
                    <Input
                      id="indicativePriceMax"
                      type="number"
                      value={formData.indicativePriceMax}
                      onChange={e =>
                        updateField("indicativePriceMax", e.target.value)
                      }
                      placeholder="e.g., 120"
                      className="mt-1.5"
                    />
                  </div>

                  <div>
                    <Label htmlFor="pricingMechanism">
                      Pricing Mechanism *
                    </Label>
                    <Select
                      value={formData.pricingMechanism}
                      onValueChange={value =>
                        updateField("pricingMechanism", value)
                      }
                    >
                      <SelectTrigger className="mt-1.5">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fixed">Fixed Price</SelectItem>
                        <SelectItem value="indexed">
                          Indexed (CPI/commodity linked)
                        </SelectItem>
                        <SelectItem value="spot">Spot Market</SelectItem>
                        <SelectItem value="negotiable">Negotiable</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {formData.annualVolume && formData.indicativePriceMax && (
                  <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
                    <h4 className="font-medium mb-2">Estimated Annual Value</h4>
                    <div className="text-2xl font-bold font-mono text-[#D4AF37]">
                      $
                      {(
                        parseInt(formData.annualVolume) *
                        parseInt(formData.indicativePriceMax)
                      ).toLocaleString()}{" "}
                      AUD
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      Based on max price × annual volume
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Step 6: Timeline */}
          {currentStep === 6 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-[#D4AF37]" />
                  Timeline
                </CardTitle>
                <CardDescription>
                  Define supply period and response deadline
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="supplyStartDate">Supply Start Date *</Label>
                    <Input
                      id="supplyStartDate"
                      type="date"
                      value={formData.supplyStartDate}
                      onChange={e =>
                        updateField("supplyStartDate", e.target.value)
                      }
                      className="mt-1.5"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="supplyEndDate">Supply End Date</Label>
                    <Input
                      id="supplyEndDate"
                      type="date"
                      value={formData.supplyEndDate}
                      onChange={e =>
                        updateField("supplyEndDate", e.target.value)
                      }
                      className="mt-1.5"
                    />
                  </div>

                  <div>
                    <Label htmlFor="contractTerm">Contract Term (years)</Label>
                    <Input
                      id="contractTerm"
                      type="number"
                      value={formData.contractTerm}
                      onChange={e =>
                        updateField("contractTerm", e.target.value)
                      }
                      placeholder="e.g., 5"
                      className="mt-1.5"
                    />
                  </div>

                  <div>
                    <Label htmlFor="responseDeadline">
                      Response Deadline *
                    </Label>
                    <Input
                      id="responseDeadline"
                      type="date"
                      value={formData.responseDeadline}
                      onChange={e =>
                        updateField("responseDeadline", e.target.value)
                      }
                      className="mt-1.5"
                      required
                    />
                    <p className="text-xs text-gray-600 mt-1">
                      After this date, no new responses can be submitted
                    </p>
                  </div>
                </div>

                <div>
                  <Label htmlFor="sustainabilityRequirements">
                    Sustainability Requirements
                  </Label>
                  <Textarea
                    id="sustainabilityRequirements"
                    value={formData.sustainabilityRequirements}
                    onChange={e =>
                      updateField("sustainabilityRequirements", e.target.value)
                    }
                    placeholder="e.g., ISCC certified, carbon intensity < 40 gCO2e/MJ, no deforestation..."
                    rows={3}
                    className="mt-1.5"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 7: Review */}
          {currentStep === 7 && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-[#D4AF37]" />
                    Review Your Demand Signal
                  </CardTitle>
                  <CardDescription>
                    Please review all details before publishing
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Basic Info */}
                    <div className="border-b pb-4">
                      <h4 className="text-sm font-medium text-gray-600 mb-2">
                        BASIC INFORMATION
                      </h4>
                      <h3 className="text-xl font-semibold">
                        {formData.title || "Untitled Signal"}
                      </h3>
                      {formData.description && (
                        <p className="text-gray-600 mt-2">
                          {formData.description}
                        </p>
                      )}
                      <div className="flex gap-2 mt-3">
                        <Badge>
                          {getCategoryLabel(formData.feedstockCategory)}
                        </Badge>
                        <Badge variant="outline">
                          {formData.feedstockType || "Not specified"}
                        </Badge>
                      </div>
                    </div>

                    {/* Volume */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 border-b pb-4">
                      <div>
                        <div className="text-sm text-gray-600">
                          Annual Volume
                        </div>
                        <div className="font-semibold font-mono">
                          {formData.annualVolume
                            ? `${parseInt(formData.annualVolume).toLocaleString()} t`
                            : "—"}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">
                          Flexibility
                        </div>
                        <div className="font-semibold">
                          {formData.volumeFlexibility
                            ? `±${formData.volumeFlexibility}%`
                            : "—"}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">
                          Frequency
                        </div>
                        <div className="font-semibold capitalize">
                          {formData.deliveryFrequency}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">
                          Contract Term
                        </div>
                        <div className="font-semibold">
                          {formData.contractTerm
                            ? `${formData.contractTerm} years`
                            : "—"}
                        </div>
                      </div>
                    </div>

                    {/* Location & Delivery */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 border-b pb-4">
                      <div>
                        <div className="text-sm text-gray-600">
                          Delivery Location
                        </div>
                        <div className="font-semibold">
                          {formData.deliveryLocation}, {formData.deliveryState}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">
                          Delivery Method
                        </div>
                        <div className="font-semibold capitalize">
                          {formData.deliveryMethod.replace("_", " ")}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">
                          Max Distance
                        </div>
                        <div className="font-semibold">
                          {formData.maxTransportDistance
                            ? `${formData.maxTransportDistance} km`
                            : "No limit"}
                        </div>
                      </div>
                    </div>

                    {/* Pricing */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 border-b pb-4">
                      <div>
                        <div className="text-sm text-gray-600">
                          Price Range
                        </div>
                        <div className="font-semibold font-mono">
                          {formData.indicativePriceMin &&
                          formData.indicativePriceMax
                            ? `$${formData.indicativePriceMin} - $${formData.indicativePriceMax}/t`
                            : "Not specified"}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">
                          Pricing Mechanism
                        </div>
                        <div className="font-semibold capitalize">
                          {formData.pricingMechanism}
                        </div>
                      </div>
                    </div>

                    {/* Timeline */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div>
                        <div className="text-sm text-gray-600">
                          Supply Start
                        </div>
                        <div className="font-semibold">
                          {formData.supplyStartDate || "Not set"}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">
                          Supply End
                        </div>
                        <div className="font-semibold">
                          {formData.supplyEndDate || "Open-ended"}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">
                          Response Deadline
                        </div>
                        <div className="font-semibold text-red-600">
                          {formData.responseDeadline || "Not set"}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between items-center mt-8 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 1}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>

            <div className="flex gap-3">
              {currentStep === STEPS.length ? (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={e => handleSubmit(e as any, "draft")}
                    disabled={createMutation.isPending}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Save Draft
                  </Button>
                  <Button
                    type="submit"
                    disabled={
                      createMutation.isPending ||
                      !formData.title ||
                      !formData.annualVolume
                    }
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {createMutation.isPending
                      ? "Publishing..."
                      : "Publish Signal"}
                  </Button>
                </>
              ) : (
                <Button type="button" onClick={nextStep}>
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              )}
            </div>
          </div>
        </form>
      </PageContainer>
    </PageLayout>
  );
}
