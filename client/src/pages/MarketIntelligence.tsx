/**
 * @deprecated This component is superseded by UnifiedMapPage.tsx
 * The /market-intelligence route now redirects to /map (UnifiedMap).
 * This file can be removed once migration is verified.
 * @see client/src/pages/UnifiedMapPage.tsx
 */
"use client";

import { useState, useCallback } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import {
  MarketIntelligenceMap,
  EntityDetailPanel,
  LAYER_CONFIGS,
  FEEDSTOCK_COLORS,
} from "@/components/maps";
import type { MapEntity, MapLayerType } from "@/components/maps";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// Australian states for filtering
const AUSTRALIAN_STATES = [
  { value: "NSW", label: "New South Wales" },
  { value: "VIC", label: "Victoria" },
  { value: "QLD", label: "Queensland" },
  { value: "SA", label: "South Australia" },
  { value: "WA", label: "Western Australia" },
  { value: "TAS", label: "Tasmania" },
  { value: "NT", label: "Northern Territory" },
  { value: "ACT", label: "Australian Capital Territory" },
];

// Feedstock categories
const FEEDSTOCK_CATEGORIES = [
  { value: "oilseed", label: "Oilseed", color: "#22c55e" },
  { value: "UCO", label: "Used Cooking Oil", color: "#f59e0b" },
  { value: "tallow", label: "Tallow", color: "#8b5cf6" },
  { value: "lignocellulosic", label: "Lignocellulosic", color: "#3b82f6" },
  { value: "waste", label: "Waste Biomass", color: "#6b7280" },
  { value: "algae", label: "Algae", color: "#06b6d4" },
  { value: "bamboo", label: "Bamboo", color: "#84cc16" },
];

export default function MarketIntelligence() {
  const { user, supplier, buyer } = useAuth();
  const userRole = user?.role || "user";

  // Selected entity state
  const [selectedEntity, setSelectedEntity] = useState<MapEntity | null>(null);

  // Filter state
  const [activeTab, setActiveTab] = useState<"map" | "analytics" | "alerts">("map");
  const [feedstockFilter, setFeedstockFilter] = useState<string[]>([]);
  const [regionFilter, setRegionFilter] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Fetch market summary
  const { data: marketSummary } = trpc.priceIntelligence.getMarketSummary.useQuery({
    feedstockCategory: feedstockFilter.length === 1 ? feedstockFilter[0] : undefined,
  });

  // Fetch user's price alerts
  const { data: priceAlerts } = trpc.priceIntelligence.getMyPriceAlerts.useQuery(
    { isActive: true },
    { enabled: !!user }
  );

  // Handle entity selection from map
  const handleEntityClick = useCallback((entity: MapEntity) => {
    setSelectedEntity(entity);
  }, []);

  // Handle entity action
  const handleEntityAction = useCallback((action: string, entity: MapEntity) => {
    console.log("Entity action:", action, entity);
    // Handle different actions based on type
    switch (action) {
      case "interest_expressed":
        // Show success toast
        break;
      case "negotiation_started":
        // Navigate to negotiation page
        break;
      case "view_contract":
        // Navigate to contract details
        window.location.href = `/contracts/${entity.id}`;
        break;
      case "schedule_delivery":
        // Open delivery scheduling modal
        break;
      default:
        break;
    }
  }, []);

  // Toggle feedstock filter
  const toggleFeedstockFilter = (category: string) => {
    setFeedstockFilter(prev =>
      prev.includes(category)
        ? prev.filter(f => f !== category)
        : [...prev, category]
    );
  };

  // Toggle region filter
  const toggleRegionFilter = (region: string) => {
    setRegionFilter(prev =>
      prev.includes(region)
        ? prev.filter(r => r !== region)
        : [...prev, region]
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Market Intelligence</h1>
            <p className="text-sm text-gray-500 mt-1">
              Real-time supply, demand, and pricing data across Australia
            </p>
          </div>
          <div className="flex items-center gap-3">
            {userRole === "buyer" && (
              <Button variant="outline" onClick={() => window.location.href = "/demand-signals/create"}>
                + Post Demand Signal
              </Button>
            )}
            {userRole === "supplier" && (
              <Button variant="outline" onClick={() => window.location.href = "/projects/create"}>
                + Register Project
              </Button>
            )}
            <Button onClick={() => window.location.href = "/alerts/create"}>
              Set Price Alert
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
          <div className="flex items-center justify-between mb-4">
            <TabsList>
              <TabsTrigger value="map">Map View</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="alerts">My Alerts</TabsTrigger>
            </TabsList>

            {/* Filters */}
            <div className="flex items-center gap-3">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Map Tab */}
          <TabsContent value="map" className="mt-0">
            <div className="grid grid-cols-12 gap-4">
              {/* Filters Sidebar */}
              <div className="col-span-12 lg:col-span-2">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Feedstock Types</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {FEEDSTOCK_CATEGORIES.map(cat => (
                      <label
                        key={cat.value}
                        className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 p-1 rounded"
                      >
                        <input
                          type="checkbox"
                          checked={feedstockFilter.includes(cat.value)}
                          onChange={() => toggleFeedstockFilter(cat.value)}
                          className="rounded"
                        />
                        <span
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: cat.color }}
                        />
                        <span className="text-gray-700">{cat.label}</span>
                      </label>
                    ))}
                  </CardContent>
                </Card>

                <Card className="mt-4">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Regions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {AUSTRALIAN_STATES.map(state => (
                      <label
                        key={state.value}
                        className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 p-1 rounded"
                      >
                        <input
                          type="checkbox"
                          checked={regionFilter.includes(state.value)}
                          onChange={() => toggleRegionFilter(state.value)}
                          className="rounded"
                        />
                        <span className="text-gray-700">{state.label}</span>
                      </label>
                    ))}
                  </CardContent>
                </Card>
              </div>

              {/* Map Area */}
              <div className="col-span-12 lg:col-span-7">
                <Card className="overflow-hidden">
                  <MarketIntelligenceMap
                    className="h-[700px]"
                    userRole={userRole}
                    userId={user?.id}
                    supplierId={supplier?.id}
                    buyerId={buyer?.id}
                    feedstockFilter={feedstockFilter}
                    regionFilter={regionFilter}
                    onEntityClick={handleEntityClick}
                    showLayerControl={true}
                    showMarketSummary={true}
                    showDetailPanel={false}
                  />
                </Card>
              </div>

              {/* Detail Panel */}
              <div className="col-span-12 lg:col-span-3">
                {selectedEntity ? (
                  <EntityDetailPanel
                    entity={selectedEntity}
                    userRole={userRole}
                    userId={user?.id}
                    supplierId={supplier?.id}
                    buyerId={buyer?.id}
                    onClose={() => setSelectedEntity(null)}
                    onAction={handleEntityAction}
                  />
                ) : (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Select an Entity</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-500">
                        Click on any marker on the map to view details and take action.
                      </p>
                      <div className="mt-4 space-y-2">
                        {LAYER_CONFIGS.slice(0, 6).map(layer => (
                          <div key={layer.id} className="flex items-center gap-2 text-sm">
                            <span className="text-lg">{layer.icon}</span>
                            <span className="text-gray-700">{layer.name}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Quick Stats */}
                <Card className="mt-4">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Market Snapshot</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Active Listings</span>
                      <span className="font-semibold">
                        {marketSummary?.totalActiveListings || 0}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Demand Signals</span>
                      <span className="font-semibold">
                        {marketSummary?.totalActiveDemandSignals || 0}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Avg Price</span>
                      <span className="font-semibold text-green-600">
                        ${marketSummary?.averageSpotPrice?.toFixed(2) || "0.00"}/t
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Price Change (7d)</span>
                      <span
                        className={cn(
                          "font-semibold",
                          (marketSummary?.priceChangePercent || 0) >= 0
                            ? "text-green-600"
                            : "text-red-600"
                        )}
                      >
                        {(marketSummary?.priceChangePercent || 0) >= 0 ? "+" : ""}
                        {marketSummary?.priceChangePercent?.toFixed(1) || 0}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Market Health</span>
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-500 h-2 rounded-full"
                            style={{ width: `${marketSummary?.marketHealthIndex || 0}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium">
                          {marketSummary?.marketHealthIndex || 0}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Price Trends</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-500 text-sm">
                    Historical price data and forecasts coming soon.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Supply/Demand Balance</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-500 text-sm">
                    Regional supply/demand analytics coming soon.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Transport Cost Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-500 text-sm">
                    Transport cost optimization insights coming soon.
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Alerts Tab */}
          <TabsContent value="alerts">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>My Price Alerts</CardTitle>
                <Button onClick={() => window.location.href = "/alerts/create"}>
                  + New Alert
                </Button>
              </CardHeader>
              <CardContent>
                {priceAlerts?.alerts?.length ? (
                  <div className="space-y-3">
                    {priceAlerts.alerts.map((alert: any) => (
                      <div
                        key={alert.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div>
                          <div className="font-medium">{alert.feedstockCategory}</div>
                          <div className="text-sm text-gray-500">
                            {alert.alertType === "ABOVE_THRESHOLD" && `Alert when price > $${alert.thresholdValue}/t`}
                            {alert.alertType === "BELOW_THRESHOLD" && `Alert when price < $${alert.thresholdValue}/t`}
                            {alert.alertType === "PERCENT_CHANGE_UP" && `Alert on ${alert.thresholdValue}% increase`}
                            {alert.alertType === "PERCENT_CHANGE_DOWN" && `Alert on ${alert.thresholdValue}% decrease`}
                          </div>
                        </div>
                        <Badge variant={alert.isActive ? "default" : "secondary"}>
                          {alert.isActive ? "Active" : "Paused"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500 mb-4">No price alerts set up yet.</p>
                    <Button onClick={() => window.location.href = "/alerts/create"}>
                      Create Your First Alert
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
