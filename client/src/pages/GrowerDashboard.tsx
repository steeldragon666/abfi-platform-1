/**
 * Grower Dashboard - Redesigned
 *
 * Features:
 * - Split layout with interactive map and listings sidebar
 * - Priority actions section with smart recommendations
 * - Expandable property cards with yield/quality metrics
 * - Real-time data integration
 */

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Leaf,
  FileText,
  CheckCircle2,
  Circle,
  ChevronRight,
  ChevronDown,
  Plus,
  Bell,
  MapPin,
  Calendar,
  TrendingUp,
  AlertTriangle,
  Upload,
  Eye,
  Clock,
  Droplets,
  Thermometer,
  Shield,
  Star,
  ExternalLink,
} from "lucide-react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";
import { MapView } from "@/components/Map";

// Onboarding checklist items
const ONBOARDING_CHECKLIST = [
  { id: "account", label: "Create Account", completed: true },
  { id: "profile", label: "Business Profile", completed: true },
  { id: "feedstock", label: "Register Feedstock", completed: false },
  { id: "certification", label: "Upload Certifications", completed: false },
  { id: "verification", label: "Complete Verification", completed: false },
];

// Priority actions - smart recommendations based on user state
const PRIORITY_ACTIONS = [
  {
    id: "register",
    title: "Register Your First Feedstock",
    description: "Start by adding your feedstock details to get discovered by buyers",
    icon: Plus,
    priority: "high",
    href: "/feedstock/create",
    cta: "Add Feedstock",
  },
  {
    id: "certification",
    title: "Upload Sustainability Certification",
    description: "ISCC or RSB certification increases buyer confidence",
    icon: Upload,
    priority: "medium",
    href: "/certificate/upload",
    cta: "Upload Certificate",
  },
  {
    id: "inquiry",
    title: "New Inquiry Received",
    description: "Biodiesel Australia is interested in your canola supply",
    icon: Bell,
    priority: "high",
    href: "/inquiries/supplier",
    cta: "View Inquiry",
  },
];

// Mock feedstock listings (would come from API in production)
const MY_LISTINGS = [
  {
    id: "1",
    name: "North Field Canola",
    type: "Canola",
    location: { lat: -33.8688, lng: 151.2093, label: "Dubbo, NSW" },
    status: "active",
    volume: "2,500 t/yr",
    rating: "A+",
    nextHarvest: "Mar 2025",
    moisture: 8.2,
    quality: 94,
    inquiries: 3,
  },
  {
    id: "2",
    name: "South Paddock Tallow",
    type: "Tallow",
    location: { lat: -37.8136, lng: 144.9631, label: "Geelong, VIC" },
    status: "pending",
    volume: "800 t/yr",
    rating: "B+",
    nextHarvest: "Continuous",
    moisture: null,
    quality: 87,
    inquiries: 1,
  },
];

// Quick stats
const QUICK_STATS = [
  { label: "Active Listings", value: "2", icon: Leaf, color: "text-emerald-600" },
  { label: "Total Volume", value: "3,300 t", icon: TrendingUp, color: "text-blue-600" },
  { label: "Pending Inquiries", value: "4", icon: Bell, color: "text-amber-600" },
  { label: "Avg. Rating", value: "A", icon: Star, color: "text-purple-600" },
];

export default function GrowerDashboard() {
  const mapRef = useRef<google.maps.Map | null>(null);
  const [selectedListing, setSelectedListing] = useState<string | null>(null);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const completedSteps = ONBOARDING_CHECKLIST.filter((item) => item.completed).length;
  const totalSteps = ONBOARDING_CHECKLIST.length;
  const progressPercent = (completedSteps / totalSteps) * 100;

  const handleMapReady = useCallback((map: google.maps.Map) => {
    mapRef.current = map;

    // Add markers for each listing
    MY_LISTINGS.forEach((listing) => {
      if (listing.location && window.google) {
        const marker = new window.google.maps.marker.AdvancedMarkerElement({
          map,
          position: { lat: listing.location.lat, lng: listing.location.lng },
          title: listing.name,
        });

        marker.addListener("click", () => {
          setSelectedListing(listing.id);
          map.panTo({ lat: listing.location.lat, lng: listing.location.lng });
        });
      }
    });

    // Fit bounds to show all markers
    if (MY_LISTINGS.length > 0) {
      const bounds = new window.google.maps.LatLngBounds();
      MY_LISTINGS.forEach((listing) => {
        if (listing.location) {
          bounds.extend({ lat: listing.location.lat, lng: listing.location.lng });
        }
      });
      map.fitBounds(bounds, { padding: 50 });
    }
  }, []);

  const toggleCardExpanded = (id: string) => {
    setExpandedCards((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const focusOnListing = (listing: (typeof MY_LISTINGS)[0]) => {
    setSelectedListing(listing.id);
    if (mapRef.current && listing.location) {
      mapRef.current.panTo({ lat: listing.location.lat, lng: listing.location.lng });
      mapRef.current.setZoom(12);
    }
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
        {/* Left Sidebar - Listings & Actions */}
        <div className="w-full lg:w-96 border-r bg-card/50 flex flex-col">
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-4">
              {/* Onboarding Progress (if incomplete) */}
              {progressPercent < 100 && (
                <Card className="border-emerald-200 bg-emerald-50/50">
                  <CardHeader className="pb-2 pt-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        Complete Setup
                      </CardTitle>
                      <Badge variant="outline" className="text-xs bg-emerald-100 text-emerald-700">
                        {Math.round(progressPercent)}%
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-4">
                    <Progress value={progressPercent} className="h-1.5 mb-3" />
                    <div className="space-y-1">
                      {ONBOARDING_CHECKLIST.map((item) => (
                        <div
                          key={item.id}
                          className={cn(
                            "flex items-center gap-2 text-xs",
                            item.completed ? "text-emerald-700" : "text-muted-foreground"
                          )}
                        >
                          {item.completed ? (
                            <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                          ) : (
                            <Circle className="h-3 w-3" />
                          )}
                          <span className={item.completed ? "line-through" : ""}>
                            {item.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Priority Actions */}
              <div>
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  Priority Actions
                </h3>
                <div className="space-y-2">
                  {PRIORITY_ACTIONS.map((action) => (
                    <Link key={action.id} href={action.href}>
                      <div
                        className={cn(
                          "p-3 rounded-lg border cursor-pointer transition-all hover:shadow-sm",
                          action.priority === "high"
                            ? "border-amber-200 bg-amber-50/50 hover:border-amber-300"
                            : "border-border hover:border-primary/30"
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={cn(
                              "h-8 w-8 rounded-lg flex items-center justify-center shrink-0",
                              action.priority === "high"
                                ? "bg-amber-500/10"
                                : "bg-muted"
                            )}
                          >
                            <action.icon
                              className={cn(
                                "h-4 w-4",
                                action.priority === "high"
                                  ? "text-amber-600"
                                  : "text-muted-foreground"
                              )}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">{action.title}</p>
                            <p className="text-xs text-muted-foreground line-clamp-1">
                              {action.description}
                            </p>
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              {/* My Listings */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <Leaf className="h-4 w-4 text-emerald-600" />
                    My Listings
                  </h3>
                  <Link href="/feedstock/create">
                    <Button size="sm" variant="outline" className="h-7 text-xs">
                      <Plus className="h-3 w-3 mr-1" />
                      Add
                    </Button>
                  </Link>
                </div>

                <div className="space-y-2">
                  {MY_LISTINGS.length === 0 ? (
                    <div className="text-center py-8 px-4 border rounded-lg border-dashed">
                      <Leaf className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                      <p className="text-sm text-muted-foreground">No listings yet</p>
                      <Link href="/feedstock/create">
                        <Button size="sm" className="mt-3" variant="default">
                          <Plus className="h-4 w-4 mr-2" />
                          Add Your First Feedstock
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    MY_LISTINGS.map((listing) => (
                      <Collapsible
                        key={listing.id}
                        open={expandedCards.has(listing.id)}
                        onOpenChange={() => toggleCardExpanded(listing.id)}
                      >
                        <div
                          className={cn(
                            "border rounded-lg overflow-hidden transition-all",
                            selectedListing === listing.id
                              ? "border-primary ring-1 ring-primary/20"
                              : "hover:border-primary/30"
                          )}
                        >
                          {/* Listing Header */}
                          <div
                            className="p-3 cursor-pointer"
                            onClick={() => focusOnListing(listing)}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="font-medium text-sm truncate">
                                    {listing.name}
                                  </p>
                                  <Badge
                                    variant="outline"
                                    className={cn(
                                      "text-xs shrink-0",
                                      listing.status === "active"
                                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                        : "bg-amber-50 text-amber-700 border-amber-200"
                                    )}
                                  >
                                    {listing.status}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />
                                    {listing.location.label}
                                  </span>
                                  <span>|</span>
                                  <span>{listing.type}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-1">
                                <Badge
                                  className={cn(
                                    "text-xs",
                                    listing.rating.startsWith("A")
                                      ? "bg-emerald-100 text-emerald-800"
                                      : "bg-blue-100 text-blue-800"
                                  )}
                                >
                                  {listing.rating}
                                </Badge>
                                <CollapsibleTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <ChevronDown
                                      className={cn(
                                        "h-4 w-4 transition-transform",
                                        expandedCards.has(listing.id) && "rotate-180"
                                      )}
                                    />
                                  </Button>
                                </CollapsibleTrigger>
                              </div>
                            </div>
                          </div>

                          {/* Expanded Details */}
                          <CollapsibleContent>
                            <div className="px-3 pb-3 pt-0 border-t">
                              <div className="grid grid-cols-2 gap-3 pt-3">
                                {/* Volume */}
                                <div className="flex items-center gap-2">
                                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                                  <div>
                                    <p className="text-xs text-muted-foreground">Volume</p>
                                    <p className="text-sm font-medium">{listing.volume}</p>
                                  </div>
                                </div>

                                {/* Next Harvest */}
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-4 w-4 text-muted-foreground" />
                                  <div>
                                    <p className="text-xs text-muted-foreground">Harvest</p>
                                    <p className="text-sm font-medium">{listing.nextHarvest}</p>
                                  </div>
                                </div>

                                {/* Quality Score */}
                                <div className="flex items-center gap-2">
                                  <Shield className="h-4 w-4 text-muted-foreground" />
                                  <div>
                                    <p className="text-xs text-muted-foreground">Quality</p>
                                    <p className="text-sm font-medium">{listing.quality}%</p>
                                  </div>
                                </div>

                                {/* Inquiries */}
                                <div className="flex items-center gap-2">
                                  <Bell className="h-4 w-4 text-muted-foreground" />
                                  <div>
                                    <p className="text-xs text-muted-foreground">Inquiries</p>
                                    <p className="text-sm font-medium">{listing.inquiries}</p>
                                  </div>
                                </div>
                              </div>

                              {/* Moisture (if applicable) */}
                              {listing.moisture !== null && (
                                <div className="mt-3 pt-3 border-t">
                                  <div className="flex items-center justify-between text-xs">
                                    <span className="flex items-center gap-1 text-muted-foreground">
                                      <Droplets className="h-3 w-3" />
                                      Moisture Content
                                    </span>
                                    <span className="font-medium">{listing.moisture}%</span>
                                  </div>
                                  <Progress value={listing.moisture * 5} className="h-1.5 mt-1" />
                                </div>
                              )}

                              {/* Actions */}
                              <div className="flex gap-2 mt-3 pt-3 border-t">
                                <Link href={`/feedstock/${listing.id}`} className="flex-1">
                                  <Button variant="outline" size="sm" className="w-full text-xs">
                                    <Eye className="h-3 w-3 mr-1" />
                                    View
                                  </Button>
                                </Link>
                                <Link href={`/feedstock/edit/${listing.id}`} className="flex-1">
                                  <Button variant="outline" size="sm" className="w-full text-xs">
                                    Edit
                                  </Button>
                                </Link>
                              </div>
                            </div>
                          </CollapsibleContent>
                        </div>
                      </Collapsible>
                    ))
                  )}
                </div>
              </div>
            </div>
          </ScrollArea>
        </div>

        {/* Map Area */}
        <div className="flex-1 relative min-h-[400px] lg:min-h-0">
          <MapView
            className="w-full h-full"
            initialCenter={{ lat: -33.8688, lng: 151.2093 }}
            initialZoom={6}
            onMapReady={handleMapReady}
          />

          {/* Map Legend */}
          <div className="absolute bottom-4 left-4 bg-card/95 backdrop-blur p-3 rounded-lg shadow-lg border">
            <h4 className="text-xs font-semibold mb-2">My Feedstocks</h4>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs">
                <div className="h-3 w-3 rounded-full bg-emerald-500" />
                <span>Active ({MY_LISTINGS.filter((l) => l.status === "active").length})</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="h-3 w-3 rounded-full bg-amber-500" />
                <span>Pending ({MY_LISTINGS.filter((l) => l.status === "pending").length})</span>
              </div>
            </div>
          </div>

          {/* Quick Add Button */}
          <Link href="/feedstock/create">
            <Button
              className="absolute bottom-4 right-4 shadow-lg"
              size="lg"
            >
              <Plus className="h-5 w-5 mr-2" />
              Add Feedstock
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
