/**
 * Carbon Intensity Module
 * Exports all CI calculation functions and constants
 */

export * from './calculator';
export * from './constants';
// Certificate functions exported separately to avoid React dependencies in non-React contexts
// Import from '@/lib/ci/certificate' directly when needed
