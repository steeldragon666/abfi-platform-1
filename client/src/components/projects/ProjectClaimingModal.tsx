/**
 * Project Claiming Modal Component
 * Allows project developers to claim projects and upload evidence for reassessment
 */

import React, { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  X,
  Upload,
  FileText,
  CheckCircle,
  AlertTriangle,
  Clock,
  Award,
  Target,
  TrendingUp,
  Shield,
  Users,
  FileCheck
} from 'lucide-react';

interface ProjectClaimingModalProps {
  project: any;
  isOpen: boolean;
  onClose: () => void;
  onClaimSuccess?: () => void;
}

const PILLAR_INFO = {
  volume_security: {
    name: "Volume Security",
    description: "Reliability of feedstock supply, contract terms, production capacity, weather/climate resilience",
    icon: Shield,
    color: "blue"
  },
  counterparty_quality: {
    name: "Counterparty Quality",
    description: "Financial strength, track record, credit rating of all parties",
    icon: Users,
    color: "green"
  },
  contract_structure: {
    name: "Contract Structure",
    description: "Binding agreements, offtake terms, duration, price mechanisms",
    icon: FileCheck,
    color: "purple"
  },
  concentration_risk: {
    name: "Concentration Risk",
    description: "Exposure to single points of failure (suppliers, buyers, geography)",
    icon: Target,
    color: "orange"
  },
  operational_readiness: {
    name: "Operational Readiness",
    description: "Technology readiness, management capability, timeline to production",
    icon: Award,
    color: "teal"
  }
};

export function ProjectClaimingModal({ project, isOpen, onClose, onClaimSuccess }: ProjectClaimingModalProps) {
  const [activeTab, setActiveTab] = useState<'claim' | 'evidence' | 'services'>('claim');
  const [claimReason, setClaimReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Evidence upload state
  const [evidenceType, setEvidenceType] = useState<'document' | 'certificate' | 'contract' | 'permit' | 'assessment' | 'other'>('document');
  const [evidenceTitle, setEvidenceTitle] = useState('');
  const [evidenceDescription, setEvidenceDescription] = useState('');
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  const [relevantPillars, setRelevantPillars] = useState<string[]>([]);

  // Service request state
  const [serviceDescription, setServiceDescription] = useState('');
  const [selectedSuggestion, setSelectedSuggestion] = useState<any>(null);

  // API calls
  const claimMutation = trpc.abfiProjects.claimProject.useMutation();
  const evidenceMutation = trpc.abfiProjects.uploadEvidence.useMutation();
  const serviceMutation = trpc.abfiProjects.requestImprovementService.useMutation();
  const { data: improvementData } = trpc.abfiProjects.getImprovementSuggestions.useQuery(
    { assessmentId: project?.assessmentId },
    { enabled: !!project?.assessmentId && isOpen }
  );

  const handleClaim = async () => {
    if (!claimReason.trim()) return;

    setIsSubmitting(true);
    try {
      await claimMutation.mutateAsync({
        assessmentId: project.assessmentId,
        claimReason: claimReason.trim(),
      });
      onClaimSuccess?.();
      onClose();
    } catch (error) {
      console.error('Claim failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEvidenceUpload = async () => {
    if (!evidenceTitle.trim() || !evidenceDescription.trim()) return;

    setIsSubmitting(true);
    try {
      await evidenceMutation.mutateAsync({
        assessmentId: project.assessmentId,
        evidenceType,
        title: evidenceTitle.trim(),
        description: evidenceDescription.trim(),
        relevantPillars,
        // Note: In a real implementation, you'd upload the file to S3 first
        // documentUrl: uploadedFileUrl,
        // documentKey: uploadedFileKey,
      });

      // Reset form
      setEvidenceTitle('');
      setEvidenceDescription('');
      setEvidenceFile(null);
      setRelevantPillars([]);
    } catch (error) {
      console.error('Evidence upload failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleServiceRequest = async (suggestion?: any) => {
    const description = suggestion?.serviceDescription || serviceDescription.trim();
    if (!description) return;

    setIsSubmitting(true);
    try {
      await serviceMutation.mutateAsync({
        assessmentId: project.assessmentId,
        improvementId: suggestion?.id || 0,
        serviceDescription: description,
      });

      setServiceDescription('');
      setSelectedSuggestion(null);
    } catch (error) {
      console.error('Service request failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !project) return null;

  const tierColors = {
    1: { bg: 'bg-green-100', border: 'border-green-300', text: 'text-green-800' },
    2: { bg: 'bg-amber-100', border: 'border-amber-300', text: 'text-amber-800' },
    3: { bg: 'bg-orange-100', border: 'border-orange-300', text: 'text-orange-800' },
    4: { bg: 'bg-red-100', border: 'border-red-300', text: 'text-red-800' },
  };

  const currentTierColors = tierColors[project.tier as keyof typeof tierColors];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[2000] flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-start gap-4">
              <div className={cn(
                "w-12 h-12 rounded-full border-2 flex items-center justify-center text-white font-bold",
                currentTierColors.bg,
                currentTierColors.border
              )}>
                {project.rank || '?'}
              </div>
              <div>
                <h2 className="text-2xl font-bold">{project.projectName}</h2>
                <p className="text-gray-600">{project.shortName}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge className={cn("font-medium", currentTierColors.bg, currentTierColors.border, currentTierColors.text)}>
                    Tier {project.tier}: {project.tierLabel}
                  </Badge>
                  <Badge variant="outline">
                    Score: {project.overallScore}/10
                  </Badge>
                  <Badge variant="secondary">
                    Rating: {project.rating}
                  </Badge>
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="claim">Claim Project</TabsTrigger>
              <TabsTrigger value="evidence">Upload Evidence</TabsTrigger>
              <TabsTrigger value="services">ABFI Services</TabsTrigger>
            </TabsList>

            {/* Claim Project Tab */}
            <TabsContent value="claim" className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-blue-900">Project Claiming Process</h3>
                    <p className="text-sm text-blue-700 mt-1">
                      By claiming this project, you confirm you are authorized to represent this development.
                      ABFI will verify your claim and may request additional documentation.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="claim-reason">Claim Justification *</Label>
                  <Textarea
                    id="claim-reason"
                    placeholder="Please explain your relationship to this project and why you should be granted access to manage its profile..."
                    value={claimReason}
                    onChange={(e) => setClaimReason(e.target.value)}
                    className="mt-1"
                    rows={4}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Minimum 50 characters. Be specific about your role and authorization.
                  </p>
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={handleClaim}
                    disabled={!claimReason.trim() || claimReason.length < 50 || isSubmitting}
                    className="flex-1"
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Claim'}
                  </Button>
                  <Button variant="outline" onClick={onClose}>
                    Cancel
                  </Button>
                </div>
              </div>
            </TabsContent>

            {/* Upload Evidence Tab */}
            <TabsContent value="evidence" className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-green-900">Evidence Upload</h3>
                    <p className="text-sm text-green-700 mt-1">
                      Upload documents, certificates, or other evidence that demonstrates improvements
                      to your project's bankability. ABFI will review and may reassess your score.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="evidence-type">Evidence Type *</Label>
                    <select
                      id="evidence-type"
                      value={evidenceType}
                      onChange={(e) => setEvidenceType(e.target.value as any)}
                      className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="document">Document</option>
                      <option value="certificate">Certificate</option>
                      <option value="contract">Contract</option>
                      <option value="permit">Permit/License</option>
                      <option value="assessment">Assessment Report</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="evidence-title">Title *</Label>
                    <Input
                      id="evidence-title"
                      placeholder="Brief title for this evidence"
                      value={evidenceTitle}
                      onChange={(e) => setEvidenceTitle(e.target.value)}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="evidence-description">Description *</Label>
                    <Textarea
                      id="evidence-description"
                      placeholder="Describe what this evidence demonstrates and how it improves your project's bankability..."
                      value={evidenceDescription}
                      onChange={(e) => setEvidenceDescription(e.target.value)}
                      className="mt-1"
                      rows={3}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label>Relevant Pillars</Label>
                    <p className="text-xs text-gray-500 mb-2">Select which ABFI assessment pillars this evidence addresses:</p>
                    <div className="space-y-2">
                      {Object.entries(PILLAR_INFO).map(([key, info]) => {
                        const Icon = info.icon;
                        const isSelected = relevantPillars.includes(key);

                        return (
                          <div
                            key={key}
                            className={cn(
                              "flex items-center gap-2 p-2 rounded border cursor-pointer transition-colors",
                              isSelected ? "border-blue-300 bg-blue-50" : "border-gray-200 hover:border-gray-300"
                            )}
                            onClick={() => {
                              setRelevantPillars(prev =>
                                prev.includes(key)
                                  ? prev.filter(p => p !== key)
                                  : [...prev, key]
                              );
                            }}
                          >
                            <Icon className="w-4 h-4 text-gray-600" />
                            <span className="text-sm font-medium">{info.name}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* File upload placeholder */}
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">File upload functionality will be implemented</p>
                    <p className="text-xs text-gray-500 mt-1">Supported: PDF, DOC, XLS, Images</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <Button
                  onClick={handleEvidenceUpload}
                  disabled={!evidenceTitle.trim() || !evidenceDescription.trim() || isSubmitting}
                  className="flex-1"
                >
                  {isSubmitting ? 'Uploading...' : 'Upload Evidence'}
                </Button>
                <Button variant="outline" onClick={onClose}>
                  Cancel
                </Button>
              </div>
            </TabsContent>

            {/* ABFI Services Tab */}
            <TabsContent value="services" className="space-y-4">
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <TrendingUp className="w-5 h-5 text-purple-600 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-purple-900">ABFI Bankability Improvement Services</h3>
                    <p className="text-sm text-purple-700 mt-1">
                      Get expert assistance to improve your project's bankability score.
                      Our consultants can help with contract structuring, feedstock agreements, and compliance.
                    </p>
                  </div>
                </div>
              </div>

              {/* Suggested improvements */}
              {improvementData?.suggestedImprovements && improvementData.suggestedImprovements.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3">Suggested Improvements</h3>
                  <div className="space-y-3">
                    {improvementData.suggestedImprovements.map((suggestion: any, index: number) => {
                      const pillarInfo = PILLAR_INFO[suggestion.pillarName as keyof typeof PILLAR_INFO];
                      const Icon = pillarInfo?.icon || Target;

                      return (
                        <Card key={index} className="border-l-4 border-l-blue-500">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex items-start gap-3">
                                <Icon className="w-5 h-5 text-blue-600 mt-1" />
                                <div className="flex-1">
                                  <h4 className="font-medium">{suggestion.title}</h4>
                                  <p className="text-sm text-gray-600 mt-1">{suggestion.description}</p>
                                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                                    <span>Impact: +{suggestion.estimatedImpact} points</span>
                                    <span>Complexity: {suggestion.implementationComplexity}</span>
                                    {suggestion.timelineMonths && (
                                      <span>Timeline: {suggestion.timelineMonths} months</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleServiceRequest(suggestion)}
                                disabled={isSubmitting}
                              >
                                Request Service
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Custom service request */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Custom Service Request</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="service-description">Service Description</Label>
                      <Textarea
                        id="service-description"
                        placeholder="Describe the specific ABFI service you need to improve your project's bankability..."
                        value={serviceDescription}
                        onChange={(e) => setServiceDescription(e.target.value)}
                        className="mt-1"
                        rows={3}
                      />
                    </div>
                    <Button
                      onClick={() => handleServiceRequest()}
                      disabled={!serviceDescription.trim() || isSubmitting}
                    >
                      {isSubmitting ? 'Submitting...' : 'Request Custom Service'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}