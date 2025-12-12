import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { AUSTRALIAN_STATES } from "@/const";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, ShoppingCart, Leaf } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";

export default function BuyerRegistration() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  const [abn, setAbn] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [contactEmail, setContactEmail] = useState(user?.email || "");
  const [contactPhone, setContactPhone] = useState("");
  const [facilityName, setFacilityName] = useState("");
  const [facilityAddress, setFacilityAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [postcode, setPostcode] = useState("");
  const [annualDemand, setAnnualDemand] = useState("");
  const [feedstockTypes, setFeedstockTypes] = useState("");

  const registerMutation = trpc.buyers.create.useMutation({
    onSuccess: () => {
      toast.success("Buyer registration submitted successfully!");
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
      facilityName: facilityName || undefined,
      facilityAddress: facilityAddress || undefined,
      facilityState: state as "NSW" | "VIC" | "QLD" | "SA" | "WA" | "TAS" | "NT" | "ACT" | undefined,
    });
  };

  const canSubmit = abn.length === 11 && companyName && contactEmail;

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>Please sign in to register as a buyer</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
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
          <h1 className="text-4xl font-bold text-primary mb-2">Buyer Registration</h1>
          <p className="text-gray-600">
            Source verified biofuel feedstocks from trusted suppliers
          </p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-6 w-6 text-primary" />
              <CardTitle>Buyer Information</CardTitle>
            </div>
            <CardDescription>
              Provide your company details to start sourcing feedstocks
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
            </div>

            <div>
              <Label htmlFor="companyName">Company Name *</Label>
              <Input
                id="companyName"
                placeholder="e.g., Biofuel Refinery Pty Ltd"
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
              <Label htmlFor="facilityName">Facility Name</Label>
              <Input
                id="facilityName"
                placeholder="e.g., Sydney Biodiesel Plant"
                value={facilityName}
                onChange={(e) => setFacilityName(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="facilityAddress">Facility Address</Label>
              <Input
                id="facilityAddress"
                placeholder="Full facility address"
                value={facilityAddress}
                onChange={(e) => setFacilityAddress(e.target.value)}
              />
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  placeholder="e.g., Sydney"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="state">State</Label>
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

              <div>
                <Label htmlFor="postcode">Postcode</Label>
                <Input
                  id="postcode"
                  placeholder="2000"
                  value={postcode}
                  onChange={(e) => setPostcode(e.target.value.slice(0, 4))}
                  maxLength={4}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="annualDemand">Annual Demand (tonnes)</Label>
              <Input
                id="annualDemand"
                type="number"
                placeholder="e.g., 10000"
                value={annualDemand}
                onChange={(e) => setAnnualDemand(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="feedstockTypes">Feedstock Types of Interest</Label>
              <Textarea
                id="feedstockTypes"
                placeholder="e.g., Used cooking oil, tallow, bamboo..."
                value={feedstockTypes}
                onChange={(e) => setFeedstockTypes(e.target.value)}
                rows={3}
              />
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">What You'll Get</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Access to verified feedstock suppliers across Australia</li>
                <li>• Advanced search with ABFI ratings and carbon intensity filters</li>
                <li>• Send inquiries and RFQs directly to suppliers</li>
                <li>• Save searches and receive alerts for new listings</li>
              </ul>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                onClick={handleSubmit}
                disabled={!canSubmit || registerMutation.isPending}
              >
                {registerMutation.isPending ? "Submitting..." : "Submit Registration"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
