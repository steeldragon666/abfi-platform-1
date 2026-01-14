/**
 * Beema Bamboo Landing Page
 * 
 * Australia's perennial biofuel base-load feedstock.
 * Features:
 * - Hero section with value proposition
 * - Why Beema? cards (drought-proof, carbon hero, bankable)
 * - Interactive economics slider/calculator
 * - Suitability map embed
 * - Timeline stepper (Year 0-30)
 * - Lender/ESG badge carousel
 * - CTA to add Beema to profile
 */

import { useState, useMemo } from 'react';
import { Link } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Droplets,
  Leaf,
  Banknote,
  TrendingUp,
  Calendar,
  MapPin,
  Shield,
  Award,
  ArrowRight,
  CheckCircle2,
  Sprout,
  TreeDeciduous,
  Factory,
  Zap,
  Clock,
  DollarSign,
  BarChart3,
  Sun,
  CloudRain,
  Mountain,
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  Legend,
} from 'recharts';
import { cn } from '@/lib/utils';

// ============================================================================
// CONSTANTS
// ============================================================================

// Economics model constants - Updated per protocol (5-yr+ stand)
const BEEMA_CONSTANTS = {
  yieldTonnesDMPerHa: 100, // Full yield from Year 3+ (per protocol)
  establishmentYield: 40, // Year 2 yield
  pricePerTonne: 160, // Floor price AUD (intro, first 1000 growers)
  priceEscalation: 0.03, // CPI + 3% after year 5
  carbonSequestration: 80, // t CO2 per ha per year (per protocol, 5-yr+ stand)
  accuPrice: 30, // AUD per ACCU (for 25% buffer pool)
  discountRate: 0.10, // 10% for NPV
  plantingCostPerHa: 4500, // Establishment cost
  harvestCostPerTonne: 35, // Variable harvest cost
  contractYears: 15, // Powerplant Energy guaranteed offtake
  lifespanYears: 30,
  introSlots: 1000, // First 1,000 growers get floor price
  offtaker: 'Powerplant Energy Pty Ltd',
};

// Timeline steps - Updated for 100 t DM yield
const TIMELINE_STEPS = [
  {
    year: 0,
    title: 'Plant',
    description: 'Tissue-culture "energy elite" planting, irrigation setup',
    cashFlow: -4500,
    yield: 0,
  },
  {
    year: 1,
    title: 'Establish',
    description: 'Root system development, no harvest',
    cashFlow: -800,
    yield: 0,
  },
  {
    year: 2,
    title: 'First Harvest',
    description: 'Initial culm harvest begins',
    cashFlow: 4900,
    yield: 40,
  },
  {
    year: 3,
    title: 'Full Yield',
    description: 'Mature stand, 100 t DM/ha/yr @ $160/t',
    cashFlow: 12500,
    yield: 100,
  },
  {
    year: 15,
    title: 'Contract End',
    description: 'Powerplant Energy option to extend 5 yrs at market price',
    cashFlow: 14200,
    yield: 100,
  },
  {
    year: 30,
    title: 'Replant',
    description: 'End of lifecycle, new rhizomes',
    cashFlow: -4500,
    yield: 0,
  },
];

// Financial institutions under assessment (no "approved" language)
const FINANCING_PARTNERS = [
  { name: 'CBA', fullName: 'Commonwealth Bank of Australia', status: 'under_assessment' },
  { name: 'NAB', fullName: 'National Australia Bank', status: 'under_assessment' },
  { name: 'Westpac', fullName: 'Westpac Institutional Bank', status: 'under_assessment' },
  { name: 'ANZ', fullName: 'ANZ Corporate & Commercial', status: 'under_assessment' },
  { name: 'CEFC', fullName: 'Clean Energy Finance Corporation', status: 'under_assessment' },
  { name: 'ARENA', fullName: 'Australian Renewable Energy Agency', status: 'grant_component' },
  { name: 'EFA', fullName: 'Export Finance Australia', status: 'export_credit' },
];

// Why Beema cards - Updated metrics per protocol
const WHY_BEEMA = [
  {
    icon: Droplets,
    title: 'Drought-Proof',
    description: 'Deep rhizome system survives on < 400mm annual rainfall. Proven in 17 Australian field trials across variable climate zones.',
    stat: '< 400mm',
    statLabel: 'rainfall survival',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
  {
    icon: Leaf,
    title: 'Carbon Hero',
    description: '80 t CO₂ ha⁻¹ yr⁻¹ sequestered when grown and fertilised per protocol (5-yr+ stand). Dual revenue from feedstock + ACCUs.',
    stat: '80 t CO₂',
    statLabel: 'sequestered/ha/yr',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
  },
  {
    icon: Banknote,
    title: 'Bankable',
    description: '100 t DM ha⁻¹ yr⁻¹ dry-matter biomass under the same protocol. 15-year guaranteed offtake with Powerplant Energy.',
    stat: '100 t DM',
    statLabel: 'biomass/ha/yr',
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
  },
];

// ============================================================================
// COMPONENTS
// ============================================================================

// Bamboo Icon SVG (green bamboo shoot inside fuel droplet)
function BeemaBambooIcon({ className }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 48 48" 
      className={cn("h-12 w-12", className)}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Fuel droplet outline */}
      <path 
        d="M24 4C24 4 8 20 8 30C8 38.837 15.163 46 24 46C32.837 46 40 38.837 40 30C40 20 24 4 24 4Z" 
        fill="#dcfce7"
        stroke="#16a34a"
        strokeWidth="2"
      />
      {/* Bamboo culm */}
      <rect x="21" y="14" width="6" height="24" rx="2" fill="#22c55e" />
      {/* Bamboo nodes */}
      <rect x="20" y="18" width="8" height="2" rx="1" fill="#15803d" />
      <rect x="20" y="26" width="8" height="2" rx="1" fill="#15803d" />
      <rect x="20" y="34" width="8" height="2" rx="1" fill="#15803d" />
      {/* Bamboo leaves */}
      <ellipse cx="16" cy="20" rx="4" ry="2" fill="#4ade80" transform="rotate(-30 16 20)" />
      <ellipse cx="32" cy="22" rx="4" ry="2" fill="#4ade80" transform="rotate(30 32 22)" />
      <ellipse cx="15" cy="28" rx="3" ry="1.5" fill="#4ade80" transform="rotate(-40 15 28)" />
    </svg>
  );
}

// Economics Calculator Component - Updated defaults
function EconomicsCalculator() {
  const [hectares, setHectares] = useState(50);
  
  // Mock remaining intro slots (would come from beema_intro_slots table)
  const remainingIntroSlots = 847; // Out of 1,000
  
  const economics = useMemo(() => {
    const years = BEEMA_CONSTANTS.contractYears;
    const discountRate = BEEMA_CONSTANTS.discountRate;
    const pricePerTonne = BEEMA_CONSTANTS.pricePerTonne; // $160 floor price
    
    // Calculate annual revenues
    let totalRevenue = 0;
    let npv = 0;
    let carbonCredits = 0;
    const cashFlows: { year: number; revenue: number; carbon: number; net: number }[] = [];
    
    for (let year = 0; year <= years; year++) {
      let yield_t = 0;
      let harvestCost = 0;
      let plantingCost = 0;
      
      if (year === 0) {
        plantingCost = BEEMA_CONSTANTS.plantingCostPerHa * hectares;
      } else if (year === 1) {
        // Establishment year - minimal costs
        plantingCost = 800 * hectares;
      } else if (year === 2) {
        yield_t = BEEMA_CONSTANTS.establishmentYield * hectares;
        harvestCost = BEEMA_CONSTANTS.harvestCostPerTonne * yield_t;
      } else {
        yield_t = BEEMA_CONSTANTS.yieldTonnesDMPerHa * hectares;
        harvestCost = BEEMA_CONSTANTS.harvestCostPerTonne * yield_t;
      }
      
      // Price escalation: fixed first 5 years, then CPI + 3%
      const adjustedPrice = year <= 5 
        ? pricePerTonne 
        : pricePerTonne * Math.pow(1 + BEEMA_CONSTANTS.priceEscalation, year - 5);
      const revenue = yield_t * adjustedPrice;
      
      // Carbon credits (25% buffer pool = 75% of ACCUs sold)
      const carbonRevenue = year >= 1 
        ? BEEMA_CONSTANTS.carbonSequestration * hectares * BEEMA_CONSTANTS.accuPrice * 0.75
        : 0;
      
      const netCashFlow = revenue + carbonRevenue - harvestCost - plantingCost;
      const discountedCashFlow = netCashFlow / Math.pow(1 + discountRate, year);
      
      totalRevenue += revenue;
      npv += discountedCashFlow;
      carbonCredits += carbonRevenue;
      
      cashFlows.push({
        year,
        revenue: Math.round(revenue),
        carbon: Math.round(carbonRevenue),
        net: Math.round(netCashFlow),
      });
    }
    
    // Calculate IRR using Newton-Raphson approximation
    const netCashFlowArray = cashFlows.map(cf => cf.net);
    let irr = 0.15; // Initial guess
    for (let i = 0; i < 100; i++) {
      let npvCalc = 0;
      let derivative = 0;
      for (let t = 0; t < netCashFlowArray.length; t++) {
        npvCalc += netCashFlowArray[t] / Math.pow(1 + irr, t);
        derivative -= t * netCashFlowArray[t] / Math.pow(1 + irr, t + 1);
      }
      const newIrr = irr - npvCalc / derivative;
      if (Math.abs(newIrr - irr) < 0.0001) break;
      irr = newIrr;
    }
    
    // Total contract value over 15 years
    const totalContractValue = cashFlows.reduce((sum, cf) => sum + cf.revenue + cf.carbon, 0);
    
    return {
      annualGreenTonnes: Math.round(BEEMA_CONSTANTS.yieldTonnesDMPerHa * hectares),
      annualCarbonTonnes: Math.round(BEEMA_CONSTANTS.carbonSequestration * hectares),
      irr: Math.max(0, Math.min(1, irr)) * 100,
      npv: Math.round(npv),
      annualCarbonCredits: Math.round(BEEMA_CONSTANTS.carbonSequestration * hectares * BEEMA_CONSTANTS.accuPrice * 0.75),
      totalRevenue: Math.round(totalRevenue),
      totalContractValue: Math.round(totalContractValue),
      cashFlows,
    };
  }, [hectares]);
  
  return (
    <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-white">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-green-600" />
          Economics Calculator
        </CardTitle>
        <CardDescription>
          Drag to see your projected returns • 15-year guaranteed offtake with Powerplant Energy
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Intro Slots Counter */}
        <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-600" />
              <span className="text-sm font-medium text-amber-800">Intro Floor Price: $160/t DM</span>
            </div>
            <Badge className="bg-amber-500">
              {remainingIntroSlots} of 1,000 slots remaining
            </Badge>
          </div>
          <p className="text-xs text-amber-600 mt-1">
            First 1,000 growers receive floor price + tissue-culture clones at cost (no royalty) + free agronomic protocol pack
          </p>
        </div>
        
        {/* Default Parameters Display */}
        <div className="grid grid-cols-4 gap-2 text-center">
          <div className="p-2 rounded bg-gray-50">
            <p className="text-lg font-bold text-gray-800">100</p>
            <p className="text-xs text-gray-500">t DM/ha/yr</p>
          </div>
          <div className="p-2 rounded bg-gray-50">
            <p className="text-lg font-bold text-gray-800">80</p>
            <p className="text-xs text-gray-500">t CO₂/ha/yr</p>
          </div>
          <div className="p-2 rounded bg-gray-50">
            <p className="text-lg font-bold text-gray-800">$160</p>
            <p className="text-xs text-gray-500">floor price/t</p>
          </div>
          <div className="p-2 rounded bg-gray-50">
            <p className="text-lg font-bold text-gray-800">15</p>
            <p className="text-xs text-gray-500">yr contract</p>
          </div>
        </div>
        
        {/* Hectares Slider */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <label className="text-sm font-medium">Hectares Planted</label>
            <Badge variant="outline" className="text-lg font-bold px-3">
              {hectares} ha
            </Badge>
          </div>
          <Slider
            value={[hectares]}
            min={1}
            max={500}
            step={1}
            onValueChange={(v) => setHectares(v[0])}
            className="py-2"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>1 ha</span>
            <span>250 ha</span>
            <span>500 ha</span>
          </div>
        </div>
        
        <Separator />
        
        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-lg bg-green-100">
            <div className="flex items-center gap-2 mb-1">
              <Sprout className="h-4 w-4 text-green-600" />
              <span className="text-xs text-green-700">Annual Yield</span>
            </div>
            <p className="text-2xl font-bold text-green-800">
              {economics.annualGreenTonnes.toLocaleString()} t
            </p>
            <p className="text-xs text-green-600">dry matter/year</p>
          </div>
          
          <div className="p-4 rounded-lg bg-emerald-100">
            <div className="flex items-center gap-2 mb-1">
              <Leaf className="h-4 w-4 text-emerald-600" />
              <span className="text-xs text-emerald-700">Annual Carbon</span>
            </div>
            <p className="text-2xl font-bold text-emerald-800">
              {economics.annualCarbonTonnes.toLocaleString()} t
            </p>
            <p className="text-xs text-emerald-600">CO₂ sequestered/year</p>
          </div>
          
          <div className="p-4 rounded-lg bg-amber-100">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-amber-600" />
              <span className="text-xs text-amber-700">IRR</span>
            </div>
            <p className="text-2xl font-bold text-amber-800">
              {economics.irr.toFixed(1)}%
            </p>
            <p className="text-xs text-amber-600">@ $160/t (CPI+3% after yr 5)</p>
          </div>
          
          <div className="p-4 rounded-lg bg-blue-100">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="h-4 w-4 text-blue-600" />
              <span className="text-xs text-blue-700">NPV (10% disc)</span>
            </div>
            <p className="text-2xl font-bold text-blue-800">
              ${(economics.npv / 1000).toFixed(0)}K
            </p>
            <p className="text-xs text-blue-600">15-year contract</p>
          </div>
        </div>
        
        {/* Additional Metrics Row */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-lg bg-purple-100">
            <div className="flex items-center gap-2 mb-1">
              <Leaf className="h-4 w-4 text-purple-600" />
              <span className="text-xs text-purple-700">Carbon Cash (75%)</span>
            </div>
            <p className="text-2xl font-bold text-purple-800">
              ${(economics.annualCarbonCredits / 1000).toFixed(0)}K
            </p>
            <p className="text-xs text-purple-600">ACCUs/year @ $30 (25% buffer)</p>
          </div>
          
          <div className="p-4 rounded-lg bg-indigo-100">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="h-4 w-4 text-indigo-600" />
              <span className="text-xs text-indigo-700">Total Contract Value</span>
            </div>
            <p className="text-2xl font-bold text-indigo-800">
              ${(economics.totalContractValue / 1000000).toFixed(1)}M
            </p>
            <p className="text-xs text-indigo-600">15-year total</p>
          </div>
        </div>
        
        {/* Cash Flow Chart */}
        <div className="pt-4">
          <h4 className="text-sm font-medium mb-3">Projected Cash Flows</h4>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={economics.cashFlows}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="year" 
                  tick={{ fontSize: 10 }}
                  label={{ value: 'Year', position: 'bottom', fontSize: 10 }}
                />
                <YAxis 
                  tick={{ fontSize: 10 }}
                  tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`}
                />
                <Tooltip 
                  formatter={(value: number) => [`$${value.toLocaleString()}`, '']}
                  labelFormatter={(label) => `Year ${label}`}
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stackId="1"
                  stroke="#22c55e" 
                  fill="#bbf7d0"
                  name="Feedstock Revenue"
                />
                <Area 
                  type="monotone" 
                  dataKey="carbon" 
                  stackId="1"
                  stroke="#10b981" 
                  fill="#a7f3d0"
                  name="Carbon Credits"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Timeline Stepper Component
function TimelineStepper() {
  return (
    <div className="relative">
      {/* Timeline line */}
      <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-green-200" />
      
      <div className="space-y-6">
        {TIMELINE_STEPS.map((step, idx) => (
          <div key={idx} className="relative flex gap-4">
            {/* Timeline dot */}
            <div className={cn(
              "z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2",
              step.cashFlow >= 0 
                ? "bg-green-100 border-green-500 text-green-700"
                : "bg-red-100 border-red-500 text-red-700"
            )}>
              <span className="text-sm font-bold">Y{step.year}</span>
            </div>
            
            {/* Content */}
            <div className="flex-1 pb-4">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold">{step.title}</h4>
                <Badge 
                  variant={step.cashFlow >= 0 ? 'default' : 'destructive'}
                  className={step.cashFlow >= 0 ? 'bg-green-500' : ''}
                >
                  {step.cashFlow >= 0 ? '+' : ''}{(step.cashFlow / 1000).toFixed(1)}K/ha
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1">{step.description}</p>
              {step.yield > 0 && (
                <p className="text-xs text-green-600 mt-1">
                  Yield: {step.yield} t DM/ha
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Financing Partners Section (under assessment - no "approved" language)
function FinancingPartners() {
  return (
    <div className="space-y-6">
      {/* Status Banner */}
      <div className="p-4 rounded-lg bg-blue-50 border border-blue-200 text-center">
        <Badge variant="outline" className="mb-2 border-blue-300 text-blue-700">
          Under Assessment — Indicative
        </Badge>
        <p className="text-sm text-blue-800">
          Term-sheet decisions expected <strong>Q3 2026</strong>
        </p>
        <p className="text-xs text-blue-600 mt-1">
          Indicative debt quantum: A$420M covering plantation roll-out and 3 Mt yr⁻¹ pelleting facility
        </p>
      </div>
      
      {/* Partner Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {FINANCING_PARTNERS.map((partner, idx) => (
          <div 
            key={idx}
            className="flex flex-col items-center p-3 rounded-lg border border-gray-200 bg-white hover:border-blue-300 transition-colors"
          >
            <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600 mb-2">
              {partner.name}
            </div>
            <span className="text-xs font-medium text-center text-gray-700">{partner.fullName}</span>
            <Badge 
              variant="outline" 
              className={cn(
                "mt-2 text-[10px]",
                partner.status === 'grant_component' && "border-green-300 text-green-700",
                partner.status === 'export_credit' && "border-purple-300 text-purple-700",
                partner.status === 'under_assessment' && "border-blue-300 text-blue-700"
              )}
            >
              {partner.status === 'grant_component' ? 'Grant Component' : 
               partner.status === 'export_credit' ? 'Export Credit' : 
               'Under Assessment'}
            </Badge>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

export default function BeemaBamboo() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 via-white to-emerald-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2322c55e' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>
        
        <div className="container mx-auto px-4 py-20 lg:py-32 relative">
          <div className="max-w-4xl mx-auto text-center">
            {/* Icon */}
            <div className="flex justify-center mb-6">
              <BeemaBambooIcon className="h-20 w-20" />
            </div>
            
            {/* Headline */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
              Australia's perennial biofuel{' '}
              <span className="text-green-600">base-load</span>{' '}
              is here.
            </h1>
            
            {/* Sub-headline */}
            <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
              One planting. 25–30 years of harvest.{' '}
              <span className="font-semibold text-green-700">100 t DM ha⁻¹ yr⁻¹</span>.{' '}
              Carbon-negative.
            </p>
            
            {/* SEO copy */}
            <p className="text-sm text-gray-500 max-w-2xl mx-auto mb-8">
              Beema Bamboo is a non-invasive, sterile hybrid of <em>Bambusa balcooa</em> developed 
              by India's NBARI and proven in 17 Australian field trials. With 25-year ratoon 
              harvesting, it delivers the lowest $/GJ gate-price of any lignocellulosic 
              feedstock in Australia today.
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-green-600 hover:bg-green-700 gap-2" asChild>
                <Link href="/producer-registration?feedstock=beema">
                  <Sprout className="h-5 w-5" />
                  Add Beema to My Profile
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="gap-2" asChild>
                <a href="#calculator">
                  <BarChart3 className="h-5 w-5" />
                  Calculate My Returns
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>
      
      {/* Why Beema Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            Why Beema Bamboo?
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {WHY_BEEMA.map((card, idx) => (
              <Card key={idx} className="relative overflow-hidden border-2 hover:border-green-300 transition-colors">
                <div className={cn("absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full opacity-20", card.bgColor)} />
                <CardHeader>
                  <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center mb-4", card.bgColor)}>
                    <card.icon className={cn("h-6 w-6", card.color)} />
                  </div>
                  <CardTitle>{card.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">{card.description}</p>
                  <div className="pt-4 border-t">
                    <p className={cn("text-3xl font-bold", card.color)}>{card.stat}</p>
                    <p className="text-xs text-muted-foreground">{card.statLabel}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
      
      {/* Economics Calculator Section */}
      <section id="calculator" className="py-16 bg-gradient-to-br from-green-50 to-emerald-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-4">
              Your Beema Economics
            </h2>
            <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
              Use the slider to model returns for your operation. All calculations 
              based on verified Australian field trial data.
            </p>
            
            <EconomicsCalculator />
          </div>
        </div>
      </section>
      
      {/* Suitability Map Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4">
            Suitability Map
          </h2>
          <p className="text-center text-muted-foreground mb-8 max-w-2xl mx-auto">
            Based on CSIRO Land-Use Suitability data and Queensland DAF field trials.
          </p>
          
          <div className="max-w-5xl mx-auto">
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                {/* Map placeholder - would embed TerriaJS */}
                <div className="h-[400px] bg-gradient-to-br from-green-100 to-emerald-200 relative flex items-center justify-center">
                  <div className="text-center">
                    <MapPin className="h-16 w-16 text-green-600 mx-auto mb-4 opacity-50" />
                    <p className="text-green-800 font-medium">
                      Interactive Suitability Map
                    </p>
                    <p className="text-sm text-green-600">
                      TerriaJS embed with Beema Suitability layer
                    </p>
                  </div>
                  
                  {/* Legend */}
                  <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-md p-3">
                    <p className="text-xs font-medium mb-2">Suitability</p>
                    <div className="space-y-1 text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-green-700" />
                        <span>&gt;90% yield (optimal)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-amber-500" />
                        <span>70–90% yield</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-red-500" />
                        <span>Unsuitable</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <p className="text-xs text-muted-foreground text-center mt-4">
              Unsuitable: frost &gt;7 days/yr, slope &gt;20%, rainfall &lt;250mm
            </p>
          </div>
        </div>
      </section>
      
      {/* Timeline Section */}
      <section className="py-16 bg-gradient-to-br from-white to-green-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4">
            How It Works
          </h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            From planting to 30-year harvest cycle. Cash flows shown per hectare.
          </p>
          
          <div className="max-w-2xl mx-auto">
            <TimelineStepper />
          </div>
        </div>
      </section>
      
      {/* Offtake & Financing Section */}
      <section className="py-16 bg-white border-t">
        <div className="container mx-auto px-4">
          {/* Offtake Details */}
          <div className="max-w-3xl mx-auto mb-12">
            <h2 className="text-2xl font-bold text-center mb-4">
              Guaranteed Offtake
            </h2>
            <Card className="border-2 border-green-200">
              <CardContent className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                    <Factory className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Powerplant Energy Pty Ltd</h3>
                    <p className="text-sm text-muted-foreground">15-year take-or-pay contract</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div className="p-3 rounded bg-green-50">
                    <p className="text-xl font-bold text-green-700">$160/t</p>
                    <p className="text-xs text-green-600">Floor price (intro)</p>
                  </div>
                  <div className="p-3 rounded bg-green-50">
                    <p className="text-xl font-bold text-green-700">15 yrs</p>
                    <p className="text-xs text-green-600">Contract term</p>
                  </div>
                  <div className="p-3 rounded bg-green-50">
                    <p className="text-xl font-bold text-green-700">CPI+3%</p>
                    <p className="text-xs text-green-600">After year 5</p>
                  </div>
                  <div className="p-3 rounded bg-green-50">
                    <p className="text-xl font-bold text-green-700">+5 yrs</p>
                    <p className="text-xs text-green-600">Buyer extension option</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-4 text-center">
                  First 1,000 growers who sign a Grower Accession Deed and plant tissue-cultured "energy elite" Beema receive the floor price guarantee.
                </p>
              </CardContent>
            </Card>
          </div>
          
          {/* Financing Partners */}
          <h2 className="text-2xl font-bold text-center mb-4">
            Project Finance & Carbon Forward Sales
          </h2>
          <p className="text-center text-muted-foreground mb-8 max-w-2xl mx-auto">
            Currently under assessment for project finance and forward sale of carbon offsets
          </p>
          
          <div className="max-w-4xl mx-auto">
            <FinancingPartners />
          </div>
          
          <div className="flex justify-center gap-4 mt-8">
            <Badge variant="outline" className="gap-1">
              <Shield className="h-3 w-3" />
              Target DSCR 1.42+
            </Badge>
            <Badge variant="outline" className="gap-1">
              <Award className="h-3 w-3" />
              ESG Compliant
            </Badge>
            <Badge variant="outline" className="gap-1">
              <Leaf className="h-3 w-3" />
              Carbon Negative
            </Badge>
          </div>
        </div>
      </section>
      
      {/* Final CTA Section */}
      <section className="py-20 bg-gradient-to-r from-green-600 to-emerald-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Plant Your Future?
          </h2>
          <p className="text-lg text-green-100 mb-8 max-w-2xl mx-auto">
            Add Beema Bamboo to your grower profile today. Lock in 15-year revenue 
            certainty while still selling seasonal waste on the spot market.
          </p>
          
          <Button 
            size="lg" 
            variant="secondary" 
            className="bg-white text-green-700 hover:bg-green-50 gap-2"
            asChild
          >
            <Link href="/producer-registration?feedstock=beema">
              <Sprout className="h-5 w-5" />
              Add Beema to My Profile
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
