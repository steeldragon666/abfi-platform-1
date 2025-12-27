/**
 * Australian Data Explorer Page
 *
 * Explore Australian environmental data including climate,
 * soil, and carbon credit information.
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Cloud, Leaf, TrendingUp } from "lucide-react";
import { useLocation } from "wouter";

export default function AustralianDataExplorer() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => setLocation("/")}
            className="mb-4 -ml-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">
            Australian Data Explorer
          </h1>
          <p className="mt-2 text-gray-600">
            Explore environmental data across Australia including climate
            patterns, soil conditions, and carbon credit markets.
          </p>
        </div>

        {/* Data Categories */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* Climate Data */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
                  <Cloud className="h-6 w-6" />
                </div>
                <CardTitle>Climate Data</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Access historical and current climate data from the Bureau of
                Meteorology including rainfall, temperature, and weather
                patterns.
              </p>
              <p className="text-sm text-muted-foreground">
                Coming soon - Integration with BoM API
              </p>
            </CardContent>
          </Card>

          {/* Soil Data */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-100 text-amber-600">
                  <Leaf className="h-6 w-6" />
                </div>
                <CardTitle>Soil Data</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Explore soil composition, carbon content, and agricultural
                suitability data from CSIRO and state agencies.
              </p>
              <p className="text-sm text-muted-foreground">
                Coming soon - Integration with CSIRO data
              </p>
            </CardContent>
          </Card>

          {/* Carbon Credits */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-100 text-green-600">
                  <TrendingUp className="h-6 w-6" />
                </div>
                <CardTitle>Carbon Credits</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Track Australian Carbon Credit Unit (ACCU) prices, trading
                volumes, and market trends from the Clean Energy Regulator.
              </p>
              <p className="text-sm text-muted-foreground">
                Coming soon - Integration with CER data
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Info Section */}
        <div className="mt-8 p-6 bg-blue-50 rounded-lg">
          <h2 className="font-semibold text-blue-900 mb-2">About This Data</h2>
          <p className="text-blue-800 text-sm">
            This explorer provides access to publicly available Australian
            environmental datasets. Data is sourced from government agencies
            including the Bureau of Meteorology, CSIRO, and the Clean Energy
            Regulator. Integration is currently in development.
          </p>
        </div>
      </div>
    </div>
  );
}
