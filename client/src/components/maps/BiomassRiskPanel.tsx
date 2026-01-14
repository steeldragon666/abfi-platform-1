/**
 * BiomassRiskPanel - Advanced Climate Risk & Seasonal Analysis
 * 
 * Features:
 * - Seasonal biomass slider (Q1-Q4) with crop-specific timing
 * - Extreme weather impact scenarios (mild, severe, extreme)
 * - Return-period clock showing time to next expected event
 * - % deviation from 10-year mean visualization
 * - Export functionality for adjusted residue estimates
 */

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import {
  Wheat,
  Droplets,
  Flame,
  Wind,
  CloudRain,
  Sun,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  Calendar,
  Clock,
  Download,
  Info,
  Gauge,
  ChevronDown,
  ChevronUp,
  Leaf,
  X,
} from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

export type RiskScenario = 'mild' | 'severe' | 'extreme';
export type HazardType = 'drought' | 'flood' | 'cyclone' | 'bushfire';
export type Season = 'Q1' | 'Q2' | 'Q3' | 'Q4';
export type CropType = 'wheat' | 'barley' | 'canola' | 'maize' | 'sorghum' | 'sugarcane';

interface BiomassRiskPanelProps {
  selectedLocation?: { lat: number; lng: number } | null;
  onSeasonChange?: (season: Season, month: number) => void;
  onRiskScenarioChange?: (scenario: RiskScenario, hazard: HazardType) => void;
  onClose?: () => void;
  className?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

// Seasonal crop residue availability (month -> crop availability %)
const SEASONAL_AVAILABILITY: Record<CropType, number[]> = {
  wheat: [0, 0, 0, 20, 60, 100, 80, 40, 10, 0, 0, 0], // Apr-Jun peak (stover)
  barley: [0, 0, 0, 10, 50, 90, 100, 60, 20, 0, 0, 0], // May-Jul peak
  canola: [0, 0, 0, 0, 0, 20, 60, 100, 80, 40, 10, 0], // Aug-Oct peak
  maize: [0, 0, 0, 0, 0, 0, 0, 20, 60, 100, 80, 40], // Oct-Dec peak (stover)
  sorghum: [0, 0, 0, 0, 0, 0, 0, 0, 20, 60, 100, 80], // Nov-Jan peak
  sugarcane: [60, 40, 20, 10, 0, 0, 10, 30, 50, 70, 90, 100], // Jun-Feb crushing
};

// 10-year mean baseline tonnes/ha for reference
const BASELINE_YIELD: Record<CropType, number> = {
  wheat: 2.1,
  barley: 1.8,
  canola: 0.9,
  maize: 3.2,
  sorghum: 2.8,
  sugarcane: 12.5,
};

// Risk scenario impact multipliers (% loss from baseline)
const RISK_IMPACTS: Record<HazardType, Record<RiskScenario, { lossPercent: number; confidence: number }>> = {
  drought: {
    mild: { lossPercent: 12, confidence: 85 },
    severe: { lossPercent: 25, confidence: 75 },
    extreme: { lossPercent: 45, confidence: 60 },
  },
  flood: {
    mild: { lossPercent: 8, confidence: 80 },
    severe: { lossPercent: 22, confidence: 70 },
    extreme: { lossPercent: 40, confidence: 55 },
  },
  cyclone: {
    mild: { lossPercent: 5, confidence: 90 },
    severe: { lossPercent: 18, confidence: 75 },
    extreme: { lossPercent: 35, confidence: 60 },
  },
  bushfire: {
    mild: { lossPercent: 10, confidence: 85 },
    severe: { lossPercent: 30, confidence: 65 },
    extreme: { lossPercent: 60, confidence: 50 },
  },
};

// Return period data (years between events)
const RETURN_PERIODS: Record<HazardType, { average: number; lastEvent: number; overdue: boolean }> = {
  drought: { average: 7, lastEvent: 3, overdue: false },
  flood: { average: 20, lastEvent: 18, overdue: true },
  cyclone: { average: 15, lastEvent: 8, overdue: false },
  bushfire: { average: 10, lastEvent: 5, overdue: false },
};

// Month labels
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Quarter labels
const QUARTERS: { label: string; months: string; season: Season }[] = [
  { label: 'Q1', months: 'Jan-Mar', season: 'Q1' },
  { label: 'Q2', months: 'Apr-Jun', season: 'Q2' },
  { label: 'Q3', months: 'Jul-Sep', season: 'Q3' },
  { label: 'Q4', months: 'Oct-Dec', season: 'Q4' },
];

// ============================================================================
// COMPONENTS
// ============================================================================

// Return Period Gauge Widget
function ReturnPeriodGauge({ 
  hazard, 
  data 
}: { 
  hazard: HazardType; 
  data: typeof RETURN_PERIODS[HazardType];
}) {
  const yearsUntilDue = data.average - data.lastEvent;
  const progress = Math.min(100, (data.lastEvent / data.average) * 100);
  
  const getHazardIcon = (h: HazardType) => {
    switch (h) {
      case 'drought': return <Sun className="h-4 w-4 text-amber-500" />;
      case 'flood': return <CloudRain className="h-4 w-4 text-blue-500" />;
      case 'cyclone': return <Wind className="h-4 w-4 text-purple-500" />;
      case 'bushfire': return <Flame className="h-4 w-4 text-red-500" />;
    }
  };
  
  const getProgressColor = () => {
    if (data.overdue) return 'bg-red-500';
    if (progress > 70) return 'bg-amber-500';
    return 'bg-green-500';
  };
  
  return (
    <div className="p-3 rounded-lg border bg-card">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {getHazardIcon(hazard)}
          <span className="text-sm font-medium capitalize">{hazard}</span>
        </div>
        {data.overdue && (
          <Badge variant="destructive" className="text-xs">
            Overdue
          </Badge>
        )}
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Last event: {data.lastEvent}yr ago</span>
          <span>Avg cycle: {data.average}yr</span>
        </div>
        
        <div className="relative h-2 bg-muted rounded-full overflow-hidden">
          <div 
            className={cn("h-full transition-all", getProgressColor())}
            style={{ width: `${progress}%` }}
          />
        </div>
        
        <p className="text-xs">
          {data.overdue ? (
            <span className="text-red-600 font-medium">
              Statistically overdue by {Math.abs(yearsUntilDue).toFixed(1)} years
            </span>
          ) : (
            <span className="text-muted-foreground">
              Next expected in ~{yearsUntilDue.toFixed(1)} years (median)
            </span>
          )}
        </p>
      </div>
    </div>
  );
}

// Risk Impact Spider Chart (simplified bar version)
function RiskImpactChart({ 
  crop, 
  scenario 
}: { 
  crop: CropType; 
  scenario: RiskScenario;
}) {
  const hazards: HazardType[] = ['drought', 'flood', 'cyclone', 'bushfire'];
  
  return (
    <div className="space-y-2">
      {hazards.map((hazard) => {
        const impact = RISK_IMPACTS[hazard][scenario];
        return (
          <div key={hazard} className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="capitalize">{hazard}</span>
              <span className="font-medium text-red-600">-{impact.lossPercent}%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-red-500 transition-all"
                style={{ width: `${impact.lossPercent}%` }}
              />
            </div>
            <p className="text-[10px] text-muted-foreground">
              Confidence: {impact.confidence}%
            </p>
          </div>
        );
      })}
    </div>
  );
}

// Seasonal Availability Chart
function SeasonalChart({ 
  crop, 
  currentMonth 
}: { 
  crop: CropType; 
  currentMonth: number;
}) {
  const availability = SEASONAL_AVAILABILITY[crop];
  
  return (
    <div className="flex items-end gap-0.5 h-16">
      {availability.map((value, idx) => (
        <TooltipProvider key={idx}>
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                className={cn(
                  "flex-1 rounded-t transition-all cursor-pointer hover:opacity-80",
                  idx === currentMonth ? "bg-primary" : "bg-muted-foreground/30",
                  value === 0 && "bg-muted"
                )}
                style={{ height: `${Math.max(4, value)}%` }}
              />
            </TooltipTrigger>
            <TooltipContent>
              <p>{MONTHS[idx]}: {value}% available</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ))}
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function BiomassRiskPanel({
  selectedLocation,
  onSeasonChange,
  onRiskScenarioChange,
  onClose,
  className,
}: BiomassRiskPanelProps) {
  // State
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedCrop, setSelectedCrop] = useState<CropType>('wheat');
  const [riskScenario, setRiskScenario] = useState<RiskScenario>('severe');
  const [activeHazard, setActiveHazard] = useState<HazardType>('drought');
  const [isExpanded, setIsExpanded] = useState(true);
  
  // Computed values
  const currentSeason = useMemo(() => {
    if (selectedMonth < 3) return 'Q1';
    if (selectedMonth < 6) return 'Q2';
    if (selectedMonth < 9) return 'Q3';
    return 'Q4';
  }, [selectedMonth]);
  
  const seasonalAvailability = useMemo(() => {
    return SEASONAL_AVAILABILITY[selectedCrop][selectedMonth];
  }, [selectedCrop, selectedMonth]);
  
  const adjustedYield = useMemo(() => {
    const baseline = BASELINE_YIELD[selectedCrop];
    const seasonFactor = seasonalAvailability / 100;
    const riskLoss = RISK_IMPACTS[activeHazard][riskScenario].lossPercent / 100;
    return baseline * seasonFactor * (1 - riskLoss);
  }, [selectedCrop, seasonalAvailability, activeHazard, riskScenario]);
  
  const deviationFromMean = useMemo(() => {
    const baseline = BASELINE_YIELD[selectedCrop];
    return ((adjustedYield - baseline) / baseline) * 100;
  }, [selectedCrop, adjustedYield]);
  
  // Handlers
  const handleMonthChange = (value: number[]) => {
    const month = value[0];
    setSelectedMonth(month);
    const season = month < 3 ? 'Q1' : month < 6 ? 'Q2' : month < 9 ? 'Q3' : 'Q4';
    onSeasonChange?.(season, month);
  };
  
  const handleScenarioChange = (scenario: RiskScenario) => {
    setRiskScenario(scenario);
    onRiskScenarioChange?.(scenario, activeHazard);
  };
  
  const handleExport = () => {
    // Generate CSV with adjusted residue estimates
    const csvData = [
      ['Crop', 'Month', 'Baseline (t/ha)', 'Adjusted (t/ha)', 'Loss %', 'Hazard', 'Scenario'],
      [selectedCrop, MONTHS[selectedMonth], BASELINE_YIELD[selectedCrop], adjustedYield.toFixed(2), deviationFromMean.toFixed(1), activeHazard, riskScenario],
    ];
    
    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `biomass-risk-${selectedCrop}-${MONTHS[selectedMonth]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };
  
  return (
    <Card className={cn("w-80 shadow-lg", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-900">
              <Wheat className="h-4 w-4 text-amber-600" />
            </div>
            <CardTitle className="text-base">Biomass Risk Analysis</CardTitle>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
            {onClose && (
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        <CardDescription className="text-xs">
          Seasonal availability & climate risk assessment
        </CardDescription>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="space-y-4 pt-2">
          {/* Crop Selection */}
          <div className="space-y-2">
            <Label className="text-xs">Feedstock Type</Label>
            <Select value={selectedCrop} onValueChange={(v) => setSelectedCrop(v as CropType)}>
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="wheat">Wheat Stover</SelectItem>
                <SelectItem value="barley">Barley Straw</SelectItem>
                <SelectItem value="canola">Canola Residue</SelectItem>
                <SelectItem value="maize">Maize Stover</SelectItem>
                <SelectItem value="sorghum">Sorghum Stubble</SelectItem>
                <SelectItem value="sugarcane">Sugarcane Bagasse</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Seasonal Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Season / Month</Label>
              <Badge variant="outline" className="text-xs">
                {MONTHS[selectedMonth]} ({currentSeason})
              </Badge>
            </div>
            
            <SeasonalChart crop={selectedCrop} currentMonth={selectedMonth} />
            
            <Slider
              value={[selectedMonth]}
              min={0}
              max={11}
              step={1}
              onValueChange={handleMonthChange}
              className="mt-2"
            />
            
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>Jan</span>
              <span>Apr</span>
              <span>Jul</span>
              <span>Oct</span>
              <span>Dec</span>
            </div>
          </div>
          
          <Separator />
          
          {/* Current Availability */}
          <div className="p-3 rounded-lg bg-muted/50 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Seasonal Availability</span>
              <Badge 
                variant={seasonalAvailability > 50 ? 'default' : seasonalAvailability > 20 ? 'secondary' : 'outline'}
                className={cn(
                  seasonalAvailability > 50 && "bg-green-500",
                  seasonalAvailability > 20 && seasonalAvailability <= 50 && "bg-amber-500",
                  seasonalAvailability <= 20 && "bg-gray-400"
                )}
              >
                {seasonalAvailability}%
              </Badge>
            </div>
            <Progress value={seasonalAvailability} className="h-2" />
          </div>
          
          <Separator />
          
          {/* Risk Scenario Selection */}
          <div className="space-y-2">
            <Label className="text-xs">Risk Scenario</Label>
            <Tabs value={riskScenario} onValueChange={(v) => handleScenarioChange(v as RiskScenario)}>
              <TabsList className="grid grid-cols-3 h-8">
                <TabsTrigger value="mild" className="text-xs">Mild</TabsTrigger>
                <TabsTrigger value="severe" className="text-xs">Severe</TabsTrigger>
                <TabsTrigger value="extreme" className="text-xs">Extreme</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          
          {/* Hazard Selection */}
          <div className="space-y-2">
            <Label className="text-xs">Primary Hazard</Label>
            <div className="grid grid-cols-4 gap-1">
              {(['drought', 'flood', 'cyclone', 'bushfire'] as HazardType[]).map((hazard) => (
                <Button
                  key={hazard}
                  variant={activeHazard === hazard ? 'default' : 'outline'}
                  size="sm"
                  className="h-8 px-2 text-xs"
                  onClick={() => setActiveHazard(hazard)}
                >
                  {hazard === 'drought' && <Sun className="h-3 w-3" />}
                  {hazard === 'flood' && <CloudRain className="h-3 w-3" />}
                  {hazard === 'cyclone' && <Wind className="h-3 w-3" />}
                  {hazard === 'bushfire' && <Flame className="h-3 w-3" />}
                </Button>
              ))}
            </div>
          </div>
          
          {/* Impact Summary */}
          <div className="p-3 rounded-lg border bg-red-50 dark:bg-red-950/20 space-y-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <span className="text-sm font-medium">Impact Assessment</span>
            </div>
            
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Adjusted Yield</p>
                <p className="font-semibold">{adjustedYield.toFixed(2)} t/ha</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">vs 10-yr Mean</p>
                <p className={cn(
                  "font-semibold flex items-center gap-1",
                  deviationFromMean < 0 ? "text-red-600" : "text-green-600"
                )}>
                  {deviationFromMean < 0 ? <TrendingDown className="h-3 w-3" /> : <TrendingUp className="h-3 w-3" />}
                  {deviationFromMean.toFixed(1)}%
                </p>
              </div>
            </div>
            
            <div className="text-xs text-muted-foreground">
              Expected loss: <span className="font-medium text-red-600">
                -{RISK_IMPACTS[activeHazard][riskScenario].lossPercent}%
              </span> (confidence: {RISK_IMPACTS[activeHazard][riskScenario].confidence}%)
            </div>
          </div>
          
          <Separator />
          
          {/* Return Period Clock */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <Label className="text-xs">Return Period Clock</Label>
            </div>
            <ReturnPeriodGauge hazard={activeHazard} data={RETURN_PERIODS[activeHazard]} />
          </div>
          
          <Separator />
          
          {/* Export Button */}
          <Button variant="outline" size="sm" className="w-full gap-2" onClick={handleExport}>
            <Download className="h-4 w-4" />
            Export Adjusted Estimates
          </Button>
          
          {/* Data Sources */}
          <div className="flex items-start gap-1.5 text-[10px] text-muted-foreground">
            <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
            <p>
              Data: ABBA, BoM IFD grids, CSIRO Extreme Weather Atlas, 
              NASA NEX-GDDP-CMIP6, OECD Global Drought Outlook
            </p>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

export default BiomassRiskPanel;
