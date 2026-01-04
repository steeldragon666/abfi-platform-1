/**
 * ClimateLayerControls - Toggle panel for map data layers
 * Controls visibility of NDVI, soil moisture, weather, warnings, and projects
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  Layers,
  Leaf,
  Droplets,
  Cloud,
  AlertTriangle,
  Building2,
  Eye,
  EyeOff,
  Settings2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface LayerConfig {
  ndvi: boolean;
  soilMoisture: boolean;
  weather: boolean;
  warnings: boolean;
  projects: boolean;
}

export interface LayerOpacity {
  ndvi: number;
  soilMoisture: number;
  weather: number;
}

interface ClimateLayerControlsProps {
  layers: LayerConfig;
  opacity: LayerOpacity;
  onLayerChange: (layer: keyof LayerConfig, enabled: boolean) => void;
  onOpacityChange: (layer: keyof LayerOpacity, value: number) => void;
  className?: string;
  compact?: boolean;
}

const LAYER_CONFIG = {
  ndvi: {
    icon: Leaf,
    label: 'Vegetation (NDVI)',
    color: 'text-green-600',
    description: 'Normalized Difference Vegetation Index',
    hasOpacity: true,
  },
  soilMoisture: {
    icon: Droplets,
    label: 'Soil Moisture',
    color: 'text-blue-600',
    description: 'Surface and root zone moisture',
    hasOpacity: true,
  },
  weather: {
    icon: Cloud,
    label: 'Weather',
    color: 'text-sky-600',
    description: 'Current conditions and forecasts',
    hasOpacity: true,
  },
  warnings: {
    icon: AlertTriangle,
    label: 'Warnings',
    color: 'text-amber-600',
    description: 'Active BOM weather warnings',
    hasOpacity: false,
  },
  projects: {
    icon: Building2,
    label: 'Bioenergy Projects',
    color: 'text-primary',
    description: 'Australian bioenergy project locations',
    hasOpacity: false,
  },
};

export function ClimateLayerControls({
  layers,
  opacity,
  onLayerChange,
  onOpacityChange,
  className,
  compact = false,
}: ClimateLayerControlsProps) {
  const enabledCount = Object.values(layers).filter(Boolean).length;

  if (compact) {
    return (
      <Card className={cn('w-48', className)}>
        <CardHeader className="p-3 pb-2">
          <CardTitle className="text-sm flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Layers className="h-4 w-4" />
              Layers
            </span>
            <Badge variant="secondary" className="text-xs">
              {enabledCount}/{Object.keys(layers).length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-0 space-y-2">
          {(Object.keys(LAYER_CONFIG) as Array<keyof LayerConfig>).map((layerKey) => {
            const config = LAYER_CONFIG[layerKey];
            const Icon = config.icon;
            const isEnabled = layers[layerKey];

            return (
              <div
                key={layerKey}
                className="flex items-center justify-between"
              >
                <Label
                  htmlFor={`layer-${layerKey}`}
                  className={cn(
                    'text-xs flex items-center gap-1.5 cursor-pointer',
                    isEnabled ? config.color : 'text-muted-foreground'
                  )}
                >
                  <Icon className="h-3 w-3" />
                  {config.label.split(' ')[0]}
                </Label>
                <Switch
                  id={`layer-${layerKey}`}
                  checked={isEnabled}
                  onCheckedChange={(checked) => onLayerChange(layerKey, checked)}
                  className="scale-75"
                />
              </div>
            );
          })}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('w-64', className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-primary" />
            Map Layers
          </span>
          <Badge variant="secondary" className="text-xs">
            {enabledCount} active
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {(Object.keys(LAYER_CONFIG) as Array<keyof LayerConfig>).map((layerKey, index) => {
          const config = LAYER_CONFIG[layerKey];
          const Icon = config.icon;
          const isEnabled = layers[layerKey];
          const showOpacity = config.hasOpacity && isEnabled && layerKey in opacity;

          return (
            <div key={layerKey}>
              {index > 0 && <Separator className="mb-4" />}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className={cn('h-4 w-4', isEnabled ? config.color : 'text-muted-foreground')} />
                    <div>
                      <Label
                        htmlFor={`layer-full-${layerKey}`}
                        className={cn(
                          'text-sm font-medium cursor-pointer',
                          !isEnabled && 'text-muted-foreground'
                        )}
                      >
                        {config.label}
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        {config.description}
                      </p>
                    </div>
                  </div>
                  <Switch
                    id={`layer-full-${layerKey}`}
                    checked={isEnabled}
                    onCheckedChange={(checked) => onLayerChange(layerKey, checked)}
                  />
                </div>

                {showOpacity && (
                  <div className="pl-6 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Opacity</span>
                      <span className="font-medium">
                        {Math.round((opacity[layerKey as keyof LayerOpacity] || 0.7) * 100)}%
                      </span>
                    </div>
                    <Slider
                      value={[(opacity[layerKey as keyof LayerOpacity] || 0.7) * 100]}
                      onValueChange={([value]) =>
                        onOpacityChange(layerKey as keyof LayerOpacity, value / 100)
                      }
                      min={10}
                      max={100}
                      step={10}
                      className="w-full"
                    />
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Quick Actions */}
        <Separator />
        <div className="flex items-center justify-between">
          <button
            onClick={() => {
              Object.keys(layers).forEach((key) => {
                onLayerChange(key as keyof LayerConfig, true);
              });
            }}
            className="text-xs text-primary hover:underline flex items-center gap-1"
          >
            <Eye className="h-3 w-3" />
            Show All
          </button>
          <button
            onClick={() => {
              Object.keys(layers).forEach((key) => {
                onLayerChange(key as keyof LayerConfig, false);
              });
            }}
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
          >
            <EyeOff className="h-3 w-3" />
            Hide All
          </button>
        </div>
      </CardContent>
    </Card>
  );
}

export default ClimateLayerControls;
