/**
 * ABFI Platform - Custom Icon System
 * "Australian Summer Dusk" Design Language
 * 
 * Unique iconography inspired by Australian landscapes, agriculture,
 * and sustainable energy. Each icon features distinctive styling
 * that sets ABFI apart from generic icon libraries.
 */

import * as React from 'react';
import { cn } from '@/lib/utils';

interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'ochre' | 'eucalyptus' | 'coastal' | 'charcoal';
}

const sizeMap = {
  xs: 'w-4 h-4',
  sm: 'w-5 h-5',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
  xl: 'w-10 h-10',
};

const variantMap = {
  default: 'text-current',
  ochre: 'text-[#F59E0B]',
  eucalyptus: 'text-[#10B981]',
  coastal: 'text-[#14B8A6]',
  charcoal: 'text-[#3F3F46]',
};

// ==========================================================================
// FEEDSTOCK ICONS - Distinctive Australian agricultural symbols
// ==========================================================================

/**
 * Bamboo Icon - Stylized beema bamboo culms
 * Represents base-load biofuel feedstock
 */
export const BambooIcon: React.FC<IconProps> = ({ 
  size = 'md', 
  variant = 'default',
  className,
  ...props 
}) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={cn(sizeMap[size], variantMap[variant], className)}
    {...props}
  >
    {/* Main culm */}
    <path d="M8 2v20" />
    <path d="M8 6c2-1 4-1 6 0" />
    <path d="M8 10c2-1 4-1 6 0" />
    <path d="M8 14c2-1 4-1 6 0" />
    <path d="M8 18c2-1 4-1 6 0" />
    {/* Secondary culm */}
    <path d="M16 4v16" />
    <path d="M16 8c-2-1-4-1-6 0" />
    <path d="M16 12c-2-1-4-1-6 0" />
    <path d="M16 16c-2-1-4-1-6 0" />
    {/* Leaves */}
    <path d="M6 4c-2 1-3 3-2 5" />
    <path d="M18 6c2 1 3 3 2 5" />
  </svg>
);

/**
 * Wheat Straw Icon - Australian grain residue
 */
export const WheatStrawIcon: React.FC<IconProps> = ({ 
  size = 'md', 
  variant = 'default',
  className,
  ...props 
}) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={cn(sizeMap[size], variantMap[variant], className)}
    {...props}
  >
    {/* Stalk */}
    <path d="M12 22V8" />
    {/* Wheat head */}
    <ellipse cx="12" cy="5" rx="2" ry="3" />
    <path d="M10 6L8 4" />
    <path d="M14 6L16 4" />
    <path d="M10 4L8 2" />
    <path d="M14 4L16 2" />
    {/* Leaves */}
    <path d="M12 14c-3 0-5 2-5 4" />
    <path d="M12 14c3 0 5 2 5 4" />
    <path d="M12 18c-2 0-4 1-4 2" />
    <path d="M12 18c2 0 4 1 4 2" />
  </svg>
);

/**
 * Sugarcane Icon - Queensland sugar industry
 */
export const SugarcaneIcon: React.FC<IconProps> = ({ 
  size = 'md', 
  variant = 'default',
  className,
  ...props 
}) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={cn(sizeMap[size], variantMap[variant], className)}
    {...props}
  >
    {/* Main cane */}
    <path d="M12 22V2" />
    {/* Nodes */}
    <circle cx="12" cy="6" r="1.5" fill="currentColor" />
    <circle cx="12" cy="11" r="1.5" fill="currentColor" />
    <circle cx="12" cy="16" r="1.5" fill="currentColor" />
    {/* Leaves */}
    <path d="M12 4c-4 0-6 2-6 4" />
    <path d="M12 4c4 0 6 2 6 4" />
    <path d="M12 9c-3 0-5 1.5-5 3" />
    <path d="M12 9c3 0 5 1.5 5 3" />
    <path d="M12 14c-2 0-4 1-4 2" />
    <path d="M12 14c2 0 4 1 4 2" />
  </svg>
);

/**
 * Canola Icon - Oilseed crop
 */
export const CanolaIcon: React.FC<IconProps> = ({ 
  size = 'md', 
  variant = 'default',
  className,
  ...props 
}) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={cn(sizeMap[size], variantMap[variant], className)}
    {...props}
  >
    {/* Stem */}
    <path d="M12 22V10" />
    {/* Flower clusters */}
    <circle cx="12" cy="4" r="2" fill="currentColor" fillOpacity="0.3" />
    <circle cx="8" cy="6" r="1.5" fill="currentColor" fillOpacity="0.3" />
    <circle cx="16" cy="6" r="1.5" fill="currentColor" fillOpacity="0.3" />
    <circle cx="10" cy="8" r="1.5" fill="currentColor" fillOpacity="0.3" />
    <circle cx="14" cy="8" r="1.5" fill="currentColor" fillOpacity="0.3" />
    {/* Leaves */}
    <path d="M12 14c-4 1-6 3-5 5" />
    <path d="M12 14c4 1 6 3 5 5" />
    <path d="M12 18c-3 0.5-4 2-3 3" />
    <path d="M12 18c3 0.5 4 2 3 3" />
  </svg>
);

// ==========================================================================
// PLATFORM ICONS - Unique ABFI-specific symbols
// ==========================================================================

/**
 * Bankability Icon - Financial assessment symbol
 */
export const BankabilityIcon: React.FC<IconProps> = ({ 
  size = 'md', 
  variant = 'default',
  className,
  ...props 
}) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={cn(sizeMap[size], variantMap[variant], className)}
    {...props}
  >
    {/* Shield base */}
    <path d="M12 2L3 7v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z" />
    {/* Checkmark inside */}
    <path d="M9 12l2 2 4-4" strokeWidth="2" />
    {/* Rating indicator */}
    <path d="M12 2v3" />
    <path d="M7 4.5l1.5 2" />
    <path d="M17 4.5l-1.5 2" />
  </svg>
);

/**
 * Registry Icon - Verified supplier registry
 */
export const RegistryIcon: React.FC<IconProps> = ({ 
  size = 'md', 
  variant = 'default',
  className,
  ...props 
}) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={cn(sizeMap[size], variantMap[variant], className)}
    {...props}
  >
    {/* Book/ledger */}
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    {/* Verification stamp */}
    <circle cx="13" cy="10" r="4" />
    <path d="M11 10l1.5 1.5 3-3" />
    {/* Lines */}
    <path d="M9 16h6" />
  </svg>
);

/**
 * Supply Chain Icon - Connected network
 */
export const SupplyChainIcon: React.FC<IconProps> = ({ 
  size = 'md', 
  variant = 'default',
  className,
  ...props 
}) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={cn(sizeMap[size], variantMap[variant], className)}
    {...props}
  >
    {/* Nodes */}
    <circle cx="5" cy="6" r="3" />
    <circle cx="19" cy="6" r="3" />
    <circle cx="12" cy="18" r="3" />
    {/* Connections */}
    <path d="M8 6h8" />
    <path d="M5 9v3l7 3" />
    <path d="M19 9v3l-7 3" />
    {/* Flow indicators */}
    <path d="M10 6l2-2 2 2" fill="currentColor" />
    <path d="M7 13l-2 2 2 2" fill="currentColor" />
    <path d="M17 13l2 2-2 2" fill="currentColor" />
  </svg>
);

/**
 * Carbon Credit Icon - ACCU/environmental credits
 */
export const CarbonCreditIcon: React.FC<IconProps> = ({ 
  size = 'md', 
  variant = 'default',
  className,
  ...props 
}) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={cn(sizeMap[size], variantMap[variant], className)}
    {...props}
  >
    {/* Leaf outline */}
    <path d="M12 2c-5 4-8 9-7 14 0 0 3 2 7 2s7-2 7-2c1-5-2-10-7-14z" />
    {/* CO2 symbol */}
    <text x="8" y="14" fontSize="5" fill="currentColor" fontWeight="bold">CO₂</text>
    {/* Arrow down (sequestration) */}
    <path d="M12 16v4" />
    <path d="M10 18l2 2 2-2" />
  </svg>
);

/**
 * Bioenergy Icon - Energy from biomass
 */
export const BioenergyIcon: React.FC<IconProps> = ({ 
  size = 'md', 
  variant = 'default',
  className,
  ...props 
}) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={cn(sizeMap[size], variantMap[variant], className)}
    {...props}
  >
    {/* Lightning bolt */}
    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="currentColor" fillOpacity="0.2" />
    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
    {/* Leaf accent */}
    <path d="M18 4c2 2 3 5 2 8" />
    <path d="M20 6c-1-1-2-1-3 0" />
  </svg>
);

/**
 * Contract Icon - Offtake agreements
 */
export const ContractIcon: React.FC<IconProps> = ({ 
  size = 'md', 
  variant = 'default',
  className,
  ...props 
}) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={cn(sizeMap[size], variantMap[variant], className)}
    {...props}
  >
    {/* Document */}
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <path d="M14 2v6h6" />
    {/* Signature line */}
    <path d="M8 18c1-1 2-1 3 0s2 1 3 0" />
    {/* Checkmarks */}
    <path d="M8 10l1 1 2-2" />
    <path d="M8 14l1 1 2-2" />
  </svg>
);

// ==========================================================================
// PORTAL ICONS - Role-specific symbols
// ==========================================================================

/**
 * Grower Icon - Agricultural producer
 */
export const GrowerIcon: React.FC<IconProps> = ({ 
  size = 'md', 
  variant = 'eucalyptus',
  className,
  ...props 
}) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={cn(sizeMap[size], variantMap[variant], className)}
    {...props}
  >
    {/* Seedling */}
    <path d="M12 22V12" />
    <path d="M12 12c-4-1-6-4-5-8 4 1 6 4 5 8z" />
    <path d="M12 12c4-1 6-4 5-8-4 1-6 4-5 8z" />
    {/* Ground */}
    <path d="M7 22h10" />
    {/* Sun rays */}
    <circle cx="12" cy="5" r="1" fill="currentColor" />
    <path d="M12 2v1" />
    <path d="M15 5h1" />
    <path d="M9 5H8" />
  </svg>
);

/**
 * Developer Icon - Project developer
 */
export const DeveloperIcon: React.FC<IconProps> = ({ 
  size = 'md', 
  variant = 'coastal',
  className,
  ...props 
}) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={cn(sizeMap[size], variantMap[variant], className)}
    {...props}
  >
    {/* Building/facility */}
    <path d="M3 21h18" />
    <path d="M5 21V7l7-4 7 4v14" />
    <path d="M9 21v-6h6v6" />
    {/* Chimney with steam */}
    <path d="M14 3v2" />
    <path d="M14 1c1 0.5 1 1.5 0 2" />
    {/* Windows */}
    <rect x="8" y="9" width="3" height="3" />
    <rect x="13" y="9" width="3" height="3" />
  </svg>
);

/**
 * Lender Icon - Financial institution
 */
export const LenderIcon: React.FC<IconProps> = ({ 
  size = 'md', 
  variant = 'ochre',
  className,
  ...props 
}) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={cn(sizeMap[size], variantMap[variant], className)}
    {...props}
  >
    {/* Bank building */}
    <path d="M3 21h18" />
    <path d="M3 10h18" />
    <path d="M12 3l9 7H3l9-7z" />
    {/* Pillars */}
    <path d="M6 10v11" />
    <path d="M10 10v11" />
    <path d="M14 10v11" />
    <path d="M18 10v11" />
    {/* Dollar sign */}
    <circle cx="12" cy="6" r="1.5" fill="currentColor" />
  </svg>
);

/**
 * Government Icon - Regulatory body
 */
export const GovernmentIcon: React.FC<IconProps> = ({ 
  size = 'md', 
  variant = 'charcoal',
  className,
  ...props 
}) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={cn(sizeMap[size], variantMap[variant], className)}
    {...props}
  >
    {/* Capitol dome */}
    <path d="M12 2v2" />
    <path d="M12 4a6 6 0 0 1 6 6v2H6v-2a6 6 0 0 1 6-6z" />
    <path d="M4 12h16" />
    {/* Building */}
    <path d="M4 12v9h16v-9" />
    {/* Columns */}
    <path d="M7 12v9" />
    <path d="M12 12v9" />
    <path d="M17 12v9" />
    {/* Door */}
    <path d="M10 21v-4h4v4" />
  </svg>
);

// ==========================================================================
// STATUS & ACTION ICONS
// ==========================================================================

/**
 * Verified Icon - Certification checkmark
 */
export const VerifiedIcon: React.FC<IconProps> = ({ 
  size = 'md', 
  variant = 'eucalyptus',
  className,
  ...props 
}) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={cn(sizeMap[size], variantMap[variant], className)}
    {...props}
  >
    {/* Badge shape */}
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" 
          fill="currentColor" fillOpacity="0.2" />
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    {/* Checkmark */}
    <path d="M9 12l2 2 4-4" strokeWidth="2" />
  </svg>
);

/**
 * Alert Icon - Warning/attention
 */
export const AlertIcon: React.FC<IconProps> = ({ 
  size = 'md', 
  variant = 'ochre',
  className,
  ...props 
}) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={cn(sizeMap[size], variantMap[variant], className)}
    {...props}
  >
    <path d="M12 2L2 20h20L12 2z" fill="currentColor" fillOpacity="0.2" />
    <path d="M12 2L2 20h20L12 2z" />
    <path d="M12 9v4" strokeWidth="2" />
    <circle cx="12" cy="16" r="1" fill="currentColor" />
  </svg>
);

/**
 * Trend Up Icon - Positive growth
 */
export const TrendUpIcon: React.FC<IconProps> = ({ 
  size = 'md', 
  variant = 'eucalyptus',
  className,
  ...props 
}) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={cn(sizeMap[size], variantMap[variant], className)}
    {...props}
  >
    <path d="M23 6l-9.5 9.5-5-5L1 18" />
    <path d="M17 6h6v6" />
  </svg>
);

/**
 * Trend Down Icon - Negative growth
 */
export const TrendDownIcon: React.FC<IconProps> = ({ 
  size = 'md', 
  variant = 'default',
  className,
  ...props 
}) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={cn(sizeMap[size], variantMap[variant], 'text-[#EF4444]', className)}
    {...props}
  >
    <path d="M23 18l-9.5-9.5-5 5L1 6" />
    <path d="M17 18h6v-6" />
  </svg>
);

// ==========================================================================
// ANIMATED ICONS
// ==========================================================================

/**
 * Loading Spinner - ABFI branded
 */
export const LoadingIcon: React.FC<IconProps> = ({ 
  size = 'md', 
  variant = 'ochre',
  className,
  ...props 
}) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    className={cn(sizeMap[size], variantMap[variant], 'animate-spin', className)}
    {...props}
  >
    <path d="M12 2v4" />
    <path d="M12 18v4" opacity="0.3" />
    <path d="M4.93 4.93l2.83 2.83" opacity="0.9" />
    <path d="M16.24 16.24l2.83 2.83" opacity="0.2" />
    <path d="M2 12h4" opacity="0.8" />
    <path d="M18 12h4" opacity="0.1" />
    <path d="M4.93 19.07l2.83-2.83" opacity="0.4" />
    <path d="M16.24 7.76l2.83-2.83" opacity="0.6" />
  </svg>
);

/**
 * Pulse Dot - Live status indicator
 */
export const PulseDotIcon: React.FC<IconProps & { active?: boolean }> = ({ 
  size = 'xs', 
  variant = 'eucalyptus',
  active = true,
  className,
  ...props 
}) => (
  <svg
    viewBox="0 0 24 24"
    className={cn(sizeMap[size], variantMap[variant], className)}
    {...props}
  >
    {active && (
      <circle 
        cx="12" 
        cy="12" 
        r="10" 
        fill="currentColor" 
        opacity="0.3"
        className="animate-ping"
      />
    )}
    <circle cx="12" cy="12" r="6" fill="currentColor" />
  </svg>
);

// ==========================================================================
// EXPORT ALL ICONS
// ==========================================================================

export const ABFIIcons = {
  // Feedstock
  Bamboo: BambooIcon,
  WheatStraw: WheatStrawIcon,
  Sugarcane: SugarcaneIcon,
  Canola: CanolaIcon,
  
  // Platform
  Bankability: BankabilityIcon,
  Registry: RegistryIcon,
  SupplyChain: SupplyChainIcon,
  CarbonCredit: CarbonCreditIcon,
  Bioenergy: BioenergyIcon,
  Contract: ContractIcon,
  
  // Portals
  Grower: GrowerIcon,
  Developer: DeveloperIcon,
  Lender: LenderIcon,
  Government: GovernmentIcon,
  
  // Status
  Verified: VerifiedIcon,
  Alert: AlertIcon,
  TrendUp: TrendUpIcon,
  TrendDown: TrendDownIcon,
  
  // Animated
  Loading: LoadingIcon,
  PulseDot: PulseDotIcon,
};

export default ABFIIcons;
