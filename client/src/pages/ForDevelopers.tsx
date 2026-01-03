/**
 * For Developers Landing Page - Nextgen Design
 *
 * Features:
 * - ABFI bankability rating scale explanation
 * - Platform benefits and feature highlights
 * - Animated counters and hover cards
 * - CTA for developer registration
 * - Typography components for consistent styling
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
import { H1, H2, H3, Body, MetricValue, DataLabel } from "@/components/Typography";
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
  Building2,
  Target,
  Eye,
  AlertTriangle,
  LineChart,
  Search,
  FileText,
  ChevronRight,
  Layers,
  Activity,
  PieChart,
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

// Rating Scale Component
function RatingScale() {
  const ratings = [
    { rating: "AAA", label: "Prime", color: "bg-[#D4AF37]", risk: "Lowest" },
    { rating: "AA", label: "High", color: "bg-green-500", risk: "Very Low" },
    { rating: "A", label: "Upper Medium", color: "bg-lime-500", risk: "Low" },
    {
      rating: "BBB",
      label: "Lower Medium",
      color: "bg-yellow-500",
      risk: "Moderate",
    },
    {
      rating: "BB",
      label: "Speculative",
      color: "bg-[#D4AF37]",
      risk: "Substantial",
    },
    {
      rating: "B",
      label: "Highly Spec.",
      color: "bg-orange-500",
      risk: "High",
    },
    {
      rating: "CCC",
      label: "Distressed",
      color: "bg-red-500",
      risk: "Very High",
    },
  ];

  return (
    <div className="bg-white rounded-xl p-6 text-black">
      <DataLabel className="mb-4">
        ABFI Rating Scale
      </DataLabel>
      <div className="space-y-2">
        {ratings.map(r => (
          <div key={r.rating} className="flex items-center gap-3">
            <div className={cn("w-3 h-3 rounded-full", r.color)} />
            <span className="font-mono font-bold w-12">{r.rating}</span>
            <span className="text-gray-500 text-sm flex-1">{r.label}</span>
            <span className="text-xs text-black0">{r.risk} Risk</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ForDevelopers() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/">
            <div className="flex items-center gap-3 group cursor-pointer">
              <div className="p-2 rounded-xl bg-[#D4AF37]/10 group-hover:bg-[#D4AF37]/20 transition-colors">
                <Leaf className="h-6 w-6 text-[#D4AF37]" />
              </div>
              <span className="text-xl font-bold text-foreground font-display">
                ABFI
              </span>
            </div>
          </Link>
          <nav className="flex items-center gap-2">
            <Link href="/futures">
              <Button variant="ghost" size="sm">
                Marketplace
              </Button>
            </Link>
            <Link href="/bankability">
              <Button
                size="sm"
                className="bg-[#D4AF37] hover:bg-[#D4AF37] text-black"
              >
                Start Assessment
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-amber-900 via-yellow-800 to-amber-900 text-black">
        <div className="absolute inset-0 opacity-10">
          <svg
            className="w-full h-full"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            <pattern
              id="grid"
              patternUnits="userSpaceOnUse"
              width="10"
              height="10"
            >
              <path
                d="M 10 0 L 0 0 0 10"
                fill="none"
                stroke="currentColor"
                strokeWidth="0.5"
              />
            </pattern>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        <div className="container mx-auto px-4 py-20 lg:py-28 relative z-10">
          <div className="max-w-4xl">
            <FadeInUp>
              <Badge
                variant="outline"
                className="border-white/20 text-black/90 bg-white/5 mb-6"
              >
                <Building2 className="h-3 w-3 mr-1.5" />
                For Project Developers
              </Badge>
            </FadeInUp>

            <FadeInUp delay={0.1}>
              <H1 className="mb-6 leading-tight">
                De-Risk Your Project With
                <span className="block text-amber-300">
                  Bankable Supply Chains
                </span>
              </H1>
            </FadeInUp>

            <FadeInUp delay={0.2}>
              <Body className="text-xl text-amber-100 mb-8 max-w-2xl">
                Transform feedstock uncertainty into auditable, rated assets.
                Give your lenders the confidence they need to fund your
                bioenergy project.
              </Body>
            </FadeInUp>

            <FadeInUp delay={0.3} className="flex flex-wrap gap-4">
              <Link href="/bankability">
                <Button
                  size="lg"
                  className="bg-white text-amber-900 hover:bg-amber-50"
                >
                  <Award className="h-4 w-4 mr-2" />
                  Get Bankability Rating
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
              <Link href="/futures">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white/30 text-black hover:bg-white/10 bg-transparent"
                >
                  Browse Futures
                </Button>
              </Link>
            </FadeInUp>
          </div>
        </div>

        {/* Bottom wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 100" fill="none" className="w-full">
            <path
              d="M0 100V50C240 10 480 0 720 20C960 40 1200 80 1440 50V100H0Z"
              className="fill-background"
            />
          </svg>
        </div>
      </section>

      {/* The Problem */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
            <FadeInUp>
              <Badge
                variant="outline"
                className="mb-4 border-red-200 text-red-700"
              >
                <AlertTriangle className="h-3 w-3 mr-1.5" />
                The Problem
              </Badge>
              <H2 className="mb-6">
                Feedstock Risk Kills Bioenergy Deals
              </H2>
              <div className="space-y-4 text-gray-600">
                <Body>
                  Lenders see biomass supply as the #1 risk factor in bioenergy
                  project finance. Without standardized assessment, every due
                  diligence is manual, inconsistent, and expensive.
                </Body>
                <ul className="space-y-3">
                  {[
                    "Supply agreements evaluated subjectively",
                    "No consistent grower qualification standards",
                    "Covenant monitoring is manual and delayed",
                    "Historical data is scattered and unverified",
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-red-500 shrink-0 mt-1" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </FadeInUp>

            <FadeInUp delay={0.2}>
              <Card className="border-2 border-amber-200 bg-amber-50/50">
                <CardHeader>
                  <Badge className="w-fit bg-[#D4AF37] mb-2">
                    The ABFI Solution
                  </Badge>
                  <CardTitle>Standardized Bankability Framework</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-3">
                    {[
                      "AAA-CCC rating scale familiar to lenders",
                      "5-pillar assessment methodology",
                      "GQ1-GQ4 grower qualification tiers",
                      "Real-time covenant monitoring",
                      "Cryptographically secured evidence",
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-[#D4AF37] shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </FadeInUp>
          </div>
        </div>
      </section>

      {/* 5-Pillar Assessment */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <FadeInUp className="text-center mb-16">
            <Badge variant="outline" className="mb-4">
              5-Pillar Framework
            </Badge>
            <H2 className="mb-4">
              Comprehensive Supply Chain Assessment
            </H2>
            <Body className="text-lg text-gray-600 max-w-2xl mx-auto">
              Each pillar is scored independently and weighted to produce your
              overall bankability rating.
            </Body>
          </FadeInUp>

          <StaggerContainer className="grid md:grid-cols-2 lg:grid-cols-5 gap-6 max-w-6xl mx-auto">
            {[
              {
                pillar: "1",
                title: "Volume Security",
                description:
                  "Contracted vs projected volumes, replacement supply availability, geographic coverage",
                weight: "25%",
                icon: BarChart3,
              },
              {
                pillar: "2",
                title: "Counterparty Quality",
                description:
                  "GQ tier distribution, financial stability, track record, certification status",
                weight: "25%",
                icon: Users,
              },
              {
                pillar: "3",
                title: "Contract Structure",
                description:
                  "Term length, price mechanisms, termination clauses, force majeure provisions",
                weight: "20%",
                icon: FileText,
              },
              {
                pillar: "4",
                title: "Concentration Risk",
                description:
                  "Single supplier dependency, geographic concentration, crop type diversity",
                weight: "15%",
                icon: PieChart,
              },
              {
                pillar: "5",
                title: "Operational Readiness",
                description:
                  "Logistics infrastructure, quality testing capability, delivery track record",
                weight: "15%",
                icon: Activity,
              },
            ].map((item, i) => (
              <StaggerItem key={i}>
                <Card className="h-full text-center">
                  <CardHeader className="pb-2">
                    <div className="h-12 w-12 rounded-xl bg-[#D4AF37]/10 flex items-center justify-center mx-auto mb-3">
                      <item.icon className="h-6 w-6 text-[#D4AF37]" />
                    </div>
                    <Badge variant="outline" className="mx-auto mb-2">
                      {item.weight}
                    </Badge>
                    <CardTitle className="text-base">
                      <span className="text-[#D4AF37] font-mono mr-1">
                        {item.pillar}.
                      </span>
                      {item.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-gray-600">
                      {item.description}
                    </p>
                  </CardContent>
                </Card>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* Rating System */}
      <section className="py-20 bg-white text-black">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
            <FadeInUp>
              <Badge
                variant="outline"
                className="border-white/20 text-black/90 mb-4"
              >
                Institutional-Grade Ratings
              </Badge>
              <H2 className="mb-6">
                Ratings Lenders Understand
              </H2>
              <Body className="text-lg text-gray-600 mb-6">
                Our AAA-CCC scale mirrors credit ratings that financial
                institutions already use. No learning curve for your lending
                team.
              </Body>
              <ul className="space-y-4 mb-8">
                {[
                  "Investment grade threshold at BBB",
                  "Notch modifiers (+/-) for granularity",
                  "Historical rating trends tracked",
                  "Temporal versioning for audit trails",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-amber-400 shrink-0" />
                    <span className="text-gray-600">{item}</span>
                  </li>
                ))}
              </ul>
              <Link href="/bankability">
                <Button size="lg" className="bg-[#D4AF37] hover:bg-[#D4AF37]">
                  Start Your Assessment
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </FadeInUp>

            <FadeInUp delay={0.2}>
              <RatingScale />
            </FadeInUp>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <FadeInUp className="text-center mb-16">
            <H2 className="mb-4">
              Your Path to Bankability
            </H2>
            <Body className="text-lg text-gray-600 max-w-2xl mx-auto">
              From supply discovery to lender-ready compliance packages.
            </Body>
          </FadeInUp>

          <div className="max-w-4xl mx-auto">
            <StaggerContainer className="space-y-8">
              {[
                {
                  step: "01",
                  title: "Discover Verified Supply",
                  description:
                    "Browse the Futures Marketplace to find GQ-rated suppliers in your target regions. Filter by crop type, volume, timeline, and certification status.",
                  icon: Search,
                },
                {
                  step: "02",
                  title: "Submit Expressions of Interest",
                  description:
                    "Send EOIs to suppliers whose futures match your project needs. Negotiate terms directly through the platform with full transparency.",
                  icon: Target,
                },
                {
                  step: "03",
                  title: "Build Your Supply Portfolio",
                  description:
                    "Aggregate multiple suppliers into a diversified supply chain. The platform automatically calculates concentration risk and coverage ratios.",
                  icon: Layers,
                },
                {
                  step: "04",
                  title: "Generate Bankability Rating",
                  description:
                    "Run the 5-pillar assessment on your supply portfolio. Receive an AAA-CCC rating with detailed breakdown and improvement recommendations.",
                  icon: Award,
                },
                {
                  step: "05",
                  title: "Export Compliance Package",
                  description:
                    "Generate bank-ready documentation including certificates, evidence chains, and audit trails. All cryptographically signed and verifiable.",
                  icon: FileCheck,
                },
              ].map((item, i) => (
                <StaggerItem key={i}>
                  <div className="flex gap-6 items-start">
                    <div className="shrink-0">
                      <div className="h-16 w-16 rounded-2xl bg-[#D4AF37]/10 flex items-center justify-center">
                        <span className="text-2xl font-bold text-[#D4AF37] font-mono">
                          {item.step}
                        </span>
                      </div>
                    </div>
                    <div className="flex-1 pt-2">
                      <div className="flex items-center gap-3 mb-2">
                        <item.icon className="h-5 w-5 text-[#D4AF37]" />
                        <H3>{item.title}</H3>
                      </div>
                      <Body className="text-gray-600">
                        {item.description}
                      </Body>
                    </div>
                  </div>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>
        </div>
      </section>

      {/* Continuous Monitoring */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <FadeInUp className="text-center mb-16">
            <Badge variant="outline" className="mb-4">
              Ongoing Compliance
            </Badge>
            <H2 className="mb-4">
              Continuous Covenant Monitoring
            </H2>
            <Body className="text-lg text-gray-600 max-w-2xl mx-auto">
              Your bankability rating isn't just a point-in-time snapshot. We
              monitor continuously and alert you to changes before they become
              problems.
            </Body>
          </FadeInUp>

          <StaggerContainer className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              {
                icon: Clock,
                title: "Daily Covenant Checks",
                description:
                  "Automated systems verify contract status, expiration dates, and compliance triggers every day.",
              },
              {
                icon: AlertTriangle,
                title: "Breach Alerts",
                description:
                  "Instant notifications when covenant thresholds are approached or breached. No surprises.",
              },
              {
                icon: Eye,
                title: "Rating Watch",
                description:
                  "Track rating trajectory over time. Get early warning when factors trend toward downgrade.",
              },
            ].map((item, i) => (
              <StaggerItem key={i}>
                <Card className="h-full">
                  <CardHeader>
                    <div className="h-12 w-12 rounded-xl bg-[#D4AF37]/10 flex items-center justify-center mb-4">
                      <item.icon className="h-6 w-6 text-[#D4AF37]" />
                    </div>
                    <CardTitle className="text-lg">{item.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600">
                      {item.description}
                    </p>
                  </CardContent>
                </Card>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-[#D4AF37] text-black">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <MetricValue className="font-mono mb-2">
                <AnimatedCounter value={45} suffix="+" />
              </MetricValue>
              <DataLabel className="text-amber-100">Projects Assessed</DataLabel>
            </div>
            <div>
              <MetricValue className="font-mono mb-2">
                $<AnimatedCounter value={2.5} decimals={1} />B
              </MetricValue>
              <DataLabel className="text-amber-100">Financed Volume</DataLabel>
            </div>
            <div>
              <MetricValue className="font-mono mb-2">
                <AnimatedCounter value={92} suffix="%" />
              </MetricValue>
              <DataLabel className="text-amber-100">Lender Acceptance</DataLabel>
            </div>
            <div>
              <MetricValue className="font-mono mb-2">
                <AnimatedCounter value={30} suffix="%" />
              </MetricValue>
              <DataLabel className="text-amber-100">Faster Due Diligence</DataLabel>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <FadeInUp className="max-w-3xl mx-auto text-center">
            <H2 className="mb-6">
              Ready to Rate Your Supply Chain?
            </H2>
            <Body className="text-lg text-gray-600 mb-8">
              Start your bankability assessment today. Give your lenders the
              confidence they need.
            </Body>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/bankability">
                <Button
                  size="xl"
                  className="bg-[#D4AF37] hover:bg-[#D4AF37] text-black"
                >
                  <Award className="h-5 w-5 mr-2" />
                  Start Assessment
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
              </Link>
              <Link href="/futures">
                <Button size="xl" variant="outline">
                  Browse Marketplace
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
                <Leaf className="h-5 w-5 text-[#D4AF37]" />
                <span className="font-bold font-display">ABFI</span>
              </div>
            </Link>
            <div className="flex gap-6 text-sm text-gray-600">
              <Link
                href="/for-growers"
                className="hover:text-foreground transition-colors"
              >
                For Growers
              </Link>
              <Link
                href="/for-lenders"
                className="hover:text-foreground transition-colors"
              >
                For Lenders
              </Link>
              <Link
                href="/platform-features"
                className="hover:text-foreground transition-colors"
              >
                Platform Features
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
