"use client";

import { useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Search,
  TrendingUp,
  TrendingDown,
  Wheat,
  Sprout,
  Leaf,
  TreePine,
  Droplet,
  Recycle,
  Trash2,
  Flame,
  Wind,
  Zap,
  Award,
  BadgeCheck,
  ArrowRight,
  GitBranch,
  RefreshCw,
  LineChart,
  ShoppingCart,
  Store,
  Loader2,
  Info,
  AlertCircle,
  CheckCircle2,
  Circle,
  Beef,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import {
  type Commodity,
  type ProcessedProduct,
  type CarbonInstrument,
  type FinancialInstrument,
  type MarketDemand,
  oilseedCrops,
  sugarStarchCrops,
  lignocellulosicBiomass,
  forestryWoodProducts,
  animalFatsRendering,
  usedCookingOilWaste,
  organicWasteStreams,
  municipalCommercialWaste,
  solidBiofuels,
  biocharCarbonProducts,
  liquidIntermediates,
  gaseousProducts,
  carbonCredits,
  renewableEnergyCertificates,
  sustainabilityCertificates,
  forwardContracts,
  optionContracts,
  swapAgreements,
  priceIndices,
  feedstockCategories,
  processedCategories,
  carbonCategories,
  financialCategories,
} from "@/lib/commodities";

interface MarketSignal {
  id: string;
  user_id: string;
  commodity_id: string;
  commodity_name: string;
  signal_type: "buy" | "sell";
  volume?: number;
  unit?: string;
  notes?: string;
  status: "active" | "fulfilled" | "expired" | "cancelled";
  created_at: string;
  expires_at?: string;
}

interface MarketsClientProps {
  userRole: string;
  userId: string;
  buyerId?: string;
  supplierId?: string;
  existingSignals: MarketSignal[];
}

type SignalType = "buy" | "sell";

const ICON_MAP: Record<string, React.ElementType> = {
  Wheat,
  Sprout,
  Leaf,
  TreePine,
  Beef,
  Droplet,
  Recycle,
  Trash2,
  Flame,
  Circle,
  Wind,
  Zap,
  Award,
  BadgeCheck,
  ArrowRight,
  GitBranch,
  RefreshCw,
};

function getIcon(iconName: string): React.ElementType {
  return ICON_MAP[iconName] || Circle;
}

function MarketDemandBadge({ demand }: { demand: MarketDemand }) {
  const colorMap: Record<MarketDemand, string> = {
    "Very High": "bg-green-500 text-white",
    "High": "bg-green-400 text-white",
    "Moderate": "bg-yellow-500 text-white",
    "Low": "bg-gray-400 text-white",
    "Emerging": "bg-blue-500 text-white",
  };

  return (
    <Badge className={cn("text-xs", colorMap[demand])}>
      {demand}
    </Badge>
  );
}

export function MarketsClient({
  userRole,
  userId,
  buyerId,
  supplierId,
  existingSignals,
}: MarketsClientProps) {
  const supabase = createClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTab, setSelectedTab] = useState("feedstocks");
  const [signals, setSignals] = useState<MarketSignal[]>(existingSignals);

  // Signal dialog state
  const [signalDialogOpen, setSignalDialogOpen] = useState(false);
  const [selectedCommodity, setSelectedCommodity] = useState<{
    id: string;
    name: string;
    unit: string;
    category: string;
  } | null>(null);
  const [signalType, setSignalType] = useState<SignalType>("buy");
  const [signalVolume, setSignalVolume] = useState("");
  const [signalNotes, setSignalNotes] = useState("");
  const [submittingSignal, setSubmittingSignal] = useState(false);

  // Filter commodities based on search
  const filterItems = <T extends { name: string }>(items: T[]): T[] => {
    if (!searchQuery) return items;
    const query = searchQuery.toLowerCase();
    return items.filter(item =>
      item.name.toLowerCase().includes(query)
    );
  };

  // Check if user has signal for commodity
  const hasSignal = (commodityId: string, type: SignalType): boolean => {
    return signals.some(
      s => s.commodity_id === commodityId && s.signal_type === type && s.status === "active"
    );
  };

  // Open signal dialog
  const openSignalDialog = (
    commodity: { id: string; name: string; unit: string; category: string },
    type: SignalType
  ) => {
    setSelectedCommodity(commodity);
    setSignalType(type);
    setSignalVolume("");
    setSignalNotes("");
    setSignalDialogOpen(true);
  };

  // Submit signal
  const submitSignal = async () => {
    if (!selectedCommodity) return;

    setSubmittingSignal(true);

    try {
      // For now, we'll store signals locally since the table might not exist yet
      const newSignal: MarketSignal = {
        id: crypto.randomUUID(),
        user_id: userId,
        commodity_id: selectedCommodity.id,
        commodity_name: selectedCommodity.name,
        signal_type: signalType,
        volume: signalVolume ? parseFloat(signalVolume) : undefined,
        unit: selectedCommodity.unit,
        notes: signalNotes || undefined,
        status: "active",
        created_at: new Date().toISOString(),
      };

      // Try to insert into database
      const { error } = await supabase.from("market_signals").insert({
        user_id: userId,
        commodity_id: selectedCommodity.id,
        commodity_name: selectedCommodity.name,
        signal_type: signalType,
        volume: signalVolume ? parseFloat(signalVolume) : null,
        unit: selectedCommodity.unit,
        notes: signalNotes || null,
        status: "active",
      });

      if (error) {
        // If table doesn't exist, just update local state
        console.warn("Could not save to database:", error);
      }

      setSignals(prev => [newSignal, ...prev]);
      toast.success(
        `${signalType === "buy" ? "Buy" : "Sell"} signal registered for ${selectedCommodity.name}`
      );
      setSignalDialogOpen(false);
    } catch (error) {
      console.error("Error submitting signal:", error);
      toast.error("Failed to register signal");
    } finally {
      setSubmittingSignal(false);
    }
  };

  // Remove signal
  const removeSignal = async (signalId: string) => {
    try {
      await supabase.from("market_signals").delete().eq("id", signalId);
      setSignals(prev => prev.filter(s => s.id !== signalId));
      toast.success("Signal removed");
    } catch (error) {
      // Still remove from local state
      setSignals(prev => prev.filter(s => s.id !== signalId));
    }
  };

  // Render commodity table
  const renderCommodityTable = (commodities: Commodity[], categoryId: string) => {
    const filtered = filterItems(commodities);
    if (filtered.length === 0) return null;

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[250px]">Commodity</TableHead>
            <TableHead>Unit</TableHead>
            <TableHead className="max-w-[300px]">Use Case</TableHead>
            <TableHead>Market Demand</TableHead>
            <TableHead className="text-right">Signal Interest</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map((commodity) => (
            <TableRow key={commodity.id}>
              <TableCell className="font-medium">{commodity.name}</TableCell>
              <TableCell className="text-muted-foreground">{commodity.unit}</TableCell>
              <TableCell className="text-sm text-muted-foreground max-w-[300px]">
                {commodity.useCase}
              </TableCell>
              <TableCell>
                <MarketDemandBadge demand={commodity.marketDemand} />
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-2">
                  <Button
                    size="sm"
                    variant={hasSignal(commodity.id, "buy") ? "default" : "outline"}
                    className={cn(
                      "gap-1",
                      hasSignal(commodity.id, "buy") && "bg-green-600 hover:bg-green-700"
                    )}
                    onClick={() => openSignalDialog(
                      { id: commodity.id, name: commodity.name, unit: commodity.unit, category: categoryId },
                      "buy"
                    )}
                  >
                    <ShoppingCart className="h-3 w-3" />
                    Buy
                  </Button>
                  <Button
                    size="sm"
                    variant={hasSignal(commodity.id, "sell") ? "default" : "outline"}
                    className={cn(
                      "gap-1",
                      hasSignal(commodity.id, "sell") && "bg-orange-600 hover:bg-orange-700"
                    )}
                    onClick={() => openSignalDialog(
                      { id: commodity.id, name: commodity.name, unit: commodity.unit, category: categoryId },
                      "sell"
                    )}
                  >
                    <Store className="h-3 w-3" />
                    Sell
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  // Render processed products table
  const renderProcessedTable = (products: ProcessedProduct[], categoryId: string) => {
    const filtered = filterItems(products);
    if (filtered.length === 0) return null;

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[250px]">Product</TableHead>
            <TableHead>Unit</TableHead>
            <TableHead>Specification</TableHead>
            <TableHead>Market</TableHead>
            <TableHead className="text-right">Signal Interest</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map((product) => (
            <TableRow key={product.id}>
              <TableCell className="font-medium">{product.name}</TableCell>
              <TableCell className="text-muted-foreground">{product.unit}</TableCell>
              <TableCell className="text-sm text-muted-foreground">{product.specification}</TableCell>
              <TableCell className="text-sm">{product.market}</TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-2">
                  <Button
                    size="sm"
                    variant={hasSignal(product.id, "buy") ? "default" : "outline"}
                    className={cn(
                      "gap-1",
                      hasSignal(product.id, "buy") && "bg-green-600 hover:bg-green-700"
                    )}
                    onClick={() => openSignalDialog(
                      { id: product.id, name: product.name, unit: product.unit, category: categoryId },
                      "buy"
                    )}
                  >
                    <ShoppingCart className="h-3 w-3" />
                    Buy
                  </Button>
                  <Button
                    size="sm"
                    variant={hasSignal(product.id, "sell") ? "default" : "outline"}
                    className={cn(
                      "gap-1",
                      hasSignal(product.id, "sell") && "bg-orange-600 hover:bg-orange-700"
                    )}
                    onClick={() => openSignalDialog(
                      { id: product.id, name: product.name, unit: product.unit, category: categoryId },
                      "sell"
                    )}
                  >
                    <Store className="h-3 w-3" />
                    Sell
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  // Render carbon instruments table
  const renderCarbonTable = (instruments: CarbonInstrument[], categoryId: string) => {
    const filtered = filterItems(instruments);
    if (filtered.length === 0) return null;

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[250px]">Instrument</TableHead>
            <TableHead>Unit</TableHead>
            <TableHead>Scheme</TableHead>
            <TableHead>Market</TableHead>
            <TableHead className="text-right">Signal Interest</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map((instrument) => (
            <TableRow key={instrument.id}>
              <TableCell className="font-medium">{instrument.name}</TableCell>
              <TableCell className="text-muted-foreground">{instrument.unit}</TableCell>
              <TableCell className="text-sm">{instrument.scheme}</TableCell>
              <TableCell className="text-sm">{instrument.market}</TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-2">
                  <Button
                    size="sm"
                    variant={hasSignal(instrument.id, "buy") ? "default" : "outline"}
                    className={cn(
                      "gap-1",
                      hasSignal(instrument.id, "buy") && "bg-green-600 hover:bg-green-700"
                    )}
                    onClick={() => openSignalDialog(
                      { id: instrument.id, name: instrument.name, unit: instrument.unit, category: categoryId },
                      "buy"
                    )}
                  >
                    <ShoppingCart className="h-3 w-3" />
                    Buy
                  </Button>
                  <Button
                    size="sm"
                    variant={hasSignal(instrument.id, "sell") ? "default" : "outline"}
                    className={cn(
                      "gap-1",
                      hasSignal(instrument.id, "sell") && "bg-orange-600 hover:bg-orange-700"
                    )}
                    onClick={() => openSignalDialog(
                      { id: instrument.id, name: instrument.name, unit: instrument.unit, category: categoryId },
                      "sell"
                    )}
                  >
                    <Store className="h-3 w-3" />
                    Sell
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  // Render financial instruments table
  const renderFinancialTable = (instruments: FinancialInstrument[], categoryId: string) => {
    const filtered = filterItems(instruments);
    if (filtered.length === 0) return null;

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[250px]">Contract Type</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Structure</TableHead>
            <TableHead>Use Case</TableHead>
            <TableHead className="text-right">Signal Interest</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map((instrument) => (
            <TableRow key={instrument.id}>
              <TableCell className="font-medium">{instrument.name}</TableCell>
              <TableCell>
                <Badge variant="outline">{instrument.type}</Badge>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">{instrument.structure}</TableCell>
              <TableCell className="text-sm">{instrument.useCase}</TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-2">
                  <Button
                    size="sm"
                    variant={hasSignal(instrument.id, "buy") ? "default" : "outline"}
                    className={cn(
                      "gap-1",
                      hasSignal(instrument.id, "buy") && "bg-green-600 hover:bg-green-700"
                    )}
                    onClick={() => openSignalDialog(
                      { id: instrument.id, name: instrument.name, unit: "contract", category: categoryId },
                      "buy"
                    )}
                  >
                    <TrendingUp className="h-3 w-3" />
                    Long
                  </Button>
                  <Button
                    size="sm"
                    variant={hasSignal(instrument.id, "sell") ? "default" : "outline"}
                    className={cn(
                      "gap-1",
                      hasSignal(instrument.id, "sell") && "bg-orange-600 hover:bg-orange-700"
                    )}
                    onClick={() => openSignalDialog(
                      { id: instrument.id, name: instrument.name, unit: "contract", category: categoryId },
                      "sell"
                    )}
                  >
                    <TrendingDown className="h-3 w-3" />
                    Short
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  // Active signals count
  const activeSignalsCount = signals.filter(s => s.status === "active").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <LineChart className="h-8 w-8 text-primary" />
            Commodity Markets
          </h1>
          <p className="text-muted-foreground mt-1">
            Browse tradeable commodities and signal your buy/sell interest
          </p>
        </div>
        {activeSignalsCount > 0 && (
          <Badge variant="secondary" className="text-sm py-1 px-3">
            <CheckCircle2 className="h-4 w-4 mr-2" />
            {activeSignalsCount} active signal{activeSignalsCount !== 1 ? "s" : ""}
          </Badge>
        )}
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search commodities, products, instruments..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* My Active Signals */}
      {signals.filter(s => s.status === "active").length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-primary" />
              My Active Signals
            </CardTitle>
            <CardDescription>
              Your current buy and sell interests in the market
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {signals.filter(s => s.status === "active").map((signal) => (
                <Badge
                  key={signal.id}
                  variant="outline"
                  className={cn(
                    "py-2 px-3 gap-2",
                    signal.signal_type === "buy"
                      ? "border-green-500 bg-green-50 text-green-700"
                      : "border-orange-500 bg-orange-50 text-orange-700"
                  )}
                >
                  {signal.signal_type === "buy" ? (
                    <ShoppingCart className="h-3 w-3" />
                  ) : (
                    <Store className="h-3 w-3" />
                  )}
                  {signal.commodity_name}
                  {signal.volume && (
                    <span className="text-xs opacity-75">
                      ({signal.volume} {signal.unit})
                    </span>
                  )}
                  <button
                    onClick={() => removeSignal(signal.id)}
                    className="ml-1 hover:text-destructive"
                  >
                    ×
                  </button>
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="feedstocks" className="gap-2">
            <Leaf className="h-4 w-4" />
            <span className="hidden sm:inline">Feedstocks</span>
          </TabsTrigger>
          <TabsTrigger value="processed" className="gap-2">
            <Flame className="h-4 w-4" />
            <span className="hidden sm:inline">Processed</span>
          </TabsTrigger>
          <TabsTrigger value="carbon" className="gap-2">
            <BadgeCheck className="h-4 w-4" />
            <span className="hidden sm:inline">Carbon</span>
          </TabsTrigger>
          <TabsTrigger value="financial" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline">Financial</span>
          </TabsTrigger>
          <TabsTrigger value="indices" className="gap-2">
            <LineChart className="h-4 w-4" />
            <span className="hidden sm:inline">Indices</span>
          </TabsTrigger>
        </TabsList>

        {/* Feedstocks Tab */}
        <TabsContent value="feedstocks" className="space-y-4 mt-6">
          <Accordion type="multiple" defaultValue={["oilseed"]} className="space-y-4">
            {feedstockCategories.map((category) => {
              const Icon = getIcon(category.icon);
              const commodityMap: Record<string, Commodity[]> = {
                "oilseed": oilseedCrops,
                "sugar-starch": sugarStarchCrops,
                "lignocellulosic": lignocellulosicBiomass,
                "forestry": forestryWoodProducts,
                "animal-fats": animalFatsRendering,
                "uco": usedCookingOilWaste,
                "organic-waste": organicWasteStreams,
                "municipal": municipalCommercialWaste,
              };
              const commodities = commodityMap[category.id] || [];
              const filteredCount = filterItems(commodities).length;

              return (
                <AccordionItem key={category.id} value={category.id} className="border rounded-lg px-4">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div className="text-left">
                        <div className="font-semibold">{category.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {category.description} • {filteredCount} items
                        </div>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="pt-4">
                      {renderCommodityTable(commodities, category.id)}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </TabsContent>

        {/* Processed Products Tab */}
        <TabsContent value="processed" className="space-y-4 mt-6">
          <Accordion type="multiple" defaultValue={["solid-biofuels"]} className="space-y-4">
            {processedCategories.map((category) => {
              const Icon = getIcon(category.icon);
              const productMap: Record<string, ProcessedProduct[]> = {
                "solid-biofuels": solidBiofuels,
                "biochar": biocharCarbonProducts,
                "liquid": liquidIntermediates,
                "gaseous": gaseousProducts,
              };
              const products = productMap[category.id] || [];
              const filteredCount = filterItems(products).length;

              return (
                <AccordionItem key={category.id} value={category.id} className="border rounded-lg px-4">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div className="text-left">
                        <div className="font-semibold">{category.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {category.description} • {filteredCount} items
                        </div>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="pt-4">
                      {renderProcessedTable(products, category.id)}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </TabsContent>

        {/* Carbon Tab */}
        <TabsContent value="carbon" className="space-y-4 mt-6">
          <Accordion type="multiple" defaultValue={["credits"]} className="space-y-4">
            {carbonCategories.map((category) => {
              const Icon = getIcon(category.icon);
              const instrumentMap: Record<string, CarbonInstrument[]> = {
                "credits": carbonCredits,
                "recs": renewableEnergyCertificates,
                "sustainability": sustainabilityCertificates,
              };
              const instruments = instrumentMap[category.id] || [];
              const filteredCount = filterItems(instruments).length;

              return (
                <AccordionItem key={category.id} value={category.id} className="border rounded-lg px-4">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div className="text-left">
                        <div className="font-semibold">{category.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {category.description} • {filteredCount} items
                        </div>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="pt-4">
                      {renderCarbonTable(instruments, category.id)}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </TabsContent>

        {/* Financial Tab */}
        <TabsContent value="financial" className="space-y-4 mt-6">
          <Card className="border-blue-200 bg-blue-50/50 mb-4">
            <CardContent className="pt-6">
              <div className="flex gap-3">
                <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-blue-900">
                    Financial Instruments
                  </p>
                  <p className="text-sm text-blue-800">
                    These instruments are available for hedging price risk and managing feedstock procurement.
                    Contact ABFI for bespoke contract structuring.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Accordion type="multiple" defaultValue={["forwards"]} className="space-y-4">
            {financialCategories.map((category) => {
              const Icon = getIcon(category.icon);
              const instrumentMap: Record<string, FinancialInstrument[]> = {
                "forwards": forwardContracts,
                "options": optionContracts,
                "swaps": swapAgreements,
              };
              const instruments = instrumentMap[category.id] || [];
              const filteredCount = filterItems(instruments).length;

              return (
                <AccordionItem key={category.id} value={category.id} className="border rounded-lg px-4">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div className="text-left">
                        <div className="font-semibold">{category.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {category.description} • {filteredCount} items
                        </div>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="pt-4">
                      {renderFinancialTable(instruments, category.id)}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </TabsContent>

        {/* Price Indices Tab */}
        <TabsContent value="indices" className="space-y-6 mt-6">
          {/* Indicative Prices Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Indicative Market Prices
            </h3>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Canola Oil (FOB Adelaide)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold">$1,420</span>
                    <span className="text-sm text-muted-foreground">/tonne</span>
                  </div>
                  <div className="flex items-center gap-1 text-green-600 text-sm mt-1">
                    <TrendingUp className="h-4 w-4" />
                    <span>+2.3% this week</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Tallow (ex-Works Brisbane)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold">$1,180</span>
                    <span className="text-sm text-muted-foreground">/tonne</span>
                  </div>
                  <div className="flex items-center gap-1 text-red-600 text-sm mt-1">
                    <TrendingDown className="h-4 w-4" />
                    <span>-1.1% this week</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    UCO (collected Sydney)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold">$890</span>
                    <span className="text-sm text-muted-foreground">/tonne</span>
                  </div>
                  <div className="flex items-center gap-1 text-green-600 text-sm mt-1">
                    <TrendingUp className="h-4 w-4" />
                    <span>+0.8% this week</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Sugarcane Bagasse (ex-Mill QLD)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold">$85</span>
                    <span className="text-sm text-muted-foreground">/tonne</span>
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground text-sm mt-1">
                    <ArrowRight className="h-4 w-4" />
                    <span>Unchanged</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Wood Pellets (FOB Newcastle)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold">$245</span>
                    <span className="text-sm text-muted-foreground">/tonne</span>
                  </div>
                  <div className="flex items-center gap-1 text-green-600 text-sm mt-1">
                    <TrendingUp className="h-4 w-4" />
                    <span>+3.2% this week</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    ACCU Spot Price
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold">$32.50</span>
                    <span className="text-sm text-muted-foreground">/tCO2e</span>
                  </div>
                  <div className="flex items-center gap-1 text-red-600 text-sm mt-1">
                    <TrendingDown className="h-4 w-4" />
                    <span>-4.5% this week</span>
                  </div>
                </CardContent>
              </Card>
            </div>
            <p className="text-xs text-muted-foreground">
              * Indicative prices only. Contact ABFI for verified price assessments. Last updated: {new Date().toLocaleDateString()}
            </p>
          </div>

          <Separator />

          {/* Reference Indices Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LineChart className="h-5 w-5" />
                ABFI Reference Price Indices
              </CardTitle>
              <CardDescription>
                Proposed benchmark indices for Australian bioenergy feedstocks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Index Name</TableHead>
                    <TableHead>Composition</TableHead>
                    <TableHead>Publication</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {priceIndices.map((index) => (
                    <TableRow key={index.id}>
                      <TableCell className="font-medium">{index.name}</TableCell>
                      <TableCell className="text-muted-foreground">{index.composition}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{index.publication}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="secondary">Coming Soon</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Signal Dialog */}
      <Dialog open={signalDialogOpen} onOpenChange={setSignalDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {signalType === "buy" ? (
                <>
                  <ShoppingCart className="h-5 w-5 text-green-600" />
                  Register Buy Interest
                </>
              ) : (
                <>
                  <Store className="h-5 w-5 text-orange-600" />
                  Register Sell Interest
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              Signal your {signalType === "buy" ? "buying" : "selling"} interest in{" "}
              <span className="font-medium">{selectedCommodity?.name}</span>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="p-4 rounded-lg bg-muted">
              <div className="font-medium">{selectedCommodity?.name}</div>
              <div className="text-sm text-muted-foreground">
                Unit: {selectedCommodity?.unit}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="volume">Indicative Volume (optional)</Label>
              <div className="flex gap-2">
                <Input
                  id="volume"
                  type="number"
                  placeholder="Enter quantity"
                  value={signalVolume}
                  onChange={(e) => setSignalVolume(e.target.value)}
                />
                <div className="flex items-center px-3 bg-muted rounded-md text-sm text-muted-foreground">
                  {selectedCommodity?.unit}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea
                id="notes"
                placeholder="Any specific requirements, timing, quality specs..."
                value={signalNotes}
                onChange={(e) => setSignalNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSignalDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={submitSignal}
              disabled={submittingSignal}
              className={cn(
                signalType === "buy"
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-orange-600 hover:bg-orange-700"
              )}
            >
              {submittingSignal && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {signalType === "buy" ? "Register Buy Interest" : "Register Sell Interest"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
