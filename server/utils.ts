/**
 * Utility functions for ABFI platform
 */

import { nanoid } from 'nanoid';

/**
 * Generate unique ABFI ID in format: ABFI-[TYPE]-[STATE]-[XXXXXX]
 * Example: ABFI-UCO-NSW-A3B9K2
 */
export function generateAbfiId(
  category: string,
  state: string
): string {
  const typeCode = getCategoryCode(category);
  const randomSuffix = nanoid(6).toUpperCase();
  
  return `ABFI-${typeCode}-${state}-${randomSuffix}`;
}

function getCategoryCode(category: string): string {
  const codes: Record<string, string> = {
    'oilseed': 'OIL',
    'UCO': 'UCO',
    'tallow': 'TAL',
    'lignocellulosic': 'LIG',
    'waste': 'WST',
    'algae': 'ALG',
    'other': 'OTH',
  };
  
  return codes[category] || 'OTH';
}

/**
 * Validate Australian ABN (Australian Business Number)
 * ABN is 11 digits
 */
export function validateABN(abn: string): boolean {
  // Remove spaces and hyphens
  const cleanABN = abn.replace(/[\s-]/g, '');
  
  // Must be 11 digits
  if (!/^\d{11}$/.test(cleanABN)) {
    return false;
  }
  
  // Apply ABN checksum algorithm
  const weights = [10, 1, 3, 5, 7, 9, 11, 13, 15, 17, 19];
  let sum = 0;
  
  for (let i = 0; i < 11; i++) {
    let digit = parseInt(cleanABN[i]);
    
    // Subtract 1 from first digit
    if (i === 0) {
      digit -= 1;
    }
    
    sum += digit * weights[i];
  }
  
  return sum % 89 === 0;
}

/**
 * Format ABN for display (XX XXX XXX XXX)
 */
export function formatABN(abn: string): string {
  const clean = abn.replace(/[\s-]/g, '');
  if (clean.length !== 11) return abn;
  
  return `${clean.slice(0, 2)} ${clean.slice(2, 5)} ${clean.slice(5, 8)} ${clean.slice(8, 11)}`;
}

/**
 * Calculate distance between two coordinates (Haversine formula)
 * Returns distance in kilometers
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return Math.round(distance * 10) / 10; // Round to 1 decimal place
}

function toRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Format price from cents to dollars
 */
export function formatPrice(cents: number | null | undefined): string {
  if (cents === null || cents === undefined) return 'N/A';
  const dollars = cents / 100;
  return `$${dollars.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Parse price from dollars to cents
 */
export function parsePrice(dollars: number): number {
  return Math.round(dollars * 100);
}

/**
 * Get Australian state name from code
 */
export function getStateName(code: string): string {
  const states: Record<string, string> = {
    'NSW': 'New South Wales',
    'VIC': 'Victoria',
    'QLD': 'Queensland',
    'SA': 'South Australia',
    'WA': 'Western Australia',
    'TAS': 'Tasmania',
    'NT': 'Northern Territory',
    'ACT': 'Australian Capital Territory',
  };
  
  return states[code] || code;
}

/**
 * Get feedstock category display name
 */
export function getCategoryName(category: string): string {
  const names: Record<string, string> = {
    'oilseed': 'Oilseed Crops',
    'UCO': 'Used Cooking Oil',
    'tallow': 'Tallow & Animal Fats',
    'lignocellulosic': 'Lignocellulosic Biomass',
    'waste': 'Waste Streams',
    'algae': 'Algae',
    'other': 'Other',
  };
  
  return names[category] || category;
}

/**
 * Get certification type display name
 */
export function getCertificationName(type: string): string {
  const names: Record<string, string> = {
    'ISCC_EU': 'ISCC EU',
    'ISCC_PLUS': 'ISCC PLUS',
    'RSB': 'RSB',
    'RED_II': 'RED II',
    'GO': 'Guarantee of Origin',
    'ABFI': 'ABFI Certified',
    'OTHER': 'Other',
  };
  
  return names[type] || type;
}

/**
 * Check if certificate is expiring soon
 */
export function isCertificateExpiringSoon(expiryDate: Date | null, daysAhead: number = 30): boolean {
  if (!expiryDate) return false;
  
  const now = new Date();
  const expiry = new Date(expiryDate);
  const daysUntilExpiry = Math.floor((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  return daysUntilExpiry <= daysAhead && daysUntilExpiry >= 0;
}

/**
 * Format date for display
 */
export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return 'N/A';
  
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-AU', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Format date and time for display
 */
export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return 'N/A';
  
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('en-AU', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Get relative time string (e.g., "2 hours ago")
 */
export function getRelativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  
  if (diffSec < 60) return 'just now';
  if (diffMin < 60) return `${diffMin} minute${diffMin > 1 ? 's' : ''} ago`;
  if (diffHour < 24) return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`;
  if (diffDay < 7) return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
  if (diffDay < 30) return `${Math.floor(diffDay / 7)} week${Math.floor(diffDay / 7) > 1 ? 's' : ''} ago`;
  if (diffDay < 365) return `${Math.floor(diffDay / 30)} month${Math.floor(diffDay / 30) > 1 ? 's' : ''} ago`;
  return `${Math.floor(diffDay / 365)} year${Math.floor(diffDay / 365) > 1 ? 's' : ''} ago`;
}

/**
 * Sanitize filename for storage
 */
export function sanitizeFilename(filename: string): string {
  // Remove or replace unsafe characters
  return filename
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .replace(/_{2,}/g, '_')
    .toLowerCase();
}

/**
 * Generate random suffix for file keys to prevent enumeration
 */
export function randomSuffix(length: number = 8): string {
  return nanoid(length);
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}
