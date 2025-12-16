import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Leaf, MessageSquare } from "lucide-react";
import { useState } from "react";
import { Link, Redirect, useLocation, useSearch } from "wouter";
import { toast } from "sonner";

export default function SendInquiry() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const searchParams = new URLSearchParams(useSearch());
  const feedstockId = searchParams.get("feedstockId");

  // Check if user is a buyer
  const { data: profile } = trpc.auth.getProfile.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  // Get feedstock details if ID provided
  const { data: feedstock } = trpc.feedstocks.getById.useQuery(
    { id: parseInt(feedstockId || "0") },
    { enabled: !!feedstockId }
  );

  // Form state
  const [volumeRequired, setVolumeRequired] = useState("");
  const [deliveryLocation, setDeliveryLocation] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const sendInquiryMutation = trpc.inquiries.create.useMutation({
    onSuccess: () => {
      toast.success("Inquiry sent successfully!");
      setLocation("/dashboard");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to send inquiry");
    },
  });

  const handleSubmit = () => {
    if (!profile?.buyer) {
      toast.error("Buyer profile required");
      return;
    }

    if (!feedstock) {
      toast.error("Feedstock not found");
      return;
    }

    sendInquiryMutation.mutate({
      supplierId: feedstock.supplierId,
      feedstockId: feedstock.id,
      subject: subject || `Inquiry for ${feedstock.type}`,
      message,
      volumeRequired: parseInt(volumeRequired),
      deliveryLocation,
    });
  };

  const canSubmit =
    volumeRequired &&
    deliveryLocation &&
    message &&
    parseInt(volumeRequired) > 0;

  if (!isAuthenticated) {
    return <Redirect to="/dashboard" />;
  }

  if (!profile?.buyer) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Buyer Profile Required</CardTitle>
            <CardDescription>
              You need to register as a buyer before sending inquiries
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/buyer/register">
              <Button className="w-full">Register as Buyer</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!feedstock) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Feedstock Not Found</CardTitle>
            <CardDescription>
              The feedstock you're trying to inquire about could not be found
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/browse">
              <Button className="w-full">Browse Feedstocks</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/">
            <div className="flex items-center gap-2 cursor-pointer">
              <Leaf className="h-8 w-8 text-primary" />
              <span className="text-2xl font-bold text-primary">ABFI</span>
            </div>
          </Link>
          <Link href="/browse">
            <Button variant="ghost">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Browse
            </Button>
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <MessageSquare className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold text-primary">
              Send Inquiry (RFQ)
            </h1>
          </div>
          <p className="text-gray-600">Request a quote for this feedstock</p>
        </div>

        {/* Feedstock Summary */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Feedstock Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-600">Type</p>
                <p className="font-medium">{feedstock.type}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Category</p>
                <p className="font-medium capitalize">{feedstock.category}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Location</p>
                <p className="font-medium">{feedstock.state}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Annual Capacity</p>
                <p className="font-medium">
                  {feedstock.annualCapacityTonnes.toLocaleString()} tonnes
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Available Now</p>
                <p className="font-medium">
                  {feedstock.availableVolumeCurrent.toLocaleString()} tonnes
                </p>
              </div>
              {feedstock.pricePerTonne && (
                <div>
                  <p className="text-sm text-gray-600">Price</p>
                  <p className="font-medium">
                    ${feedstock.pricePerTonne.toLocaleString()}/tonne
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Inquiry Form */}
        <Card>
          <CardHeader>
            <CardTitle>Your Requirements</CardTitle>
            <CardDescription>
              Provide details about your feedstock requirements. The supplier
              will receive your inquiry and respond directly.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="volumeRequired">
                  Volume Required (tonnes) *
                </Label>
                <Input
                  id="volumeRequired"
                  type="number"
                  placeholder="e.g., 500"
                  value={volumeRequired}
                  onChange={e => setVolumeRequired(e.target.value)}
                />
                <p className="text-sm text-gray-500 mt-1">
                  Available: {feedstock.availableVolumeCurrent.toLocaleString()}{" "}
                  tonnes
                </p>
              </div>

              <div>
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  placeholder="e.g., Request for Quote - Bamboo Feedstock"
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="deliveryLocation">Delivery Location *</Label>
              <Input
                id="deliveryLocation"
                placeholder="e.g., Sydney Port, Brisbane Refinery"
                value={deliveryLocation}
                onChange={e => setDeliveryLocation(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="message">Message *</Label>
              <Textarea
                id="message"
                placeholder="Describe your requirements, quality parameters, delivery timeframe, and any questions for the supplier..."
                value={message}
                onChange={e => setMessage(e.target.value)}
                rows={6}
              />
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">
                What Happens Next?
              </h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Your inquiry will be sent directly to the supplier</li>
                <li>• The supplier will review your requirements</li>
                <li>• You'll receive a response via the platform</li>
                <li>• You can track all inquiries from your dashboard</li>
              </ul>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Link href="/browse">
                <Button variant="outline">Cancel</Button>
              </Link>
              <Button
                onClick={handleSubmit}
                disabled={!canSubmit || sendInquiryMutation.isPending}
              >
                {sendInquiryMutation.isPending ? "Sending..." : "Send Inquiry"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
