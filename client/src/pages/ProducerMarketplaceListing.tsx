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
import {
  Leaf,
  ArrowLeft,
  ArrowRight,
  DollarSign,
  Truck,
  Package,
} from "lucide-react";
import { Link } from "wouter";
import { Checkbox } from "@/components/ui/checkbox";

export default function ProducerMarketplaceListing() {
  const [, setLocation] = useLocation();
  const [listingData, setListingData] = useState({
    // Availability
    availableVolumeTonnes: "",
    minimumOrderTonnes: "",
    maximumOrderTonnes: "",
    availabilityStartDate: "",
    availabilityEndDate: "",
    // Pricing
    priceModel: "",
    basePrice: "",
    priceNegotiable: false,
    volumeDiscounts: false,
    // Logistics
    storageLocation: "",
    loadingFacilities: "",
    deliveryOptions: [] as string[],
    deliveryRadius: "",
    packagingOptions: [] as string[],
    // Quality
    moistureContent: "",
    ashContent: "",
    energyContent: "",
    qualityAssurance: "",
    certifications: [] as string[],
  });

  const toggleArrayValue = (
    field: "deliveryOptions" | "packagingOptions" | "certifications",
    value: string
  ) => {
    setListingData(prev => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter(v => v !== value)
        : [...prev[field], value],
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem(
      "producerRegistration",
      JSON.stringify({
        step: 7,
        data: { listingData },
      })
    );
    setLocation("/producer-registration/review");
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
            Step 6 of 7: Marketplace Listing
          </div>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="bg-white border-b">
        <div className="container mx-auto py-4">
          <Progress value={84} className="h-2" />
          <p className="mt-2 text-sm text-gray-600">
            84% Complete • Estimated 2 minutes remaining
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto py-12">
        <div className="mx-auto max-w-4xl">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl text-[#0F3A5C]">
                Marketplace Listing
              </CardTitle>
              <CardDescription>
                Set your pricing, delivery terms, and quality specifications for
                potential buyers.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Availability */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-[#F4C430]" />
                    <h3 className="text-lg font-semibold text-[#0F3A5C]">
                      Availability
                    </h3>
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label>Available Volume (tonnes/year) *</Label>
                      <Input
                        type="number"
                        placeholder="e.g., 10000"
                        value={listingData.availableVolumeTonnes}
                        onChange={e =>
                          setListingData(prev => ({
                            ...prev,
                            availableVolumeTonnes: e.target.value,
                          }))
                        }
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Minimum Order (tonnes) *</Label>
                      <Input
                        type="number"
                        placeholder="e.g., 100"
                        value={listingData.minimumOrderTonnes}
                        onChange={e =>
                          setListingData(prev => ({
                            ...prev,
                            minimumOrderTonnes: e.target.value,
                          }))
                        }
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Maximum Order (tonnes)</Label>
                      <Input
                        type="number"
                        placeholder="e.g., 5000"
                        value={listingData.maximumOrderTonnes}
                        onChange={e =>
                          setListingData(prev => ({
                            ...prev,
                            maximumOrderTonnes: e.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Available From *</Label>
                      <Input
                        type="date"
                        value={listingData.availabilityStartDate}
                        onChange={e =>
                          setListingData(prev => ({
                            ...prev,
                            availabilityStartDate: e.target.value,
                          }))
                        }
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Available Until *</Label>
                      <Input
                        type="date"
                        value={listingData.availabilityEndDate}
                        onChange={e =>
                          setListingData(prev => ({
                            ...prev,
                            availabilityEndDate: e.target.value,
                          }))
                        }
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Pricing */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-[#F4C430]" />
                    <h3 className="text-lg font-semibold text-[#0F3A5C]">
                      Pricing
                    </h3>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Price Model *</Label>
                      <Select
                        value={listingData.priceModel}
                        onValueChange={value =>
                          setListingData(prev => ({
                            ...prev,
                            priceModel: value,
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select model" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="fixed">Fixed Price</SelectItem>
                          <SelectItem value="market_linked">
                            Market-Linked
                          </SelectItem>
                          <SelectItem value="negotiable">Negotiable</SelectItem>
                          <SelectItem value="tender">
                            Tender/RFQ Only
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {listingData.priceModel !== "tender" && (
                      <div className="space-y-2">
                        <Label>Base Price (AUD/tonne) *</Label>
                        <Input
                          type="number"
                          placeholder="e.g., 85"
                          value={listingData.basePrice}
                          onChange={e =>
                            setListingData(prev => ({
                              ...prev,
                              basePrice: e.target.value,
                            }))
                          }
                          required={listingData.priceModel !== "tender"}
                        />
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="priceNegotiable"
                        checked={listingData.priceNegotiable}
                        onCheckedChange={checked =>
                          setListingData(prev => ({
                            ...prev,
                            priceNegotiable: checked as boolean,
                          }))
                        }
                      />
                      <Label
                        htmlFor="priceNegotiable"
                        className="cursor-pointer"
                      >
                        Price is negotiable for large volumes
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="volumeDiscounts"
                        checked={listingData.volumeDiscounts}
                        onCheckedChange={checked =>
                          setListingData(prev => ({
                            ...prev,
                            volumeDiscounts: checked as boolean,
                          }))
                        }
                      />
                      <Label
                        htmlFor="volumeDiscounts"
                        className="cursor-pointer"
                      >
                        Volume discounts available
                      </Label>
                    </div>
                  </div>
                </div>

                {/* Logistics */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Truck className="h-5 w-5 text-[#F4C430]" />
                    <h3 className="text-lg font-semibold text-[#0F3A5C]">
                      Logistics
                    </h3>
                  </div>

                  <div className="space-y-2">
                    <Label>Storage Location *</Label>
                    <Input
                      placeholder="e.g., On-farm covered shed, Burdekin QLD"
                      value={listingData.storageLocation}
                      onChange={e =>
                        setListingData(prev => ({
                          ...prev,
                          storageLocation: e.target.value,
                        }))
                      }
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Loading Facilities *</Label>
                    <Select
                      value={listingData.loadingFacilities}
                      onValueChange={value =>
                        setListingData(prev => ({
                          ...prev,
                          loadingFacilities: value,
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select facilities" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="forklift">Forklift</SelectItem>
                        <SelectItem value="front_end_loader">
                          Front-End Loader
                        </SelectItem>
                        <SelectItem value="conveyor">
                          Conveyor System
                        </SelectItem>
                        <SelectItem value="manual">Manual Loading</SelectItem>
                        <SelectItem value="rail_siding">Rail Siding</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3">
                    <Label>Delivery Options * (select all that apply)</Label>
                    <div className="grid gap-2 md:grid-cols-2">
                      {["ex_works", "delivered", "both"].map(option => (
                        <div
                          key={option}
                          className="flex items-center space-x-2"
                        >
                          <Checkbox
                            id={`delivery_${option}`}
                            checked={listingData.deliveryOptions.includes(
                              option
                            )}
                            onCheckedChange={() =>
                              toggleArrayValue("deliveryOptions", option)
                            }
                          />
                          <Label
                            htmlFor={`delivery_${option}`}
                            className="cursor-pointer"
                          >
                            {option === "ex_works" &&
                              "Ex-Works (buyer collects)"}
                            {option === "delivered" &&
                              "Delivered (seller delivers)"}
                            {option === "both" && "Both options available"}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {listingData.deliveryOptions.includes("delivered") && (
                    <div className="space-y-2">
                      <Label>Delivery Radius (km)</Label>
                      <Input
                        type="number"
                        placeholder="e.g., 200"
                        value={listingData.deliveryRadius}
                        onChange={e =>
                          setListingData(prev => ({
                            ...prev,
                            deliveryRadius: e.target.value,
                          }))
                        }
                      />
                    </div>
                  )}

                  <div className="space-y-3">
                    <Label>Packaging Options * (select all that apply)</Label>
                    <div className="grid gap-2 md:grid-cols-2">
                      {["bulk", "baled", "bagged", "chipped"].map(option => (
                        <div
                          key={option}
                          className="flex items-center space-x-2"
                        >
                          <Checkbox
                            id={`packaging_${option}`}
                            checked={listingData.packagingOptions.includes(
                              option
                            )}
                            onCheckedChange={() =>
                              toggleArrayValue("packagingOptions", option)
                            }
                          />
                          <Label
                            htmlFor={`packaging_${option}`}
                            className="cursor-pointer capitalize"
                          >
                            {option}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Quality Specifications */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-[#0F3A5C]">
                    Quality Specifications
                  </h3>

                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label>Moisture Content (%) *</Label>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="e.g., 12.5"
                        value={listingData.moistureContent}
                        onChange={e =>
                          setListingData(prev => ({
                            ...prev,
                            moistureContent: e.target.value,
                          }))
                        }
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Ash Content (%) *</Label>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="e.g., 4.2"
                        value={listingData.ashContent}
                        onChange={e =>
                          setListingData(prev => ({
                            ...prev,
                            ashContent: e.target.value,
                          }))
                        }
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Energy Content (MJ/kg) *</Label>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="e.g., 17.5"
                        value={listingData.energyContent}
                        onChange={e =>
                          setListingData(prev => ({
                            ...prev,
                            energyContent: e.target.value,
                          }))
                        }
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Quality Assurance *</Label>
                    <Select
                      value={listingData.qualityAssurance}
                      onValueChange={value =>
                        setListingData(prev => ({
                          ...prev,
                          qualityAssurance: value,
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select QA level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="lab_tested">
                          Lab Tested (every batch)
                        </SelectItem>
                        <SelectItem value="periodic_testing">
                          Periodic Testing
                        </SelectItem>
                        <SelectItem value="visual_inspection">
                          Visual Inspection
                        </SelectItem>
                        <SelectItem value="third_party_certified">
                          Third-Party Certified
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3">
                    <Label>Certifications (select all that apply)</Label>
                    <div className="grid gap-2 md:grid-cols-2">
                      {["iscc", "rsb", "organic", "iso9001", "iso14001"].map(
                        cert => (
                          <div
                            key={cert}
                            className="flex items-center space-x-2"
                          >
                            <Checkbox
                              id={`cert_${cert}`}
                              checked={listingData.certifications.includes(
                                cert
                              )}
                              onCheckedChange={() =>
                                toggleArrayValue("certifications", cert)
                              }
                            />
                            <Label
                              htmlFor={`cert_${cert}`}
                              className="cursor-pointer uppercase"
                            >
                              {cert === "iscc" && "ISCC"}
                              {cert === "rsb" && "RSB"}
                              {cert === "organic" && "Organic Certified"}
                              {cert === "iso9001" && "ISO 9001"}
                              {cert === "iso14001" && "ISO 14001"}
                            </Label>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                </div>

                {/* Navigation Buttons */}
                <div className="flex items-center justify-between pt-6">
                  <Link href="/producer-registration/contracts">
                    <Button type="button" variant="ghost" className="gap-2">
                      <ArrowLeft className="h-4 w-4" />
                      Back
                    </Button>
                  </Link>

                  <Button
                    type="submit"
                    className="gap-2 bg-[#F4C430] text-[#0F3A5C] hover:bg-[#F4C430]/90"
                  >
                    Continue to Review
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
