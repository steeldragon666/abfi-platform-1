/**
 * Supplier Public Profile - Nextgen Design
 *
 * Features:
 * - Hero section with company overview
 * - ABFI Score ring visualization
 * - Feedstock cards with specifications
 * - Certifications and production charts
 * - Contact information sidebar
 */

import { Button } from "@/components/ui/Button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import {
  Loader2,
  MapPin,
  Calendar,
  CheckCircle,
  Award,
  Leaf,
  Phone,
  Mail,
  Globe,
  MessageSquare,
  Download,
  FileText,
  Clock,
  Package,
  TrendingUp,
  ExternalLink,
} from "lucide-react";
import { useParams, Link } from "wouter";

// Australian bamboo-focused sample data (would come from API)
const SAMPLE_SUPPLIER = {
  id: 1,
  companyName: "Queensland Bamboo Biomass",
  abn: "12 345 678 901",
  description: `Queensland Bamboo Biomass is a leading Australian producer of sustainable bamboo feedstock for bioenergy applications. Established in 2018, we operate 2,500 hectares of managed bamboo plantations across the Darling Downs region.

Our bamboo is harvested using sustainable rotation practices, ensuring continuous supply while maintaining ecosystem health. We specialise in premium bamboo chips and pellets optimised for pyrolysis and gasification processes.

With ISO 14001 environmental certification and FSC-certified sustainable forestry practices, we're committed to providing traceable, low-carbon biomass solutions for Australia's renewable energy sector.`,
  state: "QLD",
  city: "Toowoomba",
  postcode: "4350",
  website: "https://qldbamboo.com.au",
  contactEmail: "supply@qldbamboo.com.au",
  contactPhone: "+61 7 4567 8901",
  verificationStatus: "verified",
  establishedYear: 2018,
  abfiScore: 94,
  abfiRating: "A+",
  totalVolume: "15,000 MT/year",
  activeContracts: 47,
  responseTime: "<2 hours",
};

// Sample feedstocks (would come from API)
const SAMPLE_FEEDSTOCKS = [
  {
    id: 1,
    name: "Premium Bamboo Chips",
    type: "bamboo",
    volume: "500 MT/month",
    price: "$145/MT",
    status: "available",
    image: "/images/feedstocks/bamboo-chips.jpg",
    specs: {
      moisture: "8-10%",
      energy: "18.5 MJ/kg",
      ash: "<2%",
    },
  },
  {
    id: 2,
    name: "Bamboo Pellets",
    type: "bamboo",
    volume: "300 MT/month",
    price: "$180/MT",
    status: "available",
    image: "/images/feedstocks/bamboo-pellets.jpg",
    specs: {
      moisture: "6-8%",
      energy: "19.2 MJ/kg",
      ash: "<1.5%",
    },
  },
  {
    id: 3,
    name: "Bamboo Dust/Fines",
    type: "bamboo",
    volume: "150 MT/month",
    price: "$95/MT",
    status: "limited",
    image: "/images/feedstocks/bamboo-fines.jpg",
    specs: {
      moisture: "10-12%",
      energy: "17.8 MJ/kg",
      ash: "<3%",
    },
  },
];

// Sample certifications
const CERTIFICATIONS = [
  { name: "ISO 14001", icon: Award, verified: true },
  { name: "FSC Certified", icon: Leaf, verified: true },
  { name: "ISCC EU", icon: CheckCircle, verified: true },
  { name: "ISO 9001", icon: Award, verified: true },
];

// Monthly production data for chart
const PRODUCTION_DATA = [
  { month: "Jan", volume: 420 },
  { month: "Feb", volume: 380 },
  { month: "Mar", volume: 450 },
  { month: "Apr", volume: 520 },
  { month: "May", volume: 580 },
  { month: "Jun", volume: 620 },
];

// Production chart component
function ProductionChart({ data }: { data: typeof PRODUCTION_DATA }) {
  const maxValue = Math.max(...data.map(d => d.volume));
  const chartHeight = 120;

  return (
    <div className="flex items-end justify-between gap-2 h-32">
      {data.map((item, index) => (
        <div key={index} className="flex flex-col items-center flex-1">
          <div className="w-full flex flex-col items-center">
            <span className="text-xs font-medium text-slate-700 mb-1">
              {item.volume}
            </span>
            <div
              className="w-full bg-gradient-to-t from-[#D4AF37] to-emerald-400 rounded-t-sm"
              style={{
                height: `${(item.volume / maxValue) * chartHeight}px`,
              }}
            />
          </div>
          <span className="text-xs text-black0 mt-2">{item.month}</span>
        </div>
      ))}
    </div>
  );
}

// ABFI Score ring component
function ABFIScoreRing({
  score,
  rating,
}: {
  score: number;
  rating: string;
}) {
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="relative w-28 h-28">
      <svg className="w-full h-full -rotate-90">
        <circle
          cx="56"
          cy="56"
          r="45"
          fill="none"
          stroke="#E5E7EB"
          strokeWidth="8"
        />
        <circle
          cx="56"
          cy="56"
          r="45"
          fill="none"
          stroke="#10B981"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xs text-black0">ABFI Score</span>
        <span className="text-2xl font-bold text-slate-900">{score}</span>
        <span className="text-xs text-[#D4AF37] font-semibold">{rating}</span>
      </div>
    </div>
  );
}

// Feedstock card component
function FeedstockCard({
  feedstock,
}: {
  feedstock: (typeof SAMPLE_FEEDSTOCKS)[0];
}) {
  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <div className="h-32 bg-gradient-to-br from-emerald-100 to-emerald-50 flex items-center justify-center">
        <Leaf className="h-16 w-16 text-[#D4AF37]" />
      </div>
      <CardContent className="p-4">
        <h4 className="font-semibold text-slate-900 mb-1">{feedstock.name}</h4>
        <p className="text-sm text-slate-600 mb-2">{feedstock.volume}</p>
        <div className="flex items-center justify-between mb-3">
          <span className="text-lg font-bold text-[#D4AF37]">
            {feedstock.price}
          </span>
          <Badge
            variant={feedstock.status === "available" ? "default" : "secondary"}
            className={cn(
              feedstock.status === "available"
                ? "bg-emerald-100 text-emerald-700"
                : "bg-amber-100 text-amber-700"
            )}
          >
            {feedstock.status === "available" ? "Available Now" : "Limited Stock"}
          </Badge>
        </div>
        <div className="grid grid-cols-3 gap-2 text-xs text-black0 mb-3">
          <div>
            <span className="block text-gray-500">Moisture</span>
            {feedstock.specs.moisture}
          </div>
          <div>
            <span className="block text-gray-500">Energy</span>
            {feedstock.specs.energy}
          </div>
          <div>
            <span className="block text-gray-500">Ash</span>
            {feedstock.specs.ash}
          </div>
        </div>
        <Link href={`/feedstock/${feedstock.id}`}>
          <Button variant="outline" size="sm" className="w-full">
            Quick Inquiry
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

export default function SupplierPublicProfile() {
  const params = useParams<{ id: string }>();
  // In production, fetch supplier by ID
  // const { data: supplier, isLoading } = trpc.suppliers.getPublic.useQuery({ id: parseInt(params.id) });

  // Using sample data for now
  const supplier = SAMPLE_SUPPLIER;
  const isLoading = false;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-[#D4AF37]" />
      </div>
    );
  }

  if (!supplier) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md">
          <CardContent className="py-12 text-center">
            <p className="text-slate-600">Supplier not found.</p>
            <Link href="/browse">
              <Button className="mt-4">Browse Suppliers</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="bg-white border-b">
        <div className="container max-w-7xl mx-auto px-4 py-8">
          <div className="flex flex-col lg:flex-row lg:items-start gap-8">
            {/* Left: Company Info */}
            <div className="flex-1">
              <div className="flex items-start gap-6">
                {/* Logo */}
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#1E3A5A] to-[#2D4A6A] flex items-center justify-center shrink-0">
                  <Leaf className="h-10 w-10 text-black" />
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-3 flex-wrap mb-2">
                    <h1 className="text-2xl font-bold text-slate-900">
                      {supplier.companyName}
                    </h1>
                    {supplier.verificationStatus === "verified" && (
                      <Badge className="bg-emerald-100 text-emerald-700 border-0">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Verified Supplier
                      </Badge>
                    )}
                    <Badge className="bg-blue-100 text-blue-700 border-0">
                      <Award className="h-3 w-3 mr-1" />
                      ISO Certified
                    </Badge>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-slate-600">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {supplier.city}, {supplier.state}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Est. {supplier.establishedYear}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Center: ABFI Score */}
            <div className="flex items-center gap-4">
              <ABFIScoreRing score={supplier.abfiScore} rating={supplier.abfiRating} />
              <div className="text-center">
                <p className="text-3xl font-bold text-slate-900">
                  {supplier.abfiScore}/100
                </p>
                <p className="text-sm text-[#D4AF37] font-medium">
                  Excellent Rating
                </p>
              </div>
            </div>

            {/* Right: CTA & Stats */}
            <div className="lg:w-72">
              <button className="w-full btn-gold mb-6">
                <MessageSquare className="h-4 w-4" />
                Contact Supplier
              </button>

              <Card className="bg-slate-50 border-slate-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-slate-600">
                    Supplier Overview
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Total Volume:</span>
                    <span className="font-semibold text-slate-900">
                      {supplier.totalVolume}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Active Contracts:</span>
                    <span className="font-semibold text-slate-900">
                      {supplier.activeContracts}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Response Time:</span>
                    <span className="font-semibold text-[#D4AF37]">
                      {supplier.responseTime}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container max-w-7xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column (2/3) */}
          <div className="lg:col-span-2 space-y-8">
            {/* About Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  About {supplier.companyName}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 whitespace-pre-line leading-relaxed">
                  {supplier.description}
                </p>
              </CardContent>
            </Card>

            {/* Feedstock Listings */}
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-4">
                Available Bamboo Feedstocks
              </h3>
              <div className="grid md:grid-cols-3 gap-4">
                {SAMPLE_FEEDSTOCKS.map(feedstock => (
                  <FeedstockCard key={feedstock.id} feedstock={feedstock} />
                ))}
              </div>
            </div>

            {/* Certifications & Production */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Certifications */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">
                    Certifications & Standards
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    {CERTIFICATIONS.map((cert, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg"
                      >
                        <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                          <cert.icon className="h-5 w-5 text-[#D4AF37]" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900">
                            {cert.name}
                          </p>
                          {cert.verified && (
                            <p className="text-xs text-[#D4AF37]">Verified</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Production Capacity */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">
                    Monthly Production Capacity (MT)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ProductionChart data={PRODUCTION_DATA} />
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Right Column (1/3) */}
          <div className="space-y-6">
            {/* Contact Information */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-gray-500" />
                  <span className="text-slate-700">{supplier.contactPhone}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-gray-500" />
                  <a
                    href={`mailto:${supplier.contactEmail}`}
                    className="text-[#D4AF37] hover:underline"
                  >
                    {supplier.contactEmail}
                  </a>
                </div>
                {supplier.website && (
                  <div className="flex items-center gap-3">
                    <Globe className="h-5 w-5 text-gray-500" />
                    <a
                      href={supplier.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#D4AF37] hover:underline flex items-center gap-1"
                    >
                      {supplier.website.replace(/^https?:\/\//, "")}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )}
                <div className="pt-4 border-t">
                  <button className="w-full btn-gold">
                    <MessageSquare className="h-4 w-4" />
                    Send Message
                  </button>
                </div>
              </CardContent>
            </Card>

            {/* Location */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Location</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-slate-100 rounded-lg h-40 flex items-center justify-center mb-3">
                  <div className="text-center">
                    <MapPin className="h-8 w-8 text-gray-500 mx-auto mb-2" />
                    <p className="text-sm text-black0">
                      {supplier.city}, {supplier.state} {supplier.postcode}
                    </p>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="w-full">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View on Google Maps
                </Button>
              </CardContent>
            </Card>

            {/* Downloadable Resources */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Downloadable Resources</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Technical Specs (PDF)
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Certifications (PDF)
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Sample Reports (PDF)
                </Button>
              </CardContent>
            </Card>

            {/* Bamboo Benefits Card */}
            <Card className="bg-gradient-to-br from-emerald-50 to-white border-emerald-200">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Leaf className="h-5 w-5 text-[#D4AF37]" />
                  <CardTitle className="text-lg text-emerald-800">
                    Why Bamboo?
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="text-sm text-emerald-700 space-y-2">
                <p>
                  <strong>Fast Growth:</strong> Bamboo can grow up to 91cm/day,
                  making it highly renewable.
                </p>
                <p>
                  <strong>Carbon Negative:</strong> Sequesters 35% more CO2 than
                  equivalent trees.
                </p>
                <p>
                  <strong>Low Ash:</strong> Premium bamboo chips produce minimal
                  ash, ideal for gasification.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
