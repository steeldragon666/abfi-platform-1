import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  FileText,
  Calendar,
  DollarSign,
  Shield,
  AlertCircle,
} from "lucide-react";

export default function SupplyAgreements() {
  const { projectId } = useParams<{ projectId: string }>();
  const [, setLocation] = useLocation();

  const { data: project, isLoading: projectLoading } =
    trpc.bankability.getProjectById.useQuery(
      { id: parseInt(projectId!) },
      { enabled: !!projectId }
    );

  const { data: agreements, isLoading: agreementsLoading } =
    trpc.bankability.getProjectAgreements.useQuery(
      { projectId: parseInt(projectId!) },
      { enabled: !!projectId }
    );

  if (projectLoading || agreementsLoading) {
    return (
      <div className="container py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="container py-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-gray-600">Project not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Group agreements by tier
  const tier1Agreements = agreements?.filter(a => a.tier === "tier1") || [];
  const tier2Agreements = agreements?.filter(a => a.tier === "tier2") || [];
  const optionAgreements = agreements?.filter(a => a.tier === "option") || [];
  const rofrAgreements = agreements?.filter(a => a.tier === "rofr") || [];

  // Calculate supply position
  const tier1Volume = tier1Agreements
    .filter(a => a.status === "active" || a.status === "executed")
    .reduce((sum, a) => sum + a.annualVolume, 0);
  const tier2Volume = tier2Agreements
    .filter(a => a.status === "active" || a.status === "executed")
    .reduce((sum, a) => sum + a.annualVolume, 0);
  const optionVolume = optionAgreements
    .filter(a => a.status === "active" || a.status === "executed")
    .reduce((sum, a) => sum + a.annualVolume, 0);
  const rofrVolume = rofrAgreements
    .filter(a => a.status === "active" || a.status === "executed")
    .reduce((sum, a) => sum + a.annualVolume, 0);

  const capacity = project.nameplateCapacity || 1;
  const tier1Percent = (tier1Volume / capacity) * 100;
  const tier2Percent = (tier2Volume / capacity) * 100;
  const optionPercent = (optionVolume / capacity) * 100;
  const rofrPercent = (rofrVolume / capacity) * 100;
  const totalPercent =
    tier1Percent + tier2Percent + optionPercent + rofrPercent;

  const getTierBadgeColor = (tier: string) => {
    switch (tier) {
      case "tier1":
        return "bg-green-100 text-green-800 border-green-300";
      case "tier2":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "option":
        return "bg-purple-100 text-purple-800 border-purple-300";
      case "rofr":
        return "bg-orange-100 text-orange-800 border-orange-300";
      default:
        return "";
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "executed":
        return "bg-blue-100 text-blue-800";
      case "negotiation":
        return "bg-yellow-100 text-yellow-800";
      case "draft":
        return "bg-gray-100 text-gray-800";
      case "suspended":
        return "bg-red-100 text-red-800";
      case "terminated":
        return "bg-red-100 text-red-800";
      default:
        return "";
    }
  };

  const formatPricingMechanism = (mechanism: string) => {
    return mechanism
      .split("_")
      .map(w => w ? w.charAt(0).toUpperCase() + w.slice(1) : "")
      .join(" ");
  };

  const AgreementCard = ({ agreement }: { agreement: any }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg">
              {agreement.supplier?.companyName ||
                `Supplier #${agreement.supplierId}`}
            </CardTitle>
            <CardDescription>
              {agreement.annualVolume.toLocaleString()} tonnes/year •{" "}
              {agreement.termYears} years
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Badge className={getTierBadgeColor(agreement.tier)}>
              {agreement.tier.toUpperCase()}
            </Badge>
            <Badge className={getStatusBadgeColor(agreement.status)}>
              {agreement.status}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-600" />
            <div>
              <p className="text-gray-600">Term</p>
              <p className="font-medium">
                {new Date(agreement.startDate).toLocaleDateString()} -{" "}
                {new Date(agreement.endDate).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-gray-600" />
            <div>
              <p className="text-gray-600">Pricing</p>
              <p className="font-medium">
                {formatPricingMechanism(agreement.pricingMechanism)}
              </p>
            </div>
          </div>

          {agreement.takeOrPayPercent && (
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-gray-600" />
              <div>
                <p className="text-gray-600">Take-or-Pay</p>
                <p className="font-medium">{agreement.takeOrPayPercent}%</p>
              </div>
            </div>
          )}

          {agreement.deliverOrPayPercent && (
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-gray-600" />
              <div>
                <p className="text-gray-600">Deliver-or-Pay</p>
                <p className="font-medium">{agreement.deliverOrPayPercent}%</p>
              </div>
            </div>
          )}

          {agreement.bankGuaranteePercent && (
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-gray-600" />
              <div>
                <p className="text-gray-600">Bank Guarantee</p>
                <p className="font-medium">{agreement.bankGuaranteePercent}%</p>
              </div>
            </div>
          )}

          {agreement.lenderStepInRights && (
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-gray-600">Lender Rights</p>
                <p className="font-medium text-green-600">Step-in Enabled</p>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setLocation(`/dashboard/agreements/${agreement.id}`)}
          >
            <FileText className="h-4 w-4 mr-2" />
            View Details
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setLocation(`/dashboard/agreements/${agreement.id}/edit`)
            }
          >
            Edit
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="container py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#1B4332]">{project.name}</h1>
          <p className="text-gray-600 mt-1">
            Supply Agreement Portfolio Management
          </p>
        </div>
        <Button
          onClick={() =>
            setLocation(`/dashboard/projects/${projectId}/agreements/new`)
          }
        >
          <Plus className="h-4 w-4 mr-2" />
          New Agreement
        </Button>
      </div>

      {/* Supply Position Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Supply Position Overview</CardTitle>
          <CardDescription>
            Nameplate Capacity:{" "}
            {(project.nameplateCapacity || 0).toLocaleString()} tonnes/year
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">
                  Tier 1 Core (Target: {project.tier1Target || 80}%)
                </span>
                <span className="text-sm font-medium">
                  {tier1Percent.toFixed(1)}%
                </span>
              </div>
              <div className="h-3 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full ${tier1Percent >= (project.tier1Target || 80) ? "bg-green-500" : "bg-yellow-500"}`}
                  style={{ width: `${Math.min(tier1Percent, 100)}%` }}
                />
              </div>
              <p className="text-xs text-gray-600 mt-1">
                {tier1Volume.toLocaleString()} /{" "}
                {(
                  ((project.nameplateCapacity || 0) *
                    (project.tier1Target || 80)) /
                  100
                ).toLocaleString()}{" "}
                tonnes
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">
                  Tier 2 Support (Target: {project.tier2Target || 40}%)
                </span>
                <span className="text-sm font-medium">
                  {tier2Percent.toFixed(1)}%
                </span>
              </div>
              <div className="h-3 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full ${tier2Percent >= (project.tier2Target || 40) ? "bg-blue-500" : "bg-yellow-500"}`}
                  style={{ width: `${Math.min(tier2Percent, 100)}%` }}
                />
              </div>
              <p className="text-xs text-gray-600 mt-1">
                {tier2Volume.toLocaleString()} /{" "}
                {(
                  ((project.nameplateCapacity || 0) *
                    (project.tier2Target || 40)) /
                  100
                ).toLocaleString()}{" "}
                tonnes
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">
                  Call Options (Target: {project.optionsTarget || 15}%)
                </span>
                <span className="text-sm font-medium">
                  {optionPercent.toFixed(1)}%
                </span>
              </div>
              <div className="h-3 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full ${optionPercent >= (project.optionsTarget || 15) ? "bg-purple-500" : "bg-yellow-500"}`}
                  style={{ width: `${Math.min(optionPercent, 100)}%` }}
                />
              </div>
              <p className="text-xs text-gray-600 mt-1">
                {optionVolume.toLocaleString()} /{" "}
                {(
                  ((project.nameplateCapacity || 0) *
                    (project.optionsTarget || 15)) /
                  100
                ).toLocaleString()}{" "}
                tonnes
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">
                  ROFR (Target: {project.rofrTarget || 15}%)
                </span>
                <span className="text-sm font-medium">
                  {rofrPercent.toFixed(1)}%
                </span>
              </div>
              <div className="h-3 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full ${rofrPercent >= (project.rofrTarget || 15) ? "bg-orange-500" : "bg-yellow-500"}`}
                  style={{ width: `${Math.min(rofrPercent, 100)}%` }}
                />
              </div>
              <p className="text-xs text-gray-600 mt-1">
                {rofrVolume.toLocaleString()} /{" "}
                {(
                  ((project.nameplateCapacity || 0) *
                    (project.rofrTarget || 15)) /
                  100
                ).toLocaleString()}{" "}
                tonnes
              </p>
            </div>
          </div>

          <div className="pt-4 border-t">
            <div className="flex items-center justify-between">
              <span className="font-semibold">Total Supply Coverage</span>
              <span className="text-2xl font-bold text-[#1B4332]">
                {totalPercent.toFixed(1)}%
              </span>
            </div>
            {totalPercent < 150 && (
              <div className="flex items-center gap-2 mt-2 text-[#D4AF37]">
                <AlertCircle className="h-4 w-4" />
                <p className="text-sm">
                  {(150 - totalPercent).toFixed(1)}% below target (150% of
                  nameplate capacity)
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Agreements by Tier */}
      <Tabs defaultValue="tier1" className="space-y-4">
        <TabsList>
          <TabsTrigger value="tier1">
            Tier 1 Core ({tier1Agreements.length})
          </TabsTrigger>
          <TabsTrigger value="tier2">
            Tier 2 Support ({tier2Agreements.length})
          </TabsTrigger>
          <TabsTrigger value="options">
            Call Options ({optionAgreements.length})
          </TabsTrigger>
          <TabsTrigger value="rofr">ROFR ({rofrAgreements.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="tier1" className="space-y-4">
          {tier1Agreements.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-gray-600">
                <p>No Tier 1 agreements yet</p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() =>
                    setLocation(
                      `/dashboard/projects/${projectId}/agreements/new?tier=tier1`
                    )
                  }
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Tier 1 Agreement
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {tier1Agreements.map(agreement => (
                <AgreementCard key={agreement.id} agreement={agreement} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="tier2" className="space-y-4">
          {tier2Agreements.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-gray-600">
                <p>No Tier 2 agreements yet</p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() =>
                    setLocation(
                      `/dashboard/projects/${projectId}/agreements/new?tier=tier2`
                    )
                  }
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Tier 2 Agreement
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {tier2Agreements.map(agreement => (
                <AgreementCard key={agreement.id} agreement={agreement} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="options" className="space-y-4">
          {optionAgreements.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-gray-600">
                <p>No call option agreements yet</p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() =>
                    setLocation(
                      `/dashboard/projects/${projectId}/agreements/new?tier=option`
                    )
                  }
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Call Option
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {optionAgreements.map(agreement => (
                <AgreementCard key={agreement.id} agreement={agreement} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="rofr" className="space-y-4">
          {rofrAgreements.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-gray-600">
                <p>No ROFR agreements yet</p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() =>
                    setLocation(
                      `/dashboard/projects/${projectId}/agreements/new?tier=rofr`
                    )
                  }
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add ROFR Agreement
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {rofrAgreements.map(agreement => (
                <AgreementCard key={agreement.id} agreement={agreement} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
