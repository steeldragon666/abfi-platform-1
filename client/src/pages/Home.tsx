import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getLoginUrl } from "@/const";
import {
  ArrowRight,
  Award,
  BarChart3,
  Leaf,
  Shield,
  TrendingUp,
  MapPin,
  FileCheck,
  Zap,
  Users,
  Building2,
  Banknote,
  CheckCircle,
  Lock,
  Database,
  Clock,
  Eye,
  FileText,
  AlertTriangle,
  Target,
  Layers,
  GitBranch,
  Activity,
  CheckCircle2,
  ChevronRight,
  Globe,
  Sprout,
  TreeDeciduous,
  Menu,
  X,
} from "lucide-react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";
import {
  FadeInUp,
  StaggerContainer,
  StaggerItem,
  HoverCard,
  AnimatedCounter,
  Floating,
  Pulse,
  FadeIn,
  ScaleIn,
  motion,
} from "@/components/ui/motion";
import { useState } from "react";

// Animated background pattern component
function GridPattern({ className }: { className?: string }) {
  return (
    <svg
      className={cn("absolute inset-0 h-full w-full", className)}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <pattern
          id="grid-pattern"
          width="32"
          height="32"
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M0 32V0h32"
            fill="none"
            stroke="currentColor"
            strokeOpacity="0.03"
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid-pattern)" />
    </svg>
  );
}

// Animated circuit pattern for cryptographic theme
function CircuitPattern({ className }: { className?: string }) {
  return (
    <div className={cn("absolute inset-0 overflow-hidden opacity-[0.02]", className)}>
      <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        <pattern id="circuit" patternUnits="userSpaceOnUse" width="20" height="20">
          <circle cx="10" cy="10" r="1" fill="currentColor" />
          <path d="M10 0 L10 8 M10 12 L10 20 M0 10 L8 10 M12 10 L20 10" stroke="currentColor" strokeWidth="0.5" fill="none" />
        </pattern>
        <rect width="100%" height="100%" fill="url(#circuit)" />
      </svg>
    </div>
  );
}

// Bankability rating badge component
function RatingBadge({ rating, label }: { rating: string; label: string }) {
  const colors: Record<string, string> = {
    AAA: "bg-emerald-500",
    AA: "bg-green-500",
    A: "bg-lime-500",
    BBB: "bg-yellow-500",
    BB: "bg-amber-500",
    B: "bg-orange-500",
  };

  return (
    <div className="flex items-center gap-2">
      <div className={cn("w-3 h-3 rounded-full", colors[rating] || "bg-gray-400")} />
      <span className="font-mono text-sm font-semibold">{rating}</span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
              <div className="flex flex-col">
                <span className="text-xl font-bold text-foreground font-display">ABFI</span>
                <span className="text-[10px] text-muted-foreground -mt-1 hidden sm:block">Bank-Grade Infrastructure</span>
              </div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            <Link href="/futures">
              <Button variant="ghost" size="sm">Marketplace</Button>
            </Link>
            <Link href="/bankability">
              <Button variant="ghost" size="sm">Bankability</Button>
            </Link>
            <Link href="/feedstock-map">
              <Button variant="ghost" size="sm">Map</Button>
            </Link>
            <div className="w-px h-6 bg-border mx-2" />
            {isAuthenticated ? (
              <Link href="/dashboard">
                <Button size="sm" rightIcon={<ArrowRight className="h-4 w-4" />}>Dashboard</Button>
              </Link>
            ) : (
              <a href={getLoginUrl()}>
                <Button size="sm" rightIcon={<ArrowRight className="h-4 w-4" />}>Sign In</Button>
              </a>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t bg-background"
          >
            <nav className="container mx-auto px-4 py-4 flex flex-col gap-2">
              <Link href="/futures">
                <Button variant="ghost" className="w-full justify-start">Marketplace</Button>
              </Link>
              <Link href="/bankability">
                <Button variant="ghost" className="w-full justify-start">Bankability</Button>
              </Link>
              <Link href="/feedstock-map">
                <Button variant="ghost" className="w-full justify-start">Map</Button>
              </Link>
              {isAuthenticated ? (
                <Link href="/dashboard">
                  <Button className="w-full mt-2">Dashboard</Button>
                </Link>
              ) : (
                <a href={getLoginUrl()}>
                  <Button className="w-full mt-2">Sign In</Button>
                </a>
              )}
            </nav>
          </motion.div>
        )}
      </header>

      {/* Hero Section - Enhanced */}
      <section className="relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />
        <GridPattern className="text-white" />
        <CircuitPattern />

        {/* Animated Gradient Orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            animate={{
              x: [0, 100, 0],
              y: [0, -50, 0],
              scale: [1, 1.2, 1],
            }}
            transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-1/4 -right-1/4 w-[800px] h-[800px] rounded-full bg-primary/20 blur-[120px]"
          />
          <motion.div
            animate={{
              x: [0, -80, 0],
              y: [0, 60, 0],
              scale: [1.2, 1, 1.2],
            }}
            transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -bottom-1/4 -left-1/4 w-[600px] h-[600px] rounded-full bg-emerald-500/15 blur-[100px]"
          />
        </div>

        <div className="container mx-auto px-4 relative z-10 py-20 lg:py-32">
          <div className="max-w-5xl mx-auto">
            {/* Trust Badges */}
            <FadeInUp className="flex flex-wrap justify-center gap-3 mb-8">
              <Badge variant="outline" className="border-white/20 text-white/90 bg-white/5 backdrop-blur-sm px-3 py-1.5">
                <Lock className="h-3 w-3 mr-1.5" />
                SHA-256 Secured
              </Badge>
              <Badge variant="outline" className="border-white/20 text-white/90 bg-white/5 backdrop-blur-sm px-3 py-1.5">
                <Database className="h-3 w-3 mr-1.5" />
                Temporal Versioning
              </Badge>
              <Badge variant="outline" className="border-white/20 text-white/90 bg-white/5 backdrop-blur-sm px-3 py-1.5">
                <Shield className="h-3 w-3 mr-1.5" />
                Bank-Grade Compliance
              </Badge>
            </FadeInUp>

            {/* Main Headline */}
            <FadeInUp delay={0.1} className="text-center mb-8">
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-display font-bold mb-6 leading-[1.1] text-white">
                Bank-Grade Infrastructure
                <br />
                <span className="bg-gradient-to-r from-emerald-400 via-green-400 to-teal-400 bg-clip-text text-transparent">
                  for Bioenergy Finance
                </span>
              </h1>
              <p className="text-lg md:text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
                The only platform that transforms biomass supply agreements into auditable,
                cryptographically-secured assets that lenders can trust.
              </p>
            </FadeInUp>

            {/* CTA Buttons */}
            <FadeInUp delay={0.2} className="flex flex-wrap justify-center gap-4 mb-16">
              <Link href="/producer-registration">
                <Button size="lg" className="bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/25">
                  <Sprout className="h-4 w-4 mr-2" />
                  I'm a Grower
                </Button>
              </Link>
              <Link href="/bankability">
                <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10">
                  <Building2 className="h-4 w-4 mr-2" />
                  I'm a Developer
                </Button>
              </Link>
              <Link href="/lender-portal">
                <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10">
                  <Banknote className="h-4 w-4 mr-2" />
                  I'm a Lender
                </Button>
              </Link>
            </FadeInUp>

            {/* Live Stats Bar */}
            <FadeInUp delay={0.3}>
              <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 max-w-4xl mx-auto">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
                  <div className="text-center">
                    <div className="text-3xl md:text-4xl font-bold text-white font-mono">
                      <AnimatedCounter value={2.5} prefix="$" suffix="B" decimals={1} />
                    </div>
                    <div className="text-sm text-slate-400 mt-1">Financed Volume</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl md:text-4xl font-bold text-white font-mono">
                      <AnimatedCounter value={847} suffix="k" />
                    </div>
                    <div className="text-sm text-slate-400 mt-1">Tonnes Tracked</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl md:text-4xl font-bold text-white font-mono">
                      <AnimatedCounter value={99.9} suffix="%" decimals={1} />
                    </div>
                    <div className="text-sm text-slate-400 mt-1">Uptime SLA</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl md:text-4xl font-bold text-emerald-400 font-mono">
                      AAA
                    </div>
                    <div className="text-sm text-slate-400 mt-1">Top Rating</div>
                  </div>
                </div>
              </div>
            </FadeInUp>
          </div>
        </div>

        {/* Bottom wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path
              d="M0 100V50C240 10 480 0 720 20C960 40 1200 80 1440 50V100H0Z"
              className="fill-background"
            />
          </svg>
        </div>
      </section>

      {/* Trust Bar */}
      <section className="py-8 bg-muted/30 border-y">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16 text-muted-foreground">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              <span className="text-sm font-medium">SOC 2 Type II</span>
            </div>
            <div className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              <span className="text-sm font-medium">256-bit Encryption</span>
            </div>
            <div className="flex items-center gap-2">
              <FileCheck className="h-5 w-5" />
              <span className="text-sm font-medium">ISO 27001</span>
            </div>
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              <span className="text-sm font-medium">APRA Compliant</span>
            </div>
          </div>
        </div>
      </section>

      {/* Three Pathways Section */}
      <section className="py-20 lg:py-28 bg-background relative">
        <div className="container mx-auto px-4">
          <FadeInUp className="text-center mb-16">
            <Badge variant="outline" className="mb-4">Three Pathways to Success</Badge>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-foreground mb-4">
              Built for Every Stakeholder
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Whether you grow biomass, develop projects, or finance them — ABFI provides the
              infrastructure to make deals happen with confidence.
            </p>
          </FadeInUp>

          <StaggerContainer className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Growers Card */}
            <StaggerItem>
              <HoverCard className="h-full">
                <Card className="h-full border-2 border-transparent hover:border-emerald-500/30 transition-colors overflow-hidden group">
                  <div className="h-2 bg-gradient-to-r from-emerald-500 to-green-500" />
                  <CardHeader className="pb-4">
                    <div className="h-14 w-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-4 group-hover:bg-emerald-500/20 transition-colors">
                      <TreeDeciduous className="h-7 w-7 text-emerald-600" />
                    </div>
                    <CardTitle className="text-2xl">Growers & Producers</CardTitle>
                    <CardDescription className="text-base">
                      Transform your agricultural assets into bankable commodities with verified credentials.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <ul className="space-y-3">
                      {[
                        "Pre-qualify for GQ1-GQ4 grower status",
                        "List futures up to 25 years forward",
                        "Receive EOIs from verified buyers",
                        "Track all contracts in one place",
                      ].map((item, i) => (
                        <li key={i} className="flex items-start gap-3 text-sm">
                          <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                          <span className="text-muted-foreground">{item}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="pt-4 border-t">
                      <Link href="/for-growers">
                        <Button className="w-full bg-emerald-500 hover:bg-emerald-600" rightIcon={<ArrowRight className="h-4 w-4" />}>
                          Start Growing Value
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </HoverCard>
            </StaggerItem>

            {/* Developers Card */}
            <StaggerItem>
              <HoverCard className="h-full">
                <Card className="h-full border-2 border-transparent hover:border-amber-500/30 transition-colors overflow-hidden group">
                  <div className="h-2 bg-gradient-to-r from-amber-500 to-yellow-500" />
                  <CardHeader className="pb-4">
                    <div className="h-14 w-14 rounded-2xl bg-amber-500/10 flex items-center justify-center mb-4 group-hover:bg-amber-500/20 transition-colors">
                      <Building2 className="h-7 w-7 text-amber-600" />
                    </div>
                    <CardTitle className="text-2xl">Project Developers</CardTitle>
                    <CardDescription className="text-base">
                      De-risk your bioenergy project with institutional-grade supply chain assessment.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <ul className="space-y-3">
                      {[
                        "Access verified supplier network",
                        "Get AAA-CCC bankability ratings",
                        "Generate compliance certificates",
                        "Continuous covenant monitoring",
                      ].map((item, i) => (
                        <li key={i} className="flex items-start gap-3 text-sm">
                          <CheckCircle2 className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                          <span className="text-muted-foreground">{item}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="pt-4 border-t">
                      <Link href="/for-developers">
                        <Button className="w-full bg-amber-500 hover:bg-amber-600 text-white" rightIcon={<ArrowRight className="h-4 w-4" />}>
                          Assess Your Project
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </HoverCard>
            </StaggerItem>

            {/* Lenders Card */}
            <StaggerItem>
              <HoverCard className="h-full">
                <Card className="h-full border-2 border-transparent hover:border-blue-500/30 transition-colors overflow-hidden group">
                  <div className="h-2 bg-gradient-to-r from-blue-500 to-indigo-500" />
                  <CardHeader className="pb-4">
                    <div className="h-14 w-14 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-4 group-hover:bg-blue-500/20 transition-colors">
                      <Banknote className="h-7 w-7 text-blue-600" />
                    </div>
                    <CardTitle className="text-2xl">Lenders & Financiers</CardTitle>
                    <CardDescription className="text-base">
                      Monitor covenants in real-time with cryptographic proof of supply chain integrity.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <ul className="space-y-3">
                      {[
                        "Real-time covenant compliance",
                        "Automated breach alerts",
                        "Independent verification",
                        "Historical audit trails",
                      ].map((item, i) => (
                        <li key={i} className="flex items-start gap-3 text-sm">
                          <CheckCircle2 className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                          <span className="text-muted-foreground">{item}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="pt-4 border-t">
                      <Link href="/for-lenders">
                        <Button className="w-full bg-blue-500 hover:bg-blue-600" rightIcon={<ArrowRight className="h-4 w-4" />}>
                          Access Lender Portal
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </HoverCard>
            </StaggerItem>
          </StaggerContainer>
        </div>
      </section>

      {/* Technical Differentiation */}
      <section className="py-20 lg:py-28 bg-slate-900 text-white relative overflow-hidden">
        <GridPattern className="text-white" />
        <div className="container mx-auto px-4 relative z-10">
          <FadeInUp className="text-center mb-16">
            <Badge variant="outline" className="border-white/20 text-white/90 mb-4">Why ABFI is Different</Badge>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold mb-4">
              Infrastructure, Not Just Software
            </h2>
            <p className="text-lg text-slate-300 max-w-2xl mx-auto">
              Every data point is cryptographically secured, temporally versioned, and
              audit-ready from day one.
            </p>
          </FadeInUp>

          <StaggerContainer className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {[
              {
                icon: Lock,
                title: "SHA-256 Evidence Chain",
                description: "Every document, assessment, and update is hashed and chained. Tampering is mathematically impossible.",
              },
              {
                icon: Clock,
                title: "Temporal Versioning",
                description: "Query any rating, covenant status, or supply position as it existed on any historical date.",
              },
              {
                icon: Activity,
                title: "Real-Time Monitoring",
                description: "Covenant checks run automatically. Breaches trigger instant alerts to all stakeholders.",
              },
              {
                icon: Award,
                title: "5-Pillar Assessment",
                description: "Volume security, counterparty quality, contract structure, concentration risk, operational readiness.",
              },
              {
                icon: Layers,
                title: "GQ1-GQ4 Qualification",
                description: "Standardized grower tiers let you compare suppliers on consistent, auditable criteria.",
              },
              {
                icon: FileText,
                title: "Compliance Certificates",
                description: "Generate bank-ready compliance packages with embedded cryptographic signatures.",
              },
            ].map((item, i) => (
              <StaggerItem key={i}>
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-colors">
                  <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center mb-4">
                    <item.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                  <p className="text-sm text-slate-400">{item.description}</p>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* Bankability Rating Section */}
      <section className="py-20 lg:py-28 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
            <FadeInUp>
              <Badge variant="outline" className="mb-4">The ABFI Rating System</Badge>
              <h2 className="text-3xl md:text-4xl font-display font-bold mb-6">
                From Subjective to Systematic
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Traditional biomass supply assessment relies on spreadsheets and gut feel.
                ABFI provides the industry's first standardized, auditable bankability framework.
              </p>

              <div className="space-y-4 mb-8">
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <RatingBadge rating="AAA" label="Prime Investment Grade" />
                  <span className="text-sm text-muted-foreground">Lowest Risk</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <RatingBadge rating="AA" label="High Investment Grade" />
                  <span className="text-sm text-muted-foreground">Very Low Risk</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <RatingBadge rating="A" label="Investment Grade" />
                  <span className="text-sm text-muted-foreground">Low Risk</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <RatingBadge rating="BBB" label="Lower Investment Grade" />
                  <span className="text-sm text-muted-foreground">Moderate Risk</span>
                </div>
              </div>

              <Link href="/bankability">
                <Button size="lg" rightIcon={<ArrowRight className="h-4 w-4" />}>
                  Learn About Ratings
                </Button>
              </Link>
            </FadeInUp>

            <FadeInUp delay={0.2}>
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-8 text-white">
                <h3 className="text-xl font-semibold mb-6">5-Pillar Assessment Framework</h3>
                <div className="space-y-4">
                  {[
                    { name: "Volume Security", score: 92, color: "bg-emerald-500" },
                    { name: "Counterparty Quality", score: 88, color: "bg-green-500" },
                    { name: "Contract Structure", score: 95, color: "bg-emerald-500" },
                    { name: "Concentration Risk", score: 78, color: "bg-yellow-500" },
                    { name: "Operational Readiness", score: 85, color: "bg-green-500" },
                  ].map((pillar, i) => (
                    <div key={i}>
                      <div className="flex justify-between text-sm mb-1">
                        <span>{pillar.name}</span>
                        <span className="font-mono">{pillar.score}%</span>
                      </div>
                      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          whileInView={{ width: `${pillar.score}%` }}
                          transition={{ duration: 1, delay: i * 0.1 }}
                          className={cn("h-full rounded-full", pillar.color)}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-between">
                  <span className="text-slate-400">Overall Rating</span>
                  <div className="flex items-center gap-3">
                    <span className="text-4xl font-bold font-mono text-emerald-400">AA+</span>
                  </div>
                </div>
              </div>
            </FadeInUp>
          </div>
        </div>
      </section>

      {/* Platform Capabilities */}
      <section className="py-20 lg:py-28 bg-muted/30">
        <div className="container mx-auto px-4">
          <FadeInUp className="text-center mb-16">
            <Badge variant="outline" className="mb-4">Platform Capabilities</Badge>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold mb-4">
              Everything You Need, Built In
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              A complete ecosystem for biomass supply chain management, from discovery to compliance.
            </p>
          </FadeInUp>

          <StaggerContainer className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {[
              { icon: Globe, title: "Futures Marketplace", desc: "Browse and list long-term supply contracts" },
              { icon: MapPin, title: "Interactive Maps", desc: "Visualize supply chains geospatially" },
              { icon: Target, title: "Demand Signals", desc: "Match supply with buyer requirements" },
              { icon: Award, title: "Bankability Scores", desc: "Standardized project assessment" },
              { icon: Eye, title: "Covenant Monitoring", desc: "Real-time compliance tracking" },
              { icon: AlertTriangle, title: "Breach Alerts", desc: "Automated stakeholder notifications" },
              { icon: FileCheck, title: "Certificate Generation", desc: "Bank-ready compliance packages" },
              { icon: Database, title: "Evidence Management", desc: "Cryptographically secured documents" },
            ].map((item, i) => (
              <StaggerItem key={i}>
                <Card className="h-full hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                      <item.icon className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle className="text-base">{item.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </CardContent>
                </Card>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <FadeInUp className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
              Trusted by Industry Leaders
            </h2>
          </FadeInUp>

          <StaggerContainer className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                quote: "ABFI's bankability framework gave our lenders the confidence to proceed with $120M in project finance.",
                author: "Project Director",
                company: "Major Bioenergy Developer",
              },
              {
                quote: "The real-time covenant monitoring has transformed how we manage feedstock risk in our portfolio.",
                author: "Head of Structured Finance",
                company: "Infrastructure Bank",
              },
              {
                quote: "Finally, a platform that treats agricultural supply with the same rigor as financial instruments.",
                author: "CEO",
                company: "Agricultural Cooperative",
              },
            ].map((testimonial, i) => (
              <StaggerItem key={i}>
                <Card className="h-full">
                  <CardContent className="pt-6">
                    <p className="text-muted-foreground mb-6 italic">"{testimonial.quote}"</p>
                    <div>
                      <p className="font-semibold">{testimonial.author}</p>
                      <p className="text-sm text-muted-foreground">{testimonial.company}</p>
                    </div>
                  </CardContent>
                </Card>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 lg:py-28 bg-gradient-to-br from-primary via-primary to-primary/90 text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <GridPattern />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <FadeInUp className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold mb-6">
              Ready to Build Bankable Biomass?
            </h2>
            <p className="text-xl opacity-90 mb-10">
              Join the platform that's setting the standard for bioenergy supply chain infrastructure.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/producer-registration">
                <Button size="xl" variant="secondary" rightIcon={<ArrowRight className="h-5 w-5" />}>
                  Get Started Free
                </Button>
              </Link>
              <Link href="/platform-features">
                <Button size="xl" variant="outline" className="border-white/30 text-white hover:bg-white/10">
                  Explore Features
                </Button>
              </Link>
            </div>
          </FadeInUp>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-slate-900 text-slate-300 py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-10">
            {/* Brand */}
            <div className="lg:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-1.5 rounded-lg bg-primary/20">
                  <Leaf className="h-5 w-5 text-primary" />
                </div>
                <span className="text-lg font-bold font-display text-white">ABFI</span>
              </div>
              <p className="text-sm leading-relaxed mb-6 max-w-sm">
                Australian Bioenergy Feedstock Institute — Bank-grade infrastructure
                for biomass supply chain management and project finance.
              </p>
              <div className="flex gap-3">
                <Badge variant="outline" className="border-slate-700 text-slate-400 text-xs">
                  <Lock className="h-3 w-3 mr-1" />
                  SOC 2
                </Badge>
                <Badge variant="outline" className="border-slate-700 text-slate-400 text-xs">
                  <Shield className="h-3 w-3 mr-1" />
                  ISO 27001
                </Badge>
              </div>
            </div>

            {/* For Growers */}
            <div>
              <h3 className="font-semibold mb-4 text-white">For Growers</h3>
              <ul className="space-y-3 text-sm">
                <li><Link href="/producer-registration" className="hover:text-white transition-colors">Register Supply</Link></li>
                <li><Link href="/supplier/futures" className="hover:text-white transition-colors">List Futures</Link></li>
                <li><Link href="/for-growers" className="hover:text-white transition-colors">Grower Benefits</Link></li>
                <li><Link href="/grower-qualification" className="hover:text-white transition-colors">GQ Tiers</Link></li>
              </ul>
            </div>

            {/* For Developers */}
            <div>
              <h3 className="font-semibold mb-4 text-white">For Developers</h3>
              <ul className="space-y-3 text-sm">
                <li><Link href="/futures" className="hover:text-white transition-colors">Marketplace</Link></li>
                <li><Link href="/bankability" className="hover:text-white transition-colors">Bankability</Link></li>
                <li><Link href="/for-developers" className="hover:text-white transition-colors">How It Works</Link></li>
                <li><Link href="/feedstock-map" className="hover:text-white transition-colors">Supply Map</Link></li>
              </ul>
            </div>

            {/* For Lenders */}
            <div>
              <h3 className="font-semibold mb-4 text-white">For Lenders</h3>
              <ul className="space-y-3 text-sm">
                <li><Link href="/lender-portal" className="hover:text-white transition-colors">Lender Portal</Link></li>
                <li><Link href="/compliance-dashboard" className="hover:text-white transition-colors">Compliance</Link></li>
                <li><Link href="/for-lenders" className="hover:text-white transition-colors">Risk Framework</Link></li>
                <li><Link href="/platform-features" className="hover:text-white transition-colors">Platform Features</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-slate-500">
              © {new Date().getFullYear()} Australian Bioenergy Feedstock Institute. All rights reserved.
            </p>
            <div className="flex gap-6 text-sm text-slate-500">
              <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
              <Link href="/security" className="hover:text-white transition-colors">Security</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
