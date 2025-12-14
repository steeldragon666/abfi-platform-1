import { Link } from "wouter";
import { Check, ArrowRight, FileText, Clock, Mail, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function FinancialOnboardingSuccess() {
  return (
    <div className="min-h-screen bg-[#0a0f14] text-white">
      {/* Background gradients */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-[#c9a962]/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-[#c9a962]/3 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-16">
        {/* Success Icon */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            <div className="w-24 h-24 bg-gradient-to-br from-[#c9a962] to-[#a88a4a] rounded-full flex items-center justify-center">
              <Check className="w-12 h-12 text-white" />
            </div>
            <div className="absolute inset-0 bg-gradient-to-br from-[#c9a962] to-[#a88a4a] rounded-full blur-xl opacity-50" />
          </div>
        </div>

        {/* Success Message */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4">
            Institution Onboarding Complete
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Your financial institution profile has been successfully submitted. 
            Our compliance team will review your credentials and activate your access within 5-7 business days.
          </p>
        </div>

        {/* Application Reference */}
        <div className="max-w-3xl mx-auto mb-12">
          <Card className="bg-[#111820]/80 border-[#c9a962]/20 backdrop-blur-sm">
            <CardContent className="p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-sm text-gray-400 mb-1">Institution Reference</p>
                  <p className="text-2xl font-mono font-bold text-[#c9a962]">
                    FIN-{new Date().getFullYear()}-{Math.random().toString(36).substr(2, 6).toUpperCase()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-400 mb-1">Submitted</p>
                  <p className="text-lg font-semibold">{new Date().toLocaleDateString()}</p>
                </div>
              </div>
              
              <div className="border-t border-gray-700 pt-6">
                <p className="text-sm text-gray-400 mb-4">
                  Save this reference number for tracking your onboarding status. You'll receive email updates at each stage of the compliance review.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Next Steps */}
        <div className="max-w-3xl mx-auto mb-12">
          <h2 className="text-2xl font-serif font-bold mb-6 text-center">Onboarding Process</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="bg-[#111820]/60 border-[#c9a962]/10 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-[#c9a962]/10 rounded-lg flex items-center justify-center mb-4">
                  <Shield className="w-6 h-6 text-[#c9a962]" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Compliance Review</h3>
                <p className="text-sm text-gray-400">
                  Our team will verify your ABN, regulatory credentials, and authorized representative details.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-[#111820]/60 border-[#c9a962]/10 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-[#c9a962]/10 rounded-lg flex items-center justify-center mb-4">
                  <Clock className="w-6 h-6 text-[#c9a962]" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Review Timeline</h3>
                <p className="text-sm text-gray-400">
                  Expect account activation within 5-7 business days. Additional documentation may be requested for verification.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-[#111820]/60 border-[#c9a962]/10 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-[#c9a962]/10 rounded-lg flex items-center justify-center mb-4">
                  <Mail className="w-6 h-6 text-[#c9a962]" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Access Activation</h3>
                <p className="text-sm text-gray-400">
                  Once approved, you'll receive login credentials and access to your selected data tier.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Access Tier Benefits */}
        <div className="max-w-3xl mx-auto mb-12">
          <Card className="bg-[#111820]/80 border-[#c9a962]/20">
            <CardContent className="p-8">
              <h3 className="text-xl font-serif font-bold mb-4 text-center">
                Your Data Access Benefits
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-[#c9a962] mt-0.5" />
                  <div>
                    <p className="font-semibold">Bankability Assessments</p>
                    <p className="text-sm text-gray-400">Access project creditworthiness scores</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-[#c9a962] mt-0.5" />
                  <div>
                    <p className="font-semibold">Supply Chain Data</p>
                    <p className="text-sm text-gray-400">Verified feedstock availability metrics</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-[#c9a962] mt-0.5" />
                  <div>
                    <p className="font-semibold">Market Intelligence</p>
                    <p className="text-sm text-gray-400">Real-time pricing and demand signals</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-[#c9a962] mt-0.5" />
                  <div>
                    <p className="font-semibold">Risk Analytics</p>
                    <p className="text-sm text-gray-400">Concentration and counterparty risk metrics</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/">
            <Button 
              size="lg"
              variant="outline"
              className="bg-transparent border-[#c9a962] text-[#c9a962] hover:bg-[#c9a962]/10"
            >
              Return to Home
            </Button>
          </Link>
          <Link href="/bankability-explainer">
            <Button 
              size="lg"
              className="bg-gradient-to-r from-[#c9a962] to-[#a88a4a] hover:from-[#a88a4a] hover:to-[#8a6e3a] text-white"
            >
              Learn About Bankability Assessment
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </Link>
        </div>

        {/* Support Information */}
        <div className="mt-16 text-center">
          <p className="text-gray-400 mb-2">Questions about your application?</p>
          <a 
            href="mailto:institutions@biofeedau.com.au" 
            className="text-[#c9a962] hover:underline font-semibold"
          >
            institutions@biofeedau.com.au
          </a>
        </div>
      </div>
    </div>
  );
}
