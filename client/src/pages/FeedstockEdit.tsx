/**
 * Feedstock Edit - Nextgen Design
 *
 * Features:
 * - Header with icon container pattern
 * - Card-based form layout
 * - Typography components for consistent styling
 */

import { Button } from "@/components/ui/Button";
import { H1, Body } from "@/components/Typography";
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
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { Loader2, Package, ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Link, useLocation, useRoute } from "wouter";

export default function FeedstockEdit() {
  const [, params] = useRoute("/feedstock/edit/:id");
  const feedstockId = params?.id ? parseInt(params.id) : 0;
  const [, setLocation] = useLocation();

  const { data: feedstock, isLoading } = trpc.feedstocks.getById.useQuery({
    id: feedstockId,
  });
  const updateMutation = trpc.feedstocks.update.useMutation();

  const [formData, setFormData] = useState({
    type: "",
    sourceName: "",
    sourceAddress: "",
    latitude: "",
    longitude: "",
    region: "",
    annualCapacityTonnes: "",
    availableVolumeCurrent: "",
    carbonIntensityValue: "",
    pricePerTonne: "",
    priceVisibility: "public" as "public" | "private" | "on_request",
    description: "",
  });

  useEffect(() => {
    if (feedstock) {
      setFormData({
        type: feedstock.type || "",
        sourceName: feedstock.sourceName || "",
        sourceAddress: feedstock.sourceAddress || "",
        latitude: feedstock.latitude || "",
        longitude: feedstock.longitude || "",
        region: feedstock.region || "",
        annualCapacityTonnes: feedstock.annualCapacityTonnes?.toString() || "",
        availableVolumeCurrent:
          feedstock.availableVolumeCurrent?.toString() || "",
        carbonIntensityValue: feedstock.carbonIntensityValue?.toString() || "",
        pricePerTonne: feedstock.pricePerTonne?.toString() || "",
        priceVisibility: (feedstock.priceVisibility as any) || "public",
        description: feedstock.description || "",
      });
    }
  }, [feedstock]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await updateMutation.mutateAsync({
        id: feedstockId,
        type: formData.type || undefined,
        sourceName: formData.sourceName || undefined,
        sourceAddress: formData.sourceAddress || undefined,
        latitude: formData.latitude || undefined,
        longitude: formData.longitude || undefined,
        region: formData.region || undefined,
        annualCapacityTonnes: formData.annualCapacityTonnes
          ? parseInt(formData.annualCapacityTonnes)
          : undefined,
        availableVolumeCurrent: formData.availableVolumeCurrent
          ? parseInt(formData.availableVolumeCurrent)
          : undefined,
        carbonIntensityValue: formData.carbonIntensityValue
          ? parseInt(formData.carbonIntensityValue)
          : undefined,
        pricePerTonne: formData.pricePerTonne
          ? parseInt(formData.pricePerTonne)
          : undefined,
        priceVisibility: formData.priceVisibility,
        description: formData.description || undefined,
      });
      toast.success("Feedstock updated successfully");
      setLocation("/supplier/feedstocks");
    } catch (error) {
      toast.error("Failed to update feedstock");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#D4AF37]" />
      </div>
    );
  }

  if (!feedstock) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardContent className="py-12">
            <p className="text-center text-gray-600">Feedstock not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#D4AF37]/10">
              <Package className="h-6 w-6 text-[#D4AF37]" />
            </div>
            <div>
              <H1 className="text-2xl">Edit Feedstock</H1>
              <Body className="text-gray-600">Update your feedstock listing details</Body>
            </div>
          </div>
          <Link href="/supplier/feedstocks">
            <Button variant="ghost">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Feedstocks
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Feedstock Details</CardTitle>
            <CardDescription>
              Category: {feedstock.category} | State: {feedstock.state}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Read-only fields */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Category (cannot be changed)</Label>
                  <Input
                    value={feedstock.category}
                    disabled
                    className="bg-muted"
                  />
                </div>
                <div>
                  <Label>State (cannot be changed)</Label>
                  <Input
                    value={feedstock.state}
                    disabled
                    className="bg-muted"
                  />
                </div>
              </div>

              {/* Type */}
              <div>
                <Label htmlFor="type">Type *</Label>
                <Input
                  id="type"
                  value={formData.type}
                  onChange={e =>
                    setFormData({ ...formData, type: e.target.value })
                  }
                  required
                />
              </div>

              {/* Source Information */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="sourceName">Source Name</Label>
                  <Input
                    id="sourceName"
                    value={formData.sourceName}
                    onChange={e =>
                      setFormData({ ...formData, sourceName: e.target.value })
                    }
                    placeholder="e.g., Smith Family Farm"
                  />
                </div>
                <div>
                  <Label htmlFor="region">Region</Label>
                  <Input
                    id="region"
                    value={formData.region}
                    onChange={e =>
                      setFormData({ ...formData, region: e.target.value })
                    }
                    placeholder="e.g., Riverina"
                  />
                </div>
              </div>

              {/* Address */}
              <div>
                <Label htmlFor="sourceAddress">Source Address</Label>
                <Input
                  id="sourceAddress"
                  value={formData.sourceAddress}
                  onChange={e =>
                    setFormData({ ...formData, sourceAddress: e.target.value })
                  }
                />
              </div>

              {/* Coordinates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="latitude">Latitude</Label>
                  <Input
                    id="latitude"
                    value={formData.latitude}
                    onChange={e =>
                      setFormData({ ...formData, latitude: e.target.value })
                    }
                    placeholder="-33.8688"
                  />
                </div>
                <div>
                  <Label htmlFor="longitude">Longitude</Label>
                  <Input
                    id="longitude"
                    value={formData.longitude}
                    onChange={e =>
                      setFormData({ ...formData, longitude: e.target.value })
                    }
                    placeholder="151.2093"
                  />
                </div>
              </div>

              {/* Capacity & Volume */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="annualCapacity">
                    Annual Capacity (tonnes) *
                  </Label>
                  <Input
                    id="annualCapacity"
                    type="number"
                    value={formData.annualCapacityTonnes}
                    onChange={e =>
                      setFormData({
                        ...formData,
                        annualCapacityTonnes: e.target.value,
                      })
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="availableVolume">
                    Available Volume (tonnes) *
                  </Label>
                  <Input
                    id="availableVolume"
                    type="number"
                    value={formData.availableVolumeCurrent}
                    onChange={e =>
                      setFormData({
                        ...formData,
                        availableVolumeCurrent: e.target.value,
                      })
                    }
                    required
                  />
                </div>
              </div>

              {/* Pricing & Carbon */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="price">Price per Tonne ($)</Label>
                  <Input
                    id="price"
                    type="number"
                    value={formData.pricePerTonne}
                    onChange={e =>
                      setFormData({
                        ...formData,
                        pricePerTonne: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="priceVisibility">Price Visibility</Label>
                  <Select
                    value={formData.priceVisibility}
                    onValueChange={value =>
                      setFormData({
                        ...formData,
                        priceVisibility: value as any,
                      })
                    }
                  >
                    <SelectTrigger id="priceVisibility">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">Public</SelectItem>
                      <SelectItem value="private">Private</SelectItem>
                      <SelectItem value="on_request">On Request</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="carbon">Carbon Intensity (gCO2e/MJ)</Label>
                  <Input
                    id="carbon"
                    type="number"
                    value={formData.carbonIntensityValue}
                    onChange={e =>
                      setFormData({
                        ...formData,
                        carbonIntensityValue: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={e =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={4}
                  placeholder="Additional details about this feedstock..."
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-4">
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Save Changes
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setLocation("/supplier/feedstocks")}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
