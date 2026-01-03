/**
 * Supplier Registration - Nextgen Design
 *
 * Features:
 * - Multi-step registration wizard
 * - Business details and ABN validation
 * - Location and capacity settings
 * - Typography components for consistent styling
 */

import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { Badge } from "@/components/ui/badge";
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
import { AUSTRALIAN_STATES } from "@/const";
import { trpc } from "@/lib/trpc";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CheckCircle2,
  Leaf,
  MapPin,
  Settings,
  Info,
} from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { H1, H3, Body } from "@/components/Typography";

type Step = 1 | 2 | 3;

export default function SupplierRegistration() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [currentStep, setCurrentStep] = useState<Step>(1);

  // Form state
  const [abn, setAbn] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [contactEmail, setContactEmail] = useState(user?.email || "");
  const [contactPhone, setContactPhone] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [postcode, setPostcode] = useState("");
  const [website, setWebsite] = useState("");
  const [description, setDescription] = useState("");
  const [operationScale, setOperationScale] = useState("");
  const [annualCapacity, setAnnualCapacity] = useState("");

  const registerMutation = trpc.suppliers.create.useMutation({
    onSuccess: () => {
      toast.success("Supplier registration submitted successfully!");
      setLocation("/dashboard");
    },
    onError: (error: any) => {
      toast.error(error.message || "Registration failed");
    },
  });

  const handleSubmit = () => {
    registerMutation.mutate({
      abn,
      companyName,
      contactEmail,
      contactPhone: contactPhone || undefined,
      addressLine1: addressLine1 || undefined,
      addressLine2: addressLine2 || undefined,
      city: city || undefined,
      state: state as
        | "NSW"
        | "VIC"
        | "QLD"
        | "SA"
        | "WA"
        | "TAS"
        | "NT"
        | "ACT"
        | undefined,
      postcode: postcode || undefined,
      website: website || undefined,
      description: description || undefined,
    });
  };

  const canProceedStep1 = abn.length === 11 && companyName && contactEmail;
  const canProceedStep2 = addressLine1 && city && state && postcode;

  const stepIcons = [Building2, MapPin, Settings];
  const stepLabels = ["Company Info", "Address", "Operations"];

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card variant="elevated" className="max-w-md">
          <CardHeader className="text-center">
            <div className="p-3 rounded-xl bg-[#D4AF37]/10 w-fit mx-auto mb-4">
              <Building2 className="h-8 w-8 text-[#D4AF37]" />
            </div>
            <H3>Authentication Required</H3>
            <Body className="text-muted-foreground">
              Please sign in to register as a supplier
            </Body>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-md sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/">
            <div className="flex items-center gap-2 cursor-pointer group">
              <div className="p-1.5 rounded-lg bg-[#D4AF37]/10 group-hover:bg-[#D4AF37]/20 transition-colors">
                <Leaf className="h-6 w-6 text-[#D4AF37]" />
              </div>
              <span className="text-xl font-bold text-foreground">ABFI</span>
            </div>
          </Link>
          <Link href="/dashboard">
            <Button
              variant="ghost"
              leftIcon={<ArrowLeft className="h-4 w-4" />}
            >
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Page Header */}
        <div className="mb-8 text-center">
          <Badge variant="outline" className="mb-4">
            <Building2 className="h-3.5 w-3.5 mr-1.5" />
            Supplier Registration
          </Badge>
          <H1 className="text-foreground mb-2">
            Register as a Bamboo Supplier
          </H1>
          <Body size="lg" className="text-gray-600 max-w-xl mx-auto">
            Join Australia's leading bamboo and biomass feedstock marketplace.
            Connect with verified buyers seeking sustainable Australian feedstocks.
          </Body>
        </div>

        {/* Progress Steps */}
        <div className="mb-10">
          <div className="flex items-center justify-between">
            {[1, 2, 3].map(step => {
              const StepIcon = stepIcons[step - 1];
              return (
                <div key={step} className="flex items-center flex-1">
                  <div
                    className={cn(
                      "flex items-center justify-center w-12 h-12 rounded-xl border-2 transition-all",
                      currentStep >= step
                        ? "bg-primary border-primary text-[#D4AF37]-foreground shadow-md"
                        : "bg-card border-border text-gray-600"
                    )}
                  >
                    {currentStep > step ? (
                      <CheckCircle2 className="h-6 w-6" />
                    ) : (
                      <StepIcon className="h-5 w-5" />
                    )}
                  </div>
                  {step < 3 && (
                    <div
                      className={cn(
                        "flex-1 h-1 mx-3 rounded-full transition-colors",
                        currentStep > step ? "bg-primary" : "bg-border"
                      )}
                    />
                  )}
                </div>
              );
            })}
          </div>
          <div className="flex justify-between mt-3">
            {stepLabels.map((label, i) => (
              <span
                key={label}
                className={cn(
                  "text-sm font-medium transition-colors",
                  currentStep >= i + 1
                    ? "text-foreground"
                    : "text-gray-600"
                )}
              >
                {label}
              </span>
            ))}
          </div>
        </div>

        {/* Step 1: Company Information */}
        {currentStep === 1 && (
          <Card variant="elevated">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[#D4AF37]/10">
                  <Building2 className="h-5 w-5 text-[#D4AF37]" />
                </div>
                <div>
                  <CardTitle>Company Information</CardTitle>
                  <CardDescription>
                    Provide your company details and primary contact information
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="abn">Australian Business Number (ABN) *</Label>
                <Input
                  id="abn"
                  placeholder="12 345 678 901"
                  value={abn}
                  onChange={e =>
                    setAbn(e.target.value.replace(/\D/g, "").slice(0, 11))
                  }
                  maxLength={11}
                  className="font-mono"
                />
                <p className="text-xs text-gray-600">
                  11 digits, no spaces
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name *</Label>
                <Input
                  id="companyName"
                  placeholder="e.g., Queensland Bamboo Biomass Pty Ltd"
                  value={companyName}
                  onChange={e => setCompanyName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactEmail">Contact Email *</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  placeholder="contact@company.com.au"
                  value={contactEmail}
                  onChange={e => setContactEmail(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactPhone">Contact Phone</Label>
                <Input
                  id="contactPhone"
                  type="tel"
                  placeholder="+61 2 1234 5678"
                  value={contactPhone}
                  onChange={e => setContactPhone(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  type="url"
                  placeholder="https://www.company.com.au"
                  value={website}
                  onChange={e => setWebsite(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <button
                  onClick={() => setCurrentStep(2)}
                  disabled={!canProceedStep1}
                  className="btn-gold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continue
                  <ArrowRight className="h-4 w-4 ml-2" />
                </button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Address */}
        {currentStep === 2 && (
          <Card variant="elevated">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[#D4AF37]/10">
                  <MapPin className="h-5 w-5 text-[#D4AF37]" />
                </div>
                <div>
                  <CardTitle>Business Address</CardTitle>
                  <CardDescription>
                    Where is your primary business location?
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="addressLine1">Address Line 1 *</Label>
                <Input
                  id="addressLine1"
                  placeholder="Street address"
                  value={addressLine1}
                  onChange={e => setAddressLine1(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="addressLine2">Address Line 2</Label>
                <Input
                  id="addressLine2"
                  placeholder="Unit, suite, etc."
                  value={addressLine2}
                  onChange={e => setAddressLine2(e.target.value)}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    placeholder="e.g., Sydney"
                    value={city}
                    onChange={e => setCity(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
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
              </div>

              <div className="space-y-2">
                <Label htmlFor="postcode">Postcode *</Label>
                <Input
                  id="postcode"
                  placeholder="2000"
                  value={postcode}
                  onChange={e => setPostcode(e.target.value.slice(0, 4))}
                  maxLength={4}
                  className="font-mono w-32"
                />
              </div>

              <div className="flex justify-between gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep(1)}
                  leftIcon={<ArrowLeft className="h-4 w-4" />}
                >
                  Back
                </Button>
                <button
                  onClick={() => setCurrentStep(3)}
                  disabled={!canProceedStep2}
                  className="btn-gold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continue
                  <ArrowRight className="h-4 w-4 ml-2" />
                </button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Operations */}
        {currentStep === 3 && (
          <Card variant="elevated">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[#D4AF37]/10">
                  <Settings className="h-5 w-5 text-[#D4AF37]" />
                </div>
                <div>
                  <CardTitle>Operations Details</CardTitle>
                  <CardDescription>
                    Tell us about your feedstock supply capabilities
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="operationScale">Operation Scale</Label>
                <Select
                  value={operationScale}
                  onValueChange={setOperationScale}
                >
                  <SelectTrigger id="operationScale">
                    <SelectValue placeholder="Select scale" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">
                      Small (&lt;1,000 tonnes/year)
                    </SelectItem>
                    <SelectItem value="medium">
                      Medium (1,000-10,000 tonnes/year)
                    </SelectItem>
                    <SelectItem value="large">
                      Large (10,000-50,000 tonnes/year)
                    </SelectItem>
                    <SelectItem value="industrial">
                      Industrial (&gt;50,000 tonnes/year)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="annualCapacity">Annual Capacity (tonnes)</Label>
                <Input
                  id="annualCapacity"
                  type="number"
                  placeholder="e.g., 5000"
                  value={annualCapacity}
                  onChange={e => setAnnualCapacity(e.target.value)}
                  className="font-mono"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Company Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe your bamboo or biomass operations, including plantation size, harvesting practices, processing capabilities, and any sustainability certifications..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={5}
                />
                <p className="text-xs text-gray-600">
                  This will be visible to buyers on your public supplier profile
                </p>
              </div>

              <div className="bg-info/10 border border-info/30 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <div className="p-1.5 rounded-lg bg-info/20 shrink-0">
                    <Info className="h-4 w-4 text-info" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-2">
                      Next Steps After Registration
                    </h4>
                    <ul className="text-sm text-gray-600 space-y-1.5">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-info shrink-0 mt-0.5" />
                        <span>
                          Your registration will be reviewed by ABFI
                          administrators
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-info shrink-0 mt-0.5" />
                        <span>
                          You'll be notified once your account is verified
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-info shrink-0 mt-0.5" />
                        <span>
                          After verification, you can start listing feedstocks
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-info shrink-0 mt-0.5" />
                        <span>
                          Upload certificates and quality test reports for ABFI
                          rating
                        </span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex justify-between gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep(2)}
                  leftIcon={<ArrowLeft className="h-4 w-4" />}
                >
                  Back
                </Button>
                <button
                  onClick={handleSubmit}
                  disabled={registerMutation.isPending}
                  className="btn-gold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {registerMutation.isPending ? "Submitting..." : "Submit Registration"}
                  <CheckCircle2 className="h-4 w-4 ml-2" />
                </button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
