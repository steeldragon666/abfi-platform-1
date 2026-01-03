import React from 'react';

/**
 * Defines the possible status types for the StatusBadge component.
 */
export type Status = 'Verified' | 'Pending' | 'Attention' | 'Risk';

/**
 * Props for the StatusBadge component.
 */
interface StatusBadgeProps {
  /** The status variant to display, which determines the color scheme. */
  status: Status;
  /** The text label to display inside the badge. */
  label: string;
}

/**
 * A mapping of status types to their corresponding Tailwind CSS classes.
 * Adheres to the ABFI platform design system color requirements.
 */
const statusStyles: Record<Status, string> = {
  // Verified: Gold (#D4AF37) background, Black (#000000) text
  Verified: 'bg-[#D4AF37] text-black',
  // Pending: gray-200 background, Black text
  Pending: 'bg-gray-200 text-black',
  // Attention: amber background, Black text (using amber-500 for contrast)
  Attention: 'bg-amber-500 text-black',
  // Risk: red background, White text (using red-500 for contrast)
  Risk: 'bg-red-500 text-white',
};

/**
 * A small, colored badge component used to display the status of an item.
 *
 * Design System Compliance:
 * - Typography: 18px base text, font-medium.
 * - Spacing: py-1 (4px), px-2 (8px) from the 4/8/12/16/24/32/40px scale.
 * - Border radius: rounded-lg (8px) from the 8/12/16px scale.
 */
const StatusBadge: React.FC<StatusBadgeProps> = React.memo(({ status, label }) => {
  // Base styles applied to all badges
  const baseStyles = 'inline-flex items-center justify-center font-medium text-[18px] py-1 px-2 rounded-lg whitespace-nowrap';

  // Variant styles based on the status prop
  const variantStyles = statusStyles[status];

  return (
    <span className={`${baseStyles} ${variantStyles}`}>
      {label}
    </span>
  );
});

StatusBadge.displayName = 'StatusBadge';

export default StatusBadge;

// Example Usage (for documentation purposes, not part of the component):
/*
<StatusBadge status="Verified" label="Account Verified" />
<StatusBadge status="Pending" label="Review Pending" />
<StatusBadge status="Attention" label="Action Required" />
<StatusBadge status="Risk" label="High Risk" />
*/
