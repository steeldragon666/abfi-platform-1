/**
 * Producer Success - Nextgen Design
 *
 * Features:
 * - Registration success confirmation
 * - Next steps guidance with timeline
 * - Quick action buttons for dashboard
 * - Typography components for consistent styling
 */

import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { CheckCircle2, Home, LayoutDashboard, Search } from "lucide-react";
import { Link } from "wouter";
import { H1, H2, Body } from "@/components/Typography";

export default function ProducerSuccess() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#0F3A5C] to-[#1a5a7c] p-4">
      <Card className="w-full max-w-2xl">
        <CardContent className="pt-12 pb-12 text-center">
          {/* Success Icon */}
          <div className="mb-6 flex justify-center">
            <div className="rounded-full bg-green-100 p-6">
              <CheckCircle2 className="h-16 w-16 text-green-600" />
            </div>
          </div>

          {/* Success Message */}
          <H1 className="mb-3 text-[#0F3A5C]">
            Welcome to ABFI!
          </H1>
          <Body className="mb-8 text-lg text-gray-600">
            Your feedstock listing has been published to the marketplace.
          </Body>

          {/* What Happens Next */}
          <div className="mb-8 rounded-lg border border-gray-200 bg-gray-50 p-6 text-left">
            <H2 className="mb-4 text-[#0F3A5C]">
              What happens next?
            </H2>
            <ul className="space-y-3 text-gray-700">
              <li className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#F4C430] text-sm font-semibold text-[#0F3A5C]">
                  1
                </span>
                <span>
                  <strong>Verification:</strong> Our team will review your
                  listing within 24 hours
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#F4C430] text-sm font-semibold text-[#0F3A5C]">
                  2
                </span>
                <span>
                  <strong>Go Live:</strong> Once verified, your listing appears
                  in marketplace search results
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#F4C430] text-sm font-semibold text-[#0F3A5C]">
                  3
                </span>
                <span>
                  <strong>Connect:</strong> Buyers can send inquiries and you'll
                  receive email notifications
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#F4C430] text-sm font-semibold text-[#0F3A5C]">
                  4
                </span>
                <span>
                  <strong>Manage:</strong> Update your listing anytime from your
                  dashboard
                </span>
              </li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link href="/dashboard">
              <Button className="w-full gap-2 bg-[#F4C430] text-[#0F3A5C] hover:bg-[#F4C430]/90 sm:w-auto">
                <LayoutDashboard className="h-5 w-5" />
                Go to Dashboard
              </Button>
            </Link>

            <Link href="/browse">
              <Button variant="outline" className="w-full gap-2 sm:w-auto">
                <Search className="h-5 w-5" />
                Browse Marketplace
              </Button>
            </Link>

            <Link href="/">
              <Button variant="ghost" className="w-full gap-2 sm:w-auto">
                <Home className="h-5 w-5" />
                Home
              </Button>
            </Link>
          </div>

          {/* Support Info */}
          <div className="mt-8 rounded-lg border border-blue-200 bg-blue-50 p-4">
            <p className="text-sm text-blue-900">
              <strong>Need help?</strong> Contact our support team at{" "}
              <a
                href="mailto:support@abfi.com.au"
                className="font-semibold text-blue-700 hover:underline"
              >
                support@abfi.com.au
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
