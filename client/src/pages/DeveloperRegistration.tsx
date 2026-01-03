/**
 * Developer Registration - Nextgen Design
 *
 * Features:
 * - Project developer registration form
 * - Company and project details capture
 * - Material requirements specification
 * - Typography components for consistent styling
 */

import React, { useState, FormEvent, useMemo } from 'react';
import { H1, H2, H3, Body, MetricValue, DataLabel } from "@/components/Typography";

// --- Design System Colors and Constants ---
const COLOR_GOLD = '#D4AF37';
const COLOR_BLACK = '#000000';
const COLOR_WHITE = '#FFFFFF';

// --- Data Structure ---
interface DeveloperRegistrationData {
  companyName: string;
  companyAddress: string;
  companyRegistrationNumber: string;
  projectName: string;
  projectDescription: string;
  estimatedBudget: string; // Using string for input simplicity
  materialType: string;
  quantity: string; // Using string for input simplicity
  deliveryDate: string;
  isVerified: boolean;
}

// --- Initial State ---
const initialData: DeveloperRegistrationData = {
  companyName: '',
  companyAddress: '',
  companyRegistrationNumber: '',
  projectName: '',
  projectDescription: '',
  estimatedBudget: '',
  materialType: '',
  quantity: '',
  deliveryDate: '',
  isVerified: false,
};

// --- Reusable Form Components ---

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  id: string;
}

const TextInput: React.FC<InputProps> = ({ label, id, ...props }) => (
  <div className="mb-6">
    <label htmlFor={id} className={`block text-base font-medium text-[${COLOR_BLACK}] mb-2`}>
      {label}
    </label>
    <input
      id={id}
      type="text"
      className={`w-full py-3 px-4 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-[${COLOR_GOLD}] focus:border-transparent`}
      {...props}
    />
  </div>
);

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant: 'primary' | 'secondary' | 'ghost';
}

const Button: React.FC<ButtonProps> = ({ variant, children, className = '', ...props }) => {
  let baseClasses = 'h-12 px-6 py-3 rounded-lg text-base font-semibold transition-colors duration-200 min-w-[48px]';
  
  switch (variant) {
    case 'primary':
      // Primary (bg-[#D4AF37] text-black)
      baseClasses += ` bg-[${COLOR_GOLD}] text-[${COLOR_BLACK}] hover:bg-opacity-90`;
      break;
    case 'secondary':
      // Secondary (bg-white border-black)
      baseClasses += ` bg-[${COLOR_WHITE}] border border-[${COLOR_BLACK}] text-[${COLOR_BLACK}] hover:bg-gray-50`;
      break;
    case 'ghost':
      // Ghost (transparent hover:bg-gray-100)
      baseClasses += ' bg-transparent text-gray-700 hover:bg-gray-100';
      break;
  }

  return (
    <button className={`${baseClasses} ${className}`} {...props}>
      {children}
    </button>
  );
};

// --- Step Components ---

interface StepProps {
  data: DeveloperRegistrationData;
  updateData: (fields: Partial<DeveloperRegistrationData>) => void;
  nextStep: () => void;
}

const CompanyDetails: React.FC<StepProps> = ({ data, updateData, nextStep }) => {
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    // Basic validation
    if (data.companyName && data.companyAddress && data.companyRegistrationNumber) {
      nextStep();
    } else {
      alert('Please fill in all company details.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-8">
      <H2 className="mb-8">Company Details</H2>
      <TextInput
        id="companyName"
        label="Company Name (Plain English Label)"
        value={data.companyName}
        onChange={(e) => updateData({ companyName: e.target.value })}
        required
      />
      <TextInput
        id="companyAddress"
        label="Company Address"
        value={data.companyAddress}
        onChange={(e) => updateData({ companyAddress: e.target.value })}
        required
      />
      <TextInput
        id="companyRegistrationNumber"
        label="Registration Number"
        value={data.companyRegistrationNumber}
        onChange={(e) => updateData({ companyRegistrationNumber: e.target.value })}
        required
      />
      <div className="mt-8 flex justify-end">
        <Button variant="primary" type="submit">
          Next: Project Info
        </Button>
      </div>
    </form>
  );
};

const ProjectInformation: React.FC<StepProps & { prevStep: () => void }> = ({ data, updateData, nextStep, prevStep }) => {
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (data.projectName && data.projectDescription && data.estimatedBudget) {
      nextStep();
    } else {
      alert('Please fill in all project details.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-8">
      <H2 className="mb-8">Project Information</H2>
      <TextInput
        id="projectName"
        label="Project Name"
        value={data.projectName}
        onChange={(e) => updateData({ projectName: e.target.value })}
        required
      />
      <div className="mb-6">
        <label htmlFor="projectDescription" className={`block text-base font-medium text-[${COLOR_BLACK}] mb-2`}>
          Project Description
        </label>
        <textarea
          id="projectDescription"
          rows={4}
          className={`w-full py-3 px-4 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-[${COLOR_GOLD}] focus:border-transparent`}
          value={data.projectDescription}
          onChange={(e) => updateData({ projectDescription: e.target.value })}
          required
        />
      </div>
      <TextInput
        id="estimatedBudget"
        label="Estimated Budget (USD)"
        value={data.estimatedBudget}
        onChange={(e) => updateData({ estimatedBudget: e.target.value })}
        required
      />
      <div className="mt-8 flex justify-between">
        <Button variant="ghost" type="button" onClick={prevStep}>
          &larr; Back
        </Button>
        <Button variant="primary" type="submit">
          Next: Supply Needs
        </Button>
      </div>
    </form>
  );
};

const SupplyRequirements: React.FC<StepProps & { prevStep: () => void }> = ({ data, updateData, nextStep, prevStep }) => {
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (data.materialType && data.quantity && data.deliveryDate) {
      nextStep();
    } else {
      alert('Please fill in all supply requirements.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-8">
      <H2 className="mb-8">Supply Requirements Form</H2>
      <TextInput
        id="materialType"
        label="Material Type"
        value={data.materialType}
        onChange={(e) => updateData({ materialType: e.target.value })}
        required
      />
      <TextInput
        id="quantity"
        label="Required Quantity"
        value={data.quantity}
        onChange={(e) => updateData({ quantity: e.target.value })}
        required
      />
      <TextInput
        id="deliveryDate"
        label="Target Delivery Date"
        type="date"
        value={data.deliveryDate}
        onChange={(e) => updateData({ deliveryDate: e.target.value })}
        required
      />
      <div className="mt-8 flex justify-between">
        <Button variant="ghost" type="button" onClick={prevStep}>
          &larr; Back
        </Button>
        <Button variant="primary" type="submit">
          Next: Verification
        </Button>
      </div>
    </form>
  );
};

const VerificationSteps: React.FC<StepProps & { prevStep: () => void }> = ({ data, updateData, nextStep, prevStep }) => {
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    // Simulate verification process and set isVerified to true
    updateData({ isVerified: true });
    nextStep(); // Move to the final confirmation/summary step
  };

  const verificationStatus = useMemo(() => {
    if (data.isVerified) {
      return { label: 'Verified', color: COLOR_GOLD, bg: `bg-[${COLOR_GOLD}] text-[${COLOR_BLACK}]` };
    }
    // Simulate a pending state based on form completion
    const isComplete = Object.values(data).slice(0, -1).every(val => val !== '' && val !== 0);
    if (isComplete) {
      return { label: 'Pending Review', color: 'gray-700', bg: 'bg-gray-200 text-gray-700' };
    }
    return { label: 'Incomplete', color: 'red-700', bg: 'bg-red-100 text-red-700' };
  }, [data]);

  return (
    <div className="p-8">
      <H2 className="mb-8">Verification Steps</H2>

      {/* Card-first design for metrics/status */}
      <div className={`p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow bg-[${COLOR_WHITE}] mb-6`}>
        <H3 className="mb-4">Registration Status</H3>
        <div className="flex items-center justify-between">
          <p className="text-base font-medium">Current Status:</p>
          <span className={`text-sm font-semibold px-3 py-1 rounded-full ${verificationStatus.bg}`}>
            {verificationStatus.label}
          </span>
        </div>
        
        {/* Max 3 metrics visible at once - showing key completion metrics */}
        <div className="mt-4 grid grid-cols-3 gap-4 text-center">
            <div className="p-2 border-r border-gray-200">
                <MetricValue>{data.companyName ? '100%' : '0%'}</MetricValue>
                <DataLabel>Company</DataLabel>
            </div>
            <div className="p-2 border-r border-gray-200">
                <MetricValue>{data.projectName ? '100%' : '0%'}</MetricValue>
                <DataLabel>Project</DataLabel>
            </div>
            <div className="p-2">
                <MetricValue>{data.materialType ? '100%' : '0%'}</MetricValue>
                <DataLabel>Supply</DataLabel>
            </div>
        </div>
      </div>

      <Body className="mb-6">
        Please click the button below to submit your registration for final verification. This process may take up to 24 hours.
      </Body>

      <div className="mt-8 flex justify-between">
        <Button variant="ghost" type="button" onClick={prevStep}>
          &larr; Back
        </Button>
        <Button variant="primary" type="button" onClick={handleSubmit} disabled={data.isVerified}>
          {data.isVerified ? 'Verification Submitted' : 'Submit for Verification'}
        </Button>
      </div>
    </div>
  );
};

const Confirmation: React.FC<{ data: DeveloperRegistrationData }> = ({ data }) => {
    return (
        <div className="p-8 text-center">
            <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: COLOR_GOLD }}>
                <svg className="w-8 h-8 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
            </div>
            <H2 className="mt-4 mb-4">Registration Complete!</H2>
            <Body className="text-xl mb-8">
                Thank you, <span className="font-semibold">{data.companyName}</span>. Your developer registration has been successfully submitted for review.
            </Body>
            
            <div className={`p-6 rounded-xl border border-gray-200 shadow-sm bg-[${COLOR_WHITE}] inline-block`}>
                <p className="text-base font-medium text-gray-700">
                    Current Status: <span className={`text-sm font-semibold px-3 py-1 rounded-full bg-gray-200 text-gray-700 ml-2`}>Pending Review</span>
                </p>
            </div>

            <div className="mt-10">
                <Button variant="secondary" onClick={() => alert('Navigating to Dashboard...')}>
                    Go to Dashboard
                </Button>
            </div>
        </div>
    );
}


// --- Main Component ---

const DeveloperRegistration: React.FC = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<DeveloperRegistrationData>(initialData);

  const updateData = (fields: Partial<DeveloperRegistrationData>) => {
    setFormData(prev => ({ ...prev, ...fields }));
  };

  const nextStep = () => setStep(prev => prev + 1);
  const prevStep = () => setStep(prev => prev - 1);

  const steps = [
    { id: 1, title: 'Company Details' },
    { id: 2, title: 'Project Information' },
    { id: 3, title: 'Supply Requirements' },
    { id: 4, title: 'Verification Steps' },
    { id: 5, title: 'Confirmation' },
  ];

  const CurrentStepComponent = useMemo(() => {
    switch (step) {
      case 1:
        return <CompanyDetails data={formData} updateData={updateData} nextStep={nextStep} />;
      case 2:
        return <ProjectInformation data={formData} updateData={updateData} nextStep={nextStep} prevStep={prevStep} />;
      case 3:
        return <SupplyRequirements data={formData} updateData={updateData} nextStep={nextStep} prevStep={prevStep} />;
      case 4:
        return <VerificationSteps data={formData} updateData={updateData} nextStep={nextStep} prevStep={prevStep} />;
      case 5:
        return <Confirmation data={formData} />;
      default:
        return <div>Error: Invalid Step</div>;
    }
  }, [step, formData]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-10" style={{ fontSize: '18px' }}>
      <div className={`w-full max-w-3xl bg-[${COLOR_WHITE}] rounded-2xl border border-gray-200 shadow-xl overflow-hidden`}>
        
        {/* Step Indicator */}
        <div className="p-8 border-b border-gray-200">
          <H1 className="mb-4">Developer Registration</H1>
          <div className="flex justify-between items-center">
            {steps.slice(0, 4).map((s) => (
              <div key={s.id} className="flex-1 flex items-center">
                <div 
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 ${
                    step > s.id 
                      ? `bg-[${COLOR_GOLD}] text-[${COLOR_BLACK}]` 
                      : step === s.id 
                        ? `bg-[${COLOR_BLACK}] text-[${COLOR_WHITE}]` 
                        : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {s.id}
                </div>
                <span className={`ml-3 text-sm font-medium hidden sm:inline ${step >= s.id ? 'text-black' : 'text-gray-500'}`}>
                  {s.title}
                </span>
                {s.id < 4 && (
                  <div className={`flex-1 h-1 mx-4 transition-colors duration-300 ${step > s.id ? `bg-[${COLOR_GOLD}]` : 'bg-gray-200'}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Current Step Content (Card-first design) */}
        <div className="p-4">
            <div className={`rounded-xl border border-gray-200 shadow-sm bg-[${COLOR_WHITE}]`}>
                {CurrentStepComponent}
            </div>
        </div>

      </div>
    </div>
  );
};

export default DeveloperRegistration;
