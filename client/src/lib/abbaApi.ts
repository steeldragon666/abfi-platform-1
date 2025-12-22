/**
 * ABBA (Australian Biomass for Bioenergy Assessment) API Client
 *
 * Primary data source for baseline feedstock mapping across Australia.
 *
 * Data Sources:
 * - Queensland CKAN API (Most Complete): https://www.data.qld.gov.au/api/3/action/
 * - Technical Methods: https://www.publications.qld.gov.au/dataset/abba-tech-methods
 * - Terria Map Platform: https://map.terria.io/
 * - NSW BioSMART Tool: https://biomass-bioenergy-beta.azurewebsites.net/
 * - CSIRO Biomass Quality Database: https://data.csiro.au/collection/csiro:45807
 * - Mendeley Raster Data: https://data.mendeley.com/datasets/tmrv8m264b/1
 *
 * License: CC BY 4.0 (commercial use permitted)
 */

// CKAN API Base URL
const CKAN_BASE_URL = "https://www.data.qld.gov.au/api/3/action";
const DATASET_ID = "australian-biomass-for-bioenergy-assessment";

// Terria Map WMS endpoints for ABBA layers
export const ABBA_WMS_LAYERS = {
  bagasse: {
    name: "Sugarcane Bagasse",
    url: "https://terria-catalog-services.data.gov.au/geoserver/wms",
    layer: "abba:sugarcane_bagasse",
    attribution: "ABBA Project, CC BY 4.0",
  },
  cottonGinTrash: {
    name: "Cotton Gin Trash",
    url: "https://terria-catalog-services.data.gov.au/geoserver/wms",
    layer: "abba:cotton_gin_trash",
    attribution: "ABBA Project, CC BY 4.0",
  },
  grainStubble: {
    name: "Grain Stubble",
    url: "https://terria-catalog-services.data.gov.au/geoserver/wms",
    layer: "abba:grain_stubble",
    attribution: "ABBA Project, CC BY 4.0",
  },
  forestryResidues: {
    name: "Forestry Residues",
    url: "https://terria-catalog-services.data.gov.au/geoserver/wms",
    layer: "abba:forestry_residues",
    attribution: "ABBA Project, CC BY 4.0",
  },
  urbanOrganicWaste: {
    name: "Urban Organic Waste",
    url: "https://terria-catalog-services.data.gov.au/geoserver/wms",
    layer: "abba:urban_organic_waste",
    attribution: "ABBA Project, CC BY 4.0",
  },
};

// Biomass type definitions from ABBA
export interface ABBABiomassType {
  id: string;
  name: string;
  category: "agricultural" | "forestry" | "urban" | "industrial";
  unit: string; // e.g., "tonnes/year", "TJ/year"
  description: string;
}

export const ABBA_BIOMASS_TYPES: ABBABiomassType[] = [
  { id: "bagasse", name: "Sugarcane Bagasse", category: "agricultural", unit: "tonnes/year", description: "Fibrous residue from sugar milling" },
  { id: "cotton_gin_trash", name: "Cotton Gin Trash", category: "agricultural", unit: "tonnes/year", description: "Residue from cotton ginning" },
  { id: "cotton_seed", name: "Cotton Seed", category: "agricultural", unit: "tonnes/year", description: "Seed from cotton processing" },
  { id: "cotton_straw", name: "Cotton Straw", category: "agricultural", unit: "tonnes/year", description: "Straw from cotton harvest" },
  { id: "sorghum_straw", name: "Sorghum Straw", category: "agricultural", unit: "tonnes/year", description: "Residue from sorghum harvest" },
  { id: "wheat_stubble", name: "Wheat Stubble", category: "agricultural", unit: "tonnes/year", description: "Residue from wheat harvest" },
  { id: "barley_stubble", name: "Barley Stubble", category: "agricultural", unit: "tonnes/year", description: "Residue from barley harvest" },
  { id: "canola_stubble", name: "Canola Stubble", category: "agricultural", unit: "tonnes/year", description: "Residue from canola harvest" },
  { id: "native_forest", name: "Native Forest Residues", category: "forestry", unit: "tonnes/year", description: "Residues from native forest operations" },
  { id: "plantation_softwood", name: "Plantation Softwood Residues", category: "forestry", unit: "tonnes/year", description: "Residues from softwood plantations" },
  { id: "plantation_hardwood", name: "Plantation Hardwood Residues", category: "forestry", unit: "tonnes/year", description: "Residues from hardwood plantations" },
  { id: "urban_organic", name: "Urban Organic Waste", category: "urban", unit: "tonnes/year", description: "Municipal organic waste streams" },
  { id: "sewage_sludge", name: "Sewage Sludge", category: "urban", unit: "tonnes/year", description: "Biosolids from wastewater treatment" },
  { id: "food_waste", name: "Food Processing Waste", category: "industrial", unit: "tonnes/year", description: "Waste from food manufacturing" },
];

// CKAN Resource interface
export interface CKANResource {
  id: string;
  name: string;
  description: string;
  format: string;
  url: string;
  created: string;
  last_modified: string;
}

// CKAN Dataset interface
export interface CKANDataset {
  id: string;
  name: string;
  title: string;
  notes: string;
  resources: CKANResource[];
  tags: { name: string }[];
  organization: { title: string };
  metadata_created: string;
  metadata_modified: string;
}

// SA2/SA4 Region biomass data
export interface RegionBiomassData {
  regionCode: string;
  regionName: string;
  sa2Code?: string;
  sa4Code?: string;
  state: string;
  biomassType: string;
  quantity: number;
  unit: string;
  year: number;
  latitude?: number;
  longitude?: number;
}

/**
 * Fetch ABBA dataset metadata from Queensland CKAN
 */
export async function fetchABBADatasetMetadata(): Promise<CKANDataset | null> {
  try {
    const response = await fetch(
      `${CKAN_BASE_URL}/package_show?id=${DATASET_ID}`
    );
    const data = await response.json();

    if (data.success) {
      return data.result as CKANDataset;
    }
    return null;
  } catch (error) {
    console.error("Failed to fetch ABBA dataset metadata:", error);
    return null;
  }
}

/**
 * Fetch list of available ABBA resources
 */
export async function fetchABBAResources(): Promise<CKANResource[]> {
  const dataset = await fetchABBADatasetMetadata();
  return dataset?.resources || [];
}

/**
 * Fetch specific ABBA resource data by name pattern
 */
export async function fetchABBAResourceByName(namePattern: string): Promise<CKANResource | null> {
  const resources = await fetchABBAResources();
  return resources.find(r =>
    r.name.toLowerCase().includes(namePattern.toLowerCase())
  ) || null;
}

/**
 * Fetch GeoJSON data from an ABBA resource
 */
export async function fetchABBAGeoJSON(resourceUrl: string): Promise<GeoJSON.FeatureCollection | null> {
  try {
    const response = await fetch(resourceUrl);
    const data = await response.json();
    return data as GeoJSON.FeatureCollection;
  } catch (error) {
    console.error("Failed to fetch ABBA GeoJSON:", error);
    return null;
  }
}

/**
 * Search ABBA data by biomass type
 */
export async function searchABBAByBiomassType(biomassType: string): Promise<CKANResource[]> {
  const resources = await fetchABBAResources();
  return resources.filter(r =>
    r.name.toLowerCase().includes(biomassType.toLowerCase()) ||
    r.description?.toLowerCase().includes(biomassType.toLowerCase())
  );
}

/**
 * Get biomass availability for a specific SA2/SA4 region
 * This would typically query the ABBA database or cached data
 */
export async function getRegionBiomassAvailability(
  regionCode: string,
  biomassTypes?: string[]
): Promise<RegionBiomassData[]> {
  // This would be implemented with actual API calls to ABBA data
  // For now, return empty array - to be populated from CKAN resources
  console.log(`Fetching biomass for region ${regionCode}`, biomassTypes);
  return [];
}

/**
 * Calculate total biomass within a radius of a point
 * Used for 50km catchment calculations around biofuel projects
 */
export async function calculateBiomassInRadius(
  lat: number,
  lng: number,
  radiusKm: number = 50,
  biomassTypes?: string[]
): Promise<{ type: string; quantity: number; unit: string }[]> {
  // This would query ABBA spatial data and aggregate
  // For now, return placeholder - actual implementation would use
  // spatial queries against ABBA GeoJSON/WMS data
  console.log(`Calculating biomass within ${radiusKm}km of ${lat}, ${lng}`, biomassTypes);
  return [];
}

/**
 * Data source configuration for ABFI integration
 */
export const ABBA_DATA_SOURCES = {
  primary: {
    name: "Queensland CKAN API",
    baseUrl: CKAN_BASE_URL,
    datasetId: DATASET_ID,
    license: "CC BY 4.0",
    documentation: "https://www.publications.qld.gov.au/dataset/abba-tech-methods",
  },
  terria: {
    name: "Terria Map Platform",
    url: "https://map.terria.io/",
    navigation: "Explore Data → Australia → National Datasets → Energy → Renewable Energy → Bioenergy",
    formats: ["GeoJSON", "CSV", "WMS"],
  },
  nswBiosmart: {
    name: "NSW BioSMART Tool",
    url: "https://biomass-bioenergy-beta.azurewebsites.net/",
    features: ["Interactive spatial analysis", "Electricity generation modeling"],
    stack: "Python/Jupyter, Azure",
  },
  csiro: {
    name: "CSIRO Biomass Quality Database",
    url: "https://data.csiro.au/collection/csiro:45807",
    data: ["Proximate/ultimate analysis", "Calorific values", "Ash composition"],
    coverage: "200+ Australian biomass types",
    license: "CC BY 4.0",
  },
  mendeley: {
    name: "Mendeley Raster Data (High Resolution)",
    url: "https://data.mendeley.com/datasets/tmrv8m264b/1",
    format: "5×5km .tif files (dasymetric modeling)",
    coverage: ["Bagasse", "Forestry residues", "Stubble"],
    projection: "UTM Zone 56 South",
  },
};

/**
 * ABFI Integration Strategy:
 * Position ABFI as the "living" version of ABBA
 *
 * 1. Import ABBA baseline data - Pull geospatial layers via CKAN API
 * 2. Overlay registered suppliers - Real-time market data layer
 * 3. Show regional potential vs. current supply - Gap analysis
 * 4. Calculate updated estimates - Dynamic recalculation based on registrations
 */
export const ABFI_INTEGRATION_FEATURES = {
  baselineImport: {
    description: "Import ABBA baseline data via CKAN API",
    layers: Object.keys(ABBA_WMS_LAYERS),
    frequency: "Monthly update",
  },
  supplierOverlay: {
    description: "Overlay registered ABFI suppliers on baseline map",
    realTime: true,
    features: ["Supplier locations", "Verified quantities", "Contract status"],
  },
  gapAnalysis: {
    description: "Show regional potential vs. current registered supply",
    metrics: ["Supply gap", "Market penetration", "Growth opportunity"],
  },
  dynamicRecalculation: {
    description: "Update estimates based on actual registrations",
    triggers: ["New supplier registration", "Contract verification", "Seasonal adjustment"],
  },
};
