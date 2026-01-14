/**
 * Base Connector Interface for Stealth Discovery
 * All data source connectors implement this interface
 */

export interface RawSignal {
  sourceId: string;
  title: string;
  description?: string;
  sourceUrl?: string;
  detectedAt: Date;
  entityName: string;
  signalType: SignalType;
  signalWeight: number;
  confidence: number;
  rawData: Record<string, unknown>;
  identifiers?: {
    abn?: string;
    acn?: string;
    patentId?: string;
    permitId?: string;
  };
  metadata?: Record<string, unknown>;
}

// Signal types must match the MySQL enum in drizzle/schema.ts
export type SignalType =
  | "planning_application"
  | "grant_announcement"
  | "investment_disclosure"
  | "environmental_approval"
  | "patent_filing"
  | "patent_biofuel_tech"
  | "job_posting"
  | "news_mention"
  | "regulatory_filing"
  | "partnership_announcement"
  | "resource_estimate";

export interface ConnectorConfig {
  name: string;
  enabled: boolean;
  apiKey?: string;
  baseUrl?: string;
  rateLimit?: number; // requests per minute
  lastSyncAt?: Date;
}

export interface ConnectorResult {
  success: boolean;
  signalsDiscovered: number;
  signals: RawSignal[];
  errors: string[];
  duration: number; // milliseconds
}

export abstract class BaseConnector {
  protected config: ConnectorConfig;
  protected source: string;

  constructor(config: ConnectorConfig, source: string) {
    this.config = config;
    this.source = source;
  }

  abstract fetchSignals(since?: Date): Promise<ConnectorResult>;

  protected async withRateLimit<T>(fn: () => Promise<T>): Promise<T> {
    // Simple rate limiting - can be enhanced
    if (this.config.rateLimit) {
      await new Promise((resolve) =>
        setTimeout(resolve, 60000 / this.config.rateLimit!)
      );
    }
    return fn();
  }

  protected log(message: string): void {
    console.log(`[${this.source}] ${message}`);
  }

  protected async fetchWithRetry(
    url: string,
    options: RequestInit = {},
    maxRetries: number = 3
  ): Promise<Response> {
    let lastError: Error;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch(url, options);

        // If we get a successful response, return it
        if (response.ok) {
          return response;
        }

        // If it's a client error (4xx), don't retry
        if (response.status >= 400 && response.status < 500) {
          return response;
        }

        // For server errors (5xx) or network errors, retry
        lastError = new Error(`HTTP ${response.status}: ${response.statusText}`);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
      }

      // Wait before retrying (exponential backoff)
      if (attempt < maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, attempt), 10000); // Max 10s
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError!;
  }

  protected logError(message: string, error?: unknown): void {
    console.error(`[${this.source}] ERROR: ${message}`, error);
  }
}

// Biofuel-related keywords for filtering
export const BIOFUEL_KEYWORDS = [
  // Primary biofuel terms
  "biofuel",
  "biodiesel",
  "bioethanol",
  "renewable diesel",
  "sustainable aviation fuel",
  "saf",
  "hvo",
  "hydrotreated vegetable oil",
  "fame",
  "fatty acid methyl ester",

  // Feedstock terms
  "used cooking oil",
  "uco",
  "tallow",
  "canola oil",
  "soybean oil",
  "palm oil",
  "waste oil",
  "animal fat",
  "vegetable oil",
  "feedstock",

  // Process terms
  "transesterification",
  "hydrogenation",
  "fischer-tropsch",
  "pyrolysis",
  "gasification",
  "biorefinery",
  "bio-refinery",

  // Facility terms
  "biofuel plant",
  "biodiesel plant",
  "bioethanol plant",
  "renewable fuel facility",
  "bioenergy",
  "bio-energy",
];

export const BIOFUEL_INDUSTRY_CODES = {
  anzsic: [
    "1709", // Other Petroleum and Coal Product Manufacturing
    "1709", // Biofuel Manufacturing
    "2611", // Petroleum Refining
  ],
  sic: ["2869", "2911"],
};
