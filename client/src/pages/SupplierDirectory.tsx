import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Search,
  MapPin,
  Package,
  Zap,
  Star,
  BadgeCheck,
  ChevronRight,
  Phone,
  Mail,
  Globe,
} from "lucide-react";
import { Link } from "wouter";

// Dummy supplier data
const suppliers = [
  {
    id: 1,
    name: "Wilmar Biofuels",
    location: "Barnawartha, VIC",
    feedstocks: ["Ethanol", "Biodiesel"],
    capacity: "50M L/year",
    certified: true,
    rating: 4.8,
    reviews: 12,
    description: "Australia's leading integrated biofuels producer with vertically integrated supply chain from canola production to refined biodiesel.",
    contact: {
      phone: "+61 3 5728 2000",
      email: "sales@wilmarbiofuels.com.au",
      website: "wilmarbiofuels.com.au",
    },
    certifications: ["ISCC EU", "RED II", "ABFI Verified"],
  },
  {
    id: 2,
    name: "Manildra Group",
    location: "Bomaderry, NSW",
    feedstocks: ["Ethanol"],
    capacity: "300M L/year",
    certified: true,
    rating: 4.9,
    reviews: 24,
    description: "One of the largest fuel-grade ethanol producers in Australia, using wheat starch as primary feedstock with advanced distillation technology.",
    contact: {
      phone: "+61 2 4421 0111",
      email: "biofuels@manildra.com.au",
      website: "manildra.com.au",
    },
    certifications: ["ISCC EU", "ABFI Verified", "ISO 14001"],
  },
  {
    id: 3,
    name: "Queensland Woodchip",
    location: "Gladstone, QLD",
    feedstocks: ["Woodchip"],
    capacity: "150K t/year",
    certified: true,
    rating: 4.6,
    reviews: 8,
    description: "Sustainable forestry operation producing high-quality woodchips from plantation eucalyptus for bioenergy applications.",
    contact: {
      phone: "+61 7 4972 5000",
      email: "supply@qldwoodchip.com.au",
      website: "qldwoodchip.com.au",
    },
    certifications: ["FSC", "PEFC", "ABFI Verified"],
  },
  {
    id: 4,
    name: "SA Biodiesel Co",
    location: "Port Adelaide, SA",
    feedstocks: ["Biodiesel", "Ethanol"],
    capacity: "25M L/year",
    certified: false,
    rating: 4.4,
    reviews: 6,
    description: "Regional biodiesel producer specializing in waste cooking oil and tallow conversion with low carbon intensity scores.",
    contact: {
      phone: "+61 8 8340 2000",
      email: "info@sabiodiesel.com.au",
      website: "sabiodiesel.com.au",
    },
    certifications: ["ISCC EU", "Pending ABFI Verification"],
  },
  {
    id: 5,
    name: "WA Biomass Energy",
    location: "Bunbury, WA",
    feedstocks: ["Woodchip", "Biodiesel"],
    capacity: "80K t/year",
    certified: true,
    rating: 4.7,
    reviews: 15,
    description: "Integrated biomass energy company converting agricultural residues and plantation forestry into renewable energy feedstocks.",
    contact: {
      phone: "+61 8 9791 1000",
      email: "sales@wabiomass.com.au",
      website: "wabiomass.com.au",
    },
    certifications: ["ISCC EU", "ABFI Verified", "AS/NZS 4708"],
  },
];

// Supplier Card Component
function SupplierCard({
  supplier,
  onViewProfile,
}: {
  supplier: (typeof suppliers)[0];
  onViewProfile: () => void;
}) {
  return (
    <Card className="h-full hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          {supplier.certified && (
            <Badge className="bg-[#D4AF37] text-black">
              <BadgeCheck className="h-3 w-3 mr-1" />
              Verified
            </Badge>
          )}
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 fill-[#D4AF37] text-[#D4AF37]" />
            <span className="font-medium">{supplier.rating}</span>
            <span className="text-gray-500 text-sm">({supplier.reviews})</span>
          </div>
        </div>
        <CardTitle className="text-xl mt-2">{supplier.name}</CardTitle>
        <CardDescription className="flex items-center gap-1">
          <MapPin className="h-4 w-4" />
          {supplier.location}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <Package className="h-4 w-4 text-gray-500" />
            <span>{supplier.feedstocks.join(" • ")}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Zap className="h-4 w-4 text-gray-500" />
            <span>{supplier.capacity} capacity</span>
          </div>
          <div className="flex flex-wrap gap-1 mt-3">
            {supplier.certifications.slice(0, 2).map((cert) => (
              <Badge key={cert} variant="outline" className="text-xs">
                {cert}
              </Badge>
            ))}
            {supplier.certifications.length > 2 && (
              <Badge variant="outline" className="text-xs">
                +{supplier.certifications.length - 2} more
              </Badge>
            )}
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          <Button
            variant="outline"
            className="flex-1"
            onClick={(e) => {
              e.stopPropagation();
              onViewProfile();
            }}
          >
            View Profile
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
          <Link href={`/quote-request?supplier=${supplier.id}`}>
            <Button className="bg-[#D4AF37] text-black hover:bg-[#E5C158]">
              Request Quote
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

// Supplier Detail Modal
function SupplierDetailModal({
  supplier,
  open,
  onClose,
}: {
  supplier: (typeof suppliers)[0] | null;
  open: boolean;
  onClose: () => void;
}) {
  if (!supplier) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3">
            {supplier.certified && (
              <Badge className="bg-[#D4AF37] text-black">
                <BadgeCheck className="h-3 w-3 mr-1" />
                Verified Supplier
              </Badge>
            )}
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-[#D4AF37] text-[#D4AF37]" />
              <span className="font-medium">{supplier.rating}</span>
              <span className="text-gray-500 text-sm">({supplier.reviews} reviews)</span>
            </div>
          </div>
          <DialogTitle className="text-2xl">{supplier.name}</DialogTitle>
          <DialogDescription className="flex items-center gap-1">
            <MapPin className="h-4 w-4" />
            {supplier.location}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div>
            <h4 className="font-semibold mb-2">About</h4>
            <p className="text-gray-600">{supplier.description}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold mb-2">Feedstocks</h4>
              <div className="flex flex-wrap gap-2">
                {supplier.feedstocks.map((f) => (
                  <Badge key={f} variant="secondary">
                    {f}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Capacity</h4>
              <p className="text-lg font-medium">{supplier.capacity}</p>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Certifications</h4>
            <div className="flex flex-wrap gap-2">
              {supplier.certifications.map((cert) => (
                <Badge key={cert} variant="outline">
                  {cert}
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Contact Information</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-gray-500" />
                <span>{supplier.contact.phone}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-gray-500" />
                <span>{supplier.contact.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-gray-500" />
                <span>{supplier.contact.website}</span>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Link href={`/quote-request?supplier=${supplier.id}`} className="flex-1">
              <Button className="w-full bg-[#D4AF37] text-black hover:bg-[#E5C158]">
                Request Quote
              </Button>
            </Link>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function SupplierDirectory() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSupplier, setSelectedSupplier] = useState<(typeof suppliers)[0] | null>(null);

  // Filter suppliers based on search
  const filteredSuppliers = suppliers.filter(
    (supplier) =>
      supplier.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      supplier.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      supplier.feedstocks.some((f) =>
        f.toLowerCase().includes(searchQuery.toLowerCase())
      )
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Supplier Directory</h1>
          <p className="text-gray-600">
            Browse certified suppliers and request quotes for biofuel feedstocks.
          </p>
        </div>

        {/* Search */}
        <div className="relative mb-8 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search by name, location, or feedstock..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Results count */}
        <p className="text-sm text-gray-600 mb-4">
          Showing {filteredSuppliers.length} of {suppliers.length} suppliers
        </p>

        {/* Supplier Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSuppliers.map((supplier) => (
            <SupplierCard
              key={supplier.id}
              supplier={supplier}
              onViewProfile={() => setSelectedSupplier(supplier)}
            />
          ))}
        </div>

        {/* Empty state */}
        {filteredSuppliers.length === 0 && (
          <div className="text-center py-12">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No suppliers found</h3>
            <p className="text-gray-600">
              Try adjusting your search terms or browse all suppliers.
            </p>
            <Button variant="outline" className="mt-4" onClick={() => setSearchQuery("")}>
              Clear Search
            </Button>
          </div>
        )}

        {/* Supplier Detail Modal */}
        <SupplierDetailModal
          supplier={selectedSupplier}
          open={!!selectedSupplier}
          onClose={() => setSelectedSupplier(null)}
        />
      </div>
    </div>
  );
}
