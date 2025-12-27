import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FileText,
  Package,
  MapPin,
  Calendar,
  Building2,
  Mail,
  Phone,
  CheckCircle,
  ArrowLeft,
} from "lucide-react";
import { Link, useLocation, useSearch } from "wouter";

// Zod validation schema
const quoteRequestSchema = z.object({
  feedstockType: z.string().min(1, "Please select a feedstock type"),
  volume: z.string().min(1, "Volume is required").refine((val) => {
    const num = parseFloat(val);
    return !isNaN(num) && num > 0;
  }, "Volume must be a positive number"),
  volumeUnit: z.string().min(1, "Please select a unit"),
  deliveryLocation: z.string().min(3, "Delivery location is required"),
  deliveryState: z.string().min(1, "Please select a state"),
  requiredByDate: z.string().min(1, "Required by date is required"),
  companyName: z.string().min(2, "Company name is required"),
  abn: z.string().regex(/^\d{11}$/, "ABN must be 11 digits"),
  contactName: z.string().min(2, "Contact name is required"),
  contactEmail: z.string().email("Please enter a valid email address"),
  contactPhone: z.string().regex(/^(\+61|0)[2-478](\d{8}|\d{4}\s\d{4})$/, "Please enter a valid Australian phone number"),
  additionalNotes: z.string().optional(),
});

type QuoteRequestFormData = z.infer<typeof quoteRequestSchema>;

const feedstockTypes = [
  { value: "ethanol", label: "Ethanol" },
  { value: "biodiesel", label: "Biodiesel" },
  { value: "woodchip", label: "Woodchip" },
  { value: "bagasse", label: "Bagasse" },
  { value: "wheat-straw", label: "Wheat Straw" },
];

const volumeUnits = [
  { value: "L", label: "Litres (L)" },
  { value: "kL", label: "Kilolitres (kL)" },
  { value: "ML", label: "Megalitres (ML)" },
  { value: "t", label: "Tonnes (t)" },
  { value: "kt", label: "Kilotonnes (kt)" },
];

const australianStates = [
  { value: "NSW", label: "New South Wales" },
  { value: "VIC", label: "Victoria" },
  { value: "QLD", label: "Queensland" },
  { value: "SA", label: "South Australia" },
  { value: "WA", label: "Western Australia" },
  { value: "TAS", label: "Tasmania" },
  { value: "NT", label: "Northern Territory" },
  { value: "ACT", label: "Australian Capital Territory" },
];

export default function QuoteRequest() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [, setLocation] = useLocation();
  const searchString = useSearch();
  const params = new URLSearchParams(searchString);
  const supplierId = params.get("supplier");

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<QuoteRequestFormData>({
    resolver: zodResolver(quoteRequestSchema),
    defaultValues: {
      feedstockType: "",
      volume: "",
      volumeUnit: "kL",
      deliveryLocation: "",
      deliveryState: "",
      requiredByDate: "",
      companyName: "",
      abn: "",
      contactName: "",
      contactEmail: "",
      contactPhone: "",
      additionalNotes: "",
    },
  });

  const onSubmit = async (data: QuoteRequestFormData) => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    console.log("Quote request submitted:", data);
    setIsSubmitted(true);
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container py-8 max-w-2xl">
          <Card className="text-center">
            <CardContent className="pt-12 pb-8">
              <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-6">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Quote Request Submitted</h2>
              <p className="text-gray-600 mb-6">
                Your request has been sent to the supplier. You'll receive a response within 2-3 business days.
              </p>
              <div className="flex gap-3 justify-center">
                <Link href="/supplier-directory">
                  <Button variant="outline">Browse More Suppliers</Button>
                </Link>
                <Link href="/browse">
                  <Button className="bg-[#D4AF37] text-black hover:bg-[#E5C158]">
                    Explore Feedstocks
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8 max-w-3xl">
        {/* Back button */}
        <Button
          variant="ghost"
          className="mb-4"
          onClick={() => setLocation("/supplier-directory")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Suppliers
        </Button>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <FileText className="h-8 w-8 text-[#D4AF37]" />
            <h1 className="text-3xl font-bold">Request a Quote</h1>
          </div>
          <p className="text-gray-600">
            Fill in your requirements below and we'll connect you with verified suppliers.
            {supplierId && (
              <span className="ml-1 text-[#D4AF37]">
                (Supplier #{supplierId} selected)
              </span>
            )}
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          {/* Feedstock Requirements */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-[#D4AF37]" />
                Feedstock Requirements
              </CardTitle>
              <CardDescription>
                Specify the type and quantity of feedstock you need
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="feedstockType">Feedstock Type *</Label>
                  <Select
                    onValueChange={(value) => setValue("feedstockType", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select feedstock type" />
                    </SelectTrigger>
                    <SelectContent>
                      {feedstockTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.feedstockType && (
                    <p className="text-sm text-red-500">{errors.feedstockType.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="volume">Volume Required *</Label>
                  <div className="flex gap-2">
                    <Input
                      id="volume"
                      type="number"
                      placeholder="Enter quantity"
                      {...register("volume")}
                      className="flex-1"
                    />
                    <Select
                      defaultValue="kL"
                      onValueChange={(value) => setValue("volumeUnit", value)}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {volumeUnits.map((unit) => (
                          <SelectItem key={unit.value} value={unit.value}>
                            {unit.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {errors.volume && (
                    <p className="text-sm text-red-500">{errors.volume.message}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Delivery Details */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-[#D4AF37]" />
                Delivery Details
              </CardTitle>
              <CardDescription>
                Where and when do you need the feedstock delivered?
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="deliveryLocation">Delivery Address *</Label>
                  <Input
                    id="deliveryLocation"
                    placeholder="Street address or facility name"
                    {...register("deliveryLocation")}
                  />
                  {errors.deliveryLocation && (
                    <p className="text-sm text-red-500">{errors.deliveryLocation.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="deliveryState">State *</Label>
                  <Select
                    onValueChange={(value) => setValue("deliveryState", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select state" />
                    </SelectTrigger>
                    <SelectContent>
                      {australianStates.map((state) => (
                        <SelectItem key={state.value} value={state.value}>
                          {state.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.deliveryState && (
                    <p className="text-sm text-red-500">{errors.deliveryState.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="requiredByDate">Required By Date *</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <Input
                    id="requiredByDate"
                    type="date"
                    {...register("requiredByDate")}
                    className="pl-10"
                    min={new Date().toISOString().split("T")[0]}
                  />
                </div>
                {errors.requiredByDate && (
                  <p className="text-sm text-red-500">{errors.requiredByDate.message}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Company Information */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-[#D4AF37]" />
                Company Information
              </CardTitle>
              <CardDescription>
                Your business details for the quote
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Company Name *</Label>
                  <Input
                    id="companyName"
                    placeholder="Your company name"
                    {...register("companyName")}
                  />
                  {errors.companyName && (
                    <p className="text-sm text-red-500">{errors.companyName.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="abn">ABN *</Label>
                  <Input
                    id="abn"
                    placeholder="11 digit ABN"
                    maxLength={11}
                    {...register("abn")}
                  />
                  {errors.abn && (
                    <p className="text-sm text-red-500">{errors.abn.message}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Details */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-[#D4AF37]" />
                Contact Details
              </CardTitle>
              <CardDescription>
                How should suppliers reach you?
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="contactName">Contact Name *</Label>
                <Input
                  id="contactName"
                  placeholder="Your full name"
                  {...register("contactName")}
                />
                {errors.contactName && (
                  <p className="text-sm text-red-500">{errors.contactName.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contactEmail">Email Address *</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <Input
                      id="contactEmail"
                      type="email"
                      placeholder="you@company.com"
                      {...register("contactEmail")}
                      className="pl-10"
                    />
                  </div>
                  {errors.contactEmail && (
                    <p className="text-sm text-red-500">{errors.contactEmail.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contactPhone">Phone Number *</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <Input
                      id="contactPhone"
                      type="tel"
                      placeholder="04XX XXX XXX"
                      {...register("contactPhone")}
                      className="pl-10"
                    />
                  </div>
                  {errors.contactPhone && (
                    <p className="text-sm text-red-500">{errors.contactPhone.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="additionalNotes">Additional Notes (Optional)</Label>
                <Textarea
                  id="additionalNotes"
                  placeholder="Any specific requirements, certifications needed, or other details..."
                  rows={4}
                  {...register("additionalNotes")}
                />
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex gap-3 justify-end">
            <Link href="/supplier-directory">
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </Link>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-[#D4AF37] text-black hover:bg-[#E5C158]"
            >
              {isSubmitting ? "Submitting..." : "Submit Quote Request"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
