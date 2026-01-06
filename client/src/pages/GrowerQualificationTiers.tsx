/**
 * Grower Qualification Tiers - Nextgen Design
 *
 * Features:
 * - GQ tier system explanation (Bronze, Silver, Gold, Platinum)
 * - Requirements and benefits per tier
 * - Color-coded tier cards with featured highlights
 * - Navigation to qualification process
 * - Typography components for consistent styling
 */

import { Button } from"@/components/ui/Button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from"@/components/ui/Card";
import { Badge } from"@/components/ui/badge";
import {
  ArrowRight,
  Award,
  CheckCircle2,
  Shield,
  TrendingUp,
  Star,
  FileCheck,
  BarChart3,
  Users,
  Leaf,
} from"lucide-react";
import { Link } from"wouter";
import { cn } from"@/lib/utils";
import { PageLayout } from"@/components/layout";
import { H1, H2, H3, Body, MetricValue, DataLabel, H4 } from"@/components/Typography";

// Grower Qualification Tier Component
function GQTierCard({
  tier,
  title,
  description,
  requirements,
  benefits,
  color,
  featured,
}: {
  tier: string;
  title: string;
  description: string;
  requirements: string[];
  benefits: string[];
  color: string;
  featured?: boolean;
}) {
  const colorClasses: Record<
    string,
    { bg: string; border: string; text: string; badge: string }
  > = {
    yellow: {
      bg:"bg-yellow-50",
      border:"border-yellow-200",
      text:"text-yellow-700",
      badge:"bg-yellow-100 text-yellow-800",
    },
    lime: {
      bg:"bg-lime-50",
      border:"border-lime-200",
      text:"text-lime-700",
      badge:"bg-lime-100 text-lime-800",
    },
    green: {
      bg:"bg-green-50",
      border:"border-green-200",
      text:"text-green-700",
      badge:"bg-green-100 text-green-800",
    },
    emerald: {
      bg:"bg-emerald-50",
      border:"border-emerald-200",
      text:"text-emerald-700",
      badge:"bg-emerald-100 text-emerald-800",
    },
  };

  const colors = colorClasses[color] || colorClasses.yellow;

  return (
    <Card
      className={cn(
"relative overflow-hidden transition-all duration-300 hover:shadow-lg",
        colors.border,
        featured &&"ring-2 ring-emerald-500 ring-offset-2"
      )}
    >
      {featured && (
        <div className="absolute top-0 right-0 bg-[#D4AF37] text-black text-xs px-3 py-1 rounded-bl-lg font-medium">
          Top Tier
        </div>
      )}
      <CardHeader className={cn(colors.bg,"pb-4")}>
        <div className="flex items-center justify-between">
          <Badge className={colors.badge}>{tier}</Badge>
          <Award className={cn("h-6 w-6", colors.text)} />
        </div>
        <CardTitle className="text-xl mt-2">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="space-y-4">
          <div>
            <H4 className="text-sm  mb-2 flex items-center gap-2">
              <FileCheck className="h-4 w-4 text-gray-600" />
              Requirements
            </H4>
            <ul className="space-y-1.5">
              {requirements.map((req, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <CheckCircle2
                    className={cn("h-4 w-4 mt-0.5 shrink-0", colors.text)}
                  />
                  <span className="text-gray-600">{req}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <H4 className="text-sm  mb-2 flex items-center gap-2">
              <Star className="h-4 w-4 text-gray-600" />
              Benefits
            </H4>
            <ul className="space-y-1.5">
              {benefits.map((benefit, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <TrendingUp
                    className={cn("h-4 w-4 mt-0.5 shrink-0", colors.text)}
                  />
                  <span className="text-gray-600">{benefit}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function GrowerQualificationTiers() {
  return (
    <PageLayout>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-emerald-800 via-green-800 to-teal-900 text-black overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-10" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-400/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

        <div className="container mx-auto px-4 py-20 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <Badge className="mb-4 bg-white/20 text-black border-white/30">
              <Shield className="h-3.5 w-3.5 mr-1.5" />
              Grower Qualification System
            </Badge>
            <H1 className="text-4xl md:text-5xl font-display  mb-6">
              GQ Tier System
            </H1>
            <Body className="text-lg md:text-xl text-emerald-100 mb-8">
              Our standardized qualification framework helps growers demonstrate
              operational maturity and unlock better pricing, buyer access, and
              financing opportunities.
            </Body>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/producer-registration">
                <Button size="lg" className="bg-white text-emerald-800 hover:bg-white/90">
                  Start Registration
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/for-growers">
                <Button size="lg" variant="outline" className="border-white/30 text-black hover:bg-white/10">
                  Learn More
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-muted/30 border-b">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            <div className="text-center">
              <MetricValue className="text-3xl font-bold text-[#D4AF37]">4</MetricValue>
              <DataLabel className="text-sm text-gray-600">Qualification Tiers</DataLabel>
            </div>
            <div className="text-center">
              <MetricValue className="text-3xl font-bold text-[#D4AF37]">15%</MetricValue>
              <DataLabel className="text-sm text-gray-600">Price Premium at GQ1</DataLabel>
            </div>
            <div className="text-center">
              <MetricValue className="text-3xl font-bold text-[#D4AF37]">100+</MetricValue>
              <DataLabel className="text-sm text-gray-600">Verified Growers</DataLabel>
            </div>
            <div className="text-center">
              <MetricValue className="text-3xl font-bold text-[#D4AF37]">24hr</MetricValue>
              <DataLabel className="text-sm text-gray-600">Verification Time</DataLabel>
            </div>
          </div>
        </div>
      </section>

      {/* GQ Tiers Grid */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <H2 className="text-3xl font-display  mb-4">
              Your Path to GQ1 Status
            </H2>
            <Body className="text-lg text-gray-600 max-w-2xl mx-auto">
              Progress through standardized tiers as you demonstrate operational
              maturity. Higher tiers unlock better pricing and buyer access.
            </Body>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
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
              benefits={[
"Platform access",
"Buyer visibility",
"Basic analytics",
"Support resources",
              ]}
            />
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
              benefits={[
"Enhanced visibility",
"Priority matching",
"Market insights",
"5% price premium",
              ]}
            />
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
              benefits={[
"Premium buyer access",
"Long-term contracts",
"10% price premium",
"Finance eligibility",
              ]}
            />
            <GQTierCard
              tier="GQ1"
              title="Premium"
              description="Elite suppliers meeting bankability standards"
              color="emerald"
              featured
              requirements={[
"All GQ2 requirements",
"5+ years verified history",
"Full bankability assessment",
"Continuous monitoring",
              ]}
              benefits={[
"Top-tier pricing (15%+)",
"Exclusive opportunities",
"Green finance access",
"Featured placement",
              ]}
            />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <H2 className="text-3xl font-display  mb-4">
              How Qualification Works
            </H2>
            <Body className="text-lg text-gray-600 max-w-2xl mx-auto">
              Our assessment process is transparent and designed to help you
              progress through tiers efficiently.
            </Body>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <Card>
              <CardContent className="pt-6">
                <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
                  <FileCheck className="h-6 w-6 text-[#D4AF37]" />
                </div>
                <H3 className="text-lg  mb-2">1. Register & Submit</H3>
                <Body className="text-sm text-gray-600">
                  Complete your producer registration with ABN verification,
                  property details, and initial documentation.
                </Body>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
                  <BarChart3 className="h-6 w-6 text-[#D4AF37]" />
                </div>
                <H3 className="text-lg  mb-2">2. Build Track Record</H3>
                <Body className="text-sm text-gray-600">
                  Deliver quality feedstock, maintain certifications, and
                  accumulate verified operational history.
                </Body>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
                  <TrendingUp className="h-6 w-6 text-[#D4AF37]" />
                </div>
                <H3 className="text-lg  mb-2">3. Progress & Unlock</H3>
                <Body className="text-sm text-gray-600">
                  As you meet tier requirements, automatically unlock better
                  pricing, buyer access, and financing options.
                </Body>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-emerald-800 to-teal-900 text-black">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-2xl mx-auto">
            <Leaf className="h-12 w-12 mx-auto mb-6 text-emerald-300" />
            <H2 className="text-3xl font-display  mb-4">
              Ready to Get Qualified?
            </H2>
            <Body className="text-lg text-emerald-100 mb-8">
              Join Australia's growing network of qualified biomass producers.
              Start your registration today and begin your path to GQ1 status.
            </Body>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/producer-registration">
                <Button size="lg" className="bg-white text-emerald-800 hover:bg-white/90">
                  Start Registration
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/for-growers">
                <Button size="lg" variant="outline" className="border-white/30 text-black hover:bg-white/10">
                  <Users className="mr-2 h-4 w-4" />
                  Grower Benefits
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </PageLayout>
  );
}
