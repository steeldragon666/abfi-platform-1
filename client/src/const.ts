export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// Generate login URL at runtime so redirect URI reflects the current origin.
export const getLoginUrl = () => {
  // In development mode, use the local dev login page
  if (import.meta.env.DEV) {
    return "/login";
  }

  const oauthPortalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL;
  const appId = import.meta.env.VITE_APP_ID;

  // Handle missing environment variables gracefully
  if (!oauthPortalUrl || !appId) {
    console.warn(
      "OAuth configuration missing: VITE_OAUTH_PORTAL_URL or VITE_APP_ID not set"
    );
    return "/login"; // Fallback to dev login page
  }

  const redirectUri = `${window.location.origin}/api/oauth/callback`;
  const state = btoa(redirectUri);

  const url = new URL(`${oauthPortalUrl}/app-auth`);
  url.searchParams.set("appId", appId);
  url.searchParams.set("redirectUri", redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("type", "signIn");

  return url.toString();
};

// ABFI Platform Constants

export const AUSTRALIAN_STATES = [
  { value: "NSW", label: "New South Wales" },
  { value: "VIC", label: "Victoria" },
  { value: "QLD", label: "Queensland" },
  { value: "SA", label: "South Australia" },
  { value: "WA", label: "Western Australia" },
  { value: "TAS", label: "Tasmania" },
  { value: "NT", label: "Northern Territory" },
  { value: "ACT", label: "Australian Capital Territory" },
] as const;

export const FEEDSTOCK_CATEGORIES = [
  { value: "oilseed", label: "Oilseed Crops" },
  { value: "UCO", label: "Used Cooking Oil" },
  { value: "tallow", label: "Tallow & Animal Fats" },
  { value: "lignocellulosic", label: "Lignocellulosic Biomass" },
  { value: "waste", label: "Waste Streams" },
  { value: "algae", label: "Algae" },
  { value: "bamboo", label: "Bamboo" },
  { value: "other", label: "Other" },
] as const;

export const PRODUCTION_METHODS = [
  { value: "crop", label: "Crop" },
  { value: "waste", label: "Waste" },
  { value: "residue", label: "Residue" },
  { value: "processing_byproduct", label: "Processing Byproduct" },
] as const;

export const CERTIFICATE_TYPES = [
  { value: "ISCC_EU", label: "ISCC EU" },
  { value: "ISCC_PLUS", label: "ISCC PLUS" },
  { value: "RSB", label: "RSB" },
  { value: "RED_II", label: "RED II" },
  { value: "GO", label: "Guarantee of Origin" },
  { value: "ABFI", label: "ABFI Certified" },
  { value: "OTHER", label: "Other" },
] as const;

export function getScoreGrade(score: number): string {
  if (score >= 90) return "A+";
  if (score >= 80) return "A";
  if (score >= 70) return "B+";
  if (score >= 60) return "B";
  if (score >= 50) return "C+";
  if (score >= 40) return "C";
  if (score >= 30) return "D";
  return "F";
}

export function getScoreColor(score: number): string {
  if (score >= 80) return "green";
  if (score >= 60) return "yellow";
  if (score >= 40) return "orange";
  return "red";
}

export function getCarbonGrade(ciValue: number): string {
  if (ciValue < 10) return "A+";
  if (ciValue < 20) return "A";
  if (ciValue < 30) return "B+";
  if (ciValue < 40) return "B";
  if (ciValue < 50) return "C+";
  if (ciValue < 60) return "C";
  if (ciValue < 70) return "D";
  return "F";
}

export function formatPrice(cents: number | null | undefined): string {
  if (cents === null || cents === undefined) return "N/A";
  const dollars = cents / 100;
  return `$${dollars.toLocaleString("en-AU", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "N/A";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-AU", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatABN(abn: string): string {
  const clean = abn.replace(/[\s-]/g, "");
  if (clean.length !== 11) return abn;
  return `${clean.slice(0, 2)} ${clean.slice(2, 5)} ${clean.slice(5, 8)} ${clean.slice(8, 11)}`;
}
