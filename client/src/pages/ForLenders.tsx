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
  Banknote,
  Target,
  Eye,
  AlertTriangle,
  LineChart,
  Search,
  FileText,
  Lock,
  Database,
  Activity,
  Bell,
  History,
  GitBranch,
  Fingerprint,
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

// Evidence Chain Visual
function EvidenceChainDemo() {
  const blocks = [
    { hash: "a3f8...", type: "Assessment", time: "2024-01-15" },
    { hash: "7b2c...", type: "Contract", time: "2024-02-01" },
    { hash: "9e4d...", type: "Delivery", time: "2024-03-15" },
    { hash: "1f6a...", type: "Quality Test", time: "2024-03-20" },
  ];

  return (
    <div className="bg-slate-800 rounded-xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <Lock className="h-4 w-4 text-blue-400" />
        <span className="text-sm font-medium text-slate-300">SHA-256 Evidence Chain</span>
      </div>
      <div className="space-y-3">
        {blocks.map((block, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-blue-400" />
            <div className="flex-1 bg-slate-700/50 rounded-lg p-3 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400">{block.type}</span>
                <div className="font-mono text-sm text-white">{block.hash}</div>
              </div>
              <span className="text-xs text-slate-500">{block.time}</span>
            </div>
            {i < blocks.length - 1 && (
              <div className="absolute left-[11px] mt-8 w-0.5 h-6 bg-blue-400/30" />
            )}
          </div>
        ))}
      </div>
      <div className="mt-4 pt-4 border-t border-slate-700 flex items-center justify-between">
        <span className="text-xs text-slate-500">Chain integrity verified</span>
        <Badge className="bg-green-500/20 text-green-400 border-0">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Valid
        </Badge>
      </div>
    </div>
  );
}

export default function ForLenders() {
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
            <Link href="/compliance-dashboard">
              <Button variant="ghost" size="sm">Compliance</Button>
            </Link>
            <Link href="/lender-portal">
              <Button size="sm" className="bg-blue-500 hover:bg-blue-600">
                Lender Portal
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-900 via-indigo-800 to-blue-900 text-white">
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <pattern id="circuit" patternUnits="userSpaceOnUse" width="20" height="20">
              <circle cx="10" cy="10" r="1" fill="currentColor" />
              <path d="M10 0 L10 8 M10 12 L10 20 M0 10 L8 10 M12 10 L20 10" stroke="currentColor" strokeWidth="0.5" fill="none" />
            </pattern>
            <rect width="100%" height="100%" fill="url(#circuit)" />
          </svg>
        </div>

        <div className="container mx-auto px-4 py-20 lg:py-28 relative z-10">
          <div className="max-w-4xl">
            <FadeInUp>
              <Badge variant="outline" className="border-white/20 text-white/90 bg-white/5 mb-6">
                <Banknote className="h-3 w-3 mr-1.5" />
                For Lenders & Financiers
              </Badge>
            </FadeInUp>

            <FadeInUp delay={0.1}>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold mb-6 leading-tight">
                Trust, But Verify —
                <span className="block text-blue-300">Cryptographically</span>
              </h1>
            </FadeInUp>

            <FadeInUp delay={0.2}>
              <p className="text-xl text-blue-100 mb-8 max-w-2xl">
                Real-time covenant monitoring, immutable audit trails, and standardized
                bankability ratings. The infrastructure you need to confidently finance bioenergy.
              </p>
            </FadeInUp>

            <FadeInUp delay={0.3} className="flex flex-wrap gap-4">
              <Link href="/lender-portal">
                <Button size="lg" className="bg-white text-blue-900 hover:bg-blue-50">
                  <Shield className="h-4 w-4 mr-2" />
                  Access Lender Portal
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
              <Link href="/compliance-dashboard">
                <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 bg-transparent">
                  View Compliance Dashboard
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

      {/* Trust Infrastructure */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <FadeInUp className="text-center mb-16">
            <Badge variant="outline" className="mb-4">Bank-Grade Infrastructure</Badge>
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
              Built for Financial Due Diligence
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Every feature designed with lending compliance requirements in mind.
            </p>
          </FadeInUp>

          <StaggerContainer className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {[
              {
                icon: Fingerprint,
                title: "SHA-256 Evidence Chain",
                description: "Every document, assessment, and update is cryptographically hashed and chained. Tampering is mathematically impossible.",
              },
              {
                icon: History,
                title: "Temporal Versioning",
                description: "Query any data point as it existed on any historical date. Perfect for 'as-of-date' covenant testing.",
              },
              {
                icon: Activity,
                title: "Real-Time Monitoring",
                description: "Covenant checks run daily. Breaches trigger instant alerts. No more quarterly surprises.",
              },
              {
                icon: Award,
                title: "Standardized Ratings",
                description: "AAA-CCC scale mirrors credit ratings you already use. No learning curve for your team.",
              },
              {
                icon: FileCheck,
                title: "Compliance Certificates",
                description: "Generate auditor-ready packages with embedded cryptographic signatures. Verify authenticity instantly.",
              },
              {
                icon: Shield,
                title: "SOC 2 Type II",
                description: "Enterprise security controls. Data residency in Australia. Full audit logging.",
              },
            ].map((item, i) => (
              <StaggerItem key={i}>
                <Card className="h-full hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center mb-4">
                      <item.icon className="h-6 w-6 text-blue-600" />
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

      {/* Evidence Chain Demo */}
      <section className="py-20 bg-slate-900 text-white">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
            <FadeInUp>
              <Badge variant="outline" className="border-white/20 text-white/90 mb-4">
                Cryptographic Security
              </Badge>
              <h2 className="text-3xl md:text-4xl font-display font-bold mb-6">
                Immutable Audit Trails
              </h2>
              <p className="text-lg text-slate-300 mb-6">
                Every action on the platform creates a cryptographically-signed record.
                The evidence chain is mathematically tamper-proof and independently verifiable.
              </p>
              <ul className="space-y-4 mb-8">
                {[
                  "Each record hashed with SHA-256",
                  "Hashes chain to previous records",
                  "Any modification breaks the chain",
                  "Third-party verification available",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-blue-400 shrink-0" />
                    <span className="text-slate-300">{item}</span>
                  </li>
                ))}
              </ul>
              <div className="flex gap-3">
                <Badge variant="outline" className="border-slate-600 text-slate-400">
                  <Lock className="h-3 w-3 mr-1" />
                  256-bit Encryption
                </Badge>
                <Badge variant="outline" className="border-slate-600 text-slate-400">
                  <Database className="h-3 w-3 mr-1" />
                  AU Data Residency
                </Badge>
              </div>
            </FadeInUp>

            <FadeInUp delay={0.2}>
              <EvidenceChainDemo />
            </FadeInUp>
          </div>
        </div>
      </section>

      {/* Covenant Monitoring */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <FadeInUp className="text-center mb-16">
            <Badge variant="outline" className="mb-4">Automated Compliance</Badge>
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
              Covenant Monitoring That Never Sleeps
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Automated systems check covenant compliance continuously. Get alerts before
              problems escalate.
            </p>
          </FadeInUp>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <FadeInUp>
              <Card className="h-full border-2 border-blue-200">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                      <Clock className="h-5 w-5 text-blue-600" />
                    </div>
                    <CardTitle>Daily Checks</CardTitle>
                  </div>
                  <CardDescription>
                    Automated covenant verification runs every day
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 text-sm">
                    {[
                      "Contract expiration monitoring",
                      "Minimum volume thresholds",
                      "Supplier qualification status",
                      "Certification validity dates",
                      "Price escalation triggers",
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-muted-foreground">
                        <CheckCircle2 className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </FadeInUp>

            <FadeInUp delay={0.1}>
              <Card className="h-full border-2 border-red-200">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="h-10 w-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                      <Bell className="h-5 w-5 text-red-600" />
                    </div>
                    <CardTitle>Instant Alerts</CardTitle>
                  </div>
                  <CardDescription>
                    Get notified immediately when issues arise
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 text-sm">
                    {[
                      "Covenant breach notifications",
                      "Rating watch/downgrade alerts",
                      "Contract renewal reminders",
                      "Supplier status changes",
                      "Volume shortfall warnings",
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-muted-foreground">
                        <AlertTriangle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
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

      {/* Lender Portal Features */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <FadeInUp className="text-center mb-16">
            <Badge variant="outline" className="mb-4">Lender Portal</Badge>
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
              Everything You Need in One Place
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              A dedicated portal for financial institutions to monitor their bioenergy portfolio.
            </p>
          </FadeInUp>

          <StaggerContainer className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {[
              { icon: Eye, title: "Portfolio Overview", desc: "All monitored projects in one dashboard" },
              { icon: Award, title: "Rating Tracker", desc: "Historical rating trends and forecasts" },
              { icon: AlertTriangle, title: "Risk Alerts", desc: "Centralized breach notification center" },
              { icon: FileText, title: "Report Generator", desc: "Custom compliance report builder" },
              { icon: Calendar, title: "Covenant Calendar", desc: "Upcoming deadlines and renewals" },
              { icon: BarChart3, title: "Analytics", desc: "Portfolio concentration analysis" },
              { icon: Database, title: "Evidence Vault", desc: "Searchable document repository" },
              { icon: History, title: "Time Machine", desc: "Historical data reconstruction" },
            ].map((item, i) => (
              <StaggerItem key={i}>
                <Card className="h-full hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center mb-3">
                      <item.icon className="h-5 w-5 text-blue-600" />
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

      {/* Integration */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
            <FadeInUp>
              <Badge variant="outline" className="mb-4">Enterprise Integration</Badge>
              <h2 className="text-3xl md:text-4xl font-display font-bold mb-6">
                Fits Your Existing Workflows
              </h2>
              <p className="text-lg text-muted-foreground mb-6">
                ABFI integrates with your existing loan management and risk systems.
                No disruption to established processes.
              </p>
              <ul className="space-y-4 mb-8">
                {[
                  "REST API for system integration",
                  "Webhook notifications for real-time events",
                  "Bulk export in standard formats (CSV, JSON)",
                  "Single sign-on (SSO) support",
                  "Custom reporting via API",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-blue-500 shrink-0" />
                    <span className="text-muted-foreground">{item}</span>
                  </li>
                ))}
              </ul>
              <Link href="/lender-portal">
                <Button size="lg" className="bg-blue-500 hover:bg-blue-600">
                  Request API Access
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </FadeInUp>

            <FadeInUp delay={0.2}>
              <Card className="bg-slate-900 text-white border-0">
                <CardContent className="p-6">
                  <div className="font-mono text-sm">
                    <div className="text-slate-500 mb-2">// Example API Response</div>
                    <pre className="text-xs leading-relaxed">
{`{
  "project_id": "PRJ-2024-0042",
  "current_rating": "AA+",
  "rating_date": "2024-03-15",
  "covenant_status": "compliant",
  "next_review": "2024-06-15",
  "alerts": [],
  "evidence_hash": "a3f8b2c1..."
}`}
                    </pre>
                  </div>
                </CardContent>
              </Card>
            </FadeInUp>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-blue-500 text-white">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold font-mono mb-2">
                <AnimatedCounter value={99.9} decimals={1} suffix="%" />
              </div>
              <div className="text-blue-100">Uptime SLA</div>
            </div>
            <div>
              <div className="text-4xl font-bold font-mono mb-2">
                <AnimatedCounter value={24} suffix="/7" />
              </div>
              <div className="text-blue-100">Covenant Monitoring</div>
            </div>
            <div>
              <div className="text-4xl font-bold font-mono mb-2">
                {"<"}<AnimatedCounter value={15} />min
              </div>
              <div className="text-blue-100">Alert Response</div>
            </div>
            <div>
              <div className="text-4xl font-bold font-mono mb-2">
                <AnimatedCounter value={100} suffix="%" />
              </div>
              <div className="text-blue-100">Audit Coverage</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <FadeInUp className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-6">
              Ready for Bank-Grade Bioenergy Monitoring?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Join leading financial institutions using ABFI to confidently finance Australia's bioenergy future.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/lender-portal">
                <Button size="xl" className="bg-blue-500 hover:bg-blue-600">
                  <Shield className="h-5 w-5 mr-2" />
                  Access Lender Portal
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
              </Link>
              <Link href="/compliance-dashboard">
                <Button size="xl" variant="outline">
                  View Compliance Dashboard
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
              <Link href="/for-growers" className="hover:text-foreground transition-colors">For Growers</Link>
              <Link href="/for-developers" className="hover:text-foreground transition-colors">For Developers</Link>
              <Link href="/platform-features" className="hover:text-foreground transition-colors">Platform Features</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
