/**
 * Grower Dashboard - Nextgen Design
 *
 * Features:
 * - Feedstock producer overview
 * - Contract management
 * - Certification tracking
 * - Market opportunity alerts
 * - Typography components for consistent styling
 */

import { useState, useEffect } from "react";
import { PanelLeftClose, PanelLeft } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from"@/components/ui/Card";
import { Button } from"@/components/ui/Button";
import { Badge } from"@/components/ui/badge";
import { Progress } from"@/components/ui/progress";
import { ScrollArea } from"@/components/ui/scroll-area";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from"@/components/ui/collapsible";
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
import { PlatformMap } from "@/components/maps/PlatformMap";
import { H3, Body, MetricValue } from "@/components/Typography";
import { OnboardingModal } from "@/components/OnboardingModal";

// Onboarding checklist items
const ONBOARDING_CHECKLIST = [
  { id:"account", label:"Create Account", completed: true },
  { id:"profile", label:"Business Profile", completed: true },
  { id:"feedstock", label:"Register Feedstock", completed: false },
  { id:"certification", label:"Upload Certifications", completed: false },
  { id:"verification", label:"Complete Verification", completed: false },
];

// Priority actions - smart recommendations based on user state
const PRIORITY_ACTIONS = [
  {
    id:"register",
    title:"Register Your First Feedstock",
    description:"Start by adding your feedstock details to get discovered by buyers",
    icon: Plus,
    priority:"high",
    href:"/feedstock/create",
    cta:"Add Feedstock",
  },
  {
    id:"certification",
    title:"Upload Sustainability Certification",
    description:"ISCC or RSB certification increases buyer confidence",
    icon: Upload,
    priority:"medium",
    href:"/certificate/upload",
    cta:"Upload Certificate",
  },
  {
    id:"inquiry",
    title:"New Inquiry Received",
    description:"Biodiesel Australia is interested in your canola supply",
    icon: Bell,
    priority:"high",
    href:"/inquiries/supplier",
    cta:"View Inquiry",
  },
];

// Mock feedstock listings (would come from API in production)
const MY_LISTINGS = [
  {
    id:"1",
    name:"North Field Canola",
    type:"Canola",
    location: { lat: -33.8688, lng: 151.2093, label:"Dubbo, NSW" },
    status:"active",
    volume:"2,500 t/yr",
    rating:"A+",
    nextHarvest:"Mar 2025",
    moisture: 8.2,
    quality: 94,
    inquiries: 3,
  },
  {
    id:"2",
    name:"South Paddock Tallow",
    type:"Tallow",
    location: { lat: -37.8136, lng: 144.9631, label:"Geelong, VIC" },
    status:"pending",
    volume:"800 t/yr",
    rating:"B+",
    nextHarvest:"Continuous",
    moisture: null,
    quality: 87,
    inquiries: 1,
  },
];

// Quick stats
const QUICK_STATS = [
  { label:"Active Listings", value:"2", icon: Leaf, color:"text-[#D4AF37]" },
  { label:"Total Volume", value:"3,300 t", icon: TrendingUp, color:"text-blue-600" },
  { label:"Pending Inquiries", value:"4", icon: Bell, color:"text-[#D4AF37]" },
  { label:"Avg. Rating", value:"A", icon: Star, color:"text-purple-600" },
];

export default function GrowerDashboard() {
  const [selectedListing, setSelectedListing] = useState<string | null>(null);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Check if user should see onboarding
  useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem('abfi_onboarding_completed');
    const hasSkippedOnboarding = localStorage.getItem('abfi_onboarding_skipped');
    
    if (!hasSeenOnboarding && !hasSkippedOnboarding) {
      const timer = setTimeout(() => setShowOnboarding(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);
  const completedSteps = ONBOARDING_CHECKLIST.filter((item) => item.completed).length;
  const totalSteps = ONBOARDING_CHECKLIST.length;
  const progressPercent = (completedSteps / totalSteps) * 100;


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
    // PlatformMap handles its own map state internally
    };

  return (
    <div className="min-h-screen bg-background">
      {/* Onboarding Modal */}
      <OnboardingModal
        isOpen={showOnboarding}
        onClose={() => setShowOnboarding(false)}
        userRole="grower"
      />
      {/* Compact Stats Bar */}
      <div className="border-b bg-card/50 py-1.5 px-4">
        <div className="flex items-center justify-center gap-6 text-xs">
          {QUICK_STATS.map((stat, index) => (
            <div key={index} className="flex items-center gap-1.5">
              <stat.icon className={cn("h-3.5 w-3.5", stat.color)} aria-hidden="true" />
              <span className="font-medium">{stat.value}</span>
              <span className="text-muted-foreground">{stat.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content - Sidebar + Map Layout */}
      <div className="flex h-[calc(100vh-100px)]">
        {/* Collapsible Sidebar */}
        <div
          className={cn(
            "border-r bg-card transition-all duration-300 flex flex-col",
            sidebarOpen ? "w-80" : "w-0 overflow-hidden"
          )}
        >
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-4">
              {/* Onboarding Progress (if incomplete) */}
              {progressPercent < 100 && (
                <Card className="border-emerald-200 bg-emerald-50/50">
                  <CardHeader className="pb-2 pt-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm flex items-center gap-2 text-gray-900">
                        <CheckCircle2 className="h-4 w-4 text-[#D4AF37]" aria-hidden="true" />
                        Complete Setup
                      </CardTitle>
                      <Badge variant="outline" className="text-xs bg-emerald-100 text-emerald-700">
                        {Math.round(progressPercent)}%
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-4">
                    <Progress
                      value={progressPercent}
                      className="h-1.5 mb-3"
                      aria-label={`Setup progress: ${Math.round(progressPercent)}% complete`}
                    />
                    <div className="space-y-1">
                      {ONBOARDING_CHECKLIST.map((item) => (
                        <div
                          key={item.id}
                          className={cn(
"flex items-center gap-2 text-xs",
                            item.completed ?"text-emerald-700" :"text-gray-600"
                          )}
                        >
                          {item.completed ? (
                            <CheckCircle2 className="h-3 w-3 text-[#D4AF37]" />
                          ) : (
                            <Circle className="h-3 w-3" />
                          )}
                          <span className={item.completed ? "line-through text-gray-900" : ""}>
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
                <H3 className="text-sm  mb-3 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-[#D4AF37]" aria-hidden="true" />
                  Priority Actions
                </H3>
                <div className="space-y-2">
                  {PRIORITY_ACTIONS.map((action) => (
                    <Link key={action.id} href={action.href}>
                      <div
                        className={cn(
"p-3 rounded-lg border cursor-pointer transition-all hover:shadow-sm",
                          action.priority ==="high"
                            ?"border-amber-200 bg-amber-50/50 hover:border-amber-300"
                            :"border-border hover:border-primary/30"
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={cn(
"h-8 w-8 rounded-lg flex items-center justify-center shrink-0",
                              action.priority ==="high"
                                ?"bg-[#D4AF37]/10"
                                :"bg-muted"
                            )}
                          >
                            <action.icon
                              className={cn(
"h-4 w-4",
                                action.priority ==="high"
                                  ?"text-[#D4AF37]"
                                  :"text-gray-600"
                              )}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">{action.title}</p>
                            <p className="text-xs text-gray-600 line-clamp-1">
                              {action.description}
                            </p>
                          </div>
                          <ChevronRight className="h-4 w-4 text-gray-600 shrink-0" />
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              {/* My Listings */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <H3 className="text-sm  flex items-center gap-2">
                    <Leaf className="h-4 w-4 text-[#D4AF37]" aria-hidden="true" />
                    My Listings
                  </H3>
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
                      <Leaf className="h-8 w-8 mx-auto mb-2 text-gray-600/50" />
                      <p className="text-sm text-gray-600">No listings yet</p>
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
                              ?"border-primary ring-1 ring-primary/20"
                              :"hover:border-primary/30"
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
                                      listing.status ==="active"
                                        ?"bg-emerald-50 text-emerald-700 border-emerald-200"
                                        :"bg-amber-50 text-amber-700 border-amber-200"
                                    )}
                                  >
                                    {listing.status}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-2 mt-1 text-xs text-gray-600">
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
                                      ?"bg-emerald-100 text-emerald-800"
                                      :"bg-blue-100 text-blue-800"
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
                                    aria-label={expandedCards.has(listing.id) ? `Collapse ${listing.name} details` : `Expand ${listing.name} details`}
                                    aria-expanded={expandedCards.has(listing.id)}
                                  >
                                    <ChevronDown
                                      className={cn(
"h-4 w-4 transition-transform",
                                        expandedCards.has(listing.id) &&"rotate-180"
                                      )}
                                      aria-hidden="true"
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
                                  <TrendingUp className="h-4 w-4 text-gray-600" aria-hidden="true" />
                                  <div>
                                    <p className="text-xs text-gray-600">Volume</p>
                                    <p className="text-sm font-medium">{listing.volume}</p>
                                  </div>
                                </div>

                                {/* Next Harvest */}
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-4 w-4 text-gray-600" aria-hidden="true" />
                                  <div>
                                    <p className="text-xs text-gray-600">Harvest</p>
                                    <p className="text-sm font-medium">{listing.nextHarvest}</p>
                                  </div>
                                </div>

                                {/* Quality Score */}
                                <div className="flex items-center gap-2">
                                  <Shield className="h-4 w-4 text-gray-600" aria-hidden="true" />
                                  <div>
                                    <p className="text-xs text-gray-600">Quality</p>
                                    <p className="text-sm font-medium">{listing.quality}%</p>
                                  </div>
                                </div>

                                {/* Inquiries */}
                                <div className="flex items-center gap-2">
                                  <Bell className="h-4 w-4 text-gray-600" aria-hidden="true" />
                                  <div>
                                    <p className="text-xs text-gray-600">Inquiries</p>
                                    <p className="text-sm font-medium">{listing.inquiries}</p>
                                  </div>
                                </div>
                              </div>

                              {/* Moisture (if applicable) */}
                              {listing.moisture !== null && (
                                <div className="mt-3 pt-3 border-t">
                                  <div className="flex items-center justify-between text-xs">
                                    <span className="flex items-center gap-1 text-gray-600">
                                      <Droplets className="h-3 w-3" aria-hidden="true" />
                                      Moisture Content
                                    </span>
                                    <span className="font-medium">{listing.moisture}%</span>
                                  </div>
                                  <Progress
                                    value={listing.moisture * 5}
                                    className="h-1.5 mt-1"
                                    aria-label={`Moisture content: ${listing.moisture}%`}
                                  />
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
        <div className="flex-1 relative">
          {/* Sidebar Toggle Button */}
          <Button
            variant="outline"
            size="icon"
            className="absolute top-4 left-4 z-[1002] bg-card/90 backdrop-blur-sm shadow-md"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
            aria-expanded={sidebarOpen}
          >
            {sidebarOpen ? (
              <PanelLeftClose className="h-4 w-4" aria-hidden="true" />
            ) : (
              <PanelLeft className="h-4 w-4" aria-hidden="true" />
            )}
          </Button>
          
          {/* Full Screen Map */}
          <PlatformMap
            preset="grower"
            height="100%"
            showControls={true}
            showLayerPanel={true}
            enableFeedstockLayer={true}
          />

          {/* Quick Add Button - Bottom Right */}
          <Link href="/feedstock/create">
            <Button
              className="absolute bottom-4 right-4 shadow-lg z-[1001]"
              size="sm"
            >
              <Plus className="h-4 w-4 mr-1" aria-hidden="true" />
              Add Feedstock
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
