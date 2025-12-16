import { useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Leaf, ArrowLeft, ArrowRight, Upload } from "lucide-react";
import { Link } from "wouter";

export default function ProducerPropertyDetails() {
  const [, setLocation] = useLocation();
  const [formData, setFormData] = useState({
    propertyName: "",
    address: "",
    postcode: "",
    state: "",
    region: "",
    totalLandArea: "",
    cultivatedArea: "",
    propertyType: "",
    waterAccessType: "",
    lotPlanNumbers: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem(
      "producerRegistration",
      JSON.stringify({
        step: 3,
        data: { ...formData },
      })
    );
    setLocation("/producer-registration/production-profile");
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
            Step 2 of 7: Property Details
          </div>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="bg-white border-b">
        <div className="container mx-auto py-4">
          <Progress value={28} className="h-2" />
          <p className="mt-2 text-sm text-gray-600">
            28% Complete • Estimated 10 minutes remaining
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto py-12">
        <div className="mx-auto max-w-3xl">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl text-[#0F3A5C]">
                Property Details
              </CardTitle>
              <CardDescription>
                Tell us about your property. This helps buyers understand your
                production capacity and logistics.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Property Identification */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-[#0F3A5C]">
                    Property Identification
                  </h3>

                  <div className="space-y-2">
                    <Label htmlFor="propertyName">Property Name *</Label>
                    <Input
                      id="propertyName"
                      placeholder="e.g., Sunshine Farm"
                      value={formData.propertyName}
                      onChange={e =>
                        setFormData(prev => ({
                          ...prev,
                          propertyName: e.target.value,
                        }))
                      }
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">Primary Address *</Label>
                    <Textarea
                      id="address"
                      placeholder="Street address, locality"
                      value={formData.address}
                      onChange={e =>
                        setFormData(prev => ({
                          ...prev,
                          address: e.target.value,
                        }))
                      }
                      required
                      rows={2}
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="state">State *</Label>
                      <Select
                        value={formData.state}
                        onValueChange={value =>
                          setFormData(prev => ({ ...prev, state: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select state" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="QLD">Queensland</SelectItem>
                          <SelectItem value="NSW">New South Wales</SelectItem>
                          <SelectItem value="VIC">Victoria</SelectItem>
                          <SelectItem value="SA">South Australia</SelectItem>
                          <SelectItem value="WA">Western Australia</SelectItem>
                          <SelectItem value="TAS">Tasmania</SelectItem>
                          <SelectItem value="NT">Northern Territory</SelectItem>
                          <SelectItem value="ACT">ACT</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="postcode">Postcode *</Label>
                      <Input
                        id="postcode"
                        placeholder="4000"
                        maxLength={4}
                        value={formData.postcode}
                        onChange={e =>
                          setFormData(prev => ({
                            ...prev,
                            postcode: e.target.value.replace(/\D/g, ""),
                          }))
                        }
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="region">Region</Label>
                      <Input
                        id="region"
                        placeholder="e.g., Burdekin"
                        value={formData.region}
                        onChange={e =>
                          setFormData(prev => ({
                            ...prev,
                            region: e.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>
                </div>

                {/* Land Details */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-[#0F3A5C]">
                    Land Details
                  </h3>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="totalLandArea">
                        Total Land Area (hectares) *
                      </Label>
                      <Input
                        id="totalLandArea"
                        type="number"
                        placeholder="e.g., 500"
                        value={formData.totalLandArea}
                        onChange={e =>
                          setFormData(prev => ({
                            ...prev,
                            totalLandArea: e.target.value,
                          }))
                        }
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="cultivatedArea">
                        Cultivated Area (hectares) *
                      </Label>
                      <Input
                        id="cultivatedArea"
                        type="number"
                        placeholder="e.g., 450"
                        value={formData.cultivatedArea}
                        onChange={e =>
                          setFormData(prev => ({
                            ...prev,
                            cultivatedArea: e.target.value,
                          }))
                        }
                        required
                      />
                      <p className="text-xs text-gray-600">
                        Area actively used for crop production
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="propertyType">Property Type *</Label>
                    <Select
                      value={formData.propertyType}
                      onValueChange={value =>
                        setFormData(prev => ({ ...prev, propertyType: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select property type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="freehold">Freehold</SelectItem>
                        <SelectItem value="leasehold">Leasehold</SelectItem>
                        <SelectItem value="mixed">
                          Mixed (Freehold + Leasehold)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="waterAccessType">Water Access Type *</Label>
                    <Select
                      value={formData.waterAccessType}
                      onValueChange={value =>
                        setFormData(prev => ({
                          ...prev,
                          waterAccessType: value,
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select water access" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="irrigated_surface">
                          Irrigated (Surface Water)
                        </SelectItem>
                        <SelectItem value="irrigated_groundwater">
                          Irrigated (Groundwater)
                        </SelectItem>
                        <SelectItem value="irrigated_recycled">
                          Irrigated (Recycled Water)
                        </SelectItem>
                        <SelectItem value="dryland">
                          Dryland (Rainfed)
                        </SelectItem>
                        <SelectItem value="mixed_irrigation">
                          Mixed Irrigation Sources
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Legal Identifiers */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-[#0F3A5C]">
                    Legal Identifiers (Optional)
                  </h3>

                  <div className="space-y-2">
                    <Label htmlFor="lotPlanNumbers">Lot/Plan Numbers</Label>
                    <Textarea
                      id="lotPlanNumbers"
                      placeholder="e.g., Lot 123 on RP456789, Lot 124 on RP456790"
                      value={formData.lotPlanNumbers}
                      onChange={e =>
                        setFormData(prev => ({
                          ...prev,
                          lotPlanNumbers: e.target.value,
                        }))
                      }
                      rows={2}
                    />
                    <p className="text-xs text-gray-600">
                      Helps with property verification
                    </p>
                  </div>

                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <Label className="mb-2 block">Property Boundary File</Label>
                    <p className="mb-3 text-sm text-gray-600">
                      Upload KML or Shapefile to show exact property boundaries
                      (optional but recommended)
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="gap-2"
                    >
                      <Upload className="h-4 w-4" />
                      Upload Boundary File
                    </Button>
                  </div>
                </div>

                {/* Navigation Buttons */}
                <div className="flex items-center justify-between pt-6">
                  <Link href="/producer-registration/property-map">
                    <Button type="button" variant="ghost" className="gap-2">
                      <ArrowLeft className="h-4 w-4" />
                      Back
                    </Button>
                  </Link>

                  <Button
                    type="submit"
                    className="gap-2 bg-[#F4C430] text-[#0F3A5C] hover:bg-[#F4C430]/90"
                  >
                    Continue to Production Profile
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
