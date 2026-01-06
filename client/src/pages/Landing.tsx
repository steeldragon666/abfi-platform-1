/**
 * Landing Page - Nextgen Design
 *
 * Features:
 * - Intent pathway cards (grower, developer, finance)
 * - Animated platform statistics
 * - Role-based dashboard routing
 * - Trust indicators and platform highlights
 * - Typography components for consistent styling
 */

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
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
import { H1, H2, H5, Body, MetricValue } from "@/components/Typography";

// Intent pathway cards configuration - ABFI Sovereign Theme
const INTENT_PATHWAYS = [
  {
    id: "grower",
    title: "Sell/Certify Feedstock",
    description: "Register your feedstock, get certified, and connect with verified buyers",
    icon: Leaf,
    color: "graphite",
    bgColor: "bg-muted",
    borderColor: "border-border",
    iconColor: "text-foreground",
    hoverBg: "hover:bg-muted/70",
    href: "/for-growers",
    features: ["Feedstock registration", "Certification tracking", "Contract management"],
  },
  {
    id: "developer",
    title: "Secure Supply",
    description: "Find verified feedstock suppliers and secure long-term supply agreements",
    icon: Factory,
    color: "graphite",
    bgColor: "bg-muted",
    borderColor: "border-border",
    iconColor: "text-foreground",
    hoverBg: "hover:bg-muted/70",
    href: "/for-developers",
    features: ["Registry explorer", "Supply confidence", "Price signals"],
  },
  {
    id: "finance",
    title: "Evaluate Risk & Price",
    description: "Access market intelligence, risk scoring, and stealth discovery tools",
    icon: TrendingUp,
    color: "graphite",
    bgColor: "bg-muted",
    borderColor: "border-border",
    iconColor: "text-foreground",
    hoverBg: "hover:bg-muted/70",
    href: "/for-lenders",
    features: ["Stealth Discovery", "Lending Sentiment", "Price Intelligence"],
  },
  {
    id: "explore",
    title: "Just Exploring",
    description: "Not sure where you fit? Take a quick assessment to find your path",
    icon: Compass,
    color: "graphite",
    bgColor: "bg-muted",
    borderColor: "border-border",
    iconColor: "text-foreground",
    hoverBg: "hover:bg-muted/70",
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
      {/* Hero Section - Sovereign Market Foundation */}
      <section className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-16 lg:py-20">
          <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <div className="space-y-6">
              <FadeInUp>
                <Badge variant="outline" className="border-border text-muted-foreground">
                  <Zap className="h-3 w-3 mr-1.5" />
                  Sovereign market infrastructure
                </Badge>
              </FadeInUp>

              <FadeInUp delay={0.1}>
                <H1 className="text-3xl sm:text-4xl lg:text-5xl leading-tight text-foreground">
                  Registry-grade clarity for commodity, credit, and compliance decisions.
                </H1>
              </FadeInUp>

              <FadeInUp delay={0.2}>
                <Body size="lg" className="text-base text-muted-foreground max-w-2xl">
                  Verified feedstock registry, real-time market intelligence, and cryptographic
                  audit trails. Finance-ready workflows designed for auditors, regulators, and
                  underwriting teams.
                </Body>
              </FadeInUp>

              <FadeInUp delay={0.3}>
                <div className="flex flex-wrap items-center gap-3">
                  <Button asChild>
                    <Link href="/explore">
                      Start market assessment
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href="/methodology">
                      View methodology
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Link>
                  </Button>
                </div>
              </FadeInUp>
            </div>

            <FadeInUp delay={0.2}>
              <div className="rounded border border-border bg-background px-6 py-5">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <Lock className="h-4 w-4" />
                    Immutable registry coverage and regulator-ready audit trails.
                  </div>
                  <div className="space-y-3 text-sm text-muted-foreground">
                    <div className="flex items-center justify-between">
                      <span>Registry coverage</span>
                      <span className="tabular-nums text-foreground">86%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Risk confidence</span>
                      <span className="tabular-nums text-foreground">0.87</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Compliance status</span>
                      <span className="text-foreground">Verified</span>
                    </div>
                  </div>
                </div>
              </div>
            </FadeInUp>
          </div>
        </div>
      </section>

      {/* Intent Selection */}
      <section className="py-12 bg-background">
        <div className="container mx-auto px-4">
          <StaggerContainer className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {INTENT_PATHWAYS.map((pathway, index) => (
              <StaggerItem key={pathway.id}>
                <Link href={pathway.href}>
                  <Card
                    className={cn(
                      "h-full cursor-pointer transition-all duration-300 border",
                      pathway.borderColor,
                      pathway.hoverBg,
                      hoveredPathway === pathway.id && "scale-[1.01]"
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
                          <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
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
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <FadeInUp className="text-center mb-12">
            <Badge variant="outline" className="mb-4 border-border text-muted-foreground">
              <BarChart3 className="h-3 w-3 mr-1.5" />
              Live Market Intelligence
            </Badge>
            <H2 className="text-3xl mb-4">
              Real-Time Market Signals
            </H2>
            <p className="text-muted-foreground max-w-xl mx-auto">
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
                      <MetricValue size="lg" className={cn(
                        teaser.direction === "up" && "text-foreground",
                        teaser.direction === "down" && "text-muted-foreground",
                        teaser.direction === "neutral" && "text-muted-foreground"
                      )}>
                        {teaser.change}
                      </MetricValue>
                      <Badge variant="outline" className="text-xs border-border text-muted-foreground">
                        {teaser.period}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      <Lock className="h-3 w-3 inline mr-1" />
                      Register for absolute values
                    </p>
                  </CardContent>
                </Card>
              </StaggerItem>
            ))}
          </StaggerContainer>

          <FadeInUp delay={0.3} className="text-center mt-8">
            <Button variant="outline" size="lg" asChild>
              <Link href="/browse">
                <TrendingUp className="h-4 w-4 mr-2" />
                Browse Verified Feedstocks
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </FadeInUp>
        </div>
      </section>

      {/* Trust Bar */}
      <section className="py-12 bg-card border-y border-border">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            {TRUST_STATS.map((stat, index) => (
              <FadeInUp key={index} delay={index * 0.1}>
                <div>
                  <MetricValue size="xl" className="text-foreground mb-2">
                    {stat.prefix}
                    <AnimatedCounter
                      value={stat.value}
                      decimals={stat.decimals || 0}
                      suffix={stat.suffix}
                    />
                  </MetricValue>
                  <Body size="sm" className="text-muted-foreground">{stat.label}</Body>
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
            <H2 className="text-3xl mb-4">
              Built for the Bioenergy Ecosystem
            </H2>
            <Body className="text-muted-foreground max-w-2xl mx-auto">
              Every feature designed with regulatory compliance, financial due diligence,
              and supply chain integrity in mind.
            </Body>
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
                    <div className="h-12 w-12 rounded border border-border bg-muted flex items-center justify-center mb-4">
                      <item.icon className="h-6 w-6 text-foreground" />
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

      {/* Final CTA */}
      <section className="py-16 bg-card border-t border-border">
        <div className="container mx-auto px-4 text-center">
          <FadeInUp>
            <H2 className="text-3xl md:text-4xl mb-6 text-foreground">
              Ready to Transform Your Supply Chain?
            </H2>
            <Body size="lg" className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join Australia's leading biofuels platform. Free access to all
              intelligence features during early access.
            </Body>
            <div className="flex flex-wrap justify-center gap-4">
              <Button size="lg" asChild>
                <Link href="/explore">
                  <Compass className="h-5 w-5 mr-2" />
                  Find Your Path
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/browse">
                  Explore Marketplace
                </Link>
              </Button>
            </div>
          </FadeInUp>
        </div>
      </section>

    </div>
  );
}
