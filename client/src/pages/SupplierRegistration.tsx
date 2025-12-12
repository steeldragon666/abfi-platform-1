import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { AUSTRALIAN_STATES } from "@/const";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, ArrowRight, Building2, CheckCircle2, Leaf } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";

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
      state: state as "NSW" | "VIC" | "QLD" | "SA" | "WA" | "TAS" | "NT" | "ACT" | undefined,
      postcode: postcode || undefined,
      website: website || undefined,
      description: description || undefined,
    });
  };

  const canProceedStep1 = abn.length === 11 && companyName && contactEmail;
  const canProceedStep2 = addressLine1 && city && state && postcode;

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>Please sign in to register as a supplier</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b bg-white">
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

      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-primary mb-2">Supplier Registration</h1>
          <p className="text-gray-600">
            Join Australia's leading biofuel feedstock marketplace
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center flex-1">
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                    currentStep >= step
                      ? "bg-primary border-primary text-white"
                      : "bg-white border-gray-300 text-gray-400"
                  }`}
                >
                  {currentStep > step ? (
                    <CheckCircle2 className="h-6 w-6" />
                  ) : (
                    <span>{step}</span>
                  )}
                </div>
                {step < 3 && (
                  <div
                    className={`flex-1 h-1 mx-2 ${
                      currentStep > step ? "bg-primary" : "bg-gray-300"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-sm text-gray-600">Company Info</span>
            <span className="text-sm text-gray-600">Address</span>
            <span className="text-sm text-gray-600">Operations</span>
          </div>
        </div>

        {/* Step 1: Company Information */}
        {currentStep === 1 && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Building2 className="h-6 w-6 text-primary" />
                <CardTitle>Company Information</CardTitle>
              </div>
              <CardDescription>
                Provide your company details and primary contact information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="abn">Australian Business Number (ABN) *</Label>
                <Input
                  id="abn"
                  placeholder="12 345 678 901"
                  value={abn}
                  onChange={(e) => setAbn(e.target.value.replace(/\D/g, "").slice(0, 11))}
                  maxLength={11}
                />
                <p className="text-sm text-gray-500 mt-1">11 digits, no spaces</p>
              </div>

              <div>
                <Label htmlFor="companyName">Company Name *</Label>
                <Input
                  id="companyName"
                  placeholder="e.g., Green Energy Supplies Pty Ltd"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="contactEmail">Contact Email *</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  placeholder="contact@company.com.au"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="contactPhone">Contact Phone</Label>
                <Input
                  id="contactPhone"
                  type="tel"
                  placeholder="+61 2 1234 5678"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  type="url"
                  placeholder="https://www.company.com.au"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  onClick={() => setCurrentStep(2)}
                  disabled={!canProceedStep1}
                >
                  Next Step
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Address */}
        {currentStep === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Business Address</CardTitle>
              <CardDescription>
                Where is your primary business location?
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="addressLine1">Address Line 1 *</Label>
                <Input
                  id="addressLine1"
                  placeholder="Street address"
                  value={addressLine1}
                  onChange={(e) => setAddressLine1(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="addressLine2">Address Line 2</Label>
                <Input
                  id="addressLine2"
                  placeholder="Unit, suite, etc."
                  value={addressLine2}
                  onChange={(e) => setAddressLine2(e.target.value)}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    placeholder="e.g., Sydney"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="state">State *</Label>
                  <Select value={state} onValueChange={setState}>
                    <SelectTrigger id="state">
                      <SelectValue placeholder="Select state" />
                    </SelectTrigger>
                    <SelectContent>
                      {AUSTRALIAN_STATES.map((s) => (
                        <SelectItem key={s.value} value={s.value}>
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="postcode">Postcode *</Label>
                <Input
                  id="postcode"
                  placeholder="2000"
                  value={postcode}
                  onChange={(e) => setPostcode(e.target.value.slice(0, 4))}
                  maxLength={4}
                />
              </div>

              <div className="flex justify-between gap-2 pt-4">
                <Button variant="outline" onClick={() => setCurrentStep(1)}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Previous
                </Button>
                <Button
                  onClick={() => setCurrentStep(3)}
                  disabled={!canProceedStep2}
                >
                  Next Step
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Operations */}
        {currentStep === 3 && (
          <Card>
            <CardHeader>
              <CardTitle>Operations Details</CardTitle>
              <CardDescription>
                Tell us about your feedstock supply capabilities
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="operationScale">Operation Scale</Label>
                <Select value={operationScale} onValueChange={setOperationScale}>
                  <SelectTrigger id="operationScale">
                    <SelectValue placeholder="Select scale" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">Small (&lt;1,000 tonnes/year)</SelectItem>
                    <SelectItem value="medium">Medium (1,000-10,000 tonnes/year)</SelectItem>
                    <SelectItem value="large">Large (10,000-50,000 tonnes/year)</SelectItem>
                    <SelectItem value="industrial">Industrial (&gt;50,000 tonnes/year)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="annualCapacity">Annual Capacity (tonnes)</Label>
                <Input
                  id="annualCapacity"
                  type="number"
                  placeholder="e.g., 5000"
                  value={annualCapacity}
                  onChange={(e) => setAnnualCapacity(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="description">Company Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe your company, feedstock types, and capabilities..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={5}
                />
                <p className="text-sm text-gray-500 mt-1">
                  This will be visible to buyers on your profile
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2">Next Steps After Registration</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Your registration will be reviewed by ABFI administrators</li>
                  <li>• You'll be notified once your account is verified</li>
                  <li>• After verification, you can start listing feedstocks</li>
                  <li>• Upload certificates and quality test reports for ABFI rating</li>
                </ul>
              </div>

              <div className="flex justify-between gap-2 pt-4">
                <Button variant="outline" onClick={() => setCurrentStep(2)}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Previous
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={registerMutation.isPending}
                >
                  {registerMutation.isPending ? "Submitting..." : "Submit Registration"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
