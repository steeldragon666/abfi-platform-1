/**
 * Futures Detail Supplier - Nextgen Design
 *
 * Features:
 * - Futures listing management for suppliers
 * - EOI review and response workflow
 * - Listing visibility and status controls
 * - Edit and delete functionality
 * - Typography components for consistent styling
 */

import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PageLayout } from "@/components/layout";
import { trpc } from "@/lib/trpc";
import { formatDate } from "@/const";
import { H1, H2, H3, Body, MetricValue, DataLabel } from "@/components/Typography";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  TreeDeciduous,
  Sprout,
  Leaf,
  TrendingUp,
  DollarSign,
  Edit,
  Trash2,
  Send,
  Eye,
  EyeOff,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  Building2,
  Phone,
  Mail,
  Sparkles,
  Shield,
  BarChart3,
  FileText,
} from "lucide-react";
import { useState } from "react";
import { Link, useRoute, useLocation, useSearch } from "wouter";
import { toast } from "sonner";

// Mock data for demonstration - keyed by ID to match marketplace listings
const MOCK_FUTURES_MAP: Record<number, any> = {
  1: {
    id: 1,
    futuresId: "FUT-2025-0001",
    title: "Blue Mallee Eucalyptus - Certified Sustainable Plantation",
    description:
      "Large-scale eucalyptus plantation in Victoria's Mallee region, managed for sustainable biomass production. Established plantation with proven yield history. First rotation harvest completed successfully.",
    cropType: "eucalyptus",
    cropVariety: "E. grandis",
    state: "VIC",
    region: "Mallee Region",
    landAreaHectares: "2500",
    landStatus: "owned",
    projectionStartYear: 2026,
    projectionEndYear: 2040,
    firstHarvestYear: 2026,
    totalProjectedTonnes: "145000",
    totalContractedTonnes: "20000",
    totalAvailableTonnes: "125000",
    indicativePricePerTonne: "85.00",
    priceEscalationPercent: "2.5",
    pricingNotes: "Base price indexed to CPI. Volume discounts available for commitments over 10,000 tonnes/year.",
    expectedCarbonIntensity: "15.5",
    expectedMoistureContent: "35",
    expectedEnergyContent: "18.5",
    status: "active",
    publishedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  2: {
    id: 2,
    futuresId: "FUT-2025-0002",
    title: "Giant Miscanthus Energy Crop - High Yield Variety",
    description:
      "High-yield miscanthus plantation in the fertile Riverina region. This perennial grass requires minimal inputs and provides consistent annual harvests.",
    cropType: "miscanthus",
    cropVariety: "Miscanthus x giganteus",
    state: "NSW",
    region: "Riverina",
    landAreaHectares: "1200",
    landStatus: "leased",
    projectionStartYear: 2026,
    projectionEndYear: 2035,
    firstHarvestYear: 2027,
    totalProjectedTonnes: "75000",
    totalContractedTonnes: "0",
    totalAvailableTonnes: "75000",
    indicativePricePerTonne: "95.00",
    priceEscalationPercent: "2.0",
    pricingNotes: "Fixed pricing with annual CPI adjustment. Flexible delivery terms.",
    expectedCarbonIntensity: "12.0",
    expectedMoistureContent: "20",
    expectedEnergyContent: "17.5",
    status: "active",
    publishedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  3: {
    id: 3,
    futuresId: "FUT-2025-0003",
    title: "Dendrocalamus Bamboo - Fast-Growing Biomass",
    description:
      "Premium bamboo plantation on Queensland's Sunshine Coast. Fast-growing tropical bamboo with exceptional biomass yields.",
    cropType: "bamboo",
    cropVariety: "Dendrocalamus asper",
    state: "QLD",
    region: "Sunshine Coast Hinterland",
    landAreaHectares: "3500",
    landStatus: "owned",
    projectionStartYear: 2025,
    projectionEndYear: 2045,
    firstHarvestYear: 2025,
    totalProjectedTonnes: "200000",
    totalContractedTonnes: "20000",
    totalAvailableTonnes: "180000",
    indicativePricePerTonne: "75.00",
    priceEscalationPercent: "2.5",
    pricingNotes: "Long-term contracts preferred. Volume bonuses available.",
    expectedCarbonIntensity: "10.0",
    expectedMoistureContent: "45",
    expectedEnergyContent: "16.0",
    status: "active",
    publishedAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
  },
  4: {
    id: 4,
    futuresId: "FUT-2025-0004",
    title: "Short Rotation Forestry - Mixed Hardwood",
    description:
      "Diverse short-rotation forestry operation in Tasmania's North East. Mixed hardwood species provide resilience and consistent yields.",
    cropType: "rotation_forestry",
    cropVariety: "Mixed Eucalyptus species",
    state: "TAS",
    region: "North East",
    landAreaHectares: "5000",
    landStatus: "owned",
    projectionStartYear: 2026,
    projectionEndYear: 2041,
    firstHarvestYear: 2028,
    totalProjectedTonnes: "320000",
    totalContractedTonnes: "40000",
    totalAvailableTonnes: "280000",
    indicativePricePerTonne: "65.00",
    priceEscalationPercent: "2.0",
    pricingNotes: "Competitive pricing for bulk contracts. Rail logistics available.",
    expectedCarbonIntensity: "14.0",
    expectedMoistureContent: "40",
    expectedEnergyContent: "18.0",
    status: "active",
    publishedAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
  5: {
    id: 5,
    futuresId: "FUT-2025-0005",
    title: "Industrial Hemp - Multi-Purpose Biomass",
    description:
      "Industrial hemp cultivation on Adelaide Plains. Fast-growing annual crop with multiple harvest cycles.",
    cropType: "hemp",
    cropVariety: "Industrial Hemp (low THC)",
    state: "SA",
    region: "Adelaide Plains",
    landAreaHectares: "800",
    landStatus: "leased",
    projectionStartYear: 2025,
    projectionEndYear: 2030,
    firstHarvestYear: 2025,
    totalProjectedTonnes: "45000",
    totalContractedTonnes: "0",
    totalAvailableTonnes: "45000",
    indicativePricePerTonne: "120.00",
    priceEscalationPercent: "3.0",
    pricingNotes: "Premium pricing reflects high-quality biomass. Flexible contract terms.",
    expectedCarbonIntensity: "8.0",
    expectedMoistureContent: "15",
    expectedEnergyContent: "17.0",
    status: "draft",
    publishedAt: null,
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  6: {
    id: 6,
    futuresId: "FUT-2025-0006",
    title: "Switchgrass - Low Input Energy Crop",
    description:
      "Native switchgrass plantation in Western Australia's South West. Low-input perennial grass with excellent drought tolerance.",
    cropType: "switchgrass",
    cropVariety: "Panicum virgatum",
    state: "WA",
    region: "South West",
    landAreaHectares: "1800",
    landStatus: "owned",
    projectionStartYear: 2026,
    projectionEndYear: 2036,
    firstHarvestYear: 2027,
    totalProjectedTonnes: "90000",
    totalContractedTonnes: "0",
    totalAvailableTonnes: "90000",
    indicativePricePerTonne: "88.00",
    priceEscalationPercent: "2.5",
    pricingNotes: "Competitive pricing for long-term offtake agreements.",
    expectedCarbonIntensity: "11.0",
    expectedMoistureContent: "25",
    expectedEnergyContent: "17.5",
    status: "active",
    publishedAt: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
  },
};

// Default mock futures for unknown IDs
const DEFAULT_MOCK_FUTURES = MOCK_FUTURES_MAP[1];

const MOCK_PROJECTIONS = [
  {
    projectionYear: 2025,
    projectedTonnes: "5000",
    contractedTonnes: "2000",
    confidencePercent: 90,
    harvestSeason: "autumn",
    notes: "Initial thinning",
  },
  {
    projectionYear: 2026,
    projectedTonnes: "12000",
    contractedTonnes: "5000",
    confidencePercent: 85,
    harvestSeason: "autumn",
    notes: "",
  },
  {
    projectionYear: 2027,
    projectedTonnes: "25000",
    contractedTonnes: "10000",
    confidencePercent: 80,
    harvestSeason: "autumn",
    notes: "First major harvest",
  },
  {
    projectionYear: 2028,
    projectedTonnes: "28000",
    contractedTonnes: "12000",
    confidencePercent: 80,
    harvestSeason: "autumn",
    notes: "",
  },
  {
    projectionYear: 2029,
    projectedTonnes: "30000",
    contractedTonnes: "15000",
    confidencePercent: 75,
    harvestSeason: "autumn",
    notes: "",
  },
  {
    projectionYear: 2030,
    projectedTonnes: "32000",
    contractedTonnes: "10000",
    confidencePercent: 75,
    harvestSeason: "autumn",
    notes: "",
  },
  {
    projectionYear: 2031,
    projectedTonnes: "32000",
    contractedTonnes: "8000",
    confidencePercent: 70,
    harvestSeason: "autumn",
    notes: "",
  },
  {
    projectionYear: 2032,
    projectedTonnes: "32000",
    contractedTonnes: "5000",
    confidencePercent: 70,
    harvestSeason: "autumn",
    notes: "",
  },
  {
    projectionYear: 2033,
    projectedTonnes: "30000",
    contractedTonnes: "3000",
    confidencePercent: 65,
    harvestSeason: "autumn",
    notes: "",
  },
  {
    projectionYear: 2034,
    projectedTonnes: "28000",
    contractedTonnes: "2000",
    confidencePercent: 65,
    harvestSeason: "autumn",
    notes: "",
  },
  {
    projectionYear: 2035,
    projectedTonnes: "28000",
    contractedTonnes: "3000",
    confidencePercent: 60,
    harvestSeason: "autumn",
    notes: "Second rotation begins",
  },
  {
    projectionYear: 2036,
    projectedTonnes: "25000",
    contractedTonnes: "5000",
    confidencePercent: 60,
    harvestSeason: "autumn",
    notes: "",
  },
  {
    projectionYear: 2037,
    projectedTonnes: "28000",
    contractedTonnes: "3000",
    confidencePercent: 55,
    harvestSeason: "autumn",
    notes: "",
  },
  {
    projectionYear: 2038,
    projectedTonnes: "30000",
    contractedTonnes: "2000",
    confidencePercent: 55,
    harvestSeason: "autumn",
    notes: "",
  },
  {
    projectionYear: 2039,
    projectedTonnes: "30000",
    contractedTonnes: "0",
    confidencePercent: 50,
    harvestSeason: "autumn",
    notes: "",
  },
  {
    projectionYear: 2040,
    projectedTonnes: "30000",
    contractedTonnes: "0",
    confidencePercent: 50,
    harvestSeason: "autumn",
    notes: "",
  },
];

const MOCK_EOIS = [
  {
    id: 1,
    eoiReference: "EOI-2025-0001",
    status: "pending",
    interestStartYear: 2026,
    interestEndYear: 2030,
    annualVolumeTonnes: "5000",
    totalVolumeTonnes: "25000",
    offeredPricePerTonne: "140.00",
    deliveryLocation: "Port of Newcastle",
    deliveryFrequency: "quarterly",
    additionalTerms:
      "Interested in long-term partnership. Can provide offtake guarantee.",
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    buyer: {
      id: 1,
      companyName: "AusEnergy Biomass Pty Ltd",
      contactEmail: "procurement@ausenergy.com.au",
      contactPhone: "+61 2 9876 5432",
    },
  },
  {
    id: 2,
    eoiReference: "EOI-2025-0002",
    status: "under_review",
    interestStartYear: 2027,
    interestEndYear: 2035,
    annualVolumeTonnes: "8000",
    totalVolumeTonnes: "72000",
    offeredPricePerTonne: "138.50",
    deliveryLocation: "Sydney Processing Hub",
    deliveryFrequency: "monthly",
    additionalTerms:
      "Major biofuel producer seeking reliable long-term supply. Can provide advance payments.",
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    buyer: {
      id: 2,
      companyName: "GreenFuels Australia",
      contactEmail: "supply@greenfuels.com.au",
      contactPhone: "+61 3 8765 4321",
    },
  },
  {
    id: 3,
    eoiReference: "EOI-2024-0089",
    status: "accepted",
    interestStartYear: 2025,
    interestEndYear: 2028,
    annualVolumeTonnes: "6000",
    totalVolumeTonnes: "24000",
    offeredPricePerTonne: "132.00",
    deliveryLocation: "Brisbane Industrial Park",
    deliveryFrequency: "quarterly",
    supplierResponse:
      "Thank you for your interest. We are pleased to accept and look forward to finalizing the contract.",
    respondedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    buyer: {
      id: 3,
      companyName: "Pacific Bioenergy Corp",
      contactEmail: "contracts@pacificbio.com",
      contactPhone: "+61 7 3456 7890",
    },
  },
];

const CROP_TYPE_LABELS: Record<string, string> = {
  bamboo: "Bamboo",
  rotation_forestry: "Rotation Forestry",
  eucalyptus: "Eucalyptus",
  poplar: "Poplar",
  willow: "Willow",
  miscanthus: "Miscanthus",
  switchgrass: "Switchgrass",
  arundo_donax: "Arundo Donax",
  hemp: "Industrial Hemp",
  other_perennial: "Other Perennial",
};

const CROP_TYPE_ICONS: Record<string, React.ReactNode> = {
  bamboo: <Sprout className="h-5 w-5" />,
  rotation_forestry: <TreeDeciduous className="h-5 w-5" />,
  eucalyptus: <TreeDeciduous className="h-5 w-5" />,
  poplar: <TreeDeciduous className="h-5 w-5" />,
  willow: <TreeDeciduous className="h-5 w-5" />,
  miscanthus: <Leaf className="h-5 w-5" />,
  switchgrass: <Leaf className="h-5 w-5" />,
  arundo_donax: <Leaf className="h-5 w-5" />,
  hemp: <Leaf className="h-5 w-5" />,
  other_perennial: <Sprout className="h-5 w-5" />,
};

const LAND_STATUS_LABELS: Record<string, string> = {
  owned: "Owned",
  leased: "Leased",
  under_negotiation: "Under Negotiation",
  planned_acquisition: "Planned Acquisition",
};

const EOI_STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  under_review: "Under Review",
  accepted: "Accepted",
  declined: "Declined",
  expired: "Expired",
  withdrawn: "Withdrawn",
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "active":
      return "bg-emerald-100 text-emerald-800 border-emerald-200";
    case "draft":
      return "bg-gray-100 text-gray-800 border-gray-200";
    case "partially_contracted":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "fully_contracted":
      return "bg-purple-100 text-purple-800 border-purple-200";
    case "expired":
      return "bg-orange-100 text-orange-800 border-orange-200";
    case "cancelled":
      return "bg-red-100 text-red-800 border-red-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

const getEOIStatusColor = (status: string) => {
  switch (status) {
    case "pending":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "under_review":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "accepted":
      return "bg-emerald-100 text-emerald-800 border-emerald-200";
    case "declined":
      return "bg-red-100 text-red-800 border-red-200";
    case "expired":
    case "withdrawn":
      return "bg-gray-100 text-gray-600 border-gray-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

const formatStatusLabel = (status: string) => {
  return status.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
};

export default function FuturesDetailSupplier() {
  const { user, loading: authLoading } = useAuth();
  const [, params] = useRoute("/supplier/futures/:id");
  const [, setLocation] = useLocation();
  const searchString = useSearch();
  const searchParams = new URLSearchParams(searchString);
  const initialTab = searchParams.get("tab") || "details";

  const futuresId = parseInt(params?.id || "0");

  const [respondDialogOpen, setRespondDialogOpen] = useState(false);
  const [selectedEOI, setSelectedEOI] = useState<any>(null);
  const [responseText, setResponseText] = useState("");
  const [respondAction, setRespondAction] = useState<
    "accepted" | "declined" | "under_review"
  >("under_review");

  const utils = trpc.useUtils();

  const {
    data: apiData,
    isLoading,
    error,
  } = trpc.futures.getById.useQuery(
    { id: futuresId },
    { enabled: !!user && futuresId > 0, retry: false }
  );

  const { data: apiEois, isLoading: loadingEOIs } =
    trpc.futures.getEOIsForFutures.useQuery(
      { futuresId },
      { enabled: !!user && futuresId > 0 && (apiData?.isOwner || !apiData) }
    );

  // Use ID-specific mock data if API returns empty or error
  const mockFutures = MOCK_FUTURES_MAP[futuresId] || DEFAULT_MOCK_FUTURES;
  const isUsingMockData = !apiData || !!error;
  const data = apiData || {
    futures: mockFutures,
    projections: MOCK_PROJECTIONS,
    isOwner: true,
  };
  const eois = apiEois && apiEois.length > 0 ? apiEois : MOCK_EOIS;

  const publishMutation = trpc.futures.publish.useMutation({
    onSuccess: () => {
      toast.success("Futures listing published!");
      utils.futures.getById.invalidate({ id: futuresId });
    },
    onError: error => toast.error(error.message),
  });

  const unpublishMutation = trpc.futures.unpublish.useMutation({
    onSuccess: () => {
      toast.success("Futures listing unpublished");
      utils.futures.getById.invalidate({ id: futuresId });
    },
    onError: error => toast.error(error.message),
  });

  const deleteMutation = trpc.futures.delete.useMutation({
    onSuccess: () => {
      toast.success("Futures listing deleted");
      setLocation("/supplier/futures");
    },
    onError: error => toast.error(error.message),
  });

  const respondMutation = trpc.futures.respondToEOI.useMutation({
    onSuccess: () => {
      toast.success("Response sent to buyer");
      setRespondDialogOpen(false);
      setSelectedEOI(null);
      setResponseText("");
      utils.futures.getEOIsForFutures.invalidate({ futuresId });
    },
    onError: error => toast.error(error.message),
  });

  if (authLoading || !user) {
    return (
      <PageLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center">
            <Skeleton className="h-8 w-64 mx-auto mb-4" />
            <Skeleton className="h-4 w-48 mx-auto" />
          </div>
        </div>
      </PageLayout>
    );
  }

  if (isLoading) {
    return (
      <PageLayout>
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-8 w-64 mb-4" />
          <Skeleton className="h-64 w-full" />
        </div>
      </PageLayout>
    );
  }

  const { futures, projections, isOwner } = data;

  if (!isOwner && !isUsingMockData) {
    return (
      <PageLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <Card className="max-w-md">
            <CardContent className="py-8 text-center">
              <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
              <p className="text-gray-600 mb-4">
                You don't have permission to view this futures listing.
              </p>
              <Link href="/supplier/futures">
                <Button variant="outline">Back to Futures</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </PageLayout>
    );
  }

  const totalProjected = parseFloat(futures.totalProjectedTonnes || "0");
  const totalContracted = parseFloat(futures.totalContractedTonnes || "0");
  const totalAvailable = parseFloat(futures.totalAvailableTonnes || "0");
  const contractedPercent =
    totalProjected > 0 ? (totalContracted / totalProjected) * 100 : 0;
  const availablePercent =
    totalProjected > 0 ? (totalAvailable / totalProjected) * 100 : 100;

  const pendingEOIs =
    eois?.filter((e: any) => ["pending", "under_review"].includes(e.status)) ||
    [];
  const acceptedEOIs = eois?.filter((e: any) => e.status === "accepted") || [];

  const openRespondDialog = (
    eoi: any,
    action: "accepted" | "declined" | "under_review"
  ) => {
    setSelectedEOI(eoi);
    setRespondAction(action);
    setResponseText("");
    setRespondDialogOpen(true);
  };

  const handleRespond = () => {
    if (!selectedEOI || isUsingMockData) return;
    respondMutation.mutate({
      eoiId: selectedEOI.id,
      status: respondAction,
      response: responseText || undefined,
    });
  };

  return (
    <PageLayout>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-[#D4AF37] via-emerald-600 to-green-700 text-black overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-10" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-400/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

        <div className="container mx-auto px-4 py-12 lg:py-16 relative z-10">
          {/* Back Link */}
          <Link href="/supplier/futures">
            <Button
              variant="ghost"
              className="mb-6 text-black/80 hover:text-black hover:bg-white/10"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to My Futures
            </Button>
          </Link>

          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="p-4 bg-white/20 backdrop-blur-sm rounded-2xl">
                {CROP_TYPE_ICONS[futures.cropType] || (
                  <Sprout className="h-8 w-8" />
                )}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-3 mb-2">
                  <H1 className="text-3xl md:text-4xl">
                    {futures.futuresId}
                  </H1>
                  <Badge className={getStatusColor(futures.status)}>
                    {formatStatusLabel(futures.status)}
                  </Badge>
                  {isUsingMockData && (
                    <Badge className="bg-[#D4AF37]/90 text-black border-amber-400">
                      <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                      Demo Data
                    </Badge>
                  )}
                </div>
                <p className="text-xl text-emerald-100 mb-3">{futures.title}</p>
                <div className="flex flex-wrap gap-4 text-sm text-emerald-200">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-4 w-4" />
                    {futures.state}
                    {futures.region && `, ${futures.region}`}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4" />
                    {futures.projectionStartYear} - {futures.projectionEndYear}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <TrendingUp className="h-4 w-4" />
                    {totalProjected.toLocaleString()} tonnes projected
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2">
              {futures.status === "draft" && !isUsingMockData && (
                <>
                  <Link href={`/supplier/futures/create?edit=${futures.id}`}>
                    <Button
                      variant="outline"
                      className="bg-white/10 border-white/30 text-black hover:bg-white/20"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  </Link>
                  <Button
                    onClick={() => publishMutation.mutate({ id: futures.id })}
                    disabled={publishMutation.isPending}
                    className="bg-white text-teal-700 hover:bg-white/90"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Publish
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        className="bg-red-500/20 border-red-300/50 text-black hover:bg-red-500/30"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          Delete Futures Listing?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently
                          delete this futures listing.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() =>
                            deleteMutation.mutate({ id: futures.id })
                          }
                          className="bg-destructive text-destructive-foreground"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </>
              )}
              {futures.status === "active" && !isUsingMockData && (
                <Button
                  variant="outline"
                  onClick={() => unpublishMutation.mutate({ id: futures.id })}
                  className="bg-white/10 border-white/30 text-black hover:bg-white/20"
                >
                  <EyeOff className="h-4 w-4 mr-2" />
                  Unpublish
                </Button>
              )}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <DataLabel className="text-emerald-200 mb-1">Total Projected</DataLabel>
              <MetricValue className="text-2xl">
                {totalProjected.toLocaleString()}t
              </MetricValue>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <DataLabel className="text-emerald-200 mb-1">Contracted</DataLabel>
              <MetricValue className="text-2xl text-blue-300">
                {totalContracted.toLocaleString()}t
              </MetricValue>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <DataLabel className="text-emerald-200 mb-1">Available</DataLabel>
              <MetricValue className="text-2xl text-emerald-300">
                {totalAvailable.toLocaleString()}t
              </MetricValue>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <DataLabel className="text-emerald-200 mb-1">Pending EOIs</DataLabel>
              <MetricValue className="text-2xl text-yellow-300">
                {pendingEOIs.length}
              </MetricValue>
            </div>
          </div>
        </div>
      </section>

      {/* Tabs Content */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          <Tabs defaultValue={initialTab} className="space-y-6">
            <TabsList className="bg-muted/50 p-1">
              <TabsTrigger value="details" className="gap-2">
                <FileText className="h-4 w-4" />
                Details
              </TabsTrigger>
              <TabsTrigger value="projections" className="gap-2">
                <BarChart3 className="h-4 w-4" />
                Projections ({projections?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="eois" className="gap-2">
                <Users className="h-4 w-4" />
                EOIs
                {eois && eois.length > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {eois.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            {/* Details Tab */}
            <TabsContent value="details" className="space-y-6">
              {/* Volume Progress */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-[#D4AF37]" />
                    Volume Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="bg-muted/50 rounded-xl p-5 text-center">
                      <DataLabel className="text-gray-600 mb-1">
                        Total Projected
                      </DataLabel>
                      <MetricValue className="text-3xl">
                        {totalProjected.toLocaleString()}t
                      </MetricValue>
                    </div>
                    <div className="bg-blue-50 rounded-xl p-5 text-center border border-blue-100">
                      <DataLabel className="text-blue-600 mb-1">Contracted</DataLabel>
                      <MetricValue className="text-3xl text-blue-700">
                        {totalContracted.toLocaleString()}t
                      </MetricValue>
                      <DataLabel className="text-blue-500 mt-1">
                        {contractedPercent.toFixed(1)}% of total
                      </DataLabel>
                    </div>
                    <div className="bg-emerald-50 rounded-xl p-5 text-center border border-emerald-100">
                      <DataLabel className="text-[#D4AF37] mb-1">Available</DataLabel>
                      <MetricValue className="text-3xl text-emerald-700">
                        {totalAvailable.toLocaleString()}t
                      </MetricValue>
                      <DataLabel className="text-[#D4AF37] mt-1">
                        {availablePercent.toFixed(1)}% of total
                      </DataLabel>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-600">
                        Availability Progress
                      </span>
                      <span className="font-medium">
                        {Math.round(availablePercent)}% available
                      </span>
                    </div>
                    <div className="relative h-4 bg-muted rounded-full overflow-hidden">
                      <div
                        className="absolute left-0 top-0 h-full bg-blue-500 transition-all"
                        style={{ width: `${contractedPercent}%` }}
                      />
                      <div
                        className="absolute top-0 h-full bg-[#D4AF37] transition-all"
                        style={{
                          left: `${contractedPercent}%`,
                          width: `${availablePercent}%`,
                        }}
                      />
                    </div>
                    <div className="flex gap-4 mt-2 text-xs">
                      <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 bg-blue-500 rounded" />
                        <span>
                          Contracted ({contractedPercent.toFixed(1)}%)
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 bg-[#D4AF37] rounded" />
                        <span>Available ({availablePercent.toFixed(1)}%)</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Details Grid */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* Crop & Location */}
                <Card>
                  <CardHeader>
                    <CardTitle>Crop & Location</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-emerald-100 rounded-xl">
                        {CROP_TYPE_ICONS[futures.cropType] || (
                          <Sprout className="h-6 w-6 text-[#D4AF37]" />
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-lg">
                          {CROP_TYPE_LABELS[futures.cropType]}
                        </p>
                        {futures.cropVariety && (
                          <p className="text-sm text-gray-600">
                            {futures.cropVariety}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-sm p-3 bg-muted/30 rounded-lg">
                      <MapPin className="h-4 w-4 text-gray-600" />
                      <span className="font-medium">
                        {futures.state}
                        {futures.region && `, ${futures.region}`}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-3 border-t">
                      <div>
                        <p className="text-sm text-gray-600">
                          Land Area
                        </p>
                        <p className="font-semibold font-mono">
                          {parseFloat(
                            futures.landAreaHectares
                          ).toLocaleString()}{" "}
                          ha
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">
                          Land Status
                        </p>
                        <p className="font-semibold">
                          {LAND_STATUS_LABELS[futures.landStatus || "owned"]}
                        </p>
                      </div>
                    </div>

                    {futures.description && (
                      <div className="pt-3 border-t">
                        <p className="text-sm text-gray-600 mb-2">
                          Description
                        </p>
                        <p className="text-sm leading-relaxed">
                          {futures.description}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Timeline & Pricing */}
                <Card>
                  <CardHeader>
                    <CardTitle>Timeline & Pricing</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-2 text-sm p-3 bg-muted/30 rounded-lg">
                      <Calendar className="h-4 w-4 text-gray-600" />
                      <span className="font-medium">
                        {futures.projectionStartYear} -{" "}
                        {futures.projectionEndYear} (
                        {futures.projectionEndYear -
                          futures.projectionStartYear +
                          1}{" "}
                        years)
                      </span>
                    </div>

                    {futures.firstHarvestYear && (
                      <div className="text-sm p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                        <span className="text-emerald-700">
                          First Harvest:{" "}
                        </span>
                        <span className="font-semibold text-emerald-800">
                          {futures.firstHarvestYear}
                        </span>
                      </div>
                    )}

                    <div className="pt-3 border-t">
                      <div className="flex items-center gap-2 mb-3">
                        <DollarSign className="h-4 w-4 text-gray-600" />
                        <span className="font-semibold">Pricing</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 bg-teal-50 rounded-lg border border-teal-100">
                          <p className="text-xs text-[#D4AF37] mb-1">
                            Indicative Price
                          </p>
                          <p className="font-bold text-lg text-teal-800 font-mono">
                            {futures.indicativePricePerTonne
                              ? `$${parseFloat(futures.indicativePricePerTonne).toFixed(2)}/t`
                              : "Negotiable"}
                          </p>
                        </div>
                        <div className="p-3 bg-muted/50 rounded-lg">
                          <p className="text-xs text-gray-600 mb-1">
                            Annual Escalation
                          </p>
                          <p className="font-bold text-lg font-mono">
                            {futures.priceEscalationPercent || "2.5"}%
                          </p>
                        </div>
                      </div>
                      {futures.pricingNotes && (
                        <p className="text-sm text-gray-600 mt-3 italic">
                          {futures.pricingNotes}
                        </p>
                      )}
                    </div>

                    {/* Quality Parameters */}
                    {(futures.expectedCarbonIntensity ||
                      futures.expectedMoistureContent ||
                      futures.expectedEnergyContent) && (
                      <div className="pt-3 border-t">
                        <p className="text-sm font-semibold mb-3">
                          Expected Quality
                        </p>
                        <div className="grid grid-cols-3 gap-3">
                          {futures.expectedCarbonIntensity && (
                            <div className="text-center p-2 bg-muted/30 rounded-lg">
                              <DataLabel className="text-gray-600">
                                Carbon
                              </DataLabel>
                              <MetricValue className="text-sm">
                                {futures.expectedCarbonIntensity}
                              </MetricValue>
                              <DataLabel className="text-[10px] text-gray-600">
                                kg CO₂e/t
                              </DataLabel>
                            </div>
                          )}
                          {futures.expectedMoistureContent && (
                            <div className="text-center p-2 bg-muted/30 rounded-lg">
                              <p className="text-xs text-gray-600">
                                Moisture
                              </p>
                              <p className="font-semibold font-mono text-sm">
                                {futures.expectedMoistureContent}%
                              </p>
                            </div>
                          )}
                          {futures.expectedEnergyContent && (
                            <div className="text-center p-2 bg-muted/30 rounded-lg">
                              <p className="text-xs text-gray-600">
                                Energy
                              </p>
                              <p className="font-semibold font-mono text-sm">
                                {futures.expectedEnergyContent}
                              </p>
                              <p className="text-[10px] text-gray-600">
                                GJ/t
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Timestamps */}
              <div className="text-sm text-gray-600 flex flex-wrap gap-4">
                <span>Created {formatDate(futures.createdAt)}</span>
                {futures.publishedAt && (
                  <span>• Published {formatDate(futures.publishedAt)}</span>
                )}
                {futures.updatedAt && (
                  <span>• Updated {formatDate(futures.updatedAt)}</span>
                )}
              </div>
            </TabsContent>

            {/* Projections Tab */}
            <TabsContent value="projections">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5 text-[#D4AF37]" />
                        Yield Projections
                      </CardTitle>
                      <CardDescription>
                        Year-by-year projected and contracted volumes
                      </CardDescription>
                    </div>
                    {futures.status === "draft" && !isUsingMockData && (
                      <Link
                        href={`/supplier/futures/create?edit=${futures.id}`}
                      >
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Projections
                        </Button>
                      </Link>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {projections && projections.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b bg-muted/30">
                            <th className="text-left py-3 px-4 font-semibold">
                              Year
                            </th>
                            <th className="text-right py-3 px-4 font-semibold">
                              Projected (t)
                            </th>
                            <th className="text-right py-3 px-4 font-semibold">
                              Contracted (t)
                            </th>
                            <th className="text-right py-3 px-4 font-semibold">
                              Available (t)
                            </th>
                            <th className="text-center py-3 px-4 font-semibold">
                              Confidence
                            </th>
                            <th className="text-left py-3 px-4 font-semibold">
                              Season
                            </th>
                            <th className="text-left py-3 px-4 font-semibold">
                              Notes
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {projections.map((p: any, index: number) => {
                            const projected = parseFloat(
                              p.projectedTonnes || "0"
                            );
                            const contracted = parseFloat(
                              p.contractedTonnes || "0"
                            );
                            const available = projected - contracted;
                            return (
                              <tr
                                key={p.projectionYear}
                                className={index % 2 === 0 ? "bg-muted/10" : ""}
                              >
                                <td className="py-3 px-4 font-semibold">
                                  {p.projectionYear}
                                </td>
                                <td className="py-3 px-4 text-right font-mono">
                                  {projected.toLocaleString()}
                                </td>
                                <td className="py-3 px-4 text-right font-mono text-blue-600">
                                  {contracted.toLocaleString()}
                                </td>
                                <td className="py-3 px-4 text-right font-mono text-[#D4AF37]">
                                  {available.toLocaleString()}
                                </td>
                                <td className="py-3 px-4 text-center">
                                  <Badge
                                    variant="outline"
                                    className={
                                      p.confidencePercent >= 70
                                        ? "border-emerald-200 text-emerald-700"
                                        : p.confidencePercent >= 50
                                          ? "border-yellow-200 text-yellow-700"
                                          : "border-red-200 text-red-700"
                                    }
                                  >
                                    {p.confidencePercent || 80}%
                                  </Badge>
                                </td>
                                <td className="py-3 px-4 capitalize text-sm">
                                  {p.harvestSeason || "-"}
                                </td>
                                <td className="py-3 px-4 text-sm text-gray-600 max-w-[200px] truncate">
                                  {p.notes || "-"}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                        <tfoot className="border-t-2 bg-muted/30">
                          <tr className="font-bold">
                            <td className="py-3 px-4">Total</td>
                            <td className="py-3 px-4 text-right font-mono">
                              {totalProjected.toLocaleString()}
                            </td>
                            <td className="py-3 px-4 text-right font-mono text-blue-600">
                              {totalContracted.toLocaleString()}
                            </td>
                            <td className="py-3 px-4 text-right font-mono text-[#D4AF37]">
                              {totalAvailable.toLocaleString()}
                            </td>
                            <td colSpan={3}></td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-12 text-gray-600">
                      <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p className="font-medium mb-2">
                        No yield projections added yet
                      </p>
                      {futures.status === "draft" && !isUsingMockData && (
                        <Link
                          href={`/supplier/futures/create?edit=${futures.id}`}
                        >
                          <Button className="mt-4">Add Projections</Button>
                        </Link>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* EOIs Tab */}
            <TabsContent value="eois">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-[#D4AF37]" />
                        Expressions of Interest
                      </CardTitle>
                      <CardDescription>
                        Review and respond to buyer interest in your futures
                        listing
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Badge
                        variant="outline"
                        className="bg-yellow-50 text-yellow-700 border-yellow-200"
                      >
                        <Clock className="h-3.5 w-3.5 mr-1" />
                        {pendingEOIs.length} Pending
                      </Badge>
                      <Badge
                        variant="outline"
                        className="bg-emerald-50 text-emerald-700 border-emerald-200"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                        {acceptedEOIs.length} Accepted
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {loadingEOIs ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map(i => (
                        <Skeleton key={i} className="h-32 w-full" />
                      ))}
                    </div>
                  ) : eois && eois.length > 0 ? (
                    <div className="space-y-4">
                      {eois.map((eoi: any) => (
                        <div
                          key={eoi.id}
                          className="border rounded-xl p-5 hover:border-teal-200 hover:shadow-md transition-all"
                        >
                          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4 mb-4">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-bold text-lg">
                                  {eoi.eoiReference}
                                </span>
                                <Badge
                                  className={getEOIStatusColor(eoi.status)}
                                >
                                  {EOI_STATUS_LABELS[eoi.status]}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-600">
                                Submitted {formatDate(eoi.createdAt)}
                              </p>
                            </div>

                            {["pending", "under_review"].includes(eoi.status) &&
                              !isUsingMockData && (
                                <div className="flex flex-wrap gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() =>
                                      openRespondDialog(eoi, "under_review")
                                    }
                                    className="border-blue-200 text-blue-600 hover:bg-blue-50"
                                  >
                                    <Clock className="h-4 w-4 mr-1" />
                                    Review
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() =>
                                      openRespondDialog(eoi, "accepted")
                                    }
                                    className="border-emerald-200 text-[#D4AF37] hover:bg-emerald-50"
                                  >
                                    <CheckCircle2 className="h-4 w-4 mr-1" />
                                    Accept
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() =>
                                      openRespondDialog(eoi, "declined")
                                    }
                                    className="border-red-200 text-red-600 hover:bg-red-50"
                                  >
                                    <XCircle className="h-4 w-4 mr-1" />
                                    Decline
                                  </Button>
                                </div>
                              )}
                          </div>

                          {/* Buyer Info */}
                          {eoi.buyer && (
                            <div className="bg-muted/30 rounded-lg p-4 mb-4">
                              <div className="flex items-center gap-2 mb-2">
                                <Building2 className="h-4 w-4 text-[#D4AF37]" />
                                <span className="font-semibold">
                                  {eoi.buyer.companyName}
                                </span>
                              </div>
                              <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                                {eoi.buyer.contactEmail && (
                                  <a
                                    href={`mailto:${eoi.buyer.contactEmail}`}
                                    className="flex items-center gap-1.5 hover:text-[#D4AF37] transition-colors"
                                  >
                                    <Mail className="h-3.5 w-3.5" />
                                    {eoi.buyer.contactEmail}
                                  </a>
                                )}
                                {eoi.buyer.contactPhone && (
                                  <a
                                    href={`tel:${eoi.buyer.contactPhone}`}
                                    className="flex items-center gap-1.5 hover:text-[#D4AF37] transition-colors"
                                  >
                                    <Phone className="h-3.5 w-3.5" />
                                    {eoi.buyer.contactPhone}
                                  </a>
                                )}
                              </div>
                            </div>
                          )}

                          {/* EOI Details */}
                          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm p-4 bg-muted/20 rounded-lg">
                            <div>
                              <p className="text-gray-600 text-xs uppercase tracking-wide mb-1">
                                Period
                              </p>
                              <p className="font-semibold">
                                {eoi.interestStartYear} - {eoi.interestEndYear}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-600 text-xs uppercase tracking-wide mb-1">
                                Annual Volume
                              </p>
                              <p className="font-semibold font-mono">
                                {parseFloat(
                                  eoi.annualVolumeTonnes
                                ).toLocaleString()}
                                t
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-600 text-xs uppercase tracking-wide mb-1">
                                Total Volume
                              </p>
                              <p className="font-semibold font-mono">
                                {parseFloat(
                                  eoi.totalVolumeTonnes
                                ).toLocaleString()}
                                t
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-600 text-xs uppercase tracking-wide mb-1">
                                Offered Price
                              </p>
                              <p className="font-semibold font-mono">
                                {eoi.offeredPricePerTonne
                                  ? `$${parseFloat(eoi.offeredPricePerTonne).toFixed(2)}/t`
                                  : "Negotiable"}
                              </p>
                            </div>
                          </div>

                          {(eoi.deliveryLocation || eoi.additionalTerms) && (
                            <div className="mt-4 pt-4 border-t text-sm">
                              {eoi.deliveryLocation && (
                                <p className="mb-1">
                                  <span className="text-gray-600">
                                    Delivery:{" "}
                                  </span>
                                  <span className="font-medium">
                                    {eoi.deliveryLocation}
                                  </span>
                                  {eoi.deliveryFrequency && (
                                    <span className="text-gray-600">
                                      {" "}
                                      ({eoi.deliveryFrequency})
                                    </span>
                                  )}
                                </p>
                              )}
                              {eoi.additionalTerms && (
                                <p className="text-gray-600 mt-2 italic">
                                  "{eoi.additionalTerms}"
                                </p>
                              )}
                            </div>
                          )}

                          {eoi.supplierResponse && (
                            <div className="mt-4 p-4 bg-teal-50 border border-teal-100 rounded-lg">
                              <p className="text-sm font-semibold text-teal-800 mb-1">
                                Your Response:
                              </p>
                              <p className="text-sm text-teal-700">
                                {eoi.supplierResponse}
                              </p>
                              {eoi.respondedAt && (
                                <p className="text-xs text-[#D4AF37] mt-2">
                                  Responded {formatDate(eoi.respondedAt)}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-gray-600">
                      <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p className="font-medium mb-2">
                        No expressions of interest yet
                      </p>
                      {futures.status === "draft" && (
                        <p className="text-sm">
                          Publish your listing to start receiving EOIs from
                          buyers
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* Respond Dialog */}
      <Dialog open={respondDialogOpen} onOpenChange={setRespondDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {respondAction === "accepted" && "Accept EOI"}
              {respondAction === "declined" && "Decline EOI"}
              {respondAction === "under_review" && "Mark as Under Review"}
            </DialogTitle>
            <DialogDescription>
              {selectedEOI && (
                <>
                  {respondAction === "accepted" &&
                    `You are accepting the EOI from ${selectedEOI.buyer?.companyName} for ${parseFloat(selectedEOI.totalVolumeTonnes).toLocaleString()}t.`}
                  {respondAction === "declined" &&
                    `You are declining the EOI from ${selectedEOI.buyer?.companyName}.`}
                  {respondAction === "under_review" &&
                    `Mark this EOI as under review to indicate you are evaluating it.`}
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">
                Response Message (optional)
              </label>
              <Textarea
                placeholder={
                  respondAction === "accepted"
                    ? "Thank you for your interest. We would like to proceed with contract negotiations..."
                    : respondAction === "declined"
                      ? "Thank you for your interest. Unfortunately..."
                      : "We are currently reviewing your EOI and will respond shortly..."
                }
                value={responseText}
                onChange={e => setResponseText(e.target.value)}
                rows={4}
                className="mt-2"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRespondDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRespond}
              disabled={respondMutation.isPending || isUsingMockData}
              className={
                respondAction === "accepted"
                  ? "bg-[#D4AF37] hover:bg-emerald-700"
                  : respondAction === "declined"
                    ? "bg-red-600 hover:bg-red-700"
                    : ""
              }
            >
              {respondMutation.isPending ? "Sending..." : "Send Response"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
}
