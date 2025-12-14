import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getLoginUrl } from "@/const";
import { ArrowRight, Award, BarChart3, Leaf, Search, Shield, TrendingUp, MapPin, FileCheck, Zap } from "lucide-react";
import { Link } from "wouter";

export default function Home() {
  const { user, isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b bg-white/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center">
              <Leaf className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold text-primary" style={{ fontFamily: 'Montserrat, sans-serif' }}>ABFI</span>
          </div>
          <nav className="flex items-center gap-6">
            <Link href="/browse">
              <Button variant="ghost" className="text-base">Marketplace</Button>
            </Link>
            <Link href="/feedstock-map">
              <Button variant="ghost" className="text-base">Data</Button>
            </Link>
            {isAuthenticated ? (
              <Link href="/dashboard">
                <Button className="bg-primary hover:bg-primary/90">Dashboard</Button>
              </Link>
            ) : (
              <a href={getLoginUrl()}>
                <Button className="bg-primary hover:bg-primary/90">Sign In</Button>
              </a>
            )}
          </nav>
        </div>
      </header>

      {/* Hero Section - Grower-Focused CTA */}
      <section className="relative overflow-hidden py-20" style={{ background: 'linear-gradient(135deg, #faf8f3 0%, #f5f0e6 100%)' }}>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-block mb-6">
              <Badge className="px-4 py-2 text-xs font-semibold uppercase tracking-wide" style={{ 
                background: '#fef3c7', 
                color: '#b8860b',
                border: 'none'
              }}>
                🌾 Grower Registration
              </Badge>
            </div>

            {/* Main Heading */}
            <h1 className="text-5xl md:text-6xl font-normal mb-6 leading-tight" style={{ 
              fontFamily: "'DM Serif Display', serif",
              color: '#1a2e1a'
            }}>
              Register Your Planned or<br />
              <span style={{ color: '#2d5a27' }}>Projected Feedstocks Today</span>
            </h1>

            {/* Subtext */}
            <p className="text-lg md:text-xl mb-10 max-w-2xl mx-auto" style={{ 
              color: '#4a5a4a',
              fontWeight: 300,
              lineHeight: 1.7
            }}>
              Add your plantation or projected supply to receive market signals, connect with verified offtakers, and secure fair prices based on real demand.
            </p>

            {/* Large CTA Button */}
            <Link href="/producer-registration">
              <Button 
                size="lg" 
                className="text-xl px-12 py-8 font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
                style={{
                  background: 'linear-gradient(135deg, #2d5a27, #4a7c43)',
                  color: 'white',
                  borderRadius: '12px'
                }}
              >
                Start Registration Now
                <ArrowRight className="ml-3 h-6 w-6" />
              </Button>
            </Link>

            {/* Trust Indicators */}
            <div className="flex flex-wrap justify-center gap-8 mt-12 text-sm" style={{ color: '#6b7c6b' }}>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5" style={{ color: '#2d5a27' }} />
                <span>Verified Data</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" style={{ color: '#2d5a27' }} />
                <span>Fair Market Prices</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5" style={{ color: '#2d5a27' }} />
                <span>Fast Approval</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Secondary CTAs */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/grower-benefits">
              <Button size="lg" variant="outline" className="text-base px-6 py-3 border-2" style={{
                borderColor: '#2d5a27',
                color: '#2d5a27'
              }}>
                See Grower Benefits
              </Button>
            </Link>
            <Link href="/browse">
              <Button size="lg" variant="outline" className="text-base px-6 py-3 border-2" style={{
                borderColor: '#2d5a27',
                color: '#2d5a27'
              }}>
                Browse Feedstocks
              </Button>
            </Link>
            <Link href="/feedstock-map">
              <Button size="lg" variant="outline" className="text-base px-6 py-3 border-2" style={{
                borderColor: '#2d5a27',
                color: '#2d5a27'
              }}>
                Interactive Map
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Original Metrics Section */}
      <section className="py-12" style={{ background: '#faf8f3' }}>
        <div className="container mx-auto px-4">

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-2 border-[#F4C430] shadow-lg hover:shadow-xl transition-shadow bg-white/90 backdrop-blur">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <TrendingUp className="h-4 w-4 text-[#F4C430]" />
                  Weekly Index
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary">1,245.50</div>
                <div className="text-sm text-emerald-600 font-medium">+2.3%</div>
              </CardContent>
            </Card>

            <Card className="border-2 border-[#F4C430] shadow-lg hover:shadow-xl transition-shadow bg-white/90 backdrop-blur">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Leaf className="h-4 w-4 text-[#F4C430]" />
                  Sustainability Score
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary">92/100</div>
                <div className="text-sm text-muted-foreground">Platform average</div>
              </CardContent>
            </Card>

            <Card className="border-2 border-[#F4C430] shadow-lg hover:shadow-xl transition-shadow bg-white/90 backdrop-blur">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <BarChart3 className="h-4 w-4 text-[#F4C430]" />
                  Feedstock Availability
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary">1,246.79</div>
                <div className="text-sm text-emerald-600 font-medium">+2.3%</div>
              </CardContent>
            </Card>

            <Card className="border-2 border-[#F4C430] shadow-lg hover:shadow-xl transition-shadow bg-white/90 backdrop-blur">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Zap className="h-4 w-4 text-[#F4C430]" />
                  Production Volume
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary">1.2M</div>
                <div className="text-sm text-emerald-600 font-medium">+0.1% tonnes</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Why Choose ABFI - Redesigned */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-primary mb-4">Why Choose ABFI?</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              The trusted B2B marketplace for verified biofuel feedstock suppliers and buyers
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-2 hover:border-[#DAA520]/50 transition-all hover:shadow-lg">
              <CardHeader>
                <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                  <Award className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-2xl">ABFI Rating System</CardTitle>
                <CardDescription className="text-base mt-2">
                  Comprehensive 4-pillar assessment framework evaluating sustainability, carbon intensity, quality, and reliability for transparent decision-making.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 hover:border-[#DAA520]/50 transition-all hover:shadow-lg">
              <CardHeader>
                <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                  <Shield className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-2xl">Verified Suppliers</CardTitle>
                <CardDescription className="text-base mt-2">
                  All suppliers undergo rigorous verification including ABN validation, quality testing, and certification checks before listing.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 hover:border-[#DAA520]/50 transition-all hover:shadow-lg">
              <CardHeader>
                <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                  <Search className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-2xl">Advanced Search</CardTitle>
                <CardDescription className="text-base mt-2">
                  Filter by feedstock type, location, ABFI score, carbon intensity, certifications, and more to find exactly what you need.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gradient-to-br from-primary to-primary/90 text-white">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-5xl font-bold mb-2 text-[#DAA520]">500+</div>
              <div className="text-lg opacity-90">Verified Suppliers</div>
            </div>
            <div>
              <div className="text-5xl font-bold mb-2 text-[#DAA520]">1,200+</div>
              <div className="text-lg opacity-90">Active Listings</div>
            </div>
            <div>
              <div className="text-5xl font-bold mb-2 text-[#DAA520]">2.5M</div>
              <div className="text-lg opacity-90">Tonnes Traded</div>
            </div>
            <div>
              <div className="text-5xl font-bold mb-2 text-[#DAA520]">92/100</div>
              <div className="text-lg opacity-90">Avg. ABFI Score</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-primary mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join Australia's leading biofuel feedstock marketplace today
          </p>
          {!isAuthenticated ? (
            <a href={getLoginUrl()}>
              <Button size="lg" className="text-lg px-12 py-7 bg-primary hover:bg-primary/90 shadow-lg">
                Create Account
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </a>
          ) : (
            <Link href="/dashboard">
              <Button size="lg" className="text-lg px-12 py-7 bg-primary hover:bg-primary/90 shadow-lg">
                Go to Dashboard
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-primary text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Leaf className="h-6 w-6" />
                <span className="text-xl font-bold" style={{ fontFamily: 'Playfair Display, serif' }}>ABFI</span>
              </div>
              <p className="text-sm opacity-80">
                Australian Biofuel Feedstock Institute - Your trusted source for sustainable energy data.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Marketplace</h3>
              <ul className="space-y-2 text-sm opacity-80">
                <li><Link href="/browse">Browse Feedstocks</Link></li>
                <li><Link href="/feedstock-map">Interactive Map</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Resources</h3>
              <ul className="space-y-2 text-sm opacity-80">
                <li>About ABFI Rating</li>
                <li>Documentation</li>
                <li>API Access</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-sm opacity-80">
                <li>About Us</li>
                <li>Contact</li>
                <li>Terms of Service</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/20 pt-8 text-center text-sm opacity-70">
            © 2024 Australian Biofuel Feedstock Institute. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
