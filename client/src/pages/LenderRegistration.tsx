/**
 * Lender Registration - Nextgen Design
 *
 * Features:
 * - Financial institution registration form
 * - Custom styled form components
 * - Gold accent color scheme (#D4AF37)
 * - Typography components for consistent styling
 */

import React, { useState, FormEvent } from 'react';
import { H1, H2, H3, Body, MetricValue, DataLabel } from "@/components/Typography";

// --- Design System Components ---

// Primary Button: bg-[#D4AF37] text-black, large touch target
const PrimaryButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ children, className, ...props }) => (
  <button
    className={`
      bg-[#D4AF37] text-black font-semibold py-3 px-6 rounded-lg 
      hover:bg-opacity-90 transition-colors w-full sm:w-auto min-h-[48px]
      ${className || ''}
    `}
    {...props}
  >
    {children}
  </button>
);

// Secondary Button: bg-white border-black, large touch target
const SecondaryButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ children, className, ...props }) => (
  <button
    className={`
      bg-white border border-black text-black font-semibold py-3 px-6 rounded-lg 
      hover:bg-gray-100 transition-colors w-full sm:w-auto min-h-[48px]
      ${className || ''}
    `}
    {...props}
  >
    {children}
  </button>
);

// Input Field: Large inputs (py-3 px-4), gold focus rings (ring-[#D4AF37]), black labels
interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  id: string;
}

const InputField: React.FC<InputFieldProps> = ({ label, id, className, ...props }) => (
  <div className="flex flex-col space-y-1">
    <label htmlFor={id} className="text-black font-medium text-[18px]">
      {label}
    </label>
    <input
      id={id}
      className={`
        border border-gray-300 rounded-lg py-3 px-4 text-[18px] text-black 
        focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent
        min-h-[48px]
        ${className || ''}
      `}
      {...props}
    />
  </div>
);

// Card: White background, gray-200 border, shadow-sm, hover:shadow-md
interface CardProps {
  title: string;
  children: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
}

const Card: React.FC<CardProps> = ({ title, children, isOpen, onToggle }) => (
  <div className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow">
    <div
      className="p-6 flex justify-between items-center cursor-pointer min-h-[48px]"
      onClick={onToggle}
    >
      <H2 className="text-2xl font-semibold text-black">{title}</H2>
      <span className="text-black text-2xl">{isOpen ? '−' : '+'}</span>
    </div>
    {isOpen && (
      <div className="p-6 pt-0 border-t border-gray-200">
        <div className="space-y-6">
          {children}
        </div>
      </div>
    )}
  </div>
);

// --- Component State Types ---

interface LenderRegistrationData {
  // Institution Details
  institutionName: string;
  institutionType: string;
  contactEmail: string;
  // Lending Criteria
  minLoanAmount: number | '';
  maxLoanAmount: number | '';
  targetIndustries: string;
  // Covenant Preferences
  financialCovenants: string;
  reportingFrequency: string;
  // Compliance Requirements
  regulatoryBody: string;
  licenseNumber: string;
}

// --- Main Component ---

const LenderRegistration: React.FC = () => {
  const [formData, setFormData] = useState<LenderRegistrationData>({
    institutionName: '',
    institutionType: '',
    contactEmail: '',
    minLoanAmount: '',
    maxLoanAmount: '',
    targetIndustries: '',
    financialCovenants: '',
    reportingFrequency: '',
    regulatoryBody: '',
    licenseNumber: '',
  });

  const [openCard, setOpenCard] = useState<string>('institution'); // Progressive disclosure

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: id.includes('Amount') ? (value === '' ? '' : Number(value)) : value,
    }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    alert('Lender Registration Submitted! (Check console for data)');
    // In a real app, this would be an API call
  };

  const toggleCard = (cardName: string) => {
    setOpenCard(openCard === cardName ? '' : cardName);
  };

  // Helper for gold status badge
  const StatusBadge: React.FC<{ status: 'Verified' | 'Pending' | 'Attention' | 'Risk' }> = ({ status }) => {
    let colorClass = '';
    switch (status) {
      case 'Verified':
        colorClass = 'bg-[#D4AF37] text-black'; // Gold bg
        break;
      case 'Pending':
        colorClass = 'bg-gray-200 text-black';
        break;
      case 'Attention':
        colorClass = 'bg-amber-400 text-black';
        break;
      case 'Risk':
        colorClass = 'bg-red-500 text-white';
        break;
    }
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${colorClass}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8 text-[18px]">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8 space-y-2">
          <H1 className="text-4xl font-semibold text-black">Lender Registration</H1>
          <Body className="text-gray-600">
            Please provide your institution's details, lending preferences, and compliance information.
          </Body>
          <div className="pt-2">
            <StatusBadge status="Pending" />
          </div>
        </header>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* 1. Institution Details */}
          <Card 
            title="1. Institution Details" 
            isOpen={openCard === 'institution'} 
            onToggle={() => toggleCard('institution')}
          >
            <InputField 
              label="Institution Name (Plain English Label)" 
              id="institutionName" 
              type="text" 
              value={formData.institutionName} 
              onChange={handleChange} 
              required 
            />
            <div className="flex flex-col space-y-1">
              <label htmlFor="institutionType" className="text-black font-medium text-[18px]">
                Institution Type
              </label>
              <select
                id="institutionType"
                value={formData.institutionType}
                onChange={handleChange}
                className="border border-gray-300 rounded-lg py-3 px-4 text-[18px] text-black focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent min-h-[48px]"
                required
              >
                <option value="">Select Type</option>
                <option value="Bank">Bank</option>
                <option value="Credit Union">Credit Union</option>
                <option value="Private Equity">Private Equity</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <InputField 
              label="Primary Contact Email" 
              id="contactEmail" 
              type="email" 
              value={formData.contactEmail} 
              onChange={handleChange} 
              required 
            />
          </Card>

          {/* 2. Lending Criteria */}
          <Card 
            title="2. Lending Criteria" 
            isOpen={openCard === 'criteria'} 
            onToggle={() => toggleCard('criteria')}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InputField 
                label="Minimum Loan Amount (USD)" 
                id="minLoanAmount" 
                type="number" 
                value={formData.minLoanAmount} 
                onChange={handleChange} 
                placeholder="e.g., 100000"
              />
              <InputField 
                label="Maximum Loan Amount (USD)" 
                id="maxLoanAmount" 
                type="number" 
                value={formData.maxLoanAmount} 
                onChange={handleChange} 
                placeholder="e.g., 5000000"
              />
            </div>
            <InputField 
              label="Target Industries (Comma Separated)" 
              id="targetIndustries" 
              type="text" 
              value={formData.targetIndustries} 
              onChange={handleChange} 
              placeholder="e.g., Technology, Real Estate, Healthcare"
            />
          </Card>

          {/* 3. Covenant Preferences */}
          <Card 
            title="3. Covenant Preferences" 
            isOpen={openCard === 'covenants'} 
            onToggle={() => toggleCard('covenants')}
          >
            <InputField 
              label="Key Financial Covenants (Plain English)" 
              id="financialCovenants" 
              type="text" 
              value={formData.financialCovenants} 
              onChange={handleChange} 
              placeholder="e.g., Debt-to-EBITDA ratio, Minimum Liquidity"
            />
            <div className="flex flex-col space-y-1">
              <label htmlFor="reportingFrequency" className="text-black font-medium text-[18px]">
                Reporting Frequency
              </label>
              <select
                id="reportingFrequency"
                value={formData.reportingFrequency}
                onChange={handleChange}
                className="border border-gray-300 rounded-lg py-3 px-4 text-[18px] text-black focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent min-h-[48px]"
              >
                <option value="">Select Frequency</option>
                <option value="Monthly">Monthly</option>
                <option value="Quarterly">Quarterly</option>
                <option value="Semi-Annually">Semi-Annually</option>
                <option value="Annually">Annually</option>
              </select>
            </div>
          </Card>

          {/* 4. Compliance Requirements */}
          <Card 
            title="4. Compliance Requirements" 
            isOpen={openCard === 'compliance'} 
            onToggle={() => toggleCard('compliance')}
          >
            <InputField 
              label="Primary Regulatory Body" 
              id="regulatoryBody" 
              type="text" 
              value={formData.regulatoryBody} 
              onChange={handleChange} 
              placeholder="e.g., SEC, FCA, BaFin"
            />
            <InputField 
              label="Operating License Number" 
              id="licenseNumber" 
              type="text" 
              value={formData.licenseNumber} 
              onChange={handleChange} 
            />
          </Card>

          {/* Form Actions - One primary gold CTA per screen */}
          <div className="flex justify-end space-x-4 pt-4">
            <SecondaryButton type="button">
              Save Draft
            </SecondaryButton>
            <PrimaryButton type="submit">
              Submit Registration
            </PrimaryButton>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LenderRegistration;
