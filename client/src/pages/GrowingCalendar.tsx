/**
 * Growing Calendar - Nextgen Design
 *
 * Features:
 * - Seasonal production planning
 * - Harvest scheduling
 * - Weather integration
 * - Typography components for consistent styling
 */

import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import {
  Calendar,
  Wheat,
  Leaf,
  Sun,
  CloudRain,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  Plus,
  FileText,
  Clock,
  MapPin,
} from "lucide-react";
import { Link } from "wouter";

// Type definitions
interface Intention {
  id: number;
  feedstockType: string;
  feedstockTypeId?: string;
  feedstockCategory: string;
  projectedTonnes: number;
  expectedHarvestDate: string;
  status: string;
  region: string;
  areaHa?: number;
}

interface ForwardAvailability {
  month: string;
  projectedTonnes: number;
  confirmedTonnes: number;
  priceEstimate: number;
  projectedSupply?: string;
  demandCommitted?: string;
}

// Months for calendar display
const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

// Feedstock growing seasons (Australian)
const FEEDSTOCK_SEASONS: Record<string, { plant: number[]; harvest: number[]; color: string }> = {
  wheat: {
    plant: [4, 5, 6], // Apr-Jun
    harvest: [10, 11, 12], // Oct-Dec
    color: "#f59e0b",
  },
  canola: {
    plant: [3, 4, 5], // Mar-May
    harvest: [10, 11], // Oct-Nov
    color: "#eab308",
  },
  sugarcane: {
    plant: [7, 8, 9], // Jul-Sep
    harvest: [6, 7, 8, 9, 10, 11], // Jun-Nov (crushing season)
    color: "#22c55e",
  },
  sorghum: {
    plant: [9, 10, 11], // Sep-Nov
    harvest: [2, 3, 4], // Feb-Apr
    color: "#ef4444",
  },
  cotton: {
    plant: [9, 10, 11], // Sep-Nov
    harvest: [3, 4, 5], // Mar-May
    color: "#f9fafb",
  },
  barley: {
    plant: [4, 5, 6], // Apr-Jun
    harvest: [10, 11, 12], // Oct-Dec
    color: "#d97706",
  },
};

// Status colors
const STATUS_COLORS = {
  planning: "bg-yellow-100 text-yellow-800 border-yellow-300",
  confirmed: "bg-green-100 text-green-800 border-green-300",
  under_contract: "bg-blue-100 text-blue-800 border-blue-300",
  active: "bg-green-100 text-green-800 border-green-300",
  cancelled: "bg-red-100 text-red-800 border-red-300",
  harvested: "bg-gray-100 text-gray-800 border-gray-300",
};

export default function GrowingCalendar() {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedFeedstock, setSelectedFeedstock] = useState<string>("all");
  const [activeTab, setActiveTab] = useState("regional");

  // Fetch grower's intentions
  const { data: myIntentions, isLoading: intentionsLoading } =
    trpc.unifiedMap.getMyIntentions.useQuery();

  // Fetch forward availability
  const { data: forwardAvailability } = trpc.unifiedMap.getForwardAvailability.useQuery(
    {
      feedstockTypeId: selectedFeedstock === "all" ? "wheat" : selectedFeedstock,
      months: 12,
    },
    { enabled: selectedFeedstock !== "all" }
  );

  // Current month for highlighting
  const currentMonth = new Date().getMonth();

  // Group intentions by month
  const intentionsByMonth = useMemo(() => {
    if (!myIntentions) return {} as Record<number, Intention[]>;

    const grouped: Record<number, Intention[]> = {};
    myIntentions.forEach((intention: Intention) => {
      if (!intention.expectedHarvestDate) return;
      const harvestMonth = new Date(intention.expectedHarvestDate).getMonth();
      if (!grouped[harvestMonth]) grouped[harvestMonth] = [];
      grouped[harvestMonth].push(intention);
    });
    return grouped;
  }, [myIntentions]);

  // Render month cell for regional view
  const renderMonthCell = (monthIndex: number, feedstockId: string) => {
    const season = FEEDSTOCK_SEASONS[feedstockId];
    if (!season) return null;

    const isPlanting = season.plant.includes(monthIndex + 1);
    const isHarvesting = season.harvest.includes(monthIndex + 1);
    const isCurrent = monthIndex === currentMonth;

    return (
      <div
        className={cn(
          "h-8 flex items-center justify-center text-xs font-medium rounded",
          isPlanting && "bg-blue-100 text-blue-800",
          isHarvesting && "bg-green-100 text-green-800",
          isPlanting && isHarvesting && "bg-gradient-to-r from-blue-100 to-green-100",
          isCurrent && "ring-2 ring-primary ring-offset-1"
        )}
      >
        {isPlanting && !isHarvesting && "P"}
        {isHarvesting && !isPlanting && "H"}
        {isPlanting && isHarvesting && "P/H"}
      </div>
    );
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Calendar className="h-8 w-8" />
            Growing Calendar
          </h1>
          <p className="text-muted-foreground mt-1">
            Plan your growing season and align with market demand
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setSelectedYear(y => y - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="font-semibold w-16 text-center">{selectedYear}</span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setSelectedYear(y => y + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <Select value={selectedFeedstock} onValueChange={setSelectedFeedstock}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All Feedstocks" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Feedstocks</SelectItem>
              <SelectItem value="wheat">Wheat</SelectItem>
              <SelectItem value="canola">Canola</SelectItem>
              <SelectItem value="sugarcane">Sugarcane</SelectItem>
              <SelectItem value="sorghum">Sorghum</SelectItem>
              <SelectItem value="barley">Barley</SelectItem>
            </SelectContent>
          </Select>

          <Link href="/grower/intentions/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Intention
            </Button>
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="regional">
            <MapPin className="h-4 w-4 mr-2" />
            Regional Seasons
          </TabsTrigger>
          <TabsTrigger value="my-schedule">
            <Calendar className="h-4 w-4 mr-2" />
            My Schedule
          </TabsTrigger>
          <TabsTrigger value="market">
            <TrendingUp className="h-4 w-4 mr-2" />
            Market Demand
          </TabsTrigger>
        </TabsList>

        {/* Regional Seasons Tab */}
        <TabsContent value="regional" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Australian Growing Seasons</CardTitle>
              <CardDescription>
                Typical planting (P) and harvest (H) periods by feedstock type
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr>
                      <th className="text-left py-2 px-3 font-medium text-sm w-32">
                        Feedstock
                      </th>
                      {MONTHS.map((month, i) => (
                        <th
                          key={month}
                          className={cn(
                            "text-center py-2 px-1 font-medium text-xs",
                            i === currentMonth && "bg-primary/10"
                          )}
                        >
                          {month}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(FEEDSTOCK_SEASONS).map(([feedstockId, season]) => (
                      <tr key={feedstockId} className="border-t">
                        <td className="py-2 px-3">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: season.color }}
                            />
                            <span className="capitalize font-medium text-sm">
                              {feedstockId}
                            </span>
                          </div>
                        </td>
                        {MONTHS.map((_, i) => (
                          <td key={i} className="py-2 px-1">
                            {renderMonthCell(i, feedstockId)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Legend */}
              <div className="flex items-center gap-6 mt-4 pt-4 border-t">
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-6 h-4 bg-blue-100 rounded" />
                  <span>Planting Season</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-6 h-4 bg-green-100 rounded" />
                  <span>Harvest Season</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-6 h-4 ring-2 ring-primary rounded" />
                  <span>Current Month</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Weather Outlook */}
          <div className="grid grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <Sun className="h-8 w-8 text-yellow-500" />
                  <div>
                    <div className="text-sm text-muted-foreground">Temperature</div>
                    <div className="font-semibold">Above Average</div>
                    <div className="text-xs text-muted-foreground">Next 3 months</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <CloudRain className="h-8 w-8 text-blue-500" />
                  <div>
                    <div className="text-sm text-muted-foreground">Rainfall</div>
                    <div className="font-semibold">Normal</div>
                    <div className="text-xs text-muted-foreground">Next 3 months</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <Wheat className="h-8 w-8 text-amber-500" />
                  <div>
                    <div className="text-sm text-muted-foreground">Yield Outlook</div>
                    <div className="font-semibold text-green-600">Favorable</div>
                    <div className="text-xs text-muted-foreground">Based on conditions</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <Leaf className="h-8 w-8 text-green-500" />
                  <div>
                    <div className="text-sm text-muted-foreground">Growth Index</div>
                    <div className="font-semibold">85/100</div>
                    <div className="text-xs text-muted-foreground">Current NDVI</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* My Schedule Tab */}
        <TabsContent value="my-schedule" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>My Growing Intentions</CardTitle>
              <CardDescription>
                Your planned and active growing intentions for {selectedYear}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {intentionsLoading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Loading your intentions...
                </div>
              ) : myIntentions && myIntentions.length > 0 ? (
                <div className="space-y-4">
                  {/* Calendar Grid */}
                  <div className="grid grid-cols-12 gap-1">
                    {MONTHS.map((month, i) => (
                      <div key={month} className="text-center">
                        <div
                          className={cn(
                            "text-xs font-medium py-1",
                            i === currentMonth && "bg-primary/10 rounded"
                          )}
                        >
                          {month}
                        </div>
                        <div className="min-h-[60px] border rounded-lg p-1 mt-1">
                          {intentionsByMonth[i]?.map((intention: Intention) => (
                            <div
                              key={intention.id}
                              className={cn(
                                "text-xs p-1 rounded mb-1 border",
                                STATUS_COLORS[intention.status as keyof typeof STATUS_COLORS]
                              )}
                              title={`${intention.feedstockTypeId || intention.feedstockType}: ${intention.areaHa || intention.projectedTonnes} ha`}
                            >
                              {intention.feedstockTypeId || intention.feedstockType}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Intentions List */}
                  <div className="mt-6 space-y-3">
                    <h4 className="font-medium">Active Intentions</h4>
                    {myIntentions.map((intention: Intention) => (
                      <div
                        key={intention.id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{
                              backgroundColor:
                                FEEDSTOCK_SEASONS[intention.feedstockTypeId || intention.feedstockType]?.color || "#6b7280",
                            }}
                          />
                          <div>
                            <div className="font-medium capitalize">
                              {intention.feedstockTypeId || intention.feedstockType}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {intention.areaHa || intention.projectedTonnes} ha • Expected yield:{" "}
                              {intention.projectedTonnes
                                ? `${intention.projectedTonnes.toLocaleString()} t`
                                : "N/A"}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <div className="text-sm">
                              <Clock className="h-3 w-3 inline mr-1" />
                              Harvest:{" "}
                              {intention.expectedHarvestDate
                                ? new Date(intention.expectedHarvestDate).toLocaleDateString()
                                : "N/A"}
                            </div>
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-xs",
                                STATUS_COLORS[intention.status as keyof typeof STATUS_COLORS]
                              )}
                            >
                              {intention.status}
                            </Badge>
                          </div>
                          <Link href={`/grower/intentions/${intention.id}`}>
                            <Button variant="ghost" size="sm">
                              View
                            </Button>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Wheat className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground mb-4">
                    No growing intentions yet
                  </p>
                  <Link href="/grower/intentions/new">
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add First Intention
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Market Demand Tab */}
        <TabsContent value="market" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Forward Availability</CardTitle>
                <CardDescription>
                  Supply vs demand forecast for the next 12 months
                </CardDescription>
              </CardHeader>
              <CardContent>
                {selectedFeedstock === "all" ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Select a feedstock to view forward availability
                  </div>
                ) : forwardAvailability ? (
                  <div className="space-y-3">
                    {forwardAvailability.map((monthData: ForwardAvailability, i: number) => {
                      const supply = monthData.projectedTonnes || 0;
                      const demand = monthData.confirmedTonnes || 0;
                      const balance = supply - demand;
                      const supplyPercent = supply + demand > 0 ? (supply / (supply + demand)) * 100 : 50;
                      const monthDate = new Date(monthData.month);

                      return (
                        <div key={i} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span>
                              {MONTHS[monthDate.getMonth()]} {monthDate.getFullYear()}
                            </span>
                            <span
                              className={cn(
                                "font-medium",
                                balance > 0 ? "text-green-600" : "text-red-600"
                              )}
                            >
                              {balance > 0 ? "+" : ""}
                              {balance.toLocaleString()} t
                            </span>
                          </div>
                          <div className="flex gap-0.5 h-3">
                            <div
                              className="bg-green-500 rounded-l"
                              style={{ width: `${supplyPercent}%` }}
                            />
                            <div
                              className="bg-red-500 rounded-r"
                              style={{ width: `${100 - supplyPercent}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Loading forward availability...
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Contract Opportunities</CardTitle>
                <CardDescription>
                  Align your harvest with buyer demand
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-3 border rounded-lg bg-green-50">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="default" className="bg-green-600">
                        High Demand
                      </Badge>
                      <span className="text-sm font-medium">Q4 {selectedYear}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Strong demand for wheat and canola during Oct-Dec harvest period.
                      Consider locking in contracts early.
                    </p>
                    <Button variant="link" className="p-0 h-auto mt-2">
                      View matching demand signals →
                    </Button>
                  </div>

                  <div className="p-3 border rounded-lg bg-yellow-50">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className="border-yellow-500 text-yellow-700">
                        Moderate
                      </Badge>
                      <span className="text-sm font-medium">Q1 {selectedYear + 1}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Sorghum and cotton harvest period. Normal demand levels expected.
                    </p>
                    <Button variant="link" className="p-0 h-auto mt-2">
                      View matching demand signals →
                    </Button>
                  </div>

                  <div className="p-3 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="h-4 w-4" />
                      <span className="text-sm font-medium">Market Report</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Download the latest market intelligence report for detailed
                      price forecasts and demand analysis.
                    </p>
                    <Button variant="outline" size="sm" className="mt-2">
                      Download Report
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Link to Futures Marketplace */}
          <Card>
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <TrendingUp className="h-8 w-8 text-primary" />
                  <div>
                    <h4 className="font-medium">Futures Marketplace</h4>
                    <p className="text-sm text-muted-foreground">
                      Lock in prices and secure contracts for your upcoming harvest
                    </p>
                  </div>
                </div>
                <Link href="/futures">
                  <Button>
                    View Futures Market
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
