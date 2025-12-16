import { useState, useEffect } from "react";
import { useLocation } from "wouter";
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
import { Progress } from "@/components/ui/progress";
import {
  Leaf,
  ArrowLeft,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  Info,
} from "lucide-react";
import { Link } from "wouter";
import { Checkbox } from "@/components/ui/checkbox";

export default function ProducerCarbonCalculator() {
  const [, setLocation] = useLocation();
  const [carbonData, setCarbonData] = useState({
    // Tillage
    tillagePractice: "",
    // Fertilizer
    nitrogenKgPerHa: "",
    fertiliserType: "",
    applicationMethod: "",
    soilTestingFrequency: "",
    // Crop Protection
    herbicideApplications: "",
    pesticideApplications: "",
    integratedPestManagement: false,
    organicCertified: false,
    // Machinery & Energy
    heavyMachineryDays: "",
    tractorFuelType: "",
    annualDieselLitres: "",
    harvesterType: "",
    irrigationPumpEnergy: "",
    // Transport
    onFarmDistanceKm: "",
    transportMethod: "",
    // Land Use
    previousLandUse: "",
    coverCropping: false,
    stubbleManagement: "",
    permanentVegetationHa: "",
    carbonProject: false,
  });

  const [carbonScore, setCarbonScore] = useState({
    intensity: 0,
    rating: "",
    color: "",
  });

  // Calculate carbon intensity score in real-time
  useEffect(() => {
    let score = 50; // Base score

    // Tillage impact
    if (carbonData.tillagePractice === "no_till") score -= 10;
    else if (carbonData.tillagePractice === "minimum_till") score -= 5;
    else if (carbonData.tillagePractice === "multiple_passes") score += 10;

    // Fertilizer impact
    const nitrogen = parseFloat(carbonData.nitrogenKgPerHa) || 0;
    if (nitrogen > 200) score += 15;
    else if (nitrogen > 100) score += 8;
    else if (nitrogen < 50) score -= 5;

    if (carbonData.fertiliserType === "organic_compost") score -= 8;
    if (carbonData.applicationMethod === "variable_rate") score -= 5;
    if (carbonData.soilTestingFrequency === "annual") score -= 3;

    // Crop protection
    if (carbonData.integratedPestManagement) score -= 5;
    if (carbonData.organicCertified) score -= 15;

    // Machinery
    if (carbonData.tractorFuelType === "biodiesel_blend") score -= 5;
    else if (carbonData.tractorFuelType === "electric") score -= 10;

    const diesel = parseFloat(carbonData.annualDieselLitres) || 0;
    if (diesel > 10000) score += 10;

    if (carbonData.irrigationPumpEnergy === "solar") score -= 8;

    // Land use
    if (carbonData.previousLandUse === "existing_crop_10plus") score -= 10;
    if (carbonData.coverCropping) score -= 5;
    if (carbonData.stubbleManagement === "retain") score -= 5;
    if (carbonData.carbonProject) score -= 15;

    // Ensure score stays within bounds
    score = Math.max(10, Math.min(100, score));

    // Convert to rating
    let rating = "";
    let color = "";
    if (score < 30) {
      rating = "A+";
      color = "text-green-600";
    } else if (score < 40) {
      rating = "A";
      color = "text-green-500";
    } else if (score < 50) {
      rating = "B+";
      color = "text-yellow-600";
    } else if (score < 60) {
      rating = "B";
      color = "text-yellow-500";
    } else if (score < 70) {
      rating = "C+";
      color = "text-orange-500";
    } else if (score < 80) {
      rating = "C";
      color = "text-orange-600";
    } else {
      rating = "D";
      color = "text-red-600";
    }

    setCarbonScore({ intensity: score, rating, color });
  }, [carbonData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem(
      "producerRegistration",
      JSON.stringify({
        step: 5,
        data: { carbonData, carbonScore },
      })
    );
    setLocation("/producer-registration/contracts");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto flex h-16 items-center justify-between">
          <Link href="/">
            <a className="flex items-center gap-2 text-[#0F3A5C] hover:opacity-80">
              <Leaf className="h-6 w-6" />
              <span className="text-xl font-semibold">ABFI</span>
            </a>
          </Link>
          <div className="text-sm text-gray-600">
            Step 4 of 7: Carbon Calculator
          </div>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="bg-white border-b">
        <div className="container mx-auto py-4">
          <Progress value={56} className="h-2" />
          <p className="mt-2 text-sm text-gray-600">
            56% Complete • Estimated 6 minutes remaining
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto py-12">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Form Column */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl text-[#0F3A5C]">
                    Carbon Intensity Calculator
                  </CardTitle>
                  <CardDescription>
                    Answer these questions about your agricultural practices.
                    Your ABFI rating updates in real-time.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Tillage Practices */}
                    <div className="space-y-4">
                      <h3 className="flex items-center gap-2 text-lg font-semibold text-[#0F3A5C]">
                        Tillage Practices
                        <Info className="h-4 w-4 text-gray-400" />
                      </h3>

                      <div className="space-y-2">
                        <Label>Primary Tillage Method *</Label>
                        <Select
                          value={carbonData.tillagePractice}
                          onValueChange={value =>
                            setCarbonData(prev => ({
                              ...prev,
                              tillagePractice: value,
                            }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select tillage practice" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="no_till">
                              No-Till / Zero-Till
                            </SelectItem>
                            <SelectItem value="minimum_till">
                              Minimum Tillage
                            </SelectItem>
                            <SelectItem value="conventional">
                              Conventional Tillage
                            </SelectItem>
                            <SelectItem value="multiple_passes">
                              Multiple Passes
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Fertilizer Management */}
                    <div className="space-y-4">
                      <h3 className="flex items-center gap-2 text-lg font-semibold text-[#0F3A5C]">
                        Fertilizer Management
                      </h3>

                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label>Nitrogen Application Rate (kg/ha) *</Label>
                          <Input
                            type="number"
                            placeholder="e.g., 150"
                            value={carbonData.nitrogenKgPerHa}
                            onChange={e =>
                              setCarbonData(prev => ({
                                ...prev,
                                nitrogenKgPerHa: e.target.value,
                              }))
                            }
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Fertiliser Type *</Label>
                          <Select
                            value={carbonData.fertiliserType}
                            onValueChange={value =>
                              setCarbonData(prev => ({
                                ...prev,
                                fertiliserType: value,
                              }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="urea">Urea</SelectItem>
                              <SelectItem value="anhydrous_ammonia">
                                Anhydrous Ammonia
                              </SelectItem>
                              <SelectItem value="dap_map">DAP/MAP</SelectItem>
                              <SelectItem value="organic_compost">
                                Organic Compost
                              </SelectItem>
                              <SelectItem value="controlled_release">
                                Controlled Release
                              </SelectItem>
                              <SelectItem value="mixed_blend">
                                Mixed Blend
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Application Method *</Label>
                          <Select
                            value={carbonData.applicationMethod}
                            onValueChange={value =>
                              setCarbonData(prev => ({
                                ...prev,
                                applicationMethod: value,
                              }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select method" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="broadcast">
                                Broadcast
                              </SelectItem>
                              <SelectItem value="banded">Banded</SelectItem>
                              <SelectItem value="injected">Injected</SelectItem>
                              <SelectItem value="fertigation">
                                Fertigation
                              </SelectItem>
                              <SelectItem value="variable_rate">
                                Variable Rate
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Soil Testing Frequency *</Label>
                          <Select
                            value={carbonData.soilTestingFrequency}
                            onValueChange={value =>
                              setCarbonData(prev => ({
                                ...prev,
                                soilTestingFrequency: value,
                              }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select frequency" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="annual">Annual</SelectItem>
                              <SelectItem value="biennial">
                                Every 2 Years
                              </SelectItem>
                              <SelectItem value="rarely">Rarely</SelectItem>
                              <SelectItem value="never">Never</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                    {/* Crop Protection */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-[#0F3A5C]">
                        Crop Protection
                      </h3>

                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label>Herbicide Applications/Season *</Label>
                          <Input
                            type="number"
                            placeholder="e.g., 2"
                            value={carbonData.herbicideApplications}
                            onChange={e =>
                              setCarbonData(prev => ({
                                ...prev,
                                herbicideApplications: e.target.value,
                              }))
                            }
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Pesticide Applications/Season *</Label>
                          <Input
                            type="number"
                            placeholder="e.g., 1"
                            value={carbonData.pesticideApplications}
                            onChange={e =>
                              setCarbonData(prev => ({
                                ...prev,
                                pesticideApplications: e.target.value,
                              }))
                            }
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="ipm"
                            checked={carbonData.integratedPestManagement}
                            onCheckedChange={checked =>
                              setCarbonData(prev => ({
                                ...prev,
                                integratedPestManagement: checked as boolean,
                              }))
                            }
                          />
                          <Label htmlFor="ipm" className="cursor-pointer">
                            Integrated Pest Management (IPM) Certified
                          </Label>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="organic"
                            checked={carbonData.organicCertified}
                            onCheckedChange={checked =>
                              setCarbonData(prev => ({
                                ...prev,
                                organicCertified: checked as boolean,
                              }))
                            }
                          />
                          <Label htmlFor="organic" className="cursor-pointer">
                            Organic Certified
                          </Label>
                        </div>
                      </div>
                    </div>

                    {/* Machinery & Energy */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-[#0F3A5C]">
                        Machinery & Energy
                      </h3>

                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label>Heavy Machinery Days/Year *</Label>
                          <Input
                            type="number"
                            placeholder="e.g., 30"
                            value={carbonData.heavyMachineryDays}
                            onChange={e =>
                              setCarbonData(prev => ({
                                ...prev,
                                heavyMachineryDays: e.target.value,
                              }))
                            }
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Primary Tractor Fuel Type *</Label>
                          <Select
                            value={carbonData.tractorFuelType}
                            onValueChange={value =>
                              setCarbonData(prev => ({
                                ...prev,
                                tractorFuelType: value,
                              }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select fuel type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="diesel">Diesel</SelectItem>
                              <SelectItem value="biodiesel_blend">
                                Biodiesel Blend
                              </SelectItem>
                              <SelectItem value="electric">Electric</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Annual Diesel Consumption (litres) *</Label>
                          <Input
                            type="number"
                            placeholder="e.g., 8000"
                            value={carbonData.annualDieselLitres}
                            onChange={e =>
                              setCarbonData(prev => ({
                                ...prev,
                                annualDieselLitres: e.target.value,
                              }))
                            }
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Harvester Type *</Label>
                          <Select
                            value={carbonData.harvesterType}
                            onValueChange={value =>
                              setCarbonData(prev => ({
                                ...prev,
                                harvesterType: value,
                              }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="owned">Owned</SelectItem>
                              <SelectItem value="contractor">
                                Contractor
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Irrigation Pump Energy Source *</Label>
                          <Select
                            value={carbonData.irrigationPumpEnergy}
                            onValueChange={value =>
                              setCarbonData(prev => ({
                                ...prev,
                                irrigationPumpEnergy: value,
                              }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select source" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="grid">
                                Grid Electricity
                              </SelectItem>
                              <SelectItem value="solar">Solar</SelectItem>
                              <SelectItem value="diesel">Diesel</SelectItem>
                              <SelectItem value="none">
                                No Irrigation
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                    {/* Land Use & Sequestration */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-[#0F3A5C]">
                        Land Use & Sequestration
                      </h3>

                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label>Previous Land Use *</Label>
                          <Select
                            value={carbonData.previousLandUse}
                            onValueChange={value =>
                              setCarbonData(prev => ({
                                ...prev,
                                previousLandUse: value,
                              }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select previous use" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="native_vegetation">
                                Native Vegetation
                              </SelectItem>
                              <SelectItem value="improved_pasture">
                                Improved Pasture
                              </SelectItem>
                              <SelectItem value="other_cropping">
                                Other Cropping
                              </SelectItem>
                              <SelectItem value="plantation_forestry">
                                Plantation Forestry
                              </SelectItem>
                              <SelectItem value="existing_crop_10plus">
                                Existing Crop (10+ years)
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Stubble Management *</Label>
                          <Select
                            value={carbonData.stubbleManagement}
                            onValueChange={value =>
                              setCarbonData(prev => ({
                                ...prev,
                                stubbleManagement: value,
                              }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select method" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="retain">
                                Retain on Field
                              </SelectItem>
                              <SelectItem value="burn">Burn</SelectItem>
                              <SelectItem value="remove">Remove</SelectItem>
                              <SelectItem value="incorporate">
                                Incorporate
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Permanent Vegetation (ha)</Label>
                          <Input
                            type="number"
                            placeholder="e.g., 50"
                            value={carbonData.permanentVegetationHa}
                            onChange={e =>
                              setCarbonData(prev => ({
                                ...prev,
                                permanentVegetationHa: e.target.value,
                              }))
                            }
                          />
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="coverCrop"
                            checked={carbonData.coverCropping}
                            onCheckedChange={checked =>
                              setCarbonData(prev => ({
                                ...prev,
                                coverCropping: checked as boolean,
                              }))
                            }
                          />
                          <Label htmlFor="coverCrop" className="cursor-pointer">
                            Cover Cropping Practiced
                          </Label>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="carbonProject"
                            checked={carbonData.carbonProject}
                            onCheckedChange={checked =>
                              setCarbonData(prev => ({
                                ...prev,
                                carbonProject: checked as boolean,
                              }))
                            }
                          />
                          <Label
                            htmlFor="carbonProject"
                            className="cursor-pointer"
                          >
                            Registered Carbon Project
                          </Label>
                        </div>
                      </div>
                    </div>

                    {/* Navigation Buttons */}
                    <div className="flex items-center justify-between pt-6">
                      <Link href="/producer-registration/production-profile">
                        <Button type="button" variant="ghost" className="gap-2">
                          <ArrowLeft className="h-4 w-4" />
                          Back
                        </Button>
                      </Link>

                      <Button
                        type="submit"
                        className="gap-2 bg-[#F4C430] text-[#0F3A5C] hover:bg-[#F4C430]/90"
                      >
                        Continue to Contracts
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Score Display Column */}
            <div className="lg:col-span-1">
              <div className="sticky top-6">
                <Card className="border-2 border-[#F4C430]">
                  <CardHeader className="bg-[#F4C430]/10">
                    <CardTitle className="text-center text-[#0F3A5C]">
                      Your ABFI Rating
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <div
                        className={`mb-4 text-6xl font-bold ${carbonScore.color}`}
                      >
                        {carbonScore.rating || "—"}
                      </div>
                      <p className="mb-6 text-sm text-gray-600">
                        Carbon Intensity: {carbonScore.intensity} gCO₂e/MJ
                      </p>

                      {carbonScore.rating && (
                        <div className="space-y-3">
                          {carbonScore.intensity < 50 ? (
                            <div className="flex items-center gap-2 rounded-lg bg-green-50 p-3 text-sm text-green-700">
                              <TrendingDown className="h-5 w-5" />
                              <span>Excellent! Low carbon practices.</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 rounded-lg bg-yellow-50 p-3 text-sm text-yellow-700">
                              <TrendingUp className="h-5 w-5" />
                              <span>Room for improvement.</span>
                            </div>
                          )}

                          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-left text-sm">
                            <p className="mb-2 font-semibold text-[#0F3A5C]">
                              Improvement Tips:
                            </p>
                            <ul className="space-y-1 text-gray-600">
                              {carbonData.tillagePractice !== "no_till" && (
                                <li>• Consider no-till farming</li>
                              )}
                              {parseFloat(carbonData.nitrogenKgPerHa) > 150 && (
                                <li>• Reduce nitrogen application</li>
                              )}
                              {!carbonData.coverCropping && (
                                <li>• Implement cover cropping</li>
                              )}
                              {carbonData.tractorFuelType === "diesel" && (
                                <li>• Switch to biodiesel blend</li>
                              )}
                            </ul>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
