/**
 * ABFI Grower Dashboard - Premium SaaS Experience
 *
 * Features:
 * - Generous spacing and clear information hierarchy
 * - Premium typography and component design
 * - Logical information architecture
 * - No cramped elements or maze-like navigation
 * - High-end iconography and cursor effects
 */

import { useState, useEffect } from "react";
import { PanelLeftClose, PanelLeft, Plus, Bell, MapPin, Calendar, TrendingUp, AlertTriangle, Upload, Eye, Clock, Droplets, Thermometer, Shield, Star, ExternalLink, RefreshCw } from "lucide-react";
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
import { PlatformMap } from "@/components/maps/PlatformMap";
import { CarbonWallet } from "@/components/carbon/CarbonWallet";
import { RefreshButton } from "@/components/ui/RefreshButton";
import {
  Leaf,
  FileText,
  CheckCircle2,
  Circle,
  ChevronRight,
  ChevronDown,
  Sprout,
  DollarSign,
  ArrowRight,
  Wallet,
} from "lucide-react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";
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
    price: 1200,
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
    price: 800,
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
    <div className="min-h-screen bg-background premium-fade-in">
      {/* Onboarding Modal */}
      <OnboardingModal
        isOpen={showOnboarding}
        onClose={() => setShowOnboarding(false)}
        userRole="grower"
      />

      {/* Premium Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="premium-container flex h-20 items-center justify-between">
          {/* Logo and Title */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center">
                <Leaf className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="premium-heading-xl text-foreground">Grower Dashboard</h1>
                <p className="text-sm text-muted-foreground">Manage your feedstock operations</p>
              </div>
            </div>
          </div>

          {/* Header Actions */}
          <div className="flex items-center space-x-3">
            <RefreshButton
              onRefresh={() => {
                // Implement refresh logic
                console.log('Refreshing dashboard data...');
              }}
              isLoading={false}
              label="Refresh"
            />
            <Button variant="ghost" size="sm" className="premium-button">
              <Bell className="h-5 w-5" />
            </Button>
            <Badge variant="secondary" className="px-3 py-1">Premium Account</Badge>
          </div>
        </div>
      </header>

      {/* Quick Stats Bar - Premium Version */}
      <div className="border-b bg-gradient-to-r from-primary/5 to-secondary/5 py-3 px-4">
        <div className="premium-container">
          <div className="flex items-center justify-center gap-8">
            {QUICK_STATS.map((stat, index) => (
              <div key={index} className="flex items-center gap-3 px-4 py-2 rounded-lg bg-background/80 backdrop-blur-sm border border-primary/10">
                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                  <stat.icon className={cn("h-4 w-4 text-primary")} aria-hidden="true" />
                </div>
                <div className="text-center">
                  <div className="premium-metric text-primary">{stat.value}</div>
                  <div className="text-xs text-muted-foreground">{stat.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content - Premium Layout */}
      <main className="premium-container premium-section">
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

              {/* Beema Bamboo Base-Load Section */}
              <Card className="border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
                <CardHeader className="pb-2 pt-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm flex items-center gap-2 text-gray-900">
                      <Sprout className="h-4 w-4 text-green-600" />
                      Base-load Supply
                    </CardTitle>
                    <Badge className="bg-green-600 text-white text-[10px]">
                      NEW
                    </Badge>
                  </div>
                  <CardDescription className="text-xs">
                    Beema Bamboo - 15-year contracted revenue
                  </CardDescription>
                </CardHeader>
                <CardContent className="pb-4 space-y-3">
                  {/* Mock Beema plot data - would come from API */}
                  <div className="p-3 rounded-lg bg-white border border-green-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-muted-foreground">Hectares Planted</span>
                      <span className="text-sm font-semibold">50 ha</span>
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-muted-foreground">First Harvest</span>
                      <span className="text-sm font-semibold">Jun 2026</span>
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-muted-foreground">Projected Annual</span>
                      <span className="text-sm font-semibold text-green-700">2,750 t DM</span>
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-muted-foreground">Contracted Price</span>
                      <span className="text-sm font-semibold">$85/t + 3%/yr</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Contract End</span>
                      <span className="text-sm font-semibold">Jun 2039</span>
                    </div>
                    <div className="mt-3 pt-3 border-t border-green-100">
                      <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Verified & Active
                      </Badge>
                    </div>
                  </div>
                  
                  {/* CTA for users without Beema */}
                  <div className="text-center pt-2">
                    <p className="text-xs text-muted-foreground mb-2">
                      Lock in 15-year revenue certainty
                    </p>
                    <Link href="/beema-bamboo">
                      <Button size="sm" variant="outline" className="w-full gap-2 border-green-300 text-green-700 hover:bg-green-50">
                        <Sprout className="h-4 w-4" />
                        Learn About Beema
                        <ArrowRight className="h-3 w-3" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>

              {/* Carbon Wallet Section */}
              <Card className="border-green-200">
                <CardHeader className="pb-2 pt-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm flex items-center gap-2 text-gray-900">
                      <Wallet className="h-4 w-4 text-green-600" />
                      Carbon Assets
                    </CardTitle>
                    <Badge variant="outline" className="text-[10px] border-green-300 text-green-700">
                      CorTenX
                    </Badge>
                  </div>
                  <CardDescription className="text-xs">
                    ACCUs, SMCs & GOs from Clean Energy Regulator
                  </CardDescription>
                </CardHeader>
                <CardContent className="pb-4">
                  <CarbonWallet />
                </CardContent>
              </Card>
              
              {/* Spot Market Listings */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <H3 className="text-sm flex items-center gap-2">
                    <Leaf className="h-4 w-4 text-[#D4AF37]" aria-hidden="true" />
                    Spot Market Waste
                  </H3>
                  <Link href="/feedstock/create">
                    <Button size="sm" variant="outline" className="h-7 text-xs">
                      <Plus className="h-3 w-3 mr-1" />
                      Add
                    </Button>
                  </Link>
                </div>
                <p className="text-xs text-muted-foreground mb-3">
                  Your verified Beema profile lets buyers trust your spot tonnes—list instantly.
                </p>

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
        {/* Priority Actions */}
        <section className="premium-section">
          <Card className="premium-card">
            <CardHeader className="pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-warning/10 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <CardTitle className="premium-heading">Priority Actions</CardTitle>
                  <CardDescription className="premium-body">
                    Complete these high-priority tasks to optimize your feedstock operations
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="premium-stagger space-y-premium">
                {PRIORITY_ACTIONS.map((action, index) => (
                  <Link key={action.id} href={action.href}>
                    <div
                      className={cn(
                        "flex items-center justify-between p-6 rounded-xl border transition-all hover:shadow-lg cursor-pointer group",
                        action.priority === "high"
                          ? "border-warning/30 bg-warning/5 hover:border-warning/50 hover:bg-warning/10"
                          : "border-muted hover:border-primary/30 hover:bg-primary/5"
                      )}
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <div className="flex items-center space-x-4">
                        <div className={cn(
                          "w-12 h-12 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform",
                          action.priority === "high"
                            ? "bg-warning/10"
                            : "bg-primary/10"
                        )}>
                          <action.icon className={cn(
                            "h-6 w-6",
                            action.priority === "high"
                              ? "text-warning"
                              : "text-primary"
                          )} />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg mb-1">{action.title}</h3>
                          <p className="text-muted-foreground">{action.description}</p>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Beema Bamboo & Carbon Assets */}
        <div className="premium-grid">
          {/* Beema Bamboo Section */}
          <Card className="premium-card border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
                    <Leaf className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="premium-heading">Base-load Supply – Beema Bamboo</CardTitle>
                    <CardDescription className="premium-body">15-year guaranteed revenue from perennial biomass</CardDescription>
                  </div>
                </div>
                <Badge className="bg-primary text-white">NEW</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="text-center p-4 rounded-lg bg-background/80">
                  <p className="text-sm text-muted-foreground mb-1">Hectares Planted</p>
                  <p className="premium-metric text-primary">50 ha</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-background/80">
                  <p className="text-sm text-muted-foreground mb-1">First Harvest</p>
                  <p className="premium-metric text-secondary">Jun 2026</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-background/80">
                  <p className="text-sm text-muted-foreground mb-1">Projected Annual</p>
                  <p className="premium-metric text-success">2,750 t DM</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-background/80">
                  <p className="text-sm text-muted-foreground mb-1">Contract Price</p>
                  <p className="premium-metric">$85/t + 3%/yr</p>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-success/10 rounded-lg border border-success/20">
                <div className="flex items-center space-x-3">
                  <Shield className="h-5 w-5 text-success" />
                  <div>
                    <p className="font-semibold text-success">Verified & Active</p>
                    <p className="text-sm text-muted-foreground">Contract ends Jun 2039</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="text-success border-success hover:bg-success/10">
                  View Contract
                </Button>
              </div>

              <Button className="w-full premium-button bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90">
                Learn About Beema
              </Button>
            </CardContent>
          </Card>

          {/* Carbon Wallet */}
          <Card className="premium-card border-secondary/20">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-secondary/10 rounded-lg flex items-center justify-center">
                    <Droplets className="h-5 w-5 text-secondary" />
                  </div>
                  <div>
                    <CardTitle className="premium-heading">Carbon Assets</CardTitle>
                    <CardDescription className="premium-body">ACCUs, SMCs & GOs from Clean Energy Regulator</CardDescription>
                  </div>
                </div>
                <Badge variant="secondary" className="text-secondary bg-secondary/10">CorTenX</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <CarbonWallet />
            </CardContent>
          </Card>
        </div>

        {/* Feedstock Listings */}
        <section className="premium-section">
          <Card className="premium-card">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="premium-heading">Spot Market Waste</CardTitle>
                  <CardDescription className="premium-body">
                    Your verified Beema profile lets buyers trust your spot tonnes—list instantly
                  </CardDescription>
                </div>
                <Button className="premium-button">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Listing
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-premium premium-stagger">
                {MY_LISTINGS.map((listing, index) => (
                  <div
                    key={listing.id}
                    className="p-6 rounded-xl border border-muted hover:border-primary/30 hover:shadow-lg transition-all cursor-pointer group"
                    style={{ animationDelay: `${index * 100}ms` }}
                    onClick={() => focusOnListing(listing)}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className={cn(
                          "w-12 h-12 rounded-lg flex items-center justify-center",
                          listing.status === "active"
                            ? "bg-primary/10"
                            : "bg-secondary/10"
                        )}>
                          {listing.type === "Canola" ? (
                            <Leaf className="h-6 w-6 text-primary" />
                          ) : (
                            <Droplets className="h-6 w-6 text-secondary" />
                          )}
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
                            {listing.name}
                          </h3>
                          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                            <span className="flex items-center space-x-1">
                              <MapPin className="h-4 w-4" />
                              <span>{listing.location.label}</span>
                            </span>
                            <span>{listing.type}</span>
                            <Badge variant={listing.status === "active" ? "secondary" : "outline"}
                                   className={listing.status === "active" ? "text-green-600 bg-green-50" : ""}>
                              {listing.status === "active" ? "Active" : "Under Review"}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="premium-metric text-success">
                          ${listing.price}/t
                        </div>
                        <div className="flex items-center space-x-1 mt-1">
                          <Star className="h-4 w-4 text-yellow-400 fill-current" />
                          <span className="text-sm font-medium">{listing.rating}</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-6">
                      <div>
                        <p className="text-sm text-muted-foreground">Available Volume</p>
                        <p className="font-semibold">{listing.volume}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Quality Score</p>
                        <p className="font-semibold">{listing.quality}/100</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Next Harvest</p>
                        <p className="font-semibold">{listing.nextHarvest}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Interactive Map */}
        <section className="premium-section">
          <Card className="premium-card">
            <CardHeader className="pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-coastal/10 rounded-lg flex items-center justify-center">
                  <MapPin className="h-5 w-5 text-coastal" />
                </div>
                <div>
                  <CardTitle className="premium-heading">Feedstock Map</CardTitle>
                  <CardDescription className="premium-body">
                    Interactive map of your listings and market opportunities
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-96 rounded-lg overflow-hidden border">
                <PlatformMap
                  preset="grower"
                  height="100%"
                  showControls={true}
                  showLayerPanel={true}
                  enableFeedstockLayer={true}
                />
              </div>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}
