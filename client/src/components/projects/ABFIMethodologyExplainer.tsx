/**
 * ABFI 5-Pillar Methodology Explainer Component
 * Educational content explaining the bankability assessment framework
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/Button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  Shield,
  Users,
  FileCheck,
  Target,
  Award,
  ChevronDown,
  ChevronRight,
  Info,
  AlertTriangle,
  CheckCircle,
  X
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

interface ABFIMethodologyExplainerProps {
  isOpen: boolean;
  onClose: () => void;
}

const PILLARS = [
  {
    key: 'volume_security',
    name: 'Volume Security',
    weight: '20%',
    icon: Shield,
    color: 'blue',
    description: 'Reliability of feedstock supply, contract terms, production capacity, weather/climate resilience',
    scoring: [
      { range: '9-10', label: 'Excellent', description: 'Continuous supply guaranteed, weather-independent, long-term contracts' },
      { range: '7-8', label: 'Good', description: 'Reliable supply with some weather exposure, multi-year contracts' },
      { range: '5-6', label: 'Fair', description: 'Seasonal supply with weather risk, short-term contracts' },
      { range: '3-4', label: 'Poor', description: 'High weather dependency, spot market reliance' },
      { range: '1-2', label: 'Critical', description: 'No secured supply, extreme weather vulnerability' }
    ],
    examples: [
      '✓ Wastewater biogas: Population-driven, 24/7 supply',
      '✓ Long-term grower contracts (5+ years)',
      '✓ Multiple feedstock sources',
      '✗ Single seasonal crop',
      '✗ Spot market dependency'
    ]
  },
  {
    key: 'counterparty_quality',
    name: 'Counterparty Quality',
    weight: '20%',
    icon: Users,
    color: 'green',
    description: 'Financial strength, track record, credit rating of all parties',
    scoring: [
      { range: '9-10', label: 'Excellent', description: 'Investment-grade utilities/governments' },
      { range: '7-8', label: 'Good', description: 'ASX-listed companies, strong balance sheets' },
      { range: '5-6', label: 'Fair', description: 'Private companies with proven track record' },
      { range: '3-4', label: 'Poor', description: 'Small private companies, limited financials' },
      { range: '1-2', label: 'Critical', description: 'Unknown entities, poor track record' }
    ],
    examples: [
      '✓ Government utilities (Sydney Water, Jemena)',
      '✓ ASX-listed companies (Ampol, GrainCorp)',
      '✓ Investment-grade offtakers',
      '✗ Small private companies',
      '✗ Unproven entities'
    ]
  },
  {
    key: 'contract_structure',
    name: 'Contract Structure',
    weight: '20%',
    icon: FileCheck,
    color: 'purple',
    description: 'Binding agreements, offtake terms, duration, price mechanisms',
    scoring: [
      { range: '9-10', label: 'Excellent', description: 'Take-or-pay, CPI escalation, 8+ years' },
      { range: '7-8', label: 'Good', description: 'Firm contracts, price mechanisms, 5+ years' },
      { range: '5-6', label: 'Fair', description: 'Basic contracts, some price protection' },
      { range: '3-4', label: 'Poor', description: 'MOU stage, no binding commitments' },
      { range: '1-2', label: 'Critical', description: 'No contracts, verbal agreements only' }
    ],
    examples: [
      '✓ Take-or-pay agreements',
      '✓ CPI + escalation clauses',
      '✓ Long-term contracts (8+ years)',
      '✗ MOUs without binding commitments',
      '✗ No offtake agreements'
    ]
  },
  {
    key: 'concentration_risk',
    name: 'Concentration Risk',
    weight: '20%',
    icon: Target,
    color: 'orange',
    description: 'Exposure to single points of failure (suppliers, buyers, geography)',
    scoring: [
      { range: '9-10', label: 'Excellent', description: 'Multiple suppliers/buyers, geographic diversity' },
      { range: '7-8', label: 'Good', description: 'Some diversification, limited single points' },
      { range: '5-6', label: 'Fair', description: 'Single supplier/buyer but reliable' },
      { range: '3-4', label: 'Poor', description: 'Significant concentration risk' },
      { range: '1-2', label: 'Critical', description: 'Extreme concentration, single facility' }
    ],
    examples: [
      '✓ Multiple feedstock suppliers',
      '✓ Multiple offtake partners',
      '✓ Geographic diversification',
      '✗ Single facility, single supplier',
      '✗ Single customer dependency'
    ]
  },
  {
    key: 'operational_readiness',
    name: 'Operational Readiness',
    weight: '20%',
    icon: Award,
    color: 'teal',
    description: 'Technology readiness, management capability, timeline to production',
    scoring: [
      { range: '9-10', label: 'Excellent', description: 'Operational/commercial proven technology' },
      { range: '7-8', label: 'Good', description: 'FID achieved, construction underway' },
      { range: '5-6', label: 'Fair', description: 'FEED complete, FID pending' },
      { range: '3-4', label: 'Poor', description: 'Pre-FEED, technology unproven' },
      { range: '1-2', label: 'Critical', description: 'No progress, fundamental issues' }
    ],
    examples: [
      '✓ Proven technology at commercial scale',
      '✓ FID achieved and under construction',
      '✓ Experienced management team',
      '✗ Pre-commercial technology',
      '✗ No construction progress'
    ]
  }
];

const RATING_SCALE = [
  { rating: 'AA', tier: 1, label: 'Investment Grade', minScore: 8.5, description: 'Suitable for conventional project finance' },
  { rating: 'A', tier: 1, label: 'Investment Grade', minScore: 7.5, description: 'Suitable for conventional project finance' },
  { rating: 'BBB', tier: 1, label: 'Bankable', minScore: 6.5, description: 'Suitable for conventional project finance' },
  { rating: 'BB', tier: 2, label: 'Development Stage', minScore: 5.5, description: 'Requires further development before bankability' },
  { rating: 'B', tier: 2, label: 'Development Stage', minScore: 4.5, description: 'Requires further development before bankability' },
  { rating: 'B-', tier: 3, label: 'High Risk', minScore: 4.0, description: 'Speculative; suitable only for venture/impact capital' },
  { rating: 'CCC', tier: 3, label: 'High Risk', minScore: 3.5, description: 'Speculative; suitable only for venture/impact capital' },
  { rating: 'CC', tier: 4, label: 'Non-Investable', minScore: 2.5, description: 'Failed or fundamentally flawed projects' },
  { rating: 'C', tier: 4, label: 'Non-Investable', minScore: 1.5, description: 'Failed or fundamentally flawed projects' },
  { rating: 'D', tier: 4, label: 'Non-Investable', minScore: 0.0, description: 'Failed or fundamentally flawed projects' }
];

export function ABFIMethodologyExplainer({ isOpen, onClose }: ABFIMethodologyExplainerProps) {
  const [expandedPillars, setExpandedPillars] = useState<Set<string>>(new Set());

  const togglePillar = (pillarKey: string) => {
    const newExpanded = new Set(expandedPillars);
    if (newExpanded.has(pillarKey)) {
      newExpanded.delete(pillarKey);
    } else {
      newExpanded.add(pillarKey);
    }
    setExpandedPillars(newExpanded);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[2000] flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold">ABFI 5-Pillar Bankability Assessment</h2>
              <p className="text-gray-600 mt-1">
                Understanding how projects are evaluated for investment readiness
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Overview */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="w-5 h-5 text-blue-600" />
                Assessment Framework Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-3">5-Pillar Scoring Model</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Each project is evaluated across five equally-weighted pillars (20% each) on a 1-10 scale.
                    The overall score determines the project's rating and tier classification.
                  </p>

                  <div className="space-y-2">
                    {PILLARS.map(pillar => {
                      const Icon = pillar.icon;
                      return (
                        <div key={pillar.key} className="flex items-center gap-3 p-2 rounded bg-gray-50">
                          <Icon className="w-5 h-5 text-gray-600" />
                          <div className="flex-1">
                            <span className="font-medium text-sm">{pillar.name}</span>
                            <span className="text-xs text-gray-500 ml-2">({pillar.weight})</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-3">Rating & Tier System</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Projects are assigned credit ratings similar to traditional bond ratings,
                    grouped into four tiers based on investment readiness.
                  </p>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-green-500 rounded"></div>
                      <span className="text-sm font-medium">Tier 1: Bankable</span>
                      <span className="text-xs text-gray-500">(Score ≥6.5)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-amber-500 rounded"></div>
                      <span className="text-sm font-medium">Tier 2: Development Stage</span>
                      <span className="text-xs text-gray-500">(Score 5.0-6.5)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-orange-500 rounded"></div>
                      <span className="text-sm font-medium">Tier 3: High Risk</span>
                      <span className="text-xs text-gray-500">(Score 3.5-5.0)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-red-500 rounded"></div>
                      <span className="text-sm font-medium">Tier 4: Non-Investable</span>
                      <span className="text-xs text-gray-500">(Score &lt;3.5)</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pillar Details */}
          <div className="space-y-4 mb-6">
            <h3 className="text-xl font-bold">Pillar Scoring Methodology</h3>

            {PILLARS.map(pillar => {
              const Icon = pillar.icon;
              const isExpanded = expandedPillars.has(pillar.key);

              return (
                <Card key={pillar.key} className="border-l-4 border-l-blue-500">
                  <Collapsible open={isExpanded} onOpenChange={() => togglePillar(pillar.key)}>
                    <CollapsibleTrigger asChild>
                      <CardHeader className="cursor-pointer hover:bg-gray-50">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Icon className={cn("w-6 h-6", `text-${pillar.color}-600`)} />
                            <div>
                              <CardTitle className="text-lg">{pillar.name}</CardTitle>
                              <p className="text-sm text-gray-600 mt-1">{pillar.description}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{pillar.weight}</Badge>
                            {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                          </div>
                        </div>
                      </CardHeader>
                    </CollapsibleTrigger>

                    <CollapsibleContent>
                      <CardContent className="pt-0">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          {/* Scoring Scale */}
                          <div>
                            <h4 className="font-semibold mb-3">Scoring Scale</h4>
                            <div className="space-y-2">
                              {pillar.scoring.map((score, index) => (
                                <div key={index} className="flex items-start gap-3 p-2 rounded bg-gray-50">
                                  <Badge variant="outline" className="mt-0.5">{score.range}</Badge>
                                  <div>
                                    <div className="font-medium text-sm">{score.label}</div>
                                    <div className="text-xs text-gray-600">{score.description}</div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Examples */}
                          <div>
                            <h4 className="font-semibold mb-3">Examples</h4>
                            <div className="space-y-1">
                              {pillar.examples.map((example, index) => (
                                <div key={index} className="flex items-center gap-2 text-sm">
                                  <span className={example.startsWith('✓') ? 'text-green-600' : 'text-red-600'}>
                                    {example.startsWith('✓') ? '✓' : '✗'}
                                  </span>
                                  <span className={example.startsWith('✓') ? 'text-gray-900' : 'text-gray-600'}>
                                    {example.substring(1).trim()}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </CollapsibleContent>
                  </Collapsible>
                </Card>
              );
            })}
          </div>

          {/* Rating Scale Table */}
          <Card>
            <CardHeader>
              <CardTitle>Complete Rating Scale</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 font-semibold">Rating</th>
                      <th className="text-left py-2 font-semibold">Tier</th>
                      <th className="text-left py-2 font-semibold">Label</th>
                      <th className="text-left py-2 font-semibold">Min Score</th>
                      <th className="text-left py-2 font-semibold">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {RATING_SCALE.map((rating, index) => (
                      <tr key={index} className="border-b border-gray-100">
                        <td className="py-2 font-medium">{rating.rating}</td>
                        <td className="py-2">{rating.tier}</td>
                        <td className="py-2">
                          <Badge variant={rating.tier === 1 ? "default" : "secondary"}>
                            {rating.label}
                          </Badge>
                        </td>
                        <td className="py-2">{rating.minScore}</td>
                        <td className="py-2 text-gray-600">{rating.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Key Insights */}
          <Alert className="mt-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Key Insights from Current Assessments:</strong>
              <ul className="mt-2 space-y-1 text-sm">
                <li>• Only 2 of 11 assessed projects achieve bankable status (18%)</li>
                <li>• 4 projects have been on hold or failed for 7-20+ years</li>
                <li>• Biomethane projects outperform SAF/ethanol on bankability due to proven technology and reliable feedstocks</li>
                <li>• Policy uncertainty remains primary barrier for SAF projects with otherwise strong fundamentals</li>
              </ul>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    </div>
  );
}