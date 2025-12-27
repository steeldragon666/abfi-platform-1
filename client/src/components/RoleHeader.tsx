import React from 'react';

// --- Type Definitions ---

/**
 * Defines the properties for the StatusChip component.
 */
interface StatusChipProps {
  status: 'verified' | 'pending' | 'attention' | 'risk' | string;
}

/**
 * Defines the properties for the ProgressBar component.
 */
interface ProgressBarProps {
  progress: number; // Value between 0 and 100
}

/**
 * Defines the properties for the RoleHeader component.
 */
interface RoleHeaderProps {
  title: string;
  status: StatusChipProps['status'];
  progress: ProgressBarProps['progress'];
  primaryCtaText: string;
  onPrimaryCtaClick: () => void;
  secondaryActionText: string;
  secondaryActionLink: string;
}

// --- Utility Components ---

/**
 * StatusChip component adhering to the design system.
 * Uses Gold (#D4AF37) for 'verified' status.
 */
const StatusChip: React.FC<StatusChipProps> = ({ status }) => {
  let colorClasses = 'bg-gray-200 text-black'; // Default for 'pending'
  let label = status ? status.charAt(0).toUpperCase() + status.slice(1) : '';

  switch (status?.toLowerCase() || '') {
    case 'verified':
      // Gold (#D4AF37) background, Black (#000000) text
      colorClasses = 'bg-[#D4AF37] text-black';
      break;
    case 'pending':
      colorClasses = 'bg-gray-200 text-black';
      break;
    case 'attention':
      colorClasses = 'bg-amber-500 text-black'; // Using a standard amber for attention
      break;
    case 'risk':
      colorClasses = 'bg-red-500 text-white'; // Using a standard red for risk
      break;
    default:
      // Fallback to pending style
      break;
  }

  return (
    <span
      className={`inline-flex items-center px-3 py-1 text-sm font-medium rounded-full ${colorClasses}`}
      style={{ fontSize: '14px' }} // Slightly smaller text for chip
    >
      {label}
    </span>
  );
};

/**
 * ProgressBar component.
 */
const ProgressBar: React.FC<ProgressBarProps> = ({ progress }) => {
  const clampedProgress = Math.min(100, Math.max(0, progress));

  return (
    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden my-4">
      <div
        className="h-full bg-[#D4AF37]" // Gold (#D4AF37) for progress
        style={{ width: `${clampedProgress}%` }}
        role="progressbar"
        aria-valuenow={clampedProgress}
        aria-valuemin={0}
        aria-valuemax={100}
      />
    </div>
  );
};

/**
 * Primary CTA Button component.
 * Adheres to Gold color, font-semibold, and 48px min touch target.
 */
const PrimaryCtaButton: React.FC<{ onClick: () => void, children: React.ReactNode }> = ({ onClick, children }) => {
  return (
    <button
      onClick={onClick}
      // h-12 ensures 48px min height (12 * 4px = 48px)
      className="h-12 px-6 bg-[#D4AF37] text-black font-semibold rounded-lg shadow-sm hover:bg-opacity-90 transition-colors"
      style={{ minWidth: '120px' }} // Ensure a reasonable width
    >
      {children}
    </button>
  );
};

// --- Main Component ---

/**
 * RoleHeader component: dynamic title, status chip, progress bar, primary CTA, and secondary action link.
 * Adheres to all Design System and FIGMA principles.
 */
export const RoleHeader: React.FC<RoleHeaderProps> = ({
  title,
  status,
  progress,
  primaryCtaText,
  onPrimaryCtaClick,
  secondaryActionText,
  secondaryActionLink,
}) => {
  return (
    // Card-like container: White background, shadow-sm, rounded-xl (12px)
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
      {/* Top Section: Title and Status Chip */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          {/* Dynamic Title: font-semibold, text-2xl (larger than 18px base for header) */}
          <h1 className="text-2xl font-semibold text-black">
            {title}
          </h1>
          <StatusChip status={status} />
        </div>
      </div>

      {/* Progress Bar */}
      <ProgressBar progress={progress} />

      {/* Action Section */}
      <div className="flex items-center justify-between mt-6">
        {/* Primary CTA: One primary gold CTA per screen, Large touch targets (48px min) */}
        <PrimaryCtaButton onClick={onPrimaryCtaClick}>
          {primaryCtaText}
        </PrimaryCtaButton>

        {/* Secondary Action Link: Progressive disclosure, Plain English labels */}
        <a
          href={secondaryActionLink}
          className="text-black text-lg font-medium hover:underline"
          style={{ fontSize: '18px' }} // 18px base text
        >
          {secondaryActionText}
        </a>
      </div>
    </div>
  );
};

export default RoleHeader;

// Example Usage (for testing/reference):
/*
const ExampleRoleHeader = () => (
  <RoleHeader
    title="Welcome, John Doe"
    status="verified"
    progress={75}
    primaryCtaText="Complete Onboarding"
    onPrimaryCtaClick={() => console.log('Primary CTA clicked')}
    secondaryActionText="View Profile Settings"
    secondaryActionLink="/profile"
  />
);
*/
