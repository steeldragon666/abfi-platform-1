/**
 * Futures Detail Buyer - Nextgen Design
 *
 * Features:
 * - Futures listing detail view for buyers
 * - Expression of Interest (EOI) submission dialog
 * - Yield projections and pricing information
 * - Supplier contact details display
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { formatDate } from "@/const";
import { PageLayout, PageContainer } from "@/components/layout";
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
  Building2,
  Mail,
  Phone,
  Globe,
  Send,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  Package,
  BarChart3,
  Shield,
} from "lucide-react";
import { useState, useMemo } from "react";
import { Link, useRoute, useLocation } from "wouter";
import { toast } from "sonner";

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
  bamboo: <Sprout className="h-6 w-6" />,
  rotation_forestry: <TreeDeciduous className="h-6 w-6" />,
  eucalyptus: <TreeDeciduous className="h-6 w-6" />,
  poplar: <TreeDeciduous className="h-6 w-6" />,
  willow: <TreeDeciduous className="h-6 w-6" />,
  miscanthus: <Leaf className="h-6 w-6" />,
  switchgrass: <Leaf className="h-6 w-6" />,
  arundo_donax: <Leaf className="h-6 w-6" />,
  hemp: <Leaf className="h-6 w-6" />,
  other_perennial: <Sprout className="h-6 w-6" />,
};

const DELIVERY_FREQUENCIES = [
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "semi-annual", label: "Semi-Annual" },
  { value: "annual", label: "Annual" },
  { value: "flexible", label: "Flexible" },
];

const PAYMENT_TERMS = [
  { value: "net_30", label: "Net 30" },
  { value: "net_60", label: "Net 60" },
  { value: "net_90", label: "Net 90" },
  { value: "on_delivery", label: "On Delivery" },
  { value: "advance", label: "Advance Payment" },
  { value: "negotiable", label: "Negotiable" },
];

const EOI_STATUS_LABELS: Record<string, string> = {
  pending: "Pending Review",
  under_review: "Under Review",
  accepted: "Accepted",
  declined: "Declined",
  expired: "Expired",
  withdrawn: "Withdrawn",
};

const getEOIStatusColor = (status: string) => {
  switch (status) {
    case "pending":
      return "bg-yellow-100 text-yellow-800";
    case "under_review":
      return "bg-blue-100 text-blue-800";
    case "accepted":
      return "bg-green-100 text-green-800";
    case "declined":
      return "bg-red-100 text-red-800";
    case "expired":
    case "withdrawn":
      return "bg-gray-100 text-gray-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const getEOIStatusIcon = (status: string) => {
  switch (status) {
    case "pending":
      return <Clock className="h-5 w-5 text-yellow-600" />;
    case "under_review":
      return <AlertCircle className="h-5 w-5 text-blue-600" />;
    case "accepted":
      return <CheckCircle2 className="h-5 w-5 text-green-600" />;
    case "declined":
      return <XCircle className="h-5 w-5 text-red-600" />;
    default:
      return <Clock className="h-5 w-5 text-gray-600" />;
  }
};

// Mock data for demonstration - keyed by ID to match marketplace listings
const MOCK_FUTURES_MAP: Record<number, any> = {
  1: {
    id: 1,
    futuresId: "FUT-2025-0001",
    title: "Blue Mallee Eucalyptus - Certified Sustainable Plantation",
    cropType: "eucalyptus",
    cropVariety: "E. grandis",
    description:
      "Large-scale eucalyptus plantation in Victoria's Mallee region, managed for sustainable biomass production. Established plantation with proven yield history. First rotation harvest completed successfully. Modern harvesting and processing infrastructure on-site.",
    state: "VIC",
    region: "Mallee Region",
    landAreaHectares: "2500",
    projectionStartYear: 2026,
    projectionEndYear: 2040,
    firstHarvestYear: 2026,
    totalProjectedTonnes: "145000",
    totalContractedTonnes: "20000",
    totalAvailableTonnes: "125000",
    indicativePricePerTonne: "85.00",
    priceEscalationPercent: "2.5",
    pricingNotes:
      "Base price indexed to CPI. Volume discounts available for commitments over 10,000 tonnes/year.",
    expectedCarbonIntensity: "15.5",
    expectedMoistureContent: "35",
    expectedEnergyContent: "18.5",
    status: "active",
    publishedAt: "2025-01-15",
  },
  2: {
    id: 2,
    futuresId: "FUT-2025-0002",
    title: "Giant Miscanthus Energy Crop - High Yield Variety",
    cropType: "miscanthus",
    cropVariety: "Miscanthus x giganteus",
    description:
      "High-yield miscanthus plantation in the fertile Riverina region. This perennial grass requires minimal inputs and provides consistent annual harvests. Ideal for bioenergy applications with excellent combustion properties.",
    state: "NSW",
    region: "Riverina",
    landAreaHectares: "1200",
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
    publishedAt: "2025-02-01",
  },
  3: {
    id: 3,
    futuresId: "FUT-2025-0003",
    title: "Dendrocalamus Bamboo - Fast-Growing Biomass",
    cropType: "bamboo",
    cropVariety: "Dendrocalamus asper",
    description:
      "Premium bamboo plantation on Queensland's Sunshine Coast. Fast-growing tropical bamboo with exceptional biomass yields. Sustainable harvesting practices ensure continuous production over the 20-year projection period.",
    state: "QLD",
    region: "Sunshine Coast Hinterland",
    landAreaHectares: "3500",
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
    publishedAt: "2025-01-10",
  },
  4: {
    id: 4,
    futuresId: "FUT-2025-0004",
    title: "Short Rotation Forestry - Mixed Hardwood",
    cropType: "rotation_forestry",
    cropVariety: "Mixed Eucalyptus species",
    description:
      "Diverse short-rotation forestry operation in Tasmania's North East. Mixed hardwood species provide resilience and consistent yields. FSC certified sustainable forestry practices.",
    state: "TAS",
    region: "North East",
    landAreaHectares: "5000",
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
    publishedAt: "2025-01-20",
  },
  5: {
    id: 5,
    futuresId: "FUT-2025-0005",
    title: "Industrial Hemp - Multi-Purpose Biomass",
    cropType: "hemp",
    cropVariety: "Industrial Hemp (low THC)",
    description:
      "Industrial hemp cultivation on Adelaide Plains. Fast-growing annual crop with multiple harvest cycles. Biomass suitable for various applications including bioenergy and biocomposites.",
    state: "SA",
    region: "Adelaide Plains",
    landAreaHectares: "800",
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
    status: "active",
    publishedAt: "2025-02-15",
  },
  6: {
    id: 6,
    futuresId: "FUT-2025-0006",
    title: "Switchgrass - Low Input Energy Crop",
    cropType: "switchgrass",
    cropVariety: "Panicum virgatum",
    description:
      "Native switchgrass plantation in Western Australia's South West. Low-input perennial grass with excellent drought tolerance. Ideal for marginal lands and sustainable bioenergy production.",
    state: "WA",
    region: "South West",
    landAreaHectares: "1800",
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
    publishedAt: "2025-02-20",
  },
};

// Default mock futures for unknown IDs
const DEFAULT_MOCK_FUTURES = MOCK_FUTURES_MAP[1];

const MOCK_PROJECTIONS = [
  {
    projectionYear: 2025,
    projectedTonnes: "15000",
    confidencePercent: 95,
    harvestSeason: "autumn",
  },
  {
    projectionYear: 2026,
    projectedTonnes: "22000",
    confidencePercent: 90,
    harvestSeason: "autumn",
  },
  {
    projectionYear: 2027,
    projectedTonnes: "25000",
    confidencePercent: 85,
    harvestSeason: "autumn",
  },
  {
    projectionYear: 2028,
    projectedTonnes: "28000",
    confidencePercent: 80,
    harvestSeason: "autumn",
  },
  {
    projectionYear: 2029,
    projectedTonnes: "28000",
    confidencePercent: 75,
    harvestSeason: "autumn",
  },
  {
    projectionYear: 2030,
    projectedTonnes: "28000",
    confidencePercent: 75,
    harvestSeason: "autumn",
  },
];

const MOCK_SUPPLIERS: Record<number, any> = {
  1: {
    companyName: "Mallee Sustainable Energy",
    city: "Mildura",
    state: "VIC",
    description:
      "Pioneer in sustainable mallee eucalyptus cultivation for bioenergy. Operating in Victoria's Mallee region since 2005.",
    contactEmail: "contact@malleesustainable.com.au",
    contactPhone: "+61 3 5022 1234",
    website: "https://malleesustainable.com.au",
  },
  2: {
    companyName: "Riverina Biomass Co",
    city: "Wagga Wagga",
    state: "NSW",
    description:
      "Specializing in perennial grass energy crops across the fertile Riverina region.",
    contactEmail: "info@riverinabio mass.com.au",
    contactPhone: "+61 2 6925 5678",
    website: "https://riverinabio mass.com.au",
  },
  3: {
    companyName: "Tropical Bamboo Farms",
    city: "Nambour",
    state: "QLD",
    description:
      "Australia's largest bamboo plantation operator, focused on sustainable tropical biomass.",
    contactEmail: "sales@tropicalbamboo.com.au",
    contactPhone: "+61 7 5476 9012",
    website: "https://tropicalbamboo.com.au",
  },
  4: {
    companyName: "Tasmanian Forestry Alliance",
    city: "Launceston",
    state: "TAS",
    description:
      "FSC-certified forestry cooperative with decades of sustainable timber and biomass experience.",
    contactEmail: "contact@tasforestry.com.au",
    contactPhone: "+61 3 6331 4567",
    website: "https://tasforestry.com.au",
  },
  5: {
    companyName: "SA Hemp Industries",
    city: "Adelaide",
    state: "SA",
    description:
      "Leading industrial hemp producer in South Australia, pioneering hemp biomass applications.",
    contactEmail: "info@sahempind.com.au",
    contactPhone: "+61 8 8232 7890",
    website: "https://sahempind.com.au",
  },
  6: {
    companyName: "WA Energy Crops",
    city: "Bunbury",
    state: "WA",
    description:
      "Sustainable energy crop specialists in Western Australia's South West region.",
    contactEmail: "contact@waenergycrops.com.au",
    contactPhone: "+61 8 9721 3456",
    website: "https://waenergycrops.com.au",
  },
};

const DEFAULT_MOCK_SUPPLIER = MOCK_SUPPLIERS[1];

export default function FuturesDetailBuyer() {
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/futures/:id");
  const futuresId = parseInt(params?.id || "0");

  const [eoiDialogOpen, setEoiDialogOpen] = useState(false);

  // EOI form state
  const [interestStartYear, setInterestStartYear] = useState<string>("");
  const [interestEndYear, setInterestEndYear] = useState<string>("");
  const [annualVolumeTonnes, setAnnualVolumeTonnes] = useState<string>("");
  const [offeredPricePerTonne, setOfferedPricePerTonne] = useState<string>("");
  const [priceTerms, setPriceTerms] = useState<string>("");
  const [deliveryLocation, setDeliveryLocation] = useState<string>("");
  const [deliveryFrequency, setDeliveryFrequency] =
    useState<string>("quarterly");
  const [logisticsNotes, setLogisticsNotes] = useState<string>("");
  const [paymentTerms, setPaymentTerms] = useState<string>("negotiable");
  const [additionalTerms, setAdditionalTerms] = useState<string>("");

  const utils = trpc.useUtils();

  const { data, isLoading, error } = trpc.futures.getPublic.useQuery(
    { id: futuresId },
    {
      enabled: futuresId > 0,
      retry: false, // Don't retry on NOT_FOUND errors
    }
  );

  // Get mock data for this specific ID
  const mockFutures = MOCK_FUTURES_MAP[futuresId] || DEFAULT_MOCK_FUTURES;
  const mockSupplier = MOCK_SUPPLIERS[futuresId] || DEFAULT_MOCK_SUPPLIER;

  // Use mock data if API returns empty, errors, or query is disabled
  const showingMockData = !data?.futures || !!error;
  const futures = data?.futures || mockFutures;
  const projections = data?.projections || MOCK_PROJECTIONS;
  const supplier = data?.supplier || mockSupplier;
  const existingEOI = data?.existingEOI || null;

  const submitEOIMutation = trpc.futures.submitEOI.useMutation({
    onSuccess: result => {
      toast.success(
        `EOI submitted successfully! Reference: ${result.eoiReference}`
      );
      setEoiDialogOpen(false);
      utils.futures.getPublic.invalidate({ id: futuresId });
    },
    onError: error => toast.error(error.message),
  });

  const withdrawEOIMutation = trpc.futures.withdrawEOI.useMutation({
    onSuccess: () => {
      toast.success("EOI withdrawn");
      utils.futures.getPublic.invalidate({ id: futuresId });
    },
    onError: error => toast.error(error.message),
  });

  // Calculate total volume for EOI
  const totalEOIVolume = useMemo(() => {
    const startYear = parseInt(interestStartYear);
    const endYear = parseInt(interestEndYear);
    const annualVolume = parseFloat(annualVolumeTonnes);
    if (isNaN(startYear) || isNaN(endYear) || isNaN(annualVolume)) return 0;
    return annualVolume * (endYear - startYear + 1);
  }, [interestStartYear, interestEndYear, annualVolumeTonnes]);

  const handleSubmitEOI = () => {
    submitEOIMutation.mutate({
      futuresId,
      interestStartYear: parseInt(interestStartYear),
      interestEndYear: parseInt(interestEndYear),
      annualVolumeTonnes: parseFloat(annualVolumeTonnes),
      offeredPricePerTonne: offeredPricePerTonne
        ? parseFloat(offeredPricePerTonne)
        : undefined,
      priceTerms: priceTerms || undefined,
      deliveryLocation: deliveryLocation || undefined,
      deliveryFrequency: deliveryFrequency as any,
      logisticsNotes: logisticsNotes || undefined,
      paymentTerms: paymentTerms as any,
      additionalTerms: additionalTerms || undefined,
    });
  };

  // Show loading only while actually fetching (not when using mock data)
  if (isLoading && futuresId > 0) {
    return (
      <PageLayout>
        <PageContainer size="lg" padding="lg">
          <Skeleton className="h-8 w-64 mb-4" />
          <Skeleton className="h-64 w-full mb-4" />
          <Skeleton className="h-48 w-full" />
        </PageContainer>
      </PageLayout>
    );
  }

  const totalProjected = parseFloat(futures.totalProjectedTonnes || "0");
  const totalAvailable = parseFloat(futures.totalAvailableTonnes || "0");
  const totalContracted = parseFloat(futures.totalContractedTonnes || "0");
  const availablePercent =
    totalProjected > 0 ? (totalAvailable / totalProjected) * 100 : 100;

  // Generate year options for EOI form
  const yearOptions = [];
  for (
    let year = futures.projectionStartYear;
    year <= futures.projectionEndYear;
    year++
  ) {
    yearOptions.push(year);
  }

  return (
    <PageLayout>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-teal-800 via-emerald-800 to-green-900 text-black">
        <PageContainer size="lg" padding="md" className="py-8">
          <Button
            variant="ghost"
            onClick={() => setLocation("/futures")}
            className="mb-4 text-black/80 hover:text-black hover:bg-white/10"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Marketplace
          </Button>

          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="p-4 bg-white/10 backdrop-blur-sm rounded-xl">
                {CROP_TYPE_ICONS[futures.cropType] || (
                  <Sprout className="h-8 w-8" />
                )}
              </div>
              <div>
                {showingMockData && (
                  <Badge className="mb-2 bg-white/20 text-black border-white/30">
                    Demo Data
                  </Badge>
                )}
                <div className="flex items-center gap-3 mb-1">
                  <Badge
                    variant="outline"
                    className="text-black border-white/30"
                  >
                    {futures.futuresId}
                  </Badge>
                  <Badge className="bg-[#D4AF37] text-black border-0">
                    {CROP_TYPE_LABELS[futures.cropType]}
                  </Badge>
                </div>
                <H1 className="text-2xl md:text-3xl">
                  {futures.title}
                </H1>
                <div className="flex items-center gap-2 mt-2 text-black/70">
                  <MapPin className="h-4 w-4" />
                  <span>
                    {futures.state}
                    {futures.region && `, ${futures.region}`}
                  </span>
                </div>
              </div>
            </div>

            <div className="lg:text-right">
              <DataLabel className="text-black/70 mb-1">Total Available</DataLabel>
              <MetricValue className="text-4xl md:text-5xl">
                {totalAvailable.toLocaleString()}
              </MetricValue>
              <DataLabel className="text-black/70">tonnes</DataLabel>
            </div>
          </div>
        </PageContainer>
      </section>

      {/* Main Content */}
      <PageContainer size="lg" padding="md">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Volume Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-[#D4AF37]" />
                  Volume Availability
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <DataLabel className="text-gray-600 mb-1">
                      Total Projected
                    </DataLabel>
                    <MetricValue className="text-2xl">
                      {totalProjected.toLocaleString()}
                    </MetricValue>
                    <DataLabel className="text-gray-600">tonnes</DataLabel>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <DataLabel className="text-gray-600 mb-1">
                      Contracted
                    </DataLabel>
                    <MetricValue className="text-2xl text-blue-600">
                      {totalContracted.toLocaleString()}
                    </MetricValue>
                    <DataLabel className="text-gray-600">tonnes</DataLabel>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <DataLabel className="text-green-600 mb-1">Available</DataLabel>
                    <MetricValue className="text-2xl text-green-700">
                      {totalAvailable.toLocaleString()}
                    </MetricValue>
                    <DataLabel className="text-gray-600">tonnes</DataLabel>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">Availability</span>
                    <span className="font-medium">
                      {Math.round(availablePercent)}%
                    </span>
                  </div>
                  <Progress value={availablePercent} className="h-3" />
                </div>
              </CardContent>
            </Card>

            {/* Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-[#D4AF37]" />
                  Listing Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Location & Land */}
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2 text-sm uppercase tracking-wide text-gray-600">
                    <MapPin className="h-4 w-4" />
                    Location & Land
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">State</p>
                      <p className="font-semibold">{futures.state}</p>
                    </div>
                    {futures.region && (
                      <div>
                        <p className="text-sm text-gray-600">Region</p>
                        <p className="font-semibold">{futures.region}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-sm text-gray-600">Land Area</p>
                      <p className="font-semibold">
                        {parseFloat(futures.landAreaHectares).toLocaleString()}{" "}
                        ha
                      </p>
                    </div>
                  </div>
                </div>

                {/* Timeline */}
                <div className="border-t pt-6">
                  <h4 className="font-semibold mb-3 flex items-center gap-2 text-sm uppercase tracking-wide text-gray-600">
                    <Calendar className="h-4 w-4" />
                    Timeline
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">
                        Projection Period
                      </p>
                      <p className="font-semibold">
                        {futures.projectionStartYear} -{" "}
                        {futures.projectionEndYear}
                      </p>
                      <p className="text-xs text-gray-600">
                        (
                        {futures.projectionEndYear -
                          futures.projectionStartYear +
                          1}{" "}
                        years)
                      </p>
                    </div>
                    {futures.firstHarvestYear && (
                      <div>
                        <p className="text-sm text-gray-600">
                          First Harvest
                        </p>
                        <p className="font-semibold">
                          {futures.firstHarvestYear}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Pricing */}
                <div className="border-t pt-6">
                  <h4 className="font-semibold mb-3 flex items-center gap-2 text-sm uppercase tracking-wide text-gray-600">
                    <DollarSign className="h-4 w-4" />
                    Pricing
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <DataLabel className="text-gray-600">
                        Indicative Price
                      </DataLabel>
                      <MetricValue className="text-2xl text-[#D4AF37]">
                        {futures.indicativePricePerTonne
                          ? `$${parseFloat(futures.indicativePricePerTonne).toFixed(2)}`
                          : "Negotiable"}
                      </MetricValue>
                      <DataLabel className="text-gray-600">per tonne</DataLabel>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">
                        Annual Escalation
                      </p>
                      <p className="font-semibold">
                        {futures.priceEscalationPercent || "2.5"}%
                      </p>
                    </div>
                  </div>
                  {futures.pricingNotes && (
                    <p className="text-sm text-gray-600 mt-3 bg-muted/50 p-3 rounded-lg">
                      {futures.pricingNotes}
                    </p>
                  )}
                </div>

                {/* Quality */}
                {(futures.expectedCarbonIntensity ||
                  futures.expectedMoistureContent ||
                  futures.expectedEnergyContent) && (
                  <div className="border-t pt-6">
                    <h4 className="font-semibold mb-3 flex items-center gap-2 text-sm uppercase tracking-wide text-gray-600">
                      <BarChart3 className="h-4 w-4" />
                      Expected Quality Parameters
                    </h4>
                    <div className="grid grid-cols-3 gap-4">
                      {futures.expectedCarbonIntensity && (
                        <div className="p-3 bg-muted/50 rounded-lg text-center">
                          <p className="text-xs text-gray-600 mb-1">
                            Carbon Intensity
                          </p>
                          <p className="font-bold">
                            {futures.expectedCarbonIntensity}
                          </p>
                          <p className="text-xs text-gray-600">
                            kg CO2e/t
                          </p>
                        </div>
                      )}
                      {futures.expectedMoistureContent && (
                        <div className="p-3 bg-muted/50 rounded-lg text-center">
                          <p className="text-xs text-gray-600 mb-1">
                            Moisture
                          </p>
                          <p className="font-bold">
                            {futures.expectedMoistureContent}%
                          </p>
                        </div>
                      )}
                      {futures.expectedEnergyContent && (
                        <div className="p-3 bg-muted/50 rounded-lg text-center">
                          <p className="text-xs text-gray-600 mb-1">
                            Energy Content
                          </p>
                          <p className="font-bold">
                            {futures.expectedEnergyContent}
                          </p>
                          <p className="text-xs text-gray-600">GJ/t</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Description */}
                {futures.description && (
                  <div className="border-t pt-6">
                    <h4 className="font-semibold mb-3">Description</h4>
                    <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                      {futures.description}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Projections Table */}
            {projections && projections.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-[#D4AF37]" />
                    Yield Projections
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="text-left py-3 px-4 font-medium">
                            Year
                          </th>
                          <th className="text-right py-3 px-4 font-medium">
                            Projected Volume
                          </th>
                          <th className="text-center py-3 px-4 font-medium">
                            Confidence
                          </th>
                          <th className="text-left py-3 px-4 font-medium">
                            Season
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {projections.map((p: any, index: number) => (
                          <tr
                            key={p.projectionYear}
                            className={index % 2 === 0 ? "" : "bg-muted/30"}
                          >
                            <td className="py-3 px-4 font-semibold">
                              {p.projectionYear}
                            </td>
                            <td className="py-3 px-4 text-right font-mono">
                              {parseFloat(p.projectedTonnes).toLocaleString()} t
                            </td>
                            <td className="py-3 px-4 text-center">
                              <Badge
                                variant="outline"
                                className={
                                  p.confidencePercent >= 90
                                    ? "border-green-500 text-green-600"
                                    : p.confidencePercent >= 75
                                      ? "border-[#D4AF37] text-[#D4AF37]"
                                      : "border-gray-500 text-gray-600"
                                }
                              >
                                {p.confidencePercent || 80}%
                              </Badge>
                            </td>
                            <td className="py-3 px-4 capitalize">
                              {p.harvestSeason || "-"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* EOI Action Card */}
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="pt-6">
                {existingEOI ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      {getEOIStatusIcon(existingEOI.status)}
                      <div>
                        <p className="font-medium">Your EOI</p>
                        <p className="text-sm text-gray-600">
                          {existingEOI.eoiReference}
                        </p>
                      </div>
                    </div>
                    <Badge
                      className={`${getEOIStatusColor(existingEOI.status)} w-full justify-center py-2`}
                    >
                      {EOI_STATUS_LABELS[existingEOI.status]}
                    </Badge>
                    {existingEOI.supplierResponse && (
                      <div className="pt-3 border-t">
                        <p className="text-sm font-medium mb-1">
                          Supplier Response:
                        </p>
                        <p className="text-sm text-gray-600">
                          {existingEOI.supplierResponse}
                        </p>
                      </div>
                    )}
                    {["pending", "under_review"].includes(
                      existingEOI.status
                    ) && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() =>
                          withdrawEOIMutation.mutate({ eoiId: existingEOI.id })
                        }
                        disabled={withdrawEOIMutation.isPending}
                      >
                        Withdraw EOI
                      </Button>
                    )}
                  </div>
                ) : user ? (
                  <Dialog open={eoiDialogOpen} onOpenChange={setEoiDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="lg" className="w-full">
                        <Send className="h-4 w-4 mr-2" />
                        Submit Expression of Interest
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Submit Expression of Interest</DialogTitle>
                        <DialogDescription>
                          Express your interest in this futures listing. The
                          supplier will review your request.
                        </DialogDescription>
                      </DialogHeader>

                      <div className="space-y-6 py-4">
                        {/* Interest Period */}
                        <div className="space-y-4">
                          <h4 className="font-semibold">Interest Period</h4>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Start Year *</Label>
                              <Select
                                value={interestStartYear}
                                onValueChange={setInterestStartYear}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select year" />
                                </SelectTrigger>
                                <SelectContent>
                                  {yearOptions.map(year => (
                                    <SelectItem
                                      key={year}
                                      value={year.toString()}
                                    >
                                      {year}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label>End Year *</Label>
                              <Select
                                value={interestEndYear}
                                onValueChange={setInterestEndYear}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select year" />
                                </SelectTrigger>
                                <SelectContent>
                                  {yearOptions
                                    .filter(
                                      y =>
                                        y >= parseInt(interestStartYear || "0")
                                    )
                                    .map(year => (
                                      <SelectItem
                                        key={year}
                                        value={year.toString()}
                                      >
                                        {year}
                                      </SelectItem>
                                    ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>

                        {/* Volume */}
                        <div className="space-y-4">
                          <h4 className="font-semibold">Volume Requirements</h4>
                          <div className="space-y-2">
                            <Label>Annual Volume (tonnes) *</Label>
                            <Input
                              type="number"
                              placeholder="e.g., 5000"
                              value={annualVolumeTonnes}
                              onChange={e =>
                                setAnnualVolumeTonnes(e.target.value)
                              }
                              className="font-mono"
                            />
                          </div>
                          {totalEOIVolume > 0 && (
                            <div className="bg-muted/50 rounded-lg p-3">
                              <p className="text-sm">
                                <strong>Total volume requested:</strong>{" "}
                                {totalEOIVolume.toLocaleString()} tonnes
                              </p>
                              <p className="text-sm text-gray-600">
                                Available: {totalAvailable.toLocaleString()}{" "}
                                tonnes
                              </p>
                              {totalEOIVolume > totalAvailable && (
                                <p className="text-sm text-red-600 mt-1">
                                  Warning: Requested volume exceeds available
                                  supply
                                </p>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Pricing */}
                        <div className="space-y-4">
                          <h4 className="font-semibold">Pricing</h4>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Offered Price ($/tonne)</Label>
                              <Input
                                type="number"
                                placeholder="Leave blank for negotiable"
                                value={offeredPricePerTonne}
                                onChange={e =>
                                  setOfferedPricePerTonne(e.target.value)
                                }
                                className="font-mono"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Payment Terms</Label>
                              <Select
                                value={paymentTerms}
                                onValueChange={setPaymentTerms}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {PAYMENT_TERMS.map(term => (
                                    <SelectItem
                                      key={term.value}
                                      value={term.value}
                                    >
                                      {term.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Price Terms / Notes</Label>
                            <Input
                              placeholder="Any specific pricing conditions..."
                              value={priceTerms}
                              onChange={e => setPriceTerms(e.target.value)}
                            />
                          </div>
                        </div>

                        {/* Delivery */}
                        <div className="space-y-4">
                          <h4 className="font-semibold">Delivery</h4>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Delivery Location</Label>
                              <Input
                                placeholder="e.g., Brisbane Port"
                                value={deliveryLocation}
                                onChange={e =>
                                  setDeliveryLocation(e.target.value)
                                }
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Delivery Frequency</Label>
                              <Select
                                value={deliveryFrequency}
                                onValueChange={setDeliveryFrequency}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {DELIVERY_FREQUENCIES.map(freq => (
                                    <SelectItem
                                      key={freq.value}
                                      value={freq.value}
                                    >
                                      {freq.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Logistics Notes</Label>
                            <Textarea
                              placeholder="Any specific logistics requirements..."
                              value={logisticsNotes}
                              onChange={e => setLogisticsNotes(e.target.value)}
                              rows={2}
                            />
                          </div>
                        </div>

                        {/* Additional Terms */}
                        <div className="space-y-2">
                          <Label>Additional Terms / Comments</Label>
                          <Textarea
                            placeholder="Any other terms or information you'd like to include..."
                            value={additionalTerms}
                            onChange={e => setAdditionalTerms(e.target.value)}
                            rows={3}
                          />
                        </div>
                      </div>

                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => setEoiDialogOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleSubmitEOI}
                          disabled={
                            !interestStartYear ||
                            !interestEndYear ||
                            !annualVolumeTonnes ||
                            submitEOIMutation.isPending
                          }
                        >
                          {submitEOIMutation.isPending
                            ? "Submitting..."
                            : "Submit EOI"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                ) : (
                  <Button
                    size="lg"
                    className="w-full"
                    onClick={() => setLocation("/login")}
                  >
                    Sign In to Submit EOI
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Supplier Info */}
            {supplier && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Supplier
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="font-semibold text-lg">
                      {supplier.companyName}
                    </p>
                    {supplier.state && (
                      <p className="text-sm text-gray-600 flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {supplier.city && `${supplier.city}, `}
                        {supplier.state}
                      </p>
                    )}
                  </div>

                  {supplier.description && (
                    <p className="text-sm text-gray-600">
                      {supplier.description}
                    </p>
                  )}

                  <div className="space-y-2 pt-2 border-t">
                    {supplier.contactEmail && (
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4 text-gray-600" />
                        <a
                          href={`mailto:${supplier.contactEmail}`}
                          className="text-[#D4AF37] hover:underline"
                        >
                          {supplier.contactEmail}
                        </a>
                      </div>
                    )}
                    {supplier.contactPhone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-gray-600" />
                        <a
                          href={`tel:${supplier.contactPhone}`}
                          className="text-[#D4AF37] hover:underline"
                        >
                          {supplier.contactPhone}
                        </a>
                      </div>
                    )}
                    {supplier.website && (
                      <div className="flex items-center gap-2 text-sm">
                        <Globe className="h-4 w-4 text-gray-600" />
                        <a
                          href={supplier.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#D4AF37] hover:underline"
                        >
                          {supplier.website.replace(/^https?:\/\//, "")}
                        </a>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quick Stats */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">
                    Crop Type
                  </span>
                  <span className="font-medium">
                    {CROP_TYPE_LABELS[futures.cropType]}
                  </span>
                </div>
                {futures.cropVariety && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">
                      Variety
                    </span>
                    <span className="font-medium">{futures.cropVariety}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">
                    Contract Length
                  </span>
                  <span className="font-medium">
                    {futures.projectionEndYear -
                      futures.projectionStartYear +
                      1}{" "}
                    years
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">
                    Avg. Annual Volume
                  </span>
                  <span className="font-medium font-mono">
                    {Math.round(
                      totalProjected /
                        (futures.projectionEndYear -
                          futures.projectionStartYear +
                          1)
                    ).toLocaleString()}{" "}
                    t
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">
                    Published
                  </span>
                  <span className="font-medium">
                    {futures.publishedAt
                      ? formatDate(futures.publishedAt)
                      : "N/A"}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Trust Indicator */}
            <Card className="bg-emerald-50 border-emerald-200">
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-100 rounded-lg">
                    <Shield className="h-5 w-5 text-[#D4AF37]" />
                  </div>
                  <div>
                    <p className="font-medium text-emerald-800">
                      ABFI Verified
                    </p>
                    <p className="text-xs text-[#D4AF37]">
                      Supplier verified by ABFI
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </PageContainer>
    </PageLayout>
  );
}
