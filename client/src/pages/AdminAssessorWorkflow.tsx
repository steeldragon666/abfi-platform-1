import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { CheckCircle, XCircle, Clock, AlertTriangle, Edit, Eye, TrendingUp, Shield, Download } from "lucide-react";
import { RatingBadge, ScoreBreakdown } from "@/components/ScoreCard";

export default function AdminAssessorWorkflow() {
  const { user, loading: authLoading } = useAuth();
  const [selectedAssessment, setSelectedAssessment] = useState<number | null>(null);
  const [adjustedScores, setAdjustedScores] = useState<Record<string, number>>({});
  const [overrideReason, setOverrideReason] = useState("");
  const [decision, setDecision] = useState<"approve" | "reject" | null>(null);

  // Fetch pending assessments
  const { data: assessments, isLoading, refetch } = trpc.bankability.listAssessments.useQuery();
  
  // Mutations
  const approveAssessment = trpc.bankability.approveAssessment.useMutation({
    onSuccess: () => {
      refetch();
      setSelectedAssessment(null);
      setAdjustedScores({});
      setOverrideReason("");
      setDecision(null);
    },
  });

  const rejectAssessment = trpc.bankability.rejectAssessment.useMutation({
    onSuccess: () => {
      refetch();
      setSelectedAssessment(null);
      setOverrideReason("");
      setDecision(null);
    },
  });

  const adjustScore = trpc.bankability.adjustAssessmentScore.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const downloadCertificate = trpc.bankability.downloadCertificate.useMutation({
    onSuccess: (data) => {
      // Convert base64 to blob and trigger download
      const byteCharacters = atob(data.data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: data.mimeType });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = data.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    },
  });

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Skeleton className="h-64 w-full max-w-2xl" />
      </div>
    );
  }

  // Check admin permissions
  if (user.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="py-12 text-center">
            <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
            <p className="text-sm text-muted-foreground">
              You don't have permission to access the assessor workflow.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container py-8">
          <Skeleton className="h-8 w-64 mb-8" />
          <div className="grid gap-6">
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
          </div>
        </div>
      </div>
    );
  }

  const pendingAssessments = assessments?.filter((a: any) => a.status === "under_review") || [];
  const approvedAssessments = assessments?.filter((a: any) => a.status === "approved") || [];
  const rejectedAssessments = assessments?.filter((a: any) => a.status === "rejected") || [];

  const selectedAssessmentData = assessments?.find((a: any) => a.id === selectedAssessment);

  const handleScoreAdjustment = (category: string, newScore: number) => {
    setAdjustedScores(prev => ({
      ...prev,
      [category]: newScore,
    }));
  };

  const handleApprove = async () => {
    if (!selectedAssessment) return;

    // If scores were adjusted, save them first
    if (Object.keys(adjustedScores).length > 0) {
      await adjustScore.mutateAsync({
        assessmentId: selectedAssessment,
        adjustedScores,
        reason: overrideReason,
      });
    }

    // Approve the assessment
    await approveAssessment.mutateAsync({
      assessmentId: selectedAssessment,
      approverNotes: overrideReason || "Assessment approved without modifications",
    });
  };

  const handleReject = async () => {
    if (!selectedAssessment || !overrideReason) return;

    await rejectAssessment.mutateAsync({
      assessmentId: selectedAssessment,
      rejectionReason: overrideReason,
    });
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-AU", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case "rejected":
        return <XCircle className="h-5 w-5 text-red-600" />;
      case "pending_review":
        return <Clock className="h-5 w-5 text-yellow-600" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      case "pending_review":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Assessor Workflow</h1>
          </div>
          <p className="text-muted-foreground">
            Review and approve bankability assessments for bioenergy projects
          </p>
        </div>

        <Tabs defaultValue="pending" className="space-y-6">
          <TabsList>
            <TabsTrigger value="pending">
              Pending Review ({pendingAssessments.length})
            </TabsTrigger>
            <TabsTrigger value="approved">
              Approved ({approvedAssessments.length})
            </TabsTrigger>
            <TabsTrigger value="rejected">
              Rejected ({rejectedAssessments.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-6">
            {pendingAssessments.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">All Caught Up!</h3>
                  <p className="text-sm text-muted-foreground">
                    No pending assessments to review at this time.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6">
                {pendingAssessments.map((assessment: any) => (
                  <Card key={assessment.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-xl mb-2">
                            Assessment #{assessment.assessmentNumber}
                          </CardTitle>
                          <CardDescription>
                            Project ID: {assessment.projectId} • Assessed on {formatDate(assessment.assessmentDate)}
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(assessment.status)}
                          <Badge className={getStatusColor(assessment.status)}>
                            {assessment.status.replace("_", " ")}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {/* Current Rating */}
                        <div className="flex items-center gap-4">
                          <div>
                            <p className="text-sm text-muted-foreground mb-1">Current Rating</p>
                           <RatingBadge rating={assessment.rating} size="lg" />                       </div>
                          <div>
                            <p className="text-sm text-muted-foreground mb-1">Composite Score</p>
                            <p className="text-2xl font-bold">{assessment.compositeScore}/100</p>
                          </div>
                        </div>

                        {/* Score Breakdown */}
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Volume Security</p>
                            <p className="text-lg font-semibold">{assessment.volumeSecurityScore}</p>
                            <p className="text-xs text-muted-foreground">30% weight</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Counterparty Quality</p>
                            <p className="text-lg font-semibold">{assessment.counterpartyQualityScore}</p>
                            <p className="text-xs text-muted-foreground">25% weight</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Contract Structure</p>
                            <p className="text-lg font-semibold">{assessment.contractStructureScore}</p>
                            <p className="text-xs text-muted-foreground">20% weight</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Concentration Risk</p>
                            <p className="text-lg font-semibold">{assessment.concentrationRiskScore}</p>
                            <p className="text-xs text-muted-foreground">15% weight</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Operational Readiness</p>
                            <p className="text-lg font-semibold">{assessment.operationalReadinessScore}</p>
                            <p className="text-xs text-muted-foreground">10% weight</p>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 pt-4">
                          <Button
                            variant="outline"
                            onClick={() => {
                              setSelectedAssessment(assessment.id);
                              setDecision(null);
                              setAdjustedScores({});
                              setOverrideReason("");
                            }}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Review & Adjust
                          </Button>
                        </div>

                        {/* Review Panel */}
                        {selectedAssessment === assessment.id && (
                          <div className="mt-6 p-6 border rounded-lg bg-muted/50 space-y-6">
                            <h4 className="font-semibold text-lg">Assessment Review</h4>

                            {/* Score Adjustments */}
                            <div className="space-y-4">
                              <Label>Adjust Scores (Optional)</Label>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {[
                                  { key: "volumeSecurity", label: "Volume Security", current: assessment.volumeSecurityScore },
                                  { key: "counterpartyQuality", label: "Counterparty Quality", current: assessment.counterpartyQualityScore },
                                  { key: "contractStructure", label: "Contract Structure", current: assessment.contractStructureScore },
                                  { key: "concentrationRisk", label: "Concentration Risk", current: assessment.concentrationRiskScore },
                                  { key: "operationalReadiness", label: "Operational Readiness", current: assessment.operationalReadinessScore },
                                ].map((score) => (
                                  <div key={score.key}>
                                    <Label className="text-sm">{score.label}</Label>
                                    <div className="flex items-center gap-2 mt-1">
                                      <Input
                                        type="number"
                                        min="0"
                                        max="100"
                                        defaultValue={score.current}
                                        onChange={(e) => handleScoreAdjustment(score.key, parseInt(e.target.value))}
                                        className="w-24"
                                      />
                                      <span className="text-sm text-muted-foreground">
                                        (Original: {score.current})
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Override Reason */}
                            <div className="space-y-2">
                              <Label>Notes / Override Reason {decision === "reject" && <span className="text-red-600">*</span>}</Label>
                              <Textarea
                                value={overrideReason}
                                onChange={(e) => setOverrideReason(e.target.value)}
                                placeholder="Provide justification for any score adjustments or rejection..."
                                rows={4}
                              />
                            </div>

                            {/* Decision Buttons */}
                            <div className="flex gap-3">
                              <Button
                                onClick={handleApprove}
                                disabled={approveAssessment.isPending}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Approve Assessment
                              </Button>
                              <Button
                                variant="destructive"
                                onClick={() => setDecision("reject")}
                                disabled={!overrideReason}
                              >
                                <XCircle className="h-4 w-4 mr-2" />
                                Reject Assessment
                              </Button>
                              <Button
                                variant="outline"
                                onClick={() => {
                                  setSelectedAssessment(null);
                                  setDecision(null);
                                  setAdjustedScores({});
                                  setOverrideReason("");
                                }}
                              >
                                Cancel
                              </Button>
                            </div>

                            {/* Rejection Confirmation */}
                            {decision === "reject" && (
                              <div className="p-4 border border-red-200 rounded-lg bg-red-50">
                                <p className="text-sm font-semibold text-red-900 mb-2">
                                  Are you sure you want to reject this assessment?
                                </p>
                                <p className="text-sm text-red-700 mb-4">
                                  This action will require the project developer to resubmit.
                                </p>
                                <div className="flex gap-2">
                                  <Button
                                    variant="destructive"
                                    onClick={handleReject}
                                    disabled={rejectAssessment.isPending || !overrideReason}
                                  >
                                    Confirm Rejection
                                  </Button>
                                  <Button
                                    variant="outline"
                                    onClick={() => setDecision(null)}
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="approved" className="space-y-6">
            {approvedAssessments.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-sm text-muted-foreground">
                    No approved assessments yet.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {approvedAssessments.map((assessment: any) => (
                  <Card key={assessment.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle>Assessment #{assessment.assessmentNumber}</CardTitle>
                          <CardDescription>
                            Approved on {formatDate(assessment.updatedAt)}
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-3">
                          <RatingBadge rating={assessment.rating} />
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => downloadCertificate.mutate({ assessmentId: assessment.id })}
                            disabled={downloadCertificate.isPending}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            {downloadCertificate.isPending ? 'Generating...' : 'Download Certificate'}
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="rejected" className="space-y-6">
            {rejectedAssessments.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <XCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-sm text-muted-foreground">
                    No rejected assessments.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {rejectedAssessments.map((assessment: any) => (
                  <Card key={assessment.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle>Assessment #{assessment.assessmentNumber}</CardTitle>
                          <CardDescription>
                            Rejected on {formatDate(assessment.updatedAt)}
                          </CardDescription>
                        </div>
                        <Badge variant="destructive">Rejected</Badge>
                      </div>
                    </CardHeader>
                    {assessment.reassessmentReason && (
                      <CardContent>
                        <p className="text-sm text-muted-foreground">
                          <strong>Reason:</strong> {assessment.reassessmentReason}
                        </p>
                      </CardContent>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
