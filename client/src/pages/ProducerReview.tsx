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
import { Progress } from "@/components/ui/progress";
import { Leaf, CheckCircle2, Eye, EyeOff, ArrowLeft, Send } from "lucide-react";
import { Link } from "wouter";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";

export default function ProducerReview() {
  const [, setLocation] = useLocation();
  const [registrationData, setRegistrationData] = useState<any>(null);
  const [visibility, setVisibility] = useState({
    profilePublic: true,
    showContactDetails: false,
    showExactLocation: false,
    allowDirectInquiries: true,
  });
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("producerRegistration");
    if (saved) {
      setRegistrationData(JSON.parse(saved));
    }
  }, []);

  const registerMutation = trpc.suppliers.registerProducer.useMutation({
    onSuccess: () => {
      // Clear registration data
      localStorage.removeItem("producerRegistration");
      // Redirect to success page
      setLocation("/producer-registration/success");
    },
    onError: error => {
      alert(`Registration failed: ${error.message}`);
      setIsSubmitting(false);
    },
  });

  const handlePublish = async () => {
    if (!termsAccepted) {
      alert("Please accept the terms and conditions");
      return;
    }

    setIsSubmitting(true);

    // Transform registration data to match API schema
    registerMutation.mutate({
      abn: registrationData.accountSetup?.abn || "",
      companyName: registrationData.accountSetup?.companyName || "",
      tradingName: registrationData.accountSetup?.tradingName,
      contactEmail: registrationData.accountSetup?.contactEmail || "",
      contactPhone: registrationData.accountSetup?.contactPhone,
      website: registrationData.accountSetup?.website,
      properties: registrationData.properties
        ? [registrationData.properties]
        : [],
      feedstockTypes: registrationData.productionProfile?.feedstockTypes,
      annualProduction: registrationData.productionProfile?.annualProduction,
      profilePublic: visibility.profilePublic,
      showContactDetails: visibility.showContactDetails,
      showExactLocation: visibility.showExactLocation,
      allowDirectInquiries: visibility.allowDirectInquiries,
    });
  };

  if (!registrationData) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

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
            Step 7 of 7: Review & Publish
          </div>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="bg-white border-b">
        <div className="container mx-auto py-4">
          <Progress value={100} className="h-2" />
          <p className="mt-2 text-sm text-gray-600">
            100% Complete • Ready to publish!
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto py-12">
        <div className="mx-auto max-w-4xl space-y-6">
          {/* Success Message */}
          <Card className="border-2 border-green-500 bg-green-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
                <div>
                  <h3 className="text-lg font-semibold text-green-900">
                    Registration Complete!
                  </h3>
                  <p className="text-sm text-green-700">
                    Review your information below, then publish to the
                    marketplace.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Registration Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl text-[#0F3A5C]">
                Registration Summary
              </CardTitle>
              <CardDescription>
                Review all information before publishing to the marketplace.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Account Details */}
              <div>
                <h3 className="mb-3 text-lg font-semibold text-[#0F3A5C]">
                  Account Details
                </h3>
                <div className="grid gap-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Company Name:</span>
                    <span className="font-medium">Sunshine Farms Pty Ltd</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">ABN:</span>
                    <span className="font-medium">12 345 678 901</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Contact Person:</span>
                    <span className="font-medium">John Smith</span>
                  </div>
                </div>
              </div>

              {/* Property Details */}
              <div className="border-t pt-6">
                <h3 className="mb-3 text-lg font-semibold text-[#0F3A5C]">
                  Property Details
                </h3>
                <div className="grid gap-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Property Name:</span>
                    <span className="font-medium">
                      {registrationData.data?.propertyName || "—"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Location:</span>
                    <span className="font-medium">
                      {registrationData.data?.state || "—"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Land Area:</span>
                    <span className="font-medium">
                      {registrationData.data?.totalLandArea || "—"} ha
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Cultivated Area:</span>
                    <span className="font-medium">
                      {registrationData.data?.cultivatedArea || "—"} ha
                    </span>
                  </div>
                </div>
              </div>

              {/* Production Profile */}
              <div className="border-t pt-6">
                <h3 className="mb-3 text-lg font-semibold text-[#0F3A5C]">
                  Production Profile
                </h3>
                <div className="grid gap-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Feedstock Type:</span>
                    <span className="font-medium capitalize">
                      {registrationData.data?.feedstockType?.replace(
                        /_/g,
                        " "
                      ) || "—"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Expected Harvest:</span>
                    <span className="font-medium">
                      {registrationData.data?.currentSeason?.expectedHarvest ||
                        "—"}{" "}
                      tonnes
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Historical Data:</span>
                    <span className="font-medium">
                      {registrationData.data?.yieldHistory?.length || 0} years
                    </span>
                  </div>
                </div>
              </div>

              {/* ABFI Rating */}
              <div className="border-t pt-6">
                <h3 className="mb-3 text-lg font-semibold text-[#0F3A5C]">
                  ABFI Carbon Rating
                </h3>
                <div className="flex items-center justify-between rounded-lg border-2 border-[#F4C430] bg-[#F4C430]/10 p-4">
                  <div>
                    <p className="text-sm text-gray-600">Your Rating</p>
                    <p className="text-4xl font-bold text-[#0F3A5C]">
                      {registrationData.data?.carbonScore?.rating || "—"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Carbon Intensity</p>
                    <p className="text-lg font-semibold text-[#0F3A5C]">
                      {registrationData.data?.carbonScore?.intensity || "—"}{" "}
                      gCO₂e/MJ
                    </p>
                  </div>
                </div>
              </div>

              {/* Marketplace Listing */}
              <div className="border-t pt-6">
                <h3 className="mb-3 text-lg font-semibold text-[#0F3A5C]">
                  Marketplace Listing
                </h3>
                <div className="grid gap-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Available Volume:</span>
                    <span className="font-medium">
                      {registrationData.data?.listingData
                        ?.availableVolumeTonnes || "—"}{" "}
                      tonnes/year
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Price Model:</span>
                    <span className="font-medium capitalize">
                      {registrationData.data?.listingData?.priceModel?.replace(
                        /_/g,
                        " "
                      ) || "—"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Base Price:</span>
                    <span className="font-medium">
                      {registrationData.data?.listingData?.basePrice
                        ? `$${registrationData.data.listingData.basePrice}/tonne`
                        : "—"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Delivery Options:</span>
                    <span className="font-medium">
                      {registrationData.data?.listingData?.deliveryOptions
                        ?.length || 0}{" "}
                      options
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Visibility Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[#0F3A5C]">
                <Eye className="h-5 w-5" />
                Visibility Settings
              </CardTitle>
              <CardDescription>
                Control what information is visible to potential buyers.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="profilePublic"
                  checked={visibility.profilePublic}
                  onCheckedChange={checked =>
                    setVisibility(prev => ({
                      ...prev,
                      profilePublic: checked as boolean,
                    }))
                  }
                />
                <div className="flex-1">
                  <Label
                    htmlFor="profilePublic"
                    className="cursor-pointer font-semibold"
                  >
                    Make profile public
                  </Label>
                  <p className="text-sm text-gray-600">
                    Your listing will appear in marketplace search results
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Checkbox
                  id="showContactDetails"
                  checked={visibility.showContactDetails}
                  onCheckedChange={checked =>
                    setVisibility(prev => ({
                      ...prev,
                      showContactDetails: checked as boolean,
                    }))
                  }
                />
                <div className="flex-1">
                  <Label
                    htmlFor="showContactDetails"
                    className="cursor-pointer font-semibold"
                  >
                    Show contact details
                  </Label>
                  <p className="text-sm text-gray-600">
                    Buyers can see your phone number and email address
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Checkbox
                  id="showExactLocation"
                  checked={visibility.showExactLocation}
                  onCheckedChange={checked =>
                    setVisibility(prev => ({
                      ...prev,
                      showExactLocation: checked as boolean,
                    }))
                  }
                />
                <div className="flex-1">
                  <Label
                    htmlFor="showExactLocation"
                    className="cursor-pointer font-semibold"
                  >
                    Show exact location
                  </Label>
                  <p className="text-sm text-gray-600">
                    Display property coordinates (otherwise only region is
                    shown)
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Checkbox
                  id="allowDirectInquiries"
                  checked={visibility.allowDirectInquiries}
                  onCheckedChange={checked =>
                    setVisibility(prev => ({
                      ...prev,
                      allowDirectInquiries: checked as boolean,
                    }))
                  }
                />
                <div className="flex-1">
                  <Label
                    htmlFor="allowDirectInquiries"
                    className="cursor-pointer font-semibold"
                  >
                    Allow direct inquiries
                  </Label>
                  <p className="text-sm text-gray-600">
                    Buyers can send you messages through the platform
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Terms & Conditions */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="terms"
                  checked={termsAccepted}
                  onCheckedChange={checked =>
                    setTermsAccepted(checked as boolean)
                  }
                />
                <div className="flex-1">
                  <Label htmlFor="terms" className="cursor-pointer">
                    I agree to the{" "}
                    <a href="/terms" className="text-[#F4C430] hover:underline">
                      Terms of Service
                    </a>{" "}
                    and{" "}
                    <a
                      href="/privacy"
                      className="text-[#F4C430] hover:underline"
                    >
                      Privacy Policy
                    </a>
                  </Label>
                  <p className="mt-2 text-sm text-gray-600">
                    By publishing, you confirm that all information provided is
                    accurate and you have the authority to list this feedstock.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex items-center justify-between">
            <Link href="/producer-registration/marketplace-listing">
              <Button variant="ghost" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Edit
              </Button>
            </Link>

            <Button
              onClick={handlePublish}
              disabled={!termsAccepted || isSubmitting}
              className="gap-2 bg-[#F4C430] text-[#0F3A5C] hover:bg-[#F4C430]/90"
              size="lg"
            >
              {isSubmitting ? (
                <>Processing...</>
              ) : (
                <>
                  <Send className="h-5 w-5" />
                  Publish to Marketplace
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
