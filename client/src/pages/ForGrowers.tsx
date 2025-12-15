import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  Award,
  BarChart3,
  Leaf,
  Shield,
  TrendingUp,
  MapPin,
  FileCheck,
  Calendar,
  Users,
  CheckCircle2,
  DollarSign,
  Clock,
  TreeDeciduous,
  Sprout,
  Wheat,
  Target,
  Handshake,
  LineChart,
  BadgeCheck,
  ChevronRight,
} from "lucide-react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";
import {
  FadeInUp,
  StaggerContainer,
  StaggerItem,
  HoverCard,
  AnimatedCounter,
  motion,
} from "@/components/ui/motion";

// Grower Qualification Tier Component
function GQTierCard({
  tier,
  title,
  description,
  requirements,
  color,
}: {
  tier: string;
  title: string;
  description: string;
  requirements: string[];
  color: string;
}) {
  const colorClasses: Record<string, { bg: string; border: string; text: string }> = {
    emerald: { bg: "bg-emerald-500/10", border: "border-emerald-500/30", text: "text-emerald-600" },
    green: { bg: "bg-green-500/10", border: "border-green-500/30", text: "text-green-600" },
    lime: { bg: "bg-lime-500/10", border: "border-lime-500/30", text: "text-lime-600" },
    yellow: { bg: "bg-yellow-500/10", border: "border-yellow-500/30", text: "text-yellow-600" },
  };

  const classes = colorClasses[color] || colorClasses.green;

  return (
    <Card className={cn("border-2", classes.border)}>
      <CardHeader>
        <div className="flex items-center justify-between mb-2">
          <Badge className={cn(classes.bg, classes.text, "border-0")}>{tier}</Badge>
        </div>
        <CardTitle className="text-xl">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {requirements.map((req, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className={cn("h-4 w-4 shrink-0 mt-0.5", classes.text)} />
              <span>{req}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

export default function ForGrowers() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/">
            <div className="flex items-center gap-3 group cursor-pointer">
              <div className="p-2 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                <Leaf className="h-6 w-6 text-primary" />
              </div>
              <span className="text-xl font-bold text-foreground font-display">ABFI</span>
            </div>
          </Link>
          <nav className="flex items-center gap-2">
            <Link href="/futures">
              <Button variant="ghost" size="sm">Marketplace</Button>
            </Link>
            <Link href="/producer-registration">
              <Button size="sm" className="bg-emerald-500 hover:bg-emerald-600">
                Register Now
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-emerald-900 via-green-800 to-emerald-900 text-white">
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <pattern id="leaves" patternUnits="userSpaceOnUse" width="20" height="20">
              <path d="M10 2 Q15 10 10 18 Q5 10 10 2" stroke="currentColor" strokeWidth="0.5" fill="none" />
            </pattern>
            <rect width="100%" height="100%" fill="url(#leaves)" />
          </svg>
        </div>

        <div className="container mx-auto px-4 py-20 lg:py-28 relative z-10">
          <div className="max-w-4xl">
            <FadeInUp>
              <Badge variant="outline" className="border-white/20 text-white/90 bg-white/5 mb-6">
                <TreeDeciduous className="h-3 w-3 mr-1.5" />
                For Growers & Producers
              </Badge>
            </FadeInUp>

            <FadeInUp delay={0.1}>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold mb-6 leading-tight">
                Transform Your Land Into
                <span className="block text-emerald-300">Bankable Assets</span>
              </h1>
            </FadeInUp>

            <FadeInUp delay={0.2}>
              <p className="text-xl text-emerald-100 mb-8 max-w-2xl">
                Join Australia's first platform that gives growers institutional-grade verification,
                long-term off-take visibility, and access to project finance markets.
              </p>
            </FadeInUp>

            <FadeInUp delay={0.3} className="flex flex-wrap gap-4">
              <Link href="/producer-registration">
                <Button size="lg" className="bg-white text-emerald-900 hover:bg-emerald-50">
                  <Sprout className="h-4 w-4 mr-2" />
                  Start Registration
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
              <Link href="/supplier/futures">
                <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 bg-transparent">
                  List Your Futures
                </Button>
              </Link>
            </FadeInUp>
          </div>
        </div>

        {/* Bottom wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 100" fill="none" className="w-full">
            <path d="M0 100V50C240 10 480 0 720 20C960 40 1200 80 1440 50V100H0Z" className="fill-background" />
          </svg>
        </div>
      </section>

      {/* Value Proposition */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <FadeInUp className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
              Why Growers Choose ABFI
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Move beyond spot markets. Build long-term value with verified credentials and institutional buyers.
            </p>
          </FadeInUp>

          <StaggerContainer className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: BadgeCheck,
                title: "Verified Status",
                description: "GQ1-GQ4 certification demonstrates your operational excellence to buyers and lenders.",
              },
              {
                icon: Calendar,
                title: "25-Year Visibility",
                description: "List futures projections up to 25 years forward. Let buyers find you before planting.",
              },
              {
                icon: DollarSign,
                title: "Fair Price Discovery",
                description: "Transparent marketplace pricing based on verified quality, location, and contract terms.",
              },
              {
                icon: Handshake,
                title: "Direct Buyer Access",
                description: "Connect directly with project developers and off-takers. No intermediaries.",
              },
            ].map((item, i) => (
              <StaggerItem key={i}>
                <Card className="h-full text-center hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
                      <item.icon className="h-6 w-6 text-emerald-600" />
                    </div>
                    <CardTitle className="text-lg">{item.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </CardContent>
                </Card>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* Grower Qualification Tiers */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <FadeInUp className="text-center mb-16">
            <Badge variant="outline" className="mb-4">Grower Qualification System</Badge>
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
              Your Path to GQ1 Status
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Progress through standardized tiers as you demonstrate operational maturity.
              Higher tiers unlock better pricing and buyer access.
            </p>
          </FadeInUp>

          <StaggerContainer className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            <StaggerItem>
              <GQTierCard
                tier="GQ4"
                title="Emerging"
                description="New entrants with basic registration"
                color="yellow"
                requirements={[
                  "ABN verification",
                  "Basic property details",
                  "Crop type declaration",
                  "Initial yield estimate",
                ]}
              />
            </StaggerItem>
            <StaggerItem>
              <GQTierCard
                tier="GQ3"
                title="Developing"
                description="Established operations building track record"
                color="lime"
                requirements={[
                  "All GQ4 requirements",
                  "12+ months operational data",
                  "Quality test results",
                  "Site assessment completed",
                ]}
              />
            </StaggerItem>
            <StaggerItem>
              <GQTierCard
                tier="GQ2"
                title="Established"
                description="Proven suppliers with verified history"
                color="green"
                requirements={[
                  "All GQ3 requirements",
                  "3+ years track record",
                  "Third-party certification",
                  "Sustainability documentation",
                ]}
              />
            </StaggerItem>
            <StaggerItem>
              <GQTierCard
                tier="GQ1"
                title="Premium"
                description="Top-tier suppliers for institutional buyers"
                color="emerald"
                requirements={[
                  "All GQ2 requirements",
                  "5+ years consistent delivery",
                  "Financial audited records",
                  "Multi-site capability",
                ]}
              />
            </StaggerItem>
          </StaggerContainer>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <FadeInUp className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
              How It Works
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              From registration to receiving EOIs — your path to long-term contracts.
            </p>
          </FadeInUp>

          <div className="max-w-4xl mx-auto">
            <StaggerContainer className="space-y-8">
              {[
                {
                  step: "01",
                  title: "Register & Verify",
                  description: "Complete your producer registration with ABN verification and property details. Upload supporting documentation to establish your baseline GQ tier.",
                  icon: FileCheck,
                },
                {
                  step: "02",
                  title: "Create Futures Listings",
                  description: "Project your yields up to 25 years forward. Define crop types, volumes, quality expectations, and indicative pricing for each harvest year.",
                  icon: Calendar,
                },
                {
                  step: "03",
                  title: "Receive Expressions of Interest",
                  description: "Verified buyers browse the marketplace and submit EOIs on your listings. Review offers, negotiate terms, and accept the best deals.",
                  icon: Target,
                },
                {
                  step: "04",
                  title: "Execute & Deliver",
                  description: "Finalize contracts through the platform. Track deliveries, upload quality certificates, and build your track record for higher GQ tiers.",
                  icon: Handshake,
                },
              ].map((item, i) => (
                <StaggerItem key={i}>
                  <div className="flex gap-6 items-start">
                    <div className="shrink-0">
                      <div className="h-16 w-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                        <span className="text-2xl font-bold text-emerald-600 font-mono">{item.step}</span>
                      </div>
                    </div>
                    <div className="flex-1 pt-2">
                      <div className="flex items-center gap-3 mb-2">
                        <item.icon className="h-5 w-5 text-emerald-600" />
                        <h3 className="text-xl font-semibold">{item.title}</h3>
                      </div>
                      <p className="text-muted-foreground">{item.description}</p>
                    </div>
                  </div>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>
        </div>
      </section>

      {/* Crop Types */}
      <section className="py-20 bg-slate-900 text-white">
        <div className="container mx-auto px-4">
          <FadeInUp className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
              Supported Perennial Crops
            </h2>
            <p className="text-lg text-slate-300 max-w-2xl mx-auto">
              Long-rotation biomass crops that qualify for futures listing on ABFI.
            </p>
          </FadeInUp>

          <StaggerContainer className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 max-w-5xl mx-auto">
            {[
              { name: "Bamboo", icon: Sprout },
              { name: "Eucalyptus", icon: TreeDeciduous },
              { name: "Rotation Forestry", icon: TreeDeciduous },
              { name: "Poplar", icon: TreeDeciduous },
              { name: "Willow", icon: TreeDeciduous },
              { name: "Miscanthus", icon: Wheat },
              { name: "Switchgrass", icon: Wheat },
              { name: "Arundo Donax", icon: Wheat },
              { name: "Industrial Hemp", icon: Leaf },
              { name: "Other Perennials", icon: Sprout },
            ].map((crop, i) => (
              <StaggerItem key={i}>
                <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center hover:bg-white/10 transition-colors">
                  <crop.icon className="h-8 w-8 mx-auto mb-2 text-emerald-400" />
                  <span className="text-sm font-medium">{crop.name}</span>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-emerald-500 text-white">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold font-mono mb-2">
                <AnimatedCounter value={250} suffix="+" />
              </div>
              <div className="text-emerald-100">Registered Growers</div>
            </div>
            <div>
              <div className="text-4xl font-bold font-mono mb-2">
                <AnimatedCounter value={120} suffix="k" />
              </div>
              <div className="text-emerald-100">Hectares Listed</div>
            </div>
            <div>
              <div className="text-4xl font-bold font-mono mb-2">
                <AnimatedCounter value={25} />
              </div>
              <div className="text-emerald-100">Year Maximum Projection</div>
            </div>
            <div>
              <div className="text-4xl font-bold font-mono mb-2">
                <AnimatedCounter value={95} suffix="%" />
              </div>
              <div className="text-emerald-100">EOI Response Rate</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <FadeInUp className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-6">
              Ready to List Your Biomass Futures?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Join hundreds of growers who are building long-term value through verified supply agreements.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/producer-registration">
                <Button size="xl" className="bg-emerald-500 hover:bg-emerald-600">
                  <Sprout className="h-5 w-5 mr-2" />
                  Start Registration
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
              </Link>
              <Link href="/supplier/futures">
                <Button size="xl" variant="outline">
                  View Marketplace
                </Button>
              </Link>
            </div>
          </FadeInUp>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/30 py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <Link href="/">
              <div className="flex items-center gap-2">
                <Leaf className="h-5 w-5 text-primary" />
                <span className="font-bold font-display">ABFI</span>
              </div>
            </Link>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <Link href="/for-developers" className="hover:text-foreground transition-colors">For Developers</Link>
              <Link href="/for-lenders" className="hover:text-foreground transition-colors">For Lenders</Link>
              <Link href="/platform-features" className="hover:text-foreground transition-colors">Platform Features</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
