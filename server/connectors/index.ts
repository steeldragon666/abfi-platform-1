/**
 * Stealth Discovery Data Connectors
 * Aggregates signals from multiple Australian government and registry sources
 */

export * from "./baseConnector";
export { NSWPlanningConnector } from "./nswPlanningConnector";
export { ArenaConnector } from "./arenaConnector";
export { CEFCConnector } from "./cefcConnector";
export { QldEpaConnector } from "./qldEpaConnector";
export { IPAustraliaConnector } from "./ipAustraliaConnector";
export { ABARESConnector, createABARESConnector } from "./abaresConnector";
export type {
  CropForecast,
  CommodityPrice,
  FarmBenchmark,
  LandUseData,
  ABARESIntelligence,
} from "./abaresConnector";
export { BOMConnector, createBOMConnector, AGRICULTURAL_REGIONS } from "./bomConnector";
export type {
  SILOVariable,
  SILODataPoint,
  SILOTimeSeries,
  BOMObservation,
  BOMForecast,
  BOMForecastDay,
  SeasonalOutlook,
  BOMWarning,
  ClimateIntelligence,
} from "./bomConnector";

import { ConnectorConfig, ConnectorResult, RawSignal } from "./baseConnector";
import { NSWPlanningConnector } from "./nswPlanningConnector";
import { ArenaConnector } from "./arenaConnector";
import { CEFCConnector } from "./cefcConnector";
import { QldEpaConnector } from "./qldEpaConnector";
import { IPAustraliaConnector } from "./ipAustraliaConnector";
import { ABARESConnector } from "./abaresConnector";
import { BOMConnector } from "./bomConnector";

// Default connector configurations
export const CONNECTOR_CONFIGS: Record<string, ConnectorConfig> = {
  nsw_planning: {
    name: "NSW Planning Portal",
    enabled: true,
    rateLimit: 10,
  },
  arena: {
    name: "ARENA Projects",
    enabled: true,
    rateLimit: 10,
  },
  cefc: {
    name: "CEFC Investments",
    enabled: true,
    rateLimit: 10,
  },
  qld_epa: {
    name: "Queensland EPA",
    enabled: true,
    rateLimit: 10,
  },
  ip_australia: {
    name: "IP Australia Patents",
    enabled: true,
    rateLimit: 10,
  },
  abares: {
    name: "ABARES Agricultural Intelligence",
    enabled: true,
    rateLimit: 30,
  },
  bom: {
    name: "BOM Climate Data",
    enabled: true,
    rateLimit: 30,
  },
};

/**
 * Run all enabled connectors and aggregate signals
 */
export async function runAllConnectors(
  since?: Date
): Promise<{
  totalSignals: number;
  signals: RawSignal[];
  results: Record<string, ConnectorResult>;
}> {
  const results: Record<string, ConnectorResult> = {};
  const allSignals: RawSignal[] = [];

  const connectors = [
    {
      key: "nsw_planning",
      connector: new NSWPlanningConnector(CONNECTOR_CONFIGS.nsw_planning),
    },
    { key: "arena", connector: new ArenaConnector(CONNECTOR_CONFIGS.arena) },
    { key: "cefc", connector: new CEFCConnector(CONNECTOR_CONFIGS.cefc) },
    {
      key: "qld_epa",
      connector: new QldEpaConnector(CONNECTOR_CONFIGS.qld_epa),
    },
    {
      key: "ip_australia",
      connector: new IPAustraliaConnector(CONNECTOR_CONFIGS.ip_australia),
    },
    {
      key: "abares",
      connector: new ABARESConnector(CONNECTOR_CONFIGS.abares),
    },
    {
      key: "bom",
      connector: new BOMConnector(CONNECTOR_CONFIGS.bom),
    },
  ];

  // Run connectors in parallel
  const connectorPromises = connectors
    .filter(({ key }) => CONNECTOR_CONFIGS[key].enabled)
    .map(async ({ key, connector }) => {
      try {
        const result = await connector.fetchSignals(since);
        results[key] = result;
        allSignals.push(...result.signals);
      } catch (error) {
        results[key] = {
          success: false,
          signalsDiscovered: 0,
          signals: [],
          errors: [error instanceof Error ? error.message : "Unknown error"],
          duration: 0,
        };
      }
    });

  await Promise.all(connectorPromises);

  return {
    totalSignals: allSignals.length,
    signals: allSignals,
    results,
  };
}

/**
 * Run a specific connector by name
 */
export async function runConnector(
  connectorName: string,
  since?: Date
): Promise<ConnectorResult> {
  const config = CONNECTOR_CONFIGS[connectorName];
  if (!config) {
    throw new Error(`Unknown connector: ${connectorName}`);
  }

  const connectorMap: Record<
    string,
    new (config: ConnectorConfig) => {
      fetchSignals: (since?: Date) => Promise<ConnectorResult>;
    }
  > = {
    nsw_planning: NSWPlanningConnector,
    arena: ArenaConnector,
    cefc: CEFCConnector,
    qld_epa: QldEpaConnector,
    ip_australia: IPAustraliaConnector,
    abares: ABARESConnector,
    bom: BOMConnector,
  };

  const ConnectorClass = connectorMap[connectorName];
  if (!ConnectorClass) {
    throw new Error(`Connector not implemented: ${connectorName}`);
  }

  const connector = new ConnectorClass(config);
  return connector.fetchSignals(since);
}
