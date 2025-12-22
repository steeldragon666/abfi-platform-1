# ABFI Platform Mapping Integration

## Overview

The ABFI Platform uses an open-source mapping stack based on Leaflet and OpenStreetMap, integrated with Australian government geospatial data sources including the Digital Atlas of Australia and ABBA (Australian Biomass for Bioenergy Assessment) project.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    ABFI Map Layer Stack                         │
├─────────────────────────────────────────────────────────────────┤
│ 4. ABFI Platform Data (Dynamic)                                 │
│    - Registered supplier locations                              │
│    - Verified feedstock listings                                │
│    - Demand signal heatmaps                                     │
│    - Project facility locations with 50km catchments            │
├─────────────────────────────────────────────────────────────────┤
│ 3. ABBA Biomass Data (CKAN API)                                 │
│    - Sugarcane bagasse availability                             │
│    - Grain stubble regions                                      │
│    - Forestry residue volumes                                   │
│    - Feedstock type classification                              │
├─────────────────────────────────────────────────────────────────┤
│ 2. Digital Atlas WMS Layers                                     │
│    - Catchment Scale Land Use (CLUM)                            │
│    - Agricultural Industries classification                     │
│    - National Electricity Infrastructure                        │
│    - National Key Freight Routes                                │
├─────────────────────────────────────────────────────────────────┤
│ 1. Base Layer: OpenStreetMap                                    │
│    - Free, no API key required                                  │
│    - Comprehensive coverage of Australia                        │
└─────────────────────────────────────────────────────────────────┘
```

## Data Sources

### 1. Digital Atlas of Australia

**Overview**: Online geospatial platform by Geoscience Australia with 170+ curated national datasets.

| Layer | Endpoint | License | ABFI Relevance |
|-------|----------|---------|----------------|
| Catchment Scale Land Use (CLUM) | WMS | CC BY 4.0 | Agricultural land, crop types |
| Agricultural Industries | WMS | CC BY 4.0 | Specific crop classification |
| National Electricity Infrastructure | REST | CC BY 4.0 | Grid connectivity |
| National Key Freight Routes | WMS | CC BY 3.0 | Transport logistics |

**API Endpoints**:

```javascript
// Land Use - Agricultural Industries
const CLUM_AGRICULTURAL = {
  wms: 'https://di-daa.img.arcgis.com/arcgis/services/Land_and_vegetation/Catchment_Scale_Land_Use_Agricultural_Industries/ImageServer/WMSServer',
  imageServer: 'https://di-daa.img.arcgis.com/arcgis/rest/services/Land_and_vegetation/Catchment_Scale_Land_Use_Agricultural_Industries/ImageServer'
};

// National Electricity Infrastructure
const ELECTRICITY = {
  mapServer: 'https://services.ga.gov.au/gis/rest/services/National_Electricity_Infrastructure/MapServer',
  layers: [0, 1, 2] // Transmission lines, substations, power stations
};

// National Freight Routes
const FREIGHT = {
  wms: 'https://services.ga.gov.au/gis/services/NationalFreightRoutes/MapServer/WMSServer'
};
```

### 2. ABBA Project Data (Queensland CKAN) - Primary Source

**Overview**: Australia's most comprehensive spatial database of biomass resources at SA2-SA4 resolution.

**Primary Access Endpoints**:

| Source | URL | Format |
|--------|-----|--------|
| Queensland CKAN API | `https://www.data.qld.gov.au/api/3/action/` | REST/JSON |
| Dataset ID | `australian-biomass-for-bioenergy-assessment` | - |
| Technical Methods | `https://www.publications.qld.gov.au/dataset/abba-tech-methods` | PDF |
| License | CC BY 4.0 (commercial use permitted) | - |

**Available Datasets**:
- Sugarcane bagasse (mill-level data)
- Cotton gin trash/seed/straw
- Sorghum straw
- Native/plantation forest residues
- Urban organic waste

**Example API Call**:
```javascript
// List ABBA resources
const response = await fetch(
  'https://www.data.qld.gov.au/api/3/action/package_show?id=australian-biomass-for-bioenergy-assessment'
);
const { result } = await response.json();

// Get specific resource data
const resourceUrl = result.resources.find(r => r.name.includes('bagasse')).url;
const data = await fetch(resourceUrl).then(r => r.json());
```

**WMS Layer Endpoints (via Terria)**:
```javascript
const ABBA_WMS_LAYERS = {
  bagasse: {
    url: 'https://terria-catalog-services.data.gov.au/geoserver/wms',
    layer: 'abba:sugarcane_bagasse'
  },
  grainStubble: {
    url: 'https://terria-catalog-services.data.gov.au/geoserver/wms',
    layer: 'abba:grain_stubble'
  },
  forestryResidues: {
    url: 'https://terria-catalog-services.data.gov.au/geoserver/wms',
    layer: 'abba:forestry_residues'
  },
  cottonGinTrash: {
    url: 'https://terria-catalog-services.data.gov.au/geoserver/wms',
    layer: 'abba:cotton_gin_trash'
  },
  urbanOrganicWaste: {
    url: 'https://terria-catalog-services.data.gov.au/geoserver/wms',
    layer: 'abba:urban_organic_waste'
  }
};
```

### 3. Terria Map Platform

**URL**: `https://map.terria.io/`
**Navigation**: Explore Data → Australia → National Datasets → Energy → Renewable Energy → Bioenergy → [State]
**Formats**: GeoJSON, CSV, WMS layers

### 4. NSW BioSMART Tool

**URL**: `https://biomass-bioenergy-beta.azurewebsites.net/`
**Features**:
- Interactive spatial analysis
- Electricity generation modeling
**Stack**: Python/Jupyter, Azure deployment

### 5. CSIRO Biomass Quality Database

**URL**: `https://data.csiro.au/collection/csiro:45807`
**Data**: Proximate/ultimate analysis, calorific values, ash composition
**Coverage**: 200+ Australian biomass types
**License**: CC BY 4.0

### 6. High-Resolution Raster Data (Mendeley)

**URL**: `https://data.mendeley.com/datasets/tmrv8m264b/1`
**Format**: 5×5km .tif files (dasymetric modeling)
**Coverage**: Bagasse, forestry residues, stubble - all states
**Projection**: UTM Zone 56 South

## ABFI Integration Strategy

Position ABFI as the **"living" version of ABBA**:

### Integration Layers

```
┌─────────────────────────────────────────────────────────────────┐
│                    ABFI "Living ABBA" Stack                     │
├─────────────────────────────────────────────────────────────────┤
│ 4. ABFI Real-Time Data                                          │
│    - Registered supplier locations & verified quantities        │
│    - Active contract status & volumes                           │
│    - Market pricing signals                                     │
├─────────────────────────────────────────────────────────────────┤
│ 3. Gap Analysis Layer                                           │
│    - Regional potential vs. current supply                      │
│    - Unmet demand identification                                │
│    - Growth opportunity mapping                                 │
├─────────────────────────────────────────────────────────────────┤
│ 2. Dynamic Recalculation                                        │
│    - Updated estimates from registrations                       │
│    - Seasonal adjustment factors                                │
│    - Weather/yield impact modeling                              │
├─────────────────────────────────────────────────────────────────┤
│ 1. ABBA Baseline Import                                         │
│    - Pull geospatial layers via CKAN API                        │
│    - SA2/SA4 resolution biomass data                            │
│    - Historical availability baselines                          │
└─────────────────────────────────────────────────────────────────┘
```

### Implementation Steps

1. **Import ABBA Baseline Data**
   - Pull geospatial layers via CKAN API
   - Store SA2/SA4 biomass estimates in local database
   - Monthly refresh cycle

2. **Overlay Registered Suppliers**
   - Real-time market data layer from ABFI registrations
   - Verified feedstock quantities vs. ABBA estimates
   - Contract status indicators

3. **Gap Analysis**
   - Calculate: ABBA Potential - ABFI Registered = Supply Gap
   - Identify regions with high potential, low registration
   - Target outreach for supplier acquisition

4. **Dynamic Recalculation**
   - Update estimates based on actual registrations
   - Apply seasonal adjustment factors
   - Weather/yield impact modeling from RSIE data

## Proposed Biofuel Projects

### Active Projects with 50km Biomass Catchments

| Project | Location | Lat/Lng | Capacity | 50km Biomass |
|---------|----------|---------|----------|--------------|
| BP Kwinana | WA | -32.2424, 115.7722 | 10,000 bpd | 85,000 t/yr |
| Ampol Brisbane | QLD | -27.4212, 153.1281 | 450 ML/yr | 142,000 t/yr |
| Jet Zero Ulysses | Townsville, QLD | -19.2569, 146.8187 | 113 ML/yr | 1,060,000 t/yr |
| Licella Swift | Bundaberg, QLD | -24.8661, 152.3489 | 60 ML/yr | 1,430,000 t/yr |
| Northern Oil | Yarwun, QLD | -23.8300, 151.0333 | 200 ML | 675,000 t/yr |
| GrainCorp Oilseed | TBD | - | 330,000 t/yr | 860,000 t/yr |
| Viva Energy | Pinkenba, QLD | -27.4333, 153.1167 | SAF blending | 70,000 t/yr |
| Zero Petroleum | Adelaide, SA | -34.9285, 138.6007 | TBD | N/A (P2X) |

### 50km Biomass Catchment Rationale

The 50km radius represents the typical economic transport distance for biomass due to:
- "Low weight by volume, low value by weight" constraint
- Transport costs dominating delivered feedstock economics
- Industry standard for biorefinery catchment planning

## Integration Implementation

### Dependencies

```json
{
  "dependencies": {
    "leaflet": "^1.9.4",
    "react-leaflet": "^4.2.1",
    "@types/leaflet": "^1.9.8"
  }
}
```

### Map Component Usage

```tsx
import { BiomassMap } from '@/components/maps/BiomassMap';

function FeedstockExplorer() {
  return (
    <BiomassMap
      center={[-25.2744, 133.7751]} // Australia center
      zoom={4}
      layers={['landUse', 'biomassAvailability', 'projects']}
      showCatchments={true}
      catchmentRadius={50} // km
    />
  );
}
```

### WMS Layer Configuration

```typescript
const WMS_LAYERS = {
  landUse: {
    url: 'https://di-daa.img.arcgis.com/arcgis/services/Land_and_vegetation/Catchment_Scale_Land_Use_Agricultural_Industries/ImageServer/WMSServer',
    layers: 'Catchment_Scale_Land_Use_Agricultural_Industries',
    format: 'image/png',
    transparent: true,
    attribution: '© ABARES, CC BY 4.0'
  },
  electricity: {
    url: 'https://services.ga.gov.au/gis/services/National_Electricity_Transmission/MapServer/WMSServer',
    layers: '0',
    format: 'image/png',
    transparent: true,
    attribution: '© Geoscience Australia, CC BY 4.0'
  },
  freight: {
    url: 'https://services.ga.gov.au/gis/services/NationalFreightRoutes/MapServer/WMSServer',
    layers: '0',
    format: 'image/png',
    transparent: true,
    attribution: '© Infrastructure Australia, CC BY 3.0'
  }
};
```

## Stealth Discovery Integration

The mapping system supports the Stealth Discovery feature:

1. **Unannounced Project Detection**
   - Monitor EPBC referrals for biofuel facilities
   - Track state planning applications
   - Watch ARENA/CEFC funding announcements

2. **Feedstock Competition Alerts**
   - Flag new projects within 100km of existing
   - Calculate cumulative demand vs regional supply
   - Identify export market competition

3. **Supply Chain Gap Analysis**
   - Projects without secured feedstock
   - Regions with excess biomass, no projects
   - Transport infrastructure bottlenecks

## Billable Products

1. **Project Catchment Reports** - Per-project biomass availability within 50km
2. **Supply Gap Analysis** - Identify unfilled demand from announced projects
3. **Bankability Data Packages** - ABBA baseline + ABFI verified supply for lenders
4. **Stealth Intelligence Subscriptions** - Early alerts on competitive projects

## License Compliance

All integrated data sources use open licenses:
- **CC BY 4.0**: CLUM, ABBA, CSIRO - commercial use with attribution
- **CC BY 3.0**: Freight Routes - commercial use with attribution
- **OpenStreetMap**: ODbL - commercial use with attribution

Required attributions should be displayed in map footer.

---

*Last updated: December 2024*
