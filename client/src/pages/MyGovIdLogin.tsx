/**
 * MyGovID Login - Nextgen Design
 *
 * Features:
 * - Australian Government myGovID integration
 * - OIDC authentication flow
 * - Mock login for development environment
 * - Typography components for consistent styling
 */

import { useState, useEffect } from "react";
import { H1, H2, H3, H4, Body, MetricValue, DataLabel } from "@/components/Typography";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Shield,
  Building2,
  Lock,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Fingerprint,
  Loader2,
  ChevronRight,
} from "lucide-react";

interface MyGovIdStatus {
  configured: boolean;
  issuer: string;
  environment: string;
  message: string;
}

export default function MyGovIdLogin() {
  const [, setLocation] = useLocation();
  const [status, setStatus] = useState<MyGovIdStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [loginLoading, setLoginLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mock login state (for development)
  const [mockName, setMockName] = useState("Government Test User");
  const [mockEmail, setMockEmail] = useState("test.user@gov.au");

  useEffect(() => {
    // Check for error in URL params
    const params = new URLSearchParams(window.location.search);
    const urlError = params.get("error");
    if (urlError) {
      setError(decodeURIComponent(urlError));
    }

    // Fetch myGovID status
    fetch("/api/mygovid/status")
      .then(res => res.json())
      .then(data => {
        setStatus(data);
        setLoading(false);
      })
      .catch(() => {
        setStatus({
          configured: false,
          issuer: "",
          environment: "unknown",
          message: "Could not connect to authentication service",
        });
        setLoading(false);
      });
  }, []);

  const handleMyGovIdLogin = () => {
    setLoginLoading(true);
    // Redirect to myGovID authorization endpoint
    window.location.href = `/api/mygovid/authorize?returnUrl=${encodeURIComponent(window.location.pathname)}`;
  };

  const handleMockLogin = async () => {
    setLoginLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/mygovid/mock-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: mockName,
          email: mockEmail,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setLocation("/compliance-dashboard");
      } else {
        setError(data.error || "Mock login failed");
      }
    } catch {
      setError("Failed to connect to authentication service");
    } finally {
      setLoginLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-lg space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4">
            <Building2 className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Government Portal Access</h1>
          <p className="text-slate-600">
            Sign in with your myGovID to access government compliance features
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Main Login Card */}
        <Card className="border-2">
          <CardHeader className="text-center pb-2">
            <div className="flex items-center justify-center gap-2 mb-2">
              <img
                src="https://www.mygovid.gov.au/themes/custom/mygovid/logo.svg"
                alt="myGovID"
                className="h-8"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
              <CardTitle className="text-xl">myGovID</CardTitle>
            </div>
            <CardDescription>
              Australian Government Digital Identity
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Security Features */}
            <div className="bg-blue-50 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm text-blue-800">
                <Shield className="h-4 w-4" />
                <span className="font-medium">Secure Government Authentication</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-blue-700">
                <div className="flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  <span>IRAP Assessed</span>
                </div>
                <div className="flex items-center gap-1">
                  <Lock className="h-3 w-3" />
                  <span>PKCE Security</span>
                </div>
                <div className="flex items-center gap-1">
                  <Fingerprint className="h-3 w-3" />
                  <span>Biometric Verification</span>
                </div>
                <div className="flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  <span>OpenID Connect</span>
                </div>
              </div>
            </div>

            {/* Login Button */}
            <Button
              onClick={handleMyGovIdLogin}
              disabled={loginLoading || !status?.configured}
              className="w-full h-12 bg-[#00698f] hover:bg-[#005a7a] text-white"
            >
              {loginLoading ? (
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
              ) : (
                <ExternalLink className="h-5 w-5 mr-2" />
              )}
              Sign in with myGovID
              <ChevronRight className="h-5 w-5 ml-2" />
            </Button>

            {/* Status Badge */}
            <div className="flex items-center justify-center">
              <Badge
                variant={status?.configured ? "default" : "secondary"}
                className={status?.configured ? "bg-green-100 text-green-800" : ""}
              >
                {status?.configured ? "Production Ready" : "Configuration Required"}
              </Badge>
              <span className="text-xs text-slate-500 ml-2">
                {status?.environment === "production" ? "Production" : "Development"}
              </span>
            </div>

            {!status?.configured && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  {status?.message}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Development Mock Login */}
        {status?.environment !== "production" && (
          <Card className="border-dashed border-2 border-amber-300 bg-amber-50/50">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300">
                  Development Only
                </Badge>
              </div>
              <CardTitle className="text-lg">Mock Login</CardTitle>
              <CardDescription>
                Test government portal features without real myGovID credentials
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="grid gap-3">
                <div className="space-y-1">
                  <Label htmlFor="mockName">Display Name</Label>
                  <Input
                    id="mockName"
                    value={mockName}
                    onChange={(e) => setMockName(e.target.value)}
                    placeholder="Government Test User"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="mockEmail">Email</Label>
                  <Input
                    id="mockEmail"
                    type="email"
                    value={mockEmail}
                    onChange={(e) => setMockEmail(e.target.value)}
                    placeholder="test.user@gov.au"
                  />
                </div>
              </div>

              <Button
                onClick={handleMockLogin}
                disabled={loginLoading}
                variant="outline"
                className="w-full border-amber-300 hover:bg-amber-100"
              >
                {loginLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Shield className="h-4 w-4 mr-2" />
                )}
                Mock myGovID Login
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Information Links */}
        <div className="text-center space-y-2">
          <Separator />
          <div className="flex items-center justify-center gap-4 text-sm text-slate-600">
            <a
              href="https://www.mygovid.gov.au/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-blue-600 flex items-center gap-1"
            >
              About myGovID
              <ExternalLink className="h-3 w-3" />
            </a>
            <span>|</span>
            <a
              href="https://www.mygovid.gov.au/set-up-mygovid"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-blue-600 flex items-center gap-1"
            >
              Set up myGovID
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
          <p className="text-xs text-slate-500">
            myGovID is the Australian Government's digital identity solution,
            allowing secure access to government services online.
          </p>
        </div>

        {/* Back to Dev Login */}
        <div className="text-center">
          <Button
            variant="ghost"
            onClick={() => setLocation("/login")}
            className="text-slate-600"
          >
            Back to Developer Login
          </Button>
        </div>
      </div>
    </div>
  );
}
