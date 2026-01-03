/**
 * Project Registration - Nextgen Design
 *
 * Features:
 * - Bioenergy project registration landing page
 * - Benefits and features showcase
 * - Dark theme with gold accents
 * - Typography components for consistent styling
 */

import { Link } from "wouter";
import { H1, H2, H3, H4, Body, MetricValue, DataLabel } from "@/components/Typography";
import {
  ArrowRight,
  Sprout,
  DollarSign,
  CheckCircle,
  TrendingUp,
} from "lucide-react";

export default function ProjectRegistration() {
  return (
    <div className="min-h-screen bg-[#0a0f14] text-black">
      {/* Background gradients */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-[15%] w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-[15%] w-96 h-96 bg-[#c9a962]/5 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-5xl mx-auto px-6 py-16">
        {/* Header */}
        <header className="text-center mb-12 pb-8 border-b border-[#c9a962]/20">
          <div className="inline-flex items-center gap-3 mb-6">
            <div className="w-11 h-11 bg-gradient-to-br from-[#c9a962] to-[#8a7443] rounded-xl flex items-center justify-center">
              <span className="font-serif text-xl text-[#0a0f14]">B</span>
            </div>
            <span className="font-serif text-2xl">
              BioFeed<span className="text-[#c9a962]">AU</span>
            </span>
          </div>

          <div className="inline-block bg-blue-500/15 text-blue-400 px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wide mb-4">
            Project Developer Portal
          </div>

          <h1 className="font-serif text-4xl md:text-5xl font-normal mb-4">
            Register Your Bioenergy Project
          </h1>

          <p className="text-gray-400 text-lg max-w-2xl mx-auto font-light">
            Connect with verified feedstock supply, gain industry recognition,
            and access financing pathways through Australia's premier bioenergy
            market platform.
          </p>
        </header>

        {/* Benefits Bar */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-12">
          {[
            {
              icon: <Sprout className="w-6 h-6" />,
              title: "Feedstock Matching",
              desc: "Access verified supply projections",
            },
            {
              icon: <DollarSign className="w-6 h-6" />,
              title: "Investor Visibility",
              desc: "Appear in deal flow for financiers",
            },
            {
              icon: <CheckCircle className="w-6 h-6" />,
              title: "Credibility Signals",
              desc: "Verified milestones & approvals",
            },
            {
              icon: <TrendingUp className="w-6 h-6" />,
              title: "Industry Recognition",
              desc: "Featured announcements & PR",
            },
          ].map((benefit, idx) => (
            <div
              key={idx}
              className="bg-[#111820] border border-[#c9a962]/15 rounded-xl p-5 text-center"
            >
              <div className="text-[#c9a962] mb-2 flex justify-center">
                {benefit.icon}
              </div>
              <h4 className="text-sm font-semibold mb-1">{benefit.title}</h4>
              <p className="text-xs text-gray-500 font-light">{benefit.desc}</p>
            </div>
          ))}
        </div>

        {/* Registration Process Preview */}
        <div className="bg-[#111820] border border-[#c9a962]/15 rounded-2xl p-8 mb-8">
          <h2 className="font-serif text-2xl mb-6">Registration Process</h2>

          <div className="grid grid-cols-1 md:grid-cols-7 gap-4 mb-8">
            {[
              { num: 1, label: "Project" },
              { num: 2, label: "Technology" },
              { num: 3, label: "Feedstock" },
              { num: 4, label: "Funding" },
              { num: 5, label: "Approvals" },
              { num: 6, label: "Verification" },
              { num: 7, label: "Opportunities" },
            ].map(step => (
              <div key={step.num} className="flex flex-col items-center">
                <div className="w-9 h-9 rounded-full bg-[#1a222d] border-2 border-[#1a222d] flex items-center justify-center font-mono text-sm text-gray-500 mb-2">
                  {step.num}
                </div>
                <span className="text-[10px] uppercase tracking-wide text-gray-500 text-center">
                  {step.label}
                </span>
              </div>
            ))}
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-sm mb-1">
                  Comprehensive Project Profile
                </h4>
                <p className="text-sm text-gray-400 font-light">
                  Provide detailed information about your bioenergy or
                  biorefinery project across 7 key areas
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-sm mb-1">
                  Third-Party Verification
                </h4>
                <p className="text-sm text-gray-400 font-light">
                  Upload supporting documents for independent verification of
                  milestones and approvals
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-sm mb-1">
                  Automated Matching & Visibility
                </h4>
                <p className="text-sm text-gray-400 font-light">
                  Get matched with suitable feedstock suppliers and appear in
                  investor deal flow
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <Link href="/project-registration/flow">
            <button className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-[#c9a962] to-[#8a7443] text-[#0a0f14] font-semibold rounded-lg hover:opacity-90 transition-opacity">
              Start Project Registration
              <ArrowRight className="w-5 h-5" />
            </button>
          </Link>

          <p className="mt-4 text-sm text-gray-500">
            Already started?{" "}
            <Link
              href="/project-registration/flow"
              className="text-[#c9a962] hover:underline"
            >
              Continue registration
            </Link>
          </p>
        </div>

        {/* Info Box */}
        <div className="mt-12 bg-[#111820]/50 border border-[#c9a962]/10 rounded-xl p-6">
          <h3 className="font-semibold mb-2 text-sm">What You'll Need</h3>
          <ul className="text-sm text-gray-400 space-y-1 font-light">
            <li>• Project details (name, location, development stage)</li>
            <li>
              • Technology specifications (conversion type, capacity, outputs)
            </li>
            <li>• Feedstock requirements (types, volumes, quality specs)</li>
            <li>
              • Funding status (capital requirements, sources, investment stage)
            </li>
            <li>
              • Regulatory approvals (environmental, planning, EPA licenses)
            </li>
            <li>
              • Supporting documents for verification (optional but recommended)
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
