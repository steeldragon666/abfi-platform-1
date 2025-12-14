"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  Leaf,
  Factory,
  Truck,
  Zap,
  Package,
  TreePine,
  CheckCircle,
  Info,
} from "lucide-react";
import type { CIMethodology, CIDataQuality, FeedstockCategory } from "@/types/database";
import { DEFAULT_EMISSION_FACTORS, FOSSIL_FUEL_COMPARATOR, CI_RATING_THRESHOLDS } from "@/lib/ci/constants";

interface Feedstock {
  id: string;
  feedstock_id: string;
  name: string;
  category: FeedstockCategory;
  state: string;
}

interface CIReportWizardProps {
  supplierId: string;
  feedstocks: Feedstock[];
}

const methodologies: { value: CIMethodology; label: string; description: string }[] = [
  { value: "RED_II", label: "RED II", description: "EU Renewable Energy Directive II" },
  { value: "RTFO", label: "RTFO", description: "UK Renewable Transport Fuel Obligation" },
  { value: "ISO_14064", label: "ISO 14064", description: "GHG Quantification Standard" },
  { value: "ISCC", label: "ISCC", description: "International Sustainability & Carbon Certification" },
  { value: "RSB", label: "RSB", description: "Roundtable on Sustainable Biomaterials" },
];

const dataQualityLevels: { value: CIDataQuality; label: string; description: string }[] = [
  { value: "primary_measured", label: "Primary Measured", description: "Direct measurements from your operations" },
  { value: "industry_average", label: "Industry Average", description: "Sector-specific average values" },
  { value: "default", label: "Default Values", description: "Conservative regulatory default values" },
];

const formSchema = z.object({
  // Step 1: Basic Info
  feedstock_id: z.string().min(1, "Please select a feedstock"),
  methodology: z.enum(["RED_II", "RTFO", "ISO_14064", "ISCC", "RSB"]),
  data_quality_level: z.enum(["default", "industry_average", "primary_measured"]),
  reporting_period_start: z.string().min(1, "Start date is required"),
  reporting_period_end: z.string().min(1, "End date is required"),
  reference_year: z.number().min(2020).max(2030),

  // Step 2: Scope 1
  scope1_cultivation: z.number().min(0),
  scope1_processing: z.number().min(0),
  scope1_transport: z.number().min(0),

  // Step 3: Scope 2
  scope2_electricity: z.number().min(0),
  scope2_steam_heat: z.number().min(0),

  // Step 4: Scope 3
  scope3_upstream_inputs: z.number().min(0),
  scope3_land_use_change: z.number().min(0),
  scope3_distribution: z.number().min(0),
  scope3_end_of_life: z.number().min(0),

  // Notes
  calculation_notes: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

const steps = [
  { id: 1, title: "Basic Info", description: "Feedstock & methodology" },
  { id: 2, title: "Scope 1", description: "Direct emissions" },
  { id: 3, title: "Scope 2", description: "Energy emissions" },
  { id: 4, title: "Scope 3", description: "Value chain emissions" },
  { id: 5, title: "Review", description: "Review & submit" },
];

export function CIReportWizard({ supplierId, feedstocks }: CIReportWizardProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFeedstock, setSelectedFeedstock] = useState<Feedstock | null>(null);

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  const defaultStartDate = `${currentYear}-${String(currentMonth === 0 ? 12 : currentMonth).padStart(2, "0")}-01`;
  const defaultEndDate = new Date().toISOString().split("T")[0];

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      feedstock_id: "",
      methodology: "RED_II",
      data_quality_level: "primary_measured",
      reporting_period_start: defaultStartDate,
      reporting_period_end: defaultEndDate,
      reference_year: currentYear,
      scope1_cultivation: 0,
      scope1_processing: 0,
      scope1_transport: 0,
      scope2_electricity: 0,
      scope2_steam_heat: 0,
      scope3_upstream_inputs: 0,
      scope3_land_use_change: 0,
      scope3_distribution: 0,
      scope3_end_of_life: 0,
      calculation_notes: "",
    },
  });

  const watchedValues = form.watch();

  // Calculate totals
  const scope1Total =
    (watchedValues.scope1_cultivation || 0) +
    (watchedValues.scope1_processing || 0) +
    (watchedValues.scope1_transport || 0);

  const scope2Total =
    (watchedValues.scope2_electricity || 0) +
    (watchedValues.scope2_steam_heat || 0);

  const scope3Total =
    (watchedValues.scope3_upstream_inputs || 0) +
    (watchedValues.scope3_land_use_change || 0) +
    (watchedValues.scope3_distribution || 0) +
    (watchedValues.scope3_end_of_life || 0);

  const totalCI = scope1Total + scope2Total + scope3Total;
  const ghgSavings = ((FOSSIL_FUEL_COMPARATOR - totalCI) / FOSSIL_FUEL_COMPARATOR) * 100;

  const getCIRating = (ci: number): string => {
    for (const [rating, threshold] of Object.entries(CI_RATING_THRESHOLDS)) {
      if (ci <= threshold) return rating;
    }
    return "F";
  };

  const ciRating = getCIRating(totalCI);

  const applyDefaultValues = () => {
    if (!selectedFeedstock) return;

    const defaults = DEFAULT_EMISSION_FACTORS[selectedFeedstock.category];
    if (!defaults) return;

    form.setValue("scope1_cultivation", defaults.scope1_cultivation);
    form.setValue("scope1_processing", defaults.scope1_processing);
    form.setValue("scope1_transport", defaults.scope1_transport);
    form.setValue("scope2_electricity", defaults.scope2_electricity);
    form.setValue("scope2_steam_heat", defaults.scope2_steam_heat);
    form.setValue("scope3_upstream_inputs", defaults.scope3_upstream_inputs);
    form.setValue("scope3_land_use_change", defaults.scope3_land_use_change);
    form.setValue("scope3_distribution", defaults.scope3_distribution);
    form.setValue("scope3_end_of_life", defaults.scope3_end_of_life);

    toast.success("Default values applied based on feedstock category");
  };

  const handleFeedstockChange = (feedstockId: string) => {
    const feedstock = feedstocks.find((f) => f.id === feedstockId);
    setSelectedFeedstock(feedstock || null);
    form.setValue("feedstock_id", feedstockId);
  };

  const validateStep = async (step: number): Promise<boolean> => {
    let fieldsToValidate: (keyof FormData)[] = [];

    switch (step) {
      case 1:
        fieldsToValidate = [
          "feedstock_id",
          "methodology",
          "data_quality_level",
          "reporting_period_start",
          "reporting_period_end",
          "reference_year",
        ];
        break;
      case 2:
        fieldsToValidate = ["scope1_cultivation", "scope1_processing", "scope1_transport"];
        break;
      case 3:
        fieldsToValidate = ["scope2_electricity", "scope2_steam_heat"];
        break;
      case 4:
        fieldsToValidate = [
          "scope3_upstream_inputs",
          "scope3_land_use_change",
          "scope3_distribution",
          "scope3_end_of_life",
        ];
        break;
    }

    const result = await form.trigger(fieldsToValidate);
    return result;
  };

  const nextStep = async () => {
    const isValid = await validateStep(currentStep);
    if (isValid && currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/ci-reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          supplier_id: supplierId,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create CI report");
      }

      const result = await response.json();
      toast.success("CI Report created successfully!");
      router.push(`/supplier/ci-reports/${result.id}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create CI report");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRatingColor = (rating: string) => {
    if (rating.startsWith("A")) return "text-green-600 bg-green-100";
    if (rating.startsWith("B")) return "text-blue-600 bg-blue-100";
    if (rating.startsWith("C")) return "text-yellow-600 bg-yellow-100";
    if (rating === "D") return "text-orange-600 bg-orange-100";
    return "text-red-600 bg-red-100";
  };

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">
            Step {currentStep} of {steps.length}
          </span>
          <span className="font-medium">{steps[currentStep - 1].title}</span>
        </div>
        <Progress value={(currentStep / steps.length) * 100} className="h-2" />
        <div className="flex justify-between">
          {steps.map((step) => (
            <div
              key={step.id}
              className={`flex flex-col items-center ${
                step.id === currentStep
                  ? "text-primary"
                  : step.id < currentStep
                  ? "text-green-600"
                  : "text-muted-foreground"
              }`}
            >
              <div
                className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step.id === currentStep
                    ? "bg-primary text-primary-foreground"
                    : step.id < currentStep
                    ? "bg-green-100 text-green-600"
                    : "bg-muted"
                }`}
              >
                {step.id < currentStep ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  step.id
                )}
              </div>
              <span className="text-xs mt-1 hidden sm:block">{step.title}</span>
            </div>
          ))}
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          {/* Step 1: Basic Info */}
          {currentStep === 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Leaf className="h-5 w-5 text-green-600" />
                  Basic Information
                </CardTitle>
                <CardDescription>
                  Select the feedstock and methodology for this CI report
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="feedstock_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Feedstock</FormLabel>
                      <Select
                        onValueChange={handleFeedstockChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a feedstock" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {feedstocks.map((feedstock) => (
                            <SelectItem key={feedstock.id} value={feedstock.id}>
                              <div className="flex items-center gap-2">
                                <span>{feedstock.name}</span>
                                <Badge variant="outline" className="text-xs">
                                  {feedstock.category}
                                </Badge>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Select the feedstock this CI report is for
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="methodology"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Methodology</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select methodology" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {methodologies.map((m) => (
                              <SelectItem key={m.value} value={m.value}>
                                <div>
                                  <span className="font-medium">{m.label}</span>
                                  <span className="text-xs text-muted-foreground ml-2">
                                    {m.description}
                                  </span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="data_quality_level"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data Quality Level</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select data quality" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {dataQualityLevels.map((dq) => (
                              <SelectItem key={dq.value} value={dq.value}>
                                <div>
                                  <span className="font-medium">{dq.label}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <FormField
                    control={form.control}
                    name="reporting_period_start"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Period Start</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="reporting_period_end"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Period End</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="reference_year"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Reference Year</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) =>
                              field.onChange(parseInt(e.target.value))
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {selectedFeedstock && (
                  <div className="rounded-lg bg-muted/50 p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Info className="h-4 w-4 text-blue-500" />
                        <span className="text-sm">
                          Default values available for {selectedFeedstock.category}
                        </span>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={applyDefaultValues}
                      >
                        Apply Defaults
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Step 2: Scope 1 */}
          {currentStep === 2 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Factory className="h-5 w-5 text-orange-600" />
                  Scope 1 - Direct Emissions
                </CardTitle>
                <CardDescription>
                  Emissions from sources owned or controlled by your organization
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="scope1_cultivation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <TreePine className="h-4 w-4" />
                        Cultivation & Land Use (gCO2e/MJ)
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.1"
                          placeholder="0.0"
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseFloat(e.target.value) || 0)
                          }
                        />
                      </FormControl>
                      <FormDescription>
                        Emissions from feedstock cultivation, harvesting, and land management
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="scope1_processing"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Factory className="h-4 w-4" />
                        On-site Processing (gCO2e/MJ)
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.1"
                          placeholder="0.0"
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseFloat(e.target.value) || 0)
                          }
                        />
                      </FormControl>
                      <FormDescription>
                        Emissions from processing operations at your facilities
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="scope1_transport"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Truck className="h-4 w-4" />
                        Owned Transport (gCO2e/MJ)
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.1"
                          placeholder="0.0"
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseFloat(e.target.value) || 0)
                          }
                        />
                      </FormControl>
                      <FormDescription>
                        Emissions from company-owned vehicles
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Separator />

                <div className="flex items-center justify-between rounded-lg bg-orange-50 p-4">
                  <span className="font-medium">Scope 1 Total</span>
                  <span className="text-xl font-bold text-orange-600">
                    {scope1Total.toFixed(1)} gCO2e/MJ
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Scope 2 */}
          {currentStep === 3 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-yellow-600" />
                  Scope 2 - Energy Emissions
                </CardTitle>
                <CardDescription>
                  Indirect emissions from purchased energy
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="scope2_electricity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Zap className="h-4 w-4" />
                        Purchased Electricity (gCO2e/MJ)
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.1"
                          placeholder="0.0"
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseFloat(e.target.value) || 0)
                          }
                        />
                      </FormControl>
                      <FormDescription>
                        Emissions from grid electricity consumption
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="scope2_steam_heat"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Purchased Steam/Heat (gCO2e/MJ)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.1"
                          placeholder="0.0"
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseFloat(e.target.value) || 0)
                          }
                        />
                      </FormControl>
                      <FormDescription>
                        Emissions from purchased steam, heat, or cooling
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Separator />

                <div className="flex items-center justify-between rounded-lg bg-yellow-50 p-4">
                  <span className="font-medium">Scope 2 Total</span>
                  <span className="text-xl font-bold text-yellow-600">
                    {scope2Total.toFixed(1)} gCO2e/MJ
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 4: Scope 3 */}
          {currentStep === 4 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-purple-600" />
                  Scope 3 - Value Chain Emissions
                </CardTitle>
                <CardDescription>
                  Indirect emissions from your value chain
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="scope3_upstream_inputs"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Upstream Inputs (gCO2e/MJ)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.1"
                          placeholder="0.0"
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseFloat(e.target.value) || 0)
                          }
                        />
                      </FormControl>
                      <FormDescription>
                        Emissions from purchased goods, materials, and services
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="scope3_land_use_change"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Land Use Change (gCO2e/MJ)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.1"
                          placeholder="0.0"
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseFloat(e.target.value) || 0)
                          }
                        />
                      </FormControl>
                      <FormDescription>
                        Emissions from direct and indirect land use change (ILUC)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="scope3_distribution"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Distribution & Logistics (gCO2e/MJ)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.1"
                          placeholder="0.0"
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseFloat(e.target.value) || 0)
                          }
                        />
                      </FormControl>
                      <FormDescription>
                        Emissions from outbound logistics and distribution
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="scope3_end_of_life"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End of Life (gCO2e/MJ)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.1"
                          placeholder="0.0"
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseFloat(e.target.value) || 0)
                          }
                        />
                      </FormControl>
                      <FormDescription>
                        Emissions from end-of-life treatment of products
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Separator />

                <div className="flex items-center justify-between rounded-lg bg-purple-50 p-4">
                  <span className="font-medium">Scope 3 Total</span>
                  <span className="text-xl font-bold text-purple-600">
                    {scope3Total.toFixed(1)} gCO2e/MJ
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 5: Review */}
          {currentStep === 5 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Review & Submit
                </CardTitle>
                <CardDescription>
                  Review your CI report before submission
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Summary Card */}
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-lg border bg-card p-4 text-center">
                    <p className="text-sm text-muted-foreground">Total CI Value</p>
                    <p className="text-3xl font-bold">{totalCI.toFixed(1)}</p>
                    <p className="text-xs text-muted-foreground">gCO2e/MJ</p>
                  </div>
                  <div className="rounded-lg border bg-card p-4 text-center">
                    <p className="text-sm text-muted-foreground">CI Rating</p>
                    <Badge className={`text-lg px-3 py-1 ${getRatingColor(ciRating)}`}>
                      {ciRating}
                    </Badge>
                  </div>
                  <div className="rounded-lg border bg-card p-4 text-center">
                    <p className="text-sm text-muted-foreground">GHG Savings</p>
                    <p className={`text-3xl font-bold ${ghgSavings >= 50 ? "text-green-600" : "text-orange-600"}`}>
                      {ghgSavings.toFixed(1)}%
                    </p>
                    <p className="text-xs text-muted-foreground">vs fossil fuel</p>
                  </div>
                </div>

                {/* Scope Breakdown */}
                <div className="space-y-3">
                  <h4 className="font-medium">Emissions Breakdown</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between rounded-lg bg-orange-50 p-3">
                      <div className="flex items-center gap-2">
                        <Factory className="h-4 w-4 text-orange-600" />
                        <span>Scope 1 (Direct)</span>
                      </div>
                      <span className="font-mono font-medium">
                        {scope1Total.toFixed(1)} gCO2e/MJ
                      </span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg bg-yellow-50 p-3">
                      <div className="flex items-center gap-2">
                        <Zap className="h-4 w-4 text-yellow-600" />
                        <span>Scope 2 (Energy)</span>
                      </div>
                      <span className="font-mono font-medium">
                        {scope2Total.toFixed(1)} gCO2e/MJ
                      </span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg bg-purple-50 p-3">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-purple-600" />
                        <span>Scope 3 (Value Chain)</span>
                      </div>
                      <span className="font-mono font-medium">
                        {scope3Total.toFixed(1)} gCO2e/MJ
                      </span>
                    </div>
                  </div>
                </div>

                {/* Compliance Status */}
                <div className="space-y-3">
                  <h4 className="font-medium">Compliance Status</h4>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant={ghgSavings >= 65 ? "default" : "secondary"}>
                      RED II: {ghgSavings >= 65 ? "Compliant" : "Not Compliant"}
                    </Badge>
                    <Badge variant={ghgSavings >= 60 ? "default" : "secondary"}>
                      RTFO: {ghgSavings >= 60 ? "Compliant" : "Not Compliant"}
                    </Badge>
                    <Badge variant={ghgSavings >= 50 ? "default" : "secondary"}>
                      CFP: {ghgSavings >= 50 ? "Compliant" : "Not Compliant"}
                    </Badge>
                  </div>
                </div>

                {/* Notes */}
                <FormField
                  control={form.control}
                  name="calculation_notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Calculation Notes (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Add any notes about your calculation methodology, data sources, or assumptions..."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          )}

          {/* Navigation */}
          <div className="flex justify-between pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 1}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Previous
            </Button>

            {currentStep < steps.length ? (
              <Button type="button" onClick={nextStep}>
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Create Report
                  </>
                )}
              </Button>
            )}
          </div>
        </form>
      </Form>
    </div>
  );
}
