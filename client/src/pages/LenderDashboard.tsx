/**
 * Lender Dashboard - Nextgen Design
 *
 * Features:
 * - Quick stats bar at top with icon + value + label pattern
 * - Card-based layout with consistent spacing
 * - Typography components for consistent styling
 */

import React from 'react';
import {
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  FileText,
  Activity,
  BarChart2,
  CheckCircle,
  Clock,
  XCircle,
  DollarSign,
  TrendingUp,
} from 'lucide-react';
import { H1, H2, H3, Body, MetricValue, DataLabel } from '@/components/Typography';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Link } from 'wouter';

// Quick stats for top bar
const QUICK_STATS = [
  { label: 'Portfolio Value', value: '$1.2B', icon: DollarSign, color: 'text-[#D4AF37]' },
  { label: 'Active Borrowers', value: '45', icon: BarChart2, color: 'text-blue-600' },
  { label: 'Avg Risk Score', value: 'B+', icon: ShieldCheck, color: 'text-purple-600' },
  { label: 'Breach Alerts', value: '2', icon: AlertTriangle, color: 'text-red-500' },
];

// Mock Data for Covenant Monitoring
const COVENANTS = [
  {
    id: 1,
    borrower: 'Alpha Corp',
    covenant: 'Debt Service Coverage Ratio (DSCR)',
    status: 'compliant',
    value: '1.45x (Min 1.25x)',
    lastCheck: '2025-12-20',
  },
  {
    id: 2,
    borrower: 'Beta Ltd',
    covenant: 'Liquidity Ratio',
    status: 'warning',
    value: '0.95x (Min 1.00x)',
    lastCheck: '2025-12-26',
  },
  {
    id: 3,
    borrower: 'Gamma Inc',
    covenant: 'Leverage Ratio',
    status: 'pending',
    value: '2.5x (Max 3.0x)',
    lastCheck: '2025-12-27',
  },
];

// Mock Data for Risk Matrix
const RISK_MATRIX = [
  { risk: 'High', count: 5, color: 'bg-red-500' },
  { risk: 'Medium', count: 12, color: 'bg-amber-500' },
  { risk: 'Low', count: 28, color: 'bg-green-500' },
];

// Status badge helper
const getStatusBadge = (status: string) => {
  switch (status) {
    case 'compliant':
      return (
        <Badge className="bg-green-100 text-green-800 border-green-200">
          <CheckCircle className="h-3 w-3 mr-1" />
          Verified
        </Badge>
      );
    case 'warning':
      return (
        <Badge className="bg-amber-100 text-amber-800 border-amber-200">
          <AlertTriangle className="h-3 w-3 mr-1" />
          Attention
        </Badge>
      );
    case 'pending':
      return (
        <Badge className="bg-gray-100 text-gray-800 border-gray-200">
          <Clock className="h-3 w-3 mr-1" />
          Pending
        </Badge>
      );
    case 'breach':
      return (
        <Badge className="bg-red-100 text-red-800 border-red-200">
          <XCircle className="h-3 w-3 mr-1" />
          Breach
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

const LenderDashboard: React.FC = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Quick Stats Bar */}
      <div className="border-b bg-card/50">
        <div className="container mx-auto px-4 py-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {QUICK_STATS.map((stat, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-muted/50 flex items-center justify-center">
                  <stat.icon className={cn("h-5 w-5", stat.color)} />
                </div>
                <div>
                  <MetricValue size="md">{stat.value}</MetricValue>
                  <DataLabel>{stat.label}</DataLabel>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#D4AF37]/10">
              <ShieldCheck className="h-6 w-6 text-[#D4AF37]" />
            </div>
            <div>
              <H1 className="text-2xl">Lender Dashboard</H1>
              <Body className="text-gray-600">Portfolio monitoring and covenant tracking</Body>
            </div>
          </div>
          <Link href="/bankability/assessment">
            <Button>
              <Activity className="h-4 w-4 mr-2" />
              New Assessment
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Covenant Monitoring - 2 columns */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <H3 className="flex items-center gap-2 !text-sm">
                <TrendingUp className="h-4 w-4 text-blue-600" />
                Covenant Monitoring
              </H3>
              <Badge variant="outline" className="text-xs">
                {COVENANTS.length} covenants
              </Badge>
            </div>

            <div className="space-y-3">
              {COVENANTS.map((covenant) => (
                <Card key={covenant.id} hover className="group">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Body className="font-medium text-sm truncate">
                            {covenant.covenant}
                          </Body>
                          {getStatusBadge(covenant.status)}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          <span>{covenant.borrower}</span>
                          <span>|</span>
                          <span className="font-mono">{covenant.value}</span>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" className="shrink-0">
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Breach Alerts Section */}
            <Card className="mt-6">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  Recent Breach Alerts
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center p-3 rounded-lg bg-red-50 border border-red-100">
                  <div>
                    <Body className="text-sm font-medium">Alpha Corp - DSCR Breach</Body>
                    <DataLabel className="text-xs">Requires immediate attention</DataLabel>
                  </div>
                  {getStatusBadge('breach')}
                </div>
                <div className="flex justify-between items-center p-3 rounded-lg bg-amber-50 border border-amber-100">
                  <div>
                    <Body className="text-sm font-medium">Beta Ltd - Liquidity Warning</Body>
                    <DataLabel className="text-xs">Below threshold</DataLabel>
                  </div>
                  {getStatusBadge('warning')}
                </div>
                <Link href="/audit-logs">
                  <Button variant="ghost" size="sm" className="w-full justify-start">
                    View All Alerts
                    <ArrowRight className="h-4 w-4 ml-auto" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Bankability Assessment Card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Bankability Assessment</CardTitle>
              </CardHeader>
              <CardContent>
                <Body className="text-sm text-gray-600 mb-4">
                  Initiate a new assessment for a potential or existing borrower.
                </Body>
                <Link href="/bankability/assessment">
                  <Button className="w-full">
                    <Activity className="h-4 w-4 mr-2" />
                    Start Assessment
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Risk Matrix Card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <ShieldCheck className="h-4 w-4 text-purple-600" />
                  Risk Matrix Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {RISK_MATRIX.map((item) => (
                  <div key={item.risk} className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className={cn("w-3 h-3 rounded-full", item.color)} />
                      <Body className="text-sm">{item.risk} Risk</Body>
                    </div>
                    <MetricValue size="sm">{item.count}</MetricValue>
                  </div>
                ))}
                <Link href="/lender/risk-analytics">
                  <Button variant="ghost" size="sm" className="w-full justify-start mt-2">
                    View Full Matrix
                    <ArrowRight className="h-4 w-4 ml-auto" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Audit Trail Card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <FileText className="h-4 w-4" />
                  Audit Trail
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Body className="text-sm text-gray-600 mb-4">
                  Access a full history of all platform actions and data changes.
                </Body>
                <Link href="/audit-logs">
                  <Button variant="outline" className="w-full">
                    Go to Audit Log
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LenderDashboard;
