/**
 * Buyer Profile - Nextgen Design
 *
 * Features:
 * - Header with icon container pattern
 * - Card-based form layout
 * - Typography components for consistent styling
 */

import { useAuth } from "@/_core/hooks/useAuth";
import { H1, Body } from "@/components/Typography";
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
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { AUSTRALIAN_STATES } from "@/const";
import { trpc } from "@/lib/trpc";
import { Loader2, ShoppingCart, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function BuyerProfile() {
  const { user, loading: authLoading } = useAuth();

  const { data: buyer, isLoading } = trpc.buyers.get.useQuery(undefined, {
    enabled: !!user,
  });

  const updateMutation = trpc.buyers.update.useMutation({
    onSuccess: () => {
      toast.success("Profile updated successfully");
    },
    onError: () => {
      toast.error("Failed to update profile");
    },
  });

  const [formData, setFormData] = useState({
    companyName: "",
    contactEmail: "",
    contactPhone: "",
    facilityName: "",
    facilityAddress: "",
    facilityLatitude: "",
    facilityLongitude: "",
    facilityState: "" as
      | "NSW"
      | "VIC"
      | "QLD"
      | "SA"
      | "WA"
      | "TAS"
      | "NT"
      | "ACT"
      | "",
    description: "",
    website: "",
  });

  useEffect(() => {
    if (buyer) {
      setFormData({
        companyName: buyer.companyName || "",
        contactEmail: buyer.contactEmail || "",
        contactPhone: buyer.contactPhone || "",
        facilityName: buyer.facilityName || "",
        facilityAddress: buyer.facilityAddress || "",
        facilityLatitude: buyer.facilityLatitude || "",
        facilityLongitude: buyer.facilityLongitude || "",
        facilityState: (buyer.facilityState as any) || "",
        description: buyer.description || "",
        website: buyer.website || "",
      });
    }
  }, [buyer]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    await updateMutation.mutateAsync({
      companyName: formData.companyName || undefined,
      contactEmail: formData.contactEmail || undefined,
      contactPhone: formData.contactPhone || undefined,
      facilityName: formData.facilityName || undefined,
      facilityAddress: formData.facilityAddress || undefined,
      facilityLatitude: formData.facilityLatitude || undefined,
      facilityLongitude: formData.facilityLongitude || undefined,
      facilityState: formData.facilityState || undefined,
      description: formData.description || undefined,
      website: formData.website || undefined,
    });
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background py-8">
        <div className="container max-w-4xl">
          <Card>
            <CardHeader>
              <Skeleton className="h-8 w-64 mb-2" />
              <Skeleton className="h-4 w-96" />
            </CardHeader>
            <CardContent className="space-y-6">
              {[1, 2, 3, 4].map(i => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!buyer) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardContent className="py-12">
            <p className="text-center text-gray-600">
              Buyer profile not found. Please complete registration first.
            </p>
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
              <ShoppingCart className="h-6 w-6 text-[#D4AF37]" />
            </div>
            <div>
              <H1 className="text-2xl">Buyer Profile</H1>
              <Body className="text-gray-600">Manage your company information and facility details</Body>
            </div>
          </div>
          <Link href="/dashboard">
            <Button variant="ghost">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Company Information</CardTitle>
            <CardDescription>
              Update your business and facility details below
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* ABN - Read Only */}
              <div>
                <Label>ABN (cannot be changed)</Label>
                <Input value={buyer.abn} disabled className="bg-muted" />
              </div>

              {/* Company Information */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="companyName">Company Name *</Label>
                  <Input
                    id="companyName"
                    value={formData.companyName}
                    onChange={e =>
                      setFormData({ ...formData, companyName: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="contactEmail">Contact Email *</Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    value={formData.contactEmail}
                    onChange={e =>
                      setFormData({ ...formData, contactEmail: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="contactPhone">Contact Phone</Label>
                  <Input
                    id="contactPhone"
                    value={formData.contactPhone}
                    onChange={e =>
                      setFormData({ ...formData, contactPhone: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    type="url"
                    value={formData.website}
                    onChange={e =>
                      setFormData({ ...formData, website: e.target.value })
                    }
                    placeholder="https://example.com"
                  />
                </div>
              </div>

              {/* Facility Information */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4">
                  Facility Information
                </h3>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="facilityName">Facility Name</Label>
                      <Input
                        id="facilityName"
                        value={formData.facilityName}
                        onChange={e =>
                          setFormData({
                            ...formData,
                            facilityName: e.target.value,
                          })
                        }
                        placeholder="e.g., Biodiesel Production Plant"
                      />
                    </div>
                    <div>
                      <Label htmlFor="facilityState">State</Label>
                      <Select
                        value={formData.facilityState}
                        onValueChange={value =>
                          setFormData({
                            ...formData,
                            facilityState: value as any,
                          })
                        }
                      >
                        <SelectTrigger id="facilityState">
                          <SelectValue placeholder="Select state" />
                        </SelectTrigger>
                        <SelectContent>
                          {AUSTRALIAN_STATES.map(state => (
                            <SelectItem key={state.value} value={state.value}>
                              {state.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="facilityAddress">Facility Address</Label>
                    <Input
                      id="facilityAddress"
                      value={formData.facilityAddress}
                      onChange={e =>
                        setFormData({
                          ...formData,
                          facilityAddress: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="facilityLatitude">Latitude</Label>
                      <Input
                        id="facilityLatitude"
                        value={formData.facilityLatitude}
                        onChange={e =>
                          setFormData({
                            ...formData,
                            facilityLatitude: e.target.value,
                          })
                        }
                        placeholder="-33.8688"
                      />
                    </div>
                    <div>
                      <Label htmlFor="facilityLongitude">Longitude</Label>
                      <Input
                        id="facilityLongitude"
                        value={formData.facilityLongitude}
                        onChange={e =>
                          setFormData({
                            ...formData,
                            facilityLongitude: e.target.value,
                          })
                        }
                        placeholder="151.2093"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <Label htmlFor="description">Company Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={e =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={4}
                  placeholder="Tell us about your company and procurement needs..."
                />
              </div>

              {/* Submit Button */}
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Save Changes
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
