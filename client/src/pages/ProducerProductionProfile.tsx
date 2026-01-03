/**
 * Producer Production Profile - Nextgen Design
 *
 * Features:
 * - Feedstock type selection with icons
 * - Current season planting details
 * - Historical yield records tracking
 * - Weather impact documentation
 * - Typography components for consistent styling
 */

import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/Button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
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
  Plus,
  Trash2,
  TrendingUp,
} from "lucide-react";
import { Link } from "wouter";
import { H1, H2, H3, Body, MetricValue } from "@/components/Typography";

interface YieldRecord {
  year: number;
  plantedArea: number;
  totalHarvest: number;
  yieldPerHa: number;
  weatherImpact: string;
  notes: string;
}

export default function ProducerProductionProfile() {
  const [, setLocation] = useLocation();
  const [feedstockType, setFeedstockType] = useState("");
  const [currentSeason, setCurrentSeason] = useState({
    plantedArea: "",
    expectedHarvest: "",
    harvestMonth: "",
  });
  const [yieldHistory, setYieldHistory] = useState<YieldRecord[]>([
    {
      year: 2024,
      plantedArea: 0,
      totalHarvest: 0,
      yieldPerHa: 0,
      weatherImpact: "normal",
      notes: "",
    },
  ]);

  const feedstockTypes = [
    { id: "sugarcane_bagasse", name: "Sugarcane Bagasse", icon: "🌾" },
    { id: "wheat_straw", name: "Wheat Straw", icon: "🌾" },
    { id: "barley_straw", name: "Barley Straw", icon: "🌾" },
    { id: "canola_stubble", name: "Canola Stubble", icon: "🌻" },
    { id: "cotton_trash", name: "Cotton Trash", icon: "🌱" },
    { id: "wood_chips", name: "Wood Chips", icon: "🪵" },
    { id: "sawdust", name: "Sawdust", icon: "🪵" },
    { id: "animal_waste", name: "Animal Waste", icon: "🐄" },
  ];

  const addYieldRecord = () => {
    const currentYear = new Date().getFullYear();
    setYieldHistory([
      ...yieldHistory,
      {
        year: currentYear - yieldHistory.length,
        plantedArea: 0,
        totalHarvest: 0,
        yieldPerHa: 0,
        weatherImpact: "normal",
        notes: "",
      },
    ]);
  };

  const removeYieldRecord = (index: number) => {
    setYieldHistory(yieldHistory.filter((_, i) => i !== index));
  };

  const updateYieldRecord = (
    index: number,
    field: keyof YieldRecord,
    value: any
  ) => {
    const updated = [...yieldHistory];
    updated[index] = { ...updated[index], [field]: value };

    // Auto-calculate yield per hectare
    if (field === "plantedArea" || field === "totalHarvest") {
      const area =
        field === "plantedArea"
          ? parseFloat(value)
          : updated[index].plantedArea;
      const harvest =
        field === "totalHarvest"
          ? parseFloat(value)
          : updated[index].totalHarvest;
      updated[index].yieldPerHa =
        area > 0 ? Math.round((harvest / area) * 10) / 10 : 0;
    }

    setYieldHistory(updated);
  };

  const calculateAverageYield = () => {
    if (yieldHistory.length === 0) return 0;
    const sum = yieldHistory.reduce(
      (acc, record) => acc + record.yieldPerHa,
      0
    );
    return Math.round((sum / yieldHistory.length) * 10) / 10;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem(
      "producerRegistration",
      JSON.stringify({
        step: 4,
        data: { feedstockType, currentSeason, yieldHistory },
      })
    );
    setLocation("/producer-registration/carbon-calculator");
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
            Step 3 of 7: Production Profile
          </div>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="bg-white border-b">
        <div className="container mx-auto py-4">
          <Progress value={42} className="h-2" />
          <p className="mt-2 text-sm text-gray-600">
            42% Complete • Estimated 8 minutes remaining
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto py-12">
        <div className="mx-auto max-w-4xl">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl text-[#0F3A5C]">
                Production Profile
              </CardTitle>
              <CardDescription>
                Tell us about your feedstock production. Historical data helps
                buyers assess reliability.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Feedstock Type Selector */}
                <div className="space-y-4">
                  <H3 className="text-[#0F3A5C]">
                    Feedstock Type *
                  </H3>
                  <div className="grid gap-3 md:grid-cols-4">
                    {feedstockTypes.map(type => (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => setFeedstockType(type.id)}
                        className={`rounded-lg border-2 p-4 text-center transition-all hover:border-[#F4C430] ${
                          feedstockType === type.id
                            ? "border-[#F4C430] bg-[#F4C430]/10"
                            : "border-gray-200"
                        }`}
                      >
                        <div className="mb-2 text-3xl">{type.icon}</div>
                        <div className="text-sm font-medium text-[#0F3A5C]">
                          {type.name}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Current Season Status */}
                <div className="space-y-4">
                  <H3 className="text-[#0F3A5C]">
                    Current Season (2024/25)
                  </H3>

                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="plantedArea">Planted Area (ha) *</Label>
                      <Input
                        id="plantedArea"
                        type="number"
                        placeholder="e.g., 450"
                        value={currentSeason.plantedArea}
                        onChange={e =>
                          setCurrentSeason(prev => ({
                            ...prev,
                            plantedArea: e.target.value,
                          }))
                        }
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="expectedHarvest">
                        Expected Harvest (tonnes) *
                      </Label>
                      <Input
                        id="expectedHarvest"
                        type="number"
                        placeholder="e.g., 36000"
                        value={currentSeason.expectedHarvest}
                        onChange={e =>
                          setCurrentSeason(prev => ({
                            ...prev,
                            expectedHarvest: e.target.value,
                          }))
                        }
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="harvestMonth">Harvest Month *</Label>
                      <Select
                        value={currentSeason.harvestMonth}
                        onValueChange={value =>
                          setCurrentSeason(prev => ({
                            ...prev,
                            harvestMonth: value,
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select month" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="jan">January</SelectItem>
                          <SelectItem value="feb">February</SelectItem>
                          <SelectItem value="mar">March</SelectItem>
                          <SelectItem value="apr">April</SelectItem>
                          <SelectItem value="may">May</SelectItem>
                          <SelectItem value="jun">June</SelectItem>
                          <SelectItem value="jul">July</SelectItem>
                          <SelectItem value="aug">August</SelectItem>
                          <SelectItem value="sep">September</SelectItem>
                          <SelectItem value="oct">October</SelectItem>
                          <SelectItem value="nov">November</SelectItem>
                          <SelectItem value="dec">December</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Historical Yield Data */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <H3 className="text-[#0F3A5C]">
                      Historical Yield Data
                    </H3>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addYieldRecord}
                      className="gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Add Year
                    </Button>
                  </div>

                  <Body className="text-sm text-gray-600">
                    Provide at least 1 year of historical data. More years =
                    better buyer confidence.
                  </Body>

                  <div className="space-y-4">
                    {yieldHistory.map((record, index) => (
                      <div
                        key={index}
                        className="rounded-lg border border-gray-200 p-4"
                      >
                        <div className="mb-3 flex items-center justify-between">
                          <span className="font-semibold text-[#0F3A5C]">
                            Season {record.year}
                          </span>
                          {yieldHistory.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeYieldRecord(index)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>

                        <div className="grid gap-4 md:grid-cols-3">
                          <div className="space-y-2">
                            <Label>Planted Area (ha)</Label>
                            <Input
                              type="number"
                              value={record.plantedArea || ""}
                              onChange={e =>
                                updateYieldRecord(
                                  index,
                                  "plantedArea",
                                  parseFloat(e.target.value) || 0
                                )
                              }
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>Total Harvest (tonnes)</Label>
                            <Input
                              type="number"
                              value={record.totalHarvest || ""}
                              onChange={e =>
                                updateYieldRecord(
                                  index,
                                  "totalHarvest",
                                  parseFloat(e.target.value) || 0
                                )
                              }
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>Yield (t/ha)</Label>
                            <Input
                              type="number"
                              value={record.yieldPerHa}
                              disabled
                              className="bg-gray-100"
                            />
                          </div>
                        </div>

                        <div className="mt-4 grid gap-4 md:grid-cols-2">
                          <div className="space-y-2">
                            <Label>Weather Impact</Label>
                            <Select
                              value={record.weatherImpact}
                              onValueChange={value =>
                                updateYieldRecord(index, "weatherImpact", value)
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="normal">
                                  Normal Conditions
                                </SelectItem>
                                <SelectItem value="drought">Drought</SelectItem>
                                <SelectItem value="flood">
                                  Flood/Excessive Rain
                                </SelectItem>
                                <SelectItem value="other">
                                  Other (specify in notes)
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label>Notes (optional)</Label>
                            <Input
                              placeholder="Any relevant details"
                              value={record.notes}
                              onChange={e =>
                                updateYieldRecord(
                                  index,
                                  "notes",
                                  e.target.value
                                )
                              }
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Average Yield Summary */}
                  {yieldHistory.length > 0 && (
                    <div className="rounded-lg border border-[#F4C430]/30 bg-[#F4C430]/5 p-4">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-[#F4C430]" />
                        <Body className="font-semibold text-[#0F3A5C]">
                          Average Yield: <MetricValue className="inline text-[#0F3A5C]">{calculateAverageYield()} t/ha</MetricValue>
                        </Body>
                        <Body className="text-sm text-gray-600">
                          (based on {yieldHistory.length}{" "}
                          {yieldHistory.length === 1 ? "year" : "years"})
                        </Body>
                      </div>
                    </div>
                  )}
                </div>

                {/* Navigation Buttons */}
                <div className="flex items-center justify-between pt-6">
                  <Link href="/producer-registration/property-details">
                    <Button type="button" variant="ghost" className="gap-2">
                      <ArrowLeft className="h-4 w-4" />
                      Back
                    </Button>
                  </Link>

                  <Button
                    type="submit"
                    className="gap-2 bg-[#F4C430] text-[#0F3A5C] hover:bg-[#F4C430]/90"
                    disabled={!feedstockType}
                  >
                    Continue to Carbon Calculator
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
