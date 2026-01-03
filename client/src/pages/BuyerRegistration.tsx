/**
 * Buyer Registration - Nextgen Design
 *
 * Features:
 * - Multi-field registration form with validation
 * - ABN verification integration
 * - State/location selection
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
  ShoppingCart,
  Leaf,
  CheckCircle2,
  Info,
  ArrowRight,
} from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { H1, H3, Body } from "@/components/Typography";

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
      facilityState: state as
        | "NSW"
        | "VIC"
        | "QLD"
        | "SA"
        | "WA"
        | "TAS"
        | "NT"
        | "ACT"
        | undefined,
    });
  };

  const canSubmit = abn.length === 11 && companyName && contactEmail;

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card variant="elevated" className="max-w-md">
          <CardHeader className="text-center">
            <div className="p-3 rounded-xl bg-[#D4AF37]/10 w-fit mx-auto mb-4">
              <ShoppingCart className="h-8 w-8 text-[#D4AF37]" />
            </div>
            <H3>Authentication Required</H3>
            <Body className="text-muted-foreground">
              Please sign in to register as a buyer
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
            <ShoppingCart className="h-3.5 w-3.5 mr-1.5" />
            Buyer Registration
          </Badge>
          <H1 className="text-foreground mb-2">
            Register as a Buyer
          </H1>
          <Body size="lg" className="text-gray-600 max-w-xl mx-auto">
            Source verified biofuel feedstocks from trusted suppliers across
            Australia
          </Body>
        </div>

        <Card variant="elevated">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[#D4AF37]/10">
                <ShoppingCart className="h-5 w-5 text-[#D4AF37]" />
              </div>
              <div>
                <CardTitle>Buyer Information</CardTitle>
                <CardDescription>
                  Provide your company details to start sourcing feedstocks
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
                placeholder="e.g., Biofuel Refinery Pty Ltd"
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
              <Label htmlFor="facilityName">Facility Name</Label>
              <Input
                id="facilityName"
                placeholder="e.g., Sydney Biodiesel Plant"
                value={facilityName}
                onChange={e => setFacilityName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="facilityAddress">Facility Address</Label>
              <Input
                id="facilityAddress"
                placeholder="Full facility address"
                value={facilityAddress}
                onChange={e => setFacilityAddress(e.target.value)}
              />
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  placeholder="e.g., Sydney"
                  value={city}
                  onChange={e => setCity(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
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

              <div className="space-y-2">
                <Label htmlFor="postcode">Postcode</Label>
                <Input
                  id="postcode"
                  placeholder="2000"
                  value={postcode}
                  onChange={e => setPostcode(e.target.value.slice(0, 4))}
                  maxLength={4}
                  className="font-mono"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="annualDemand">Annual Demand (tonnes)</Label>
              <Input
                id="annualDemand"
                type="number"
                placeholder="e.g., 10000"
                value={annualDemand}
                onChange={e => setAnnualDemand(e.target.value)}
                className="font-mono"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="feedstockTypes">
                Feedstock Types of Interest
              </Label>
              <Textarea
                id="feedstockTypes"
                placeholder="e.g., Used cooking oil, tallow, bamboo..."
                value={feedstockTypes}
                onChange={e => setFeedstockTypes(e.target.value)}
                rows={3}
              />
            </div>

            <div className="bg-info/10 border border-info/30 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className="p-1.5 rounded-lg bg-info/20 shrink-0">
                  <Info className="h-4 w-4 text-info" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-2">
                    What You'll Get
                  </h4>
                  <ul className="text-sm text-gray-600 space-y-1.5">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-info shrink-0 mt-0.5" />
                      <span>
                        Access to verified feedstock suppliers across Australia
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-info shrink-0 mt-0.5" />
                      <span>
                        Advanced search with ABFI ratings and carbon intensity
                        filters
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-info shrink-0 mt-0.5" />
                      <span>Send inquiries and RFQs directly to suppliers</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-info shrink-0 mt-0.5" />
                      <span>
                        Save searches and receive alerts for new listings
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button
                onClick={handleSubmit}
                disabled={!canSubmit || registerMutation.isPending}
                loading={registerMutation.isPending}
                rightIcon={<ArrowRight className="h-4 w-4" />}
              >
                Submit Registration
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
