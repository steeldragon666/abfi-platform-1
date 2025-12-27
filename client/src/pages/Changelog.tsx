/**
 * Changelog Page
 *
 * Displays version history and recent platform updates.
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sparkles,
  Bug,
  Wrench,
  Shield,
  Zap,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

interface ChangelogEntry {
  version: string;
  date: string;
  type: "major" | "minor" | "patch";
  changes: {
    category: "feature" | "fix" | "improvement" | "security" | "performance";
    description: string;
  }[];
}

const changelog: ChangelogEntry[] = [
  {
    version: "3.3.0",
    date: "2024-12-27",
    type: "minor",
    changes: [
      {
        category: "feature",
        description: "Integrated helpdesk widget with feedback submission",
      },
      {
        category: "improvement",
        description: "Quick access to help center, support, and changelog",
      },
    ],
  },
  {
    version: "3.2.0",
    date: "2024-12-27",
    type: "minor",
    changes: [
      {
        category: "feature",
        description: "Real-time notifications via Server-Sent Events (SSE)",
      },
      {
        category: "improvement",
        description: "Instant toast notifications for new activities",
      },
    ],
  },
  {
    version: "3.1.0",
    date: "2024-12-27",
    type: "minor",
    changes: [
      {
        category: "feature",
        description: "Added Sentry error tracking for improved error monitoring",
      },
      {
        category: "improvement",
        description: "Enhanced keyboard accessibility with WCAG 2.2 AA focus indicators",
      },
      {
        category: "feature",
        description: "Form auto-save for multi-step registration flows",
      },
      {
        category: "improvement",
        description: "Skip-to-main navigation link for screen reader users",
      },
    ],
  },
  {
    version: "3.0.0",
    date: "2024-12-20",
    type: "major",
    changes: [
      {
        category: "feature",
        description: "Evidence Vault with blockchain anchoring and IPFS storage",
      },
      {
        category: "feature",
        description: "Verifiable Credentials (W3C VC) issuance and verification",
      },
      {
        category: "feature",
        description: "Stealth Discovery with IP Australia patent search integration",
      },
      {
        category: "security",
        description: "Enhanced security headers and rate limiting",
      },
      {
        category: "performance",
        description: "Optimized bundle splitting for faster page loads",
      },
    ],
  },
  {
    version: "2.5.0",
    date: "2024-12-01",
    type: "minor",
    changes: [
      {
        category: "feature",
        description: "Grower registration flow with property mapping",
      },
      {
        category: "feature",
        description: "Futures marketplace for feedstock contracts",
      },
      {
        category: "improvement",
        description: "Redesigned grower-first UI with improved readability",
      },
      {
        category: "fix",
        description: "Fixed map rendering issues on mobile devices",
      },
    ],
  },
  {
    version: "2.0.0",
    date: "2024-11-15",
    type: "major",
    changes: [
      {
        category: "feature",
        description: "Bankability ratings and project assessment system",
      },
      {
        category: "feature",
        description: "Developer dashboard with project management",
      },
      {
        category: "feature",
        description: "Finance dashboard with lending sentiment analysis",
      },
      {
        category: "security",
        description: "Implemented secure session management",
      },
    ],
  },
];

const categoryIcons = {
  feature: Sparkles,
  fix: Bug,
  improvement: Wrench,
  security: Shield,
  performance: Zap,
};

const categoryColors = {
  feature: "bg-blue-100 text-blue-800",
  fix: "bg-red-100 text-red-800",
  improvement: "bg-amber-100 text-amber-800",
  security: "bg-green-100 text-green-800",
  performance: "bg-purple-100 text-purple-800",
};

const typeColors = {
  major: "bg-red-500",
  minor: "bg-blue-500",
  patch: "bg-gray-500",
};

export default function Changelog() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => setLocation("/")}
            className="mb-4 -ml-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Changelog</h1>
          <p className="mt-2 text-gray-600">
            Track the latest updates and improvements to the ABFI Platform.
          </p>
        </div>

        {/* Changelog entries */}
        <ScrollArea className="h-[calc(100vh-200px)]">
          <div className="space-y-6 pr-4">
            {changelog.map((entry) => (
              <Card key={entry.version} className="overflow-hidden">
                <CardHeader className="pb-3 border-b bg-gray-50/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CardTitle className="text-xl font-semibold">
                        v{entry.version}
                      </CardTitle>
                      <Badge
                        variant="secondary"
                        className={`${typeColors[entry.type]} text-white text-xs`}
                      >
                        {entry.type}
                      </Badge>
                    </div>
                    <time className="text-sm text-gray-500">{entry.date}</time>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  <ul className="space-y-3">
                    {entry.changes.map((change, idx) => {
                      const Icon = categoryIcons[change.category];
                      return (
                        <li
                          key={idx}
                          className="flex items-start gap-3"
                        >
                          <span
                            className={`inline-flex items-center justify-center w-6 h-6 rounded-full shrink-0 ${categoryColors[change.category]}`}
                          >
                            <Icon className="h-3.5 w-3.5" />
                          </span>
                          <span className="text-gray-700 leading-relaxed">
                            {change.description}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t text-center text-sm text-gray-500">
          <p>
            Have feedback or feature requests?{" "}
            <a
              href="mailto:support@abfi.com.au"
              className="text-blue-600 hover:underline"
            >
              Contact us
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
