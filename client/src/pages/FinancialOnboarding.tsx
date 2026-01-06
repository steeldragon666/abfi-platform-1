/**
 * Financial Onboarding - Nextgen Design
 *
 * Features:
 * - Lender registration workflow
 * - KYC/AML compliance steps
 * - Account setup wizard
 * - Typography components for consistent styling
 */

import { useState } from"react";
import { H1, H2, H3, H4, Body, MetricValue, DataLabel } from"@/components/Typography";
import { useLocation } from"wouter";
import { Button } from"@/components/ui/Button";
import { Input } from"@/components/ui/input";
import { Label } from"@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from"@/components/ui/select";
import { Checkbox } from"@/components/ui/checkbox";
import {
  Shield,
  Building2,
  TrendingUp,
  FileText,
  CheckCircle2,
} from"lucide-react";
import { trpc } from"@/lib/trpc";

const steps = [
  { id: 1, label:"Institution" },
  { id: 2, label:"Verification" },
  { id: 3, label:"Access Tier" },
  { id: 4, label:"Compliance" },
];

export default function FinancialOnboarding() {
  const [, setLocation] = useLocation();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Step 1: Institution Details
    institutionName:"",
    abn:"",
    institutionType:"",
    regulatoryBody:"",
    licenseNumber:"",

    // Step 2: Verification
    contactName:"",
    contactTitle:"",
    contactEmail:"",
    contactPhone:"",
    verificationMethod:"",

    // Step 3: Access Tier
    accessTier:"",
    dataCategories: [] as string[],

    // Step 4: Compliance
    declarations: {
      authorizedRepresentative: false,
      dataProtection: false,
      regulatoryCompliance: false,
      termsAccepted: false,
    },
  });

  const registerMutation = trpc.financialInstitutions.register.useMutation({
    onSuccess: () => {
      setLocation("/financial-onboarding/success");
    },
    onError: error => {
      alert(`Registration failed: ${error.message}`);
    },
  });

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    } else {
      // Submit form
      registerMutation.mutate({
        institutionName: formData.institutionName,
        abn: formData.abn,
        institutionType: formData.institutionType as any,
        regulatoryBody: formData.regulatoryBody,
        licenseNumber: formData.licenseNumber,
        contactName: formData.contactName,
        contactTitle: formData.contactTitle,
        contactEmail: formData.contactEmail,
        contactPhone: formData.contactPhone,
        verificationMethod: formData.verificationMethod as any,
        accessTier: (formData.accessTier as any) ||"basic",
        dataCategories: formData.dataCategories,
        authorizedRepresentative:
          formData.declarations.authorizedRepresentative,
        dataProtection: formData.declarations.dataProtection,
        regulatoryCompliance: formData.declarations.regulatoryCompliance,
        termsAccepted: formData.declarations.termsAccepted,
      });
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const progressPercentage = (currentStep / 4) * 100;

  return (
    <div
      className="min-h-screen"
      style={{
        background:"var(--bg-primary)",
        position:"relative",
        zIndex: 1,
      }}
    >
      {/* Header */}
      <header
        className="border-b"
        style={{
          borderColor:"var(--border-subtle)",
          background:"var(--bg-secondary)",
        }}
      >
        <div className="container mx-auto py-8">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ background:"var(--gradient-gold)" }}
            >
              <Shield
                className="h-6 w-6"
                style={{ color:"var(--bg-primary)" }}
              />
            </div>
            <H1
              className="text-3xl"
              style={{
                fontFamily: 'var(--font-display)',
                color:"var(--text-[#D4AF37])",
              }}
            >
              BioFeed <span style={{ color:"var(--accent-gold)" }}>AU</span>
            </H1>
          </div>
          <div className="text-center">
            <H2
              className="text-2xl mb-2"
              style={{
                fontFamily: 'var(--font-display)',
                color:"var(--text-[#D4AF37])",
              }}
            >
              Financial Institution Onboarding
            </H2>
            <p
              style={{
                color:"var(--text-secondary)",
                fontSize:"15px",
                fontWeight: 300,
              }}
            >
              Secure access to Australia's bioenergy feedstock intelligence
              platform
            </p>
          </div>
        </div>
      </header>

      {/* Platform Notice */}
      <div className="container mx-auto mt-10">
        <div className="max-w-4xl mx-auto">
          <div
            className="rounded-xl p-6 flex gap-4 mb-10"
            style={{
              background:
"linear-gradient(135deg, rgba(61, 139, 95, 0.1) 0%, rgba(201, 169, 98, 0.05) 100%)",
              border:"1px solid rgba(61, 139, 95, 0.2)",
            }}
          >
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
              style={{
                background:"rgba(61, 139, 95, 0.2)",
                color:"var(--accent-green-bright)",
              }}
            >
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <H3
                className="text-sm font-semibold mb-1"
                style={{
                  color:"var(--accent-green-bright)",
                  textTransform:"uppercase",
                  letterSpacing:"0.5px",
                }}
              >
                Accredited Platform
              </H3>
              <p
                style={{
                  color:"var(--text-secondary)",
                  fontSize:"14px",
                  fontWeight: 300,
                }}
              >
                This platform provides verified biological asset data for
                capital markets, lender monitoring, and project finance due
                diligence.
              </p>
            </div>
          </div>

          {/* Progress Steps */}
          <div className="mb-12">
            <div className="flex justify-between relative">
              {/* Progress line background */}
              <div
                className="absolute top-5 left-10 right-10 h-0.5"
                style={{ background:"var(--bg-tertiary)" }}
              />
              {/* Progress line fill */}
              <div
                className="absolute top-5 left-10 h-0.5 transition-all duration-500"
                style={{
                  background:"var(--gradient-gold)",
                  width: `calc(${progressPercentage}% - 80px)`,
                }}
              />

              {steps.map(step => (
                <div
                  key={step.id}
                  className="flex flex-col items-center relative z-10"
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all"
                    style={{
                      background:
                        step.id === currentStep
                          ?"var(--accent-gold)"
                          : step.id < currentStep
                            ?"var(--accent-green)"
                            :"var(--bg-tertiary)",
                      color:
                        step.id <= currentStep
                          ?"var(--bg-primary)"
                          :"var(--text-tertiary)",
                      border: `2px solid ${
                        step.id === currentStep
                          ?"var(--accent-gold)"
                          : step.id < currentStep
                            ?"var(--accent-green)"
                            :"var(--bg-tertiary)"
                      }`,
                      fontFamily: 'var(--font-numeric)',
                    }}
                  >
                    {step.id < currentStep ?"✓" : step.id}
                  </div>
                  <span
                    className="mt-2 text-xs font-medium"
                    style={{
                      color:
                        step.id <= currentStep
                          ?"var(--text-secondary)"
                          :"var(--text-tertiary)",
                      textTransform:"uppercase",
                      letterSpacing:"0.5px",
                    }}
                  >
                    {step.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Form Sections */}
          <div
            className="rounded-xl p-8 mb-8"
            style={{
              background:"var(--bg-secondary)",
              border:"1px solid var(--border-subtle)",
            }}
          >
            {/* Step 1: Institution Details */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div>
                  <H3
                    className="text-2xl mb-2"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    Institution Details
                  </H3>
                  <p
                    style={{
                      color:"var(--text-secondary)",
                      fontSize:"14px",
                      fontWeight: 300,
                    }}
                  >
                    Provide your financial institution's registration
                    information
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="col-span-2">
                    <Label
                      className="text-xs font-medium uppercase tracking-wide mb-2"
                      style={{ color:"var(--text-secondary)" }}
                    >
                      Institution Name{""}
                      <span style={{ color:"var(--accent-copper)" }}>*</span>
                    </Label>
                    <Input
                      value={formData.institutionName}
                      onChange={e =>
                        setFormData({
                          ...formData,
                          institutionName: e.target.value,
                        })
                      }
                      placeholder="e.g., Commonwealth Bank of Australia"
                      className="text-base"
                      style={{
                        background:"var(--bg-tertiary)",
                        border:"1px solid var(--border-subtle)",
                        color:"var(--text-[#D4AF37])",
                      }}
                    />
                  </div>

                  <div>
                    <Label
                      className="text-xs font-medium uppercase tracking-wide mb-2"
                      style={{ color:"var(--text-secondary)" }}
                    >
                      ABN{""}
                      <span style={{ color:"var(--accent-copper)" }}>*</span>
                    </Label>
                    <Input
                      value={formData.abn}
                      onChange={e =>
                        setFormData({
                          ...formData,
                          abn: e.target.value.replace(/\D/g,"").slice(0, 11),
                        })
                      }
                      placeholder="12345678901"
                      maxLength={11}
                      className="text-base"
                      style={{
                        background:"var(--bg-tertiary)",
                        border:"1px solid var(--border-subtle)",
                        color:"var(--text-[#D4AF37])",
                        fontFamily: 'var(--font-numeric)',
                      }}
                    />
                  </div>

                  <div>
                    <Label
                      className="text-xs font-medium uppercase tracking-wide mb-2"
                      style={{ color:"var(--text-secondary)" }}
                    >
                      Institution Type{""}
                      <span style={{ color:"var(--accent-copper)" }}>*</span>
                    </Label>
                    <Select
                      value={formData.institutionType}
                      onValueChange={value =>
                        setFormData({ ...formData, institutionType: value })
                      }
                    >
                      <SelectTrigger
                        style={{
                          background:"var(--bg-tertiary)",
                          border:"1px solid var(--border-subtle)",
                        }}
                      >
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="commercial-bank">
                          Commercial Bank
                        </SelectItem>
                        <SelectItem value="investment-bank">
                          Investment Bank
                        </SelectItem>
                        <SelectItem value="private-equity">
                          Private Equity Fund
                        </SelectItem>
                        <SelectItem value="venture-capital">
                          Venture Capital
                        </SelectItem>
                        <SelectItem value="asset-manager">
                          Asset Manager
                        </SelectItem>
                        <SelectItem value="insurance">
                          Insurance Company
                        </SelectItem>
                        <SelectItem value="pension-fund">
                          Pension Fund
                        </SelectItem>
                        <SelectItem value="government">
                          Government Entity
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label
                      className="text-xs font-medium uppercase tracking-wide mb-2"
                      style={{ color:"var(--text-secondary)" }}
                    >
                      Regulatory Body{""}
                      <span style={{ color:"var(--accent-copper)" }}>*</span>
                    </Label>
                    <Select
                      value={formData.regulatoryBody}
                      onValueChange={value =>
                        setFormData({ ...formData, regulatoryBody: value })
                      }
                    >
                      <SelectTrigger
                        style={{
                          background:"var(--bg-tertiary)",
                          border:"1px solid var(--border-subtle)",
                        }}
                      >
                        <SelectValue placeholder="Select regulator" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="apra">
                          APRA (Australian Prudential Regulation Authority)
                        </SelectItem>
                        <SelectItem value="asic">
                          ASIC (Australian Securities and Investments
                          Commission)
                        </SelectItem>
                        <SelectItem value="rba">
                          RBA (Reserve Bank of Australia)
                        </SelectItem>
                        <SelectItem value="other">
                          Other Regulatory Body
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label
                      className="text-xs font-medium uppercase tracking-wide mb-2"
                      style={{ color:"var(--text-secondary)" }}
                    >
                      License Number{""}
                      <span style={{ color:"var(--accent-copper)" }}>*</span>
                    </Label>
                    <Input
                      value={formData.licenseNumber}
                      onChange={e =>
                        setFormData({
                          ...formData,
                          licenseNumber: e.target.value,
                        })
                      }
                      placeholder="e.g., AFSL 123456"
                      className="text-base"
                      style={{
                        background:"var(--bg-tertiary)",
                        border:"1px solid var(--border-subtle)",
                        color:"var(--text-[#D4AF37])",
                        fontFamily: 'var(--font-numeric)',
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Verification */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div>
                  <H3
                    className="text-2xl mb-2"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    Authorized Representative
                  </H3>
                  <p
                    style={{
                      color:"var(--text-secondary)",
                      fontSize:"14px",
                      fontWeight: 300,
                    }}
                  >
                    Details of the person authorized to access this platform
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <Label
                      className="text-xs font-medium uppercase tracking-wide mb-2"
                      style={{ color:"var(--text-secondary)" }}
                    >
                      Full Name{""}
                      <span style={{ color:"var(--accent-copper)" }}>*</span>
                    </Label>
                    <Input
                      value={formData.contactName}
                      onChange={e =>
                        setFormData({
                          ...formData,
                          contactName: e.target.value,
                        })
                      }
                      placeholder="John Smith"
                      style={{
                        background:"var(--bg-tertiary)",
                        border:"1px solid var(--border-subtle)",
                        color:"var(--text-[#D4AF37])",
                      }}
                    />
                  </div>

                  <div>
                    <Label
                      className="text-xs font-medium uppercase tracking-wide mb-2"
                      style={{ color:"var(--text-secondary)" }}
                    >
                      Job Title{""}
                      <span style={{ color:"var(--accent-copper)" }}>*</span>
                    </Label>
                    <Input
                      value={formData.contactTitle}
                      onChange={e =>
                        setFormData({
                          ...formData,
                          contactTitle: e.target.value,
                        })
                      }
                      placeholder="e.g., Head of Project Finance"
                      style={{
                        background:"var(--bg-tertiary)",
                        border:"1px solid var(--border-subtle)",
                        color:"var(--text-[#D4AF37])",
                      }}
                    />
                  </div>

                  <div>
                    <Label
                      className="text-xs font-medium uppercase tracking-wide mb-2"
                      style={{ color:"var(--text-secondary)" }}
                    >
                      Corporate Email{""}
                      <span style={{ color:"var(--accent-copper)" }}>*</span>
                    </Label>
                    <Input
                      type="email"
                      value={formData.contactEmail}
                      onChange={e =>
                        setFormData({
                          ...formData,
                          contactEmail: e.target.value,
                        })
                      }
                      placeholder="john.smith@institution.com"
                      style={{
                        background:"var(--bg-tertiary)",
                        border:"1px solid var(--border-subtle)",
                        color:"var(--text-[#D4AF37])",
                      }}
                    />
                  </div>

                  <div>
                    <Label
                      className="text-xs font-medium uppercase tracking-wide mb-2"
                      style={{ color:"var(--text-secondary)" }}
                    >
                      Phone Number{""}
                      <span style={{ color:"var(--accent-copper)" }}>*</span>
                    </Label>
                    <Input
                      type="tel"
                      value={formData.contactPhone}
                      onChange={e =>
                        setFormData({
                          ...formData,
                          contactPhone: e.target.value,
                        })
                      }
                      placeholder="+61 2 1234 5678"
                      style={{
                        background:"var(--bg-tertiary)",
                        border:"1px solid var(--border-subtle)",
                        color:"var(--text-[#D4AF37])",
                      }}
                    />
                  </div>

                  <div className="col-span-2">
                    <Label
                      className="text-xs font-medium uppercase tracking-wide mb-2"
                      style={{ color:"var(--text-secondary)" }}
                    >
                      Verification Method{""}
                      <span style={{ color:"var(--accent-copper)" }}>*</span>
                    </Label>
                    <Select
                      value={formData.verificationMethod}
                      onValueChange={value =>
                        setFormData({ ...formData, verificationMethod: value })
                      }
                    >
                      <SelectTrigger
                        style={{
                          background:"var(--bg-tertiary)",
                          border:"1px solid var(--border-subtle)",
                        }}
                      >
                        <SelectValue placeholder="Select verification method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="corporate-email">
                          Corporate Email Verification
                        </SelectItem>
                        <SelectItem value="document-upload">
                          Document Upload (Board Resolution)
                        </SelectItem>
                        <SelectItem value="video-call">
                          Video Call Verification
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Access Tier */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div>
                  <H3
                    className="text-2xl mb-2"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    Data Access Tier
                  </H3>
                  <p
                    style={{
                      color:"var(--text-secondary)",
                      fontSize:"14px",
                      fontWeight: 300,
                    }}
                  >
                    Select your subscription tier and data requirements
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  {[
                    {
                      id:"basic",
                      name:"Basic",
                      badge:"Starter",
                      price:"$50k p.a.",
                      features: [
"Market indices",
"Regional data",
"Quarterly reports",
                      ],
                    },
                    {
                      id:"professional",
                      name:"Professional",
                      badge:"Popular",
                      price:"$100k p.a.",
                      features: [
"Real-time data",
"API access",
"Custom reports",
"Priority support",
                      ],
                    },
                    {
                      id:"enterprise",
                      name:"Enterprise",
                      badge:"Premium",
                      price:"Custom",
                      features: [
"Full API access",
"Dedicated support",
"White-label options",
"Custom integration",
                      ],
                    },
                  ].map(tier => (
                    <div
                      key={tier.id}
                      onClick={() =>
                        setFormData({ ...formData, accessTier: tier.id })
                      }
                      className="rounded-xl p-6 cursor-pointer transition-all text-center"
                      style={{
                        background:
                          formData.accessTier === tier.id
                            ?"linear-gradient(180deg, rgba(201, 169, 98, 0.08) 0%, var(--bg-secondary) 100%)"
                            :"var(--bg-tertiary)",
                        border: `2px solid ${formData.accessTier === tier.id ?"var(--accent-gold)" :"var(--border-subtle)"}`,
                      }}
                    >
                      <div
                        className="inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide mb-3"
                        style={{
                          background:
                            tier.id ==="basic"
                              ?"var(--bg-elevated)"
                              : tier.id ==="professional"
                                ?"rgba(201, 169, 98, 0.2)"
                                :"rgba(184, 115, 51, 0.2)",
                          color:
                            tier.id ==="basic"
                              ?"var(--text-secondary)"
                              : tier.id ==="professional"
                                ?"var(--accent-gold)"
                                :"var(--accent-copper)",
                        }}
                      >
                        {tier.badge}
                      </div>
                      <H4
                        className="text-xl mb-2"
                        style={{ fontFamily: 'var(--font-display)' }}
                      >
                        {tier.name}
                      </H4>
                      <p
                        className="text-sm mb-4"
                        style={{
                          color:"var(--text-tertiary)",
                          fontWeight: 300,
                        }}
                      >
                        {tier.price}
                      </p>
                      <ul
                        className="text-left text-xs space-y-2"
                        style={{ color:"var(--text-secondary)" }}
                      >
                        {tier.features.map((feature, idx) => (
                          <li key={idx} className="flex items-center gap-2">
                            <span style={{ color:"var(--accent-green)" }}>
                              ✓
                            </span>
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Step 4: Compliance */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div>
                  <H3
                    className="text-2xl mb-2"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    Compliance & Declarations
                  </H3>
                  <p
                    style={{
                      color:"var(--text-secondary)",
                      fontSize:"14px",
                      fontWeight: 300,
                    }}
                  >
                    Review and accept the terms and conditions
                  </p>
                </div>

                <div
                  className="rounded-xl p-6 space-y-4"
                  style={{
                    background:"var(--bg-tertiary)",
                    border:"1px solid var(--border-subtle)",
                  }}
                >
                  <H4
                    className="text-sm font-semibold mb-4"
                    style={{ color:"var(--text-[#D4AF37])" }}
                  >
                    Required Declarations
                  </H4>

                  {[
                    {
                      id:"authorizedRepresentative",
                      label:
"I am an authorized representative of the institution with authority to enter into this agreement",
                    },
                    {
                      id:"dataProtection",
                      label:
"I acknowledge that all data accessed will be handled in accordance with Australian Privacy Principles and data protection regulations",
                    },
                    {
                      id:"regulatoryCompliance",
                      label:
"I confirm that our institution complies with all applicable financial services regulations",
                    },
                    {
                      id:"termsAccepted",
                      label:
"I have read and accept the Terms of Service and Data Access Agreement",
                    },
                  ].map(declaration => (
                    <div
                      key={declaration.id}
                      className="flex gap-3 pb-4 border-b last:border-0"
                      style={{ borderColor:"var(--border-subtle)" }}
                    >
                      <Checkbox
                        id={declaration.id}
                        checked={
                          formData.declarations[
                            declaration.id as keyof typeof formData.declarations
                          ]
                        }
                        onCheckedChange={checked =>
                          setFormData({
                            ...formData,
                            declarations: {
                              ...formData.declarations,
                              [declaration.id]: checked,
                            },
                          })
                        }
                        style={{ accentColor:"var(--accent-gold)" }}
                      />
                      <label
                        htmlFor={declaration.id}
                        className="text-sm leading-relaxed"
                        style={{ color:"var(--text-secondary)" }}
                      >
                        {declaration.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div
              className="flex justify-between mt-8 pt-6"
              style={{ borderTop:"1px solid var(--border-subtle)" }}
            >
              <Button
                onClick={handleBack}
                disabled={currentStep === 1}
                variant="ghost"
                style={{ color:"var(--text-secondary)" }}
              >
                Back
              </Button>
              <Button
                onClick={handleNext}
                className="px-8"
                style={{
                  background:"var(--gradient-gold)",
                  color:"var(--bg-primary)",
                  fontWeight: 600,
                }}
              >
                {currentStep === 4 ?"Submit Application" :"Continue"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
