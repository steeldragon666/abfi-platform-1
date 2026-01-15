/**
 * MapPage - Dedicated full-screen map view
 * 
 * Accessible from any portal via the global navigation menu.
 * Shows unified map with all available data layers.
 */

import { useState } from 'react';
import { Link } from 'wouter';
import { PlatformMap, MapPreset, MapMarker } from '@/components/maps/PlatformMap';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/Card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useUserRole } from '@/contexts/UserRoleContext';
import {
  Map,
  Leaf,
  Factory,
  Building2,
  TrendingUp,
  Filter,
  Download,
  Share2,
  Info,
  ChevronLeft,
  X,
} from 'lucide-react';

// Map preset options based on role
const PRESET_OPTIONS: { value: MapPreset; label: string; icon: React.ElementType }[] = [
  { value: 'grower', label: 'Grower View', icon: Leaf },
  { value: 'developer', label: 'Developer View', icon: Factory },
  { value: 'lender', label: 'Lender View', icon: TrendingUp },
  { value: 'government', label: 'Government View', icon: Building2 },
];

export default function MapPage() {
  const { role } = useUserRole();
  
  // Determine default preset based on user role
  const getDefaultPreset = (): MapPreset => {
    switch (role) {
      case 'supplier': return 'grower';
      case 'buyer': return 'developer';
      case 'admin': return 'government';
      default: return 'default';
    }
  };
  
  const [activePreset, setActivePreset] = useState<MapPreset>(getDefaultPreset());
  const [selectedMarker, setSelectedMarker] = useState<MapMarker | null>(null);
  const [showSidebar, setShowSidebar] = useState(false);
  
  const handleMarkerClick = (marker: MapMarker) => {
    setSelectedMarker(marker);
    setShowSidebar(true);
  };
  
  return (
    <div className="relative -mx-6 -my-6 lg:-mx-8 lg:-my-6">
        {/* Header Bar */}
        <div className="absolute top-0 left-0 right-0 z-[1001] bg-white/95 dark:bg-gray-950/95 backdrop-blur border-b px-4 py-3">
          <div className="flex items-center justify-between max-w-[1600px] mx-auto">
            {/* Title */}
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-[#D4AF37] to-[#B8962E]">
                <Map className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold">Platform Map</h1>
                <p className="text-xs text-muted-foreground">Interactive feedstock & supply chain map</p>
              </div>
            </div>
            
            {/* View Presets */}
            <div className="hidden md:block">
              <Tabs value={activePreset} onValueChange={(v) => setActivePreset(v as MapPreset)}>
                <TabsList className="bg-muted/50">
                  {PRESET_OPTIONS.map((option) => {
                    const Icon = option.icon;
                    return (
                      <TabsTrigger 
                        key={option.value} 
                        value={option.value}
                        className="gap-2"
                      >
                        <Icon className="h-4 w-4" />
                        <span className="hidden lg:inline">{option.label}</span>
                      </TabsTrigger>
                    );
                  })}
                </TabsList>
              </Tabs>
            </div>
            
            {/* Actions */}
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="gap-2 hidden sm:flex">
                <Filter className="h-4 w-4" />
                Filter
              </Button>
              <Button variant="outline" size="sm" className="gap-2 hidden sm:flex">
                <Download className="h-4 w-4" />
                Export
              </Button>
              <Button variant="outline" size="sm" className="gap-2 hidden sm:flex">
                <Share2 className="h-4 w-4" />
                Share
              </Button>
            </div>
          </div>
        </div>
        
        {/* Main Map */}
        <div className="h-[calc(100vh-8rem)]">
          <PlatformMap
            preset={activePreset}
            height="100%"
            showControls={true}
            showLayerPanel={true}
            onMarkerClick={handleMarkerClick}
            enableFeedstockLayer={true}
            enableDemandLayer={true}
            enableProjectLayer={true}
          />
        </div>
        
        {/* Details Sidebar */}
        {showSidebar && selectedMarker && (
          <div className="absolute top-16 right-0 bottom-0 w-96 max-w-full z-[1002] bg-white dark:bg-gray-950 border-l shadow-xl animate-in slide-in-from-right duration-200">
            {/* Sidebar Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-3">
                <Badge 
                  variant="secondary"
                  className={
                    selectedMarker.type === 'feedstock' ? 'bg-green-100 text-green-700' :
                    selectedMarker.type === 'demand' ? 'bg-orange-100 text-orange-700' :
                    selectedMarker.type === 'project' ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-700'
                  }
                >
                  {selectedMarker.type.charAt(0).toUpperCase() + selectedMarker.type.slice(1)}
                </Badge>
                <span className="text-sm text-muted-foreground">Details</span>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setShowSidebar(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Sidebar Content */}
            <div className="p-4 space-y-4 overflow-y-auto h-[calc(100%-65px)]">
              <div>
                <h2 className="text-xl font-semibold">{selectedMarker.title}</h2>
                {selectedMarker.subtitle && (
                  <p className="text-muted-foreground">{selectedMarker.subtitle}</p>
                )}
              </div>
              
              {selectedMarker.score && (
                <Card className="p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">ABFI Score</span>
                    <div className="flex items-center gap-2">
                      <div 
                        className={`h-3 w-3 rounded-full ${
                          selectedMarker.score >= 80 ? 'bg-green-500' :
                          selectedMarker.score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                      />
                      <span className="text-2xl font-bold">{selectedMarker.score}</span>
                    </div>
                  </div>
                </Card>
              )}
              
              <Card className="p-4">
                <h3 className="font-medium mb-2">Location</h3>
                <p className="text-sm text-muted-foreground">
                  {selectedMarker.lat.toFixed(4)}°, {selectedMarker.lng.toFixed(4)}°
                </p>
              </Card>
              
              {/* Dynamic content based on marker type */}
              {selectedMarker.type === 'feedstock' && selectedMarker.data && (
                <>
                  <Card className="p-4">
                    <h3 className="font-medium mb-2">Feedstock Details</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Type</span>
                        <span>{selectedMarker.data.type}</span>
                      </div>
                      {selectedMarker.data.volumeTonnes && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Volume</span>
                          <span>{selectedMarker.data.volumeTonnes.toLocaleString()} tonnes</span>
                        </div>
                      )}
                      {selectedMarker.data.pricePerTonne && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Price</span>
                          <span>${selectedMarker.data.pricePerTonne}/tonne</span>
                        </div>
                      )}
                    </div>
                  </Card>
                  <Button className="w-full gap-2" asChild>
                    <Link href={`/feedstock/${selectedMarker.data.id}`}>
                      View Full Details
                    </Link>
                  </Button>
                </>
              )}
              
              {selectedMarker.type === 'demand' && selectedMarker.data && (
                <>
                  <Card className="p-4">
                    <h3 className="font-medium mb-2">Demand Signal</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Feedstock Type</span>
                        <span>{selectedMarker.data.feedstockType || 'Various'}</span>
                      </div>
                      {selectedMarker.data.volumeRequired && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Volume Required</span>
                          <span>{selectedMarker.data.volumeRequired.toLocaleString()} tonnes</span>
                        </div>
                      )}
                    </div>
                  </Card>
                  <Button className="w-full gap-2" asChild>
                    <Link href={`/demand-signal/${selectedMarker.data.id}`}>
                      View Demand Details
                    </Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
    </div>
  );
}
