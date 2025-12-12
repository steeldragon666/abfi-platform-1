import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getLoginUrl } from "@/const";
import { ArrowRight, Award, BarChart3, Leaf, Search, Shield, TrendingUp } from "lucide-react";
import { Link } from "wouter";

export default function Home() {
  const { user, isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Leaf className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold text-primary">ABFI</span>
          </div>
          <nav className="flex items-center gap-4">
            <Link href="/browse">
              <Button variant="ghost">Browse Feedstocks</Button>
            </Link>
            {isAuthenticated ? (
              <Link href="/dashboard">
                <Button>Dashboard</Button>
              </Link>
            ) : (
              <a href={getLoginUrl()}>
                <Button>Sign In</Button>
              </a>
            )}
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-green-50 to-green-100 py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold text-primary mb-6">
            Australian Biofuel Feedstock Index
          </h1>
          <p className="text-xl text-gray-700 mb-8 max-w-3xl mx-auto">
            The trusted B2B marketplace connecting verified biofuel feedstock suppliers
            with buyers across Australia. Transparent ratings, certified quality, and
            sustainable sourcing.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/browse">
              <Button size="lg" className="gap-2">
                Browse Feedstocks <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            {!isAuthenticated && (
              <a href={getLoginUrl()}>
                <Button size="lg" variant="outline">
                  Get Started
                </Button>
              </a>
            )}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Why Choose ABFI?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <Award className="h-10 w-10 text-primary mb-4" />
                <CardTitle>ABFI Rating System</CardTitle>
                <CardDescription>
                  Comprehensive 4-pillar scoring: Sustainability (30%), Carbon Intensity (30%),
                  Quality (25%), Supply Reliability (15%)
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Shield className="h-10 w-10 text-primary mb-4" />
                <CardTitle>Verified Suppliers</CardTitle>
                <CardDescription>
                  All suppliers undergo ABN validation and verification. Track ISCC, RSB,
                  RED II, and ABFI certifications.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Search className="h-10 w-10 text-primary mb-4" />
                <CardTitle>Advanced Search</CardTitle>
                <CardDescription>
                  Filter by feedstock type, location, ABFI score, carbon intensity,
                  certifications, and volume requirements.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Leaf className="h-10 w-10 text-primary mb-4" />
                <CardTitle>Carbon Tracking</CardTitle>
                <CardDescription>
                  Transparent carbon intensity values (gCO2e/MJ) with lifecycle assessment
                  and grade ratings from A+ to F.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <BarChart3 className="h-10 w-10 text-primary mb-4" />
                <CardTitle>Market Intelligence</CardTitle>
                <CardDescription>
                  Access supply heatmaps, availability trends, and regional analytics
                  to inform procurement decisions.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <TrendingUp className="h-10 w-10 text-primary mb-4" />
                <CardTitle>Quality Assurance</CardTitle>
                <CardDescription>
                  Type-specific quality parameters for oilseeds, UCO, tallow, lignocellulosic,
                  and waste feedstocks.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Feedstock Categories */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Feedstock Categories</h2>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { name: "Oilseed Crops", desc: "Canola, sunflower, soybean" },
              { name: "Used Cooking Oil", desc: "Post-consumer UCO" },
              { name: "Tallow & Fats", desc: "Animal fats and tallow" },
              { name: "Lignocellulosic", desc: "Agricultural residues, forestry" },
              { name: "Bamboo", desc: "P-Grade biomass, sustainable" },
              { name: "Waste Streams", desc: "Organic waste, municipal" },
              { name: "Algae", desc: "Microalgae and macroalgae" },
            ].map((cat) => (
              <Card key={cat.name} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="text-lg">{cat.name}</CardTitle>
                  <CardDescription>{cat.desc}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to Get Started?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Join Australia's leading biofuel feedstock marketplace. Connect with verified
            suppliers or list your feedstocks today.
          </p>
          <div className="flex gap-4 justify-center">
            {!isAuthenticated ? (
              <>
                <a href={getLoginUrl()}>
                  <Button size="lg" variant="secondary">
                    Register as Supplier
                  </Button>
                </a>
                <a href={getLoginUrl()}>
                  <Button size="lg" variant="outline" className="text-white border-white hover:bg-white/10">
                    Register as Buyer
                  </Button>
                </a>
              </>
            ) : (
              <Link href="/dashboard">
                <Button size="lg" variant="secondary">
                  Go to Dashboard
                </Button>
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-8">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Leaf className="h-6 w-6" />
            <span className="text-xl font-bold">ABFI</span>
          </div>
          <p className="text-sm">
            Australian Biofuel Feedstock Index © 2024. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
