// File: client/src/components/Trust/TrustIndicators.tsx
// Trust and security indicators for government/fintech compliance
// Addresses A1: Trust & Security Visibility heuristic

import React, { useState } from 'react';
import {
  Shield,
  Lock,
  CheckCircle2,
  Globe,
  Building2,
  FileCheck,
  ChevronDown,
  ChevronUp,
  Award,
  Server
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Australian flag SVG component
function AustralianFlag({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 16" className={className} aria-hidden="true">
      <rect fill="#00008B" width="32" height="16"/>
      <path fill="#FFF" d="M0,0 L16,8 L0,16 Z M16,0 L0,8 L16,16 Z"/>
      <path fill="#C8102E" d="M0,6 L16,6 L16,10 L0,10 Z M6,0 L6,16 L10,16 L10,0 Z"/>
      <circle cx="24" cy="8" r="2" fill="#FFF"/>
    </svg>
  );
}

interface TrustBadgeProps {
  icon: React.ReactNode;
  label: string;
  description?: string;
  variant?: 'default' | 'government' | 'secure' | 'verified';
  className?: string;
}

export function TrustBadge({
  icon,
  label,
  description,
  variant = 'default',
  className
}: TrustBadgeProps) {
  const variantClasses = {
    default: 'bg-gray-50 border-gray-200 text-gray-800 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200',
    government: 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-300',
    secure: 'bg-violet-50 border-violet-200 text-violet-800 dark:bg-violet-900/30 dark:border-violet-800 dark:text-violet-300',
    verified: 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-900/30 dark:border-emerald-800 dark:text-emerald-300'
  };

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium",
        variantClasses[variant],
        className
      )}
      role="status"
      aria-label={`${label}${description ? `: ${description}` : ''}`}
    >
      {icon}
      <span>{label}</span>
    </div>
  );
}

interface SecurityStatusProps {
  className?: string;
}

export function SecurityStatus({ className }: SecurityStatusProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const securityFeatures = [
    { id: 'ssl', label: 'SSL/TLS Encrypted', status: true, icon: Lock },
    { id: 'data-au', label: 'Australian Data Residency', status: true, icon: Server },
    { id: 'soc2', label: 'SOC 2 Compliant', status: true, icon: FileCheck },
    { id: 'iso27001', label: 'ISO 27001', status: true, icon: Award },
  ];

  return (
    <div
      className={cn(
        "bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-sm",
        className
      )}
    >
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-3 text-left"
        aria-expanded={isExpanded}
        aria-controls="security-details"
      >
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
            Secure Connection
          </span>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
            Verified
          </span>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-gray-500" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-500" />
        )}
      </button>

      {isExpanded && (
        <div id="security-details" className="px-3 pb-3 space-y-2">
          {securityFeatures.map((feature) => (
            <div key={feature.id} className="flex items-center gap-2 text-sm">
              <feature.icon className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="text-gray-700 dark:text-gray-300">{feature.label}</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 ml-auto" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface DataResidencyBadgeProps {
  className?: string;
}

export function DataResidencyBadge({ className }: DataResidencyBadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 px-3 py-2 rounded-lg",
        "bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20",
        "border border-green-200 dark:border-green-800",
        className
      )}
      role="status"
      aria-label="Data stored in Australia"
    >
      <AustralianFlag className="w-5 h-3" />
      <div className="flex flex-col">
        <span className="text-xs font-semibold text-green-800 dark:text-green-300">
          Data Residency: Australia
        </span>
        <span className="text-[10px] text-green-600 dark:text-green-400">
          Sydney & Melbourne Data Centers
        </span>
      </div>
    </div>
  );
}

interface ComplianceBadgesProps {
  className?: string;
  compact?: boolean;
}

export function ComplianceBadges({ className, compact = false }: ComplianceBadgesProps) {
  const badges = [
    { id: 'daff', label: 'DAFF Registered', icon: Building2, variant: 'government' as const },
    { id: 'clean-energy', label: 'Clean Energy Council', icon: Award, variant: 'verified' as const },
    { id: 'accu', label: 'ACCU Certified', icon: FileCheck, variant: 'verified' as const },
  ];

  if (compact) {
    return (
      <div className={cn("flex items-center gap-1", className)}>
        {badges.map((badge) => (
          <div
            key={badge.id}
            className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center"
            title={badge.label}
            aria-label={badge.label}
          >
            <badge.icon className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {badges.map((badge) => (
        <TrustBadge
          key={badge.id}
          icon={<badge.icon className="w-3.5 h-3.5" />}
          label={badge.label}
          variant={badge.variant}
        />
      ))}
    </div>
  );
}

interface TrustFooterProps {
  className?: string;
}

export function TrustFooter({ className }: TrustFooterProps) {
  return (
    <footer
      className={cn(
        "border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 py-4 px-6",
        className
      )}
      role="contentinfo"
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Security Indicators */}
        <div className="flex items-center gap-4">
          <div className="security-badge ssl-indicator flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <Lock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
            <span>256-bit SSL Encryption</span>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <Globe className="w-4 h-4 text-blue-600 dark:text-blue-400" aria-hidden="true" />
            <span>Australian Data Residency</span>
          </div>
        </div>

        {/* Compliance Badges */}
        <div className="flex items-center gap-3">
          <ComplianceBadges compact />
          <span className="text-xs text-gray-500 dark:text-gray-500">
            Regulated by DAFF & CER
          </span>
        </div>
      </div>

      {/* Legal Links */}
      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 flex flex-wrap items-center justify-center gap-4 text-xs text-gray-500 dark:text-gray-400">
        <a
          href="/privacy"
          className="privacy-link hover:text-gray-700 dark:hover:text-gray-300 underline-offset-2 hover:underline"
        >
          Privacy Policy
        </a>
        <span aria-hidden="true">•</span>
        <a
          href="/terms"
          className="terms-link hover:text-gray-700 dark:hover:text-gray-300 underline-offset-2 hover:underline"
        >
          Terms of Service
        </a>
        <span aria-hidden="true">•</span>
        <span>© {new Date().getFullYear()} ABFI Platform. All rights reserved.</span>
      </div>
    </footer>
  );
}

// Floating security indicator (for bottom-right corner)
interface FloatingSecurityIndicatorProps {
  className?: string;
}

export function FloatingSecurityIndicator({ className }: FloatingSecurityIndicatorProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div
      className={cn(
        "fixed bottom-4 right-4 z-50",
        className
      )}
    >
      {isExpanded ? (
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-4 w-72 animate-in slide-in-from-bottom-2">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <span className="font-semibold text-gray-900 dark:text-gray-100">Security Status</span>
            </div>
            <button
              onClick={() => setIsExpanded(false)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              aria-label="Close security details"
            >
              ×
            </button>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span className="text-gray-700 dark:text-gray-300">SSL/TLS Encrypted</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span className="text-gray-700 dark:text-gray-300">Australian Data Centers</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span className="text-gray-700 dark:text-gray-300">ACSC Essential Eight</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span className="text-gray-700 dark:text-gray-300">SOC 2 Type II Compliant</span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
            <DataResidencyBadge className="w-full justify-center" />
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsExpanded(true)}
          className="security-badge ssl-badge flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-emerald-200 dark:border-emerald-800 hover:shadow-xl transition-shadow"
          aria-label="View security status"
        >
          <Shield className="w-4 h-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">SSL Secure</span>
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

export default {
  TrustBadge,
  SecurityStatus,
  DataResidencyBadge,
  ComplianceBadges,
  TrustFooter,
  FloatingSecurityIndicator
};
