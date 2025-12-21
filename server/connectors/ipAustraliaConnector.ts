/**
 * IP Australia Connector
 * Fetches patent filings related to biofuel technologies
 *
 * Data Source: https://www.ipaustralia.gov.au/
 * API Portal: https://portal.api.ipaustralia.gov.au/
 * Patent Search: https://ipsearch.ipaustralia.gov.au/patents/
 *
 * Authentication: OAuth 2.0 Client Credentials
 * Required env vars: IPA_CLIENT_ID, IPA_CLIENT_SECRET
 */

import {
  BaseConnector,
  ConnectorConfig,
  ConnectorResult,
  RawSignal,
  BIOFUEL_KEYWORDS,
} from "./baseConnector";

// API Configuration
const API_CONFIG = {
  baseUrl: "https://production.api.ipaustralia.gov.au/public/australian-patent-search-api/v1",
  tokenUrl: "https://production.api.ipaustralia.gov.au/public/external-token-api/v1/access_token",
  // Test environment (for development)
  testBaseUrl: "https://test.api.ipaustralia.gov.au/public/australian-patent-search-api/v1",
  testTokenUrl: "https://test.api.ipaustralia.gov.au/public/external-token-api/v1/access_token",
};

interface PatentApplication {
  applicationNumber: string;
  publicationNumber?: string;
  title: string;
  applicantName: string;
  applicantAddress?: string;
  inventorNames?: string[];
  filingDate: string;
  publicationDate?: string;
  ipcClasses?: string[]; // International Patent Classification
  abstract?: string;
  status: string;
  url?: string;
}

// API Response types
interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface PatentSearchResponse {
  totalResults: number;
  results: PatentSearchResult[];
  page?: number;
  pageSize?: number;
}

interface PatentSearchResult {
  applicationNumber: string;
  publicationNumber?: string;
  title?: string;
  applicantNames?: string[];
  inventorNames?: string[];
  filingDate?: string;
  publicationDate?: string;
  ipcCodes?: string[];
  abstract?: string;
  status?: string;
  patentType?: string;
}

interface PatentDetailResponse {
  applicationNumber: string;
  publicationNumber?: string;
  title?: string;
  applicants?: Array<{
    name: string;
    address?: string;
  }>;
  inventors?: Array<{
    name: string;
  }>;
  filingDate?: string;
  publicationDate?: string;
  grantDate?: string;
  ipcCodes?: Array<{
    code: string;
    description?: string;
  }>;
  abstract?: string;
  claims?: string;
  status?: string;
  patentType?: string;
}

// IPC classes relevant to biofuels
const BIOFUEL_IPC_CLASSES = [
  "C10L", // Fuels not otherwise provided for
  "C10G", // Cracking hydrocarbon oils; production of liquid hydrocarbon mixtures
  "C10B", // Destructive distillation of carbonaceous materials
  "C10K", // Purifying or modifying the chemical composition of combustible gases
  "C12P", // Fermentation or enzyme-using processes
  "C11C", // Fatty acids; edible oils or fats
  "C07C", // Acyclic or carbocyclic compounds (esters relevant to biodiesel)
  "B01J", // Chemical or physical processes, e.g., catalysis
];

// Search keywords for patent search
const PATENT_SEARCH_KEYWORDS = [
  "biofuel",
  "biodiesel",
  "renewable diesel",
  "sustainable aviation fuel",
  "hydrotreated vegetable oil",
  "bioethanol",
  "used cooking oil fuel",
  "tallow fuel",
  "fatty acid methyl ester",
];

export class IPAustraliaConnector extends BaseConnector {
  private accessToken: string | null = null;
  private tokenExpiry: Date | null = null;
  private useTestEnv: boolean;

  constructor(config: ConnectorConfig) {
    super(config, "ip_australia");
    this.useTestEnv = process.env.IPA_USE_TEST_ENV === "true";
  }

  /**
   * Get OAuth 2.0 access token using client credentials
   */
  private async getAccessToken(): Promise<string> {
    // Return cached token if still valid
    if (this.accessToken && this.tokenExpiry && new Date() < this.tokenExpiry) {
      return this.accessToken;
    }

    const clientId = process.env.IPA_CLIENT_ID;
    const clientSecret = process.env.IPA_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new Error("IP Australia API credentials not configured. Set IPA_CLIENT_ID and IPA_CLIENT_SECRET environment variables.");
    }

    const tokenUrl = this.useTestEnv ? API_CONFIG.testTokenUrl : API_CONFIG.tokenUrl;

    this.log("Requesting access token...");

    const response = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: clientId,
        client_secret: clientSecret,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to get access token: ${response.status} ${errorText}`);
    }

    const data: TokenResponse = await response.json();
    this.accessToken = data.access_token;
    // Set expiry 5 minutes before actual expiry for safety
    this.tokenExpiry = new Date(Date.now() + (data.expires_in - 300) * 1000);

    this.log("Access token obtained successfully");
    return this.accessToken;
  }

  /**
   * Make authenticated API request
   */
  private async apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = await this.getAccessToken();
    const baseUrl = this.useTestEnv ? API_CONFIG.testBaseUrl : API_CONFIG.baseUrl;

    const response = await fetch(`${baseUrl}${endpoint}`, {
      ...options,
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
        "Accept": "application/json",
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API request failed: ${response.status} ${errorText}`);
    }

    return response.json();
  }

  /**
   * Search patents using the Quick Search endpoint
   */
  private async searchPatents(keyword: string, since?: Date): Promise<PatentSearchResult[]> {
    const searchBody: Record<string, unknown> = {
      query: keyword,
      pageSize: 50,
      page: 1,
    };

    // Add date filter if provided
    if (since) {
      searchBody.filingDateFrom = since.toISOString().split("T")[0];
    }

    const response = await this.apiRequest<PatentSearchResponse>("/search/quick", {
      method: "POST",
      body: JSON.stringify(searchBody),
    });

    return response.results || [];
  }

  /**
   * Get detailed patent information
   */
  private async getPatentDetails(applicationNumber: string): Promise<PatentDetailResponse | null> {
    try {
      return await this.apiRequest<PatentDetailResponse>(`/patent/${applicationNumber}`);
    } catch (error) {
      this.logError(`Failed to get details for patent ${applicationNumber}`, error);
      return null;
    }
  }

  async fetchSignals(since?: Date): Promise<ConnectorResult> {
    const startTime = Date.now();
    const signals: RawSignal[] = [];
    const errors: string[] = [];

    // Check if API credentials are configured
    const hasCredentials = process.env.IPA_CLIENT_ID && process.env.IPA_CLIENT_SECRET;

    if (!hasCredentials) {
      this.log("API credentials not configured, using mock data");
      return this.fetchMockSignals(since, startTime);
    }

    try {
      this.log("Starting IP Australia patent search with real API...");

      const allPatents: PatentSearchResult[] = [];
      const seenApplicationNumbers = new Set<string>();

      // Search for each biofuel-related keyword
      for (const keyword of PATENT_SEARCH_KEYWORDS) {
        try {
          await this.withRateLimit(async () => {
            this.log(`Searching for: ${keyword}`);
            const results = await this.searchPatents(keyword, since);

            for (const result of results) {
              if (!seenApplicationNumbers.has(result.applicationNumber)) {
                seenApplicationNumbers.add(result.applicationNumber);
                allPatents.push(result);
              }
            }
          });
        } catch (error) {
          this.logError(`Failed to search for keyword: ${keyword}`, error);
          // Continue with other keywords
        }
      }

      this.log(`Found ${allPatents.length} unique biofuel-related patents`);

      // Convert to signals
      for (const patent of allPatents) {
        if (this.isBiofuelRelated(patent)) {
          const signal = this.convertSearchResultToSignal(patent);
          if (signal) {
            signals.push(signal);
          }
        }
      }

      this.log(`Converted ${signals.length} patents to signals`);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      this.logError("Failed to fetch IP Australia data", error);
      errors.push(errorMessage);

      // Fall back to mock data on error
      if (signals.length === 0) {
        this.log("Falling back to mock data due to API error");
        return this.fetchMockSignals(since, startTime, errors);
      }
    }

    return {
      success: errors.length === 0,
      signalsDiscovered: signals.length,
      signals,
      errors,
      duration: Date.now() - startTime,
    };
  }

  /**
   * Fallback mock data for development/testing
   */
  private async fetchMockSignals(
    since?: Date,
    startTime: number = Date.now(),
    existingErrors: string[] = []
  ): Promise<ConnectorResult> {
    const mockPatents: PatentApplication[] = [
      {
        applicationNumber: "2024203456",
        publicationNumber: "AU2024203456A1",
        title: "Process for Producing Renewable Diesel from Waste Oils",
        applicantName: "Southern Oil Refining Pty Ltd",
        applicantAddress: "Wagga Wagga, NSW, Australia",
        inventorNames: ["John Smith", "Jane Doe"],
        filingDate: "2024-06-15",
        publicationDate: "2024-09-01",
        ipcClasses: ["C10G3/00", "C10L1/02"],
        abstract:
          "A process for converting waste cooking oils and animal fats into renewable diesel using catalytic hydrogenation with improved yield and reduced energy consumption.",
        status: "Published",
        url: "https://pericles.ipaustralia.gov.au/ols/auspat/applicationDetails.do?applicationNo=2024203456",
      },
      {
        applicationNumber: "2024204521",
        publicationNumber: "AU2024204521A1",
        title: "Sustainable Aviation Fuel Production System",
        applicantName: "Jet Zero Technologies Pty Ltd",
        applicantAddress: "Brisbane, QLD, Australia",
        inventorNames: ["Dr. Michael Chen", "Dr. Sarah Wilson"],
        filingDate: "2024-08-20",
        publicationDate: "2024-11-15",
        ipcClasses: ["C10G3/00", "C10L1/04", "B01J23/44"],
        abstract:
          "An integrated system for producing sustainable aviation fuel from multiple feedstock sources including used cooking oil, tallow, and agricultural residues.",
        status: "Under Examination",
        url: "https://pericles.ipaustralia.gov.au/ols/auspat/applicationDetails.do?applicationNo=2024204521",
      },
      {
        applicationNumber: "2024201234",
        publicationNumber: "AU2024201234A1",
        title: "Algae Cultivation and Lipid Extraction for Biodiesel",
        applicantName: "Algae Fuel Technologies Pty Ltd",
        applicantAddress: "Townsville, QLD, Australia",
        inventorNames: ["Dr. Emma Roberts"],
        filingDate: "2024-03-10",
        publicationDate: "2024-06-20",
        ipcClasses: ["C12P7/64", "C10L1/02", "C12N1/12"],
        abstract:
          "Method for cultivating microalgae in photobioreactors and extracting lipids for biodiesel production with enhanced efficiency.",
        status: "Granted",
        url: "https://pericles.ipaustralia.gov.au/ols/auspat/applicationDetails.do?applicationNo=2024201234",
      },
      {
        applicationNumber: "2024205678",
        title: "Catalytic Conversion of UCO to Biodiesel",
        applicantName: "BioEnergy Holdings Ltd",
        applicantAddress: "Melbourne, VIC, Australia",
        inventorNames: ["Dr. Robert Taylor", "Dr. Lisa Anderson"],
        filingDate: "2024-10-01",
        ipcClasses: ["C10G3/00", "C07C67/03", "B01J23/46"],
        abstract:
          "Novel catalyst formulation for improved transesterification of used cooking oil to biodiesel with reduced processing time and higher purity.",
        status: "Filed",
        url: "https://pericles.ipaustralia.gov.au/ols/auspat/applicationDetails.do?applicationNo=2024205678",
      },
      {
        applicationNumber: "2024206789",
        title: "Tallow Pre-treatment for Biofuel Production",
        applicantName: "AusTallow Processing Pty Ltd",
        applicantAddress: "Adelaide, SA, Australia",
        inventorNames: ["Dr. Peter Jones"],
        filingDate: "2024-11-05",
        ipcClasses: ["C11B3/00", "C10L1/02"],
        abstract:
          "Process for pre-treating tallow feedstock to remove impurities and improve conversion efficiency in biodiesel production.",
        status: "Filed",
        url: "https://pericles.ipaustralia.gov.au/ols/auspat/applicationDetails.do?applicationNo=2024206789",
      },
    ];

    // Filter by date if provided
    let filteredPatents = mockPatents;
    if (since) {
      filteredPatents = mockPatents.filter((p) => {
        const filingDate = new Date(p.filingDate);
        return filingDate >= since;
      });
    }

    const signals = filteredPatents.map((p) => this.convertMockPatentToSignal(p)).filter(Boolean) as RawSignal[];

    return {
      success: existingErrors.length === 0,
      signalsDiscovered: signals.length,
      signals,
      errors: existingErrors,
      duration: Date.now() - startTime,
    };
  }

  private isBiofuelRelated(patent: PatentSearchResult): boolean {
    // Check IPC classes first (most reliable)
    if (patent.ipcCodes) {
      for (const ipc of patent.ipcCodes) {
        for (const biofuelIpc of BIOFUEL_IPC_CLASSES) {
          if (ipc.startsWith(biofuelIpc)) {
            return true;
          }
        }
      }
    }

    // Check title and abstract for keywords
    const searchText = `${patent.title || ""} ${patent.abstract || ""}`.toLowerCase();
    return BIOFUEL_KEYWORDS.some((keyword) => searchText.includes(keyword));
  }

  private convertSearchResultToSignal(patent: PatentSearchResult): RawSignal | null {
    const signalType = this.determineSignalType(patent.title || "", patent.abstract || "");
    const weight = this.calculateWeight(patent);

    return {
      sourceId: patent.applicationNumber,
      title: `Patent: ${patent.title || "Untitled"}`,
      description: patent.abstract,
      sourceUrl: `https://pericles.ipaustralia.gov.au/ols/auspat/applicationDetails.do?applicationNo=${patent.applicationNumber}`,
      detectedAt: patent.filingDate ? new Date(patent.filingDate) : new Date(),
      entityName: patent.applicantNames?.[0] || "Unknown Applicant",
      signalType,
      signalWeight: weight,
      confidence: 0.95, // High confidence from official IP registry
      rawData: {
        applicationNumber: patent.applicationNumber,
        publicationNumber: patent.publicationNumber,
        ipcClasses: patent.ipcCodes,
        inventorNames: patent.inventorNames,
        status: patent.status,
        patentType: patent.patentType,
      },
      identifiers: {
        patentId: patent.applicationNumber,
      },
      metadata: {
        inventors: patent.inventorNames,
        ipcClasses: patent.ipcCodes,
        status: patent.status,
        publicationDate: patent.publicationDate,
      },
    };
  }

  private convertMockPatentToSignal(patent: PatentApplication): RawSignal | null {
    const signalType = this.determineSignalType(patent.title, patent.abstract || "");
    const weight = this.calculateWeightFromMock(patent);

    return {
      sourceId: patent.applicationNumber,
      title: `Patent: ${patent.title}`,
      description: patent.abstract,
      sourceUrl: patent.url,
      detectedAt: patent.filingDate ? new Date(patent.filingDate) : new Date(),
      entityName: patent.applicantName,
      signalType,
      signalWeight: weight,
      confidence: 0.95,
      rawData: {
        applicationNumber: patent.applicationNumber,
        publicationNumber: patent.publicationNumber,
        ipcClasses: patent.ipcClasses,
        inventorNames: patent.inventorNames,
        status: patent.status,
      },
      identifiers: {
        patentId: patent.applicationNumber,
      },
      metadata: {
        inventors: patent.inventorNames,
        ipcClasses: patent.ipcClasses,
        status: patent.status,
        publicationDate: patent.publicationDate,
      },
    };
  }

  private determineSignalType(title: string, abstract: string): RawSignal["signalType"] {
    const searchText = `${title} ${abstract}`.toLowerCase();

    // Check for core biofuel technology patents
    const coreBiofuelTerms = [
      "biodiesel",
      "renewable diesel",
      "sustainable aviation fuel",
      "saf",
      "hvo",
      "biofuel production",
    ];

    if (coreBiofuelTerms.some((term) => searchText.includes(term))) {
      return "patent_biofuel_tech";
    }

    // General patent filings
    return "patent_filing";
  }

  private calculateWeight(patent: PatentSearchResult): number {
    let weight = 3.0; // Base weight for patents

    // Increase for granted patents
    if (patent.status === "Granted" || patent.status === "Sealed") {
      weight += 2.0;
    } else if (patent.status === "Published" || patent.status === "Accepted") {
      weight += 1.0;
    }

    // Increase for core biofuel IPC classes
    if (patent.ipcCodes) {
      const coreClasses = ["C10L", "C10G"];
      if (patent.ipcCodes.some((ipc) => coreClasses.some((core) => ipc.startsWith(core)))) {
        weight += 1.0;
      }
    }

    // Increase for detailed abstracts
    if (patent.abstract && patent.abstract.length > 200) {
      weight += 0.5;
    }

    return Math.min(weight, 6.0);
  }

  private calculateWeightFromMock(patent: PatentApplication): number {
    let weight = 3.0;

    if (patent.status === "Granted") {
      weight += 2.0;
    } else if (patent.status === "Published") {
      weight += 1.0;
    }

    if (patent.ipcClasses) {
      const coreClasses = ["C10L", "C10G"];
      if (patent.ipcClasses.some((ipc) => coreClasses.some((core) => ipc.startsWith(core)))) {
        weight += 1.0;
      }
    }

    if (patent.abstract && patent.abstract.length > 200) {
      weight += 0.5;
    }

    return Math.min(weight, 6.0);
  }
}
