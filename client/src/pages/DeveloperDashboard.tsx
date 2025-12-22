/**
 * Developer Dashboard - Redesigned
 *
 * Features:
 * - Split layout with GIS map for supplier sourcing
 * - Deal pipeline visualization (Kanban-style)
 * - Supply confidence tools
 * - Risk scoring integration
 * - Real-time price and policy feeds
 */

import { useState, useRef, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Factory,
  Search,
  FileText,
  Clock,
  ChevronRight,
  Filter,
  MapPin,
  Leaf,
  Shield,
  BarChart3,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Eye,
  Plus,
  Target,
  Layers,
  Building2,
  Truck,
  Calendar,
  DollarSign,
} from "lucide-react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";
import { MapView } from "@/components/Map";

// Pipeline stages
const PIPELINE_STAGES = [
  { id: "discovery", label: "Discovery", color: "bg-slate-500" },
  { id: "outreach", label: "Outreach", color: "bg-blue-500" },
  { id: "negotiation", label: "Negotiation", color: "bg-amber-500" },
  { id: "contracted", label: "Contracted", color: "bg-emerald-500" },
];

// Mock deal pipeline data
const DEAL_PIPELINE = [
  {
    id: "1",
    name: "Queensland Canola Collective",
    stage: "negotiation",
    type: "Canola",
    volume: "15,000 t/yr",
    location: { lat: -27.4698, lng: 153.0251, label: "Brisbane, QLD" },
    rating: "AA+",
    value: "$4.2M",
    probability: 75,
    nextAction: "Contract review",
    dueDate: "Jan 15",
  },
  {
    id: "2",
    name: "Southern Tallow Processing",
    stage: "discovery",
    type: "Tallow",
    volume: "8,500 t/yr",
    location: { lat: -37.8136, lng: 144.9631, label: "Melbourne, VIC" },
    rating: "A",
    value: "$2.1M",
    probability: 25,
    nextAction: "Initial contact",
    dueDate: "Jan 20",
  },
  {
    id: "3",
    name: "NSW UCO Network",
    stage: "outreach",
    type: "UCO",
    volume: "12,000 t/yr",
    location: { lat: -33.8688, lng: 151.2093, label: "Sydney, NSW" },
    rating: "AA",
    value: "$3.5M",
    probability: 50,
    nextAction: "Site visit scheduled",
    dueDate: "Jan 12",
  },
  {
    id: "4",
    name: "Perth Grain Cooperative",
    stage: "contracted",
    type: "Canola",
    volume: "20,000 t/yr",
    location: { lat: -31.9505, lng: 115.8605, label: "Perth, WA" },
    rating: "AA+",
    value: "$5.8M",
    probability: 100,
    nextAction: "Delivery Q2 2025",
    dueDate: "Signed",
  },
];

// Quick stats
const QUICK_STATS = [
  { label: "Pipeline Value", value: "$15.6M", icon: DollarSign, color: "text-emerald-600" },
  { label: "Active Deals", value: "4", icon: Target, color: "text-blue-600" },
  { label: "Suppliers Tracked", value: "247", icon: Building2, color: "text-purple-600" },
  { label: "Avg. Confidence", value: "72%", icon: Shield, color: "text-amber-600" },
];

// Registry suppliers for map
const REGISTRY_SUPPLIERS = [
  { id: "s1", name: "Darling Downs Grains", type: "Canola", location: { lat: -27.5589, lng: 151.9539 }, rating: "AA+", volume: "25,000 t/yr" },
  { id: "s2", name: "Gippsland Organics", type: "Canola", location: { lat: -38.2551, lng: 146.4892 }, rating: "A+", volume: "12,000 t/yr" },
  { id: "s3", name: "Adelaide Rendering Co", type: "Tallow", location: { lat: -34.9285, lng: 138.6007 }, rating: "A", volume: "8,000 t/yr" },
  { id: "s4", name: "Newcastle UCO Recyclers", type: "UCO", location: { lat: -32.9283, lng: 151.7817 }, rating: "B+", volume: "5,000 t/yr" },
  { id: "s5", name: "Riverina Ag Services", type: "Canola", location: { lat: -35.1082, lng: 147.3598 }, rating: "AA", volume: "18,000 t/yr" },
];

// Intelligence feeds
const INTELLIGENCE_FEEDS = [
  { id: "1", type: "price", title: "Canola prices up 3.2%", time: "2h ago", href: "/feedstock-prices" },
  { id: "2", type: "policy", title: "NSW RFS consultation open", time: "5h ago", href: "/policy-carbon" },
  { id: "3", type: "signal", title: "New HVO project in QLD", time: "1d ago", href: "/stealth-discovery" },
];

export default function DeveloperDashboard() {
  const mapRef = useRef<google.maps.Map | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFeedstock, setSelectedFeedstock] = useState<string>("all");
  const [selectedDeal, setSelectedDeal] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<"map" | "pipeline">("map");

  const handleMapReady = useCallback((map: google.maps.Map) => {
    mapRef.current = map;

    // Add markers for registry suppliers
    REGISTRY_SUPPLIERS.forEach((supplier) => {
      if (window.google) {
        const marker = new window.google.maps.marker.AdvancedMarkerElement({
          map,
          position: { lat: supplier.location.lat, lng: supplier.location.lng },
          title: supplier.name,
        });

        marker.addListener("click", () => {
          setSelectedDeal(supplier.id);
        });
      }
    });

    // Add markers for pipeline deals
    DEAL_PIPELINE.forEach((deal) => {
      if (window.google && deal.location) {
        const pinColor = PIPELINE_STAGES.find(s => s.id === deal.stage)?.color || "bg-slate-500";
        const marker = new window.google.maps.marker.AdvancedMarkerElement({
          map,
          position: { lat: deal.location.lat, lng: deal.location.lng },
          title: deal.name,
        });

        marker.addListener("click", () => {
          setSelectedDeal(deal.id);
        });
      }
    });

    // Fit bounds to Australia
    map.setCenter({ lat: -25.2744, lng: 133.7751 });
    map.setZoom(4);
  }, []);

  const getDealsForStage = (stageId: string) => {
    return DEAL_PIPELINE.filter((deal) => deal.stage === stageId);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Quick Stats Bar */}
      <div className="border-b bg-card/50">
        <div className="container mx-auto px-4 py-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {QUICK_STATS.map((stat, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-muted/50 flex items-center justify-center">
                  <stat.icon className={cn("h-5 w-5", stat.color)} />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col lg:flex-row h-[calc(100vh-120px)]">
        {/* Left Sidebar - Search & Pipeline */}
        <div className="w-full lg:w-[420px] border-r bg-card/50 flex flex-col">
          {/* Search Bar */}
          <div className="p-4 border-b">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search suppliers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={selectedFeedstock} onValueChange={setSelectedFeedstock}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="canola">Canola</SelectItem>
                  <SelectItem value="tallow">Tallow</SelectItem>
                  <SelectItem value="uco">UCO</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-4 space-y-4">
              {/* View Toggle */}
              <div className="flex gap-2">
                <Button
                  variant={activeView === "map" ? "default" : "outline"}
                  size="sm"
                  className="flex-1"
                  onClick={() => setActiveView("map")}
                >
                  <MapPin className="h-4 w-4 mr-2" />
                  Supplier Map
                </Button>
                <Button
                  variant={activeView === "pipeline" ? "default" : "outline"}
                  size="sm"
                  className="flex-1"
                  onClick={() => setActiveView("pipeline")}
                >
                  <Layers className="h-4 w-4 mr-2" />
                  Pipeline
                </Button>
              </div>

              {/* Deal Pipeline */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <Target className="h-4 w-4 text-blue-600" />
                    Deal Pipeline
                  </h3>
                  <Badge variant="outline" className="text-xs">
                    {DEAL_PIPELINE.length} deals
                  </Badge>
                </div>

                {/* Pipeline Stages Summary */}
                <div className="grid grid-cols-4 gap-1 mb-4">
                  {PIPELINE_STAGES.map((stage) => {
                    const count = getDealsForStage(stage.id).length;
                    return (
                      <div key={stage.id} className="text-center">
                        <div
                          className={cn(
                            "h-1.5 rounded-full mb-1",
                            stage.color
                          )}
                        />
                        <p className="text-xs text-muted-foreground">{stage.label}</p>
                        <p className="text-lg font-bold">{count}</p>
                      </div>
                    );
                  })}
                </div>

                {/* Deal Cards */}
                <div className="space-y-2">
                  {DEAL_PIPELINE.map((deal) => {
                    const stage = PIPELINE_STAGES.find((s) => s.id === deal.stage);
                    return (
                      <div
                        key={deal.id}
                        className={cn(
                          "p-3 rounded-lg border cursor-pointer transition-all hover:shadow-sm",
                          selectedDeal === deal.id
                            ? "border-primary ring-1 ring-primary/20"
                            : "hover:border-primary/30"
                        )}
                        onClick={() => setSelectedDeal(deal.id)}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-sm truncate">{deal.name}</p>
                              <Badge
                                className={cn("text-xs shrink-0", stage?.color, "text-white")}
                              >
                                {stage?.label}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {deal.location.label}
                              </span>
                              <span>|</span>
                              <span>{deal.type}</span>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-sm font-bold text-emerald-600">{deal.value}</p>
                            <p className="text-xs text-muted-foreground">{deal.probability}%</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-2 pt-2 border-t text-xs">
                          <span className="text-muted-foreground">{deal.nextAction}</span>
                          <Badge variant="outline" className="text-xs">
                            {deal.dueDate}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Intelligence Feeds */}
              <div>
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-purple-600" />
                  Intelligence Feeds
                </h3>
                <div className="space-y-2">
                  {INTELLIGENCE_FEEDS.map((feed) => (
                    <Link key={feed.id} href={feed.href}>
                      <div className="p-2 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {feed.type === "price" && <TrendingUp className="h-4 w-4 text-emerald-500" />}
                            {feed.type === "policy" && <FileText className="h-4 w-4 text-blue-500" />}
                            {feed.type === "signal" && <Eye className="h-4 w-4 text-amber-500" />}
                            <span className="text-sm">{feed.title}</span>
                          </div>
                          <span className="text-xs text-muted-foreground">{feed.time}</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Quick Actions */}
              <div>
                <h3 className="text-sm font-semibold mb-3">Quick Actions</h3>
                <div className="grid grid-cols-2 gap-2">
                  <Link href="/browse">
                    <Button variant="outline" size="sm" className="w-full justify-start">
                      <Search className="h-4 w-4 mr-2" />
                      Browse Registry
                    </Button>
                  </Link>
                  <Link href="/procurement-scenarios">
                    <Button variant="outline" size="sm" className="w-full justify-start">
                      <Shield className="h-4 w-4 mr-2" />
                      Confidence Tool
                    </Button>
                  </Link>
                  <Link href="/feedstock-prices">
                    <Button variant="outline" size="sm" className="w-full justify-start">
                      <BarChart3 className="h-4 w-4 mr-2" />
                      Price Charts
                    </Button>
                  </Link>
                  <Link href="/policy-carbon">
                    <Button variant="outline" size="sm" className="w-full justify-start">
                      <Clock className="h-4 w-4 mr-2" />
                      Policy Timeline
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </ScrollArea>
        </div>

        {/* Map/Pipeline Area */}
        <div className="flex-1 relative min-h-[400px] lg:min-h-0">
          {activeView === "map" ? (
            <>
              <MapView
                className="w-full h-full"
                initialCenter={{ lat: -25.2744, lng: 133.7751 }}
                initialZoom={4}
                onMapReady={handleMapReady}
              />

              {/* Map Legend */}
              <div className="absolute bottom-4 left-4 bg-card/95 backdrop-blur p-3 rounded-lg shadow-lg border">
                <h4 className="text-xs font-semibold mb-2">Supplier Network</h4>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs">
                    <div className="h-3 w-3 rounded-full bg-blue-500" />
                    <span>In Pipeline ({DEAL_PIPELINE.length})</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <div className="h-3 w-3 rounded-full bg-slate-400" />
                    <span>Registry ({REGISTRY_SUPPLIERS.length})</span>
                  </div>
                </div>
              </div>

              {/* Search Registry Button */}
              <Link href="/browse">
                <Button className="absolute bottom-4 right-4 shadow-lg" size="lg">
                  <Search className="h-5 w-5 mr-2" />
                  Search Registry
                </Button>
              </Link>
            </>
          ) : (
            /* Pipeline Kanban View */
            <div className="h-full p-4 overflow-x-auto">
              <div className="flex gap-4 h-full min-w-max">
                {PIPELINE_STAGES.map((stage) => (
                  <div
                    key={stage.id}
                    className="w-80 flex flex-col bg-muted/30 rounded-lg"
                  >
                    <div className="p-3 border-b">
                      <div className="flex items-center gap-2">
                        <div className={cn("h-3 w-3 rounded-full", stage.color)} />
                        <h3 className="font-semibold text-sm">{stage.label}</h3>
                        <Badge variant="secondary" className="ml-auto">
                          {getDealsForStage(stage.id).length}
                        </Badge>
                      </div>
                    </div>
                    <ScrollArea className="flex-1 p-2">
                      <div className="space-y-2">
                        {getDealsForStage(stage.id).map((deal) => (
                          <Card
                            key={deal.id}
                            className={cn(
                              "cursor-pointer transition-all",
                              selectedDeal === deal.id && "ring-1 ring-primary"
                            )}
                            onClick={() => setSelectedDeal(deal.id)}
                          >
                            <CardContent className="p-3">
                              <div className="flex items-start justify-between mb-2">
                                <div>
                                  <p className="font-medium text-sm">{deal.name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {deal.type} · {deal.volume}
                                  </p>
                                </div>
                                <Badge
                                  className={cn(
                                    "text-xs",
                                    deal.rating.startsWith("AA")
                                      ? "bg-emerald-100 text-emerald-800"
                                      : deal.rating.startsWith("A")
                                      ? "bg-blue-100 text-blue-800"
                                      : "bg-slate-100 text-slate-800"
                                  )}
                                >
                                  {deal.rating}
                                </Badge>
                              </div>
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-emerald-600 font-bold">
                                  {deal.value}
                                </span>
                                <span className="text-muted-foreground">
                                  {deal.probability}% probability
                                </span>
                              </div>
                              <div className="mt-2 pt-2 border-t flex items-center gap-1 text-xs text-muted-foreground">
                                <Calendar className="h-3 w-3" />
                                {deal.nextAction} · {deal.dueDate}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                        {getDealsForStage(stage.id).length === 0 && (
                          <div className="text-center py-8 text-muted-foreground text-sm">
                            No deals in this stage
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
