import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, DollarSign, FileText, TrendingUp, Leaf, Shield } from "lucide-react";

export default function ProducerRegistration() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0F3A5C] to-[#1a5a7d]">
      {/* Header */}
      <header className="border-b border-white/10 bg-[#0F3A5C]/50 backdrop-blur">
        <div className="container mx-auto flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-white hover:opacity-80">
            <Leaf className="h-6 w-6" />
            <span className="text-xl font-semibold">ABFI</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-white/80 hover:text-white">
              Sign In
            </Link>
            <Link href="/buyer-registration">
              <Button variant="outline" className="border-[#F4C430] text-[#F4C430] hover:bg-[#F4C430] hover:text-[#0F3A5C]">
                I'm a Buyer
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20">
        <div className="container mx-auto text-center">
          <h1 className="mb-6 text-5xl font-bold text-white">
            Connect Your Feedstock to<br />
            <span className="text-[#F4C430]">Australia's Bioenergy Future</span>
          </h1>
          <p className="mx-auto mb-12 max-w-2xl text-xl text-white/80">
            Join Australia's premier bioenergy feedstock marketplace. Get verified ABFI ratings, 
            connect with premium buyers, and secure long-term contracts.
          </p>
          
          <Link href="/producer-registration/account-setup">
            <Button size="lg" className="bg-[#F4C430] text-[#0F3A5C] hover:bg-[#F4C430]/90 text-lg px-8 py-6">
              Register as Producer
              <svg className="ml-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Button>
          </Link>

          {/* Trust Indicators */}
          <div className="mt-12 flex items-center justify-center gap-8">
            <div className="flex items-center gap-2 text-white/60">
              <Shield className="h-5 w-5" />
              <span className="text-sm">Government Certified</span>
            </div>
            <div className="flex items-center gap-2 text-white/60">
              <CheckCircle2 className="h-5 w-5" />
              <span className="text-sm">CANEGROWERS Partner</span>
            </div>
            <div className="flex items-center gap-2 text-white/60">
              <TrendingUp className="h-5 w-5" />
              <span className="text-sm">500+ Active Producers</span>
            </div>
          </div>
        </div>
      </section>

      {/* Value Propositions */}
      <section className="bg-white py-20">
        <div className="container mx-auto">
          <h2 className="mb-12 text-center text-3xl font-bold text-[#0F3A5C]">
            Why Join ABFI?
          </h2>
          
          <div className="grid gap-8 md:grid-cols-3">
            <Card className="border-[#F4C430]/20 hover:border-[#F4C430] transition-colors">
              <CardHeader>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#F4C430]/10">
                  <DollarSign className="h-6 w-6 text-[#F4C430]" />
                </div>
                <CardTitle className="text-[#0F3A5C]">Premium Pricing</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Earn premium prices for low-carbon certified feedstock. Our ABFI rating system 
                  rewards sustainable practices with better contract terms.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-[#F4C430]/20 hover:border-[#F4C430] transition-colors">
              <CardHeader>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#F4C430]/10">
                  <FileText className="h-6 w-6 text-[#F4C430]" />
                </div>
                <CardTitle className="text-[#0F3A5C]">Guaranteed Offtake</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Connect directly with verified biofuel producers seeking reliable feedstock supply. 
                  Secure long-term contracts with transparent pricing.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-[#F4C430]/20 hover:border-[#F4C430] transition-colors">
              <CardHeader>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#F4C430]/10">
                  <TrendingUp className="h-6 w-6 text-[#F4C430]" />
                </div>
                <CardTitle className="text-[#0F3A5C]">Simplified Contracting</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Streamlined contract templates, automated compliance tracking, and dispute resolution 
                  support. Focus on farming, not paperwork.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-gray-50 py-20">
        <div className="container mx-auto">
          <h2 className="mb-12 text-center text-3xl font-bold text-[#0F3A5C]">
            Get Started in 3 Simple Steps
          </h2>
          
          <div className="grid gap-8 md:grid-cols-3">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#F4C430] text-2xl font-bold text-[#0F3A5C]">
                1
              </div>
              <h3 className="mb-2 text-xl font-semibold text-[#0F3A5C]">Register Your Property</h3>
              <p className="text-gray-600">
                Provide basic details about your property, production capacity, and agricultural practices.
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#F4C430] text-2xl font-bold text-[#0F3A5C]">
                2
              </div>
              <h3 className="mb-2 text-xl font-semibold text-[#0F3A5C]">Get Your ABFI Rating</h3>
              <p className="text-gray-600">
                Our carbon calculator analyzes your practices and assigns a sustainability rating (A+ to D).
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#F4C430] text-2xl font-bold text-[#0F3A5C]">
                3
              </div>
              <h3 className="mb-2 text-xl font-semibold text-[#0F3A5C]">Publish to Marketplace</h3>
              <p className="text-gray-600">
                Set your pricing, contract terms, and start receiving inquiries from verified buyers.
              </p>
            </div>
          </div>

          <div className="mt-12 text-center">
            <Link href="/producer-registration/account-setup">
              <Button size="lg" className="bg-[#0F3A5C] text-white hover:bg-[#0F3A5C]/90">
                Start Registration
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-[#0F3A5C] py-8">
        <div className="container mx-auto text-center text-white/60">
          <p>&copy; 2024 Australian Bioenergy Feedstock Institute. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
