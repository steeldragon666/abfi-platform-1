import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useFormAutoSave, AutoSaveIndicator } from "@/hooks/useFormAutoSave";

import { Check, ChevronRight, ChevronLeft } from "lucide-react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const STEPS = [
  { id: 1, label: "Project", title: "Project Overview" },
  { id: 2, label: "Technology", title: "Technology Details" },
  { id: 3, label: "Feedstock", title: "Feedstock Requirements" },
  { id: 4, label: "Funding", title: "Funding Status" },
  { id: 5, label: "Approvals", title: "Approvals & Permits" },
  { id: 6, label: "Verification", title: "Verification" },
  { id: 7, label: "Opportunities", title: "Opportunities" },
];

export default function ProjectRegistrationFlow() {
  const [, setLocation] = useLocation();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Step 1: Project Overview
    projectName: "",
    developerName: "",
    abn: "",
    website: "",
    region: "",
    siteAddress: "",
    developmentStage: "",

    // Step 2: Technology Details
    conversionTechnology: "",
    technologyProvider: "",
    primaryOutput: "",
    secondaryOutputs: "",
    nameplateCapacity: "",
    outputCapacity: "",
    outputUnit: "",

    // Step 3: Feedstock Requirements
    feedstockType: "",
    secondaryFeedstocks: "",
    annualFeedstockVolume: "",
    feedstockQualitySpecs: "",
    supplyRadius: "",
    logisticsRequirements: "",

    // Step 4: Funding Status
    totalCapex: "",
    fundingSecured: "",
    fundingSources: "",
    investmentStage: "",
    seekingInvestment: false,
    investmentAmount: "",

    // Step 5: Approvals & Permits
    environmentalApproval: false,
    planningPermit: false,
    epaLicense: false,
    otherApprovals: "",
    approvalsNotes: "",

    // Step 6: Verification
    verificationDocuments: [] as string[],
    verificationNotes: "",

    // Step 7: Opportunities
    feedstockMatchingEnabled: true,
    financingInterest: false,
    partnershipInterest: false,
    publicVisibility: "private",
  });

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Auto-save form data to localStorage
  const { savedData, saveStatus, lastSavedAt, clearSavedData } = useFormAutoSave({
    key: "project-registration",
    data: { formData, currentStep },
    version: 1,
    debounceMs: 1500,
  });

  // Restore saved data on mount
  useEffect(() => {
    if (savedData) {
      setFormData(savedData.formData);
      setCurrentStep(savedData.currentStep);
    }
  }, []); // Only run on mount

  const handleNext = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const registerProjectMutation = trpc.bankability.registerProject.useMutation({
    onSuccess: () => {
      // Clear auto-saved draft on successful submission
      clearSavedData();
      alert(
        "Project registered successfully! Your application has been submitted for review."
      );
      setLocation("/project-registration/success");
    },
    onError: error => {
      alert(`Registration failed: ${error.message || "Please try again."}`);
    },
  });

  const handleSubmit = () => {
    registerProjectMutation.mutate({
      projectName: formData.projectName,
      developerName: formData.developerName,
      abn: formData.abn,
      website: formData.website || undefined,
      region: formData.region,
      siteAddress: formData.siteAddress,
      developmentStage: formData.developmentStage as any,
      conversionTechnology: formData.conversionTechnology as any,
      technologyProvider: formData.technologyProvider || undefined,
      primaryOutput: formData.primaryOutput as any,
      secondaryOutputs: formData.secondaryOutputs || undefined,
      nameplateCapacity: formData.nameplateCapacity || undefined,
      outputCapacity: formData.outputCapacity || undefined,
      outputUnit: formData.outputUnit || undefined,
      feedstockType: formData.feedstockType,
      secondaryFeedstocks: formData.secondaryFeedstocks || undefined,
      annualFeedstockVolume: formData.annualFeedstockVolume || undefined,
      feedstockQualitySpecs: formData.feedstockQualitySpecs || undefined,
      supplyRadius: formData.supplyRadius || undefined,
      logisticsRequirements: formData.logisticsRequirements || undefined,
      totalCapex: formData.totalCapex || undefined,
      fundingSecured: formData.fundingSecured || undefined,
      fundingSources: formData.fundingSources || undefined,
      investmentStage: formData.investmentStage as any,
      seekingInvestment: formData.seekingInvestment,
      investmentAmount: formData.investmentAmount || undefined,
      environmentalApproval: formData.environmentalApproval,
      planningPermit: formData.planningPermit,
      epaLicense: formData.epaLicense,
      otherApprovals: formData.otherApprovals || undefined,
      approvalsNotes: formData.approvalsNotes || undefined,
      verificationNotes: formData.verificationNotes || undefined,
      feedstockMatchingEnabled: formData.feedstockMatchingEnabled,
      financingInterest: formData.financingInterest,
      partnershipInterest: formData.partnershipInterest,
      publicVisibility: formData.publicVisibility as any,
    });
  };

  return (
    <div className="min-h-screen bg-[#0a0f14] text-black">
      {/* Background gradients */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-[15%] w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-[15%] w-96 h-96 bg-[#c9a962]/5 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="font-serif text-3xl mb-2">
            {STEPS[currentStep - 1].title}
          </h1>
          <div className="flex items-center justify-center gap-3">
            <p className="text-gray-400 text-sm">
              Step {currentStep} of {STEPS.length}
            </p>
            <span className="text-gray-600">|</span>
            <AutoSaveIndicator
              status={saveStatus}
              lastSavedAt={lastSavedAt}
              className="text-gray-400"
            />
          </div>
        </div>

        {/* Progress Indicator */}
        <div className="mb-12">
          <div className="flex items-center justify-between">
            {STEPS.map((step, idx) => (
              <div key={step.id} className="flex flex-col items-center flex-1">
                <div
                  className={`w-10 h-10 rounded-full border-2 flex items-center justify-center font-mono text-sm transition-colors ${
                    step.id < currentStep
                      ? "bg-green-500 border-green-500 text-black"
                      : step.id === currentStep
                        ? "bg-[#c9a962] border-[#c9a962] text-[#0a0f14]"
                        : "bg-[#1a222d] border-[#1a222d] text-gray-500"
                  }`}
                >
                  {step.id < currentStep ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    step.id
                  )}
                </div>
                <span className="text-[9px] uppercase tracking-wide text-gray-500 mt-2 text-center">
                  {step.label}
                </span>
                {idx < STEPS.length - 1 && (
                  <div
                    className={`absolute w-full h-0.5 top-5 left-1/2 -z-10 ${
                      step.id < currentStep ? "bg-green-500" : "bg-[#1a222d]"
                    }`}
                    style={{
                      width: `calc(100% / ${STEPS.length} - 40px)`,
                      marginLeft: "20px",
                    }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Form Content */}
        <div className="bg-[#111820] border border-[#c9a962]/15 rounded-2xl p-8 mb-8">
          {currentStep === 1 && (
            <Step1 formData={formData} updateFormData={updateFormData} />
          )}
          {currentStep === 2 && (
            <Step2 formData={formData} updateFormData={updateFormData} />
          )}
          {currentStep === 3 && (
            <Step3 formData={formData} updateFormData={updateFormData} />
          )}
          {currentStep === 4 && (
            <Step4 formData={formData} updateFormData={updateFormData} />
          )}
          {currentStep === 5 && (
            <Step5 formData={formData} updateFormData={updateFormData} />
          )}
          {currentStep === 6 && (
            <Step6 formData={formData} updateFormData={updateFormData} />
          )}
          {currentStep === 7 && (
            <Step7 formData={formData} updateFormData={updateFormData} />
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 1}
            className="border-[#c9a962]/30 text-black hover:bg-[#c9a962]/10"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>

          {currentStep < STEPS.length ? (
            <Button
              onClick={handleNext}
              className="bg-gradient-to-r from-[#c9a962] to-[#8a7443] text-[#0a0f14] hover:opacity-90"
            >
              Continue
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              className="bg-gradient-to-r from-green-600 to-green-700 text-black hover:opacity-90"
            >
              Submit Registration
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// Step 1: Project Overview
function Step1({ formData, updateFormData }: any) {
  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-400">
        Tell us about your bioenergy or biorefinery project.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="projectName">Project Name *</Label>
          <Input
            id="projectName"
            value={formData.projectName}
            onChange={e => updateFormData("projectName", e.target.value)}
            placeholder="e.g., Burdekin BioHub"
            className="bg-[#0a0f14] border-[#c9a962]/20"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="developerName">Developer / Proponent *</Label>
          <Input
            id="developerName"
            value={formData.developerName}
            onChange={e => updateFormData("developerName", e.target.value)}
            placeholder="Company or entity name"
            className="bg-[#0a0f14] border-[#c9a962]/20"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="abn">ABN / ACN</Label>
          <Input
            id="abn"
            value={formData.abn}
            onChange={e => updateFormData("abn", e.target.value)}
            placeholder="XX XXX XXX XXX"
            className="bg-[#0a0f14] border-[#c9a962]/20"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="website">Website</Label>
          <Input
            id="website"
            type="url"
            value={formData.website}
            onChange={e => updateFormData("website", e.target.value)}
            placeholder="https://..."
            className="bg-[#0a0f14] border-[#c9a962]/20"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="region">Project Location — Region *</Label>
          <Select
            value={formData.region}
            onValueChange={value => updateFormData("region", value)}
          >
            <SelectTrigger className="bg-[#0a0f14] border-[#c9a962]/20">
              <SelectValue placeholder="Select region..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="burdekin">Burdekin</SelectItem>
              <SelectItem value="townsville">Townsville</SelectItem>
              <SelectItem value="cairns">Cairns / Far North</SelectItem>
              <SelectItem value="mackay">Mackay-Whitsunday</SelectItem>
              <SelectItem value="gladstone">Gladstone</SelectItem>
              <SelectItem value="bundaberg">Bundaberg / Wide Bay</SelectItem>
              <SelectItem value="brisbane">Brisbane / SEQ</SelectItem>
              <SelectItem value="hunter">Hunter / Newcastle</SelectItem>
              <SelectItem value="sydney">Sydney / Illawarra</SelectItem>
              <SelectItem value="melbourne">Melbourne / Geelong</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="siteAddress">Site Address / Location</Label>
          <Input
            id="siteAddress"
            value={formData.siteAddress}
            onChange={e => updateFormData("siteAddress", e.target.value)}
            placeholder="Specific site or general area"
            className="bg-[#0a0f14] border-[#c9a962]/20"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Development Stage *</Label>
        <RadioGroup
          value={formData.developmentStage}
          onValueChange={value => updateFormData("developmentStage", value)}
        >
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { value: "concept", label: "Concept", desc: "Early feasibility" },
              {
                value: "prefeasibility",
                label: "Pre-Feasibility",
                desc: "Initial studies",
              },
              {
                value: "feasibility",
                label: "Feasibility",
                desc: "Detailed analysis",
              },
              { value: "fid", label: "FID", desc: "Investment decision" },
              {
                value: "construction",
                label: "Construction",
                desc: "Under construction",
              },
              {
                value: "operational",
                label: "Operational",
                desc: "Currently operating",
              },
            ].map(stage => (
              <div
                key={stage.value}
                className="flex items-start space-x-2 p-3 border border-[#c9a962]/15 rounded-lg hover:bg-[#c9a962]/5 cursor-pointer"
              >
                <RadioGroupItem value={stage.value} id={stage.value} />
                <Label htmlFor={stage.value} className="cursor-pointer flex-1">
                  <div className="font-semibold text-sm">{stage.label}</div>
                  <div className="text-xs text-gray-500">{stage.desc}</div>
                </Label>
              </div>
            ))}
          </div>
        </RadioGroup>
      </div>
    </div>
  );
}

// Step 2: Technology Details
function Step2({ formData, updateFormData }: any) {
  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-400">
        Describe the conversion technology and expected outputs.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="conversionTechnology">Conversion Technology *</Label>
          <Select
            value={formData.conversionTechnology}
            onValueChange={value =>
              updateFormData("conversionTechnology", value)
            }
          >
            <SelectTrigger className="bg-[#0a0f14] border-[#c9a962]/20">
              <SelectValue placeholder="Select technology..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="anaerobic_digestion">
                Anaerobic Digestion
              </SelectItem>
              <SelectItem value="gasification">Gasification</SelectItem>
              <SelectItem value="pyrolysis">Pyrolysis</SelectItem>
              <SelectItem value="fermentation">Fermentation</SelectItem>
              <SelectItem value="combustion">Combustion</SelectItem>
              <SelectItem value="hydrothermal">
                Hydrothermal Processing
              </SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="technologyProvider">Technology Provider</Label>
          <Input
            id="technologyProvider"
            value={formData.technologyProvider}
            onChange={e => updateFormData("technologyProvider", e.target.value)}
            placeholder="Equipment/technology supplier"
            className="bg-[#0a0f14] border-[#c9a962]/20"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="primaryOutput">Primary Output *</Label>
          <Select
            value={formData.primaryOutput}
            onValueChange={value => updateFormData("primaryOutput", value)}
          >
            <SelectTrigger className="bg-[#0a0f14] border-[#c9a962]/20">
              <SelectValue placeholder="Select output..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="biogas">Biogas</SelectItem>
              <SelectItem value="biomethane">Biomethane</SelectItem>
              <SelectItem value="bioethanol">Bioethanol</SelectItem>
              <SelectItem value="biodiesel">Biodiesel</SelectItem>
              <SelectItem value="syngas">Syngas</SelectItem>
              <SelectItem value="bio_oil">Bio-oil</SelectItem>
              <SelectItem value="electricity">Electricity</SelectItem>
              <SelectItem value="heat">Heat/Steam</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="secondaryOutputs">Secondary Outputs</Label>
          <Input
            id="secondaryOutputs"
            value={formData.secondaryOutputs}
            onChange={e => updateFormData("secondaryOutputs", e.target.value)}
            placeholder="e.g., Digestate, CO₂, Heat"
            className="bg-[#0a0f14] border-[#c9a962]/20"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="nameplateCapacity">
            Feedstock Capacity (tonnes/year) *
          </Label>
          <Input
            id="nameplateCapacity"
            type="number"
            value={formData.nameplateCapacity}
            onChange={e => updateFormData("nameplateCapacity", e.target.value)}
            placeholder="e.g., 100000"
            className="bg-[#0a0f14] border-[#c9a962]/20"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="outputCapacity">Output Capacity *</Label>
          <div className="flex gap-2">
            <Input
              id="outputCapacity"
              type="number"
              value={formData.outputCapacity}
              onChange={e => updateFormData("outputCapacity", e.target.value)}
              placeholder="e.g., 50"
              className="bg-[#0a0f14] border-[#c9a962]/20 flex-1"
            />
            <Select
              value={formData.outputUnit}
              onValueChange={value => updateFormData("outputUnit", value)}
            >
              <SelectTrigger className="bg-[#0a0f14] border-[#c9a962]/20 w-32">
                <SelectValue placeholder="Unit" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MW">MW</SelectItem>
                <SelectItem value="GJ/day">GJ/day</SelectItem>
                <SelectItem value="m3/day">m³/day</SelectItem>
                <SelectItem value="L/year">L/year</SelectItem>
                <SelectItem value="tonnes/year">tonnes/year</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  );
}

// Step 3: Feedstock Requirements
function Step3({ formData, updateFormData }: any) {
  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-400">
        Specify your feedstock needs and quality requirements.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="feedstockType">Primary Feedstock Type *</Label>
          <Select
            value={formData.feedstockType}
            onValueChange={value => updateFormData("feedstockType", value)}
          >
            <SelectTrigger className="bg-[#0a0f14] border-[#c9a962]/20">
              <SelectValue placeholder="Select feedstock..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="bagasse">Bagasse (Sugarcane)</SelectItem>
              <SelectItem value="cereal_straw">Cereal Straw</SelectItem>
              <SelectItem value="wood_chips">Wood Chips</SelectItem>
              <SelectItem value="corn_stover">Corn Stover</SelectItem>
              <SelectItem value="cotton_trash">Cotton Trash</SelectItem>
              <SelectItem value="green_waste">Green Waste</SelectItem>
              <SelectItem value="food_waste">Food Waste</SelectItem>
              <SelectItem value="animal_manure">Animal Manure</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="secondaryFeedstocks">Secondary Feedstocks</Label>
          <Input
            id="secondaryFeedstocks"
            value={formData.secondaryFeedstocks}
            onChange={e =>
              updateFormData("secondaryFeedstocks", e.target.value)
            }
            placeholder="e.g., Wood waste, Green waste"
            className="bg-[#0a0f14] border-[#c9a962]/20"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="annualFeedstockVolume">
            Annual Feedstock Volume (tonnes) *
          </Label>
          <Input
            id="annualFeedstockVolume"
            type="number"
            value={formData.annualFeedstockVolume}
            onChange={e =>
              updateFormData("annualFeedstockVolume", e.target.value)
            }
            placeholder="e.g., 100000"
            className="bg-[#0a0f14] border-[#c9a962]/20"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="supplyRadius">Supply Radius (km)</Label>
          <Input
            id="supplyRadius"
            type="number"
            value={formData.supplyRadius}
            onChange={e => updateFormData("supplyRadius", e.target.value)}
            placeholder="e.g., 150"
            className="bg-[#0a0f14] border-[#c9a962]/20"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="feedstockQualitySpecs">Quality Specifications</Label>
        <Textarea
          id="feedstockQualitySpecs"
          value={formData.feedstockQualitySpecs}
          onChange={e =>
            updateFormData("feedstockQualitySpecs", e.target.value)
          }
          placeholder="e.g., Moisture content <15%, Ash content <5%, Particle size 10-50mm"
          className="bg-[#0a0f14] border-[#c9a962]/20 min-h-24"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="logisticsRequirements">Logistics Requirements</Label>
        <Textarea
          id="logisticsRequirements"
          value={formData.logisticsRequirements}
          onChange={e =>
            updateFormData("logisticsRequirements", e.target.value)
          }
          placeholder="e.g., Truck delivery, Rail siding available, Storage capacity 5000 tonnes"
          className="bg-[#0a0f14] border-[#c9a962]/20 min-h-24"
        />
      </div>
    </div>
  );
}

// Step 4: Funding Status
function Step4({ formData, updateFormData }: any) {
  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-400">
        Provide information about project financing.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="totalCapex">Total CAPEX ($M) *</Label>
          <Input
            id="totalCapex"
            type="number"
            value={formData.totalCapex}
            onChange={e => updateFormData("totalCapex", e.target.value)}
            placeholder="e.g., 150"
            className="bg-[#0a0f14] border-[#c9a962]/20"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="fundingSecured">Funding Secured ($M)</Label>
          <Input
            id="fundingSecured"
            type="number"
            value={formData.fundingSecured}
            onChange={e => updateFormData("fundingSecured", e.target.value)}
            placeholder="e.g., 50"
            className="bg-[#0a0f14] border-[#c9a962]/20"
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="fundingSources">Funding Sources</Label>
          <Textarea
            id="fundingSources"
            value={formData.fundingSources}
            onChange={e => updateFormData("fundingSources", e.target.value)}
            placeholder="e.g., Equity investors, ARENA grant, Commercial debt"
            className="bg-[#0a0f14] border-[#c9a962]/20 min-h-20"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="investmentStage">Investment Stage *</Label>
          <Select
            value={formData.investmentStage}
            onValueChange={value => updateFormData("investmentStage", value)}
          >
            <SelectTrigger className="bg-[#0a0f14] border-[#c9a962]/20">
              <SelectValue placeholder="Select stage..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="seed">Seed</SelectItem>
              <SelectItem value="series_a">Series A</SelectItem>
              <SelectItem value="series_b">Series B</SelectItem>
              <SelectItem value="pre_fid">Pre-FID</SelectItem>
              <SelectItem value="post_fid">Post-FID</SelectItem>
              <SelectItem value="operational">Operational</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="investmentAmount">Seeking Investment ($M)</Label>
          <Input
            id="investmentAmount"
            type="number"
            value={formData.investmentAmount}
            onChange={e => updateFormData("investmentAmount", e.target.value)}
            placeholder="e.g., 100"
            className="bg-[#0a0f14] border-[#c9a962]/20"
            disabled={!formData.seekingInvestment}
          />
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="seekingInvestment"
          checked={formData.seekingInvestment}
          onCheckedChange={checked =>
            updateFormData("seekingInvestment", checked)
          }
        />
        <Label htmlFor="seekingInvestment" className="cursor-pointer">
          Currently seeking investment
        </Label>
      </div>
    </div>
  );
}

// Step 5: Approvals & Permits
function Step5({ formData, updateFormData }: any) {
  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-400">
        Indicate which approvals and permits have been obtained.
      </p>

      <div className="space-y-4">
        <div className="flex items-center space-x-2 p-3 border border-[#c9a962]/15 rounded-lg">
          <Checkbox
            id="environmentalApproval"
            checked={formData.environmentalApproval}
            onCheckedChange={checked =>
              updateFormData("environmentalApproval", checked)
            }
          />
          <Label
            htmlFor="environmentalApproval"
            className="cursor-pointer flex-1"
          >
            <div className="font-semibold text-sm">Environmental Approval</div>
            <div className="text-xs text-gray-500">
              State or Commonwealth environmental assessment
            </div>
          </Label>
        </div>

        <div className="flex items-center space-x-2 p-3 border border-[#c9a962]/15 rounded-lg">
          <Checkbox
            id="planningPermit"
            checked={formData.planningPermit}
            onCheckedChange={checked =>
              updateFormData("planningPermit", checked)
            }
          />
          <Label htmlFor="planningPermit" className="cursor-pointer flex-1">
            <div className="font-semibold text-sm">Planning Permit</div>
            <div className="text-xs text-gray-500">
              Local council development approval
            </div>
          </Label>
        </div>

        <div className="flex items-center space-x-2 p-3 border border-[#c9a962]/15 rounded-lg">
          <Checkbox
            id="epaLicense"
            checked={formData.epaLicense}
            onCheckedChange={checked => updateFormData("epaLicense", checked)}
          />
          <Label htmlFor="epaLicense" className="cursor-pointer flex-1">
            <div className="font-semibold text-sm">EPA License</div>
            <div className="text-xs text-gray-500">
              Environmental Protection Authority operating license
            </div>
          </Label>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="otherApprovals">Other Approvals</Label>
        <Input
          id="otherApprovals"
          value={formData.otherApprovals}
          onChange={e => updateFormData("otherApprovals", e.target.value)}
          placeholder="e.g., Water license, Grid connection approval"
          className="bg-[#0a0f14] border-[#c9a962]/20"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="approvalsNotes">Additional Notes</Label>
        <Textarea
          id="approvalsNotes"
          value={formData.approvalsNotes}
          onChange={e => updateFormData("approvalsNotes", e.target.value)}
          placeholder="Any additional information about approvals status or timeline"
          className="bg-[#0a0f14] border-[#c9a962]/20 min-h-24"
        />
      </div>
    </div>
  );
}

// Step 6: Verification
function Step6({ formData, updateFormData }: any) {
  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-400">
        Upload supporting documents for third-party verification (optional but
        recommended).
      </p>

      <div className="border-2 border-dashed border-[#c9a962]/30 rounded-lg p-8 text-center">
        <div className="text-gray-400 mb-4">
          <svg
            className="w-12 h-12 mx-auto mb-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
          <p className="text-sm font-semibold">Upload Documents</p>
          <p className="text-xs text-gray-500 mt-1">
            Drag and drop or click to browse
          </p>
        </div>
        <Button variant="outline" className="border-[#c9a962]/30">
          Choose Files
        </Button>
        <p className="text-xs text-gray-500 mt-4">
          Accepted: PDF, DOCX, XLSX, Images (max 10MB each)
        </p>
      </div>

      <div className="space-y-2">
        <Label>Suggested Documents</Label>
        <ul className="text-sm text-gray-400 space-y-1 pl-4">
          <li>• Feasibility study summary</li>
          <li>• Technology provider agreement or LOI</li>
          <li>• Environmental approval documents</li>
          <li>• Planning permit</li>
          <li>• Funding commitment letters</li>
          <li>• Site lease or ownership proof</li>
        </ul>
      </div>

      <div className="space-y-2">
        <Label htmlFor="verificationNotes">Verification Notes</Label>
        <Textarea
          id="verificationNotes"
          value={formData.verificationNotes}
          onChange={e => updateFormData("verificationNotes", e.target.value)}
          placeholder="Any additional context for the verification team"
          className="bg-[#0a0f14] border-[#c9a962]/20 min-h-24"
        />
      </div>
    </div>
  );
}

// Step 7: Opportunities
function Step7({ formData, updateFormData }: any) {
  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-400">
        Choose how you want to engage with the platform.
      </p>

      <div className="space-y-4">
        <div className="flex items-center space-x-2 p-3 border border-[#c9a962]/15 rounded-lg">
          <Checkbox
            id="feedstockMatchingEnabled"
            checked={formData.feedstockMatchingEnabled}
            onCheckedChange={checked =>
              updateFormData("feedstockMatchingEnabled", checked)
            }
          />
          <Label
            htmlFor="feedstockMatchingEnabled"
            className="cursor-pointer flex-1"
          >
            <div className="font-semibold text-sm">
              Enable Feedstock Matching
            </div>
            <div className="text-xs text-gray-500">
              Receive notifications when suitable feedstock suppliers register
            </div>
          </Label>
        </div>

        <div className="flex items-center space-x-2 p-3 border border-[#c9a962]/15 rounded-lg">
          <Checkbox
            id="financingInterest"
            checked={formData.financingInterest}
            onCheckedChange={checked =>
              updateFormData("financingInterest", checked)
            }
          />
          <Label htmlFor="financingInterest" className="cursor-pointer flex-1">
            <div className="font-semibold text-sm">Financing Interest</div>
            <div className="text-xs text-gray-500">
              Appear in deal flow for financial institutions and investors
            </div>
          </Label>
        </div>

        <div className="flex items-center space-x-2 p-3 border border-[#c9a962]/15 rounded-lg">
          <Checkbox
            id="partnershipInterest"
            checked={formData.partnershipInterest}
            onCheckedChange={checked =>
              updateFormData("partnershipInterest", checked)
            }
          />
          <Label
            htmlFor="partnershipInterest"
            className="cursor-pointer flex-1"
          >
            <div className="font-semibold text-sm">
              Partnership Opportunities
            </div>
            <div className="text-xs text-gray-500">
              Open to strategic partnerships and collaboration
            </div>
          </Label>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="publicVisibility">Project Visibility</Label>
        <Select
          value={formData.publicVisibility}
          onValueChange={value => updateFormData("publicVisibility", value)}
        >
          <SelectTrigger className="bg-[#0a0f14] border-[#c9a962]/20">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="private">
              Private - Only visible to platform administrators
            </SelectItem>
            <SelectItem value="investors_only">
              Investors Only - Visible to verified financial institutions
            </SelectItem>
            <SelectItem value="suppliers_only">
              Suppliers Only - Visible to feedstock suppliers
            </SelectItem>
            <SelectItem value="public">
              Public - Visible to all platform users
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
        <p className="text-sm text-blue-300">
          <strong>Note:</strong> Your project details will be reviewed by our
          team before appearing in search results or match notifications. This
          typically takes 2-3 business days.
        </p>
      </div>
    </div>
  );
}
