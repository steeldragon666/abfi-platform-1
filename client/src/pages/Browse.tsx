import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { AUSTRALIAN_STATES, FEEDSTOCK_CATEGORIES, formatDate, formatPrice, getScoreGrade } from "@/const";
import { trpc } from "@/lib/trpc";
import { Award, Filter, Leaf, MapPin, TrendingUp } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";

export default function Browse() {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedStates, setSelectedStates] = useState<string[]>([]);
  const [minScore, setMinScore] = useState<number | undefined>();
  const [maxCarbon, setMaxCarbon] = useState<number | undefined>();

  const { data: feedstocks, isLoading } = trpc.feedstocks.search.useQuery({
    category: selectedCategories.length > 0 ? selectedCategories : undefined,
    state: selectedStates.length > 0 ? selectedStates : undefined,
    minAbfiScore: minScore,
    maxCarbonIntensity: maxCarbon,
    limit: 50,
  });

  const toggleCategory = (cat: string) => {
    setSelectedCategories(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const toggleState = (state: string) => {
    setSelectedStates(prev =>
      prev.includes(state) ? prev.filter(s => s !== state) : [...prev, state]
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/">
            <div className="flex items-center gap-2 cursor-pointer">
              <Leaf className="h-8 w-8 text-primary" />
              <span className="text-2xl font-bold text-primary">ABFI</span>
            </div>
          </Link>
          <Link href="/">
            <Button variant="ghost">Back to Home</Button>
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-primary mb-2">Browse Feedstocks</h1>
          <p className="text-gray-600">
            Discover verified biofuel feedstock sources across Australia
          </p>
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Filters
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Category Filter */}
                <div>
                  <Label className="mb-2 block">Feedstock Category</Label>
                  <div className="space-y-2">
                    {FEEDSTOCK_CATEGORIES.map(cat => (
                      <label key={cat.value} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedCategories.includes(cat.value)}
                          onChange={() => toggleCategory(cat.value)}
                          className="rounded border-gray-300"
                        />
                        <span className="text-sm">{cat.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* State Filter */}
                <div>
                  <Label className="mb-2 block">State</Label>
                  <div className="space-y-2">
                    {AUSTRALIAN_STATES.map(state => (
                      <label key={state.value} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedStates.includes(state.value)}
                          onChange={() => toggleState(state.value)}
                          className="rounded border-gray-300"
                        />
                        <span className="text-sm">{state.value}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* ABFI Score Filter */}
                <div>
                  <Label htmlFor="minScore">Minimum ABFI Score</Label>
                  <Input
                    id="minScore"
                    type="number"
                    min="0"
                    max="100"
                    placeholder="e.g., 70"
                    value={minScore || ''}
                    onChange={(e) => setMinScore(e.target.value ? Number(e.target.value) : undefined)}
                  />
                </div>

                {/* Carbon Intensity Filter */}
                <div>
                  <Label htmlFor="maxCarbon">Max Carbon Intensity (gCO2e/MJ)</Label>
                  <Input
                    id="maxCarbon"
                    type="number"
                    min="0"
                    placeholder="e.g., 50"
                    value={maxCarbon || ''}
                    onChange={(e) => setMaxCarbon(e.target.value ? Number(e.target.value) : undefined)}
                  />
                </div>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setSelectedCategories([]);
                    setSelectedStates([]);
                    setMinScore(undefined);
                    setMaxCarbon(undefined);
                  }}
                >
                  Clear All Filters
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Results Grid */}
          <div className="lg:col-span-3">
            <div className="mb-4 flex justify-between items-center">
              <p className="text-gray-600">
                {isLoading ? 'Loading...' : `${feedstocks?.length || 0} feedstocks found`}
              </p>
            </div>

            {isLoading ? (
              <div className="grid md:grid-cols-2 gap-6">
                {[1, 2, 3, 4].map(i => (
                  <Card key={i}>
                    <CardHeader>
                      <Skeleton className="h-6 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-1/2" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-20 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : feedstocks && feedstocks.length > 0 ? (
              <div className="grid md:grid-cols-2 gap-6">
                {feedstocks.map(feedstock => (
                  <Card key={feedstock.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <CardTitle className="text-lg">{feedstock.type}</CardTitle>
                          <CardDescription className="flex items-center gap-1 mt-1">
                            <MapPin className="h-3 w-3" />
                            {feedstock.state} • {feedstock.abfiId}
                          </CardDescription>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-1 text-primary font-bold text-xl">
                            <Award className="h-5 w-5" />
                            {feedstock.abfiScore || 'N/A'}
                          </div>
                          <div className="text-xs text-gray-500">
                            {feedstock.abfiScore ? getScoreGrade(feedstock.abfiScore) : ''}
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2 flex-wrap mt-2">
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                          {FEEDSTOCK_CATEGORIES.find(c => c.value === feedstock.category)?.label}
                        </span>
                        {feedstock.carbonIntensityValue && (
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            {feedstock.carbonIntensityValue} gCO2e/MJ
                          </span>
                        )}
                      </div>
                    </CardHeader>

                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Annual Capacity:</span>
                          <span className="font-medium">{feedstock.annualCapacityTonnes.toLocaleString()} tonnes</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Available Now:</span>
                          <span className="font-medium">{feedstock.availableVolumeCurrent.toLocaleString()} tonnes</span>
                        </div>
                        {feedstock.pricePerTonne && feedstock.priceVisibility === 'public' && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Price:</span>
                            <span className="font-medium">{formatPrice(feedstock.pricePerTonne)}/tonne</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-gray-600">Verification:</span>
                          <span className="font-medium capitalize">{feedstock.verificationLevel?.replace('_', ' ')}</span>
                        </div>
                      </div>

                      {feedstock.description && (
                        <p className="text-sm text-gray-600 mt-3 truncate-2">
                          {feedstock.description}
                        </p>
                      )}

                      <div className="mt-4 flex gap-2">
                        <Link href={`/feedstock/${feedstock.id}`} className="flex-1">
                          <Button className="w-full" size="sm">
                            View Details
                          </Button>
                        </Link>
                        <Link href={`/inquiry/send?feedstockId=${feedstock.id}`}>
                          <Button variant="outline" size="sm">
                            Send Inquiry
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No feedstocks found</h3>
                  <p className="text-gray-600">
                    Try adjusting your filters or check back later for new listings
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
