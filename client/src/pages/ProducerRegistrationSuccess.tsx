import { Link } from "wouter";
import { Check, ArrowRight, FileText, Clock, Mail, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function ProducerRegistrationSuccess() {
  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #faf8f3 0%, #f5f0e6 100%)' }}>
      {/* Background pattern */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-5">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-[#2d5a27] rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-[#4a7c43] rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-16">
        {/* Success Icon */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            <div className="w-24 h-24 bg-gradient-to-br from-[#2d5a27] to-[#4a7c43] rounded-full flex items-center justify-center shadow-2xl">
              <Check className="w-12 h-12 text-white" />
            </div>
            <div className="absolute inset-0 bg-gradient-to-br from-[#2d5a27] to-[#4a7c43] rounded-full blur-xl opacity-40" />
          </div>
        </div>

        {/* Success Message */}
        <div className="text-center mb-12">
          <h1 
            className="text-4xl md:text-5xl font-normal mb-4"
            style={{ fontFamily: "'DM Serif Display', serif", color: '#1a2e1a' }}
          >
            Registration Complete!
          </h1>
          <p className="text-xl max-w-2xl mx-auto" style={{ color: '#4a5a4a', lineHeight: 1.7 }}>
            Welcome to BioFeed AU! Your producer profile has been successfully submitted. 
            Our verification team will review your details and activate your account within 2-3 business days.
          </p>
        </div>

        {/* Application Reference */}
        <div className="max-w-3xl mx-auto mb-12">
          <Card className="bg-white/80 border-[#2d5a27]/20 backdrop-blur-sm shadow-xl">
            <CardContent className="p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-sm mb-1" style={{ color: '#6b7c6b' }}>Application Reference</p>
                  <p className="text-2xl font-mono font-bold" style={{ color: '#2d5a27' }}>
                    PROD-{new Date().getFullYear()}-{Math.random().toString(36).substr(2, 6).toUpperCase()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm mb-1" style={{ color: '#6b7c6b' }}>Submitted</p>
                  <p className="text-lg font-semibold" style={{ color: '#1a2e1a' }}>
                    {new Date().toLocaleDateString()}
                  </p>
                </div>
              </div>
              
              <div className="border-t pt-6" style={{ borderColor: '#e5e7e5' }}>
                <p className="text-sm" style={{ color: '#6b7c6b' }}>
                  Save this reference number for tracking your application status. You'll receive email updates at each stage of the verification process.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Next Steps */}
        <div className="max-w-3xl mx-auto mb-12">
          <h2 
            className="text-2xl font-normal mb-6 text-center"
            style={{ fontFamily: "'DM Serif Display', serif", color: '#1a2e1a' }}
          >
            What Happens Next?
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="bg-white/60 border-[#2d5a27]/10 backdrop-blur-sm hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-4" style={{ background: '#2d5a27' }}>
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold mb-2" style={{ color: '#1a2e1a' }}>Verification</h3>
                <p className="text-sm" style={{ color: '#6b7c6b' }}>
                  Our team will verify your ABN, property details, and production capacity to ensure data accuracy.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/60 border-[#2d5a27]/10 backdrop-blur-sm hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-4" style={{ background: '#2d5a27' }}>
                  <Clock className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold mb-2" style={{ color: '#1a2e1a' }}>Timeline</h3>
                <p className="text-sm" style={{ color: '#6b7c6b' }}>
                  Expect account activation within 2-3 business days. You'll receive an email confirmation once approved.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/60 border-[#2d5a27]/10 backdrop-blur-sm hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-4" style={{ background: '#2d5a27' }}>
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold mb-2" style={{ color: '#1a2e1a' }}>Start Earning</h3>
                <p className="text-sm" style={{ color: '#6b7c6b' }}>
                  Once approved, you can list feedstocks, receive buyer inquiries, and access direct market pricing.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Benefits Reminder */}
        <div className="max-w-3xl mx-auto mb-12">
          <Card className="bg-white/80 border-[#2d5a27]/20 shadow-lg">
            <CardContent className="p-8">
              <h3 
                className="text-xl font-normal mb-4 text-center"
                style={{ fontFamily: "'DM Serif Display', serif", color: '#1a2e1a' }}
              >
                Your BioFeed AU Benefits
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 mt-0.5" style={{ color: '#2d5a27' }} />
                  <div>
                    <p className="font-semibold" style={{ color: '#1a2e1a' }}>Direct Market Access</p>
                    <p className="text-sm" style={{ color: '#6b7c6b' }}>No broker fees, 41% higher earnings</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 mt-0.5" style={{ color: '#2d5a27' }} />
                  <div>
                    <p className="font-semibold" style={{ color: '#1a2e1a' }}>Price Protection</p>
                    <p className="text-sm" style={{ color: '#6b7c6b' }}>Transparent pricing, fair contracts</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 mt-0.5" style={{ color: '#2d5a27' }} />
                  <div>
                    <p className="font-semibold" style={{ color: '#1a2e1a' }}>Verified Buyers</p>
                    <p className="text-sm" style={{ color: '#6b7c6b' }}>Connect with certified offtakers</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 mt-0.5" style={{ color: '#2d5a27' }} />
                  <div>
                    <p className="font-semibold" style={{ color: '#1a2e1a' }}>Market Intelligence</p>
                    <p className="text-sm" style={{ color: '#6b7c6b' }}>Real-time demand signals</p>
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
              className="border-2"
              style={{ borderColor: '#2d5a27', color: '#2d5a27' }}
            >
              Return to Home
            </Button>
          </Link>
          <Link href="/grower-benefits">
            <Button 
              size="lg"
              className="text-white"
              style={{ background: 'linear-gradient(135deg, #2d5a27, #4a7c43)' }}
            >
              Learn More About Benefits
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </Link>
        </div>

        {/* Support Information */}
        <div className="mt-16 text-center">
          <p className="mb-2" style={{ color: '#6b7c6b' }}>Questions about your application?</p>
          <a 
            href="mailto:producers@biofeedau.com.au" 
            className="hover:underline font-semibold"
            style={{ color: '#2d5a27' }}
          >
            producers@biofeedau.com.au
          </a>
        </div>
      </div>
    </div>
  );
}
