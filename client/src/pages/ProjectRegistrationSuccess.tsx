/**
 * Project Registration Success - Nextgen Design
 *
 * Features:
 * - Success confirmation with animated icon
 * - Application reference display
 * - Next steps guidance
 * - Typography components for consistent styling
 */

import { Link } from "wouter";
import { H1, H2, H3, H4, Body, MetricValue, DataLabel } from "@/components/Typography";
import { Check, ArrowRight, FileText, Clock, Mail } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";

export default function ProjectRegistrationSuccess() {
  return (
    <div className="min-h-screen bg-[#0a0f14] text-black">
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
              <Check className="w-12 h-12 text-black" />
            </div>
            <div className="absolute inset-0 bg-gradient-to-br from-[#c9a962] to-[#a88a4a] rounded-full blur-xl opacity-50" />
          </div>
        </div>

        {/* Success Message */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4">
            Project Registration Complete
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Your biorefinery/processor project has been successfully submitted
            for review. Our team will assess your application and contact you
            within 3-5 business days.
          </p>
        </div>

        {/* Application Reference */}
        <div className="max-w-3xl mx-auto mb-12">
          <Card className="bg-[#111820]/80 border-[#c9a962]/20 backdrop-blur-sm">
            <CardContent className="p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-sm text-gray-400 mb-1">
                    Application Reference
                  </p>
                  <p className="text-2xl font-mono font-bold text-[#c9a962]">
                    PRJ-{new Date().getFullYear()}-
                    {Math.random().toString(36).substr(2, 6).toUpperCase()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-400 mb-1">Submitted</p>
                  <p className="text-lg font-semibold">
                    {new Date().toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="border-t border-gray-700 pt-6">
                <p className="text-sm text-gray-400 mb-4">
                  Save this reference number for tracking your application
                  status.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Next Steps */}
        <div className="max-w-3xl mx-auto mb-12">
          <h2 className="text-2xl font-serif font-bold mb-6 text-center">
            What Happens Next?
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="bg-[#111820]/60 border-[#c9a962]/10 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-[#c9a962]/10 rounded-lg flex items-center justify-center mb-4">
                  <FileText className="w-6 h-6 text-[#c9a962]" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Review Process</h3>
                <p className="text-sm text-gray-400">
                  Our team will review your project details, technology
                  specifications, and documentation.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-[#111820]/60 border-[#c9a962]/10 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-[#c9a962]/10 rounded-lg flex items-center justify-center mb-4">
                  <Clock className="w-6 h-6 text-[#c9a962]" />
                </div>
                <h3 className="text-lg font-semibold mb-2">
                  Assessment Timeline
                </h3>
                <p className="text-sm text-gray-400">
                  Expect feedback within 3-5 business days. Complex projects may
                  require additional review time.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-[#111820]/60 border-[#c9a962]/10 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-[#c9a962]/10 rounded-lg flex items-center justify-center mb-4">
                  <Mail className="w-6 h-6 text-[#c9a962]" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Notification</h3>
                <p className="text-sm text-gray-400">
                  You'll receive an email with next steps, including feedstock
                  matching opportunities.
                </p>
              </CardContent>
            </Card>
          </div>
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
          <Link href="/browse">
            <Button
              size="lg"
              className="bg-gradient-to-r from-[#c9a962] to-[#a88a4a] hover:from-[#a88a4a] hover:to-[#8a6e3a] text-black"
            >
              Browse Feedstock Suppliers
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </Link>
        </div>

        {/* Support Information */}
        <div className="mt-16 text-center">
          <p className="text-gray-400 mb-2">
            Questions about your application?
          </p>
          <a
            href="mailto:projects@biofeedau.com.au"
            className="text-[#c9a962] hover:underline font-semibold"
          >
            projects@biofeedau.com.au
          </a>
        </div>
      </div>
    </div>
  );
}
