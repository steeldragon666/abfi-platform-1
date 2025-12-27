import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Leaf,
  Factory,
  TrendingUp,
  Compass,
  ArrowRight,
  Shield,
  CheckCircle2,
  BarChart3,
  FileCheck,
  Users,
  Lock,
  Zap,
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import {
  FadeInUp,
  StaggerContainer,
  StaggerItem,
  HoverCard,
  AnimatedCounter,
  motion,
} from "@/components/ui/motion";

// Intent pathway cards configuration - Navy + Gold Corporate Theme
const INTENT_PATHWAYS = [
  {
    id: "grower",
    title: "Sell/Certify Feedstock",
    description: "Register your feedstock, get certified, and connect with verified buyers",
    icon: Leaf,
    color: "navy",
    bgColor: "bg-[#D4AF37]/10",
    borderColor: "border-primary/30",
    iconColor: "text-[#D4AF37]",
    hoverBg: "hover:bg-primary/15",
    href: "/grower/dashboard",
    features: ["Feedstock registration", "Certification tracking", "Contract management"],
  },
  {
    id: "developer",
    title: "Secure Supply",
    description: "Find verified feedstock suppliers and secure long-term supply agreements",
    icon: Factory,
    color: "navy",
    bgColor: "bg-[#D4AF37]/10",
    borderColor: "border-primary/30",
    iconColor: "text-[#D4AF37]",
    hoverBg: "hover:bg-primary/15",
    href: "/developer/dashboard",
    features: ["Registry explorer", "Supply confidence", "Price signals"],
  },
  {
    id: "finance",
    title: "Evaluate Risk & Price",
    description: "Access market intelligence, risk scoring, and stealth discovery tools",
    icon: TrendingUp,
    color: "navy",
    bgColor: "bg-[#D4AF37]/10",
    borderColor: "border-primary/30",
    iconColor: "text-[#D4AF37]",
    hoverBg: "hover:bg-primary/15",
    href: "/finance/dashboard",
    features: ["Stealth Discovery", "Lending Sentiment", "Price Intelligence"],
  },
  {
    id: "explore",
    title: "Just Exploring",
    description: "Not sure where you fit? Take a quick assessment to find your path",
    icon: Compass,
    color: "gold",
    bgColor: "bg-accent/10",
    borderColor: "border-accent/40",
    iconColor: "text-accent",
    hoverBg: "hover:bg-accent/20",
    href: "/explore",
    features: ["Personalized guidance", "Feature preview", "Tailored onboarding"],
  },
];

// Trust signals / stats
const TRUST_STATS = [
  { value: 500, suffix: "+", label: "Verified Suppliers" },
  { value: 99.9, suffix: "%", decimals: 1, label: "Uptime SLA" },
  { value: 2, prefix: "$", suffix: "B+", label: "Transactions" },
  { value: 247, suffix: "", label: "Entities Tracked" },
];

// Intelligence teasers (tiered - showing limited pre-auth)
const INTELLIGENCE_TEASERS = [
  {
    title: "Feedstock Prices",
    change: "+12.3%",
    direction: "up",
    period: "YoY",
    description: "UCO spot price trend",
  },
  {
    title: "Lending Sentiment",
    change: "+8",
    direction: "up",
    period: "30d",
    description: "Bioenergy sentiment index",
  },
  {
    title: "New Signals",
    change: "67",
    direction: "neutral",
    period: "This week",
    description: "Stealth discovery alerts",
  },
];

export default function Landing() {
  const [, navigate] = useLocation();
  const [hoveredPathway, setHoveredPathway] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section - Pure Black + Gold (Figma Design) */}
      <section className="relative overflow-hidden bg-black text-white">
        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-black via-zinc-950 to-black" />

        {/* Animated gradient orbs - Gold accent */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-[#D4AF37]/15 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#D4AF37]/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />

        <div className="container mx-auto px-4 py-20 lg:py-32 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <FadeInUp>
              <Badge
                variant="outline"
                className="border-white/20 text-white/90 bg-white/5 mb-6"
              >
                <Zap className="h-3 w-3 mr-1.5" />
                Australia's Biofuels Intelligence Platform
              </Badge>
            </FadeInUp>

            <FadeInUp delay={0.1}>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold mb-6 leading-tight text-white">
                Transform Biofuel
                <span className="block bg-gradient-to-r from-[#D4AF37] to-[#F4CF67] bg-clip-text text-transparent">
                  Supply Chain Risk
                </span>
                Into Strategic Advantage
              </h1>
            </FadeInUp>

            <FadeInUp delay={0.2}>
              <p className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto">
                Verified feedstock registry, real-time market intelligence, and
                cryptographic audit trails. The infrastructure powering Australia's
                bioenergy transition.
              </p>
            </FadeInUp>

            <FadeInUp delay={0.3}>
              <div className="flex flex-col items-center gap-4">
                <p className="text-lg font-medium text-white">
                  What do you want to do?
                </p>
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Lock className="h-4 w-4" />
                  <span>Free access to all intelligence features</span>
                </div>
              </div>
            </FadeInUp>
          </div>
        </div>

        {/* Wave transition */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 100" fill="none" className="w-full">
            <path
              d="M0 100V50C240 10 480 0 720 20C960 40 1200 80 1440 50V100H0Z"
              className="fill-background"
            />
          </svg>
        </div>
      </section>

      {/* Intent Selection - Inline */}
      <section className="py-16 bg-background -mt-8 relative z-20">
        <div className="container mx-auto px-4">
          <StaggerContainer className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {INTENT_PATHWAYS.map((pathway, index) => (
              <StaggerItem key={pathway.id}>
                <Link href={pathway.href}>
                  <Card
                    className={cn(
                      "h-full cursor-pointer transition-all duration-300 border-2",
                      pathway.borderColor,
                      pathway.hoverBg,
                      hoveredPathway === pathway.id && "scale-[1.02] shadow-lg"
                    )}
                    onMouseEnter={() => setHoveredPathway(pathway.id)}
                    onMouseLeave={() => setHoveredPathway(null)}
                  >
                    <CardHeader>
                      <div className={cn(
                        "h-12 w-12 rounded-xl flex items-center justify-center mb-4",
                        pathway.bgColor
                      )}>
                        <pathway.icon className={cn("h-6 w-6", pathway.iconColor)} />
                      </div>
                      <CardTitle className="text-lg">{pathway.title}</CardTitle>
                      <CardDescription>{pathway.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {pathway.features.map((feature, i) => (
                          <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                            <CheckCircle2 className={cn("h-4 w-4", pathway.iconColor)} />
                            {feature}
                          </li>
                        ))}
                      </ul>
                      <div className={cn(
                        "mt-4 flex items-center text-sm font-medium",
                        pathway.iconColor
                      )}>
                        Get Started
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* Pre-auth Intelligence Teasers (Tiered) */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <FadeInUp className="text-center mb-12">
            <Badge variant="outline" className="mb-4">
              <BarChart3 className="h-3 w-3 mr-1.5" />
              Live Market Intelligence
            </Badge>
            <h2 className="text-3xl font-display font-bold mb-4">
              Real-Time Market Signals
            </h2>
            <p className="text-gray-600 max-w-xl mx-auto">
              Sample of our intelligence feeds. Sign up for full access including
              absolute pricing and confidence bands.
            </p>
          </FadeInUp>

          <StaggerContainer className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {INTELLIGENCE_TEASERS.map((teaser, index) => (
              <StaggerItem key={index}>
                <Card className="text-center">
                  <CardHeader className="pb-2">
                    <CardDescription>{teaser.description}</CardDescription>
                    <CardTitle className="text-base">{teaser.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-center gap-2">
                      <span className={cn(
                        "text-3xl font-bold",
                        teaser.direction === "up" && "text-[#D4AF37]",
                        teaser.direction === "down" && "text-red-600",
                        teaser.direction === "neutral" && "text-blue-600"
                      )}>
                        {teaser.change}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {teaser.period}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-600 mt-2">
                      <Lock className="h-3 w-3 inline mr-1" />
                      Register for absolute values
                    </p>
                  </CardContent>
                </Card>
              </StaggerItem>
            ))}
          </StaggerContainer>

          <FadeInUp delay={0.3} className="text-center mt-8">
            <Link href="/finance/dashboard">
              <Button variant="outline" size="lg">
                <TrendingUp className="h-4 w-4 mr-2" />
                Access Full Intelligence Suite
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </FadeInUp>
        </div>
      </section>

      {/* Trust Bar - Pure Black */}
      <section className="py-16 bg-black text-white">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            {TRUST_STATS.map((stat, index) => (
              <FadeInUp key={index} delay={index * 0.1}>
                <div>
                  <div className="text-4xl font-bold font-mono mb-2 text-white">
                    {stat.prefix}
                    <AnimatedCounter
                      value={stat.value}
                      decimals={stat.decimals || 0}
                      suffix={stat.suffix}
                    />
                  </div>
                  <div className="text-gray-400">{stat.label}</div>
                </div>
              </FadeInUp>
            ))}
          </div>
        </div>
      </section>

      {/* Value Propositions */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <FadeInUp className="text-center mb-16">
            <h2 className="text-3xl font-display font-bold mb-4">
              Built for the Bioenergy Ecosystem
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Every feature designed with regulatory compliance, financial due diligence,
              and supply chain integrity in mind.
            </p>
          </FadeInUp>

          <StaggerContainer className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                icon: Shield,
                title: "Cryptographic Audit Trail",
                description: "SHA-256 evidence chains. Every document, assessment, and transaction is tamper-proof and independently verifiable.",
              },
              {
                icon: FileCheck,
                title: "Verified Registry",
                description: "Pre-qualified suppliers with certification tracking, quality test results, and real-time compliance status.",
              },
              {
                icon: Users,
                title: "Multi-Stakeholder Platform",
                description: "Connects growers, developers, offtakers, and financiers in a single trusted marketplace.",
              },
            ].map((item, index) => (
              <StaggerItem key={index}>
                <Card className="h-full">
                  <CardHeader>
                    <div className="h-12 w-12 rounded-xl bg-[#D4AF37]/10 flex items-center justify-center mb-4">
                      <item.icon className="h-6 w-6 text-[#D4AF37]" />
                    </div>
                    <CardTitle className="text-lg">{item.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600">{item.description}</p>
                  </CardContent>
                </Card>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* Final CTA - Pure Black + Gold */}
      <section className="py-20 bg-gradient-to-br from-black to-zinc-900 text-white">
        <div className="container mx-auto px-4 text-center">
          <FadeInUp>
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-6 text-white">
              Ready to Transform Your Supply Chain?
            </h2>
            <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
              Join Australia's leading biofuels platform. Free access to all
              intelligence features during early access.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/explore">
                <Button size="lg" className="bg-[#D4AF37] text-black hover:bg-[#E5C158] font-semibold">
                  <Compass className="h-5 w-5 mr-2" />
                  Find Your Path
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
              </Link>
              <Link href="/finance/dashboard">
                <Button size="lg" variant="outline" className="border-[#D4AF37]/50 text-white hover:bg-[#D4AF37]/10 bg-transparent">
                  View Intelligence Suite
                </Button>
              </Link>
            </div>
          </FadeInUp>
        </div>
      </section>

    </div>
  );
}
