/**
 * Claim Project Page
 * Multi-step form to claim ownership/affiliation with a bioenergy project
 */

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/Button";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Building2,
  Search,
  ChevronRight,
  ChevronLeft,
  Check,
  AlertCircle,
  MapPin,
  Factory,
  FileCheck,
  User,
  Mail,
  Phone,
  Briefcase,
  Building,
  Hash,
  Loader2,
  CheckCircle2,
  ClipboardList,
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { BankabilityBadge } from "@/components/registry/RatingBadges";
import { H1, H2, Body, DataLabel } from "@/components/Typography";
import { cn } from "@/lib/utils";

// Status colors for project cards
const STATUS_COLORS: Record<string, string> = {
  operational: "bg-green-100 text-green-800 border-green-300",
  development: "bg-blue-100 text-blue-800 border-blue-300",
  feasibility: "bg-amber-100 text-amber-800 border-amber-300",
  construction: "bg-purple-100 text-purple-800 border-purple-300",
  announced: "bg-gray-100 text-gray-800 border-gray-300",
  halted: "bg-red-100 text-red-800 border-red-300",
};

const CLAIM_TYPES = [
  { value: "owner", label: "Project Owner", description: "You own the company or are a majority stakeholder" },
  { value: "operator", label: "Project Operator", description: "You operate the facility on behalf of the owner" },
  { value: "developer", label: "Project Developer", description: "You are developing/constructing the project" },
  { value: "representative", label: "Authorized Representative", description: "You represent the project officially" },
];

const STEPS = [
  { id: 1, title: "Select Project", icon: Factory },
  { id: 2, title: "Claim Details", icon: Building },
  { id: 3, title: "Contact Info", icon: User },
  { id: 4, title: "Review", icon: FileCheck },
];

interface FormData {
  projectId: number | null;
  projectName: string;
  claimType: string;
  companyName: string;
  abn: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  position: string;
  verificationNotes: string;
}

export default function ClaimProject() {
  const [, navigate] = useLocation();
  const { user, loading: authLoading } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [search, setSearch] = useState("");
  const [formData, setFormData] = useState<FormData>({
    projectId: null,
    projectName: "",
    claimType: "",
    companyName: "",
    abn: "",
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    position: "",
    verificationNotes: "",
  });

  // Fetch unclaimed projects
  const { data: projectsData, isLoading: projectsLoading } = trpc.projectRegistry.list.useQuery({
    limit: 100,
  });

  // Mutation for submitting claim
  const submitClaimMutation = trpc.projectRegistry.submitClaim.useMutation({
    onSuccess: () => {
      setCurrentStep(5); // Success state
    },
  });

  // Filter to unclaimed projects
  const unclaimedProjects = useMemo(() => {
    if (!projectsData?.projects) return [];
    return projectsData.projects.filter(p => p.claimStatus !== "verified");
  }, [projectsData]);

  // Filter by search
  const filteredProjects = useMemo(() => {
    if (!search) return unclaimedProjects;
    const q = search.toLowerCase();
    return unclaimedProjects.filter(
      p =>
        p.name.toLowerCase().includes(q) ||
        p.company.toLowerCase().includes(q) ||
        p.location.toLowerCase().includes(q)
    );
  }, [unclaimedProjects, search]);

  // Form update helper
  const updateForm = (updates: Partial<FormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  // Validation
  const isStep1Valid = formData.projectId !== null;
  const isStep2Valid = formData.claimType !== "" && formData.companyName.trim() !== "";
  const isStep3Valid =
    formData.contactName.trim() !== "" &&
    formData.contactEmail.trim() !== "" &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contactEmail);

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return isStep1Valid;
      case 2:
        return isStep2Valid;
      case 3:
        return isStep3Valid;
      case 4:
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (canProceed() && currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = () => {
    if (!formData.projectId) return;

    submitClaimMutation.mutate({
      projectId: formData.projectId,
      claimType: formData.claimType as "owner" | "operator" | "developer" | "representative",
      companyName: formData.companyName,
      abn: formData.abn || undefined,
      contactName: formData.contactName,
      contactEmail: formData.contactEmail,
      contactPhone: formData.contactPhone || undefined,
      position: formData.position || undefined,
      verificationNotes: formData.verificationNotes || undefined,
    });
  };

  // Auth check
  if (authLoading) {
    return (
      <div className="container mx-auto px-4 py-12 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-12">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-amber-500 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Authentication Required</h2>
            <p className="text-muted-foreground mb-4">
              You need to be logged in to claim a project.
            </p>
            <Link href="/login">
              <Button>Log In to Continue</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Success state
  if (currentStep === 5) {
    return (
      <div className="container mx-auto px-4 py-12">
        <Card className="max-w-lg mx-auto">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-semibold mb-2">Claim Submitted!</h2>
            <p className="text-muted-foreground mb-6">
              Your claim for <strong>{formData.projectName}</strong> has been submitted successfully.
              Our team will review your request and verify your affiliation.
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              You will receive an email notification at <strong>{formData.contactEmail}</strong> once
              your claim has been reviewed.
            </p>
            <div className="flex gap-3 justify-center">
              <Link href="/registry">
                <Button variant="outline">Back to Registry</Button>
              </Link>
              <Link href="/dashboard">
                <Button>Go to Dashboard</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 bg-primary/10 rounded-lg">
          <ClipboardList className="h-6 w-6 text-primary" />
        </div>
        <div>
          <H1>Claim Your Project</H1>
          <Body className="text-muted-foreground">
            Verify your affiliation to manage your project's public profile
          </Body>
        </div>
      </div>

      {/* Progress Steps */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            {STEPS.map((step, index) => (
              <div key={step.id} className="flex items-center flex-1">
                <div
                  className={cn(
                    "flex items-center gap-2",
                    currentStep >= step.id ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  <div
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                      currentStep > step.id
                        ? "bg-primary text-primary-foreground"
                        : currentStep === step.id
                        ? "bg-primary/20 text-primary border-2 border-primary"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {currentStep > step.id ? <Check className="h-4 w-4" /> : step.id}
                  </div>
                  <span className="hidden sm:inline text-sm font-medium">{step.title}</span>
                </div>
                {index < STEPS.length - 1 && (
                  <div
                    className={cn(
                      "flex-1 h-0.5 mx-4",
                      currentStep > step.id ? "bg-primary" : "bg-muted"
                    )}
                  />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Form Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {/* Step 1: Select Project */}
          {currentStep === 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Factory className="h-5 w-5" />
                  Select Project
                </CardTitle>
                <CardDescription>
                  Search and select the project you want to claim
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by project name, company, or location..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>

                {projectsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[400px] overflow-y-auto">
                    {filteredProjects.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        No unclaimed projects found
                      </div>
                    ) : (
                      filteredProjects.map((project) => (
                        <div
                          key={project.id}
                          onClick={() => updateForm({ projectId: project.id, projectName: project.name })}
                          className={cn(
                            "p-4 border rounded-lg cursor-pointer transition-all",
                            formData.projectId === project.id
                              ? "border-primary bg-primary/5 ring-1 ring-primary"
                              : "hover:border-primary/50 hover:bg-muted/50"
                          )}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <h4 className="font-medium">{project.name}</h4>
                              <p className="text-sm text-muted-foreground">{project.company}</p>
                            </div>
                            <BankabilityBadge rating={project.bankabilityRating} size="md" />
                          </div>
                          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3.5 w-3.5" />
                              {project.location}
                            </div>
                            <Badge
                              variant="outline"
                              className={cn("text-xs", STATUS_COLORS[project.status])}
                            >
                              {project.status}
                            </Badge>
                            {project.claimStatus === "pending" && (
                              <Badge variant="outline" className="text-xs text-amber-600">
                                Claim Pending
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Step 2: Claim Details */}
          {currentStep === 2 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  Claim Details
                </CardTitle>
                <CardDescription>
                  Provide information about your relationship to the project
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <Label>Claim Type *</Label>
                  <RadioGroup
                    value={formData.claimType}
                    onValueChange={(value) => updateForm({ claimType: value })}
                    className="space-y-2"
                  >
                    {CLAIM_TYPES.map((type) => (
                      <div
                        key={type.value}
                        className={cn(
                          "flex items-start space-x-3 p-3 border rounded-lg cursor-pointer transition-all",
                          formData.claimType === type.value
                            ? "border-primary bg-primary/5"
                            : "hover:border-primary/50"
                        )}
                        onClick={() => updateForm({ claimType: type.value })}
                      >
                        <RadioGroupItem value={type.value} id={type.value} />
                        <div className="flex-1">
                          <Label htmlFor={type.value} className="cursor-pointer font-medium">
                            {type.label}
                          </Label>
                          <p className="text-sm text-muted-foreground">{type.description}</p>
                        </div>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="companyName">
                      <Building2 className="h-4 w-4 inline mr-1" />
                      Company Name *
                    </Label>
                    <Input
                      id="companyName"
                      placeholder="Your company name"
                      value={formData.companyName}
                      onChange={(e) => updateForm({ companyName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="abn">
                      <Hash className="h-4 w-4 inline mr-1" />
                      ABN (Australian Business Number)
                    </Label>
                    <Input
                      id="abn"
                      placeholder="XX XXX XXX XXX"
                      value={formData.abn}
                      onChange={(e) => updateForm({ abn: e.target.value })}
                    />
                    <p className="text-xs text-muted-foreground">
                      Optional but helps speed up verification
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Contact Info */}
          {currentStep === 3 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Contact Information
                </CardTitle>
                <CardDescription>
                  Provide your contact details for verification
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="contactName">
                      <User className="h-4 w-4 inline mr-1" />
                      Full Name *
                    </Label>
                    <Input
                      id="contactName"
                      placeholder="Your full name"
                      value={formData.contactName}
                      onChange={(e) => updateForm({ contactName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="position">
                      <Briefcase className="h-4 w-4 inline mr-1" />
                      Position/Title
                    </Label>
                    <Input
                      id="position"
                      placeholder="e.g., CEO, Project Manager"
                      value={formData.position}
                      onChange={(e) => updateForm({ position: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="contactEmail">
                      <Mail className="h-4 w-4 inline mr-1" />
                      Email Address *
                    </Label>
                    <Input
                      id="contactEmail"
                      type="email"
                      placeholder="your@email.com"
                      value={formData.contactEmail}
                      onChange={(e) => updateForm({ contactEmail: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contactPhone">
                      <Phone className="h-4 w-4 inline mr-1" />
                      Phone Number
                    </Label>
                    <Input
                      id="contactPhone"
                      type="tel"
                      placeholder="+61 XXX XXX XXX"
                      value={formData.contactPhone}
                      onChange={(e) => updateForm({ contactPhone: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="verificationNotes">Additional Notes</Label>
                  <Textarea
                    id="verificationNotes"
                    placeholder="Any additional information to help verify your claim..."
                    value={formData.verificationNotes}
                    onChange={(e) => updateForm({ verificationNotes: e.target.value })}
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 4: Review */}
          {currentStep === 4 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileCheck className="h-5 w-5" />
                  Review Your Claim
                </CardTitle>
                <CardDescription>
                  Please review your information before submitting
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Project */}
                <div className="p-4 bg-muted/50 rounded-lg">
                  <DataLabel className="mb-2">Project</DataLabel>
                  <p className="font-medium">{formData.projectName}</p>
                </div>

                {/* Claim Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <DataLabel className="mb-2">Claim Type</DataLabel>
                    <p className="font-medium">
                      {CLAIM_TYPES.find((t) => t.value === formData.claimType)?.label}
                    </p>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <DataLabel className="mb-2">Company</DataLabel>
                    <p className="font-medium">{formData.companyName}</p>
                    {formData.abn && (
                      <p className="text-sm text-muted-foreground">ABN: {formData.abn}</p>
                    )}
                  </div>
                </div>

                {/* Contact Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <DataLabel className="mb-2">Contact Name</DataLabel>
                    <p className="font-medium">{formData.contactName}</p>
                    {formData.position && (
                      <p className="text-sm text-muted-foreground">{formData.position}</p>
                    )}
                  </div>
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <DataLabel className="mb-2">Contact Details</DataLabel>
                    <p className="font-medium">{formData.contactEmail}</p>
                    {formData.contactPhone && (
                      <p className="text-sm text-muted-foreground">{formData.contactPhone}</p>
                    )}
                  </div>
                </div>

                {formData.verificationNotes && (
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <DataLabel className="mb-2">Additional Notes</DataLabel>
                    <p className="text-sm">{formData.verificationNotes}</p>
                  </div>
                )}

                {submitClaimMutation.error && (
                  <div className="p-4 bg-destructive/10 border border-destructive rounded-lg flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-destructive">Submission Failed</p>
                      <p className="text-sm text-destructive/80">
                        {submitClaimMutation.error.message}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-6">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 1}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back
            </Button>

            {currentStep < 4 ? (
              <Button onClick={handleNext} disabled={!canProceed()}>
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={submitClaimMutation.isPending}
              >
                {submitClaimMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-1" />
                    Submit Claim
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Why Claim Your Project?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                <span>Manage your public profile and project details</span>
              </div>
              <div className="flex gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                <span>Improve your bankability rating visibility</span>
              </div>
              <div className="flex gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                <span>Connect with potential investors and partners</span>
              </div>
              <div className="flex gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                <span>Access detailed analytics and insights</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Verification Process</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>
                After submitting your claim, our team will verify your affiliation
                with the project. This typically takes 2-3 business days.
              </p>
              <p>
                You may be contacted to provide additional documentation such as:
              </p>
              <ul className="list-disc list-inside space-y-1">
                <li>Company registration documents</li>
                <li>Proof of employment/role</li>
                <li>Project authorization letter</li>
              </ul>
            </CardContent>
          </Card>

          {formData.projectId && (
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Selected Project</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-medium">{formData.projectName}</p>
                <Link href={`/registry/project/${filteredProjects.find(p => p.id === formData.projectId)?.slug}`}>
                  <Button variant="link" className="h-auto p-0 text-sm">
                    View project details
                    <ChevronRight className="h-3 w-3 ml-1" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
