/**
 * Producer Account Setup - Nextgen Design
 *
 * Features:
 * - ABN validation and lookup
 * - Password strength indicator
 * - Account creation form
 * - Typography components for consistent styling
 */

import { useState } from "react";
import { useLocation } from "wouter";
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
import { Progress } from "@/components/ui/progress";
import { Leaf, ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { H1, H2, H3, Body } from "@/components/Typography";

export default function ProducerAccountSetup() {
  const [, setLocation] = useLocation();
  const [formData, setFormData] = useState({
    abn: "",
    companyName: "",
    contactName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [abnValidated, setAbnValidated] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  const utils = trpc.useUtils();

  const handleAbnValidation = async () => {
    if (formData.abn.length !== 11) return;

    try {
      const data = await utils.client.utils.validateABN.query({
        abn: formData.abn,
      });

      if (data?.success) {
        setAbnValidated(true);
        setFormData(prev => ({
          ...prev,
          companyName: data.entityName || data.businessName || "",
        }));

        if (data.message) {
          alert(data.message);
        }
      } else {
        alert(data?.message || "Invalid ABN. Please check and try again.");
      }
    } catch (error) {
      console.error("ABN validation error:", error);
      alert("Error validating ABN. Please try again.");
    }
  };

  const calculatePasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 25;
    if (/[0-9]/.test(password)) strength += 25;
    if (/[^a-zA-Z0-9]/.test(password)) strength += 25;
    return strength;
  };

  const handlePasswordChange = (password: string) => {
    setFormData(prev => ({ ...prev, password }));
    setPasswordStrength(calculatePasswordStrength(password));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Save to localStorage for progressive form saving
    localStorage.setItem(
      "producerRegistration",
      JSON.stringify({ step: 1, data: formData })
    );
    setLocation("/producer-registration/property-map");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto flex h-16 items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-[#0F3A5C] hover:opacity-80"
          >
            <Leaf className="h-6 w-6" />
            <span className="text-xl font-semibold">ABFI</span>
          </Link>
          <div className="text-sm text-gray-600">
            Step 1 of 7: Account Setup
          </div>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="bg-white border-b">
        <div className="container mx-auto py-4">
          <Progress value={14} className="h-2" />
          <p className="mt-2 text-sm text-gray-600">
            14% Complete • Estimated 12 minutes remaining
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto py-12">
        <div className="mx-auto max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl text-[#0F3A5C]">
                Create Your Account
              </CardTitle>
              <CardDescription>
                Let's start with your business details. We'll use your ABN to
                verify your registration.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* ABN Validation */}
                <div className="space-y-2">
                  <Label htmlFor="abn">
                    Australian Business Number (ABN) *
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="abn"
                      placeholder="12345678901"
                      maxLength={11}
                      value={formData.abn}
                      onChange={e =>
                        setFormData(prev => ({
                          ...prev,
                          abn: e.target.value.replace(/\D/g, ""),
                        }))
                      }
                      required
                      className={abnValidated ? "border-green-500" : ""}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleAbnValidation}
                      disabled={formData.abn.length !== 11}
                    >
                      Validate
                    </Button>
                  </div>
                  {abnValidated && (
                    <p className="flex items-center gap-1 text-sm text-green-600">
                      <CheckCircle2 className="h-4 w-4" />
                      ABN verified
                    </p>
                  )}
                </div>

                {/* Company Name */}
                <div className="space-y-2">
                  <Label htmlFor="companyName">Company/Trading Name *</Label>
                  <Input
                    id="companyName"
                    placeholder="Your business name"
                    value={formData.companyName}
                    onChange={e =>
                      setFormData(prev => ({
                        ...prev,
                        companyName: e.target.value,
                      }))
                    }
                    required
                    disabled={!abnValidated}
                  />
                </div>

                {/* Contact Details */}
                <div className="space-y-2">
                  <Label htmlFor="contactName">Primary Contact Name *</Label>
                  <Input
                    id="contactName"
                    placeholder="John Smith"
                    value={formData.contactName}
                    onChange={e =>
                      setFormData(prev => ({
                        ...prev,
                        contactName: e.target.value,
                      }))
                    }
                    required
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="john@example.com"
                      value={formData.email}
                      onChange={e =>
                        setFormData(prev => ({
                          ...prev,
                          email: e.target.value,
                        }))
                      }
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Mobile Number *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="0400 000 000"
                      value={formData.phone}
                      onChange={e =>
                        setFormData(prev => ({
                          ...prev,
                          phone: e.target.value,
                        }))
                      }
                      required
                    />
                  </div>
                </div>

                {/* Password Creation */}
                <div className="space-y-2">
                  <Label htmlFor="password">Create Password *</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Min. 8 characters"
                    value={formData.password}
                    onChange={e => handlePasswordChange(e.target.value)}
                    required
                  />
                  <div className="space-y-1">
                    <Progress value={passwordStrength} className="h-1" />
                    <p className="text-xs text-gray-600">
                      Password strength:{" "}
                      {passwordStrength < 50
                        ? "Weak"
                        : passwordStrength < 75
                          ? "Medium"
                          : "Strong"}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password *</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Re-enter password"
                    value={formData.confirmPassword}
                    onChange={e =>
                      setFormData(prev => ({
                        ...prev,
                        confirmPassword: e.target.value,
                      }))
                    }
                    required
                  />
                  {formData.confirmPassword &&
                    formData.password !== formData.confirmPassword && (
                      <p className="text-sm text-red-600">
                        Passwords do not match
                      </p>
                    )}
                </div>

                {/* MyGovID Option */}
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                  <p className="mb-2 text-sm font-medium text-blue-900">
                    Streamline verification with myGovID
                  </p>
                  <p className="mb-3 text-sm text-blue-700">
                    Link your myGovID for faster identity verification and
                    reduced paperwork.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="border-blue-300 text-blue-700"
                    onClick={() =>
                      alert(
                        "myGovID integration coming soon.\n\nThis will allow you to verify your identity using your existing myGovID account, streamlining the registration process."
                      )
                    }
                  >
                    Link myGovID (Optional)
                  </Button>
                </div>

                {/* Navigation Buttons */}
                <div className="flex items-center justify-between pt-6">
                  <Button
                    type="button"
                    variant="ghost"
                    className="gap-2"
                    onClick={() => setLocation("/producer-registration")}
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back
                  </Button>

                  <Button
                    type="submit"
                    className="gap-2 bg-[#F4C430] text-[#0F3A5C] hover:bg-[#F4C430]/90"
                    disabled={
                      !abnValidated ||
                      formData.password !== formData.confirmPassword
                    }
                  >
                    Continue to Property Details
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Help Text */}
          <div className="mt-6 text-center text-sm text-gray-600">
            <p>
              Need help? Contact our support team at{" "}
              <a
                href="mailto:support@abfi.com.au"
                className="text-[#F4C430] hover:underline"
              >
                support@abfi.com.au
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
