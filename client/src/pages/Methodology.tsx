/**
 * ABFI Methodology Page
 *
 * Explains the ABFI scoring methodology, rating framework,
 * and verification standards used across the platform.
 */

import { Button } from "@/components/ui/Button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  Award,
  BarChart3,
  Shield,
  CheckCircle2,
  FileCheck,
  Target,
  Lock,
  Database,
  Fingerprint,
  Scale,
  BookOpen,
  Layers,
  Gauge,
  TrendingUp,
  Users,
  Building2,
  Leaf,
} from "lucide-react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";
import {
  FadeInUp,
  StaggerContainer,
  StaggerItem,
  HoverCard,
  motion,
} from "@/components/ui/motion";
import { H1, H2, H3, Body } from "@/components/Typography";

// Rating scale component
function RatingScale() {
  const ratings = [
    { grade: "AAA", label: "Exceptional", color: "bg-emerald-500", desc: "Highest quality, minimal risk" },
    { grade: "AA+", label: "Excellent", color: "bg-emerald-400", desc: "Very high quality, very low risk" },
    { grade: "AA", label: "Very Good", color: "bg-green-500", desc: "High quality, low risk" },
    { grade: "A+", label: "Good", color: "bg-green-400", desc: "Good quality, low to moderate risk" },
    { grade: "A", label: "Adequate", color: "bg-lime-500", desc: "Adequate quality, moderate risk" },
    { grade: "BBB", label: "Acceptable", color: "bg-yellow-500", desc: "Acceptable quality, moderate risk" },
    { grade: "BB", label: "Marginal", color: "bg-orange-400", desc: "Marginal quality, elevated risk" },
    { grade: "B", label: "Weak", color: "bg-orange-500", desc: "Weak quality, high risk" },
    { grade: "CCC", label: "Poor", color: "bg-red-400", desc: "Poor quality, very high risk" },
  ];

  return (
    <div className="grid grid-cols-3 md:grid-cols-9 gap-2">
      {ratings.map((rating) => (
        <div key={rating.grade} className="text-center">
          <div className={cn("w-full h-2 rounded-full mb-2", rating.color)} />
          <div className="font-bold text-sm">{rating.grade}</div>
          <div className="text-xs text-muted-foreground">{rating.label}</div>
        </div>
      ))}
    </div>
  );
}

// Scoring component visualization
function ScoringComponent({ 
  title, 
  weight, 
  icon: Icon, 
  factors 
}: { 
  title: string; 
  weight: number; 
  icon: React.ComponentType<{ className?: string }>; 
  factors: string[];
}) {
  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <CardTitle className="text-lg">{title}</CardTitle>
          </div>
          <Badge variant="secondary" className="text-lg font-bold">
            {weight}%
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {factors.map((factor, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
              {factor}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

export default function Methodology() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/">
            <div className="flex items-center gap-2 cursor-pointer">
              <img src="/abfi-icon.svg" alt="ABFI" className="h-8 w-8" />
              <span className="font-bold text-xl">ABFI</span>
            </div>
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/ratings">
              <Button variant="ghost">Ratings</Button>
            </Link>
            <Link href="/browse">
              <Button variant="ghost">Marketplace</Button>
            </Link>
            <Link href="/login">
              <Button>Sign In</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white py-24">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="container mx-auto px-4 relative z-10">
          <FadeInUp>
            <div className="max-w-3xl mx-auto text-center">
              <Badge className="mb-6 bg-white/10 text-white border-white/20">
                <BookOpen className="h-3 w-3 mr-1" />
                ABFI Methodology v1.0
              </Badge>
              <H1 className="text-white mb-6">
                Bank-Grade Assessment Framework
              </H1>
              <Body className="text-xl text-slate-300 mb-8">
                A standardized, transparent methodology for evaluating bioenergy feedstock 
                supply chains. Built for institutional due diligence and regulatory compliance.
              </Body>
              <div className="flex flex-wrap gap-4 justify-center">
                <Link href="/ratings">
                  <Button size="lg" className="bg-white text-slate-900 hover:bg-slate-100">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    View Ratings
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
                <Link href="/browse">
                  <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10">
                    Explore Marketplace
                  </Button>
                </Link>
              </div>
            </div>
          </FadeInUp>
        </div>
      </section>

      {/* Rating Scale Overview */}
      <section className="py-16 bg-slate-50">
        <div className="container mx-auto px-4">
          <FadeInUp>
            <div className="text-center mb-12">
              <Badge className="mb-4">Rating Framework</Badge>
              <H2 className="mb-4">Standardized Rating Scale</H2>
              <Body className="text-muted-foreground max-w-2xl mx-auto">
                The ABFI rating scale mirrors established credit rating conventions, 
                providing familiar benchmarks for financial institutions.
              </Body>
            </div>
          </FadeInUp>
          
          <FadeInUp delay={0.1}>
            <Card className="p-8">
              <RatingScale />
              <div className="mt-6 pt-6 border-t grid md:grid-cols-3 gap-4 text-center text-sm text-muted-foreground">
                <div>
                  <strong className="text-foreground">Investment Grade:</strong> AAA to BBB
                </div>
                <div>
                  <strong className="text-foreground">Speculative Grade:</strong> BB to B
                </div>
                <div>
                  <strong className="text-foreground">High Risk:</strong> CCC and below
                </div>
              </div>
            </Card>
          </FadeInUp>
        </div>
      </section>

      {/* Five Pillars of Assessment */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <FadeInUp>
            <div className="text-center mb-12">
              <Badge className="mb-4">Assessment Components</Badge>
              <H2 className="mb-4">Five Pillars of Bankability</H2>
              <Body className="text-muted-foreground max-w-2xl mx-auto">
                Each project is evaluated across five weighted dimensions that together 
                determine overall bankability and investment readiness.
              </Body>
            </div>
          </FadeInUp>

          <StaggerContainer className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <StaggerItem>
              <ScoringComponent
                title="Volume Security"
                weight={30}
                icon={Gauge}
                factors={[
                  "Contracted vs uncommitted supply ratio",
                  "Historical delivery performance",
                  "Supply chain redundancy",
                  "Seasonal variability management",
                ]}
              />
            </StaggerItem>
            <StaggerItem>
              <ScoringComponent
                title="Counterparty Quality"
                weight={25}
                icon={Users}
                factors={[
                  "Supplier GQ tier distribution",
                  "Financial stability indicators",
                  "Operational track record",
                  "Certification compliance",
                ]}
              />
            </StaggerItem>
            <StaggerItem>
              <ScoringComponent
                title="Contract Structure"
                weight={20}
                icon={FileCheck}
                factors={[
                  "Contract term length",
                  "Price escalation mechanisms",
                  "Force majeure provisions",
                  "Termination clauses",
                ]}
              />
            </StaggerItem>
            <StaggerItem>
              <ScoringComponent
                title="Concentration Risk"
                weight={15}
                icon={Target}
                factors={[
                  "HHI (Herfindahl-Hirschman Index)",
                  "Geographic diversification",
                  "Supplier count adequacy",
                  "Single-point-of-failure analysis",
                ]}
              />
            </StaggerItem>
            <StaggerItem>
              <ScoringComponent
                title="Operational Readiness"
                weight={10}
                icon={Building2}
                factors={[
                  "Infrastructure maturity",
                  "Logistics capability",
                  "Quality assurance systems",
                  "Regulatory compliance status",
                ]}
              />
            </StaggerItem>
          </StaggerContainer>
        </div>
      </section>

      {/* Grower Qualification Tiers */}
      <section className="py-16 bg-slate-50">
        <div className="container mx-auto px-4">
          <FadeInUp>
            <div className="text-center mb-12">
              <Badge className="mb-4">Supplier Framework</Badge>
              <H2 className="mb-4">Grower Qualification Tiers</H2>
              <Body className="text-muted-foreground max-w-2xl mx-auto">
                Suppliers progress through standardized tiers as they demonstrate 
                operational maturity and track record.
              </Body>
            </div>
          </FadeInUp>

          <div className="grid md:grid-cols-4 gap-6">
            {[
              {
                tier: "GQ1",
                label: "Premium",
                color: "bg-emerald-500",
                description: "Top-tier suppliers with 5+ years consistent delivery",
                requirements: ["5+ years track record", "Financial audits", "Multi-site capability", "Full certifications"],
              },
              {
                tier: "GQ2",
                label: "Established",
                color: "bg-green-500",
                description: "Proven suppliers with verified history",
                requirements: ["3+ years track record", "Third-party certification", "Sustainability docs", "Quality systems"],
              },
              {
                tier: "GQ3",
                label: "Developing",
                color: "bg-yellow-500",
                description: "Established operations building track record",
                requirements: ["12+ months data", "Quality test results", "Site assessment", "Basic certifications"],
              },
              {
                tier: "GQ4",
                label: "Emerging",
                color: "bg-orange-500",
                description: "New entrants with basic registration",
                requirements: ["ABN verification", "Property details", "Crop declaration", "Yield estimate"],
              },
            ].map((tier, i) => (
              <FadeInUp key={tier.tier} delay={i * 0.1}>
                <Card className="h-full">
                  <CardHeader>
                    <div className="flex items-center gap-3 mb-2">
                      <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold", tier.color)}>
                        {tier.tier}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{tier.label}</CardTitle>
                      </div>
                    </div>
                    <CardDescription>{tier.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {tier.requirements.map((req, j) => (
                        <li key={j} className="flex items-center gap-2 text-sm">
                          <CheckCircle2 className="h-3 w-3 text-green-500" />
                          {req}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </FadeInUp>
            ))}
          </div>
        </div>
      </section>

      {/* Evidence Chain & Verification */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <FadeInUp>
              <Badge className="mb-4">Cryptographic Verification</Badge>
              <H2 className="mb-4">Immutable Evidence Chain</H2>
              <Body className="text-muted-foreground mb-6">
                Every assessment, document, and transaction is cryptographically 
                hashed and chained using SHA-256. This creates a tamper-proof 
                audit trail that meets the highest standards of financial due diligence.
              </Body>
              <ul className="space-y-3 mb-6">
                {[
                  "Each record hashed with SHA-256 algorithm",
                  "Hashes chain to previous records creating integrity",
                  "Any modification breaks the chain and is detectable",
                  "Third-party verification available on demand",
                  "Temporal versioning for as-of-date queries",
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <div className="p-1 rounded-full bg-green-100">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    </div>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <div className="flex gap-4">
                <Badge variant="secondary">
                  <Lock className="h-3 w-3 mr-1" />
                  256-bit Encryption
                </Badge>
                <Badge variant="secondary">
                  <Database className="h-3 w-3 mr-1" />
                  AU Data Residency
                </Badge>
              </div>
            </FadeInUp>

            <FadeInUp delay={0.2}>
              <Card className="p-6 bg-slate-900 text-white">
                <div className="flex items-center gap-2 mb-4">
                  <Fingerprint className="h-4 w-4 text-blue-400" />
                  <span className="text-sm font-medium text-slate-400">
                    Evidence Chain Visualization
                  </span>
                </div>
                <div className="space-y-3 font-mono text-sm">
                  <div className="p-3 bg-slate-800 rounded-lg">
                    <div className="text-slate-400 text-xs mb-1">Block #1 - Assessment</div>
                    <div className="text-blue-400">hash: a3f8b2c1...9e4d</div>
                    <div className="text-slate-500">prev: 0000...0000</div>
                  </div>
                  <div className="flex justify-center">
                    <div className="w-0.5 h-4 bg-blue-500/50" />
                  </div>
                  <div className="p-3 bg-slate-800 rounded-lg">
                    <div className="text-slate-400 text-xs mb-1">Block #2 - Contract</div>
                    <div className="text-blue-400">hash: 7b2c4e8f...1a3b</div>
                    <div className="text-slate-500">prev: a3f8b2c1...9e4d</div>
                  </div>
                  <div className="flex justify-center">
                    <div className="w-0.5 h-4 bg-blue-500/50" />
                  </div>
                  <div className="p-3 bg-slate-800 rounded-lg">
                    <div className="text-slate-400 text-xs mb-1">Block #3 - Delivery</div>
                    <div className="text-blue-400">hash: 9e4d7f2a...8c5d</div>
                    <div className="text-slate-500">prev: 7b2c4e8f...1a3b</div>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-slate-700 flex items-center justify-between">
                  <span className="text-xs text-slate-400">Chain integrity verified</span>
                  <Badge className="bg-green-500/20 text-green-400 border-0">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Valid
                  </Badge>
                </div>
              </Card>
            </FadeInUp>
          </div>
        </div>
      </section>

      {/* Carbon Intensity */}
      <section className="py-16 bg-slate-50">
        <div className="container mx-auto px-4">
          <FadeInUp>
            <div className="text-center mb-12">
              <Badge className="mb-4">Environmental Standards</Badge>
              <H2 className="mb-4">Carbon Intensity Tracking</H2>
              <Body className="text-muted-foreground max-w-2xl mx-auto">
                All feedstocks are assessed for lifecycle carbon intensity (gCO2e/MJ), 
                ensuring compliance with sustainability mandates and enabling carbon credit eligibility.
              </Body>
            </div>
          </FadeInUp>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                feedstock: "Used Cooking Oil",
                intensity: "8-15",
                benchmark: "RED II Compliant",
                icon: Leaf,
              },
              {
                feedstock: "Lignocellulosic Biomass",
                intensity: "5-12",
                benchmark: "Very Low CI",
                icon: TrendingUp,
              },
              {
                feedstock: "Oilseed Crops",
                intensity: "25-35",
                benchmark: "Standard CI",
                icon: Scale,
              },
            ].map((item, i) => (
              <FadeInUp key={item.feedstock} delay={i * 0.1}>
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-green-100">
                        <item.icon className="h-5 w-5 text-green-600" />
                      </div>
                      <CardTitle className="text-lg">{item.feedstock}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold mb-2">{item.intensity}</div>
                    <div className="text-sm text-muted-foreground mb-2">gCO2e/MJ</div>
                    <Badge variant="secondary">{item.benchmark}</Badge>
                  </CardContent>
                </Card>
              </FadeInUp>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-br from-primary to-primary/80 text-white">
        <div className="container mx-auto px-4 text-center">
          <FadeInUp>
            <H2 className="text-white mb-4">Ready to Apply the Methodology?</H2>
            <Body className="text-white/80 mb-8 max-w-2xl mx-auto">
              Explore our marketplace to see ABFI ratings in action, or register 
              to get your feedstock supply assessed.
            </Body>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link href="/browse">
                <Button size="lg" className="bg-white text-primary hover:bg-slate-100">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Browse Marketplace
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
              <Link href="/producer-registration">
                <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10">
                  Register as Supplier
                </Button>
              </Link>
            </div>
          </FadeInUp>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t bg-white">
        <div className="container mx-auto px-4 flex items-center justify-between">
          <Link href="/">
            <div className="flex items-center gap-2 cursor-pointer">
              <img src="/abfi-icon.svg" alt="ABFI" className="h-6 w-6" />
              <span className="font-semibold">ABFI</span>
            </div>
          </Link>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <Link href="/for-growers">For Growers</Link>
            <Link href="/for-developers">For Developers</Link>
            <Link href="/for-lenders">For Lenders</Link>
            <Link href="/platform-features">Platform Features</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
