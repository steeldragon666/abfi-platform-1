/**
 * Grower Registration Flow - Nextgen Design
 *
 * Features:
 * - Multi-step grower onboarding wizard
 * - Role selection (Grower, Farm Manager, Consultant)
 * - Evidence file upload capability
 * - Typography components for consistent styling
 */

import React, { useState, useMemo } from 'react';
import { H1, H2, H3, Body, MetricValue, DataLabel } from "@/components/Typography";

// --- Type Definitions ---

type Role = 'Grower' | 'Farm Manager' | 'Consultant' | '';

interface FormData {
  role: Role;
  legalEntityName: string;
  abnTaxId: string;
  contactName: string;
  contactEmail: string;
  propertyAddress: string;
  primaryCrop: string;
  farmSize: number | '';
  yearsOfOperation: number | '';
  evidenceFiles: File[];
}

// --- Design System Constants (for readability and adherence) ---

const COLOR_GOLD = '#D4AF37';
const COLOR_BLACK = '#000000';
const COLOR_WHITE = '#FFFFFF';

// Tailwind classes based on the design system
const PRIMARY_BUTTON_CLASSES = `bg-[${COLOR_GOLD}] text-[${COLOR_BLACK}] font-semibold py-3 px-4 rounded-xl min-h-[48px] transition duration-150 ease-in-out hover:opacity-90`;
const CARD_CLASSES = `bg-[${COLOR_WHITE}] border border-gray-200 shadow-sm hover:shadow-md rounded-xl p-8`;
const INPUT_CLASSES = `w-full p-3 text-lg border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[${COLOR_GOLD}] focus:border-transparent`;
const LABEL_CLASSES = `block text-[${COLOR_BLACK}] font-medium mb-2`;
const STATUS_PENDING_CLASSES = 'inline-flex items-center px-3 py-1 text-sm font-medium text-gray-800 bg-gray-200 rounded-full';

// --- Sub-Components (Internal to the main flow component) ---

interface StepIndicatorProps {
  currentStep: number;
  steps: string[];
}

const StepIndicator: React.FC<StepIndicatorProps> = ({ currentStep, steps }) => {
  return (
    <div className="mb-10">
      <div className="flex justify-between text-sm font-medium text-gray-500">
        {steps.map((step, index) => (
          <div key={index} className="flex flex-col items-center">
            <div
              className={`w-10 h-10 flex items-center justify-center rounded-full border-4 ${
                index + 1 === currentStep
                  ? `border-[${COLOR_GOLD}] text-[${COLOR_BLACK}] bg-white font-semibold`
                  : index + 1 < currentStep
                  ? `border-[${COLOR_GOLD}] bg-[${COLOR_GOLD}] text-[${COLOR_BLACK}] font-semibold`
                  : 'border-gray-300 text-gray-500 bg-white'
              }`}
            >
              {index + 1}
            </div>
            <span className={`mt-2 text-center ${index + 1 === currentStep ? 'text-[${COLOR_BLACK}] font-semibold' : 'text-gray-500'}`}>
              {step}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

interface StepProps {
  formData: FormData;
  updateFormData: (field: keyof FormData, value: any) => void;
  onNext: () => void;
}

const Step1RoleSelection: React.FC<StepProps> = ({ formData, updateFormData, onNext }) => {
  const roles: Role[] = ['Grower', 'Farm Manager', 'Consultant'];
  const isFormValid = formData.role !== '';

  return (
    <div className={CARD_CLASSES}>
      <H2 className="text-2xl font-semibold mb-6 text-[${COLOR_BLACK}]">Step 1: Role Selection</H2>
      <Body className="mb-6 text-lg">Please select the role that best describes your primary involvement with the platform.</Body>
      
      <div className="space-y-4">
        {roles.map((role) => (
          <label
            key={role}
            className={`flex items-center p-4 border-2 rounded-xl cursor-pointer transition duration-150 ease-in-out min-h-[48px] ${
              formData.role === role
                ? `border-[${COLOR_GOLD}] bg-gray-50 shadow-md`
                : 'border-gray-200 hover:border-gray-400'
            }`}
          >
            <input
              type="radio"
              name="role"
              value={role}
              checked={formData.role === role}
              onChange={() => updateFormData('role', role)}
              className="w-5 h-5 text-[${COLOR_GOLD}] focus:ring-[${COLOR_GOLD}] border-gray-300"
            />
            <span className="ml-4 text-lg font-medium text-[${COLOR_BLACK}]">{role}</span>
          </label>
        ))}
      </div>

      <div className="mt-8 flex justify-end">
        <button onClick={onNext} disabled={!isFormValid} className={PRIMARY_BUTTON_CLASSES + (!isFormValid ? ' opacity-50 cursor-not-allowed' : '')}>
          Continue
        </button>
      </div>
    </div>
  );
};

const Step2PropertyDetails: React.FC<StepProps> = ({ formData, updateFormData, onNext }) => {
  const isFormValid = useMemo(() => {
    return (
      formData.legalEntityName.trim() !== '' &&
      formData.contactName.trim() !== '' &&
      formData.contactEmail.trim() !== '' &&
      formData.propertyAddress.trim() !== ''
    );
  }, [formData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    updateFormData(e.target.name as keyof FormData, e.target.value);
  };

  return (
    <div className={CARD_CLASSES}>
      <H2 className="text-2xl font-semibold mb-6 text-[${COLOR_BLACK}]">Step 2: Property Details</H2>
      <div className="space-y-6">
        <div>
          <label htmlFor="legalEntityName" className={LABEL_CLASSES}>Legal Entity Name (Required)</label>
          <input
            type="text"
            id="legalEntityName"
            name="legalEntityName"
            value={formData.legalEntityName}
            onChange={handleChange}
            className={INPUT_CLASSES}
            placeholder="e.g., Green Acres Pty Ltd"
          />
        </div>
        <div>
          <label htmlFor="abnTaxId" className={LABEL_CLASSES}>ABN/Tax ID (Optional)</label>
          <input
            type="text"
            id="abnTaxId"
            name="abnTaxId"
            value={formData.abnTaxId}
            onChange={handleChange}
            className={INPUT_CLASSES}
            placeholder="Enter ABN or Tax Identification Number"
          />
        </div>
        <div>
          <label htmlFor="contactName" className={LABEL_CLASSES}>Primary Contact Name (Required)</label>
          <input
            type="text"
            id="contactName"
            name="contactName"
            value={formData.contactName}
            onChange={handleChange}
            className={INPUT_CLASSES}
            placeholder="Full Name"
          />
        </div>
        <div>
          <label htmlFor="contactEmail" className={LABEL_CLASSES}>Primary Contact Email (Required)</label>
          <input
            type="email"
            id="contactEmail"
            name="contactEmail"
            value={formData.contactEmail}
            onChange={handleChange}
            className={INPUT_CLASSES}
            placeholder="email@example.com"
          />
        </div>
        <div>
          <label htmlFor="propertyAddress" className={LABEL_CLASSES}>Property Address (Required)</label>
          <textarea
            id="propertyAddress"
            name="propertyAddress"
            rows={3}
            value={formData.propertyAddress}
            onChange={handleChange}
            className={INPUT_CLASSES}
            placeholder="Full physical address of the property"
          />
        </div>
      </div>

      <div className="mt-8 flex justify-end">
        <button onClick={onNext} disabled={!isFormValid} className={PRIMARY_BUTTON_CLASSES + (!isFormValid ? ' opacity-50 cursor-not-allowed' : '')}>
          Save & Continue
        </button>
      </div>
    </div>
  );
};

const Step3ProductionProfile: React.FC<StepProps> = ({ formData, updateFormData, onNext }) => {
  const isFormValid = useMemo(() => {
    return (
      formData.primaryCrop.trim() !== '' &&
      formData.farmSize !== '' &&
      formData.farmSize > 0 &&
      formData.yearsOfOperation !== '' &&
      formData.yearsOfOperation >= 0
    );
  }, [formData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const finalValue = type === 'number' ? (value === '' ? '' : Number(value)) : value;
    updateFormData(name as keyof FormData, finalValue);
  };

  const crops = ['Wheat', 'Corn', 'Soybeans', 'Cotton', 'Other'];

  return (
    <div className="space-y-6">
      <div className={CARD_CLASSES}>
        <H2 className="text-2xl font-semibold mb-6 text-[${COLOR_BLACK}]">Step 3: Production Profile</H2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="primaryCrop" className={LABEL_CLASSES}>Primary Crop/Commodity (Required)</label>
            <select
              id="primaryCrop"
              name="primaryCrop"
              value={formData.primaryCrop}
              onChange={handleChange}
              className={INPUT_CLASSES}
            >
              <option value="">Select a crop</option>
              {crops.map(crop => <option key={crop} value={crop}>{crop}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="farmSize" className={LABEL_CLASSES}>Total Farm Size (ha, Required)</label>
            <input
              type="number"
              id="farmSize"
              name="farmSize"
              value={formData.farmSize}
              onChange={handleChange}
              className={INPUT_CLASSES}
              placeholder="e.g., 1500"
              min="0"
            />
          </div>
          <div>
            <label htmlFor="yearsOfOperation" className={LABEL_CLASSES}>Years of Operation (Required)</label>
            <input
              type="number"
              id="yearsOfOperation"
              name="yearsOfOperation"
              value={formData.yearsOfOperation}
              onChange={handleChange}
              className={INPUT_CLASSES}
              placeholder="e.g., 10"
              min="0"
            />
          </div>
        </div>
      </div>

      {/* Metric Card - Max 3 metrics visible at once */}
      <div className={CARD_CLASSES + ' p-6'}>
        <H3 className="text-xl font-semibold mb-4 text-[${COLOR_BLACK}]">Key Metrics</H3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <DataLabel className="text-sm text-gray-500">Carbon Potential</DataLabel>
            <MetricValue className="text-2xl font-semibold text-[${COLOR_BLACK}]">TBD</MetricValue>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <DataLabel className="text-sm text-gray-500">Water Usage (Est.)</DataLabel>
            <MetricValue className="text-2xl font-semibold text-[${COLOR_BLACK}]">N/A</MetricValue>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <DataLabel className="text-sm text-gray-500">Biodiversity Score</DataLabel>
            <MetricValue className="text-2xl font-semibold text-[${COLOR_BLACK}]">0.0</MetricValue>
          </div>
        </div>
      </div>

      <div className="mt-8 flex justify-end">
        <button onClick={onNext} disabled={!isFormValid} className={PRIMARY_BUTTON_CLASSES + (!isFormValid ? ' opacity-50 cursor-not-allowed' : '')}>
          Save & Continue
        </button>
      </div>
    </div>
  );
};

const Step4EvidenceUpload: React.FC<StepProps> = ({ formData, updateFormData, onNext }) => {
  const requiredDocuments = [
    { name: 'Land Title Deed', uploaded: false },
    { name: 'Business Registration', uploaded: true },
    { name: 'Proof of Address', uploaded: false },
  ];

  const isFormValid = requiredDocuments.every(doc => doc.uploaded); // Placeholder logic

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    // Placeholder for file handling logic
    // In a real implementation, you would update formData.evidenceFiles
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  return (
    <div className={CARD_CLASSES}>
      <H2 className="text-2xl font-semibold mb-6 text-[${COLOR_BLACK}]">Step 4: Evidence Upload</H2>
      <Body className="mb-6 text-lg">Please upload the required documents to complete your registration.</Body>

      {/* Drag-and-drop interface */}
      <div
        onDrop={handleFileDrop}
        onDragOver={handleDragOver}
        className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center mb-8 cursor-pointer hover:border-[${COLOR_GOLD}] transition duration-150 ease-in-out min-h-[150px]"
      >
        <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
          <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m-4-4h.01" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <p className="mt-1 text-sm text-gray-600">
          <span className="font-medium text-[${COLOR_GOLD}]">Click to upload</span> or drag and drop
        </p>
        <p className="text-xs text-gray-500">PDF, JPG, PNG up to 10MB</p>
      </div>

      {/* Required Documents List */}
      <H3 className="text-xl font-semibold mb-4 text-[${COLOR_BLACK}]">Required Documents</H3>
      <ul className="space-y-3">
        {requiredDocuments.map((doc, index) => (
          <li key={index} className="flex justify-between items-center p-3 border border-gray-100 rounded-lg">
            <span className="text-lg text-[${COLOR_BLACK}]">{doc.name}</span>
            <span className={doc.uploaded ? 'inline-flex items-center px-3 py-1 text-sm font-medium text-black bg-[#D4AF37] rounded-full' : STATUS_PENDING_CLASSES}>
              {doc.uploaded ? 'Uploaded' : 'Pending'}
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-8 flex justify-end">
        <button onClick={onNext} disabled={!isFormValid} className={PRIMARY_BUTTON_CLASSES + (!isFormValid ? ' opacity-50 cursor-not-allowed' : '')}>
          Submit Registration
        </button>
      </div>
    </div>
  );
};

// --- Main Component ---

const GrowerRegistrationFlow: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    role: '',
    legalEntityName: '',
    abnTaxId: '',
    contactName: '',
    contactEmail: '',
    propertyAddress: '',
    primaryCrop: '',
    farmSize: '',
    yearsOfOperation: '',
    evidenceFiles: [],
  });

  const steps = ['Role Selection', 'Property Details', 'Production Profile', 'Evidence Upload'];

  const updateFormData = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(prev => prev + 1);
    } else {
      // Final submission logic
      alert('Registration Submitted! (See console for data)');
      }
  };

  const renderStep = () => {
    const stepProps: StepProps = { formData, updateFormData, onNext: handleNext };
    switch (currentStep) {
      case 1:
        return <Step1RoleSelection {...stepProps} />;
      case 2:
        return <Step2PropertyDetails {...stepProps} />;
      case 3:
        return <Step3ProductionProfile {...stepProps} />;
      case 4:
        return <Step4EvidenceUpload {...stepProps} />;
      default:
        return <div className="text-red-500">Error: Invalid Step</div>;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-8 bg-gray-50 min-h-screen">
      <H1 className="text-3xl font-semibold mb-10 text-[${COLOR_BLACK}]">Grower Registration</H1>
      
      <StepIndicator currentStep={currentStep} steps={steps} />
      
      <div className="mt-8">
        {renderStep()}
      </div>
    </div>
  );
};

export default GrowerRegistrationFlow;
