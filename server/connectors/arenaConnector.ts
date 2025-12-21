/**
 * ARENA (Australian Renewable Energy Agency) Connector
 * Fetches grant announcements and funded projects via WordPress REST API
 *
 * Data Source: https://arena.gov.au/
 * API Endpoint: https://arena.gov.au/wp-json/wp/v2/projects
 * Projects Database: https://arena.gov.au/projects/
 *
 * No authentication required - public API
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
  baseUrl: "https://arena.gov.au/wp-json/wp/v2",
  projectsEndpoint: "/projects",
  technologyEndpoint: "/technology",
  // Bioenergy / Energy from waste taxonomy ID
  bioenergyTechnologyId: 33,
  // Results per page (max 100)
  perPage: 100,
};

// WordPress REST API response types
interface WPProject {
  id: number;
  date: string;
  date_gmt: string;
  modified: string;
  modified_gmt: string;
  slug: string;
  status: string;
  type: string;
  link: string;
  title: {
    rendered: string;
  };
  excerpt: {
    rendered: string;
    protected: boolean;
  };
  featured_media: number;
  template: string;
  technology: number[];
  location: number[];
  priority: number[];
  portfolio: number[];
  acf: {
    featured_project?: boolean;
    hero_image?: {
      url: string;
      alt: string;
    };
    summary_heading?: string;
    introduction?: string;
    lead_organisation?: string;
    project_partners?: string;
    arena_funding_provided?: string;
    total_project_value?: string;
    start_date?: string; // YYYYMMDD format
    end_date?: string; // YYYYMMDD format
    postcode?: string;
    contact_name?: string;
    contact_email?: string;
    gms_number?: string;
    arena_program_funding?: {
      ID: number;
      post_title: string;
    };
  };
  primary_category?: {
    term_id: number;
    name: string;
    slug: string;
    description: string;
  };
  primary_location?: {
    term_id: number;
    name: string;
    slug: string;
  };
  _links: Record<string, unknown>;
}

interface WPTechnology {
  id: number;
  count: number;
  description: string;
  link: string;
  name: string;
  slug: string;
  taxonomy: string;
  parent: number;
}

interface ArenaProject {
  projectId: string;
  projectName: string;
  leadOrganisation: string;
  partners?: string[];
  fundingAmount: number;
  totalProjectValue?: number;
  status: string;
  technology?: string;
  location?: string;
  state?: string;
  summary?: string;
  announcedDate?: string;
  startDate?: string;
  endDate?: string;
  url?: string;
  gmsNumber?: string;
}

export class ArenaConnector extends BaseConnector {
  private technologyCache: Map<number, string> = new Map();

  constructor(config: ConnectorConfig) {
    super(config, "arena");
  }

  /**
   * Fetch technology taxonomy terms for ID-to-name mapping
   */
  private async fetchTechnologyTerms(): Promise<void> {
    if (this.technologyCache.size > 0) return;

    try {
      const response = await fetch(
        `${API_CONFIG.baseUrl}${API_CONFIG.technologyEndpoint}?per_page=100`
      );

      if (!response.ok) {
        this.logError(`Failed to fetch technology terms: ${response.status}`);
        return;
      }

      const terms: WPTechnology[] = await response.json();
      for (const term of terms) {
        this.technologyCache.set(term.id, term.name);
      }

      this.log(`Cached ${this.technologyCache.size} technology terms`);
    } catch (error) {
      this.logError("Error fetching technology terms", error);
    }
  }

  /**
   * Fetch projects from WordPress REST API
   */
  private async fetchProjects(since?: Date, page: number = 1): Promise<WPProject[]> {
    const params = new URLSearchParams({
      per_page: String(API_CONFIG.perPage),
      page: String(page),
      orderby: "date",
      order: "desc",
      status: "publish",
    });

    // Filter by date if provided (WordPress uses ISO 8601)
    if (since) {
      params.set("after", since.toISOString());
    }

    const url = `${API_CONFIG.baseUrl}${API_CONFIG.projectsEndpoint}?${params}`;
    this.log(`Fetching projects: ${url}`);

    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": "ABFI-Platform/1.0 (Stealth Discovery Connector)",
      },
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Fetch bioenergy-specific projects
   */
  private async fetchBioenergyProjects(since?: Date): Promise<WPProject[]> {
    const params = new URLSearchParams({
      per_page: String(API_CONFIG.perPage),
      technology: String(API_CONFIG.bioenergyTechnologyId),
      orderby: "date",
      order: "desc",
      status: "publish",
    });

    if (since) {
      params.set("after", since.toISOString());
    }

    const url = `${API_CONFIG.baseUrl}${API_CONFIG.projectsEndpoint}?${params}`;
    this.log(`Fetching bioenergy projects: ${url}`);

    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": "ABFI-Platform/1.0 (Stealth Discovery Connector)",
      },
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Search all projects and filter by biofuel keywords
   */
  private async searchBiofuelProjects(since?: Date): Promise<WPProject[]> {
    const allProjects: WPProject[] = [];
    const seenIds = new Set<number>();

    // First, get bioenergy category projects
    try {
      const bioenergyProjects = await this.fetchBioenergyProjects(since);
      for (const project of bioenergyProjects) {
        if (!seenIds.has(project.id)) {
          seenIds.add(project.id);
          allProjects.push(project);
        }
      }
      this.log(`Found ${bioenergyProjects.length} bioenergy projects`);
    } catch (error) {
      this.logError("Failed to fetch bioenergy projects", error);
    }

    // Then search for keyword matches in recent projects
    try {
      let page = 1;
      let hasMore = true;

      while (hasMore && page <= 3) {
        // Limit to 3 pages to avoid too many requests
        await this.withRateLimit(async () => {
          const projects = await this.fetchProjects(since, page);

          if (projects.length === 0) {
            hasMore = false;
            return;
          }

          for (const project of projects) {
            if (!seenIds.has(project.id) && this.isBiofuelRelated(project)) {
              seenIds.add(project.id);
              allProjects.push(project);
            }
          }

          if (projects.length < API_CONFIG.perPage) {
            hasMore = false;
          }
          page++;
        });
      }
    } catch (error) {
      this.logError("Failed to fetch general projects", error);
    }

    return allProjects;
  }

  /**
   * Check if project is biofuel-related by searching text content
   */
  private isBiofuelRelated(project: WPProject): boolean {
    // Check if it's in the bioenergy category
    if (project.technology.includes(API_CONFIG.bioenergyTechnologyId)) {
      return true;
    }

    // Build searchable text from project fields
    const searchText = [
      project.title?.rendered || "",
      project.excerpt?.rendered || "",
      project.acf?.introduction || "",
      project.acf?.summary_heading || "",
      project.primary_category?.name || "",
      project.primary_category?.description || "",
    ]
      .join(" ")
      .toLowerCase()
      // Remove HTML tags
      .replace(/<[^>]*>/g, " ");

    return BIOFUEL_KEYWORDS.some((keyword) => searchText.includes(keyword.toLowerCase()));
  }

  /**
   * Parse funding amount from string like "$18.07 million"
   */
  private parseFundingAmount(amountStr?: string): number {
    if (!amountStr) return 0;

    // Remove HTML tags, currency symbols, and whitespace
    const cleaned = amountStr.replace(/<[^>]*>/g, "").replace(/[$,\s]/g, "").toLowerCase();

    // Extract number and multiplier
    const match = cleaned.match(/([\d.]+)\s*(million|m|billion|b)?/);
    if (!match) return 0;

    let amount = parseFloat(match[1]);
    const multiplier = match[2];

    if (multiplier === "million" || multiplier === "m") {
      amount *= 1_000_000;
    } else if (multiplier === "billion" || multiplier === "b") {
      amount *= 1_000_000_000;
    }

    return amount;
  }

  /**
   * Parse date from YYYYMMDD format
   */
  private parseDate(dateStr?: string): string | undefined {
    if (!dateStr || dateStr.length !== 8) return undefined;

    try {
      const year = dateStr.substring(0, 4);
      const month = dateStr.substring(4, 6);
      const day = dateStr.substring(6, 8);
      return `${year}-${month}-${day}`;
    } catch {
      return undefined;
    }
  }

  /**
   * Strip HTML tags from string
   */
  private stripHtml(html?: string): string {
    if (!html) return "";
    return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  }

  /**
   * Convert WordPress project to internal format
   */
  private convertToArenaProject(project: WPProject): ArenaProject {
    const acf = project.acf || {};

    // Parse partners from string (often comma or semicolon separated)
    const partnersStr = acf.project_partners || "";
    const partners = partnersStr
      .split(/[,;]/)
      .map((p) => this.stripHtml(p).trim())
      .filter((p) => p.length > 0);

    // Get technology name from cache
    const technologyName = project.technology[0]
      ? this.technologyCache.get(project.technology[0])
      : undefined;

    return {
      projectId: `ARENA-${project.id}`,
      projectName: this.stripHtml(project.title?.rendered),
      leadOrganisation: this.stripHtml(acf.lead_organisation) || "Unknown",
      partners: partners.length > 0 ? partners : undefined,
      fundingAmount: this.parseFundingAmount(acf.arena_funding_provided),
      totalProjectValue: this.parseFundingAmount(acf.total_project_value),
      status: project.status === "publish" ? "Active" : project.status,
      technology: technologyName || project.primary_category?.name,
      location: project.primary_location?.name,
      state: this.extractState(project.primary_location?.name),
      summary: this.stripHtml(acf.introduction || project.excerpt?.rendered),
      announcedDate: project.date?.split("T")[0],
      startDate: this.parseDate(acf.start_date),
      endDate: this.parseDate(acf.end_date),
      url: project.link,
      gmsNumber: acf.gms_number,
    };
  }

  /**
   * Extract state abbreviation from location string
   */
  private extractState(location?: string): string | undefined {
    if (!location) return undefined;

    const stateMap: Record<string, string> = {
      "new south wales": "NSW",
      nsw: "NSW",
      victoria: "VIC",
      vic: "VIC",
      queensland: "QLD",
      qld: "QLD",
      "western australia": "WA",
      wa: "WA",
      "south australia": "SA",
      sa: "SA",
      tasmania: "TAS",
      tas: "TAS",
      "northern territory": "NT",
      nt: "NT",
      act: "ACT",
      "australian capital territory": "ACT",
      national: "National",
      australia: "National",
    };

    const lower = location.toLowerCase();
    for (const [key, value] of Object.entries(stateMap)) {
      if (lower.includes(key)) {
        return value;
      }
    }

    return undefined;
  }

  async fetchSignals(since?: Date): Promise<ConnectorResult> {
    const startTime = Date.now();
    const signals: RawSignal[] = [];
    const errors: string[] = [];

    try {
      this.log("Starting ARENA projects scan via WordPress REST API...");

      // Cache technology terms for name lookup
      await this.fetchTechnologyTerms();

      // Fetch biofuel-related projects
      const projects = await this.searchBiofuelProjects(since);

      this.log(`Found ${projects.length} biofuel-related ARENA projects`);

      // Convert to signals
      for (const wpProject of projects) {
        try {
          const project = this.convertToArenaProject(wpProject);
          const signal = this.convertToSignal(project);
          if (signal) {
            signals.push(signal);
          }
        } catch (error) {
          this.logError(`Failed to convert project ${wpProject.id}`, error);
        }
      }

      this.log(`Converted ${signals.length} projects to signals`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      this.logError("Failed to fetch ARENA data", error);
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
    const mockProjects: ArenaProject[] = [
      {
        projectId: "ARENA-2024-0421",
        projectName: "Advanced Biofuel Demonstration Plant",
        leadOrganisation: "BioEnergy Holdings Pty Ltd",
        partners: ["CSIRO", "University of Queensland"],
        fundingAmount: 15000000,
        totalProjectValue: 45000000,
        status: "Active",
        technology: "Sustainable Aviation Fuel",
        location: "Gladstone",
        state: "QLD",
        summary:
          "Demonstration of advanced SAF production using Australian feedstocks including tallow and used cooking oil",
        announcedDate: "2024-09-15",
        url: "https://arena.gov.au/projects/advanced-biofuel-demonstration-plant/",
      },
      {
        projectId: "ARENA-2024-0398",
        projectName: "Renewable Diesel from Waste Streams",
        leadOrganisation: "Southern Oil Refining Pty Ltd",
        partners: ["Monash University"],
        fundingAmount: 8500000,
        totalProjectValue: 28000000,
        status: "Announced",
        technology: "Hydrotreated Vegetable Oil (HVO)",
        location: "Yarrawonga",
        state: "VIC",
        summary: "Scale-up of HVO production using agricultural waste and tallow feedstocks",
        announcedDate: "2024-11-01",
        url: "https://arena.gov.au/projects/renewable-diesel-waste-streams/",
      },
      {
        projectId: "ARENA-2024-0456",
        projectName: "Algae-to-Fuel Pilot Facility",
        leadOrganisation: "Algae Fuel Technologies Pty Ltd",
        partners: ["James Cook University"],
        fundingAmount: 4200000,
        totalProjectValue: 12000000,
        status: "Active",
        technology: "Algae Biofuels",
        location: "Townsville",
        state: "QLD",
        summary: "Pilot facility for algae cultivation and conversion to biodiesel",
        announcedDate: "2024-07-20",
        url: "https://arena.gov.au/projects/algae-to-fuel-pilot/",
      },
    ];

    // Filter by date if provided
    let filteredProjects = mockProjects;
    if (since) {
      filteredProjects = mockProjects.filter((p) => {
        const announcedDate = p.announcedDate ? new Date(p.announcedDate) : null;
        return announcedDate && announcedDate >= since;
      });
    }

    const signals = filteredProjects
      .map((p) => this.convertToSignal(p))
      .filter(Boolean) as RawSignal[];

    return {
      success: existingErrors.length === 0,
      signalsDiscovered: signals.length,
      signals,
      errors: existingErrors,
      duration: Date.now() - startTime,
    };
  }

  private convertToSignal(project: ArenaProject): RawSignal | null {
    const weight = this.calculateWeight(project);

    return {
      sourceId: project.projectId,
      title: `ARENA Grant: ${project.projectName}`,
      description: project.summary,
      sourceUrl: project.url,
      detectedAt: project.announcedDate ? new Date(project.announcedDate) : new Date(),
      entityName: project.leadOrganisation,
      signalType: "grant_announcement",
      signalWeight: weight,
      confidence: 0.95, // Very high confidence from official government source
      rawData: {
        projectId: project.projectId,
        fundingAmount: project.fundingAmount,
        totalProjectValue: project.totalProjectValue,
        technology: project.technology,
        partners: project.partners,
        status: project.status,
        gmsNumber: project.gmsNumber,
        startDate: project.startDate,
        endDate: project.endDate,
      },
      identifiers: {},
      metadata: {
        location: project.location,
        state: project.state,
        technology: project.technology,
        fundingAmount: project.fundingAmount,
        totalProjectValue: project.totalProjectValue,
        partners: project.partners,
      },
    };
  }

  private calculateWeight(project: ArenaProject): number {
    let weight = 4.0; // Base weight for grant signals (high value)

    // Increase weight based on funding amount
    if (project.fundingAmount > 10000000) {
      weight += 1.5;
    } else if (project.fundingAmount > 5000000) {
      weight += 1.0;
    } else if (project.fundingAmount > 1000000) {
      weight += 0.5;
    }

    // Increase for active projects
    if (project.status === "Active") {
      weight += 0.5;
    }

    // Bonus for biofuel-specific technology
    const biofuelTech = ["biofuel", "biodiesel", "saf", "hvo", "renewable diesel", "bioethanol"];
    if (
      project.technology &&
      biofuelTech.some((term) => project.technology!.toLowerCase().includes(term))
    ) {
      weight += 0.5;
    }

    return Math.min(weight, 6.0); // Cap at 6.0
  }
}
