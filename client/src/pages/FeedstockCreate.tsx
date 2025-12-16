import { useAuth } from "@/_core/hooks/useAuth";
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
import { AUSTRALIAN_STATES, FEEDSTOCK_CATEGORIES } from "@/const";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Leaf, Package } from "lucide-react";
import { useState } from "react";
import { Link, Redirect, useLocation } from "wouter";
import { toast } from "sonner";

export default function FeedstockCreate() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  // Check if user is a supplier
  const { data: profile } = trpc.auth.getProfile.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  // Form state
  const [category, setCategory] = useState("");
  const [type, setType] = useState("");
  const [description, setDescription] = useState("");
  const [state, setState] = useState("");
  const [locationDescription, setLocationDescription] = useState("");
  const [annualCapacity, setAnnualCapacity] = useState("");
  const [availableVolume, setAvailableVolume] = useState("");
  const [pricePerTonne, setPricePerTonne] = useState("");
  const [carbonIntensity, setCarbonIntensity] = useState("");
  const [moistureContent, setMoistureContent] = useState("");
  const [productionMethod, setProductionMethod] = useState("");

  const createMutation = trpc.feedstocks.create.useMutation({
    onSuccess: () => {
      toast.success(
        "Feedstock created successfully! Pending admin verification."
      );
      setLocation("/dashboard");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create feedstock");
    },
  });

  const handleSubmit = () => {
    if (!profile?.supplier) {
      toast.error("Supplier profile required");
      return;
    }

    const payload: any = {
      category: category as any,
      type,
      description: description || undefined,
      state: state as any,
      locationDescription: locationDescription || undefined,
      annualCapacityTonnes: parseInt(annualCapacity),
      availableVolumeCurrent: parseInt(availableVolume),
      pricePerTonne: pricePerTonne ? parseFloat(pricePerTonne) : undefined,
      carbonIntensityValue: carbonIntensity
        ? parseFloat(carbonIntensity)
        : undefined,
      moistureContent: moistureContent
        ? parseFloat(moistureContent)
        : undefined,
    };

    if (productionMethod) {
      payload.productionMethod = productionMethod as
        | "crop"
        | "waste"
        | "residue"
        | "processing_byproduct";
    }

    createMutation.mutate(payload);
  };

  const canSubmit =
    category &&
    type &&
    state &&
    annualCapacity &&
    availableVolume &&
    parseInt(annualCapacity) > 0 &&
    parseInt(availableVolume) > 0;

  if (!isAuthenticated) {
    return <Redirect to="/dashboard" />;
  }

  if (!profile?.supplier) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Supplier Profile Required</CardTitle>
            <CardDescription>
              You need to register as a supplier before creating feedstock
              listings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/supplier/register">
              <Button className="w-full">Register as Supplier</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/">
            <div className="flex items-center gap-2 cursor-pointer">
              <Leaf className="h-8 w-8 text-primary" />
              <span className="text-2xl font-bold text-primary">ABFI</span>
            </div>
          </Link>
          <Link href="/dashboard">
            <Button variant="ghost">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Package className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold text-primary">
              List New Feedstock
            </h1>
          </div>
          <p className="text-gray-600">
            Add a new feedstock to the ABFI marketplace
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Feedstock Details</CardTitle>
            <CardDescription>
              Provide information about your feedstock supply. All listings are
              subject to admin verification before going live.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Basic Information</h3>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">Feedstock Category *</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger id="category">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {FEEDSTOCK_CATEGORIES.map(cat => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="type">Specific Type *</Label>
                  <Input
                    id="type"
                    placeholder="e.g., Canola, UCO Grade A, Bamboo P-Grade"
                    value={type}
                    onChange={e => setType(e.target.value)}
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Be specific about the feedstock variety or grade
                  </p>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe your feedstock, production process, certifications, and any unique qualities..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={4}
                />
              </div>
            </div>

            {/* Location */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Location</h3>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="state">State *</Label>
                  <Select value={state} onValueChange={setState}>
                    <SelectTrigger id="state">
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

                <div>
                  <Label htmlFor="locationDescription">
                    Location Description
                  </Label>
                  <Input
                    id="locationDescription"
                    placeholder="e.g., Central NSW, 200km from Sydney"
                    value={locationDescription}
                    onChange={e => setLocationDescription(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Supply Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Supply Details</h3>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="annualCapacity">
                    Annual Capacity (tonnes) *
                  </Label>
                  <Input
                    id="annualCapacity"
                    type="number"
                    placeholder="e.g., 5000"
                    value={annualCapacity}
                    onChange={e => setAnnualCapacity(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="availableVolume">
                    Currently Available (tonnes) *
                  </Label>
                  <Input
                    id="availableVolume"
                    type="number"
                    placeholder="e.g., 1000"
                    value={availableVolume}
                    onChange={e => setAvailableVolume(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="pricePerTonne">Price per Tonne (AUD)</Label>
                  <Input
                    id="pricePerTonne"
                    type="number"
                    step="0.01"
                    placeholder="e.g., 450.00"
                    value={pricePerTonne}
                    onChange={e => setPricePerTonne(e.target.value)}
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Optional - can be negotiated with buyers
                  </p>
                </div>

                <div>
                  <Label htmlFor="productionMethod">Production Method</Label>
                  <Select
                    value={productionMethod}
                    onValueChange={setProductionMethod}
                  >
                    <SelectTrigger id="productionMethod">
                      <SelectValue placeholder="Select method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="crop">Crop</SelectItem>
                      <SelectItem value="waste">Waste Collection</SelectItem>
                      <SelectItem value="byproduct">
                        Industrial Byproduct
                      </SelectItem>
                      <SelectItem value="forestry">Forestry</SelectItem>
                      <SelectItem value="aquaculture">Aquaculture</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Quality Metrics */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Quality Metrics</h3>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="carbonIntensity">
                    Carbon Intensity (gCO2e/MJ)
                  </Label>
                  <Input
                    id="carbonIntensity"
                    type="number"
                    step="0.1"
                    placeholder="e.g., 25.5"
                    value={carbonIntensity}
                    onChange={e => setCarbonIntensity(e.target.value)}
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Lower values receive higher ABFI ratings
                  </p>
                </div>

                <div>
                  <Label htmlFor="moistureContent">Moisture Content (%)</Label>
                  <Input
                    id="moistureContent"
                    type="number"
                    step="0.1"
                    placeholder="e.g., 8.5"
                    value={moistureContent}
                    onChange={e => setMoistureContent(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">
                After Submission
              </h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>
                  • Your feedstock will be reviewed by ABFI administrators
                </li>
                <li>
                  • Upload certificates and quality test reports to improve your
                  ABFI rating
                </li>
                <li>• Once verified, your listing will be visible to buyers</li>
                <li>
                  • You'll receive inquiries from interested buyers via the
                  platform
                </li>
              </ul>
            </div>

            {/* Submit */}
            <div className="flex justify-end gap-2 pt-4">
              <Link href="/dashboard">
                <Button variant="outline">Cancel</Button>
              </Link>
              <Button
                onClick={handleSubmit}
                disabled={!canSubmit || createMutation.isPending}
              >
                {createMutation.isPending ? "Creating..." : "Create Feedstock"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
