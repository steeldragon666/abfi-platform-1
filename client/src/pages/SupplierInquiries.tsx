/**
 * Supplier Inquiries - Nextgen Design
 *
 * Features:
 * - Header with icon container pattern
 * - Card-based list layout
 * - Typography components for consistent styling
 */

import { useAuth } from "@/_core/hooks/useAuth";
import { H1, Body } from "@/components/Typography";
import { Button } from "@/components/ui/Button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { Inbox, MessageSquare, Calendar, Package, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { formatDate } from "@/const";

export default function SupplierInquiries() {
  const { user, loading: authLoading } = useAuth();

  // Get supplier profile from context (supplier procedure will provide it)
  const { data: inquiries, isLoading } =
    trpc.inquiries.listForSupplier.useQuery(undefined, { enabled: !!user });

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Skeleton className="h-8 w-64 mx-auto mb-4" />
          <Skeleton className="h-4 w-48 mx-auto" />
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-yellow-100 text-yellow-800";
      case "responded":
        return "bg-blue-100 text-blue-800";
      case "closed":
        return "bg-gray-100 text-gray-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#D4AF37]/10">
              <Inbox className="h-6 w-6 text-[#D4AF37]" />
            </div>
            <div>
              <H1 className="text-2xl">Received Inquiries</H1>
              <Body className="text-gray-600">Manage inquiries from buyers interested in your feedstocks</Body>
            </div>
          </div>
          <Link href="/dashboard">
            <Button variant="ghost">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : inquiries && inquiries.length > 0 ? (
          <div className="space-y-4">
            {inquiries.map((inquiry: any) => (
              <Card
                key={inquiry.id}
                className="hover:shadow-md transition-shadow"
              >
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2">
                        <MessageSquare className="h-5 w-5" />
                        {inquiry.subject}
                      </CardTitle>
                      <CardDescription className="mt-2">
                        From: {inquiry.buyerName || "Anonymous Buyer"} •{" "}
                        {formatDate(inquiry.createdAt)}
                      </CardDescription>
                    </div>
                    <Badge className={getStatusColor(inquiry.status)}>
                      {inquiry.status.toUpperCase()}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-gray-600" />
                      <div>
                        <div className="text-gray-600">Feedstock</div>
                        <div className="font-medium">
                          {inquiry.feedstockId
                            ? `ABFI-${inquiry.feedstockId}`
                            : "General"}
                        </div>
                      </div>
                    </div>
                    {inquiry.volumeRequired && (
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-gray-600" />
                        <div>
                          <div className="text-gray-600">
                            Volume Needed
                          </div>
                          <div className="font-medium">
                            {inquiry.volumeRequired.toLocaleString()} tonnes
                          </div>
                        </div>
                      </div>
                    )}
                    {inquiry.deliveryLocation && (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-600" />
                        <div>
                          <div className="text-gray-600">
                            Delivery To
                          </div>
                          <div className="font-medium">
                            {inquiry.deliveryLocation}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {inquiry.message && (
                    <div className="bg-muted p-4 rounded-lg">
                      <div className="text-sm font-medium mb-1">Message:</div>
                      <p className="text-sm text-gray-600">
                        {inquiry.message}
                      </p>
                    </div>
                  )}

                  {inquiry.responseMessage && (
                    <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                      <div className="text-sm font-medium mb-1 text-green-900">
                        Your Response:
                      </div>
                      <p className="text-sm text-green-800">
                        {inquiry.responseMessage}
                      </p>
                      {inquiry.respondedAt && (
                        <div className="text-xs text-green-600 mt-2">
                          Responded on {formatDate(inquiry.respondedAt)}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex gap-2">
                    {inquiry.status === "open" && (
                      <Link href={`/inquiries/respond/${inquiry.id}`}>
                        <Button size="sm">Respond to Inquiry</Button>
                      </Link>
                    )}
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                    {inquiry.buyerEmail && (
                      <Button variant="ghost" size="sm" asChild>
                        <a href={`mailto:${inquiry.buyerEmail}`}>
                          Contact Buyer
                        </a>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <Inbox className="h-12 w-12 text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No inquiries yet</h3>
              <p className="text-gray-600 mb-4">
                When buyers send inquiries about your feedstocks, they'll appear
                here
              </p>
              <Link href="/feedstock/create">
                <Button>List Your First Feedstock</Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
