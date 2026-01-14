/**
 * Maps Components Index
 * 
 * Unified mapping components for the ABFI Platform.
 */

// New unified platform map
export { PlatformMap } from './PlatformMap';
export type { 
  PlatformMapProps, 
  MapPreset, 
  MapMarker, 
  BaseLayerType 
} from './PlatformMap';

// Advanced climate risk analysis panel
export { BiomassRiskPanel } from './BiomassRiskPanel';
export type { 
  RiskScenario, 
  HazardType, 
  Season, 
  CropType 
} from './BiomassRiskPanel';

// Legacy map components (to be deprecated)
export { 
  MarketIntelligenceMap, 
  LAYER_CONFIGS, 
  FEEDSTOCK_COLORS 
} from './MarketIntelligenceMap';
export type { MapLayerType, MapEntity } from './MarketIntelligenceMap';
export { EntityDetailPanel } from './EntityDetailPanel';
export { UnifiedMap } from './UnifiedMap';
export { DataOverlayLayers, OverlayLegend } from './DataOverlayLayers';
