/**
 * RSIE Australian Data Sources Configuration
 *
 * Pre-configured data sources for Australian bioenergy intelligence
 */

export const AUSTRALIAN_DATA_SOURCES = [
  // Weather & Climate
  {
    sourceKey: "tomorrow_io",
    name: "Tomorrow.io Weather API",
    licenseClass: "COMMERCIAL" as const,
    termsUrl: "https://www.tomorrow.io/terms-of-service/",
    attributionText: "Weather data provided by Tomorrow.io",
    category: "weather",
    description: "Real-time and forecast weather data for fire danger, drought, frost, and flood risk assessment",
    isEnabled: true,
  },
  {
    sourceKey: "bom_aus",
    name: "Bureau of Meteorology Australia",
    licenseClass: "CC_BY_4" as const,
    termsUrl: "http://www.bom.gov.au/other/copyright.shtml",
    attributionText: "Weather data © Commonwealth of Australia, Bureau of Meteorology",
    category: "weather",
    description: "Official Australian weather observations, warnings, and climate data",
    isEnabled: true,
  },
  {
    sourceKey: "silo_aus",
    name: "SILO Climate Database",
    licenseClass: "CC_BY_4" as const,
    termsUrl: "https://www.longpaddock.qld.gov.au/silo/about/legal-conditions/",
    attributionText: "Climate data from SILO, © State of Queensland",
    category: "weather",
    description: "Historical gridded climate data for Australian agricultural regions",
    isEnabled: true,
  },

  // Biomass & Agriculture
  {
    sourceKey: "abba_aus",
    name: "Australian Biomass for Bioenergy Assessment (ABBA)",
    licenseClass: "CC_BY_4" as const,
    termsUrl: "https://www.csiro.au/en/research/natural-environment/biomass/abba",
    attributionText: "Biomass data from CSIRO ABBA",
    category: "biomass",
    description: "Spatial assessment of Australian biomass resources for bioenergy",
    isEnabled: true,
  },
  {
    sourceKey: "abs_agri",
    name: "ABS Agricultural Statistics",
    licenseClass: "CC_BY_4" as const,
    termsUrl: "https://www.abs.gov.au/websitedbs/D3310114.nsf/Home/Copyright",
    attributionText: "Data © Australian Bureau of Statistics",
    category: "agriculture",
    description: "Agricultural commodities production and land use statistics",
    isEnabled: true,
  },

  // Hazards & Risk
  {
    sourceKey: "geoscience_hazards",
    name: "Geoscience Australia Hazards",
    licenseClass: "CC_BY_4" as const,
    termsUrl: "https://www.ga.gov.au/copyright",
    attributionText: "Hazard data © Geoscience Australia",
    category: "hazards",
    description: "Bushfire, flood, cyclone, and earthquake hazard mapping",
    isEnabled: true,
  },
  {
    sourceKey: "nasa_firms",
    name: "NASA FIRMS Active Fire Data",
    licenseClass: "CC_BY_4" as const,
    termsUrl: "https://firms.modaps.eosdis.nasa.gov/",
    attributionText: "Fire data courtesy of NASA FIRMS",
    category: "hazards",
    description: "Near real-time satellite detection of active fires globally",
    isEnabled: true,
  },
  {
    sourceKey: "esa_copernicus",
    name: "ESA Copernicus Emergency Management",
    licenseClass: "CC_BY_4" as const,
    termsUrl: "https://emergency.copernicus.eu/mapping/ems/terms-use",
    attributionText: "Contains modified Copernicus Emergency Management Service data",
    category: "hazards",
    description: "Flood extent mapping and wildfire monitoring from satellite",
    isEnabled: true,
  },

  // Policy & Regulatory
  {
    sourceKey: "aer_registry",
    name: "Australian Energy Regulator",
    licenseClass: "CC_BY_4" as const,
    termsUrl: "https://www.aer.gov.au/copyright",
    attributionText: "Data © Australian Energy Regulator",
    category: "policy",
    description: "Energy market regulatory data and compliance information",
    isEnabled: true,
  },
  {
    sourceKey: "cer_registry",
    name: "Clean Energy Regulator",
    licenseClass: "CC_BY_4" as const,
    termsUrl: "https://www.cleanenergyregulator.gov.au/Copyright",
    attributionText: "Data © Clean Energy Regulator",
    category: "policy",
    description: "RET certificates, emissions data, and carbon farming information",
    isEnabled: true,
  },
  {
    sourceKey: "arena_data",
    name: "ARENA (Australian Renewable Energy Agency)",
    licenseClass: "CC_BY_4" as const,
    termsUrl: "https://arena.gov.au/copyright/",
    attributionText: "Data © ARENA",
    category: "policy",
    description: "Renewable energy projects, funding, and industry intelligence",
    isEnabled: true,
  },

  // Spatial & Land Use
  {
    sourceKey: "clum_land_use",
    name: "CLUM Australian Land Use",
    licenseClass: "CC_BY_4" as const,
    termsUrl: "https://www.agriculture.gov.au/copyright",
    attributionText: "CLUM data © Australian Government DAFF",
    category: "spatial",
    description: "Comprehensive land use mapping across Australia",
    isEnabled: true,
  },
  {
    sourceKey: "capad_protected",
    name: "CAPAD Protected Areas",
    licenseClass: "CC_BY_4" as const,
    termsUrl: "https://www.dcceew.gov.au/copyright",
    attributionText: "CAPAD data © Australian Government DCCEEW",
    category: "spatial",
    description: "Collaborative Australian Protected Areas Database",
    isEnabled: true,
  },

  // Quality & Standards
  {
    sourceKey: "iscc_registry",
    name: "ISCC Certification Registry",
    licenseClass: "COMMERCIAL" as const,
    termsUrl: "https://www.iscc-system.org/process/trademark-and-copyright/",
    attributionText: "Certification data from ISCC",
    category: "certification",
    description: "International Sustainability and Carbon Certification registry",
    isEnabled: true,
  },
  {
    sourceKey: "rsb_registry",
    name: "RSB Certification Registry",
    licenseClass: "COMMERCIAL" as const,
    termsUrl: "https://rsb.org/about/terms-of-use/",
    attributionText: "Certification data from Roundtable on Sustainable Biomaterials",
    category: "certification",
    description: "RSB certified operator and certificate database",
    isEnabled: true,
  },
];

/**
 * Get data sources by category
 */
export function getDataSourcesByCategory(category: string) {
  return AUSTRALIAN_DATA_SOURCES.filter(s => s.category === category);
}

/**
 * Get all categories
 */
export function getDataSourceCategories() {
  const categories = new Set(AUSTRALIAN_DATA_SOURCES.map(s => s.category));
  return Array.from(categories);
}
