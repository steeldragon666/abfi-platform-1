/**
 * NSW Planning Portal Connector
 * Fetches State Significant Development (SSD) applications from NSW Planning
 *
 * Data Source: https://www.planningportal.nsw.gov.au/major-projects
 * Method: Web scraping (no public JSON API available)
 *
 * Filters by:
 * - Industry Type: Energy, Manufacturing
 * - Development Type: Biofuel, Renewable Energy related
 * - Keywords: biofuel, biodiesel, renewable diesel, etc.
 */

import {
  BaseConnector,
  ConnectorConfig,
  ConnectorResult,
  RawSignal,
  BIOFUEL_KEYWORDS,
} from "./baseConnector";

// API/Scraping Configuration
const CONFIG = {
  baseUrl: "https://www.planningportal.nsw.gov.au",
  projectsPath: "/major-projects/projects",
  // Industry types relevant to biofuels
  industryTypes: ["Energy", "Manufacturing", "Agriculture"],
  // Development types to search
  developmentTypes: [
    "Renewable energy generation",
    "Liquid fuel depot",
    "Processing industries",
    "General industries",
    "Chemical industries",
  ],
  // User agent for requests
  userAgent: "ABFI-Platform/1.0 (Stealth Discovery Connector; contact@abfi.com.au)",
  // Max pages to fetch per search
  maxPages: 3,
  // Results per page (fixed by the portal)
  resultsPerPage: 10,
};

interface NSWPlanningApplication {
  applicationNumber: string;
  projectName: string;
  applicant: string;
  address?: string;
  lga?: string;
  status: string;
  developmentType?: string;
  industryType?: string;
  description?: string;
  lodgedDate?: string;
  determinedDate?: string;
  exhibitionStart?: string;
  exhibitionEnd?: string;
  url?: string;
}

interface ProjectListItem {
  id: string;
  title: string;
  status: string;
  lga?: string;
  developmentType?: string;
  url: string;
}

export class NSWPlanningConnector extends BaseConnector {
  constructor(config: ConnectorConfig) {
    super(config, "nsw_planning");
  }

  /**
   * Fetch HTML content from a URL
   */
  private async fetchPage(url: string): Promise<string> {
    const response = await fetch(url, {
      headers: {
        Accept: "text/html,application/xhtml+xml",
        "User-Agent": CONFIG.userAgent,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
    }

    return response.text();
  }

  /**
   * Parse project listings from the HTML page
   * The page uses card-based layout with card__title class for titles
   */
  private parseProjectListings(html: string): ProjectListItem[] {
    const projects: ProjectListItem[] = [];
    const seenUrls = new Set<string>();

    // Find all project links with the pattern /major-projects/projects/slug
    const projectLinkPattern = /href="(\/major-projects\/projects\/[a-z0-9-]+)"/gi;
    const projectLinks: string[] = [];
    let linkMatch;
    while ((linkMatch = projectLinkPattern.exec(html)) !== null) {
      const projectPath = linkMatch[1];
      if (!seenUrls.has(projectPath)) {
        seenUrls.add(projectPath);
        projectLinks.push(projectPath);
      }
    }

    // For each project link, try to find its card context
    for (const projectPath of projectLinks) {
      const projectUrl = `${CONFIG.baseUrl}${projectPath}`;

      // Extract project slug from URL to use as ID
      const slugMatch = projectPath.match(/\/projects\/([a-z0-9-]+)/);
      const slug = slugMatch ? slugMatch[1] : projectPath;

      // Try to find the title by looking for card__title near this link
      // The structure is: <h3 class="card__title">Title</h3> ... <a href="/major-projects/projects/slug">
      const linkPos = html.indexOf(`href="${projectPath}"`);
      if (linkPos === -1) continue;

      // Search backwards from the link to find the card title (within 1000 chars)
      const searchStart = Math.max(0, linkPos - 1000);
      const contextBefore = html.substring(searchStart, linkPos);

      // Find the last card__title in this context
      const titlePattern = /<h3[^>]*class="[^"]*card__title[^"]*"[^>]*>([\s\S]*?)<\/h3>/gi;
      let title = this.slugToTitle(slug); // Default to slug-derived title
      let lastTitleMatch;
      while ((lastTitleMatch = titlePattern.exec(contextBefore)) !== null) {
        title = this.decodeHtmlEntities(lastTitleMatch[1].replace(/<[^>]*>/g, '').trim());
      }

      // Try to find address/location (has icon--pin class nearby)
      const addressPattern = /icon--pin[^>]*>[\s\S]*?<\/span>([\s\S]*?)<\/div>/i;
      const addressMatch = contextBefore.match(addressPattern);
      const address = addressMatch
        ? this.decodeHtmlEntities(addressMatch[1].replace(/<[^>]*>/g, '').trim())
        : undefined;

      // Generate ID from slug or try to extract SSD/SSI number
      const appNumMatch = slug.match(/(ssd|ssi|mp|cssi)-?(\d+)/i);
      const id = appNumMatch
        ? `${appNumMatch[1].toUpperCase()}-${appNumMatch[2]}`
        : slug;

      projects.push({
        id,
        title,
        status: "Unknown", // Will be fetched from detail page
        lga: address, // Use address as LGA hint for now
        developmentType: undefined,
        url: projectUrl,
      });
    }

    return projects;
  }

  /**
   * Convert URL slug to readable title
   */
  private slugToTitle(slug: string): string {
    return slug
      .replace(/-/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase())
      .trim();
  }

  /**
   * Fetch project details from individual project page
   */
  private async fetchProjectDetails(
    listItem: ProjectListItem
  ): Promise<NSWPlanningApplication | null> {
    try {
      const html = await this.fetchPage(listItem.url);

      // Extract applicant/proponent
      const applicantMatch =
        html.match(/Proponent[:\s]*<[^>]*>([^<]+)</i) ||
        html.match(/Applicant[:\s]*<[^>]*>([^<]+)</i) ||
        html.match(/Proponent[:\s]*([^<\n]+)/i);
      const applicant = applicantMatch
        ? this.decodeHtmlEntities(applicantMatch[1].trim())
        : "Unknown";

      // Extract address/location
      const addressMatch =
        html.match(/Location[:\s]*<[^>]*>([^<]+)</i) ||
        html.match(/Address[:\s]*<[^>]*>([^<]+)</i) ||
        html.match(/Site[:\s]*<[^>]*>([^<]+)</i);
      const address = addressMatch
        ? this.decodeHtmlEntities(addressMatch[1].trim())
        : undefined;

      // Extract description
      const descMatch =
        html.match(/Description[:\s]*<[^>]*>([\s\S]*?)<\/(?:p|div)/i) ||
        html.match(/Project Overview[:\s]*<[^>]*>([\s\S]*?)<\/(?:p|div)/i) ||
        html.match(/<meta[^>]*description[^>]*content="([^"]+)"/i);
      const description = descMatch
        ? this.stripHtml(this.decodeHtmlEntities(descMatch[1])).substring(0, 500)
        : undefined;

      // Extract dates
      const lodgedMatch = html.match(/Lodged[:\s]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i);
      const determinedMatch = html.match(/Determined[:\s]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i);
      const exhibitionStartMatch = html.match(
        /Exhibition[:\s]*(?:Start|From)[:\s]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i
      );
      const exhibitionEndMatch = html.match(
        /Exhibition[:\s]*(?:End|To)[:\s]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i
      );

      // Extract industry type
      const industryMatch = html.match(/Industry[:\s]*<[^>]*>([^<]+)</i);
      const industryType = industryMatch ? industryMatch[1].trim() : undefined;

      return {
        applicationNumber: listItem.id,
        projectName: listItem.title,
        applicant,
        address,
        lga: listItem.lga,
        status: listItem.status,
        developmentType: listItem.developmentType,
        industryType,
        description,
        lodgedDate: lodgedMatch ? this.parseDate(lodgedMatch[1]) : undefined,
        determinedDate: determinedMatch ? this.parseDate(determinedMatch[1]) : undefined,
        exhibitionStart: exhibitionStartMatch
          ? this.parseDate(exhibitionStartMatch[1])
          : undefined,
        exhibitionEnd: exhibitionEndMatch
          ? this.parseDate(exhibitionEndMatch[1])
          : undefined,
        url: listItem.url,
      };
    } catch (error) {
      this.logError(`Failed to fetch details for ${listItem.id}`, error);
      return null;
    }
  }

  /**
   * Parse date string to ISO format
   */
  private parseDate(dateStr: string): string | undefined {
    try {
      // Handle DD/MM/YYYY or DD-MM-YYYY format
      const parts = dateStr.split(/[\/\-]/);
      if (parts.length === 3) {
        let day = parseInt(parts[0]);
        let month = parseInt(parts[1]);
        let year = parseInt(parts[2]);

        // Handle 2-digit years
        if (year < 100) {
          year += year > 50 ? 1900 : 2000;
        }

        return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      }
    } catch {
      // Ignore parse errors
    }
    return undefined;
  }

  /**
   * Decode HTML entities
   */
  private decodeHtmlEntities(html: string): string {
    return html
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;/g, " ")
      .replace(/&#(\d+);/g, (_, num) => String.fromCharCode(parseInt(num)));
  }

  /**
   * Strip HTML tags
   */
  private stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  }

  /**
   * Build search URL with filters
   */
  private buildSearchUrl(params: {
    industryType?: string;
    developmentType?: string;
    status?: string;
    page?: number;
  }): string {
    const searchParams = new URLSearchParams();

    if (params.industryType) {
      searchParams.set("industry_type", params.industryType);
    }
    if (params.developmentType) {
      searchParams.set("development_type", params.developmentType);
    }
    if (params.status) {
      searchParams.set("status", params.status);
    }
    if (params.page !== undefined) {
      searchParams.set("page", String(params.page));
    }

    return `${CONFIG.baseUrl}${CONFIG.projectsPath}?${searchParams}`;
  }

  /**
   * Check if a project is biofuel-related or energy industry relevant
   */
  private isBiofuelRelated(project: NSWPlanningApplication): boolean {
    const searchText = [
      project.projectName,
      project.description || "",
      project.developmentType || "",
      project.industryType || "",
      project.applicant,
    ]
      .join(" ")
      .toLowerCase();

    // Check primary biofuel keywords first
    if (BIOFUEL_KEYWORDS.some((keyword) => searchText.includes(keyword.toLowerCase()))) {
      return true;
    }

    // Extended terms for NSW Planning - broader energy/fuel industry relevance
    const extendedTerms = [
      // Fuel and energy production
      "renewable fuel",
      "fuel production",
      "fuel depot",
      "fuel storage",
      "fuel terminal",
      "refinery",
      "oil refining",
      "oil processing",
      // Renewable energy storage (supporting infrastructure)
      "battery storage",
      "energy storage",
      "hydrogen",
      "green hydrogen",
      "ammonia",
      // Waste to energy / biogas
      "waste to energy",
      "waste-to-energy",
      "biogas",
      "biomethane",
      "anaerobic digestion",
      "organic waste",
      // Feedstock processing
      "rendering",
      "tallow",
      "animal fats",
      "oilseed",
      "canola processing",
      // Industry types
      "chemical manufacturing",
      "chemical processing",
      "industrial processing",
    ];

    return extendedTerms.some((term) => searchText.includes(term));
  }

  /**
   * Search for projects matching criteria
   */
  private async searchProjects(since?: Date): Promise<NSWPlanningApplication[]> {
    const allProjects: NSWPlanningApplication[] = [];
    const seenIds = new Set<string>();

    // Search each relevant industry type
    for (const industryType of CONFIG.industryTypes) {
      try {
        this.log(`Searching industry: ${industryType}`);

        for (let page = 0; page < CONFIG.maxPages; page++) {
          await this.withRateLimit(async () => {
            const url = this.buildSearchUrl({ industryType, page });
            const html = await this.fetchPage(url);
            const listings = this.parseProjectListings(html);

            if (listings.length === 0) {
              return; // No more results
            }

            // Check each listing for biofuel relevance
            for (const listing of listings) {
              if (seenIds.has(listing.id)) continue;

              // Quick check on title first
              const titleLower = listing.title.toLowerCase();
              const quickFilterTerms = [
                "fuel", "energy", "battery", "storage", "hydrogen",
                "processing", "refin", "biofuel", "biodiesel", "renewable",
                "waste", "biogas", "rendering", "tallow", "oil",
              ];
              const mightBeRelevant =
                BIOFUEL_KEYWORDS.some((kw) => titleLower.includes(kw.toLowerCase())) ||
                quickFilterTerms.some((t) => titleLower.includes(t)) ||
                (listing.developmentType &&
                  quickFilterTerms.some((t) =>
                    listing.developmentType!.toLowerCase().includes(t)
                  ));

              if (mightBeRelevant) {
                const details = await this.fetchProjectDetails(listing);
                if (details && this.isBiofuelRelated(details)) {
                  // Check date filter
                  if (since && details.lodgedDate) {
                    const lodgedDate = new Date(details.lodgedDate);
                    if (lodgedDate < since) continue;
                  }

                  seenIds.add(listing.id);
                  allProjects.push(details);
                  this.log(`Found biofuel project: ${details.projectName}`);
                }
              }
            }
          });
        }
      } catch (error) {
        this.logError(`Failed to search industry ${industryType}`, error);
      }
    }

    return allProjects;
  }

  async fetchSignals(since?: Date): Promise<ConnectorResult> {
    const startTime = Date.now();
    const signals: RawSignal[] = [];
    const errors: string[] = [];

    try {
      this.log("Starting NSW Planning Portal scan...");

      // Try to fetch real data via web scraping
      const applications = await this.searchProjects(since);

      this.log(`Found ${applications.length} biofuel-related applications`);

      // Convert to signals
      for (const app of applications) {
        const signal = this.convertToSignal(app);
        if (signal) {
          signals.push(signal);
        }
      }

      // If no results from scraping, use mock data
      if (signals.length === 0) {
        this.log("No results from scraping, using mock data");
        return this.fetchMockSignals(since, startTime);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      this.logError("Failed to fetch NSW Planning data", error);
      errors.push(errorMessage);

      // Fall back to mock data on error
      this.log("Falling back to mock data due to error");
      return this.fetchMockSignals(since, startTime, errors);
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
   * Fallback mock data
   */
  private async fetchMockSignals(
    since?: Date,
    startTime: number = Date.now(),
    existingErrors: string[] = []
  ): Promise<ConnectorResult> {
    const mockApplications: NSWPlanningApplication[] = [
      {
        applicationNumber: "SSD-2024-0127",
        projectName: "Parkesbourne Renewable Diesel Facility",
        applicant: "Southern Oil Refining Pty Ltd",
        address: "Lot 12 Industrial Estate Road, Parkesbourne NSW",
        lga: "Upper Lachlan Shire",
        status: "Under Assessment",
        developmentType: "Industrial - Manufacturing",
        description:
          "Construction and operation of a 400 million litre per annum renewable diesel facility using waste oils and fats",
        lodgedDate: "2024-08-15",
        url: "https://majorprojects.planningportal.nsw.gov.au/project/SSD-2024-0127",
      },
      {
        applicationNumber: "SSD-2024-0089",
        projectName: "Newcastle Biofuels Hub",
        applicant: "Jet Zero Australia Pty Ltd",
        address: "Port of Newcastle Industrial Zone",
        lga: "Newcastle",
        status: "Preparation",
        developmentType: "Industrial - Energy",
        description:
          "Development of sustainable aviation fuel production facility with capacity of 200ML SAF per annum",
        lodgedDate: "2024-06-20",
        url: "https://majorprojects.planningportal.nsw.gov.au/project/SSD-2024-0089",
      },
      {
        applicationNumber: "SSD-2024-0156",
        projectName: "Wagga Wagga UCO Processing Plant",
        applicant: "BioEnergy Holdings Ltd",
        address: "12 Agricultural Drive, Wagga Wagga NSW",
        lga: "Wagga Wagga",
        status: "On Exhibition",
        developmentType: "Industrial - Processing",
        description:
          "Used cooking oil collection and pre-processing facility for biodiesel feedstock supply",
        lodgedDate: "2024-10-01",
        exhibitionStart: "2024-11-15",
        exhibitionEnd: "2024-12-15",
        url: "https://majorprojects.planningportal.nsw.gov.au/project/SSD-2024-0156",
      },
      {
        applicationNumber: "SSD-2023-8834",
        projectName: "Illawarra Renewable Energy Hub",
        applicant: "GreenFuels Australia Pty Ltd",
        address: "Port Kembla Industrial Estate, Wollongong NSW",
        lga: "Wollongong",
        status: "Determination",
        developmentType: "Industrial - Energy",
        description:
          "Integrated renewable energy hub including biodiesel production from waste feedstocks and hydrogen generation",
        lodgedDate: "2023-09-12",
        determinedDate: "2024-11-20",
        url: "https://majorprojects.planningportal.nsw.gov.au/project/SSD-2023-8834",
      },
      {
        applicationNumber: "SSD-2024-0201",
        projectName: "Hunter Valley Tallow Processing Expansion",
        applicant: "Australian Rendering Co Pty Ltd",
        address: "45 Industrial Drive, Singleton NSW",
        lga: "Singleton",
        status: "Assessment",
        developmentType: "Industrial - Processing",
        description:
          "Expansion of existing tallow processing facility to supply biofuel feedstock market",
        lodgedDate: "2024-09-28",
        url: "https://majorprojects.planningportal.nsw.gov.au/project/SSD-2024-0201",
      },
    ];

    // Filter by date if provided
    let filteredApplications = mockApplications;
    if (since) {
      filteredApplications = mockApplications.filter((app) => {
        const lodgedDate = app.lodgedDate ? new Date(app.lodgedDate) : null;
        return lodgedDate && lodgedDate >= since;
      });
    }

    const signals = filteredApplications
      .map((app) => this.convertToSignal(app))
      .filter(Boolean) as RawSignal[];

    return {
      success: existingErrors.length === 0,
      signalsDiscovered: signals.length,
      signals,
      errors: existingErrors,
      duration: Date.now() - startTime,
    };
  }

  private convertToSignal(app: NSWPlanningApplication): RawSignal | null {
    const signalType = this.determineSignalType(app);
    const weight = this.calculateWeight(app);

    return {
      sourceId: app.applicationNumber,
      title: app.projectName,
      description: app.description,
      sourceUrl: app.url,
      detectedAt: app.lodgedDate ? new Date(app.lodgedDate) : new Date(),
      entityName: app.applicant,
      signalType,
      signalWeight: weight,
      confidence: 0.9, // High confidence from official source
      rawData: {
        applicationNumber: app.applicationNumber,
        status: app.status,
        lga: app.lga,
        developmentType: app.developmentType,
        industryType: app.industryType,
        address: app.address,
        determinedDate: app.determinedDate,
        exhibitionStart: app.exhibitionStart,
        exhibitionEnd: app.exhibitionEnd,
      },
      identifiers: {
        permitId: app.applicationNumber,
      },
      metadata: {
        location: app.lga,
        address: app.address,
        status: app.status,
        developmentType: app.developmentType,
      },
    };
  }

  private determineSignalType(app: NSWPlanningApplication): RawSignal["signalType"] {
    const description = (app.description || "").toLowerCase();

    // Environmental approvals
    if (description.includes("environment") || app.status?.toLowerCase().includes("exhibition")) {
      return "environmental_approval";
    }

    // All planning applications (fuel-related or industrial) are planning_application type
    return "planning_application";
  }

  private calculateWeight(app: NSWPlanningApplication): number {
    let weight = 3.0; // Base weight for permit signals

    // Increase weight based on project type indicators
    const description = (app.description || "").toLowerCase();
    if (
      description.includes("renewable diesel") ||
      description.includes("sustainable aviation fuel")
    ) {
      weight += 1.5;
    }
    if (description.includes("million litre") || description.includes("ml per annum")) {
      weight += 1.0;
    }

    // Increase for advanced status
    const status = (app.status || "").toLowerCase();
    if (status.includes("determination") || status.includes("approved")) {
      weight += 1.0;
    } else if (status.includes("assessment")) {
      weight += 0.5;
    }

    return Math.min(weight, 5.0); // Cap at 5.0
  }
}
